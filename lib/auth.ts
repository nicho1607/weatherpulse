import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";

import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [GitHub],
  session: { strategy: "database" },
  trustHost: true,
  callbacks: {
    session({ session, user }) {
      // With the database session strategy `user` comes from the DB; expose
      // its id on the session so Server Actions can scope queries per user.
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
});
