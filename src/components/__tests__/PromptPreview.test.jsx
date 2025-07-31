import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import PromptPreview from '../PromptPreview';

// Mock the store
const mockBlocks = [];
const mockAddBlock = vi.fn();

vi.mock('../../store/promptStore', () => ({
  usePromptStore: vi.fn((selector) => {
    const state = {
      blocks: mockBlocks,
      addBlock: mockAddBlock,
    };
    return selector(state);
  }),
}));

// Mock EmptyState component
vi.mock('../EmptyState', () => ({
  default: ({ title, description, actionText, onAction, icon }) => (
    <div data-testid="empty-state">
      <div>{icon}</div>
      <h3>{title}</h3>
      <p>{description}</p>
      {actionText && <button onClick={onAction}>{actionText}</button>}
    </div>
  ),
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...props }) => (
      <div className={className} {...props}>
        {children}
      </div>
    ),
  },
}));

describe('PromptPreview Component - Fixed Block Ordering', () => {
  beforeEach(() => {
    mockBlocks.length = 0;
    vi.clearAllMocks();
  });

  it('should display blocks in fixed order regardless of creation order', () => {
    // Add blocks in random order
    const blocksInRandomOrder = [
      { id: '1', type: 'Creativity Level', content: 'Be creative' },
      { id: '2', type: 'Task', content: 'Write a story' },
      { id: '3', type: 'Audience', content: 'For children' },
      { id: '4', type: 'Tone', content: 'Friendly' },
      { id: '5', type: 'Examples', content: 'Like fairy tales' },
    ];
    
    mockBlocks.push(...blocksInRandomOrder);
    
    render(<PromptPreview />);
    
    // Get the generated prompt text
    const promptElement = screen.getByText(/Task: Write a story/);
    const promptText = promptElement.textContent;
    
    // Verify the blocks appear in the correct fixed order
    const expectedOrder = [
      'Task: Write a story',
      'Tone: Friendly', 
      'Audience: For children',
      'Examples: Like fairy tales',
      'Creativity Level: Be creative'
    ];
    
    expectedOrder.forEach((expectedBlock, index) => {
      const blockPosition = promptText.indexOf(expectedBlock);
      expect(blockPosition).toBeGreaterThan(-1);
      
      // Verify this block appears before the next one
      if (index < expectedOrder.length - 1) {
        const nextBlockPosition = promptText.indexOf(expectedOrder[index + 1]);
        expect(blockPosition).toBeLessThan(nextBlockPosition);
      }
    });
  });

  it('should filter out empty blocks correctly while maintaining order', () => {
    const blocksWithEmpty = [
      { id: '1', type: 'Creativity Level', content: 'Be creative' },
      { id: '2', type: 'Task', content: '' }, // Empty block
      { id: '3', type: 'Audience', content: 'For children' },
      { id: '4', type: 'Tone', content: '   ' }, // Whitespace only
      { id: '5', type: 'Format', content: 'Essay format' },
    ];
    
    mockBlocks.push(...blocksWithEmpty);
    
    render(<PromptPreview />);
    
    // Get the generated prompt text
    const promptElement = screen.getByText(/Format: Essay format/);
    const promptText = promptElement.textContent;
    
    // Verify empty blocks are filtered out
    expect(promptText).not.toContain('Task:');
    expect(promptText).not.toContain('Tone:');
    
    // Verify remaining blocks are in correct order
    expect(promptText.indexOf('Format: Essay format')).toBeLessThan(
      promptText.indexOf('Audience: For children')
    );
    expect(promptText.indexOf('Audience: For children')).toBeLessThan(
      promptText.indexOf('Creativity Level: Be creative')
    );
  });

  it('should handle all 9 block types in correct order', () => {
    const allBlockTypes = [
      { id: '9', type: 'Creativity Level', content: 'Balanced' },
      { id: '8', type: 'Examples', content: 'Sample text' },
      { id: '7', type: 'Style', content: 'Academic' },
      { id: '6', type: 'Audience', content: 'Students' },
      { id: '5', type: 'Constraint', content: '500 words max' },
      { id: '4', type: 'Persona', content: 'Expert teacher' },
      { id: '3', type: 'Format', content: 'Essay' },
      { id: '2', type: 'Tone', content: 'Professional' },
      { id: '1', type: 'Task', content: 'Explain concept' },
    ];
    
    mockBlocks.push(...allBlockTypes);
    
    render(<PromptPreview />);
    
    const promptElement = screen.getByText(/Task: Explain concept/);
    const promptText = promptElement.textContent;
    
    // Verify all blocks appear in the correct fixed order
    const expectedOrder = [
      'Task: Explain concept',
      'Tone: Professional',
      'Format: Essay',
      'Persona: Expert teacher',
      'Constraint: 500 words max',
      'Audience: Students',
      'Style: Academic',
      'Examples: Sample text',
      'Creativity Level: Balanced'
    ];
    
    let lastPosition = -1;
    expectedOrder.forEach(expectedBlock => {
      const position = promptText.indexOf(expectedBlock);
      expect(position).toBeGreaterThan(lastPosition);
      lastPosition = position;
    });
  });

  it('should handle mixed existing and new block types correctly', () => {
    const mixedBlocks = [
      { id: '1', type: 'Style', content: 'Conversational' }, // New type
      { id: '2', type: 'Task', content: 'Write email' }, // Existing type
      { id: '3', type: 'Persona', content: 'Manager' }, // Existing type
      { id: '4', type: 'Audience', content: 'Team members' }, // New type
    ];
    
    mockBlocks.push(...mixedBlocks);
    
    render(<PromptPreview />);
    
    const promptElement = screen.getByText(/Task: Write email/);
    const promptText = promptElement.textContent;
    
    // Verify correct order: Task → Persona → Audience → Style
    expect(promptText.indexOf('Task: Write email')).toBeLessThan(
      promptText.indexOf('Persona: Manager')
    );
    expect(promptText.indexOf('Persona: Manager')).toBeLessThan(
      promptText.indexOf('Audience: Team members')
    );
    expect(promptText.indexOf('Audience: Team members')).toBeLessThan(
      promptText.indexOf('Style: Conversational')
    );
  });

  it('should show empty state when no blocks have content', () => {
    const emptyBlocks = [
      { id: '1', type: 'Task', content: '' },
      { id: '2', type: 'Tone', content: '   ' },
    ];
    
    mockBlocks.push(...emptyBlocks);
    
    render(<PromptPreview />);
    
    // Should show the empty state for blocks with no content
    expect(screen.getByText('Fill out your blocks to see the magic')).toBeInTheDocument();
  });

  it('should show initial empty state when no blocks exist', () => {
    // mockBlocks is already empty from beforeEach
    
    render(<PromptPreview />);
    
    // Should show the initial empty state
    expect(screen.getByText('Your prompt will appear here')).toBeInTheDocument();
    expect(screen.getByText('Add a Block to Get Started')).toBeInTheDocument();
  });
});

