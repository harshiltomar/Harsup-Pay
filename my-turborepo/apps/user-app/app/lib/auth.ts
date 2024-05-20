import db from "@repo/db/client";
import CredentialsProvider from "next-auth/providers/credentials";
import { NextAuthOptions, Session } from "next-auth";
import bcrypt from "bcrypt";
import { z } from "zod";
import { JWT } from "next-auth/jwt";

const credentialsSchema = z.object({
  phone: z.string().length(10).regex(/^\d+$/, "Invalid Phone Number Format"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        phone: {
          label: "Phone number",
          type: "text",
          placeholder: "9100000000",
          required: true,
        },
        password: { label: "Password", type: "password", required: true },
      },
      // TODO: User credentials type from next-auth: DONE
      async authorize(credentials: any) {
        // Do zod validation, OTP validation here
        const parsedCredentials = credentialsSchema.safeParse(credentials);

        if (!parsedCredentials) {
          console.error("Validation Errors: ", parsedCredentials);
        }

        const hashedPassword = await bcrypt.hash(credentials.password, 10);
        const existingUser = await db.user.findFirst({
          where: {
            number: credentials.phone,
          },
        });

        if (existingUser) {
          const passwordValidation = await bcrypt.compare(
            credentials.password,
            existingUser.password
          );
          if (passwordValidation) {
            return {
              id: existingUser.id.toString(),
              name: existingUser.name,
              email: existingUser.number,
            };
          }
          return null;
        }

        try {
          const user = await db.user.create({
            data: {
              number: credentials.phone,
              password: hashedPassword,
            },
          });

          return {
            id: user.id.toString(),
            name: user.name,
            email: user.number,
          };
        } catch (e) {
          console.error(e);
        }

        return null;
      },
    }),
  ],
  secret: process.env.JWT_SECRET || "secret",
  callbacks: {
    // TODO: can u fix the type here? Using any is bad: DONE
    async session({ token, session }: { token: JWT; session: Session }) {
      if (session?.user) {
        //@ts-ignore
        session.user.id = token.sub || "";
      }

      return session;
    },
  },
};
