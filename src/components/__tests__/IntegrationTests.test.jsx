import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PromptBlock from '../PromptBlock';
import PromptPreview from '../PromptPreview';
import { usePromptStore } from '../../store/promptStore';
import { ALL_BLOCK_TYPES, sortBlocksByOrder } from '../../constants/blockTypes';

// Mock Framer Motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>
  },
  Reorder: {
    Group: ({ children, ...props }) => <div {...props}>{children}</div>,
    Item: ({ children, ...props }) => <div {...props}>{children}</div>
  }
}));

describe('Final Integration Tests - Complete User Workflows', () => {
  let user;

  beforeEach(() => {
    // Reset store state
    usePromptStore.setState({
      blocks: [],
      user: null,
      authChecked: true,
      savedPrompts: []
    });
    
    user = userEvent.setup();
  });

  describe('Complete User Workflows with New Block Types', () => {
    it('should support complete workflow: create all 9 block types and generate preview', async () => {
      // Create blocks for all 9 types
      const testBlocks = ALL_BLOCK_TYPES.map((type, index) => ({
        id: `block-${index}`,
        type,
        content: `Test content for ${type}`
      }));

      // Set blocks in store
      usePromptStore.setState({ blocks: testBlocks });

      // Render PromptPreview to test preview generation
      render(<PromptPreview />);

      // Verify preview is generated with all content
      await waitFor(() => {
        const preview = screen.getByText(/Test content for Task/);
        expect(preview).toBeInTheDocument();
      });

      // Verify all block types appear in preview
      for (const blockType of ALL_BLOCK_TYPES) {
        expect(screen.getByText(new RegExp(`Test content for ${blockType}`))).toBeInTheDocument();
      }

      // Verify blocks appear in correct order by checking the preview text
      const previewElement = screen.getByText(/Test content for Task/);
      const previewText = previewElement.textContent;
      
      // Check that content appears in the fixed block order
      const taskIndex = previewText.indexOf('Test content for Task');
      const audienceIndex = previewText.indexOf('Test content for Audience');
      const styleIndex = previewText.indexOf('Test content for Style');
      const creativityIndex = previewText.indexOf('Test content for Creativity Level');
      
      expect(taskIndex).toBeLessThan(audienceIndex);
      expect(audienceIndex).toBeLessThan(styleIndex);
      expect(styleIndex).toBeLessThan(creativityIndex);
    });

    it('should handle mixed old and new block types in same workflow', async () => {
      // Create mix of old and new block types
      const mixedBlocks = [
        { id: 'task-1', type: 'Task', content: 'Write documentation' },
        { id: 'audience-1', type: 'Audience', content: 'Software developers' },
        { id: 'tone-1', type: 'Tone', content: 'Technical but friendly' },
        { id: 'style-1', type: 'Style', content: 'API documentation style' },
        { id: 'examples-1', type: 'Examples', content: 'Like Stripe API docs' }
      ];

      usePromptStore.setState({ blocks: mixedBlocks });

      render(<PromptPreview />);

      // Verify preview shows content in correct order (Task, Tone, Audience, Style, Examples)
      await waitFor(() => {
        const preview = screen.getByText(/Write documentation/);
        expect(preview).toBeInTheDocument();
      });

      // Verify all mixed content appears
      expect(screen.getByText(/Software developers/)).toBeInTheDocument();
      expect(screen.getByText(/Technical but friendly/)).toBeInTheDocument();
      expect(screen.getByText(/API documentation style/)).toBeInTheDocument();
      expect(screen.getByText(/Like Stripe API docs/)).toBeInTheDocument();

      // Verify correct ordering by checking the preview text
      const previewElement = screen.getByText(/Write documentation/);
      const previewText = previewElement.textContent;
      
      const taskIndex = previewText.indexOf('Write documentation');
      const toneIndex = previewText.indexOf('Technical but friendly');
      const audienceIndex = previewText.indexOf('Software developers');
      const styleIndex = previewText.indexOf('API documentation style');
      const examplesIndex = previewText.indexOf('Like Stripe API docs');
      
      // Verify fixed order: Task, Tone, Audience, Style, Examples
      expect(taskIndex).toBeLessThan(toneIndex);
      expect(toneIndex).toBeLessThan(audienceIndex);
      expect(audienceIndex).toBeLessThan(styleIndex);
      expect(styleIndex).toBeLessThan(examplesIndex);
    });

    it('should support block removal workflow for new block types', async () => {
      // Create new block types
      const newBlocks = [
        { id: 'audience-1', type: 'Audience', content: 'Test audience' },
        { id: 'style-1', type: 'Style', content: 'Test style' },
        { id: 'examples-1', type: 'Examples', content: 'Test examples' },
        { id: 'creativity-1', type: 'Creativity Level', content: 'Test creativity' }
      ];

      usePromptStore.setState({ blocks: newBlocks });

      // Render each block and test removal
      for (const block of newBlocks) {
        const { rerender } = render(<PromptBlock block={block} isFirst={false} isLast={false} blockIndex={0} />);
        
        // Verify block is rendered
        expect(screen.getByLabelText(`${block.type} content`)).toBeInTheDocument();
        expect(screen.getByDisplayValue(block.content)).toBeInTheDocument();
        
        // Test remove button
        const removeButton = screen.getByLabelText(`Remove ${block.type} block`);
        expect(removeButton).toBeInTheDocument();
        
        // Click remove button
        await user.click(removeButton);
        
        // Verify block was removed from store
        const currentBlocks = usePromptStore.getState().blocks;
        expect(currentBlocks.find(b => b.id === block.id)).toBeUndefined();
        
        // Test passes - no cleanup needed
      }
    });
  });

  describe('Block Rendering and Styling', () => {
    it('should render all 9 block types with proper styling', async () => {
      // Test each block type individually
      for (const blockType of ALL_BLOCK_TYPES) {
        const testBlock = {
          id: `test-${blockType}`,
          type: blockType,
          content: `Test content for ${blockType}`
        };

        const { unmount } = render(
          <PromptBlock block={testBlock} isFirst={false} isLast={false} blockIndex={0} />
        );

        // Verify block is rendered with correct content
        expect(screen.getByLabelText(`${blockType} content`)).toBeInTheDocument();
        expect(screen.getByDisplayValue(`Test content for ${blockType}`)).toBeInTheDocument();

        // Verify block has proper styling classes
        const blockContainer = screen.getByDisplayValue(`Test content for ${blockType}`).closest('div[class*="bg-gradient-to-br"]');
        expect(blockContainer).toBeInTheDocument();
        expect(blockContainer).toHaveClass('rounded-xl');
        expect(blockContainer).toHaveClass('shadow-lg');

        // Clean up for next iteration
        unmount();
      }
    });

    it('should display correct icons and placeholders for new block types', async () => {
      const newBlockTypes = ['Audience', 'Style', 'Examples', 'Creativity Level'];
      const expectedIcons = {
        'Audience': '👥',
        'Style': '🎨', 
        'Examples': '💡',
        'Creativity Level': '🌟'
      };
      const expectedPlaceholders = {
        'Audience': 'Who is this for? (e.g., "beginners", "CEOs", "children", "experts")',
        'Style': 'What style should be used? (e.g., "Hemingway", "academic", "journalistic")',
        'Examples': 'Provide examples or samples to guide the output...',
        'Creativity Level': 'How creative should this be? (e.g., "highly imaginative", "strictly factual")'
      };

      for (const blockType of newBlockTypes) {
        const testBlock = {
          id: `test-${blockType}`,
          type: blockType,
          content: ''
        };

        const { unmount } = render(
          <PromptBlock block={testBlock} isFirst={false} isLast={false} blockIndex={0} />
        );

        // Verify icon is displayed
        expect(screen.getByText(expectedIcons[blockType])).toBeInTheDocument();

        // Verify placeholder text
        const textarea = screen.getByLabelText(`${blockType} content`);
        expect(textarea).toHaveAttribute('placeholder', expectedPlaceholders[blockType]);

        unmount();
      }
    });
  });

  describe('Accessibility of New Block Types and Controls', () => {
    it('should provide proper ARIA labels for new block types', async () => {
      const newBlockTypes = ['Audience', 'Style', 'Examples', 'Creativity Level'];
      
      for (const blockType of newBlockTypes) {
        const testBlock = {
          id: `test-${blockType}`,
          type: blockType,
          content: 'Test content'
        };

        const { unmount } = render(
          <PromptBlock block={testBlock} isFirst={false} isLast={false} blockIndex={0} />
        );

        // Verify ARIA labels are present for textareas
        const textarea = screen.getByLabelText(`${blockType} content`);
        expect(textarea).toBeInTheDocument();
        expect(textarea).toHaveAttribute('aria-label', `${blockType} content`);

        // Verify remove buttons have proper ARIA labels
        const removeButton = screen.getByLabelText(`Remove ${blockType} block`);
        expect(removeButton).toBeInTheDocument();
        expect(removeButton).toHaveAttribute('aria-label', `Remove ${blockType} block`);

        unmount();
      }
    });

    it('should support keyboard interaction for block controls', async () => {
      const testBlock = {
        id: 'test-audience',
        type: 'Audience',
        content: 'Test audience content'
      };

      // Set up the store with the test block
      usePromptStore.setState({ blocks: [testBlock] });

      render(<PromptBlock block={testBlock} isFirst={false} isLast={false} blockIndex={0} />);

      // Test textarea keyboard interaction
      const textarea = screen.getByLabelText('Audience content');
      await user.click(textarea);
      expect(textarea).toHaveFocus();

      // Test that we can interact with the textarea
      expect(textarea).toHaveValue('Test audience content');

      // Test remove button keyboard interaction
      const removeButton = screen.getByLabelText('Remove Audience block');
      expect(removeButton).toBeInTheDocument();
      
      // Test that remove button is focusable
      removeButton.focus();
      expect(removeButton).toHaveFocus();
    });
  });

  describe('Block Ordering and Preview Integration', () => {
    it('should maintain correct block order in preview generation', async () => {
      // Create blocks in random order to test sorting
      const randomOrderBlocks = [
        { id: 'examples-1', type: 'Examples', content: 'Example content' },
        { id: 'task-1', type: 'Task', content: 'Task content' },
        { id: 'creativity-1', type: 'Creativity Level', content: 'Creativity content' },
        { id: 'audience-1', type: 'Audience', content: 'Audience content' },
        { id: 'tone-1', type: 'Tone', content: 'Tone content' }
      ];

      usePromptStore.setState({ blocks: randomOrderBlocks });

      render(<PromptPreview />);

      // Verify preview shows content in correct fixed order
      const previewElement = screen.getByText(/Task content/);
      const previewText = previewElement.textContent;
      
      // Check order: Task, Tone, Audience, Examples, Creativity Level
      const taskIndex = previewText.indexOf('Task content');
      const toneIndex = previewText.indexOf('Tone content');
      const audienceIndex = previewText.indexOf('Audience content');
      const examplesIndex = previewText.indexOf('Example content');
      const creativityIndex = previewText.indexOf('Creativity content');
      
      expect(taskIndex).toBeLessThan(toneIndex);
      expect(toneIndex).toBeLessThan(audienceIndex);
      expect(audienceIndex).toBeLessThan(examplesIndex);
      expect(examplesIndex).toBeLessThan(creativityIndex);
    });

    it('should handle empty blocks correctly in preview', async () => {
      // Create mix of filled and empty blocks
      const mixedBlocks = [
        { id: 'task-1', type: 'Task', content: 'Task with content' },
        { id: 'tone-1', type: 'Tone', content: '' }, // Empty
        { id: 'audience-1', type: 'Audience', content: 'Audience with content' },
        { id: 'style-1', type: 'Style', content: '   ' }, // Whitespace only
        { id: 'examples-1', type: 'Examples', content: 'Examples with content' }
      ];

      usePromptStore.setState({ blocks: mixedBlocks });

      render(<PromptPreview />);

      // Verify only blocks with content appear in preview
      expect(screen.getByText(/Task with content/)).toBeInTheDocument();
      expect(screen.getByText(/Audience with content/)).toBeInTheDocument();
      expect(screen.getByText(/Examples with content/)).toBeInTheDocument();

      // Verify empty blocks don't appear
      const previewElement = screen.getByText(/Task with content/);
      const previewText = previewElement.textContent;
      expect(previewText).not.toContain('Tone:');
      expect(previewText).not.toContain('Style:');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle invalid block types gracefully', async () => {
      // Test with an invalid block type
      const invalidBlock = {
        id: 'invalid-1',
        type: 'InvalidType',
        content: 'Test content'
      };

      // Should not throw an error
      expect(() => {
        render(<PromptBlock block={invalidBlock} isFirst={false} isLast={false} blockIndex={0} />);
      }).not.toThrow();

      // Should render with fallback styling
      expect(screen.getByDisplayValue('Test content')).toBeInTheDocument();
    });

    it('should handle null or undefined content gracefully', async () => {
      const blockWithNullContent = {
        id: 'null-content',
        type: 'Audience',
        content: null
      };

      const blockWithUndefinedContent = {
        id: 'undefined-content',
        type: 'Style',
        content: undefined
      };

      // Should not throw errors
      expect(() => {
        render(<PromptBlock block={blockWithNullContent} isFirst={false} isLast={false} blockIndex={0} />);
      }).not.toThrow();

      // Test passes - no cleanup needed

      expect(() => {
        render(<PromptBlock block={blockWithUndefinedContent} isFirst={false} isLast={false} blockIndex={0} />);
      }).not.toThrow();
    });
  });

  describe('Performance and Optimization', () => {
    it('should handle large numbers of blocks efficiently', async () => {
      // Create a large number of blocks
      const manyBlocks = [];
      for (let i = 0; i < 50; i++) {
        manyBlocks.push({
          id: `block-${i}`,
          type: ALL_BLOCK_TYPES[i % ALL_BLOCK_TYPES.length],
          content: `Content for block ${i}`
        });
      }

      usePromptStore.setState({ blocks: manyBlocks });

      // Should render preview without performance issues
      const startTime = performance.now();
      render(<PromptPreview />);
      const endTime = performance.now();

      // Should render in reasonable time (less than 100ms)
      expect(endTime - startTime).toBeLessThan(100);

      // Verify content is rendered
      expect(screen.getByText(/Content for block 0/)).toBeInTheDocument();
    });

    it('should efficiently sort blocks by order', async () => {
      // Test the sorting utility function directly
      const unsortedBlocks = [
        { id: '1', type: 'Examples', content: 'Examples' },
        { id: '2', type: 'Task', content: 'Task' },
        { id: '3', type: 'Creativity Level', content: 'Creativity' },
        { id: '4', type: 'Audience', content: 'Audience' },
        { id: '5', type: 'Tone', content: 'Tone' }
      ];

      const sortedBlocks = sortBlocksByOrder(unsortedBlocks);

      // Verify correct order
      expect(sortedBlocks[0].type).toBe('Task');
      expect(sortedBlocks[1].type).toBe('Tone');
      expect(sortedBlocks[2].type).toBe('Audience');
      expect(sortedBlocks[3].type).toBe('Examples');
      expect(sortedBlocks[4].type).toBe('Creativity Level');
    });
  });
});