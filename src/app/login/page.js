'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

import Header from '../components/header'
import Footer from '../components/footer'
import { LockKeyhole } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = async () => {
    setError("")
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
    } else {
      // After login, redirect to the edit page
      router.push('/edit')
    }
  }

  return (
    <div className="h-screen flex flex-col">
      <Header />
      {/* Login Form */}
      <div className="flex-grow flex items-center justify-center px-4">
        <div className="w-full max-w-md p-6 bg-white border border-gray-200 rounded-lg shadow-md">
          <h2 className="text-[1.1rem] mb-4 text-blue-950">Admin Login</h2>

          {/* Email Input */}
          <input
            type="email"
            placeholder="Email"
            className="w-full p-2 border mb-2 outline-none 
           text-bblue"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          {/* Password Input */}
          <input
            type="password"
            placeholder="Password"
            className="w-full p-2 border mb-4 outline-none
            text-bblue"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {/* Login Button */}
          <button
            onClick={handleLogin}
            type="submit"
            className="bg-[#8b0015]
             text-white font-medium 
             f
             px-5 py-2 flex items-center 
             justify-center gap-2 
             rounded-md shadow-sm 
             hover:bg-[#ab0520] transition duration-150"
          >
            <LockKeyhole size={16} className="relative top-[-3px]" />
            LOGIN
          </button>
          {/* Error Message */}
          {error && <p className="text-red-600 mt-2">{error}</p>}
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  )
}
