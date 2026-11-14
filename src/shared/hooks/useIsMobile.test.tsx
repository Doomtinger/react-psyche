import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { IsMobileProvider, useIsMobile } from "./useIsMobile";

let matches = false;
const listeners = new Set<() => void>();

function Probe() {
  const value = useIsMobile();
  return <span data-testid="mobile">{value === null ? "null" : String(value)}</span>;
}

function renderProbe() {
  return render(
    <IsMobileProvider>
      <Probe />
    </IsMobileProvider>
  );
}

beforeEach(() => {
  matches = false;
  listeners.clear();
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      media: query,
      get matches() {
        return matches;
      },
      addEventListener: (_: string, cb: () => void) => listeners.add(cb),
      removeEventListener: (_: string, cb: () => void) => listeners.delete(cb),
    })),
  });
});

afterEach(() => {
  delete document.documentElement.dataset.mobile;
});

describe("useIsMobile", () => {
  it("measures the viewport and exposes it to CSS", () => {
    matches = true;
    renderProbe();
    expect(screen.getByTestId("mobile").textContent).toBe("true");
    expect(document.documentElement.dataset.mobile).toBe("true");
  });

  it("reports desktop for wider viewports", () => {
    matches = false;
    renderProbe();
    expect(screen.getByTestId("mobile").textContent).toBe("false");
    expect(document.documentElement.dataset.mobile).toBe("false");
  });

  it("follows viewport changes (rotation / resize)", () => {
    matches = false;
    renderProbe();
    expect(screen.getByTestId("mobile").textContent).toBe("false");

    act(() => {
      matches = true;
      listeners.forEach((cb) => cb());
    });
    expect(screen.getByTestId("mobile").textContent).toBe("true");
    expect(document.documentElement.dataset.mobile).toBe("true");
  });

  it("is safe when matchMedia is unavailable", () => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      writable: true,
      value: undefined,
    });
    renderProbe();
    expect(screen.getByTestId("mobile").textContent).toBe("null");
  });
});
