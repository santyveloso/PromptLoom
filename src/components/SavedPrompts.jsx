import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePromptStore } from "../store/promptStore";
import { useSavedPrompts } from "../hooks/useSavedPrompts";
import EmptyState from "./EmptyState";
import ConfirmDialog from "./ConfirmDialog";
import {
  getFirebaseErrorMessage,
  categorizeError,
  getRecoveryAction,
} from "../lib/errorHandling";
import { updatePromptPinState } from "../lib/updatePromptPinState";

export default function SavedPrompts() {
  const {
    savedPrompts,
    savedPromptsLoading,
    savedPromptsError,
    loadPromptIntoBuilder,
  } = usePromptStore();

  const { deleteSavedPrompt, retryLoadPrompts } = useSavedPrompts();

  const [deletingPromptId, setDeletingPromptId] = useState(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [promptToDelete, setPromptToDelete] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [togglingPinId, setTogglingPinId] = useState(null);

  // Search state
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredPrompts, setFilteredPrompts] = useState([]);

  // Add error boundary
  const [componentError, setComponentError] = useState(null);

  // Clean up debounce timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, []);

  // Sort and filter prompts
  useEffect(() => {
    if (!savedPrompts) {
      setFilteredPrompts([]);
      return;
    }

    // First sort by pin status, then by date
    const sortedPrompts = [...savedPrompts].sort((a, b) => {
      // First sort by pin status (pinned first)
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;

      // If both are pinned, sort by pinnedAt date (most recent first)
      if (a.isPinned && b.isPinned) {
        return new Date(b.pinnedAt) - new Date(a.pinnedAt);
      }

      // If neither are pinned, sort by createdAt date (most recent first)
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    // Then filter by search term if present
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();

      // First try to match by name
      let matched = sortedPrompts.filter(
        (prompt) =>
          (prompt.customName &&
            prompt.customName.toLowerCase().includes(term)) ||
          prompt.title.toLowerCase().includes(term)
      );

      // If no matches by name, search in content
      if (matched.length === 0) {
        matched = sortedPrompts.filter((prompt) => {
          // Search in all blocks content
          return (
            prompt.blocks.some(
              (block) =>
                block.content && block.content.toLowerCase().includes(term)
            ) || prompt.preview.toLowerCase().includes(term)
          );
        });
      }

      setFilteredPrompts(matched);
    } else {
      // No search term, show all sorted prompts
      setFilteredPrompts(sortedPrompts);
    }
  }, [savedPrompts, searchTerm]);

  // Custom debounce implementation
  const debounceTimeout = useRef(null);

  const handleSearchChange = (e) => {
    const value = e.target.value;

    // Clear any existing timeout
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    // Set a new timeout
    debounceTimeout.current = setTimeout(() => {
      setSearchTerm(value);
    }, 300);
  };

  const clearSearch = () => {
    setSearchTerm("");
    // Clear the input field value directly
    const searchInput = document.getElementById("prompt-search");
    if (searchInput) {
      searchInput.value = "";
    }
  };

  const handleLoadPrompt = (prompt) => {
    try {
      loadPromptIntoBuilder(prompt);
    } catch (error) {
      console.error("Error loading prompt into builder:", error);
      setErrorMessage(
        getFirebaseErrorMessage(error) || "Failed to load prompt"
      );

      // Auto-dismiss error after 5 seconds
      setTimeout(() => setErrorMessage(null), 5000);
    }
  };

  const handleDeleteClick = (prompt) => {
    setPromptToDelete(prompt);
    setConfirmDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!promptToDelete) {
      return;
    }

    setDeletingPromptId(promptToDelete.id);
    setConfirmDialogOpen(false);

    try {
      const result = await deleteSavedPrompt(promptToDelete.id);

      if (!result.success) {
        const errorMsg = result.error || "Unknown error";
        console.error("Failed to delete prompt:", errorMsg);
        setErrorMessage(
          getFirebaseErrorMessage({ message: errorMsg }) ||
            "Failed to delete prompt"
        );

        // Auto-dismiss error after 5 seconds
        setTimeout(() => setErrorMessage(null), 5000);
      }
    } catch (error) {
      console.error("Error deleting prompt:", error);

      const errorCategory = categorizeError(error);
      const recovery = getRecoveryAction(errorCategory);

      setErrorMessage(
        `${getFirebaseErrorMessage(error)}. ${recovery.description}`
      );

      // Auto-dismiss error after 5 seconds
      setTimeout(() => setErrorMessage(null), 5000);
    } finally {
      setDeletingPromptId(null);
      setPromptToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setConfirmDialogOpen(false);
    setPromptToDelete(null);
  };

  const handleTogglePin = async (prompt) => {
    setTogglingPinId(prompt.id);

    try {
      // Optimistic update
      const newPinState = !prompt.isPinned;

      // Update local state first for immediate feedback
      const updatedPrompts = savedPrompts.map((p) =>
        p.id === prompt.id
          ? {
              ...p,
              isPinned: newPinState,
              pinnedAt: newPinState ? new Date().toISOString() : null,
            }
          : p
      );

      usePromptStore.getState().setSavedPrompts(updatedPrompts);

      // Then update in Firestore
      const result = await updatePromptPinState(prompt.id, newPinState);

      if (!result.success) {
        // Rollback on failure
        usePromptStore.getState().setSavedPrompts(savedPrompts);

        const errorMsg = result.error || "Unknown error";
        console.error("Failed to update pin state:", errorMsg);
        setErrorMessage(
          getFirebaseErrorMessage({ message: errorMsg }) ||
            "Failed to pin/unpin prompt"
        );

        // Auto-dismiss error after 5 seconds
        setTimeout(() => setErrorMessage(null), 5000);
      }
    } catch (error) {
      // Rollback on error
      usePromptStore.getState().setSavedPrompts(savedPrompts);

      console.error("Error toggling pin state:", error);

      const errorCategory = categorizeError(error);
      const recovery = getRecoveryAction(errorCategory);

      setErrorMessage(
        `${getFirebaseErrorMessage(error)}. ${recovery.description}`
      );

      // Auto-dismiss error after 5 seconds
      setTimeout(() => setErrorMessage(null), 5000);
    } finally {
      setTogglingPinId(null);
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "Unknown date";
    }
  };

  const getBlockTypeIcons = (blocks) => {
    if (!blocks || blocks.length === 0) return ["📄"];

    const iconMap = {
      Task: "📋",
      Tone: "🎭",
      Format: "📝",
      Persona: "👤",
      Constraint: "⚠️",
    };

    return blocks.slice(0, 3).map((block) => iconMap[block.type] || "📄");
  };

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
                  setComponentError(null);
                  retryLoadPrompts();
                }}
                className="mt-2 text-red-700 hover:text-red-800 text-sm font-medium underline"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (savedPromptsLoading) {
    return (
      <div className="p-4 sm:p-6">
        <div className="flex items-center justify-center py-8">
          <div className="text-sm sm:text-base text-gray-500">
            Loading your saved prompts...
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (savedPromptsError) {
    return (
      <div className="p-4 sm:p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-red-400 text-xl mr-3">⚠️</div>
            <div>
              <h3 className="text-red-800 font-medium">
                Error Loading Prompts
              </h3>
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
    );
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
    );
  }

  return (
    <div className="p-4 sm:p-6">
      {/* Error message toast */}
      <AnimatePresence>
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-center justify-between"
          >
            <div className="flex items-center">
              <div className="text-red-400 text-xl mr-3">⚠️</div>
              <p className="text-red-600 text-sm">{errorMessage}</p>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Dismiss error"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                ></path>
              </svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 mb-2">
          Saved Prompts
        </h2>
        <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
          {savedPrompts.length} prompt{savedPrompts.length !== 1 ? "s" : ""}{" "}
          saved
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-4 relative">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
              className="w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              ></path>
            </svg>
          </div>
          <input
            id="prompt-search"
            type="text"
            placeholder="Search prompts by name or content..."
            onChange={handleSearchChange}
            className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          />
          {searchTerm && (
            <button
              onClick={clearSearch}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              aria-label="Clear search"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                ></path>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Search results count when filtering */}
      {searchTerm && (
        <div className="mb-3">
          <p className="text-xs text-gray-500">
            {filteredPrompts.length === 0
              ? "No prompts found"
              : `Found ${filteredPrompts.length} prompt${
                  filteredPrompts.length !== 1 ? "s" : ""
                }`}
          </p>
        </div>
      )}

      {/* Empty search state */}
      {searchTerm && filteredPrompts.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="No matching prompts found"
          description="Try a different search term or clear the search to see all your prompts."
          actionText="Clear Search"
          onAction={clearSearch}
        />
      ) : (
        <div className="space-y-3 sm:space-y-4">
          <AnimatePresence>
            {filteredPrompts.map((prompt, index) => (
              <motion.div
                key={prompt.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{
                  duration: 0.3,
                  delay: index * 0.05,
                  ease: "easeOut",
                }}
                className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
              >
                <div className="p-3 sm:p-4">
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <div
                          className="w-3 h-6 rounded-full shadow-sm border border-white/50"
                          style={{
                            backgroundColor: prompt.customColor || "#6366f1",
                          }}
                        ></div>
                        <h3 className="text-sm sm:text-base font-medium text-gray-900 leading-tight line-clamp-2">
                          {prompt.customName || prompt.title}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
                        <span>{formatDate(prompt.createdAt)}</span>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          {getBlockTypeIcons(prompt.blocks).map((icon, idx) => (
                            <span key={idx} className="text-xs">
                              {icon}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Pin Button */}
                    <button
                      onClick={() => handleTogglePin(prompt)}
                      disabled={togglingPinId === prompt.id}
                      className={`p-1.5 rounded-full transition-all duration-200 ${
                        prompt.isPinned
                          ? "text-amber-500 hover:text-amber-600 hover:bg-amber-50"
                          : "text-gray-400 hover:text-amber-500 hover:bg-amber-50"
                      }`}
                      aria-label={
                        prompt.isPinned ? "Unpin prompt" : "Pin prompt"
                      }
                      title={prompt.isPinned ? "Unpin prompt" : "Pin prompt"}
                    >
                      {togglingPinId === prompt.id ? (
                        <svg
                          className="w-4 h-4 animate-spin"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                      ) : prompt.isPinned ? (
                        <svg
                          className="w-5 h-5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ) : (
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                          />
                        </svg>
                      )}
                    </button>
                  </div>

                  <p className="text-sm sm:text-base text-gray-600 mb-4 line-clamp-3 leading-relaxed">
                    {prompt.preview}
                  </p>

                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs sm:text-sm text-gray-500 leading-relaxed flex-shrink-0">
                      {prompt.blocks?.length || 0} block
                      {prompt.blocks?.length !== 1 ? "s" : ""}
                    </span>

                    <div className="flex gap-2 flex-shrink-0">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleLoadPrompt(prompt)}
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold hover:from-indigo-700 hover:to-purple-700 px-2.5 py-1.5 text-xs rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
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
                          <svg
                            className="w-3 h-3 animate-spin"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                        ) : (
                          "Delete"
                        )}
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialogOpen}
        title="Delete Prompt"
        message={
          promptToDelete
            ? `Are you sure you want to delete "${promptToDelete.title}"? This action cannot be undone.`
            : "Are you sure you want to delete this prompt?"
        }
        confirmText="Delete"
        cancelText="Cancel"
        confirmVariant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={handleCancelDelete}
      />
    </div>
  );
}
