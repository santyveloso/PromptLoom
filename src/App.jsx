import { useState } from "react";
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
      <div className="min-h-screen bg-gradient-to-tr from-amber-50 via-orange-50 to-rose-100">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo */}
              <div className="flex items-center">
                <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  PromptStitch
                </h1>
              </div>

              {/* User Profile & Logout */}
              <div className="flex items-center space-x-3 sm:space-x-4">
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
                    <p className="text-sm font-medium text-gray-900 truncate max-w-32 lg:max-w-none">
                      {user.displayName || user.email?.split("@")[0] || "User"}
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
        </header>

        {/* Main Layout */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
            {/* Saved Prompts Sidebar */}
            <div className="lg:col-span-1 order-2 lg:order-1">
              <div className="card card-border sticky top-24">
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
                    <h2 className="heading-md text-gray-900">Prompt Blocks</h2>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={() => setShowAIModal(true)}
                        className="btn bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 w-full sm:w-auto focus-ring"
                      >
                        ✨ AI Fill
                      </button>
                      <button
                        onClick={saveCurrentPrompt}
                        disabled={blocks.length === 0}
                        className="btn btn-success w-full sm:w-auto focus-ring disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        💾 Save Prompt
                      </button>
                    </div>
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
                            We encountered an error while rendering your prompt
                            blocks. Your work might be affected.
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
                        {blocks.map((block) => (
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
                            <PromptBlock block={block} />
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
                          We couldn't generate the preview for your prompt. Your
                          blocks are still saved.
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
      </div>
    </ErrorBoundary>
  );
}

export default App;
