import { db, auth } from "../../firebase";
import { doc, setDoc } from "firebase/firestore";
import { nanoid } from "nanoid";

/**
 * Save a prompt to Firestore with enhanced metadata
 * @param {Array} blocks - Array of prompt blocks
 * @returns {Promise<{success: boolean, error?: string, promptId?: string}>}
 */
export async function savePrompt(blocks) {
  try {
    const user = auth.currentUser;
    if (!user) {
      return {
        success: false,
        error: "User not authenticated",
      };
    }

    // Validate blocks
    if (!blocks || !Array.isArray(blocks)) {
      return {
        success: false,
        error: "Invalid blocks data",
      };
    }

    // Prevent saving empty prompts
    const hasContent = blocks.some(
      (block) => block.content && block.content.trim().length > 0
    );

    if (!hasContent) {
      return {
        success: false,
        error: "Cannot save empty prompt. Please add some content first.",
      };
    }

    const promptId = nanoid();
    const promptRef = doc(db, "users", user.uid, "prompts", promptId);
    const now = new Date().toISOString();

    const promptData = {
      blocks,
      createdAt: now,
      updatedAt: now,
      title: generateTitle(blocks),
      preview: generatePreview(blocks),
    };

    await setDoc(promptRef, promptData);

    return {
      success: true,
      promptId,
    };
  } catch (error) {
    console.error("Error saving prompt:", error);

    // Handle specific Firebase errors
    if (error.code === "permission-denied") {
      return {
        success: false,
        error: "Permission denied. Please check your authentication.",
      };
    }

    if (error.code === "unavailable") {
      return {
        success: false,
        error: "Service temporarily unavailable. Please try again.",
      };
    }

    return {
      success: false,
      error: error.message || "Failed to save prompt",
    };
  }
}

/**
 * Generate a meaningful title from prompt blocks
 * @param {Array} blocks - Array of prompt blocks
 * @returns {string} Generated title
 */
function generateTitle(blocks) {
  if (!blocks || blocks.length === 0) {
    return "Untitled Prompt";
  }

  // Find the first block with content
  const firstBlockWithContent = blocks.find(
    (block) => block.content && block.content.trim().length > 0
  );

  if (!firstBlockWithContent) {
    return "Untitled Prompt";
  }

  // Extract first meaningful words (up to 50 characters)
  const content = firstBlockWithContent.content.trim();
  if (content.length <= 50) {
    return content;
  }

  // Truncate at word boundary
  const truncated = content.substring(0, 47);
  const lastSpace = truncated.lastIndexOf(" ");

  if (lastSpace > 20) {
    return truncated.substring(0, lastSpace) + "...";
  }

  return truncated + "...";
}

/**
 * Generate preview text from prompt blocks
 * @param {Array} blocks - Array of prompt blocks
 * @returns {string} Preview text (first 100 characters)
 */
function generatePreview(blocks) {
  if (!blocks || blocks.length === 0) {
    return "Empty prompt";
  }

  // Combine all block content
  const combinedContent = blocks
    .filter((block) => block.content && block.content.trim().length > 0)
    .map((block) => block.content.trim())
    .join(" ");

  if (combinedContent.length === 0) {
    return "Empty prompt";
  }

  if (combinedContent.length <= 100) {
    return combinedContent;
  }

  // Truncate at word boundary
  const truncated = combinedContent.substring(0, 97);
  const lastSpace = truncated.lastIndexOf(" ");

  if (lastSpace > 50) {
    return truncated.substring(0, lastSpace) + "...";
  }

  return truncated + "...";
}
