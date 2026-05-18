import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isLobby = nextUrl.pathname.startsWith("/lobby");
      const isPulse = nextUrl.pathname.startsWith("/pulse");
      const isPilot = nextUrl.pathname.startsWith("/pilot");
      const protectedRoute = isLobby || isPulse || isPilot;
      if (!protectedRoute) return true;
      if (!isLoggedIn) return false;

      const role = (auth?.user as { role?: string })?.role;
      if ((isLobby || isPulse) && role === "PILOT") {
        return Response.redirect(new URL("/pilot", nextUrl));
      }
      if (isPilot && role === "MOVER") {
        return Response.redirect(new URL("/lobby", nextUrl));
      }
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  session: { strategy: "jwt" },
};
