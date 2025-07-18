import { db, auth } from "../../firebase"
import { doc, deleteDoc } from "firebase/firestore"
import { getFirebaseErrorMessage, retryWithBackoff } from "./errorHandling"

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

    // Use retry with backoff for network resilience
    // But don't retry permission errors or not-found errors
    return await retryWithBackoff(async () => {
      // Reference to the specific prompt document
      const promptRef = doc(db, "users", user.uid, "prompts", promptId)
      
      // Delete the document
      await deleteDoc(promptRef)

      return {
        success: true
      }
    }, { 
      maxRetries: 2, // Fewer retries for delete operations
      baseDelay: 800 
    })
  } catch (error) {
    console.error("Error deleting prompt:", error)
    
    // Use our centralized error handling
    return {
      success: false,
      error: getFirebaseErrorMessage(error) || "Failed to delete prompt"
    }
  }
}