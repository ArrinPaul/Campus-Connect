import fs from "fs";
import path from "path";

/**
 * Guards against links to pages that don't exist (e.g. /communities/<slug>
 * when community pages actually live at /c/<slug>). Scans literal and
 * template-string hrefs / router calls in components and pages and checks
 * each against the App Router page tree.
 */

const APP_DIR = path.join(process.cwd(), "src", "app");
const SRC_DIR = path.join(process.cwd(), "src");

function walk(dir: string, out: string[] = []): string[] {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

function routePatterns(): RegExp[] {
  const patterns: RegExp[] = [/^\/$/];
  for (const file of walk(APP_DIR)) {
    if (path.basename(file) !== "page.tsx") continue;
    const rel = path.relative(APP_DIR, path.dirname(file)).split(path.sep);
    // Parallel slots (@modal) and intercepting routes ((.)post) are not
    // standalone URLs; dropping their segment would create a bogus /[id] route.
    if (rel.some((s) => s.startsWith("@") || s.startsWith("(."))) continue;
    const segs = rel.filter((s) => s && !s.startsWith("(") && !s.startsWith("@"));
    const body = segs
      .map((s) =>
        s.startsWith("[[")
          ? "(?:/[^/]+)*"
          : s.startsWith("[")
          ? "/[^/]+"
          : "/" + s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      )
      .join("");
    patterns.push(new RegExp(`^${body}/?$`));
  }
  return patterns;
}

const LINK_PATTERNS: RegExp[] = [
  /href=["'](\/[^"'`{}\s]*)["']/g,
  /href=\{`(\/[^`]*)`\}/g,
  /(?:push|replace|redirect)\(\s*`(\/[^`]*)`/g,
  /(?:push|replace|redirect)\(\s*["'](\/[^"']*)["']/g,
];

describe("internal links", () => {
  it("every literal internal link resolves to an existing page", () => {
    const patterns = routePatterns();
    const broken: string[] = [];

    for (const file of walk(SRC_DIR)) {
      if (!file.endsWith(".tsx") || /\.test\./.test(file)) continue;
      if (file.includes(`${path.sep}api${path.sep}`)) continue;
      const src = fs.readFileSync(file, "utf8");
      for (const rx of LINK_PATTERNS) {
        for (const m of Array.from(src.matchAll(rx))) {
          const p = m[1].split("#")[0].split("?")[0].replace(/\$\{[^}]*\}/g, "X");
          if (!p || p.startsWith("/api/")) continue;
          if (!patterns.some((r) => r.test(p))) {
            broken.push(`${m[1]}  (${path.relative(process.cwd(), file)})`);
          }
        }
      }
    }

    expect(broken).toEqual([]);
  });
});
