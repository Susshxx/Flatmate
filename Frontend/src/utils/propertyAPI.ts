/**
 * PROPERTY API - Frontend utility for property management
 * 
 * PURPOSE:
 * - Provides CRUD operations for property listings
 * - Handles all property-related HTTP requests to backend
 * - Used by OwnerDashboard, AdminDashboard, and property pages
 * 
 * KEY FUNCTIONS:
 * 
 * 1. getProperties(filters?)
 *    - Fetches properties with optional filtering
 *    - Called by: PropertiesPage, OwnerDashboard, AdminDashboard
 *    - Backend: GET /api/properties?ownerName=X&status=Y&category=Z
 *    - Filters: ownerName, status (pending/approved/rejected), category
 *    - Returns: Array of Property objects
 * 
 * 2. createProperty(propertyData)
 *    - Creates a new property listing
 *    - Called by: PostPropertyPage, OwnerDashboard (Add Property)
 *    - Backend: POST /api/properties
 *    - Status: Initially set to 'pending' for admin approval
 *    - Returns: Created property object with _id
 * 
 * 3. updateProperty(id, updates)
 *    - Updates existing property details or status
 *    - Called by: OwnerDashboard (Edit), AdminDashboard (Approve/Reject)
 *    - Backend: PUT /api/properties/:id
 *    - Can update: title, price, status, images, etc.
 *    - Returns: Updated property object
 * 
 * 4. deleteProperty(id)
 *    - Permanently removes a property listing
 *    - Called by: OwnerDashboard, AdminDashboard
 *    - Backend: DELETE /api/properties/:id
 *    - Returns: Success status
 * 
 * PROPERTY LIFECYCLE:
 * 1. Owner creates property → status: 'pending'
 * 2. Admin reviews → status: 'approved' or 'rejected'
 * 3. Approved properties appear on PropertiesPage
 * 4. Owner can edit anytime → status resets to 'pending'
 * 5. Owner/Admin can delete property
 * 
 * DATA STRUCTURE:
 * - Property interface defines all fields
 * - Images stored as base64 strings or URLs
 * - Location includes latitude/longitude for maps
 * - Premium flag for featured listings
 * 
 * BACKEND INTEGRATION:
 * - Connects to backend/routes/properties.js
 * - Uses MongoDB Property model
 * - Auto-refresh in dashboards (5-second polling)
 */

// src/utils/propertyAPI.ts
// Property API functions for interacting with the backend

import { BACKEND_URL } from '../config/api'

export interface Property {
  id?: string
  _id?: string
  title: string
  location: string
  latitude?: number | null
  longitude?: number | null
  rent: number
  beds: number
  baths: number
  type: string
  area: string
  furnishing: string
  parking: string
  wifi?: boolean
  image: string
  images: string[]
  description: string
  amenities?: string[]
  ownerName: string
  ownerId: string
  isPremium?: boolean
  status?: 'pending' | 'approved' | 'rejected'
  createdAt?: string
  updatedAt?: string
}

const API_BASE = `${BACKEND_URL}/api/properties`

// Get all properties or filter by query params
export async function getProperties(filters?: {
  ownerName?: string
  ownerId?: string
  status?: string
  type?: string
  location?: string
}): Promise<Property[]> {
  try {
    const params = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value)
      })
    }
    
    const url = params.toString() ? `${API_BASE}?${params}` : API_BASE
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      console.error('Failed to fetch properties:', response.statusText)
      return []
    }

    const data = await response.json()
    return data.properties || data || []
  } catch (error) {
    console.error('Error fetching properties:', error)
    return []
  }
}

// Get a single property by ID
export async function getPropertyById(id: string): Promise<Property | null> {
  try {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      console.error('Failed to fetch property:', response.statusText)
      return null
    }

    const data = await response.json()
    return data.property || data || null
  } catch (error) {
    console.error('Error fetching property:', error)
    return null
  }
}

// Create a new property
export async function createProperty(propertyData: Omit<Property, 'id' | '_id'>): Promise<Property | null> {
  try {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(propertyData),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Failed to create property:', errorData)
      return null
    }

    const data = await response.json()
    return data.property || data || null
  } catch (error) {
    console.error('Error creating property:', error)
    return null
  }
}

// Update an existing property
export async function updateProperty(id: string, propertyData: Partial<Property>): Promise<Property | null> {
  try {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(propertyData),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Failed to update property:', errorData)
      return null
    }

    const data = await response.json()
    return data.property || data || null
  } catch (error) {
    console.error('Error updating property:', error)
    return null
  }
}

// Delete a property
export async function deleteProperty(id: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      console.error('Failed to delete property:', response.statusText)
      return false
    }

    return true
  } catch (error) {
    console.error('Error deleting property:', error)
    return false
  }
}

// Approve a property (admin only)
export async function approveProperty(id: string): Promise<Property | null> {
  try {
    const response = await fetch(`${API_BASE}/${id}/approve`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      console.error('Failed to approve property:', response.statusText)
      return null
    }

    const data = await response.json()
    return data.property || data || null
  } catch (error) {
    console.error('Error approving property:', error)
    return null
  }
}

// Reject a property (admin only)
export async function rejectProperty(id: string, reason?: string): Promise<Property | null> {
  try {
    const response = await fetch(`${API_BASE}/${id}/reject`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason }),
    })

    if (!response.ok) {
      console.error('Failed to reject property:', response.statusText)
      return null
    }

    const data = await response.json()
    return data.property || data || null
  } catch (error) {
    console.error('Error rejecting property:', error)
    return null
  }
}
