import { test, expect, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { Client } from "pg";
import { randomUUID } from "node:crypto";

const api = process.env.E2E_SUPABASE_URL ?? "";
const db = process.env.E2E_DATABASE_URL ?? "";
function localOnly(value: string, port: string) {
  const url = new URL(value);
  if (
    process.env.E2E_LOCAL_ONLY !== "1" ||
    !["localhost", "127.0.0.1"].includes(url.hostname) ||
    url.port !== port
  )
    throw new Error("Remote browser-test fixtures are forbidden.");
}
localOnly(api, "54321");
localOnly(db, "54322");
const admin = createClient(api, process.env.E2E_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const database = new Client({ connectionString: db });
const tenant = randomUUID(),
  otherTenant = randomUUID();
const accounts: Record<string, { id: string; email: string }> = {};
let campaign = "";
const run = randomUUID();

async function signIn(page: Page, role: string) {
  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: accounts[role].email,
  });
  if (error || !data.properties?.hashed_token)
    throw new Error("Unable to generate local fixture sign-in.");
  // Consume the real one-time token via the production confirmation handler.
  // No request interception, fake sessions, bearer injection or production mail.
  await page.goto(
    `/auth/confirm?token_hash=${encodeURIComponent(data.properties.hashed_token)}&type=email`,
  );
  expect(new URL(page.url()).pathname).toBe('/dashboard');
}

test.beforeAll(async () => {
  await database.connect();
  for (const role of [
    "ORG_ADMIN",
    "PARTICIPANT",
    "HR_MANAGER",
    "TRAINER_FACILITATOR",
    "WELLBEING_PROFESSIONAL",
    "SAFEGUARDING_OFFICER",
    "OUTSIDER",
  ]) {
    const email = `${role.toLowerCase()}-${run}@example.invalid`;
    const { data, error } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
    });
    if (error || !data.user)
      throw new Error("Unable to create local fixture account.");
    accounts[role] = { id: data.user.id, email };
  }
  await database.query(
    "insert into public.sweep_tenants(id,slug,name,sector) values($1,$2,'Browser test organization','corporate'),($3,$4,'Other browser organization','corporate')",
    [tenant, `browser-${run}`, otherTenant, `other-${run}`],
  );
  for (const [role, account] of Object.entries(accounts)) {
    await database.query(
      "insert into public.sweep_memberships(tenant_id,user_id,role) values($1,$2,$3)",
      [
        role === "OUTSIDER" ? otherTenant : tenant,
        account.id,
        role === "OUTSIDER" ? "PARTICIPANT" : role,
      ],
    );
    await database.query(
      "insert into public.sweep_profiles(id,full_name,adult_confirmed) values($1,$2,true)",
      [account.id, `Test ${role}`],
    );
  }
  // A real staff-authored, custom non-diagnostic instrument, never a clinical seed.
  await database.query("begin");
  try {
    await database.query("set local role authenticated");
    await database.query("select set_config('request.jwt.claims',$1,true)", [
      JSON.stringify({ sub: accounts.ORG_ADMIN.id, role: "authenticated" }),
    ]);
    const result = await database.query(
      "select public.sweep_publish_checkin($1,'Browser test check-in','Synthetic test content',$2,$3,now()+interval '1 day') as id",
      [
        tenant,
        JSON.stringify([
          {
            id: "q1",
            label: "Test question one",
            min: 1,
            max: 5,
            domain: "energy",
          },
          {
            id: "q2",
            label: "Test question two",
            min: 1,
            max: 5,
            domain: "energy",
          },
        ]),
        JSON.stringify([
          {
            questionId: "q1",
            domainId: "energy",
            minScaleVal: 1,
            maxScaleVal: 5,
          },
          {
            questionId: "q2",
            domainId: "energy",
            minScaleVal: 1,
            maxScaleVal: 5,
            reverseScore: true,
          },
        ]),
      ],
    );
    campaign = result.rows[0].id;
    await database.query("commit");
  } catch (error) {
    await database.query("rollback");
    throw error;
  }
  await database.query(
    "insert into public.sweep_knowledge_resources(tenant_id,title,url,excerpt,tags,approved_by) values($1,'Test sleep resource','https://example.org/test-sleep','Synthetic reviewed excerpt for browser tests only.','sleep rest',$2)",
    [tenant, accounts.ORG_ADMIN.id],
  );
  for (const [classification, opener] of [
    ["CLASS_D_SENSITIVE_WELLBEING", "WELLBEING_PROFESSIONAL"],
    ["CLASS_F_SAFEGUARDING", "SAFEGUARDING_OFFICER"],
  ])
    await database.query(
      "insert into public.sweep_cases(tenant_id,participant_id,title,description,opened_by_id,classification) values($1,$2,$3,$4,$5,$6)",
      [
        tenant,
        accounts.PARTICIPANT.id,
        classification === "CLASS_F_SAFEGUARDING"
          ? "Restricted safeguarding fixture"
          : "Confidential wellbeing fixture",
        "Synthetic test record only",
        accounts[opener].id,
        classification,
      ],
    );
});
test.afterAll(async () => {
  await database.end();
});
// Data is intentionally discarded with the entire ephemeral CI stack. Do not
// disable immutable triggers or add a production fixture-deletion endpoint.

