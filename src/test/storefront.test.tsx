import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";

import ProductDetail from "../pages/ProductDetail";
import Shop from "../pages/Shop";
import Wishlist from "../pages/Wishlist";
import OutfitBuilder from "../pages/OutfitBuilder";
import SizeGuidePage from "../pages/SizeGuide";
import Navbar from "../components/Navbar";
import CartDrawer from "../components/CartDrawer";
import ProductCard from "../components/ProductCard";
import Footer from "../components/Footer";
import { useCartStore } from "../store/cart";
import { useUIStore } from "../store/ui";
import { useWishlistStore } from "../store/wishlist";
import { products } from "../constants/products";
import { normalizeIDR } from "../lib/money";

function LocationProbe() {
  const location = useLocation();
  return (
    <div data-testid="location">
      {location.pathname}
      {location.search}
    </div>
  );
}

beforeEach(() => {
  useCartStore.setState({ items: [] });
  useUIStore.setState({ cartOpen: false });
  useWishlistStore.setState({ items: [] });
});

describe("ProductDetail", () => {
  function renderDetail() {
    return render(
      <MemoryRouter initialEntries={["/product/p2"]}>
        <Routes>
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/shop" element={<Shop />} />
        </Routes>
      </MemoryRouter>
    );
  }

  it("blocks add until a size is chosen", async () => {
    const user = userEvent.setup();
    renderDetail();

    const add = screen.getByRole("button", { name: /add to bag/i });
    expect(add).toBeDisabled();
    expect(screen.getByText(/pilih ukuran dulu/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "M" }));
    expect(add).toBeEnabled();

    await user.click(add);
    const { items } = useCartStore.getState();
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      lineId: "p2::M::?",
      size: "M",
      colorway: null,
      quantity: 1,
    });
  });

  it("adds the chosen quantity as one line", async () => {
    const user = userEvent.setup();
    renderDetail();
    await user.click(screen.getByRole("button", { name: "L" }));
    await user.click(screen.getByRole("button", { name: /increase/i }));
    await user.click(screen.getByRole("button", { name: /increase/i }));
    await user.click(screen.getByRole("button", { name: /add to bag/i }));
    const { items } = useCartStore.getState();
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(3);
    expect(items[0].lineId).toBe("p2::L::?");
  });

  it("opens the size guide dialog and closes it with Escape", async () => {
    const user = userEvent.setup();
    renderDetail();

    await user.click(screen.getByRole("button", { name: /size guide/i }));
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(screen.getAllByRole("table").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/cara mengukur/i)).toBeInTheDocument();

    await user.keyboard("{Escape}");
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    );
  });

  it("renders whole-rupiah prices and the free-shipping badge", () => {
    renderDetail();
    // ICU emits U+00A0 after "Rp" — normalise before comparing.
    const has = (text: string) => (_: string, el?: Element | null) =>
      normalizeIDR(el?.textContent ?? "").trim() === text;

    expect(screen.getAllByText(has("Rp 989.000")).length).toBeGreaterThanOrEqual(1);
    expect(
      screen.getByText(has("Gratis ongkir di atas Rp 1.500.000"))
    ).toBeInTheDocument();
  });
});

