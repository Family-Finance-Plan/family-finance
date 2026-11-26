import { describe, expect, it } from "vitest";
import {
  addMonths,
  agorotToDecimalString,
  formatAmount,
  formatCompactShekels,
  formatDate,
  formatMonth,
  parseAmountInput,
} from "./format";

/** Drops bidi marks and turns non-breaking spaces into spaces so expectations stay readable. */
const plain = (s: string) => s.replace(/[‎‏]/g, "").replace(/ /g, " ");

describe("agorotToDecimalString", () => {
  it("builds the decimal string with integer arithmetic", () => {
    expect(agorotToDecimalString(123456)).toBe("1234.56");
    expect(agorotToDecimalString(5)).toBe("0.05");
    expect(agorotToDecimalString(-1290)).toBe("-12.90");
    expect(agorotToDecimalString(0)).toBe("0.00");
  });

  it("stays exact for large values where float division would drift", () => {
    expect(agorotToDecimalString(1_000_000_000_001)).toBe("10000000000.01");
    expect(agorotToDecimalString(29)).toBe("0.29");
  });

  it("rejects non-integer amounts", () => {
    expect(() => agorotToDecimalString(12.5)).toThrow(TypeError);
  });
});

describe("formatAmount", () => {
  it("formats agorot as ILS with 2 decimals by default", () => {
    expect(plain(formatAmount(123456))).toBe("+1,234.56 ₪");
    expect(plain(formatAmount(123456, { sign: "none" }))).toBe("1,234.56 ₪");
  });

  it("rounds to whole shekels with decimals 0", () => {
    expect(plain(formatAmount(123456, { decimals: 0, sign: "none" }))).toBe(
      "1,235 ₪",
    );
    expect(plain(formatAmount(123449, { decimals: 0, sign: "none" }))).toBe(
      "1,234 ₪",
    );
  });

  it("uses a true minus sign for negative values and no sign for zero", () => {
    expect(plain(formatAmount(-48000))).toBe("−480.00 ₪");
    expect(plain(formatAmount(0))).toBe("0.00 ₪");
  });

  it("formats exact values that floats get wrong", () => {
    // 0.1 + 0.2 in floats is 0.30000000000000004; in agorot it is 10 + 20.
    expect(plain(formatAmount(10 + 20, { sign: "none" }))).toBe("0.30 ₪");
  });

  it("formats compact axis labels in whole thousands", () => {
    expect(plain(formatCompactShekels(1_000_000, "אלף"))).toBe("10 אלף ₪");
    expect(plain(formatCompactShekels(50_000, "אלף"))).toBe("500 ₪");
  });
});

describe("parseAmountInput", () => {
  it("parses typed shekels into integer agorot", () => {
    expect(parseAmountInput("1,234.5")).toBe(123450);
    expect(parseAmountInput("48")).toBe(4800);
    expect(parseAmountInput("0.29")).toBe(29);
  });

  it("rejects invalid input", () => {
    expect(parseAmountInput("abc")).toBeNull();
    expect(parseAmountInput("1.234")).toBeNull();
    expect(parseAmountInput("-5")).toBeNull();
  });
});

describe("dates", () => {
  it("formats ISO dates by slicing", () => {
    expect(formatDate("2026-10-03")).toBe("03/10/2026");
  });

  it("formats months in Hebrew and shifts months with integer arithmetic", () => {
    expect(formatMonth("2026-10")).toBe("אוקטובר 2026");
    expect(addMonths("2026-11", 2)).toBe("2027-01");
    expect(addMonths("2026-01", -1)).toBe("2025-12");
  });
});
