import NextAuth from "next-auth";
import GithubProvider from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";

import { dbUsers } from "../../../database";

export default NextAuth({
  // Configure one or more authentication providers
  providers: [
    // ...add more providers here

    Credentials({
      name: "Custom Login",
      credentials: {
        email: {
          label: "Correo:",
          type: "email",
          placeholder: "correo@google.com",
        },
        password: {
          label: "Contraseña:",
          type: "password",
          placeholder: "Contraseña",
        },
      },
      async authorize(credentials) {
        console.log({ credentials });
        // TODO: validar contra base de datos
        // return { name: "Juan", correo: "juan@gooogle.com", role: "admin" };

        return await dbUsers.checkUserEmailPassword(
          credentials!.email,
          credentials!.password
        );
      },
    }),

    GithubProvider({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
  ],

  // Custom Pages
  pages: {
    signIn: "/auth/login",
    newUser: "/auth/register",
  },

  // Callbacks
  jwt: {
    // secret: proccess.env.JWT_SECRET_SEED, // deprecated
  },

  session: {
    maxAge: 2592000, // 30 dias
    strategy: "jwt",
    updateAge: 86400, // cada día
  },

  callbacks: {
    async jwt({ token, account, user }) {
      // console.log({ token, account, user });

      if (account) {
        token.accessToken = account.access_token;

        switch (account.type) {
          case "oauth":
            // TODO: crear usuario o verificar si existe en mi DB
            token.user = await dbUsers.oAuthToDbUser(
              user?.email || "",
              user?.name || ""
            );
            break;

          case "credentials":
            token.user = user;
            break;
        }
      }

      return token;
    },

    async session({ session, token, user }) {
      // console.log({ session, token, user });

      session.accessToken = token.accessToken;
      session.user = token.user as any;

      return session;
    },
  },
});
