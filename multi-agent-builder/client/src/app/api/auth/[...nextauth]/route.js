import _NextAuth          from "next-auth";
import _GoogleProvider    from "next-auth/providers/google";
import _CredentialsProvider from "next-auth/providers/credentials";

export const dynamic = "force-dynamic";

// next-auth v4 is CJS. In a project with "type":"module", webpack's RSC compiler
// may hand us { default: fn } instead of fn directly — normalise either shape.
const NextAuth          = _NextAuth.default          ?? _NextAuth;
const GoogleProvider    = _GoogleProvider.default    ?? _GoogleProvider;
const CredentialsProvider = _CredentialsProvider.default ?? _CredentialsProvider;

const BACKEND = process.env.BACKEND_URL || "http://localhost:4000";

const authOptions = {
  trustHost: true,
  providers: [
    GoogleProvider({
      clientId:     process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    CredentialsProvider({
      id:   "credentials",
      name: "Email",
      credentials: {
        email:    { label: "Email",    type: "email"    },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        try {
          const res = await fetch(`${BACKEND}/api/users/verify`, {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ email: credentials.email, password: credentials.password }),
          });
          if (!res.ok) return null;
          const { user } = await res.json();
          return user ? { id: user.id, email: user.email, name: user.name } : null;
        } catch {
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id    = user.id;
        token.email = user.email;
        token.name  = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.id)    session.user.id    = token.id;
      if (token?.email) session.user.email = token.email;
      if (token?.name)  session.user.name  = token.name;
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
