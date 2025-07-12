import { usePromptStore } from "../store/promptStore"

export default function PromptPreview() {
  const blocks = usePromptStore((s) => s.blocks)

  const combinedPrompt = blocks
    .filter((b) => b.content.trim() !== "")
    .map((b) => `${b.type}: ${b.content.trim()}`)
    .join("\n\n")

  return (
    <div className="mt-8 p-4 border border-gray-300 rounded bg-white shadow-sm">
      <h2 className="text-lg font-semibold mb-2 text-gray-700">📄 Prompt Preview</h2>
      <pre className="whitespace-pre-wrap text-sm text-gray-800">{combinedPrompt || "Start typing to see your prompt..."}</pre>
    </div>
  )
}
