import "@testing-library/jest-dom";

// jsdom doesn't implement matchMedia; some shadcn primitives use it.
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

// localStorage is used by the planner store; jsdom already provides it,
// but make absolutely sure it's clean between tests.
import { beforeEach } from "vitest";

beforeEach(() => {
  try {
    window.localStorage.clear();
  } catch {
    /* noop */
  }
});
