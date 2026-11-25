import { describe, expectTypeOf, it } from "vitest";
import type { HealthResponse } from "./index.js";

describe("HealthResponse", () => {
  it("only allows the ok status", () => {
    expectTypeOf<HealthResponse>().toEqualTypeOf<{ status: "ok" }>();
  });
});
