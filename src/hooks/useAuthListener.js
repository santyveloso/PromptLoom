import { useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../../firebase'
import { usePromptStore } from '../store/promptStore'

export function useAuthListener() {
  const setUser = usePromptStore((s) => s.setUser)
  const setAuthChecked = usePromptStore((s) => s.setAuthChecked)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setAuthChecked(true)
    })

    return () => unsubscribe()
  }, [])
}
