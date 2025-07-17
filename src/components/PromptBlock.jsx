import { motion } from "framer-motion"
import { usePromptStore } from "../store/promptStore"

const typeColors = {
  Task: "bg-blue-50 border-blue-500 text-blue-900",
  Tone: "bg-pink-50 border-pink-500 text-pink-900",
  Format: "bg-yellow-50 border-yellow-500 text-yellow-900",
  Persona: "bg-green-50 border-green-500 text-green-900",
  Constraint: "bg-red-50 border-red-500 text-red-900",
}

export default function PromptBlock({ block }) {
  const updateBlock = usePromptStore((s) => s.updateBlock)
  const removeBlock = usePromptStore((s) => s.removeBlock)

  const colorClasses = typeColors[block.type] || "bg-gray-50 border-gray-400 text-gray-900"

  return (
    <motion.div
      key={block.id}
      initial={{ opacity: 0, scale: 0.95, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: -10 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={`p-4 sm:p-5 border-l-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 ${colorClasses}`}
    >
      <div className="flex justify-between items-center mb-3 sm:mb-4">
        <span className="text-sm sm:text-base font-semibold">{block.type}</span>
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
      <textarea
        placeholder={`Enter your ${block.type.toLowerCase()} details...`}
        className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none min-h-[80px] sm:min-h-[90px]"
        value={block.content}
        onChange={(e) => updateBlock(block.id, e.target.value)}
        rows={3}
        aria-label={`${block.type} content`}
      />
    </motion.div>
  )
}
