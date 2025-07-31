import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PromptBlock from '../PromptBlock';
import PromptPreview from '../PromptPreview';
import { usePromptStore } from '../../store/promptStore';
import { ALL_BLOCK_TYPES, sortBlocksByOrder } from '../../constants/blockTypes';

describe('Complete Workflow Tests - Final Integration Polish', () => {
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

  describe('End-to-End User Workflows', () => {
    it('should support complete prompt creation workflow with all 9 block types', async () => {
      // Step 1: Create all 9 block types with realistic content
      const realWorldPromptBlocks = [
        { id: 'task-1', type: 'Task', content: 'Create a comprehensive marketing strategy for a new SaaS product launch' },
        { id: 'tone-1', type: 'Tone', content: 'Professional, confident, and data-driven' },
        { id: 'format-1', type: 'Format', content: 'Structured document with executive summary, detailed sections, and actionable recommendations' },
        { id: 'persona-1', type: 'Persona', content: 'Senior marketing strategist with 10+ years of B2B SaaS experience' },
        { id: 'constraint-1', type: 'Constraint', content: 'Maximum 3000 words, include budget considerations, timeline must be 6 months' },
        { id: 'audience-1', type: 'Audience', content: 'C-level executives and marketing directors at mid-size tech companies' },
        { id: 'style-1', type: 'Style', content: 'McKinsey consulting report style with clear frameworks and methodologies' },
        { id: 'examples-1', type: 'Examples', content: 'Reference successful launches like Slack, Zoom, and Notion' },
        { id: 'creativity-1', type: 'Creativity Level', content: 'Balanced approach - innovative strategies grounded in proven methodologies' }
      ];

      usePromptStore.setState({ blocks: realWorldPromptBlocks });

      // Step 2: Render preview and verify complete prompt generation
      render(<PromptPreview />);

      await waitFor(() => {
        expect(screen.getByText(/Create a comprehensive marketing strategy/)).toBeInTheDocument();
      });

      // Step 3: Verify all content appears in correct order
      const previewElement = screen.getByText(/Create a comprehensive marketing strategy/);
      const previewText = previewElement.textContent;

      // Verify fixed order is maintained
      const taskIndex = previewText.indexOf('Create a comprehensive marketing strategy');
      const toneIndex = previewText.indexOf('Professional, confident, and data-driven');
      const formatIndex = previewText.indexOf('Structured document with executive summary');
      const personaIndex = previewText.indexOf('Senior marketing strategist');
      const constraintIndex = previewText.indexOf('Maximum 3000 words');
      const audienceIndex = previewText.indexOf('C-level executives and marketing directors');
      const styleIndex = previewText.indexOf('McKinsey consulting report style');
      const examplesIndex = previewText.indexOf('Reference successful launches');
      const creativityIndex = previewText.indexOf('Balanced approach - innovative strategies');

      // Assert correct ordering
      expect(taskIndex).toBeLessThan(toneIndex);
      expect(toneIndex).toBeLessThan(formatIndex);
      expect(formatIndex).toBeLessThan(personaIndex);
      expect(personaIndex).toBeLessThan(constraintIndex);
      expect(constraintIndex).toBeLessThan(audienceIndex);
      expect(audienceIndex).toBeLessThan(styleIndex);
      expect(styleIndex).toBeLessThan(examplesIndex);
      expect(examplesIndex).toBeLessThan(creativityIndex);

      // Step 4: Verify copy functionality works
      const copyButton = screen.getByRole('button', { name: /copy/i });
      expect(copyButton).toBeInTheDocument();
    });

    it('should handle dynamic block editing and real-time preview updates', async () => {
      // Start with initial blocks
      const initialBlocks = [
        { id: 'task-1', type: 'Task', content: 'Write a blog post' },
        { id: 'audience-1', type: 'Audience', content: 'General readers' },
        { id: 'style-1', type: 'Style', content: 'Casual' }
      ];

      usePromptStore.setState({ blocks: initialBlocks });

      // Render both block and preview components
      const { rerender } = render(
        <div>
          {initialBlocks.map(block => (
            <PromptBlock key={block.id} block={block} isFirst={false} isLast={false} blockIndex={0} />
          ))}
          <PromptPreview />
        </div>
      );

      // Verify initial preview
      await waitFor(() => {
        expect(screen.getByText(/Write a blog post/)).toBeInTheDocument();
      });

      // Edit the task block
      const taskTextarea = screen.getByLabelText('Task content');
      await user.clear(taskTextarea);
      await user.type(taskTextarea, 'Create an in-depth technical tutorial');

      // Update store to simulate real editing
      usePromptStore.setState({
        blocks: [
          { id: 'task-1', type: 'Task', content: 'Create an in-depth technical tutorial' },
          { id: 'audience-1', type: 'Audience', content: 'General readers' },
          { id: 'style-1', type: 'Style', content: 'Casual' }
        ]
      });

      // Re-render with updated blocks
      rerender(
        <div>
          <PromptPreview />
        </div>
      );

      // Verify preview updates
      await waitFor(() => {
        expect(screen.getByText(/Create an in-depth technical tutorial/)).toBeInTheDocument();
      });
    });

    it('should maintain performance with complex prompt structures', async () => {
      // Create a complex prompt with all block types and long content
      const complexBlocks = ALL_BLOCK_TYPES.map((type, index) => ({
        id: `complex-${index}`,
        type,
        content: `This is a very detailed and comprehensive ${type.toLowerCase()} block with extensive content that simulates real-world usage. It includes multiple sentences, specific requirements, and detailed instructions that would be typical in professional prompt engineering scenarios. The content is designed to test performance and rendering capabilities with substantial text volumes.`
      }));

      const startTime = performance.now();
      
      usePromptStore.setState({ blocks: complexBlocks });
      render(<PromptPreview />);

      await waitFor(() => {
        expect(screen.getByText(/This is a very detailed and comprehensive task/)).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render complex content in reasonable time
      expect(renderTime).toBeLessThan(200); // 200ms threshold

      // Verify all content is present
      ALL_BLOCK_TYPES.forEach(type => {
        expect(screen.getByText(new RegExp(`comprehensive ${type.toLowerCase()}`))).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility and Usability Validation', () => {
    it('should provide complete keyboard navigation support', async () => {
      const testBlocks = [
        { id: 'task-1', type: 'Task', content: 'Test task' },
        { id: 'audience-1', type: 'Audience', content: 'Test audience' },
        { id: 'style-1', type: 'Style', content: 'Test style' }
      ];

      usePromptStore.setState({ blocks: testBlocks });

      render(
        <div>
          {testBlocks.map(block => (
            <PromptBlock key={block.id} block={block} isFirst={false} isLast={false} blockIndex={0} />
          ))}
        </div>
      );

      // Test tab navigation through all interactive elements
      const taskTextarea = screen.getByLabelText('Task content');
      const audienceTextarea = screen.getByLabelText('Audience content');
      const styleTextarea = screen.getByLabelText('Style content');

      // Start with first textarea
      taskTextarea.focus();
      expect(taskTextarea).toHaveFocus();

      // Tab to next elements
      await user.tab();
      expect(screen.getByLabelText('Remove Task block')).toHaveFocus();

      await user.tab();
      expect(audienceTextarea).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText('Remove Audience block')).toHaveFocus();

      await user.tab();
      expect(styleTextarea).toHaveFocus();
    });

    it('should provide comprehensive screen reader support', async () => {
      const accessibilityTestBlocks = [
        { id: 'task-1', type: 'Task', content: 'Accessibility test task' },
        { id: 'audience-1', type: 'Audience', content: 'Accessibility test audience' }
      ];

      usePromptStore.setState({ blocks: accessibilityTestBlocks });

      render(
        <div>
          {accessibilityTestBlocks.map(block => (
            <PromptBlock key={block.id} block={block} isFirst={false} isLast={false} blockIndex={0} />
          ))}
        </div>
      );

      // Verify ARIA labels
      expect(screen.getByLabelText('Task content')).toHaveAttribute('aria-label', 'Task content');
      expect(screen.getByLabelText('Audience content')).toHaveAttribute('aria-label', 'Audience content');

      // Verify remove button labels
      expect(screen.getByLabelText('Remove Task block')).toHaveAttribute('aria-label', 'Remove Task block');
      expect(screen.getByLabelText('Remove Audience block')).toHaveAttribute('aria-label', 'Remove Audience block');

      // Verify content is accessible
      expect(screen.getByDisplayValue('Accessibility test task')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Accessibility test audience')).toBeInTheDocument();
    });
  });

  describe('Error Recovery and Edge Cases', () => {
    it('should gracefully handle corrupted or invalid block data', async () => {
      const corruptedBlocks = [
        { id: 'valid-1', type: 'Task', content: 'Valid task content' },
        { id: 'invalid-1', type: null, content: 'Invalid type' },
        { id: 'invalid-2', type: 'Task', content: null },
        { id: 'invalid-3', type: 'UnknownType', content: 'Unknown type content' },
        { id: 'valid-2', type: 'Audience', content: 'Valid audience content' }
      ];

      usePromptStore.setState({ blocks: corruptedBlocks });

      // Should not throw errors
      expect(() => {
        render(<PromptPreview />);
      }).not.toThrow();

      // Should render valid blocks
      await waitFor(() => {
        expect(screen.getByText(/Valid task content/)).toBeInTheDocument();
        expect(screen.getByText(/Valid audience content/)).toBeInTheDocument();
      });
    });

    it('should handle empty and whitespace-only content appropriately', async () => {
      const edgeCaseBlocks = [
        { id: 'empty-1', type: 'Task', content: '' },
        { id: 'whitespace-1', type: 'Tone', content: '   ' },
        { id: 'tabs-1', type: 'Format', content: '\t\t\t' },
        { id: 'newlines-1', type: 'Persona', content: '\n\n\n' },
        { id: 'valid-1', type: 'Audience', content: 'Valid content' }
      ];

      usePromptStore.setState({ blocks: edgeCaseBlocks });

      render(<PromptPreview />);

      // Should only show valid content
      await waitFor(() => {
        expect(screen.getByText(/Valid content/)).toBeInTheDocument();
      });

      // Should not show empty or whitespace-only blocks
      const previewElement = screen.getByText(/Valid content/);
      const previewText = previewElement.textContent;
      
      expect(previewText).not.toContain('Task:');
      expect(previewText).not.toContain('Tone:');
      expect(previewText).not.toContain('Format:');
      expect(previewText).not.toContain('Persona:');
      expect(previewText).toContain('Audience: Valid content');
    });
  });

  describe('Performance and Scalability', () => {
    it('should maintain responsive performance with maximum realistic block count', async () => {
      // Create maximum realistic scenario: 3 of each block type
      const maxBlocks = [];
      ALL_BLOCK_TYPES.forEach((type, typeIndex) => {
        for (let i = 0; i < 3; i++) {
          maxBlocks.push({
            id: `max-${typeIndex}-${i}`,
            type,
            content: `${type} content variation ${i + 1} with substantial text to simulate real-world usage patterns and content volumes`
          });
        }
      });

      const startTime = performance.now();
      
      usePromptStore.setState({ blocks: maxBlocks });
      render(<PromptPreview />);

      await waitFor(() => {
        expect(screen.getByText(/Task content variation 1/)).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should handle maximum load efficiently
      expect(renderTime).toBeLessThan(300); // 300ms threshold for heavy load
      expect(maxBlocks).toHaveLength(27); // 9 types × 3 instances

      // Verify sorting still works correctly with many blocks
      const sortedBlocks = sortBlocksByOrder(maxBlocks);
      expect(sortedBlocks[0].type).toBe('Task');
      expect(sortedBlocks[sortedBlocks.length - 1].type).toBe('Creativity Level');
    });

    it('should efficiently handle rapid state changes', async () => {
      const rapidChangeBlocks = [
        { id: 'rapid-1', type: 'Task', content: 'Initial content' }
      ];

      usePromptStore.setState({ blocks: rapidChangeBlocks });
      render(<PromptPreview />);

      // Simulate rapid content changes
      const changes = [
        'First update',
        'Second update',
        'Third update',
        'Fourth update',
        'Final update'
      ];

      const startTime = performance.now();

      for (const change of changes) {
        usePromptStore.setState({
          blocks: [{ id: 'rapid-1', type: 'Task', content: change }]
        });
        
        await waitFor(() => {
          expect(screen.getByText(new RegExp(change))).toBeInTheDocument();
        });
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // Should handle rapid changes efficiently
      expect(totalTime).toBeLessThan(500); // 500ms for 5 rapid changes
    });
  });

  describe('Cross-Browser and Device Compatibility', () => {
    it('should render consistently across different viewport scenarios', async () => {
      const responsiveTestBlocks = [
        { id: 'responsive-1', type: 'Task', content: 'Responsive design test content' },
        { id: 'responsive-2', type: 'Audience', content: 'Mobile and desktop compatibility test' }
      ];

      usePromptStore.setState({ blocks: responsiveTestBlocks });

      render(
        <div>
          {responsiveTestBlocks.map(block => (
            <PromptBlock key={block.id} block={block} isFirst={false} isLast={false} blockIndex={0} />
          ))}
          <PromptPreview />
        </div>
      );

      // Verify responsive classes are applied
      const textareas = screen.getAllByRole('textbox');
      textareas.forEach(textarea => {
        expect(textarea.className).toContain('text-sm');
        expect(textarea.className).toMatch(/min-h-\[80px\]|min-h-\[90px\]/);
      });

      // Verify preview content is accessible
      await waitFor(() => {
        expect(screen.getByText(/Responsive design test content/)).toBeInTheDocument();
        expect(screen.getByText(/Mobile and desktop compatibility test/)).toBeInTheDocument();
      });
    });
  });
});