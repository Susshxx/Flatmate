/**
 * ADMIN DASHBOARD - Administrative control panel for platform management
 * 
 * PURPOSE:
 * - Centralized admin interface for managing users, properties, and platform content
 * - Provides oversight and moderation tools for the entire Flat-Mate platform
 * 
 * KEY FEATURES:
 * 1. Overview: Platform statistics, recent activities, contact messages, and quick actions
 * 2. User Management: View, approve, mute, archive, or delete users (tenants/owners)
 * 3. Property Management: Review, approve, reject, or delete property listings
 * 4. Requirements: Manage roommate requirement posts from Find Roommate page
 * 5. Contact Messages: View and respond to messages from Contact Us form
 * 6. Analytics: Charts showing user growth, property listings, and platform activity
 * 7. Settings: Admin profile management and system preferences
 * 
 * DATA FLOW:
 * - Auth: useAuth() hook provides admin user data
 * - Users: Mock data stored in component state (can be connected to backend)
 * - Properties: propertyAPI.ts fetches all properties from backend
 * - Contact Messages: GET /api/contact/messages fetches form submissions
 * - Requirements: localStorage stores roommate posts under key `fm_requirements`
 * - Notifications: localStorage stores admin alerts under key `fm_admin_notifs`
 * 
 * BACKEND CONNECTIONS:
 * - GET /api/properties - Fetches all property listings for review
 * - PUT /api/properties/:id - Updates property status (approve/reject)
 * - DELETE /api/properties/:id - Removes property listing
 * - GET /api/contact/messages - Fetches contact form submissions
 * - (Future) POST /api/users/:id/status - Update user account status
 * 
 * ADMIN ACTIONS:
 * - Approve/Reject Properties: Updates property.status field in database
 * - User Management: Mute, archive, or delete user accounts
 * - Contact Messages: View details and mark as handled
 * - Requirements: Approve, reject, or delete roommate posts
 * 
 * COMPONENT STRUCTURE:
 * - StatsCard: Displays key metrics with icons
 * - UserTable: Filterable table of all platform users
 * - PropertyGrid: Grid view of properties pending approval
 * - ContactMessageModal: Popup showing full message details
 * - Main Dashboard: Tab-based navigation with top header
 * 
 * STATE MANAGEMENT:
 * - users: Mock data array (can be replaced with API call)
 * - properties: Fetched from backend, auto-refreshes every 5s
 * - contactMessages: Fetched from backend on mount
 * - reqList: Loaded from localStorage `fm_requirements`
 * - filters: Local state for search and filtering
 */

// src/pages/AdminDashboard.tsx 
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  HomeIcon, UsersIcon, BuildingIcon, SettingsIcon, LogOutIcon, TrendingUpIcon,
  BellIcon, ShieldCheckIcon, AlertTriangleIcon, CheckCircleIcon, BarChart3Icon,
  XIcon, TrashIcon, EyeIcon, UserCheckIcon, ClipboardListIcon, SearchIcon,
  PlusIcon, FilterIcon, ChevronDownIcon, StarIcon, CalendarIcon, DollarSignIcon,
  ActivityIcon, MapPinIcon, ShieldAlertIcon, RefreshCcwIcon, MenuIcon, CheckIcon,
  LockIcon, ArchiveIcon, VolumeXIcon, PhoneIcon, MailIcon, ClockIcon,
  PaletteIcon, SunIcon, MoonIcon, BellRingIcon, UserXIcon, FlagIcon,
  ChevronLeftIcon, ChevronRightIcon,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { toast } from 'sonner'

// ─── localStorage helpers ─────────────────────────────────────────────────────
const ls  = (k: string, fb = '[]') => { try { return JSON.parse(localStorage.getItem(k) || fb) } catch { return JSON.parse(fb) } }
const setLS = (k: string, v: any)  => { try { localStorage.setItem(k, JSON.stringify(v)) } catch {} }
const getBookings     = () => ls('fm_bookings')
const getRequirements = () => ls('fm_requirements')
const getBlockedOwners= (): string[] => ls('fm_blocked_owners')
const saveBlockedOwners = (ids: string[]) => setLS('fm_blocked_owners', ids)

// ─── Theme helpers ─────────────────────────────────────────────────────────────
const THEMES: Record<string, { primary: string; button: string; label: string }> = {
  lavender: { primary:'#7C3AED', button:'#A78BFA', label:'Lavender' },
  ocean:    { primary:'#0C4A6E', button:'#0284C7', label:'Ocean Blue' },
  purple:   { primary:'#6B21A8', button:'#9333EA', label:'Purple' },
  emerald:  { primary:'#065F46', button:'#10B981', label:'Emerald Green' },
  diamond:  { primary:'#475569', button:'#94A3B8', label:'Diamond' },
}
function applyTheme(key: string) {
  const t = THEMES[key] || THEMES.emerald
  document.documentElement.style.setProperty('--color-primary', t.primary)
  document.documentElement.style.setProperty('--color-button-primary', t.button)
  setLS('fm_theme', { key })
}

// ─── Mock data ────────────────────────────────────────────────────────────────
const TODAY = new Date()
const fmt   = (d: Date) => d.toISOString().split('T')[0]
const daysAgo = (n: number) => fmt(new Date(Date.now() - n * 86400000))

const INIT_USERS = [
  { id:'u1', firstName:'Anita',   lastName:'Thapa',    email:'anita@example.com',    phone:'+977 9801000001', role:'tenant', status:'active',  joined: daysAgo(45), lastAccess: daysAgo(0),  reports:0, billings:2,  bookings:1, muted:false, blocked:false, archived:false, reportReason:'' },
  { id:'u2', firstName:'Rajesh',  lastName:'Sharma',   email:'rajesh@example.com',   phone:'+977 9801000002', role:'owner',  status:'active',  joined: daysAgo(60), lastAccess: daysAgo(0),  reports:0, billings:5,  bookings:0, muted:false, blocked:false, archived:false, reportReason:'' },
  { id:'u3', firstName:'Sita',    lastName:'Gurung',   email:'sita@example.com',     phone:'+977 9801000003', role:'tenant', status:'pending', joined: daysAgo(3),  lastAccess: daysAgo(1),  reports:0, billings:0,  bookings:0, muted:false, blocked:false, archived:false, reportReason:'' },
  { id:'u4', firstName:'Krishna', lastName:'Adhikari', email:'krishna@example.com',  phone:'+977 9801000004', role:'owner',  status:'pending', joined: daysAgo(10), lastAccess: daysAgo(2),  reports:1, billings:1,  bookings:0, muted:false, blocked:false, archived:false, reportReason:'Listed false property information and overcharged tenants.' },
  { id:'u5', firstName:'Maya',    lastName:'Rai',      email:'maya@example.com',     phone:'+977 9801000005', role:'tenant', status:'active',  joined: daysAgo(90), lastAccess: daysAgo(0),  reports:0, billings:3,  bookings:2, muted:false, blocked:false, archived:false, reportReason:'' },
  { id:'u6', firstName:'Bikash',  lastName:'Thapa',    email:'bikash@example.com',   phone:'+977 9801000006', role:'tenant', status:'active',  joined: daysAgo(30), lastAccess: daysAgo(0),  reports:2, billings:1,  bookings:1, muted:true,  blocked:false, archived:false, reportReason:'Spam messaging multiple property owners with fraudulent requests.' },
  { id:'u7', firstName:'Priya',   lastName:'Maharjan', email:'priya@example.com',    phone:'+977 9801000007', role:'owner',  status:'active',  joined: daysAgo(120),lastAccess: daysAgo(0),  reports:0, billings:8,  bookings:0, muted:false, blocked:false, archived:false, reportReason:'' },
]

const HIGH_DEMAND_LOCS = ['Thamel, Kathmandu','Lazimpat, Kathmandu','Patan, Lalitpur','Lakeside, Pokhara']

const MONTHLY_INCOME = [
  { m:'Jan', income:320000, expense:180000 }, { m:'Feb', income:410000, expense:200000 },
  { m:'Mar', income:390000, expense:195000 }, { m:'Apr', income:480000, expense:220000 },
  { m:'May', income:520000, expense:235000 }, { m:'Jun', income:610000, expense:280000 },
]
const GROWTH = [
  {m:'Jan',users:120},{m:'Feb',users:165},{m:'Mar',users:210},
  {m:'Apr',users:280},{m:'May',users:350},{m:'Jun',users:430},
]
const SATISFACTION = [
  {label:'Very Happy',value:48,color:'#64dd90ff'},{label:'Happy',value:29,color:'#b0fb1aff'},
  {label:'Neutral',value:14,color:'#eed56fff'},{label:'Unhappy',value:6,color:'#f04c4cff'},
  {label:'Very Sad',value:3,color:'#ea6a6aff'},
]
const USER_DIST = [
  {label:'Tenants',value:70,color:'#3B82F6'},{label:'Owners',value:25,color:'#f6a65cff'},
  {label:'Admins',value:5,color:'#EC4899'},
]
const PREF_LOCS = [
  {label:'Kathmandu',value:45,color:'#f16464ff'},{label:'Lalitpur',value:22,color:'#2082f1ff'},
  {label:'Pokhara',value:18,color:'#f5da6cff'},{label:'Bhaktapur',value:9,color:'#ee59abff'},
  {label:'Others',value:6,color:'#b91a44ff'},
]
const MONTHLY_SIGNUPS = [
  {m:'Jan',v:45,color:'#3B82F6'},{m:'Feb',v:62,color:'#8B5CF6'},
  {m:'Mar',v:58,color:'#EC4899'},{m:'Apr',v:75,color:'#2F7D5F'},
  {m:'May',v:89,color:'#0EA5E9'},{m:'Jun',v:102,color:'#F59E0B'},
]
const ALERTS_INIT = [
  {id:'a1',type:'security', msg:'3 failed login attempts on maya@example.com',  time:'10m ago',severity:'high'},
  {id:'a2',type:'report',   msg:'Bikash Thapa reported for suspicious activity', time:'2h ago', severity:'medium'},
  {id:'a3',type:'booking',  msg:'High demand spike in Thamel — 18 bookings',    time:'4h ago', severity:'low'},
  {id:'a4',type:'payment',  msg:'Payment dispute raised for Booking #BK-0012',  time:'1d ago', severity:'medium'},
]
const ACTIVITIES = [
  {icon:'requirement', msg:'New requirement submitted by Anita Thapa',time:'5m ago', color:'bg-blue-50 text-blue-600'},
  {icon:'booking',     msg:'Property "Modern 2BHK" booked by Maya Rai',time:'12m ago', color:'bg-emerald-50 text-emerald-600'},
  {icon:'user',        msg:'New user registration: Bikash Thapa',time:'28m ago', color:'bg-purple-50 text-purple-600'},
  {icon:'payment',     msg:'Payment confirmed: NPR 32,000 received',time:'1h ago', color:'bg-amber-50 text-amber-600'},
  {icon:'alert',       msg:'Report filed against Krishna Adhikari',time:'2h ago', color:'bg-red-50 text-red-600'},
  {icon:'check',       msg:'Requirement approved: Priya Adhikari',time:'3h ago', color:'bg-teal-50 text-teal-600'},
]
const RISK = [
  {label:'Low Risk', pct:62,colorClass:'bg-emerald-300',color:'#86EFAC'},
  {label:'Medium Risk',pct:27,colorClass:'bg-amber-300',color:'#FCD34D'},
  {label:'High Risk',pct:11,colorClass:'bg-red-300',color:'#f41212ff'},
]
const PERF = [
  {label:'Booking Rate',      v:78,color:'#A7F3D0'},
  {label:'Property Fill Rate',v:64,color:'#93C5FD'},
  {label:'Response Rate',     v:91,color:'#896ff3ff'},
  {label:'Repeat Customers',  v:43,color:'#FDE68A'},
]

// ─── Utility ──────────────────────────────────────────────────────────────────
function daysSince(d: string) {
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return '1 day ago'
  return `${diff} days ago`
}

// ─── Chart components ─────────────────────────────────────────────────────────
function ProfitBarChart({ data }: { data:typeof MONTHLY_INCOME }) {
  const max = Math.max(...data.map(d => d.income))
  return (
    <div className="flex items-end gap-2 h-36">
      {data.map((d,i) => (
        <div key={d.m} className="flex-1 flex flex-col items-center gap-0.5 group relative">
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
            NPR {(d.income/1000).toFixed(0)}K
          </div>
          <motion.div initial={{height:0}} animate={{height:`${(d.income/max)*100}%`}}
            transition={{delay:i*0.08,duration:0.6,ease:[0.16,1,0.3,1]}}
            className="w-full rounded-t-lg bg-gradient-to-t from-emerald-600 to-emerald-400 min-h-[4px] cursor-pointer hover:from-emerald-500 hover:to-emerald-300 transition-colors"/>
          <motion.div initial={{height:0}} animate={{height:`${(d.expense/max)*100}%`}}
            transition={{delay:i*0.08+0.1,duration:0.6,ease:[0.16,1,0.3,1]}}
            className="w-full rounded-b-sm bg-gradient-to-b from-red-400 to-red-200 min-h-[2px] cursor-pointer"/>
          <span className="text-[10px] text-gray-400 mt-1.5 font-medium">{d.m}</span>
        </div>
      ))}
    </div>
  )
}

function GrowthLineChart({ data }: { data:typeof GROWTH }) {
  const max = Math.max(...data.map(d => d.users))
  const min = Math.min(...data.map(d => d.users))
  const pts = data.map((d,i) => `${(i/(data.length-1))*100},${100 - ((d.users-min)/(max-min))*80}`)
  const areaPath = `M ${pts.join(' L ')} L 100,100 L 0,100 Z`
  return (
    <div className="relative">
      <svg viewBox="0 0 100 110" className="w-full h-32" preserveAspectRatio="none">
        <defs>
          <linearGradient id="growGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.35"/>
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0"/>
          </linearGradient>
        </defs>
        <motion.path d={areaPath} fill="url(#growGrad)" initial={{opacity:0}} animate={{opacity:1}} transition={{duration:0.8}}/>
        <motion.polyline points={pts.join(' ')} fill="none" stroke="#3B82F6" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round"
          initial={{pathLength:0}} animate={{pathLength:1}} transition={{duration:1.2,ease:'easeOut'}}/>
        {data.map((d,i) => (
          <motion.circle key={d.m} cx={(i/(data.length-1))*100} cy={100-((d.users-min)/(max-min))*80} r="3"
            fill="white" stroke="#3B82F6" strokeWidth="2"
            initial={{r:0}} animate={{r:3}} transition={{delay:0.8+i*0.1}}>
            <title>{d.m}: {d.users} users</title>
          </motion.circle>
        ))}
      </svg>
      <div className="flex justify-between -mt-1">
        {data.map(d => <span key={d.m} className="text-[10px] text-gray-400 font-medium">{d.m}</span>)}
      </div>
    </div>
  )
}

