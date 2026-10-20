import { test } from "@playwright/test";

test("admin login flow", async ({ page }) => {
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
  
  const bodyText = await page.textContent("body");
  console.log("Has 'Sign Out':", bodyText?.includes("Sign Out") || bodyText?.includes("sign out") || bodyText?.includes("Keluar"));
  
  await page.goto("https://fashion-ecom-eight.vercel.app/admin");
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(3000);
  
  const adminText = await page.textContent("body");
  console.log("Admin has 'Sign in required':", adminText?.includes("Sign in required"));
});
