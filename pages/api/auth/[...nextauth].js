import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
// You can also add more providers like GitHub, Google if needed

export default NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      authorize: async (credentials) => {
        // Implement your login logic here, like checking from database
        const user = await findUser(credentials.email, credentials.password); // Example function

        if (user) {
          return { id: user.id, email: user.email, name: user.username }; // Return user object
        }
        return null; // Return null if authentication fails
      },
    }),
  ],
  session: {
    strategy: 'jwt', // Use JWT for session
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET, // Ensure you add this to your environment variables
});
