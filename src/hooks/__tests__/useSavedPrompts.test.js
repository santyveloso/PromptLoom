import { renderHook, act } from '@testing-library/react-hooks';
import { useSavedPrompts } from '../useSavedPrompts';
import { usePromptStore } from '../../store/promptStore';
import { loadPrompts } from '../../lib/loadPrompts';
import { savePrompt } from '../../lib/savePrompt';
import { deletePrompt } from '../../lib/deletePrompt';

// Mock the modules
jest.mock('../../store/promptStore', () => ({
  usePromptStore: jest.fn()
}));

jest.mock('../../lib/loadPrompts', () => ({
  loadPrompts: jest.fn()
}));

jest.mock('../../lib/savePrompt', () => ({
  savePrompt: jest.fn()
}));

jest.mock('../../lib/deletePrompt', () => ({
  deletePrompt: jest.fn()
}));

describe('useSavedPrompts Hook', () => {
  // Setup mock store
  const mockSetSavedPrompts = jest.fn();
  const mockSetSavedPromptsLoading = jest.fn();
  const mockSetSavedPromptsError = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementation
    usePromptStore.mockImplementation(() => ({
      user: { uid: 'test-user' },
      authChecked: true,
      savedPrompts: [],
      savedPromptsLoading: false,
      savedPromptsError: null,
      setSavedPrompts: mockSetSavedPrompts,
      setSavedPromptsLoading: mockSetSavedPromptsLoading,
      setSavedPromptsError: mockSetSavedPromptsError,
      blocks: [{ id: 'block1', content: 'Test content' }]
    }));
  });

  it('should load prompts when user is authenticated', async () => {
    // Mock successful load
    loadPrompts.mockResolvedValueOnce({
      success: true,
      data: [{ id: 'prompt1', title: 'Test Prompt' }]
    });

    const { result, waitForNextUpdate } = renderHook(() => useSavedPrompts());
    
    await waitForNextUpdate();
    
    expect(loadPrompts).toHaveBeenCalled();
    expect(mockSetSavedPrompts).toHaveBeenCalledWith([{ id: 'prompt1', title: 'Test Prompt' }]);
    expect(mockSetSavedPromptsLoading).toHaveBeenCalledWith(false);
  });

  it('should handle load errors correctly', async () => {
    // Mock failed load
    loadPrompts.mockResolvedValueOnce({
      success: false,
      error: 'Failed to load prompts'
    });

    const { result, waitForNextUpdate } = renderHook(() => useSavedPrompts());
    
    await waitForNextUpdate();
    
    expect(loadPrompts).toHaveBeenCalled();
    expect(mockSetSavedPromptsError).toHaveBeenCalledWith('Failed to load prompts');
    expect(mockSetSavedPromptsLoading).toHaveBeenCalledWith(false);
  });

  it('should save prompts correctly', async () => {
    // Mock successful save
    savePrompt.mockResolvedValueOnce({
      success: true,
      promptId: 'new-prompt-id'
    });
    
    // Mock successful load after save
    loadPrompts.mockResolvedValueOnce({
      success: true,
      data: [{ id: 'new-prompt-id', title: 'New Prompt' }]
    });

    const { result, waitForNextUpdate } = renderHook(() => useSavedPrompts());
    
    await act(async () => {
      const saveResult = await result.current.saveCurrentPrompt();
      expect(saveResult.success).toBe(true);
    });
    
    expect(savePrompt).toHaveBeenCalled();
    expect(loadPrompts).toHaveBeenCalled();
  });

  it('should handle save errors correctly', async () => {
    // Mock failed save
    savePrompt.mockResolvedValueOnce({
      success: false,
      error: 'Failed to save prompt'
    });

    const { result } = renderHook(() => useSavedPrompts());
    
    await act(async () => {
      const saveResult = await result.current.saveCurrentPrompt();
      expect(saveResult.success).toBe(false);
      expect(saveResult.error).toBe('Failed to save prompt');
    });
  });

  it('should delete prompts correctly', async () => {
    // Setup mock store with saved prompts
    usePromptStore.mockImplementation(() => ({
      user: { uid: 'test-user' },
      authChecked: true,
      savedPrompts: [
        { id: 'prompt1', title: 'Test Prompt 1' },
        { id: 'prompt2', title: 'Test Prompt 2' }
      ],
      savedPromptsLoading: false,
      savedPromptsError: null,
      setSavedPrompts: mockSetSavedPrompts,
      setSavedPromptsLoading: mockSetSavedPromptsLoading,
      setSavedPromptsError: mockSetSavedPromptsError,
      blocks: [{ id: 'block1', content: 'Test content' }]
    }));
    
    // Mock successful delete
    deletePrompt.mockResolvedValueOnce({
      success: true
    });

    const { result } = renderHook(() => useSavedPrompts());
    
    await act(async () => {
      const deleteResult = await result.current.deleteSavedPrompt('prompt1');
      expect(deleteResult.success).toBe(true);
    });
    
    expect(deletePrompt).toHaveBeenCalledWith('prompt1');
    expect(mockSetSavedPrompts).toHaveBeenCalledWith([
      { id: 'prompt2', title: 'Test Prompt 2' }
    ]);
  });

  it('should handle delete errors correctly', async () => {
    // Mock failed delete
    deletePrompt.mockResolvedValueOnce({
      success: false,
      error: 'Failed to delete prompt'
    });

    const { result } = renderHook(() => useSavedPrompts());
    
    await act(async () => {
      const deleteResult = await result.current.deleteSavedPrompt('prompt1');
      expect(deleteResult.success).toBe(false);
      expect(deleteResult.error).toBe('Failed to delete prompt');
    });
  });

  it('should clear error state', () => {
    const { result } = renderHook(() => useSavedPrompts());
    
    act(() => {
      result.current.clearError();
    });
    
    expect(mockSetSavedPromptsError).toHaveBeenCalledWith(null);
  });

  it('should retry loading prompts', async () => {
    // Mock successful load
    loadPrompts.mockResolvedValueOnce({
      success: true,
      data: [{ id: 'prompt1', title: 'Test Prompt' }]
    });

    const { result, waitForNextUpdate } = renderHook(() => useSavedPrompts());
    
    act(() => {
      result.current.retryLoadPrompts();
    });
    
    await waitForNextUpdate();
    
    expect(loadPrompts).toHaveBeenCalled();
    expect(mockSetSavedPrompts).toHaveBeenCalledWith([{ id: 'prompt1', title: 'Test Prompt' }]);
  });
});