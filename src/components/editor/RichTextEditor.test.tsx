import { render, screen, fireEvent } from "@testing-library/react"
import { RichTextEditor, CompactRichTextEditor } from "./RichTextEditor"

// ── Mock TipTap internals ──────────────────────────────────────────────────────

const mockCommands: Record<string, jest.Mock> = {
  toggleBold: jest.fn(() => mockCommands),
  toggleItalic: jest.fn(() => mockCommands),
  toggleStrike: jest.fn(() => mockCommands),
  toggleCode: jest.fn(() => mockCommands),
  toggleHeading: jest.fn(() => mockCommands),
  toggleBulletList: jest.fn(() => mockCommands),
  toggleOrderedList: jest.fn(() => mockCommands),
  toggleBlockquote: jest.fn(() => mockCommands),
  toggleCodeBlock: jest.fn(() => mockCommands),
  setHorizontalRule: jest.fn(() => mockCommands),
  clearContent: jest.fn(() => mockCommands),
  setContent: jest.fn(() => mockCommands),
  run: jest.fn(),
  focus: jest.fn(() => mockCommands),
}

const mockIsActive = jest.fn().mockReturnValue(false)
const mockGetCharacterCount = jest.fn().mockReturnValue(0)
const mockGetHTML = jest.fn().mockReturnValue("<p></p>")

const mockEditor = {
  chain: jest.fn(() => ({ focus: jest.fn(() => mockCommands) })),
  isActive: mockIsActive,
  storage: {
    characterCount: {
      characters: mockGetCharacterCount,
    },
  },
  getHTML: mockGetHTML,
  isEmpty: true,
  setEditable: jest.fn(),
  commands: {
    setContent: jest.fn(),
  },
  getAttributes: jest.fn(() => ({ href: "" })),
}

jest.mock("@tiptap/react", () => ({
  useEditor: jest.fn(() => mockEditor),
  EditorContent: ({ editor }: any) => (
    <div
      data-testid="editor-content"
      contentEditable
      suppressContentEditableWarning
    />
  ),
  BubbleMenu: ({ children }: any) => (
    <div data-testid="bubble-menu">{children}</div>
  ),
}))

jest.mock("@tiptap/starter-kit", () => ({
  __esModule: true,
  default: { configure: jest.fn(() => ({})) },
}))
jest.mock("@tiptap/extension-link", () => ({
  __esModule: true,
  default: { configure: jest.fn(() => ({})) },
}))
jest.mock("@tiptap/extension-placeholder", () => ({
  __esModule: true,
  default: { configure: jest.fn(() => ({})) },
}))
jest.mock("@tiptap/extension-character-count", () => ({
  __esModule: true,
  default: { configure: jest.fn(() => ({})) },
}))
jest.mock("@tiptap/extension-mention", () => ({
  __esModule: true,
  default: { configure: jest.fn(() => ({})) },
}))

jest.mock("./MarkdownRenderer", () => ({
  MarkdownRenderer: ({ content }: any) => (
    <div data-testid="markdown-preview">{content}</div>
  ),
}))

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("RichTextEditor", () => {
  const mockOnChange = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockEditor.isEmpty = true
    mockIsActive.mockReturnValue(false)
  })

  it("renders the editor content area", () => {
    render(<RichTextEditor value="" onChange={mockOnChange} />)
    expect(screen.getByTestId("editor-content")).toBeInTheDocument()
  })

  it("renders toolbar buttons", () => {
    render(<RichTextEditor value="" onChange={mockOnChange} />)
    expect(screen.getByTitle("Bold (Ctrl+B)")).toBeInTheDocument()
    expect(screen.getByTitle("Italic (Ctrl+I)")).toBeInTheDocument()
  })

  it("renders heading toolbar buttons", () => {
    render(<RichTextEditor value="" onChange={mockOnChange} />)
    expect(screen.getByTitle("Heading 1")).toBeInTheDocument()
    expect(screen.getByTitle("Heading 2")).toBeInTheDocument()
    expect(screen.getByTitle("Heading 3")).toBeInTheDocument()
  })

  it("renders list toolbar buttons", () => {
    render(<RichTextEditor value="" onChange={mockOnChange} />)
    expect(screen.getByTitle("Bullet list")).toBeInTheDocument()
    expect(screen.getByTitle("Numbered list")).toBeInTheDocument()
  })

  it("renders edit/preview toggle buttons", () => {
    render(<RichTextEditor value="" onChange={mockOnChange} />)
    expect(screen.getByTitle("Edit mode")).toBeInTheDocument()
    expect(screen.getByTitle("Preview markdown")).toBeInTheDocument()
  })

  it("switches to preview pane on preview button click", () => {
    render(<RichTextEditor value="# Hello" onChange={mockOnChange} />)
    fireEvent.mouseDown(screen.getByTitle("Preview markdown"))
    expect(screen.getByTestId("markdown-preview")).toBeInTheDocument()
  })

  it("shows character count", () => {
    mockGetCharacterCount.mockReturnValue(42)
    render(<RichTextEditor value="" onChange={mockOnChange} maxLength={500} />)
    expect(screen.getByText(/42\s*\/\s*500/)).toBeInTheDocument()
  })

  it("calls setEditable(false) on the editor when disabled=true", () => {
    render(<RichTextEditor value="" onChange={mockOnChange} disabled />)
    expect(mockEditor.setEditable).toHaveBeenCalledWith(false)
  })
})

describe("CompactRichTextEditor", () => {
  const mockOnChange = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockEditor.isEmpty = true
  })

  it("renders editor content area", () => {
    render(<CompactRichTextEditor value="" onChange={mockOnChange} />)
    expect(screen.getByTestId("editor-content")).toBeInTheDocument()
  })

  it("does not render a full toolbar (no heading buttons)", () => {
    render(<CompactRichTextEditor value="" onChange={mockOnChange} />)
    expect(screen.queryByTitle("Heading 1")).not.toBeInTheDocument()
  })

  it("does not render block-level list buttons", () => {
    render(<CompactRichTextEditor value="" onChange={mockOnChange} />)
    expect(screen.queryByTitle("Bullet list")).not.toBeInTheDocument()
    expect(screen.queryByTitle("Numbered list")).not.toBeInTheDocument()
  })
})
