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

describe('Save/Load Integration Tests for Backward Compatibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Complete Save/Load Workflow', () => {
    it('should save and load existing block types without issues', async () => {
      // Test data with only existing block types
      const existingBlocksPrompt = [
        { id: 'block1', type: 'Task', content: 'Write a comprehensive guide' },
        { id: 'block2', type: 'Tone', content: 'Professional and informative' },
        { id: 'block3', type: 'Format', content: 'Step-by-step tutorial' },
        { id: 'block4', type: 'Persona', content: 'Subject matter expert' },
        { id: 'block5', type: 'Constraint', content: 'Maximum 2000 words' }
      ];

      // Verify all blocks are existing types
      existingBlocksPrompt.forEach(block => {
        expect(isExistingBlockType(block.type)).toBe(true);
        expect(isValidBlockType(block.type)).toBe(true);
        expect(isNewBlockType(block.type)).toBe(false);
      });

      // Mock successful save
      mockSetDoc.mockResolvedValueOnce();

      const { savePrompt } = await import('../savePrompt');
      const saveResult = await savePrompt(existingBlocksPrompt, 'Existing Types Test');
      
      expect(saveResult.success).toBe(true);
      expect(saveResult.promptId).toBeDefined();

      // Mock load with the saved prompt
      mockGetDocs.mockResolvedValueOnce({
        forEach: (callback) => {
          callback({
            id: saveResult.promptId,
            data: () => ({
              blocks: existingBlocksPrompt,
              createdAt: new Date().toISOString(),
              customName: 'Existing Types Test',
              customColor: '#6366f1'
            })
          });
        }
      });

      const { loadPrompts } = await import('../loadPrompts');
      const loadResult = await loadPrompts();
      
      expect(loadResult.success).toBe(true);
      expect(loadResult.data).toHaveLength(1);
      
      const loadedPrompt = loadResult.data[0];
      expect(loadedPrompt.blocks).toHaveLength(5);
      
      // Verify all loaded blocks are still existing types
      loadedPrompt.blocks.forEach(block => {
        expect(isExistingBlockType(block.type)).toBe(true);
        expect(isValidBlockType(block.type)).toBe(true);
      });
    });

    it('should save and load new block types correctly', async () => {
      // Test data with new block types
      const newBlocksPrompt = [
        { id: 'block1', type: 'Task', content: 'Create marketing content' },
        { id: 'block2', type: 'Audience', content: 'Tech-savvy millennials' },
        { id: 'block3', type: 'Style', content: 'Casual and conversational' },
        { id: 'block4', type: 'Examples', content: 'Similar to Slack\'s messaging' },
        { id: 'block5', type: 'Creativity Level', content: 'Moderately creative' }
      ];

      // Verify mix of existing and new types
      const existingBlocks = newBlocksPrompt.filter(b => isExistingBlockType(b.type));
      const newBlocks = newBlocksPrompt.filter(b => isNewBlockType(b.type));
      
      expect(existingBlocks).toHaveLength(1); // Task
      expect(newBlocks).toHaveLength(4); // Audience, Style, Examples, Creativity Level

      // All should be valid
      newBlocksPrompt.forEach(block => {
        expect(isValidBlockType(block.type)).toBe(true);
      });

      // Mock successful save
      mockSetDoc.mockResolvedValueOnce();

      const { savePrompt } = await import('../savePrompt');
      const saveResult = await savePrompt(newBlocksPrompt, 'New Types Test');
      
      expect(saveResult.success).toBe(true);

      // Mock load
      mockGetDocs.mockResolvedValueOnce({
        forEach: (callback) => {
          callback({
            id: saveResult.promptId,
            data: () => ({
              blocks: newBlocksPrompt,
              createdAt: new Date().toISOString(),
              customName: 'New Types Test'
            })
          });
        }
      });

      const { loadPrompts } = await import('../loadPrompts');
      const loadResult = await loadPrompts();
      
      expect(loadResult.success).toBe(true);
      
      const loadedPrompt = loadResult.data[0];
      expect(loadedPrompt.blocks).toHaveLength(5);
      
      // Verify new block types are preserved
      const loadedExisting = loadedPrompt.blocks.filter(b => isExistingBlockType(b.type));
      const loadedNew = loadedPrompt.blocks.filter(b => isNewBlockType(b.type));
      
      expect(loadedExisting).toHaveLength(1);
      expect(loadedNew).toHaveLength(4);
    });

    it('should handle mixed existing and new block types in same prompt', async () => {
      // Test data with comprehensive mix
      const mixedPrompt = [
        { id: 'block1', type: 'Task', content: 'Design user interface' },
        { id: 'block2', type: 'Audience', content: 'UX designers and developers' },
        { id: 'block3', type: 'Tone', content: 'Technical but accessible' },
        { id: 'block4', type: 'Format', content: 'Figma design file with annotations' },
        { id: 'block5', type: 'Style', content: 'Material Design principles' },
        { id: 'block6', type: 'Persona', content: 'Senior UX designer' },
        { id: 'block7', type: 'Examples', content: 'Google\'s design system' },
        { id: 'block8', type: 'Constraint', content: 'Mobile-first approach' },
        { id: 'block9', type: 'Creativity Level', content: 'Innovative but practical' }
      ];

      // Verify we have all 9 block types
      expect(mixedPrompt).toHaveLength(9);
      
      // Verify distribution
      const existingCount = mixedPrompt.filter(b => isExistingBlockType(b.type)).length;
      const newCount = mixedPrompt.filter(b => isNewBlockType(b.type)).length;
      
      expect(existingCount).toBe(EXISTING_BLOCK_TYPES.length); // 5
      expect(newCount).toBe(NEW_BLOCK_TYPES.length); // 4

      // All should be valid
      mixedPrompt.forEach(block => {
        expect(isValidBlockType(block.type)).toBe(true);
      });

      // Test sorting
      const sortedBlocks = sortBlocksByOrder(mixedPrompt);
      const sortedTypes = sortedBlocks.map(b => b.type);
      
      expect(sortedTypes).toEqual([
        'Task', 'Tone', 'Format', 'Persona', 'Constraint',
        'Audience', 'Style', 'Examples', 'Creativity Level'
      ]);

      // Mock save and load
      mockSetDoc.mockResolvedValueOnce();

      const { savePrompt } = await import('../savePrompt');
      const saveResult = await savePrompt(mixedPrompt, 'Complete Mixed Test');
      
      expect(saveResult.success).toBe(true);

      mockGetDocs.mockResolvedValueOnce({
        forEach: (callback) => {
          callback({
            id: saveResult.promptId,
            data: () => ({
              blocks: mixedPrompt,
              createdAt: new Date().toISOString(),
              customName: 'Complete Mixed Test'
            })
          });
        }
      });

      const { loadPrompts } = await import('../loadPrompts');
      const loadResult = await loadPrompts();
      
      expect(loadResult.success).toBe(true);
      
      const loadedPrompt = loadResult.data[0];
      expect(loadedPrompt.blocks).toHaveLength(9);
      
      // Verify all types are preserved
      const loadedTypes = loadedPrompt.blocks.map(b => b.type);
      const originalTypes = mixedPrompt.map(b => b.type);
      
      // Should contain all original types (order might differ)
      originalTypes.forEach(type => {
        expect(loadedTypes).toContain(type);
      });
    });
  });

  describe('Backward Compatibility Edge Cases', () => {
    it('should handle prompts saved before new block types were added', async () => {
      // Simulate a prompt that was saved when only 5 block types existed
      const legacyPromptData = {
        blocks: [
          { id: 'legacy1', type: 'Task', content: 'Legacy task' },
          { id: 'legacy2', type: 'Tone', content: 'Legacy tone' }
        ],
        createdAt: '2023-01-01T00:00:00.000Z', // Old date
        // Missing new fields that might be added later
        customName: null,
        customColor: null
      };

      mockGetDocs.mockResolvedValueOnce({
        forEach: (callback) => {
          callback({
            id: 'legacy-prompt',
            data: () => legacyPromptData
          });
        }
      });

      const { loadPrompts } = await import('../loadPrompts');
      const result = await loadPrompts();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      
      const loadedPrompt = result.data[0];
      expect(loadedPrompt.blocks).toHaveLength(2);
      
      // Should still work with existing block types
      loadedPrompt.blocks.forEach(block => {
        expect(isExistingBlockType(block.type)).toBe(true);
        expect(isValidBlockType(block.type)).toBe(true);
      });
    });

    it('should validate that no existing functionality is broken', () => {
      // Test that all existing block types are still valid
      EXISTING_BLOCK_TYPES.forEach(type => {
        expect(isValidBlockType(type)).toBe(true);
        expect(isExistingBlockType(type)).toBe(true);
        expect(isNewBlockType(type)).toBe(false);
      });

      // Test that new block types are properly added
      NEW_BLOCK_TYPES.forEach(type => {
        expect(isValidBlockType(type)).toBe(true);
        expect(isNewBlockType(type)).toBe(true);
        expect(isExistingBlockType(type)).toBe(false);
      });

      // Test that ALL_BLOCK_TYPES contains both
      expect(ALL_BLOCK_TYPES).toHaveLength(9);
      expect(ALL_BLOCK_TYPES.slice(0, 5)).toEqual(EXISTING_BLOCK_TYPES);
      expect(ALL_BLOCK_TYPES.slice(5)).toEqual(NEW_BLOCK_TYPES);
    });
  });
});