describe("Shop + Navbar search", () => {
  function renderShop(initial: string) {
    return render(
      <MemoryRouter initialEntries={[initial]}>
        <Navbar />
        <Routes>
          <Route path="/shop" element={<Shop />} />
          <Route path="*" element={<p>other</p>} />
        </Routes>
        <LocationProbe />
      </MemoryRouter>
    );
  }

  it("reads ?q= from the URL", () => {
    renderShop("/shop?q=hoodie");
    const input = screen.getByPlaceholderText(/search products/i);
    expect(input).toHaveValue("hoodie");
    expect(screen.getByText("Static Hoodie / 002")).toBeInTheDocument();
    expect(screen.getByText("Showing 1 piece")).toBeInTheDocument();
  });

  it("keeps the URL in sync while typing", async () => {
    const user = userEvent.setup();
    renderShop("/shop");
    const input = screen.getByPlaceholderText(/search products/i);

    await user.type(input, "hoodie");
    await waitFor(() =>
      expect(screen.getByTestId("location")).toHaveTextContent("/shop?q=hoodie")
    );
    expect(screen.getByText("Static Hoodie / 002")).toBeInTheDocument();

    await user.clear(input);
    await waitFor(() =>
      expect(screen.getByTestId("location")).toHaveTextContent("/shop")
    );
  });

  it("navigates from the navbar search box", async () => {
    const user = userEvent.setup();
    renderShop("/");
    const desktop = screen.getByLabelText("Search products");
    await user.type(desktop, "hoodie");
    await user.keyboard("{Enter}");
    await waitFor(() =>
      expect(screen.getByTestId("location")).toHaveTextContent("/shop?q=hoodie")
    );
  });

  it("exposes search, wishlist and orders in the mobile menu", async () => {
    const user = userEvent.setup();
    renderShop("/");
    await user.click(screen.getByRole("button", { name: /open menu/i }));
    expect(
      screen.getAllByLabelText("Search products").length
    ).toBeGreaterThanOrEqual(2);
    const hrefs = screen
      .getAllByRole("link")
      .map((a) => a.getAttribute("href"));
    expect(hrefs).toContain("/wishlist");
    expect(hrefs).toContain("/orders");
  });
});

describe("CartDrawer", () => {
  function renderDrawer() {
    return render(
      <MemoryRouter>
        <CartDrawer />
      </MemoryRouter>
    );
  }

  it("shows the choose-size chip and the free-shipping hint", () => {
    useCartStore.getState().addItem(products[1]!, { size: null, colorway: null });
    useUIStore.setState({ cartOpen: true });

    renderDrawer();

    expect(screen.getByRole("link", { name: /choose size/i })).toHaveAttribute(
      "href",
      "/product/p2"
    );
    // 989.000 → 511.000 short of the 1.500.000 threshold.
    expect(screen.getByText(/511\.000/)).toBeInTheDocument();
  });

  it("shows size and colourway chips, and drops the hint past the threshold", () => {
    useCartStore.getState().addItem(products[3]!, {
      size: "XL",
      colorway: "Jet",
    });
    useUIStore.setState({ cartOpen: true });

    renderDrawer();

    expect(screen.getByText(/size xl/i)).toBeInTheDocument();
    expect(screen.getByText("Jet")).toBeInTheDocument();
    expect(screen.queryByText(/511\.000/)).not.toBeInTheDocument();
  });

  it("updates quantity by lineId", async () => {
    const user = userEvent.setup();
    useCartStore.getState().addItem(products[0]!, { size: "M", colorway: null });
    useCartStore.getState().addItem(products[1]!, { size: "M", colorway: null });
    useUIStore.setState({ cartOpen: true });
    renderDrawer();

    await user.click(
      screen.getByRole("button", { name: /increase mod jacket/i })
    );
    expect(useCartStore.getState().items.find((i) => i.id === "p1")?.quantity).toBe(2);
    expect(useCartStore.getState().items.find((i) => i.id === "p2")?.quantity).toBe(1);

    await user.click(screen.getByRole("button", { name: /remove static hoodie/i }));
    expect(useCartStore.getState().items.map((i) => i.lineId)).toEqual([
      "p1::M::?",
    ]);
  });

  it("hides the hint once the threshold is reached", () => {
    useCartStore.getState().addItem(products[3]!, {
      size: "XL",
      colorway: null,
      quantity: 1,
    });
    useUIStore.setState({ cartOpen: true });
    renderDrawer();
    expect(screen.queryByText(/gratis ongkir/i)).not.toBeInTheDocument();
  });

  it("renders a placeholder for a legacy line with no image", () => {
    // A pre-Wave-0 row persisted `image: ""` — `<img src="">` would log a
    // React error and render a broken glyph.
    useCartStore.setState({
      items: [
        {
          ...products[1]!,
          image: "",
          size: "L",
          colorway: null,
          lineId: "p2::L::?",
          quantity: 1,
        },
      ],
    });
    useUIStore.setState({ cartOpen: true });

    renderDrawer();

    expect(document.querySelector('img[src=""]')).toBeNull();
    expect(
      screen.getByRole("img", { name: /no image available/i })
    ).toBeInTheDocument();
  });
});

