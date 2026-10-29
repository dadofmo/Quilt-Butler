import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { PATTERNS } from "@/lib/patterns";

/**
 * The site advertises a pattern count in metadata ("70+ patterns"). That number
 * goes stale whenever a pattern is added, and Google keeps showing the old one.
 * The rule: always advertise the largest multiple of ten that the real library
 * actually contains — never round up past what ships.
 */
const CLAIMS: { file: string; pattern: RegExp }[] = [
  { file: "index.html", pattern: /(\d+)\+ (?:quilt )?patterns/ },
  { file: "public/llms.txt", pattern: /(\d+)\+ (?:quilt )?patterns/ },
  { file: "src/pages/PatternPickerPage.tsx", pattern: /(\d+)\+ (?:quilt )?patterns/ },
];

describe("advertised pattern count", () => {
  const expected = Math.floor(PATTERNS.length / 10) * 10;

  it.each(CLAIMS)("$file advertises the real library size", ({ file, pattern }) => {
    const text = readFileSync(file, "utf8");
    const matches = [...text.matchAll(new RegExp(pattern, "g"))].map((m) =>
      Number(m[1]),
    );
    expect(matches.length).toBeGreaterThan(0);
    for (const claimed of matches) {
      expect(claimed).toBe(expected);
    }
  });
});