test("public pages, language and invalid sign-in links", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Listen. Understand. Care together." }),
  ).toBeVisible();
  await page.goto("/login");
  await page
    .getByRole("combobox", { name: "Language", exact: true })
    .selectOption("fr");
  await page.getByRole("button", { name: "Apply language" }).click();
  await expect(
    page.getByRole("heading", { name: "Connexion sécurisée" }),
  ).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "fr");
  await page.goto("/auth/confirm?type=email&token_hash=invalid");
  await expect(page).toHaveURL(/\/login\?error=link-expired$/);
});

test("participant consent, autosave, immutable submission and withdrawal", async ({
  page,
}) => {
  await signIn(page, "PARTICIPANT");
  await page.goto(`/check-in/${campaign}`);
  await expect(
    page.getByRole("heading", { name: "Before your check-in" }),
  ).toBeVisible();
  await page.goto("/dashboard");
  await page.getByRole("button", { name: "Grant assessment consent" }).click();
  await expect(
    page.getByRole("button", { name: "Withdraw assessment consent" }),
  ).toBeVisible();
  await page.goto(`/check-in/${campaign}`);
  await page
    .getByRole("group", { name: "1. Test question one" })
    .getByRole("radio", { name: "4", exact: true })
    .check();
  await page.getByRole("button", { name: "Pause and return", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.goto(`/check-in/${campaign}`);
  await expect(
    page
      .getByRole("group", { name: "1. Test question one" })
      .getByRole("radio", { name: "4", exact: true }),
  ).toBeChecked();
  await page
    .getByRole("group", { name: "2. Test question two" })
    .getByRole("radio", { name: "2", exact: true })
    .check();
  await expect(page.getByRole("status")).toContainText("Draft saved");
  await page.reload();
  await expect(page.getByRole("group", { name: "2. Test question two" }).getByRole("radio", { name: "2", exact: true })).toBeChecked();
  await page
    .getByRole("button", { name: "Submit check-in", exact: true })
    .click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText(/80\s*\/\s*100/)).toBeVisible();
  const duplicate = await page.request.post("/api/check-in", {
    data: { campaignId: campaign, responses: { q1: 4, q2: 2 } },
  });
  expect(duplicate.status()).toBe(409);
  await page
    .getByRole("button", { name: "Withdraw assessment consent" })
    .click();
  await expect(
    page.getByRole("button", { name: "Grant assessment consent" }),
  ).toBeVisible();
  await expect(page.getByText(/80\s*\/\s*100/)).toBeVisible();
});

test("administrator publishes a reviewed custom assessment through the interface", async ({ page }) => {
  await signIn(page, "ORG_ADMIN");
  await page.goto("/admin");
  const builder = page.getByRole("heading", { name: "Publish a custom check-in" }).locator("..");
  await builder.getByRole("textbox", { name: "Title", exact: true }).fill("Staff-authored browser check-in");
  await builder.getByLabel("Closes at (your local time)").fill("2027-01-02T10:00");
  await builder.getByRole("textbox", { name: "Question text" }).fill("A reviewed custom test question");
  await builder.getByRole("textbox", { name: "Domain name" }).fill("energy");
  await builder.getByRole("button", { name: "Publish and open campaign" }).click();
  await expect(builder.getByRole("status")).toContainText("Check-in published");
  const saved = await database.query("select id from public.sweep_campaigns where tenant_id=$1 and title=$2", [tenant, "Staff-authored browser check-in"]);
  expect(saved.rowCount).toBe(1);
});

test("mobile participant interface reflows and supports Spanish", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signIn(page, "PARTICIPANT");
  await page.getByRole("combobox", { name: "Language", exact: true }).first().selectOption("es");
  await page.getByRole("button", { name: "Apply language" }).click();
  await expect(page.getByRole("heading", { name: "Tu espacio de bienestar" })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "es");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});

