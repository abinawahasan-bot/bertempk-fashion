import { test } from "@playwright/test";

test("check localStorage", async ({ page }) => {
  await page.goto("https://fashion-ecom-eight.vercel.app/");
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(3000);
  
  const lsAvailable = await page.evaluate(() => {
    try {
      localStorage.setItem("test", "1");
      const v = localStorage.getItem("test");
      localStorage.removeItem("test");
      return v === "1";
    } catch (e) {
      return "error: " + String(e);
    }
  });
  console.log("localStorage available:", lsAvailable);
  
  const hasWindow = await page.evaluate(() => typeof window !== "undefined");
  console.log("Has window:", hasWindow);
});
