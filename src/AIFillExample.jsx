import { useState } from 'react';
import AIFillModal from './components/AIFillModal';

function AIFillExample() {
  const [showAIModal, setShowAIModal] = useState(false);
  
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">AI Prompt Generator Example</h1>
      
      <button
        onClick={() => setShowAIModal(true)}
        className="bg-blue-500 text-white px-4 py-2 rounded-lg"
      >
        ✨ AI Fill
      </button>
      
      <AIFillModal 
        isOpen={showAIModal} 
        onClose={() => setShowAIModal(false)} 
        apiKey={import.meta.env.VITE_GEMINI_API_KEY} 
      />
    </div>
  );
}

export default AIFillExample;