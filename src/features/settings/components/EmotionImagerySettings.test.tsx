import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { EmotionImagerySettings } from "./EmotionImagerySettings";

describe("EmotionImagerySettings", () => {
  it("renders one pictogram button for each of the 8 built-in tags", () => {
    render(<EmotionImagerySettings reducedMotion={false} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(8);
    expect(screen.getAllByRole("button", { name: /查看「/ })).toHaveLength(8);
  });

  it("opens the matching imagery and lets the user switch to related states", () => {
    render(<EmotionImagerySettings reducedMotion />);

    fireEvent.click(screen.getByRole("button", { name: /查看「平静」的意象/ }));

    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByText(/宽阔平缓湖面/)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "释然和解" }));
    expect(screen.getByText(/原本缠绕的小漩涡/)).toBeTruthy();
  });

  it("disables motion when reduced motion is requested", () => {
    const { rerender } = render(
      <EmotionImagerySettings reducedMotion={false} />
    );
    fireEvent.click(screen.getByRole("button", { name: /查看「愤怒」的意象/ }));
    expect(document.querySelector(".imagery-static")).toBeNull();

    rerender(<EmotionImagerySettings reducedMotion />);
    expect(document.querySelector(".imagery-static")).not.toBeNull();
  });
});
