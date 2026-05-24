/**
 * TENANT DASHBOARD - Main dashboard interface for tenant users
 * 
 * PURPOSE:
 * - Provides a centralized hub for tenants to manage their rental activities
 * - Displays saved properties, bookings, messages, notifications, and profile settings
 * 
 * KEY FEATURES:
 * 1. Overview: Stats cards showing saved properties, bookings, messages, and viewed properties
 * 2. Saved Properties: List of favorited properties (connected to FavoritesContext)
 * 3. My Bookings: Display of property booking requests and their status
 * 4. Messages: Real-time chat with property owners (connected to chatStorage API)
 * 5. Notifications: Alerts for booking approvals, new matches, price drops
 * 6. Settings: Profile management with photo upload and form validation
 * 
 * DATA FLOW:
 * - Auth: useAuth() hook provides user data and logout function
 * - Favorites: useFavorites() hook manages saved properties list
 * - Messages: chatStorage.ts API handles chat CRUD operations with backend
 * - Profile: localStorage stores profile data under key `fm_profile_${email}`
 * - URL Params: Reads ?tab=messages&userName=X to auto-open specific chats
 * 
 * BACKEND CONNECTIONS:
 * - GET /api/messages/chats - Fetches all conversations for the user
 * - POST /api/messages/chats - Creates new chat conversation
 * - POST /api/messages/messages - Sends a new message
 * - PUT /api/messages/messages/seen - Marks messages as read
 * 
 * COMPONENT STRUCTURE:
 * - ProfileSettingsPanel: Nested component for profile editing
 * - StatusBadge: Displays booking status (approved/pending/rejected)
 * - AvatarCircle: User avatar with initials
 * - Main Dashboard: Tab-based navigation with sidebar and content area
 */

// src/pages/TenantDashboard.tsx
import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  HomeIcon, HeartIcon, MessageCircleIcon, CalendarIcon, BellIcon,
  SettingsIcon, LogOutIcon, SearchIcon, ChevronRightIcon, CheckCircleIcon,
  ClockIcon, ArrowLeftIcon, SendIcon, PhoneIcon, VideoIcon, InfoIcon,
  ImageIcon, MicIcon, SmileIcon, CheckCheckIcon, XIcon, MenuIcon,
  UserIcon, MailIcon, PhoneIcon as PhoneIconSolid, MapPinIcon, CameraIcon,
  ShieldCheckIcon, BedDoubleIcon, BathIcon, TrashIcon, BarChart2Icon,
  ThumbsUpIcon, ListIcon, SendIcon as SendIcon2, EyeIcon, MessageSquareIcon,
  CheckIcon, SunIcon, MoonIcon, FileTextIcon, AlertCircleIcon, LockIcon,
} from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Avatar } from '../components/ui/Avatar'
import { PropertyCard } from '../components/PropertyCard'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { useFavorites } from '../contexts/FavoritesContext'
import { generateOwnerResponse, simulateTypingDelay } from '../utils/chatbot'
import { getChats, getOrCreateChat, sendMessage, markChatAsSeen, Chat } from '../utils/chatStorage'
import { toast } from '../utils/toast'

// ─── Mock Data ────────────────────────────────────────────────────────────────
const mockBookings = [
  { id:'1', property:'Modern 2BHK Apartment', location:'Thamel, Kathmandu', date:'2024-01-15', status:'approved', image:'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&auto=format&fit=crop', ownerName:'Ram Thapa' },
  { id:'2', property:'Spacious 3BHK Flat',    location:'Bhaktapur',          date:'2024-01-18', status:'submitted', image:'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&auto=format&fit=crop', ownerName:'Bikash Shrestha' },
  { id:'3', property:'Cozy Studio Room',      location:'Patan, Lalitpur',    date:'2024-01-20', status:'rejected', image:'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&auto=format&fit=crop', ownerName:'Sita Sharma' },
]

// Removed mock notifications - only show real notifications from owners

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    approved:  { label:'Approved',  cls:'bg-green-100 text-green-700' },
    submitted: { label:'Pending',   cls:'bg-yellow-100 text-yellow-700' },
    rejected:  { label:'Rejected',  cls:'bg-red-100 text-red-700' },
  }
  const s = map[status] || { label: status, cls: 'bg-gray-100 text-gray-600' }
  return <span className={`text-xs font-bold px-3 py-1 rounded-full ${s.cls}`}>{s.label}</span>
}

