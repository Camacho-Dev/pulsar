import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  matcher: ["/lobby", "/lobby/:path*", "/pulse/:path*", "/pilot/:path*"],
};
