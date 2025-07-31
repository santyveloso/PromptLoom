import { describe, it, expect } from 'vitest';
import { 
  isValidBlockType, 
  getBlockOrderIndex, 
  sortBlocksByOrder,
  ALL_BLOCK_TYPES,
  EXISTING_BLOCK_TYPES,
  NEW_BLOCK_TYPES
} from '../../constants/blockTypes';

describe('Block Type Error Handling Integration Tests', () => {
  describe('Backward Compatibility', () => {
    it('should maintain all existing block types', () => {
      const expectedExistingTypes = ['Task', 'Tone', 'Format', 'Persona', 'Constraint'];
      
      expectedExistingTypes.forEach(type => {
        expect(EXISTING_BLOCK_TYPES).toContain(type);
        expect(isValidBlockType(type)).toBe(true);
        expect(getBlockOrderIndex(type)).toBeGreaterThanOrEqual(0);
      });
    });

    it('should not break existing functionality with new block types', () => {
      // Test that existing blocks still work as before
      const existingBlocks = [
        { type: 'Task', content: 'Write a blog post' },
        { type: 'Tone', content: 'Professional' },
        { type: 'Format', content: 'Markdown' }
      ];

      const sorted = sortBlocksByOrder(existingBlocks);
      
      expect(sorted[0].type).toBe('Task');
      expect(sorted[1].type).toBe('Tone');
      expect(sorted[2].type).toBe('Format');
    });

    it('should handle mixed existing and new blocks correctly', () => {
      const mixedBlocks = [
        { type: 'Audience', content: 'Developers' }, // New
        { type: 'Task', content: 'Write docs' }, // Existing
        { type: 'Style', content: 'Technical' }, // New
        { type: 'Tone', content: 'Informative' } // Existing
      ];

      const sorted = sortBlocksByOrder(mixedBlocks);
      
      // Should maintain correct order: Task, Tone, Audience, Style
      expect(sorted[0].type).toBe('Task');
      expect(sorted[1].type).toBe('Tone');
      expect(sorted[2].type).toBe('Audience');
      expect(sorted[3].type).toBe('Style');
    });
  });

  describe('Error Resilience', () => {
    it('should handle malformed block objects gracefully', () => {
      const malformedBlocks = [
        { type: 'Task', content: 'Valid block' },
        { type: null, content: 'Null type' },
        { type: undefined, content: 'Undefined type' },
        { type: '', content: 'Empty type' },
        { content: 'Missing type' },
        { type: 'Tone' }, // Missing content
        {}, // Empty object
        null, // Null block
        undefined // Undefined block
      ];

      // Should not throw errors
      expect(() => {
        const filtered = malformedBlocks.filter(block => block && block.type);
        sortBlocksByOrder(filtered);
      }).not.toThrow();
    });

    it('should handle extreme edge cases', () => {
      const edgeCaseBlocks = [
        { type: 'Task', content: '' }, // Empty content
        { type: 'Tone', content: '   \n\t   ' }, // Whitespace only
        { type: 'Format', content: 'A'.repeat(10000) }, // Very long content
        { type: 'Persona', content: 'Content with\nnewlines\nand\ttabs' }, // Special chars
        { type: 'Constraint', content: 'Content with "quotes" and \'apostrophes\' and @#$%^&*()' },
        { type: 'UnknownType', content: 'Unknown block type' },
        { type: 123, content: 'Numeric type' }, // Invalid type format
        { type: ['array'], content: 'Array type' }, // Invalid type format
        { type: { object: true }, content: 'Object type' } // Invalid type format
      ];

      // Should handle gracefully without throwing
      expect(() => {
        const validBlocks = edgeCaseBlocks.filter(block => 
          block && 
          typeof block === 'object' && 
          block.type !== null && 
          block.type !== undefined
        );
        sortBlocksByOrder(validBlocks);
      }).not.toThrow();
    });

    it('should maintain data integrity with invalid inputs', () => {
      const blocks = [
        { type: 'Task', content: 'Valid task' },
        { type: 'InvalidType', content: 'Invalid but should be preserved' },
        { type: 'Tone', content: 'Valid tone' }
      ];

      const sorted = sortBlocksByOrder(blocks);
      
      // Should preserve all blocks
      expect(sorted).toHaveLength(3);
      
      // Should maintain content integrity
      expect(sorted.find(b => b.type === 'Task').content).toBe('Valid task');
      expect(sorted.find(b => b.type === 'InvalidType').content).toBe('Invalid but should be preserved');
      expect(sorted.find(b => b.type === 'Tone').content).toBe('Valid tone');
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large numbers of blocks efficiently', () => {
      const largeBlockSet = [];
      
      // Create 1000 blocks with mixed types
      for (let i = 0; i < 1000; i++) {
        const types = [...ALL_BLOCK_TYPES, 'UnknownType1', 'UnknownType2'];
        const randomType = types[i % types.length];
        largeBlockSet.push({
          type: randomType,
          content: `Content ${i}`
        });
      }

      const startTime = performance.now();
      const sorted = sortBlocksByOrder(largeBlockSet);
      const endTime = performance.now();

      // Should complete in reasonable time (less than 100ms)
      expect(endTime - startTime).toBeLessThan(100);
      
      // Should preserve all blocks
      expect(sorted).toHaveLength(1000);
    });

    it('should handle repeated sorting operations efficiently', () => {
      const blocks = [
        { type: 'Creativity Level', content: 'Creative' },
        { type: 'Task', content: 'Write' },
        { type: 'UnknownType', content: 'Unknown' },
        { type: 'Audience', content: 'Users' }
      ];

      const startTime = performance.now();
      
      // Perform sorting 1000 times
      for (let i = 0; i < 1000; i++) {
        sortBlocksByOrder([...blocks]);
      }
      
      const endTime = performance.now();

      // Should complete all operations in reasonable time
      expect(endTime - startTime).toBeLessThan(1000);
    });
  });

  describe('Type Safety and Validation', () => {
    it('should validate all block type constants are strings', () => {
      ALL_BLOCK_TYPES.forEach(type => {
        expect(typeof type).toBe('string');
        expect(type.length).toBeGreaterThan(0);
      });
    });

    it('should ensure no duplicate block types', () => {
      const uniqueTypes = new Set(ALL_BLOCK_TYPES);
      expect(uniqueTypes.size).toBe(ALL_BLOCK_TYPES.length);
    });

    it('should validate block order consistency', () => {
      // Every type in ALL_BLOCK_TYPES should have an order index
      ALL_BLOCK_TYPES.forEach(type => {
        const index = getBlockOrderIndex(type);
        expect(index).toBeGreaterThanOrEqual(0);
        expect(index).toBeLessThan(ALL_BLOCK_TYPES.length);
      });
    });

    it('should handle type validation edge cases', () => {
      const invalidTypes = [
        null,
        undefined,
        '',
        123,
        [],
        {},
        true,
        false,
        Symbol('test'),
        function() {}
      ];

      invalidTypes.forEach(invalidType => {
        expect(isValidBlockType(invalidType)).toBe(false);
        expect(getBlockOrderIndex(invalidType)).toBe(-1);
      });
    });
  });

  describe('Integration with Component Behavior', () => {
    it('should support component fallback patterns', () => {
      // Test the patterns used in PromptBlock component
      const unknownType = 'UnknownBlockType';
      
      // Icon fallback
      const blockIcons = {
        Task: '📋',
        Tone: '🎭',
        // ... other known types
      };
      const icon = blockIcons[unknownType] || '📄';
      expect(icon).toBe('📄');

      // Styling fallback
      const typeColors = {
        Task: 'bg-blue-50',
        Tone: 'bg-pink-50',
        // ... other known types
      };
      const styling = typeColors[unknownType] || 'bg-gray-50';
      expect(styling).toBe('bg-gray-50');

      // Placeholder fallback
      const placeholders = {
        Task: 'What do you want the AI to do?',
        Tone: 'What tone should the AI use?',
        // ... other known types
      };
      const placeholder = placeholders[unknownType] || `Enter your ${unknownType.toLowerCase()} details...`;
      expect(placeholder).toBe('Enter your unknownblocktype details...');
    });

    it('should support preview generation patterns', () => {
      // Test the patterns used in PromptPreview component
      const blocks = [
        { type: 'Task', content: 'Write content' },
        { type: 'UnknownType', content: 'Unknown content' },
        { type: '', content: 'Empty type content' },
        { type: null, content: 'Null type content' }
      ];

      // Filter and sort like PromptPreview does
      const processedBlocks = sortBlocksByOrder(blocks)
        .filter(b => b && b.content && b.content.trim() !== '')
        .map(b => `${b.type}: ${b.content.trim()}`);

      expect(processedBlocks).toContain('Task: Write content');
      expect(processedBlocks).toContain('UnknownType: Unknown content');
      expect(processedBlocks).toContain(': Empty type content');
      expect(processedBlocks).toContain('null: Null type content');
    });
  });

  describe('Error Recovery and Graceful Degradation', () => {
    it('should recover from corrupted block data', () => {
      const corruptedBlocks = [
        { type: 'Task', content: 'Good block' },
        'not an object',
        { type: 'Tone' }, // Missing content
        { content: 'Missing type' },
        null,
        undefined,
        { type: 'Format', content: 'Another good block' }
      ];

      // Should extract valid blocks and continue working
      const validBlocks = corruptedBlocks.filter(block => 
        block && 
        typeof block === 'object' && 
        block.type && 
        typeof block.type === 'string'
      );

      expect(() => {
        const sorted = sortBlocksByOrder(validBlocks);
        expect(sorted.length).toBeGreaterThan(0);
      }).not.toThrow();
    });

    it('should maintain functionality with partial system failures', () => {
      // Simulate scenario where some validation functions might fail
      const blocks = [
        { type: 'Task', content: 'Content 1' },
        { type: 'UnknownType', content: 'Content 2' },
        { type: 'Tone', content: 'Content 3' }
      ];

      // Even if validation fails, sorting should still work
      const sorted = sortBlocksByOrder(blocks);
      expect(sorted).toHaveLength(3);
      
      // Known types should still be in correct order
      const taskIndex = sorted.findIndex(b => b.type === 'Task');
      const toneIndex = sorted.findIndex(b => b.type === 'Tone');
      expect(taskIndex).toBeLessThan(toneIndex);
    });
  });
});