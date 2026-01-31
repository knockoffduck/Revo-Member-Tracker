import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/app/db/database"; // your drizzle instance
import { nextCookies } from "better-auth/next-js";
import { account, session, user, verification } from "@/app/db/schema";

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "mysql",
		schema: {
			user,
			session,
			account,
			verification,
		},
		// or "mysql", "sqlite"
	}),
	emailAndPassword: {
		enabled: true,
		changeEmail: {
			enabled: true,
		}
	},
	user: {
		changeEmail: {
			enabled: true,
			updateEmailWithoutVerification: true
		},
		deleteUser: {
			enabled: true,
		},
	},
	plugins: [nextCookies()],
});
