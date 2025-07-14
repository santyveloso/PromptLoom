import { motion } from "framer-motion"
import { usePromptStore } from "../store/promptStore"

const typeColors = {
  Task: "bg-blue-50 border-blue-500",
  Tone: "bg-pink-50 border-pink-500",
  Format: "bg-yellow-50 border-yellow-500",
  Persona: "bg-green-50 border-green-500",
  Constraint: "bg-red-50 border-red-500",
}

export default function PromptBlock({ block }) {
  const updateBlock = usePromptStore((s) => s.updateBlock)
  const removeBlock = usePromptStore((s) => s.removeBlock)

  return (
    <motion.div
      key={block.id}
      initial={{ opacity: 0, scale: 0.95, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: -10 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={`p-4 border-l-4 rounded-xl shadow transition-all duration-200 hover:shadow-md ${typeColors[block.type] || "bg-gray-100 border-gray-300"}`}
    >
      <div className="flex justify-between items-center mb-2">
        <span className="font-semibold text-gray-700">{block.type}</span>
        <button
          onClick={() => removeBlock(block.id)}
          className="text-sm text-gray-400 hover:text-red-500 transition-colors"
        >
          ✖
        </button>
      </div>
      <textarea
        placeholder="Type here..."
        className="w-full bg-white rounded-md p-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
        value={block.content}
        onChange={(e) => updateBlock(block.id, e.target.value)}
        rows={3}
      />
    </motion.div>
  )
}
