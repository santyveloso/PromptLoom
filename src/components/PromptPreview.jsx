import { useMemo } from "react"
import { usePromptStore } from "../store/promptStore"
import EmptyState from "./EmptyState"
import { motion } from "framer-motion"
import { sortBlocksByOrder } from "../constants/blockTypes"

export default function PromptPreview() {
  const blocks = usePromptStore((s) => s.blocks)
  const addBlock = usePromptStore((s) => s.addBlock)

  // Memoize the sorted and filtered blocks to reduce computation on every render
  const combinedPrompt = useMemo(() => {
    return sortBlocksByOrder(blocks)
      .filter((b) => b && b.content && b.content.trim() !== "")
      .map((b) => `${b.type}: ${b.content.trim()}`)
      .join("\n\n")
  }, [blocks])

  const hasContent = combinedPrompt.trim() !== ""
  const hasBlocks = blocks.length > 0
  const hasEmptyBlocks = blocks.some(b => b && b.content && b.content.trim() === "")

  return (
    <div className="p-4 sm:p-6">
      <h2 className="text-base sm:text-lg font-medium text-gray-900 leading-snug mb-4 sm:mb-6 flex items-center gap-2">
        📄 Prompt Preview
      </h2>
      
      {!hasContent ? (
        hasBlocks ? (
          <EmptyState
            icon="✏️"
            title="Fill out your blocks to see the magic"
            description="You've got blocks ready to go! Start filling them out with your content and watch your structured prompt come together in real-time. Each block you complete adds power to your final prompt."
            actionText={null}
            onAction={null}
          />
        ) : (
          <EmptyState
            icon="👀"
            title="Your prompt will appear here"
            description="As you add and fill out blocks, you'll see your complete prompt take shape in this preview area. Watch your ideas transform into a powerful, structured prompt that's ready to use with any AI model!"
            actionText="Add a Block to Get Started"
            onAction={() => addBlock('Task')}
          />
        )
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="bg-gray-50 rounded-xl p-4 sm:p-5 border border-gray-200 shadow-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs sm:text-sm font-medium text-gray-700">Generated Prompt</span>
            <button
              onClick={() => navigator.clipboard.writeText(combinedPrompt)}
              className="bg-transparent text-gray-600 hover:bg-gray-100 px-2 py-1 text-xs rounded-md transition-colors duration-200"
              title="Copy to clipboard"
            >
              📋 Copy
            </button>
          </div>
          <pre className="whitespace-pre-wrap text-sm sm:text-base text-gray-800 leading-relaxed">
            {combinedPrompt}
          </pre>
        </motion.div>
      )}
    </div>
  )
}
