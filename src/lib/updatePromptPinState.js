import { db, auth } from "../../firebase";
import { doc, updateDoc } from "firebase/firestore";
import { getFirebaseErrorMessage, retryWithBackoff } from "./errorHandling";

/**
 * Toggle the pin state of a saved prompt
 * @param {string} promptId - ID of the prompt to update
 * @param {boolean} isPinned - New pin state
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function updatePromptPinState(promptId, isPinned) {
  try {
    const user = auth.currentUser;
    if (!user) {
      return {
        success: false,
        error: "User not authenticated",
      };
    }

    if (!promptId) {
      return {
        success: false,
        error: "Prompt ID is required",
      };
    }

    const promptRef = doc(db, "users", user.uid, "prompts", promptId);
    const now = new Date().toISOString();

    const updateData = {
      isPinned,
      pinnedAt: isPinned ? now : null,
      updatedAt: now,
    };

    // Use retry with backoff for network resilience
    return await retryWithBackoff(
      async () => {
        await updateDoc(promptRef, updateData);

        return {
          success: true,
        };
      },
      {
        maxRetries: 3,
        baseDelay: 1000,
      }
    );
  } catch (error) {
    console.error("Error updating prompt pin state:", error);

    // Use our centralized error handling
    return {
      success: false,
      error: getFirebaseErrorMessage(error) || "Failed to update prompt pin state",
    };
  }
}