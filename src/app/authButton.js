'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function AuthButton() {
  const [user, setUser] = useState(null)
  const router = useRouter()

  useEffect(() => {
    // Load user on mount
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
    })

    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.refresh()
  }

  const handleLogin = () => {
    router.push('/login')
  }

  return (
    <div className="absolute top-8 right-4">
      {user ? (
        <button
          onClick={handleLogout}
          className="text-sm px-4 py-2 rounded bg-brand-yellow text-[#0057b7]
          text-shadow-md transition-all font-bold hover:shadow-md"
        >
          Logout
        </button>
      ) : (
        <button
          onClick={handleLogin}
          className="text-sm px-4 py-2 rounded bg-blue-800 text-white hover:bg-blue-700"
        >
          Login
        </button>
      )}
    </div>
  )
}
