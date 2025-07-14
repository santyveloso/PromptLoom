import { create } from 'zustand'
import { nanoid } from 'nanoid'

export const usePromptStore = create((set) => ({
  blocks: [],
  user: null,
  setUser: (user) => set ({user}),
  
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
  }))
}))
