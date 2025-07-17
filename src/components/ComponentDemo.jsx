import { useState } from 'react'
import EmptyState from './EmptyState'
import LoadingSpinner from './LoadingSpinner'
import ConfirmDialog from './ConfirmDialog'

export default function ComponentDemo() {
  const [showDialog, setShowDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleAction = () => {
    console.log('Action button clicked!')
  }

  const handleConfirm = () => {
    console.log('Confirmed!')
    setShowDialog(false)
  }

  const handleCancel = () => {
    console.log('Cancelled!')
    setShowDialog(false)
  }

  const toggleLoading = () => {
    setIsLoading(!isLoading)
  }

  return (
    <div className="p-8 space-y-12 bg-gradient-to-tr from-amber-50 via-orange-50 to-rose-100 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 text-center mb-8">
        UI Components Demo
      </h1>

      {/* EmptyState Demo */}
      <section className="bg-white rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">EmptyState Component</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-600 mb-2">With Action Button</h3>
            <EmptyState
              title="No saved prompts yet"
              description="Create and save your first prompt to see it appear here. Your saved prompts will help you quickly reuse your favorite configurations."
              actionText="Create First Prompt"
              onAction={handleAction}
              icon="📝"
            />
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Without Action Button</h3>
            <EmptyState
              title="Preview will appear here"
              description="Start adding blocks to your prompt and see the preview update in real-time."
              icon="👀"
            />
          </div>
        </div>
      </section>

      {/* LoadingSpinner Demo */}
      <section className="bg-white rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">LoadingSpinner Component</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border border-gray-200 rounded-lg p-4 text-center">
            <h3 className="text-sm font-medium text-gray-600 mb-4">Small Spinner</h3>
            <LoadingSpinner size="sm" color="blue" />
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4 text-center">
            <h3 className="text-sm font-medium text-gray-600 mb-4">Medium with Text</h3>
            <LoadingSpinner size="md" color="indigo" text="Loading prompts..." />
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4 text-center">
            <h3 className="text-sm font-medium text-gray-600 mb-4">Large Spinner</h3>
            <LoadingSpinner size="lg" color="purple" />
          </div>
        </div>
        
        <div className="mt-6 text-center">
          <button
            onClick={toggleLoading}
            className="bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 transition-colors"
          >
            {isLoading ? 'Hide' : 'Show'} Loading State
          </button>
          
          {isLoading && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <LoadingSpinner size="md" color="green" text="Saving your prompt..." />
            </div>
          )}
        </div>
      </section>

      {/* ConfirmDialog Demo */}
      <section className="bg-white rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">ConfirmDialog Component</h2>
        <div className="space-y-4">
          <button
            onClick={() => setShowDialog(true)}
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
          >
            Show Delete Confirmation
          </button>
          
          <p className="text-sm text-gray-600">
            Click the button above to see the confirmation dialog. 
            You can close it by clicking Cancel, Confirm, pressing Escape, or clicking the backdrop.
          </p>
        </div>
      </section>

      {/* ConfirmDialog */}
      <ConfirmDialog
        isOpen={showDialog}
        title="Delete Prompt"
        message="Are you sure you want to delete this prompt? This action cannot be undone and you will lose all the blocks and content in this prompt."
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        confirmText="Delete Forever"
        cancelText="Keep It"
        confirmVariant="danger"
      />
    </div>
  )
}