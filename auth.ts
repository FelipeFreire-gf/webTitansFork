import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/server/prisma";
import { loginSchema } from "@/lib/login-schema";

/** Lançado quando o membro existe e a senha bate, mas o status dele é INATIVO. */
export class ContaInativaError extends CredentialsSignin {
  code = "conta-inativa";
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  // O Credentials provider só funciona com sessão em JWT — Auth.js rejeita
  // (UnsupportedStrategy) combiná-lo com sessão em banco. O PrismaAdapter
  // fica mantido mesmo assim: não faz nada com Credentials hoje, mas já
  // deixa Account/Session prontos pro dia que entrar login social (Google etc).
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      authorize: async (credentials) => {
        const parsed = loginSchema
          .pick({ email: true, password: true })
          .safeParse(credentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        });
        if (!user) return null;

        const senhaValida = await bcrypt.compare(parsed.data.password, user.password);
        if (!senhaValida) return null;

        if (user.status === "INATIVO") throw new ContaInativaError();

        return {
          id: user.id,
          email: user.email,
          name: user.nome,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      return session;
    },
  },
});
