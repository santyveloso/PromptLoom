import { useEffect, useCallback, useRef } from 'react'
import { usePromptStore } from '../store/promptStore'
import { loadPrompts } from '../lib/loadPrompts'
import { deletePrompt } from '../lib/deletePrompt'
import { savePrompt } from '../lib/savePrompt'

/**
 * Custom hook for managing saved prompts with automatic loading,
 * CRUD operations, error handling, and retry logic
 */
export function useSavedPrompts() {
  const {
    user,
    authChecked,
    savedPrompts,
    savedPromptsLoading,
    savedPromptsError,
    setSavedPrompts,
    setSavedPromptsLoading,
    setSavedPromptsError,
    blocks
  } = usePromptStore()

  // Track retry attempts to prevent infinite loops
  const retryCountRef = useRef(0)
  const maxRetries = 3
  const retryDelayMs = 1000

  /**
   * Load saved prompts with simple error handling
   */
  const loadSavedPrompts = useCallback(async () => {
    if (!user) {
      setSavedPromptsError('User not authenticated')
      setSavedPromptsLoading(false)
      return { success: false, error: 'User not authenticated' }
    }

    setSavedPromptsLoading(true)
    setSavedPromptsError(null)

    try {
      const result = await loadPrompts()
      
      if (result.success) {
        setSavedPrompts(result.data || [])
        return { success: true, data: result.data }
      } else {
        setSavedPromptsError(result.error || 'Failed to load prompts')
        return { success: false, error: result.error || 'Failed to load prompts' }
      }
    } catch (error) {
      console.error('Error loading saved prompts:', error)
      setSavedPromptsError(error.message || 'Failed to load saved prompts')
      return { success: false, error: error.message || 'Failed to load saved prompts' }
    } finally {
      setSavedPromptsLoading(false)
    }
  }, [user, setSavedPrompts, setSavedPromptsLoading, setSavedPromptsError])

  /**
   * Save current prompt blocks with error handling
   */
  const saveCurrentPrompt = useCallback(async () => {
    if (!user) {
      return { success: false, error: 'User not authenticated' }
    }

    if (!blocks || blocks.length === 0) {
      return { success: false, error: 'No blocks to save' }
    }

    // Check if blocks have content
    const hasContent = blocks.some(block => 
      block.content && block.content.trim().length > 0
    )
    
    if (!hasContent) {
      return { success: false, error: 'Cannot save empty prompt. Please add some content first.' }
    }

    try {
      const result = await savePrompt(blocks)
      
      if (result.success) {
        // Reload saved prompts to include the new one
        await loadSavedPrompts()
        return { success: true, promptId: result.promptId }
      } else {
        return { success: false, error: result.error || 'Failed to save prompt' }
      }
    } catch (error) {
      console.error('Error saving prompt:', error)
      return { success: false, error: error.message || 'Failed to save prompt' }
    }
  }, [user, blocks, loadSavedPrompts])

  /**
   * Delete a saved prompt with error handling
   */
  const deleteSavedPrompt = useCallback(async (promptId) => {
    if (!user) {
      return { success: false, error: 'User not authenticated' }
    }

    if (!promptId) {
      return { success: false, error: 'Prompt ID is required' }
    }

    try {
      const result = await deletePrompt(promptId)
      
      if (result.success) {
        // Remove the deleted prompt from local state immediately for better UX
        const updatedPrompts = savedPrompts.filter(prompt => prompt.id !== promptId)
        setSavedPrompts(updatedPrompts)
        return { success: true }
      } else {
        return { success: false, error: result.error || 'Failed to delete prompt' }
      }
    } catch (error) {
      console.error('Error deleting prompt:', error)
      return { success: false, error: error.message || 'Failed to delete prompt' }
    }
  }, [user, savedPrompts, setSavedPrompts])

  /**
   * Retry loading saved prompts manually
   */
  const retryLoadPrompts = useCallback(() => {
    retryCountRef.current = 0
    loadSavedPrompts()
  }, [loadSavedPrompts])

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setSavedPromptsError(null)
  }, [setSavedPromptsError])

  // Track if we've attempted to load prompts for this user session
  const hasAttemptedLoad = useRef(false)

  // Automatically load saved prompts when user authenticates
  useEffect(() => {
    if (authChecked && user && !hasAttemptedLoad.current && !savedPromptsLoading) {
      hasAttemptedLoad.current = true
      loadSavedPrompts()
    }
  }, [authChecked, user, savedPromptsLoading, loadSavedPrompts])

  // Clear saved prompts when user logs out
  useEffect(() => {
    if (authChecked && !user) {
      setSavedPrompts([])
      setSavedPromptsError(null)
      setSavedPromptsLoading(false)
      retryCountRef.current = 0
      hasAttemptedLoad.current = false
    }
  }, [authChecked, user, setSavedPrompts, setSavedPromptsError, setSavedPromptsLoading])

  return {
    // State
    savedPrompts,
    savedPromptsLoading,
    savedPromptsError,
    
    // Actions
    loadSavedPrompts,
    saveCurrentPrompt,
    deleteSavedPrompt,
    retryLoadPrompts,
    clearError,
    
    // Computed values
    hasPrompts: savedPrompts.length > 0,
    canSave: user && blocks && blocks.length > 0,
    isRetrying: retryCountRef.current > 0 && retryCountRef.current < maxRetries
  }
}