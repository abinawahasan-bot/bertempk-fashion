import { test } from "@playwright/test";

test("admin login flow", async ({ page }) => {
  await page.goto("https://fashion-ecom-eight.vercel.app/");
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(3000);
  
  await page.click('button:has-text("Sign In")');
  await page.waitForTimeout(1000);
  
  // Check if submit button is inside the form
  const isInsideForm = await page.evaluate(() => {
    const btn = document.querySelector('[role="dialog"] button[type="submit"]');
    const form = document.querySelector('[role="dialog"] form');
    return form && btn && form.contains(btn);
  });
  console.log("Submit btn inside form:", isInsideForm);
  
  // Check pointer-events on the button
  const pointerEvents = await page.evaluate(() => {
    const btn = document.querySelector('[role="dialog"] button[type="submit"]');
    return btn ? getComputedStyle(btn).pointerEvents : "not found";
  });
  console.log("Pointer events:", pointerEvents);
  
  // Check if there's an overlay on top
  const overlayZ = await page.evaluate(() => {
    const overlay = document.querySelector('.fixed.inset-0');
    return overlay ? getComputedStyle(overlay).zIndex : "not found";
  });
  console.log("Overlay z-index:", overlayZ);
});
