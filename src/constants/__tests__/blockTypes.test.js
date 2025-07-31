import {
  isValidBlockType,
  getBlockOrderIndex,
  sortBlocksByOrder,
  isExistingBlockType,
  isNewBlockType,
  ALL_BLOCK_TYPES,
  BLOCK_ORDER
} from '../blockTypes';

describe('Block Types Error Handling and Edge Cases', () => {
  describe('isValidBlockType', () => {
    it('should return true for all valid block types', () => {
      ALL_BLOCK_TYPES.forEach(type => {
        expect(isValidBlockType(type)).toBe(true);
      });
    });

    it('should return false for unknown block types', () => {
      expect(isValidBlockType('UnknownType')).toBe(false);
      expect(isValidBlockType('InvalidBlock')).toBe(false);
      expect(isValidBlockType('RandomString')).toBe(false);
    });

    it('should handle edge cases gracefully', () => {
      expect(isValidBlockType('')).toBe(false);
      expect(isValidBlockType(null)).toBe(false);
      expect(isValidBlockType(undefined)).toBe(false);
      expect(isValidBlockType(123)).toBe(false);
      expect(isValidBlockType({})).toBe(false);
      expect(isValidBlockType([])).toBe(false);
    });

    it('should be case sensitive', () => {
      expect(isValidBlockType('task')).toBe(false);
      expect(isValidBlockType('TASK')).toBe(false);
      expect(isValidBlockType('Task')).toBe(true);
    });
  });

  describe('getBlockOrderIndex', () => {
    it('should return correct index for valid block types', () => {
      expect(getBlockOrderIndex('Task')).toBe(0);
      expect(getBlockOrderIndex('Tone')).toBe(1);
      expect(getBlockOrderIndex('Creativity Level')).toBe(8);
    });

    it('should return -1 for unknown block types', () => {
      expect(getBlockOrderIndex('UnknownType')).toBe(-1);
      expect(getBlockOrderIndex('InvalidBlock')).toBe(-1);
    });

    it('should handle edge cases gracefully', () => {
      expect(getBlockOrderIndex('')).toBe(-1);
      expect(getBlockOrderIndex(null)).toBe(-1);
      expect(getBlockOrderIndex(undefined)).toBe(-1);
      expect(getBlockOrderIndex(123)).toBe(-1);
    });
  });

  describe('sortBlocksByOrder', () => {
    it('should sort blocks according to fixed order', () => {
      const blocks = [
        { type: 'Creativity Level', content: 'creative' },
        { type: 'Task', content: 'task' },
        { type: 'Audience', content: 'audience' }
      ];

      const sorted = sortBlocksByOrder(blocks);
      expect(sorted[0].type).toBe('Task');
      expect(sorted[1].type).toBe('Audience');
      expect(sorted[2].type).toBe('Creativity Level');
    });

    it('should handle unknown block types gracefully', () => {
      const blocks = [
        { type: 'Task', content: 'task' },
        { type: 'UnknownType', content: 'unknown' },
        { type: 'Tone', content: 'tone' }
      ];

      const sorted = sortBlocksByOrder(blocks);
      // Known blocks should be sorted correctly
      const taskIndex = sorted.findIndex(b => b.type === 'Task');
      const toneIndex = sorted.findIndex(b => b.type === 'Tone');
      expect(taskIndex).toBeLessThan(toneIndex);
      
      // Unknown block should still be present
      expect(sorted.some(b => b.type === 'UnknownType')).toBe(true);
    });

    it('should handle empty array', () => {
      expect(sortBlocksByOrder([])).toEqual([]);
    });

    it('should handle blocks with missing type property', () => {
      const blocks = [
        { type: 'Task', content: 'task' },
        { content: 'no type' },
        { type: 'Tone', content: 'tone' }
      ];

      const sorted = sortBlocksByOrder(blocks);
      expect(sorted).toHaveLength(3);
      // Should not crash and should maintain blocks
      expect(sorted.some(b => b.content === 'no type')).toBe(true);
    });

    it('should handle blocks with null/undefined type', () => {
      const blocks = [
        { type: 'Task', content: 'task' },
        { type: null, content: 'null type' },
        { type: undefined, content: 'undefined type' },
        { type: 'Tone', content: 'tone' }
      ];

      const sorted = sortBlocksByOrder(blocks);
      expect(sorted).toHaveLength(4);
      // Should not crash
      expect(sorted.some(b => b.content === 'null type')).toBe(true);
      expect(sorted.some(b => b.content === 'undefined type')).toBe(true);
    });

    it('should preserve original order for unknown types', () => {
      const blocks = [
        { type: 'UnknownType1', content: 'unknown1' },
        { type: 'UnknownType2', content: 'unknown2' },
        { type: 'Task', content: 'task' }
      ];

      const sorted = sortBlocksByOrder(blocks);
      
      // Find the positions of each block type
      const taskIndex = sorted.findIndex(b => b.type === 'Task');
      const unknown1Index = sorted.findIndex(b => b.type === 'UnknownType1');
      const unknown2Index = sorted.findIndex(b => b.type === 'UnknownType2');
      
      // Unknown types should maintain relative order (they were first and second)
      expect(unknown1Index).toBeLessThan(unknown2Index);
      
      // All blocks should be present
      expect(sorted).toHaveLength(3);
      expect(taskIndex).toBeGreaterThanOrEqual(0);
    });
  });

  describe('isExistingBlockType', () => {
    it('should return true for original block types', () => {
      expect(isExistingBlockType('Task')).toBe(true);
      expect(isExistingBlockType('Tone')).toBe(true);
      expect(isExistingBlockType('Format')).toBe(true);
      expect(isExistingBlockType('Persona')).toBe(true);
      expect(isExistingBlockType('Constraint')).toBe(true);
    });

    it('should return false for new block types', () => {
      expect(isExistingBlockType('Audience')).toBe(false);
      expect(isExistingBlockType('Style')).toBe(false);
      expect(isExistingBlockType('Examples')).toBe(false);
      expect(isExistingBlockType('Creativity Level')).toBe(false);
    });

    it('should return false for unknown types', () => {
      expect(isExistingBlockType('UnknownType')).toBe(false);
      expect(isExistingBlockType('')).toBe(false);
      expect(isExistingBlockType(null)).toBe(false);
    });
  });

  describe('isNewBlockType', () => {
    it('should return true for new block types', () => {
      expect(isNewBlockType('Audience')).toBe(true);
      expect(isNewBlockType('Style')).toBe(true);
      expect(isNewBlockType('Examples')).toBe(true);
      expect(isNewBlockType('Creativity Level')).toBe(true);
    });

    it('should return false for existing block types', () => {
      expect(isNewBlockType('Task')).toBe(false);
      expect(isNewBlockType('Tone')).toBe(false);
      expect(isNewBlockType('Format')).toBe(false);
      expect(isNewBlockType('Persona')).toBe(false);
      expect(isNewBlockType('Constraint')).toBe(false);
    });

    it('should return false for unknown types', () => {
      expect(isNewBlockType('UnknownType')).toBe(false);
      expect(isNewBlockType('')).toBe(false);
      expect(isNewBlockType(null)).toBe(false);
    });
  });

  describe('Block type constants integrity', () => {
    it('should have consistent block order array', () => {
      expect(BLOCK_ORDER).toHaveLength(9);
      expect(BLOCK_ORDER).toEqual([
        'Task', 'Tone', 'Format', 'Persona', 'Constraint',
        'Audience', 'Style', 'Examples', 'Creativity Level'
      ]);
    });

    it('should have all block types in ALL_BLOCK_TYPES', () => {
      expect(ALL_BLOCK_TYPES).toHaveLength(9);
      BLOCK_ORDER.forEach(type => {
        expect(ALL_BLOCK_TYPES).toContain(type);
      });
    });

    it('should not have duplicate types', () => {
      const uniqueTypes = [...new Set(ALL_BLOCK_TYPES)];
      expect(uniqueTypes).toHaveLength(ALL_BLOCK_TYPES.length);
    });
  });
});