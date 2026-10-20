import { test, expect } from "@playwright/test";

test("admin page loads", async ({ page }) => {
  await page.goto("https://fashion-ecom-eight.vercel.app/admin");
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(3000);
  const bodyText = await page.textContent("body");
  console.log("Admin has 'login' or 'sign in':", bodyText?.toLowerCase().includes("sign") || bodyText?.toLowerCase().includes("login") || bodyText?.toLowerCase().includes("masuk"));
  console.log("Admin has 'orders':", bodyText?.toLowerCase().includes("order"));
  await page.screenshot({ path: "/tmp/live-admin.png" });
});

test("checkout page loads", async ({ page }) => {
  await page.goto("https://fashion-ecom-eight.vercel.app/checkout");
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(3000);
  const bodyText = await page.textContent("body");
  console.log("Checkout has 'checkout' or 'bayar':", bodyText?.toLowerCase().includes("checkout") || bodyText?.toLowerCase().includes("bayar") || bodyText?.toLowerCase().includes("order"));
  await page.screenshot({ path: "/tmp/live-checkout.png" });
});
