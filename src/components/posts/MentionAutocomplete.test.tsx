import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MentionAutocomplete } from './MentionAutocomplete'

// Mock convex/react
jest.mock('convex/react', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(() => jest.fn()),
  ConvexProvider: ({ children }: any) => children,
  ConvexReactClient: jest.fn(),
}))

// Mock next/image to render a plain <img> so src attributes are testable
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: any) => <img src={src} alt={alt} {...props} />,
}))

import { useQuery, ConvexProvider, ConvexReactClient } from 'convex/react'
const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>
const mockConvexClient = new (ConvexReactClient as any)()

// Mock test data
const mockUsers = [
  {
    _id: 'user1',
    name: 'John Doe',
    username: 'johndoe',
    profilePicture: 'https://example.com/john.jpg',
  },
  {
    _id: 'user2',
    name: 'Jane Smith',
    username: 'janesmith',
    profilePicture: undefined,
  },
  {
    _id: 'user3',
    name: 'Bob Wilson',
    username: 'bobwilson',
    profilePicture: 'https://example.com/bob.jpg',
  },
]

describe('MentionAutocomplete', () => {
  const mockOnSelect = jest.fn()
  const mockOnClose = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  const renderComponent = (query: string = 'john', users: any = mockUsers) => {
    mockUseQuery.mockReturnValue(users)

    return render(
      <ConvexProvider client={mockConvexClient}>
        <MentionAutocomplete
          query={query}
          onSelect={mockOnSelect}
          onClose={mockOnClose}
        />
      </ConvexProvider>
    )
  }

  describe('Rendering', () => {
    it('should render list of users', () => {
      renderComponent()
      
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('@johndoe')).toBeInTheDocument()
      expect(screen.getByText('Jane Smith')).toBeInTheDocument()
      expect(screen.getByText('@janesmith')).toBeInTheDocument()
      expect(screen.getByText('Bob Wilson')).toBeInTheDocument()
      expect(screen.getByText('@bobwilson')).toBeInTheDocument()
    })

    it('should not render when no users found', () => {
      mockUseQuery.mockReturnValue([])
      const { container } = render(
        <ConvexProvider client={mockConvexClient}>
          <MentionAutocomplete
            query="nonexistent"
            onSelect={mockOnSelect}
            onClose={mockOnClose}
          />
        </ConvexProvider>
      )
      
      expect(container.firstChild).toBeNull()
    })

    it('should not render when users is undefined', () => {
      mockUseQuery.mockReturnValue(undefined)
      const { container } = render(
        <ConvexProvider client={mockConvexClient}>
          <MentionAutocomplete
            query="john"
            onSelect={mockOnSelect}
            onClose={mockOnClose}
          />
        </ConvexProvider>
      )
      
      expect(container.firstChild).toBeNull()
    })

    it('should display profile pictures when available', () => {
      renderComponent()
      
      const images = screen.getAllByRole('img')
      expect(images).toHaveLength(2) // john and bob have pictures
      expect(images[0]).toHaveAttribute('src', 'https://example.com/john.jpg')
      expect(images[1]).toHaveAttribute('src', 'https://example.com/bob.jpg')
    })

    it('should display placeholder when no profile picture', () => {
      renderComponent()
      
      // Jane doesn't have a profile picture, should show User icon placeholder
      const janeContainer = screen.getByText('Jane Smith').parentElement?.parentElement
      expect(janeContainer).toBeInTheDocument()
    })

    it('should apply custom position styles', () => {
      mockUseQuery.mockReturnValue(mockUsers)
      const { container } = render(
        <ConvexProvider client={mockConvexClient}>
          <MentionAutocomplete
            query="john"
            onSelect={mockOnSelect}
            onClose={mockOnClose}
            position={{ top: 100, left: 50 }}
          />
        </ConvexProvider>
      )
      
      const dropdown = container.firstChild as HTMLElement
      expect(dropdown).toHaveStyle({ top: '100px', left: '50px' })
    })
  })

  describe('Interactions', () => {
    it('should call onSelect when user is clicked', () => {
      renderComponent()
      
      const johnButton = screen.getByText('John Doe').closest('button')!
      fireEvent.click(johnButton)
      
      expect(mockOnSelect).toHaveBeenCalledWith('johndoe')
      expect(mockOnSelect).toHaveBeenCalledTimes(1)
    })

    it('should highlight user on mouse enter', () => {
      renderComponent()
      
      const janeButton = screen.getByText('Jane Smith').closest('button')!
      
      // Initially should not be highlighted
      expect(janeButton).not.toHaveClass('bg-muted')
      
      // Hover should highlight
      fireEvent.mouseEnter(janeButton)
      expect(janeButton).toHaveClass('bg-muted')
    })

    it('should select different users', () => {
      renderComponent()
      
      const johnButton = screen.getByText('John Doe').closest('button')!
      fireEvent.click(johnButton)
      expect(mockOnSelect).toHaveBeenCalledWith('johndoe')
      
      mockOnSelect.mockClear()
      
      const janeButton = screen.getByText('Jane Smith').closest('button')!
      fireEvent.click(janeButton)
      expect(mockOnSelect).toHaveBeenCalledWith('janesmith')
    })
  })

  describe('Keyboard Navigation', () => {
    it('should navigate down with ArrowDown key', async () => {
      renderComponent()
      
      // First user should be selected by default
      const firstButton = screen.getByText('John Doe').closest('button')!
      expect(firstButton).toHaveClass('bg-muted')
      
      // Press ArrowDown
      fireEvent.keyDown(document, { key: 'ArrowDown' })
      
      await waitFor(() => {
        const secondButton = screen.getByText('Jane Smith').closest('button')!
        expect(secondButton).toHaveClass('bg-muted')
      })
    })

    it('should navigate up with ArrowUp key', async () => {
      renderComponent()
      
      // Navigate down twice
      fireEvent.keyDown(document, { key: 'ArrowDown' })
      fireEvent.keyDown(document, { key: 'ArrowDown' })
      
      // Then navigate up once
      fireEvent.keyDown(document, { key: 'ArrowUp' })
      
      await waitFor(() => {
        const secondButton = screen.getByText('Jane Smith').closest('button')!
        expect(secondButton).toHaveClass('bg-muted')
      })
    })

    it('should wrap around when navigating up from first item', () => {
      renderComponent()
      
      // Try to navigate up from first item - should wrap to last
      fireEvent.keyDown(document, { key: 'ArrowUp' })
      
      const lastButton = screen.getByText('Bob Wilson').closest('button')!
      expect(lastButton).toHaveClass('bg-muted')
    })

    it('should wrap around when navigating down from last item', () => {
      renderComponent()
      
      // Navigate to last item
      fireEvent.keyDown(document, { key: 'ArrowDown' })
      fireEvent.keyDown(document, { key: 'ArrowDown' })
      
      const lastButton = screen.getByText('Bob Wilson').closest('button')!
      expect(lastButton).toHaveClass('bg-muted')
      
      // Navigate down from last item - should wrap to first
      fireEvent.keyDown(document, { key: 'ArrowDown' })
      
      const firstButton = screen.getByText('John Doe').closest('button')!
      expect(firstButton).toHaveClass('bg-muted')
    })

    it('should select user with Enter key', () => {
      renderComponent()
      
      // Navigate to second user
      fireEvent.keyDown(document, { key: 'ArrowDown' })
      
      // Press Enter
      fireEvent.keyDown(document, { key: 'Enter' })
      
      expect(mockOnSelect).toHaveBeenCalledWith('janesmith')
    })

    it('should close with Escape key', () => {
      renderComponent()
      
      fireEvent.keyDown(document, { key: 'Escape' })
      
      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('should handle arrow key navigation correctly', () => {
      renderComponent()
      
      // ArrowDown navigates to second item
      fireEvent.keyDown(document, { key: 'ArrowDown' })
      const secondButton = screen.getByText('Jane Smith').closest('button')!
      expect(secondButton).toHaveClass('bg-muted')
      
      // ArrowUp navigates back to first item
      fireEvent.keyDown(document, { key: 'ArrowUp' })
      const firstButton = screen.getByText('John Doe').closest('button')!
      expect(firstButton).toHaveClass('bg-muted')
    })

    it('should select item with Enter key', () => {
      renderComponent()
      
      // Enter should select the first (currently highlighted) item
      fireEvent.keyDown(document, { key: 'Enter' })
      expect(mockOnSelect).toHaveBeenCalledWith('johndoe')
    })
  })

  describe('Query Updates', () => {
    it('should reset selection when query changes', () => {
      const { rerender } = renderComponent('john')
      
      // Navigate to second user
      fireEvent.keyDown(document, { key: 'ArrowDown' })
      
      const secondButton = screen.getByText('Jane Smith').closest('button')!
      expect(secondButton).toHaveClass('bg-muted')
      
      // Change query (re-render with new query)
      mockUseQuery.mockReturnValue(mockUsers.slice(0, 1))
      rerender(
        <ConvexProvider client={mockConvexClient}>
          <MentionAutocomplete
            query="jane"
            onSelect={mockOnSelect}
            onClose={mockOnClose}
          />
        </ConvexProvider>
      )
      
      // Selection should reset to first item
      const firstButton = screen.getByText('John Doe').closest('button')!
      expect(firstButton).toHaveClass('bg-muted')
    })
  })

  describe('Accessibility', () => {
    it('should have proper button roles', () => {
      renderComponent()
      
      const buttons = screen.getAllByRole('button')
      expect(buttons).toHaveLength(3)
    })

    it('should have hover states', () => {
      renderComponent()
      
      const button = screen.getByText('John Doe').closest('button')!
      expect(button).toHaveClass('hover:bg-accent')
    })
  })
})
