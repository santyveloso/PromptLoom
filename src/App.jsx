import { usePromptStore } from './store/promptStore'
import PromptBlock from './components/PromptBlock'
import PromptPreview from './components/PromptPreview'
import SavedPrompts from './components/SavedPrompts'
import EmptyState from './components/EmptyState'
import { Reorder } from 'framer-motion'
import { savePrompt } from './lib/savePrompt'
import Login from './components/Login'
import { useAuthListener } from './hooks/useAuthListener'
import { useSavedPrompts } from './hooks/useSavedPrompts'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase'

// Função auxiliar para mover elementos no array
function move(array, from, to) {
  const newArray = [...array]
  const item = newArray.splice(from, 1)[0]
  newArray.splice(to, 0, item)
  return newArray
}

function App() {
  const user = usePromptStore((s) => s.user)
  const authChecked = usePromptStore((s => s.authChecked))
  const blocks = usePromptStore((s) => s.blocks)
  const addBlock = usePromptStore((s) => s.addBlock)
  const reorderBlocks = usePromptStore((s) => s.reorderBlocks)

  // Initialize saved prompts loading
  useSavedPrompts()

  const handleDragEnd = (info, id) => {
    const fromIndex = blocks.findIndex((block) => block.id === id)
    const offsetY = info.offset.y
    const direction = offsetY > 0 ? 1 : -1
    const toIndex = fromIndex + direction
    if (toIndex < 0 || toIndex >= blocks.length) return

    const newOrder = move(blocks, fromIndex, toIndex)
    reorderBlocks(newOrder)
  }

  const handleLogout = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  useAuthListener()

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-gradient-to-tr from-amber-50 via-orange-50 to-rose-100 flex items-center justify-center">
        <div className="text-gray-500 text-lg">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return <Login />
  }

  return (
    <div className="min-h-screen bg-gradient-to-tr from-amber-50 via-orange-50 to-rose-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                PromptLoom
              </h1>
            </div>

            {/* User Profile & Logout */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <img
                  src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || user.email)}&background=6366f1&color=fff`}
                  alt={user.displayName || user.email}
                  className="w-8 h-8 rounded-full"
                />
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">
                    {user.displayName || user.email}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="
                  px-3 py-2 
                  text-sm font-medium 
                  text-gray-700 hover:text-gray-900 
                  bg-gray-100 hover:bg-gray-200 
                  rounded-md 
                  transition-colors
                "
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Saved Prompts Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white/80 backdrop-blur-sm rounded-lg border border-gray-200 shadow-sm sticky top-24">
              <SavedPrompts />
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            <div className="space-y-8">
              {/* Block Controls */}
              <div className="bg-white/80 backdrop-blur-sm rounded-lg border border-gray-200 shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Build Your Prompt
                </h2>
                <div className="flex gap-2 flex-wrap">
                  {['Task', 'Tone', 'Format', 'Persona', 'Constraint'].map((type) => (
                    <button
                      key={type}
                      onClick={() => addBlock(type)}
                      className="
                        bg-indigo-500 hover:bg-indigo-600
                        text-white
                        px-4 py-2
                        rounded-md
                        text-sm font-medium
                        shadow-sm
                        transition-colors
                      "
                    >
                      + {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Prompt Builder */}
              <div className="bg-white/80 backdrop-blur-sm rounded-lg border border-gray-200 shadow-sm p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Prompt Blocks
                  </h2>
                  <button
                    onClick={() => savePrompt(blocks)}
                    disabled={blocks.length === 0}
                    className="
                      bg-green-500 hover:bg-green-600 
                      disabled:bg-gray-300 disabled:cursor-not-allowed
                      text-white 
                      px-4 py-2 
                      rounded-md 
                      text-sm font-medium
                      shadow-sm
                      transition-colors
                    "
                  >
                    💾 Save Prompt
                  </button>
                </div>

                {blocks.length === 0 ? (
                  <EmptyState
                    icon="🧩"
                    title="Ready to build something amazing?"
                    description="Your prompt canvas is empty and waiting for your creativity. Add blocks above to start crafting your perfect prompt."
                    actionText="Add Your First Block"
                    onAction={() => addBlock('Task')}
                  />
                ) : (
                  <Reorder.Group
                    axis="y"
                    values={blocks}
                    onReorder={(newOrder) => reorderBlocks(newOrder)}
                    className="space-y-4 list-none"
                  >
                    {blocks.map((block) => (
                      <Reorder.Item
                        key={block.id}
                        value={block}
                        layout
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        className="cursor-grab active:cursor-grabbing"
                      >
                        <PromptBlock block={block} />
                      </Reorder.Item>
                    ))}
                  </Reorder.Group>
                )}
              </div>

              {/* Preview Area */}
              <div className="bg-white/80 backdrop-blur-sm rounded-lg border border-gray-200 shadow-sm">
                <PromptPreview />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