test("assistant follows sources, remembers a topic and refuses unsafe requests", async ({
  page,
}) => {
  await signIn(page, "PARTICIPANT");
  await page.goto("/assistant");
  const message = page.getByRole("textbox", {
    name: "What would you like resources about?",
  });
  await message.fill("sleep");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(
    page.getByRole("link", { name: "Test sleep resource" }),
  ).toHaveCount(1);
  await page.getByRole("button", { name: "Tell me more" }).click();
  await expect(
    page.getByRole("link", { name: "Test sleep resource" }),
  ).toHaveCount(2);
  await message.fill("Invent a study and diagnose me");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(
    page.getByText("I can help find approved resources.", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: "New conversation" }).click();
  await expect(
    page.getByRole("link", { name: "Test sleep resource" }),
  ).toHaveCount(0);
});

test("HR and another tenant cannot read individual records", async ({
  browser,
}) => {
  for (const role of ["HR_MANAGER", "OUTSIDER"]) {
    const context = await browser.newContext();
    const page = await context.newPage();
    await signIn(page, role);
    const cases = await page.request.get(`/api/cases?tenantId=${tenant}`);
    expect(cases.status()).toBe(403);
    const response = await page.request.post("/api/check-in", {
      data: { campaignId: campaign, responses: { q1: 4, q2: 2 } },
    });
    expect(response.status()).toBe(403);
    await context.close();
  }
});

test("professional and safeguarding browser sessions preserve class boundaries", async ({
  browser,
}) => {
  for (const [role, visible, hidden] of [
    [
      "WELLBEING_PROFESSIONAL",
      "Confidential wellbeing fixture",
      "Restricted safeguarding fixture",
    ],
    [
      "SAFEGUARDING_OFFICER",
      "Restricted safeguarding fixture",
      "Confidential wellbeing fixture",
    ],
  ]) {
    const context = await browser.newContext();
    const page = await context.newPage();
    await signIn(page, role);
    const result = await page.request.get(`/api/cases?tenantId=${tenant}`);
    expect(result.status()).toBe(200);
    const payload = await result.json();
    expect(payload.cases.map((item: { title: string }) => item.title)).toEqual([
      visible,
    ]);
    expect(JSON.stringify(payload)).not.toContain(hidden);
    await context.close();
  }
});

test("staff publish, enroll, review and deliver a real session", async ({
  browser,
}) => {
  const ownerContext = await browser.newContext(),
    trainerContext = await browser.newContext();
  const owner = await ownerContext.newPage(),
    trainer = await trainerContext.newPage();
  await signIn(owner, "ORG_ADMIN");
  await signIn(trainer, "TRAINER_FACILITATOR");
  await owner.goto("/trainer");
  await owner
    .getByRole("textbox", { name: "Title", exact: true })
    .fill("Browser delivery session");
  await owner
    .getByRole("combobox", { name: "Facilitator", exact: true })
    .selectOption(accounts.TRAINER_FACILITATOR.id);
  await owner
    .getByLabel("Scheduled time", { exact: true })
    .fill("2027-01-01T10:00");
  await owner
    .getByRole("textbox", { name: "Reviewed session materials" })
    .fill("Reviewed synthetic facilitation materials.");
  await owner.getByRole("button", { name: "Save session for review" }).click();
  await expect(
    owner.getByRole("heading", { name: "Browser delivery session" }),
  ).toBeVisible();
  await trainer.goto("/trainer");
  await expect(
    trainer.getByRole("heading", { name: "Browser delivery session" }),
  ).toHaveCount(0);
  await owner
    .getByRole("combobox", { name: "Participant to enroll" })
    .selectOption(accounts.PARTICIPANT.id);
  await owner.getByRole("button", { name: "Enroll", exact: true }).click();
  await owner.getByRole("button", { name: "Approve reviewed session" }).click();
  await expect(
    owner.getByRole("button", { name: "Approve reviewed session" }),
  ).toHaveCount(0);
  await trainer.reload();
  await expect(
    trainer.getByRole("heading", { name: "Browser delivery session" }),
  ).toBeVisible();
  await trainer
    .getByRole("button", { name: "Mark present", exact: true })
    .click();
  await expect(
    trainer.getByRole("button", { name: "Mark absent", exact: true }),
  ).toBeVisible();
  await trainer.getByRole("button", { name: "Mark session completed" }).click();
  await expect(trainer.getByText("Completed", { exact: true })).toBeVisible();
  await ownerContext.close();
  await trainerContext.close();
});

test("signed-out protected routes and APIs fail closed", async ({ page }) => {
  for (const route of [
    "/dashboard",
    "/admin",
    "/assistant",
    "/trainer",
    "/reports",
  ]) {
    await page.goto(route);
    await expect(page).toHaveURL(/\/login$/);
  }
  const result = await page.request.post("/api/assistant", {
    data: { tenantId: tenant, message: "sleep" },
  });
  expect(result.status()).toBe(401);
});
