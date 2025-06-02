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
    <div className="absolute top-1 right-4">
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
          className="p-2 border-none rounded-xl bg-transparent hover:bg-gray-100 transition"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={0.8} stroke="#111827" className="size-7 text-[#111827]">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
          </svg>
        </button>
      )}
    </div>
  )
}
