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
  
  const submitBtn = page.locator('button[type="submit"]').last();
  await submitBtn.click();
  await page.waitForTimeout(8000);
  
  console.log("URL after login:", page.url());
});
