import type { AppData } from './types'

const STORAGE_KEY = 'greatclicks-linkedin-crm-v1'

export function loadData(fallback: AppData): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return fallback
    const parsed = JSON.parse(raw) as AppData
    if (!Array.isArray(parsed.prospects)) return fallback
    return parsed
  } catch {
    return fallback
  }
}

export function saveData(data: AppData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function clearSavedData() {
  localStorage.removeItem(STORAGE_KEY)
}
