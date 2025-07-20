import { useState } from 'react';
import { usePromptStore } from './store/promptStore';
import PromptBlock from './components/PromptBlock';
import PromptPreview from './components/PromptPreview';
import AIFillModal from './components/AIFillModal';
import { Reorder } from 'framer-motion';

// Helper function to move elements in array
function move(array, from, to) {
  const newArray = [...array];
  const item = newArray.splice(from, 1)[0];
  newArray.splice(to, 0, item);
  return newArray;
}

function App() {
  const user = usePromptStore((s) => s.user);
  const blocks = usePromptStore((s) => s.blocks);
  const addBlock = usePromptStore((s) => s.addBlock);
  const reorderBlocks = usePromptStore((s) => s.reorderBlocks);
  
  // AI Fill modal state
  const [showAIModal, setShowAIModal] = useState(false);

  // Handle drag and drop reordering
  const handleDragEnd = (info, id) => {
    const fromIndex = blocks.findIndex((block) => block.id === id);
    const offsetY = info.offset.y;
    const direction = offsetY > 0 ? 1 : -1;
    const toIndex = fromIndex + direction;
    if (toIndex < 0 || toIndex >= blocks.length) return;

    const newOrder = move(blocks, fromIndex, toIndex);
    reorderBlocks(newOrder);
  };

  if (!user) {
    return <div>Please log in</div>;
  }

  return (
    <div className="bg-gradient-to-tr from-amber-50 via-orange-50 to-rose-100 min-h-screen flex flex-col items-center justify-center py-10 px-4">
      {/* Block Controls */}
      <div className="flex gap-3 mb-6 flex-wrap">
        {['Task', 'Tone', 'Format', 'Persona', 'Constraint'].map((type) => (
          <button
            key={type}
            onClick={() => addBlock(type)}
            className="bg-slate-200 hover:bg-slate-300 transition-colors px-4 py-2 rounded-md text-sm shadow-sm"
          >
            + {type}
          </button>
        ))}
        
        {/* AI Fill Button */}
        <button
          onClick={() => setShowAIModal(true)}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold px-4 py-2 rounded-md shadow-sm hover:shadow-md hover:from-indigo-700 hover:to-purple-700 transition-all duration-200"
        >
          ✨ AI Fill
        </button>
      </div>

      {/* Blocks */}
      <Reorder.Group
        axis="y"
        values={blocks}
        onReorder={(newOrder) => reorderBlocks(newOrder)}
        className="space-y-4 list-none w-full max-w-2xl"
      >
        {blocks.map((block) => (
          <Reorder.Item
            key={block.id}
            value={block}
            layout
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="cursor-grab active:cursor-grabbing"
          >
            <PromptBlock block={block} />
          </Reorder.Item>
        ))}
      </Reorder.Group>

      {/* Preview */}
      <PromptPreview />
      
      {/* AI Fill Modal */}
      <AIFillModal 
        isOpen={showAIModal} 
        onClose={() => setShowAIModal(false)} 
        apiKey={import.meta.env.VITE_GEMINI_API_KEY} 
      />
    </div>
  );
}

export default App;