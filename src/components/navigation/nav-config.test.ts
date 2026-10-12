import fs from "fs";
import path from "path";
import {
  NAV_ITEMS,
  getNavItem,
  getSidebarItems,
  isNavItemActive,
  isProfileActive,
  PROFILE_HREF,
} from "./nav-config";

const DASHBOARD_DIR = path.join(process.cwd(), "src", "app", "(dashboard)");

/** Collect URL patterns for every page.tsx under (dashboard), ignoring route groups/slots. */
function collectRoutes(dir: string, segs: string[] = [], out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      const name = entry.name;
      if (name.startsWith("@") || name.startsWith("(")) continue; // slots / intercepts
      collectRoutes(path.join(dir, name), [...segs, name], out);
    } else if (entry.name === "page.tsx") {
      out.push("/" + segs.join("/"));
    }
  }
  return out;
}

const routes = collectRoutes(DASHBOARD_DIR);

function routeExists(href: string): boolean {
  const p = href.split("#")[0].split("?")[0] || "/";
  return routes.some((route) => {
    const re = new RegExp(
      "^" + route.replace(/\[\[?\.{0,3}[^\]]+\]?\]/g, "[^/]+").replace(/\//g, "\\/") + "$"
    );
    return re.test(p);
  });
}

describe("nav-config", () => {
  it("has unique ids and hrefs-with-ids", () => {
    const ids = NAV_ITEMS.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("points every item at a page that exists in the route tree", () => {
    const missing = NAV_ITEMS.filter((i) => !routeExists(i.href)).map((i) => i.href);
    expect(missing).toEqual([]);
    expect(routeExists(PROFILE_HREF)).toBe(true);
  });

  it("detects invalid destinations (sanity check on the route matcher)", () => {
    expect(routeExists("/definitely-not-a-page")).toBe(false);
    expect(routeExists("/profile/abc123")).toBe(true);
  });

  it("contains every required desktop destination", () => {
    const labels = NAV_ITEMS.map((i) => i.label);
    for (const l of [
      "Explore", "Saved", "Groups", "Events", "Jobs", "Marketplace",
      "Research", "Resources", "Q&A", "Leaderboard",
      "Home", "Search", "Messages", "Notifications", "Create", "Settings",
    ]) {
      expect(labels).toContain(l);
    }
  });

  it("hides admin items from non-admins only", () => {
    expect(getSidebarItems().some((i) => i.id === "admin")).toBe(false);
    expect(getSidebarItems({ isAdmin: true }).some((i) => i.id === "admin")).toBe(true);
  });

  describe("isNavItemActive", () => {
    it("matches exact and nested paths", () => {
      expect(isNavItemActive(getNavItem("jobs"), "/jobs")).toBe(true);
      expect(isNavItemActive(getNavItem("jobs"), "/jobs/123")).toBe(true);
      expect(isNavItemActive(getNavItem("jobs"), "/jobs-other")).toBe(false);
    });

    it("treats / and /feed as Home and nothing else", () => {
      const home = getNavItem("home");
      expect(isNavItemActive(home, "/")).toBe(true);
      expect(isNavItemActive(home, "/feed")).toBe(true);
      expect(isNavItemActive(home, "/feedback")).toBe(false);
      expect(isNavItemActive(home, "/explore")).toBe(false);
    });

    it("maps community slugs and hashtags to their sections", () => {
      expect(isNavItemActive(getNavItem("groups"), "/c/robotics")).toBe(true);
      expect(isNavItemActive(getNavItem("groups"), "/communities/new")).toBe(true);
      expect(isNavItemActive(getNavItem("explore"), "/hashtag/ai")).toBe(true);
    });

    it("never marks action items or null paths active", () => {
      expect(isNavItemActive(getNavItem("create"), "/feed")).toBe(false);
      expect(isNavItemActive(getNavItem("home"), null)).toBe(false);
      expect(isNavItemActive(getNavItem("home"), undefined)).toBe(false);
    });
  });

  describe("isProfileActive", () => {
    it("is active for /profile/me and the user's own profile only", () => {
      expect(isProfileActive("/profile/me", null)).toBe(true);
      expect(isProfileActive("/profile/u1", "u1")).toBe(true);
      expect(isProfileActive("/profile/u1/activity", "u1")).toBe(true);
      expect(isProfileActive("/profile/u2", "u1")).toBe(false);
      expect(isProfileActive(null, "u1")).toBe(false);
    });
  });
});
