'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Header from '../header'
import Footer from '../footer'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
    } else {
      router.push('/')
    }
  }

  return (
    <div className="h-screen flex flex-col">
      <Header />
      <div className="flex-grow flex items-center justify-center  px-4">
        <div className="w-full max-w-md p-6 bg-white border border-gray-200 rounded-lg shadow-md">
          <h2 className="text-[1.1rem] font-bold mb-4 text-gray-900">Admin Login</h2>
          <input
            type="email"
            placeholder="Email"
            className="w-full p-2 border mb-2 outline-none"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full p-2 border mb-4 outline-none"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button onClick={handleLogin} type='submit' className="bg-gray-100 text-gray-900 px-4 py-2 rounded hover:shadow-md">
            Login
          </button>
          {error && <p className="text-red-600 mt-2">{error}</p>}
        </div>
      </div>
      <Footer />
    </div>
  )
}
