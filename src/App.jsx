import { usePromptStore } from './store/promptStore'
import PromptBlock from './components/PromptBlock'
import PromptPreview from './components/PromptPreview'
import { Reorder } from 'framer-motion'

// Função auxiliar para mover elementos no array
function move(array, from, to) {
  const newArray = [...array]
  const item = newArray.splice(from, 1)[0]
  newArray.splice(to, 0, item)
  return newArray
}

function App() {
  const user = usePromptStore((s) => s.user)

  if (!user) {
    return <Login />
  }
  
  const blocks = usePromptStore((s) => s.blocks)
  const addBlock = usePromptStore((s) => s.addBlock)
  const reorderBlocks = usePromptStore((s) => s.reorderBlocks)

  const handleDragEnd = (info, id) => {
    const fromIndex = blocks.findIndex((block) => block.id === id)
    const offsetY = info.offset.y
    const direction = offsetY > 0 ? 1 : -1
    const toIndex = fromIndex + direction
    if (toIndex < 0 || toIndex >= blocks.length) return

    const newOrder = move(blocks, fromIndex, toIndex)
    reorderBlocks(newOrder)
  }

  return (
    <div
      className="
        bg-gradient-to-tr
        from-amber-50
        via-orange-50
        to-rose-100
        min-h-screen
        flex
        flex-col
        items-center
        justify-center
        py-10
        px-4
      "
    >
      {/* Botões para adicionar blocos */}
      <div
        className="
          flex
          gap-2
          mb-6
          flex-wrap
        "
      >
        {['Task', 'Tone', 'Format', 'Persona', 'Constraint'].map((type) => (
          <button
            key={type}
            onClick={() => addBlock(type)}
            className="
              bg-slate-200
              hover:bg-slate-500
              transition-colors
              text-indigo
              px-4
              py-2
              rounded-md
              text-sm
              shadow-sm
            "
          >
            + {type}
          </button>
        ))}
      </div>

      {/* Blocos ordenáveis com drag & drop */}
      <Reorder.Group
        axis="y"
        values={blocks}
        onReorder={(newOrder) => reorderBlocks(newOrder)}
        className="
          space-y-4
          list-none
        "
      >
        {blocks.map((block) => (
          <Reorder.Item
            key={block.id}
            value={block}
            layout
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="
              cursor-grab
              active:cursor-grabbing
            "
          >
            <PromptBlock block={block} />
          </Reorder.Item>
        ))}
      </Reorder.Group>

      {/* Área de preview */}
      <PromptPreview />
    </div>
  )
}

export default App
