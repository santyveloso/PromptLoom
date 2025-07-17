import { db, auth } from "../../firebase"
import { doc, deleteDoc } from "firebase/firestore"

/**
 * Delete a saved prompt from Firestore
 * @param {string} promptId - The ID of the prompt to delete
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function deletePrompt(promptId) {
  try {
    const user = auth.currentUser
    if (!user) {
      return {
        success: false,
        error: "User not authenticated"
      }
    }

    if (!promptId || typeof promptId !== 'string') {
      return {
        success: false,
        error: "Invalid prompt ID"
      }
    }

    // Reference to the specific prompt document
    const promptRef = doc(db, "users", user.uid, "prompts", promptId)
    
    // Delete the document
    await deleteDoc(promptRef)

    return {
      success: true
    }
  } catch (error) {
    console.error("Error deleting prompt:", error)
    
    // Handle specific Firebase errors
    if (error.code === 'permission-denied') {
      return {
        success: false,
        error: "Permission denied. You can only delete your own prompts."
      }
    }
    
    if (error.code === 'not-found') {
      return {
        success: false,
        error: "Prompt not found. It may have already been deleted."
      }
    }
    
    if (error.code === 'unavailable') {
      return {
        success: false,
        error: "Service temporarily unavailable. Please try again."
      }
    }

    return {
      success: false,
      error: error.message || "Failed to delete prompt"
    }
  }
}