import { useState, useCallback } from 'react'

export interface NotificationSettings {
  payment_reminder: boolean
  payment_overdue: boolean
  maintenance_update: boolean
  lease_expiring: boolean
  lease_expired: boolean
  system: boolean
}

const STORAGE_KEY = 'edara-notification-settings'

const defaultSettings: NotificationSettings = {
  payment_reminder: true,
  payment_overdue: true,
  maintenance_update: true,
  lease_expiring: true,
  lease_expired: true,
  system: true,
}

function loadSettings(): NotificationSettings {
  if (typeof window === 'undefined') return defaultSettings
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return { ...defaultSettings, ...JSON.parse(stored) }
  } catch {}
  return defaultSettings
}

export function useNotificationSettings() {
  const [settings, setSettings] = useState<NotificationSettings>(loadSettings)

  const toggleSetting = useCallback((key: keyof NotificationSettings) => {
    setSettings((prev) => {
      const updated = { ...prev, [key]: !prev[key] }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      return updated
    })
  }, [])

  const isEnabled = useCallback(
    (type: string) => settings[type as keyof NotificationSettings] ?? true,
    [settings]
  )

  return { settings, toggleSetting, isEnabled }
}
