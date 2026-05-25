/* eslint-disable no-console */
const { Builder, By, Key, until } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
const chromedriver = require("chromedriver");

const BASE_URL = process.env.SELENIUM_BASE_URL || "http://localhost:3000";
const ADMIN_EMAIL = process.env.SELENIUM_ADMIN_EMAIL || "";
const ADMIN_PASSWORD = process.env.SELENIUM_ADMIN_PASSWORD || "";
const HEADLESS = process.env.SELENIUM_HEADLESS !== "false";

async function findFirstVisible(driver, selectors, timeoutMs = 10000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    for (const selector of selectors) {
      const elements = await driver.findElements(By.css(selector));
      for (const element of elements) {
        if (await element.isDisplayed()) {
          return element;
        }
      }
    }
    await driver.sleep(200);
  }
  throw new Error(`Aucun élément visible trouvé pour: ${selectors.join(", ")}`);
}

async function run() {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error(
      "Variables manquantes: SELENIUM_ADMIN_EMAIL et SELENIUM_ADMIN_PASSWORD sont obligatoires."
    );
  }

  const options = new chrome.Options();
  if (HEADLESS) {
    options.addArguments("--headless=new");
  }
  options.addArguments("--window-size=1400,1000");
  options.addArguments("--no-sandbox");
  options.addArguments("--disable-dev-shm-usage");
  options.addArguments("--disable-gpu");
  options.addArguments("--disable-software-rasterizer");

  const service = new chrome.ServiceBuilder(chromedriver.path);
  const driver = await new Builder()
    .forBrowser("chrome")
    .setChromeOptions(options)
    .setChromeService(service)
    .build();

  try {
    await driver.get(`${BASE_URL}/login`);

    const emailInput = await findFirstVisible(driver, [
      "input[type='email']",
      "input[placeholder*='@']",
      "input[name='email']",
    ]);
    await emailInput.clear();
    await emailInput.sendKeys(ADMIN_EMAIL);

    const passwordInput = await findFirstVisible(driver, [
      "input[type='password']",
      "input[name='password']",
    ]);
    await passwordInput.clear();
    await passwordInput.sendKeys(ADMIN_PASSWORD);

    await passwordInput.sendKeys(Key.RETURN);

    const currentAfterEnter = await driver.getCurrentUrl();
    if (currentAfterEnter.includes("/login")) {
      const submitButtons = await driver.findElements(
        By.xpath("//button[contains(translate(normalize-space(.), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'connect')]")
      );

      if (submitButtons.length > 0) {
        await submitButtons[0].click();
      } else {
        const loginButton = await findFirstVisible(driver, [
          "button[type='submit']",
          "button",
        ]);
        await loginButton.click();
      }
    }

    await driver.wait(until.urlContains("/tableau-bord"), 20000);

    await driver.get(`${BASE_URL}/admin/roles`);
    await driver.wait(until.urlContains("/admin/roles"), 10000);

    await driver.get(`${BASE_URL}/admin/tracabilite`);
    await driver.wait(until.urlContains("/admin/tracabilite"), 10000);

    const finalUrl = await driver.getCurrentUrl();
    if (finalUrl.includes("/acces-refuse")) {
      throw new Error("Accès refusé détecté sur une route attendue comme autorisée.");
    }

  } finally {
    await driver.quit();
  }
}

const keepAlive = setInterval(() => {}, 1000);

(async () => {
  try {
    await run();
    console.log("Selenium OK: login + dashboard + /admin/roles + /admin/tracabilite");
  } catch (error) {
    console.error("Selenium FAIL:", error.message);
    process.exitCode = 1;
  } finally {
    clearInterval(keepAlive);
  }
})();
