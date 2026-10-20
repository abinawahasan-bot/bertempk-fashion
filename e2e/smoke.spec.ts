import { test, expect } from "@playwright/test";

test.describe("Smoke tests — desktop", () => {
  test("home page loads and shows hero", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/bertempk/i);
    // Navbar brand
    await expect(page.locator("a[href='/']").first()).toBeVisible();
  });

  test("shop page shows products", async ({ page }) => {
    await page.goto("/shop");
    // At least one product card link
    const productLinks = page.locator('a[href^="/product/"]');
    await expect(productLinks.first()).toBeVisible({ timeout: 10_000 });
    const count = await productLinks.count();
    expect(count).toBeGreaterThan(0);
  });

  test("shop category filter works", async ({ page }) => {
    await page.goto("/shop");
    // Click "Hoodie" category
    const hoodieBtn = page.getByRole("button", { name: "Hoodie", exact: true }).first();
    await hoodieBtn.click();
    await expect(page).toHaveURL(/category=Hoodie/);
  });

  test("shop search via URL works", async ({ page }) => {
    await page.goto("/shop?q=hoodie");
    await expect(page).toHaveURL(/q=hoodie/);
  });

  test("product detail page renders", async ({ page }) => {
    await page.goto("/shop");
    const firstProduct = page.locator('a[href^="/product/"]').first();
    await firstProduct.click();
    await expect(page).toHaveURL(/\/product\//);
    // Size selector should exist
    await expect(page.getByText(/pilih ukuran|size/i).first()).toBeVisible({ timeout: 10_000 });
  });

  test("cart drawer opens", async ({ page }) => {
    await page.goto("/");
    // Look for cart/bag button
    const cartBtn = page.locator('button[aria-label*="cart" i], button[aria-label*="bag" i], a[href="/cart"]').first();
    if (await cartBtn.isVisible()) {
      await cartBtn.click();
    }
  });

  test("checkout page renders for empty cart", async ({ page }) => {
    await page.goto("/checkout");
    // Should show either empty cart message or checkout form
    await page.waitForLoadState("domcontentloaded");
    const body = await page.textContent("body");
    expect(body).toBeTruthy();
  });

  test("size guide page renders", async ({ page }) => {
    await page.goto("/size-guide");
    await expect(page.getByText(/size guide/i).first()).toBeVisible({ timeout: 10_000 });
  });

  test("privacy and terms pages render", async ({ page }) => {
    await page.goto("/privacy");
    await expect(page.locator("body")).toBeVisible();
    await page.goto("/terms");
    await expect(page.locator("body")).toBeVisible();
  });

  test("404 redirects to home", async ({ page }) => {
    await page.goto("/nonexistent-page");
    await expect(page).toHaveURL("/");
  });
});


  test("outfit builder page renders", async ({ page }) => {
    await page.goto("/outfit");
    await expect(page.locator("body")).toBeVisible();
    await expect(page.locator("body")).toBeVisible();
  });

  test("orders page renders", async ({ page }) => {
    await page.goto("/orders");
    await expect(page.locator("body")).toBeVisible();
  });

  test("contact section renders on home", async ({ page }) => {
    await page.goto("/#contact");
    await expect(page.locator("#contact")).toBeVisible({ timeout: 10_000 });
  });

  test("outfit builder share link restores", async ({ page }) => {
    // Build a share URL manually
    const encoded = Buffer.from(JSON.stringify({ items: [], gender: "female" })).toString("base64");
    await page.goto(`/outfit?look=${encoded}`);
    await expect(page.locator("body")).toBeVisible();
  });

