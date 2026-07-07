'use client'

import { SessionProvider } from 'next-auth/react'
import { Toaster } from 'react-hot-toast'
import { SettingsProvider } from '@/context/SettingsContext'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SettingsProvider>
        {children}
        <Toaster position="top-right" />
      </SettingsProvider>
    </SessionProvider>
  )
}
