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

test("login redirects user to dashboard", async ({ page }) => {
  const token = buildJwt({
    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier": "e2e-user-1",
    "http://schemas.microsoft.com/ws/2008/06/identity/claims/role": "Utilisateur",
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
          nomComplet: "Utilisateur E2E",
          email: "e2e@smsi.local",
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
            {
              moduleCode: "dashboard",
              actions: [{ actionCode: "read" }],
            },
          ],
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

  await page.getByPlaceholder("votre@email.com").fill("e2e@smsi.local");
  await page.locator('input[type="password"]').fill("Password123!");
  await page.getByRole("button", { name: /se connecter/i }).click();

  await expect(page).toHaveURL(/\/tableau-bord$/);
  await expect(page.getByRole("heading", { name: /bonjour/i })).toBeVisible();
});
