const { test, expect } = require("@playwright/test");

function base64UrlEncode(value) {
  return Buffer.from(JSON.stringify(value))
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function buildJwt(payload) {
  const header = { alg: "HS256", typ: "JWT" };
  return `${base64UrlEncode(header)}.${base64UrlEncode(payload)}.signature`;
}

test("Admin Societe peut se connecter et acceder aux routes admin autorisees", async ({ page }) => {
  const token = buildJwt({
    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier": "e2e-admin-societe-1",
    "http://schemas.microsoft.com/ws/2008/06/identity/claims/role": "Admin Societe",
    exp: Math.floor(Date.now() / 1000) + 3600,
  });

  await page.route("**/api/**", async (route) => {
    const url = route.request().url().toLowerCase();
    const method = route.request().method();

    if (url.endsWith("/api/auth/login") && method === "POST") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          token,
          nomComplet: "Admin Societe E2E",
          email: "adminsociete.e2e@smsi.local",
          societe: { id: 1, nom: "Societe Demo" },
        }),
      });
      return;
    }

    if (url.includes("/api/user/me/permissions") && method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          modules: [
            { moduleCode: "dashboard", actions: [{ actionCode: "read" }] },
            { moduleCode: "roles", actions: [{ actionCode: "read" }] },
            {
              moduleCode: "tracabilite",
              actions: [{ actionCode: "read" }, { actionCode: "export" }],
            },
          ],
        }),
      });
      return;
    }

    if (url.includes("/api/dashboard/global") && method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({}),
      });
      return;
    }

    if (url.includes("/api/role/tenant") && method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          { id: "1", nom: "RSSI", isSystem: true, isCustom: false, userCount: 1 },
        ]),
      });
      return;
    }

    if (url.includes("/api/tracabilite") && method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          page: 1,
          pageSize: 25,
          total: 0,
          items: [],
          moduleOptions: [],
          actionOptions: [],
        }),
      });
      return;
    }

    if (method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: "[]",
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: "{}",
    });
  });

  await page.goto("/login");
  await page.getByPlaceholder("votre@email.com").fill("adminsociete.e2e@smsi.local");
  await page.locator('input[type="password"]').fill("Password123!");
  await page.getByRole("button", { name: /se connecter/i }).click();

  await expect(page).toHaveURL(/\/tableau-bord$/);

  await page.goto("/admin/roles");
  await expect(page).toHaveURL(/\/admin\/roles$/);

  await page.goto("/admin/tracabilite");
  await expect(page).toHaveURL(/\/admin\/tracabilite$/);
});