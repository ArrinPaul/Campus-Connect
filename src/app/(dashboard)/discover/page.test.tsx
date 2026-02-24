import { render, screen } from "@testing-library/react"

const mockReplace = jest.fn()

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace, push: jest.fn() }),
}))

// Import statically - no dynamic import needed
import DiscoverPage from "./page"

describe("DiscoverPage", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders redirecting text", () => {
    render(<DiscoverPage />)
    expect(screen.getByText(/Redirecting/i)).toBeInTheDocument()
  })

  it("calls router.replace with /explore", () => {
    render(<DiscoverPage />)
    expect(mockReplace).toHaveBeenCalledWith("/explore")
  })
})
