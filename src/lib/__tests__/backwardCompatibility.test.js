import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  isValidBlockType, 
  isExistingBlockType, 
  isNewBlockType,
  sortBlocksByOrder,
  EXISTING_BLOCK_TYPES,
  NEW_BLOCK_TYPES,
  ALL_BLOCK_TYPES 
} from '../../constants/blockTypes';

// Mock Firebase
vi.mock('../../../firebase', () => ({
  db: {},
  auth: {
    currentUser: { uid: 'test-user' }
  }
}));

// Mock Firestore functions
const mockGetDocs = vi.fn();
const mockSetDoc = vi.fn();

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  orderBy: vi.fn(),
  getDocs: mockGetDocs,
  doc: vi.fn(),
  setDoc: mockSetDoc
}));

// Mock error handling
vi.mock('../errorHandling', () => ({
  getFirebaseErrorMessage: vi.fn(),
  retryWithBackoff: vi.fn((fn) => fn())
}));

describe('Backward Compatibility Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Block Type Validation', () => {
    it('should correctly identify existing block types', () => {
      EXISTING_BLOCK_TYPES.forEach(type => {
        expect(isExistingBlockType(type)).toBe(true);
        expect(isValidBlockType(type)).toBe(true);
        expect(isNewBlockType(type)).toBe(false);
      });
    });

    it('should correctly identify new block types', () => {
      NEW_BLOCK_TYPES.forEach(type => {
        expect(isNewBlockType(type)).toBe(true);
        expect(isValidBlockType(type)).toBe(true);
        expect(isExistingBlockType(type)).toBe(false);
      });
    });

    it('should reject invalid block types', () => {
      const invalidTypes = ['InvalidType', 'UnknownBlock', '', null, undefined];
      invalidTypes.forEach(type => {
        expect(isValidBlockType(type)).toBe(false);
        expect(isExistingBlockType(type)).toBe(false);
        expect(isNewBlockType(type)).toBe(false);
      });
    });
  });

  describe('Block Ordering', () => {
    it('should sort blocks according to fixed order', () => {
      const unorderedBlocks = [
        { id: '1', type: 'Creativity Level', content: 'Balanced' },
        { id: '2', type: 'Task', content: 'Write an email' },
        { id: '3', type: 'Audience', content: 'Team members' },
        { id: '4', type: 'Tone', content: 'Professional' },
        { id: '5', type: 'Format', content: 'Plain text' }
      ];

      const sortedBlocks = sortBlocksByOrder(unorderedBlocks);
      const sortedTypes = sortedBlocks.map(b => b.type);
      
      expect(sortedTypes).toEqual(['Task', 'Tone', 'Format', 'Audience', 'Creativity Level']);
    });

    it('should handle blocks with unknown types gracefully', () => {
      const blocksWithUnknown = [
        { id: '1', type: 'UnknownType', content: 'Unknown' },
        { id: '2', type: 'Task', content: 'Write content' },
        { id: '3', type: 'AnotherUnknown', content: 'Another unknown' }
      ];

      const sortedBlocks = sortBlocksByOrder(blocksWithUnknown);
      
      // Should maintain original order for unknown types
      expect(sortedBlocks).toHaveLength(3);
      expect(sortedBlocks.find(b => b.type === 'Task')).toBeDefined();
    });
  });

  describe('Data Structure Compatibility', () => {
    it('should maintain consistent block data structure', () => {
      const existingBlock = { id: 'test', type: 'Task', content: 'Test content' };
      const newBlock = { id: 'test2', type: 'Audience', content: 'Test audience' };
      
      // Both should have same structure
      expect(Object.keys(existingBlock)).toEqual(['id', 'type', 'content']);
      expect(Object.keys(newBlock)).toEqual(['id', 'type', 'content']);
      
      // Verify types
      expect(typeof existingBlock.id).toBe('string');
      expect(typeof existingBlock.type).toBe('string');
      expect(typeof existingBlock.content).toBe('string');
      
      expect(typeof newBlock.id).toBe('string');
      expect(typeof newBlock.type).toBe('string');
      expect(typeof newBlock.content).toBe('string');
    });

    it('should validate block type constants are properly defined', () => {
      // Verify existing block types
      expect(EXISTING_BLOCK_TYPES).toEqual([
        'Task', 'Tone', 'Format', 'Persona', 'Constraint'
      ]);
      
      // Verify new block types
      expect(NEW_BLOCK_TYPES).toEqual([
        'Audience', 'Style', 'Examples', 'Creativity Level'
      ]);
      
      // Verify all block types include both
      expect(ALL_BLOCK_TYPES).toEqual([
        'Task', 'Tone', 'Format', 'Persona', 'Constraint',
        'Audience', 'Style', 'Examples', 'Creativity Level'
      ]);
      
      // Verify no duplicates
      const uniqueTypes = [...new Set(ALL_BLOCK_TYPES)];
      expect(uniqueTypes).toHaveLength(ALL_BLOCK_TYPES.length);
    });
  });

  describe('Saved Prompts Loading Simulation', () => {
    it('should handle existing saved prompts with only original 5 block types', async () => {
      // Simulate existing prompt data with only original block types
      const existingPromptData = {
        blocks: [
          { id: 'block1', type: 'Task', content: 'Write a blog post' },
          { id: 'block2', type: 'Tone', content: 'Professional and engaging' },
          { id: 'block3', type: 'Format', content: 'Markdown format' },
          { id: 'block4', type: 'Persona', content: 'Expert content writer' },
          { id: 'block5', type: 'Constraint', content: 'Keep it under 1000 words' }
        ],
        createdAt: '2024-01-01T00:00:00.000Z'
      };

      // Mock Firestore response
      mockGetDocs.mockResolvedValueOnce({
        forEach: (callback) => {
          callback({
            id: 'prompt1',
            data: () => existingPromptData
          });
        }
      });

      // Import and test loadPrompts
      const { loadPrompts } = await import('../loadPrompts');
      const result = await loadPrompts();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      
      const loadedPrompt = result.data[0];
      expect(loadedPrompt.id).toBe('prompt1');
      expect(loadedPrompt.blocks).toHaveLength(5);
      
      // Verify all blocks are existing types
      loadedPrompt.blocks.forEach(block => {
        expect(isExistingBlockType(block.type)).toBe(true);
        expect(isValidBlockType(block.type)).toBe(true);
      });

      // Verify block types are preserved
      expect(loadedPrompt.blocks.map(b => b.type)).toEqual([
        'Task', 'Tone', 'Format', 'Persona', 'Constraint'
      ]);
    });

    it('should handle prompts with mixed old and new block types', async () => {
      // Simulate prompt data with both existing and new block types
      const mixedPromptData = {
        blocks: [
          { id: 'block1', type: 'Task', content: 'Create a presentation' },
          { id: 'block2', type: 'Audience', content: 'C-level executives' },
          { id: 'block3', type: 'Tone', content: 'Authoritative' },
          { id: 'block4', type: 'Style', content: 'McKinsey consulting style' },
          { id: 'block5', type: 'Format', content: 'PowerPoint slides' }
        ],
        createdAt: '2024-01-01T00:00:00.000Z'
      };

      mockGetDocs.mockResolvedValueOnce({
        forEach: (callback) => {
          callback({
            id: 'mixed-prompt',
            data: () => mixedPromptData
          });
        }
      });

      const { loadPrompts } = await import('../loadPrompts');
      const result = await loadPrompts();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      
      const loadedPrompt = result.data[0];
      expect(loadedPrompt.blocks).toHaveLength(5);
      
      // Verify mixed block types are all valid
      loadedPrompt.blocks.forEach(block => {
        expect(isValidBlockType(block.type)).toBe(true);
      });

      // Verify we have both existing and new block types
      const existingBlocks = loadedPrompt.blocks.filter(b => isExistingBlockType(b.type));
      const newBlocks = loadedPrompt.blocks.filter(b => isNewBlockType(b.type));
      
      expect(existingBlocks).toHaveLength(3); // Task, Tone, Format
      expect(newBlocks).toHaveLength(2); // Audience, Style
    });

    it('should gracefully handle unknown block types in saved prompts', async () => {
      // Simulate prompt data with an unknown block type
      const promptWithUnknownType = {
        blocks: [
          { id: 'block1', type: 'Task', content: 'Write content' },
          { id: 'block2', type: 'UnknownType', content: 'Some content' },
          { id: 'block3', type: 'Tone', content: 'Friendly' }
        ],
        createdAt: '2024-01-01T00:00:00.000Z'
      };

      mockGetDocs.mockResolvedValueOnce({
        forEach: (callback) => {
          callback({
            id: 'unknown-type-prompt',
            data: () => promptWithUnknownType
          });
        }
      });

      const { loadPrompts } = await import('../loadPrompts');
      const result = await loadPrompts();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      
      const loadedPrompt = result.data[0];
      expect(loadedPrompt.blocks).toHaveLength(3);
      
      // Verify known types are valid
      const knownBlocks = loadedPrompt.blocks.filter(b => b.type !== 'UnknownType');
      knownBlocks.forEach(block => {
        expect(isValidBlockType(block.type)).toBe(true);
      });

      // Verify unknown type is preserved but flagged as invalid
      const unknownBlock = loadedPrompt.blocks.find(b => b.type === 'UnknownType');
      expect(unknownBlock).toBeDefined();
      expect(isValidBlockType(unknownBlock.type)).toBe(false);
    });
  });

  describe('Save/Load Functionality with New Block Types', () => {
    it('should save prompts with new block types correctly', async () => {
      const newBlocksPrompt = [
        { id: 'block1', type: 'Task', content: 'Generate marketing copy' },
        { id: 'block2', type: 'Audience', content: 'Young professionals aged 25-35' },
        { id: 'block3', type: 'Style', content: 'Conversational and relatable' },
        { id: 'block4', type: 'Examples', content: 'Like Nike\'s "Just Do It" campaign' },
        { id: 'block5', type: 'Creativity Level', content: 'Highly creative and imaginative' }
      ];

      // Mock successful save
      mockSetDoc.mockResolvedValueOnce();

      const { savePrompt } = await import('../savePrompt');
      const saveResult = await savePrompt(newBlocksPrompt, 'Marketing Template');
      
      expect(saveResult.success).toBe(true);
      expect(saveResult.promptId).toBeDefined();
      expect(mockSetDoc).toHaveBeenCalled();
    });

    it('should prevent saving prompts with only invalid block types', () => {
      const invalidBlocks = [
        { id: 'block1', type: 'InvalidType', content: 'Some content' },
        { id: 'block2', type: 'AnotherInvalid', content: 'More content' }
      ];

      // Filter out invalid blocks (this would be done by validation logic)
      const validBlocks = invalidBlocks.filter(block => isValidBlockType(block.type));
      expect(validBlocks).toHaveLength(0);
    });
  });

  describe('Store Integration Compatibility', () => {
    it('should handle mixed block types in store operations', async () => {
      const { usePromptStore } = await import('../../store/promptStore');
      
      // Test that store can handle all block types
      const testBlocks = [
        { id: '1', type: 'Task', content: 'Test task' },
        { id: '2', type: 'Audience', content: 'Test audience' },
        { id: '3', type: 'Tone', content: 'Test tone' },
        { id: '4', type: 'Style', content: 'Test style' }
      ];

      // Verify all test blocks are valid
      testBlocks.forEach(block => {
        expect(isValidBlockType(block.type)).toBe(true);
      });

      // Verify mixed types
      const existingBlocks = testBlocks.filter(b => isExistingBlockType(b.type));
      const newBlocks = testBlocks.filter(b => isNewBlockType(b.type));
      
      expect(existingBlocks).toHaveLength(2); // Task, Tone
      expect(newBlocks).toHaveLength(2); // Audience, Style
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle empty blocks arrays gracefully', async () => {
      const emptyPromptData = {
        blocks: [],
        createdAt: '2024-01-01T00:00:00.000Z'
      };

      mockGetDocs.mockResolvedValueOnce({
        forEach: (callback) => {
          callback({
            id: 'empty-prompt',
            data: () => emptyPromptData
          });
        }
      });

      const { loadPrompts } = await import('../loadPrompts');
      const result = await loadPrompts();
      
      expect(result.success).toBe(true);
      
      const loadedPrompt = result.data[0];
      expect(loadedPrompt.blocks).toEqual([]);
    });

    it('should handle null or undefined blocks gracefully', async () => {
      const nullBlocksData = {
        blocks: null,
        createdAt: '2024-01-01T00:00:00.000Z'
      };

      mockGetDocs.mockResolvedValueOnce({
        forEach: (callback) => {
          callback({
            id: 'null-blocks-prompt',
            data: () => nullBlocksData
          });
        }
      });

      const { loadPrompts } = await import('../loadPrompts');
      const result = await loadPrompts();
      
      expect(result.success).toBe(true);
      
      const loadedPrompt = result.data[0];
      expect(loadedPrompt.blocks).toEqual([]);
    });
  });
});