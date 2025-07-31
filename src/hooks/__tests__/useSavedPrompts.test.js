import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSavedPrompts } from '../useSavedPrompts';

// Mock the modules
vi.mock('../../store/promptStore', () => ({
  usePromptStore: vi.fn()
}));

vi.mock('../../lib/loadPrompts', () => ({
  loadPrompts: vi.fn()
}));

vi.mock('../../lib/savePrompt', () => ({
  savePrompt: vi.fn()
}));

vi.mock('../../lib/deletePrompt', () => ({
  deletePrompt: vi.fn()
}));

describe('useSavedPrompts Hook', () => {
  // Setup mock store
  const mockSetSavedPrompts = vi.fn();
  const mockSetSavedPromptsLoading = vi.fn();
  const mockSetSavedPromptsError = vi.fn();
  
  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Default mock implementation
    const { usePromptStore } = await import('../../store/promptStore');
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
    const { loadPrompts } = await import('../../lib/loadPrompts');
    loadPrompts.mockResolvedValueOnce({
      success: true,
      data: [{ id: 'prompt1', title: 'Test Prompt' }]
    });

    const { result } = renderHook(() => useSavedPrompts());
    
    await act(async () => {
      const loadResult = await result.current.loadSavedPrompts();
      expect(loadResult.success).toBe(true);
    });
    
    expect(loadPrompts).toHaveBeenCalled();
    expect(mockSetSavedPrompts).toHaveBeenCalledWith([{ id: 'prompt1', title: 'Test Prompt' }]);
    expect(mockSetSavedPromptsLoading).toHaveBeenCalledWith(false);
  });

  it('should handle load errors correctly', async () => {
    // Mock failed load
    const { loadPrompts } = await import('../../lib/loadPrompts');
    loadPrompts.mockResolvedValueOnce({
      success: false,
      error: 'Failed to load prompts'
    });

    const { result } = renderHook(() => useSavedPrompts());
    
    await act(async () => {
      const loadResult = await result.current.loadSavedPrompts();
      expect(loadResult.success).toBe(false);
    });
    
    expect(loadPrompts).toHaveBeenCalled();
    expect(mockSetSavedPromptsError).toHaveBeenCalledWith('Failed to load prompts');
    expect(mockSetSavedPromptsLoading).toHaveBeenCalledWith(false);
  });

  it('should save prompts correctly', async () => {
    // Mock successful save
    const { savePrompt } = await import('../../lib/savePrompt');
    const { loadPrompts } = await import('../../lib/loadPrompts');
    
    savePrompt.mockResolvedValueOnce({
      success: true,
      promptId: 'new-prompt-id'
    });
    
    // Mock successful load after save
    loadPrompts.mockResolvedValueOnce({
      success: true,
      data: [{ id: 'new-prompt-id', title: 'New Prompt' }]
    });

    const { result } = renderHook(() => useSavedPrompts());
    
    await act(async () => {
      const saveResult = await result.current.saveCurrentPrompt();
      expect(saveResult.success).toBe(true);
    });
    
    expect(savePrompt).toHaveBeenCalled();
    expect(loadPrompts).toHaveBeenCalled();
  });

  it('should handle save errors correctly', async () => {
    // Mock failed save
    const { savePrompt } = await import('../../lib/savePrompt');
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
    const { usePromptStore } = await import('../../store/promptStore');
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
    const { deletePrompt } = await import('../../lib/deletePrompt');
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
    const { deletePrompt } = await import('../../lib/deletePrompt');
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
    const { loadPrompts } = await import('../../lib/loadPrompts');
    loadPrompts.mockResolvedValueOnce({
      success: true,
      data: [{ id: 'prompt1', title: 'Test Prompt' }]
    });

    const { result } = renderHook(() => useSavedPrompts());
    
    await act(async () => {
      result.current.retryLoadPrompts();
    });
    
    // Wait for the async operation to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    expect(loadPrompts).toHaveBeenCalled();
    expect(mockSetSavedPrompts).toHaveBeenCalledWith([{ id: 'prompt1', title: 'Test Prompt' }]);
  });
});