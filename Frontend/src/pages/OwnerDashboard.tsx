/**
 * OWNER DASHBOARD - Main dashboard interface for property owners/landlords
 * 
 * PURPOSE:
 * - Central management hub for property owners to manage listings, tenants, and bookings
 * - Provides analytics, messaging, and property management tools
 * 
 * KEY FEATURES:
 * 1. Overview: Revenue charts, property stats, recent bookings, and quick actions
 * 2. Properties: CRUD operations for property listings (connected to propertyAPI)
 * 3. Tenants: Manage current tenants, block/remove tenants, view tenant details
 * 4. Applications: Review and approve/reject tenant applications
 * 5. Messages: Real-time chat with tenants (connected to chatStorage API)
 * 6. Notifications: Alerts for new bookings, applications, and inquiries
 * 7. Settings: Profile management with photo upload, password change, notification preferences
 * 
 * DATA FLOW:
 * - Auth: useAuth() hook provides user data and logout function
 * - Properties: propertyAPI.ts handles CRUD operations with backend
 * - Messages: chatStorage.ts API handles chat operations
 * - Profile: localStorage stores profile data under key `fm_owner_profile_${email}`
 * - Tenants: localStorage stores tenant data under key `fm_owner_tenants`
 * - Bookings: localStorage stores booking data under key `fm_bookings`
 * 
 * BACKEND CONNECTIONS:
 * - GET /api/properties?ownerName=X - Fetches owner's properties
 * - POST /api/properties - Creates new property listing
 * - PUT /api/properties/:id - Updates existing property
 * - DELETE /api/properties/:id - Deletes property
 * - GET /api/messages/chats - Fetches all conversations
 * - POST /api/messages/messages - Sends messages to tenants
 * 
 * COMPONENT STRUCTURE:
 * - OwnerSettingsPanel: Nested component for profile/settings management
 * - PropertyCard: Displays individual property with edit/delete actions
 * - TenantCard: Shows tenant info with block/remove options
 * - Main Dashboard: Tab-based navigation with collapsible sidebar
 * 
 * STATE MANAGEMENT:
 * - properties: Fetched from backend, auto-refreshes every 5s for status updates
 * - tenants: Stored in localStorage, synced across sessions
 * - applications: Mock data for tenant applications
 * - bookings: Stored in localStorage, shared with tenant dashboard
 * - notifs: Stored in localStorage under `fm_owner_notifs`
 */

// src/pages/OwnerDashboard.tsx â€” PROFESSIONAL REBUILD
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  HomeIcon, UsersIcon, BuildingIcon, SettingsIcon, LogOutIcon, TrendingUpIcon,
  BellIcon, MessageCircleIcon, CalendarIcon, DollarSignIcon, CheckCircleIcon,
  XIcon, SearchIcon, PlusIcon, FilterIcon, ChevronDownIcon, StarIcon,
  EyeIcon, HeartIcon, MailIcon, PhoneIcon, MapPinIcon, RefreshCcwIcon,
  MenuIcon, TrashIcon, EditIcon, ArrowUpIcon, ArrowDownIcon,
  FileTextIcon, BarChart3Icon, ActivityIcon, LockIcon, UserIcon, CameraIcon,
  CheckIcon, ChevronRightIcon, ShieldCheckIcon, AlertCircleIcon, FlagIcon,
  SendIcon, ImageIcon, PaperclipIcon, SmileIcon, MoreVerticalIcon,
  BedDoubleIcon, BathIcon, PackageIcon, ArchiveIcon, VolumeXIcon, UserCheckIcon,
  ClockIcon, AlertTriangleIcon, TrendingDownIcon, CheckSquareIcon, RefreshCwIcon,
  ArrowLeftIcon, InfoIcon, CheckCheckIcon, VideoIcon, MicIcon, KeyRoundIcon, GlobeIcon,
  SunIcon, MoonIcon, BellRingIcon, HistoryIcon, CreditCardIcon, ShieldAlertIcon,
  CrownIcon, MessageSquareIcon, ZapIcon,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { toast } from '../utils/toast'
import { getChats, getOrCreateChat, sendMessage, markChatAsSeen, Chat, ChatMessage } from '../utils/chatStorage'
import { getProperties, createProperty, updateProperty, deleteProperty, Property } from '../utils/propertyAPI'
import { OwnerHistorySection } from '../components/OwnerHistorySection'

import { BACKEND_URL } from '../config/api'

// â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const ls     = (k: string, fb = '[]') => { try { return JSON.parse(localStorage.getItem(k) || fb) } catch { return JSON.parse(fb) } }
const setLS  = (k: string, v: any)   => { try { localStorage.setItem(k, JSON.stringify(v)) } catch {} }
const fmtNPR = (n: number) => `NPR ${n.toLocaleString()}`
const daysSince = (d: string) => {
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  return `${diff}d ago`
}

// â”€â”€â”€ Soft pastel tokens â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const PASTELS = {
  blue:   { bg: 'bg-blue-50',   border: 'border-blue-100',   icon: 'bg-blue-100 text-blue-600',    val: 'text-blue-700'   },
  pink:   { bg: 'bg-pink-50',   border: 'border-pink-100',   icon: 'bg-pink-100 text-pink-600',    val: 'text-pink-700'   },
  amber:  { bg: 'bg-amber-50',  border: 'border-amber-100',  icon: 'bg-amber-100 text-amber-600',  val: 'text-amber-700'  },
  green:  { bg: 'bg-green-50',  border: 'border-green-100',  icon: 'bg-green-100 text-green-600',  val: 'text-green-700'  },
  violet: { bg: 'bg-violet-50', border: 'border-violet-100', icon: 'bg-violet-100 text-violet-600',val: 'text-violet-700' },
  teal:   { bg: 'bg-teal-50',   border: 'border-teal-100',   icon: 'bg-teal-100 text-teal-600',    val: 'text-teal-700'   },
}

// â”€â”€â”€ Mock Data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString().split('T')[0]

const INIT_PROPERTIES: any[] = []
const INIT_TENANTS: any[] = [
  { id: 't1', firstName: 'Anita',  lastName: 'Thapa',    email: 'anita@example.com',  phone: '+977 9801000001', property: 'Modern 2BHK Apartment', propId: 'p1', rentDue: daysAgo(-5),  status: 'active',  paid: true,  joinedDate: daysAgo(45), lastAccess: daysAgo(0), reports: 0, blocked: false, muted: false, archived: false },
  { id: 't2', firstName: 'Bikash', lastName: 'Shrestha', email: 'bikash@example.com', phone: '+977 9801000002', property: 'Spacious 3BHK Flat',    propId: 'p2', rentDue: daysAgo(-2),  status: 'active',  paid: false, joinedDate: daysAgo(30), lastAccess: daysAgo(1), reports: 0, blocked: false, muted: false, archived: false },
  { id: 't3', firstName: 'Sita',   lastName: 'Gurung',   email: 'sita@example.com',   phone: '+977 9801000003', property: 'Cozy Studio Room',      propId: 'p3', rentDue: daysAgo(-10), status: 'pending', paid: false, joinedDate: daysAgo(3),  lastAccess: daysAgo(2), reports: 1, blocked: false, muted: false, archived: false },
]
const INIT_APPLICATIONS: any[] = [
  { id: 'app1', name: 'Rajan Pradhan', phone: '+977 9812345678', propId: 'p1', propTitle: 'Modern 2BHK Apartment', date: daysAgo(1), status: 'pending', message: 'I am a working professional looking for a long-term stay. Can we discuss terms?' },
  { id: 'app2', name: 'Sunita Rai',    phone: '+977 9887654321', propId: 'p2', propTitle: 'Spacious 3BHK Flat',    date: daysAgo(3), status: 'pending', message: 'Family of 4, need a spacious place. We are very clean and responsible.' },
]
const MONTHLY_REV = [
  { m: 'Jan', revenue: 37000, expense: 12000 },
  { m: 'Feb', revenue: 45000, expense: 14000 },
  { m: 'Mar', revenue: 42000, expense: 13000 },
  { m: 'Apr', revenue: 52000, expense: 16000 },
  { m: 'May', revenue: 58000, expense: 15000 },
  { m: 'Jun', revenue: 67000, expense: 18000 },
]
const MOCK_INVOICES = [
  { id: 'INV-001', tenant: 'Anita Thapa',   property: 'Modern 2BHK',  amount: 25000, date: daysAgo(10), status: 'paid' },
  { id: 'INV-002', tenant: 'Bikash Shrestha',property: '3BHK Flat',   amount: 35000, date: daysAgo(5),  status: 'pending' },
  { id: 'INV-003', tenant: 'Sita Gurung',   property: 'Studio Room',  amount: 12000, date: daysAgo(3),  status: 'pending' },
  { id: 'INV-004', tenant: 'Anita Thapa',   property: 'Modern 2BHK',  amount: 25000, date: daysAgo(40), status: 'paid' },
]
// Reviews and reports will only show when actual user interactions occur
const MOCK_REVIEWS: any[] = []
const MOCK_REPORTS: any[] = []
const INIT_MESSAGES = [
  { id: 'm1', name: 'Anita Thapa',    avatar: 'AT', property: 'Modern 2BHK', lastMsg: 'Is the water heater fixed?',       time: '5m ago',  unread: 2, online: true,  conv: [{ from: 'them', text: 'Hi! I wanted to ask about the water heater.', time: 'Yesterday 3:00 PM' }, { from: 'them', text: 'Is the water heater fixed?', time: '5m ago' }] },
  { id: 'm2', name: 'Ram Bahadur',    avatar: 'RB', property: '3BHK Flat',   lastMsg: 'Can I schedule a visit tomorrow?', time: '1h ago',  unread: 1, online: true,  conv: [{ from: 'them', text: 'Hello, I saw your 3BHK listing.', time: '1h ago' }, { from: 'them', text: 'Can I schedule a visit tomorrow?', time: '1h ago' }] },
  { id: 'm3', name: 'Sita Gurung',    avatar: 'SG', property: 'Studio Room', lastMsg: 'Thank you for the quick response!', time: '2h ago',  unread: 0, online: false, conv: [{ from: 'me',   text: 'Hi Sita, the unit is available from Feb 1st.', time: '3h ago' }, { from: 'them', text: 'Thank you for the quick response!', time: '2h ago' }] },
  { id: 'm4', name: 'Priya Maharjan', avatar: 'PM', property: 'Modern 2BHK', lastMsg: 'Is parking included in rent?',      time: '1d ago',  unread: 0, online: false, conv: [{ from: 'them', text: 'Is parking included in rent?', time: '1d ago' }] },
]
const INIT_NOTIFS = [
  { id: 'n1', title: 'Rent Received',      msg: 'Anita Thapa paid rent for Modern 2BHK',       time: '2h ago',  ts: Date.now() - 7200000,   type: 'success', read: false },
  { id: 'n2', title: 'New Inquiry',        msg: 'Someone is interested in Spacious 3BHK Flat', time: '5h ago',  ts: Date.now() - 18000000,  type: 'info',    read: false },
  { id: 'n3', title: 'Booking Request',    msg: 'New booking request for Studio Room',          time: '1d ago',  ts: Date.now() - 86400000,  type: 'info',    read: true  },
  { id: 'n4', title: 'Maintenance Alert',  msg: 'Tenant reported water heater issue in 2BHK',  time: '2d ago',  ts: Date.now() - 172800000, type: 'warning', read: true  },
  { id: 'n5', title: 'New Review',         msg: 'Anita Thapa left a 5-star review',            time: '3d ago',  ts: Date.now() - 259200000, type: 'success', read: true  },
]

// â”€â”€â”€ Empty form â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const EMPTY_FORM = { 
  ownerName: '', 
  ownerContact: '', 
  ownerEmail: '', 
  title: '', 
  location: '', 
  latitude: null as number | null,
  longitude: null as number | null,
  rent: '', 
  type: 'Apartment', 
  beds: '1', 
  baths: '1', 
  area: '', 
  furnishing: 'Unfurnished', 
  parking: 'Available', 
  wifi: false, 
  description: '', 
  images: [] as string[],
  amenities: [] as string[],
  isPremium: false
}
const PROP_TYPES = ['Apartment', 'House', 'Flat', 'Studio', 'Room', 'Villa']
const FURNISHINGS = ['Unfurnished', 'Semi-furnished', 'Fully furnished']
const AMENITIES_LIST = ['WiFi', 'Parking', 'Balcony', 'CCTV', 'Generator', 'Water Purifier', 'Gas', 'Laundry', 'Gym', 'Swimming Pool', 'Garden', 'Elevator']

// â”€â”€â”€ Chart primitives â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function AreaChart({ data, h = 80 }: { data: typeof MONTHLY_REV; h?: number }) {
  const maxR = Math.max(...data.map(d => d.revenue))
  const W = 300
  const rPts = data.map((d, i) => `${(i / (data.length - 1)) * W},${h - (d.revenue / maxR) * h * 0.9}`)
  const ePts = data.map((d, i) => `${(i / (data.length - 1)) * W},${h - (d.expense / maxR) * h * 0.9}`)
  return (
    <svg viewBox={`0 0 ${W} ${h + 10}`} className="w-full" style={{ height: h + 20 }} preserveAspectRatio="none">
      <defs>
        <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#34d399" stopOpacity="0.35" /><stop offset="100%" stopColor="#34d399" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f87171" stopOpacity="0.25" /><stop offset="100%" stopColor="#f87171" stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.polygon points={`0,${h} ${rPts.join(' ')} ${W},${h}`} fill="url(#revGrad)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }} />
      <motion.polygon points={`0,${h} ${ePts.join(' ')} ${W},${h}`} fill="url(#expGrad)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.2 }} />
      <motion.polyline points={rPts.join(' ')} fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2, ease: 'easeOut' }} />
      <motion.polyline points={ePts.join(' ')} fill="none" stroke="#f87171" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4,3" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2, delay: 0.2, ease: 'easeOut' }} />
      {data.map((d, i) => (
        <motion.circle key={d.m} cx={(i / (data.length - 1)) * W} cy={h - (d.revenue / maxR) * h * 0.9} r="3.5" fill="white" stroke="#34d399" strokeWidth="2" initial={{ r: 0 }} animate={{ r: 3.5 }} transition={{ delay: 0.8 + i * 0.08 }}>
          <title>{d.m}: {fmtNPR(d.revenue)}</title>
        </motion.circle>
      ))}
    </svg>
  )
}

function BarChart({ data, color = '#86efac' }: { data: { label: string; value: number }[]; color?: string }) {
  const max = Math.max(...data.map(d => d.value))
  return (
    <div className="flex items-end gap-1.5 h-16 w-full">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div className="relative w-full flex flex-col justify-end" style={{ height: 52 }}>
            <motion.div initial={{ height: 0 }} animate={{ height: `${(d.value / max) * 52}px` }} transition={{ delay: i * 0.07, duration: 0.6, ease: [0.16, 1, 0.3, 1] }} className="w-full rounded-t-md" style={{ background: color, minHeight: 3 }} />
          </div>
          <span className="text-[9px] text-gray-400">{d.label}</span>
        </div>
      ))}
    </div>
  )
}

function DonutChart({ data, size = 90 }: { data: { label: string; value: number; color: string }[]; size?: number }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  let cum = -Math.PI / 2
  const r = 36, cx = 50, cy = 50
  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 100 100" style={{ width: size, height: size }} className="flex-shrink-0">
        {data.map((d, i) => {
          const sw = (d.value / total) * 2 * Math.PI
          const x1 = cx + r * Math.cos(cum), y1 = cy + r * Math.sin(cum)
          cum += sw
          const x2 = cx + r * Math.cos(cum), y2 = cy + r * Math.sin(cum)
          return <motion.path key={i} d={`M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${sw > Math.PI ? 1 : 0},1 ${x2},${y2} Z`} fill={d.color} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: i * 0.07, duration: 0.4 }} style={{ transformOrigin: `${cx}px ${cy}px` }}><title>{d.label}: {d.value}%</title></motion.path>
        })}
        <circle cx={cx} cy={cy} r={22} fill="white" />
        <text x={cx} y={cy + 4} textAnchor="middle" fontSize="9" fontWeight="700" fill="#374151">{total}%</text>
      </svg>
      <div className="flex-1 space-y-1.5">
        {data.map((d, i) => <div key={i} className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} /><span className="text-xs text-gray-500 flex-1">{d.label}</span><span className="text-xs font-semibold text-gray-700">{d.value}%</span></div>)}
      </div>
    </div>
  )
}

function ProgressBar({ label, value, color, max = 100 }: { label: string; value: number; color: string; max?: number }) {
  return (
    <div className="mb-3">
      <div className="flex justify-between mb-1"><span className="text-xs text-gray-500">{label}</span><span className="text-xs font-semibold text-gray-700">{value}%</span></div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <motion.div className="h-2 rounded-full" style={{ background: color }} initial={{ width: 0 }} animate={{ width: `${(value / max) * 100}%` }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} />
      </div>
    </div>
  )
}

function MiniCalendar() {
  const now = new Date(), y = now.getFullYear(), mo = now.getMonth(), today = now.getDate()
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const wdays = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
  const firstDay = new Date(y, mo, 1).getDay(), dim = new Date(y, mo + 1, 0).getDate()
  const cells: (number | null)[] = Array(firstDay).fill(null)
  for (let d = 1; d <= dim; d++) cells.push(d)
  return (
    <div>
      <div className="flex items-center justify-between mb-2"><span className="text-xs font-semibold text-gray-800">{months[mo]} {y}</span></div>
      <div className="grid grid-cols-7 gap-0.5 mb-1">{wdays.map((d, i) => <div key={i} className="text-[9px] text-gray-400 text-center font-medium">{d}</div>)}</div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((d, i) => <div key={i} className={`aspect-square flex items-center justify-center rounded-lg text-[10px] font-medium ${!d ? '' : d === today ? 'bg-button-primary text-white font-bold shadow-sm' : 'text-gray-600 hover:bg-gray-100 cursor-pointer'}`}>{d || ''}</div>)}
      </div>
    </div>
  )
}

// â”€â”€â”€ Stat Card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function StatCard({ icon: Icon, value, label, trend, pastel, sub, onClick }: any) {
  const p = PASTELS[pastel as keyof typeof PASTELS] || PASTELS.blue
  return (
    <motion.div whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(0,0,0,0.07)' }} onClick={onClick}
      className={`${p.bg} border ${p.border} rounded-2xl p-4 cursor-pointer transition-all`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 ${p.icon} rounded-xl flex items-center justify-center`}><Icon className="w-4 h-4" /></div>
        {trend !== undefined && <span className={`flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${trend >= 0 ? 'text-green-700 bg-green-100' : 'text-red-600 bg-red-100'}`}>{trend >= 0 ? <ArrowUpIcon className="w-2.5 h-2.5" /> : <ArrowDownIcon className="w-2.5 h-2.5" />}{Math.abs(trend)}%</span>}
      </div>
      <p className={`text-xl font-bold ${p.val}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
    </motion.div>
  )
}

