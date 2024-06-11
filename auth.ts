import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import credentials from "next-auth/providers/credentials";
import { z } from "zod";
import type { User } from "./app/lib/definitions";
import bcrypt from 'bcrypt';

async function getUser(email: string): Promise<User | undefined> {
    try {
        const request = await fetch(`http://localhost:8091/users/email/${email}`);
        const data = await request.json();

        const user: User = {
            id: data.id,
            name: data.name,
            email: data.email,
            password: data.password,
        };

        return user;
    } catch (error) {
        console.error('Failed to fetch user:', error);
        throw new Error('Failed to fetch user.');
    }
}

export const { auth, signIn, signOut } = NextAuth({
    ...authConfig,
    providers: [
        credentials({
            async authorize(credentials) {
                const parsedCredentials = z
                    .object({ email: z.string().email(), password: z.string().min(6) })
                    .safeParse(credentials);

                if (parsedCredentials.success) {
                    const { email, password } = parsedCredentials.data;
                    const user = await getUser(email);
                    
                    if (!user) return null;
                    
                    const passwordMatch = await bcrypt.compare(password, user.password);
                    
                    if (passwordMatch) return user;
                }
                
                console.log('Invalid credentials');
                return null;
            },
        }),
    ],
});