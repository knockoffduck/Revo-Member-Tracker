import "dotenv/config"; // Load environment variables from .env file
import { defineConfig } from "drizzle-kit";

export default defineConfig({
	// Specifies the output directory for generated migration files.
	out: "./drizzle",
	// Points to the file containing your database schema definitions.
	schema: "./app/db/schema.ts",
	// Specifies the database dialect (e.g., 'mysql', 'postgresql', 'sqlite').
	dialect: "mysql",
	// Provides the database connection credentials.
	dbCredentials: {
		// The connection URL for your database, loaded from environment variables.
		// The '!' asserts that DATABASE_URL is defined (ensure it's set in your .env).
		url: process.env.DATABASE_URL!,
	},
});
