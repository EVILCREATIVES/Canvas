import NextAuth from 'next-auth';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import Credentials from 'next-auth/providers/credentials';
import { db } from '@/lib/db';
import {
  users,
  accounts,
  sessions,
  verificationTokens,
} from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { authConfig } from './auth.config';

// Built-in admin credentials.
const ADMIN_USERNAME = 'ECADMIN';
const ADMIN_PASSWORD = 'ECADMIN';
const ADMIN_EMAIL = 'ecadmin';

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  trustHost: true,
  secret:
    process.env.NEXTAUTH_SECRET ||
    process.env.AUTH_SECRET ||
    'kyJvU0fP/vhHMf2ophLgtaL5l7Q4tB1Jpnk9+Apb6Cw=',
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: { strategy: 'jwt' },
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const identifier = (credentials?.email as string)?.trim();
        const password = credentials?.password as string;
        if (!identifier) return null;

        // Built-in admin account: username ECADMIN / password ECADMIN.
        // Ensures a real admin user row exists (FKs reference users.id).
        if (identifier === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
          let [admin] = await db
            .select()
            .from(users)
            .where(eq(users.email, ADMIN_EMAIL))
            .limit(1);
          if (!admin) {
            [admin] = await db
              .insert(users)
              .values({ name: 'EC Admin', email: ADMIN_EMAIL, role: 'admin' })
              .returning();
          } else if (admin.role !== 'admin') {
            [admin] = await db
              .update(users)
              .set({ role: 'admin' })
              .where(eq(users.id, admin.id))
              .returning();
          }
          return {
            id: admin.id,
            email: admin.email,
            name: admin.name,
            image: admin.image,
            role: admin.role,
          };
        }

        // For prototype, allow any login - in production add bcrypt password check
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, identifier))
          .limit(1);
        if (!user) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as { role?: string }).role = token.role as string;
      }
      return session;
    },
  },
});