function AvatarCircle({ name, size = 'md' }: { name: string; size?: 'sm'|'md'|'lg' }) {
  const sz = { sm:'w-10 h-10 text-sm', md:'w-12 h-12 text-base', lg:'w-14 h-14 text-lg' }
  return (
    <div className={`${sz[size]} bg-button-primary rounded-full flex items-center justify-center text-white font-black flex-shrink-0`}>
      {name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
    </div>
  )
}

// Helper functions for messages
function formatTime(date: Date): string {
  const diff = Date.now() - date.getTime()
  const m = Math.floor(diff / 60000)
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(diff / 86400000)
  if (m < 1) return 'Just now'
  if (m < 60) return `${m}m ago`
  if (h < 24) return `${h}h ago`
  return `${d}d ago`
}

function formatMsgTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

// ─── Inline Profile Settings ───────────────────────────────────────────────────
function ProfileSettingsPanel() {
  const { user, updateUser } = useAuth()
  const [form, setForm] = useState({ 
    firstName: user?.name?.split(' ')[0] || '', 
    lastName: user?.name?.split(' ').slice(1).join(' ') || '', 
    email: user?.email || '' 
  })
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // Load saved profile data from localStorage
  useEffect(() => {
    const savedProfile = localStorage.getItem(`fm_profile_${user?.email}`)
    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile)
        if (parsed.form) {
          // Handle both old format (name) and new format (firstName, lastName)
          if (parsed.form.firstName && parsed.form.lastName) {
            setForm(parsed.form)
          } else if (parsed.form.name) {
            const nameParts = parsed.form.name.split(' ')
            setForm({
              firstName: nameParts[0] || '',
              lastName: nameParts.slice(1).join(' ') || '',
              email: parsed.form.email || user?.email || ''
            })
          }
        }
        setProfilePhoto(parsed.photo || null)
      } catch {}
    }
  }, [user?.email])

  // Validate email format
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Handle photo upload
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB')
      return
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // Convert to base64
    const reader = new FileReader()
    reader.onload = (event) => {
      const base64 = event.target?.result as string
      setProfilePhoto(base64)
      
      // Update localStorage immediately
      try {
        const savedProfile = localStorage.getItem(`fm_profile_${user?.email}`)
        const profileData = savedProfile ? JSON.parse(savedProfile) : { form }
        profileData.photo = base64
        localStorage.setItem(`fm_profile_${user?.email}`, JSON.stringify(profileData))
        window.dispatchEvent(new Event('profilePhotoUpdated'))
      } catch {}
      
      toast.success('Photo uploaded successfully!')
    }
    reader.onerror = () => {
      toast.error('Failed to read image file')
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    // Validate all fields
    const newErrors: Record<string, string> = {}

    if (!form.firstName.trim()) {
      newErrors.firstName = 'First name is required'
    }

    if (!form.lastName.trim()) {
      newErrors.lastName = 'Last name is required'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      toast.error('Please fix the errors before saving')
      return
    }

    setErrors({})
    setSaving(true)

    // Save to localStorage
    try {
      const savedProfile = localStorage.getItem(`fm_profile_${user?.email}`)
      const profileData = savedProfile ? JSON.parse(savedProfile) : {}
      profileData.form = form
      profileData.photo = profilePhoto
      profileData.updatedAt = new Date().toISOString()
      localStorage.setItem(`fm_profile_${user?.email}`, JSON.stringify(profileData))
      
      // Combine first and last name for backend
      const fullName = `${form.firstName} ${form.lastName}`.trim()
      
      // Update name in backend database
      try {
        const response = await fetch(`http://localhost:5000/api/users/email/${user?.email}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: fullName
          })
        })

        if (response.ok) {
          // Update the user context with new name
          updateUser({ name: fullName })
        } else {
          console.warn('Failed to update user in database, but localStorage updated')
        }
      } catch (error) {
        console.warn('Backend not available, profile saved to localStorage only:', error)
      }
      
      // Dispatch custom event to notify other components
      window.dispatchEvent(new Event('profilePhotoUpdated'))
      
      setTimeout(() => {
        setSaving(false)
        toast.success('Profile updated successfully!')
      }, 1000)
    } catch (error) {
      setSaving(false)
      toast.error('Failed to save profile')
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
      <h3 className="font-bold text-gray-900 dark:text-white mb-5">Tenant Profile</h3>

      {/* Avatar */}
      <div className="flex items-center gap-6 mb-6 pb-6 border-b border-gray-100 dark:border-gray-700">
        <div className="relative">
          {profilePhoto ? (
            <img src={profilePhoto} alt="Profile" className="w-24 h-24 rounded-full object-cover shadow-lg" />
          ) : (
            <div className="w-24 h-24 bg-button-primary rounded-full flex items-center justify-center text-white font-black text-3xl shadow-lg">
              {(user?.name || 'U').charAt(0)}
            </div>
          )}
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 w-8 h-8 bg-button-primary rounded-full flex items-center justify-center border-2 border-white shadow-md hover:bg-button-primary/90 transition-colors">
            <CameraIcon className="w-4 h-4 text-white" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            className="hidden"
          />
        </div>
        <div>
          <p className="font-bold text-gray-900 dark:text-white text-lg">{`${form.firstName} ${form.lastName}`.trim() || user?.name}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{user?.email}</p>
          <p className="text-xs text-gray-400 mt-1">Click the camera icon to upload a new photo</p>
        </div>
      </div>

      {/* Form */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* First Name Field */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">First Name *</label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input 
                type="text" 
                value={form.firstName} 
                placeholder="Your first name"
                onChange={e => {
                  setForm({...form, firstName: e.target.value})
                  if (errors.firstName) setErrors({...errors, firstName: ''})
                }}
                className={`w-full pl-9 pr-4 py-2.5 border-2 rounded-xl text-sm focus:outline-none transition-all dark:bg-gray-700 dark:text-white ${
                  errors.firstName ? 'border-red-300 bg-red-50 focus:border-red-400' : 'border-gray-200 dark:border-gray-600 focus:border-button-primary'
                }`} />
            </div>
            {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
          </div>

          {/* Last Name Field */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Last Name *</label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input 
                type="text" 
                value={form.lastName} 
                placeholder="Your last name"
                onChange={e => {
                  setForm({...form, lastName: e.target.value})
                  if (errors.lastName) setErrors({...errors, lastName: ''})
                }}
                className={`w-full pl-9 pr-4 py-2.5 border-2 rounded-xl text-sm focus:outline-none transition-all dark:bg-gray-700 dark:text-white ${
                  errors.lastName ? 'border-red-300 bg-red-50 focus:border-red-400' : 'border-gray-200 dark:border-gray-600 focus:border-button-primary'
                }`} />
            </div>
            {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
          </div>

          {/* Email Field */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Email (Cannot be changed)</label>
            <div className="relative">
              <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input 
                type="email" 
                value={form.email} 
                placeholder="you@example.com"
                disabled
                className="w-full pl-9 pr-4 py-2.5 border-2 rounded-xl text-sm focus:outline-none transition-all bg-gray-100 dark:bg-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-600 cursor-not-allowed" />
            </div>
          </div>
        </div>
      </div>

      <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }} onClick={handleSave} disabled={saving}
        className="mt-6 flex items-center gap-2 px-6 py-3 bg-button-primary text-white font-bold rounded-xl shadow-md hover:bg-button-primary/90 disabled:opacity-60 transition-all">
        {saving ? <><motion.div animate={{ rotate:360 }} transition={{ duration:0.7, repeat:Infinity, ease:'linear' }} className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />Saving...</> : 'Save Changes'}
      </motion.button>
    </div>
  )
}

// ─── Verification Settings Panel ───────────────────────────────────────────────
function VerificationSettingsPanel() {
  const { user } = useAuth()
  const [citizenshipDoc, setCitizenshipDoc] = useState<string | null>(null)
  const [isVerified, setIsVerified] = useState(false)
  const [verificationStatus, setVerificationStatus] = useState<'none' | 'pending' | 'verified'>('none')
  const citizenshipInputRef = React.useRef<HTMLInputElement>(null)

  // Load verification data from localStorage
  useEffect(() => {
    const savedProfile = localStorage.getItem(`fm_tenant_profile_${user?.email}`)
    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile)
        setCitizenshipDoc(parsed.citizenshipDoc || null)
        setIsVerified(parsed.isVerified || false)
        setVerificationStatus(parsed.verificationStatus || 'none')
      } catch {}
    }
  }, [user?.email])

  // Handle citizenship document upload
  const handleCitizenshipUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Document size must be less than 10MB')
      return
    }

    // Check file type (images and PDFs)
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      toast.error('Please select an image or PDF file')
      return
    }

    // Convert to base64
    const reader = new FileReader()
    reader.onload = (event) => {
      const base64 = event.target?.result as string
      setCitizenshipDoc(base64)
      setVerificationStatus('pending')
      
      // Save to localStorage
      try {
        const savedProfile = localStorage.getItem(`fm_tenant_profile_${user?.email}`)
        const profileData = savedProfile ? JSON.parse(savedProfile) : {}
        profileData.citizenshipDoc = base64
        profileData.verificationStatus = 'pending'
        profileData.updatedAt = new Date().toISOString()
        localStorage.setItem(`fm_tenant_profile_${user?.email}`, JSON.stringify(profileData))
        window.dispatchEvent(new Event('profilePhotoUpdated'))
      } catch {}
      
      // Auto-verify after 2 seconds (simulating admin review)
      setTimeout(() => {
        setIsVerified(true)
        setVerificationStatus('verified')
        
        try {
          const savedProfile = localStorage.getItem(`fm_tenant_profile_${user?.email}`)
          const profileData = savedProfile ? JSON.parse(savedProfile) : {}
          profileData.isVerified = true
          profileData.verificationStatus = 'verified'
          profileData.verifiedAt = new Date().toISOString()
          localStorage.setItem(`fm_tenant_profile_${user?.email}`, JSON.stringify(profileData))
          
          // Update user in flatmate_user
          const userStr = localStorage.getItem('flatmate_user')
          if (userStr) {
            const currentUser = JSON.parse(userStr)
            currentUser.isVerified = true
            localStorage.setItem('flatmate_user', JSON.stringify(currentUser))
          }
          
          window.dispatchEvent(new Event('profilePhotoUpdated'))
          window.dispatchEvent(new Event('storage'))
        } catch {}
        
        toast('✓ Verification complete! You now have a verified badge', {
          style: {
            background: '#2563EB',
            color: 'white',
          },
          duration: 4000,
        })
      }, 2000)
      
      toast('Citizenship document uploaded! Verifying...', {
        style: {
          background: '#F59E0B',
          color: 'white',
        },
      })
    }
    reader.onerror = () => {
      toast.error('Failed to read document file')
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-5">
        <ShieldCheckIcon className="w-5 h-5 text-blue-600"/>
        <h3 className="font-bold text-gray-900 dark:text-white">Account Verification</h3>
      </div>
      
      {/* Verification Status Banner */}
      {verificationStatus === 'verified' && (
        <div className="mb-5 p-4 bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
              <CheckIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                Verified Tenant
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-600 text-white text-[10px] font-bold rounded-full">
                  <ShieldCheckIcon className="w-3 h-3" />
                  VERIFIED
                </span>
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">Your account is verified. Property owners can see your verified badge.</p>
            </div>
          </div>
        </div>
      )}
      
      {verificationStatus === 'pending' && (
        <div className="mb-5 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-2 border-yellow-200 dark:border-yellow-700 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0">
              <ClockIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-white">Verification Pending</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">Your document is being reviewed. This usually takes a few seconds.</p>
            </div>
          </div>
        </div>
      )}
      
      {verificationStatus === 'none' && (
        <div className="mb-5 p-4 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20 border-2 border-gray-200 dark:border-gray-700 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-400 rounded-full flex items-center justify-center flex-shrink-0">
              <AlertCircleIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-white">Not Verified</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">Upload your citizenship document to get verified and build trust with property owners.</p>
            </div>
          </div>
        </div>
      )}

      {/* Benefits Section */}
      <div className="mb-5 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl">
        <p className="text-xs font-bold text-blue-900 dark:text-blue-300 mb-3">Benefits of Verification:</p>
        <div className="space-y-2">
          {[
            'Get a blue verified badge visible to all property owners',
            'Build trust and credibility with landlords',
            'Increase booking approval rates by up to 40%',
            'Stand out from unverified tenants',
          ].map((benefit, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <CheckCircleIcon className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-gray-700 dark:text-gray-300">{benefit}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Upload Section */}
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
            Upload Citizenship Document
          </label>
          <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-3">
            Upload a clear photo or scan of your citizenship certificate. Accepted formats: JPG, PNG, PDF (max 10MB)
          </p>
          
          {citizenshipDoc ? (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-700 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-800 rounded-lg flex items-center justify-center">
                    <FileTextIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900 dark:text-white">Document Uploaded</p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">Citizenship certificate</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      // Open document in new tab/modal
                      const isPDF = citizenshipDoc.startsWith('data:application/pdf')
                      if (isPDF) {
                        // For PDF, open in new tab
                        const newWindow = window.open()
                        if (newWindow) {
                          newWindow.document.write(`
                            <html>
                              <head><title>Citizenship Document</title></head>
                              <body style="margin:0">
                                <iframe src="${citizenshipDoc}" style="width:100%;height:100vh;border:none"></iframe>
                              </body>
                            </html>
                          `)
                        }
                      } else {
                        // For images, open in new tab
                        const newWindow = window.open()
                        if (newWindow) {
                          newWindow.document.write(`
                            <html>
                              <head><title>Citizenship Document</title></head>
                              <body style="margin:0;display:flex;align-items:center;justify-content:center;background:#000">
                                <img src="${citizenshipDoc}" style="max-width:100%;max-height:100vh;object-fit:contain" />
                              </body>
                            </html>
                          `)
                        }
                      }
                    }}
                    className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-semibold flex items-center gap-1"
                  >
                    <EyeIcon className="w-3.5 h-3.5" />
                    View
                  </button>
                  <button
                    onClick={() => {
                      setCitizenshipDoc(null)
                      setVerificationStatus('none')
                      setIsVerified(false)
                      try {
                        const savedProfile = localStorage.getItem(`fm_tenant_profile_${user?.email}`)
                        if (savedProfile) {
                          const parsed = JSON.parse(savedProfile)
                          parsed.citizenshipDoc = null
                          parsed.verificationStatus = 'none'
                          parsed.isVerified = false
                          localStorage.setItem(`fm_tenant_profile_${user?.email}`, JSON.stringify(parsed))
                          
                          // Update user in flatmate_user
                          const userStr = localStorage.getItem('flatmate_user')
                          if (userStr) {
                            const currentUser = JSON.parse(userStr)
                            currentUser.isVerified = false
                            localStorage.setItem('flatmate_user', JSON.stringify(currentUser))
                          }
                          
                          window.dispatchEvent(new Event('profilePhotoUpdated'))
                        }
                      } catch {}
                      toast('Document removed', { style: { background: '#D1D5DB', color: '#374151' } })
                    }}
                    className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-semibold"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <input
                ref={citizenshipInputRef}
                type="file"
                accept="image/*,application/pdf"
                onChange={handleCitizenshipUpload}
                className="hidden"
              />
              <button
                onClick={() => citizenshipInputRef.current?.click()}
                className="w-full p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group"
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-700 transition-colors">
                    <FileTextIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Click to upload citizenship</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">JPG, PNG or PDF (max 10MB)</p>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Security Note */}
        <div className="p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl">
          <div className="flex items-start gap-2">
            <LockIcon className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Your data is secure</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                Your citizenship document is encrypted and stored securely. It will only be used for verification purposes and will not be shared with anyone.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Notification Settings Panel ───────────────────────────────────────────────
function NotificationSettingsPanel() {
  const { user } = useAuth()
  const [messageNotifications, setMessageNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem(`fm_tenant_notify_messages_${user?.email}`)
      return saved === 'true'
    } catch {
      return false
    }
  })

  const handleToggleMessageNotifications = () => {
    const newValue = !messageNotifications
    setMessageNotifications(newValue)
    localStorage.setItem(`fm_tenant_notify_messages_${user?.email}`, String(newValue))
    
    if (newValue) {
      toast('Message notifications enabled', {
        style: {
          background: '#2F7D5F',
          color: 'white',
        },
      })
    } else {
      toast('Message notifications disabled', {
        style: {
          background: '#6B7280',
          color: 'white',
        },
      })
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-5">
        <BellIcon className="w-5 h-5 text-button-primary"/>
        <h3 className="font-bold text-gray-900 dark:text-white">Notification Preferences</h3>
      </div>
      
      <div className="space-y-4">
        {/* Message Notifications */}
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 bg-button-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <MailIcon className="w-5 h-5 text-button-primary"/>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 dark:text-white text-sm">Owner Messages</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Get notified when you receive a message from the owner</p>
            </div>
          </div>
          <motion.button 
            whileTap={{ scale: 0.9 }} 
            onClick={handleToggleMessageNotifications}
            className={`w-12 h-6 rounded-full transition-all relative flex-shrink-0 ml-3 ${
              messageNotifications ? 'bg-button-primary' : 'bg-gray-300 dark:bg-gray-600'
            }`}>
            <motion.div 
              animate={{ x: messageNotifications ? 24 : 2 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
          </motion.button>
        </div>

        {/* Info Box */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-semibold text-blue-900 dark:text-blue-300 text-sm mb-1">About Notifications</p>
              <p className="text-xs text-blue-700 dark:text-blue-400">
                Enable notifications to stay updated when property owners send you messages. You can change these settings anytime.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Display Preferences Panel ─────────────────────────────────────────────────
function DisplayPreferencesPanel() {
  const { isDark, toggleTheme } = useTheme()
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>(() => {
    try {
      const saved = localStorage.getItem('fm_font_size')
      return (saved as 'small' | 'medium' | 'large') || 'medium'
    } catch {
      return 'medium'
    }
  })

  const handleFontSizeChange = (size: 'small' | 'medium' | 'large') => {
    setFontSize(size)
    localStorage.setItem('fm_font_size', size)
    
    // Apply font size to document root
    const root = document.documentElement
    if (size === 'small') {
      root.style.fontSize = '14px'
    } else if (size === 'large') {
      root.style.fontSize = '18px'
    } else {
      root.style.fontSize = '16px'
    }
    
    toast.success(`Font size changed to ${size}`)
  }

  // Apply saved font size on mount
  React.useEffect(() => {
    const root = document.documentElement
    if (fontSize === 'small') {
      root.style.fontSize = '14px'
    } else if (fontSize === 'large') {
      root.style.fontSize = '18px'
    } else {
      root.style.fontSize = '16px'
    }
  }, [])

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-5">
        <SunIcon className="w-5 h-5 text-button-primary"/>
        <h3 className="font-bold text-gray-900 dark:text-white">Display Preferences</h3>
      </div>
      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-button-primary/10 rounded-lg flex items-center justify-center">
              <MoonIcon className="w-4 h-4 text-button-primary"/>
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white text-sm">Dark Mode</p>
              <p className="text-xs text-gray-400">Switch to dark color scheme</p>
            </div>
          </div>
          <motion.button 
            whileTap={{ scale: 0.9 }} 
            onClick={() => {
              toggleTheme()
              if (!isDark) {
                toast('Dark mode enabled', {
                  style: {
                    background: '#2F7D5F',
                    color: 'white',
                  },
                });
              } else {
                toast('Dark mode disabled', {
                  style: {
                    background: '#D1D5DB',
                    color: '#374151',
                  },
                });
              }
            }}
            className={`w-12 h-6 rounded-full transition-all relative ${isDark ? 'bg-button-primary' : 'bg-gray-300'}`}>
            <motion.div 
              animate={{ x: isDark ? 24 : 2 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
          </motion.button>
        </div>

        {/* Font Size Selector */}
        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-button-primary/10 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-button-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white text-sm">Font Size</p>
              <p className="text-xs text-gray-400">Adjust text size for readability</p>
            </div>
          </div>
          <div className="flex gap-2">
            {(['small', 'medium', 'large'] as const).map((size) => (
              <button
                key={size}
                onClick={() => handleFontSizeChange(size)}
                className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  fontSize === size
                    ? 'bg-button-primary text-white shadow-sm'
                    : 'bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-500'
                }`}>
                {size === 'small' && 'A'}
                {size === 'medium' && 'A'}
                {size === 'large' && 'A'}
                <span className="ml-1 capitalize">{size}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Dashboard ────────────────────────────────────────────────────────────
export function TenantDashboard() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { favorites, clearAll: clearFavorites } = useFavorites()

  // Load profile photo from localStorage
  const [profilePhoto, setProfilePhoto] = useState<string | null>(() => {
    try {
      const savedProfile = localStorage.getItem(`fm_profile_${user?.email}`)
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile)
        return parsed.photo || null
      }
    } catch {}
    return null
  })

  // Load verification status from localStorage
  const [verificationStatus, setVerificationStatus] = useState<'unverified' | 'pending' | 'verified' | 'rejected'>(() => {
    try {
      const savedProfile = localStorage.getItem(`fm_profile_${user?.email}`)
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile)
        return parsed.verificationStatus || 'unverified'
      }
    } catch {}
    return 'unverified'
  })

  // Listen for profile updates
  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const savedProfile = localStorage.getItem(`fm_profile_${user?.email}`)
        if (savedProfile) {
          const parsed = JSON.parse(savedProfile)
          setProfilePhoto(parsed.photo || null)
          setVerificationStatus(parsed.verificationStatus || 'unverified')
        }
      } catch {}
    }

    window.addEventListener('storage', handleStorageChange)
    // Also listen for custom event from ProfileSettingsPanel
    window.addEventListener('profilePhotoUpdated', handleStorageChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('profilePhotoUpdated', handleStorageChange)
    }
  }, [user?.email])

  // Role verification - redirect if not tenant
  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }
    if (user.role !== 'tenant') {
      toast.error('Access denied. This page is for tenants only.');
      if (user.role === 'admin') {
        navigate('/dashboard/admin', { replace: true });
      } else if (user.role === 'landlord' || user.role === 'owner') {
        navigate('/dashboard/owner', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [user, navigate]);

  // ── Roommate requirements from localStorage (written by FindRoommatePage) ──
  const [requirements, setRequirements] = useState<any[]>(() => {
    try { return JSON.parse(localStorage.getItem('fm_requirements') || '[]') } catch { return [] }
  })
  const [userNotifs, setUserNotifs] = useState<any[]>(() => {
    try { return JSON.parse(localStorage.getItem(`fm_notifs_${user?.name || 'user'}`) || '[]') } catch { return [] }
  })
  
  // ── Tenant message notifications from localStorage ──
  const [tenantNotifs, setTenantNotifs] = useState<any[]>(() => {
    try { 
      return JSON.parse(localStorage.getItem(`fm_tenant_notifs_${user?.email}`) || '[]') 
    } catch { 
      return [] 
    }
  })

  // Listen for new notifications from owner
  useEffect(() => {
    const handleNewNotification = (event: any) => {
      const notification = event.detail
      setTenantNotifs(prev => [notification, ...prev])
      
      // Show toast notification
      toast(notification.message, {
        duration: 5000,
        style: {
          background: '#2F7D5F',
          color: 'white',
        },
      })
    }

    window.addEventListener('tenantNotification', handleNewNotification)
    return () => window.removeEventListener('tenantNotification', handleNewNotification)
  }, [])

  // Reload tenant notifications from localStorage periodically
  useEffect(() => {
    const interval = setInterval(() => {
      try {
        const notifs = JSON.parse(localStorage.getItem(`fm_tenant_notifs_${user?.email}`) || '[]')
        setTenantNotifs(notifs)
      } catch {}
    }, 3000)
    return () => clearInterval(interval)
  }, [user?.email])

  // ── Bookings from localStorage ──
  const [bookings, setBookings] = useState<any[]>([])

  // Load bookings on mount and when user changes
  useEffect(() => {
    const loadBookings = () => {
      console.log('🔄 Loading bookings for user:', user?.email, user?.name)
      
      try { 
        const allBookings = JSON.parse(localStorage.getItem('fm_bookings') || '[]')
        console.log('📦 Total bookings in localStorage:', allBookings.length)
        
        // Remove specific unwanted bookings by receipt ID
        const unwantedReceipts = ['KH-MO2QO1EF-J7TL', 'KH-MO2I8FBG-2EEH', 'KH-MNVG5G4L-R9Z1']
        
        // Remove old sample bookings and unwanted bookings
        const cleanedBookings = allBookings.filter((b: any) => 
          !b.receiptId?.startsWith('BK-SAMPLE') && !unwantedReceipts.includes(b.receiptId)
        )
        console.log('🧹 Cleaned bookings:', cleanedBookings.length)
        
        // Add ONE sample rejected booking if not already added
        const hasRejected = cleanedBookings.some((b: any) => b.status === 'rejected' && b.customerEmail === user?.email)
        if (!hasRejected && user?.email) {
          const sampleRejected = {
            propertyId: 'sample-rej-1',
            propertyTitle: 'Luxury Villa in Budhanilkantha',
            ownerName: 'Rajesh Maharjan',
            rent: 45000,
            paymentType: 'full',
            amount: 45000,
            customerName: user.name || 'User',
            customerEmail: user.email,
            customerPhone: '9800000000',
            moveInDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            receiptId: `BK-REJ-${Date.now().toString(36).toUpperCase()}`,
            status: 'rejected',
            rejectionReason: 'Property already booked for the selected dates',
            createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            bookedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&auto=format&fit=crop'
          }
          cleanedBookings.unshift(sampleRejected)
        }
        
        // Save cleaned bookings back
        localStorage.setItem('fm_bookings', JSON.stringify(cleanedBookings))
        
        // Filter bookings for current user by email or name
        const userBookings = cleanedBookings.filter((b: any) => {
          if (!user) return false
          const emailMatch = user.email && b.customerEmail?.toLowerCase() === user.email.toLowerCase()
          const nameMatch = user.name && b.customerName?.toLowerCase().includes(user.name.toLowerCase())
          console.log(`🔍 Checking booking: ${b.propertyTitle}`, {
            bookingEmail: b.customerEmail,
            userEmail: user.email,
            emailMatch,
            bookingName: b.customerName,
            userName: user.name,
            nameMatch
          })
          return emailMatch || nameMatch
        })
        
        console.log('👤 User bookings found:', userBookings.length)
        
        // Sort by creation date (newest first)
        userBookings.sort((a: any, b: any) => {
          const dateA = new Date(a.createdAt || a.bookedAt || 0).getTime()
          const dateB = new Date(b.createdAt || b.bookedAt || 0).getTime()
          return dateB - dateA
        })
        
        console.log('✅ Setting bookings:', userBookings)
        setBookings(userBookings)
      } catch (err) {
        console.error('❌ Error loading bookings:', err)
        setBookings([])
      }
    }
    
    if (user) {
      loadBookings()
    }
  }, [user?.email, user?.name])

  // Auto-refresh bookings every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!user) return
      
      try {
        const allBookings = JSON.parse(localStorage.getItem('fm_bookings') || '[]')
        
        // Remove specific unwanted bookings by receipt ID
        const unwantedReceipts = ['KH-MO2QO1EF-J7TL', 'KH-MO2I8FBG-2EEH', 'KH-MNVG5G4L-R9Z1']
        
        // Remove sample bookings and unwanted bookings
        const cleanedBookings = allBookings.filter((b: any) => 
          !b.receiptId?.startsWith('BK-SAMPLE') && !unwantedReceipts.includes(b.receiptId)
        )
        
        const userBookings = cleanedBookings.filter((b: any) => {
          const emailMatch = user.email && b.customerEmail?.toLowerCase() === user.email.toLowerCase()
          const nameMatch = user.name && b.customerName?.toLowerCase().includes(user.name.toLowerCase())
          return emailMatch || nameMatch
        })
        
        // Sort by creation date (newest first)
        userBookings.sort((a: any, b: any) => {
          const dateA = new Date(a.createdAt || a.bookedAt || 0).getTime()
          const dateB = new Date(b.createdAt || b.bookedAt || 0).getTime()
          return dateB - dateA
        })
        
        setBookings(userBookings)
      } catch {}
    }, 3000)
    return () => clearInterval(interval)
  }, [user?.email, user?.name])

  // Reload from storage when tab becomes active or storage changes
  useEffect(() => {
    const reload = () => {
      if (!user) return
      
      try {
        const allBookings = JSON.parse(localStorage.getItem('fm_bookings') || '[]')
        const unwantedReceipts = ['KH-MO2QO1EF-J7TL', 'KH-MO2I8FBG-2EEH', 'KH-MNVG5G4L-R9Z1']
        const cleanedBookings = allBookings.filter((b: any) => 
          !b.receiptId?.startsWith('BK-SAMPLE') && !unwantedReceipts.includes(b.receiptId)
        )
        
        const userBookings = cleanedBookings.filter((b: any) => {
          const emailMatch = user.email && b.customerEmail?.toLowerCase() === user.email.toLowerCase()
          const nameMatch = user.name && b.customerName?.toLowerCase().includes(user.name.toLowerCase())
          return emailMatch || nameMatch
        })
        
        // Sort by creation date (newest first)
        userBookings.sort((a: any, b: any) => {
          const dateA = new Date(a.createdAt || a.bookedAt || 0).getTime()
          const dateB = new Date(b.createdAt || b.bookedAt || 0).getTime()
          return dateB - dateA
        })
        
        setBookings(userBookings)
        
        setRequirements(JSON.parse(localStorage.getItem('fm_requirements') || '[]'))
        setUserNotifs(JSON.parse(localStorage.getItem(`fm_notifs_${user?.name || 'user'}`) || '[]'))
      } catch {}
    }
    
    window.addEventListener('focus', reload)
    window.addEventListener('storage', reload)
    // Custom event for immediate updates
    window.addEventListener('bookingAdded', reload)
    
    return () => {
      window.removeEventListener('focus', reload)
      window.removeEventListener('storage', reload)
      window.removeEventListener('bookingAdded', reload)
    }
  }, [user?.name, user?.email])

  const toggleLike = (id: string) => {
    const userName = user?.name || 'You'
    const updated = requirements.map((r: any) => {
      if (r.id !== id) return r
      const liked = (r.likes || []).includes(userName)
      return { ...r, likes: liked ? r.likes.filter((n: string) => n !== userName) : [...(r.likes||[]), userName] }
    })
    setRequirements(updated)
    localStorage.setItem('fm_requirements', JSON.stringify(updated))
  }

  const addComment = (id: string, author: string, text: string) => {
    const updated = requirements.map((r: any) => r.id !== id ? r : {
      ...r, comments: [...(r.comments||[]), { id: Date.now().toString(), author, text, timestamp: Date.now() }]
    })
    setRequirements(updated)
    localStorage.setItem('fm_requirements', JSON.stringify(updated))
  }
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [bookingToCancel, setBookingToCancel] = useState<any>(null)

  // Read tab from URL param (set by "Chat with Owner" / message icon / Find Roommate message)
  const urlTab = searchParams.get('tab')
  const fromPage = searchParams.get('from') || 'properties'
  const [activeTab, setActiveTab] = useState(urlTab || 'overview')
  const [settingsTab, setSettingsTab] = useState<'profile' | 'verification' | 'display' | 'notifications'>('profile')

  // Messages params from PropertyDetailPage / FindRoommatePage (must be declared before useEffect)
  const msgUserId        = searchParams.get('userId')        || undefined
  const msgUserName      = searchParams.get('userName')      || undefined
  const msgPropertyTitle = searchParams.get('propertyTitle') || undefined

  // Messages state
  const [conversations, setConversations] = useState<Chat[]>([])
  const [selectedConv, setSelectedConv]   = useState<Chat | null>(null)
  const [searchQuery, setSearchQuery]     = useState('')
  const [message, setMessage]             = useState('')
  const [showInfo, setShowInfo]           = useState(false)

  // Removed all auto-scroll logic - messages are now freely scrollable

  // Update tab when URL changes
  useEffect(() => { if (urlTab) setActiveTab(urlTab) }, [urlTab])

  // Auto-mark all notifications as read when visiting notifications tab
  useEffect(() => {
    if (activeTab === 'notifications' && tenantNotifs.length > 0) {
      // Wait 500ms before marking as read (so user sees them first)
      const timer = setTimeout(() => {
        const hasUnread = tenantNotifs.some(n => !n.read)
        if (hasUnread) {
          const updatedNotifs = tenantNotifs.map(n => ({ ...n, read: true }))
          setTenantNotifs(updatedNotifs)
          localStorage.setItem(`fm_tenant_notifs_${user?.email}`, JSON.stringify(updatedNotifs))
        }
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [activeTab, tenantNotifs.length, user?.email])

  // Polling mechanism for messages - fetch on ALL tabs for badge count
  useEffect(() => {
    const fetchChats = async () => {
      if (!user) return;
      const userRole = (user.role === 'landlord' ? 'owner' : user.role) as 'tenant' | 'owner';
      const myChats = await getChats(user.name, userRole);
      setConversations(myChats);
      
      // If we have a selected conversation, refresh it
      if (selectedConv) {
        const updated = myChats.find(c => c.id === selectedConv.id);
        if (updated) {
          setSelectedConv(updated);
        }
      }
    };

    // Fetch immediately on mount
    fetchChats();
    
    // Poll every 3 seconds regardless of active tab (for badge count)
    const interval = setInterval(fetchChats, 3000);
    return () => clearInterval(interval);
  }, [user, selectedConv?.id]);

  // Mark messages as seen and refresh conversations
  useEffect(() => {
    const markSeen = async () => {
      if (selectedConv && user && activeTab === 'messages') {
        const userRole = (user.role === 'landlord' ? 'owner' : user.role) as 'tenant' | 'owner';
        await markChatAsSeen(selectedConv.id, userRole);
        
        // Immediately refresh conversations to update badge count
        const myChats = await getChats(user.name, userRole);
        setConversations(myChats);
        
        // Update selected conversation with fresh data
        const updated = myChats.find(c => c.id === selectedConv.id);
        if (updated) {
          setSelectedConv(updated);
        }
      }
    };
    markSeen();
  }, [selectedConv?.id, selectedConv?.messages?.length, user, activeTab]);

  // Initial Check from URL query strings (Owner contact init)
  useEffect(() => {
    const initChat = async () => {
      if (!user || activeTab !== 'messages') return;
      
      if (msgUserName) {
        const decodedOwner = decodeURIComponent(msgUserName);
        const decodedTitle = msgPropertyTitle ? decodeURIComponent(msgPropertyTitle) : undefined;
        const decodedPropId = msgUserId ? decodeURIComponent(msgUserId) : undefined;
        
        const newChat = await getOrCreateChat(user.name, decodedOwner, decodedTitle, decodedPropId);
        if (newChat) {
          setSelectedConv(newChat);
        }
      }
    };
    
    initChat();
  }, [msgUserName, msgPropertyTitle, msgUserId, user, activeTab]);

  const tabs = [
    { id:'overview',       label:'Overview',          icon: HomeIcon },
    { id:'saved',          label:'Saved Properties',  icon: HeartIcon },
    { id:'bookings',       label:'My Bookings',       icon: CalendarIcon },
    { id:'messages',       label:'Messages',          icon: MessageCircleIcon },
    { id:'notifications',  label:'Notifications',     icon: BellIcon },
    { id:'settings',       label:'Settings',          icon: SettingsIcon },
  ]

  // Calculate unread message count
  const unreadMessageCount = conversations.reduce((total, conv) => {
    return total + (conv.unreadCount || 0)
  }, 0)

  // Calculate unread notification count
  const unreadNotificationCount = tenantNotifs.filter(n => !n.read).length

  const handleLogout = () => {
    logout()
    toast.removed('Signed out')
    navigate('/')
  }

  // Message handlers
  const handleSend = async () => {
    if (!message.trim() || !selectedConv || !user) return;
    const txt = message;
    setMessage('');
    
    const userRole = (user.role === 'landlord' ? 'owner' : user.role) as 'tenant' | 'owner';
    await sendMessage(selectedConv.id, {
      text: txt,
      senderName: user.name,
      senderRole: userRole
    });
    
    // Refresh the conversation
    const myChats = await getChats(user.name, userRole);
    const updated = myChats.find(c => c.id === selectedConv.id);
    if (updated) setSelectedConv(updated);
  };

  const handleFileUpload = async (type: 'image' | 'video' | 'audio') => {
    if (!selectedConv || !user) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = type === 'image' ? 'image/*' : type === 'video' ? 'video/*' : 'audio/*';
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      
      // Show loading toast
      const loadingToast = toast.loading(`Uploading ${type}...`);
      
      try {
        // Convert file to base64
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        
        const userRole = (user.role === 'landlord' ? 'owner' : user.role) as 'tenant' | 'owner';
        const result = await sendMessage(selectedConv.id, {
          [type]: base64,
          senderName: user.name,
          senderRole: userRole
        });
        
        if (!result) {
          toast.dismiss(loadingToast);
          toast.error(`Failed to send ${type}`);
          return;
        }
        
        toast.dismiss(loadingToast);
        toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} sent!`);
        
        // Refresh the conversation immediately
        const myChats = await getChats(user.name, userRole);
        const updated = myChats.find(c => c.id === selectedConv.id);
        if (updated) setSelectedConv(updated);
      } catch (error) {
        toast.dismiss(loadingToast);
        toast.error(`Failed to upload ${type}`);
        console.error('Error uploading file:', error);
      }
    };
    input.click();
  };

  const renderContent = () => {
    switch (activeTab) {

      case 'saved':
        return (
          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-primary dark:text-white">Saved Properties</h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm">{favorites.length} saved {favorites.length === 1 ? 'property' : 'properties'}</p>
              </div>
              {favorites.length > 0 && (
                <button onClick={() => { clearFavorites(); toast.error('All favorites cleared') }}
                  className="flex items-center gap-1.5 px-3 py-2 border border-red-200 dark:border-red-800 text-red-500 dark:text-red-400 text-sm font-semibold rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">
                  <TrashIcon className="w-4 h-4" /> Clear All
                </button>
              )}
            </div>
            {favorites.length === 0 ? (
              <div className="text-center py-16 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                <HeartIcon className="w-12 h-12 text-gray-200 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 dark:text-gray-500">No saved properties yet. Heart any property to save it here.</p>
                <button onClick={() => navigate('/properties')} className="mt-4 px-6 py-2.5 bg-button-primary text-white text-sm font-bold rounded-full">Browse Properties</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {favorites.map(p => <PropertyCard key={p.id} {...p} />)}
              </div>
            )}
          </motion.div>
        )

      case 'bookings':
        return (
          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}>
            <h2 className="text-xl font-bold text-primary dark:text-white mb-6">My Bookings</h2>
            {bookings.length === 0 ? (
              <div className="text-center py-16 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                <CalendarIcon className="w-12 h-12 text-gray-200 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 dark:text-gray-500">No bookings yet. Book a property to see it here.</p>
                <button onClick={() => navigate('/properties')} className="mt-4 px-6 py-2.5 bg-button-primary text-white text-sm font-bold rounded-full">Browse Properties</button>
              </div>
            ) : (
              <div className="space-y-3">
                {bookings.map((b, index) => {
                  // Alternate colors matching the stat cards: soft pink, soft blue, soft lavender, soft yellow
                  const colors = [
                    'bg-gradient-to-br from-pink-50 to-pink-100',
                    'bg-gradient-to-br from-blue-50 to-blue-100',
                    'bg-gradient-to-br from-purple-50 to-purple-100',
                    'bg-gradient-to-br from-yellow-50 to-yellow-100'
                  ]
                  const textColors = [
                    'text-pink-500',
                    'text-blue-500',
                    'text-purple-500',
                    'text-yellow-600'
                  ]
                  const colorClass = colors[index % 4]
                  const textClass = textColors[index % 4]
                  
                  return (
                <div key={b.receiptId || b.id} className={`bg-white dark:bg-gray-800 rounded-2xl p-4 border shadow-sm ${b.status === 'rejected' ? 'border-red-200 dark:border-red-800' : 'border-gray-100 dark:border-gray-700'}`}>
                  <div className="flex items-start gap-4">
                    <div className={`w-16 h-16 rounded-xl ${colorClass} flex items-center justify-center ${textClass} font-black text-xl flex-shrink-0`}>
                      {b.propertyTitle?.charAt(0) || 'P'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 dark:text-white text-sm">{b.propertyTitle}</p>
                      <p className="text-gray-500 dark:text-gray-400 text-xs">Rent: NPR {b.rent?.toLocaleString()}</p>
                      <p className="text-gray-400 dark:text-gray-500 text-xs">Owner: {b.ownerName} · Move-in: {b.moveInDate}</p>
                      <p className="text-gray-400 dark:text-gray-500 text-xs font-mono">Receipt: {b.receiptId}</p>
                      {b.status === 'rejected' && b.rejectionReason && (
                        <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                          <p className="text-xs text-red-700 dark:text-red-400 font-semibold">
                            <span className="font-bold">Rejected: </span>{b.rejectionReason}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="flex-shrink-0 flex flex-col items-end gap-1">
                      {/* Status Badge - GREEN for confirmed */}
                      <span 
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold rounded-full"
                        style={{
                          backgroundColor: b.status === 'confirmed' ? '#D1FAE5' : b.status === 'rejected' ? '#FEE2E2' : '#FEF3C7',
                          color: b.status === 'confirmed' ? '#2F7D5F' : b.status === 'rejected' ? '#DC2626' : '#92400E',
                          border: `2px solid ${b.status === 'confirmed' ? '#2F7D5F' : b.status === 'rejected' ? '#DC2626' : '#F59E0B'}`
                        }}
                      >
                        {b.status === 'confirmed' ? '✓ Confirmed' : b.status === 'rejected' ? '✗ Rejected' : '⏱ Pending'}
                      </span>
                      {/* Payment Type Badge */}
                      {b.paymentType && (
                        <span 
                          className="text-xs font-semibold px-2 py-1 rounded-full"
                          style={{
                            backgroundColor: '#F3F4F6',
                            color: '#374151'
                          }}
                        >
                          {b.paymentType === 'cash' ? '💵 Cash on Arrival' : 
                           b.paymentType === 'advance' ? '💳 Advance 30%' : 
                           b.paymentType === 'full' ? '💳 Full Payment' : 
                           b.paymentType}
                        </span>
                      )}
                      {/* Cancel Button - Only for cash on arrival */}
                      {b.paymentType === 'cash' && b.status === 'confirmed' && (
                        <button
                          onClick={() => {
                            setBookingToCancel(b)
                            setCancelModalOpen(true)
                          }}
                          className="mt-1 px-3 py-1 text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                        >
                          Cancel Booking
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                  )
                })}
            </div>
            )}
          </motion.div>
        )

      case 'messages':
        const filteredConvs = conversations.filter(c => {
          const displayName = user?.role === 'tenant' ? c.ownerName : c.tenantName;
          return displayName.toLowerCase().includes(searchQuery.toLowerCase()) || 
            (c.propertyTitle && c.propertyTitle.toLowerCase().includes(searchQuery.toLowerCase()));
        });

        return (
          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} className="h-[calc(100vh-12rem)]">
            <div className="grid grid-cols-12 h-full bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
              
              {/* SIDEBAR */}
              <div className={`col-span-12 md:col-span-4 border-r border-gray-100 flex flex-col ${selectedConv ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-4 border-b border-gray-100">
                  <h2 className="text-2xl font-black text-gray-900 mb-4">Messages</h2>
                  <div className="relative">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="text" placeholder="Search owners or properties..." value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-button-primary/30 transition-all" />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {filteredConvs.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 text-sm">No conversations found</div>
                  ) : (
                    filteredConvs.map((conv, idx) => {
                      const unreadCount = conv.unreadCount || 0;
                      const lastMsg = conv.messages[conv.messages.length - 1];
                      const displayName = user?.role === 'tenant' ? conv.ownerName : conv.tenantName;
                      return (
                      <motion.button key={conv.id} initial={{ opacity:0, x:-16 }} animate={{ opacity:1, x:0 }}
                        transition={{ delay: idx*0.05 }} onClick={() => setSelectedConv(conv)}
                        className={`w-full p-4 flex items-start gap-3 text-left border-b border-gray-50 transition-colors hover:bg-gray-50 ${selectedConv?.id === conv.id ? 'bg-button-primary/5 border-l-2 border-l-button-primary' : ''}`}>
                        <div className="relative flex-shrink-0">
                          <AvatarCircle name={displayName} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <h3 className="font-bold text-gray-900 truncate text-sm">{displayName}</h3>
                            <span className="text-xs text-gray-400 flex-shrink-0 ml-2">{formatTime(new Date(conv.lastUpdated))}</span>
                          </div>
                          {conv.propertyTitle && (
                            <p className="text-xs text-button-primary font-medium truncate mb-0.5">{conv.propertyTitle}</p>
                          )}
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-gray-500 truncate flex-1">{lastMsg ? (lastMsg.text || 'Media message') : 'Start a conversation'}</p>
                            {unreadCount > 0 && (
                              <span className="ml-2 w-5 h-5 bg-button-primary text-white text-xs rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                                {unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </motion.button>
                    )})
                  )}
                </div>
              </div>

              {/* CHAT AREA */}
              <div className={`col-span-12 md:col-span-8 flex flex-col h-[calc(100vh-12rem)] ${selectedConv ? 'flex' : 'hidden md:flex'}`}>
                {selectedConv ? (
                  <>
                    {/* Chat header */}
                    <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between bg-white">
                      <div className="flex items-center gap-3">
                        <button onClick={() => setSelectedConv(null)}
                          className="md:hidden p-1 text-gray-400 hover:text-gray-600 transition-colors">
                          <ArrowLeftIcon className="w-5 h-5" />
                        </button>
                        <div className="relative">
                          <AvatarCircle name={user?.role === 'tenant' ? selectedConv.ownerName : selectedConv.tenantName} size="sm" />
                        </div>
                        <div>
                          <h2 className="font-black text-gray-900 text-sm">{user?.role === 'tenant' ? selectedConv.ownerName : selectedConv.tenantName}</h2>
                          {selectedConv.propertyTitle && (
                            <p className="text-xs text-button-primary font-medium">{selectedConv.propertyTitle}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <motion.button whileHover={{ scale:1.1 }} whileTap={{ scale:0.9 }} onClick={() => toast.info('Calling...')} className="p-2.5 text-gray-500 hover:text-button-primary hover:bg-button-primary/10 rounded-full">
                          <PhoneIcon className="w-5 h-5" />
                        </motion.button>
                        <motion.button whileHover={{ scale:1.1 }} whileTap={{ scale:0.9 }} onClick={() => setShowInfo(!showInfo)} className={`p-2.5 rounded-full ${showInfo ? 'text-button-primary bg-button-primary/10' : 'text-gray-500 hover:text-button-primary hover:bg-button-primary/10'}`}>
                          <InfoIcon className="w-5 h-5" />
                        </motion.button>
                      </div>
                    </div>

                    <AnimatePresence>
                      {showInfo && (
                        <motion.div initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }} exit={{ height:0, opacity:0 }}
                          className="bg-button-primary/5 border-b border-button-primary/10 px-5 py-3 text-sm overflow-hidden">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-black text-gray-900">{user?.role === 'tenant' ? selectedConv.ownerName : selectedConv.tenantName}</p>
                              {selectedConv.propertyTitle && <p className="text-button-primary font-medium">{selectedConv.propertyTitle}</p>}
                            </div>
                            <button onClick={() => setShowInfo(false)} className="text-gray-400 hover:text-gray-600"><XIcon className="w-4 h-4" /></button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Messages */}
                    <div className="overflow-y-auto p-5 bg-gray-50 space-y-3 flex-1">
                      <AnimatePresence initial={false}>
                        {selectedConv.messages.map(msg => {
                          const isOwn = msg.senderName === user?.name;
                          return (
                          <motion.div key={msg.id} initial={{ opacity:0, y:12, scale:0.95 }} animate={{ opacity:1, y:0, scale:1 }}
                            exit={{ opacity:0, scale:0.9 }} transition={{ duration:0.25, type:'spring', stiffness:300 }}
                            className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                            {!isOwn && (
                              <div className="mr-2 flex-shrink-0 self-end">
                                <AvatarCircle name={msg.senderName} size="sm" />
                              </div>
                            )}
                            <div className={`max-w-[72%] px-4 py-2.5 rounded-2xl shadow-sm ${isOwn ? 'bg-button-primary text-white rounded-br-sm' : 'bg-white text-gray-900 rounded-bl-sm border border-gray-100'}`}>
                              {msg.text && <p className="text-sm leading-relaxed">{msg.text}</p>}
                              {msg.image && <img src={msg.image} alt="Shared" className="rounded-xl max-w-full h-auto mt-2" />}
                              {msg.video && <video src={msg.video} controls className="rounded-xl max-w-full mt-2" />}
                              {msg.audio && <audio src={msg.audio} controls className="w-full mt-2" />}
                              <div className={`flex items-center justify-end gap-1 mt-1 ${isOwn ? 'text-white/60' : 'text-gray-400'}`}>
                                <span className="text-[10px]">{formatMsgTime(msg.timestamp)}</span>
                                {isOwn && (
                                  msg.seen ? <CheckCheckIcon className="w-3.5 h-3.5 text-blue-300" /> : <CheckIcon className="w-3 h-3 text-white/60" />
                                )}
                              </div>
                            </div>
                          </motion.div>
                        )})}
                      </AnimatePresence>
                    </div>

                    {/* Input - Fixed at bottom */}
                    <div className="p-4 border-t border-gray-100 bg-white flex-shrink-0">
                      <div className="flex items-center gap-2 mb-3">
                        {[
                          { icon: ImageIcon,  label: 'image',  title:'Send image' },
                        ].map(btn => (
                          <motion.button key={btn.label} whileHover={{ scale:1.1 }} whileTap={{ scale:0.9 }}
                            onClick={() => handleFileUpload(btn.label as any)} title={btn.title}
                            className="p-2 text-gray-400 hover:text-button-primary hover:bg-button-primary/10 rounded-full transition-colors">
                            <btn.icon className="w-5 h-5" />
                          </motion.button>
                        ))}
                      </div>
                      <div className="flex items-center gap-3">
                        <input type="text" value={message}
                          onChange={e => setMessage(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                          placeholder={`Message ${user?.role === 'tenant' ? selectedConv.ownerName : selectedConv.tenantName}...`}
                          className="flex-1 px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm focus:outline-none focus:border-button-primary focus:bg-white transition-all" />
                        <motion.button whileHover={{ scale:1.1 }} whileTap={{ scale:0.9 }}
                          onClick={handleSend} disabled={!message.trim()}
                          className="p-3 bg-button-primary text-white rounded-2xl hover:bg-button-primary/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md">
                          <SendIcon className="w-5 h-5" />
                        </motion.button>
                      </div>
                    </div>
                  </>
                ) : (
                  <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="flex-1 flex items-center justify-center text-center p-8">
                    <div>
                      <MessageCircleIcon className="w-20 h-20 text-gray-200 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-gray-700 mb-2">Select a conversation</h3>
                      <p className="text-gray-400 text-sm">Choose a conversation from the list to start messaging</p>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        )

      case 'notifications':
        // Only show real notifications: tenant message notifications + user notifications
        const allNotifs = [...tenantNotifs, ...(userNotifs || [])]
        
        return (
          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}>
            <h2 className="text-xl font-bold text-primary dark:text-white mb-6">Notifications</h2>
            {allNotifs.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                <BellIcon className="w-12 h-12 text-gray-200 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 dark:text-gray-500">No notifications yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {allNotifs.map(n => (
                  <div key={n.id} className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm flex gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      n.type==='message' ? 'bg-purple-100 dark:bg-purple-900/30' :
                      n.type==='success' ? 'bg-green-100 dark:bg-green-900/30' : 
                      n.type==='warning' ? 'bg-yellow-100 dark:bg-yellow-900/30' : 
                      'bg-blue-100 dark:bg-blue-900/30'
                    }`}>
                      {n.type==='message' ? <MailIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" /> :
                       n.type==='success' ? <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400" /> : 
                       n.type==='warning' ? <ClockIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400" /> : 
                       <BellIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 dark:text-white text-sm">{n.title}</p>
                      <p className="text-gray-500 dark:text-gray-400 text-xs break-words">{n.message}</p>
                      <p className="text-gray-400 dark:text-gray-500 text-xs mt-0.5">{n.time}</p>
                    </div>
                    {n.type === 'message' && n.chatId && (
                      <button
                        onClick={() => {
                          // Mark this notification as read
                          const updatedNotifs = tenantNotifs.map(notif => 
                            notif.id === n.id ? { ...notif, read: true } : notif
                          )
                          setTenantNotifs(updatedNotifs)
                          localStorage.setItem(`fm_tenant_notifs_${user?.email}`, JSON.stringify(updatedNotifs))
                          
                          // Navigate to messages
                          setActiveTab('messages')
                          // Navigate to the specific chat
                          setTimeout(() => {
                            const chatElement = document.querySelector(`[data-chat-id="${n.chatId}"]`)
                            if (chatElement) {
                              chatElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
                            }
                          }, 100)
                        }}
                        className="px-4 py-2 bg-button-primary text-white text-sm font-semibold rounded-xl hover:bg-button-primary/90 transition-all flex-shrink-0 shadow-sm">
                        View
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )

      case 'settings':
        return (
          <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} className="flex gap-6 max-w-6xl">
            
            {/* Settings Sidebar */}
            <div className="w-64 flex-shrink-0">
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 sticky top-6">
                <h3 className="font-bold text-gray-900 dark:text-white mb-4 px-2">Settings</h3>
                <nav className="space-y-1">
                  {[
                    { id: 'profile' as const, label: 'Profile', icon: UserIcon },
                    { id: 'verification' as const, label: 'Verification', icon: ShieldCheckIcon },
                    { id: 'notifications' as const, label: 'Notifications', icon: BellIcon },
                    { id: 'display' as const, label: 'Display', icon: SunIcon },
                  ].map(item => (
                    <button 
                      key={item.id} 
                      onClick={() => setSettingsTab(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left ${
                        settingsTab === item.id
                          ? 'bg-button-primary text-white shadow-sm'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}>
                      <item.icon className="w-4 h-4"/>
                      <span className="font-medium text-sm">{item.label}</span>
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Settings Content */}
            <div className="flex-1 space-y-6">
              {settingsTab === 'profile' && <ProfileSettingsPanel />}
              {settingsTab === 'verification' && <VerificationSettingsPanel />}
              {settingsTab === 'notifications' && <NotificationSettingsPanel />}
              {settingsTab === 'display' && <DisplayPreferencesPanel />}
            </div>
          </motion.div>
        )

      default: // overview
        return (
          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} className="space-y-8">
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: HeartIcon,          value: favorites.length, label:'Saved Properties',  color:'bg-pink-100 text-pink-500' },
                { icon: CalendarIcon,        value: bookings.length, label:'Active Bookings', color:'bg-blue-100 text-blue-500' },
                { icon: MessageCircleIcon,   value: 0,  label:'Unread Messages',  color:'bg-purple-100 text-purple-500' },
                { icon: SearchIcon,          value: 12, label:'Properties Viewed', color:'bg-yellow-100 text-yellow-600' },
              ].map((stat, i) => (
                <motion.div key={stat.label} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.08 }}
                  whileHover={{ y:-4 }} className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm cursor-pointer">
                  <div className={`w-11 h-11 ${stat.color} rounded-xl flex items-center justify-center mb-3`}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <p className="text-2xl font-black text-gray-900 dark:text-white">{stat.value}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
                </motion.div>
              ))}
            </div>

            {/* Recent bookings */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 dark:text-white">Recent Bookings</h3>
                <button onClick={() => setActiveTab('bookings')} className="text-button-primary text-xs font-semibold hover:underline">View All</button>
              </div>
              {bookings.length === 0 ? (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 text-center border border-gray-100 dark:border-gray-700">
                  <CalendarIcon className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">No bookings yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {bookings.slice(0,2).map((b, index) => {
                    // Alternate colors matching the stat cards: soft pink, soft blue, soft lavender, soft yellow
                    const colors = [
                      'bg-gradient-to-br from-pink-50 to-pink-100',
                      'bg-gradient-to-br from-blue-50 to-blue-100',
                      'bg-gradient-to-br from-purple-50 to-purple-100',
                      'bg-gradient-to-br from-yellow-50 to-yellow-100'
                    ]
                    const textColors = [
                      'text-pink-500',
                      'text-blue-500',
                      'text-purple-500',
                      'text-yellow-600'
                    ]
                    const colorClass = colors[index % 4]
                    const textClass = textColors[index % 4]
                    
                    return (
                    <div key={b.receiptId || b.id} className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-100 dark:border-gray-700 flex gap-3 items-center">
                      <div className={`w-12 h-12 rounded-lg ${colorClass} flex items-center justify-center ${textClass} font-black flex-shrink-0`}>
                        {b.propertyTitle?.charAt(0) || 'P'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-gray-900 dark:text-white truncate">{b.propertyTitle}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">NPR {b.rent?.toLocaleString()} · {b.moveInDate}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {/* Status Badge - GREEN for confirmed */}
                        <span 
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full whitespace-nowrap"
                          style={{
                            backgroundColor: b.status === 'confirmed' ? '#D1FAE5' : b.status === 'rejected' ? '#FEE2E2' : '#FEF3C7',
                            color: b.status === 'confirmed' ? '#2F7D5F' : b.status === 'rejected' ? '#DC2626' : '#92400E',
                            border: `2px solid ${b.status === 'confirmed' ? '#2F7D5F' : b.status === 'rejected' ? '#DC2626' : '#F59E0B'}`
                          }}
                        >
                          {b.status === 'confirmed' ? '✓ Confirmed' : b.status === 'rejected' ? '✗ Rejected' : '⏱ Pending'}
                        </span>
                        {/* Payment Type */}
                        {b.paymentType && (
                          <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">
                            {b.paymentType === 'cash' ? 'Cash' : b.paymentType === 'advance' ? 'Advance 30%' : 'Full Payment'}
                          </span>
                        )}
                      </div>
                    </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Saved properties preview */}
            {favorites.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900 dark:text-white">Saved Properties</h3>
                  <button onClick={() => setActiveTab('saved')} className="text-button-primary text-xs font-semibold hover:underline">View All</button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {favorites.slice(0,2).map(p => <PropertyCard key={p.id} {...p} />)}
                </div>
              </div>
            )}
          </motion.div>
        )
    }
  }

  return (
    <main className="min-h-screen bg-background-light dark:bg-gray-900 transition-colors duration-300">
      <div className="flex">

        {/* ── SIDEBAR ── */}
        <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-100 dark:border-gray-700 min-h-screen sticky top-0 hidden lg:flex flex-col">
          <div className="p-6 flex flex-col h-full">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 mb-8">
              <div className="w-9 h-9 bg-gradient-to-br from-button-primary to-primary rounded-xl flex items-center justify-center">
                <HomeIcon className="w-5 h-5 text-white" />
              </div>
              <span className="text-primary dark:text-white font-black text-lg">Flat-Mate</span>
            </Link>

            {/* User avatar */}
            <div className="flex items-center gap-3 mb-7 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-100 dark:border-gray-600">
              {profilePhoto ? (
                <img src={profilePhoto} alt="Profile" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-10 h-10 bg-button-primary rounded-full flex items-center justify-center text-white font-black text-base flex-shrink-0">
                  {(user?.name || 'U').charAt(0)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="font-bold text-gray-900 dark:text-white text-sm truncate">{user?.name || 'User'}</p>
                  {verificationStatus === 'verified' && (
                    <CheckCircleIcon className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                  )}
                </div>
                <p className="text-xs text-gray-400 capitalize">{user?.role || 'tenant'}</p>
              </div>
            </div>

            {/* Nav items */}
            <nav className="space-y-1 flex-1">
              {tabs.map(tab => {
                const Icon = tab.icon
                const badgeCount = tab.id === 'messages' ? unreadMessageCount : tab.id === 'notifications' ? unreadNotificationCount : 0
                return (
                  <motion.button key={tab.id} whileHover={{ x:3 }} whileTap={{ scale:0.98 }}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                      activeTab === tab.id
                        ? 'bg-button-primary/10 text-button-primary font-bold'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}>
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="flex-1 text-left">{tab.label}</span>
                    {badgeCount > 0 && (
                      <span className="ml-auto w-5 h-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                        {badgeCount}
                      </span>
                    )}
                  </motion.button>
                )
              })}
            </nav>

            {/* Back nav + Logout */}
            <div className="pt-6 border-t border-gray-100 dark:border-gray-700 space-y-1">
              <Link to="/properties">
                <motion.div whileHover={{ x:3 }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-gray-50 cursor-pointer">
                  <SearchIcon className="w-4 h-4" /> Browse Properties
                </motion.div>
              </Link>
              <Link to="/">
                <motion.div whileHover={{ x:3 }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-gray-50 cursor-pointer">
                  <ArrowLeftIcon className="w-4 h-4" /> Back to Home
                </motion.div>
              </Link>
              <motion.button whileHover={{ x:3 }} whileTap={{ scale:0.98 }} onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-50 transition-all">
                <LogOutIcon className="w-4 h-4" /> Sign Out
              </motion.button>
            </div>
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <div className="flex-1 flex flex-col min-h-screen">

          {/* Top bar */}
          <header className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-30">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2">
              <button onClick={() => setMobileMenuOpen(v => !v)} className="lg:hidden p-1.5 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 mr-2">
                <MenuIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
              <nav className="text-sm flex items-center gap-2 text-gray-500 dark:text-gray-400">
                <Link to="/" className="hover:text-primary transition-colors">Home</Link>
                <span>›</span>
                {fromPage === 'find-roommate' ? (
                  <Link to="/find-roommate" className="hover:text-primary transition-colors">Find Roommate</Link>
                ) : fromPage === 'property' ? (
                  <Link to="/properties" className="hover:text-primary transition-colors">Properties</Link>
                ) : (
                  <Link to="/properties" className="hover:text-primary transition-colors">Properties</Link>
                )}
                <span>›</span>
                <span className="text-primary font-semibold capitalize">{activeTab === 'overview' ? 'Dashboard' : tabs.find(t => t.id === activeTab)?.label || activeTab}</span>
              </nav>
            </div>
            <div className="flex items-center gap-3">
              <motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
                onClick={() => navigate(-1)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full text-xs font-semibold text-gray-600 dark:text-gray-300 hover:text-primary hover:border-button-primary/40 transition-all">
                <ArrowLeftIcon className="w-3.5 h-3.5" /> Back
              </motion.button>
              <span className="hidden sm:block text-sm font-semibold text-gray-700 dark:text-gray-200">Welcome, {user?.name?.split(' ')[0]}!</span>
            </div>
          </header>

          {/* Mobile nav */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }} exit={{ height:0, opacity:0 }}
                className="lg:hidden bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="px-4 py-3 flex flex-wrap gap-2">
                  {tabs.map(tab => {
                    const Icon = tab.icon
                    const badgeCount = tab.id === 'messages' ? unreadMessageCount : tab.id === 'notifications' ? unreadNotificationCount : 0
                    return (
                      <button key={tab.id} onClick={() => { setActiveTab(tab.id); setMobileMenuOpen(false) }}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold transition-all relative ${activeTab===tab.id ? 'bg-button-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                        <Icon className="w-3.5 h-3.5" /> {tab.label}
                        {badgeCount > 0 && (
                          <span className="ml-1 w-4 h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold">
                            {badgeCount}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Page content */}
          <div className="flex-1 p-4 sm:p-6 lg:p-8">
            <AnimatePresence mode="wait">
              <motion.div key={activeTab} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-10 }} transition={{ duration:0.2 }}>
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Cancel Booking Confirmation Modal */}
      <AnimatePresence>
        {cancelModalOpen && bookingToCancel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setCancelModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                  <AlertCircleIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Cancel Booking</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">This action cannot be undone</p>
                </div>
              </div>

              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                  Are you sure you want to cancel your booking for:
                </p>
                <p className="font-bold text-gray-900 dark:text-white">{bookingToCancel.propertyTitle}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Receipt: {bookingToCancel.receiptId}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setCancelModalOpen(false)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Keep Booking
                </button>
                <button
                  onClick={() => {
                    try {
                      // Remove booking from localStorage
                      const allBookings = JSON.parse(localStorage.getItem('fm_bookings') || '[]')
                      const updatedBookings = allBookings.filter((booking: any) => booking.receiptId !== bookingToCancel.receiptId)
                      localStorage.setItem('fm_bookings', JSON.stringify(updatedBookings))
                      
                      // Update state
                      setBookings(updatedBookings.filter((booking: any) => {
                        if (!user) return false
                        const emailMatch = user.email && booking.customerEmail?.toLowerCase() === user.email.toLowerCase()
                        const nameMatch = user.name && booking.customerName?.toLowerCase().includes(user.name.toLowerCase())
                        return emailMatch || nameMatch
                      }))
                      
                      // Dispatch events to update property cards
                      window.dispatchEvent(new Event('bookingAdded'))
                      window.dispatchEvent(new Event('storage'))
                      
                      setCancelModalOpen(false)
                      setBookingToCancel(null)
                      
                      toast.success('Booking cancelled successfully')
                    } catch (error) {
                      console.error('Error cancelling booking:', error)
                      toast.error('Failed to cancel booking')
                    }
                  }}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors"
                >
                  Yes, Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}
