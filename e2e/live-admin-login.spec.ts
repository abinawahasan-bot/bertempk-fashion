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
  
  // Check form's pointer-events and other styles
  const formStyles = await page.evaluate(() => {
    const form = document.querySelector('[role="dialog"] form');
    if (!form) return "no form";
    const style = getComputedStyle(form);
    return JSON.stringify({
      pointerEvents: style.pointerEvents,
      display: style.display,
      visibility: style.visibility,
    });
  });
  console.log("Form styles:", formStyles);
  
  // Check if button has any event listeners
  const hasListeners = await page.evaluate(() => {
    const btn = document.querySelector('[role="dialog"] button[type="submit"]');
    // @ts-ignore
    return btn ? (btn.onclick !== null || btn._listeners) : false;
  });
  console.log("Has onClick listeners:", hasListeners);
  
  // Try to manually trigger click on the button
  await page.evaluate(() => {
    const btn = document.querySelector('[role="dialog"] button[type="submit"]') as HTMLButtonElement;
    if (btn) {
      const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
      btn.dispatchEvent(clickEvent);
    }
  });
  await page.waitForTimeout(5000);
  
  console.log("Done");
});
