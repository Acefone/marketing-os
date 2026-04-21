import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "fs";

vi.mock("fs");

import { getKBContext, getKBStatus } from "../src/services/kb-parser.service";

describe("getKBContext", () => {
  beforeEach(() => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue("Sample KB content" as unknown as ReturnType<typeof fs.readFileSync>);
  });

  it("returns empty string for be-dev (no KB)", () => {
    expect(getKBContext("be-dev")).toBe("");
  });

  it("returns empty string for unknown agent", () => {
    expect(getKBContext("unknown-agent")).toBe("");
  });

  it("prepends KB header for editor agent", () => {
    const ctx = getKBContext("editor");
    expect(ctx).toContain("KNOWLEDGE BASE CONTEXT");
    expect(ctx).toContain("KB-01");
  });

  it("includes all KB modules for content-writer", () => {
    const ctx = getKBContext("content-writer");
    ["KB-01", "KB-02", "KB-03", "KB-05", "KB-06", "KB-07", "KB-09"].forEach((id) => {
      expect(ctx).toContain(id);
    });
  });
});

describe("getKBStatus", () => {
  it("returns complete for files without [FILL IN]", () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue("Clean content" as unknown as ReturnType<typeof fs.readFileSync>);
    const statuses = getKBStatus();
    expect(Object.values(statuses).every((s) => s === "complete")).toBe(true);
  });

  it("returns draft for files with [FILL IN]", () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue("Content with [FILL IN] placeholder" as unknown as ReturnType<typeof fs.readFileSync>);
    const statuses = getKBStatus();
    expect(Object.values(statuses).every((s) => s === "draft")).toBe(true);
  });

  it("returns pending for missing files", () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    const statuses = getKBStatus();
    expect(Object.values(statuses).every((s) => s === "pending")).toBe(true);
  });
});
