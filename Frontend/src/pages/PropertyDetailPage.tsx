// src/pages/PropertyDetailPage.tsx
import React, { useState, useEffect, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import {
  MapPinIcon, BedDoubleIcon, BathIcon, UtensilsIcon, HomeIcon,
  PhoneIcon, MailIcon, EyeIcon, MessageCircleIcon, ChevronLeftIcon,
  ChevronRightIcon, XIcon, SendIcon, StarIcon, CheckCircleIcon,
  CalendarIcon, CreditCardIcon, DownloadIcon, AlertCircleIcon,
  BuildingIcon, MapIcon, HeartIcon, ShieldCheckIcon, ArrowLeftIcon,
  SparklesIcon,
} from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { PropertyCard } from '../components/PropertyCard'
import { toast } from '../utils/toast'
import { useFavorites } from '../contexts/FavoritesContext'
import { BACKEND_URL } from '../config/api'

// ─── localStorage helpers (DEPRECATED for bookings - use API instead) ────────
const ls    = (k: string, fb = '[]') => { try { return JSON.parse(localStorage.getItem(k) || fb) } catch { return JSON.parse(fb) } }
const setLS = (k: string, v: any)   => { try { localStorage.setItem(k, JSON.stringify(v)) } catch {} }

// ─── Shared image arrays ──────────────────────────────────────────────────────
const IMGS = [
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=1200&auto=format&fit=crop',
]

const TITLE_BY_TYPE: Record<string, string[]> = {
  Apartment: ['Modern Apartment', 'Bright Apartment', 'Spacious Apartment', 'Premium Apartment'],
  Studio:    ['Cozy Studio', 'Compact Studio', 'Modern Studio', 'Bright Studio'],
  House:     ['Family House', 'Spacious House', 'Garden House', 'Quiet House'],
  Flat:      ['2BHK Flat', '3BHK Flat', 'Furnished Flat', 'Modern Flat'],
  Room:      ['Budget Room', 'Furnished Room', 'Single Room', 'Double Room'],
}

const OWNERS       = ['Ram Thapa', 'Sita Sharma', 'Hari Krishna', 'Gita Rai', 'Bikash Shrestha', 'Anita Gurung']
const OWNER_PHONES = ['+977 9841111111', '+977 9852222222', '+977 9863333333', '+977 9874444444', '+977 9885555555', '+977 9896666666']
const OWNER_EMAILS = ['ram@flatmate.com.np', 'sita@flatmate.com.np', 'hari@flatmate.com.np', 'gita@flatmate.com.np', 'bikash@flatmate.com.np', 'anita@flatmate.com.np']
const LOCS         = ['Kathmandu', 'Lalitpur', 'Bhaktapur', 'Pokhara', 'Chitwan', 'Dharan']
const TYPES        = ['Apartment', 'Studio', 'House', 'Flat', 'Room']
const BEDS         = [1, 2, 3, 4]
const RENTS        = [8000, 10000, 12000, 15000, 18000, 20000, 25000, 28000, 32000, 35000, 40000, 45000, 55000, 65000]
const FURNISHING   = ['Fully Furnished', 'Semi Furnished', 'Unfurnished']
const PARKING_OPT  = ['Available', 'Not Available']
const ROAD_TYPES   = ['Black Topped', 'Graveled', 'Dirt Road']

const CITY_COORDS: Record<string, [number, number]> = {
  Kathmandu: [27.7172, 85.3240],
  Lalitpur:  [27.6644, 85.3188],
  Bhaktapur: [27.6710, 85.4298],
  Pokhara:   [28.2096, 83.9856],
  Chitwan:   [27.5291, 84.3542],
  Dharan:    [26.8120, 87.2836],
}

// ─── Premium property definitions ────────────────────────────────────────────
const PREMIUM_PROPERTIES = [
  {
    id: 'premium-1',
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&auto=format&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&auto=format&fit=crop',
    ],
    title: 'Luxury 3BHK Penthouse',
    location: 'Lazimpat, Kathmandu',
    type: 'Apartment',
    rent: 65000,
    bedrooms: 3,
    bathrooms: 2,
    ownerName: 'Suresh Maharjan',
    ownerPhone: '+977 9841234567',
    ownerEmail: 'suresh@flatmate.com.np',
    views: 450,
    isPremium: true,
    createdAt: 0,
    area: '2,500 sq.ft',
    furnishing: 'Fully Furnished',
    parking: 'Available',
    roadType: 'Black Topped',
    province: 'Bagmati',
    district: 'Kathmandu',
    neighborhood: 'Lazimpat',
    chowk: 'Lazimpat Chowk',
    lat: 27.7172,
    lng: 85.3240,
    description: 'This stunning penthouse apartment features panoramic city views, modern amenities, and premium finishes throughout. Located in the heart of Lazimpat, it offers easy access to embassies, restaurants, and shopping centers. The property includes a private rooftop terrace, 24/7 security, and dedicated parking.',
  },
  {
    id: 'premium-2',
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&auto=format&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&auto=format&fit=crop',
    ],
    title: 'Executive 4BHK Villa',
    location: 'Jhamsikhel, Lalitpur',
    type: 'House',
    rent: 85000,
    bedrooms: 4,
    bathrooms: 3,
    ownerName: 'Rajesh Pradhan',
    ownerPhone: '+977 9852345678',
    ownerEmail: 'rajesh@flatmate.com.np',
    views: 380,
    isPremium: true,
    createdAt: 1,
    area: '3,200 sq.ft',
    furnishing: 'Fully Furnished',
    parking: 'Available',
    roadType: 'Black Topped',
    province: 'Bagmati',
    district: 'Lalitpur',
    neighborhood: 'Jhamsikhel',
    chowk: 'Jhamsikhel Chowk',
    lat: 27.6644,
    lng: 85.3188,
    description: 'Spacious executive villa in the heart of Jhamsikhel with modern architecture and premium amenities. Features include a private garden, home office, and entertainment area. Perfect for families seeking luxury living.',
  },
  {
    id: 'premium-3',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&auto=format&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&auto=format&fit=crop',
    ],
    title: 'Premium 2BHK Apartment',
    location: 'Thamel, Kathmandu',
    type: 'Apartment',
    rent: 55000,
    bedrooms: 2,
    bathrooms: 2,
    ownerName: 'Anita Shrestha',
    ownerPhone: '+977 9863456789',
    ownerEmail: 'anita@flatmate.com.np',
    views: 320,
    isPremium: true,
    createdAt: 2,
    area: '1,800 sq.ft',
    furnishing: 'Fully Furnished',
    parking: 'Available',
    roadType: 'Black Topped',
    province: 'Bagmati',
    district: 'Kathmandu',
    neighborhood: 'Thamel',
    chowk: 'Thamel Chowk',
    lat: 27.7150,
    lng: 85.3120,
    description: 'Modern apartment in the vibrant Thamel area with contemporary design and all amenities. Close to restaurants, cafes, and entertainment. Ideal for professionals and expats.',
  },
  {
    id: 'premium-4',
    image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&auto=format&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&auto=format&fit=crop',
    ],
    title: 'Deluxe 3BHK Flat',
    location: 'Kupondole, Lalitpur',
    type: 'Flat',
    rent: 70000,
    bedrooms: 3,
    bathrooms: 2,
    ownerName: 'Prakash Tamang',
    ownerPhone: '+977 9874567890',
    ownerEmail: 'prakash@flatmate.com.np',
    views: 290,
    isPremium: true,
    createdAt: 3,
    area: '2,200 sq.ft',
    furnishing: 'Fully Furnished',
    parking: 'Available',
    roadType: 'Black Topped',
    province: 'Bagmati',
    district: 'Lalitpur',
    neighborhood: 'Kupondole',
    chowk: 'Kupondole Chowk',
    lat: 27.6800,
    lng: 85.3150,
    description: 'Elegant flat in peaceful Kupondole with premium fixtures and fittings. Features spacious rooms, balcony with city views, and modern kitchen. Perfect for families.',
  },
]

