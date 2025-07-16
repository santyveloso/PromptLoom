import { signInWithPopup } from "firebase/auth"
import { auth, provider } from "../../firebase"
import { usePromptStore } from "../store/promptStore"

export default function Login() {
  const setUser = usePromptStore((s) => s.setUser)

  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider)
      const user = result.user
      setUser({
        name: user.displayName,
        email: user.email,
        photo: user.photoURL
      })
    } catch (error) {
      console.error("Login error:", error)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-orange-50 via-pink-50 to-purple-100">
      <button
        onClick={handleLogin}
        className="bg-black text-white px-6 py-3 rounded shadow hover:bg-gray-800 transition"
      >
        Sign in with Google
      </button>
    </div>
  )
}
