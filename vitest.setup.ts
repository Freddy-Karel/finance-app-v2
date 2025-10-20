import "@testing-library/jest-dom";
import * as React from "react";
import { execSync } from "child_process";
import path from "path";
import fs from "fs";

// Some test environments / Babel setups require React to be available as a global for JSX runtime.
(global as any).React = React;

// Ensure environment variables from .env are loaded during tests
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	require('dotenv').config({ path: envPath });
}

// Use an isolated SQLite file for tests to avoid mutating dev.db.
const testDbFile = path.resolve(process.cwd(), 'test.db');
const testDbUrl = `file:${path.basename(testDbFile)}`; // prisma expects relative file: path in this repo

// Remove any previous test DB so each test run starts clean.
try {
	if (fs.existsSync(testDbFile)) fs.unlinkSync(testDbFile);
} catch (e) {
	// eslint-disable-next-line no-console
	console.warn('Could not remove existing test DB file:', e);
}

// Point Prisma at the isolated test DB for the duration of the run.
process.env.DATABASE_URL = testDbUrl;

// Push the schema to the test DB. We skip generator to avoid intermittent generate conflicts.
try {
	execSync('npx prisma db push --accept-data-loss --skip-generate', { stdio: 'inherit' });
	// If needed, generate the client once outside tests (the project already has generated client in node_modules).
} catch (e) {
	// eslint-disable-next-line no-console
	console.error('Failed to push Prisma schema to test DB before tests:', e);
}

// Ensure the test DB file is removed when the test process exits to keep repo clean.
process.on('exit', () => {
	try {
		if (fs.existsSync(testDbFile)) fs.unlinkSync(testDbFile);
	} catch (e) {
		// eslint-disable-next-line no-console
		console.warn('Failed to clean up test DB file on exit:', e);
	}
});
