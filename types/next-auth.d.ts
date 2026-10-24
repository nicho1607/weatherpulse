import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  /**
   * Extend the session user with the database id so it is strongly typed
   * wherever `session.user.id` is accessed.
   */
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}
