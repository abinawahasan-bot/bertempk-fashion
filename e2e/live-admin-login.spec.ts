import { test } from "@playwright/test";

test("admin login flow", async ({ page }) => {
  page.on("console", (msg) => console.log("CONSOLE:", msg.text()));
  
  await page.goto("https://fashion-ecom-eight.vercel.app/");
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(3000);
  
  await page.click('button:has-text("Sign In")');
  await page.waitForTimeout(1000);
  
  await page.fill('input[type="email"]', "abinawahasan@gmail.com");
  await page.fill('input[type="password"]', "TempPass123!");
  
  const dialog = page.locator('[role="dialog"]');
  const submitBtn = dialog.locator('button[type="submit"]');
  await submitBtn.click({ force: true });
  await page.waitForTimeout(8000);
  
  console.log("URL after login:", page.url());
  
  const bodyText = await page.textContent("body");
  console.log("Has 'Sign Out':", bodyText?.includes("Sign Out") || bodyText?.includes("sign out") || bodyText?.includes("Keluar"));
});
