import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { usePromptStore } from "../store/promptStore"
import { useSavedPrompts } from "../hooks/useSavedPrompts"
import EmptyState from "./EmptyState"

export default function SavedPrompts() {
  const {
    savedPrompts,
    savedPromptsLoading,
    savedPromptsError,
    loadPromptIntoBuilder
  } = usePromptStore()

  const {
    deleteSavedPrompt,
    retryLoadPrompts
  } = useSavedPrompts()

  const [deletingPromptId, setDeletingPromptId] = useState(null)

  // Add error boundary
  const [componentError, setComponentError] = useState(null)

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
    if (!prompt) {
      return
    }

    setDeletingPromptId(prompt.id)
    
    try {
      const result = await deleteSavedPrompt(prompt.id)
      
      if (!result.success) {
        alert('Failed to delete prompt: ' + (result.error || 'Unknown error'))
      }
    } catch (error) {
      alert('Failed to delete prompt: ' + error.message)
    } finally {
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
      <div className="p-4 sm:p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-red-400 text-xl mr-3">⚠️</div>
            <div>
              <h3 className="text-red-800 font-medium">Component Error</h3>
              <p className="text-red-600 text-sm mt-1">{componentError}</p>
              <button
                onClick={() => {
                  setComponentError(null)
                  retryLoadPrompts()
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
      <div className="p-4 sm:p-6">
        <div className="flex items-center justify-center py-8">
          <div className="text-sm sm:text-base text-gray-500">Loading your saved prompts...</div>
        </div>
      </div>
    )
  }

  // Error state
  if (savedPromptsError) {
    return (
      <div className="p-4 sm:p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-red-400 text-xl mr-3">⚠️</div>
            <div>
              <h3 className="text-red-800 font-medium">Error Loading Prompts</h3>
              <p className="text-red-600 text-sm mt-1">{savedPromptsError}</p>
              <button
                onClick={retryLoadPrompts}
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
      <div className="p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 mb-4">
          Saved Prompts
        </h2>
        <EmptyState
          icon="🎨"
          title="Your prompt library awaits"
          description="Save your masterpiece prompts here to reuse them anytime. Build something amazing, then hit that save button!"
          actionText="Refresh Library"
          onAction={retryLoadPrompts}
        />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 mb-2">
          Saved Prompts
        </h2>
        <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
          {savedPrompts.length} prompt{savedPrompts.length !== 1 ? 's' : ''} saved
        </p>
      </div>

      <div className="space-y-3 sm:space-y-4">
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
              className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
            >
              <div className="p-3 sm:p-4">
                <div className="mb-3">
                  <h3 className="text-sm sm:text-base font-medium text-gray-900 leading-tight mb-1 line-clamp-2">
                    {prompt.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
                    {formatDate(prompt.createdAt)}
                  </p>
                </div>
                
                <p className="text-sm sm:text-base text-gray-600 mb-4 line-clamp-3 leading-relaxed">
                  {prompt.preview}
                </p>
                
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs sm:text-sm text-gray-500 leading-relaxed flex-shrink-0">
                    {prompt.blocks?.length || 0} block{prompt.blocks?.length !== 1 ? 's' : ''}
                  </span>
                  
                  <div className="flex gap-2 flex-shrink-0">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleLoadPrompt(prompt)}
                      className="bg-gradient-to-r from-purple-500 to-pink-400 text-white font-semibold hover:from-purple-600 hover:to-pink-500 px-2.5 py-1.5 text-xs rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                      aria-label={`Load prompt: ${prompt.title}`}
                    >
                      Load
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleDeleteClick(prompt)}
                      disabled={deletingPromptId === prompt.id}
                      className="bg-red-500 text-white hover:bg-red-600 disabled:bg-red-300 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors duration-200 shadow-sm disabled:cursor-not-allowed"
                      aria-label={`Delete prompt: ${prompt.title}`}
                    >
                      {deletingPromptId === prompt.id ? (
                        <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
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