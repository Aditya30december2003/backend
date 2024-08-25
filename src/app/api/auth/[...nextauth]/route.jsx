import prisma from '@/app/libs/prismaDB'
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import NextAuth from "next-auth/next";
import bcrypt from 'bcryptjs';

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        name:{label:"Name" , type:"text" , placeholder:"Name"},
        email:{ label: "Email", type: "text", placeholder: "Email" },
        username: { label: "Username", type: "text", placeholder: "Username" },
        password: { label: "Password", type: "password", placeholder: "Password" },
      },
      async authorize(credentials) {
        if (!credentials.email || !credentials.password) {
          throw new Error('Please enter an email and password');
        }

        // Check if user exists by username
        const user = await prisma.user.findUnique({
          where: {
              email: credentials.email ,
          },
        });

        // If no user is found
        if (!user) {
          throw new Error('No user found');
        }

        // Check if password matches
        const passwordMatch = await bcrypt.compare(credentials.password, user.password);

        // If password does not match
        if (!passwordMatch) {
          throw new Error('Incorrect password');
        }

        return user;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.email = token.email;
      return session;
    },
  },
  secret: process.env.SECRET,
  session: {
    strategy: "jwt",
  },
  debug: process.env.NODE_ENV === "development",
  debug:true,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