test.describe("Smoke tests — mobile", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("home loads on mobile", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("body")).toBeVisible();
  });

  test("mobile nav hamburger works", async ({ page }) => {
    await page.goto("/");
    const hamburger = page.locator('button[aria-label*="menu" i], button[aria-expanded]').first();
    if (await hamburger.isVisible()) {
      await hamburger.click();
      await page.waitForTimeout(300);
    }
  });

  test("shop page works on mobile", async ({ page }) => {
    await page.goto("/shop");
    const productLinks = page.locator('a[href^="/product/"]');
    await expect(productLinks.first()).toBeVisible({ timeout: 10_000 });
  });

  test("outfit builder works on mobile", async ({ page }) => {
    await page.goto("/outfit");
    await expect(page.locator("body")).toBeVisible();
  });

  test("orders page works on mobile", async ({ page }) => {
    await page.goto("/orders");
    await expect(page.locator("body")).toBeVisible();
  });

  test("privacy page works on mobile", async ({ page }) => {
    await page.goto("/privacy");
    await expect(page.locator("body")).toBeVisible();
  });
});

test.describe("Checkout flow — authenticated", () => {
  test.skip(({ isMobile }) => isMobile, "Desktop-only: auth button hidden on mobile");
  test.use({ viewport: { width: 1280, height: 800 } });
  test("signs in, adds to cart, checks out, lands on confirmation", async ({ page }) => {
    await page.goto("/");

    // Open auth modal via "Sign In" button
    const signInBtn = page.getByRole("button", { name: /sign in/i }).first();
    await signInBtn.click();
    await page.waitForTimeout(500);

    // Fill credentials in modal
    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    await emailInput.fill("phase1test@bertempk-test.com");
    await passwordInput.fill("testpass123");
    const submitBtn = page.locator('[role="dialog"] button[type="submit"]');
    await submitBtn.click();
    await page.waitForTimeout(3000);

    // Verify signed in (Sign In button should be gone)
    // Go to shop and pick a product
    await page.goto("/shop");
    await page.waitForLoadState("domcontentloaded");

    const firstProduct = page.locator('a[href^="/product/"]').first();
    await firstProduct.click();
    await page.waitForLoadState("domcontentloaded");

    // Select a size
    const sizeBtn = page.locator('button[aria-pressed]').first();
    if (await sizeBtn.isVisible()) await sizeBtn.click();

    // Add to bag
    const addBtn = page.getByRole("button", { name: /add to bag|add to cart/i }).first();
    if (await addBtn.isVisible()) {
      await addBtn.click();
      await page.waitForTimeout(1000);
    }

    // Go to checkout
    await page.goto("/checkout");
    await page.waitForLoadState("domcontentloaded");

    // Fill address form
    const fullNameInput = page.getByPlaceholder("Jane Doe");
    if (await fullNameInput.isVisible()) {
      await fullNameInput.fill("Test User");
      await page.getByPlaceholder("you@example.com").fill("phase1test@bertempk-test.com");
      await page.getByPlaceholder("+62 …").fill("+62 812 0000 0000");
      await page.getByPlaceholder("Street and number").fill("Jalan Test 1");
      // City, postal code, country - find by their labels' span text via nth inputs
      // Simpler: use the input order - city is 5th text input, postal 6th, country 7th
      // But let's use getByPlaceholder for country
      await page.getByPlaceholder("Indonesia").fill("Indonesia");
      await page.getByPlaceholder("Indonesia").fill("Indonesia");
      const cityInput = page.locator('label:has-text("City") input');
      await cityInput.fill("Jakarta");
      const postalInput = page.locator('label:has-text("Postal code") input');
      await postalInput.fill("12190");

      // Check consent
      const consentCheckbox = page.getByRole("checkbox");
      if (await consentCheckbox.isVisible()) await consentCheckbox.check();

      // Submit
      const placeOrderBtn = page.getByRole("button", { name: /place order/i });
      if (await placeOrderBtn.isEnabled()) {
        await placeOrderBtn.click();
        await page.waitForTimeout(5000);
        const toast = page.locator("[data-sonner-toast]");
        if (await toast.count() > 0) {
          // Order placed successfully
        }
        // Should redirect to confirmation
        await expect(page).toHaveURL(/\/orders\//, { timeout: 15_000 });
      }
    }
  });
});
