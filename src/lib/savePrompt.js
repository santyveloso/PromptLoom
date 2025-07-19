import { db, auth } from "../../firebase";
import { doc, setDoc } from "firebase/firestore";
import { nanoid } from "nanoid";
import { getFirebaseErrorMessage, retryWithBackoff } from "./errorHandling";

/**
 * Save a prompt to Firestore with enhanced metadata
 * @param {Array} blocks - Array of prompt blocks
 * @param {string} customName - Custom name for the prompt
 * @param {string} customColor - Custom color for the prompt
 * @returns {Promise<{success: boolean, error?: string, promptId?: string}>}
 */
export async function savePrompt(
  blocks,
  customName = null,
  customColor = null
) {
  console.log("savePrompt called with:", { customName, customColor });
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

    const processedCustomName =
      customName && customName.trim() ? customName.trim() : null;
    console.log("Processed custom name:", processedCustomName);

    const promptData = {
      blocks,
      createdAt: now,
      updatedAt: now,
      title: generateTitle(blocks),
      preview: generatePreview(blocks),
      customName: processedCustomName,
      customColor: customColor || "#6366f1", // Default to indigo
    };

    console.log("Saving prompt data:", promptData);

    // Use retry with backoff for network resilience
    return await retryWithBackoff(
      async () => {
        await setDoc(promptRef, promptData);

        return {
          success: true,
          promptId,
        };
      },
      {
        maxRetries: 3,
        baseDelay: 1000,
      }
    );
  } catch (error) {
    console.error("Error saving prompt:", error);

    // Use our centralized error handling
    return {
      success: false,
      error: getFirebaseErrorMessage(error) || "Failed to save prompt",
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
