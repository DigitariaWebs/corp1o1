"use client"

import { SignUp } from '@clerk/nextjs'
import { signUpAppearance } from '@/lib/clerk-theme'

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Rejoignez{' '}
            <span className="bg-gradient-to-r from-revolutionary-cyan to-revolutionary-blue bg-clip-text text-transparent">
              Corp1o1
            </span>
          </h1>
          <p className="text-slate-400">
            Commencez votre révolution des compétences
          </p>
        </div>
        
        <SignUp 
          appearance={signUpAppearance}
          routing="path"
          path="/sign-up"
          redirectUrl="/onboarding"
        />
      </div>
    </div>
  )
}