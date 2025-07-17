import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { usePromptStore } from "../store/promptStore"
import { loadPrompts } from "../lib/loadPrompts"
import { deletePrompt } from "../lib/deletePrompt"

export default function SavedPrompts() {
  const {
    savedPrompts,
    savedPromptsLoading,
    savedPromptsError,
    setSavedPrompts,
    setSavedPromptsLoading,
    setSavedPromptsError,
    loadPromptIntoBuilder,
    user
  } = usePromptStore()

  const [deletingPromptId, setDeletingPromptId] = useState(null)

  // Add error boundary
  const [componentError, setComponentError] = useState(null)

  // Load saved prompts when component mounts or user changes
  useEffect(() => {
    if (user) {
      loadSavedPrompts()
    }
  }, [user])

  const loadSavedPrompts = async () => {
    setSavedPromptsLoading(true)
    setSavedPromptsError(null)
    
    try {
      const result = await loadPrompts()
      
      if (result.success) {
        setSavedPrompts(result.data)
      } else {
        setSavedPromptsError(result.error)
      }
    } catch (error) {
      setSavedPromptsError("Failed to load saved prompts")
    } finally {
      setSavedPromptsLoading(false)
    }
  }

  const handleLoadPrompt = (prompt) => {
    loadPromptIntoBuilder(prompt)
  }

  const handleDeleteClick = (prompt) => {
    console.log('Delete clicked for prompt:', prompt)
    
    // Use browser's built-in confirm dialog instead of custom component
    const confirmed = window.confirm(`Are you sure you want to delete "${prompt.title}"? This action cannot be undone.`)
    
    if (confirmed) {
      console.log('User confirmed delete')
      handleDeleteConfirm(prompt)
    } else {
      console.log('User cancelled delete')
    }
  }

  const handleDeleteConfirm = async (prompt) => {
    console.log('Delete confirm called, prompt:', prompt)
    
    if (!prompt) {
      console.log('No prompt to delete, returning')
      return
    }

    console.log('Setting deleting prompt ID:', prompt.id)
    setDeletingPromptId(prompt.id)
    
    try {
      console.log('Calling deletePrompt with ID:', prompt.id)
      const result = await deletePrompt(prompt.id)
      console.log('Delete result:', result)
      
      if (result.success) {
        console.log('Delete successful, updating local state')
        // Remove the deleted prompt from the local state
        setSavedPrompts(savedPrompts.filter(p => p.id !== prompt.id))
        console.log('Local state updated')
      } else {
        console.error('Delete failed:', result.error)
        // Don't set error state, just log it and close dialog
        alert('Failed to delete prompt: ' + (result.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Delete error:', error)
      // Don't set error state, just log it and close dialog
      alert('Failed to delete prompt: ' + error.message)
    } finally {
      console.log('Cleaning up delete state')
      setDeletingPromptId(null)
    }
  }



  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    } catch {
      return 'Unknown date'
    }
  }

  // Component error boundary
  if (componentError) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-red-400 text-xl mr-3">⚠️</div>
            <div>
              <h3 className="text-red-800 font-medium">Component Error</h3>
              <p className="text-red-600 text-sm mt-1">{componentError}</p>
              <button
                onClick={() => {
                  setComponentError(null)
                  loadSavedPrompts()
                }}
                className="mt-2 text-red-700 hover:text-red-800 text-sm font-medium underline"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Loading state
  if (savedPromptsLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-500">Loading your saved prompts...</div>
        </div>
      </div>
    )
  }

  // Error state
  if (savedPromptsError) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-red-400 text-xl mr-3">⚠️</div>
            <div>
              <h3 className="text-red-800 font-medium">Error Loading Prompts</h3>
              <p className="text-red-600 text-sm mt-1">{savedPromptsError}</p>
              <button
                onClick={loadSavedPrompts}
                className="mt-2 text-red-700 hover:text-red-800 text-sm font-medium underline"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Empty state
  if (!savedPrompts || savedPrompts.length === 0) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Saved Prompts
        </h2>
        <div className="text-center py-8">
          <div className="text-gray-400 text-4xl mb-4">🎨</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Your prompt library awaits</h3>
          <p className="text-gray-600 text-sm mb-4 leading-relaxed">
            Save your masterpiece prompts here to reuse them anytime. Build something amazing, then hit that save button!
          </p>
          <button
            onClick={loadSavedPrompts}
            className="
              text-indigo-600 
              hover:text-indigo-700 
              text-sm 
              font-medium 
              underline
              transition-colors
            "
          >
            Refresh Library
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          Saved Prompts
        </h2>
        <p className="text-gray-600 text-sm">
          {savedPrompts.length} prompt{savedPrompts.length !== 1 ? 's' : ''} saved
        </p>
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {savedPrompts.map((prompt, index) => (
            <motion.div
              key={prompt.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ 
                duration: 0.3, 
                delay: index * 0.05,
                ease: "easeOut" 
              }}
              className="
                bg-white 
                rounded-lg 
                border 
                border-gray-200 
                shadow-sm 
                hover:shadow-md 
                transition-all 
                duration-200 
                overflow-hidden
              "
            >
              <div className="p-4">
                <div className="mb-3">
                  <h3 className="font-medium text-gray-900 text-sm leading-tight mb-1">
                    {prompt.title}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {formatDate(prompt.createdAt)}
                  </p>
                </div>
                
                <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                  {prompt.preview}
                </p>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    {prompt.blocks?.length || 0} block{prompt.blocks?.length !== 1 ? 's' : ''}
                  </span>
                  
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleLoadPrompt(prompt)}
                      className="
                        px-3 
                        py-1.5 
                        bg-indigo-500 
                        hover:bg-indigo-600 
                        text-white 
                        text-xs 
                        font-medium 
                        rounded 
                        transition-colors
                      "
                    >
                      Load
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleDeleteClick(prompt)}
                      disabled={deletingPromptId === prompt.id}
                      className="
                        px-3 
                        py-1.5 
                        bg-red-500 
                        hover:bg-red-600 
                        disabled:bg-red-300
                        text-white 
                        text-xs 
                        font-medium 
                        rounded 
                        transition-colors
                        disabled:cursor-not-allowed
                      "
                    >
                      {deletingPromptId === prompt.id ? (
                        '...'
                      ) : (
                        'Delete'
                      )}
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>


    </div>
  )
}