import { render, screen } from "@testing-library/react"
import { MarkdownRenderer } from "./MarkdownRenderer"

// Mock react-markdown and its plugins to avoid ESM/browser limitations in Jest
jest.mock("react-markdown", () => ({
  __esModule: true,
  default: ({ children }: { children: string }) => (
    <div data-testid="react-markdown">{children}</div>
  ),
}))
jest.mock("remark-gfm", () => ({ __esModule: true, default: () => {} }))
jest.mock("remark-math", () => ({ __esModule: true, default: () => {} }))
jest.mock("rehype-katex", () => ({ __esModule: true, default: () => {} }))
jest.mock("rehype-highlight", () => ({ __esModule: true, default: () => {} }))
jest.mock("rehype-raw", () => ({ __esModule: true, default: () => {} }))

describe("MarkdownRenderer", () => {
  it("renders without crashing", () => {
    render(<MarkdownRenderer content="Hello world" />)
    expect(screen.getByTestId("react-markdown")).toBeInTheDocument()
  })

  it("passes content to ReactMarkdown", () => {
    render(<MarkdownRenderer content="**bold text**" />)
    expect(screen.getByTestId("react-markdown")).toHaveTextContent("**bold text**")
  })

  it("applies compact prose classes when compact=true", () => {
    const { container } = render(<MarkdownRenderer content="text" compact />)
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.className).toContain("prose-sm")
  })

  it("applies additional className", () => {
    const { container } = render(
      <MarkdownRenderer content="text" className="custom-class" />
    )
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.className).toContain("custom-class")
  })

  it("handles empty content gracefully", () => {
    render(<MarkdownRenderer content="" />)
    expect(screen.getByTestId("react-markdown")).toBeInTheDocument()
  })

  it("handles null/undefined content gracefully", () => {
    // @ts-expect-error testing undefined
    expect(() => render(<MarkdownRenderer content={undefined} />)).not.toThrow()
  })

  it("renders with dark prose classes", () => {
    const { container } = render(<MarkdownRenderer content="text" />)
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.className).toContain("dark:prose-invert")
  })
})
