import { loadPrompts } from '../loadPrompts';
import { savePrompt } from '../savePrompt';
import { deletePrompt } from '../deletePrompt';
import { auth, db } from '../../../firebase';
import { collection, getDocs, doc, getDoc, deleteDoc } from 'firebase/firestore';

// Mock Firebase
jest.mock('../../../firebase', () => ({
  auth: {
    currentUser: { uid: 'test-user-id' }
  },
  db: {
    collection: jest.fn(),
    doc: jest.fn()
  }
}));

// Mock Firestore
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  orderBy: jest.fn(),
  getDocs: jest.fn(),
  doc: jest.fn(),
  setDoc: jest.fn(),
  deleteDoc: jest.fn(),
  getDoc: jest.fn()
}));

describe('Firebase Utility Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('loadPrompts', () => {
    it('should return prompts when successful', async () => {
      // Mock data
      const mockDocs = [
        {
          id: 'prompt1',
          data: () => ({
            blocks: [{ id: 'block1', type: 'Task', content: 'Test content' }],
            createdAt: '2023-01-01T00:00:00.000Z',
            updatedAt: '2023-01-02T00:00:00.000Z'
          })
        }
      ];

      // Mock implementation
      collection.mockReturnValue('promptsRef');
      getDocs.mockResolvedValue({
        forEach: (callback) => mockDocs.forEach(callback)
      });

      // Execute
      const result = await loadPrompts();

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('prompt1');
      expect(result.data[0].blocks).toHaveLength(1);
    });

    it('should handle errors gracefully', async () => {
      // Mock implementation
      collection.mockReturnValue('promptsRef');
      getDocs.mockRejectedValue(new Error('Firebase error'));

      // Execute
      const result = await loadPrompts();

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle unauthenticated users', async () => {
      // Temporarily remove currentUser
      const originalUser = auth.currentUser;
      auth.currentUser = null;

      // Execute
      const result = await loadPrompts();

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('User not authenticated');

      // Restore currentUser
      auth.currentUser = originalUser;
    });
  });

  describe('savePrompt', () => {
    it('should save a prompt successfully', async () => {
      // Mock data
      const blocks = [
        { id: 'block1', type: 'Task', content: 'Test content' }
      ];

      // Mock implementation
      doc.mockReturnValue('promptRef');
      setDoc.mockResolvedValue(undefined);

      // Execute
      const result = await savePrompt(blocks);

      // Assert
      expect(result.success).toBe(true);
      expect(result.promptId).toBeDefined();
    });

    it('should validate blocks before saving', async () => {
      // Execute with invalid blocks
      const result = await savePrompt(null);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid blocks data');
    });

    it('should prevent saving empty prompts', async () => {
      // Execute with empty blocks
      const result = await savePrompt([
        { id: 'block1', type: 'Task', content: '' }
      ]);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Cannot save empty prompt. Please add some content first.');
    });
  });

  describe('deletePrompt', () => {
    it('should delete a prompt successfully', async () => {
      // Mock implementation
      doc.mockReturnValue('promptRef');
      deleteDoc.mockResolvedValue(undefined);

      // Execute
      const result = await deletePrompt('prompt1');

      // Assert
      expect(result.success).toBe(true);
    });

    it('should validate promptId before deleting', async () => {
      // Execute with invalid promptId
      const result = await deletePrompt(null);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid prompt ID');
    });

    it('should handle errors gracefully', async () => {
      // Mock implementation
      doc.mockReturnValue('promptRef');
      deleteDoc.mockRejectedValue({ code: 'permission-denied' });

      // Execute
      const result = await deletePrompt('prompt1');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});