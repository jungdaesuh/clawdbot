import { describe, expect, it } from "vitest";

import { isExplicitUntrustedConfirmation } from "./tool-gate.js";

describe("tool gate confirmation", () => {
  it("accepts explicit confirmations", () => {
    expect(isExplicitUntrustedConfirmation("confirm")).toBe(true);
    expect(isExplicitUntrustedConfirmation("confirm please")).toBe(true);
    expect(isExplicitUntrustedConfirmation("yes, proceed")).toBe(true);
    expect(isExplicitUntrustedConfirmation("yes proceed now")).toBe(true);
  });

  it("rejects ambiguous confirmations", () => {
    expect(isExplicitUntrustedConfirmation("yes")).toBe(false);
    expect(isExplicitUntrustedConfirmation("okay")).toBe(false);
    expect(isExplicitUntrustedConfirmation("confirming")).toBe(false);
    expect(isExplicitUntrustedConfirmation("")).toBe(false);
  });
});
