import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import EmptyState from '../EmptyState'
import LoadingSpinner from '../LoadingSpinner'
import ConfirmDialog from '../ConfirmDialog'

describe('EmptyState Component', () => {
  it('renders with title and description', () => {
    render(
      <EmptyState 
        title="No prompts yet" 
        description="Create your first prompt to get started" 
      />
    )
    
    expect(screen.getByText('No prompts yet')).toBeInTheDocument()
    expect(screen.getByText('Create your first prompt to get started')).toBeInTheDocument()
  })

  it('renders action button when provided', () => {
    const mockAction = vi.fn()
    render(
      <EmptyState 
        title="Empty" 
        description="Description" 
        actionText="Create Prompt"
        onAction={mockAction}
      />
    )
    
    const button = screen.getByText('Create Prompt')
    expect(button).toBeInTheDocument()
    
    fireEvent.click(button)
    expect(mockAction).toHaveBeenCalledOnce()
  })

  it('renders custom icon', () => {
    render(
      <EmptyState 
        title="Empty" 
        description="Description" 
        icon="🎉"
      />
    )
    
    expect(screen.getByText('🎉')).toBeInTheDocument()
  })
})

describe('LoadingSpinner Component', () => {
  it('renders with default props', () => {
    render(<LoadingSpinner />)
    
    // Check if spinner element exists (div with border classes)
    const spinner = document.querySelector('.border-indigo-500')
    expect(spinner).toBeInTheDocument()
  })

  it('renders with custom text', () => {
    render(<LoadingSpinner text="Loading prompts..." />)
    
    expect(screen.getByText('Loading prompts...')).toBeInTheDocument()
  })

  it('applies correct size classes', () => {
    render(<LoadingSpinner size="lg" />)
    
    const spinner = document.querySelector('.w-12')
    expect(spinner).toBeInTheDocument()
  })
})

describe('ConfirmDialog Component', () => {
  it('does not render when closed', () => {
    render(
      <ConfirmDialog 
        isOpen={false}
        title="Delete prompt"
        message="Are you sure?"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    )
    
    expect(screen.queryByText('Delete prompt')).not.toBeInTheDocument()
  })

  it('renders when open', () => {
    render(
      <ConfirmDialog 
        isOpen={true}
        title="Delete prompt"
        message="Are you sure you want to delete this prompt?"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    )
    
    expect(screen.getByText('Delete prompt')).toBeInTheDocument()
    expect(screen.getByText('Are you sure you want to delete this prompt?')).toBeInTheDocument()
    expect(screen.getByText('Confirm')).toBeInTheDocument()
    expect(screen.getByText('Cancel')).toBeInTheDocument()
  })

  it('calls onConfirm when confirm button is clicked', () => {
    const mockConfirm = vi.fn()
    render(
      <ConfirmDialog 
        isOpen={true}
        title="Delete"
        message="Are you sure?"
        onConfirm={mockConfirm}
        onCancel={vi.fn()}
      />
    )
    
    fireEvent.click(screen.getByText('Confirm'))
    expect(mockConfirm).toHaveBeenCalledOnce()
  })

  it('calls onCancel when cancel button is clicked', () => {
    const mockCancel = vi.fn()
    render(
      <ConfirmDialog 
        isOpen={true}
        title="Delete"
        message="Are you sure?"
        onConfirm={vi.fn()}
        onCancel={mockCancel}
      />
    )
    
    fireEvent.click(screen.getByText('Cancel'))
    expect(mockCancel).toHaveBeenCalledOnce()
  })

  it('renders custom button text', () => {
    render(
      <ConfirmDialog 
        isOpen={true}
        title="Delete"
        message="Are you sure?"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
        confirmText="Delete Forever"
        cancelText="Keep It"
      />
    )
    
    expect(screen.getByText('Delete Forever')).toBeInTheDocument()
    expect(screen.getByText('Keep It')).toBeInTheDocument()
  })
})