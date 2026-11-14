import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { EmotionImagerySettings } from "./EmotionImagerySettings";
import { IMAGERY_IDS } from "../emotionImagery";

describe("EmotionImagerySettings", () => {
  it("renders one pictogram button for each of the 9 built-in tags", () => {
    render(<EmotionImagerySettings reducedMotion={false} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(9);
    expect(screen.getAllByRole("button", { name: /查看「/ })).toHaveLength(9);
    expect(screen.getByText("未预设 · 可任选")).toBeTruthy();
  });

  it("opens the matching imagery and lets the user switch to related states", () => {
    render(<EmotionImagerySettings reducedMotion />);

    fireEvent.click(screen.getByRole("button", { name: /查看「平静」的意象/ }));

    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByText(/宽阔平缓湖面/)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "释然和解" }));
    expect(screen.getByText(/原本缠绕的小漩涡/)).toBeTruthy();
  });

  it("lets 其他 pick any of the 11 imagery states", () => {
    render(<EmotionImagerySettings reducedMotion />);

    fireEvent.click(screen.getByRole("button", { name: /查看「其他」的意象/ }));

    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(document.querySelectorAll(".imagery-switch button")).toHaveLength(
      IMAGERY_IDS.length
    );

    fireEvent.click(screen.getByRole("button", { name: "狂喜惊喜" }));
    expect(screen.getByText(/一簇缓慢绽放/)).toBeTruthy();
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
