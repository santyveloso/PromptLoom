import { usePromptStore } from './store/promptStore'
import PromptBlock from './components/PromptBlock'
import PromptPreview from './components/PromptPreview'


function App() {
  const blocks = usePromptStore((s) => s.blocks)
  const addBlock = usePromptStore((s) => s.addBlock)

  return (
    <div className="p-8 max-w-xl mx-auto">
      <div className="flex gap-2 mb-4 flex-wrap">
        {["Task", "Tone", "Format", "Persona", "Constraint"].map((type) => (
          <button
            key={type}
            onClick={() => addBlock(type)}
            className="bg-indigo-600 text-white px-3 py-1 rounded text-sm hover:bg-indigo-700"
          >
            + {type}
          </button>
        ))}
      </div>

      {blocks.map((block) => (
        <PromptBlock key={block.id} block={block} />
      ))}
      
      <PromptPreview />
    </div>
  )
}

export default App