describe("no un-sized quick adds", () => {
  it("ProductCard offers quick-add by size and a link to the product page", () => {
    render(
      <MemoryRouter>
        <ProductCard product={products[1]!} index={0} />
      </MemoryRouter>
    );
    const link = screen.getByRole("link", { name: /detail/i });
    expect(link).toHaveAttribute("href", "/product/p2");
    // Quick-add size buttons are present.
    expect(screen.getByRole("button", { name: "M" })).toBeInTheDocument();
  });

  it("Wishlist offers no add-to-bag for a sizeless piece", () => {
    useWishlistStore.setState({ items: [products[1]!] });
    render(
      <MemoryRouter>
        <Wishlist />
      </MemoryRouter>
    );
    const links = screen.getAllByRole("link", { name: /pilih ukuran/i });
    expect(links.length).toBeGreaterThan(0);
    expect(
      screen.queryByRole("button", { name: /^add$/i })
    ).not.toBeInTheDocument();
  });
});

describe("SizeGuide page", () => {
  it("renders the same shared chart as the dialog, plus how to measure", () => {
    render(
      <MemoryRouter>
        <SizeGuidePage />
      </MemoryRouter>
    );

    expect(screen.getAllByRole("table").length).toBeGreaterThanOrEqual(4);
    expect(screen.getByText(/cara mengukur/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /shop the drop/i })).toHaveAttribute(
      "href",
      "/shop"
    );
    expect(screen.getByRole("link", { name: /track order/i })).toHaveAttribute(
      "href",
      "/orders"
    );
  });
});

describe("Footer", () => {
  function renderFooter() {
    return render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    );
  }

  it("points every link at something that exists", () => {
    renderFooter();

    const hrefs = screen
      .getAllByRole("link")
      .map((a) => a.getAttribute("href") ?? "");

    // No dead in-page placeholders survive.
    expect(hrefs.some((h) => h === "#" || h === "")).toBe(false);

    expect(hrefs).toEqual(
      expect.arrayContaining(["/shop", "/shop?sort=new", "/size-guide", "/orders"])
    );
  });

  it("drops the aspirational links that describe unbuilt features", () => {
    renderFooter();

    expect(screen.queryByText("Best sellers")).not.toBeInTheDocument();
    expect(screen.queryByText("Archive sale")).not.toBeInTheDocument();
    expect(screen.queryByText("Gift cards")).not.toBeInTheDocument();
    expect(screen.queryByText("Shipping")).not.toBeInTheDocument();
    expect(screen.queryByText("Returns")).not.toBeInTheDocument();
    expect(screen.queryByText("Discord")).not.toBeInTheDocument();
  });

  it("hides every social channel and the legal row while unconfigured", () => {
    // `vitest.config.ts` pins VITE_SOCIAL_* and VITE_POLICY_* to "".
    renderFooter();

    expect(screen.queryByLabelText("Instagram")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("TikTok")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("X")).not.toBeInTheDocument();

    expect(screen.queryByText("Privacy")).not.toBeInTheDocument();
    expect(screen.queryByText("Terms")).not.toBeInTheDocument();
    expect(screen.queryByText("Cookies")).not.toBeInTheDocument();
  });
});

describe("OutfitBuilder", () => {
  function renderBuilder() {
    return render(
      <MemoryRouter>
        <OutfitBuilder />
      </MemoryRouter>
    );
  }

  it("refuses to bag a look with an unsized piece", async () => {
    const user = userEvent.setup();
    renderBuilder();

    // Pick the first top (Static Hoodie) into the look.
    await user.click(screen.getAllByRole("button", { name: /add to look/i })[0]!);
    await user.click(screen.getByRole("button", { name: /shop this look/i }));

    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it("bags the look once every piece has a size", async () => {
    const user = userEvent.setup();
    renderBuilder();

    await user.click(screen.getAllByRole("button", { name: /add to look/i })[0]!);
    // Size row appears for the selected piece.
    await user.click(screen.getByRole("button", { name: "L" }));
    await user.click(screen.getByRole("button", { name: /shop this look/i }));

    const { items } = useCartStore.getState();
    expect(items).toHaveLength(1);
    // The default slot is "bottom" → Wide Trousers / 003.
    expect(items[0].lineId).toBe("p3::L::?");
  });
});