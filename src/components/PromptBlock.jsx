import { usePromptStore } from "../store/promptStore"
import { motion } from "framer-motion"

const typeColors = {
  Task: "bg-blue-100 border-blue-400",
  Tone: "bg-pink-100 border-pink-400",
  Format: "bg-yellow-100 border-yellow-400",
  Persona: "bg-green-100 border-green-400",
  Constraint: "bg-red-100 border-red-400",
}

export default function PromptBlock({ block }) {
  const updateBlock = usePromptStore((s) => s.updateBlock)
  const removeBlock = usePromptStore((s) => s.removeBlock)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`p-4 border-2 rounded-lg shadow-sm mb-2 ${typeColors[block.type] || "bg-gray-100"}`}
    >
      <div className="flex justify-between items-center mb-2">
        <span className="font-semibold">{block.type}</span>
        <button
          onClick={() => removeBlock(block.id)}
          className="text-sm text-gray-500 hover:text-red-600"
        >
          ✖
        </button>
      </div>
      <textarea
        placeholder="Type here..."
        className="w-full bg-white rounded p-2 text-sm border"
        value={block.content}
        onChange={(e) => updateBlock(block.id, e.target.value)}
      />
    </motion.div>
  )
}
