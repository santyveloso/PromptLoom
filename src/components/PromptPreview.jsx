import { usePromptStore } from "../store/promptStore"
import EmptyState from "./EmptyState"
import { motion } from "framer-motion"

export default function PromptPreview() {
  const blocks = usePromptStore((s) => s.blocks)
  const addBlock = usePromptStore((s) => s.addBlock)

  const combinedPrompt = blocks
    .filter((b) => b.content.trim() !== "")
    .map((b) => `${b.type}: ${b.content.trim()}`)
    .join("\n\n")

  const hasContent = combinedPrompt.trim() !== ""

  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold mb-4 text-gray-900 flex items-center gap-2">
        📄 Prompt Preview
      </h2>
      
      {!hasContent ? (
        <EmptyState
          icon="👀"
          title="Your prompt will appear here"
          description="As you add and fill out blocks, you'll see your complete prompt take shape in this preview area. It's like watching your ideas come to life!"
          actionText="Add a Block to Get Started"
          onAction={() => addBlock('Task')}
        />
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="bg-gray-50 rounded-lg p-4 border border-gray-200"
        >
          <pre className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed">
            {combinedPrompt}
          </pre>
        </motion.div>
      )}
    </div>
  )
}
