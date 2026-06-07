// app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { rawEnv } from "../../../lib/env";
import { scwFactory } from "../../../lib/viemClient";

/*//////////////////////////////////////////////////////////////
                       AUTH OPTIONS
//////////////////////////////////////////////////////////////*/

/// Exported separately so other parts of the app can call
/// getServerSession(authOptions) in API routes and server components.
export const authOptions: NextAuthOptions = {
  // ── Providers ──────────────────────────────────────────────────────
  // Google OAuth 2.0 provider.
  // clientId and clientSecret come from Google Cloud Console.
  // Scopes requested:
  //   openid  → enables id_token which contains profile.sub
  //   email   → user's email address
  //   profile → user's name and profile picture
  providers: [
    GoogleProvider({
      clientId: rawEnv("GOOGLE_CLIENT_ID"),
      clientSecret: rawEnv("GOOGLE_CLIENT_SECRET"),
      authorization: {
        params: { scope: "openid email profile" },
      },
    }),
  ],

  // ── Session strategy ───────────────────────────────────────────────
  // "jwt" stores the session entirely in an encrypted httpOnly cookie.
  // No database required — the cookie IS the session.
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours in seconds
  },

  // ── Callbacks ──────────────────────────────────────────────────────
  callbacks: {
    // ── jwt() ──────────────────────────────────────────────────────
    // Runs: on initial login AND on every session request.
    // Input:  token   → current decrypted cookie data
    //         profile → Google's user data (ONLY defined on first login)
    // Output: token encrypted and stored in cookie
    //
    // Rule: jwt() always runs before session().
    async jwt({ token, profile }) {
      // ── First login ──────────────────────────────────────────────
      // profile is defined only when Google just authenticated the user.
      // On subsequent requests profile is undefined — the token already
      // contains everything stored from the first login.
      if (profile) {
        token.subId = profile.sub as string;

        const scwAddress = await scwFactory.predictScwAddress(
          profile.sub as string,
        );
        token.scwAddress = scwAddress;
      }

      return token;
      // token is encrypted with NEXTAUTH_SECRET and stored in httpOnly cookie
    },

    // ── session() ──────────────────────────────────────────────────
    // Runs: every time getServerSession() or useSession() is called.
    // Input:  session → default shape (name, email, image, expires)
    //         token   → decrypted cookie data returned by jwt() above
    // Output: the session object your code receives
    async session({ session, token }) {
      if (session.user) {
        // Map custom token fields onto the session object.
        // Without this, session.user only has name, email, image.
        session.user.subId = token.subId;
        session.user.scwAddress = token.scwAddress;
      }
      return session;
    },
  },

  // ── Secret ─────────────────────────────────────────────────────────
  // Encryption key for session cookies and CSRF tokens.
  // Required in production — NextAuth throws without it.
  // Generate with: openssl rand -base64 32
  secret: process.env.NEXTAUTH_SECRET,
};

/*//////////////////////////////////////////////////////////////
                         HANDLER
//////////////////////////////////////////////////////////////*/

/// NextAuth(authOptions) returns a single request handler that
/// internally routes all /api/auth/* paths:
///
///   GET  /api/auth/session          → read current session
///   GET  /api/auth/callback/google  → OAuth callback (Google redirects here)
///   GET  /api/auth/signin           → sign-in page
///   GET  /api/auth/providers        → list configured providers
///   GET  /api/auth/csrf             → CSRF token
///   POST /api/auth/signin/google    → initiate Google OAuth flow
///   POST /api/auth/signout          → clear session cookie and sign out
///
/// Both GET and POST are exported because NextAuth needs both:
///   GET  → session reads, OAuth callbacks, provider pages
///   POST → sign-in initiation, sign-out, CSRF verification
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
