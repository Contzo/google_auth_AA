// types/next-auth.d.ts

import type { DefaultSession, DefaultJWT } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      subId?: string;
      scwAddress?: string | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    subId?: string;
    scwAddress?: string | null;
  }
}
