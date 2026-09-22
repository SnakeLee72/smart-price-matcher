import type { NextAuthOptions } from 'next-auth';
import type { Provider } from 'next-auth/providers/index';
import GoogleProvider from 'next-auth/providers/google';
import AzureADProvider from 'next-auth/providers/azure-ad';

const providers: Provider[] = [];
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(GoogleProvider({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET
  }));
}
if (process.env.MICROSOFT_ENTRA_ID_CLIENT_ID && process.env.MICROSOFT_ENTRA_ID_CLIENT_SECRET && process.env.MICROSOFT_ENTRA_ID_TENANT_ID) {
  providers.push(AzureADProvider({
    clientId: process.env.MICROSOFT_ENTRA_ID_CLIENT_ID,
    clientSecret: process.env.MICROSOFT_ENTRA_ID_CLIENT_SECRET,
    tenantId: process.env.MICROSOFT_ENTRA_ID_TENANT_ID
  }));
}

export const authOptions: NextAuthOptions = {
  providers,
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, account }) {
      if (account) token.sub = `${account.provider}:${account.providerAccountId}`;
      return token;
    }
  }
};
