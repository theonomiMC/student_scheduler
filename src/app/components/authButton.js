'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter, usePathname } from 'next/navigation'
import { LogIn, LogOut } from 'lucide-react'

export default function AuthButton() {
  const [user, setUser] = useState(null)
  const router = useRouter()
  const pathname = usePathname();

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
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Logout error:', error.message);
    } else {
      console.log('Logged out successfully');
      router.push('/');
    }
  }
if (pathname === '/login') {
    return null;
  }
  const handleLogin = () => {
    router.push('/login')
  }

  return (
    <div className="absolute top-4 left-4 z-50">
      {user ? (
        <button
          onClick={handleLogout}
          className="px-2 py-2 rounded bg-brand-yellow
          text-shadow-md transition-all hover:shadow-md"
        >
          <LogOut size={16} color='#0057b7' strokeWidth={2}/>
        </button>
      ) : (
        <button
          onClick={handleLogin}
          className="px-2 py-1 transition-all hover:shadow-sm"
        >
          <LogIn size={20} color='#1d4ed8' strokeWidth={1}/>
        </button>
      )}
    </div>
  )
}
