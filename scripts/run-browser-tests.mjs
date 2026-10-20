import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import pg from "pg";

// No remote project, no linked flags, no production credentials. Local status
// is captured privately; do not echo its service-role key to CI output.
const status = JSON.parse(
  execFileSync("npx", ["supabase", "status", "-o", "json"], {
    encoding: "utf8",
    shell: process.platform === "win32",
    stdio: ["ignore", "pipe", "inherit"],
  }),
);
const url = new URL(status.API_URL);
const database = new URL(status.DB_URL);
if (
  !["localhost", "127.0.0.1"].includes(url.hostname) ||
  url.port !== "54321" ||
  !["localhost", "127.0.0.1"].includes(database.hostname) ||
  database.port !== "54322"
)
  throw new Error(
    "Browser tests require the isolated local Supabase stack. Remote targets are forbidden.",
  );
if (!status.ANON_KEY || !status.SERVICE_ROLE_KEY)
  throw new Error("Local test keys are missing.");
const env = {
  ...process.env,
  E2E_LOCAL_ONLY: "1",
  E2E_SUPABASE_URL: status.API_URL,
  E2E_SERVICE_ROLE_KEY: status.SERVICE_ROLE_KEY,
  E2E_DATABASE_URL: status.DB_URL,
  NEXT_PUBLIC_SUPABASE_URL: status.API_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: status.ANON_KEY,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: status.ANON_KEY,
  NEXT_PUBLIC_APP_URL: "http://localhost:3107",
  DATABASE_URL: status.DB_URL,
  DIRECT_URL: status.DB_URL,
  SUPABASE_SECRET_KEY: "",
  SUPABASE_SERVICE_ROLE_KEY: "",
};

// Rehearse the existing transactional, multi-role database tests on the fresh
// migrated local stack before testing through real browsers and HTTP routes.
const connection = new pg.Client({ connectionString: status.DB_URL });
await connection.connect();
try {
  await connection.query(
    readFileSync("supabase/tests/completion_workflows.sql", "utf8"),
  );
  console.log(
    "Transactional multi-user database checks passed on isolated local Supabase.",
  );
} finally {
  await connection.end();
}
for (const args of [
  ["run", "build"],
  ["exec", "--", "playwright", "test"],
]) {
  const child = spawnSync("npm", args, {
    env,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (child.status !== 0) process.exit(child.status ?? 1);
}
