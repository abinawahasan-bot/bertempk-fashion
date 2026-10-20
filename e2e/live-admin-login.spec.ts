import { test } from "@playwright/test";

test("admin login flow", async ({ page }) => {
  page.on("console", (msg) => console.log("CONSOLE:", msg.text()));
  
  await page.goto("https://fashion-ecom-eight.vercel.app/");
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(5000);
  
  // Try to call getSupabase manually via window
  const result = await page.evaluate(async () => {
    try {
      // @ts-ignore
      const { createClient } = await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm");
      const client = createClient(
        "https://xznhshhdwipafbvjpmad.supabase.co",
        "sb_publishable_MfmgVL1Nv9F6TmnFFwXPTg_kcQQi2Ig"
      );
      const { data, error } = await client.auth.signInWithPassword({
        email: "abinawahasan@gmail.com",
        password: "TempPass123!"
      });
      return { success: !error, error: error?.message, hasSession: !!data?.session };
    } catch (e) {
      return { success: false, error: String(e) };
    }
  });
  console.log("Manual auth result:", JSON.stringify(result));
});
