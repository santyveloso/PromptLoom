import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import PromptBlock from '../PromptBlock';
import { ALL_BLOCK_TYPES } from '../../constants/blockTypes';

describe('Visual Regression Tests - UI Consistency', () => {
  describe('Block Type Visual Consistency', () => {
    it('should maintain consistent visual structure across all block types', () => {
      const visualStructureTests = ALL_BLOCK_TYPES.map(blockType => {
        const testBlock = {
          id: `visual-test-${blockType}`,
          type: blockType,
          content: `Sample content for ${blockType}`
        };

        const { container, unmount } = render(
          <PromptBlock block={testBlock} isFirst={false} isLast={false} blockIndex={0} />
        );

        // Test visual structure elements
        const results = {
          blockType,
          hasGradientBackground: !!container.querySelector('[class*="bg-gradient-to-br"]'),
          hasRoundedCorners: !!container.querySelector('[class*="rounded-xl"]'),
          hasShadow: !!container.querySelector('[class*="shadow-lg"]'),
          hasIcon: !!container.querySelector('span:first-child'),
          hasRemoveButton: !!container.querySelector('button[aria-label*="Remove"]'),
          hasTextarea: !!container.querySelector('textarea'),
          hasProperBorder: !!container.querySelector('[class*="border-l-8"]'),
          hasStitchCircle: !!container.querySelector('[class*="absolute"][class*="-top-2"]')
        };

        unmount();
        return results;
      });

      // Verify all blocks have consistent visual structure
      visualStructureTests.forEach(result => {
        expect(result.hasGradientBackground, `${result.blockType} should have gradient background`).toBe(true);
        expect(result.hasRoundedCorners, `${result.blockType} should have rounded corners`).toBe(true);
        expect(result.hasShadow, `${result.blockType} should have shadow`).toBe(true);
        expect(result.hasIcon, `${result.blockType} should have icon`).toBe(true);
        expect(result.hasRemoveButton, `${result.blockType} should have remove button`).toBe(true);
        expect(result.hasTextarea, `${result.blockType} should have textarea`).toBe(true);
        expect(result.hasProperBorder, `${result.blockType} should have left border`).toBe(true);
        expect(result.hasStitchCircle, `${result.blockType} should have stitch circle`).toBe(true);
      });
    });

    it('should apply unique color schemes to each block type', () => {
      const expectedColorSchemes = {
        'Task': 'from-blue-50',
        'Tone': 'from-pink-50',
        'Format': 'from-amber-50',
        'Persona': 'from-emerald-50',
        'Constraint': 'from-red-50',
        'Audience': 'from-cyan-50',
        'Style': 'from-violet-50',
        'Examples': 'from-orange-50',
        'Creativity Level': 'from-teal-50'
      };

      Object.entries(expectedColorSchemes).forEach(([blockType, expectedColorClass]) => {
        const testBlock = {
          id: `color-test-${blockType}`,
          type: blockType,
          content: 'Test content'
        };

        const { container, unmount } = render(
          <PromptBlock block={testBlock} isFirst={false} isLast={false} blockIndex={0} />
        );

        const gradientElement = container.querySelector('[class*="bg-gradient-to-br"]');
        expect(gradientElement, `${blockType} should have gradient element`).toBeTruthy();
        expect(gradientElement.className, `${blockType} should have correct color scheme`).toContain(expectedColorClass);

        unmount();
      });
    });

    it('should display correct icons for each block type', () => {
      const expectedIcons = {
        'Task': '📋',
        'Tone': '🎭',
        'Format': '📝',
        'Persona': '👤',
        'Constraint': '⚠️',
        'Audience': '👥',
        'Style': '🎨',
        'Examples': '💡',
        'Creativity Level': '🌟'
      };

      Object.entries(expectedIcons).forEach(([blockType, expectedIcon]) => {
        const testBlock = {
          id: `icon-test-${blockType}`,
          type: blockType,
          content: 'Test content'
        };

        const { unmount } = render(
          <PromptBlock block={testBlock} isFirst={false} isLast={false} blockIndex={0} />
        );

        expect(screen.getByText(expectedIcon)).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('Responsive Design Consistency', () => {
    it('should maintain consistent spacing and sizing across block types', () => {
      ALL_BLOCK_TYPES.forEach(blockType => {
        const testBlock = {
          id: `spacing-test-${blockType}`,
          type: blockType,
          content: 'Test content for responsive design'
        };

        const { container, unmount } = render(
          <PromptBlock block={testBlock} isFirst={false} isLast={false} blockIndex={0} />
        );

        // Check for responsive padding classes
        const blockElement = container.querySelector('[class*="p-4"]') || container.querySelector('[class*="p-5"]');
        expect(blockElement, `${blockType} should have responsive padding`).toBeTruthy();

        // Check for responsive text sizing
        const textElement = container.querySelector('textarea');
        expect(textElement, `${blockType} should have textarea`).toBeTruthy();
        expect(textElement.className, `${blockType} textarea should have responsive classes`).toContain('text-sm');

        // Check for responsive minimum height
        expect(textElement.className, `${blockType} textarea should have min height`).toMatch(/min-h-\[80px\]|min-h-\[90px\]/);

        unmount();
      });
    });

    it('should maintain consistent button styling across all block types', () => {
      ALL_BLOCK_TYPES.forEach(blockType => {
        const testBlock = {
          id: `button-test-${blockType}`,
          type: blockType,
          content: 'Test content'
        };

        const { container, unmount } = render(
          <PromptBlock block={testBlock} isFirst={false} isLast={false} blockIndex={0} />
        );

        const removeButton = container.querySelector('button[aria-label*="Remove"]');
        expect(removeButton, `${blockType} should have remove button`).toBeTruthy();

        // Check button styling consistency
        expect(removeButton.className).toContain('p-1');
        expect(removeButton.className).toContain('rounded-md');
        expect(removeButton.className).toContain('hover:text-red-500');
        expect(removeButton.className).toContain('hover:bg-red-50');
        expect(removeButton.className).toContain('transition-all');
        expect(removeButton.className).toContain('duration-200');

        unmount();
      });
    });
  });

  describe('Accessibility Visual Indicators', () => {
    it('should provide consistent focus indicators for all interactive elements', () => {
      ALL_BLOCK_TYPES.forEach(blockType => {
        const testBlock = {
          id: `focus-test-${blockType}`,
          type: blockType,
          content: 'Test content'
        };

        const { container, unmount } = render(
          <PromptBlock block={testBlock} isFirst={false} isLast={false} blockIndex={0} />
        );

        // Check textarea focus styling
        const textarea = container.querySelector('textarea');
        expect(textarea.className, `${blockType} textarea should have focus styling`).toContain('focus:outline-none');
        expect(textarea.className, `${blockType} textarea should have focus ring`).toContain('focus:ring-2');
        expect(textarea.className, `${blockType} textarea should have focus ring color`).toContain('focus:ring-indigo-500');

        // Check remove button focus styling
        const removeButton = container.querySelector('button[aria-label*="Remove"]');
        expect(removeButton.className, `${blockType} remove button should have focus styling`).toContain('focus:outline-none');
        expect(removeButton.className, `${blockType} remove button should have focus ring`).toContain('focus:ring-2');

        unmount();
      });
    });

    it('should maintain consistent hover states across all block types', () => {
      ALL_BLOCK_TYPES.forEach(blockType => {
        const testBlock = {
          id: `hover-test-${blockType}`,
          type: blockType,
          content: 'Test content'
        };

        const { container, unmount } = render(
          <PromptBlock block={testBlock} isFirst={false} isLast={false} blockIndex={0} />
        );

        // Check block container hover effects
        const blockContainer = container.querySelector('[class*="hover:shadow-xl"]');
        expect(blockContainer, `${blockType} should have hover shadow effect`).toBeTruthy();

        // Check remove button hover effects
        const removeButton = container.querySelector('button[aria-label*="Remove"]');
        expect(removeButton.className, `${blockType} remove button should have hover effects`).toContain('hover:text-red-500');
        expect(removeButton.className, `${blockType} remove button should have hover background`).toContain('hover:bg-red-50');

        unmount();
      });
    });
  });

  describe('Animation and Transition Consistency', () => {
    it('should apply consistent transition durations across all block types', () => {
      ALL_BLOCK_TYPES.forEach(blockType => {
        const testBlock = {
          id: `transition-test-${blockType}`,
          type: blockType,
          content: 'Test content'
        };

        const { container, unmount } = render(
          <PromptBlock block={testBlock} isFirst={false} isLast={false} blockIndex={0} />
        );

        // Check block container transitions
        const blockContainer = container.querySelector('[class*="transition-all"]');
        expect(blockContainer, `${blockType} should have transition-all`).toBeTruthy();
        expect(blockContainer.className, `${blockType} should have consistent duration`).toContain('duration-200');

        // Check textarea transitions
        const textarea = container.querySelector('textarea');
        expect(textarea.className, `${blockType} textarea should have transitions`).toContain('transition-all');
        expect(textarea.className, `${blockType} textarea should have consistent duration`).toContain('duration-200');

        // Check remove button transitions
        const removeButton = container.querySelector('button[aria-label*="Remove"]');
        expect(removeButton.className, `${blockType} remove button should have transitions`).toContain('transition-all');
        expect(removeButton.className, `${blockType} remove button should have consistent duration`).toContain('duration-200');

        unmount();
      });
    });
  });

  describe('Typography and Content Consistency', () => {
    it('should maintain consistent typography across all block types', () => {
      ALL_BLOCK_TYPES.forEach(blockType => {
        const testBlock = {
          id: `typography-test-${blockType}`,
          type: blockType,
          content: 'Test content for typography consistency'
        };

        const { container, unmount } = render(
          <PromptBlock block={testBlock} isFirst={false} isLast={false} blockIndex={0} />
        );

        // Check block type label typography
        const typeLabel = container.querySelector('span:nth-child(2)');
        expect(typeLabel, `${blockType} should have type label`).toBeTruthy();
        expect(typeLabel.className, `${blockType} label should have consistent text size`).toMatch(/text-sm|text-base/);
        expect(typeLabel.className, `${blockType} label should be semibold`).toContain('font-semibold');

        // Check textarea typography
        const textarea = container.querySelector('textarea');
        expect(textarea.className, `${blockType} textarea should have consistent text size`).toContain('text-sm');

        unmount();
      });
    });

    it('should display appropriate placeholder text for all block types', () => {
      const expectedPlaceholderPatterns = {
        'Task': /What do you want the AI to do/,
        'Tone': /What tone should the AI use/,
        'Format': /How should the output be formatted/,
        'Persona': /What role should the AI take/,
        'Constraint': /Any specific rules or limits/,
        'Audience': /Who is this for/,
        'Style': /What style should be used/,
        'Examples': /Provide examples or samples/,
        'Creativity Level': /How creative should this be/
      };

      Object.entries(expectedPlaceholderPatterns).forEach(([blockType, pattern]) => {
        const testBlock = {
          id: `placeholder-test-${blockType}`,
          type: blockType,
          content: ''
        };

        const { container, unmount } = render(
          <PromptBlock block={testBlock} isFirst={false} isLast={false} blockIndex={0} />
        );

        const textarea = container.querySelector('textarea');
        expect(textarea.placeholder, `${blockType} should have appropriate placeholder`).toMatch(pattern);

        unmount();
      });
    });
  });

  describe('Layout and Positioning Consistency', () => {
    it('should maintain consistent layout structure across all block types', () => {
      ALL_BLOCK_TYPES.forEach(blockType => {
        const testBlock = {
          id: `layout-test-${blockType}`,
          type: blockType,
          content: 'Test content'
        };

        const { container, unmount } = render(
          <PromptBlock block={testBlock} isFirst={false} isLast={false} blockIndex={0} />
        );

        // Check for consistent flex layout in header
        const headerSection = container.querySelector('.flex.justify-between.items-center');
        expect(headerSection, `${blockType} should have consistent header layout`).toBeTruthy();

        // Check for consistent icon and label positioning
        const iconLabelContainer = container.querySelector('.flex.items-center.gap-2');
        expect(iconLabelContainer, `${blockType} should have consistent icon/label container`).toBeTruthy();

        // Check for consistent stitch circle positioning
        const stitchCircle = container.querySelector('[class*="absolute"][class*="-top-2"][class*="left-4"]');
        expect(stitchCircle, `${blockType} should have consistently positioned stitch circle`).toBeTruthy();

        unmount();
      });
    });

    it('should maintain consistent border and spacing patterns', () => {
      ALL_BLOCK_TYPES.forEach(blockType => {
        const testBlock = {
          id: `border-test-${blockType}`,
          type: blockType,
          content: 'Test content'
        };

        const { container, unmount } = render(
          <PromptBlock block={testBlock} isFirst={false} isLast={false} blockIndex={0} />
        );

        // Check for consistent left border
        const blockContainer = container.querySelector('[class*="border-l-8"]');
        expect(blockContainer, `${blockType} should have left border`).toBeTruthy();

        // Check for consistent internal spacing
        const paddedContainer = container.querySelector('[class*="p-4"]') || container.querySelector('[class*="p-5"]');
        expect(paddedContainer, `${blockType} should have consistent padding`).toBeTruthy();

        // Check for consistent margin between header and textarea
        const headerSection = container.querySelector('.mb-3') || container.querySelector('.mb-4');
        expect(headerSection, `${blockType} should have consistent header margin`).toBeTruthy();

        unmount();
      });
    });
  });
});