// ─── Generated regular properties ────────────────────────────────────────────
const GENERATED_PROPERTIES = (() => {
  const combos = LOCS.flatMap(loc =>
    TYPES.flatMap(type => BEDS.map(bed => ({ loc, type, bed })))
  )
  return combos.map(({ loc, type, bed }, idx) => {
    const titles   = TITLE_BY_TYPE[type]
    const ownerIdx = idx % OWNERS.length
    const coords   = CITY_COORDS[loc] || [27.7172, 85.3240]
    const latOffset = ((idx % 20) - 10) * 0.002
    const lngOffset = ((idx % 17) - 8) * 0.002
    return {
      id:           `prop-${idx + 1}`,
      image:        IMGS[idx % 6],
      images:       [IMGS[idx % 6], IMGS[(idx + 1) % 6], IMGS[(idx + 2) % 6], IMGS[(idx + 3) % 6]],
      title:        `${titles[idx % titles.length]} in ${loc}`,
      location:     loc,
      type,
      rent:         RENTS[idx % RENTS.length],
      bedrooms:     bed,
      bathrooms:    (idx % 2) + 1,
      ownerName:    OWNERS[ownerIdx],
      ownerPhone:   OWNER_PHONES[ownerIdx],
      ownerEmail:   OWNER_EMAILS[ownerIdx],
      views:        80 + idx * 7,
      isPremium:    idx % 8 === 0,
      createdAt:    idx,
      area:         `${300 + bed * 200} sq.ft`,
      furnishing:   FURNISHING[idx % 3],
      parking:      PARKING_OPT[idx % 2],
      roadType:     ROAD_TYPES[idx % 3],
      province:     idx % 2 === 0 ? 'Bagmati' : 'Koshi',
      district:     loc,
      neighborhood: loc,
      chowk:        `${loc} Chowk`,
      lat:          coords[0] + latOffset,
      lng:          coords[1] + lngOffset,
      description:  `This ${type.toLowerCase()} in ${loc} offers ${bed} bedroom${bed > 1 ? 's' : ''} of comfortable living space. ${FURNISHING[idx % 3]} with ${PARKING_OPT[idx % 2] === 'Available' ? 'dedicated parking available' : 'easy street parking nearby'}. Located in a prime area of ${loc} with easy access to schools, hospitals and markets.`,
    }
  })
})()

const ALL_PROPERTIES = [...GENERATED_PROPERTIES, ...PREMIUM_PROPERTIES]

// ─── Leaflet map ──────────────────────────────────────────────────────────────
function PropertyMap({ lat, lng, title, address }: { lat: number; lng: number; title: string; address: string }) {
  const ref  = useRef<HTMLDivElement>(null)
  const init = useRef(false)

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  useEffect(() => {
    if (init.current) return
    init.current = true
    const load = () => {
      if ((window as any).L) { initMap(); return }
      const link = document.createElement('link')
      link.rel = 'stylesheet'; link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css'
      document.head.appendChild(link)
      const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js'
      s.onload = () => setTimeout(initMap, 100); document.body.appendChild(s)
    }

    const initMap = () => {
      const L = (window as any).L
      if (!ref.current || ref.current.querySelector('.leaflet-pane')) return

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const userLat = position.coords.latitude
            const userLng = position.coords.longitude
            const distance = calculateDistance(userLat, userLng, lat, lng)
            const distanceText = distance < 1
              ? `${Math.round(distance * 1000)}m away`
              : `${distance.toFixed(1)}km away`
            const centerLat = (userLat + lat) / 2
            const centerLng = (userLng + lng) / 2
            const map = L.map(ref.current, { zoomControl: true, scrollWheelZoom: false }).setView([centerLat, centerLng], 13)
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap', maxZoom: 19 }).addTo(map)
            const propertyIcon = L.divIcon({
              html: `<div style="width:38px;height:38px;background:linear-gradient(135deg,#1a4731,#2d6a4f);border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 4px 12px rgba(0,0,0,0.3)"><div style="transform:rotate(45deg);display:flex;align-items:center;justify-content:center;height:100%;font-size:15px">🏠</div></div>`,
              className: '', iconSize: [38, 38], iconAnchor: [19, 38], popupAnchor: [0, -42],
            })
            L.marker([lat, lng], { icon: propertyIcon })
              .bindPopup(`<div style="font-family:sans-serif;padding:4px"><strong style="color:#1a4731;font-size:13px">${title}</strong><br/><span style="color:#6b7280;font-size:11px">${address}</span><br/><span style="color:#2d6a4f;font-size:12px;font-weight:700">📍 Property Location</span><br/><a href="https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}" target="_blank" style="color:#2d6a4f;font-size:11px;font-weight:700">Get Directions →</a></div>`, { maxWidth: 230 })
              .addTo(map)
            const userIcon = L.divIcon({
              html: `<div style="width:32px;height:32px;background:linear-gradient(135deg,#1e40af,#3b82f6);border-radius:50%;border:3px solid white;box-shadow:0 4px 12px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:14px">📍</div>`,
              className: '', iconSize: [32, 32], iconAnchor: [16, 16], popupAnchor: [0, -20],
            })
            L.marker([userLat, userLng], { icon: userIcon })
              .bindPopup(`<div style="font-family:sans-serif;padding:4px"><strong style="color:#1e40af;font-size:13px">Your Location</strong><br/><span style="color:#6b7280;font-size:11px">Current position</span></div>`, { maxWidth: 200 })
              .addTo(map)
            L.polyline([[userLat, userLng], [lat, lng]], {
              color: '#2d6a4f', weight: 3, opacity: 0.7, dashArray: '10, 10'
            }).addTo(map)
            const midLat = (userLat + lat) / 2
            const midLng = (userLng + lng) / 2
            const distanceIcon = L.divIcon({
              html: `<div style="background:white;padding:4px 8px;border-radius:12px;border:2px solid #2d6a4f;font-size:11px;font-weight:700;color:#1a4731;box-shadow:0 2px 8px rgba(0,0,0,0.2);white-space:nowrap">${distanceText}</div>`,
              className: '', iconSize: [0, 0], iconAnchor: [0, 0]
            })
            L.marker([midLat, midLng], { icon: distanceIcon }).addTo(map)
            map.fitBounds([[userLat, userLng], [lat, lng]], { padding: [50, 50] })
          },
          () => {
            const map = L.map(ref.current, { zoomControl: true, scrollWheelZoom: false }).setView([lat, lng], 16)
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap', maxZoom: 19 }).addTo(map)
            const icon = L.divIcon({
              html: `<div style="width:38px;height:38px;background:linear-gradient(135deg,#1a4731,#2d6a4f);border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 4px 12px rgba(0,0,0,0.3)"><div style="transform:rotate(45deg);display:flex;align-items:center;justify-content:center;height:100%;font-size:15px">🏠</div></div>`,
              className: '', iconSize: [38, 38], iconAnchor: [19, 38], popupAnchor: [0, -42],
            })
            L.marker([lat, lng], { icon })
              .bindPopup(`<div style="font-family:sans-serif;padding:4px"><strong style="color:#1a4731;font-size:13px">${title}</strong><br/><span style="color:#6b7280;font-size:11px">${address}</span><br/><a href="https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}" target="_blank" style="color:#2d6a4f;font-size:11px;font-weight:700">Get Directions →</a></div>`, { maxWidth: 230 })
              .addTo(map).openPopup()
          }
        )
      } else {
        const map = L.map(ref.current, { zoomControl: true, scrollWheelZoom: false }).setView([lat, lng], 16)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap', maxZoom: 19 }).addTo(map)
        const icon = L.divIcon({
          html: `<div style="width:38px;height:38px;background:linear-gradient(135deg,#1a4731,#2d6a4f);border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 4px 12px rgba(0,0,0,0.3)"><div style="transform:rotate(45deg);display:flex;align-items:center;justify-content:center;height:100%;font-size:15px">🏠</div></div>`,
          className: '', iconSize: [38, 38], iconAnchor: [19, 38], popupAnchor: [0, -42],
        })
        L.marker([lat, lng], { icon })
          .bindPopup(`<div style="font-family:sans-serif;padding:4px"><strong style="color:#1a4731;font-size:13px">${title}</strong><br/><span style="color:#6b7280;font-size:11px">${address}</span><br/><a href="https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}" target="_blank" style="color:#2d6a4f;font-size:11px;font-weight:700">Get Directions →</a></div>`, { maxWidth: 230 })
          .addTo(map).openPopup()
      }
    }
    load()
  }, [lat, lng])

  return <div ref={ref} className="w-full h-full" style={{ background: '#e8ede9', zIndex: 0, position: 'relative' }} />
}

