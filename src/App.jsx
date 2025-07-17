import { usePromptStore } from './store/promptStore'
import PromptBlock from './components/PromptBlock'
import PromptPreview from './components/PromptPreview'
import SavedPrompts from './components/SavedPrompts'
import EmptyState from './components/EmptyState'
import LoadingSpinner from './components/LoadingSpinner'
import { Reorder } from 'framer-motion'
import Login from './components/Login'
import { useAuthListener } from './hooks/useAuthListener'
import { useSavedPrompts } from './hooks/useSavedPrompts'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase'

// Helper function to move elements in array
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

  // Initialize saved prompts loading and get functions
  const { saveCurrentPrompt } = useSavedPrompts()

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
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm bg-white/80 backdrop-blur-sm border border-gray-200/50 p-8">
          <LoadingSpinner size="lg" text="Loading your workspace..." />
        </div>
      </div>
    )
  }

  if (!user) {
    return <Login />
  }

  return (
    <div className="min-h-screen bg-gradient-to-tr from-amber-50 via-orange-50 to-rose-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                PromptLoom
              </h1>
            </div>

            {/* User Profile & Logout */}
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <img
                  src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || user.email)}&background=6366f1&color=fff`}
                  alt={user.displayName || user.email}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full ring-2 ring-white shadow-sm"
                />
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-gray-900 truncate max-w-32 lg:max-w-none">
                    {user.displayName || user.email}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="bg-gray-100 text-gray-700 hover:bg-gray-200 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors duration-200"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
          {/* Saved Prompts Sidebar */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm bg-white/80 backdrop-blur-sm border border-gray-200/50 sticky top-24">
              <SavedPrompts />
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3 order-1 lg:order-2">
            <div className="space-y-6 sm:space-y-8">
              {/* Block Controls */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm bg-white/80 backdrop-blur-sm border border-gray-200/50 p-4 sm:p-6">
                <h2 className="text-base sm:text-lg font-medium text-gray-900 leading-snug mb-4 sm:mb-6">
                  Build Your Prompt
                </h2>
                <div className="flex gap-3 flex-wrap">
                  {['Task', 'Tone', 'Format', 'Persona', 'Constraint'].map((type) => (
                    <button
                      key={type}
                      onClick={() => addBlock(type)}
                      className="bg-gradient-to-r from-purple-500 to-pink-400 text-white font-semibold px-4 py-2.5 rounded-lg shadow-sm hover:shadow-md hover:from-purple-600 hover:to-pink-500 transition-all duration-200 text-sm"
                    >
                      + {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Prompt Builder */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm bg-white/80 backdrop-blur-sm border border-gray-200/50 p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                  <h2 className="text-base sm:text-lg font-medium text-gray-900 leading-snug">
                    Prompt Blocks
                  </h2>
                  <button
                    onClick={saveCurrentPrompt}
                    disabled={blocks.length === 0}
                    className="bg-green-500 text-white hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed px-4 py-2 text-sm w-full sm:w-auto font-medium rounded-lg transition-colors shadow-sm"
                  >
                    💾 Save Prompt
                  </button>
                </div>

                {blocks.length === 0 ? (
                  <EmptyState
                    icon="🧩"
                    title="Ready to build something amazing?"
                    description="Your prompt canvas is empty and waiting for your creativity. Start by adding a Task block to define what you want to accomplish, then layer on tone, format, and constraints to craft the perfect prompt."
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
                        className="cursor-grab active:cursor-grabbing focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-xl"
                        tabIndex={0}
                      >
                        <PromptBlock block={block} />
                      </Reorder.Item>
                    ))}
                  </Reorder.Group>
                )}
              </div>

              {/* Preview Area */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm bg-white/80 backdrop-blur-sm border border-gray-200/50">
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
