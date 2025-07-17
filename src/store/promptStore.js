import { create } from 'zustand'
import { nanoid } from 'nanoid'

export const usePromptStore = create((set) => ({
  blocks: [],
  user: null,
  authChecked: false,
  savedPrompts: [],
  savedPromptsLoading: false,
  savedPromptsError: null,
  
  setUser: (user) => set ({user}),
  setAuthChecked: (val) => set(() => ({ authChecked: val})),
  
  addBlock: (type) => set((state) => ({
    blocks: [...state.blocks, { id: nanoid(), type, content: "" }]
  })),

  updateBlock: (id, newContent) => set((state) => ({
    blocks: state.blocks.map(b => b.id === id ? { ...b, content: newContent } : b)
  })),

  removeBlock: (id) => set((state) => ({
    blocks: state.blocks.filter(b => b.id !== id)
  })),

  reorderBlocks: (newOrder) => set(() => ({
    blocks: newOrder
  })),

  // Saved prompts actions
  setSavedPrompts: (prompts) => set(() => ({
    savedPrompts: prompts
  })),

  setSavedPromptsLoading: (loading) => set(() => ({
    savedPromptsLoading: loading
  })),

  setSavedPromptsError: (error) => set(() => ({
    savedPromptsError: error
  })),

  loadPromptIntoBuilder: (prompt) => set(() => ({
    blocks: prompt.blocks.map(block => ({
      ...block,
      id: nanoid() // Generate new IDs to avoid conflicts
    }))
  })),

  clearBuilder: () => set(() => ({
    blocks: []
  }))
}))
