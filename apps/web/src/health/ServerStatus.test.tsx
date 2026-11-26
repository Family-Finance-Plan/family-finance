import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { he } from "../locale/he";
import { ServerStatus } from "./ServerStatus";

describe("ServerStatus", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("shows that the server is up when /api/health returns ok", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(Response.json({ status: "ok" }));
    vi.stubGlobal("fetch", fetchMock);

    render(<ServerStatus />);

    expect(screen.getByRole("status").textContent).toBe(
      he.serverStatus.loading,
    );
    expect(await screen.findByText(he.serverStatus.ok)).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledWith("/api/health", expect.anything());
  });

  it("shows the error state when /api/health returns a non-2xx response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 500 })),
    );

    render(<ServerStatus />);

    expect(await screen.findByText(he.serverStatus.error)).toBeTruthy();
  });

  it("shows the error state when the server cannot be reached", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("Failed to fetch")),
    );

    render(<ServerStatus />);

    expect(await screen.findByText(he.serverStatus.error)).toBeTruthy();
  });
});
