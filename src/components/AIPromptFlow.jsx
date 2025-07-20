import React, { useState } from 'react';
import { usePromptStore } from '../store/promptStore';
import { nanoid } from 'nanoid';

// This component implements the two-stage prompt generation flow:
// 1. Clarification Pass - Detect if clarification is needed and collect answers
// 2. Prompt Block Generation - Generate blocks based on input and clarifications

const AIPromptFlow = ({ apiClient }) => {
  const addBlock = usePromptStore((s) => s.addBlock);
  const updateBlock = usePromptStore((s) => s.updateBlock);
  const clearBuilder = usePromptStore((s) => s.clearBuilder);
  
  // State management
  const [userInput, setUserInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [stage, setStage] = useState('input'); // input, clarification, processing, complete
  const [clarificationQuestions, setClarificationQuestions] = useState([]);
  const [clarificationAnswers, setClarificationAnswers] = useState({});
  
  // Handle initial input submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!userInput.trim()) {
      setError('Please enter a description of what you want to create.');
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    
    try {
      // Stage 1: Clarification Pass
      const clarificationResponse = await performClarificationPass(userInput);
      
      if (clarificationResponse === 'NO_CLARIFICATION_NEEDED') {
        // Skip to block generation
        await generatePromptBlocks(userInput);
      } else {
        // Show clarification questions
        setStage('clarification');
      }
    } catch (error) {
      console.error('Error in clarification pass:', error);
      setError(error.message || 'Failed to process your request. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Perform clarification pass
  const performClarificationPass = async (input) => {
    const systemPrompt = `You are a specialized AI assistant inside a visual prompt-building tool.

    When a user clicks "AI Fill", they provide a natural language input describing what they want. Your task has two stages:

    ---

    Stage 1: Clarification Pass

    First, evaluate whether the user input contains enough context to generate high-quality Prompt Blocks. If the input is vague, ambiguous, or missing key details that would significantly affect the output, generate a list of **1 to 3 short clarification questions** to ask the user before proceeding.

    These questions should be highly targeted and only focus on information that would materially change or improve the blocks (e.g., goal specificity, target audience, tone preference, domain context, limitations).

    If no clarification is needed, return exactly this line:
    **NO_CLARIFICATION_NEEDED**

    ---

    User input: ${input}`;
    
    const response = await apiClient.makeRequest(systemPrompt, {
      maxOutputTokens: 800,
      temperature: 0.7,
    });
    
    if (response.includes('NO_CLARIFICATION_NEEDED')) {
      return 'NO_CLARIFICATION_NEEDED';
    } else {
      // Extract questions
      const questions = extractClarificationQuestions(response);
      setClarificationQuestions(questions);
      return questions;
    }
  };
  
  // Extract questions from the response
  const extractClarificationQuestions = (response) => {
    // Look for numbered or bulleted questions
    const questions = [];
    
    // Match numbered questions like "1. Question text" or "- Question text"
    const regex = /(?:^|\n)(?:\d+\.|\-|\*)\s*(.+?)(?=\n|$)/g;
    let match;
    
    while ((match = regex.exec(response)) !== null) {
      if (match[1] && match[1].trim().endsWith('?')) {
        questions.push(match[1].trim());
      }
    }
    
    // If no numbered/bulleted questions found, look for lines ending with question marks
    if (questions.length === 0) {
      const lines = response.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.endsWith('?') && !trimmed.startsWith('**')) {
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
    
    const combinedInput = `${userInput}. ${answeredQuestions.join('. ')}`;
    
    try {
      await generatePromptBlocks(combinedInput);
    } catch (error) {
      console.error('Error generating blocks:', error);
      setError(error.message || 'Failed to generate blocks. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Generate prompt blocks
  const generatePromptBlocks = async (input) => {
    setStage('processing');
    
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
    
    // Parse the response and create blocks
    parseResponseAndCreateBlocks(response);
    
    // Complete the process
    setStage('complete');
  };
  
  // Parse response and create blocks
  const parseResponseAndCreateBlocks = (response) => {
    // Clear existing blocks first
    clearBuilder();
    
    const blockTypes = ['Task', 'Tone', 'Format', 'Persona', 'Constraint'];
    const newBlocks = [];
    
    blockTypes.forEach((type) => {
      const regex = new RegExp(
        `\\*\\*${type}:\\*\\*\\s*([\\s\\S]*?)(?=\\*\\*(?:Task|Tone|Format|Persona|Constraint):|$)`,
        'i'
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
  
  // Reset the flow
  const resetFlow = () => {
    setUserInput('');
    setStage('input');
    setClarificationQuestions([]);
    setClarificationAnswers({});
    setError(null);
  };
  
  // Render the appropriate UI based on the current stage
  return (
    <div className="ai-prompt-flow">
      {/* Initial input stage */}
      {stage === 'input' && (
        <div className="input-stage">
          <h3 className="text-lg font-medium mb-4">Describe what you want to create</h3>
          {error && <div className="error-message">{error}</div>}
          <form onSubmit={handleSubmit}>
            <textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Example: I want to write a professional email to a client explaining a project delay..."
              className="w-full h-32 p-3 border rounded-lg mb-4"
              disabled={isProcessing}
            />
            <button
              type="submit"
              disabled={isProcessing || !userInput.trim()}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg disabled:opacity-50"
            >
              {isProcessing ? 'Processing...' : 'Generate Prompt'}
            </button>
          </form>
        </div>
      )}
      
      {/* Clarification stage */}
      {stage === 'clarification' && (
        <div className="clarification-stage">
          <h3 className="text-lg font-medium mb-4">A few quick questions</h3>
          {error && <div className="error-message">{error}</div>}
          <p className="mb-4">To create the best prompt for you, I need a bit more information:</p>
          <form onSubmit={handleClarificationSubmit}>
            {clarificationQuestions.map((question, index) => (
              <div key={index} className="mb-4">
                <label className="block mb-2">{question}</label>
                <input
                  type="text"
                  value={clarificationAnswers[question] || ''}
                  onChange={(e) => handleClarificationChange(question, e.target.value)}
                  className="w-full p-2 border rounded-lg"
                  placeholder="Your answer..."
                />
              </div>
            ))}
            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => setStage('input')}
                className="text-blue-500"
                disabled={isProcessing}
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isProcessing}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg disabled:opacity-50"
              >
                {isProcessing ? 'Processing...' : 'Continue'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Processing stage */}
      {stage === 'processing' && (
        <div className="processing-stage text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Generating your prompt blocks...</p>
        </div>
      )}
      
      {/* Complete stage */}
      {stage === 'complete' && (
        <div className="complete-stage text-center py-8">
          <div className="text-green-500 text-4xl mb-4">✓</div>
          <h3 className="text-lg font-medium mb-2">Prompt Generated Successfully!</h3>
          <p className="mb-4">Your prompt blocks have been created based on your input.</p>
          <button
            onClick={resetFlow}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg"
          >
            Create Another Prompt
          </button>
        </div>
      )}
    </div>
  );
};

export default AIPromptFlow;