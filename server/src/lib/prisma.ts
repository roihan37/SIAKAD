import { PrismaClient } from "@prisma/client";
import { getDatabaseUrl } from "../config/env";

// Validate before constructing the adapter; configuration failures stay explicit.
const connectionString = getDatabaseUrl();
let prisma: PrismaClient;
try {
	// Dynamically require to avoid hard crash when dependency is missing; the
	// error message below will be more actionable for the developer.
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const { PrismaPg } = require("@prisma/adapter-pg");
	const adapter = new PrismaPg({ connectionString });
	prisma = new PrismaClient({ adapter });
} catch (err) {
	throw new Error(
		"Prisma adapter @prisma/adapter-pg is required to connect to the database.\nRun `npm install @prisma/adapter-pg --save` in the server folder and try again."
	);
}

export { prisma };