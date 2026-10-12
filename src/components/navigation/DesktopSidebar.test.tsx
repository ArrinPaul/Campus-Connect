import { render, screen, fireEvent } from "@testing-library/react";
import { usePathname } from "next/navigation";
import { DesktopSidebar } from "./DesktopSidebar";

let dbUser: any = { name: "Ada Lovelace", username: "ada", is_admin: false };

jest.mock("@/lib/auth/client", () => ({
  useUser: () => ({ user: { id: "u1", name: "Fallback", email: "a@b.c" }, isSignedIn: true, isLoaded: true }),
  useAuthActions: () => ({ signOut: jest.fn() }),
}));
jest.mock("@/lib/api", () => ({
  useQuery: jest.fn((fn: string) => (fn === "me" ? dbUser : 0)),
  api: {
    notifications: { getUnreadCount: "n" },
    conversations: { getTotalUnreadCount: "c" },
    users: { getCurrentUser: "me" },
  },
}));
jest.mock("next-themes", () => ({ useTheme: () => ({ theme: "light", setTheme: jest.fn() }) }));
jest.mock("next/navigation", () => ({ usePathname: jest.fn(() => "/jobs/1") }));
jest.mock("next/link", () => {
  const MockLink = ({ children, ...props }: any) => <a {...props}>{children}</a>;
  MockLink.displayName = "MockLink";
  return MockLink;
});

describe("DesktopSidebar", () => {
  beforeEach(() => {
    dbUser = { name: "Ada Lovelace", username: "ada", is_admin: false };
    (usePathname as jest.Mock).mockReturnValue("/jobs/1");
  });

  it("shows every required destination with labels when expanded", () => {
    render(<DesktopSidebar isCollapsed={false} />);
    for (const l of ["Explore", "Saved", "Groups", "Events", "Jobs", "Marketplace", "Research", "Resources", "Q&A", "Leaderboard", "Home", "Search", "Messages", "Notifications", "Settings"]) {
      expect(screen.getByRole("link", { name: l })).toBeInTheDocument();
    }
  });

  it("derives identity from the authenticated user, linking to their profile", () => {
    render(<DesktopSidebar isCollapsed={false} />);
    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByText("@ada")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Ada Lovelace/ })).toHaveAttribute("href", "/profile/me");
  });

  it("marks the active route with aria-current", () => {
    render(<DesktopSidebar isCollapsed={false} />);
    expect(screen.getByRole("link", { name: "Jobs" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Events" })).not.toHaveAttribute("aria-current");
  });

  it("keeps accessible names but hides labels when collapsed", () => {
    render(<DesktopSidebar isCollapsed />);
    expect(screen.getByRole("link", { name: "Marketplace" })).toBeInTheDocument();
    expect(screen.queryByText("Marketplace")).not.toBeInTheDocument();
  });

  it("collapse toggle calls back and reflects state", () => {
    const toggle = jest.fn();
    render(<DesktopSidebar isCollapsed={false} onToggleCollapse={toggle} />);
    fireEvent.click(screen.getByRole("button", { name: "Collapse sidebar" }));
    expect(toggle).toHaveBeenCalledTimes(1);
  });

  it("shows Admin only to admins", () => {
    const { unmount } = render(<DesktopSidebar isCollapsed={false} />);
    expect(screen.queryByRole("link", { name: "Admin" })).not.toBeInTheDocument();
    unmount();
    dbUser = { ...dbUser, is_admin: true };
    render(<DesktopSidebar isCollapsed={false} />);
    expect(screen.getByRole("link", { name: "Admin" })).toHaveAttribute("href", "/admin/dashboard");
  });
});