// â”€â”€â”€ Add Property Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function AddPropertyModal({ onClose, onAdd, editingProperty }: { onClose: () => void; onAdd: (p: any) => void; editingProperty?: any }) {
  const [form, setForm] = useState(editingProperty || EMPTY_FORM)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)

  // Helper function to convert image to base64 without compression
  const convertImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve(e.target?.result as string);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const validate = (s: number) => {
    const e: Record<string, string> = {}
    if (s === 1) { 
      if (!form.title.trim()) {
        e.title = 'Title is required';
      } else if (/\d/.test(form.title)) {
        e.title = 'Property name cannot contain numbers';
      }
      
      if (!form.location.trim()) {
        e.location = 'Location is required';
      } else if (/^\d+$/.test(form.location.trim())) {
        e.location = 'Location cannot be only numbers';
      }
    }
    if (s === 2) { if (!form.rent || isNaN(+form.rent) || +form.rent < 5000) e.rent = 'Enter valid rent (min NPR 5,000)'; if (!form.area.trim()) e.area = 'Area is required' }
    setErrors(e); return Object.keys(e).length === 0
  }

  const next = () => { if (validate(step)) setStep(s => s + 1) }
  const prev = () => { setErrors({}); setStep(s => s - 1) }

  const handleSubmit = async () => {
    if (!validate(step)) return;
    setSaving(true);
    
    try {
      // Get current user info
      const userStr = localStorage.getItem('flatmate_user');
      const currentUser = userStr ? JSON.parse(userStr) : null;
      
      // Get user's MongoDB ID from backend
      let userId = currentUser?.id;
      if (!userId && currentUser?.email) {
        try {
          const userResponse = await fetch(`${BACKEND_URL}/api/users/email/${encodeURIComponent(currentUser.email)}`);
          if (userResponse.ok) {
            const userData = await userResponse.json();
            userId = userData.user.id || userData.user._id;
            console.log('Fetched user ID from backend:', userId);
          }
        } catch (error) {
          console.error('Error fetching user ID:', error);
        }
      }
      
      const propertyData = { 
        title: form.title, 
        location: form.location,
        latitude: form.latitude,
        longitude: form.longitude,
        rent: +form.rent, 
        beds: +form.beds, 
        baths: +form.baths, 
        type: form.type, 
        area: form.area, 
        furnishing: form.furnishing, 
        parking: form.parking, 
        wifi: form.wifi, 
        image: form.images[0] || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop',
        images: form.images.length > 0 ? form.images : ['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop'],
        description: form.description, 
        amenities: form.amenities,
        ownerName: currentUser?.name || 'Unknown Owner',
        ownerEmail: currentUser?.email || '',
        ownerId: userId || `owner${Date.now()}`,
        isPremium: form.isPremium || false
      };
      
      if (editingProperty) {
        // Update existing property in backend
        const updated = await updateProperty(editingProperty.id || editingProperty._id, propertyData);
        if (updated) {
          onAdd(updated);
          toast.success('Property updated successfully!');
        } else {
          toast.error('Failed to update property');
        }
      } else {
        // Create new property in backend
        const created = await createProperty(propertyData);
        if (created) {
          onAdd(created);
          
          // Notify admin via localStorage (for now)
          const adminNotifs = ls('fm_admin_notifs');
          setLS('fm_admin_notifs', [{ 
            id: Date.now().toString(), 
            type: 'new_property', 
            title: 'New Property Submitted', 
            msg: `${propertyData.ownerName} submitted: "${propertyData.title}" in ${propertyData.location}`, 
            time: 'Just now', 
            read: false, 
            propId: created.id 
          }, ...adminNotifs]);
          
          toast.success('Property submitted for admin review!', {
            style: {
              background: '#2F7D5F',
              color: 'white',
            },
          });
        } else {
          toast.error('Failed to create property');
        }
      }
      
      onClose();
    } catch (error) {
      console.error('Error submitting property:', error);
      toast.error('An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const toggleAmenity = (a: string) => setForm((f: any) => ({ ...f, amenities: f.amenities.includes(a) ? f.amenities.filter((x: string) => x !== a) : [...f.amenities, a] }))
  const STEPS = ['Basic Info', 'Details', 'Media & Review']

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black" onClick={onClose} />
      <motion.div 
        initial={{ opacity: 0, scale: 0.94, y: 20 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        exit={{ opacity: 0, scale: 0.94 }} 
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        onClick={(e) => e.stopPropagation()}
        className="relative bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden shadow-2xl z-10 flex flex-col">
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 text-base">{editingProperty ? 'Edit Property' : 'Add New Property'}</h3>
            <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"><XIcon className="w-4 h-4 text-gray-400" /></button>
          </div>
          {/* Step indicators */}
          <div className="flex items-center gap-2">
            {STEPS.map((s, i) => (
              <React.Fragment key={i}>
                <div className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${step > i + 1 ? 'text-green-600' : step === i + 1 ? 'text-button-primary font-bold' : 'text-gray-400'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${step > i + 1 ? 'bg-green-500 border-green-500 text-white' : step === i + 1 ? 'border-button-primary bg-button-primary text-white' : 'border-gray-300 text-gray-400'}`}>
                    {step > i + 1 ? <CheckIcon className="w-3 h-3" /> : i + 1}
                  </div>
                  <span className="hidden sm:block">{s}</span>
                </div>
                {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 rounded-full transition-colors ${step > i + 1 ? 'bg-green-400' : 'bg-gray-200'}`} />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                {[{ k: 'title', lbl: 'Property Title *', ph: 'e.g. Modern 2BHK in Thamel', type: 'text' }].map(f => (
                  <div key={f.k}>
                    <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{f.lbl}</label>
                    <input 
                      value={(form as any)[f.k]} 
                      onChange={e => {
                        const value = e.target.value;
                        // Prevent numbers in property title
                        if (f.k === 'title' && /\d/.test(value)) {
                          toast.error('Property name cannot contain numbers', {
                            style: { background: '#EF4444', color: 'white' }
                          });
                          return;
                        }
                        setForm({ ...form, [f.k]: value });
                      }} 
                      placeholder={f.ph} 
                      type={f.type}
                      className={`w-full px-3 py-2.5 border-2 rounded-xl text-sm focus:outline-none focus:border-button-primary transition-all ${errors[f.k] ? 'border-red-300 bg-red-50' : 'border-gray-200'}`} />
                    {errors[f.k] && <p className="text-red-500 text-[10px] mt-0.5">{errors[f.k]}</p>}
                  </div>
                ))}
                
                {/* Location Input */}
                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Location *</label>
                  <input 
                    value={form.location} 
                    onChange={e => {
                      const value = e.target.value;
                      // Prevent location from being only numbers
                      if (value.trim() && /^\d+$/.test(value.trim())) {
                        toast.error('Location cannot be only numbers', {
                          style: { background: '#EF4444', color: 'white' }
                        });
                        return;
                      }
                      setForm({ ...form, location: value });
                    }} 
                    placeholder="e.g. Thamel, Kathmandu" 
                    type="text"
                    className={`w-full px-3 py-2.5 border-2 rounded-xl text-sm focus:outline-none focus:border-button-primary transition-all ${errors.location ? 'border-red-300 bg-red-50' : 'border-gray-200'}`} />
                  {errors.location && <p className="text-red-500 text-[10px] mt-0.5">{errors.location}</p>}
                </div>

                {/* Location Picker */}
                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Pin Location on Map (Optional)</label>
                  <div className="flex gap-2 mb-2">
                    <button type="button" onClick={() => {
                      if (navigator.geolocation) {
                        toast.info('Getting your location...');
                        navigator.geolocation.getCurrentPosition(
                          (position) => {
                            setForm({ ...form, latitude: position.coords.latitude, longitude: position.coords.longitude });
                            toast('Location captured!', {
                              style: {
                                background: '#2F7D5F',
                                color: 'white',
                              },
                            });
                            // Trigger map update
                            const mapDiv = document.getElementById('property-location-map');
                            if (mapDiv) {
                              mapDiv.setAttribute('data-lat', position.coords.latitude.toString());
                              mapDiv.setAttribute('data-lng', position.coords.longitude.toString());
                              mapDiv.dispatchEvent(new Event('locationchange'));
                            }
                          },
                          (error) => {
                            toast.error('Could not get your location');
                            console.error('Geolocation error:', error);
                          }
                        );
                      } else {
                        toast.error('Geolocation is not supported by your browser');
                      }
                    }} className="flex-1 py-2 px-3 bg-green-500 text-white rounded-xl text-xs font-bold hover:bg-green-600 transition-all flex items-center justify-center gap-1">
                      <MapPinIcon className="w-3.5 h-3.5" />
                      Use My Location (GPS)
                    </button>
                    {form.latitude && form.longitude && (
                      <button type="button" onClick={() => {
                        setForm({ ...form, latitude: null, longitude: null });
                        toast.info('Location cleared');
                      }} className="py-2 px-3 bg-red-500 text-white rounded-xl text-xs font-bold hover:bg-red-600 transition-all flex items-center justify-center gap-1">
                        <XIcon className="w-3.5 h-3.5" />
                        Clear
                      </button>
                    )}
                  </div>
                  
                  {/* Interactive Map Container */}
                  <div 
                    className="relative w-full h-64 bg-gray-100 rounded-xl overflow-hidden border-2 border-gray-200"
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <div 
                      id="property-location-map" 
                      className="w-full h-full"
                      data-lat={form.latitude?.toString() || '27.7172'}
                      data-lng={form.longitude?.toString() || '85.3240'}
                      ref={(el) => {
                        if (!el) return;
                        
                        // Check if already initialized
                        if (el.hasAttribute('data-map-initialized')) return;
                        
                        // Mark as initialized
                        el.setAttribute('data-map-initialized', 'true');
                        
                        // Initialize Leaflet map
                        const initMap = () => {
                          if (!(window as any).L) {
                            // Load Leaflet CSS
                            if (!document.querySelector('link[href*="leaflet.css"]')) {
                              const link = document.createElement('link');
                              link.rel = 'stylesheet';
                              link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
                              document.head.appendChild(link);
                            }
                            
                            // Load Leaflet JS
                            const script = document.createElement('script');
                            script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
                            script.onload = () => setTimeout(initMap, 100);
                            document.body.appendChild(script);
                            return;
                          }
                          
                          const L = (window as any).L;
                          
                          // Check if map container already has a map
                          if ((el as any)._leaflet_id) {
                            return;
                          }
                          
                          const lat = parseFloat(el.getAttribute('data-lat') || '27.7172');
                          const lng = parseFloat(el.getAttribute('data-lng') || '85.3240');
                          
                          try {
                            // Create map
                            const map = L.map(el, {
                              center: [lat, lng],
                              zoom: 15,
                              zoomControl: true,
                              scrollWheelZoom: true
                            });
                            
                            // Add OpenStreetMap tiles
                            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                              attribution: 'Â© OpenStreetMap contributors',
                              maxZoom: 19
                            }).addTo(map);
                            
                            // Custom marker icon
                            const markerIcon = L.divIcon({
                              html: `<div style="width:32px;height:32px;background:linear-gradient(135deg,#ef4444,#dc2626);border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 4px 12px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;">
                                <div style="transform:rotate(45deg);font-size:16px;">ðŸ“</div>
                              </div>`,
                              className: '',
                              iconSize: [32, 32],
                              iconAnchor: [16, 32]
                            });
                            
                            // Add draggable marker
                            const marker = L.marker([lat, lng], {
                              icon: markerIcon,
                              draggable: true
                            }).addTo(map);
                            
                            // Update coordinates when marker is dragged
                            marker.on('dragend', function(e: any) {
                              const position = e.target.getLatLng();
                              setForm((prev: typeof form) => ({ 
                                ...prev, 
                                latitude: position.lat, 
                                longitude: position.lng 
                              }));
                              toast.success('ðŸ“ Location updated by dragging!');
                            });
                            
                            // Update marker when clicking on map
                            map.on('click', function(e: any) {
                              marker.setLatLng(e.latlng);
                              setForm((prev: typeof form) => ({ 
                                ...prev, 
                                latitude: e.latlng.lat, 
                                longitude: e.latlng.lng 
                              }));
                              toast.success('Location pinned on map!', {
                                style: {
                                  background: '#2F7D5F',
                                  color: 'white',
                                },
                              });
                            });
                            
                            // Listen for location changes from GPS button
                            el.addEventListener('locationchange', () => {
                              const newLat = parseFloat(el.getAttribute('data-lat') || '27.7172');
                              const newLng = parseFloat(el.getAttribute('data-lng') || '85.3240');
                              marker.setLatLng([newLat, newLng]);
                              map.setView([newLat, newLng], 15);
                            });
                          } catch (error) {
                            console.error('Error initializing map:', error);
                          }
                        };
                        
                        initMap();
                      }}
                    />
                    <div className="absolute top-2 left-2 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-lg text-[10px] font-semibold text-gray-700 z-[1000] border border-gray-200">
                      ðŸ’¡ Drag the pin or click anywhere to set location
                    </div>
                  </div>
                  
                  {form.latitude && form.longitude ? (
                    <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
                      <CheckCircleIcon className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-[11px] text-green-700 font-bold mb-0.5">âœ“ Location Set Successfully</p>
                        <p className="text-[10px] text-green-600">
                          Coordinates: {form.latitude.toFixed(6)}, {form.longitude.toFixed(6)}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
                      <InfoIcon className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <p className="text-[10px] text-blue-700">
                        Set your property location to help tenants find it easily. You can use GPS, drag the pin, or click on the map.
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Property Type *</label>
                  <div className="grid grid-cols-3 gap-2">{PROP_TYPES.map(t => <button key={t} type="button" onClick={() => setForm({ ...form, type: t })} className={`py-2 px-2 rounded-xl border-2 text-xs font-semibold transition-all ${form.type === t ? 'bg-button-primary text-white border-button-primary' : 'border-gray-200 text-gray-600 hover:border-button-primary/50'}`}>{t}</button>)}</div>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Description</label>
                  <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Describe your property..." className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-button-primary resize-none transition-all" />
                </div>
              </motion.div>
            )}
            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Monthly Rent *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-semibold">NPR</span>
                      <input 
                        type="number" 
                        min="5000" 
                        value={form.rent} 
                        onChange={e => {
                          // Allow any input while typing, validation happens on blur
                          setForm({ ...form, rent: e.target.value });
                        }} 
                        onBlur={e => {
                          const value = parseInt(e.target.value);
                          if (e.target.value && (isNaN(value) || value < 5000)) {
                            toast.error('Minimum rent must be NPR 5,000', {
                              style: { background: '#EF4444', color: 'white' }
                            });
                            setForm({ ...form, rent: '5000' });
                          }
                        }} 
                        placeholder="25000" 
                        className={`w-full pl-14 pr-3 py-2.5 border-2 rounded-xl text-sm focus:outline-none focus:border-button-primary transition-all ${errors.rent ? 'border-red-300' : 'border-gray-200'}`} 
                      />
                    </div>
                    {errors.rent && <p className="text-red-500 text-[10px] mt-0.5">{errors.rent}</p>}
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Area *</label>
                    <input value={form.area} onChange={e => setForm({ ...form, area: e.target.value })} placeholder="850 sqft" className={`w-full px-3 py-2.5 border-2 rounded-xl text-sm focus:outline-none focus:border-button-primary transition-all ${errors.area ? 'border-red-300' : 'border-gray-200'}`} />
                    {errors.area && <p className="text-red-500 text-[10px] mt-0.5">{errors.area}</p>}
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Bedrooms</label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => {
                          const dropdown = document.getElementById('bedrooms-dropdown');
                          if (dropdown) dropdown.classList.toggle('hidden');
                        }}
                        className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-button-primary bg-white text-left flex items-center justify-between hover:border-button-primary/50 transition-all"
                      >
                        <span>{form.beds}</span>
                        <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                      </button>
                      <div
                        id="bedrooms-dropdown"
                        className="hidden absolute z-50 mt-1 w-full bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden"
                        onMouseLeave={(e) => {
                          const dropdown = e.currentTarget;
                          setTimeout(() => dropdown.classList.add('hidden'), 100);
                        }}
                      >
                        {['1', '2', '3', '4', '5+'].map(n => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => {
                              setForm({ ...form, beds: n });
                              document.getElementById('bedrooms-dropdown')?.classList.add('hidden');
                            }}
                            className="w-full px-3 py-2 text-left text-sm transition-colors text-gray-700 hover:bg-button-primary/10 hover:text-button-primary"
                          >
                            {form.beds === n && <CheckIcon className="w-3 h-3 inline mr-2 text-button-primary" />}
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Bathrooms</label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => {
                          const dropdown = document.getElementById('bathrooms-dropdown');
                          if (dropdown) dropdown.classList.toggle('hidden');
                        }}
                        className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-button-primary bg-white text-left flex items-center justify-between hover:border-button-primary/50 transition-all"
                      >
                        <span>{form.baths}</span>
                        <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                      </button>
                      <div
                        id="bathrooms-dropdown"
                        className="hidden absolute z-50 mt-1 w-full bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden"
                        onMouseLeave={(e) => {
                          const dropdown = e.currentTarget;
                          setTimeout(() => dropdown.classList.add('hidden'), 100);
                        }}
                      >
                        {['1', '2', '3', '4+'].map(n => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => {
                              setForm({ ...form, baths: n });
                              document.getElementById('bathrooms-dropdown')?.classList.add('hidden');
                            }}
                            className="w-full px-3 py-2 text-left text-sm transition-colors text-gray-700 hover:bg-button-primary/10 hover:text-button-primary"
                          >
                            {form.baths === n && <CheckIcon className="w-3 h-3 inline mr-2 text-button-primary" />}
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Furnishing</label>
                  <div className="flex gap-2">{FURNISHINGS.map(f => <button key={f} type="button" onClick={() => setForm({ ...form, furnishing: f })} className={`flex-1 py-2 px-2 rounded-xl border-2 text-xs font-semibold transition-all ${form.furnishing === f ? 'bg-button-primary text-white border-button-primary' : 'border-gray-200 text-gray-600 hover:border-button-primary/50'}`}>{f}</button>)}</div>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Parking</label>
                  <div className="flex gap-2">{['Available', 'Not available'].map(p => <button key={p} type="button" onClick={() => setForm({ ...form, parking: p })} className={`flex-1 py-2 rounded-xl border-2 text-xs font-semibold transition-all ${form.parking === p ? 'bg-button-primary text-white border-button-primary' : 'border-gray-200 text-gray-600'}`}>{p}</button>)}</div>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Amenities</label>
                  <div className="flex flex-wrap gap-1.5">{AMENITIES_LIST.map(a => <button key={a} type="button" onClick={() => toggleAmenity(a)} className={`py-1 px-2.5 rounded-full text-[11px] font-semibold border-2 transition-all ${form.amenities.includes(a) ? 'bg-button-primary text-white border-button-primary' : 'border-gray-200 text-gray-600 hover:border-button-primary/40'}`}>{a}</button>)}</div>
                </div>
              </motion.div>
            )}
            {step === 3 && (
              <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Upload Property Images (Max 10)</label>
                  
                  {/* Drag and Drop Zone */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.add('border-button-primary', 'bg-button-primary/5');
                    }}
                    onDragLeave={(e) => {
                      e.currentTarget.classList.remove('border-button-primary', 'bg-button-primary/5');
                    }}
                    onDrop={async (e) => {
                      e.preventDefault();
                      e.currentTarget.classList.remove('border-button-primary', 'bg-button-primary/5');
                      const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
                      if (files.length + form.images.length > 10) {
                        toast.error('Maximum 10 images allowed');
                        return;
                      }
                      toast.info('Uploading images...');
                      for (const file of files) {
                        try {
                          const base64 = await convertImageToBase64(file);
                          setForm((prev: typeof form) => ({ ...prev, images: [...prev.images, base64] }));
                        } catch (error) {
                          console.error('Error uploading image:', error);
                          toast.error('Failed to upload image');
                        }
                      }
                      toast.success('Images uploaded successfully!');
                    }}
                    className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center transition-all cursor-pointer hover:border-button-primary hover:bg-button-primary/5"
                  >
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      id="property-images"
                      className="hidden"
                      onChange={async (e) => {
                        const files = Array.from(e.target.files || []);
                        if (files.length + form.images.length > 10) {
                          toast.error('Maximum 10 images allowed');
                          return;
                        }
                        toast.info('Uploading images...');
                        for (const file of files) {
                          try {
                            const base64 = await convertImageToBase64(file);
                            setForm((prev: typeof form) => ({ ...prev, images: [...prev.images, base64] }));
                          } catch (error) {
                            console.error('Error uploading image:', error);
                            toast.error('Failed to upload image');
                          }
                        }
                        toast.success('Images uploaded successfully!');
                      }}
                    />
                    <label htmlFor="property-images" className="cursor-pointer">
                      <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-sm font-semibold text-gray-700 mb-1">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-gray-400">
                        PNG, JPG, JPEG up to 10 images (original quality)
                      </p>
                    </label>
                  </div>

                  {/* Image Preview Grid */}
                  {form.images.length > 0 && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-semibold text-gray-600">
                          {form.images.length} image{form.images.length > 1 ? 's' : ''} uploaded
                        </p>
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, images: [] })}
                          className="text-xs text-red-500 hover:text-red-700 font-medium"
                        >
                          Clear all
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {form.images.map((img: string, idx: number) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="relative group aspect-square rounded-lg overflow-hidden border-2 border-gray-200"
                          >
                            <img
                              src={img}
                              alt={`Property ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                            {idx === 0 && (
                              <div className="absolute top-1 left-1 bg-button-primary text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                                Main
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setForm((prev: typeof form) => ({
                                  ...prev,
                                  images: prev.images.filter((_: string, i: number) => i !== idx)
                                }));
                              }}
                              className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <XIcon className="w-3 h-3" />
                            </button>
                          </motion.div>
                        ))}
                      </div>
                      <p className="text-[10px] text-gray-400 mt-2">
                        ðŸ’¡ First image will be used as the main property image
                      </p>
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 rounded-xl p-4 space-y-1.5">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Summary</p>
                  {[['Title', form.title], ['Location', form.location], ['Type', form.type], ['Rent', form.rent ? fmtNPR(+form.rent) : 'â€”'], ['Area', form.area], ['Beds/Baths', `${form.beds} / ${form.baths}`], ['Furnishing', form.furnishing], ['Images', `${form.images.length} uploaded`]].map(([l, v]) => (
                    <div key={l} className="flex justify-between text-xs"><span className="text-gray-400">{l}</span><span className="font-medium text-gray-800 truncate max-w-[60%] text-right">{v || 'â€”'}</span></div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          {step > 1 && <button onClick={prev} className="px-4 py-2.5 border-2 border-gray-200 text-gray-600 font-medium rounded-xl text-sm">Back</button>}
          {step < 3 ? (
            <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.97 }} onClick={next} className="flex-1 py-2.5 bg-button-primary text-white font-bold rounded-xl text-sm hover:bg-button-primary/90 transition-all">Continue</motion.button>
          ) : (
            <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.97 }} onClick={handleSubmit} disabled={saving} className="flex-1 py-2.5 bg-button-primary text-white font-bold rounded-xl text-sm hover:bg-button-primary/90 disabled:opacity-60 transition-all flex items-center justify-center gap-2">
              {saving && <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }} className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full" />}
              {saving ? 'Submitting...' : 'Submit Property'}
            </motion.button>
          )}
        </div>
      </motion.div>
    </div>
  )
}

// â”€â”€â”€ Application Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ApplicationModal({ app, onClose, onApprove, onReject }: any) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} className="absolute inset-0 bg-black" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} className="relative bg-white rounded-2xl w-full max-w-sm shadow-2xl z-10 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900 text-sm">Tenant Application</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><XIcon className="w-4 h-4 text-gray-400" /></button>
        </div>
        <div className="flex items-center gap-3 mb-4 p-3 bg-blue-50 rounded-xl border border-blue-100">
          <div className="w-10 h-10 bg-button-primary rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">{app.name.charAt(0)}</div>
          <div><p className="font-bold text-gray-900 text-sm">{app.name}</p><p className="text-xs text-gray-500">{app.phone}</p></div>
        </div>
        <div className="space-y-2 mb-4">
          <div className="bg-gray-50 rounded-xl p-2.5"><p className="text-[10px] text-gray-400 uppercase font-semibold">Property</p><p className="text-xs font-bold text-gray-900 mt-0.5">{app.propTitle}</p></div>
          <div className="bg-gray-50 rounded-xl p-2.5"><p className="text-[10px] text-gray-400 uppercase font-semibold">Message</p><p className="text-xs text-gray-600 mt-0.5">{app.message}</p></div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => { onReject(app.id); onClose() }} className="flex-1 py-2.5 border-2 border-red-100 text-red-600 font-semibold rounded-xl text-xs hover:bg-red-50 transition-all">Reject</button>
          <button onClick={() => { onApprove(app.id); onClose() }} className="flex-1 py-2.5 bg-button-primary text-white font-bold rounded-xl text-xs hover:bg-button-primary/90 transition-all">Approve</button>
        </div>
      </motion.div>
    </div>
  )
}

// â”€â”€â”€ Messenger Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function MessengerPanel({ activeConvId }: { activeConvId?: string }) {
  const { user } = useAuth()
  const [convs, setConvs] = useState<Chat[]>([])
  const [active, setActive] = useState<Chat | null>(null)
  const [input, setInput] = useState('')
  const [search, setSearch] = useState('')
  const [showInfo, setShowInfo] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const prevMessageCountRef = useRef(0)
  const shouldAutoScrollRef = useRef(true)

  useEffect(() => {
    // Only auto-scroll on initial load or when user sends a message
    if (!active?.messages) return;
    
    const messageCountIncreased = active.messages.length > prevMessageCountRef.current;
    
    // Only scroll if it's the first load or if we explicitly want to scroll
    if (prevMessageCountRef.current === 0 || (messageCountIncreased && shouldAutoScrollRef.current)) {
      setTimeout(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
    
    prevMessageCountRef.current = active.messages.length;
    shouldAutoScrollRef.current = false; // Disable auto-scroll after first time
  }, [active?.messages])

  useEffect(() => {
    const fetchChats = async () => {
      if (!user) return;
      const myChats = await getChats(user.name, 'owner');
      setConvs(myChats);
      setActive(prev => {
        if (!prev) return null;
        return myChats.find(c => c.id === prev.id) || prev;
      });
    };
    fetchChats();
    const int = setInterval(fetchChats, 3000);
    return () => clearInterval(int);
  }, [user]);

  useEffect(() => {
    if (activeConvId && convs.length > 0) {
      const found = convs.find(c => c.id === activeConvId)
      if (found) setActive(found)
    }
  }, [activeConvId, convs.length])

  useEffect(() => {
    const markSeen = async () => {
      if (active && user) {
        await markChatAsSeen(active.id, 'owner');
        
        // Immediately refresh conversations to update badge count
        const myChats = await getChats(user.name, 'owner');
        setConvs(myChats);
        
        // Update active conversation with fresh data
        const updated = myChats.find(c => c.id === active.id);
        if (updated) setActive(updated);
      }
    };
    markSeen();
  }, [active?.id, active?.messages?.length, user]);

  const send = async () => {
    if (!input.trim() || !active || !user) return;
    const txt = input;
    setInput('');
    shouldAutoScrollRef.current = true; // Enable auto-scroll when user sends a message
    await sendMessage(active.id, { text: txt, senderName: user.name, senderRole: 'owner' });
    
    // Send notification to tenant
    try {
      console.log('🔔 Attempting to send notification to tenant:', active.tenantName);
      
      // Fetch tenant email from backend using tenant name
      const tenantName = active.tenantName;
      if (tenantName) {
        const response = await fetch(`${BACKEND_URL}/api/users`);
        if (response.ok) {
          const data = await response.json();
          const users = data.users || data; // Handle both {users: []} and [] formats
          console.log('👥 Fetched users:', users.length);
          
          const tenant = users.find((u: any) => {
            const fullName = `${u.firstName} ${u.lastName}`.trim();
            console.log(`  Comparing: "${fullName}" with "${tenantName}"`);
            return fullName.toLowerCase() === tenantName.toLowerCase();
          });
          
          console.log('🔍 Found tenant:', tenant ? tenant.email : 'NOT FOUND');
          
          if (tenant && tenant.email) {
            const tenantEmail = tenant.email;
            
            // Check if tenant has notifications enabled
            const notifEnabled = localStorage.getItem(`fm_tenant_notify_messages_${tenantEmail}`) === 'true';
            console.log('🔔 Notifications enabled for tenant:', notifEnabled);
            console.log('🔑 LocalStorage key:', `fm_tenant_notify_messages_${tenantEmail}`);
            
            if (notifEnabled) {
              // Get existing tenant notifications
              const tenantNotifs = JSON.parse(localStorage.getItem(`fm_tenant_notifs_${tenantEmail}`) || '[]');
              console.log('📬 Existing notifications:', tenantNotifs.length);
              
              // Create notification
              const notification = {
                id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                type: 'message',
                title: 'New Message',
                message: `${user.name} has messaged you: "${txt.length > 50 ? txt.substring(0, 50) + '...' : txt}"`,
                senderName: user.name,
                messageText: txt,
                chatId: active.id,
                read: false,
                time: 'Just now',
                createdAt: new Date().toISOString()
              };
              
              console.log('✅ Created notification:', notification);
              
              // Add to beginning of array
              tenantNotifs.unshift(notification);
              
              // Save back to localStorage
              localStorage.setItem(`fm_tenant_notifs_${tenantEmail}`, JSON.stringify(tenantNotifs));
              console.log('💾 Saved notification to localStorage');
              
              // Dispatch event to notify tenant dashboard if it's open
              window.dispatchEvent(new CustomEvent('tenantNotification', { detail: notification }));
              console.log('📡 Dispatched notification event');
            } else {
              console.log('⚠️ Tenant has not enabled message notifications');
              console.log('⚠️ Please enable notifications in Tenant Dashboard > Settings > Notifications');
            }
          } else {
            console.log('❌ Tenant not found in database');
            console.log('❌ Available users:', users.map((u: any) => `${u.firstName} ${u.lastName}`).join(', '));
          }
        } else {
          console.error('❌ Failed to fetch users:', response.status);
        }
      }
    } catch (error) {
      console.error('❌ Error sending notification:', error);
    }
    
    const myChats = await getChats(user.name, 'owner');
    const updated = myChats.find(c => c.id === active.id);
    if (updated) setActive(updated);
  };

  const uploadFile = async (type: 'image' | 'video' | 'audio') => {
    if (!active || !user) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = type === 'image' ? 'image/*' : type === 'video' ? 'video/*' : 'audio/*';
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const url = URL.createObjectURL(file);
      await sendMessage(active.id, { [type]: url, senderName: user.name, senderRole: 'owner' });
      toast.success(`${type} sent!`);
      
      // Send notification to tenant
      try {
        const tenantName = active.tenantName;
        if (tenantName) {
          const response = await fetch(`${BACKEND_URL}/api/users`);
          if (response.ok) {
            const users = await response.json();
            const tenant = users.find((u: any) => {
              const fullName = `${u.firstName} ${u.lastName}`.trim();
              return fullName.toLowerCase() === tenantName.toLowerCase();
            });
            
            if (tenant && tenant.email) {
              const tenantEmail = tenant.email;
              const notifEnabled = localStorage.getItem(`fm_tenant_notify_messages_${tenantEmail}`) === 'true';
              
              if (notifEnabled) {
                const tenantNotifs = JSON.parse(localStorage.getItem(`fm_tenant_notifs_${tenantEmail}`) || '[]');
                const notification = {
                  id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                  type: 'message',
                  title: 'New Message',
                  message: `${user.name} sent you ${type === 'image' ? 'an image' : type === 'video' ? 'a video' : 'an audio file'}`,
                  senderName: user.name,
                  messageText: `[${type}]`,
                  chatId: active.id,
                  read: false,
                  time: 'Just now',
                  createdAt: new Date().toISOString()
                };
                tenantNotifs.unshift(notification);
                localStorage.setItem(`fm_tenant_notifs_${tenantEmail}`, JSON.stringify(tenantNotifs));
                window.dispatchEvent(new CustomEvent('tenantNotification', { detail: notification }));
              }
            }
          }
        }
      } catch (error) {
        console.error('Error sending notification:', error);
      }
      
      const myChats = await getChats(user.name, 'owner');
      const updated = myChats.find(c => c.id === active.id);
      if (updated) setActive(updated);
    };
    input.click();
  };

  const filtered = convs.filter(c => c.tenantName.toLowerCase().includes(search.toLowerCase()) || (c.propertyTitle && c.propertyTitle.toLowerCase().includes(search.toLowerCase())))
  const fmtTime = (d: string) => new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="flex h-[600px] bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className={`w-full md:w-80 border-r border-gray-100 flex flex-col flex-shrink-0 ${active ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tenants..." className="w-full pl-10 pr-3 py-2 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-button-primary/20 transition-all" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? <p className="p-8 text-center text-gray-400 text-sm">No chats found</p> : filtered.map(c => {
            const unread = c.messages.filter(m => m.senderRole !== 'owner' && !m.seen).length
            const lastMsg = c.messages[c.messages.length - 1]
            return (
              <motion.button key={c.id} onClick={() => setActive(c)} whileHover={{ backgroundColor: '#f9fafb' }}
                className={`w-full p-4 flex gap-3 text-left border-b border-gray-50 transition-all ${active?.id === c.id ? 'bg-button-primary/5 border-l-4 border-l-button-primary' : 'border-l-4 border-l-transparent'}`}>
                <div className="w-10 h-10 bg-gradient-to-br from-button-primary to-blue-400 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {c.tenantName.substring(0,2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="font-bold text-gray-900 text-sm truncate">{c.tenantName}</p>
                    <span className="text-[10px] text-gray-400 flex-shrink-0">{new Date(c.lastUpdated).toLocaleDateString()}</span>
                  </div>
                  {c.propertyTitle && <p className="text-[11px] text-button-primary font-medium truncate mb-1">{c.propertyTitle}</p>}
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500 truncate flex-1">{lastMsg?.text || (lastMsg ? 'Media' : 'Start messaging')}</p>
                    {unread > 0 && <span className="ml-2 w-5 h-5 bg-button-primary text-white text-[10px] rounded-full flex items-center justify-center font-bold flex-shrink-0">{unread}</span>}
                  </div>
                </div>
              </motion.button>
            )
          })}
        </div>
      </div>

      <div className={`flex-1 flex flex-col min-w-0 ${!active ? 'hidden md:flex' : 'flex'}`}>
        {!active ? (
          <div className="flex-1 flex items-center justify-center text-center p-8">
            <div>
              <MessageCircleIcon className="w-16 h-16 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-400 text-sm">Select a conversation</p>
            </div>
          </div>
        ) : (
          <>
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between bg-white shadow-sm z-10">
               <div className="flex items-center gap-3">
                 <button onClick={() => setActive(null)} className="md:hidden p-1 text-gray-400 hover:text-gray-600">
                   <ArrowLeftIcon className="w-5 h-5" />
                 </button>
                 <div className="w-10 h-10 bg-gradient-to-br from-button-primary to-blue-400 rounded-full flex items-center justify-center text-white font-bold text-sm">
                   {active.tenantName.substring(0,2).toUpperCase()}
                 </div>
                 <div>
                   <p className="font-bold text-gray-900 text-sm">{active.tenantName}</p>
                   {active.propertyTitle && <p className="text-xs text-button-primary font-medium">{active.propertyTitle}</p>}
                 </div>
               </div>
               <div className="flex items-center gap-1">
                 <button onClick={() => toast.info('Calling...')} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full"><PhoneIcon className="w-5 h-5" /></button>
                 <button onClick={() => setShowInfo(!showInfo)} className={`p-2 rounded-full ${showInfo ? 'text-button-primary bg-blue-50' : 'text-gray-400 hover:bg-gray-100'}`}><InfoIcon className="w-5 h-5" /></button>
               </div>
            </div>

            <AnimatePresence>
              {showInfo && (
                <motion.div initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }} exit={{ height:0, opacity:0 }} className="bg-blue-50/50 border-b border-blue-100 px-5 py-3 text-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-gray-900">{active.tenantName}</p>
                      {active.propertyTitle && <p className="text-button-primary font-medium mt-0.5">{active.propertyTitle}</p>}
                    </div>
                    <button onClick={() => setShowInfo(false)} className="text-gray-400"><XIcon className="w-4 h-4" /></button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex-1 overflow-y-auto p-5 bg-gray-50 space-y-3">
              <AnimatePresence initial={false}>
                {active.messages.map(m => {
                  const isOwn = m.senderRole === 'owner'
                  return (
                    <motion.div key={m.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      {!isOwn && <div className="mr-2 self-end w-8 h-8 rounded-full bg-gradient-to-br from-button-primary to-blue-400 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">{active.tenantName.substring(0,2).toUpperCase()}</div>}
                      <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl shadow-sm ${isOwn ? 'bg-button-primary text-white rounded-br-sm' : 'bg-white text-gray-900 rounded-bl-sm border border-gray-100'}`}>
                        {m.text && <p className="text-sm leading-relaxed">{m.text}</p>}
                        {m.image && <img src={m.image} className="rounded-xl max-w-full h-auto mt-2" />}
                        {m.video && <video src={m.video} controls className="rounded-xl max-w-full mt-2" />}
                        {m.audio && <audio src={m.audio} controls className="w-full mt-2" />}
                        <div className={`flex items-center justify-end gap-1 mt-1 ${isOwn ? 'text-white/60' : 'text-gray-400'}`}>
                          <span className="text-[10px]">{fmtTime(m.timestamp)}</span>
                          {isOwn && (m.seen ? <CheckCheckIcon className="w-3.5 h-3.5 text-blue-300" /> : <CheckIcon className="w-3 h-3 text-white/50" />)}
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>

            <div className="p-4 bg-white border-t border-gray-100 flex-shrink-0">
              <div className="flex gap-2 mb-3">
                 <button onClick={() => uploadFile('image')} className="p-2 text-gray-400 hover:text-button-primary hover:bg-button-primary/10 rounded-full"><ImageIcon className="w-5 h-5"/></button>
                 <button onClick={() => uploadFile('video')} className="p-2 text-gray-400 hover:text-button-primary hover:bg-button-primary/10 rounded-full"><VideoIcon className="w-5 h-5"/></button>
                 <button onClick={() => uploadFile('audio')} className="p-2 text-gray-400 hover:text-button-primary hover:bg-button-primary/10 rounded-full"><MicIcon className="w-5 h-5"/></button>
              </div>
              <div className="flex items-center gap-3">
                <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()} placeholder="Type your message..." className="flex-1 px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm focus:outline-none focus:border-button-primary transition-all" />
                <button onClick={send} disabled={!input.trim()} className="p-3 bg-button-primary text-white rounded-xl disabled:opacity-50 hover:bg-button-primary/90 transition-all shadow-md"><SendIcon className="w-5 h-5" /></button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// â”€â”€â”€ Owner Messenger (same UI as MessagesPage, filtered by ownerName) â”€â”€â”€â”€â”€â”€â”€â”€â”€
function OwnerMessengerFull({ user, activeConvId }: { user: any; activeConvId?: string }) {
  const [conversations, setConversations] = useState<Chat[]>([])
  const [selectedConv, setSelectedConv]   = useState<Chat | null>(null)
  const [searchQuery, setSearchQuery]     = useState('')
  const [message, setMessage]             = useState('')
  const [showInfo, setShowInfo]           = useState(false)

  useEffect(() => {
    const fetchChats = async () => {
      if (!user) return;
      const myChats = await getChats(user.name, 'owner');
      setConversations(myChats);
      setSelectedConv(prev => {
        if (!prev) return null;
        return myChats.find((c: Chat) => c.id === prev.id) || prev;
      });
    };
    fetchChats();
    const id = setInterval(fetchChats, 3000);
    return () => clearInterval(id);
  }, [user]);

  useEffect(() => {
    if (activeConvId && conversations.length > 0) {
      const found = conversations.find(c => c.id === activeConvId)
      if (found) setSelectedConv(found)
    }
  }, [activeConvId, conversations.length])

  useEffect(() => {
    const markSeen = async () => {
      if (selectedConv && user) {
        await markChatAsSeen(selectedConv.id, 'owner');
        
        // Immediately refresh conversations to update badge count
        const myChats = await getChats(user.name, 'owner');
        setConversations(myChats);
        
        // Update selected conversation with fresh data
        const updated = myChats.find(c => c.id === selectedConv.id);
        if (updated) setSelectedConv(updated);
      }
    };
    markSeen();
  }, [selectedConv?.id, selectedConv?.messages?.length, user]);

  const handleSend = async () => {
    if (!message.trim() || !selectedConv || !user) return;
    const txt = message;
    setMessage('');
    await sendMessage(selectedConv.id, { text: txt, senderName: user.name, senderRole: 'owner' });
    
    // Send notification to tenant
    try {
      console.log('🔔 Attempting to send notification to tenant:', selectedConv.tenantName);
      
      // Fetch tenant email from backend using tenant name
      const tenantName = selectedConv.tenantName;
      if (tenantName) {
        // Try to get user by name (search for users with matching name)
        const response = await fetch(`${BACKEND_URL}/api/users`);
        if (response.ok) {
          const data = await response.json();
          const users = data.users || data; // Handle both {users: []} and [] formats
          console.log('👥 Fetched users:', users.length);
          
          const tenant = users.find((u: any) => {
            const fullName = `${u.firstName} ${u.lastName}`.trim();
            console.log(`  Comparing: "${fullName}" with "${tenantName}"`);
            return fullName.toLowerCase() === tenantName.toLowerCase();
          });
          
          console.log('🔍 Found tenant:', tenant ? tenant.email : 'NOT FOUND');
          
          if (tenant && tenant.email) {
            const tenantEmail = tenant.email;
            
            // Check if tenant has notifications enabled
            const notifEnabled = localStorage.getItem(`fm_tenant_notify_messages_${tenantEmail}`) === 'true';
            console.log('🔔 Notifications enabled for tenant:', notifEnabled);
            console.log('🔑 LocalStorage key:', `fm_tenant_notify_messages_${tenantEmail}`);
            
            if (notifEnabled) {
              // Get existing tenant notifications
              const tenantNotifs = JSON.parse(localStorage.getItem(`fm_tenant_notifs_${tenantEmail}`) || '[]');
              console.log('📬 Existing notifications:', tenantNotifs.length);
              
              // Create notification
              const notification = {
                id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                type: 'message',
                title: 'New Message',
                message: `${user.name} has messaged you: "${txt.length > 50 ? txt.substring(0, 50) + '...' : txt}"`,
                senderName: user.name,
                messageText: txt,
                chatId: selectedConv.id,
                read: false,
                time: 'Just now',
                createdAt: new Date().toISOString()
              };
              
              console.log('✅ Created notification:', notification);
              
              // Add to beginning of array
              tenantNotifs.unshift(notification);
              
              // Save back to localStorage
              localStorage.setItem(`fm_tenant_notifs_${tenantEmail}`, JSON.stringify(tenantNotifs));
              console.log('💾 Saved notification to localStorage');
              
              // Dispatch event to notify tenant dashboard if it's open
              window.dispatchEvent(new CustomEvent('tenantNotification', { detail: notification }));
              console.log('📡 Dispatched notification event');
            } else {
              console.log('⚠️ Tenant has not enabled message notifications');
              console.log('⚠️ Please enable notifications in Tenant Dashboard > Settings > Notifications');
            }
          } else {
            console.log('❌ Tenant not found in database');
            console.log('❌ Available users:', users.map((u: any) => `${u.firstName} ${u.lastName}`).join(', '));
          }
        } else {
          console.error('❌ Failed to fetch users:', response.status);
        }
      }
    } catch (error) {
      console.error('❌ Error sending notification:', error);
    }
    
    const myChats = await getChats(user.name, 'owner');
    const updated = myChats.find((c: Chat) => c.id === selectedConv.id);
    if (updated) setSelectedConv(updated);
  };

  const handleFileUpload = async (type: 'image' | 'video' | 'audio') => {
    if (!selectedConv || !user) return;
    const inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = type === 'image' ? 'image/*' : type === 'video' ? 'video/*' : 'audio/*';
    inp.onchange = async (e: any) => {
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
        
        const result = await sendMessage(selectedConv.id, {
          [type]: base64,
          senderName: user.name,
          senderRole: 'owner'
        });
        
        if (!result) {
          toast.dismiss(loadingToast);
          toast.error(`Failed to send ${type}`);
          return;
        }
        
        toast.dismiss(loadingToast);
        toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} sent!`);
        
        // Send notification to tenant
        try {
          const tenantName = selectedConv.tenantName;
          if (tenantName) {
            const response = await fetch(`${BACKEND_URL}/api/users`);
            if (response.ok) {
              const users = await response.json();
              const tenant = users.find((u: any) => {
                const fullName = `${u.firstName} ${u.lastName}`.trim();
                return fullName.toLowerCase() === tenantName.toLowerCase();
              });
              
              if (tenant && tenant.email) {
                const tenantEmail = tenant.email;
                const notifEnabled = localStorage.getItem(`fm_tenant_notify_messages_${tenantEmail}`) === 'true';
                
                if (notifEnabled) {
                  const tenantNotifs = JSON.parse(localStorage.getItem(`fm_tenant_notifs_${tenantEmail}`) || '[]');
                  const notification = {
                    id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    type: 'message',
                    title: 'New Message',
                    message: `${user.name} sent you ${type === 'image' ? 'an image' : type === 'video' ? 'a video' : 'an audio file'}`,
                    senderName: user.name,
                    messageText: `[${type}]`,
                    chatId: selectedConv.id,
                    read: false,
                    time: 'Just now',
                    createdAt: new Date().toISOString()
                  };
                  tenantNotifs.unshift(notification);
                  localStorage.setItem(`fm_tenant_notifs_${tenantEmail}`, JSON.stringify(tenantNotifs));
                  window.dispatchEvent(new CustomEvent('tenantNotification', { detail: notification }));
                }
              }
            }
          }
        } catch (error) {
          console.error('Error sending notification:', error);
        }
        
        // Refresh the conversation immediately
        const myChats = await getChats(user.name, 'owner');
        const updated = myChats.find((c: Chat) => c.id === selectedConv.id);
        if (updated) setSelectedConv(updated);
      } catch (error) {
        toast.dismiss(loadingToast);
        toast.error(`Failed to upload ${type}`);
        console.error('Error uploading file:', error);
      }
    };
    inp.click();
  };

  const fmtTime = (d: string) => new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  const fmtRelative = (d: string) => {
    const diff = Date.now() - new Date(d).getTime()
    const m = Math.floor(diff / 60000), h = Math.floor(diff / 3600000), day = Math.floor(diff / 86400000)
    if (m < 1) return 'Just now'; if (m < 60) return `${m}m ago`; if (h < 24) return `${h}h ago`; return `${day}d ago`
  }

  const AvatarCircle = ({ name }: { name: string }) => (
    <div className="w-10 h-10 bg-button-primary rounded-full flex items-center justify-center text-white font-black text-sm flex-shrink-0">
      {name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
    </div>
  )

  const filtered = conversations.filter(c =>
    c.tenantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.propertyTitle && c.propertyTitle.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="grid grid-cols-12 h-full bg-white dark:bg-gray-800 shadow-sm rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700">
      {/* Sidebar */}
      <div className={`col-span-12 md:col-span-4 border-r border-gray-100 dark:border-gray-700 flex flex-col bg-white dark:bg-gray-800 ${selectedConv ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-base font-black text-gray-900 dark:text-white mb-3">Messages</h2>
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search tenants or properties..."
              className="w-full pl-10 pr-3 py-2.5 bg-gray-50 dark:bg-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-button-primary/20 transition-all dark:text-white" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-gray-400 dark:text-gray-500 text-sm">No conversations yet</div>
          ) : filtered.map((conv, idx) => {
            const unread = conv.messages.filter(m => m.senderRole !== 'owner' && !m.seen).length
            const lastMsg = conv.messages[conv.messages.length - 1]
            return (
              <motion.button key={conv.id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.04 }} onClick={() => setSelectedConv(conv)}
                className={`w-full p-4 flex items-start gap-3 text-left border-b border-gray-50 dark:border-gray-700 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50 ${selectedConv?.id === conv.id ? 'bg-button-primary/5 border-l-2 border-l-button-primary' : ''}`}>
                <AvatarCircle name={conv.tenantName} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <h3 className="font-bold text-gray-900 dark:text-white truncate text-sm">{conv.tenantName}</h3>
                    <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0 ml-2">{fmtRelative(conv.lastUpdated)}</span>
                  </div>
                  {conv.propertyTitle && <p className="text-xs text-button-primary font-medium truncate mb-0.5">{conv.propertyTitle}</p>}
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate flex-1">{lastMsg ? (lastMsg.text || 'Media message') : 'Start a conversation'}</p>
                    {unread > 0 && <span className="ml-2 w-5 h-5 bg-button-primary text-white text-xs rounded-full flex items-center justify-center flex-shrink-0 font-bold">{unread}</span>}
                  </div>
                </div>
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Chat area */}
      <div className={`col-span-12 md:col-span-8 flex flex-col h-[calc(100vh-12rem)] bg-white dark:bg-gray-800 ${selectedConv ? 'flex' : 'hidden md:flex'}`}>
        {selectedConv ? (
          <>
            {/* Chat header - fixed */}
            <div className="px-5 py-3.5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-800 flex-shrink-0">
              <div className="flex items-center gap-3">
                <button onClick={() => setSelectedConv(null)} className="md:hidden p-1 text-gray-400 hover:text-gray-600">
                  <ArrowLeftIcon className="w-5 h-5" />
                </button>
                <AvatarCircle name={selectedConv.tenantName} />
                <div>
                  <h2 className="font-black text-gray-900 dark:text-white text-sm">{selectedConv.tenantName}</h2>
                  {selectedConv.propertyTitle && <p className="text-xs text-button-primary font-medium">{selectedConv.propertyTitle}</p>}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => toast.info('Calling...')} className="p-2.5 text-gray-500 hover:text-button-primary hover:bg-button-primary/10 rounded-full">
                  <PhoneIcon className="w-5 h-5" />
                </motion.button>
                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setShowInfo(!showInfo)} className={`p-2.5 rounded-full ${showInfo ? 'text-button-primary bg-button-primary/10' : 'text-gray-500 hover:text-button-primary hover:bg-button-primary/10'}`}>
                  <InfoIcon className="w-5 h-5" />
                </motion.button>
              </div>
            </div>

            <AnimatePresence>
              {showInfo && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  className="bg-button-primary/5 border-b border-button-primary/10 px-5 py-3 overflow-hidden flex-shrink-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-black text-gray-900 text-sm">{selectedConv.tenantName}</p>
                      {selectedConv.propertyTitle && <p className="text-button-primary font-medium text-xs">{selectedConv.propertyTitle}</p>}
                    </div>
                    <button onClick={() => setShowInfo(false)} className="text-gray-400 hover:text-gray-600"><XIcon className="w-4 h-4" /></button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Messages - scrollable */}
            <div className="overflow-y-auto p-5 bg-gray-50 dark:bg-gray-900 space-y-3 flex-1">
              <AnimatePresence initial={false}>
                {selectedConv.messages.map(msg => {
                  const isOwn = msg.senderRole === 'owner'
                  return (
                    <motion.div key={msg.id} initial={{ opacity: 0, y: 12, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.25, type: 'spring', stiffness: 300 }}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      {!isOwn && <div className="mr-2 self-end flex-shrink-0"><AvatarCircle name={selectedConv.tenantName} /></div>}
                      <div className={`max-w-[72%] px-4 py-2.5 rounded-2xl shadow-sm ${isOwn ? 'bg-button-primary text-white rounded-br-sm' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-sm border border-gray-100 dark:border-gray-700'}`}>
                        {msg.text && <p className="text-sm leading-relaxed">{msg.text}</p>}
                        {msg.image && <img src={msg.image} alt="Shared" className="rounded-xl max-w-full h-auto mt-2" />}
                        {msg.video && <video src={msg.video} controls className="rounded-xl max-w-full mt-2" />}
                        {msg.audio && <audio src={msg.audio} controls className="w-full mt-2" />}
                        <div className={`flex items-center justify-end gap-1 mt-1 ${isOwn ? 'text-white/60' : 'text-gray-400'}`}>
                          <span className="text-[10px]">{fmtTime(msg.timestamp)}</span>
                          {isOwn && (msg.seen ? <CheckCheckIcon className="w-3.5 h-3.5 text-blue-300" /> : <CheckIcon className="w-3 h-3 text-white/60" />)}
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>

            {/* Input - fixed at bottom */}
            <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0">
              <div className="flex items-center gap-2 mb-3">
                {[{ icon: ImageIcon, label: 'image', title: 'Send image' }].map(btn => (
                  <motion.button key={btn.label} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                    onClick={() => handleFileUpload(btn.label as any)} title={btn.title}
                    className="p-2 text-gray-400 hover:text-button-primary hover:bg-button-primary/10 rounded-full transition-colors">
                    <btn.icon className="w-5 h-5" />
                  </motion.button>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <input type="text" value={message} onChange={e => setMessage(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  placeholder={`Message ${selectedConv.tenantName}...`}
                  className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-100 dark:border-gray-600 rounded-2xl text-sm dark:text-white dark:placeholder-gray-400 focus:outline-none focus:border-button-primary dark:focus:bg-gray-700 focus:bg-white transition-all" />
                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={handleSend} disabled={!message.trim()}
                  className="p-3 bg-button-primary text-white rounded-2xl hover:bg-button-primary/90 transition-all disabled:opacity-40 shadow-md">
                  <SendIcon className="w-5 h-5" />
                </motion.button>
              </div>
            </div>
          </>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex items-center justify-center text-center p-8">
            <div>
              <MessageCircleIcon className="w-20 h-20 text-gray-200 dark:text-gray-700 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-2">Select a conversation</h3>
              <p className="text-gray-400 dark:text-gray-500 text-sm">Choose a conversation from the list to start messaging</p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

// â”€â”€â”€ Owner Settings Panel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function OwnerSettingsPanel({ user }: { user: any }) {
  const { isDark, toggleTheme } = useTheme()
  const [activeSection, setActiveSection] = useState('profile')
  const [currentFontSize, setCurrentFontSize] = useState<'small' | 'medium' | 'large'>(() => {
    return (localStorage.getItem('fm_font_size') || 'medium') as 'small' | 'medium' | 'large'
  })
  const [profile, setProfile] = useState({
    firstName: user?.name?.split(' ')[0] || '',
    lastName:  user?.name?.split(' ').slice(1).join(' ') || '',
    email:     user?.email || '',
  })
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null)
  const [citizenshipDoc, setCitizenshipDoc] = useState<string | null>(null)
  const [isVerified, setIsVerified] = useState(false)
  const [verificationStatus, setVerificationStatus] = useState<'none' | 'pending' | 'verified'>('none')
  const [notifPrefs, setNotifPrefs] = useState(() => {
    const saved = localStorage.getItem(`fm_owner_notifications_${user?.email}`)
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {}
    }
    return { bookings: false, approval: false }
  })
  const [saving, setSaving] = useState(false)
  const [savingPw, setSavingPw] = useState(false)
  const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const citizenshipInputRef = React.useRef<HTMLInputElement>(null)

  // Load saved profile data from localStorage
  useEffect(() => {
    const savedProfile = localStorage.getItem(`fm_owner_profile_${user?.email}`)
    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile)
        setProfile(parsed.profile || profile)
        setProfilePhoto(parsed.photo || null)
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
        const savedProfile = localStorage.getItem(`fm_owner_profile_${user?.email}`)
        const profileData = savedProfile ? JSON.parse(savedProfile) : { profile }
        profileData.citizenshipDoc = base64
        profileData.verificationStatus = 'pending'
        profileData.updatedAt = new Date().toISOString()
        localStorage.setItem(`fm_owner_profile_${user?.email}`, JSON.stringify(profileData))
        window.dispatchEvent(new Event('ownerProfileUpdated'))
      } catch {}
      
      // Auto-verify after 2 seconds (simulating admin review)
      setTimeout(() => {
        setIsVerified(true)
        setVerificationStatus('verified')
        
        try {
          const savedProfile = localStorage.getItem(`fm_owner_profile_${user?.email}`)
          const profileData = savedProfile ? JSON.parse(savedProfile) : { profile }
          profileData.isVerified = true
          profileData.verificationStatus = 'verified'
          profileData.verifiedAt = new Date().toISOString()
          localStorage.setItem(`fm_owner_profile_${user?.email}`, JSON.stringify(profileData))
          
          // Update user in flatmate_user
          const userStr = localStorage.getItem('flatmate_user')
          if (userStr) {
            const currentUser = JSON.parse(userStr)
            currentUser.isVerified = true
            localStorage.setItem('flatmate_user', JSON.stringify(currentUser))
          }
          
          window.dispatchEvent(new Event('ownerProfileUpdated'))
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
      
      // Save immediately to localStorage
      try {
        const savedProfile = localStorage.getItem(`fm_owner_profile_${user?.email}`)
        const profileData = savedProfile ? JSON.parse(savedProfile) : { profile }
        profileData.photo = base64
        profileData.updatedAt = new Date().toISOString()
        localStorage.setItem(`fm_owner_profile_${user?.email}`, JSON.stringify(profileData))
        window.dispatchEvent(new Event('ownerProfileUpdated'))
      } catch {}
      
      toast('Photo uploaded successfully!', {
        style: {
          background: '#2F7D5F',
          color: 'white',
        },
      })
    }
    reader.onerror = () => {
      toast.error('Failed to read image file')
    }
    reader.readAsDataURL(file)
  }

  const saveProfile = async () => {
    // Validate all fields
    const newErrors: Record<string, string> = {}

    if (!profile.firstName.trim()) {
      newErrors.firstName = 'First name is required'
    }

    if (!profile.lastName.trim()) {
      newErrors.lastName = 'Last name is required'
    }

    if (!profile.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!validateEmail(profile.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      toast.error('Please fix the errors before saving')
      return
    }

    setErrors({})
    setSaving(true)

    try {
      // Get user ID from backend using email
      const getUserId = async (email: string) => {
        try {
          const response = await fetch(`${BACKEND_URL}/api/users/email/${encodeURIComponent(email)}`)
          const data = await response.json()
          if (data.success && data.user) {
            return data.user.id || data.user._id
          }
          return null
        } catch (error) {
          console.error('Error fetching user ID:', error)
          return null
        }
      }

      const userId = await getUserId(user?.email)
      
      if (userId) {
        // Save to backend database
        const response = await fetch(`${BACKEND_URL}/api/users/${userId}/profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            firstName: profile.firstName.trim(),
            lastName: profile.lastName.trim(),
            profilePicture: profilePhoto
          })
        })

        const data = await response.json()
        
        if (data.success) {
          // Update localStorage with new name
          const userStr = localStorage.getItem('flatmate_user')
          if (userStr) {
            const currentUser = JSON.parse(userStr)
            currentUser.name = `${profile.firstName.trim()} ${profile.lastName.trim()}`
            currentUser.firstName = profile.firstName.trim()
            currentUser.lastName = profile.lastName.trim()
            if (profilePhoto) {
              currentUser.profilePicture = profilePhoto
            }
            localStorage.setItem('flatmate_user', JSON.stringify(currentUser))
          }

          // Save profile data to owner-specific localStorage
          const profileData = {
            profile,
            photo: profilePhoto,
            updatedAt: new Date().toISOString()
          }
          localStorage.setItem(`fm_owner_profile_${user?.email}`, JSON.stringify(profileData))
          
          // Dispatch custom event to notify other components
          window.dispatchEvent(new Event('ownerProfileUpdated'))
          window.dispatchEvent(new Event('storage'))
          
          setSaving(false)
          toast('Profile updated successfully!', {
            style: {
              background: '#2F7D5F',
              color: 'white',
            },
          })

          // Force re-render by updating the user state
          setTimeout(() => {
            window.location.reload()
          }, 800)
        } else {
          setSaving(false)
          toast.error(data.message || 'Failed to update profile')
        }
      } else {
        // Fallback to localStorage only if backend fails
        const profileData = {
          profile,
          photo: profilePhoto,
          updatedAt: new Date().toISOString()
        }
        localStorage.setItem(`fm_owner_profile_${user?.email}`, JSON.stringify(profileData))
        
        // Update flatmate_user in localStorage
        const userStr = localStorage.getItem('flatmate_user')
        if (userStr) {
          const currentUser = JSON.parse(userStr)
          currentUser.name = `${profile.firstName.trim()} ${profile.lastName.trim()}`
          currentUser.firstName = profile.firstName.trim()
          currentUser.lastName = profile.lastName.trim()
          if (profilePhoto) {
            currentUser.profilePicture = profilePhoto
          }
          localStorage.setItem('flatmate_user', JSON.stringify(currentUser))
        }
        
        window.dispatchEvent(new Event('ownerProfileUpdated'))
        window.dispatchEvent(new Event('storage'))
        
        setSaving(false)
        toast('Profile updated successfully!', {
          style: {
            background: '#2F7D5F',
            color: 'white',
          },
        })

        setTimeout(() => {
          window.location.reload()
        }, 800)
      }
    } catch (error) {
      console.error('Error saving profile:', error)
      setSaving(false)
      toast.error('Failed to save profile')
    }
  }

  const changePassword = async () => {
    if (!passwords.current) return toast.error('Enter your current password')
    if (passwords.newPass.length < 6) return toast.error('New password must be at least 6 characters')
    if (passwords.newPass !== passwords.confirm) return toast.error('Passwords do not match')
    setSavingPw(true)
    await new Promise(r => setTimeout(r, 700))
    setSavingPw(false)
    setPasswords({ current: '', newPass: '', confirm: '' })
    toast.success('Password changed successfully!')
  }

  const Toggle = ({ on, onToggle }: { on: boolean; onToggle: () => void }) => (
    <motion.button whileTap={{ scale: 0.88 }} onClick={onToggle}
      className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 ${on ? 'bg-button-primary' : 'bg-gray-300'}`}>
      <motion.div animate={{ x: on ? 18 : 2 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm" />
    </motion.button>
  )

  return (
    <div className="flex gap-6">
      {/* Settings Sidebar */}
      <div className="w-64 flex-shrink-0">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-4 px-2">Settings</p>
          <nav className="space-y-1">
            {[
              { id: 'profile' as const, label: 'Profile', icon: UserIcon },
              { id: 'verification' as const, label: 'Verification', icon: ShieldCheckIcon },
              { id: 'notifications' as const, label: 'Notifications', icon: BellIcon },
              { id: 'theme' as const, label: 'Theme', icon: SunIcon },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                  activeSection === item.id
                    ? 'bg-button-primary text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <item.icon className={`w-4 h-4 ${activeSection === item.id ? 'text-white' : 'text-gray-400'}`} />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Settings Content */}
      <div className="flex-1 space-y-6">
        {activeSection === 'profile' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-bold text-gray-900 mb-5">Profile Information</h3>
            <div className="flex items-center gap-4 mb-5 p-4 bg-gradient-to-r from-button-primary/5 to-blue-50 rounded-xl border border-button-primary/10">
              <div className="relative">
                {profilePhoto ? (
                  <img src={profilePhoto} alt="Profile" className="w-14 h-14 rounded-full object-cover" />
                ) : (
                  <div className="w-14 h-14 bg-gradient-to-br from-button-primary to-primary rounded-full flex items-center justify-center text-white font-bold text-xl shadow-inner">
                    {(user?.name || 'O').charAt(0).toUpperCase()}
                  </div>
                )}
                <button onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 w-5 h-5 bg-button-primary rounded-full flex items-center justify-center border-2 border-white hover:bg-button-primary/90 transition-colors">
                  <CameraIcon className="w-2.5 h-2.5 text-white" />
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">{user?.name || 'Owner'}</p>
                <p className="text-xs text-gray-500 capitalize">Property Owner</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{user?.email}</p>
                <button onClick={() => fileInputRef.current?.click()} className="text-[10px] text-button-primary font-semibold mt-1 hover:underline">
                  Change Photo
                </button>
                {profilePhoto && (
                  <button onClick={() => {
                    setProfilePhoto(null)
                    try {
                      const savedProfile = localStorage.getItem(`fm_owner_profile_${user?.email}`)
                      if (savedProfile) {
                        const parsed = JSON.parse(savedProfile)
                        parsed.photo = null
                        parsed.updatedAt = new Date().toISOString()
                        localStorage.setItem(`fm_owner_profile_${user?.email}`, JSON.stringify(parsed))
                        window.dispatchEvent(new Event('ownerProfileUpdated'))
                      }
                    } catch {}
                    toast('Photo removed', { style: { background: '#D1D5DB', color: '#374151' } })
                  }} className="text-[10px] text-red-500 font-semibold mt-1 ml-2 hover:underline">
                    Remove Photo
                  </button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">First Name *</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                  <input value={profile.firstName} onChange={e => {
                    setProfile(p => ({ ...p, firstName: e.target.value }))
                    if (errors.firstName) setErrors({...errors, firstName: ''})
                  }} placeholder="First name" className={`w-full pl-8 pr-3 py-2.5 border-2 rounded-xl text-xs focus:outline-none transition-all ${errors.firstName ? 'border-red-300 bg-red-50 focus:border-red-400' : 'border-gray-200 focus:border-button-primary'}`} />
                </div>
                {errors.firstName && <p className="text-red-500 text-[10px] mt-1">{errors.firstName}</p>}
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Last Name *</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                  <input value={profile.lastName} onChange={e => {
                    setProfile(p => ({ ...p, lastName: e.target.value }))
                    if (errors.lastName) setErrors({...errors, lastName: ''})
                  }} placeholder="Last name" className={`w-full pl-8 pr-3 py-2.5 border-2 rounded-xl text-xs focus:outline-none transition-all ${errors.lastName ? 'border-red-300 bg-red-50 focus:border-red-400' : 'border-gray-200 focus:border-button-primary'}`} />
                </div>
                {errors.lastName && <p className="text-red-500 text-[10px] mt-1">{errors.lastName}</p>}
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Email Address</label>
                <div className="relative">
                  <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                  <input value={profile.email} readOnly disabled className="w-full pl-8 pr-3 py-2.5 border-2 border-gray-200 bg-gray-100 text-gray-500 rounded-xl text-xs cursor-not-allowed" />
                </div>
                <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
              </div>
            </div>
            <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.97 }} onClick={saveProfile} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-button-primary text-white font-semibold rounded-xl text-xs hover:bg-button-primary/90 disabled:opacity-60 transition-all">
              {saving && <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }} className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full" />}
              {saving ? 'Saving...' : 'Save Profile'}
            </motion.button>
          </div>
        )}
        {activeSection === 'verification' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-5">
              <ShieldCheckIcon className="w-5 h-5 text-blue-600"/>
              <h3 className="font-bold text-gray-900">Account Verification</h3>
            </div>
            
            {/* Verification Status Banner */}
            {verificationStatus === 'verified' && (
              <div className="mb-5 p-4 bg-gradient-to-r from-blue-50 to-green-50 border-2 border-blue-200 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      Verified Owner
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-600 text-white text-[10px] font-bold rounded-full">
                        <ShieldCheckIcon className="w-3 h-3" />
                        VERIFIED
                      </span>
                    </p>
                    <p className="text-xs text-gray-600 mt-0.5">Your account is verified. Tenants can see your verified badge.</p>
                  </div>
                </div>
              </div>
            )}
            
            {verificationStatus === 'pending' && (
              <div className="mb-5 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <ClockIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">Verification Pending</p>
                    <p className="text-xs text-gray-600 mt-0.5">Your document is being reviewed. This usually takes a few seconds.</p>
                  </div>
                </div>
              </div>
            )}
            
            {verificationStatus === 'none' && (
              <div className="mb-5 p-4 bg-gradient-to-r from-gray-50 to-blue-50 border-2 border-gray-200 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-400 rounded-full flex items-center justify-center flex-shrink-0">
                    <AlertCircleIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">Not Verified</p>
                    <p className="text-xs text-gray-600 mt-0.5">Upload your citizenship document to get verified and build trust with tenants.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Benefits Section */}
            <div className="mb-5 p-4 bg-blue-50 border border-blue-100 rounded-xl">
              <p className="text-xs font-bold text-blue-900 mb-3">Benefits of Verification:</p>
              <div className="space-y-2">
                {[
                  'Get a blue verified badge visible to all tenants',
                  'Build trust and credibility with potential tenants',
                  'Increase booking rates by up to 40%',
                  'Stand out from unverified property owners',
                ].map((benefit, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <CheckCircleIcon className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-gray-700">{benefit}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Upload Section */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">
                  Upload Citizenship Document
                </label>
                <p className="text-[10px] text-gray-500 mb-3">
                  Upload a clear photo or scan of your citizenship certificate. Accepted formats: JPG, PNG, PDF (max 10MB)
                </p>
                
                {citizenshipDoc ? (
                  <div className="p-4 bg-green-50 border-2 border-green-200 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <FileTextIcon className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-900">Document Uploaded</p>
                          <p className="text-[10px] text-gray-500">Citizenship certificate</p>
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
                          className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
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
                              const savedProfile = localStorage.getItem(`fm_owner_profile_${user?.email}`)
                              if (savedProfile) {
                                const parsed = JSON.parse(savedProfile)
                                parsed.citizenshipDoc = null
                                parsed.verificationStatus = 'none'
                                parsed.isVerified = false
                                localStorage.setItem(`fm_owner_profile_${user?.email}`, JSON.stringify(parsed))
                                
                                // Update user in flatmate_user
                                const userStr = localStorage.getItem('flatmate_user')
                                if (userStr) {
                                  const currentUser = JSON.parse(userStr)
                                  currentUser.isVerified = false
                                  localStorage.setItem('flatmate_user', JSON.stringify(currentUser))
                                }
                                
                                window.dispatchEvent(new Event('ownerProfileUpdated'))
                              }
                            } catch {}
                            toast('Document removed', { style: { background: '#D1D5DB', color: '#374151' } })
                          }}
                          className="text-xs text-red-600 hover:text-red-700 font-semibold"
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
                      className="w-full p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all group"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                          <FileTextIcon className="w-6 h-6 text-blue-600" />
                        </div>
                        <p className="text-sm font-semibold text-gray-700">Click to upload citizenship</p>
                        <p className="text-xs text-gray-500">JPG, PNG or PDF (max 10MB)</p>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              {/* Security Note */}
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
                <div className="flex items-start gap-2">
                  <LockIcon className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-gray-700">Your data is secure</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      Your citizenship document is encrypted and stored securely. It will only be used for verification purposes and will not be shared with anyone.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {activeSection === 'notifications' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-bold text-gray-900 mb-5">Notification Preferences</h3>
            <div className="space-y-2.5">
              {([
                { key: 'bookings',   label: 'New Booking Alerts',           desc: 'When tenants book your property' },
                { key: 'approval',   label: 'Property Approval Reminders',  desc: 'Reminders for pending property approvals' },
              ] as const).map(s => (
                <div key={s.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div><p className="text-xs font-medium text-gray-900">{s.label}</p><p className="text-[10px] text-gray-400">{s.desc}</p></div>
                  <Toggle on={notifPrefs[s.key]} onToggle={() => {
                    const newPrefs = { ...notifPrefs, [s.key]: !notifPrefs[s.key] }
                    setNotifPrefs(newPrefs)
                    localStorage.setItem(`fm_owner_notifications_${user?.email}`, JSON.stringify(newPrefs))
                    const isEnabled = !notifPrefs[s.key]
                    toast(isEnabled ? `${s.label} enabled` : `${s.label} disabled`, {
                      style: {
                        background: isEnabled ? '#2F7D5F' : '#6B7280',
                        color: 'white',
                      },
                    })
                  }} />
                </div>
              ))}
            </div>
          </div>
        )}
        {activeSection === 'theme' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-5">
              <SunIcon className="w-5 h-5 text-button-primary"/>
              <h3 className="font-bold text-gray-900">Display Preferences</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-button-primary/10 rounded-lg flex items-center justify-center">
                    <MoonIcon className="w-4 h-4 text-button-primary"/>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Dark Mode</p>
                    <p className="text-xs text-gray-400">Switch to dark color scheme</p>
                  </div>
                </div>
                <motion.button whileTap={{scale:0.9}} onClick={()=>{
                  toggleTheme();
                  setTimeout(() => {
                    toast(isDark ? 'Dark mode disabled' : 'Dark mode enabled', {
                      style: {
                        background: isDark ? '#D1D5DB' : '#2F7D5F',
                        color: isDark ? '#374151' : 'white',
                      },
                    });
                  }, 100);
                }} className={`w-12 h-6 rounded-full transition-all relative ${isDark?'bg-button-primary':'bg-gray-300'}`}>
                  <motion.div animate={{x: isDark ? 24 : 2}} className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"/>
                </motion.button>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-button-primary/10 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-button-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Font Size</p>
                    <p className="text-xs text-gray-400">Adjust text size for readability</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {(['small', 'medium', 'large'] as const).map((size) => (
                    <button key={size} onClick={() => {
                      setCurrentFontSize(size)
                      localStorage.setItem('fm_font_size', size)
                      const root = document.documentElement
                      if (size === 'small') root.style.fontSize = '14px'
                      else if (size === 'large') root.style.fontSize = '18px'
                      else root.style.fontSize = '16px'
                      toast.success(`Font size changed to ${size}`)
                    }} className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${currentFontSize === size ? 'bg-button-primary text-white shadow-sm' : 'bg-white text-gray-700 hover:bg-gray-100'}`}>
                      <span className="capitalize">{size}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function OwnerDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  // Role verification - redirect if not owner/landlord
  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }
    if (user.role !== 'landlord' && user.role !== 'owner') {
      toast.error('Access denied. This page is for property owners only.');
      if (user.role === 'admin') {
        navigate('/dashboard/admin', { replace: true });
      } else if (user.role === 'tenant') {
        navigate('/dashboard/tenant', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [user, navigate]);

  const [activeTab, setActiveTab] = useState('overview')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const [properties, setProperties] = useState<any[]>([])
  const [tenants, setTenants] = useState<any[]>(() => {
    const stored = ls('fm_owner_tenants')
    // Check if this is first time (no stored tenants)
    if (stored.length === 0) {
      // First time: save INIT_TENANTS to localStorage and use them
      setLS('fm_owner_tenants', INIT_TENANTS)
      return INIT_TENANTS
    }
    // Not first time: only use stored tenants (respects deletions)
    return stored
  })
  const [applications, setApplications] = useState(INIT_APPLICATIONS)
  const [bookings, setBookings] = useState<any[]>([])
  const [bookingsLoading, setBookingsLoading] = useState(false)
  const [notifs, setNotifs] = useState<any[]>([]) // Notifications fetched from backend
  const [selectedApp, setSelectedApp] = useState<any>(null)
  const [messageUnreadCount, setMessageUnreadCount] = useState(0)
  
  const [activeChatId, setActiveChatId] = useState<string | undefined>()
  const [deleteModal, setDeleteModal] = useState<{ id: string; title: string } | null>(null)
  const [editingProperty, setEditingProperty] = useState<any | null>(null)
  const [deleteTenantModal, setDeleteTenantModal] = useState<{ id: string; name: string } | null>(null)
  const [blockTenantModal, setBlockTenantModal] = useState<{ id: string; name: string } | null>(null)
  const [blockReason, setBlockReason] = useState('')
  const [showAddPropertyModal, setShowAddPropertyModal] = useState(false)

  // Load profile photo from localStorage
  const [profilePhoto, setProfilePhoto] = useState<string | null>(() => {
    try {
      const savedProfile = localStorage.getItem(`fm_owner_profile_${user?.email}`)
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile)
        return parsed.photo || null
      }
    } catch {}
    return null
  })

  // Listen for profile updates
  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const savedProfile = localStorage.getItem(`fm_owner_profile_${user?.email}`)
        if (savedProfile) {
          const parsed = JSON.parse(savedProfile)
          setProfilePhoto(parsed.photo || null)
        }
      } catch {}
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('ownerProfileUpdated', handleStorageChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('ownerProfileUpdated', handleStorageChange)
    }
  }, [user?.email])

  // Fetch owner's properties from backend
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        if (!user || !user.email) {
          setProperties([]);
          return;
        }
        
        // Get user ID from email first
        const userResponse = await fetch(`${BACKEND_URL}/api/users/email/${user.email}`);
        if (!userResponse.ok) {
          console.error('Failed to fetch user data for properties');
          setProperties([]);
          return;
        }
        const userData = await userResponse.json();
        const userId = userData.user.id || userData.user._id;
        
        // Fetch properties from backend by owner ID (more reliable than name)
        const props = await getProperties({ ownerId: userId });
        console.log('Fetched owner properties from backend:', props.length, 'for user ID:', userId);
        setProperties(props);
      } catch (error) {
        console.error('Error fetching properties:', error);
        setProperties([]);
      }
    };

    fetchProperties();
    
    // Poll for updates every 10 seconds
    const interval = setInterval(fetchProperties, 10000);
    return () => clearInterval(interval);
  }, [user]);

  // Fetch notifications from backend
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        if (!user?.email) {
          return;
        }

        // Get user ID from email
        const userResponse = await fetch(`${BACKEND_URL}/api/users/email/${user.email}`);
        if (!userResponse.ok) {
          console.error('Failed to fetch user data');
          return;
        }
        const userData = await userResponse.json();
        const userId = userData.user.id;

        // Fetch notifications
        const notifResponse = await fetch(`${BACKEND_URL}/api/users/${userId}/notifications`);
        if (!notifResponse.ok) {
          console.error('Failed to fetch notifications');
          return;
        }
        const notifData = await notifResponse.json();
        
        // Transform backend notifications to frontend format
        const transformedNotifs = notifData.notifications.map((n: any) => ({
          id: n.id,
          type: n.type === 'property_approved' ? 'success' : n.type === 'property_rejected' ? 'warning' : 'info',
          title: n.title,
          msg: n.message,
          time: formatNotificationTime(new Date(n.createdAt)),
          ts: new Date(n.createdAt).getTime(), // Add timestamp for filtering
          read: n.read,
          propertyId: n.propertyId,
          propertyTitle: n.propertyTitle
        }));

        setNotifs(transformedNotifs);
        console.log('Fetched notifications from backend:', transformedNotifs.length, transformedNotifs);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchNotifications();
    
    // Poll for new notifications every 10 seconds
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, [user]);

  // Helper function to format notification time
  const formatNotificationTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Fetch bookings from backend
  useEffect(() => {
    const fetchBookings = async () => {
      setBookingsLoading(true);
      try {
        if (!user?.email) {
          setBookings([]);
          return;
        }

        // Get user ID from email
        const userResponse = await fetch(`${BACKEND_URL}/api/users/email/${user.email}`);
        if (!userResponse.ok) {
          console.error('Failed to fetch user data for bookings');
          setBookings([]);
          return;
        }
        const userData = await userResponse.json();
        const userId = userData.user.id || userData.user._id;

        // Fetch bookings for this owner
        const bookingsResponse = await fetch(`${BACKEND_URL}/api/bookings?ownerId=${userId}`);
        if (!bookingsResponse.ok) {
          console.error('Failed to fetch bookings');
          setBookings([]);
          return;
        }
        const bookingsData = await bookingsResponse.json();
        
        if (bookingsData.success && bookingsData.bookings) {
          // Transform backend bookings to frontend format
          const transformedBookings = bookingsData.bookings.map((b: any) => ({
            ...b,
            customerName: b.tenantName,
            customerEmail: b.tenantEmail,
            customerPhone: b.tenantPhone,
            bookedAt: b.createdAt,
          }));
          setBookings(transformedBookings);
          console.log('Fetched bookings from backend:', transformedBookings.length);
        } else {
          setBookings([]);
        }
      } catch (error) {
        console.error('Error fetching bookings:', error);
        setBookings([]);
      } finally {
        setBookingsLoading(false);
      }
    };

    fetchBookings();
    
    // Poll for booking updates every 5 seconds
    const interval = setInterval(fetchBookings, 5000);
    return () => clearInterval(interval);
  }, [user]);

  // Calculate message unread count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!user) return;
      const myChats = await getChats(user.name, 'owner');
      const count = myChats.filter(chat => (chat.unreadCount || 0) > 0).length;
      setMessageUnreadCount(count);
    };
    
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 3000);
    return () => clearInterval(interval);
  }, [user]);
  
  const handleChat = async (b: any) => {
    if (!user) return;
    const chat = await getOrCreateChat(b.customerName, user.name, b.propertyTitle);
    if (chat) {
      setActiveChatId(chat.id);
      setActiveTab('messages');
    }
  };

  // Filter/search
  const [propFilter, setPropFilter] = useState('all')
  const [propFilterOpen, setPropFilterOpen] = useState(false)
  const [tenantSearch, setTenantSearch] = useState('')
  const [tenantFilter, setTenantFilter] = useState('all')
  const [tenantFilterOpen, setTenantFilterOpen] = useState(false)
  const [selectedTenantIds, setSelectedTenantIds] = useState<string[]>([])
  const propFilterRef = useRef<HTMLDivElement>(null)
  const tenantFilterRef = useRef<HTMLDivElement>(null)

  // Sync bookings to tenants - automatically add tenants from bookings
  const syncBookingsToTenants = () => {
    const currentBookings = ls('fm_bookings')
    const storedTenants = ls('fm_owner_tenants')
    const existingTenantEmails = new Set(storedTenants.map((t: any) => t.email.toLowerCase()))
    
    // Create tenant records from bookings that don't exist yet
    const newTenants = currentBookings
      .filter((b: any) => b.customerEmail && !existingTenantEmails.has(b.customerEmail.toLowerCase()))
      .map((b: any) => {
        const nameParts = (b.customerName || '').split(' ')
        const firstName = nameParts[0] || 'Unknown'
        const lastName = nameParts.slice(1).join(' ') || 'User'
        
        return {
          id: `t_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          firstName,
          lastName,
          email: b.customerEmail,
          phone: b.customerPhone || 'â€”',
          property: b.propertyTitle || 'â€”',
          propId: b.propertyId || '',
          rentDue: new Date().toISOString().split('T')[0],
          status: b.status === 'confirmed' ? 'active' : 'pending',
          paid: b.paymentType === 'full' || b.paymentType === 'advance',
          joinedDate: b.createdAt ? new Date(b.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          lastAccess: new Date().toISOString().split('T')[0],
          reports: 0,
          blocked: false,
          muted: false,
          archived: false,
          blockReason: ''
        }
      })
    
    if (newTenants.length > 0) {
      const updatedTenants = [...storedTenants, ...newTenants]
      setLS('fm_owner_tenants', updatedTenants)
      return updatedTenants
    }
    
    return storedTenants
  }

  useEffect(() => {
    // Initial sync
    const initialTenants = syncBookingsToTenants()
    setTenants([...initialTenants, ...INIT_TENANTS])
    
    const id = setInterval(() => {
      setBookings(ls('fm_bookings'))
      
      // Sync bookings to tenants on each refresh
      const syncedTenants = syncBookingsToTenants()
      // Only use synced tenants from localStorage, don't re-add INIT_TENANTS
      setTenants(syncedTenants)

      // Notifications are now fetched from backend via separate useEffect
      // Don't reset properties here - they're managed by the dedicated useEffect
    }, 5000)
    return () => clearInterval(id)
  }, [])
  
  // Auto-mark notifications as read when visiting notifications tab
  useEffect(() => {
    const markAllAsRead = async () => {
      if (activeTab !== 'notifications' || !user?.email || notifs.length === 0) return;
      
      // Check if there are any unread notifications
      const hasUnread = notifs.some(n => !n.read);
      if (!hasUnread) return;
      
      try {
        // Get user ID
        const userResponse = await fetch(`${BACKEND_URL}/api/users/email/${user.email}`);
        if (!userResponse.ok) return;
        const userData = await userResponse.json();
        const userId = userData.user.id;
        
        // Mark all as read in backend
        await fetch(`${BACKEND_URL}/api/users/${userId}/notifications/mark-all-read`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' }
        });
        
        // Update local state
        const updated = notifs.map(n => ({ ...n, read: true }));
        setNotifs(updated);
        
        console.log('Auto-marked all notifications as read');
      } catch (error) {
        console.error('Error auto-marking notifications as read:', error);
      }
    };
    
    // Small delay to ensure the tab has fully loaded
    const timer = setTimeout(markAllAsRead, 500);
    return () => clearTimeout(timer);
  }, [activeTab, notifs.length]);
  
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (propFilterRef.current && !propFilterRef.current.contains(e.target as Node)) setPropFilterOpen(false)
      if (tenantFilterRef.current && !tenantFilterRef.current.contains(e.target as Node)) setTenantFilterOpen(false)
    }
    document.addEventListener('mousedown', fn); return () => document.removeEventListener('mousedown', fn)
  }, [])

  const handleRefresh = async () => {
    setRefreshing(true)
    setBookings(ls('fm_bookings'))
    await new Promise(r => setTimeout(r, 700))
    setRefreshing(false)
    toast('Data refreshed!', {
      style: {
        background: '#2F7D5F',
        color: 'white',
      },
    })
  }

  const handleLogout = () => { 
    logout(); 
    toast('Signed out', {
      style: {
        background: '#D1D5DB',
        color: '#374151',
      },
    }); 
    navigate('/login') 
  }

  const addProperty = () => {
    setEditingProperty(null)
    setShowAddPropertyModal(true)
  }
  
  const editProperty = (prop: any) => {
    setEditingProperty(prop)
    setShowAddPropertyModal(true)
  }
  
  const handlePropertyAdded = async (newProp: any) => {
    if (editingProperty) {
      // Update existing property in backend
      const updated = await updateProperty(editingProperty.id || editingProperty._id, newProp);
      if (updated) {
        setProperties(prev => prev.map(p => (p.id === editingProperty.id || p._id === editingProperty._id) ? updated : p));
        toast.success('Property updated successfully!');
      } else {
        toast.error('Failed to update property');
      }
    } else {
      // Property is already created in the modal, just refresh the list
      if (user) {
        const props = await getProperties({ ownerName: user.name });
        setProperties(props);
      }
    }
  };

  const handleDeleteProperty = async (id: string) => {
    const success = await deleteProperty(id);
    if (success) {
      setProperties(prev => prev.filter(p => p.id !== id && p._id !== id));
      
      // Notify admin via localStorage (for now)
      const adminNotifs = ls('fm_admin_notifs');
      setLS('fm_admin_notifs', [{
        id: Date.now().toString(),
        type: 'property_deleted',
        title: 'Property Deleted',
        msg: `${user?.name} deleted a property`,
        time: 'Just now',
        read: false
      }, ...adminNotifs]);
      
      toast('Property deleted successfully!', {
        style: {
          background: '#2F7D5F',
          color: 'white',
        },
      });
      setDeleteModal(null);
    } else {
      toast.error('Failed to delete property');
      setDeleteModal(null);
    }
  };

  const deleteTenant = (id: string) => {
    const updatedTenants = tenants.filter(t => t.id !== id)
    setTenants(updatedTenants)
    setLS('fm_owner_tenants', updatedTenants)
    toast('Tenant removed', {
      style: {
        background: '#6B7280',
        color: 'white',
      },
    })
    setDeleteTenantModal(null)
  }

  const blockTenant = (id: string, reason: string) => {
    if (!reason.trim()) {
      toast.error('Please enter a reason')
      return
    }
    
    const tenant = tenants.find(t => t.id === id)
    const updatedTenants = tenants.map(t => t.id === id ? { ...t, blocked: true, blockReason: reason } : t)
    setTenants(updatedTenants)
    setLS('fm_owner_tenants', updatedTenants)
    
    // Notify admin
    const adminNotifs = ls('fm_admin_notifs')
    adminNotifs.unshift({
      id: Date.now().toString(),
      type: 'tenant_blocked',
      title: 'Tenant Blocked',
      msg: `${user?.name} blocked ${tenant?.firstName} ${tenant?.lastName}. Reason: ${reason}`,
      time: 'Just now',
      read: false
    })
    setLS('fm_admin_notifs', adminNotifs)
    
    toast.error('Tenant blocked', {
      style: {
        background: '#ef4444',
        color: 'white',
      },
    })
    setBlockTenantModal(null)
    setBlockReason('')
  }

  const approveApp = (id: string) => { setApplications(prev => prev.map(a => a.id === id ? { ...a, status: 'approved' } : a)); toast.success('Application approved!') }
  const rejectApp  = (id: string) => { 
    setApplications(prev => prev.map(a => a.id === id ? { ...a, status: 'Rejected' } : a)); 
    toast('Application rejected', {
      style: {
        background: '#ef4444',
        color: 'white',
      },
    })
  }

  // Booking confirm/reject handlers
  const handleConfirmBooking = async (booking: any) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/bookings/${booking._id || booking.id}/confirm`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
      })
      
      if (response.ok) {
        toast.success('Booking confirmed! Property marked as unavailable.')
        // Refresh bookings
        const userResponse = await fetch(`${BACKEND_URL}/api/users/email/${user?.email}`)
        if (userResponse.ok) {
          const userData = await userResponse.json()
          const userId = userData.user.id || userData.user._id
          const bookingsResponse = await fetch(`${BACKEND_URL}/api/bookings?ownerId=${userId}`)
          if (bookingsResponse.ok) {
            const bookingsData = await bookingsResponse.json()
            if (bookingsData.success && bookingsData.bookings) {
              const transformedBookings = bookingsData.bookings.map((b: any) => ({
                ...b,
                customerName: b.tenantName,
                customerEmail: b.tenantEmail,
                customerPhone: b.tenantPhone,
                bookedAt: b.createdAt,
              }))
              setBookings(transformedBookings)
            }
          }
        }
        window.dispatchEvent(new Event('bookingUpdated'))
      } else {
        const data = await response.json()
        toast.error(data.message || 'Failed to confirm booking')
      }
    } catch (error) {
      console.error('Error confirming booking:', error)
      toast.error('Failed to confirm booking')
    }
  }

  const handleRejectBooking = async (booking: any, reason: string) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/bookings/${booking._id || booking.id}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })
      
      if (response.ok) {
        toast('Booking rejected. Payment will be refunded.', {
          style: { background: '#ef4444', color: 'white' }
        })
        // Refresh bookings
        const userResponse = await fetch(`${BACKEND_URL}/api/users/email/${user?.email}`)
        if (userResponse.ok) {
          const userData = await userResponse.json()
          const userId = userData.user.id || userData.user._id
          const bookingsResponse = await fetch(`${BACKEND_URL}/api/bookings?ownerId=${userId}`)
          if (bookingsResponse.ok) {
            const bookingsData = await bookingsResponse.json()
            if (bookingsData.success && bookingsData.bookings) {
              const transformedBookings = bookingsData.bookings.map((b: any) => ({
                ...b,
                customerName: b.tenantName,
                customerEmail: b.tenantEmail,
                customerPhone: b.tenantPhone,
                bookedAt: b.createdAt,
              }))
              setBookings(transformedBookings)
            }
          }
        }
        window.dispatchEvent(new Event('bookingUpdated'))
      } else {
        const data = await response.json()
        toast.error(data.message || 'Failed to reject booking')
      }
    } catch (error) {
      console.error('Error rejecting booking:', error)
      toast.error('Failed to reject booking')
    }
  }

  const myBookings = bookings.filter((b: any) => properties.some(p => (b.propertyTitle || '').toLowerCase().includes(p.title.split(' ')[0].toLowerCase())))
  const pendingApps = applications.filter(a => a.status === 'pending')
  const unreadNotifs = notifs.filter(n => !n.read).length
  const totalRev = MONTHLY_REV.reduce((s, m) => s + m.revenue, 0)
  const totalExp = MONTHLY_REV.reduce((s, m) => s + m.expense, 0)

  const filteredProps = properties.filter(p => { 
    if (propFilter === 'pending') return p.status === 'pending'
    if (propFilter === 'approved') return p.status === 'approved'
    if (propFilter === 'rejected') return p.status === 'rejected'
    return true 
  })
  const filteredTenants = tenants.filter(t => {
    const q = tenantSearch.toLowerCase()
    const match = !q || `${t.firstName} ${t.lastName} ${t.email}`.toLowerCase().includes(q)
    if (tenantFilter === 'paid')     return match && t.paid
    if (tenantFilter === 'pending')  return match && !t.paid
    if (tenantFilter === 'muted')    return match && t.muted
    if (tenantFilter === 'blocked')  return match && t.blocked
    if (tenantFilter === 'archived') return match && t.archived
    return match
  })

  const TABS = [
    { id: 'overview',      label: 'Overview',      icon: HomeIcon },
    { id: 'properties',    label: 'Properties',    icon: BuildingIcon },
    { id: 'tenants',       label: 'Tenants',       icon: UsersIcon },
    { id: 'bookings',      label: 'Bookings',      icon: CalendarIcon },
    { id: 'analytics',     label: 'Analytics',     icon: BarChart3Icon },
    { id: 'messages',      label: 'Messages',      icon: MessageCircleIcon },
    { id: 'notifications', label: 'Notifications', icon: BellIcon },
    { id: 'settings',      label: 'Settings',      icon: SettingsIcon },
  ]

  const renderContent = () => { switch (activeTab) {

  // â”€â”€ OVERVIEW â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  case 'overview': return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      {/* Welcome + refresh */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <h2 className="text-sm font-bold text-gray-900 mt-0.5">Welcome back, {user?.name?.split(' ')[0]}!</h2>
        </div>
        <div className="flex items-center gap-2">
          <motion.button whileTap={{ rotate: 180 }} onClick={handleRefresh} disabled={refreshing} className="p-2 text-gray-400 hover:text-button-primary hover:bg-button-primary/10 rounded-xl transition-colors">
            <motion.div animate={refreshing ? { rotate: 360 } : {}} transition={refreshing ? { duration: 0.8, repeat: Infinity, ease: 'linear' } : {}}><RefreshCwIcon className="w-4 h-4" /></motion.div>
          </motion.button>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={addProperty} className="flex items-center gap-1.5 px-3 py-2 bg-button-primary text-white font-semibold text-xs rounded-xl hover:bg-button-primary/90 transition-all shadow-sm">
            <PlusIcon className="w-3.5 h-3.5" /> Add Property
          </motion.button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard icon={BuildingIcon}   value={properties.length}                            label="Properties"      trend={8}   pastel="blue"   sub={`${properties.filter(p => p.status === 'verified').length} verified`} onClick={() => setActiveTab('properties')} />
        <StatCard icon={UsersIcon}      value={tenants.filter(t => t.status === 'active').length} label="Active Tenants" trend={5}   pastel="pink"   sub={`${MOCK_INVOICES.filter(i => i.status === 'pending').length} payments due`} onClick={() => setActiveTab('tenants')} />
        <StatCard icon={DollarSignIcon} value={fmtNPR(totalRev - totalExp)}                  label="Net Revenue"     trend={18}  pastel="green"  sub="This period" onClick={() => setActiveTab('analytics')} />
        <StatCard icon={PackageIcon}    value={pendingApps.length}                           label="Pending Apps"    pastel="amber"  sub="Awaiting review" onClick={() => setActiveTab('tenants')} />
      </div>

      {/* Pending apps alert */}
      {pendingApps.length > 0 && (
        <motion.button initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} onClick={() => setActiveTab('tenants')} whileHover={{ scale: 1.01 }}
          className="w-full bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex items-center gap-3 text-left hover:bg-amber-100 transition-colors">
          <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0"><PackageIcon className="w-4 h-4 text-amber-600" /></div>
          <div className="flex-1">
            <p className="text-xs font-bold text-amber-800">{pendingApps.length} pending application{pendingApps.length > 1 ? 's' : ''} awaiting review</p>
            <p className="text-[10px] text-amber-600">{pendingApps.map(a => a.name).join(', ')}</p>
          </div>
          <ChevronRightIcon className="w-4 h-4 text-amber-500 flex-shrink-0" />
        </motion.button>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Revenue chart â€” 3 cols */}
        <div className="lg:col-span-3 bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-xs font-semibold text-gray-800">Sales Analytics</p>
              <p className="text-xl font-bold text-emerald-500 mt-0.5">{fmtNPR(totalRev - totalExp)} <span className="text-xs font-normal text-gray-400">net profit</span></p>
            </div>
            <div className="flex flex-col gap-1">
              <span className="flex items-center gap-1.5 text-[10px] text-gray-400"><span className="w-3 h-1.5 rounded-full bg-emerald-300 inline-block" />Revenue</span>
              <span className="flex items-center gap-1.5 text-[10px] text-gray-400"><span className="w-3 h-1.5 rounded-full bg-red-200 inline-block" />Expense</span>
            </div>
          </div>
          <AreaChart data={MONTHLY_REV} h={72} />
          <div className="flex justify-between mt-0.5">{MONTHLY_REV.map(d => <span key={d.m} className="text-[9px] text-gray-400">{d.m}</span>)}</div>
          <div className="grid grid-cols-3 gap-3 mt-3">
            {[{ l: 'Total Revenue', v: fmtNPR(totalRev), c: 'text-emerald-600' }, { l: 'Total Expense', v: fmtNPR(totalExp), c: 'text-red-500' }, { l: 'Net Profit', v: fmtNPR(totalRev - totalExp), c: 'text-blue-600' }].map(s => (
              <div key={s.l} className="bg-gray-50 rounded-xl p-2.5 text-center"><p className={`text-xs font-bold ${s.c}`}>{s.v}</p><p className="text-[9px] text-gray-400 mt-0.5">{s.l}</p></div>
            ))}
          </div>
        </div>

        {/* Calendar â€” 2 cols */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <p className="text-xs font-semibold text-gray-800 mb-3">Today's Schedule</p>
          <MiniCalendar />
          <div className="mt-3 pt-3 border-t border-gray-100 space-y-1.5">
            {[{ t: '9:00 AM', e: 'Property inspection' }, { t: '1:00 PM', e: 'Tenant signing' }, { t: '3:30 PM', e: 'Maintenance check' }].map(ev => (
              <div key={ev.t} className="flex gap-2 text-xs"><span className="text-button-primary font-medium w-14 flex-shrink-0">{ev.t}</span><span className="text-gray-500 truncate">{ev.e}</span></div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent activities */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <p className="text-xs font-semibold text-gray-800 mb-3">Recent Activities</p>
          <div className="space-y-3">
            {[
              { msg: 'Anita Thapa paid rent for 2BHK', time: '2h ago', dot: 'bg-green-400' },
              { msg: 'New inquiry on Spacious 3BHK', time: '5h ago', dot: 'bg-blue-400' },
              { msg: 'New application from Rajan', time: '1d ago', dot: 'bg-amber-400' },
              { msg: 'Maintenance request â€” water heater', time: '2d ago', dot: 'bg-red-400' },
            ].map((a, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="flex items-start gap-2.5">
                <div className={`w-2 h-2 rounded-full ${a.dot} mt-1.5 flex-shrink-0`} />
                <div className="flex-1 min-w-0 border-b border-gray-50 pb-2"><p className="text-xs text-gray-600 leading-snug">{a.msg}</p><p className="text-[10px] text-gray-400 mt-0.5">{a.time}</p></div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Invoices */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-gray-800">Recent Invoices</p>
            <button onClick={() => setActiveTab('analytics')} className="text-[10px] text-button-primary font-medium hover:underline">View All</button>
          </div>
          <div className="space-y-2">
            {MOCK_INVOICES.slice(0, 4).map((inv, i) => (
              <motion.div key={inv.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} className="flex items-center gap-2.5 p-2 bg-gray-50 rounded-xl">
                <div className="w-7 h-7 bg-button-primary/10 rounded-lg flex items-center justify-center flex-shrink-0"><FileTextIcon className="w-3.5 h-3.5 text-button-primary" /></div>
                <div className="flex-1 min-w-0"><p className="text-[11px] font-semibold text-gray-900 truncate">{inv.tenant}</p><p className="text-[10px] text-gray-400">{inv.id}</p></div>
                <div className="text-right"><p className="text-[11px] font-bold text-gray-900">{fmtNPR(inv.amount)}</p><span className={`text-[9px] font-bold ${inv.status === 'paid' ? 'text-green-600' : 'text-amber-600'}`}>{inv.status}</span></div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bookings */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-gray-800">Recent Bookings</p>
            <button onClick={() => setActiveTab('bookings')} className="text-[10px] text-button-primary font-medium hover:underline">View All</button>
          </div>
          {myBookings.length === 0 ? (
            <div className="text-center py-6 text-gray-400 text-xs">No bookings yet from your properties.</div>
          ) : (
            <div className="space-y-2">
              {myBookings.slice(0, 4).map((b: any, i: number) => (
                <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} className="flex items-center gap-2.5 p-2 bg-gray-50 rounded-xl">
                  <div className="w-7 h-7 bg-button-primary/10 rounded-full flex items-center justify-center text-button-primary font-bold text-[10px] flex-shrink-0">{(b.customerName || '?').charAt(0)}</div>
                  <div className="flex-1 min-w-0"><p className="text-[11px] font-semibold text-gray-900 truncate">{b.customerName}</p><p className="text-[10px] text-gray-400 truncate">{b.propertyTitle}</p></div>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${b.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{b.status}</span>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )

  // â”€â”€ PROPERTIES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  case 'properties': return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      {/* Status tabs */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        {(['all', 'pending', 'approved', 'rejected'] as const).map(status => {
          const active = propFilter === status
          const count = status === 'all' ? properties.length : properties.filter(p => p.status === status).length
          return (
            <motion.button key={status} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setPropFilter(status)}
              className={`px-4 py-2 rounded-full text-xs font-semibold border-2 capitalize transition-all flex items-center gap-1.5 ${active ? 'bg-button-primary text-white border-button-primary shadow-sm' : 'bg-white text-button-primary border-button-primary/30 hover:border-button-primary'}`}>
              {status === 'all' ? 'All Properties' : status}
              {count > 0 && <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${active ? 'bg-white text-button-primary' : 'bg-button-primary text-white'}`}>{count}</span>}
            </motion.button>
          )
        })}
        <div className="ml-auto flex items-center gap-2">          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={addProperty} className="flex items-center gap-1.5 px-3 py-2 bg-button-primary text-white font-semibold text-xs rounded-xl hover:bg-button-primary/90 transition-all">
            <PlusIcon className="w-3.5 h-3.5" /> Add Property
          </motion.button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredProps.map((p, i) => (
          <motion.div key={p.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            <div className="relative h-40 overflow-hidden">
              <img src={p.image} alt={p.title} className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />
              {p.isPremium && <span className="absolute top-2 left-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-md">⭐ PREMIUM</span>}
              <div className="absolute top-2.5 right-2.5"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${p.status === 'pending' ? 'bg-amber-400 text-white' : p.status === 'approved' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>{p.status === 'pending' ? 'Pending' : p.status === 'approved' ? 'Approved' : 'Rejected'}</span></div>
            </div>
            <div className="p-4">
              <h4 className="font-bold text-gray-900 text-xs mb-0.5 truncate">{p.title}</h4>
              <div className="flex items-center gap-1 text-[10px] text-gray-400 mb-2"><MapPinIcon className="w-3 h-3" />{p.location}</div>
              <p className="text-button-primary font-bold text-sm mb-2">{fmtNPR(p.rent)}<span className="text-[10px] font-normal text-gray-400">/mo</span></p>
              <div className="flex items-center gap-2 text-[10px] text-gray-400 mb-3"><span>{p.beds}bd</span><span>·</span><span>{p.baths}ba</span><span>·</span><span>{p.area}</span></div>
              <div className="grid grid-cols-3 gap-1.5 mb-3">
                {[{ l: 'Views', v: p.views, c: 'bg-blue-50 text-blue-600' }, { l: 'Saved', v: p.saves, c: 'bg-pink-50 text-pink-600' }, { l: 'Inquiries', v: p.inquiries, c: 'bg-violet-50 text-violet-600' }].map(s => (
                  <div key={s.l} className={`${s.c} rounded-lg py-1.5 text-center`}><p className="text-xs font-bold">{s.v}</p><p className="text-[9px] font-medium">{s.l}</p></div>
                ))}
              </div>
              
              {/* Location Map */}
              {p.latitude && p.longitude && (
                <div className="mb-3">
                  <p className="text-[10px] font-semibold text-gray-500 mb-1.5 flex items-center gap-1">
                    <MapPinIcon className="w-3 h-3" />
                    Location on Map
                  </p>
                  <div className="w-full h-24 rounded-lg overflow-hidden border border-gray-200">
                    <iframe
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      scrolling="no"
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${p.longitude - 0.005},${p.latitude - 0.005},${p.longitude + 0.005},${p.latitude + 0.005}&layer=mapnik&marker=${p.latitude},${p.longitude}`}
                      style={{ border: 0, pointerEvents: 'none' }}
                    />
                  </div>
                </div>
              )}
              
              <div className="flex gap-1.5">
                <button 
                  onClick={() => navigate(`/property/${p.id}`)}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-button-primary text-white text-[10px] font-bold rounded-lg hover:bg-button-primary/90 transition-all">
                  <EyeIcon className="w-3 h-3" />View
                </button>
                <button 
                  onClick={() => editProperty(p)} 
                  className="px-2.5 py-1.5 border border-button-primary/30 text-button-primary rounded-lg hover:bg-button-primary/10 transition-all">
                  <EditIcon className="w-3 h-3" />
                </button>
                <button onClick={() => setDeleteModal({ id: p.id, title: p.title })} className="px-2.5 py-1.5 border border-red-100 text-red-500 rounded-lg hover:bg-red-50 transition-all"><TrashIcon className="w-3 h-3" /></button>
              </div>
            </div>
          </motion.div>
        ))}
        {filteredProps.length === 0 && <div className="col-span-3 text-center py-12 text-gray-400 text-xs">No properties match this filter.</div>}
      </div>
    </motion.div>
  )

  // â”€â”€ TENANTS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  case 'tenants': return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      {/* Pending applications */}
      {pendingApps.length > 0 && (
        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <p className="text-xs font-bold text-amber-800 mb-2">Pending Applications ({pendingApps.length})</p>
          <div className="space-y-2">
            {pendingApps.map(app => (
              <motion.button key={app.id} whileHover={{ x: 2 }} onClick={() => setSelectedApp(app)} className="w-full flex items-center gap-3 bg-white rounded-xl p-2.5 border border-amber-100 cursor-pointer text-left">
                <div className="w-7 h-7 bg-button-primary rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0">{app.name.charAt(0)}</div>
                <div className="flex-1 min-w-0"><p className="text-xs font-semibold text-gray-900">{app.name}</p><p className="text-[10px] text-gray-400 truncate">{app.propTitle}</p></div>
                <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full">Pending</span>
                <ChevronRightIcon className="w-3 h-3 text-gray-400" />
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[180px]">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input value={tenantSearch} onChange={e => setTenantSearch(e.target.value)} placeholder="Search tenants..." className="w-full pl-9 pr-3 py-2.5 border-2 border-gray-200 rounded-xl text-xs focus:outline-none focus:border-button-primary transition-all" />
        </div>
        <div className="relative" ref={tenantFilterRef}>
          <button onClick={() => setTenantFilterOpen(v => !v)} className="flex items-center gap-1.5 px-3 py-2.5 border-2 border-gray-200 rounded-xl text-xs font-medium text-gray-600 bg-white hover:border-button-primary/30 transition-all">
            <FilterIcon className="w-3.5 h-3.5 text-gray-400" /><span className="capitalize">{tenantFilter === 'all' ? 'All Tenants' : tenantFilter}</span><ChevronDownIcon className="w-3 h-3 text-gray-400" />
          </button>
          <AnimatePresence>
            {tenantFilterOpen && <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="absolute top-full mt-1 w-40 bg-white border border-gray-100 rounded-xl shadow-xl z-20 py-1 overflow-hidden">
              {['all', 'paid', 'pending', 'muted', 'blocked', 'archived'].map(f => <button key={f} onClick={() => { setTenantFilter(f); setTenantFilterOpen(false) }} className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-medium capitalize transition-colors ${tenantFilter === f ? 'bg-button-primary/10 text-button-primary' : 'text-gray-600 hover:bg-gray-50'}`}>{tenantFilter === f && <CheckIcon className="w-3 h-3" />}{f === 'all' ? 'All Tenants' : f}</button>)}
            </motion.div>}
          </AnimatePresence>
        </div>
        <span className="text-[10px] text-button-primary font-semibold bg-button-primary/10 px-3 py-2 rounded-xl">{tenants.filter(t => t.status === 'active').length} active</span>
        {selectedTenantIds.length > 0 && <span className="text-[10px] bg-blue-50 text-blue-600 px-3 py-2 rounded-xl font-medium">{selectedTenantIds.length} selected</span>}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
        <table className="w-full text-xs min-w-[800px]">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="p-3 w-8"><input type="checkbox" checked={selectedTenantIds.length === filteredTenants.length && filteredTenants.length > 0} onChange={() => setSelectedTenantIds(p => p.length === filteredTenants.length ? [] : filteredTenants.map(t => t.id))} className="w-3.5 h-3.5 rounded border-2 border-gray-300 accent-button-primary cursor-pointer" /></th>
              {['Tenant', 'Email', 'Property', 'Status', 'Payment Type', 'Rent', 'Joined', 'Last Active', 'Reason', 'Actions'].map(h => <th key={h} className="p-3 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {filteredTenants.map((t, i) => {
              // Find booking for this tenant to get payment type
              const booking = bookings.find((b: any) => 
                b.customerName?.toLowerCase().includes(`${t.firstName} ${t.lastName}`.toLowerCase()) ||
                b.customerEmail === t.email
              );
              const paymentTypeDisplay = booking?.paymentType === 'advance' ? 'Half (30%)' : 
                                        booking?.paymentType === 'full' ? 'Full' : 
                                        booking?.paymentType === 'cash' ? 'Cash' : 'â€”';
              const paymentTypeColor = booking?.paymentType === 'advance' ? 'bg-blue-100 text-blue-700' : 
                                      booking?.paymentType === 'full' ? 'bg-green-100 text-green-700' : 
                                      booking?.paymentType === 'cash' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500';
              
              return (
                <tr key={t.id}
                  className={`border-b border-gray-50 hover:bg-gray-50/60 transition-colors ${t.blocked ? 'opacity-40' : ''}`}>
                  <td className="p-3"><input type="checkbox" checked={selectedTenantIds.includes(t.id)} onChange={() => setSelectedTenantIds(p => p.includes(t.id) ? p.filter(x => x !== t.id) : [...p, t.id])} className="w-3.5 h-3.5 rounded border-2 border-gray-300 accent-button-primary cursor-pointer" /></td>
                  <td className="p-3"><div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-button-primary/10 rounded-full flex items-center justify-center text-button-primary font-bold text-[10px] flex-shrink-0">{t.firstName.charAt(0)}</div>
                    <div><p className="font-medium text-gray-900">{t.firstName} {t.lastName}</p><p className="text-[10px] text-gray-400">{t.phone}</p></div>
                  </div></td>
                  <td className="p-3 text-gray-500">{t.email}</td>
                  <td className="p-3 text-gray-500 truncate max-w-[110px]">{t.property}</td>
                  <td className="p-3"><span className={`font-semibold px-2 py-0.5 rounded-full ${t.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{t.status}</span></td>
                  <td className="p-3"><span className={`font-semibold px-2 py-0.5 rounded-full text-[10px] ${paymentTypeColor}`}>{paymentTypeDisplay}</span></td>
                  <td className="p-3"><span className={`font-semibold px-2 py-0.5 rounded-full ${t.paid ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>{t.paid ? 'Paid' : 'Due'}</span></td>
                  <td className="p-3 text-gray-400 whitespace-nowrap">{daysSince(t.joinedDate)}</td>
                  <td className="p-3 text-gray-400 whitespace-nowrap">{daysSince(t.lastAccess)}</td>
                  <td className="p-3">
                    {t.blocked && t.blockReason ? (
                      <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">{t.blockReason}</span>
                    ) : (
                      <span className="text-xs text-gray-400">â€”</span>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => {
                          if (!t.blocked) {
                            setBlockTenantModal({ id: t.id, name: `${t.firstName} ${t.lastName}` });
                          }
                        }}
                        disabled={t.blocked}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                          t.blocked 
                            ? 'bg-red-100 text-red-600 cursor-not-allowed' 
                            : 'border border-gray-200 text-gray-600 hover:bg-gray-50 cursor-pointer'
                        }`}>
                        {t.blocked ? 'Blocked' : 'Block'}
                      </button>
                      <button onClick={() => setDeleteTenantModal({ id: t.id, name: `${t.firstName} ${t.lastName}` })} 
                        className="px-2.5 py-1 border border-red-200 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-50 transition-all">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredTenants.length === 0 && <div className="text-center py-10 text-gray-400 text-xs">No tenants match this filter.</div>}
      </div>
    </motion.div>
  )

  // â”€â”€ BOOKINGS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  case 'bookings': return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {/* KPI */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { l: 'Total Bookings', v: myBookings.length, pastel: 'blue' as const },
          { l: 'Confirmed', v: myBookings.filter((b: any) => b.status === 'confirmed').length, pastel: 'green' as const },
          { l: 'Revenue', v: fmtNPR(myBookings.reduce((s: number, b: any) => s + (b.amount || 0), 0)), pastel: 'violet' as const },
        ].map((s, i) => {
          const p = PASTELS[s.pastel]
          return <motion.div key={s.l} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} className={`${p.bg} border ${p.border} rounded-2xl p-4 text-center`}><p className={`text-lg font-bold ${p.val}`}>{s.v}</p><p className="text-xs text-gray-500 mt-0.5">{s.l}</p></motion.div>
        })}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full font-medium">{myBookings.length} from your properties</span>
        <button onClick={handleRefresh} className="flex items-center gap-1.5 text-xs text-button-primary font-medium hover:underline"><RefreshCwIcon className="w-3.5 h-3.5" /> Refresh</button>
      </div>

      {myBookings.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
          <CalendarIcon className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-400 text-xs">No bookings yet. Bookings appear here when tenants book your properties.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
          <table className="w-full text-xs min-w-[600px]">
            <thead>
              <tr className="border-b border-gray-100">
                {['Receipt', 'Property', 'Customer', 'Amount', 'Type', 'Status', 'Move-in', 'Actions'].map(h => <th key={h} className="p-3 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {myBookings.map((b: any, i: number) => (
                <motion.tr key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                  <td className="p-3 font-mono text-button-primary text-[10px]">{b.receiptId || 'â€”'}</td>
                  <td className="p-3 text-gray-600 max-w-[130px] truncate">{b.propertyTitle}</td>
                  <td className="p-3 text-gray-600">{b.customerName}</td>
                  <td className="p-3 font-semibold text-gray-800">{b.amount > 0 ? fmtNPR(b.amount) : 'Cash'}</td>
                  <td className="p-3"><span className={`font-semibold px-2 py-0.5 rounded-full capitalize ${b.paymentType === 'full' ? 'bg-green-100 text-green-700' : b.paymentType === 'advance' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>{b.paymentType || 'cash'}</span></td>
                  <td className="p-3"><span className={`font-semibold px-2 py-0.5 rounded-full ${b.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{b.status}</span></td>
                  <td className="p-3 text-gray-400">{b.moveInDate}</td>
                  <td className="p-3">
                    <div className="flex gap-2">
                       {b.status === 'pending' ? (
                         <>
                           <button 
                             onClick={() => handleConfirmBooking(b)} 
                             className="px-3 py-1 bg-green-50 text-green-700 text-[11px] font-bold rounded-full hover:bg-green-100 transition-colors"
                           >
                             Confirm
                           </button>
                           <button 
                             onClick={() => {
                               const reason = prompt('Reason for rejection (optional):')
                               if (reason !== null) {
                                 handleRejectBooking(b, reason || 'Not specified')
                               }
                             }}
                             className="px-3 py-1 bg-red-50 text-red-700 text-[11px] font-bold rounded-full hover:bg-red-100 transition-colors"
                           >
                             Reject
                           </button>
                         </>
                       ) : b.status === 'confirmed' ? (
                         <span className="px-3 py-1 bg-green-50 text-green-700 text-[11px] font-bold rounded-full">Confirmed</span>
                       ) : (
                         <span className="px-3 py-1 bg-gray-50 text-gray-500 text-[11px] font-bold rounded-full">{b.status}</span>
                       )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  )

  // â”€â”€ ANALYTICS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  case 'analytics': return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { l: 'Total Revenue', v: fmtNPR(totalRev), pastel: 'green' as const, icon: DollarSignIcon, trend: 18 },
          { l: 'Net Profit',    v: fmtNPR(totalRev - totalExp), pastel: 'blue' as const, icon: TrendingUpIcon, trend: 22 },
          { l: 'Avg Rent',      v: fmtNPR(Math.round(properties.reduce((s, p) => s + p.rent, 0) / (properties.length || 1))), pastel: 'violet' as const, icon: BuildingIcon, trend: 5 },
          { l: 'Avg Rating',    v: '4.5 / 5.0', pastel: 'amber' as const, icon: StarIcon },
        ].map((s, i) => <StatCard key={s.l} icon={s.icon} value={s.v} label={s.l} trend={s.trend} pastel={s.pastel} />)}
      </div>

      {/* Main charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <div><p className="text-xs font-semibold text-gray-800">Revenue vs Expense</p><p className="text-[10px] text-gray-400">Last 6 months</p></div>
            <div className="flex flex-col gap-1"><span className="flex items-center gap-1.5 text-[10px] text-gray-400"><span className="w-3 h-1.5 rounded-full bg-emerald-300 inline-block" />Revenue</span><span className="flex items-center gap-1.5 text-[10px] text-gray-400"><span className="w-3 h-1.5 rounded-full bg-red-200 inline-block" />Expense</span></div>
          </div>
          <AreaChart data={MONTHLY_REV} h={80} />
          <div className="flex justify-between mt-0.5">{MONTHLY_REV.map(d => <span key={d.m} className="text-[9px] text-gray-400">{d.m}</span>)}</div>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <p className="text-xs font-semibold text-gray-800 mb-1">Property Occupancy</p>
          <p className="text-[10px] text-gray-400 mb-4">Distribution by status</p>
          <DonutChart data={[{ label: 'Occupied', value: 67, color: '#86efac' }, { label: 'Vacant', value: 22, color: '#93c5fd' }, { label: 'Pending', value: 11, color: '#fde68a' }]} size={110} />
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <p className="text-xs font-semibold text-gray-800 mb-4">Invoice Summary</p>
          <ProgressBar label="Total Invoiced" value={100} color="#86efac" />
          <ProgressBar label="Collected" value={67} color="#93c5fd" />
          <ProgressBar label="Outstanding" value={33} color="#fde68a" />
          <div className="mt-3 space-y-2">
            {[{ l: 'Total Invoiced', v: totalRev, c: 'text-gray-800' }, { l: 'Collected', v: MOCK_INVOICES.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0), c: 'text-green-600' }, { l: 'Outstanding', v: MOCK_INVOICES.filter(i => i.status === 'pending').reduce((s, i) => s + i.amount, 0), c: 'text-amber-600' }].map(s => (
              <div key={s.l} className="flex justify-between text-[11px] border-b border-gray-50 pb-1.5"><span className="text-gray-500">{s.l}</span><span className={`font-bold ${s.c}`}>{fmtNPR(s.v)}</span></div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <p className="text-xs font-semibold text-gray-800 mb-4">Property Performance</p>
          {properties.slice(0, 3).map((p, i) => (
            <div key={p.id} className="mb-3">
              <div className="flex justify-between text-[11px] mb-1"><span className="text-gray-500 truncate max-w-[160px]">{p.title}</span><span className="font-semibold text-gray-700">{p.views} views</span></div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <motion.div className="h-2 rounded-full bg-gradient-to-r from-button-primary/70 to-blue-300" initial={{ width: 0 }} animate={{ width: `${(p.views / 350) * 100}%` }} transition={{ duration: 0.8, delay: i * 0.1 }} />
              </div>
            </div>
          ))}
          <p className="text-xs font-semibold text-gray-800 mb-3 mt-4">Monthly Signups Trend</p>
          <BarChart data={MONTHLY_REV.map(d => ({ label: d.m, value: d.revenue / 1000 }))} color="#c4b5fd" />
        </motion.div>
      </div>

      {/* Recent invoices table */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100"><p className="text-xs font-semibold text-gray-800">Invoice History</p></div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[500px]">
            <thead><tr className="border-b border-gray-100">{['Invoice', 'Tenant', 'Property', 'Amount', 'Date', 'Status'].map(h => <th key={h} className="p-3 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{h}</th>)}</tr></thead>
            <tbody>
              {MOCK_INVOICES.map((inv, i) => <motion.tr key={inv.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                <td className="p-3 font-mono text-button-primary text-[10px]">{inv.id}</td>
                <td className="p-3 text-gray-600">{inv.tenant}</td>
                <td className="p-3 text-gray-500 truncate max-w-[100px]">{inv.property}</td>
                <td className="p-3 font-semibold text-gray-800">{fmtNPR(inv.amount)}</td>
                <td className="p-3 text-gray-400">{daysSince(inv.date)}</td>
                <td className="p-3"><span className={`font-semibold px-2 py-0.5 rounded-full ${inv.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{inv.status}</span></td>
              </motion.tr>)}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  )

  // â”€â”€ MESSAGES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  case 'messages': return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="h-full">
      <OwnerMessengerFull user={user} activeConvId={activeChatId} />
    </motion.div>
  )

  // â”€â”€ NOTIFICATIONS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  case 'notifications': return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Notifications</p>
        <div className="flex items-center gap-2">
          <button onClick={async () => {
            try {
              if (!user?.email) return;
              
              // Get user ID
              const userResponse = await fetch(`${BACKEND_URL}/api/users/email/${user.email}`);
              const userData = await userResponse.json();
              const userId = userData.user.id;
              
              // Mark all as read in backend
              await fetch(`${BACKEND_URL}/api/users/${userId}/notifications/mark-all-read`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' }
              });
              
              // Update local state
              const updated = notifs.map(n => ({ ...n, read: true }));
              setNotifs(updated);
              
              toast('All notifications marked as read', {
                style: {
                  background: '#2F7D5F',
                  color: 'white',
                },
              });
            } catch (error) {
              console.error('Error marking notifications as read:', error);
            }
          }} className="text-xs text-button-primary font-medium hover:underline">Mark all read</button>
          <span className="text-gray-300">|</span>
          <button onClick={async () => {
            try {
              if (!user?.email) return;
              
              // Get user ID
              const userResponse = await fetch(`${BACKEND_URL}/api/users/email/${user.email}`);
              const userData = await userResponse.json();
              const userId = userData.user.id;
              
              // Clear all notifications in backend
              await fetch(`${BACKEND_URL}/api/users/${userId}/notifications`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
              });
              
              // Update local state
              setNotifs([]);
              
              toast('All notifications cleared', {
                style: {
                  background: '#6B7280',
                  color: 'white',
                },
              });
            } catch (error) {
              console.error('Error clearing notifications:', error);
            }
          }} className="text-xs text-red-500 font-medium hover:underline">Clear all</button>
        </div>
      </div>
      {notifs.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 border border-gray-100 dark:border-gray-700 shadow-sm text-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <BellIcon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
          </div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">No notifications</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">You're all caught up! Check back later for updates.</p>
        </div>
      ) : (
        <>
          {/* Today */}
          {notifs.filter(n => (Date.now() - n.ts) < 86400000).length > 0 && (
        <div className="mb-4">
          <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Today</p>
          <div className="space-y-2">
            {notifs.filter(n => (Date.now() - n.ts) < 86400000).map((n, i) => (
              <motion.div key={n.id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                className={`bg-white dark:bg-gray-800 rounded-2xl p-3 border shadow-sm flex gap-3 items-start transition-all ${n.read ? 'border-gray-100 dark:border-gray-700' : 'border-button-primary/20 bg-button-primary/[0.02]'}`}>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${n.type === 'success' ? 'bg-green-100' : n.type === 'warning' ? 'bg-amber-100' : 'bg-blue-100'}`}>
                  {n.type === 'success' ? <CheckCircleIcon className="w-4 h-4 text-green-600" /> : n.type === 'warning' ? <AlertTriangleIcon className="w-4 h-4 text-amber-600" /> : <BellIcon className="w-4 h-4 text-blue-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5"><p className="text-xs font-semibold text-gray-900 dark:text-white">{n.title}</p>{!n.read && <span className="w-1.5 h-1.5 bg-button-primary rounded-full flex-shrink-0" />}</div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">{n.msg}</p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 flex items-center gap-1"><ClockIcon className="w-2.5 h-2.5" />{n.time}</p>
                </div>
                <button onClick={() => {
                  const updated = notifs.map(x => x.id === n.id ? { ...x, read: true } : x)
                  setNotifs(updated)
                  setLS('fm_owner_notifs', updated)
                }} className="p-1 text-gray-300 hover:text-gray-500 rounded-lg flex-shrink-0"><XIcon className="w-3 h-3" /></button>
              </motion.div>
            ))}
          </div>
        </div>
      )}
      {/* Earlier */}
      {notifs.filter(n => (Date.now() - n.ts) >= 86400000).length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Earlier</p>
          <div className="space-y-2">
            {notifs.filter(n => (Date.now() - n.ts) >= 86400000).map((n, i) => (
              <motion.div key={n.id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-white dark:bg-gray-800 rounded-2xl p-3 border border-gray-100 dark:border-gray-700 shadow-sm flex gap-3 items-start opacity-75">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${n.type === 'success' ? 'bg-green-100' : n.type === 'warning' ? 'bg-amber-100' : 'bg-blue-100'}`}>
                  {n.type === 'success' ? <CheckCircleIcon className="w-4 h-4 text-green-600" /> : n.type === 'warning' ? <AlertTriangleIcon className="w-4 h-4 text-amber-600" /> : <BellIcon className="w-4 h-4 text-blue-500" />}
                </div>
                <div className="flex-1"><p className="text-xs font-medium text-gray-700 dark:text-gray-200">{n.title}</p><p className="text-[11px] text-gray-500 dark:text-gray-400">{n.msg}</p><p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 flex items-center gap-1"><ClockIcon className="w-2.5 h-2.5" />{n.time}</p></div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
        </>
      )}
    </motion.div>
  )


  // ── HISTORY ──────────────────────────────────────────────────────────────────
  case 'settings': return <OwnerSettingsPanel user={user} />

  default: return null
  }}

  const hdrMap: Record<string, string> = { overview: 'Owner Dashboard', properties: `Welcome, ${user?.name?.split(' ')[0] || 'Owner'}`, tenants: `Welcome, ${user?.name?.split(' ')[0] || 'Owner'}`, bookings: `Welcome, ${user?.name?.split(' ')[0] || 'Owner'}`, analytics: `Welcome, ${user?.name?.split(' ')[0] || 'Owner'}`, messages: `Welcome, ${user?.name?.split(' ')[0] || 'Owner'}`, notifications: `Welcome, ${user?.name?.split(' ')[0] || 'Owner'}`, settings: `Welcome, ${user?.name?.split(' ')[0] || 'Owner'}` }
  const subMap: Record<string, string> = { overview: 'Manage properties and track performance', properties: 'Your property listings', tenants: 'Manage your tenants', bookings: 'Booking requests and confirmations', analytics: 'Revenue and performance analytics', messages: 'Chat with tenants and applicants', notifications: 'Recent alerts and updates', settings: 'Account and preferences' }

  return (
    <main className="min-h-screen bg-gray-50/60 dark:bg-gray-900 flex">
      {/* SIDEBAR */}
      <aside className={`${sidebarCollapsed ? 'w-14' : 'w-60'} bg-white dark:bg-gray-800 border-r border-gray-100 dark:border-gray-700 min-h-screen sticky top-0 hidden lg:flex flex-col transition-all duration-300 flex-shrink-0 shadow-sm`}>
        <div className="p-4 flex flex-col h-full">
          <div className="flex items-center justify-between mb-5">
            {!sidebarCollapsed && <div className="flex items-center gap-2"><div className="w-7 h-7 bg-gradient-to-br from-button-primary to-primary rounded-xl flex items-center justify-center"><span className="text-white font-bold text-sm">F</span></div><span className="text-gray-900 dark:text-white font-bold text-sm">Flat-Mate</span></div>}
            <button onClick={() => setSidebarCollapsed(v => !v)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors ml-auto"><MenuIcon className="w-4 h-4 text-gray-400 dark:text-gray-500" /></button>
          </div>
          {!sidebarCollapsed && <div className="flex items-center gap-2.5 mb-4 p-2.5 bg-gradient-to-r from-button-primary/5 to-blue-50 dark:from-button-primary/10 dark:to-blue-900/20 rounded-xl border border-button-primary/10 dark:border-button-primary/20">
            <div className="w-8 h-8 bg-button-primary rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0">{(user?.name || 'O').charAt(0)}</div>
            <div className="min-w-0"><p className="font-semibold text-gray-900 dark:text-white text-xs truncate">{user?.name || 'Owner'}</p><p className="text-[10px] text-gray-400 dark:text-gray-500">Property Owner</p></div>
          </div>}
          <nav className="space-y-0.5 flex-1">
            {TABS.map(tab => {
              const Icon = tab.icon, isActive = activeTab === tab.id
              // Calculate actual unread counts from real data
              const badge = tab.id === 'messages' ? messageUnreadCount : tab.id === 'notifications' ? unreadNotifs : tab.id === 'bookings' ? myBookings.filter((b: any) => b.status === 'pending').length : 0
              return (
                <motion.button key={tab.id} whileHover={{ x: sidebarCollapsed ? 0 : 2 }} whileTap={{ scale: 0.97 }} onClick={() => setActiveTab(tab.id)} title={sidebarCollapsed ? tab.label : undefined}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium transition-all ${isActive ? 'bg-button-primary/8 text-button-primary font-semibold' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-gray-200'}`}
                  style={isActive ? { backgroundColor: 'rgba(47,125,95,0.08)' } : {}}>
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-button-primary' : 'text-gray-400 dark:text-gray-500'}`} />
                  {!sidebarCollapsed && <><span>{tab.label}</span>{badge > 0 && <span className="ml-auto min-w-[16px] h-4 px-1 bg-red-400 text-white text-[9px] rounded-full flex items-center justify-center font-bold">{badge}</span>}</>}
                </motion.button>
              )
            })}
          </nav>
          <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
            <motion.button whileHover={{ x: sidebarCollapsed ? 0 : 2 }} onClick={handleLogout} className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all font-medium">
              <LogOutIcon className="w-4 h-4 flex-shrink-0" />{!sidebarCollapsed && 'Sign Out'}
            </motion.button>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-5 py-3.5 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(v => !v)} className="lg:hidden p-1.5 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600"><MenuIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" /></button>
            <div><h1 className="text-sm font-bold text-gray-900 dark:text-white">{hdrMap[activeTab]}</h1><p className="text-[11px] text-gray-400 dark:text-gray-500">{subMap[activeTab]}</p></div>
          </div>
          <div className="flex items-center gap-1.5">
            <motion.button whileTap={{ rotate: 180 }} onClick={handleRefresh} disabled={refreshing} className="p-2 text-gray-400 dark:text-gray-500 hover:text-button-primary hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors">
              <motion.div animate={refreshing ? { rotate: 360 } : {}} transition={refreshing ? { duration: 0.8, repeat: Infinity, ease: 'linear' } : {}}><RefreshCwIcon className="w-4 h-4" /></motion.div>
            </motion.button>
            <div className="relative">
              <button onClick={() => setActiveTab('notifications')} className="p-2 text-gray-400 dark:text-gray-500 hover:text-button-primary hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors"><BellIcon className="w-4 h-4" /></button>
              {unreadNotifs > 0 && <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-400 text-white text-[9px] rounded-full flex items-center justify-center font-bold">{unreadNotifs}</span>}
            </div>
            <button onClick={() => setActiveTab('settings')} className="w-8 h-8 bg-button-primary/10 rounded-full flex items-center justify-center text-button-primary font-bold text-sm hover:bg-button-primary/20 transition-colors overflow-hidden">
              {profilePhoto ? (
                <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                (user?.name || 'O').charAt(0)
              )}
            </button>
          </div>
        </header>

        <AnimatePresence>
          {mobileOpen && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="lg:hidden bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="px-4 py-2.5 flex flex-wrap gap-1.5">
              {TABS.map(tab => { const Icon = tab.icon; return <button key={tab.id} onClick={() => { setActiveTab(tab.id); setMobileOpen(false) }} className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-medium transition-all ${activeTab === tab.id ? 'bg-button-primary text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}><Icon className="w-3 h-3" />{tab.label}</button> })}
            </div>
          </motion.div>}
        </AnimatePresence>

        <div className="flex-1 p-5 overflow-auto">
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.16 }}>
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {selectedApp && <ApplicationModal app={selectedApp} onClose={() => setSelectedApp(null)} onApprove={approveApp} onReject={rejectApp} />}
        {deleteModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteModal(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92 }} transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              className="relative bg-white rounded-3xl p-7 w-full max-w-md shadow-2xl z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertTriangleIcon className="w-6 h-6 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-black text-gray-900">Delete Property?</h3>
                  <p className="text-sm text-gray-500">This action cannot be undone</p>
                </div>
                <button onClick={() => setDeleteModal(null)} className="p-1.5 hover:bg-gray-100 rounded-full">
                  <XIcon className="w-4 h-4 text-gray-400" />
                </button>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 mb-5">
                <p className="text-sm text-gray-700 font-medium mb-1">{deleteModal.title}</p>
                <p className="text-xs text-gray-500">This property will be removed from your dashboard and will no longer be visible to tenants.</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setDeleteModal(null)}
                  className="flex-1 py-2.5 border-2 border-gray-200 text-gray-600 font-semibold rounded-xl text-sm hover:border-gray-300 transition-all">
                  Cancel
                </button>
                <button onClick={() => handleDeleteProperty(deleteModal.id)}
                  className="flex-1 py-2.5 bg-red-500 text-white font-bold rounded-xl text-sm hover:bg-red-600 transition-all">
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
        {deleteTenantModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteTenantModal(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92 }} transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              className="relative bg-white rounded-3xl p-7 w-full max-w-md shadow-2xl z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertTriangleIcon className="w-6 h-6 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-black text-gray-900">Delete Tenant?</h3>
                  <p className="text-sm text-gray-500">Remove {deleteTenantModal.name}</p>
                </div>
                <button onClick={() => setDeleteTenantModal(null)} className="p-1.5 hover:bg-gray-100 rounded-full">
                  <XIcon className="w-4 h-4 text-gray-400" />
                </button>
              </div>
              <p className="text-sm text-gray-600 mb-5">Are you sure you want to remove this tenant? This action cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteTenantModal(null)}
                  className="flex-1 py-2.5 border-2 border-gray-200 text-gray-600 font-semibold rounded-xl text-sm hover:border-gray-300 transition-all">
                  Cancel
                </button>
                <button onClick={() => deleteTenant(deleteTenantModal.id)}
                  className="flex-1 py-2.5 bg-red-500 text-white font-bold rounded-xl text-sm hover:bg-red-600 transition-all">
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
        {blockTenantModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setBlockTenantModal(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92 }} transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              className="relative bg-white rounded-3xl p-7 w-full max-w-md shadow-2xl z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <LockIcon className="w-6 h-6 text-amber-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-black text-gray-900">Block Tenant</h3>
                  <p className="text-sm text-gray-500">{blockTenantModal.name}</p>
                </div>
                <button onClick={() => { setBlockTenantModal(null); setBlockReason('') }} className="p-1.5 hover:bg-gray-100 rounded-full">
                  <XIcon className="w-4 h-4 text-gray-400" />
                </button>
              </div>
              <div className="mb-5">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Reason for Blocking *</label>
                <textarea value={blockReason} onChange={e => setBlockReason(e.target.value)} rows={3}
                  placeholder="Enter reason for blocking this tenant..."
                  className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-button-primary resize-none" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setBlockTenantModal(null); setBlockReason('') }}
                  className="flex-1 py-2.5 border-2 border-gray-200 text-gray-600 font-semibold rounded-xl text-sm hover:border-gray-300 transition-all">
                  Cancel
                </button>
                <button onClick={() => blockTenant(blockTenantModal.id, blockReason)}
                  className="flex-1 py-2.5 bg-amber-500 text-white font-bold rounded-xl text-sm hover:bg-amber-600 transition-all">
                  Block Tenant
                </button>
              </div>
            </motion.div>
          </div>
        )}
        {showAddPropertyModal && (
          <AddPropertyModal 
            onClose={() => setShowAddPropertyModal(false)} 
            onAdd={handlePropertyAdded}
            editingProperty={editingProperty}
          />
        )}
      </AnimatePresence>
    </main>
  )
}

