/**
 * PROPERTY API - Frontend utility for property management
 * 
 * PURPOSE:
 * - Provides CRUD operations for property listings
 * - Handles all property-related HTTP requests to backend
 * - Includes pagination and performance optimizations
 * - Used by OwnerDashboard, AdminDashboard, and property pages
 * 
 * KEY FUNCTIONS:
 * 
 * 1. getProperties(filters?, page?, limit?)
 *    - Fetches properties with optional filtering and pagination
 *    - Called by: PropertiesPage, OwnerDashboard, AdminDashboard
 *    - Backend: GET /api/properties?ownerName=X&status=Y&page=1&limit=50
 *    - Filters: ownerName, status, type, location
 *    - Returns: Array of Property objects with pagination info
 * 
 * 2. getPropertyById(id)
 *    - Fetches a single property by ID
 *    - Returns: Property object or null
 * 
 * 3. createProperty(propertyData)
 *    - Creates a new property listing
 *    - Status: Initially set to 'pending' for admin approval
 *    - Returns: Created property object with _id
 * 
 * 4. updateProperty(id, updates)
 *    - Updates existing property details or status
 *    - Returns: Updated property object
 * 
 * 5. deleteProperty(id)
 *    - Permanently removes a property listing
 *    - Returns: Success status
 * 
 * PERFORMANCE NOTES:
 * - Backend now uses .lean() for read operations (faster)
 * - Pagination prevents loading thousands of properties
 * - Database indexes optimize queries
 * - Proper error handling and logging
 */

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

export interface PaginationInfo {
  page: number
  limit: number
  total: number
  pages: number
}

export interface PaginatedResponse {
  properties: Property[]
  pagination: PaginationInfo
}

const API_BASE = `${BACKEND_URL}/api/properties`

// Get all properties or filter by query params with pagination
export async function getProperties(
  filters?: {
    ownerName?: string
    ownerId?: string
    status?: string
    type?: string
    location?: string
  },
  page: number = 1,
  limit: number = 50
): Promise<Property[]> {
  try {
    const params = new URLSearchParams()
    
    // Add filter params
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value)
      })
    }
    
    // Add pagination params
    params.append('page', page.toString())
    params.append('limit', limit.toString())
    
    const url = `${API_BASE}?${params}`
    console.log('📡 Fetching properties from:', url)
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      console.error('❌ Failed to fetch properties:', response.statusText)
      return []
    }

    const data = await response.json()
    console.log('✅ Fetched properties:', data.properties?.length || 0)
    return data.properties || []
  } catch (error) {
    console.error('❌ Error fetching properties:', error)
    return []
  }
}

// Get a single property by ID
export async function getPropertyById(id: string): Promise<Property | null> {
  try {
    if (!id) {
      console.warn('⚠️ Property ID is empty')
      return null
    }

    console.log('📡 Fetching property:', id)
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      console.error(`❌ Failed to fetch property ${id}:`, response.statusText)
      return null
    }

    const data = await response.json()
    const property = data.property || data
    console.log('✅ Property fetched successfully:', property?.title || property?.id)
    return property
  } catch (error) {
    console.error(`❌ Error fetching property ${id}:`, error)
    return null
  }
}

// Create a new property
export async function createProperty(propertyData: Omit<Property, 'id' | '_id'>): Promise<Property | null> {
  try {
    console.log('📤 Creating property:', propertyData.title)
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(propertyData),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('❌ Failed to create property:', errorData)
      return null
    }

    const data = await response.json()
    const property = data.property || data
    console.log('✅ Property created:', property?.id)
    return property
  } catch (error) {
    console.error('❌ Error creating property:', error)
    return null
  }
}

// Update an existing property
export async function updateProperty(id: string, propertyData: Partial<Property>): Promise<Property | null> {
  try {
    console.log('📝 Updating property:', id)
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(propertyData),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('❌ Failed to update property:', errorData)
      return null
    }

    const data = await response.json()
    const property = data.property || data
    console.log('✅ Property updated:', property?.title)
    return property
  } catch (error) {
    console.error('❌ Error updating property:', error)
    return null
  }
}

// Delete a property
export async function deleteProperty(id: string): Promise<boolean> {
  try {
    console.log('🗑️ Deleting property:', id)
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      console.error('❌ Failed to delete property:', response.statusText)
      return false
    }

    console.log('✅ Property deleted')
    return true
  } catch (error) {
    console.error('❌ Error deleting property:', error)
    return false
  }
}

// Approve a property (admin only)
export async function approveProperty(id: string): Promise<Property | null> {
  try {
    console.log('✅ Approving property:', id)
    const response = await fetch(`${API_BASE}/${id}/approve`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      console.error('❌ Failed to approve property:', response.statusText)
      return null
    }

    const data = await response.json()
    console.log('✅ Property approved successfully')
    return data.property || data
  } catch (error) {
    console.error('❌ Error approving property:', error)
    return null
  }
}

// Reject a property (admin only)
export async function rejectProperty(id: string, reason?: string): Promise<Property | null> {
  try {
    console.log('❌ Rejecting property:', id)
    const response = await fetch(`${API_BASE}/${id}/reject`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason }),
    })

    if (!response.ok) {
      console.error('❌ Failed to reject property:', response.statusText)
      return null
    }

    const data = await response.json()
    console.log('✅ Property rejected successfully')
    return data.property || data
  } catch (error) {
    console.error('❌ Error rejecting property:', error)
    return null
  }
}
