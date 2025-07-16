import { db, auth } from "../../firebase"
import { doc, setDoc } from "firebase/firestore"
import { nanoid } from "nanoid"

export async function savePrompt(blocks) {
  const user = auth.currentUser
  if (!user) {
    console.error("User not logged in")
    return
  }

  const promptId = nanoid() // Ou outro ID qualquer
  const promptRef = doc(db, "users", user.uid, "prompts", promptId)

  try {
    await setDoc(promptRef, {
      createdAt: new Date().toISOString(),
      blocks,
    })
    alert("✅ Prompt saved!")
  } catch (err) {
    console.error("Error saving prompt:", err)
    alert("❌ Failed to save prompt")
  }
}
