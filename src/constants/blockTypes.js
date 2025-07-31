// Block type constants and configuration

// Original block types (existing functionality)
export const EXISTING_BLOCK_TYPES = ['Task', 'Tone', 'Format', 'Persona', 'Constraint'];

// New block types being added
export const NEW_BLOCK_TYPES = ['Audience', 'Style', 'Examples', 'Creativity Level'];

// All block types (existing + new)
export const ALL_BLOCK_TYPES = [
  'Task', 
  'Tone', 
  'Format', 
  'Persona', 
  'Constraint',
  'Audience', 
  'Style', 
  'Examples', 
  'Creativity Level'
];

// Fixed block order for consistent prompt generation
// Requirements: 5.1 - System SHALL always use this fixed block order
export const BLOCK_ORDER = [
  'Task',
  'Tone', 
  'Format',
  'Persona',
  'Constraint',
  'Audience',
  'Style',
  'Examples',
  'Creativity Level'
];

// Block type validation utilities
// Requirements: 5.3 - Validation for block types

/**
 * Validates if a block type is one of the supported types
 * @param {string} type - The block type to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export const isValidBlockType = (type) => {
  return ALL_BLOCK_TYPES.includes(type);
};

/**
 * Gets the order index of a block type for sorting
 * @param {string} type - The block type
 * @returns {number} - The index in the fixed order, or -1 if not found
 */
export const getBlockOrderIndex = (type) => {
  return BLOCK_ORDER.indexOf(type);
};

/**
 * Sorts blocks according to the fixed block order
 * @param {Array} blocks - Array of block objects with type property
 * @returns {Array} - Sorted array of blocks
 */
export const sortBlocksByOrder = (blocks) => {
  return blocks.sort((a, b) => {
    const indexA = getBlockOrderIndex(a.type);
    const indexB = getBlockOrderIndex(b.type);
    
    // If either block type is not found, maintain original order
    if (indexA === -1 || indexB === -1) {
      return 0;
    }
    
    return indexA - indexB;
  });
};

/**
 * Validates if a block type is one of the original existing types
 * @param {string} type - The block type to validate
 * @returns {boolean} - True if it's an existing type, false otherwise
 */
export const isExistingBlockType = (type) => {
  return EXISTING_BLOCK_TYPES.includes(type);
};

/**
 * Validates if a block type is one of the new types being added
 * @param {string} type - The block type to validate
 * @returns {boolean} - True if it's a new type, false otherwise
 */
export const isNewBlockType = (type) => {
  return NEW_BLOCK_TYPES.includes(type);
};