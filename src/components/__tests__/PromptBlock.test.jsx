import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import PromptBlock from '../PromptBlock';
import { ALL_BLOCK_TYPES, EXISTING_BLOCK_TYPES, NEW_BLOCK_TYPES } from '../../constants/blockTypes';

// Mock functions for store
const mockUpdateBlock = vi.fn();
const mockRemoveBlock = vi.fn();

// Mock the store
vi.mock('../../store/promptStore', () => ({
  usePromptStore: () => ({
    updateBlock: mockUpdateBlock,
    removeBlock: mockRemoveBlock,
  }),
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...props }) => (
      <div className={className} {...props}>
        {children}
      </div>
    ),
  },
}));

describe('PromptBlock Component', () => {
  const mockBlock = {
    id: 'test-id',
    type: 'Task',
    content: 'Test content',
  };

  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  describe('Block Type Rendering', () => {
    it('should render all 9 block types correctly', () => {
      ALL_BLOCK_TYPES.forEach(type => {
        const block = { ...mockBlock, type };
        const { unmount } = render(<PromptBlock block={block} isFirst={false} isLast={false} blockIndex={0} />);
        
        // Check that the block type is displayed
        expect(screen.getByText(type)).toBeInTheDocument();
        
        // Check that textarea is present
        expect(screen.getByRole('textbox')).toBeInTheDocument();
        
        // Check that remove button is present
        expect(screen.getByLabelText(`Remove ${type} block`)).toBeInTheDocument();
        
        unmount();
      });
    });

    it('should render existing block types correctly', () => {
      EXISTING_BLOCK_TYPES.forEach(type => {
        const block = { ...mockBlock, type };
        const { unmount } = render(<PromptBlock block={block} isFirst={false} isLast={false} blockIndex={0} />);
        
        // Check that the block type is displayed
        expect(screen.getByText(type)).toBeInTheDocument();
        
        unmount();
      });
    });

    it('should render new block types correctly', () => {
      NEW_BLOCK_TYPES.forEach(type => {
        const block = { ...mockBlock, type };
        const { unmount } = render(<PromptBlock block={block} isFirst={false} isLast={false} blockIndex={0} />);
        
        // Check that the block type is displayed
        expect(screen.getByText(type)).toBeInTheDocument();
        
        unmount();
      });
    });
  });

  describe('Block Icons', () => {
    it('should display correct icons for all existing block types', () => {
      const existingBlocksWithIcons = [
        { type: 'Task', icon: '📋' },
        { type: 'Tone', icon: '🎭' },
        { type: 'Format', icon: '📝' },
        { type: 'Persona', icon: '👤' },
        { type: 'Constraint', icon: '⚠️' },
      ];

      existingBlocksWithIcons.forEach(({ type, icon }) => {
        const block = { ...mockBlock, type };
        const { unmount } = render(<PromptBlock block={block} isFirst={false} isLast={false} blockIndex={0} />);
        
        // Check that the correct icon is displayed
        expect(screen.getByText(icon)).toBeInTheDocument();
        
        unmount();
      });
    });

    it('should display correct icons for all new block types', () => {
      const newBlocksWithIcons = [
        { type: 'Audience', icon: '👥' },
        { type: 'Style', icon: '🎨' },
        { type: 'Examples', icon: '💡' },
        { type: 'Creativity Level', icon: '🌟' },
      ];

      newBlocksWithIcons.forEach(({ type, icon }) => {
        const block = { ...mockBlock, type };
        const { unmount } = render(<PromptBlock block={block} isFirst={false} isLast={false} blockIndex={0} />);
        
        // Check that the correct icon is displayed
        expect(screen.getByText(icon)).toBeInTheDocument();
        
        unmount();
      });
    });

    it('should display default icon for unknown block types', () => {
      const block = { ...mockBlock, type: 'UnknownType' };
      render(<PromptBlock block={block} isFirst={false} isLast={false} blockIndex={0} />);
      
      // Should display default icon
      expect(screen.getByText('📄')).toBeInTheDocument();
    });
  });

  describe('Block Styling', () => {
    it('should apply correct styling classes for new block types', () => {
      const newBlocksWithExpectedClasses = [
        { type: 'Audience', expectedClass: 'border-cyan-500' },
        { type: 'Style', expectedClass: 'border-violet-500' },
        { type: 'Examples', expectedClass: 'border-orange-500' },
        { type: 'Creativity Level', expectedClass: 'border-teal-500' },
      ];

      newBlocksWithExpectedClasses.forEach(({ type, expectedClass }) => {
        const block = { ...mockBlock, type };
        const { container, unmount } = render(<PromptBlock block={block} isFirst={false} isLast={false} blockIndex={0} />);
        
        // Check that the correct styling class is applied
        const blockElement = container.querySelector(`[class*="${expectedClass}"]`);
        expect(blockElement).toBeInTheDocument();
        
        unmount();
      });
    });

    it('should apply correct text color classes for new block types', () => {
      const newBlocksWithTextColors = [
        { type: 'Audience', expectedClass: 'text-cyan-900' },
        { type: 'Style', expectedClass: 'text-violet-900' },
        { type: 'Examples', expectedClass: 'text-orange-900' },
        { type: 'Creativity Level', expectedClass: 'text-teal-900' },
      ];

      newBlocksWithTextColors.forEach(({ type, expectedClass }) => {
        const block = { ...mockBlock, type };
        const { container, unmount } = render(<PromptBlock block={block} isFirst={false} isLast={false} blockIndex={0} />);
        
        // Check that the correct text color class is applied
        const blockElement = container.querySelector(`[class*="${expectedClass}"]`);
        expect(blockElement).toBeInTheDocument();
        
        unmount();
      });
    });
  });

  describe('Placeholder Text', () => {
    it('should display correct placeholder text for existing block types', () => {
      const existingBlocksWithPlaceholders = [
        { 
          type: 'Task', 
          placeholder: 'What do you want the AI to do? (e.g., "Write a product description for...")' 
        },
        { 
          type: 'Tone', 
          placeholder: 'What tone should the AI use? (e.g., "Professional and friendly")' 
        },
        { 
          type: 'Format', 
          placeholder: 'How should the output be formatted? (e.g., "As a bulleted list")' 
        },
        { 
          type: 'Persona', 
          placeholder: 'What role should the AI take? (e.g., "You are a marketing expert...")' 
        },
        { 
          type: 'Constraint', 
          placeholder: 'Any specific rules or limits? (e.g., "Keep it under 100 words")' 
        },
      ];

      existingBlocksWithPlaceholders.forEach(({ type, placeholder }) => {
        const block = { ...mockBlock, type, content: '' };
        const { unmount } = render(<PromptBlock block={block} isFirst={false} isLast={false} blockIndex={0} />);
        
        // Check that the correct placeholder is displayed
        expect(screen.getByPlaceholderText(placeholder)).toBeInTheDocument();
        
        unmount();
      });
    });

    it('should display correct placeholder text for new block types', () => {
      const newBlocksWithPlaceholders = [
        { 
          type: 'Audience', 
          placeholder: 'Who is this for? (e.g., "beginners", "CEOs", "children", "experts")' 
        },
        { 
          type: 'Style', 
          placeholder: 'What style should be used? (e.g., "Hemingway", "academic", "journalistic")' 
        },
        { 
          type: 'Examples', 
          placeholder: 'Provide examples or samples to guide the output...' 
        },
        { 
          type: 'Creativity Level', 
          placeholder: 'How creative should this be? (e.g., "highly imaginative", "strictly factual")' 
        },
      ];

      newBlocksWithPlaceholders.forEach(({ type, placeholder }) => {
        const block = { ...mockBlock, type, content: '' };
        const { unmount } = render(<PromptBlock block={block} isFirst={false} isLast={false} blockIndex={0} />);
        
        // Check that the correct placeholder is displayed
        expect(screen.getByPlaceholderText(placeholder)).toBeInTheDocument();
        
        unmount();
      });
    });

    it('should display default placeholder for unknown block types', () => {
      const block = { ...mockBlock, type: 'UnknownType', content: '' };
      render(<PromptBlock block={block} isFirst={false} isLast={false} blockIndex={0} />);
      
      // Should display default placeholder
      expect(screen.getByPlaceholderText('Enter your unknowntype details...')).toBeInTheDocument();
    });
  });

  describe('Block Removal', () => {
    it('should render remove button for all existing block types', () => {
      EXISTING_BLOCK_TYPES.forEach(type => {
        const block = { ...mockBlock, type, id: `test-${type}` };
        const { unmount } = render(<PromptBlock block={block} isFirst={false} isLast={false} blockIndex={0} />);
        
        // Check that remove button is present with correct aria-label
        expect(screen.getByLabelText(`Remove ${type} block`)).toBeInTheDocument();
        
        unmount();
      });
    });

    it('should render remove button for all new block types', () => {
      NEW_BLOCK_TYPES.forEach(type => {
        const block = { ...mockBlock, type, id: `test-${type}` };
        const { unmount } = render(<PromptBlock block={block} isFirst={false} isLast={false} blockIndex={0} />);
        
        // Check that remove button is present with correct aria-label
        expect(screen.getByLabelText(`Remove ${type} block`)).toBeInTheDocument();
        
        unmount();
      });
    });

    it('should render remove button for unknown block types', () => {
      const block = { ...mockBlock, type: 'UnknownType', id: 'test-unknown' };
      render(<PromptBlock block={block} isFirst={false} isLast={false} blockIndex={0} />);
      
      // Check that remove button is present with correct aria-label
      expect(screen.getByLabelText('Remove UnknownType block')).toBeInTheDocument();
    });
  });

  describe('Content Display', () => {
    it('should display existing content correctly for all block types', () => {
      ALL_BLOCK_TYPES.forEach(type => {
        const existingContent = `Existing content for ${type}`;
        const block = { ...mockBlock, type, content: existingContent };
        const { unmount } = render(<PromptBlock block={block} isFirst={false} isLast={false} blockIndex={0} />);
        
        const textarea = screen.getByRole('textbox');
        expect(textarea.value).toBe(existingContent);
        
        unmount();
      });
    });

    it('should render textarea for all block types', () => {
      ALL_BLOCK_TYPES.forEach(type => {
        const block = { ...mockBlock, type };
        const { unmount } = render(<PromptBlock block={block} isFirst={false} isLast={false} blockIndex={0} />);
        
        // Check that textarea is present
        expect(screen.getByRole('textbox')).toBeInTheDocument();
        
        unmount();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria labels for all block types', () => {
      ALL_BLOCK_TYPES.forEach(type => {
        const block = { ...mockBlock, type };
        const { unmount } = render(<PromptBlock block={block} isFirst={false} isLast={false} blockIndex={0} />);
        
        // Check textarea has proper aria-label
        expect(screen.getByLabelText(`${type} content`)).toBeInTheDocument();
        
        // Check remove button has proper aria-label
        expect(screen.getByLabelText(`Remove ${type} block`)).toBeInTheDocument();
        
        unmount();
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle unknown block types gracefully', () => {
      const block = { ...mockBlock, type: 'UnknownType' };
      render(<PromptBlock block={block} isFirst={false} isLast={false} blockIndex={0} />);
      
      // Should display the unknown type name
      expect(screen.getByText('UnknownType')).toBeInTheDocument();
      
      // Should display default icon
      expect(screen.getByText('📄')).toBeInTheDocument();
      
      // Should display default placeholder
      expect(screen.getByPlaceholderText('Enter your unknowntype details...')).toBeInTheDocument();
      
      // Should still have functional remove button
      expect(screen.getByLabelText('Remove UnknownType block')).toBeInTheDocument();
    });

    it('should handle blocks with empty type gracefully', () => {
      const incompleteBlock = { id: 'test-id', type: '', content: 'test content' };
      
      // This should not crash the component
      expect(() => {
        render(<PromptBlock block={incompleteBlock} isFirst={false} isLast={false} blockIndex={0} />);
      }).not.toThrow();
      
      // Should display default icon for empty type
      expect(screen.getByText('📄')).toBeInTheDocument();
      
      // Should have a textarea
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should handle null block type gracefully', () => {
      const nullTypeBlock = { id: 'test-id', type: null, content: 'test content' };
      
      expect(() => {
        render(<PromptBlock block={nullTypeBlock} isFirst={false} isLast={false} blockIndex={0} />);
      }).not.toThrow();
      
      // Should display default icon
      expect(screen.getByText('📄')).toBeInTheDocument();
      
      // Should have a textarea
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should handle undefined block type gracefully', () => {
      const undefinedTypeBlock = { id: 'test-id', type: undefined, content: 'test content' };
      
      expect(() => {
        render(<PromptBlock block={undefinedTypeBlock} isFirst={false} isLast={false} blockIndex={0} />);
      }).not.toThrow();
      
      // Should display default icon
      expect(screen.getByText('📄')).toBeInTheDocument();
      
      // Should have a textarea
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should apply fallback styling for unknown block types', () => {
      const unknownBlock = { ...mockBlock, type: 'UnknownType' };
      const { container } = render(<PromptBlock block={unknownBlock} isFirst={false} isLast={false} blockIndex={0} />);
      
      // Should apply fallback gray styling
      const blockElement = container.querySelector('[class*="from-gray-50"]');
      expect(blockElement).toBeInTheDocument();
      
      const borderElement = container.querySelector('[class*="border-gray-400"]');
      expect(borderElement).toBeInTheDocument();
    });

    it('should handle empty content correctly for new block types', () => {
      NEW_BLOCK_TYPES.forEach(type => {
        const emptyBlock = { ...mockBlock, type, content: '' };
        const { unmount } = render(<PromptBlock block={emptyBlock} isFirst={false} isLast={false} blockIndex={0} />);
        
        const textarea = screen.getByRole('textbox');
        expect(textarea.value).toBe('');
        expect(textarea.placeholder).toBeTruthy();
        
        unmount();
      });
    });

    it('should handle whitespace-only content correctly', () => {
      const whitespaceBlock = { ...mockBlock, content: '   \n\t   ' };
      render(<PromptBlock block={whitespaceBlock} isFirst={false} isLast={false} blockIndex={0} />);
      
      const textarea = screen.getByRole('textbox');
      expect(textarea.value).toBe('   \n\t   ');
    });

    it('should handle special characters in block type names', () => {
      const specialCharBlock = { ...mockBlock, type: 'Block-With_Special@Chars!' };
      render(<PromptBlock block={specialCharBlock} isFirst={false} isLast={false} blockIndex={0} />);
      
      expect(screen.getByText('Block-With_Special@Chars!')).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toBeInTheDocument();
      expect(screen.getByLabelText('Remove Block-With_Special@Chars! block')).toBeInTheDocument();
    });

    it('should handle very long block type names', () => {
      const longTypeBlock = { 
        ...mockBlock, 
        type: 'This Is A Very Long Block Type Name That Might Cause Layout Issues' 
      };
      render(<PromptBlock block={longTypeBlock} isFirst={false} isLast={false} blockIndex={0} />);
      
      expect(screen.getByText('This Is A Very Long Block Type Name That Might Cause Layout Issues')).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should handle numeric block types', () => {
      const numericBlock = { ...mockBlock, type: '123' };
      render(<PromptBlock block={numericBlock} isFirst={false} isLast={false} blockIndex={0} />);
      
      expect(screen.getByText('123')).toBeInTheDocument();
      expect(screen.getByText('📄')).toBeInTheDocument(); // fallback icon
    });

    it('should maintain functionality with unknown block types', () => {
      const unknownBlock = { ...mockBlock, type: 'UnknownType' };
      render(<PromptBlock block={unknownBlock} isFirst={false} isLast={false} blockIndex={0} />);
      
      // Should still have functional textarea
      const textarea = screen.getByRole('textbox');
      expect(textarea).toBeInTheDocument();
      
      // Should still have functional remove button
      const removeButton = screen.getByLabelText('Remove UnknownType block');
      expect(removeButton).toBeInTheDocument();
    });

    it('should preserve existing error handling behavior', () => {
      // Test that existing functionality still works
      const validBlock = { ...mockBlock, type: 'Task' };
      render(<PromptBlock block={validBlock} isFirst={false} isLast={false} blockIndex={0} />);
      
      // Should render normally
      expect(screen.getByText('Task')).toBeInTheDocument();
      expect(screen.getByText('📋')).toBeInTheDocument();
      
      // Should have proper functionality
      expect(screen.getByRole('textbox')).toBeInTheDocument();
      expect(screen.getByLabelText('Remove Task block')).toBeInTheDocument();
    });

    it('should handle case sensitivity correctly', () => {
      const lowercaseBlock = { ...mockBlock, type: 'task' };
      render(<PromptBlock block={lowercaseBlock} isFirst={false} isLast={false} blockIndex={0} />);
      
      // Should treat as unknown type (case sensitive)
      expect(screen.getByText('task')).toBeInTheDocument();
      expect(screen.getByText('📄')).toBeInTheDocument(); // fallback icon
      expect(screen.getByPlaceholderText('Enter your task details...')).toBeInTheDocument();
    });

    it('should handle blocks with missing properties gracefully', () => {
      const incompleteBlock = { id: 'test-id' }; // missing type and content
      
      expect(() => {
        render(<PromptBlock block={incompleteBlock} isFirst={false} isLast={false} blockIndex={0} />);
      }).not.toThrow();
      
      // Should have a textarea
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should handle blocks with only id property', () => {
      const minimalBlock = { id: 'minimal-block' };
      
      expect(() => {
        render(<PromptBlock block={minimalBlock} isFirst={false} isLast={false} blockIndex={0} />);
      }).not.toThrow();
      
      // Should display default icon
      expect(screen.getByText('📄')).toBeInTheDocument();
      
      // Should have a textarea
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });
  });
});