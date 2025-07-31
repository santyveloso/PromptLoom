import { motion } from "framer-motion";
import { usePromptStore } from "../store/promptStore";

const typeColors = {
  Task: "bg-blue-50 border-blue-500 text-blue-900 border-l-blue-600",
  Tone: "bg-pink-50 border-pink-500 text-pink-900 border-l-pink-600",
  Format: "bg-amber-50 border-amber-500 text-amber-900 border-l-amber-600",
  Persona:
    "bg-emerald-50 border-emerald-500 text-emerald-900 border-l-emerald-600",
  Constraint: "bg-red-50 border-red-500 text-red-900 border-l-red-600",
  Audience: "bg-cyan-50 border-cyan-500 text-cyan-900 border-l-cyan-600",
  Style: "bg-violet-50 border-violet-500 text-violet-900 border-l-violet-600",
  Examples: "bg-orange-50 border-orange-500 text-orange-900 border-l-orange-600",
  "Creativity Level": "bg-teal-50 border-teal-500 text-teal-900 border-l-teal-600",
};

const blockIcons = {
  Task: "📋",
  Tone: "🎭",
  Format: "📝",
  Persona: "👤",
  Constraint: "⚠️",
  Audience: "👥",
  Style: "🎨",
  Examples: "💡",
  "Creativity Level": "🌟",
};

export default function PromptBlock({ block, isFirst, isLast, blockIndex }) {
  const updateBlock = usePromptStore((s) => s.updateBlock);
  const removeBlock = usePromptStore((s) => s.removeBlock);

  const blockIcon = blockIcons[block.type] || "📄";

  return (
    <div className="relative">
      {/* Stitch Thread - Connecting Line */}
      {!isFirst && (
        <div className="absolute left-6 -top-4 w-0.5 h-4 bg-gradient-to-b from-gray-300 to-gray-400 opacity-60 transform translate-x-1.5">
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-300 to-purple-300 opacity-50 animate-pulse"></div>
        </div>
      )}

      <motion.div
        key={block.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        whileHover={{ y: -2 }}
        whileTap={{ y: 0 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 25,
          duration: 0.2,
        }}
        className={`
          relative p-4 sm:p-5 border-l-8 rounded-xl shadow-lg hover:shadow-xl 
          transition-all duration-200 cursor-pointer
          ${getBackgroundClass(block.type)}
        `}
      >
        {/* Stitch Circle - Connection Point */}
        <div
          className={`absolute -top-2 left-4 w-4 h-4 rounded-full shadow-md border-2 border-white ${getBorderColor(
            block.type
          )} z-10`}
        >
          <div className="absolute inset-1 rounded-full bg-white/80"></div>
        </div>

        <div className="flex justify-between items-center mb-3 sm:mb-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">{blockIcon}</span>
            <span className="text-sm sm:text-base font-semibold">
              {block.type}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => removeBlock(block.id)}
              className="
              p-1 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 
              transition-all duration-200 focus:outline-none focus:ring-2 
              focus:ring-red-500 focus:ring-offset-1
            "
              aria-label={`Remove ${block.type} block`}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>

        <textarea
          placeholder={getPlaceholderText(block.type)}
          className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white/90 placeholder-gray-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none min-h-[80px] sm:min-h-[90px] backdrop-blur-sm"
          value={block.content}
          onChange={(e) => updateBlock(block.id, e.target.value)}
          rows={3}
          aria-label={`${block.type} content`}
        />
      </motion.div>
    </div>
  );
}

// Helper functions for styling
function getBackgroundClass(blockType) {
  const backgrounds = {
    Task: "bg-gradient-to-br from-blue-50 via-blue-100 to-blue-50 border-blue-500 text-blue-900",
    Tone: "bg-gradient-to-br from-pink-50 via-pink-100 to-pink-50 border-pink-500 text-pink-900",
    Format:
      "bg-gradient-to-br from-amber-50 via-amber-100 to-amber-50 border-amber-500 text-amber-900",
    Persona:
      "bg-gradient-to-br from-emerald-50 via-emerald-100 to-emerald-50 border-emerald-500 text-emerald-900",
    Constraint:
      "bg-gradient-to-br from-red-50 via-red-100 to-red-50 border-red-500 text-red-900",
    Audience:
      "bg-gradient-to-br from-cyan-50 via-cyan-100 to-cyan-50 border-cyan-500 text-cyan-900",
    Style:
      "bg-gradient-to-br from-violet-50 via-violet-100 to-violet-50 border-violet-500 text-violet-900",
    Examples:
      "bg-gradient-to-br from-orange-50 via-orange-100 to-orange-50 border-orange-500 text-orange-900",
    "Creativity Level":
      "bg-gradient-to-br from-teal-50 via-teal-100 to-teal-50 border-teal-500 text-teal-900",
  };
  return (
    backgrounds[blockType] ||
    "bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 border-gray-400 text-gray-900"
  );
}

function getBorderColor(blockType) {
  const colors = {
    Task: "bg-blue-500",
    Tone: "bg-pink-500",
    Format: "bg-amber-500",
    Persona: "bg-emerald-500",
    Constraint: "bg-red-500",
    Audience: "bg-cyan-500",
    Style: "bg-violet-500",
    Examples: "bg-orange-500",
    "Creativity Level": "bg-teal-500",
  };
  return colors[blockType] || "bg-gray-500";
}

function getPlaceholderText(blockType) {
  const placeholders = {
    Task: 'What do you want the AI to do? (e.g., "Write a product description for...")',
    Tone: 'What tone should the AI use? (e.g., "Professional and friendly")',
    Format: 'How should the output be formatted? (e.g., "As a bulleted list")',
    Persona:
      'What role should the AI take? (e.g., "You are a marketing expert...")',
    Constraint:
      'Any specific rules or limits? (e.g., "Keep it under 100 words")',
    Audience:
      'Who is this for? (e.g., "beginners", "CEOs", "children", "experts")',
    Style:
      'What style should be used? (e.g., "Hemingway", "academic", "journalistic")',
    Examples:
      'Provide examples or samples to guide the output...',
    "Creativity Level":
      'How creative should this be? (e.g., "highly imaginative", "strictly factual")',
  };
  
  // Handle null, undefined, or non-string block types gracefully
  if (!blockType || typeof blockType !== 'string') {
    return 'Enter your block details...';
  }
  
  return (
    placeholders[blockType] ||
    `Enter your ${blockType.toLowerCase()} details...`
  );
}
