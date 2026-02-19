import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { MediaGallery } from "@/components/posts/MediaGallery"

// Mock Next.js Image  
jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ src, alt, fill: _fill, sizes: _sizes, priority: _priority, ...props }: any) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img src={src} alt={alt} {...props} />
  },
}))

// Mock lucide-react icons
jest.mock("lucide-react", () => ({
  Play: () => <svg data-testid="play-icon" />,
  FileText: () => <svg data-testid="filetext-icon" />,
  Download: () => <svg data-testid="download-icon" />,
  X: () => <svg data-testid="x-icon" />,
  ChevronLeft: () => <svg data-testid="chevleft-icon" />,
  ChevronRight: () => <svg data-testid="chevright-icon" />,
  ZoomIn: () => <svg data-testid="zoomin-icon" />,
}))

describe("MediaGallery", () => {
  it("renders nothing when no URLs provided", () => {
    const { container } = render(
      <MediaGallery mediaUrls={[]} mediaType="image" />
    )
    expect(container.firstChild).toBeNull()
  })

  it("renders file attachment list for file type", () => {
    render(
      <MediaGallery
        mediaUrls={["https://cdn.example.com/doc.pdf"]}
        mediaType="file"
        mediaFileNames={["document.pdf"]}
      />
    )
    expect(screen.getByText("document.pdf")).toBeInTheDocument()
    expect(screen.getByRole("link")).toHaveAttribute("href", "https://cdn.example.com/doc.pdf")
  })

  it("renders video player for video type", () => {
    const { container } = render(
      <MediaGallery
        mediaUrls={["https://cdn.example.com/video.mp4"]}
        mediaType="video"
      />
    )
    const video = container.querySelector("video")
    expect(video).toBeInTheDocument()
    expect(video).toHaveAttribute("src", "https://cdn.example.com/video.mp4")
  })

  it("renders single image", () => {
    render(
      <MediaGallery
        mediaUrls={["https://cdn.example.com/image.jpg"]}
        mediaType="image"
        altPrefix="Test"
      />
    )
    const img = screen.getByAltText("Test 1")
    expect(img).toBeInTheDocument()
  })

  it("renders grid for multiple images", () => {
    const urls = [
      "https://cdn.example.com/a.jpg",
      "https://cdn.example.com/b.jpg",
      "https://cdn.example.com/c.jpg",
    ]
    const { container } = render(
      <MediaGallery mediaUrls={urls} mediaType="image" />
    )
    const buttons = container.querySelectorAll("button")
    // 3 image buttons
    expect(buttons.length).toBe(3)
  })

  it("shows +N overlay when more than 4 images", () => {
    const urls = Array.from({ length: 7 }, (_, i) => `https://cdn.example.com/${i}.jpg`)
    render(<MediaGallery mediaUrls={urls} mediaType="image" />)
    expect(screen.getByText("+3")).toBeInTheDocument()
  })

  it("opens lightbox when image is clicked", () => {
    render(
      <MediaGallery
        mediaUrls={["https://cdn.example.com/a.jpg", "https://cdn.example.com/b.jpg"]}
        mediaType="image"
        altPrefix="Photo"
      />
    )
    const firstBtn = screen.getByLabelText("View Photo 1")
    fireEvent.click(firstBtn)
    // Lightbox should appear (dialog role)
    expect(screen.getByRole("dialog")).toBeInTheDocument()
  })

  it("closes lightbox when clicking the close button", () => {
    render(
      <MediaGallery
        mediaUrls={["https://cdn.example.com/a.jpg"]}
        mediaType="image"
        altPrefix="Photo"
      />
    )
    fireEvent.click(screen.getByLabelText("View Photo 1"))
    expect(screen.getByRole("dialog")).toBeInTheDocument()
    fireEvent.click(screen.getByLabelText("Close lightbox"))
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })
})
