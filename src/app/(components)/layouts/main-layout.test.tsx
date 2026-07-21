import { render, screen } from "@testing-library/react";
import { MainLayout } from "./main-layout";

// Mock child components
jest.mock("@/components/navigation/DesktopSidebar", () => ({
  DesktopSidebar: () => <div data-testid="desktop-sidebar">Sidebar</div>,
}));

jest.mock("@/components/navigation/MobileTopBar", () => ({
  MobileTopBar: () => <div data-testid="mobile-topbar">TopBar</div>,
}));

jest.mock("@/components/navigation/mobile-bottom-nav", () => ({
  MobileBottomNav: () => <div data-testid="mobile-bottomnav">BottomNav</div>,
}));

describe("MainLayout", () => {
  it("renders main element with padding classes separating content from central section borders", () => {
    const { container } = render(
      <MainLayout>
        <div>Test Central Section Content</div>
      </MainLayout>
    );

    const mainElement = container.querySelector("main");
    expect(mainElement).toBeInTheDocument();
    expect(mainElement).toHaveClass("border-x");
    expect(mainElement).toHaveClass("px-4");
    expect(mainElement).toHaveClass("md:px-6");
  });
});
