import React, { useState, useEffect } from 'react';
import { usePromptStore } from '../store/promptStore';
import GeminiClient from '../services/geminiClient';
import { nanoid } from 'nanoid';

const AIFillModal = ({ isOpen, onClose, apiKey }) => {
  const addBlock = usePromptStore((s) => s.addBlock);
  const clearBuilder = usePromptStore((s) => s.clearBuilder);
  
  // States
  const [userInput, setUserInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [stage, setStage] = useState("input"); // input, clarification, processing, complete
  const [clarificationQuestions, setClarificationQuestions] = useState([]);
  const [clarificationAnswers, setClarificationAnswers] = useState({});
  
  // Initialize the API client
  const apiClient = apiKey ? new GeminiClient(apiKey) : null;
  
  // Reset state when modal is closed
  useEffect(() => {
    if (!isOpen) {
      setStage("input");
      setUserInput("");
      setClarificationQuestions([]);
      setClarificationAnswers({});
      setError(null);
    }
  }, [isOpen]);
  
  if (!isOpen) return null;
  
  // Handle initial submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!userInput.trim()) {
      setError("Please enter a description of what you want to create.");
      return;
    }
    
    if (!apiKey) {
      setError("AI features require an API key. Please check your settings.");
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    
    try {
      // Stage 1: Clarification Pass
      const systemPrompt = `You are a specialized AI assistant inside a visual prompt-building tool.

      When a user clicks "AI Fill", they provide a natural language input describing what they want. Your task has two stages:

      ---

      Stage 1: Clarification Pass

      First, evaluate whether the user input contains enough context to generate high-quality Prompt Blocks. If the input is vague, ambiguous, or missing key details that would significantly affect the output, generate a list of **1 to 3 short clarification questions** to ask the user before proceeding.

      These questions should be highly targeted and only focus on information that would materially change or improve the blocks (e.g., goal specificity, target audience, tone preference, domain context, limitations).

      If no clarification is needed, return exactly this line:
      **NO_CLARIFICATION_NEEDED**

      ---

      User input: ${userInput}`;
      
      const response = await apiClient.makeRequest(systemPrompt, {
        maxOutputTokens: 800,
        temperature: 0.7,
      });
      
      console.log("Clarification response:", response);
      
      // Check if clarification is needed
      if (response.includes("NO_CLARIFICATION_NEEDED")) {
        // No clarification needed, proceed to generate blocks
        await generatePromptBlocks(userInput);
      } else {
        // Extract clarification questions
        const questions = extractClarificationQuestions(response);
        if (questions.length > 0) {
          setClarificationQuestions(questions);
          setStage("clarification");
        } else {
          // Fallback if no questions were extracted
          await generatePromptBlocks(userInput);
        }
      }
    } catch (error) {
      console.error("AI Fill error:", error);
      setError(error.message || "Failed to process your request. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Extract clarification questions from the response
  const extractClarificationQuestions = (response) => {
    // Look for numbered or bulleted questions
    const questions = [];
    
    // Match numbered questions like "1. Question text" or "- Question text"
    const regex = /(?:^|\n)(?:\d+\.|\-|\*)\s*(.+?)(?=\n|$)/g;
    let match;
    
    while ((match = regex.exec(response)) !== null) {
      if (match[1] && match[1].trim().endsWith("?")) {
        questions.push(match[1].trim());
      }
    }
    
    // If no numbered/bulleted questions found, look for lines ending with question marks
    if (questions.length === 0) {
      const lines = response.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.endsWith("?") && !trimmed.startsWith("**")) {
          questions.push(trimmed);
        }
      }
    }
    
    // Limit to 3 questions
    return questions.slice(0, 3);
  };
  
  // Handle clarification answers
  const handleClarificationChange = (question, answer) => {
    setClarificationAnswers(prev => ({
      ...prev,
      [question]: answer
    }));
  };
  
  // Submit clarifications and generate blocks
  const handleClarificationSubmit = async (e) => {
    e.preventDefault();
    
    setIsProcessing(true);
    setError(null);
    
    // Combine original input with clarification answers
    const answeredQuestions = Object.entries(clarificationAnswers)
      .filter(([_, answer]) => answer.trim())
      .map(([question, answer]) => `${question} ${answer}`);
    
    const combinedInput = `${userInput}. ${answeredQuestions.join(". ")}`;
    
    try {
      await generatePromptBlocks(combinedInput);
    } catch (error) {
      console.error("AI Fill error:", error);
      setError(error.message || "Failed to generate blocks. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Generate prompt blocks from input
  const generatePromptBlocks = async (input) => {
    setStage("processing");
    
    // Stage 2: Prompt Block Generation
    const systemPrompt = `You are a specialized AI assistant inside a visual prompt-building tool.

    When a user clicks "AI Fill", they provide a natural language input describing what they want. Your task is to analyze the full user intent and extract up to five structured Prompt Blocks, each capturing a specific instruction or parameter in detail.

    Each block must be explicit, complete, and clearly labeled, following this fixed order:

    Task – A detailed description of the core action or goal the user expects. Expand it with relevant clarifications based on context.

    Tone – A rich, contextual description of the desired style, voice, or emotional mood of the output. If multiple tones apply, include them.

    Format – A clear specification of the structural layout of the expected AI-generated output, including type (e.g., bullet list, table, numbered steps) and any relevant formatting cues.

    Persona – A thorough description of the character, expertise, or perspective the AI should adopt. Include traits, roles, and tone associated with that persona.

    Constraint – All explicit and implied restrictions or boundaries. Be precise, and include ingredients, topics, phrasing, or structural limitations if relevant.

    General Rules:
    - Respond in this fixed order: Task, Tone, Format, Persona, Constraint
    - Use the same language as the user's input (e.g., reply in Portuguese if the request is in Portuguese)
    - Infer lightly implied details only when clearly suggested — never hallucinate or overreach
    - Label each block with a bold header (e.g., **Task:**) and ensure content is multi-line if needed
    - Only include blocks that are clearly present or strongly implied. Do not include placeholders or empty block headers.
    - Do not use JSON or code formatting. Output should be plain text with bolded block names followed by content.

    User input: ${input}`;
    
    const response = await apiClient.makeRequest(systemPrompt, {
      maxOutputTokens: 1200,
      temperature: 0.7,
    });
    
    console.log("Block generation response:", response);
    
    // Parse the response and create blocks
    parseResponseAndCreateBlocks(response);
    
    // Complete the process
    setStage("complete");
  };
  
  // Parse response and create blocks
  const parseResponseAndCreateBlocks = (response) => {
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
  
  // Get title based on current stage
  const getTitle = () => {
    switch (stage) {
      case "input": return "✨ AI Fill - Describe Your Prompt";
      case "clarification": return "🤔 A Few Quick Questions";
      case "processing": return "⚙️ Generating Your Prompt";
      case "complete": return "✅ Prompt Generated Successfully";
      default: return "✨ AI Fill";
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-900">
              {getTitle()}
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={isProcessing}
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

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg text-red-700 text-sm">
              <p>{error}</p>
            </div>
          )}

          {/* Initial input stage */}
          {stage === "input" && (
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <p className="text-gray-600 mb-4">
                  Describe what you want to create and I'll automatically
                  generate the appropriate prompt blocks for you.
                </p>

                <textarea
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="Example: I want to write a professional email to a client explaining a project delay, keeping it apologetic but confident, formatted as a formal business letter..."
                  className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                  disabled={isProcessing}
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isProcessing || !userInput.trim()}
                  className="bg-purple-500 text-white font-semibold hover:bg-purple-600 px-4 py-2 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>Generate Prompt</>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Clarification stage */}
          {stage === "clarification" && (
            <form onSubmit={handleClarificationSubmit}>
              <div className="mb-6">
                <p className="text-gray-600 mb-4">
                  To create the best prompt for you, I need a bit more information:
                </p>

                <div className="space-y-4">
                  {clarificationQuestions.map((question, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <label className="block text-gray-700 font-medium mb-2">
                        {question}
                      </label>
                      <input
                        type="text"
                        value={clarificationAnswers[question] || ""}
                        onChange={(e) => handleClarificationChange(question, e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        placeholder="Your answer..."
                        disabled={isProcessing}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => setStage("input")}
                  disabled={isProcessing}
                  className="text-gray-600 hover:text-gray-800 font-medium"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="bg-purple-500 text-white font-semibold hover:bg-purple-600 px-4 py-2 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>Continue</>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Processing stage */}
          {stage === "processing" && (
            <div className="flex flex-col items-center justify-center py-8">
              <svg className="w-12 h-12 text-indigo-600 animate-spin mb-4" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <p className="text-lg text-gray-700">Generating your prompt blocks...</p>
              <p className="text-sm text-gray-500 mt-2">This may take a few moments</p>
            </div>
          )}

          {/* Complete stage */}
          {stage === "complete" && (
            <div className="flex flex-col items-center justify-center py-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">Prompt Generated Successfully!</h4>
              <p className="text-gray-600 text-center mb-6">
                Your prompt blocks have been created based on your input. You can now edit them or save your prompt.
              </p>
              <button
                onClick={onClose}
                className="bg-purple-500 text-white font-semibold hover:bg-purple-600 px-6 py-2 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIFillModal;