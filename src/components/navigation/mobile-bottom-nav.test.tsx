import { render, screen, act } from "@testing-library/react";
import { usePathname } from "next/navigation";
import { MobileBottomNav } from "./mobile-bottom-nav";
import { MOBILE_NAV, getNavItem } from "./nav-config";

let unread = 0;

jest.mock("@/lib/auth/client", () => ({
  useUser: () => ({ user: { id: "u1", name: "Ada Lovelace", email: "a@b.c" }, isSignedIn: true, isLoaded: true }),
}));
jest.mock("@/lib/api", () => ({
  useQuery: jest.fn(() => unread),
  api: { conversations: { getTotalUnreadCount: "x" } },
}));
jest.mock("next/navigation", () => ({ usePathname: jest.fn(() => "/feed") }));
jest.mock("next/link", () => {
  const MockLink = ({ children, ...props }: any) => <a {...props}>{children}</a>;
  MockLink.displayName = "MockLink";
  return MockLink;
});

const mockedPath = usePathname as jest.Mock;

describe("MobileBottomNav", () => {
  beforeEach(() => {
    unread = 0;
    mockedPath.mockReturnValue("/feed");
  });

  it("renders exactly five icon-only links with accessible names and no visible text", () => {
    render(<MobileBottomNav />);
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(5);
    expect(links.map((l) => l.getAttribute("aria-label"))).toEqual([
      "Home", "Feeds", "Messages", "Search", "Profile",
    ]);
    // The Profile slot shows the avatar (initials fallback), never a text label.
    links.slice(0, 4).forEach((l) => expect(l.textContent?.trim()).toBe(""));
    expect(screen.queryByText("Profile")).not.toBeInTheDocument();
  });

  it("links to real, distinct routes", () => {
    render(<MobileBottomNav />);
    const hrefs = screen.getAllByRole("link").map((l) => l.getAttribute("href"));
    expect(hrefs).toEqual(["/feed", "/stories", "/messages", "/search", "/profile/me"]);
    expect(new Set(hrefs).size).toBe(5);
  });

  it("only references configured nav items", () => {
    expect(MOBILE_NAV).toHaveLength(5);
    MOBILE_NAV.filter((m) => m.itemId !== "profile").forEach((m) => {
      expect(() => getNavItem(m.itemId)).not.toThrow();
    });
  });

  it("marks the current route active and Search distinct from Explore", () => {
    mockedPath.mockReturnValue("/search");
    render(<MobileBottomNav />);
    expect(screen.getByLabelText("Search")).toHaveAttribute("aria-current", "page");
    expect(screen.getByLabelText("Home")).not.toHaveAttribute("aria-current");
  });

  it("keeps the Profile item active only for the user's own profile", () => {
    mockedPath.mockReturnValue("/profile/u1");
    const { unmount } = render(<MobileBottomNav />);
    expect(screen.getByLabelText("Profile")).toHaveAttribute("aria-current", "page");
    unmount();
    mockedPath.mockReturnValue("/profile/someone-else");
    render(<MobileBottomNav />);
    expect(screen.getByLabelText("Profile")).not.toHaveAttribute("aria-current");
  });

  it("announces unread messages in the accessible name", () => {
    unread = 4;
    render(<MobileBottomNav />);
    expect(screen.getByLabelText("Messages, 4 unread")).toBeInTheDocument();
  });

  it("hides while the on-screen keyboard is open", () => {
    const listeners: Record<string, () => void> = {};
    const vv = {
      height: 800,
      addEventListener: (e: string, cb: () => void) => { listeners[e] = cb; },
      removeEventListener: jest.fn(),
    };
    Object.defineProperty(window, "visualViewport", { value: vv, configurable: true });
    Object.defineProperty(window, "innerHeight", { value: 800, configurable: true });
    render(<MobileBottomNav />);
    expect(screen.queryAllByRole("link")).toHaveLength(5);
    act(() => {
      vv.height = 450;
      listeners.resize();
    });
    expect(screen.queryAllByRole("link")).toHaveLength(0);
    Object.defineProperty(window, "visualViewport", { value: undefined, configurable: true });
  });
});