function DonutChart({ data, size=120 }: { data:{label:string;value:number;color:string}[]; size?:number }) {
  const total = data.reduce((s,d) => s+d.value, 0)
  let angle = -Math.PI/2
  const r = 40, cx = 50, cy = 50, stroke = 14
  const innerR = r - stroke
  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 100 100" className="flex-shrink-0" style={{width:size,height:size}}>
        {data.map((d,i) => {
          const sweep = (d.value/total)*2*Math.PI
          const x1=cx+r*Math.cos(angle), y1=cy+r*Math.sin(angle)
          angle+=sweep
          const x2=cx+r*Math.cos(angle), y2=cy+r*Math.sin(angle)
          const large = sweep>Math.PI ? 1 : 0
          return (
            <motion.path key={i}
              d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`}
              fill={d.color}
              initial={{scale:0,opacity:0}} animate={{scale:1,opacity:1}}
              transition={{delay:i*0.08,duration:0.4,ease:[0.16,1,0.3,1]}}
              style={{transformOrigin:`${cx}px ${cy}px`}}
              className="hover:opacity-80 transition-opacity cursor-pointer">
              <title>{d.label}: {d.value}%</title>
            </motion.path>
          )
        })}
        <circle cx={cx} cy={cy} r={innerR} fill="white"/>
        <text x={cx} y={cy-4} textAnchor="middle" fontSize="10" fontWeight="800" fill="#111">
          {total}%
        </text>
        <text x={cx} y={cy+8} textAnchor="middle" fontSize="6" fill="#9CA3AF">total</text>
      </svg>
      <div className="flex-1 space-y-1.5">
        {data.map(d => (
          <div key={d.label} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{background:d.color}}/>
            <span className="text-xs text-gray-600 flex-1 truncate">{d.label}</span>
            <span className="text-xs font-bold text-gray-800">{d.value}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function SignupBarChart({ data }: { data:typeof MONTHLY_SIGNUPS }) {
  const max = Math.max(...data.map(d => d.v))
  return (
    <div className="flex items-end gap-2 h-28">
      {data.map((d,i) => (
        <div key={d.m} className="flex-1 flex flex-col items-center gap-0.5 group relative">
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
            {d.v} users
          </div>
          <motion.div initial={{height:0}} animate={{height:`${(d.v/max)*90}%`}}
            transition={{delay:i*0.08,duration:0.55,ease:[0.16,1,0.3,1]}}
            className="w-full rounded-t-lg min-h-[4px] hover:brightness-110 transition-all cursor-pointer"
            style={{background:d.color}}/>
          <span className="text-[10px] text-gray-400 mt-1 font-medium">{d.m}</span>
        </div>
      ))}
    </div>
  )
}

function PerformanceRadial({ data }: { data:typeof PERF }) {
  return (
    <div className="space-y-3">
      {data.map((s,i) => (
        <div key={s.label}>
          <div className="flex justify-between text-xs mb-1">
            <span className="font-medium text-gray-700">{s.label}</span>
            <span className="font-bold text-gray-900">{s.v}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
            <motion.div className="h-2.5 rounded-full"
              style={{background:s.color}}
              initial={{width:0}} animate={{width:`${s.v}%`}}
              transition={{delay:0.3+i*0.1,duration:0.7,ease:[0.16,1,0.3,1]}}/>
          </div>
        </div>
      ))}
    </div>
  )
}

function MiniCalendar() {
  const now=new Date(), y=now.getFullYear(), mo=now.getMonth(), day=now.getDate()
  const firstDay=new Date(y,mo,1).getDay(), daysInMonth=new Date(y,mo+1,0).getDate()
  const months=['January','February','March','April','May','June','July','August','September','October','November','December']
  const wdays=['Su','Mo','Tu','We','Th','Fr','Sa']
  const cells:(number|null)[]=Array(firstDay).fill(null)
  for(let d=1;d<=daysInMonth;d++) cells.push(d)
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="font-bold text-gray-900 text-sm">{months[mo]} {y}</span>
        <span className="text-xs bg-button-primary text-white px-2.5 py-1 rounded-full font-bold">Today {day}</span>
      </div>
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {wdays.map(d=><div key={d} className="text-[10px] text-gray-400 text-center font-bold">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((d,i)=>(
          <motion.div key={i} whileHover={d?{scale:1.15}:{}}
            className={`aspect-square flex items-center justify-center rounded-lg text-xs font-medium transition-colors cursor-pointer
              ${!d?''
                :d===day?'bg-button-primary text-white font-black shadow-md ring-2 ring-button-primary/20'
                :'text-gray-500 hover:bg-gray-100'}`}>
            {d||''}
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// ─── Add User Modal ────────────────────────────────────────────────────────────
function AddUserModal({ onClose, onAdd }: { onClose:()=>void; onAdd:(u:any)=>void }) {
  const [form, setForm] = useState({firstName:'',lastName:'',email:'',phone:'',role:'tenant',status:'active'})
  const [errors, setErrors] = useState<Record<string,string>>({})
  const [saving, setSaving] = useState(false)
  const roles = ['tenant','owner','admin']

  const validate = () => {
    const e: Record<string,string> = {}
    if (!form.firstName.trim()) e.firstName = 'First name required'
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Valid email required'
    if (form.phone && !/^\+?[\d\s\-]{7,}$/.test(form.phone)) e.phone = 'Valid phone required'
    setErrors(e); return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    try {
      await new Promise(r=>setTimeout(r,700))
      onAdd({...form, id:`u${Date.now()}`, joined:new Date().toISOString().split('T')[0], lastAccess:new Date().toISOString().split('T')[0], reports:0,billings:0,bookings:0,muted:false,blocked:false,archived:false,reportReason:''})
      toast.success('User added successfully!')
      onClose()
    } catch { toast.error('Failed to add user') }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}/>
      <motion.div initial={{opacity:0,scale:0.92,y:20}} animate={{opacity:1,scale:1,y:0}}
        exit={{opacity:0,scale:0.92}} transition={{type:'spring',stiffness:320,damping:28}}
        className="relative bg-white rounded-3xl p-7 w-full max-w-md shadow-2xl z-10">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-black text-xl text-gray-900">Add New User</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><XIcon className="w-5 h-5 text-gray-400"/></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[{k:'firstName',pl:'Ram',lbl:'First Name *'},{k:'lastName',pl:'Thapa',lbl:'Last Name'}].map(f=>(
              <div key={f.k}>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{f.lbl}</label>
                <input value={(form as any)[f.k]} onChange={e=>setForm({...form,[f.k]:e.target.value})} placeholder={f.pl}
                  className={`w-full px-3 py-2.5 border-2 rounded-xl text-sm focus:outline-none focus:border-button-primary transition-all ${errors[f.k]?'border-red-400 bg-red-50':'border-gray-200'}`}/>
                {errors[f.k]&&<p className="text-red-500 text-xs mt-1">{errors[f.k]}</p>}
              </div>
            ))}
          </div>
          {[{k:'email',pl:'user@example.com',lbl:'Email *',type:'email'},{k:'phone',pl:'+977 98XXXXXXXX',lbl:'Phone',type:'tel'}].map(f=>(
            <div key={f.k}>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{f.lbl}</label>
              <input type={f.type} value={(form as any)[f.k]} onChange={e=>setForm({...form,[f.k]:e.target.value})} placeholder={f.pl}
                className={`w-full px-3 py-2.5 border-2 rounded-xl text-sm focus:outline-none focus:border-button-primary transition-all ${errors[f.k]?'border-red-400 bg-red-50':'border-gray-200'}`}/>
              {errors[f.k]&&<p className="text-red-500 text-xs mt-1">{errors[f.k]}</p>}
            </div>
          ))}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Role</label>
              <div className="flex gap-1 flex-wrap">
                {roles.map(r=>(
                  <button key={r} type="button" onClick={()=>setForm({...form,role:r})}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-all capitalize ${form.role===r?'bg-button-primary text-white border-button-primary':'bg-white border-gray-200 text-gray-600 hover:border-button-primary hover:text-button-primary'}`}>
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Status</label>
              <div className="flex gap-1">
                {['active','pending'].map(s=>(
                  <button key={s} type="button" onClick={()=>setForm({...form,status:s})}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-all capitalize ${form.status===s?'bg-button-primary text-white border-button-primary':'bg-white border-gray-200 text-gray-600 hover:border-button-primary hover:text-button-primary'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border-2 border-gray-200 text-gray-600 font-semibold rounded-xl text-sm hover:border-gray-300 transition-all">Cancel</button>
            <motion.button type="submit" disabled={saving} whileHover={{scale:1.02}} whileTap={{scale:0.97}}
              className="flex-1 py-2.5 bg-button-primary text-white font-bold rounded-xl text-sm hover:bg-button-primary/90 disabled:opacity-60 transition-all flex items-center justify-center gap-2">
              {saving&&<motion.div animate={{rotate:360}} transition={{duration:0.7,repeat:Infinity,ease:'linear'}} className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full"/>}
              {saving?'Adding...':'Add User'}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

// ─── Block Reason Modal ────────────────────────────────────────────────────────
function BlockReasonModal({ user, onClose, onConfirm }: { user:any; onClose:()=>void; onConfirm:(reason:string)=>void }) {
  const [reason, setReason] = useState('')
  const [err, setErr] = useState('')
  const isBlocked = user.blocked

  const handleConfirm = () => {
    if (!isBlocked && !reason.trim()) { setErr('Please enter a reason for blocking'); return }
    onConfirm(reason)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}/>
      <motion.div initial={{opacity:0,scale:0.92,y:20}} animate={{opacity:1,scale:1,y:0}}
        exit={{opacity:0,scale:0.92}} transition={{type:'spring',stiffness:320,damping:28}}
        className="relative bg-white rounded-3xl p-7 w-full max-w-sm shadow-2xl z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isBlocked?'bg-green-100':'bg-red-100'}`}>
            <LockIcon className={`w-5 h-5 ${isBlocked?'text-green-600':'text-red-600'}`}/>
          </div>
          <div>
            <h3 className="font-black text-gray-900">{isBlocked?'Unblock User':'Block User'}</h3>
            <p className="text-sm text-gray-500">{user.firstName} {user.lastName}</p>
          </div>
          <button onClick={onClose} className="ml-auto p-1.5 hover:bg-gray-100 rounded-full"><XIcon className="w-4 h-4 text-gray-400"/></button>
        </div>
        {!isBlocked && (
          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Reason for Blocking *</label>
            <textarea value={reason} onChange={e=>{setReason(e.target.value);setErr('')}} rows={3} placeholder="Describe why this user is being blocked..."
              className={`w-full px-3 py-2.5 border-2 rounded-xl text-sm focus:outline-none focus:border-button-primary resize-none transition-all ${err?'border-red-400 bg-red-50':'border-gray-200'}`}/>
            {err&&<p className="text-red-500 text-xs mt-1">{err}</p>}
          </div>
        )}
        {isBlocked && <p className="text-sm text-gray-600 mb-4">This will restore access for {user.firstName}. Their properties will become visible again.</p>}
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border-2 border-gray-200 text-gray-600 font-semibold rounded-xl text-sm">Cancel</button>
          <button onClick={handleConfirm}
            className={`flex-1 py-2.5 text-white font-bold rounded-xl text-sm transition-all ${isBlocked?'bg-green-500 hover:bg-green-600':'bg-red-500 hover:bg-red-600'}`}>
            {isBlocked?'Unblock':'Block User'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ─── User Detail Modal ─────────────────────────────────────────────────────────
function UserDetailModal({ user, bookings, onClose }: { user:any; bookings:any[]; onClose:()=>void }) {
  const ub = bookings.filter((b:any)=>b.customerName?.toLowerCase().includes((user.firstName+' '+user.lastName).toLowerCase()))
  const logs = [
    {time:user.lastAccess+' 10:23',action:'Last login',detail:'Web browser'},
    {time:user.joined+' 09:00',action:'Account created',detail:`Role: ${user.role}`},
    ...ub.map((b:any)=>({time:new Date(b.createdAt||Date.now()).toLocaleString(),action:'Booked property',detail:b.propertyTitle||'—'})),
    {time:user.lastAccess+' 14:11',action:'Payment processed',detail:`NPR ${user.billings*12000}`},
  ]
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}/>
      <motion.div initial={{opacity:0,scale:0.92,y:20}} animate={{opacity:1,scale:1,y:0}}
        exit={{opacity:0,scale:0.92}} transition={{type:'spring',stiffness:320,damping:28}}
        className="relative bg-white rounded-3xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl z-10">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-3xl z-10">
          <h3 className="font-black text-lg text-gray-900">{user.firstName} {user.lastName}</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><XIcon className="w-5 h-5 text-gray-400"/></button>
        </div>
        <div className="p-6 space-y-5">
          <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-button-primary/5 to-blue-50 rounded-2xl">
            <div className="w-14 h-14 bg-button-primary rounded-full flex items-center justify-center text-white font-black text-xl flex-shrink-0">
              {user.firstName.charAt(0)}
            </div>
            <div className="flex-1">
              <p className="font-bold text-gray-900">{user.firstName} {user.lastName}</p>
              <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5"><MailIcon className="w-3 h-3"/>{user.email}</div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5"><PhoneIcon className="w-3 h-3"/>{user.phone}</div>
              <div className="flex gap-1.5 mt-1.5">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${user.status==='active'?'bg-green-100 text-green-700':'bg-yellow-100 text-yellow-700'}`}>{user.status}</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 capitalize">{user.role}</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-gray-50 rounded-xl p-3"><span className="text-gray-500">Registered</span><p className="font-bold text-gray-900 mt-0.5">{daysSince(user.joined)}</p></div>
            <div className="bg-gray-50 rounded-xl p-3"><span className="text-gray-500">Last Access</span><p className="font-bold text-gray-900 mt-0.5">{daysSince(user.lastAccess)}</p></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[{l:'Bookings',v:user.bookings,c:'bg-blue-50 text-blue-700'},{l:'Billings',v:user.billings,c:'bg-green-50 text-green-700'},{l:'Reports',v:user.reports,c:'bg-red-50 text-red-700'}].map(s=>(
              <div key={s.l} className={`${s.c} rounded-xl p-3 text-center`}>
                <p className="text-xl font-black">{s.v}</p>
                <p className="text-xs font-semibold">{s.l}</p>
              </div>
            ))}
          </div>
          <div>
            <h4 className="font-bold text-gray-900 text-sm mb-3">Activity Log</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {logs.map((l,i)=>(
                <motion.div key={i} initial={{opacity:0,x:-8}} animate={{opacity:1,x:0}} transition={{delay:i*0.05}}
                  className="flex items-start gap-3 p-2.5 bg-gray-50 rounded-xl">
                  <div className="w-2 h-2 bg-button-primary rounded-full mt-1.5 flex-shrink-0"/>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-900">{l.action}</p>
                    <p className="text-xs text-gray-500 truncate">{l.detail}</p>
                  </div>
                  <span className="text-[10px] text-gray-400 flex-shrink-0">{l.time}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Admin Properties Panel ───────────────────────────────────────────────────
function AdminPropertiesPanel({ users, blockedOwners, onBlockUser }: { users: any[]; blockedOwners: string[]; onBlockUser: (uid: string) => void }) {
  const [properties, setProperties] = useState<any[]>([])
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [loading, setLoading] = useState(true)
  const [previewProperty, setPreviewProperty] = useState<any>(null)
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [galleryIndex, setGalleryIndex] = useState(0)
  const [galleryImages, setGalleryImages] = useState<string[]>([])

  // Keyboard navigation for gallery
  useEffect(() => {
    if (!galleryOpen) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && galleryIndex > 0) {
        setGalleryIndex(prev => prev - 1);
      } else if (e.key === 'ArrowRight' && galleryIndex < galleryImages.length - 1) {
        setGalleryIndex(prev => prev + 1);
      } else if (e.key === 'Escape') {
        setGalleryOpen(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [galleryOpen, galleryIndex, galleryImages.length]);

  const openGallery = (images: string[], startIndex: number = 0) => {
    setGalleryImages(images);
    setGalleryIndex(startIndex);
    setGalleryOpen(true);
  };

  // Fetch all properties from backend
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/properties/all');
        if (response.ok) {
          const data = await response.json();
          setProperties(data.properties || []);
        } else {
          console.error('Failed to fetch properties from backend');
          setProperties([]);
        }
      } catch (error) {
        console.error('Error fetching properties:', error);
        setProperties([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
    // Poll every 5 seconds for updates
    const interval = setInterval(fetchProperties, 5000);
    return () => clearInterval(interval);
  }, []);

  const updateStatus = async (propId: string, status: 'approved' | 'rejected') => {
    try {
      const endpoint = status === 'approved' 
        ? `http://localhost:5000/api/properties/${propId}/approve`
        : `http://localhost:5000/api/properties/${propId}/reject`;
      
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        // Update local state
        setProperties(prev => prev.map(p => 
          (p.id === propId || p._id === propId) ? data.property : p
        ));
        
        // Notify the owner via localStorage (for now)
        const property = properties.find(p => p.id === propId || p._id === propId);
        if (property) {
          const ownerNotifs = ls('fm_owner_notifs');
          const notifMsg = status === 'approved' 
            ? `Your property "${property.title}" has been approved and is now live!`
            : `Your property "${property.title}" was not approved.`;
          
          ownerNotifs.unshift({
            id: Date.now().toString(),
            type: status === 'approved' ? 'success' : 'warning',
            title: status === 'approved' ? 'Property Approved' : 'Property Rejected',
            msg: notifMsg,
            time: 'Just now',
            ts: Date.now(),
            read: false
          });
          setLS('fm_owner_notifs', ownerNotifs);
        }
        
        toast.success(`Property ${status}!`);
      } else {
        toast.error('Failed to update property');
      }
    } catch (error: any) {
      console.error('Error updating property:', error);
      toast.error('Failed to update property');
    }
  };

  const displayed = properties.filter((p: any) => {
    if (filter === 'pending')  return p.status === 'pending'
    if (filter === 'approved') return p.status === 'approved'
    if (filter === 'rejected') return p.status === 'rejected'
    return true
  })

  const pendingCount  = properties.filter((p: any) => p.status === 'pending').length
  const approvedCount = properties.filter((p: any) => p.status === 'approved').length

  return (
    <div>
      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-5 text-xs text-blue-700 flex items-start gap-2">
        <ShieldCheckIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <span>Approve owner-submitted properties to make them visible to users. Rejected properties stay hidden. Blocking an owner hides all their properties.</span>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: 'Total Submitted', value: properties.length, color: 'bg-blue-50 text-blue-700 border-blue-100' },
          { label: 'Pending Review',  value: pendingCount,       color: 'bg-amber-50 text-amber-700 border-amber-100' },
          { label: 'Live / Approved', value: approvedCount,      color: 'bg-green-50 text-green-700 border-green-100' },
        ].map(s => (
          <div key={s.label} className={`${s.color} border rounded-2xl p-3 text-center`}>
            <p className="text-xl font-black">{s.value}</p>
            <p className="text-xs font-semibold mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold border-2 capitalize transition-all ${filter === f ? 'bg-button-primary text-white border-button-primary' : 'bg-white text-gray-600 border-gray-200 hover:border-button-primary/40'}`}>
            {f}{f === 'pending' && pendingCount > 0 ? ` (${pendingCount})` : ''}
          </button>
        ))}
      </div>

      {/* Properties list */}
      {loading ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <div className="w-8 h-8 border-4 border-button-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Loading properties...</p>
        </div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
          <BuildingIcon className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-400 text-sm">
            {filter === 'pending' ? 'No pending properties to review.' : 'No properties found.'}
          </p>
          {filter === 'pending' && <p className="text-gray-400 text-xs mt-1">Properties submitted by owners will appear here.</p>}
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map((p: any, i: number) => {
            const ownerBlocked = blockedOwners.includes(p.ownerId || '')
            const isPending  = p.status === 'pending'
            const isApproved = p.status === 'approved'
            const isRejected = p.status === 'rejected'
            return (
              <motion.div key={p.id || p._id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-opacity ${ownerBlocked ? 'opacity-50' : ''} ${isPending ? 'border-amber-200' : isApproved ? 'border-green-200' : 'border-red-100'}`}>
                <div className="flex flex-wrap items-center gap-3 p-4">
                  {/* Thumbnail */}
                  <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                    {p.image
                      ? <img src={p.image} alt={p.title} className="w-full h-full object-cover" />
                      : <BuildingIcon className="w-6 h-6 text-gray-300 m-auto mt-4" />}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <p className="font-bold text-sm text-gray-900 truncate">{p.title}</p>
                      {ownerBlocked && <span className="text-[10px] bg-red-100 text-red-600 font-bold px-2 py-0.5 rounded-full">Owner Blocked</span>}
                    </div>
                    <p className="text-xs text-gray-500 truncate">{p.location} · Owner: {p.ownerName || 'Unknown'}</p>
                    <p className="text-xs text-button-primary font-semibold mt-0.5">NPR {Number(p.rent).toLocaleString()}/mo · {p.type} · {p.beds || p.bedrooms || '?'} bed</p>
                  </div>

                  {/* Status badge */}
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${isPending ? 'bg-amber-100 text-amber-700' : isApproved ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                    {isPending ? '⏳ Pending' : isApproved ? '✓ Approved' : '✗ Rejected'}
                  </span>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                      onClick={() => setPreviewProperty(p)}
                      className="px-3 py-1.5 border-2 border-button-primary text-button-primary text-xs font-bold rounded-xl hover:bg-button-primary hover:text-white transition-all">
                      <EyeIcon className="w-3.5 h-3.5 inline mr-1" />
                      View
                    </motion.button>
                    {isPending && (
                      <>
                        <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                          onClick={() => updateStatus(p.id || p._id, 'approved')}
                          className="px-3 py-1.5 bg-green-500 text-white text-xs font-bold rounded-xl hover:bg-green-600 transition-all">
                          Approve
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                          onClick={() => updateStatus(p.id || p._id, 'rejected')}
                          className="px-3 py-1.5 bg-red-400 text-white text-xs font-bold rounded-xl hover:bg-red-500 transition-all">
                          Reject
                        </motion.button>
                      </>
                    )}
                    {isApproved && (
                      <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                        onClick={() => updateStatus(p.id || p._id, 'rejected')}
                        className="px-3 py-1.5 border border-red-200 text-red-600 text-xs font-semibold rounded-xl hover:bg-red-50 transition-all">
                        Revoke
                      </motion.button>
                    )}
                    {isRejected && (
                      <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                        onClick={() => updateStatus(p.id || p._id, 'approved')}
                        className="px-3 py-1.5 border border-green-200 text-green-700 text-xs font-semibold rounded-xl hover:bg-green-50 transition-all">
                        Re-approve
                      </motion.button>
                    )}
                  </div>
                </div>

                {/* Pending highlight bar */}
                {isPending && (
                  <div className="bg-amber-50 border-t border-amber-100 px-4 py-2 flex items-center gap-2">
                    <AlertTriangleIcon className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                    <p className="text-[11px] text-amber-700">Awaiting admin review — not visible to users yet</p>
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      )}
      
      {/* Property Preview Modal */}
      <AnimatePresence>
        {previewProperty && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50" onClick={() => setPreviewProperty(null)}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
              
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
                <h3 className="font-black text-gray-900 text-lg">Property Details</h3>
                <button onClick={() => setPreviewProperty(null)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <XIcon className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Images */}
                {previewProperty.images && previewProperty.images.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {previewProperty.images.slice(0, 4).map((img: string, idx: number) => (
                      <div 
                        key={idx} 
                        onClick={() => openGallery(previewProperty.images, idx)}
                        className={`rounded-xl overflow-hidden cursor-pointer hover:opacity-90 transition-opacity ${idx === 0 ? 'col-span-2 h-64' : 'h-32'}`}
                      >
                        <img src={img} alt={`Property ${idx + 1}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                    {previewProperty.images.length > 4 && (
                      <div 
                        onClick={() => openGallery(previewProperty.images, 4)}
                        className="h-32 rounded-xl bg-gray-900/80 flex items-center justify-center cursor-pointer hover:bg-gray-900/90 transition-colors"
                      >
                        <p className="text-white font-bold text-lg">+{previewProperty.images.length - 4} more</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Title & Status */}
                <div>
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <h4 className="text-2xl font-black text-gray-900">{previewProperty.title}</h4>
                    <span className={`text-xs font-bold px-3 py-1.5 rounded-full flex-shrink-0 ${
                      previewProperty.status === 'pending' ? 'bg-amber-100 text-amber-700' : 
                      previewProperty.status === 'approved' ? 'bg-green-100 text-green-700' : 
                      'bg-red-100 text-red-600'
                    }`}>
                      {previewProperty.status === 'pending' ? '⏳ Pending' : 
                       previewProperty.status === 'approved' ? '✓ Approved' : 
                       '✗ Rejected'}
                    </span>
                  </div>
                  <p className="text-gray-600 flex items-center gap-2">
                    <MapPinIcon className="w-4 h-4" />
                    {previewProperty.location}
                  </p>
                  <p className="text-2xl font-black text-button-primary mt-2">
                    NPR {Number(previewProperty.rent).toLocaleString()}<span className="text-sm font-normal text-gray-500">/month</span>
                  </p>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500 mb-1">Type</p>
                    <p className="font-bold text-gray-900">{previewProperty.type}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500 mb-1">Bedrooms</p>
                    <p className="font-bold text-gray-900">{previewProperty.beds || previewProperty.bedrooms || '?'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500 mb-1">Bathrooms</p>
                    <p className="font-bold text-gray-900">{previewProperty.baths || previewProperty.bathrooms || '?'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500 mb-1">Area</p>
                    <p className="font-bold text-gray-900">{previewProperty.area}</p>
                  </div>
                </div>

                {/* Description */}
                {previewProperty.description && (
                  <div>
                    <h5 className="font-bold text-gray-900 mb-2">Description</h5>
                    <p className="text-gray-600 text-sm leading-relaxed">{previewProperty.description}</p>
                  </div>
                )}

                {/* Amenities */}
                {previewProperty.amenities && previewProperty.amenities.length > 0 && (
                  <div>
                    <h5 className="font-bold text-gray-900 mb-2">Amenities</h5>
                    <div className="flex flex-wrap gap-2">
                      {previewProperty.amenities.map((a: string) => (
                        <span key={a} className="px-3 py-1 bg-button-primary/10 text-button-primary rounded-full text-xs font-semibold">
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Location Map */}
                {previewProperty.latitude && previewProperty.longitude && (
                  <div onClick={(e) => e.stopPropagation()}>
                    <h5 className="font-bold text-gray-900 mb-2">Location on Map</h5>
                    <div 
                      className="w-full h-64 rounded-xl overflow-hidden border-2 border-gray-200 bg-gray-100"
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      onMouseMove={(e) => e.stopPropagation()}
                      onMouseUp={(e) => e.stopPropagation()}
                      onTouchStart={(e) => e.stopPropagation()}
                      onTouchMove={(e) => e.stopPropagation()}
                      onTouchEnd={(e) => e.stopPropagation()}
                    >
                      <div 
                        ref={(el) => {
                          if (!el) return;
                          
                          // Check if already initialized
                          if (el.hasAttribute('data-map-initialized')) return;
                          
                          // Mark as initialized
                          el.setAttribute('data-map-initialized', 'true');
                          
                          // Initialize Leaflet map with a slight delay to ensure DOM is ready
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
                              script.onload = () => setTimeout(initMap, 200);
                              document.body.appendChild(script);
                              return;
                            }
                            
                            const L = (window as any).L;
                            
                            // Check if map container already has a map
                            if ((el as any)._leaflet_id) {
                              return;
                            }
                            
                            const lat = previewProperty.latitude;
                            const lng = previewProperty.longitude;
                            
                            try {
                              // Create map
                              const map = L.map(el, {
                                center: [lat, lng],
                                zoom: 15,
                                zoomControl: true,
                                scrollWheelZoom: false
                              });
                              
                              // Add OpenStreetMap tiles
                              L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                                attribution: '© OpenStreetMap contributors',
                                maxZoom: 19
                              }).addTo(map);
                              
                              // Custom marker icon
                              const markerIcon = L.divIcon({
                                html: `<div style="width:38px;height:38px;background:linear-gradient(135deg,#1a4731,#2d6a4f);border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 4px 12px rgba(0,0,0,0.3)"><div style="transform:rotate(45deg);display:flex;align-items:center;justify-content:center;height:100%;font-size:15px">🏠</div></div>`,
                                className: '',
                                iconSize: [38, 38],
                                iconAnchor: [19, 38],
                                popupAnchor: [0, -42]
                              });
                              
                              // Add marker
                              L.marker([lat, lng], { icon: markerIcon })
                                .bindPopup(`<div style="font-family:sans-serif;padding:4px"><strong style="color:#1a4731;font-size:13px">${previewProperty.title}</strong><br/><span style="color:#6b7280;font-size:11px">${previewProperty.location}</span></div>`, { maxWidth: 230 })
                                .addTo(map)
                                .openPopup();
                              
                              // Force map to recalculate size after a short delay
                              setTimeout(() => {
                                map.invalidateSize();
                              }, 100);
                            } catch (error) {
                              console.error('Error initializing map:', error);
                            }
                          };
                          
                          // Delay initialization to ensure modal is fully rendered
                          setTimeout(initMap, 100);
                        }}
                        className="w-full h-full"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      📍 Coordinates: {previewProperty.latitude.toFixed(6)}, {previewProperty.longitude.toFixed(6)}
                    </p>
                  </div>
                )}

                {/* Owner Info */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h5 className="font-bold text-gray-900 mb-3">Owner Information</h5>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-gray-500">Name:</span> <span className="font-semibold text-gray-900">{previewProperty.ownerName || 'Unknown'}</span></p>
                    {previewProperty.ownerEmail && <p><span className="text-gray-500">Email:</span> <span className="font-semibold text-gray-900">{previewProperty.ownerEmail}</span></p>}
                    {previewProperty.ownerPhone && <p><span className="text-gray-500">Phone:</span> <span className="font-semibold text-gray-900">{previewProperty.ownerPhone}</span></p>}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t border-gray-100">
                  {previewProperty.status === 'pending' && (
                    <>
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          updateStatus(previewProperty.id || previewProperty._id, 'approved');
                          setPreviewProperty(null);
                        }}
                        className="flex-1 py-3 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition-all">
                        ✓ Approve Property
                      </motion.button>
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          updateStatus(previewProperty.id || previewProperty._id, 'rejected');
                          setPreviewProperty(null);
                        }}
                        className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-all">
                        ✗ Reject Property
                      </motion.button>
                    </>
                  )}
                  {previewProperty.status === 'approved' && (
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        updateStatus(previewProperty.id || previewProperty._id, 'rejected');
                        setPreviewProperty(null);
                      }}
                      className="flex-1 py-3 border-2 border-red-500 text-red-600 font-bold rounded-xl hover:bg-red-50 transition-all">
                      Revoke Approval
                    </motion.button>
                  )}
                  {previewProperty.status === 'rejected' && (
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        updateStatus(previewProperty.id || previewProperty._id, 'approved');
                        setPreviewProperty(null);
                      }}
                      className="flex-1 py-3 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition-all">
                      Re-approve Property
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Image Gallery Modal */}
      <AnimatePresence>
        {galleryOpen && (
          <div className="fixed inset-0 z-[300] bg-black/95 flex items-center justify-center" onClick={() => setGalleryOpen(false)}>
            <button 
              onClick={() => setGalleryOpen(false)}
              className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
            >
              <XIcon className="w-6 h-6 text-white" />
            </button>
            
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/50 px-4 py-2 rounded-full text-white text-sm font-semibold">
              {galleryIndex + 1} / {galleryImages.length}
            </div>
            
            <div className="relative w-full h-full flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
              <motion.img
                key={galleryIndex}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                src={galleryImages[galleryIndex]}
                alt={`Image ${galleryIndex + 1}`}
                className="max-w-full max-h-full object-contain rounded-lg"
              />
              
              {/* Navigation Buttons */}
              {galleryIndex > 0 && (
                <button
                  onClick={() => setGalleryIndex(prev => prev - 1)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors backdrop-blur-sm"
                >
                  <ChevronLeftIcon className="w-8 h-8 text-white" />
                </button>
              )}
              
              {galleryIndex < galleryImages.length - 1 && (
                <button
                  onClick={() => setGalleryIndex(prev => prev + 1)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors backdrop-blur-sm"
                >
                  <ChevronRightIcon className="w-8 h-8 text-white" />
                </button>
              )}
            </div>
            
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 px-4 py-2 rounded-full text-white text-xs">
              Use ← → arrow keys to navigate
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export function AdminDashboard() {
  const {user, logout} = useAuth()
  const navigate = useNavigate()

  // Role verification - redirect if not admin
  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }
    if (user.role !== 'admin') {
      toast.error('Access denied. This page is for administrators only.');
      if (user.role === 'landlord' || user.role === 'owner') {
        navigate('/dashboard/owner', { replace: true });
      } else if (user.role === 'tenant') {
        navigate('/dashboard/tenant', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [user, navigate]);

  // Show loading while checking auth
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-button-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Show access denied if not admin
  if (user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 text-xl font-bold mb-2">Access Denied</p>
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    )
  }

  const [activeTab, setActiveTab] = useState('overview')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // Users state
  const [users, setUsers] = useState(INIT_USERS)
  const [selected, setSelected] = useState<string[]>([])
  const [userTab, setUserTab] = useState<'users'|'requirements'|'reviews'|'reports'>('users')
  const [userSearch, setUserSearch] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)
  const [filterStatus, setFilterStatus] = useState('all')
  const [showAddUser, setShowAddUser] = useState(false)
  const [detailUser, setDetailUser] = useState<any>(null)
  const [blockModalUser, setBlockModalUser] = useState<any>(null)
  const filterRef = useRef<HTMLDivElement>(null)

  // Fetch users from backend
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/users');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.users) {
            setUsers(data.users);
          }
        } else {
          console.error('Failed to fetch users from backend');
          // Keep using INIT_USERS as fallback
        }
      } catch (error) {
        console.error('Error fetching users:', error);
        // Keep using INIT_USERS as fallback
      }
    };

    fetchUsers();
    // Poll every 10 seconds for updates
    const interval = setInterval(fetchUsers, 10000);
    return () => clearInterval(interval);
  }, []);

  // Bookings
  const [bookings, setBookings] = useState<any[]>(() => {
    const existingBookings = getBookings()
    // Add timestamps to bookings that don't have them (migration)
    const now = Date.now()
    return existingBookings.map((b: any) => ({
      ...b,
      timestamp: b.timestamp || now - 86400000 // Default to 1 day ago for existing bookings
    }))
  })
  const [dismissedBookings, setDismissedBookings] = useState<string[]>(() => ls('fm_dismissed_bookings','[]'))
  const [lastVisitedBookings, setLastVisitedBookings] = useState<number>(() => {
    const stored = ls('fm_last_visited_bookings', '0')
    // If never visited before, initialize to current time so existing bookings don't show as new
    return stored === 0 ? Date.now() : stored
  })

  // Requirements
  const [reqList, setReqList] = useState<any[]>(() => getRequirements())
  const [deleteModal, setDeleteModal] = useState<{id:string;action:string}|null>(null)
  const [deleteReason, setDeleteReason] = useState('')
  const [citizenModal, setCitizenModal] = useState<{url:string;name:string}|null>(null)

  // Blocked owners
  const [blockedOwners, setBlockedOwners] = useState<string[]>(() => getBlockedOwners())

  // Owner property notifications
  const [adminOwnerNotifs, setAdminOwnerNotifs] = useState<any[]>(() => ls('fm_admin_notifs'))

  // Contact messages
  const [contactMessages, setContactMessages] = useState<any[]>([])
  
  // Properties (for account stats)
  const [properties, setProperties] = useState<any[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [selectedMessage, setSelectedMessage] = useState<any>(null)
  const [showAllMessages, setShowAllMessages] = useState(false)
  const [lastVisitedUsers, setLastVisitedUsers] = useState<number>(() => {
    const stored = ls('fm_last_visited_users', '0')
    // If never visited before, initialize to current time so existing users don't show as new
    return stored === 0 ? Date.now() : stored
  })

  // Theme & settings
  const [theme, setTheme] = useState<string>(() => ls('fm_theme','{"key":"emerald"}').key || 'emerald')
  const { isDark, toggleTheme } = useTheme()
  const [notifSound, setNotifSound] = useState(true)
  const [compactView, setCompactView] = useState(false)
  const [settingsTab, setSettingsTab] = useState<'theme'|'profile'|'notifications'|'account'|'subscription'>('theme')
  const [subscriptionPricing, setSubscriptionPricing] = useState(() => ls('fm_subscription_pricing', '{"monthly":999,"quarterly":2499,"yearly":8999}'))
  const [editingPricing, setEditingPricing] = useState(false)
  const [tempPricing, setTempPricing] = useState(subscriptionPricing)
  
  // Profile editing states
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'admin',
    phone: '',
    profilePicture: ''
  })
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [savingProfile, setSavingProfile] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [showPasswordForm, setShowPasswordForm] = useState(false)

  // Apply theme on mount
  useEffect(() => { applyTheme(theme) }, [theme])

  // Initialize lastVisited timestamps in localStorage if they don't exist
  useEffect(() => {
    const storedBookings = ls('fm_last_visited_bookings', '0')
    const storedUsers = ls('fm_last_visited_users', '0')
    
    if (storedBookings === 0) {
      setLS('fm_last_visited_bookings', lastVisitedBookings)
    }
    if (storedUsers === 0) {
      setLS('fm_last_visited_users', lastVisitedUsers)
    }
  }, [])

  // Initialize profile form with user data from localStorage
  useEffect(() => {
    if (user) {
      // Load from localStorage
      const storedUser = JSON.parse(localStorage.getItem('flatmate_user') || '{}')
      
      setProfileForm({
        firstName: storedUser.name?.split(' ')[0] || user.name?.split(' ')[0] || '',
        lastName: storedUser.name?.split(' ').slice(1).join(' ') || user.name?.split(' ').slice(1).join(' ') || '',
        email: storedUser.email || user.email || '',
        role: storedUser.role || user.role || 'admin',
        phone: storedUser.phone || (user as any).phone || '',
        profilePicture: storedUser.profilePicture || (user as any).profilePicture || ''
      })
    }
  }, [user])

  // Fetch user ID from backend using email
  const getUserId = async (): Promise<string | null> => {
    if (!user?.email) return null

    // Check if ID is already in user object
    const userId = (user as any)?.id || (user as any)?._id
    if (userId) return userId

    // Fetch from backend using email
    try {
      const response = await fetch(`http://localhost:5000/api/users/email/${encodeURIComponent(user.email)}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.user) {
          return data.user.id || data.user._id || null
        }
      }
    } catch (error) {
      console.error('Error fetching user ID:', error)
    }

    return null
  }

  // Fetch contact messages
  useEffect(() => {
    const fetchContactMessages = async () => {
      console.log('👤 Fetching contact messages...')
      setLoadingMessages(true)
      try {
        console.log('📡 Fetching from: http://localhost:5000/api/contact/messages')
        const response = await fetch('http://localhost:5000/api/contact/messages', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        console.log('📥 Response status:', response.status)
        
        if (response.ok) {
          const data = await response.json()
          console.log('✅ Messages received:', data.length)
          setContactMessages(data)
        } else {
          const errorText = await response.text()
          console.error('❌ Error:', response.status, errorText)
        }
      } catch (error) {
        console.error('❌ Fetch error:', error)
      } finally {
        setLoadingMessages(false)
      }
    }

    if (user?.role === 'admin') {
      fetchContactMessages()
    }
  }, [user])

  // Fetch properties for overview stats
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/properties/all')
        if (response.ok) {
          const data = await response.json()
          setProperties(data.properties || [])
        }
      } catch (error) {
        console.error('❌ Properties fetch error:', error)
      }
    }

    if (user?.role === 'admin') {
      fetchProperties()
    }
  }, [user])

  // Refresh bookings + admin notifs + contact messages every 5s
  useEffect(() => {
    const fetchContactMessagesRefresh = async () => {
      if (user?.role !== 'admin') return

      try {
        const response = await fetch('http://localhost:5000/api/contact/messages', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        if (response.ok) {
          const data = await response.json()
          console.log('🔄 Refreshed contact messages:', data.length)
          setContactMessages(data)
        }
      } catch (error) {
        console.error('❌ Refresh error:', error)
      }
    }

    const fetchPropertiesRefresh = async () => {
      if (user?.role !== 'admin') return

      try {
        const response = await fetch('http://localhost:5000/api/properties/all')
        if (response.ok) {
          const data = await response.json()
          setProperties(data.properties || [])
        }
      } catch (error) {
        console.error('❌ Properties refresh error:', error)
      }
    }

    const id = setInterval(() => {
      const freshBookings = getBookings()
      // Add timestamps to new bookings that don't have them
      // But preserve existing timestamps to avoid marking old bookings as new
      setBookings(prevBookings => {
        const bookingsWithTimestamps = freshBookings.map((b: any) => {
          // Check if this booking already exists in previous state
          const existing = prevBookings.find((pb: any) => 
            (pb.receiptId && pb.receiptId === b.receiptId) || 
            (pb.propertyId && pb.propertyId === b.propertyId)
          )
          // If it exists, keep its timestamp; otherwise it's new, use current time
          return {
            ...b,
            timestamp: existing?.timestamp || b.timestamp || Date.now()
          }
        })
        return bookingsWithTimestamps
      })
      
      // Check for new property submissions from owners
      const ownerNotifs = ls('fm_admin_notifs')
      if (ownerNotifs.length > 0) {
        const unread = ownerNotifs.filter((n:any) => !n.read)
        if (unread.length > 0) {
          setAdminOwnerNotifs(ownerNotifs)
        }
      }
      // Refresh contact messages and properties
      fetchContactMessagesRefresh()
      fetchPropertiesRefresh()
    }, 5000)
    return () => clearInterval(id)
  }, [user])

  // Close filter on outside click
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false)
    }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  // Track when admin visits bookings or users sections
  useEffect(() => {
    if (activeTab === 'bookings') {
      const now = Date.now()
      setLastVisitedBookings(now)
      setLS('fm_last_visited_bookings', now)
    } else if (activeTab === 'users') {
      const now = Date.now()
      setLastVisitedUsers(now)
      setLS('fm_last_visited_users', now)
    }
  }, [activeTab])

  // Profile picture upload handler
  const handleProfilePictureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB')
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setProfileForm(prev => ({ ...prev, profilePicture: reader.result as string }))
    }
    reader.readAsDataURL(file)
  }

  // Save profile handler
  const handleSaveProfile = () => {
    // Validation
    if (!profileForm.firstName.trim() || !profileForm.lastName.trim()) {
      toast.error('First name and last name are required')
      return
    }

    if (!profileForm.email.trim() || !/\S+@\S+\.\S+/.test(profileForm.email)) {
      toast.error('Valid email is required')
      return
    }

    setSavingProfile(true)
    
    // Update user data in localStorage only (no database for now)
    const updatedUser = {
      name: `${profileForm.firstName} ${profileForm.lastName}`,
      email: profileForm.email,
      role: profileForm.role,
      phone: profileForm.phone,
      profilePicture: profileForm.profilePicture,
      avatar: profileForm.profilePicture
    }
    
    // Update both localStorage keys
    localStorage.setItem('flatmate_user', JSON.stringify(updatedUser))
    
    const authData = JSON.parse(localStorage.getItem('fm_auth') || '{}')
    authData.user = updatedUser
    localStorage.setItem('fm_auth', JSON.stringify(authData))

    toast.success('Profile updated successfully!')
    
    setSavingProfile(false)
    
    // Reload page to reflect changes
    setTimeout(() => {
      window.location.reload()
    }, 1000)
  }

  // Change password handler
  const handleChangePassword = () => {
    toast.error('Password change is not available in localStorage mode')
    setShowPasswordForm(false)
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

  const handleThemeChange = (key: string) => {
    setTheme(key); applyTheme(key)
    toast.success(`Theme changed to ${THEMES[key].label}!`)
  }

  const blockOwner = (uid: string, reason = '') => {
    const u = users.find(x => x.id === uid)
    if (!u) return
    const isCurrentlyBlocked = u.blocked
    const newList = isCurrentlyBlocked ? blockedOwners.filter(b => b !== uid) : [...blockedOwners, uid]
    setBlockedOwners(newList)
    saveBlockedOwners(newList)
    // Save name map
    const ownerMap: Record<string,string> = {}
    users.forEach(u => { if (u.role === 'owner') ownerMap[u.id] = `${u.firstName} ${u.lastName}` })
    setLS('fm_owner_name_map', ownerMap)
    setUsers(prev => prev.map(x => x.id === uid ? { ...x, blocked: !x.blocked, reportReason: reason || x.reportReason } : x))
    toast.success(isCurrentlyBlocked ? 'Owner unblocked — properties visible again' : 'Owner blocked — properties hidden from users')
  }

  const handleBlockFromReport = (uid: string, reason: string) => {
    blockOwner(uid, reason)
    // Update report reason
    if (reason) setUsers(prev => prev.map(u => u.id === uid ? { ...u, reportReason: reason } : u))
  }

  const muteUser   = (uid: string) => setUsers(prev => prev.map(u => u.id === uid ? {...u, muted: !u.muted} : u))
  const archiveUser= (uid: string) => setUsers(prev => prev.map(u => u.id === uid ? {...u, archived: !u.archived} : u))
  const deleteUser = (uid: string) => { 
    setUsers(prev => prev.filter(u => u.id !== uid)); 
    toast('User removed', {
      style: {
        background: '#6B7280',
        color: 'white',
      },
    })
  }
  const approveUser= (uid: string) => { setUsers(prev => prev.map(u => u.id === uid ? {...u, status:'active'} : u)); toast.success('User approved') }

  const dismissBooking = (rid: string) => {
    const updated = [...dismissedBookings, rid]
    setDismissedBookings(updated)
    setLS('fm_dismissed_bookings', updated)
  }
  const visibleBookings = bookings.filter((b:any) => !dismissedBookings.includes(b.receiptId || b.propertyId || ''))
  
  // Calculate new bookings (only those added after last visit)
  const newBookingsCount = visibleBookings.filter((b:any) => {
    const bookingTime = b.timestamp || 0
    return bookingTime > lastVisitedBookings
  }).length
  
  // Calculate new users (only those added after last visit)
  const newUsersCount = users.filter((u:any) => {
    const userJoinedTime = new Date(u.joined).getTime()
    return userJoinedTime > lastVisitedUsers
  }).length

  const approveReq = (id: string) => {
    const updated = reqList.map((r:any) => r.id === id ? {...r, status:'approved'} : r)
    setReqList(updated); setLS('fm_requirements', updated); toast.success('Requirement approved!')
  }
  const rejectReq = (id: string, reason: string) => {
    const updated = reqList.map((r:any) => r.id === id ? {...r, status:'rejected', adminNote: reason} : r)
    setReqList(updated); setLS('fm_requirements', updated)
    const req = reqList.find((r:any) => r.id === id)
    if (req) {
      const key = `fm_notifs_${req.submittedBy}`
      const notifs = ls(key)
      setLS(key, [{id:Date.now().toString(), title:'Requirement Rejected', message:`Reason: ${reason}`, time:'Just now', type:'warning', read:false}, ...notifs])
    }
    toast.success('Requirement rejected')
  }
  const deleteReq = (id: string, reason: string) => {
    const updated = reqList.map((r:any) => r.id === id ? {...r, status:'deleted', adminNote: reason} : r)
    setReqList(updated); setLS('fm_requirements', updated); 
    toast('Requirement removed', {
      style: {
        background: '#6B7280',
        color: 'white',
      },
    })
  }

  const toggleSelect = (id: string) => setSelected(p => p.includes(id) ? p.filter(x=>x!==id) : [...p, id])
  const toggleAll = () => setSelected(p => p.length === filtered.length ? [] : filtered.map(u => u.id))

  const filtered = users.filter(u => {
    const q = userSearch.toLowerCase()
    const match = !q || `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(q)
    if (filterStatus === 'muted')       return match && u.muted
    if (filterStatus === 'blocked')     return match && u.blocked
    if (filterStatus === 'archived')    return match && u.archived
    if (filterStatus === 'deactivated') return match && u.status === 'pending'
    if (filterStatus === 'reported')    return match && u.reports > 0
    return match
  })

  const totalIncome  = MONTHLY_INCOME.reduce((s,m) => s+m.income, 0)
  const totalExpense = MONTHLY_INCOME.reduce((s,m) => s+m.expense, 0)
  const profit       = totalIncome - totalExpense
  const pendingReqs  = reqList.filter((r:any) => r.status === 'pending').length

  const TABS = [
    {id:'overview',  label:'Overview',   icon:HomeIcon},
    {id:'users',     label:'Users',      icon:UsersIcon},
    {id:'bookings',  label:'Bookings',   icon:CalendarIcon},
    {id:'properties',label:'Properties', icon:BuildingIcon},
    {id:'analytics', label:'Analytics',  icon:BarChart3Icon},
    {id:'alerts',    label:'Security',   icon:ShieldAlertIcon},
    {id:'settings',  label:'Settings',   icon:SettingsIcon},
  ]

  // ── Page header text ─────────────────────────────────────────────────────────
  const pageHeaderMap: Record<string,{title:string;sub:string}> = {
    overview:   {title:'Admin Dashboard', sub:'Manage platform and monitor activity'},
    users:      {title:`Hello, ${user?.name?.split(' ')[0] || 'Admin'} `, sub:'Manage users and permissions'},
    bookings:   {title:`Hello, ${user?.name?.split(' ')[0] || 'Admin'} `, sub:'View and manage all bookings'},
    properties: {title:`Hello, ${user?.name?.split(' ')[0] || 'Admin'} `, sub:'Property listing management'},
    analytics:  {title:`Hello, ${user?.name?.split(' ')[0] || 'Admin'} `, sub:'Platform analytics and insights'},
    alerts:     {title:`Hello, ${user?.name?.split(' ')[0] || 'Admin'} `, sub:'Security alerts and monitoring'},
    settings:   {title:`Hello, ${user?.name?.split(' ')[0] || 'Admin'} `, sub:'Customize your dashboard'},
  }

  const renderContent = () => {
    switch (activeTab) {

    // ── OVERVIEW ──────────────────────────────────────────────────────────────
    case 'overview': return (
      <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} className="space-y-6">
        {/* KPI — soft pastel gradient cards */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            {label:'Total Users',    value:users.length,          icon:UsersIcon,        bg:'bg-gradient-to-br from-blue-50 to-sky-100',     ic:'bg-blue-100 text-blue-600',   border:'border-blue-100',  vc:'text-blue-800',  sub:'↑ 12% this month', tab:'users'},
            {label:'Active Bookings',value:visibleBookings.length, icon:CalendarIcon,    bg:'bg-gradient-to-br from-pink-50 to-rose-100',    ic:'bg-pink-100 text-pink-600',   border:'border-pink-100',  vc:'text-pink-800',  sub:`${visibleBookings.filter((b:any)=>b.status==='confirmed').length} confirmed`, tab:'bookings'},
            {label:'Monthly Profit', value:`NPR ${(profit/1000).toFixed(0)}K`,icon:DollarSignIcon, bg:'bg-gradient-to-br from-amber-50 to-yellow-100',ic:'bg-amber-100 text-amber-600', border:'border-amber-100', vc:'text-amber-800', sub:'↑ 8.3% vs last month', tab:null},
            {label:'Total Properties', value:properties.length,            icon:BuildingIcon,bg:'bg-gradient-to-br from-green-50 to-emerald-100',ic:'bg-green-100 text-green-600', border:'border-green-100',  vc:'text-green-800', sub:'all listings', tab:'properties'},
          ].map((s,i) => (
            <motion.div key={s.label} initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:i*0.07}}
              whileHover={{y:-3,boxShadow:'0 8px 24px rgba(0,0,0,0.07)'}}
              onClick={()=>s.tab&&setActiveTab(s.tab)}
              className={`${s.bg} border ${s.border} rounded-2xl p-4 ${s.tab?'cursor-pointer':'cursor-default'} transition-all`}>
              <div className="flex items-center justify-between mb-3">
                <div className={`w-8 h-8 bg-white/80 rounded-xl flex items-center justify-center shadow-sm ${s.ic}`}>
                  <s.icon className="w-4 h-4"/>
                </div>
                <span className="text-[10px] text-gray-400 font-medium text-right leading-tight max-w-[80px]">{s.sub}</span>
              </div>
              <p className={`text-lg font-black ${s.vc}`}>{s.value}</p>
              <p className="text-[10px] text-gray-500 mt-0.5 font-medium">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Owner new property alert */}
        {adminOwnerNotifs.filter((n:any)=>n.type==='new_property'&&!n.read).length>0&&(
          <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}}
            className="bg-blue-50 border border-blue-200 rounded-2xl p-3 flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <BuildingIcon className="w-4 h-4 text-blue-600"/>
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-blue-800">{adminOwnerNotifs.filter((n:any)=>n.type==='new_property'&&!n.read).length} new property submission(s) from owners</p>
              <p className="text-[10px] text-blue-600">{adminOwnerNotifs.find((n:any)=>n.type==='new_property'&&!n.read)?.msg}</p>
            </div>
            <button onClick={()=>{setActiveTab('properties');setAdminOwnerNotifs(prev=>prev.map((n:any)=>n.type==='new_property'?{...n,read:true}:n));setLS('fm_admin_notifs',adminOwnerNotifs.map((n:any)=>n.type==='new_property'?{...n,read:true}:n))}}
              className="px-3 py-1.5 bg-blue-600 text-white text-[10px] font-bold rounded-lg hover:bg-blue-700 transition-all">Review</button>
          </motion.div>
        )}
        
        {/* New booking alert */}
        {adminOwnerNotifs.filter((n:any)=>n.type==='booking'&&!n.read).length>0&&(
          <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}}
            className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <CalendarIcon className="w-4 h-4 text-emerald-600"/>
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-emerald-800">{adminOwnerNotifs.filter((n:any)=>n.type==='booking'&&!n.read).length} new property booking(s)</p>
              <p className="text-[10px] text-emerald-600">{adminOwnerNotifs.find((n:any)=>n.type==='booking'&&!n.read)?.msg}</p>
            </div>
            <button onClick={()=>{setActiveTab('bookings');setAdminOwnerNotifs(prev=>prev.map((n:any)=>n.type==='booking'?{...n,read:true}:n));setLS('fm_admin_notifs',adminOwnerNotifs.map((n:any)=>n.type==='booking'?{...n,read:true}:n))}}
              className="px-3 py-1.5 bg-emerald-600 text-white text-[10px] font-bold rounded-lg hover:bg-emerald-700 transition-all">Review</button>
          </motion.div>
        )}

        {/* Contact Messages Section */}
        {contactMessages.filter((m:any)=>m.status==='unread').length>0 && (
          <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}}
            className="bg-purple-50 border border-purple-200 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <MailIcon className="w-4 h-4 text-purple-600"/>
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-purple-800">{contactMessages.filter((m:any)=>m.status==='unread').length} new contact message(s)</p>
                  <p className="text-[10px] text-purple-600">From website contact form</p>
                </div>
              </div>
              <button
                onClick={() => setShowAllMessages(true)}
                className="px-3 py-1.5 bg-purple-600 text-white text-[10px] font-bold rounded-lg hover:bg-purple-700 transition-all"
              >
                View All
              </button>
            </div>
            
            {/* Show only the newest message */}
            {(() => {
              const newestMsg = contactMessages.filter((m:any)=>m.status==='unread')[0];
              if (!newestMsg) return null;
              return (
                <div className="bg-white rounded-xl p-3 border border-purple-100">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-xs font-bold text-gray-900">{newestMsg.firstName} {newestMsg.lastName}</p>
                    <span className="text-[9px] text-gray-400">{new Date(newestMsg.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-[10px] text-gray-600 mb-1"><strong>Subject:</strong> {newestMsg.subject}</p>
                  <p className="text-[10px] text-gray-500 line-clamp-2 mb-2">{newestMsg.message}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[9px] text-gray-400">
                      <span>📧 {newestMsg.email}</span>
                      <span>📞 {newestMsg.phone}</span>
                    </div>
                    <button
                      onClick={() => setSelectedMessage(newestMsg)}
                      className="px-2.5 py-1 bg-purple-100 text-purple-700 text-[10px] font-bold rounded-lg hover:bg-purple-200 transition-all"
                    >
                      View
                    </button>
                  </div>
                </div>
              );
            })()}
          </motion.div>
        )}

        {/* Charts row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm col-span-1">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-bold text-gray-900 text-sm">Total Income (P&L)</h3>
              <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">+18%</span>
            </div>
            <p className="text-base font-black text-emerald-600 mb-0.5">NPR {(profit/1000).toFixed(0)}K profit</p>
            <div className="flex gap-4 text-xs mb-2">
              <span className="flex items-center gap-1"><span className="w-3 h-1.5 bg-emerald-500 rounded inline-block"/>Income</span>
              <span className="flex items-center gap-1"><span className="w-3 h-1.5 bg-red-300 rounded inline-block"/>Expense</span>
            </div>
            <ProfitBarChart data={MONTHLY_INCOME}/>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-bold text-gray-900 text-sm">Customer Growth</h3>
              <span className="text-xs text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-full">+24%</span>
            </div>
            <p className="text-base font-black text-blue-600">{GROWTH[GROWTH.length-1].users}</p>
            <p className="text-xs text-gray-400 mb-2">Total registered users</p>
            <GrowthLineChart data={GROWTH}/>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-900 text-sm mb-1">Customer Satisfaction</h3>
            <p className="text-base font-black text-emerald-600 mb-0.5">77%</p>
            <p className="text-xs text-gray-400 mb-2">Happy or very happy</p>
            <DonutChart data={SATISFACTION} size={100}/>
          </div>
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-900 text-sm mb-4 flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-button-primary"/> Today's Calendar
            </h3>
            <MiniCalendar/>
            <div className="mt-3 space-y-1.5 border-t border-gray-100 pt-3">
              {[{t:'10:00 AM',e:'Property inspection — Thamel'},{t:'2:00 PM',e:'User onboarding call'},{t:'4:30 PM',e:'Admin review meeting'}].map(ev=>(
                <div key={ev.t} className="flex gap-2 text-xs">
                  <span className="text-button-primary font-semibold w-16 flex-shrink-0">{ev.t}</span>
                  <span className="text-gray-600 truncate">{ev.e}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-900 text-sm mb-4 flex items-center gap-2">
              <ActivityIcon className="w-4 h-4 text-button-primary"/> Recent Activities
            </h3>
            <div className="space-y-3">
              {ACTIVITIES.map((a,i)=>(
                <motion.div key={i} initial={{opacity:0,x:-8}} animate={{opacity:1,x:0}} transition={{delay:i*0.06}}
                  className="flex items-start gap-3">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${a.color}`}>
                    <ActivityIcon className="w-3.5 h-3.5"/>
                  </div>
                  <div className="flex-1 min-w-0 border-b border-gray-50 pb-2">
                    <p className="text-xs text-gray-700 leading-snug">{a.msg}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{a.time}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
            <div>
              <h3 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2">
                <ShieldAlertIcon className="w-4 h-4 text-button-primary"/> Risk Indicators
              </h3>
              {RISK.map(r=>(
                <div key={r.label} className="mb-2.5">
                  <div className="flex justify-between text-xs mb-1"><span className="font-medium text-gray-700">{r.label}</span><span className="font-bold">{r.pct}%</span></div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <motion.div className={`h-2.5 rounded-full ${r.colorClass}`}
                      initial={{width:0}} animate={{width:`${r.pct}%`}} transition={{duration:0.8,ease:[0.16,1,0.3,1]}}/>
                  </div>
                </div>
              ))}
            </div>
            <div>
              <h4 className="font-bold text-gray-900 text-xs mb-2 flex items-center gap-2">
                <MapPinIcon className="w-3.5 h-3.5 text-red-500"/> High Demand Locations
              </h4>
              <div className="space-y-1.5">
                {HIGH_DEMAND_LOCS.map(l=>(
                  <div key={l} className="flex items-center gap-2 text-xs">
                    <MapPinIcon className="w-3 h-3 text-red-400 flex-shrink-0"/>
                    <span className="text-gray-700 flex-1 truncate">{l}</span>
                    <span className="text-[10px] bg-red-50 text-red-600 font-bold px-1.5 py-0.5 rounded-full">Hot</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Row 3 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-900 text-sm mb-4 flex items-center gap-2">
              <MapPinIcon className="w-4 h-4 text-button-primary"/> Customer Preferred Locations
            </h3>
            <DonutChart data={PREF_LOCS} size={110}/>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-900 text-sm mb-4 flex items-center gap-2">
              <TrendingUpIcon className="w-4 h-4 text-button-primary"/> Performance Stats
            </h3>
            <PerformanceRadial data={PERF}/>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-900 text-sm mb-4 flex items-center gap-2">
              <AlertTriangleIcon className="w-4 h-4 text-amber-500"/> Last Security Reports
            </h3>
            <div className="space-y-2">
              {ALERTS_INIT.slice(0,3).map((a,i)=>(
                <motion.div key={a.id} initial={{opacity:0}} animate={{opacity:1}} transition={{delay:i*0.07}}
                  className={`flex items-start gap-2 p-2.5 rounded-xl ${a.severity==='high'?'bg-red-50':a.severity==='medium'?'bg-amber-50':'bg-blue-50'}`}>
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full flex-shrink-0 mt-0.5 ${a.severity==='high'?'bg-red-500 text-white':a.severity==='medium'?'bg-amber-500 text-white':'bg-blue-500 text-white'}`}>{a.severity.toUpperCase()}</span>
                  <div>
                    <p className="text-xs text-gray-800 leading-snug">{a.msg}</p>
                    <p className="text-[10px] text-gray-400">{a.time}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    )

    // ── USERS ─────────────────────────────────────────────────────────────────
    case 'users': return (
      <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}}>
        {/* Sub-tabs — green bg, white text when active; white bg, green text when inactive */}
        <div className="flex items-center gap-2 mb-5 pb-3 border-b border-gray-100 overflow-x-auto">
          {(['users','reviews','reports'] as const).map(t=>{
            const active = userTab === t
            const count = t==='reports'?users.filter(u=>u.reports>0).length:null
            return (
              <motion.button key={t} whileHover={{scale:1.03}} whileTap={{scale:0.97}}
                onClick={()=>setUserTab(t)}
                className={`px-5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border-2 capitalize flex items-center gap-1.5
                  ${active
                    ?'bg-button-primary text-white border-button-primary shadow-md'
                    :'bg-white text-button-primary border-button-primary/30 hover:border-button-primary hover:bg-button-primary/5'}`}>
                {t === 'reviews' ? 'Reviews & Rating' : t.charAt(0).toUpperCase()+t.slice(1)}
                {count!==null&&count>0&&<span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-black ${active?'bg-white text-button-primary':'bg-button-primary text-white'}`}>{count}</span>}
              </motion.button>
            )
          })}
        </div>

        {/* USERS TABLE */}
        {userTab==='users'&&(
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <div className="relative flex-1 min-w-[200px]">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
                <input value={userSearch} onChange={e=>setUserSearch(e.target.value)} placeholder="Search by name or email..."
                  className="w-full pl-9 pr-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-button-primary transition-all bg-white"/>
              </div>
              <div className="relative" ref={filterRef}>
                <button onClick={()=>setFilterOpen(v=>!v)}
                  className="flex items-center gap-2 px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:border-button-primary bg-white transition-all">
                  <FilterIcon className="w-4 h-4 text-button-primary"/>
                  <span className="capitalize">{filterStatus==='all'?'All Users':filterStatus}</span>
                  <ChevronDownIcon className="w-4 h-4 text-gray-400"/>
                </button>
                <AnimatePresence>
                  {filterOpen&&(
                    <motion.div initial={{opacity:0,y:-6,scale:0.97}} animate={{opacity:1,y:0,scale:1}}
                      exit={{opacity:0,y:-6,scale:0.97}} transition={{duration:0.15}}
                      className="absolute top-full mt-1 w-44 bg-white border border-gray-100 rounded-2xl shadow-2xl z-20 py-1.5 overflow-hidden">
                      {['all','muted','blocked','deactivated','archived','reported'].map(f=>(
                        <button key={f} onClick={()=>{setFilterStatus(f);setFilterOpen(false)}}
                          className={`w-full flex items-center gap-2 px-4 py-2.5 text-left text-sm font-medium transition-colors capitalize
                            ${filterStatus===f?'bg-button-primary text-white':'text-gray-700 bg-white hover:bg-button-primary/10 hover:text-button-primary'}`}>
                          {filterStatus===f&&<CheckIcon className="w-3.5 h-3.5"/>}
                          {f==='all'?'All Users':f}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <span className="text-xs text-button-primary font-bold bg-button-primary/10 px-3 py-2 rounded-xl">
                This month: {users.filter(u=>new Date(u.lastAccess)>=new Date(Date.now()-30*86400000)).length} active
              </span>
              {selected.length>0&&<span className="text-xs bg-gray-100 text-gray-600 px-3 py-2 rounded-xl font-semibold">{selected.length} selected</span>}
              <button onClick={()=>setShowAddUser(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-button-primary text-white font-bold text-sm rounded-xl hover:bg-button-primary/90 transition-all ml-auto">
                <PlusIcon className="w-4 h-4"/> Add User
              </button>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
              <table className="w-full text-sm min-w-[700px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="p-3 w-8">
                      <input type="checkbox" checked={selected.length===filtered.length&&filtered.length>0} onChange={toggleAll}
                        className="w-4 h-4 rounded border-2 border-gray-300 checked:bg-button-primary checked:border-button-primary cursor-pointer"/>
                    </th>
                    {['User','Email','Contact','Role','Status','Registered','Last Access','Actions'].map(h=>(
                      <th key={h} className="p-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {filtered.map((u,i)=>(
                      <motion.tr key={u.id} initial={{opacity:0,x:-8}} animate={{opacity:1,x:0}}
                        exit={{opacity:0,x:10}} transition={{delay:i*0.04}}
                        className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${u.blocked?'opacity-50':''}`}>
                        <td className="p-3">
                          <input type="checkbox" checked={selected.includes(u.id)} onChange={()=>toggleSelect(u.id)}
                            className="w-4 h-4 rounded border-2 border-gray-300 checked:bg-button-primary checked:border-button-primary cursor-pointer"/>
                        </td>
                        <td className="p-3">
                          <button onClick={()=>setDetailUser(u)} className="flex items-center gap-2.5 text-left hover:text-button-primary transition-colors">
                            <div className="w-8 h-8 bg-button-primary/10 rounded-full flex items-center justify-center text-button-primary font-black text-xs flex-shrink-0">
                              {u.firstName.charAt(0)}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 text-xs">{u.firstName} {u.lastName}</p>
                              {u.muted&&<span className="text-[10px] text-amber-500 font-bold">Muted</span>}
                              {u.blocked&&<span className="text-[10px] text-red-500 font-bold ml-1">Blocked</span>}
                            </div>
                          </button>
                        </td>
                        <td className="p-3 text-xs text-gray-500">{u.email}</td>
                        <td className="p-3 text-xs text-gray-500">{u.phone}</td>
                        <td className="p-3">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize ${u.role==='admin'?'bg-purple-100 text-purple-700':u.role==='owner'?'bg-blue-100 text-blue-700':'bg-gray-100 text-gray-700'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${u.status==='active'?'bg-green-100 text-green-700':'bg-amber-100 text-amber-700'}`}>{u.status}</span>
                        </td>
                        <td className="p-3 text-xs text-gray-400 whitespace-nowrap">{daysSince(u.joined)}</td>
                        <td className="p-3 text-xs text-gray-400 whitespace-nowrap">{daysSince(u.lastAccess)}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-1">
                            <button onClick={()=>setDetailUser(u)} title="View" className="p-1.5 text-gray-400 hover:text-button-primary hover:bg-button-primary/10 rounded-lg transition-colors"><EyeIcon className="w-3.5 h-3.5"/></button>
                            {u.status==='pending'&&<button onClick={()=>approveUser(u.id)} title="Approve" className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"><UserCheckIcon className="w-3.5 h-3.5"/></button>}
                            <button onClick={()=>setBlockModalUser(u)} title={u.blocked?'Unblock':'Block'} className={`p-1.5 rounded-lg transition-colors ${u.blocked?'text-red-500 bg-red-50':'text-gray-400 hover:text-red-500 hover:bg-red-50'}`}><LockIcon className="w-3.5 h-3.5"/></button>
                            <button onClick={()=>deleteUser(u.id)} title="Delete" className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><TrashIcon className="w-3.5 h-3.5"/></button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
              {filtered.length===0&&<div className="text-center py-12 text-gray-400 text-sm">No users match this filter.</div>}
            </div>
          </div>
        )}

        {/* REVIEWS */}
        {userTab==='reviews'&&(
          <div className="space-y-3">
            {[
              {user:'Anita Thapa',prop:'Modern 2BHK Apartment',rating:5,comment:'Excellent property and very responsive owner!',time:'2 days ago'},
              {user:'Maya Rai',   prop:'Cozy Studio Room',       rating:4,comment:'Good value for money, clean and peaceful.',  time:'5 days ago'},
              {user:'Bikash T.', prop:'Spacious 3BHK',          rating:2,comment:'Owner was unresponsive. Issues went unresolved.',time:'1 week ago'},
            ].map((r,i)=>(
              <motion.div key={i} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:i*0.06}}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-start gap-3">
                <div className="w-10 h-10 bg-button-primary/10 rounded-full flex items-center justify-center text-button-primary font-black text-sm flex-shrink-0">{r.user.charAt(0)}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="font-bold text-gray-900 text-sm">{r.user}</p>
                    <span className="text-xs text-gray-400">on {r.prop}</span>
                    <div className="flex gap-0.5 ml-auto">{[1,2,3,4,5].map(s=><StarIcon key={s} className={`w-3.5 h-3.5 ${s<=r.rating?'fill-amber-400 text-amber-400':'text-gray-200'}`}/>)}</div>
                  </div>
                  <p className="text-gray-600 text-xs">{r.comment}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] text-gray-400">{r.time}</span>
                    <button onClick={()=>toast.success('Review removed')} className="text-xs text-red-500 font-semibold hover:underline">Remove</button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* REPORTS */}
        {userTab==='reports'&&(
          <div className="space-y-3">
            {users.filter(u=>u.reports>0).map((u,i)=>(
              <motion.div key={u.id} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:i*0.06}}
                className="bg-white rounded-2xl border border-red-100 shadow-sm p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-black text-white ${u.role==='owner'?'bg-blue-500':u.role==='admin'?'bg-purple-500':'bg-emerald-500'}`}>
                    {u.firstName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-gray-900 text-sm">{u.firstName} {u.lastName}</p>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize ${u.role==='admin'?'bg-purple-100 text-purple-700':u.role==='owner'?'bg-blue-100 text-blue-700':'bg-emerald-100 text-emerald-700'}`}>{u.role}</span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">{u.reports} report{u.reports>1?'s':''}</span>
                      {u.blocked&&<span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-800 text-white">Blocked</span>}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5"><MailIcon className="w-3 h-3"/>{u.email}</div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5"><PhoneIcon className="w-3 h-3"/>{u.phone}</div>
                    {u.reportReason&&(
                      <div className="mt-2 p-2.5 bg-red-50 border border-red-100 rounded-xl">
                        <p className="text-xs text-red-700 font-semibold flex items-center gap-1.5 mb-0.5"><FlagIcon className="w-3 h-3"/>Report Reason:</p>
                        <p className="text-xs text-red-600">{u.reportReason}</p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <button onClick={()=>setBlockModalUser(u)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all ${u.blocked?'border-green-200 text-green-700 hover:bg-green-50':'border-red-200 text-red-600 hover:bg-red-50'}`}>
                    <LockIcon className="w-3.5 h-3.5"/>{u.blocked?'Unblock':'Block'}
                  </button>
                  <button onClick={()=>deleteUser(u.id)} className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-gray-600 text-xs font-semibold rounded-xl hover:bg-gray-50 transition-all">
                    <TrashIcon className="w-3.5 h-3.5"/>Delete Account
                  </button>
                </div>
              </motion.div>
            ))}
            {users.filter(u=>u.reports>0).length===0&&(
              <div className="text-center py-12 bg-gray-50 rounded-2xl text-gray-400 text-sm">No reports filed.</div>
            )}
          </div>
        )}
      </motion.div>
    )

    // ── BOOKINGS ──────────────────────────────────────────────────────────────
    case 'bookings': return (
      <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full font-semibold">{visibleBookings.length} bookings</span>
          </div>
          <button onClick={()=>{setBookings(getBookings());setDismissedBookings([]);setLS('fm_dismissed_bookings',[])}} className="flex items-center gap-1.5 text-xs text-button-primary font-semibold hover:underline">
            <RefreshCcwIcon className="w-3.5 h-3.5"/> Refresh
          </button>
        </div>
        {visibleBookings.length===0?(
          <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <CalendarIcon className="w-12 h-12 text-gray-200 mx-auto mb-3"/>
            <p className="text-gray-400">No bookings yet.</p>
          </div>
        ):(
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['Receipt ID','Property','Customer','Type','Amount','Status','Move-in',''].map(h=>(
                    <th key={h} className="p-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleBookings.map((b:any,i:number)=>(
                  <motion.tr key={b.receiptId||i} initial={{opacity:0}} animate={{opacity:1}} transition={{delay:i*0.04}}
                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="p-3 text-xs font-mono text-button-primary">{b.receiptId}</td>
                    <td className="p-3 text-xs text-gray-700 max-w-[150px] truncate">{b.propertyTitle}</td>
                    <td className="p-3 text-xs text-gray-700">{b.customerName}</td>
                    <td className="p-3"><span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize ${b.paymentType==='advance'?'bg-blue-100 text-blue-700':b.paymentType==='full'?'bg-green-100 text-green-700':'bg-gray-100 text-gray-600'}`}>{b.paymentType||'cash'}</span></td>
                    <td className="p-3 text-xs font-bold text-gray-900">{b.amount>0?`NPR ${b.amount?.toLocaleString()}`:'Cash'}</td>
                    <td className="p-3"><span className={`text-xs font-bold px-2 py-0.5 rounded-full ${b.status==='confirmed'?'bg-green-100 text-green-700':'bg-amber-100 text-amber-700'}`}>{b.status}</span></td>
                    <td className="p-3 text-xs text-gray-400">{b.moveInDate}</td>
                    <td className="p-3">
                      <button onClick={()=>dismissBooking(b.receiptId||b.propertyId)} title="Dismiss"
                        className="p-1.5 text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors">
                        <XIcon className="w-3.5 h-3.5"/>
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {visibleBookings.length>0&&(
          <div className="grid grid-cols-3 gap-4 mt-4">
            {[
              {label:'Total Bookings',value:visibleBookings.length,color:'from-blue-500 to-blue-600'},
              {label:'Confirmed',     value:visibleBookings.filter((b:any)=>b.status==='confirmed').length,color:'from-emerald-500 to-emerald-600'},
              {label:'Total Revenue', value:`NPR ${visibleBookings.reduce((s:number,b:any)=>s+(b.amount||0),0).toLocaleString()}`,color:'from-purple-500 to-purple-600'},
            ].map(s=>(
              <div key={s.label} className={`bg-gradient-to-br ${s.color} rounded-2xl p-4 text-center text-white`}>
                <p className="text-xl font-black">{s.value}</p>
                <p className="text-xs font-semibold text-white/80">{s.label}</p>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    )

    // ── PROPERTIES ────────────────────────────────────────────────────────────
    case 'properties': return (
      <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}}>
        <AdminPropertiesPanel users={users} blockedOwners={blockedOwners} onBlockUser={(uid)=>{const own=users.find(u=>u.id===uid);if(own)setBlockModalUser(own)}} />
      </motion.div>
    )

    // ── ANALYTICS ─────────────────────────────────────────────────────────────
    case 'analytics': return (
      <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} className="space-y-6">
        {/* Top KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {label:'Total Revenue',value:`NPR ${(totalIncome/1000).toFixed(0)}K`,icon:DollarSignIcon,color:'from-emerald-500 to-teal-600'},
            {label:'Net Profit',   value:`NPR ${(profit/1000).toFixed(0)}K`,     icon:TrendingUpIcon, color:'from-blue-500 to-indigo-600'},
            {label:'Total Users',  value:users.length,                           icon:UsersIcon,      color:'from-purple-500 to-violet-600'},
            {label:'Avg. Rating',  value:'4.3 ★',                                icon:StarIcon,       color:'from-amber-500 to-orange-600'},
          ].map((s,i)=>(
            <motion.div key={s.label} initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:i*0.07}}
              whileHover={{y:-3,boxShadow:'0 8px 24px rgba(0,0,0,0.12)'}}
              className={`bg-gradient-to-br ${s.color} rounded-2xl p-4 text-white shadow-sm`}>
              <s.icon className="w-5 h-5 text-white/80 mb-2"/>
              <p className="text-xl font-black">{s.value}</p>
              <p className="text-xs text-white/70 mt-0.5">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Owner new property alert */}
        {adminOwnerNotifs.filter((n:any)=>n.type==='new_property'&&!n.read).length>0&&(
          <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}}
            className="bg-blue-50 border border-blue-200 rounded-2xl p-3 flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <BuildingIcon className="w-4 h-4 text-blue-600"/>
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-blue-800">{adminOwnerNotifs.filter((n:any)=>n.type==='new_property'&&!n.read).length} new property submission(s) from owners</p>
              <p className="text-[10px] text-blue-600">{adminOwnerNotifs.find((n:any)=>n.type==='new_property'&&!n.read)?.msg}</p>
            </div>
            <button onClick={()=>{setActiveTab('properties');setAdminOwnerNotifs(prev=>prev.map((n:any)=>({...n,read:true})));setLS('fm_admin_notifs',adminOwnerNotifs.map((n:any)=>({...n,read:true})))}}
              className="px-3 py-1.5 bg-blue-600 text-white text-[10px] font-bold rounded-lg hover:bg-blue-700 transition-all">Review</button>
          </motion.div>
        )}

        {/* Charts row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <motion.div initial={{opacity:0,x:-20}} animate={{opacity:1,x:0}} transition={{delay:0.15}}
            className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-gray-900">Income vs Expense</h3>
                <p className="text-xs text-gray-400">Profit & Loss — last 6 months</p>
              </div>
              <div className="flex gap-3 text-xs">
                <span className="flex items-center gap-1.5"><span className="w-3 h-2 bg-emerald-500 rounded inline-block"/>Income</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-2 bg-red-300 rounded inline-block"/>Expense</span>
              </div>
            </div>
            <ProfitBarChart data={MONTHLY_INCOME}/>
          </motion.div>

          <motion.div initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} transition={{delay:0.15}}
            className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-gray-900">Customer Growth</h3>
                <p className="text-xs text-gray-400">Monthly new registrations</p>
              </div>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">+24% ↑</span>
            </div>
            <GrowthLineChart data={GROWTH}/>
          </motion.div>
        </div>

        {/* Charts row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.25}}
            className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-1">User Distribution</h3>
            <p className="text-xs text-gray-400 mb-4">Tenants, owners and admins</p>
            <DonutChart data={USER_DIST} size={120}/>
          </motion.div>

          <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.3}}
            className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-1">Monthly Signups</h3>
            <p className="text-xs text-gray-400 mb-4">New users per month</p>
            <SignupBarChart data={MONTHLY_SIGNUPS}/>
          </motion.div>

          <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.35}}
            className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-1">Customer Satisfaction</h3>
            <p className="text-xs text-gray-400 mb-4">Overall sentiment breakdown</p>
            <DonutChart data={SATISFACTION} size={110}/>
          </motion.div>
        </div>

        {/* Charts row 3 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.4}}
            className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-1">High Demand Locations</h3>
            <p className="text-xs text-gray-400 mb-4">Top searched areas this month</p>
            <DonutChart data={PREF_LOCS} size={120}/>
          </motion.div>

          <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.45}}
            className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4">Performance Statistics</h3>
            <PerformanceRadial data={PERF}/>
          </motion.div>
        </div>
      </motion.div>
    )

    // ── SECURITY ──────────────────────────────────────────────────────────────
    case 'alerts': return (
      <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}}>
        <div className="space-y-3">
          {ALERTS_INIT.map((a,i)=>(
            <motion.div key={a.id} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:i*0.07}}
              className={`flex items-start gap-4 p-4 rounded-2xl border ${a.severity==='high'?'bg-red-50 border-red-200':a.severity==='medium'?'bg-amber-50 border-amber-200':'bg-blue-50 border-blue-200'}`}>
              <AlertTriangleIcon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${a.severity==='high'?'text-red-600':a.severity==='medium'?'text-amber-600':'text-blue-600'}`}/>
              <div className="flex-1">
                <p className="font-bold text-gray-900 text-sm">{a.msg}</p>
                <p className="text-xs text-gray-500 mt-0.5">{a.time}</p>
              </div>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${a.severity==='high'?'bg-red-500 text-white':a.severity==='medium'?'bg-amber-500 text-white':'bg-blue-500 text-white'}`}>
                {a.severity}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    )

    // ── SETTINGS ──────────────────────────────────────────────────────────────
    case 'settings': return (
      <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} className="flex gap-6 max-w-6xl">
        
        {/* Settings Sidebar */}
        <div className="w-64 flex-shrink-0">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 sticky top-6">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4 px-2">Settings</h3>
            <nav className="space-y-1">
              {[
                {id:'theme' as const, label:'Theme', icon:PaletteIcon},
                {id:'profile' as const, label:'Profile', icon:UsersIcon},
                {id:'notifications' as const, label:'Notifications', icon:BellIcon},
                {id:'account' as const, label:'Account Info', icon:SettingsIcon},
                {id:'subscription' as const, label:'Manage Subscription', icon:DollarSignIcon},
              ].map(item=>(
                <button key={item.id} onClick={()=>setSettingsTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left ${
                    settingsTab===item.id
                      ?'bg-button-primary text-white shadow-sm'
                      :'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
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
          
          {/* THEME SECTION */}
          {settingsTab==='theme'&&(
            <>
              {/* Theme Customization */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-5">
                  <PaletteIcon className="w-5 h-5 text-button-primary"/>
                  <h3 className="font-bold text-gray-900 dark:text-white">Theme Color</h3>
                  <span className="text-xs text-gray-400 ml-auto">Changes entire website color</span>
                </div>
                <div className="grid grid-cols-5 gap-3">
                  {Object.entries(THEMES).map(([key,t])=>(
                    <motion.button key={key} whileHover={{scale:1.08}} whileTap={{scale:0.95}}
                      onClick={()=>handleThemeChange(key)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${theme===key?'border-gray-800 dark:border-gray-300 shadow-md':'border-gray-200 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'}`}>
                      <div className="w-10 h-10 rounded-xl shadow-md" style={{background:`linear-gradient(135deg, ${t.primary}, ${t.button})`}}/>
                      <span className="text-[10px] font-semibold text-gray-600 dark:text-gray-300">{t.label}</span>
                      {theme===key&&<span className="text-[10px] bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-1.5 py-0.5 rounded-full font-bold">Active</span>}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Display Preferences */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-5">
                  <SunIcon className="w-5 h-5 text-button-primary"/>
                  <h3 className="font-bold text-gray-900 dark:text-white">Display Preferences</h3>
                </div>
                <div className="space-y-4">
                  {[
                    {label:'Dark Mode', desc:'Switch to dark color scheme', state:isDark, toggle:()=>{
                      toggleTheme();
                      setTimeout(() => {
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
                      }, 100);
                    }, icon:MoonIcon},
                    {label:'Compact View', desc:'Show more data with smaller spacing', state:compactView, toggle:()=>setCompactView(v=>!v), icon:BarChart3Icon},
                    {label:'Notification Sound', desc:'Play sound for new alerts', state:notifSound, toggle:()=>setNotifSound(v=>!v), icon:BellRingIcon},
                  ].map(s=>(
                    <div key={s.label} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-button-primary/10 rounded-lg flex items-center justify-center">
                          <s.icon className="w-4 h-4 text-button-primary"/>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white text-sm">{s.label}</p>
                          <p className="text-xs text-gray-400">{s.desc}</p>
                        </div>
                      </div>
                      <motion.button whileTap={{scale:0.9}} onClick={s.toggle}
                        className={`w-12 h-6 rounded-full transition-all relative ${s.state?'bg-button-primary':'bg-gray-300 dark:bg-gray-600'}`}>
                        <motion.div animate={{x: s.state ? 24 : 2}}
                          className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"/>
                      </motion.button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* PROFILE SECTION */}
          {settingsTab==='profile'&&(
            <>
              {/* Profile Information */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
                <h3 className="font-bold text-gray-900 dark:text-white mb-5">Admin Profile</h3>
                
                {/* Profile Picture */}
                <div className="flex items-center gap-6 mb-6 pb-6 border-b border-gray-100 dark:border-gray-700">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-button-primary to-primary flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                      {profileForm.profilePicture ? (
                        <img src={profileForm.profilePicture} alt="Profile" className="w-full h-full object-cover"/>
                      ) : (
                        <span>{profileForm.firstName.charAt(0) || 'A'}</span>
                      )}
                    </div>
                    <label htmlFor="profile-pic-upload" className="absolute bottom-0 right-0 w-8 h-8 bg-button-primary rounded-full flex items-center justify-center cursor-pointer hover:bg-button-primary/90 transition-all shadow-md">
                      <PlusIcon className="w-4 h-4 text-white"/>
                      <input id="profile-pic-upload" type="file" accept="image/*" onChange={handleProfilePictureUpload} className="hidden"/>
                    </label>
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white text-lg">{profileForm.firstName} {profileForm.lastName}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{profileForm.email}</p>
                    <p className="text-xs text-gray-400 mt-1">Click the + icon to upload a new photo</p>
                  </div>
                </div>

                {/* Profile Form */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">First Name</label>
                      <input value={profileForm.firstName} onChange={(e)=>setProfileForm({...profileForm, firstName:e.target.value})}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl text-sm focus:outline-none focus:border-button-primary transition-all"/>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Last Name</label>
                      <input value={profileForm.lastName} onChange={(e)=>setProfileForm({...profileForm, lastName:e.target.value})}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl text-sm focus:outline-none focus:border-button-primary transition-all"/>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Email</label>
                    <input type="email" value={profileForm.email} onChange={(e)=>setProfileForm({...profileForm, email:e.target.value})}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl text-sm focus:outline-none focus:border-button-primary transition-all"/>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Role</label>
                    <div className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-100 rounded-xl text-sm bg-gray-50">
                      <span className="text-gray-700 dark:text-gray-300 font-medium">
                        {profileForm.role === 'admin' ? 'Administrator' : profileForm.role === 'tenant' ? 'Tenant' : 'Landlord'}
                      </span>
                    </div>
                  </div>

                  <motion.button whileHover={{scale:1.01}} whileTap={{scale:0.98}}
                    onClick={handleSaveProfile}
                    disabled={savingProfile}
                    className="px-6 py-2.5 bg-button-primary text-white font-bold rounded-xl hover:bg-button-primary/90 text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                    {savingProfile ? 'Saving...' : 'Save Changes'}
                  </motion.button>
                </div>
              </div>

              {/* Change Password */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">Change Password</h3>
                    <p className="text-xs text-gray-400 mt-1">Update your password to keep your account secure</p>
                  </div>
                  {!showPasswordForm && (
                    <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}}
                      onClick={()=>setShowPasswordForm(true)}
                      className="px-4 py-2 bg-white dark:bg-gray-800 border-2 border-button-primary text-button-primary text-sm font-bold rounded-lg hover:bg-button-primary hover:text-white transition-all">
                      Change Password
                    </motion.button>
                  )}
                </div>

                {showPasswordForm && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Current Password</label>
                      <input type="password" value={passwordForm.currentPassword} onChange={(e)=>setPasswordForm({...passwordForm, currentPassword:e.target.value})}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl text-sm focus:outline-none focus:border-button-primary transition-all"/>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">New Password</label>
                      <input type="password" value={passwordForm.newPassword} onChange={(e)=>setPasswordForm({...passwordForm, newPassword:e.target.value})}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl text-sm focus:outline-none focus:border-button-primary transition-all"/>
                      <p className="text-xs text-gray-400 mt-1">Must be at least 6 characters long</p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Confirm New Password</label>
                      <input type="password" value={passwordForm.confirmPassword} onChange={(e)=>setPasswordForm({...passwordForm, confirmPassword:e.target.value})}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl text-sm focus:outline-none focus:border-button-primary transition-all"/>
                    </div>

                    <div className="flex gap-3">
                      <motion.button whileHover={{scale:1.01}} whileTap={{scale:0.98}}
                        onClick={handleChangePassword}
                        disabled={changingPassword}
                        className="px-6 py-2.5 bg-button-primary text-white font-bold rounded-xl hover:bg-button-primary/90 text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                        {changingPassword ? 'Changing...' : 'Update Password'}
                      </motion.button>
                      <motion.button whileHover={{scale:1.01}} whileTap={{scale:0.98}}
                        onClick={()=>{setShowPasswordForm(false);setPasswordForm({currentPassword:'',newPassword:'',confirmPassword:''})}}
                        className="px-6 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 text-sm transition-all">
                        Cancel
                      </motion.button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* NOTIFICATIONS SECTION */}
          {settingsTab==='notifications'&&(
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-5">
                <BellIcon className="w-5 h-5 text-button-primary"/>
                <h3 className="font-bold text-gray-900 dark:text-white">Notification Preferences</h3>
              </div>
              <div className="space-y-4">
                {[
                  {label:'Email Notifications', desc:'Receive notifications via email', state:true},
                  {label:'New User Signups', desc:'Alert when new users register', state:true},
                  {label:'Property Submissions', desc:'Alert when properties are submitted', state:true},
                  {label:'Contact Messages', desc:'Alert for new contact form messages', state:true},
                  {label:'System Alerts', desc:'Critical system notifications', state:true},
                ].map((n,i)=>(
                  <div key={n.label} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">{n.label}</p>
                      <p className="text-xs text-gray-400">{n.desc}</p>
                    </div>
                    <motion.button whileTap={{scale:0.9}}
                      className={`w-12 h-6 rounded-full transition-all relative ${n.state?'bg-button-primary':'bg-gray-300 dark:bg-gray-600'}`}>
                      <motion.div animate={{x: n.state ? 24 : 2}}
                        className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"/>
                    </motion.button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ACCOUNT INFO SECTION */}
          {settingsTab==='account'&&(
            <>
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
                <h3 className="font-bold text-gray-900 dark:text-white mb-5">Account Statistics</h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    {label:'Total Users', value:users.length, icon:UsersIcon, bg:'bg-gradient-to-br from-blue-50 to-sky-100 dark:from-blue-900/20 dark:to-sky-900/20', ic:'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400', border:'border-blue-100 dark:border-blue-900', vc:'text-blue-800 dark:text-blue-300'},
                    {label:'Total Properties', value:properties.length, icon:BuildingIcon, bg:'bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20', ic:'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400', border:'border-green-100 dark:border-green-900', vc:'text-green-800 dark:text-green-300'},
                    {label:'Active Bookings', value:bookings.length, icon:CalendarIcon, bg:'bg-gradient-to-br from-pink-50 to-rose-100 dark:from-pink-900/20 dark:to-rose-900/20', ic:'bg-pink-100 text-pink-600 dark:bg-pink-900/50 dark:text-pink-400', border:'border-pink-100 dark:border-pink-900', vc:'text-pink-800 dark:text-pink-300'},
                    {label:'Contact Messages', value:contactMessages.length, icon:MailIcon, bg:'bg-gradient-to-br from-yellow-50 to-amber-100 dark:from-yellow-900/20 dark:to-amber-900/20', ic:'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/50 dark:text-yellow-400', border:'border-yellow-100 dark:border-yellow-900', vc:'text-yellow-800 dark:text-yellow-300'},
                  ].map(stat=>(
                    <div key={stat.label} className={`${stat.bg} border ${stat.border} rounded-2xl p-4`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className={`w-8 h-8 bg-white/80 rounded-xl flex items-center justify-center shadow-sm ${stat.ic}`}>
                          <stat.icon className="w-4 h-4"/>
                        </div>
                      </div>
                      <p className={`text-lg font-black ${stat.vc}`}>{stat.value}</p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 font-medium">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Danger Zone */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-red-100 dark:border-red-900 shadow-sm p-6">
                <h3 className="font-bold text-red-600 mb-4 flex items-center gap-2"><AlertTriangleIcon className="w-4 h-4"/>Danger Zone</h3>
                <div className="space-y-3">
                  {[
                    {label:'Clear All Bookings', desc:'Remove all booking records from system', action:()=>{setLS('fm_bookings',[]);setBookings([]);toast.success('Bookings cleared')}},
                    {label:'Reset Blocked Owners', desc:'Unblock all blocked owners', action:()=>{saveBlockedOwners([]);setBlockedOwners([]);setUsers(prev=>prev.map(u=>({...u,blocked:false})));toast.success('All owners unblocked')}},
                  ].map(a=>(
                    <div key={a.label} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
                      <div><p className="font-semibold text-gray-900 dark:text-white text-sm">{a.label}</p><p className="text-xs text-gray-400">{a.desc}</p></div>
                      <button onClick={a.action} className="px-3 py-1.5 bg-red-500 text-white text-xs font-bold rounded-lg hover:bg-red-600 transition-all">Execute</button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* SUBSCRIPTION SECTION */}
          {settingsTab==='subscription'&&(
            <>
              {/* Subscription Statistics */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <DollarSignIcon className="w-5 h-5 text-button-primary"/>
                    <h3 className="font-bold text-gray-900 dark:text-white">Subscription Overview</h3>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    {label:'Active subscriptions', value:'24', icon:CheckCircleIcon, color:'text-green-600'},
                    {label:'Monthly revenue', value:'₹23,976', icon:TrendingUpIcon, color:'text-blue-600'},
                    {label:'Premium properties', value:'18', icon:StarIcon, color:'text-amber-600'},
                  ].map(stat=>(
                    <div key={stat.label} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <stat.icon className={`w-4 h-4 ${stat.color}`}/>
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">{stat.label}</span>
                      </div>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing Management */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-bold text-gray-900 dark:text-white">Premium Property Pricing</h3>
                  {!editingPricing ? (
                    <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}}
                      onClick={()=>{setEditingPricing(true);setTempPricing(subscriptionPricing)}}
                      className="px-4 py-2 bg-button-primary text-white text-sm font-bold rounded-lg hover:bg-button-primary/90 transition-all">
                      Edit Pricing
                    </motion.button>
                  ) : (
                    <div className="flex gap-2">
                      <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}}
                        onClick={()=>{
                          setSubscriptionPricing(tempPricing);
                          setLS('fm_subscription_pricing', tempPricing);
                          setEditingPricing(false);
                          toast.success('Pricing updated successfully!');
                        }}
                        className="px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 transition-all">
                        Save Changes
                      </motion.button>
                      <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}}
                        onClick={()=>{setEditingPricing(false);setTempPricing(subscriptionPricing)}}
                        className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-white text-sm font-bold rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-all">
                        Cancel
                      </motion.button>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  {[
                    {id:'monthly', label:'Monthly Plan', period:'per month', bg:'bg-gradient-to-br from-yellow-50 to-amber-100 dark:from-yellow-900/20 dark:to-amber-900/20', border:'border-yellow-200 dark:border-yellow-800', badge:''},
                    {id:'quarterly', label:'Quarterly Plan', period:'per 3 months', bg:'bg-gradient-to-br from-blue-50 to-sky-100 dark:from-blue-900/20 dark:to-sky-900/20', border:'border-blue-200 dark:border-blue-800', badge:'Save 17%'},
                    {id:'yearly', label:'Yearly Plan', period:'per year', bg:'bg-gradient-to-br from-pink-50 to-rose-100 dark:from-pink-900/20 dark:to-rose-900/20', border:'border-pink-200 dark:border-pink-800', badge:'Save 25%'},
                  ].map(plan=>(
                    <div key={plan.id} className={`p-5 rounded-xl border-2 transition-all ${
                      editingPricing 
                        ? `border-button-primary ${plan.bg}` 
                        : `${plan.border} ${plan.bg}`
                    }`}>
                      <div className="text-center mb-4">
                        <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-1">{plan.label}</h4>
                        <p className="text-xs text-gray-400">{plan.period}</p>
                        {plan.badge&&<span className="inline-block mt-2 px-2 py-0.5 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-[10px] font-bold rounded-full">{plan.badge}</span>}
                      </div>
                      
                      {editingPricing ? (
                        <div className="space-y-2">
                          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400">Price (₹)</label>
                          <input type="number" value={tempPricing[plan.id]}
                            onChange={(e)=>setTempPricing({...tempPricing, [plan.id]:parseInt(e.target.value)||0})}
                            className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-center text-xl font-bold focus:outline-none focus:border-button-primary transition-all"/>
                        </div>
                      ) : (
                        <div className="text-center">
                          <p className="text-3xl font-black text-gray-900 dark:text-white">₹{subscriptionPricing[plan.id]}</p>
                          <p className="text-xs text-gray-400 mt-1">{plan.period}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                  <div className="flex items-start gap-3">
                    <AlertTriangleIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"/>
                    <div>
                      <p className="font-semibold text-blue-900 dark:text-blue-300 text-sm mb-1">Pricing Information</p>
                      <p className="text-xs text-blue-700 dark:text-blue-400">These prices apply to premium property listings. Owners can choose any plan to feature their properties with enhanced visibility and priority placement.</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

        </div>
      </motion.div>
    )

    default: return null
    }
  }

  const currentHeader = pageHeaderMap[activeTab] || pageHeaderMap.overview

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">

      {/* SIDEBAR */}
      <aside className={`${sidebarCollapsed?'w-16':'w-64'} bg-white dark:bg-gray-800 border-r border-gray-100 dark:border-gray-700 min-h-screen sticky top-0 hidden lg:flex flex-col transition-all duration-300 flex-shrink-0 z-20`}>
        <div className="p-4 flex flex-col h-full">
          <div className="flex items-center justify-between mb-6">
            {!sidebarCollapsed&&(
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-button-primary to-primary rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-sm">F</span>
                </div>
                <span className="text-primary dark:text-white font-black text-base">Flat-Mate</span>
              </div>
            )}
            <button onClick={()=>setSidebarCollapsed(v=>!v)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors ml-auto">
              <MenuIcon className="w-4 h-4 text-gray-500 dark:text-gray-400"/>
            </button>
          </div>

          {!sidebarCollapsed&&(
            <div className="flex items-center gap-2.5 mb-5 p-3 bg-gradient-to-r from-button-primary/5 to-blue-50 dark:from-button-primary/10 dark:to-blue-900/20 rounded-xl border border-button-primary/10 dark:border-button-primary/20">
              <div className="w-9 h-9 bg-button-primary rounded-full flex items-center justify-center text-white font-black text-sm flex-shrink-0 overflow-hidden">
                {profileForm.profilePicture ? (
                  <img src={profileForm.profilePicture} alt="Profile" className="w-full h-full object-cover"/>
                ) : (
                  <span>{(user?.name||'A').charAt(0)}</span>
                )}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-gray-900 dark:text-white text-sm truncate">{user?.name||'Admin'}</p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500">Administrator</p>
              </div>
            </div>
          )}

          <nav className="space-y-0.5 flex-1">
            {TABS.map(tab=>{
              const Icon=tab.icon
              const isActive=activeTab===tab.id
              return (
                <motion.button key={tab.id} whileHover={{x:sidebarCollapsed?0:3}} whileTap={{scale:0.98}}
                  onClick={()=>setActiveTab(tab.id)}
                  title={sidebarCollapsed?tab.label:undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${isActive?'bg-button-primary/10 dark:bg-button-primary/20 text-button-primary dark:text-button-primary font-bold':'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                  <Icon className="w-4 h-4 flex-shrink-0"/>
                  {!sidebarCollapsed&&(
                    <>
                      <span>{tab.label}</span>
                      {tab.id==='users'&&newUsersCount>0&&<span className="ml-auto w-5 h-5 bg-amber-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">{newUsersCount}</span>}
                      {tab.id==='bookings'&&newBookingsCount>0&&<span className="ml-auto w-5 h-5 bg-emerald-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">{newBookingsCount}</span>}
                    </>
                  )}
                </motion.button>
              )
            })}
          </nav>

          <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
            <motion.button whileHover={{x:sidebarCollapsed?0:3}} onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">
              <LogOutIcon className="w-4 h-4 flex-shrink-0"/>
              {!sidebarCollapsed&&'Sign Out'}
            </motion.button>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-4 sm:px-6 py-3.5 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button onClick={()=>setMobileOpen(v=>!v)} className="lg:hidden p-1.5 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
              <MenuIcon className="w-5 h-5 text-gray-600 dark:text-gray-300"/>
            </button>
            <div>
              <h1 className="text-base font-black text-primary dark:text-white">{currentHeader.title}</h1>
              <p className="text-[11px] text-gray-400 dark:text-gray-500">{currentHeader.sub}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={()=>{setBookings(getBookings());setReqList(getRequirements());toast.success('Data refreshed')}}
              className="p-2 text-gray-400 dark:text-gray-500 hover:text-button-primary hover:bg-button-primary/10 dark:hover:bg-button-primary/20 rounded-xl transition-colors">
              <RefreshCcwIcon className="w-4 h-4"/>
            </button>
            <div className="relative">
              <button className="p-2 text-gray-400 dark:text-gray-500 hover:text-button-primary hover:bg-button-primary/10 dark:hover:bg-button-primary/20 rounded-xl transition-colors">
                <BellIcon className="w-4 h-4"/>
              </button>
              {pendingReqs>0&&<span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold">{pendingReqs}</span>}
            </div>
            <div className="w-8 h-8 bg-button-primary rounded-full flex items-center justify-center text-white font-black text-sm cursor-pointer overflow-hidden" onClick={()=>setActiveTab('settings')}>
              {profileForm.profilePicture ? (
                <img src={profileForm.profilePicture} alt="Profile" className="w-full h-full object-cover"/>
              ) : (
                <span>{(user?.name||'A').charAt(0)}</span>
              )}
            </div>
          </div>
        </header>

        <AnimatePresence>
          {mobileOpen&&(
            <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}}
              className="lg:hidden bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="px-4 py-3 flex flex-wrap gap-2">
                {TABS.map(tab=>{
                  const Icon=tab.icon
                  return <button key={tab.id} onClick={()=>{setActiveTab(tab.id);setMobileOpen(false)}}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold transition-all ${activeTab===tab.id?'bg-button-primary text-white':'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                    <Icon className="w-3.5 h-3.5"/>{tab.label}
                  </button>
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1 p-4 sm:p-6 overflow-auto">
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}
              exit={{opacity:0,y:-8}} transition={{duration:0.18}}>
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* MODALS */}
      <AnimatePresence>
        {showAddUser&&<AddUserModal onClose={()=>setShowAddUser(false)} onAdd={u=>setUsers(prev=>[u,...prev])}/>}
        {detailUser&&<UserDetailModal user={detailUser} bookings={bookings} onClose={()=>setDetailUser(null)}/>}
        {blockModalUser&&(
          <BlockReasonModal user={blockModalUser} onClose={()=>setBlockModalUser(null)}
            onConfirm={reason=>handleBlockFromReport(blockModalUser.id, reason)}/>
        )}
      </AnimatePresence>

      {/* Delete/Reject modal */}
      {deleteModal&&(
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={()=>setDeleteModal(null)}/>
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-sm z-10 shadow-2xl">
            <h3 className="font-black text-gray-900 mb-3 capitalize">{deleteModal.action} Requirement</h3>
            <textarea value={deleteReason} onChange={e=>setDeleteReason(e.target.value)} rows={3} placeholder="Enter reason..."
              className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-button-primary resize-none mb-4"/>
            <div className="flex gap-3">
              <button onClick={()=>setDeleteModal(null)} className="flex-1 py-2 border-2 border-gray-200 text-gray-600 font-semibold rounded-xl text-sm">Cancel</button>
              <button onClick={()=>{
                if(!deleteReason.trim()){toast.error('Please enter a reason');return}
                if(deleteModal.action==='delete') deleteReq(deleteModal.id,deleteReason)
                else rejectReq(deleteModal.id,deleteReason)
                setDeleteModal(null);setDeleteReason('')
              }} className="flex-1 py-2 bg-red-500 text-white font-bold rounded-xl text-sm hover:bg-red-600">Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* Citizenship modal */}
      {citizenModal&&(
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={()=>setCitizenModal(null)}/>
          <div className="relative bg-white rounded-2xl p-4 w-full max-w-lg z-10 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900">Citizenship — {citizenModal.name}</h3>
              <button onClick={()=>setCitizenModal(null)} className="p-1 hover:bg-gray-100 rounded-full"><XIcon className="w-5 h-5 text-gray-400"/></button>
            </div>
            <img src={citizenModal.url} alt="Citizenship" className="w-full rounded-xl object-contain max-h-80"/>
          </div>
        </div>
      )}

      {/* View Single Message Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={()=>setSelectedMessage(null)}/>
          <motion.div initial={{opacity:0,scale:0.92,y:20}} animate={{opacity:1,scale:1,y:0}}
            exit={{opacity:0,scale:0.92}} transition={{type:'spring',stiffness:320,damping:28}}
            className="relative bg-white rounded-3xl p-7 w-full max-w-md shadow-2xl z-10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-black text-xl text-gray-900">Contact Message</h3>
              <button onClick={()=>setSelectedMessage(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <XIcon className="w-5 h-5 text-gray-400"/>
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-purple-50 rounded-xl p-3">
                  <p className="text-xs text-purple-600 font-semibold mb-1">First Name</p>
                  <p className="text-sm font-bold text-gray-900">{selectedMessage.firstName}</p>
                </div>
                <div className="bg-purple-50 rounded-xl p-3">
                  <p className="text-xs text-purple-600 font-semibold mb-1">Last Name</p>
                  <p className="text-sm font-bold text-gray-900">{selectedMessage.lastName}</p>
                </div>
              </div>
              <div className="bg-blue-50 rounded-xl p-3">
                <p className="text-xs text-blue-600 font-semibold mb-1">Email</p>
                <p className="text-sm font-bold text-gray-900">{selectedMessage.email}</p>
              </div>
              <div className="bg-green-50 rounded-xl p-3">
                <p className="text-xs text-green-600 font-semibold mb-1">Phone Number</p>
                <p className="text-sm font-bold text-gray-900">{selectedMessage.phone}</p>
              </div>
              <div className="bg-amber-50 rounded-xl p-3">
                <p className="text-xs text-amber-600 font-semibold mb-1">Subject</p>
                <p className="text-sm font-bold text-gray-900">{selectedMessage.subject}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-600 font-semibold mb-1">Message</p>
                <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedMessage.message}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-600 font-semibold mb-1">Received</p>
                <p className="text-sm text-gray-900">{new Date(selectedMessage.createdAt).toLocaleString()}</p>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* View All Messages Modal */}
      {showAllMessages && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={()=>setShowAllMessages(false)}/>
          <motion.div initial={{opacity:0,scale:0.92,y:20}} animate={{opacity:1,scale:1,y:0}}
            exit={{opacity:0,scale:0.92}} transition={{type:'spring',stiffness:320,damping:28}}
            className="relative bg-white rounded-3xl w-full max-w-4xl max-h-[85vh] overflow-hidden shadow-2xl z-10">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-3xl z-10">
              <div>
                <h3 className="font-black text-lg text-gray-900">All Contact Messages</h3>
                <p className="text-xs text-gray-500 mt-0.5">{contactMessages.length} total messages</p>
              </div>
              <button onClick={()=>setShowAllMessages(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <XIcon className="w-5 h-5 text-gray-400"/>
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(85vh-80px)]">
              <div className="space-y-3">
                {contactMessages.map((msg:any)=>(
                  <div key={msg._id} className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-4 border border-purple-100">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-bold text-gray-900">{msg.firstName} {msg.lastName}</p>
                          {msg.status === 'unread' && (
                            <span className="px-2 py-0.5 bg-purple-600 text-white text-[9px] font-bold rounded-full">NEW</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-600"><strong>Subject:</strong> {msg.subject}</p>
                      </div>
                      <span className="text-[10px] text-gray-400">{new Date(msg.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="flex items-center gap-1.5 text-xs text-gray-600">
                        <MailIcon className="w-3.5 h-3.5 text-blue-500"/>
                        <span className="truncate">{msg.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-600">
                        <PhoneIcon className="w-3.5 h-3.5 text-green-500"/>
                        <span>{msg.phone}</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-700 bg-white rounded-lg p-2 mb-3 line-clamp-2">{msg.message}</p>
                    <button
                      onClick={() => {setShowAllMessages(false); setSelectedMessage(msg);}}
                      className="px-3 py-1.5 bg-purple-600 text-white text-xs font-bold rounded-lg hover:bg-purple-700 transition-all"
                    >
                      View Details
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </main>
  )
}
