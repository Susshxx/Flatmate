// src/utils/cleanupStorage.ts
// Utility to clean up stale property references from localStorage

import { BACKEND_URL } from '../config/api'

/**
 * Clean up stale property references from localStorage
 * This helps prevent "Property not found" errors from deleted properties
 */
export async function cleanupStalePropertyReferences(): Promise<void> {
  try {
    // Get all valid property IDs from backend
    const response = await fetch(`${BACKEND_URL}/api/properties`)
    if (!response.ok) return // Skip cleanup if backend is unavailable
    
    const data = await response.json()
    const validPropertyIds = new Set(
      (data.properties || []).map((p: any) => p.id || p._id)
    )
    
    // Clean up favorites
    const favoritesKey = 'fm_favorites'
    try {
      const favorites = JSON.parse(localStorage.getItem(favoritesKey) || '[]')
      const validFavorites = favorites.filter((id: string) => validPropertyIds.has(id))
      if (validFavorites.length !== favorites.length) {
        localStorage.setItem(favoritesKey, JSON.stringify(validFavorites))
        console.log('Cleaned up stale favorites:', favorites.length - validFavorites.length, 'removed')
      }
    } catch {}
    
    // Clean up unlocked premium properties
    const unlockedKey = 'unlocked_premium_properties'
    try {
      const unlocked = JSON.parse(localStorage.getItem(unlockedKey) || '[]')
      const validUnlocked = unlocked.filter((id: string) => validPropertyIds.has(id))
      if (validUnlocked.length !== unlocked.length) {
        localStorage.setItem(unlockedKey, JSON.stringify(validUnlocked))
        console.log('Cleaned up stale unlocked properties:', unlocked.length - validUnlocked.length, 'removed')
      }
    } catch {}
    
    // Clean up admin read notifications
    const adminReadKey = 'fm_admin_read_notifs'
    try {
      const adminRead = JSON.parse(localStorage.getItem(adminReadKey) || '[]')
      const validAdminRead = adminRead.filter((id: string) => validPropertyIds.has(id))
      if (validAdminRead.length !== adminRead.length) {
        localStorage.setItem(adminReadKey, JSON.stringify(validAdminRead))
        console.log('Cleaned up stale admin notifications:', adminRead.length - validAdminRead.length, 'removed')
      }
    } catch {}
    
    // Clean up all properties cache (if it exists)
    const allPropsKey = 'fm_all_properties'
    try {
      const allProps = JSON.parse(localStorage.getItem(allPropsKey) || '[]')
      const validProps = allProps.filter((p: any) => validPropertyIds.has(p.id || p._id))
      if (validProps.length !== allProps.length) {
        localStorage.setItem(allPropsKey, JSON.stringify(validProps))
        console.log('Cleaned up stale cached properties:', allProps.length - validProps.length, 'removed')
      }
    } catch {}
    
  } catch (error) {
    // Silently fail - cleanup is not critical
    console.warn('Property cleanup failed:', error)
  }
}

/**
 * Run cleanup on app startup (call this in main pages)
 */
export function initializeStorageCleanup(): void {
  // Run cleanup after a short delay to not block initial render
  setTimeout(() => {
    cleanupStalePropertyReferences()
  }, 2000)
}