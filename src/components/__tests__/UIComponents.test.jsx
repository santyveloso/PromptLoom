import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ErrorBoundary from '../ErrorBoundary';
import ConfirmDialog from '../ConfirmDialog';
import EmptyState from '../EmptyState';

// Mock console.error to avoid test output pollution
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});
afterAll(() => {
  console.error = originalConsoleError;
});

describe('ErrorBoundary Component', () => {
  // Create a component that throws an error
  const ErrorThrowingComponent = ({ shouldThrow }) => {
    if (shouldThrow) {
      throw new Error('Test error');
    }
    return <div>No error</div>;
  };

  it('should render children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div data-testid="child">Child content</div>
      </ErrorBoundary>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('should render fallback UI when an error occurs', () => {
    // We need to spy on console.error and suppress it to avoid test output pollution
    const errorSpy = jest.spyOn(console, 'error');
    errorSpy.mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ErrorThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
    expect(screen.getByText(/Try again/i)).toBeInTheDocument();

    errorSpy.mockRestore();
  });

  it('should render custom fallback when provided', () => {
    // We need to spy on console.error and suppress it to avoid test output pollution
    const errorSpy = jest.spyOn(console, 'error');
    errorSpy.mockImplementation(() => {});

    render(
      <ErrorBoundary
        fallback={({ error }) => (
          <div data-testid="custom-fallback">
            Custom error: {error.message}
          </div>
        )}
      >
        <ErrorThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
    expect(screen.getByText(/Custom error: Test error/i)).toBeInTheDocument();

    errorSpy.mockRestore();
  });
});

describe('ConfirmDialog Component', () => {
  it('should not render when isOpen is false', () => {
    render(
      <ConfirmDialog
        isOpen={false}
        title="Test Title"
        message="Test Message"
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );

    expect(screen.queryByText('Test Title')).not.toBeInTheDocument();
  });

  it('should render when isOpen is true', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        title="Test Title"
        message="Test Message"
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Message')).toBeInTheDocument();
  });

  it('should call onConfirm when confirm button is clicked', () => {
    const mockConfirm = jest.fn();
    render(
      <ConfirmDialog
        isOpen={true}
        title="Test Title"
        message="Test Message"
        onConfirm={mockConfirm}
        onCancel={() => {}}
        confirmText="Yes"
      />
    );

    fireEvent.click(screen.getByText('Yes'));
    expect(mockConfirm).toHaveBeenCalledTimes(1);
  });

  it('should call onCancel when cancel button is clicked', () => {
    const mockCancel = jest.fn();
    render(
      <ConfirmDialog
        isOpen={true}
        title="Test Title"
        message="Test Message"
        onConfirm={() => {}}
        onCancel={mockCancel}
        cancelText="No"
      />
    );

    fireEvent.click(screen.getByText('No'));
    expect(mockCancel).toHaveBeenCalledTimes(1);
  });
});

describe('EmptyState Component', () => {
  it('should render with all props', () => {
    const mockAction = jest.fn();
    render(
      <EmptyState
        icon="🔍"
        title="No Results Found"
        description="Try adjusting your search criteria"
        actionText="Clear Search"
        onAction={mockAction}
      />
    );

    expect(screen.getByText('🔍')).toBeInTheDocument();
    expect(screen.getByText('No Results Found')).toBeInTheDocument();
    expect(screen.getByText('Try adjusting your search criteria')).toBeInTheDocument();
    expect(screen.getByText('Clear Search')).toBeInTheDocument();
  });

  it('should not render action button when actionText is not provided', () => {
    render(
      <EmptyState
        icon="🔍"
        title="No Results Found"
        description="Try adjusting your search criteria"
      />
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('should call onAction when action button is clicked', () => {
    const mockAction = jest.fn();
    render(
      <EmptyState
        title="No Results Found"
        description="Try adjusting your search criteria"
        actionText="Clear Search"
        onAction={mockAction}
      />
    );

    fireEvent.click(screen.getByText('Clear Search'));
    expect(mockAction).toHaveBeenCalledTimes(1);
  });
});