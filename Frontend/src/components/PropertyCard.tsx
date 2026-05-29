// src/components/PropertyCard.tsx
// Heart icon reads/writes from global FavoritesContext
// so favorites persist across all pages (LandingPage, PropertiesPage, PropertyDetailPage)

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MapPinIcon, BedDoubleIcon, BathIcon, HeartIcon, EyeIcon, ShieldCheckIcon, ClockIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from '../utils/toast'
import { useFavorites } from '../contexts/FavoritesContext'
import { BACKEND_URL } from '../config/api'

export interface PropertyCardProps {
  id: string
  image: string
  title: string
  location: string
  rent: number
  bedrooms: number
  bathrooms: number
  ownerName?: string
  ownerEmail?: string
  views?: number
  isPremium?: boolean
}

export function PropertyCard({
  id, image, title, location, rent,
  bedrooms, bathrooms, ownerName, ownerEmail, views = 0, isPremium = false
}: PropertyCardProps) {
  const { isFavorite, toggleFavorite } = useFavorites()
  const saved = isFavorite(id)
  const [isOwnerVerified, setIsOwnerVerified] = useState(false)
  const [bookingStatus, setBookingStatus] = useState<'available' | 'pending' | 'confirmed'>('available')

  // Check if property is booked from backend API
  useEffect(() => {
    let isMounted = true
    
    const checkBookingStatus = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/bookings?propertyId=${id}`)
        if (response.ok && isMounted) {
          const data = await response.json()
          if (data.success && data.bookings && Array.isArray(data.bookings)) {
            // Filter out sample/dummy bookings
            const realBookings = data.bookings.filter((b: any) => 
              !b.receiptId?.startsWith('BK-SAMPLE') && 
              !b.receiptId?.startsWith('BK-REJ-') &&
              !b.receiptId?.startsWith('BK-DUMMY')
            )
            
            const activeBooking = realBookings.find((b: any) => 
              b.status === 'confirmed' || b.status === 'pending'
            )
            
            if (activeBooking) {
              const newStatus = activeBooking.status === 'pending' ? 'pending' : 'confirmed'
              setBookingStatus(newStatus)
            } else {
              setBookingStatus('available')
            }
          }
        }
      } catch (error) {
        // If API fails, fall back to available
        if (isMounted) {
          setBookingStatus('available')
        }
      }
    }
    
    checkBookingStatus()
    
    return () => {
      isMounted = false
    }
  }, [id])

  // Listen for booking changes - only for this specific property
  useEffect(() => {
    let isMounted = true
    
    const handleBookingChange = async (event?: Event) => {
      // Only update if this is a custom event with propertyId matching this card
      if (event && 'detail' in event) {
        const customEvent = event as CustomEvent
        if (customEvent.detail?.propertyId && customEvent.detail.propertyId !== id) {
          return // Not for this property, ignore
        }
      }
      
      try {
        const response = await fetch(`${BACKEND_URL}/api/bookings?propertyId=${id}`)
        if (response.ok && isMounted) {
          const data = await response.json()
          if (data.success && data.bookings && Array.isArray(data.bookings)) {
            // Filter out sample/dummy bookings
            const realBookings = data.bookings.filter((b: any) => 
              !b.receiptId?.startsWith('BK-SAMPLE') && 
              !b.receiptId?.startsWith('BK-REJ-') &&
              !b.receiptId?.startsWith('BK-DUMMY')
            )
            
            const activeBooking = realBookings.find((b: any) => 
              b.status === 'confirmed' || b.status === 'pending'
            )
            
            if (activeBooking) {
              const newStatus = activeBooking.status === 'pending' ? 'pending' : 'confirmed'
              setBookingStatus(newStatus)
            } else {
              setBookingStatus('available')
            }
          }
        }
      } catch {}
    }
    
    window.addEventListener('bookingAdded', handleBookingChange)
    window.addEventListener('bookingUpdated', handleBookingChange)
    
    return () => {
      isMounted = false
      window.removeEventListener('bookingAdded', handleBookingChange)
      window.removeEventListener('bookingUpdated', handleBookingChange)
    }
  }, [id])

  // Check if owner is verified
  useEffect(() => {
    if (ownerEmail) {
      try {
        const savedProfile = localStorage.getItem(`fm_owner_profile_${ownerEmail}`)
        if (savedProfile) {
          const parsed = JSON.parse(savedProfile)
          setIsOwnerVerified(parsed.isVerified || false)
        }
      } catch {}
    }
    
    // Also check flatmate_user for verification status
    try {
      const userStr = localStorage.getItem('flatmate_user')
      if (userStr) {
        const user = JSON.parse(userStr)
        if (user.email === ownerEmail && user.isVerified) {
          setIsOwnerVerified(true)
        }
      }
    } catch {}
  }, [ownerEmail])

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    toggleFavorite({ id, image, title, location, rent, bedrooms, bathrooms, ownerName, views, isPremium })
    if (saved) {
      toast.removed('Removed from favorites')
    } else {
      toast.success('Saved to favorites!')
    }
  }

  return (
    <Link to={`/property/${id}`} className="block h-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        whileHover={{ y: -8 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 h-full flex flex-col group border border-gray-100"
      >
        {/* Image */}
        <div className="relative h-48 overflow-hidden">
          <motion.img
            src={image} alt={title}
            className="w-full h-full object-cover"
            whileHover={{ scale: 1.08 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          />
          {/* Badges */}
          <div className="absolute top-3 left-3 flex gap-2">
            {bookingStatus === 'pending' ? (
              <span className="bg-yellow-500/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-bold text-white shadow-sm flex items-center gap-1">
                <ClockIcon className="w-3 h-3" />
                Pending
              </span>
            ) : bookingStatus === 'confirmed' ? (
              <span className="bg-gray-500/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-bold text-white shadow-sm">Booked</span>
            ) : (
              <span className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-bold text-primary shadow-sm">For Rent</span>
            )}
            {isPremium && <span className="bg-yellow-400 px-2 py-1 rounded-md text-xs font-bold text-white shadow-sm">Premium</span>}
          </div>
          {/* Heart button — connected to global context */}
          <motion.button
            onClick={handleToggle}
            whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
            className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-sm hover:bg-white transition-colors z-10"
          >
            <HeartIcon className={`w-4 h-4 transition-all duration-200 ${saved ? 'fill-red-500 text-red-500 scale-110' : 'text-gray-400 hover:text-red-400'}`} />
          </motion.button>
          {/* Price */}
          <div className="absolute bottom-3 left-3 bg-primary/90 backdrop-blur-sm text-white px-3 py-1 rounded-lg shadow-sm">
            <span className="font-bold">रू {rent.toLocaleString()}</span>
            <span className="text-xs opacity-90">/month</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-1">
          <h3 className="font-bold text-gray-900 line-clamp-1 group-hover:text-primary transition-colors mb-2">{title}</h3>
          <div className="flex items-center text-gray-500 text-sm mb-4">
            <MapPinIcon className="w-4 h-4 mr-1 flex-shrink-0" />
            <span className="truncate">{location}</span>
          </div>
          <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
            <div className="flex items-center gap-1.5"><BedDoubleIcon className="w-4 h-4 text-primary" /><span>{bedrooms} Beds</span></div>
            <div className="flex items-center gap-1.5"><BathIcon className="w-4 h-4 text-primary" /><span>{bathrooms} Baths</span></div>
          </div>
          <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-600">
                {ownerName ? ownerName.charAt(0).toUpperCase() : 'O'}
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-medium text-gray-900">{ownerName || 'Owner'}</span>
                  {isOwnerVerified && (
                    <div className="group relative">
                      <ShieldCheckIcon className="w-3.5 h-3.5 text-blue-600 fill-blue-600" />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-900 text-white text-[10px] rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        Verified Owner
                      </div>
                    </div>
                  )}
                </div>
                {views > 0 && <span className="text-[10px] text-gray-500 flex items-center gap-1"><EyeIcon className="w-3 h-3" /> {views} views</span>}
              </div>
            </div>
            <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-full">View Details</span>
          </div>
        </div>
      </motion.div>
    </Link>
  )
}
