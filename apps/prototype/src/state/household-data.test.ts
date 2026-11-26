import { describe, expect, it } from "vitest";
import {
  commitIntake,
  createDemoHousehold,
  patchTransaction,
  saveFutureAmount,
  setReviewRows,
} from "./household-data";

describe("commitIntake", () => {
  it("imports approved rows only, skips duplicates marked 'skip' and extends coverage", () => {
    let data = createDemoHousehold();
    const before = data.transactions.length;
    data = setReviewRows(data, "doc-006", (rows) =>
      rows.map((r) =>
        r.id === "r01"
          ? { ...r, duplicateDecision: "skip", decision: "rejected" }
          : r.parseStatus === "unparsed"
            ? { ...r, decision: "rejected" }
            : { ...r, decision: "approved" },
      ),
    );
    const after = commitIntake(data, "doc-006");
    expect(after.transactions.length).toBe(before + 15);
    expect(after.coverage.find((c) => c.accountId === "acc-b")?.to).toBe(
      "2026-10-15",
    );
    expect(after.documents.find((d) => d.id === "doc-006")).toMatchObject({
      status: "partially-approved",
      approvedCount: 15,
      totalRows: 18,
    });
  });

  it("refuses to commit while a row is still pending (R-008)", () => {
    expect(() => commitIntake(createDemoHousehold(), "doc-006")).toThrow(
      "Every row needs a decision",
    );
  });
});

describe("history (R-010)", () => {
  it("keeps every changed field with its previous value", () => {
    const t = createDemoHousehold().transactions[0];
    if (!t) throw new Error("no demo data");
    const next = patchTransaction(
      t,
      { categoryId: "gas", description: t.description },
      "Parent A",
      "2026-10-15T10:00",
    );
    expect(next.history).toEqual([
      {
        at: "2026-10-15T10:00",
        by: "Parent A",
        field: "categoryId",
        from: String(t.categoryId),
        to: "gas",
      },
    ]);
  });

  it("applies a saved future amount from that month onward and keeps the previous value", () => {
    const data = saveFutureAmount(
      createDemoHousehold(),
      "f04",
      490000,
      "Parent A",
      "2026-10-15T10:00",
    );
    const nov = data.futureItems.find((f) => f.id === "f04");
    const dec = data.futureItems.find((f) => f.id === "f09");
    expect(nov?.amountAgorot).toBe(490000);
    expect(dec?.amountAgorot).toBe(490000);
    expect(nov?.history[0]).toMatchObject({
      effectiveFrom: "2026-11-01",
      from: 485000,
      to: 490000,
    });
  });
});