// ─── Review Section ───────────────────────────────────────────────────────────
const BANNED_WORDS = ['stupid', 'idiot', 'scam', 'fraud', 'cheat', 'fake', 'liar', 'worst', 'terrible', 'awful', 'horrible', 'disgusting', 'hate', 'kill', 'abuse', 'racist', 'loser', 'dumb', 'useless', 'garbage', 'trash', 'pathetic', 'moron', 'crap', 'shit', 'damn', 'hell', 'ass', 'bastard', 'bitch', 'fuck', 'bloody']
const hasBannedWords = (text: string) => BANNED_WORDS.some(w => new RegExp(`\\b${w}\\b`, 'i').test(text))

function ReviewSection({ propertyId, propertyTitle }: { propertyId: string; propertyTitle: string }) {
  const [reviews, setReviews]         = useState<any[]>([])
  const [name, setName]               = useState('')
  const [email, setEmail]             = useState('')
  const [newComment, setNewComment]   = useState('')
  const [newRating, setNewRating]     = useState(5)
  const [loading, setLoading]         = useState(false)
  const [editingId, setEditingId]     = useState<string | null>(null)
  const [editComment, setEditComment] = useState('')
  const [editRating, setEditRating]   = useState(5)

  // ── FIX: was `/api/reviews?...` (relative, hits frontend on Render)
  useEffect(() => {
    fetch(`${BACKEND_URL}/api/reviews?propertyId=${propertyId}`)
      .then(r => r.json())
      .then((data: any) => {
        if (Array.isArray(data)) setReviews(data.filter((r: any) => r.propertyId === propertyId))
        else if (data.success && Array.isArray(data.reviews)) setReviews(data.reviews)
      })
      .catch(() => {})
  }, [propertyId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedComment = newComment.trim(), trimmedName = name.trim()
    if (!trimmedComment || !trimmedName || !email.trim()) { toast.error('Please fill in your name, email and review.'); return }
    if (hasBannedWords(trimmedComment) || hasBannedWords(trimmedName)) { toast.error('Your review contains inappropriate language.'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast.error('Please enter a valid email address.'); return }
    setLoading(true)
    try {
      const res = await fetch(`${BACKEND_URL}/api/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmedName, email: email.trim(), comment: trimmedComment, rating: newRating, propertyId, propertyTitle }),
      })
      const data = await res.json()
      if (res.status === 422) { toast.error(data.message || 'Review contains inappropriate language.'); return }
      if (!res.ok) { toast.error(data.message || 'Failed to submit review.'); return }
      setReviews(prev => [{
        ...(data.review || {}),
        _id: data.review?._id || Date.now().toString(),
        name: trimmedName,
        email: email.trim(),
        comment: trimmedComment,
        rating: newRating,
        date: 'Just now',
        propertyId,
        isOwn: true,
      }, ...prev])
      toast.success('Review published!')
      setName(''); setEmail(''); setNewComment(''); setNewRating(5)
    } catch {
      setReviews(prev => [{
        _id: Date.now().toString(),
        name: trimmedName,
        email: email.trim(),
        comment: trimmedComment,
        rating: newRating,
        date: 'Just now',
        propertyId,
        isOwn: true,
      }, ...prev])
      toast.success('Review added!')
      setName(''); setEmail(''); setNewComment(''); setNewRating(5)
    } finally { setLoading(false) }
  }

  // ── FIX: was `/api/reviews/${id}` (relative, hits frontend on Render)
  const handleDelete = async (id: string) => {
    try {
      await fetch(`${BACKEND_URL}/api/reviews/${id}`, { method: 'DELETE' }).catch(() => {})
    } finally {
      setReviews(prev => prev.filter(r => r._id !== id))
      toast.error('Review deleted.')
    }
  }

  // ── FIX: was `/api/reviews/${id}` (relative, hits frontend on Render)
  const handleEditSave = async (id: string) => {
    const trimmed = editComment.trim()
    if (!trimmed) return
    if (hasBannedWords(trimmed)) { toast.error('Please keep it respectful.'); return }
    try {
      await fetch(`${BACKEND_URL}/api/reviews/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: trimmed, rating: editRating }),
      }).catch(() => {})
    } finally {
      setReviews(prev => prev.map(r => r._id === id ? { ...r, comment: trimmed, rating: editRating, date: 'Edited' } : r))
      setEditingId(null)
      toast.success('Review updated!')
    }
  }

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null

  return (
    <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-black text-primary">
          Reviews <span className="text-gray-400 font-normal text-sm">({reviews.length})</span>
        </h2>
        {avgRating && (
          <div className="flex items-center gap-1 bg-yellow-50 border border-yellow-100 px-3 py-1 rounded-full">
            <StarIcon className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
            <span className="text-xs font-bold text-yellow-700">{avgRating} avg</span>
          </div>
        )}
      </div>

      {/* Write a review form */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm mb-5">
        <h3 className="font-bold text-gray-900 text-sm mb-4">Write a Review</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-500 font-medium mr-1">Rating:</span>
            {[1, 2, 3, 4, 5].map(star => (
              <button key={star} type="button" onClick={() => setNewRating(star)}>
                <StarIcon className={`w-6 h-6 transition-colors ${star <= newRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200 hover:text-yellow-300'}`} />
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Your Name *</label>
              <input
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ram Thapa"
                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-button-primary transition-all"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Email Address *</label>
              <input
                required
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-button-primary transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Your Review *</label>
            <textarea
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              placeholder="Share your honest experience..."
              rows={3}
              required
              className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-button-primary resize-none transition-all"
            />
          </div>
          <motion.button
            type="submit"
            disabled={loading || !newComment.trim() || !name.trim() || !email.trim()}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 px-5 py-2.5 bg-button-primary text-white text-sm font-bold rounded-full shadow-md hover:bg-button-primary/90 disabled:opacity-50 transition-all"
          >
            <SendIcon className="w-3.5 h-3.5" />
            {loading ? 'Submitting...' : 'Submit Review'}
          </motion.button>
        </form>
      </div>

      {/* Reviews list */}
      {reviews.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
          <StarIcon className="w-10 h-10 text-gray-200 mx-auto mb-2" />
          <p className="text-gray-400 text-sm">No reviews yet. Be the first to leave a review!</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {reviews.map(r => (
              <motion.div
                key={r._id || r.date}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-button-primary/10 rounded-full flex items-center justify-center text-button-primary font-black text-sm flex-shrink-0">
                    {r.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-gray-900 text-sm">{r.name}</p>
                        {r.isOwn && (
                          <span className="text-[10px] bg-button-primary/10 text-button-primary px-2 py-0.5 rounded-full font-semibold">You</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs text-gray-400">{r.date || 'Just now'}</span>
                        {r.isOwn && editingId !== r._id && (
                          <div className="flex gap-1">
                            <button
                              onClick={() => { setEditingId(r._id); setEditComment(r.comment); setEditRating(r.rating) }}
                              className="text-xs text-button-primary font-semibold px-2 py-0.5 rounded-lg hover:bg-button-primary/10 transition-colors"
                            >Edit</button>
                            <button
                              onClick={() => handleDelete(r._id)}
                              className="text-xs text-red-500 font-semibold px-2 py-0.5 rounded-lg hover:bg-red-50 transition-colors"
                            >Delete</button>
                          </div>
                        )}
                      </div>
                    </div>
                    {editingId === r._id ? (
                      <div className="mt-2 space-y-2">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map(s => (
                            <button key={s} type="button" onClick={() => setEditRating(s)}>
                              <StarIcon className={`w-5 h-5 ${s <= editRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
                            </button>
                          ))}
                        </div>
                        <textarea
                          value={editComment}
                          onChange={e => setEditComment(e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 border-2 border-button-primary/30 rounded-xl text-sm focus:outline-none focus:border-button-primary resize-none transition-all"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditSave(r._id)}
                            className="px-4 py-1.5 bg-button-primary text-white text-xs font-bold rounded-full hover:bg-button-primary/90 transition-all"
                          >Save Changes</button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-4 py-1.5 border border-gray-200 text-gray-600 text-xs font-semibold rounded-full hover:border-gray-300 transition-all"
                          >Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex gap-0.5 mb-2">
                          {[1, 2, 3, 4, 5].map(s => (
                            <StarIcon key={s} className={`w-3.5 h-3.5 ${s <= r.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
                          ))}
                        </div>
                        <p className="text-gray-600 text-sm leading-relaxed">{r.comment}</p>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.section>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
type BookingStep = 'form' | 'payment-type' | 'payment' | 'success'
type PaymentType = 'advance' | 'full' | 'cash'

export function PropertyDetailPage() {
  const { id }   = useParams()
  const navigate = useNavigate()

  const [property,    setProperty]    = useState<any>(null)
  const [loading,     setLoading]     = useState(true)
  const [recommended, setRecommended] = useState<any[]>([])

  const [activeImg,   setActiveImg]   = useState(0)
  const [showGallery, setShowGallery] = useState(false)

  const { isFavorite, toggleFavorite } = useFavorites()
  const saved     = property ? isFavorite(property.id) : false
  const [showPhone, setShowPhone]     = useState(false)

  const [recIdx, setRecIdx]           = useState(0)
  const recPerPage = 3
  const displayedRec = recommended.slice(recIdx * recPerPage, (recIdx + 1) * recPerPage)

  const [bookingOpen,    setBookingOpen]    = useState(false)
  const [bookingStep,    setBookingStep]    = useState<BookingStep>('form')
  const [paymentType,    setPaymentType]    = useState<PaymentType>('full')
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [receiptId,      setReceiptId]      = useState('')
  const [orderTime,      setOrderTime]      = useState('')
  const [bookingData,    setBookingData]    = useState({ fullName: '', phone: '', email: '', moveInDate: '', confirmedWithOwner: '' })
  const [selectedDate,   setSelectedDate]   = useState<Date | null>(null)
  const [isBooked,       setIsBooked]       = useState(false)
  const [existingBooking, setExistingBooking] = useState<any>(null)
  const [bookingLoading, setBookingLoading] = useState(false)

  const advanceAmount = property ? Math.round(property.rent * 0.3) : 0
  const fullAmount    = property ? property.rent : 0
  const payAmount     = paymentType === 'advance' ? advanceAmount : paymentType === 'full' ? fullAmount : 0

  // Fetch booking status from backend API instead of localStorage
  useEffect(() => {
    if (!property) return
    
    const checkBookingStatus = async () => {
      setBookingLoading(true)
      try {
        const response = await fetch(`${BACKEND_URL}/api/bookings?propertyId=${property.id}&status=confirmed`)
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.bookings && data.bookings.length > 0) {
            setIsBooked(true)
            setExistingBooking(data.bookings[0])
          } else {
            // Also check for pending bookings
            const pendingResponse = await fetch(`${BACKEND_URL}/api/bookings?propertyId=${property.id}&status=pending`)
            if (pendingResponse.ok) {
              const pendingData = await pendingResponse.json()
              if (pendingData.success && pendingData.bookings && pendingData.bookings.length > 0) {
                setIsBooked(true) // Property is locked if there's a pending booking
                setExistingBooking(pendingData.bookings[0])
              } else {
                setIsBooked(false)
                setExistingBooking(null)
              }
            }
          }
        }
      } catch (error) {
        console.error('Error checking booking status:', error)
        setIsBooked(false)
        setExistingBooking(null)
      } finally {
        setBookingLoading(false)
      }
    }

    checkBookingStatus()
  }, [property])

  // Listen for booking updates
  useEffect(() => {
    const handleBookingUpdate = () => {
      if (!property) return
      // Re-fetch booking status when bookings are updated
      const checkBookingStatus = async () => {
        try {
          const response = await fetch(`${BACKEND_URL}/api/bookings?propertyId=${property.id}&status=confirmed`)
          if (response.ok) {
            const data = await response.json()
            if (data.success && data.bookings && data.bookings.length > 0) {
              setIsBooked(true)
              setExistingBooking(data.bookings[0])
            } else {
              const pendingResponse = await fetch(`${BACKEND_URL}/api/bookings?propertyId=${property.id}&status=pending`)
              if (pendingResponse.ok) {
                const pendingData = await pendingResponse.json()
                if (pendingData.success && pendingData.bookings && pendingData.bookings.length > 0) {
                  setIsBooked(true)
                  setExistingBooking(pendingData.bookings[0])
                } else {
                  setIsBooked(false)
                  setExistingBooking(null)
                }
              }
            }
          }
        } catch (error) {
          console.error('Error checking booking status:', error)
        }
      }
      checkBookingStatus()
    }
    
    window.addEventListener('bookingAdded', handleBookingUpdate)
    window.addEventListener('bookingUpdated', handleBookingUpdate)
    return () => {
      window.removeEventListener('bookingAdded', handleBookingUpdate)
      window.removeEventListener('bookingUpdated', handleBookingUpdate)
    }
  }, [property])

  // ── Load property ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) { navigate('/properties'); return }

    const load = async () => {
      setLoading(true)

      // 1. Try backend first
      try {
        const res = await fetch(`${BACKEND_URL}/api/properties/${id}`, {
          signal: AbortSignal.timeout(4000),
        })
        if (res.ok) {
          const data = await res.json()
          const p = data.property || data
          if (p && (p._id || p.id)) {
            const normalized = {
              ...p,
              id:           p._id || p.id,
              bedrooms:     p.beds || p.bedrooms || 1,
              bathrooms:    p.baths || p.bathrooms || 1,
              lat:          p.latitude || p.lat || 27.7172,
              lng:          p.longitude || p.lng || 85.3240,
              roadType:     p.roadType || 'Black Topped',
              province:     p.province || 'Bagmati',
              district:     p.district || p.location,
              neighborhood: p.neighborhood || p.location,
              chowk:        p.chowk || `${p.location} Chowk`,
              images:       p.images?.length ? p.images : [p.image || IMGS[0]],
              image:        p.image || p.images?.[0] || IMGS[0],
              description:  p.description || `Beautiful ${p.type} in ${p.location}`,
              area:         p.area || '500 sq.ft',
              furnishing:   p.furnishing || 'Unfurnished',
              parking:      p.parking || 'Not Available',
              ownerName:    p.ownerName || 'Property Owner',
              ownerEmail:   p.ownerEmail || '',
              ownerPhone:   p.ownerPhone || '',
              ownerId:      p.ownerId || '',
            }
            setProperty(normalized)
            console.log('Property loaded successfully:', normalized.id, normalized.title)

            // Recommended from backend
            try {
              const allRes = await fetch(`${BACKEND_URL}/api/properties`)
              if (allRes.ok) {
                const allData = await allRes.json()
                const recs = (allData.properties || [])
                  .filter((x: any) => (x.id || x._id) !== id)
                  .slice(0, 8)
                  .map((x: any) => ({
                    ...x,
                    id: x._id || x.id,
                    bedrooms: x.beds || x.bedrooms || 1,
                    bathrooms: x.baths || x.bathrooms || 1,
                  }))
                setRecommended(recs)
              }
            } catch { /* ignore */ }

            setLoading(false)
            return
          }
        }
      } catch { /* backend unavailable — fall through to local data */ }

      // 2. Fallback to ALL_PROPERTIES (generated + premium)
      const found = ALL_PROPERTIES.find(p => p.id === id)
      if (found) {
        setProperty(found)
        const recs = ALL_PROPERTIES
          .filter(p => p.id !== id && (p.location === found.location || p.type === found.type))
          .slice(0, 9)
        setRecommended(recs)
        setLoading(false)
      } else {
        console.error('Property not found with id:', id)
        toast.error('Property not found')
        setLoading(false)
        navigate('/properties')
      }
    }

    load().catch(error => {
      console.error('Error loading property:', error)
      setLoading(false)
      toast.error('Failed to load property')
    })
  }, [id, navigate])

  // ── Booking handlers ───────────────────────────────────────────────────────
  const openBooking = async () => {
    // Check if property is already booked via API
    try {
      const response = await fetch(`${BACKEND_URL}/api/bookings?propertyId=${property.id}`)
      if (response.ok) {
        const data = await response.json()
        const hasActiveBooking = data.bookings?.some((b: any) => 
          b.status === 'confirmed' || b.status === 'pending'
        )
        if (hasActiveBooking) {
          toast.error('This property already has a pending booking. Please wait for landlord confirmation.')
          return
        }
      }
    } catch (error) {
      console.error('Error checking bookings:', error)
    }

    const currentUser = JSON.parse(localStorage.getItem('flatmate_user') || '{}')
    setBookingOpen(true)
    setBookingStep('form')
    setBookingData({
      fullName: currentUser.name || '',
      phone: '',
      email: currentUser.email || '',
      moveInDate: '',
      confirmedWithOwner: '',
    })
    setSelectedDate(null)
    setReceiptId('')
    setPaymentType('full')
  }

  const saveBookingToBackend = async (bookingPayload: any) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingPayload),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        if (data.hasExistingBooking) {
          toast.error(data.message || 'Property already has a pending booking')
          return null
        }
        throw new Error(data.message || 'Failed to create booking')
      }
      
      return data.booking
    } catch (error: any) {
      console.error('Error saving booking:', error)
      toast.error(error.message || 'Failed to save booking')
      return null
    }
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!bookingData.fullName || !bookingData.phone || !bookingData.email || !selectedDate) {
      toast.error('Please fill all fields including move-in date')
      return
    }
    setBookingData({ ...bookingData, moveInDate: selectedDate.toISOString().split('T')[0] })
    setBookingStep('payment-type')
  }

  const handlePaymentTypeNext = () => {
    if (paymentType === 'cash') handleSaveBookingCash()
    else setBookingStep('payment')
  }

  const handleSaveBookingCash = async () => {
    setPaymentLoading(true)
    try {
      const rid = `BK-${Date.now().toString(36).toUpperCase()}`
      const now = new Date().toLocaleString('en-US', {
        hour: '2-digit', minute: '2-digit', hour12: true,
        day: '2-digit', month: 'long', year: 'numeric',
      })
      setReceiptId(rid)
      setOrderTime(now)
      
      const currentUser = JSON.parse(localStorage.getItem('flatmate_user') || '{}')
      
      const bookingPayload = {
        propertyId: property.id,
        propertyTitle: property.title,
        propertyLocation: property.location,
        ownerName: property.ownerName,
        ownerId: property.ownerId || '',
        ownerEmail: property.ownerEmail || '',
        ownerPhone: property.ownerPhone || '',
        tenantName: bookingData.fullName,
        tenantId: currentUser.id || '',
        tenantEmail: bookingData.email,
        tenantPhone: bookingData.phone,
        checkInDate: bookingData.moveInDate,
        checkOutDate: new Date(new Date(bookingData.moveInDate).setMonth(new Date(bookingData.moveInDate).getMonth() + 1)).toISOString().split('T')[0],
        rent: property.rent,
        amount: 0, // Cash payment - amount to be paid on arrival
        paymentMethod: 'Cash',
        paymentType: 'full',
        receiptId: rid,
        moveInDate: bookingData.moveInDate,
        specialRequests: bookingData.confirmedWithOwner || '',
      }
      
      const savedBooking = await saveBookingToBackend(bookingPayload)
      
      if (savedBooking) {
        setBookingStep('success')
        window.dispatchEvent(new Event('bookingAdded'))
        toast.success('Booking request submitted! Waiting for landlord confirmation.', {
          style: { background: '#2F7D5F', color: 'white' },
        })
      } else {
        setBookingStep('form')
      }
    } catch (error) {
      console.error('Error saving cash booking:', error)
      toast.error('Failed to save booking')
      setBookingStep('form')
    } finally {
      setPaymentLoading(false)
    }
  }

  const handleKhaltiPay = async () => {
    setPaymentLoading(true)
    try {
      const res = await fetch(`${BACKEND_URL}/api/payment/khalti/dummy-pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount:        payAmount,
          planName:      `${paymentType === 'advance' ? 'Advance (30%)' : 'Full Month'} - ${property.title}`,
          customerName:  bookingData.fullName,
          customerEmail: bookingData.email,
          customerPhone: bookingData.phone,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setReceiptId(data.receiptId)
        setOrderTime(data.orderTime)
        
        const currentUser = JSON.parse(localStorage.getItem('flatmate_user') || '{}')
        
        const bookingPayload = {
          propertyId: property.id,
          propertyTitle: property.title,
          propertyLocation: property.location,
          ownerName: property.ownerName,
          ownerId: property.ownerId || '',
          ownerEmail: property.ownerEmail || '',
          ownerPhone: property.ownerPhone || '',
          tenantName: bookingData.fullName,
          tenantId: currentUser.id || '',
          tenantEmail: bookingData.email,
          tenantPhone: bookingData.phone,
          checkInDate: bookingData.moveInDate,
          checkOutDate: new Date(new Date(bookingData.moveInDate).setMonth(new Date(bookingData.moveInDate).getMonth() + 1)).toISOString().split('T')[0],
          rent: property.rent,
          amount: payAmount,
          paymentMethod: 'Khalti',
          paymentType: paymentType,
          transactionId: data.transactionId || '',
          receiptId: data.receiptId,
          moveInDate: bookingData.moveInDate,
          specialRequests: bookingData.confirmedWithOwner || '',
        }
        
        const savedBooking = await saveBookingToBackend(bookingPayload)
        
        if (savedBooking) {
          setBookingStep('success')
          window.dispatchEvent(new Event('bookingAdded'))
          toast.success('Payment confirmed! Booking request submitted.', {
            style: { background: '#2F7D5F', color: 'white' },
          })
        } else {
          setBookingStep('form')
        }
      } else {
        toast.error(data.error || 'Payment failed')
      }
    } catch (error) {
      console.error('Payment error:', error)
      toast.error('Network error — is the backend running?')
    } finally {
      setPaymentLoading(false)
    }
  }

  const downloadReceipt = () => {
    if (!property) return
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Flat-Mate Receipt</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',sans-serif;background:#f5f5f5;display:flex;justify-content:center;padding:40px 20px}.card{background:#fff;border-radius:16px;max-width:500px;width:100%;padding:32px;box-shadow:0 4px 24px rgba(0,0,0,.1)}.logo-container{text-align:center;margin-bottom:24px;padding-bottom:20px;border-bottom:2px solid #e5e7eb}.logo{display:inline-flex;align-items:center;gap:8px;background:linear-gradient(135deg,#2d6a4f,#1b4332);padding:12px 20px;border-radius:12px;box-shadow:0 4px 12px rgba(45,106,79,0.2)}.logo-icon{width:32px;height:32px;background:#fff;border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:18px;color:#2d6a4f}.logo-text{font-size:20px;font-weight:800;color:#fff;letter-spacing:-0.5px}h1{font-size:20px;font-weight:800;color:#111;margin-bottom:20px;padding-bottom:16px;border-bottom:2px dashed #e5e7eb}.row{display:flex;justify-content:space-between;padding:5px 0;font-size:12px;border-bottom:1px dashed #f0f0f0}.row .label{color:#6b7280}.row .value{font-weight:600;color:#111}.badge{background:#22c55e;color:#fff;font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px}.total{display:flex;justify-content:space-between;padding:12px 0 0;font-size:14px;font-weight:800;border-top:2px solid #e5e7eb;margin-top:8px}.footer{text-align:center;font-size:10px;color:#9ca3af;margin-top:20px;padding-top:14px;border-top:1px solid #f0f0f0}@media print{body{background:#fff;padding:0}.card{box-shadow:none}}</style></head><body><div class="card"><div class="logo-container"><div class="logo"><div class="logo-icon">F</div><div class="logo-text">Flat-Mate</div></div></div><h1>Booking Receipt</h1><div class="row"><span class="label">Receipt ID</span><span class="value">${receiptId}</span></div><div class="row"><span class="label">Order Time</span><span class="value">${orderTime}</span></div><div class="row"><span class="label">Status</span><span class="value"><span class="badge">${paymentType === 'cash' ? 'Pending' : 'Confirmed'}</span></span></div><div class="row"><span class="label">Property</span><span class="value">${property.title}</span></div><div class="row"><span class="label">Tenant</span><span class="value">${bookingData.fullName}</span></div><div class="row"><span class="label">Move-in</span><span class="value">${bookingData.moveInDate}</span></div><div class="total"><span>Monthly Rent</span><span style="color:#2d6a4f">NPR ${property.rent.toLocaleString()}</span></div><div class="footer">Thank you for booking with Flat-Mate!</div></div></body></html>`
    const win = window.open('', '_blank', 'width=640,height=800')
    if (!win) { toast.error('Pop-up blocked'); return }
    win.document.write(html); win.document.close(); win.focus()
    setTimeout(() => win.print(), 500)
    toast('Receipt ready!', { style: { background: '#2F7D5F', color: 'white' } })
  }

  // ── Loading / not-found states ─────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-button-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading property details...</p>
        </div>
      </div>
    )
  }

  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <BuildingIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">Property not found</p>
          <button
            onClick={() => navigate('/properties')}
            className="mt-4 px-6 py-2.5 bg-button-primary text-white font-semibold rounded-xl"
          >Back to Properties</button>
        </div>
      </div>
    )
  }

  // Defensive check - ensure property has required fields
  if (!property.title || !property.location) {
    console.error('Property missing required fields:', property)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <BuildingIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">Property data incomplete</p>
          <button
            onClick={() => navigate('/properties')}
            className="mt-4 px-6 py-2.5 bg-button-primary text-white font-semibold rounded-xl"
          >Back to Properties</button>
        </div>
      </div>
    )
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-background-light text-primary pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28">

        {/* Breadcrumb + save */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <nav className="text-sm">
            <ol className="flex items-center gap-2 text-gray-500">
              <li><Link to="/" className="hover:text-primary transition-colors">Home</Link></li>
              <li><ChevronRightIcon className="w-3 h-3" /></li>
              <li><Link to="/properties" className="hover:text-primary transition-colors">Properties</Link></li>
              <li><ChevronRightIcon className="w-3 h-3" /></li>
              <li className="text-primary font-medium truncate max-w-[200px]">{property.title}</li>
            </ol>
          </nav>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => {
              toggleFavorite({
                id: property.id, image: property.image, title: property.title,
                location: property.location, rent: property.rent,
                bedrooms: property.bedrooms, bathrooms: property.bathrooms,
                ownerName: property.ownerName, views: property.views,
                isPremium: property.isPremium,
              })
              saved ? toast.removed('Removed from favorites') : toast.success('Saved to favorites!')
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border-2 transition-all ${
              saved
                ? 'bg-pink-500 border-pink-500 text-white'
                : 'bg-white border-pink-200 text-pink-600 hover:bg-pink-50 hover:border-pink-400'
            }`}
          >
            <HeartIcon className={`w-4 h-4 ${saved ? 'fill-white' : ''}`} />
            {saved ? 'Saved' : 'Save'}
          </motion.button>
        </div>

        {/* Title + price */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="px-2.5 py-1 bg-button-primary/10 text-button-primary text-xs font-bold rounded-full">Available</span>
              {property.isPremium && (
                <span className="px-2.5 py-1 bg-yellow-400 text-white text-xs font-bold rounded-full">Premium</span>
              )}
              <span className="text-gray-500 text-sm flex items-center gap-1">
                <MapPinIcon className="w-3.5 h-3.5" />
                {property.neighborhood}, {property.location}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-primary">{property.title}</h1>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:text-right"
          >
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-0.5">Monthly Rent</p>
            <p className="text-2xl font-black text-button-primary">रू {property.rent.toLocaleString()}</p>
          </motion.div>
        </div>

        {/* Image gallery */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-10"
        >
          <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[420px] rounded-2xl overflow-hidden">
            <button
              onClick={() => { setActiveImg(0); setShowGallery(true) }}
              className="col-span-2 row-span-2 relative group overflow-hidden"
            >
              <img
                src={property.images[0]}
                alt={property.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors duration-300" />
            </button>
            {property.images.slice(1, 4).map((img: string, i: number) => (
              <button
                key={i}
                onClick={() => { setActiveImg(i + 1); setShowGallery(true) }}
                className="relative group overflow-hidden col-span-1 row-span-1"
              >
                <img
                  src={img}
                  alt={`View ${i + 2}`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors duration-300" />
                {i === 2 && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="text-white font-bold text-sm bg-black/50 px-3 py-1.5 rounded-full">
                      +{property.images.length - 3} more
                    </span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Lightbox */}
        <AnimatePresence>
          {showGallery && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[99999] bg-black/95 flex items-center justify-center"
              onClick={() => setShowGallery(false)}
            >
              <button
                onClick={() => setShowGallery(false)}
                className="absolute top-4 right-4 w-10 h-10 bg-white/15 rounded-full flex items-center justify-center text-white hover:bg-white/25 z-10"
              >
                <XIcon className="w-5 h-5" />
              </button>
              <button
                onClick={e => { e.stopPropagation(); setActiveImg(Math.max(0, activeImg - 1)) }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/15 rounded-full flex items-center justify-center text-white hover:bg-white/25 z-10"
              >
                <ChevronLeftIcon className="w-5 h-5" />
              </button>
              <motion.img
                key={activeImg}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                src={property.images[activeImg]}
                alt=""
                className="max-h-[85vh] max-w-[85vw] rounded-xl object-contain"
                onClick={e => e.stopPropagation()}
              />
              <button
                onClick={e => { e.stopPropagation(); setActiveImg(Math.min(property.images.length - 1, activeImg + 1)) }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/15 rounded-full flex items-center justify-center text-white hover:bg-white/25 z-10"
              >
                <ChevronRightIcon className="w-5 h-5" />
              </button>
              <div className="absolute bottom-4 flex gap-2">
                {property.images.map((_: string, i: number) => (
                  <button
                    key={i}
                    onClick={e => { e.stopPropagation(); setActiveImg(i) }}
                    className={`w-2 h-2 rounded-full transition-all ${activeImg === i ? 'bg-white w-5' : 'bg-white/40'}`}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-10">

            {/* About */}
            <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <h2 className="text-lg font-black text-primary mb-3">About this property</h2>
              <p className="text-gray-600 leading-relaxed text-sm">{property.description}</p>
            </motion.section>

            {/* Property details grid */}
            <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              <h2 className="text-lg font-black text-primary mb-4">Property Details</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { label: 'Property ID', value: property.id.toUpperCase().slice(0, 12), icon: HomeIcon },
                  { label: 'Type',        value: property.type,       icon: BuildingIcon },
                  { label: 'Area',        value: property.area,       icon: MapPinIcon },
                  { label: 'Layout',      value: `${property.bedrooms} BHK`, icon: BedDoubleIcon },
                  { label: 'Road Access', value: property.roadType,   icon: MapIcon },
                  { label: 'Parking',     value: property.parking,    icon: CheckCircleIcon },
                  { label: 'Furnishing',  value: property.furnishing, icon: HomeIcon },
                ].map(d => (
                  <div key={d.label} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-start gap-3">
                    <div className="p-1.5 bg-gray-50 rounded-lg">
                      <d.icon className="w-4 h-4 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-0.5">{d.label}</p>
                      <p className="font-semibold text-gray-900 text-sm">{d.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>

            {/* Amenities */}
            <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <h2 className="text-lg font-black text-primary mb-4">Amenities & Features</h2>
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
                {[
                  { icon: BedDoubleIcon, label: 'Bedrooms',  value: String(property.bedrooms) },
                  { icon: BathIcon,      label: 'Bathrooms', value: String(property.bathrooms) },
                  { icon: UtensilsIcon,  label: 'Kitchen',   value: '1' },
                  { icon: HomeIcon,      label: 'Type',      value: property.type },
                  { icon: MapPinIcon,    label: 'Area',      value: property.area },
                ].map(a => (
                  <div
                    key={a.label}
                    className="bg-white rounded-xl p-3 text-center border border-gray-100 shadow-sm hover:border-button-primary/30 transition-colors"
                  >
                    <div className="w-9 h-9 bg-button-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                      <a.icon className="w-5 h-5 text-button-primary" />
                    </div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">{a.label}</p>
                    <p className="font-bold text-gray-900 text-xs">{a.value}</p>
                  </div>
                ))}
              </div>
            </motion.section>

            {/* Map */}
            <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
              <h2 className="text-lg font-black text-primary mb-4">Location</h2>
              <div
                className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm"
                style={{ isolation: 'isolate' }}
              >
                <div className="h-64 relative" style={{ zIndex: 0 }}>
                  <PropertyMap
                    lat={property.lat}
                    lng={property.lng}
                    title={property.title}
                    address={`${property.chowk}, ${property.location}`}
                  />
                </div>
                <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { l: 'Province', v: property.province },
                    { l: 'District', v: property.district },
                    { l: 'City',     v: property.location },
                    { l: 'Chowk',   v: property.chowk },
                  ].map(r => (
                    <div key={r.l}>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider">{r.l}</p>
                      <p className="font-semibold text-gray-900 text-sm">{r.v}</p>
                    </div>
                  ))}
                </div>
                <div className="px-4 pb-4">
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${property.lat},${property.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-button-primary text-xs font-bold hover:underline"
                  >
                    <MapPinIcon className="w-3.5 h-3.5" />Open in Google Maps →
                  </a>
                </div>
              </div>
            </motion.section>

            <ReviewSection propertyId={property.id} propertyTitle={property.title} />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-5">
              <Card className="p-5 border-0 shadow-xl rounded-2xl bg-white">
                <div className="mb-4 pb-4 border-b border-gray-100">
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-0.5">Monthly Rent</p>
                  <p className="text-2xl font-black text-button-primary">रू {property.rent.toLocaleString()}</p>
                </div>
                <motion.button
                  whileHover={{ scale: isBooked ? 1 : 1.02 }}
                  whileTap={{ scale: isBooked ? 1 : 0.97 }}
                  onClick={openBooking}
                  disabled={isBooked || bookingLoading}
                  className={`w-full mb-3 py-3 font-bold rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2 ${
                    isBooked
                      ? 'bg-gray-400 text-white cursor-not-allowed opacity-75'
                      : bookingLoading
                      ? 'bg-gray-300 text-gray-600 cursor-wait'
                      : 'bg-button-primary text-white hover:bg-button-primary/90'
                  }`}
                >
                  {bookingLoading ? (
                    <>
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                      <span>Checking...</span>
                    </>
                  ) : isBooked ? (
                    existingBooking?.status === 'pending' ? (
                      <>
                        <ClockIcon className="w-4 h-4" />
                        <span>Pending Approval</span>
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="w-4 h-4" />
                        <span>Booked</span>
                      </>
                    )
                  ) : (
                    <>
                      <CalendarIcon className="w-4 h-4" />
                      <span>Book Now</span>
                    </>
                  )}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate(
                    `/dashboard/tenant?tab=messages&userName=${encodeURIComponent(property.ownerName)}&propertyTitle=${encodeURIComponent(property.title)}`
                  )}
                  className="w-full py-3 bg-white border-2 border-button-primary/30 hover:border-button-primary text-button-primary font-bold rounded-xl text-sm transition-all hover:bg-button-primary/5 flex items-center justify-center gap-2"
                >
                  <MessageCircleIcon className="w-4 h-4" /> Chat with Owner
                </motion.button>
                <p className="text-center text-xs text-gray-400 mt-3 flex items-center justify-center gap-1">
                  <ShieldCheckIcon className="w-3.5 h-3.5" /> Secured by Flat-Mate
                </p>
              </Card>

              <Card className="p-5 border border-gray-100 shadow-sm rounded-2xl bg-white">
                <h3 className="font-bold text-gray-900 text-sm mb-4">Listed By</h3>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-button-primary rounded-full flex items-center justify-center text-white font-black text-base">
                    {property.ownerName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm flex items-center gap-1">
                      {property.ownerName}
                      <CheckCircleIcon className="w-3.5 h-3.5 text-green-500" />
                    </p>
                    <p className="text-xs text-gray-500">Verified Owner</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl text-xs text-gray-700">
                    <PhoneIcon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <span>{showPhone ? property.ownerPhone : '••••• •••••'}</span>
                    <button
                      onClick={() => setShowPhone(v => !v)}
                      className="ml-auto text-button-primary font-semibold text-[10px]"
                    >{showPhone ? 'Hide' : 'Reveal'}</button>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl text-xs text-gray-700">
                    <MailIcon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <span className="truncate">{property.ownerEmail}</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>

        {/* Recommended */}
        <section className="mt-16 pt-12 border-t border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black text-primary">Similar Properties</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setRecIdx(Math.max(0, recIdx - 1))}
                disabled={recIdx === 0}
                className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              ><ChevronLeftIcon className="w-4 h-4 text-gray-600" /></button>
              <button
                onClick={() => setRecIdx(Math.min(Math.ceil(recommended.length / recPerPage) - 1, recIdx + 1))}
                disabled={recIdx >= Math.ceil(recommended.length / recPerPage) - 1}
                className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              ><ChevronRightIcon className="w-4 h-4 text-gray-600" /></button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <AnimatePresence mode="wait">
              {displayedRec.map((p, i) => (
                <motion.div
                  key={`${recIdx}-${p.id}`}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.3, delay: i * 0.08 }}
                >
                  <PropertyCard {...p} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </section>
      </div>

      {/* ── Booking modal ─────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {bookingOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={e => e.target === e.currentTarget && bookingStep !== 'success' && setBookingOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', stiffness: 320, damping: 30 }}
              className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              {/* Modal header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gray-50/50">
                <h2 className="text-base font-black text-primary">
                  {bookingStep === 'form'         && 'Book Property'}
                  {bookingStep === 'payment-type' && 'Choose Payment'}
                  {bookingStep === 'payment'      && 'Pay via Khalti'}
                  {bookingStep === 'success'      && 'Booking Confirmed!'}
                </h2>
                {bookingStep !== 'success' && (
                  <button
                    onClick={() => setBookingOpen(false)}
                    className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                  >
                    <XIcon className="w-4 h-4 text-gray-500" />
                  </button>
                )}
              </div>

              {/* Modal body */}
              <div className="p-6">
                <AnimatePresence mode="wait">

                  {/* Step 1 — Form */}
                  {bookingStep === 'form' && (
                    <motion.form
                      key="form"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      onSubmit={handleFormSubmit}
                      className="space-y-4"
                    >
                      {/* Property summary */}
                      <div className="bg-button-primary/5 border border-button-primary/15 rounded-xl p-4 flex gap-3 mb-2">
                        <img
                          src={property.images[0]}
                          className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                          alt=""
                        />
                        <div>
                          <p className="font-bold text-gray-900 text-sm leading-tight">{property.title}</p>
                          <p className="text-button-primary font-black text-sm">रू {property.rent.toLocaleString()}/mo</p>
                          <p className="text-xs text-gray-500">{property.ownerName}</p>
                        </div>
                      </div>

                      {/* Full Name */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Full Name</label>
                        <input
                          required
                          type="text"
                          placeholder="Your full name"
                          value={bookingData.fullName}
                          onChange={e => setBookingData({ ...bookingData, fullName: e.target.value })}
                          className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-button-primary transition-all"
                        />
                      </div>

                      {/* Phone */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Phone Number</label>
                        <input
                          required
                          type="tel"
                          placeholder="98XXXXXXXX (10 digits)"
                          value={bookingData.phone}
                          onChange={e => {
                            const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 10)
                            setBookingData({ ...bookingData, phone: digitsOnly })
                          }}
                          maxLength={10}
                          className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-button-primary transition-all"
                        />
                        <p className="text-gray-500 text-xs mt-1">{bookingData.phone.length}/10 digits</p>
                      </div>

                      {/* Email (read-only from account) */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email Address</label>
                        <input
                          required
                          type="email"
                          placeholder="you@example.com"
                          value={bookingData.email}
                          readOnly
                          className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none bg-gray-50 cursor-not-allowed"
                        />
                        <p className="text-gray-500 text-xs mt-1">Using your account email</p>
                      </div>

                      {/* Move-in date */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Expected Move-in</label>
                        <DatePicker
                          selected={selectedDate}
                          onChange={(date: Date | null) => {
                            setSelectedDate(date)
                            if (date) {
                              setBookingData({ ...bookingData, moveInDate: date.toISOString().split('T')[0] })
                            }
                          }}
                          minDate={new Date()}
                          dateFormat="MMMM d, yyyy"
                          placeholderText="Select move-in date"
                          className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-button-primary transition-all"
                          calendarClassName="green-calendar"
                          required
                        />
                      </div>

                      <motion.button
                        type="submit"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        className="w-full py-3 bg-button-primary text-white font-bold rounded-xl text-sm hover:bg-button-primary/90 transition-all"
                      >
                        Continue to Payment Options
                      </motion.button>
                    </motion.form>
                  )}

                  {/* Step 2 — Payment type */}
                  {bookingStep === 'payment-type' && (
                    <motion.div
                      key="ptype"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4"
                    >
                      {[
                        { id: 'advance', label: 'Advance Payment (30%)', desc: 'Pay 30% now, rest later',        amount: advanceAmount, tag: 'Most Popular', tagColor: 'bg-green-500' },
                        { id: 'full',    label: 'Full Month Rent',        desc: 'Pay the entire month upfront',   amount: fullAmount,    tag: 'Best Value',   tagColor: 'bg-blue-500' },
                        { id: 'cash',   label: 'Cash on Arrival',        desc: 'Pay in person when you move in', amount: 0,             tag: '',             tagColor: '' },
                      ].map(opt => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setPaymentType(opt.id as PaymentType)}
                          className={`w-full p-4 rounded-xl border-2 text-left transition-all relative ${
                            paymentType === opt.id
                              ? 'border-button-primary bg-button-primary/5'
                              : 'border-gray-200 hover:border-button-primary/40'
                          }`}
                        >
                          {opt.tag && (
                            <span className={`absolute -top-2.5 left-4 text-[10px] font-black text-white ${opt.tagColor} px-2 py-0.5 rounded-full`}>
                              {opt.tag}
                            </span>
                          )}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${paymentType === opt.id ? 'border-button-primary bg-button-primary' : 'border-gray-300'}`}>
                                {paymentType === opt.id && <div className="w-2 h-2 bg-white rounded-full" />}
                              </div>
                              <div>
                                <p className="font-bold text-gray-900 text-sm">{opt.label}</p>
                                <p className="text-xs text-gray-500">{opt.desc}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-black text-gray-900 text-sm">
                                {opt.amount > 0 ? `रू ${opt.amount.toLocaleString()}` : 'Free'}
                              </p>
                              {opt.id !== 'cash' && <p className="text-[10px] text-gray-400">via Khalti</p>}
                            </div>
                          </div>
                        </button>
                      ))}
                      <div className="flex gap-3 pt-2">
                        <button
                          onClick={() => setBookingStep('form')}
                          className="flex-1 py-3 border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-600"
                        >Back</button>
                        <motion.button
                          onClick={handlePaymentTypeNext}
                          disabled={paymentLoading}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.97 }}
                          className="flex-1 py-3 bg-button-primary text-white font-bold rounded-xl text-sm hover:bg-button-primary/90 disabled:opacity-60 transition-all"
                        >
                          {paymentType === 'cash' ? 'Confirm Cash Booking' : 'Pay with Khalti'}
                        </motion.button>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 3 — Khalti payment */}
                  {bookingStep === 'payment' && (
                    <motion.div
                      key="payment"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-5"
                    >
                      <div className="bg-gray-50 rounded-2xl p-5 space-y-2.5 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Property</span>
                          <span className="font-semibold truncate max-w-[180px]">{property.title}</span>
                        </div>
                        <div className="flex justify-between text-base font-black pt-2 border-t border-gray-200">
                          <span>Total</span>
                          <span className="text-button-primary">रू {payAmount.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="rounded-2xl border-2 border-purple-200 bg-purple-50 p-4 flex items-center gap-3">
                        <div className="w-11 h-11 bg-purple-600 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                          <span className="text-white font-black text-lg">K</span>
                        </div>
                        <div>
                          <p className="font-black text-gray-900 text-sm">Pay with Khalti</p>
                          <p className="text-xs text-purple-600 font-semibold">Nepal's trusted digital wallet</p>
                        </div>
                        <CheckCircleIcon className="w-5 h-5 text-purple-500 ml-auto" />
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setBookingStep('payment-type')}
                          className="flex-1 py-3 border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-600"
                        >Back</button>
                        <motion.button
                          onClick={handleKhaltiPay}
                          disabled={paymentLoading}
                          whileHover={{ scale: paymentLoading ? 1 : 1.02 }}
                          whileTap={{ scale: paymentLoading ? 1 : 0.97 }}
                          className="flex-1 py-3 bg-purple-600 text-white font-bold rounded-xl text-sm hover:bg-purple-700 disabled:opacity-60 transition-all flex items-center justify-center gap-2"
                        >
                          {paymentLoading ? (
                            <>
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                                className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                              />
                              Processing...
                            </>
                          ) : (
                            <><CreditCardIcon className="w-4 h-4" />Pay रू {payAmount.toLocaleString()}</>
                          )}
                        </motion.button>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 4 — Success */}
                  {bookingStep === 'success' && (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-center py-2"
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.15, type: 'spring', stiffness: 260 }}
                        className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
                      >
                        <CheckCircleIcon className="w-8 h-8 text-green-600" />
                      </motion.div>
                      <h3 className="text-lg font-black text-gray-900 mb-1">Booking Confirmed!</h3>
                      <p className="text-gray-500 text-sm mb-1">
                        Your booking for <span className="font-semibold">{property.title}</span> is confirmed.
                      </p>
                      <p className="text-xs text-gray-400 font-mono mb-6">Receipt: {receiptId}</p>
                      <div className="flex flex-col gap-3">
                        <motion.button
                          onClick={downloadReceipt}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.97 }}
                          className="w-full py-3 bg-button-primary text-white font-bold rounded-xl flex items-center justify-center gap-2 text-sm hover:bg-button-primary/90 transition-all"
                        >
                          <DownloadIcon className="w-4 h-4" /> Download Receipt
                        </motion.button>
                        <button
                          onClick={() => setBookingOpen(false)}
                          className="w-full py-3 border-2 border-gray-200 text-gray-600 font-semibold rounded-xl text-sm hover:border-gray-300 transition-all"
                        >Close</button>
                      </div>
                    </motion.div>
                  )}

                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}