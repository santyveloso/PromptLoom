import { useState, useEffect } from "react";
import { usePromptStore } from "./store/promptStore";
import PromptBlock from "./components/PromptBlock";
import PromptPreview from "./components/PromptPreview";
import SavedPrompts from "./components/SavedPrompts";
import EmptyState from "./components/EmptyState";
import LoadingSpinner from "./components/LoadingSpinner";
import ErrorBoundary from "./components/ErrorBoundary";
import { Reorder } from "framer-motion";
import Login from "./components/Login";
import { useAuthListener } from "./hooks/useAuthListener";
import { useSavedPrompts } from "./hooks/useSavedPrompts";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { getFirebaseErrorMessage } from "./lib/errorHandling";
import GeminiClient from "./services/geminiClient";
import { nanoid } from "nanoid";
import "./App.css";

// Helper function to move elements in array
function move(array, from, to) {
  const newArray = [...array];
  const item = newArray.splice(from, 1)[0];
  newArray.splice(to, 0, item);
  return newArray;
}

function App() {
  const user = usePromptStore((s) => s.user);
  const authChecked = usePromptStore((s) => s.authChecked);
  const blocks = usePromptStore((s) => s.blocks);
  const addBlock = usePromptStore((s) => s.addBlock);
  const reorderBlocks = usePromptStore((s) => s.reorderBlocks);
  const clearBuilder = usePromptStore((s) => s.clearBuilder);

  // AI Fill state
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiInput, setAiInput] = useState("");
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [aiError, setAiError] = useState(null);

  // Save prompt naming state
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [promptName, setPromptName] = useState("");
  const [promptColor, setPromptColor] = useState("#6366f1");
  const [isSaving, setIsSaving] = useState(false);

  const colorOptions = [
    { name: "Indigo", value: "#6366f1" },
    { name: "Purple", value: "#8b5cf6" },
    { name: "Pink", value: "#ec4899" },
    { name: "Red", value: "#ef4444" },
    { name: "Orange", value: "#f97316" },
    { name: "Amber", value: "#f59e0b" },
    { name: "Yellow", value: "#eab308" },
    { name: "Lime", value: "#84cc16" },
    { name: "Green", value: "#22c55e" },
    { name: "Emerald", value: "#10b981" },
    { name: "Teal", value: "#14b8a6" },
    { name: "Cyan", value: "#06b6d4" },
    { name: "Sky", value: "#0ea5e9" },
    { name: "Blue", value: "#3b82f6" },
    { name: "Violet", value: "#7c3aed" },
    { name: "Fuchsia", value: "#d946ef" },
    { name: "Rose", value: "#f43f5e" },
    { name: "Gray", value: "#6b7280" },
  ];

  // Animated background blocks
  const [backgroundBlocks, setBackgroundBlocks] = useState([]);

  // Dark mode state
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Generate random background blocks
  useEffect(() => {
    const generateBlock = () => ({
      id: Math.random(),
      x: Math.random() * 80 + 5, // 5% to 85% of screen width
      y: Math.random() * 80 + 5, // 5% to 85% of screen height
      width: Math.random() * 6 + 14, // w-14 to w-20 equivalent (56px to 80px)
      height: Math.random() * 3 + 5, // h-5 to h-8 equivalent (20px to 32px)
      color: ["indigo", "purple", "blue"][Math.floor(Math.random() * 3)],
      opacity: Math.random() * 0.03 + 0.02, // 0.02 to 0.05 (more subtle for main app)
      duration: Math.random() * 4 + 8, // 8s to 12s lifespan (longer for main app)
    });

    const addBlock = () => {
      const newBlock = generateBlock();
      setBackgroundBlocks((prev) => [...prev, newBlock]);

      // Remove block after its duration
      setTimeout(() => {
        setBackgroundBlocks((prev) =>
          prev.filter((block) => block.id !== newBlock.id)
        );
      }, newBlock.duration * 1000);
    };

    // Add initial blocks
    for (let i = 0; i < 2; i++) {
      setTimeout(() => addBlock(), i * 2000);
    }

    // Continue adding blocks at random intervals
    const interval = setInterval(() => {
      if (Math.random() > 0.4) {
        // 60% chance to add a block
        addBlock();
      }
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  // Initialize saved prompts loading and get functions
  const { saveCurrentPrompt } = useSavedPrompts();

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
      alert(
        getFirebaseErrorMessage(error) ||
          "Failed to sign out. Please try again."
      );
    }
  };

  const handleAIFill = async () => {
    if (!import.meta.env.VITE_GEMINI_API_KEY) {
      setAiError("AI features require an API key. Please check your settings.");
      return;
    }

    if (!aiInput.trim()) {
      setAiError("Please enter a description of what you want to create.");
      return;
    }

    setIsAIProcessing(true);
    setAiError(null);

    try {
      const geminiClient = new GeminiClient(
        import.meta.env.VITE_GEMINI_API_KEY
      );

      const systemPrompt = `You are a specialized AI assistant inside a visual prompt-building tool.
      When a user clicks "AI Fill", they provide a natural language input describing what they want.
      Your task is to analyze the input and extract up to five structured Prompt Blocks, each capturing a specific instruction or parameter in detail.

      Each block must be explicit, complete, and clearly labeled, following this fixed order:
      Task – A detailed description of the core action or goal the user expects. Expand it with relevant clarifications based on context.
      Tone – A rich, contextual description of the desired style, voice, or emotional mood of the output. If multiple tones apply, include them.
      Format – A clear specification of the structural layout of the expected AI-generated output, including type (e.g., bullet list, table, numbered steps) and any relevant formatting cues.
      Persona – A thorough description of the character, expertise, or perspective the AI should adopt. Include traits, roles, and tone associated with that persona.
      Constraint – All explicit and implied restrictions or boundaries. Be precise, and include ingredients, topics, phrasing, or structural limitations if relevant.

      You must always:
      - Respond in this fixed order: Task, Tone, Format, Persona, Constraint
      - Use the same language as the user's input (e.g., reply in Portuguese if the request is in Portuguese)
      - Infer lightly implied details only when clearly suggested — never hallucinate or overreach
      - Label each block with a bold header (e.g., **Task:**) and ensure content is multi-line if needed
      - Only include blocks that are clearly present or strongly implied. Do not include placeholders or empty block headers.
      - Do not use JSON or code formatting. Output should be plain text with bolded block names followed by content.

      User input: ${aiInput}`;

      const response = await geminiClient.makeRequest(systemPrompt, {
        maxOutputTokens: 1200,
        temperature: 0.7,
      });

      // Parse the AI response and create blocks
      parseAIResponseAndCreateBlocks(response);

      setShowAIModal(false);
      setAiInput("");
    } catch (error) {
      console.error("AI Fill error:", error);
      setAiError(
        error.message || "Failed to generate blocks. Please try again."
      );
    } finally {
      setIsAIProcessing(false);
    }
  };

  const parseAIResponseAndCreateBlocks = (response) => {
    // Clear existing blocks first
    clearBuilder();

    const blockTypes = ["Task", "Tone", "Format", "Persona", "Constraint"];
    const newBlocks = [];

    blockTypes.forEach((type) => {
      const regex = new RegExp(
        `\\*\\*${type}:\\*\\*\\s*([\\s\\S]*?)(?=\\*\\*(?:Task|Tone|Format|Persona|Constraint):|$)`,
        "i"
      );
      const match = response.match(regex);

      if (match && match[1]) {
        const content = match[1].trim();
        if (content) {
          newBlocks.push({
            id: nanoid(),
            type,
            content,
          });
        }
      }
    });

    // Add blocks to store
    newBlocks.forEach((block) => {
      addBlock(block.type);
      // Update the content after a brief delay to ensure the block is created
      setTimeout(() => {
        const store = usePromptStore.getState();
        const latestBlocks = store.blocks;
        const targetBlock = latestBlocks.find(
          (b) => b.type === block.type && !b.content
        );
        if (targetBlock) {
          store.updateBlock(targetBlock.id, block.content);
        }
      }, 100);
    });
  };

  // Log errors to console and potentially to an error tracking service
  const handleError = (error, errorInfo) => {
    console.error("Application error:", error, errorInfo);
    // Here you could send to an error tracking service like Sentry
  };

  useAuthListener();

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-gradient-to-tr from-amber-50 via-orange-50 to-rose-100 flex items-center justify-center">
        <div className="card card-border p-8">
          <LoadingSpinner size="lg" text="Loading your workspace..." />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <ErrorBoundary onError={handleError}>
      <>
        <style>{`
          @keyframes gradientShift {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }
          
          @keyframes stitchFlow {
            0% { transform: translateX(-100px) translateY(-50px); opacity: 0; }
            10% { opacity: 0.2; }
            90% { opacity: 0.2; }
            100% { transform: translateX(calc(100vw + 100px)) translateY(50px); opacity: 0; }
          }
          
          @keyframes nodeGlow {
            0%, 100% { opacity: 0.15; transform: scale(1); }
            50% { opacity: 0.3; transform: scale(1.1); }
          }
          
          @keyframes blockAppear {
            0% { opacity: 0; transform: translateY(20px) scale(0.7); }
            15% { opacity: 0.15; transform: translateY(10px) scale(0.85); }
            30% { opacity: 0.4; transform: translateY(0px) scale(1); }
            70% { opacity: 0.4; transform: translateY(-8px) scale(1.03); }
            85% { opacity: 0.15; transform: translateY(-18px) scale(0.85); }
            100% { opacity: 0; transform: translateY(-30px) scale(0.7); }
          }
          
          .app-gradient-shift-light {
            background: linear-gradient(-45deg, #f8fafc, #e0e7ff, #ede9fe, #fdf2f8);
            background-size: 400% 400%;
            animation: gradientShift 20s ease infinite;
          }
          
          .app-gradient-shift-dark {
            background: linear-gradient(-45deg, #0f172a, #1e293b, #312e81, #1e1b4b);
            background-size: 400% 400%;
            animation: gradientShift 20s ease infinite;
          }
          
          .app-stitch-line {
            animation: stitchFlow 25s linear infinite;
          }
          
          .app-stitch-line:nth-child(2) { animation-delay: -8s; }
          .app-stitch-line:nth-child(3) { animation-delay: -16s; }
          
          .app-connection-node {
            animation: nodeGlow 6s ease-in-out infinite;
          }
          
          .app-connection-node:nth-child(2) { animation-delay: -2s; }
          .app-connection-node:nth-child(3) { animation-delay: -4s; }
          
          .app-random-block {
            animation: blockAppear var(--duration) cubic-bezier(0.4, 0, 0.2, 1) forwards;
          }
        `}</style>

        {/* Header - Outside background for proper sticky positioning */}
        <header
          className={`${
            isDarkMode
              ? "bg-gray-900/90 border-gray-700/30"
              : "bg-white/70 border-white/30"
          } backdrop-blur-md border-b sticky top-0 z-50`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16 lg:grid lg:grid-cols-4 lg:gap-6">
              {/* Logo - Aligned with saved prompts on desktop */}
              <div className="lg:col-span-1 flex items-center">
                <h1 className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  PromptStitch
                </h1>
              </div>

              {/* User Profile & Controls */}
              <div className="lg:col-span-3 flex justify-end items-center">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  {/* Dark Mode Toggle */}
                  <button
                    onClick={() => setIsDarkMode(!isDarkMode)}
                    className={`p-2 rounded-lg transition-colors ${
                      isDarkMode
                        ? "bg-gray-700 text-yellow-400 hover:bg-gray-600"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                    aria-label="Toggle dark mode"
                  >
                    {isDarkMode ? (
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                      </svg>
                    )}
                  </button>

                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <img
                      src={
                        user.photoURL ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          user.displayName || user.email
                        )}&background=6366f1&color=fff`
                      }
                      alt={user.displayName || user.email}
                      className="w-8 h-8 sm:w-9 sm:h-9 rounded-full ring-2 ring-indigo-600 shadow-sm"
                    />
                    <div className="hidden sm:block">
                      <p
                        className={`text-sm font-medium truncate max-w-32 lg:max-w-none ${
                          isDarkMode ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {user.displayName ||
                          user.email?.split("@")[0] ||
                          "User"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="btn btn-secondary btn-sm sm:btn-sm focus-ring"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Background Container */}
        <div
          className={`min-h-screen ${
            isDarkMode ? "app-gradient-shift-dark" : "app-gradient-shift-light"
          } relative overflow-hidden`}
        >
          {/* Animated Stitching Lines - More Subtle */}
          <div className="absolute inset-0 pointer-events-none">
            <div
              className={`app-stitch-line absolute top-1/4 left-0 w-full h-0.5 bg-gradient-to-r from-transparent ${
                isDarkMode ? "via-indigo-400/30" : "via-indigo-300/20"
              } to-transparent`}
            ></div>
            <div
              className={`app-stitch-line absolute top-2/3 left-0 w-full h-0.5 bg-gradient-to-r from-transparent ${
                isDarkMode ? "via-purple-400/30" : "via-purple-300/20"
              } to-transparent`}
            ></div>
            <div
              className={`app-stitch-line absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-transparent ${
                isDarkMode ? "via-blue-400/25" : "via-blue-300/15"
              } to-transparent`}
            ></div>
          </div>

          {/* Connection Nodes - More Subtle */}
          <div className="absolute inset-0 pointer-events-none">
            <div
              className={`app-connection-node absolute top-1/4 left-1/4 w-2 h-2 ${
                isDarkMode ? "bg-indigo-400/40" : "bg-indigo-400/25"
              } rounded-full`}
            ></div>
            <div
              className={`app-connection-node absolute top-2/3 right-1/3 w-2 h-2 ${
                isDarkMode ? "bg-purple-400/40" : "bg-purple-400/25"
              } rounded-full`}
            ></div>
            <div
              className={`app-connection-node absolute top-1/2 left-2/3 w-2 h-2 ${
                isDarkMode ? "bg-blue-400/40" : "bg-blue-400/25"
              } rounded-full`}
            ></div>
            <div
              className={`app-connection-node absolute top-1/3 right-1/4 w-1.5 h-1.5 ${
                isDarkMode ? "bg-indigo-300/30" : "bg-indigo-300/20"
              } rounded-full`}
            ></div>
            <div
              className={`app-connection-node absolute bottom-1/3 left-1/3 w-1.5 h-1.5 ${
                isDarkMode ? "bg-purple-300/30" : "bg-purple-300/20"
              } rounded-full`}
            ></div>
          </div>

          {/* Dynamic Random Blocks - More Subtle */}
          <div className="absolute inset-0 pointer-events-none">
            {backgroundBlocks.map((block) => (
              <div
                key={block.id}
                className="app-random-block absolute rounded-lg border"
                style={{
                  left: `${block.x}%`,
                  top: `${block.y}%`,
                  width: `${block.width * 4}px`,
                  height: `${block.height * 4}px`,
                  backgroundColor: `rgb(${
                    block.color === "indigo"
                      ? "99 102 241"
                      : block.color === "purple"
                      ? "168 85 247"
                      : "59 130 246"
                  } / ${block.opacity})`,
                  borderColor: `rgb(${
                    block.color === "indigo"
                      ? "129 140 248"
                      : block.color === "purple"
                      ? "196 181 253"
                      : "147 197 253"
                  } / ${block.opacity * 1.5})`,
                  "--duration": `${block.duration}s`,
                }}
              />
            ))}
          </div>

          {/* Main Layout */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
              {/* Saved Prompts Sidebar */}
              <div className="lg:col-span-1 order-2 lg:order-1">
                <div className="card card-border sticky top-10">
                  <ErrorBoundary
                    fallback={({ resetError }) => (
                      <div className="p-6 text-center">
                        <div className="text-amber-500 text-4xl mb-3">⚠️</div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          Failed to load saved prompts
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">
                          We couldn't load your saved prompts. This might be due
                          to a network issue.
                        </p>
                        <button
                          onClick={resetError}
                          className="btn btn-primary focus-ring"
                        >
                          Try Again
                        </button>
                      </div>
                    )}
                  >
                    <SavedPrompts />
                  </ErrorBoundary>
                </div>
              </div>

              {/* Main Content Area */}
              <div className="lg:col-span-3 order-1 lg:order-2">
                <div className="space-y-6 sm:space-y-8">
                  {/* Block Controls */}
                  <div className="card card-border section-padding">
                    <h2 className="heading-md text-gray-900 mb-4 sm:mb-6">
                      Build Your Prompt
                    </h2>
                    <div className="flex gap-3 flex-wrap">
                      {["Task", "Tone", "Format", "Persona", "Constraint"].map(
                        (type) => (
                          <button
                            key={type}
                            onClick={() => addBlock(type)}
                            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold px-4 py-2.5 rounded-lg shadow-sm hover:shadow-md hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 text-sm"
                          >
                            + {type}
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  {/* Prompt Builder */}
                  <div className="card card-border section-padding">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                      <h2 className="heading-md text-gray-900">
                        Prompt Blocks
                      </h2>
                      <button
                        onClick={() => setShowSaveModal(true)}
                        disabled={blocks.length === 0}
                        className="btn btn-success w-full sm:w-auto focus-ring disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        💾 Save Prompt
                      </button>
                    </div>

                    {blocks.length === 0 ? (
                      <EmptyState
                        icon="🧩"
                        title="Ready to build something amazing?"
                        description="Your prompt canvas is empty and waiting for your creativity. Start by adding a Task block to define what you want to accomplish, then layer on tone, format, and constraints to craft the perfect prompt."
                        actionText="Add Your First Block"
                        onAction={() => addBlock("Task")}
                      />
                    ) : (
                      <ErrorBoundary
                        fallback={({ resetError }) => (
                          <div className="p-6 text-center border border-red-100 rounded-xl bg-red-50">
                            <div className="text-red-500 text-4xl mb-3">🛑</div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                              Something went wrong with your prompt blocks
                            </h3>
                            <p className="text-sm text-gray-600 mb-4">
                              We encountered an error while rendering your
                              prompt blocks. Your work might be affected.
                            </p>
                            <div className="flex justify-center gap-3">
                              <button
                                onClick={resetError}
                                className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 transition-colors text-sm"
                              >
                                Try Again
                              </button>
                            </div>
                          </div>
                        )}
                      >
                        <Reorder.Group
                          axis="y"
                          values={blocks}
                          onReorder={(newOrder) => reorderBlocks(newOrder)}
                          className="space-y-4 list-none"
                        >
                          {blocks.map((block, index) => (
                            <Reorder.Item
                              key={block.id}
                              value={block}
                              layout
                              transition={{
                                type: "spring",
                                stiffness: 500,
                                damping: 30,
                              }}
                              className="cursor-grab active:cursor-grabbing focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-xl"
                              tabIndex={0}
                            >
                              <PromptBlock
                                block={block}
                                isFirst={index === 0}
                                isLast={index === blocks.length - 1}
                                blockIndex={index}
                              />
                            </Reorder.Item>
                          ))}
                        </Reorder.Group>
                      </ErrorBoundary>
                    )}
                  </div>

                  {/* Preview Area */}
                  <div className="card card-border">
                    <ErrorBoundary
                      fallback={({ resetError }) => (
                        <div className="p-6 text-center">
                          <div className="text-amber-500 text-4xl mb-3">⚠️</div>
                          <h3 className="text-lg font-medium text-gray-900 mb-2">
                            Preview generation failed
                          </h3>
                          <p className="text-sm text-gray-600 mb-4">
                            We couldn't generate the preview for your prompt.
                            Your blocks are still saved.
                          </p>
                          <button
                            onClick={resetError}
                            className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 transition-colors text-sm"
                          >
                            Try Again
                          </button>
                        </div>
                      )}
                    >
                      <PromptPreview />
                    </ErrorBoundary>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* AI Fill Modal */}
          {showAIModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-semibold text-gray-900">
                      ✨ AI Fill - Describe Your Prompt
                    </h3>
                    <button
                      onClick={() => {
                        setShowAIModal(false);
                        setAiInput("");
                        setAiError(null);
                      }}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>

                  <div className="mb-6">
                    <p className="text-gray-600 mb-4">
                      Describe what you want to create and I'll automatically
                      generate the appropriate prompt blocks for you.
                    </p>

                    <textarea
                      value={aiInput}
                      onChange={(e) => setAiInput(e.target.value)}
                      placeholder="Example: I want to write a professional email to a client explaining a project delay, keeping it apologetic but confident, formatted as a formal business letter..."
                      className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                      disabled={isAIProcessing}
                    />
                  </div>

                  {aiError && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg text-red-700 text-sm">
                      {aiError}
                    </div>
                  )}

                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => {
                        setShowAIModal(false);
                        setAiInput("");
                        setAiError(null);
                      }}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                      disabled={isAIProcessing}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAIFill}
                      disabled={isAIProcessing || !aiInput.trim()}
                      className={`px-6 py-2 rounded-lg font-medium transition-all ${
                        isAIProcessing || !aiInput.trim()
                          ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                          : "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700"
                      }`}
                    >
                      {isAIProcessing ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                          <span>Generating...</span>
                        </div>
                      ) : (
                        "Generate Blocks"
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Save Prompt Modal */}
          {showSaveModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-semibold text-gray-900">
                      💾 Save Your Prompt
                    </h3>
                    <button
                      onClick={() => {
                        setShowSaveModal(false);
                        setPromptName("");
                        setPromptColor("#6366f1");
                      }}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label
                        htmlFor="prompt-name"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Prompt Name
                      </label>
                      <input
                        id="prompt-name"
                        name="prompt-name"
                        type="text"
                        value={promptName}
                        onChange={(e) => setPromptName(e.target.value)}
                        placeholder="Enter a memorable name for your prompt..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        disabled={isSaving}
                        autoFocus
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        Give your prompt a descriptive name to find it easily
                        later
                      </p>
                    </div>

                    <div>
                      <label
                        htmlFor="color-picker"
                        className="block text-sm font-medium text-gray-700 mb-3"
                      >
                        Color Tag
                      </label>
                      <div className="grid grid-cols-6 gap-2">
                        {colorOptions.map((color) => (
                          <button
                            key={color.value}
                            type="button"
                            onClick={() => setPromptColor(color.value)}
                            className={`w-8 h-8 rounded-full border-2 transition-all duration-200 ${
                              promptColor === color.value
                                ? "border-gray-900 scale-110 shadow-lg"
                                : "border-gray-300 hover:border-gray-400 hover:scale-105"
                            }`}
                            style={{ backgroundColor: color.value }}
                            title={color.name}
                            disabled={isSaving}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Choose a color to help organize your prompts
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => {
                        setShowSaveModal(false);
                        setPromptName("");
                        setPromptColor("#6366f1");
                      }}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                      disabled={isSaving}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={async () => {
                        setIsSaving(true);
                        const nameToSave = promptName.trim();
                        console.log("=== SAVE BUTTON CLICKED ===");
                        console.log("promptName state:", promptName);
                        console.log("nameToSave after trim:", nameToSave);
                        console.log("promptColor:", promptColor);
                        console.log("About to call saveCurrentPrompt with:", {
                          nameToSave,
                          promptColor,
                        });
                        try {
                          const result = await saveCurrentPrompt(
                            nameToSave,
                            promptColor
                          );
                          console.log("Save result:", result);
                          setShowSaveModal(false);
                          setPromptName("");
                          setPromptColor("#6366f1");
                        } catch (error) {
                          console.error("Save error:", error);
                        } finally {
                          setIsSaving(false);
                        }
                      }}
                      disabled={isSaving}
                      className={`px-6 py-2 rounded-lg font-medium transition-all ${
                        isSaving
                          ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                          : "bg-green-600 text-white hover:bg-green-700"
                      }`}
                    >
                      {isSaving ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                          <span>Saving...</span>
                        </div>
                      ) : (
                        "Save Prompt"
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Floating AI Fill Button */}
          <button
            onClick={() => setShowAIModal(true)}
            className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 flex items-center justify-center z-40 group"
            aria-label="AI Fill - Generate blocks from description"
          >
            <div className="flex flex-col items-center">
              <span className="text-lg">✨</span>
              <span className="text-xs font-medium opacity-90">AI</span>
            </div>

            {/* Tooltip */}
            <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
              AI Fill - Generate blocks
              <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
            </div>
          </button>
        </div>
      </>
    </ErrorBoundary>
  );
}

export default App;
