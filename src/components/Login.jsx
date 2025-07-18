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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-tr from-amber-50 via-orange-50 to-rose-100 px-4">
      <div className="bg-white/20 backdrop-blur-sm rounded-full border border-gray-200 p-6 sm:p-8 w-full max-w-md text-center">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-gray-900 leading-tight mb-3 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Welcome to PromptStitch
          </h1>
          <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
            Build powerful, structured prompts with ease
          </p>
        </div>
        
        <button
          onClick={handleLogin}
          className="
            w-full px-5 py-3 sm:px-6 sm:py-3.5 text-sm sm:text-base font-medium rounded-xl
            bg-gray-900 text-white 
            hover:bg-gray-800 
            focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2
            shadow-md hover:shadow-lg
            flex items-center justify-center gap-3
            transition-all duration-200
          "
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Sign in with Google
        </button>
        
        <p className="text-xs sm:text-sm text-gray-500 leading-relaxed mt-4">
          Secure authentication powered by Google
        </p>
      </div>
    </div>
  )
}
