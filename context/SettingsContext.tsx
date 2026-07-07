'use client'

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { emptySettings } from '@/lib/utils'
import type { Settings } from '@/types'

interface SettingsContextValue {
  settings: Settings
  loading: boolean
  refetch: () => Promise<void>
}

const SettingsContext = createContext<SettingsContextValue>({
  settings: emptySettings as Settings,
  loading: true,
  refetch: async () => {},
})

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { status } = useSession()
  const [settings, setSettings] = useState<Settings>(emptySettings as Settings)
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    if (status !== 'authenticated') {
      setSettings(emptySettings as Settings)
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/settings')
      if (!res.ok) throw new Error('Failed to load settings')
      const data = await res.json()
      setSettings(data)
    } catch {
      setSettings(emptySettings as Settings)
    } finally {
      setLoading(false)
    }
  }, [status])

  useEffect(() => {
    refetch()
  }, [refetch])

  return (
    <SettingsContext.Provider value={{ settings, loading, refetch }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  return useContext(SettingsContext)
}
