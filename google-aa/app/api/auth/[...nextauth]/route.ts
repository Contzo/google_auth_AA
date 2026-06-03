import NextAuth, { NextAuthOptions, DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      subId?: string;
      scwAddress?: string | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    subId?: string;
    scwAddress?: string | null;
  }
}
import GoogleProvider from "next-auth/providers/google";
import {
  keccak256,
  concat,
  toBytes,
  getContract,
  createPublicClient,
  http,
} from "viem";
import { sepolia } from "viem/chains";
import { ScwFactoryAbi } from "../../../lib/abi/ScwFactory";

// Helper function to extaract env variables safely
function getEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing env variable: ${key}`);
  }
  return value;
}

// Helper function to create credentialHash from google subId
// This is the same hash to create the SCW address using CREATE2 in the SCW Factory contract
function computeCredentialHash(googleSubId: string): `0x${string}` {
  const secret = getEnv("SERVER_SECRET");
  const googleSubIdBytes = toBytes(googleSubId);
  const secretBytes = toBytes(secret);

  // concatenate the two bytes arrays
  const concatenatedBytes = concat([googleSubIdBytes, secretBytes]);

  return keccak256(concatenatedBytes);
}

async function getScwAddressFromChain(
  googleSubId: string,
): Promise<`0x${string}` | null> {
  const credentialHash = computeCredentialHash(googleSubId);
  const scwFactoryAddress = getEnv("SCW_FACTORY_ADDRESS");

  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(getEnv("http://127.0.0.1:8545")),
  });

  const scwFactory = getContract({
    address: scwFactoryAddress as `0x${string}`,
    abi: ScwFactoryAbi,
    client: publicClient,
  });

  const scwAddress = await scwFactory.read.getScwAddress([credentialHash]);

  if (scwAddress === "0x0000000000000000000000000000000000000000") {
    return null;
  }
  return scwAddress;
}

export const authOptions: NextAuthOptions = {
  // providers
  providers: [
    GoogleProvider({
      clientId: getEnv("GOOGLE_CLIENT_ID"),
      clientSecret: getEnv("GOOGLE_CLIENT_SECRET"),
      // Reqeusted scopes from Google
      // openId -> enables id_token (for the credentioaHash)
      // email -> user's email
      // profile -> user's profile (name, picture, etc.)
      authorization: {
        params: { scope: "openid email profile" },
      },
    }),
  ],

  // ── Session strategy ─────────────────────
  // jwt - means that the sesstion token is stored entirely in an ecrypted cookie, no DB needed
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },

  // ── Callbacks ────────────────────────────
  // allows us to hook into the NextAuth's flow and costumize what gets called and returned
  callbacks: {
    // ── jwt() ────────────────────────────────
    // Runs: when the JWT is created (initial login) or the session is requested
    // Inputs: token(current cookie data), profile(Google data, only available on the first login)
    // Output: the token that gets encrypted and stored in the cookie
    async jwt({ token, profile }) {
      // Profile is only available on the first login.
      // On subsequent request the profile is undefined, the token has already the needed data from the first login
      if (profile) {
        // store the subId in the token
        token.subId = profile.sub;
        // check if the user already has a SCW address, if not store null
        const scwAddress = await getScwAddressFromChain(profile.sub as string);
        token.scwAddress = scwAddress;
      }

      // if this callback is called on subsequent requests, the profile is undefined, but we need to check if the
      // user creadted a SCW address from the last request
      // if the user is logged in but had no SCW on the last request check agian if the user got a SCW meanwile
      if (token.subId && !token.scwAddress) {
        // get the scw address from the chain or null if the user doesn't have a scw
        const scwAddress = await getScwAddressFromChain(token.subId as string);
        token.scwAddress = scwAddress;
      }
      return token; // token is encrypted with NEXTAUTH_SECRET and stored in a cookie
    },
    // ── session() ────────────────────────────────
    // Runs: every time the getServerSession() and useSession() functions are called
    // Inputs: session(default shape), token (decryuped updated cookie data)
    // Output: The session object as defined in the code
    //getServerSession() or useSession() is called
    // ↓
    // 1. jwt() runs FIRST
    //    → reads the encrypted cookie
    //    → decrypts the token
    //    → runs your jwt() logic (the double check etc.)
    //    → returns the updated token
    //
    // 2. session() runs SECOND
    //    → receives the token from jwt()
    //    → maps token fields onto the session object
    //    → returns the session
    async session({ session, token }) {
      if (session.user) {
        session.user.subId = token.subId;
        session.user.scwAddress = token.scwAddress;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
