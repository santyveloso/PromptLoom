import { motion } from "framer-motion"
import { usePromptStore } from "../store/promptStore"

const typeColors = {
  Task: "bg-blue-50 border-blue-500 text-blue-900 border-l-blue-600",
  Tone: "bg-pink-50 border-pink-500 text-pink-900 border-l-pink-600",
  Format: "bg-amber-50 border-amber-500 text-amber-900 border-l-amber-600",
  Persona: "bg-emerald-50 border-emerald-500 text-emerald-900 border-l-emerald-600",
  Constraint: "bg-red-50 border-red-500 text-red-900 border-l-red-600",
}

const blockIcons = {
  Task: "📋",
  Tone: "🎭", 
  Format: "📝",
  Persona: "👤",
  Constraint: "⚠️",
}

export default function PromptBlock({ block }) {
  const updateBlock = usePromptStore((s) => s.updateBlock)
  const removeBlock = usePromptStore((s) => s.removeBlock)

  const blockIcon = blockIcons[block.type] || "📄"

  return (
    <motion.div
      key={block.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      whileHover={{ y: -2 }}
      whileTap={{ y: 0 }}
      transition={{ 
        type: "spring", 
        stiffness: 300, 
        damping: 25,
        duration: 0.2 
      }}
      className={`
        relative p-4 sm:p-5 border-l-8 rounded-xl shadow-lg hover:shadow-xl 
        transition-all duration-200 cursor-pointer
        ${getBackgroundClass(block.type)}
        before:content-[''] before:absolute before:top-[-8px] before:left-5 
        before:w-4 before:h-4 before:rounded-full before:shadow-sm
      `}
    >
      {/* Scratch-like connector notch */}
      <div 
        className={`absolute top-[-8px] left-5 w-4 h-4 rounded-full shadow-sm ${getBorderColor(block.type)}`}
      />
      
      <div className="flex justify-between items-center mb-3 sm:mb-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">{blockIcon}</span>
          <span className="text-sm sm:text-base font-semibold">{block.type}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => removeBlock(block.id)}
            className="
              p-1 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 
              transition-all duration-200 focus:outline-none focus:ring-2 
              focus:ring-red-500 focus:ring-offset-1
            "
            aria-label={`Remove ${block.type} block`}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>



      <textarea
        placeholder={getPlaceholderText(block.type)}
        className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white/90 placeholder-gray-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none min-h-[80px] sm:min-h-[90px] backdrop-blur-sm"
        value={block.content}
        onChange={(e) => updateBlock(block.id, e.target.value)}
        rows={3}
        aria-label={`${block.type} content`}
      />
    </motion.div>
  )
}

// Helper functions for styling
function getBackgroundClass(blockType) {
  const backgrounds = {
    Task: 'bg-gradient-to-br from-blue-50 via-blue-100 to-blue-50 border-blue-500 text-blue-900',
    Tone: 'bg-gradient-to-br from-pink-50 via-pink-100 to-pink-50 border-pink-500 text-pink-900',
    Format: 'bg-gradient-to-br from-amber-50 via-amber-100 to-amber-50 border-amber-500 text-amber-900',
    Persona: 'bg-gradient-to-br from-emerald-50 via-emerald-100 to-emerald-50 border-emerald-500 text-emerald-900',
    Constraint: 'bg-gradient-to-br from-red-50 via-red-100 to-red-50 border-red-500 text-red-900',
  }
  return backgrounds[blockType] || 'bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 border-gray-400 text-gray-900'
}

function getBorderColor(blockType) {
  const colors = {
    Task: 'bg-blue-500',
    Tone: 'bg-pink-500',
    Format: 'bg-amber-500', 
    Persona: 'bg-emerald-500',
    Constraint: 'bg-red-500',
  }
  return colors[blockType] || 'bg-gray-500'
}

function getPlaceholderText(blockType) {
  const placeholders = {
    Task: 'What do you want the AI to do? (e.g., "Write a product description for...")',
    Tone: 'What tone should the AI use? (e.g., "Professional and friendly")',
    Format: 'How should the output be formatted? (e.g., "As a bulleted list")',
    Persona: 'What role should the AI take? (e.g., "You are a marketing expert...")',
    Constraint: 'Any specific rules or limits? (e.g., "Keep it under 100 words")',
  }
  return placeholders[blockType] || `Enter your ${blockType.toLowerCase()} details...`
}
