import { usePromptStore } from './store/promptStore'
import PromptBlock from './components/PromptBlock'
import PromptPreview from './components/PromptPreview'
import { Reorder } from "framer-motion"


function move(array, from, to) {
  const newArray = [...array]
  const item = newArray.splice(from, 1)[0]
  newArray.splice(to, 0, item)
  return newArray
}

function App() {
  const blocks = usePromptStore((s) => s.blocks)
  const addBlock = usePromptStore((s) => s.addBlock)
  const reorderBlocks = usePromptStore((s) => s.reorderBlocks)

  const handleDragEnd = (info, id) => {
    const fromIndex = blocks.findIndex((block) => block.id === id)

    const offsetY =  info.offset.y
    const direction = offsetY > 0 ? 1 : -1

    const toIndex = fromIndex + direction
    if (toIndex < 0 || toIndex >= blocks.length) return

    const newOrder = move(blocks, fromIndex, toIndex)
    reorderBlocks(newOrder)
  }

  return (
    <div className="bg-gray-50 min-h-screen p-8 max-w-2xl mx-auto">
      {/* Add Block Buttons */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {["Task", "Tone", "Format", "Persona", "Constraint"].map((type) => (
          <button
            key={type}
            onClick={() => addBlock(type)}
            className="bg-indigo-600 hover:bg-indigo-700 transition-colors text-white px-3 py-1 rounded-md text-sm shadow-sm"
          >
            + {type}
          </button>
        ))}
      </div>

      {/* Reorderable Blocks */}
      <Reorder.Group
        axis="y"
        values={blocks}
        onReorder={(newOrder) => reorderBlocks(newOrder)}
        className="space-y-2 list-none"
      >
        {blocks.map((block) => (
          <Reorder.Item
            key={block.id}
            value={block}
            layout
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="cursor-grab active:cursor-grabbing"
          >
            <PromptBlock block={block} />
          </Reorder.Item>
        ))}
      </Reorder.Group>

      {/* Preview */}
      <PromptPreview />
    </div>
  )
}

export default App
