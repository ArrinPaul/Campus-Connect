import { render, screen } from "@testing-library/react"
import DashboardLayout from "./layout"

// Mock the v2 layout components
jest.mock("@/app/(components)/layouts/main-layout", () => ({
  MainLayout: ({ children }: any) => (
    <div data-testid="main-layout">
      {children}
    </div>
  ),
}))

describe("DashboardLayout", () => {
  it("should render MainLayout", () => {
    render(
      <DashboardLayout modal={null}>
        <div>Test Content</div>
      </DashboardLayout>
    )

    expect(screen.getByTestId("main-layout")).toBeInTheDocument()
  })

  it("should render children content", () => {
    render(
      <DashboardLayout modal={null}>
        <div data-testid="child-content">Test Content</div>
      </DashboardLayout>
    )

    const childContent = screen.getByTestId("child-content")
    expect(childContent).toBeInTheDocument()
    expect(childContent).toHaveTextContent("Test Content")
  })
})