describe('PromptPreview Component - New Block Types Testing', () => {
  beforeEach(() => {
    mockBlocks.length = 0;
    vi.clearAllMocks();
  });

  describe('Preview generation with only new block types', () => {
    it('should generate preview with only Audience block', () => {
      const audienceOnlyBlocks = [
        { id: '1', type: 'Audience', content: 'Marketing professionals with 5+ years experience' }
      ];
      
      mockBlocks.push(...audienceOnlyBlocks);
      
      render(<PromptPreview />);
      
      const promptElement = screen.getByText(/Audience: Marketing professionals/);
      expect(promptElement).toBeInTheDocument();
      expect(promptElement.textContent).toBe('Audience: Marketing professionals with 5+ years experience');
    });

    it('should generate preview with only Style block', () => {
      const styleOnlyBlocks = [
        { id: '1', type: 'Style', content: 'Write in the style of Ernest Hemingway - concise, direct, understated' }
      ];
      
      mockBlocks.push(...styleOnlyBlocks);
      
      render(<PromptPreview />);
      
      const promptElement = screen.getByText(/Style: Write in the style of Ernest Hemingway/);
      expect(promptElement).toBeInTheDocument();
      expect(promptElement.textContent).toBe('Style: Write in the style of Ernest Hemingway - concise, direct, understated');
    });

    it('should generate preview with only Examples block', () => {
      const examplesOnlyBlocks = [
        { id: '1', type: 'Examples', content: 'Example 1: "The quick brown fox..." Example 2: "Lorem ipsum dolor..."' }
      ];
      
      mockBlocks.push(...examplesOnlyBlocks);
      
      render(<PromptPreview />);
      
      const promptElement = screen.getByText(/Examples: Example 1:/);
      expect(promptElement).toBeInTheDocument();
      expect(promptElement.textContent).toBe('Examples: Example 1: "The quick brown fox..." Example 2: "Lorem ipsum dolor..."');
    });

    it('should generate preview with only Creativity Level block', () => {
      const creativityOnlyBlocks = [
        { id: '1', type: 'Creativity Level', content: 'Highly creative and imaginative - think outside the box' }
      ];
      
      mockBlocks.push(...creativityOnlyBlocks);
      
      render(<PromptPreview />);
      
      const promptElement = screen.getByText(/Creativity Level: Highly creative/);
      expect(promptElement).toBeInTheDocument();
      expect(promptElement.textContent).toBe('Creativity Level: Highly creative and imaginative - think outside the box');
    });

    it('should generate preview with multiple new block types only', () => {
      const newBlocksOnly = [
        { id: '1', type: 'Creativity Level', content: 'Balanced creative-factual approach' },
        { id: '2', type: 'Audience', content: 'College students studying literature' },
        { id: '3', type: 'Style', content: 'Academic but accessible writing style' },
        { id: '4', type: 'Examples', content: 'Reference works like "To Kill a Mockingbird" and "1984"' }
      ];
      
      mockBlocks.push(...newBlocksOnly);
      
      render(<PromptPreview />);
      
      const promptElement = screen.getByText(/Audience: College students/);
      const promptText = promptElement.textContent;
      
      // Verify all new blocks are present in correct order
      expect(promptText).toContain('Audience: College students studying literature');
      expect(promptText).toContain('Style: Academic but accessible writing style');
      expect(promptText).toContain('Examples: Reference works like "To Kill a Mockingbird" and "1984"');
      expect(promptText).toContain('Creativity Level: Balanced creative-factual approach');
      
      // Verify correct ordering (Audience → Style → Examples → Creativity Level)
      expect(promptText.indexOf('Audience:')).toBeLessThan(promptText.indexOf('Style:'));
      expect(promptText.indexOf('Style:')).toBeLessThan(promptText.indexOf('Examples:'));
      expect(promptText.indexOf('Examples:')).toBeLessThan(promptText.indexOf('Creativity Level:'));
    });
  });

  describe('Preview generation with mixed old and new block types', () => {
    it('should handle Task + new blocks correctly', () => {
      const mixedBlocks = [
        { id: '1', type: 'Audience', content: 'Software developers' },
        { id: '2', type: 'Task', content: 'Write technical documentation' },
        { id: '3', type: 'Style', content: 'Clear and concise technical writing' }
      ];
      
      mockBlocks.push(...mixedBlocks);
      
      render(<PromptPreview />);
      
      const promptElement = screen.getByText(/Task: Write technical documentation/);
      const promptText = promptElement.textContent;
      
      // Verify correct order: Task → Audience → Style
      expect(promptText.indexOf('Task: Write technical documentation')).toBeLessThan(
        promptText.indexOf('Audience: Software developers')
      );
      expect(promptText.indexOf('Audience: Software developers')).toBeLessThan(
        promptText.indexOf('Style: Clear and concise technical writing')
      );
    });

    it('should handle Tone + new blocks correctly', () => {
      const mixedBlocks = [
        { id: '1', type: 'Examples', content: 'Like a friendly conversation with a colleague' },
        { id: '2', type: 'Tone', content: 'Professional yet approachable' },
        { id: '3', type: 'Creativity Level', content: 'Moderately creative with practical focus' }
      ];
      
      mockBlocks.push(...mixedBlocks);
      
      render(<PromptPreview />);
      
      const promptElement = screen.getByText(/Tone: Professional yet approachable/);
      const promptText = promptElement.textContent;
      
      // Verify correct order: Tone → Examples → Creativity Level
      expect(promptText.indexOf('Tone: Professional yet approachable')).toBeLessThan(
        promptText.indexOf('Examples: Like a friendly conversation')
      );
      expect(promptText.indexOf('Examples: Like a friendly conversation')).toBeLessThan(
        promptText.indexOf('Creativity Level: Moderately creative')
      );
    });

    it('should handle Format + new blocks correctly', () => {
      const mixedBlocks = [
        { id: '1', type: 'Style', content: 'Journalistic style with inverted pyramid structure' },
        { id: '2', type: 'Format', content: 'News article with headline, lead, and body' },
        { id: '3', type: 'Audience', content: 'General public interested in current events' }
      ];
      
      mockBlocks.push(...mixedBlocks);
      
      render(<PromptPreview />);
      
      const promptElement = screen.getByText(/Format: News article/);
      const promptText = promptElement.textContent;
      
      // Verify correct order: Format → Audience → Style
      expect(promptText.indexOf('Format: News article')).toBeLessThan(
        promptText.indexOf('Audience: General public')
      );
      expect(promptText.indexOf('Audience: General public')).toBeLessThan(
        promptText.indexOf('Style: Journalistic style')
      );
    });

    it('should handle Persona + new blocks correctly', () => {
      const mixedBlocks = [
        { id: '1', type: 'Creativity Level', content: 'Highly imaginative and playful' },
        { id: '2', type: 'Persona', content: 'Enthusiastic children\'s book author' },
        { id: '3', type: 'Examples', content: 'Think Dr. Seuss meets modern educational content' }
      ];
      
      mockBlocks.push(...mixedBlocks);
      
      render(<PromptPreview />);
      
      const promptElement = screen.getByText(/Persona: Enthusiastic children's book author/);
      const promptText = promptElement.textContent;
      
      // Verify correct order: Persona → Examples → Creativity Level
      expect(promptText.indexOf('Persona: Enthusiastic')).toBeLessThan(
        promptText.indexOf('Examples: Think Dr. Seuss')
      );
      expect(promptText.indexOf('Examples: Think Dr. Seuss')).toBeLessThan(
        promptText.indexOf('Creativity Level: Highly imaginative')
      );
    });

    it('should handle Constraint + new blocks correctly', () => {
      const mixedBlocks = [
        { id: '1', type: 'Audience', content: 'Busy executives with limited time' },
        { id: '2', type: 'Constraint', content: 'Maximum 200 words, bullet points preferred' },
        { id: '3', type: 'Style', content: 'Executive summary style - direct and actionable' }
      ];
      
      mockBlocks.push(...mixedBlocks);
      
      render(<PromptPreview />);
      
      const promptElement = screen.getByText(/Constraint: Maximum 200 words/);
      const promptText = promptElement.textContent;
      
      // Verify correct order: Constraint → Audience → Style
      expect(promptText.indexOf('Constraint: Maximum 200 words')).toBeLessThan(
        promptText.indexOf('Audience: Busy executives')
      );
      expect(promptText.indexOf('Audience: Busy executives')).toBeLessThan(
        promptText.indexOf('Style: Executive summary style')
      );
    });

    it('should handle complex mixed scenarios with all block types', () => {
      const complexMixedBlocks = [
        { id: '1', type: 'Examples', content: 'Reference successful campaigns like Nike\'s "Just Do It"' },
        { id: '2', type: 'Constraint', content: 'Must be suitable for social media, under 280 characters' },
        { id: '3', type: 'Task', content: 'Create a compelling marketing slogan' },
        { id: '4', type: 'Audience', content: 'Millennials interested in sustainable fashion' },
        { id: '5', type: 'Tone', content: 'Inspiring and authentic' },
        { id: '6', type: 'Creativity Level', content: 'Highly creative with memorable wordplay' },
        { id: '7', type: 'Format', content: 'Short, punchy slogan with optional tagline' },
        { id: '8', type: 'Style', content: 'Modern, conversational brand voice' },
        { id: '9', type: 'Persona', content: 'Brand strategist with deep understanding of Gen Z/Millennial values' }
      ];
      
      mockBlocks.push(...complexMixedBlocks);
      
      render(<PromptPreview />);
      
      const promptElement = screen.getByText(/Task: Create a compelling marketing slogan/);
      const promptText = promptElement.textContent;
      
      // Verify all blocks are present
      expect(promptText).toContain('Task: Create a compelling marketing slogan');
      expect(promptText).toContain('Tone: Inspiring and authentic');
      expect(promptText).toContain('Format: Short, punchy slogan');
      expect(promptText).toContain('Persona: Brand strategist');
      expect(promptText).toContain('Constraint: Must be suitable for social media');
      expect(promptText).toContain('Audience: Millennials interested in sustainable fashion');
      expect(promptText).toContain('Style: Modern, conversational brand voice');
      expect(promptText).toContain('Examples: Reference successful campaigns');
      expect(promptText).toContain('Creativity Level: Highly creative');
      
      // Verify complete correct ordering
      const expectedOrder = [
        'Task:', 'Tone:', 'Format:', 'Persona:', 'Constraint:', 
        'Audience:', 'Style:', 'Examples:', 'Creativity Level:'
      ];
      
      let lastPosition = -1;
      expectedOrder.forEach(blockPrefix => {
        const position = promptText.indexOf(blockPrefix);
        expect(position).toBeGreaterThan(lastPosition);
        lastPosition = position;
      });
    });
  });

  describe('Block ordering verification in all scenarios', () => {
    it('should maintain correct order when blocks are added in reverse order', () => {
      const reverseOrderBlocks = [
        { id: '9', type: 'Creativity Level', content: 'Creative content' },
        { id: '8', type: 'Examples', content: 'Example content' },
        { id: '7', type: 'Style', content: 'Style content' },
        { id: '6', type: 'Audience', content: 'Audience content' },
        { id: '5', type: 'Constraint', content: 'Constraint content' },
        { id: '4', type: 'Persona', content: 'Persona content' },
        { id: '3', type: 'Format', content: 'Format content' },
        { id: '2', type: 'Tone', content: 'Tone content' },
        { id: '1', type: 'Task', content: 'Task content' }
      ];
      
      mockBlocks.push(...reverseOrderBlocks);
      
      render(<PromptPreview />);
      
      const promptElement = screen.getByText(/Task: Task content/);
      const promptText = promptElement.textContent;
      
      // Verify blocks appear in correct order despite being added in reverse
      const blockOrder = [
        'Task: Task content',
        'Tone: Tone content',
        'Format: Format content',
        'Persona: Persona content',
        'Constraint: Constraint content',
        'Audience: Audience content',
        'Style: Style content',
        'Examples: Example content',
        'Creativity Level: Creative content'
      ];
      
      let lastPosition = -1;
      blockOrder.forEach(expectedBlock => {
        const position = promptText.indexOf(expectedBlock);
        expect(position).toBeGreaterThan(lastPosition);
        lastPosition = position;
      });
    });

    it('should handle random insertion order correctly', () => {
      const randomOrderBlocks = [
        { id: '1', type: 'Style', content: 'Random style' },
        { id: '2', type: 'Task', content: 'Random task' },
        { id: '3', type: 'Creativity Level', content: 'Random creativity' },
        { id: '4', type: 'Format', content: 'Random format' },
        { id: '5', type: 'Audience', content: 'Random audience' },
        { id: '6', type: 'Tone', content: 'Random tone' },
        { id: '7', type: 'Examples', content: 'Random examples' }
      ];
      
      mockBlocks.push(...randomOrderBlocks);
      
      render(<PromptPreview />);
      
      const promptElement = screen.getByText(/Task: Random task/);
      const promptText = promptElement.textContent;
      
      // Verify correct ordering regardless of insertion order
      expect(promptText.indexOf('Task: Random task')).toBeLessThan(
        promptText.indexOf('Tone: Random tone')
      );
      expect(promptText.indexOf('Tone: Random tone')).toBeLessThan(
        promptText.indexOf('Format: Random format')
      );
      expect(promptText.indexOf('Format: Random format')).toBeLessThan(
        promptText.indexOf('Audience: Random audience')
      );
      expect(promptText.indexOf('Audience: Random audience')).toBeLessThan(
        promptText.indexOf('Style: Random style')
      );
      expect(promptText.indexOf('Style: Random style')).toBeLessThan(
        promptText.indexOf('Examples: Random examples')
      );
      expect(promptText.indexOf('Examples: Random examples')).toBeLessThan(
        promptText.indexOf('Creativity Level: Random creativity')
      );
    });

    it('should handle sparse block selection with correct ordering', () => {
      const sparseBlocks = [
        { id: '1', type: 'Task', content: 'Sparse task' },
        { id: '2', type: 'Persona', content: 'Sparse persona' },
        { id: '3', type: 'Style', content: 'Sparse style' },
        { id: '4', type: 'Creativity Level', content: 'Sparse creativity' }
      ];
      
      mockBlocks.push(...sparseBlocks);
      
      render(<PromptPreview />);
      
      const promptElement = screen.getByText(/Task: Sparse task/);
      const promptText = promptElement.textContent;
      
      // Verify only selected blocks appear and in correct order
      expect(promptText).toContain('Task: Sparse task');
      expect(promptText).toContain('Persona: Sparse persona');
      expect(promptText).toContain('Style: Sparse style');
      expect(promptText).toContain('Creativity Level: Sparse creativity');
      
      // Verify missing blocks are not present
      expect(promptText).not.toContain('Tone:');
      expect(promptText).not.toContain('Format:');
      expect(promptText).not.toContain('Constraint:');
      expect(promptText).not.toContain('Audience:');
      expect(promptText).not.toContain('Examples:');
      
      // Verify correct ordering of present blocks
      expect(promptText.indexOf('Task: Sparse task')).toBeLessThan(
        promptText.indexOf('Persona: Sparse persona')
      );
      expect(promptText.indexOf('Persona: Sparse persona')).toBeLessThan(
        promptText.indexOf('Style: Sparse style')
      );
      expect(promptText.indexOf('Style: Sparse style')).toBeLessThan(
        promptText.indexOf('Creativity Level: Sparse creativity')
      );
    });
  });

  describe('Copy functionality with new blocks', () => {
    // Mock navigator.clipboard
    const mockWriteText = vi.fn();
    
    beforeEach(() => {
      Object.assign(navigator, {
        clipboard: {
          writeText: mockWriteText,
        },
      });
      mockWriteText.mockClear();
    });

    it('should copy prompts containing only new block types', () => {
      const newBlocksOnly = [
        { id: '1', type: 'Audience', content: 'Tech enthusiasts' },
        { id: '2', type: 'Style', content: 'Conversational and engaging' },
        { id: '3', type: 'Examples', content: 'Like popular tech blogs' },
        { id: '4', type: 'Creativity Level', content: 'Moderately creative' }
      ];
      
      mockBlocks.push(...newBlocksOnly);
      
      render(<PromptPreview />);
      
      const copyButton = screen.getByText('📋 Copy');
      copyButton.click();
      
      expect(mockWriteText).toHaveBeenCalledWith(
        'Audience: Tech enthusiasts\n\nStyle: Conversational and engaging\n\nExamples: Like popular tech blogs\n\nCreativity Level: Moderately creative'
      );
    });

    it('should copy prompts containing mixed old and new block types', () => {
      const mixedBlocks = [
        { id: '1', type: 'Task', content: 'Write a blog post' },
        { id: '2', type: 'Tone', content: 'Informative and friendly' },
        { id: '3', type: 'Audience', content: 'Small business owners' },
        { id: '4', type: 'Style', content: 'Professional but approachable' },
        { id: '5', type: 'Examples', content: 'Reference successful case studies' }
      ];
      
      mockBlocks.push(...mixedBlocks);
      
      render(<PromptPreview />);
      
      const copyButton = screen.getByText('📋 Copy');
      copyButton.click();
      
      expect(mockWriteText).toHaveBeenCalledWith(
        'Task: Write a blog post\n\nTone: Informative and friendly\n\nAudience: Small business owners\n\nStyle: Professional but approachable\n\nExamples: Reference successful case studies'
      );
    });

    it('should copy complex prompts with all block types correctly', () => {
      const allBlockTypes = [
        { id: '1', type: 'Task', content: 'Create marketing copy' },
        { id: '2', type: 'Tone', content: 'Persuasive' },
        { id: '3', type: 'Format', content: 'Email newsletter' },
        { id: '4', type: 'Persona', content: 'Marketing expert' },
        { id: '5', type: 'Constraint', content: 'Under 500 words' },
        { id: '6', type: 'Audience', content: 'Potential customers' },
        { id: '7', type: 'Style', content: 'Brand voice guidelines' },
        { id: '8', type: 'Examples', content: 'Previous successful campaigns' },
        { id: '9', type: 'Creativity Level', content: 'Balanced approach' }
      ];
      
      mockBlocks.push(...allBlockTypes);
      
      render(<PromptPreview />);
      
      const copyButton = screen.getByText('📋 Copy');
      copyButton.click();
      
      const expectedText = 'Task: Create marketing copy\n\nTone: Persuasive\n\nFormat: Email newsletter\n\nPersona: Marketing expert\n\nConstraint: Under 500 words\n\nAudience: Potential customers\n\nStyle: Brand voice guidelines\n\nExamples: Previous successful campaigns\n\nCreativity Level: Balanced approach';
      
      expect(mockWriteText).toHaveBeenCalledWith(expectedText);
    });

    it('should copy prompts with special characters and formatting correctly', () => {
      const specialContentBlocks = [
        { id: '1', type: 'Task', content: 'Write code documentation with examples: function() { return "hello"; }' },
        { id: '2', type: 'Audience', content: 'Developers familiar with JavaScript, React, and Node.js' },
        { id: '3', type: 'Style', content: 'Technical writing style - clear, concise, with code examples' },
        { id: '4', type: 'Examples', content: 'Like MDN docs: "The Array.map() method creates a new array..."' }
      ];
      
      mockBlocks.push(...specialContentBlocks);
      
      render(<PromptPreview />);
      
      const copyButton = screen.getByText('📋 Copy');
      copyButton.click();
      
      const expectedText = 'Task: Write code documentation with examples: function() { return "hello"; }\n\nAudience: Developers familiar with JavaScript, React, and Node.js\n\nStyle: Technical writing style - clear, concise, with code examples\n\nExamples: Like MDN docs: "The Array.map() method creates a new array..."';
      
      expect(mockWriteText).toHaveBeenCalledWith(expectedText);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle unknown block types gracefully', () => {
      const blocksWithUnknown = [
        { id: '1', type: 'Task', content: 'Write content' },
        { id: '2', type: 'UnknownType', content: 'Unknown content' },
        { id: '3', type: 'Tone', content: 'Professional' }
      ];
      
      mockBlocks.push(...blocksWithUnknown);
      
      render(<PromptPreview />);
      
      const promptElement = screen.getByText(/Task: Write content/);
      const promptText = promptElement.textContent;
      
      // Should include unknown block type in output
      expect(promptText).toContain('Task: Write content');
      expect(promptText).toContain('UnknownType: Unknown content');
      expect(promptText).toContain('Tone: Professional');
    });

    it('should handle blocks with null type gracefully', () => {
      const blocksWithNull = [
        { id: '1', type: 'Task', content: 'Write content' },
        { id: '2', type: null, content: 'Null type content' },
        { id: '3', type: 'Tone', content: 'Professional' }
      ];
      
      mockBlocks.push(...blocksWithNull);
      
      render(<PromptPreview />);
      
      const promptElement = screen.getByText(/Task: Write content/);
      const promptText = promptElement.textContent;
      
      // Should handle null type without crashing
      expect(promptText).toContain('Task: Write content');
      expect(promptText).toContain('Tone: Professional');
      expect(promptText).toContain('null: Null type content');
    });

    it('should handle blocks with undefined type gracefully', () => {
      const blocksWithUndefined = [
        { id: '1', type: 'Task', content: 'Write content' },
        { id: '2', type: undefined, content: 'Undefined type content' },
        { id: '3', type: 'Tone', content: 'Professional' }
      ];
      
      mockBlocks.push(...blocksWithUndefined);
      
      render(<PromptPreview />);
      
      const promptElement = screen.getByText(/Task: Write content/);
      const promptText = promptElement.textContent;
      
      // Should handle undefined type without crashing
      expect(promptText).toContain('Task: Write content');
      expect(promptText).toContain('Tone: Professional');
      expect(promptText).toContain('undefined: Undefined type content');
    });

    it('should handle blocks with empty string type', () => {
      const blocksWithEmpty = [
        { id: '1', type: 'Task', content: 'Write content' },
        { id: '2', type: '', content: 'Empty type content' },
        { id: '3', type: 'Tone', content: 'Professional' }
      ];
      
      mockBlocks.push(...blocksWithEmpty);
      
      render(<PromptPreview />);
      
      const promptElement = screen.getByText(/Task: Write content/);
      const promptText = promptElement.textContent;
      
      // Should handle empty string type without crashing
      expect(promptText).toContain('Task: Write content');
      expect(promptText).toContain('Tone: Professional');
      expect(promptText).toContain(': Empty type content');
    });

    it('should handle mixed valid and invalid block types', () => {
      const mixedBlocks = [
        { id: '1', type: 'Task', content: 'Valid task' },
        { id: '2', type: 'InvalidType1', content: 'Invalid content 1' },
        { id: '3', type: 'Audience', content: 'Valid audience' },
        { id: '4', type: 'InvalidType2', content: 'Invalid content 2' },
        { id: '5', type: 'Style', content: 'Valid style' }
      ];
      
      mockBlocks.push(...mixedBlocks);
      
      render(<PromptPreview />);
      
      const promptElement = screen.getByText(/Task: Valid task/);
      const promptText = promptElement.textContent;
      
      // All blocks should appear, with known types in correct order
      expect(promptText).toContain('Task: Valid task');
      expect(promptText).toContain('Audience: Valid audience');
      expect(promptText).toContain('Style: Valid style');
      expect(promptText).toContain('InvalidType1: Invalid content 1');
      expect(promptText).toContain('InvalidType2: Invalid content 2');
    });

    it('should handle blocks with special characters in content', () => {
      const specialCharBlocks = [
        { id: '1', type: 'Task', content: 'Content with @#$%^&*()_+ special chars' },
        { id: '2', type: 'Tone', content: 'Content with "quotes" and \'apostrophes\'' }
      ];
      
      mockBlocks.push(...specialCharBlocks);
      
      render(<PromptPreview />);
      
      const promptElement = screen.getByText(/Content with @#\$%\^&\*\(\)_\+ special chars/);
      const promptText = promptElement.textContent;
      
      expect(promptText).toContain('Content with @#$%^&*()_+ special chars');
      expect(promptText).toContain('Content with "quotes" and \'apostrophes\'');
    });

    it('should handle blocks with multiline content', () => {
      const multilineBlocks = [
        {
          id: '1',
          type: 'Task',
          content: 'Line 1\nLine 2\nLine 3'
        }
      ];
      
      mockBlocks.push(...multilineBlocks);
      
      render(<PromptPreview />);
      
      const promptElement = screen.getByText(/Task: Line 1/);
      expect(promptElement.textContent).toContain('Line 1\nLine 2\nLine 3');
    });

    it('should handle very long content gracefully', () => {
      const longContent = 'A'.repeat(1000);
      const longContentBlocks = [
        {
          id: '1',
          type: 'Task',
          content: longContent
        }
      ];
      
      mockBlocks.push(...longContentBlocks);
      
      render(<PromptPreview />);
      
      const promptElement = screen.getByText(new RegExp(`Task: ${longContent}`));
      expect(promptElement).toBeInTheDocument();
    });

    it('should handle empty blocks array without crashing', () => {
      // mockBlocks is already empty from beforeEach
      expect(() => {
        render(<PromptPreview />);
      }).not.toThrow();
      
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });

    it('should preserve existing error handling behavior', () => {
      // Test that normal functionality still works
      const normalBlocks = [
        { id: '1', type: 'Task', content: 'Normal task' },
        { id: '2', type: 'Tone', content: 'Normal tone' }
      ];
      
      mockBlocks.push(...normalBlocks);
      
      render(<PromptPreview />);
      
      expect(screen.getByText('Generated Prompt')).toBeInTheDocument();
      const promptElement = screen.getByText(/Task: Normal task.*Tone: Normal tone/s);
      expect(promptElement).toBeInTheDocument();
      expect(screen.getByText('📋 Copy')).toBeInTheDocument();
    });

    it('should handle blocks with numeric content', () => {
      const numericBlocks = [
        {
          id: '1',
          type: 'Task',
          content: '12345'
        }
      ];
      
      mockBlocks.push(...numericBlocks);
      
      render(<PromptPreview />);
      
      const promptElement = screen.getByText(/Task: 12345/);
      expect(promptElement).toBeInTheDocument();
    });

    it('should handle blocks with boolean-like content', () => {
      const booleanBlocks = [
        { id: '1', type: 'Task', content: 'true' },
        { id: '2', type: 'Tone', content: 'false' }
      ];
      
      mockBlocks.push(...booleanBlocks);
      
      render(<PromptPreview />);
      
      const promptElement = screen.getByText(/Task: true.*Tone: false/s);
      expect(promptElement).toBeInTheDocument();
    });

    it('should handle blocks with missing properties gracefully', () => {
      const incompleteBlocks = [
        { id: '1', type: 'Task', content: 'Complete block' },
        { id: '2' }, // missing type and content
        { id: '3', type: 'Tone' } // missing content
      ];
      
      mockBlocks.push(...incompleteBlocks);
      
      expect(() => {
        render(<PromptPreview />);
      }).not.toThrow();
      
      // Should show the complete block
      expect(screen.getByText(/Task: Complete block/)).toBeInTheDocument();
    });

    it('should handle case sensitivity correctly', () => {
      const caseSensitiveBlocks = [
        { id: '1', type: 'task', content: 'Lowercase task' }, // Should be treated as unknown
        { id: '2', type: 'Task', content: 'Proper case task' }
      ];
      
      mockBlocks.push(...caseSensitiveBlocks);
      
      render(<PromptPreview />);
      
      const promptElement = screen.getByText(/Task: Proper case task/);
      const promptText = promptElement.textContent;
      
      // Should treat lowercase as unknown type
      expect(promptText).toContain('Task: Proper case task');
      expect(promptText).toContain('task: Lowercase task');
    });

    it('should handle blocks with only whitespace content correctly', () => {
      const whitespaceBlocks = [
        { id: '1', type: 'Task', content: 'Valid content' },
        { id: '2', type: 'Tone', content: '   \n\t   ' }, // Only whitespace
        { id: '3', type: 'Format', content: 'More valid content' }
      ];
      
      mockBlocks.push(...whitespaceBlocks);
      
      render(<PromptPreview />);
      
      const promptElement = screen.getByText(/Task: Valid content/);
      const promptText = promptElement.textContent;
      
      // Whitespace-only blocks should be filtered out
      expect(promptText).toContain('Task: Valid content');
      expect(promptText).toContain('Format: More valid content');
      expect(promptText).not.toContain('Tone:');
    });
  });
});