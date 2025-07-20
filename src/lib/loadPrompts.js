import { db, auth } from "../../firebase"
import { collection, query, orderBy, getDocs } from "firebase/firestore"
import { getFirebaseErrorMessage, retryWithBackoff } from "./errorHandling"

/**
 * Load all saved prompts for the current authenticated user
 * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
 */
export async function loadPrompts() {
  try {
    const user = auth.currentUser
    if (!user) {
      return {
        success: false,
        error: "User not authenticated"
      }
    }

    // Use retry with backoff for network resilience
    return await retryWithBackoff(async () => {
      // Reference to user's prompts collection
      const promptsRef = collection(db, "users", user.uid, "prompts")
      
      // Query prompts ordered by creation date (newest first)
      const q = query(promptsRef, orderBy("createdAt", "desc"))
      
      // Execute the query
      const querySnapshot = await getDocs(q)
      
      // Transform the documents into a usable format
      const prompts = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        prompts.push({
          id: doc.id,
          title: generateTitle(data.blocks),
          blocks: data.blocks || [],
          createdAt: data.createdAt,
          updatedAt: data.updatedAt || data.createdAt,
          preview: generatePreview(data.blocks),
          customName: data.customName || null,
          customColor: data.customColor || '#6366f1',
          isPinned: data.isPinned || false,
          pinnedAt: data.pinnedAt || null
        })
      })

      return {
        success: true,
        data: prompts
      }
    }, { maxRetries: 3, baseDelay: 1000 })
  } catch (error) {
    console.error("Error loading prompts:", error)
    return {
      success: false,
      error: getFirebaseErrorMessage(error) || "Failed to load prompts"
    }
  }
}

/**
 * Generate a meaningful title from prompt blocks
 * @param {Array} blocks - Array of prompt blocks
 * @returns {string} Generated title
 */
function generateTitle(blocks) {
  if (!blocks || blocks.length === 0) {
    return "Untitled Prompt"
  }

  // Find the first block with content
  const firstBlockWithContent = blocks.find(block => 
    block.content && block.content.trim().length > 0
  )

  if (!firstBlockWithContent) {
    return "Untitled Prompt"
  }

  // Extract first meaningful words (up to 50 characters)
  const content = firstBlockWithContent.content.trim()
  if (content.length <= 50) {
    return content
  }

  // Truncate at word boundary
  const truncated = content.substring(0, 47)
  const lastSpace = truncated.lastIndexOf(' ')
  
  if (lastSpace > 20) {
    return truncated.substring(0, lastSpace) + "..."
  }
  
  return truncated + "..."
}

/**
 * Generate preview text from prompt blocks
 * @param {Array} blocks - Array of prompt blocks
 * @returns {string} Preview text (first 100 characters)
 */
function generatePreview(blocks) {
  if (!blocks || blocks.length === 0) {
    return "Empty prompt"
  }

  // Combine all block content
  const combinedContent = blocks
    .filter(block => block.content && block.content.trim().length > 0)
    .map(block => block.content.trim())
    .join(" ")

  if (combinedContent.length === 0) {
    return "Empty prompt"
  }

  if (combinedContent.length <= 100) {
    return combinedContent
  }

  // Truncate at word boundary
  const truncated = combinedContent.substring(0, 97)
  const lastSpace = truncated.lastIndexOf(' ')
  
  if (lastSpace > 50) {
    return truncated.substring(0, lastSpace) + "..."
  }
  
  return truncated + "..."
}