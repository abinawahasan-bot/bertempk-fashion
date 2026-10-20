import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// jsdom (v30) provides crypto.randomUUID natively, so no polyfill is needed.
// Guard only in case the environment ever lacks it.
if (typeof globalThis.crypto?.randomUUID !== "function") {
  const rand = () => Math.random().toString(36).slice(2);
  Object.defineProperty(globalThis.crypto ?? {}, "randomUUID", {
    value: () =>
      "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (ch) => {
        const r = (Math.random() * 16) | 0;
        const v = ch === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      }) + rand(),
    configurable: true,
  });
}

// jsdom lacks matchMedia; motion reads it for reduced-motion detection.
if (typeof window.matchMedia !== "function") {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

// jsdom lacks ResizeObserver; motion/layout utilities may probe it.
if (typeof window.ResizeObserver !== "function") {
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  Object.defineProperty(window, "ResizeObserver", {
    writable: true,
    value: ResizeObserverStub,
  });
}

// jsdom lacks IntersectionObserver; motion's `whileInView` (ProductCard,
// Hero, …) throws on mount without it. Never fires — everything stays at its
// initial state, which is what unit tests assert on anyway.
if (typeof window.IntersectionObserver !== "function") {
  class IntersectionObserverStub {
    readonly root = null;
    readonly rootMargin = "";
    readonly thresholds: readonly number[] = [];
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  }
  Object.defineProperty(window, "IntersectionObserver", {
    writable: true,
    value: IntersectionObserverStub,
  });
  Object.defineProperty(globalThis, "IntersectionObserver", {
    writable: true,
    value: IntersectionObserverStub,
  });
}

afterEach(() => {
  cleanup();
  localStorage.clear();
});
