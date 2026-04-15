// src/pages/FindRoommatePage.tsx
import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  SearchIcon, SparklesIcon, HeartIcon, ShieldIcon, TrophyIcon, UsersIcon,
  ArrowRightIcon, HomeIcon, XIcon, ChevronDownIcon, CheckIcon, UploadIcon,
  CameraIcon, ShieldCheckIcon, ChevronLeftIcon, SendIcon,
} from 'lucide-react'
import { RoommateCard } from '../components/RoommateCard'
import { Card } from '../components/ui/Card'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { allRoommates } from '../utils/roommateData'

// ─── Data ─────────────────────────────────────────────────────────────────────

const sidebarCards = [
  { id:'match',   title:'Match Suggestions', description:'Get AI-powered roommate recommendations based on your preferences', image:'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&fit=crop', icon:SparklesIcon,   link:'/match-suggestions', color:'from-purple-500 to-pink-500' },
  { id:'safety',  title:'Safety Tips',       description:'Learn essential safety guidelines for sharing accommodation',        image:'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400&fit=crop', icon:ShieldIcon,     link:'/roommate-safety',   color:'from-green-500 to-teal-500' },
  { id:'stories', title:'Success Stories',   description:'Read inspiring stories from people who found their perfect roommate',image:'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=400&fit=crop', icon:TrophyIcon,     link:'/success-stories',   color:'from-yellow-500 to-orange-500' },
]

const featuredRooms = [
  { id:1, image:'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&fit=crop', location:'Lazimpat',  price:'NPR 15,000' },
  { id:2, image:'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=600&fit=crop', location:'Baneshwor', price:'NPR 12,000' },
  { id:3, image:'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&fit=crop', location:'Lalitpur',  price:'NPR 18,000' },
  { id:4, image:'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600&fit=crop', location:'Thamel',    price:'NPR 20,000' },
]

const LIFESTYLE_TAGS = ['Non-Smoker','Vegetarian','Early Riser','Pet Friendly','Student','Professional','Quiet','Social','Night Owl','Fitness Lover']

const quizQuestions = [
  { id:1, question:"What's your typical sleep schedule?",   options:['Early bird (Asleep by 10pm)','Night owl (Up past midnight)','Somewhere in between','It varies a lot'] },
  { id:2, question:'How do you feel about guests?',         options:['I love hosting friends often','Occasional guests are fine','Prefer a quiet home with few visitors','No guests allowed'] },
  { id:3, question:"What's your cleanliness level?",        options:['Neat freak - everything spotless','Generally tidy but relaxed','A bit messy sometimes','Organized chaos'] },
  { id:4, question:'Do you smoke or drink?',                options:['Neither','Social drinker only','Smoker (outside only)','Both socially'] },
  { id:5, question:'How do you handle shared expenses?',    options:['Split everything evenly','Pay for what you use','Take turns buying supplies','Keep everything separate'] },
]

// ─── Gibberish detector ───────────────────────────────────────────────────────
function isGibberish(text: string): boolean {
  if (!text.trim() || text.trim().length < 4) return false
  const consonantRun = /[^aeiou\s]{5,}/i.test(text)
  const repeatChar   = /(.)\1{3,}/.test(text)
  const letters = text.replace(/[^a-z]/gi, '')
  const vowels  = text.replace(/[^aeiou]/gi, '')
  const lowVowel = letters.length > 8 && (vowels.length / letters.length) < 0.08
  return consonantRun || repeatChar || lowVowel
}

// ─── PropertiesPage-style CustomSelect ───────────────────────────────────────
function CustomSelect({ label, value, options, onChange }: {
  label: string; value: string
  options: { value: string; label: string }[]
  onChange: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const fn = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])
  const sel = options.find(o => o.value === value)
  return (
    <div className="relative flex-1 min-w-[130px]" ref={ref}>
      {label && <label className="block text-sm text-gray-500 font-normal mb-2">{label}</label>}
      <button type="button" onClick={() => setOpen(v => !v)}
        className={`w-full flex items-center gap-2.5 pl-4 pr-3.5 py-3.5 rounded-xl border-2 text-base font-medium text-left transition-all
          ${open ? 'border-button-primary bg-button-primary/10 ring-2 ring-button-primary/20' : 'border-button-primary/25 hover:border-button-primary/50 hover:bg-button-primary/10'}
          ${value ? 'text-gray-900' : 'text-gray-500'}`}
        style={{ backgroundColor: open ? 'rgba(45,106,79,0.08)' : 'rgba(45,106,79,0.04)' }}>
        <span className="flex-1 truncate">{sel?.label || label}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDownIcon className="w-4 h-4 text-button-primary flex-shrink-0" />
        </motion.span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity:0, y:-6, scale:0.97 }} animate={{ opacity:1, y:0, scale:1 }}
            exit={{ opacity:0, y:-6, scale:0.97 }} transition={{ duration:0.15, ease:[0.16,1,0.3,1] }}
            className="absolute z-50 mt-1.5 w-full bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden py-1.5">
            {options.map(opt => (
              <button key={opt.value} type="button" onClick={() => { onChange(opt.value); setOpen(false) }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm font-medium transition-colors
                  ${value === opt.value ? 'bg-button-primary text-white' : 'text-gray-700 hover:bg-button-primary/10 hover:text-button-primary'}`}>
                {value === opt.value ? <CheckIcon className="w-4 h-4 flex-shrink-0 text-white" /> : <span className="w-4 h-4 flex-shrink-0" />}
                {opt.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Inline CustomSelect for modals (same style, smaller padding) ─────────────
function ModalSelect({ label, value, options, onChange, error }: {
  label: string; value: string; options: { value:string; label:string }[]
  onChange: (v:string) => void; error?: boolean
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const fn = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])
  const sel = options.find(o => o.value === value)
  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen(v => !v)}
        className={`w-full flex items-center gap-2.5 pl-4 pr-3.5 py-3 rounded-xl border-2 text-sm font-medium text-left transition-all
          ${error ? 'border-red-400' : open ? 'border-button-primary bg-button-primary/10 ring-2 ring-button-primary/20' : 'border-button-primary/25 hover:border-button-primary/50 hover:bg-button-primary/10'}
          ${value ? 'text-gray-900' : 'text-gray-400'}`}
        style={{ backgroundColor: error ? 'rgba(239,68,68,0.05)' : open ? 'rgba(45,106,79,0.08)' : 'rgba(45,106,79,0.04)' }}>
        <span className="flex-1 truncate">{sel?.label || `Select ${label}`}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration:0.2 }}>
          <ChevronDownIcon className="w-4 h-4 text-button-primary flex-shrink-0" />
        </motion.span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity:0, y:-6, scale:0.97 }} animate={{ opacity:1, y:0, scale:1 }}
            exit={{ opacity:0, y:-6, scale:0.97 }} transition={{ duration:0.15 }}
            className="absolute z-[200] mt-1 w-full bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden py-1.5">
            {options.map(opt => (
              <button key={opt.value} type="button" onClick={() => { onChange(opt.value); setOpen(false) }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm font-medium transition-colors
                  ${value === opt.value ? 'bg-button-primary text-white' : 'text-gray-700 hover:bg-button-primary/10 hover:text-button-primary'}`}>
                {value === opt.value ? <CheckIcon className="w-4 h-4 flex-shrink-0 text-white" /> : <span className="w-4 h-4 flex-shrink-0" />}
                {opt.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function FindRoommatePage() {
  const navigate = useNavigate()

  // ── Search state ────────────────────────────────────────────────────────────
  const [searchInput, setSearchInput]     = useState('')
  const [searchTerm, setSearchTerm]       = useState('')
  const [locationFilter, setLocationFilter] = useState('')
  const [genderFilter, setGenderFilter]   = useState('')

  // ── Modal open state ────────────────────────────────────────────────────────
  const [showQuizModal, setShowQuizModal] = useState(false)

  // ══════════════════════════════════════════════════════
  // COMPATIBILITY QUIZ STATE (all inline)
  // ══════════════════════════════════════════════════════
  const [quizQ, setQuizQ]           = useState(0)
  const [quizAnswers, setQuizAnswers] = useState<Record<number,string>>({})
  const [quizDone, setQuizDone]     = useState(false)
  const [quizFiltersActive, setQuizFiltersActive] = useState(false)

  const resetQuiz = () => { setQuizQ(0); setQuizAnswers({}); setQuizDone(false) }
  const openQuiz  = () => { resetQuiz(); setShowQuizModal(true) }
  const closeQuiz = () => { setShowQuizModal(false) }

  const handleQuizAnswer = (ans: string) => {
    setQuizAnswers(p => ({ ...p, [quizQ]: ans }))
    if (quizQ < quizQuestions.length - 1) setTimeout(() => setQuizQ(q => q + 1), 280)
    else setTimeout(() => setQuizDone(true), 280)
  }

  // Apply quiz filters to profiles
  const applyQuizFilters = () => {
    setQuizFiltersActive(true)
    closeQuiz()
    toast.success('Showing compatible roommates based on your quiz answers!', {
      style: {
        background: '#10b981',
        color: 'white',
      },
    })
    // Scroll to profiles section
    setTimeout(() => {
      const profilesSection = document.getElementById('profiles-section')
      if (profilesSection) {
        profilesSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 100)
  }

  // ── Search ──────────────────────────────────────────────────────────────────
  const handleSearch = () => setSearchTerm(searchInput)

  const filteredRoommates = allRoommates.filter(r => {
    const matchSearch = !searchTerm ||
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.bio.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchLocation = !locationFilter || r.location.toLowerCase().includes(locationFilter.toLowerCase())
    const matchGender   = !genderFilter   || r.gender?.toLowerCase() === genderFilter
    
    // Apply quiz filters if active
    if (quizFiltersActive && Object.keys(quizAnswers).length > 0) {
      let matchScore = 0
      let totalChecks = 0

      // Question 0: Sleep schedule (STRICT MATCHING)
      if (quizAnswers[0]) {
        totalChecks++
        const userAnswer = quizAnswers[0]
        const profileTags = r.tags || []
        
        if (userAnswer.includes('Early bird') && profileTags.includes('Early Riser')) {
          matchScore++
        } else if (userAnswer.includes('Night owl') && profileTags.includes('Night Owl')) {
          matchScore++
        } else if (userAnswer.includes('in between')) {
          // Flexible - matches both or neither
          matchScore++
        } else if (userAnswer.includes('varies')) {
          // Very flexible - matches anyone
          matchScore++
        }
      }

      // Question 1: Guests (STRICT MATCHING)
      if (quizAnswers[1]) {
        totalChecks++
        const userAnswer = quizAnswers[1]
        const profileTags = r.tags || []
        const bio = r.bio.toLowerCase()
        
        if (userAnswer.includes('love hosting') && profileTags.includes('Social')) {
          matchScore++
        } else if (userAnswer.includes('Prefer a quiet') && profileTags.includes('Quiet')) {
          matchScore++
        } else if (userAnswer.includes('Occasional')) {
          // Moderate - matches Social or Quiet
          if (profileTags.includes('Social') || profileTags.includes('Quiet')) {
            matchScore++
          }
        } else if (userAnswer.includes('No guests')) {
          // Very strict - only matches Quiet
          if (profileTags.includes('Quiet')) {
            matchScore++
          }
        }
      }

      // Question 2: Cleanliness (STRICT MATCHING)
      if (quizAnswers[2]) {
        totalChecks++
        const userAnswer = quizAnswers[2]
        const profileTags = r.tags || []
        const bio = r.bio.toLowerCase()
        
        if (userAnswer.includes('Neat freak') && profileTags.includes('Clean')) {
          matchScore++
        } else if (userAnswer.includes('Generally tidy') && (profileTags.includes('Clean') || bio.includes('clean'))) {
          matchScore++
        } else if (userAnswer.includes('bit messy')) {
          // Relaxed about cleanliness - matches most
          matchScore++
        } else if (userAnswer.includes('Organized chaos')) {
          // Very relaxed - matches anyone
          matchScore++
        }
      }

      // Question 3: Smoking/Drinking (STRICT MATCHING)
      if (quizAnswers[3]) {
        totalChecks++
        const userAnswer = quizAnswers[3]
        const profileTags = r.tags || []
        const bio = r.bio.toLowerCase()
        
        if (userAnswer.includes('Neither') && profileTags.includes('Non-Smoker')) {
          matchScore++
        } else if (userAnswer.includes('Social drinker') && !bio.includes('non-smoker')) {
          // Social drinker - matches anyone except strict non-smokers
          matchScore++
        } else if (userAnswer.includes('Smoker')) {
          // Smoker - only matches if profile doesn't explicitly say non-smoker
          if (!profileTags.includes('Non-Smoker') && !bio.includes('non-smoker')) {
            matchScore++
          }
        } else if (userAnswer.includes('Both socially')) {
          // Very social - matches anyone
          matchScore++
        }
      }

      // Question 4: Shared expenses (LESS STRICT - most people are reasonable)
      if (quizAnswers[4]) {
        totalChecks++
        // Most people are reasonable about expenses, so give benefit of doubt
        matchScore++
      }

      // Calculate compatibility percentage
      const compatibilityPercentage = totalChecks > 0 ? (matchScore / totalChecks) * 100 : 0
      
      // STRICT: Require at least 80% compatibility
      const matchQuiz = compatibilityPercentage >= 80
      
      return matchSearch && matchLocation && matchGender && matchQuiz
    }
    
    return matchSearch && matchLocation && matchGender
  })

  const handleMessageRoommate = (id: string, name: string) => {
    navigate(`/dashboard/tenant?tab=messages&userName=${encodeURIComponent(name)}&from=find-roommate`)
  }

  return (
    <main className="min-h-screen bg-background-light pb-12">

      {/* ── HERO ── */}
      <section className="relative bg-gradient-to-br from-button-primary via-primary to-button-primary text-white pt-36 pb-16 overflow-hidden">
        <motion.div animate={{ backgroundPosition:['0% 0%','100% 100%'] }} transition={{ duration:20, repeat:Infinity, repeatType:'reverse', ease:'linear' }}
          className="absolute inset-0 opacity-10"
          style={{ backgroundImage:'radial-gradient(circle at 20% 50%, white 2px, transparent 2px), radial-gradient(circle at 80% 80%, white 2px, transparent 2px)', backgroundSize:'60px 60px' }} />
        <motion.div animate={{ scale:[1,1.2,1], opacity:[0.3,0.5,0.3] }} transition={{ duration:4, repeat:Infinity }}
          className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <motion.div animate={{ scale:[1.2,1,1.2], opacity:[0.5,0.3,0.5] }} transition={{ duration:5, repeat:Infinity, delay:1 }}
          className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
          <motion.div initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.8 }} className="max-w-3xl">
            <motion.div initial={{ scale:0, rotate:-180 }} animate={{ scale:1, rotate:0 }}
              transition={{ delay:0.2, type:'spring', stiffness:200, damping:15 }}
              className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-3xl mb-6 shadow-lg">
              <UsersIcon className="w-10 h-10 text-white" />
            </motion.div>
            <motion.h1 initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3 }}
              className="text-4xl md:text-5xl font-bold mb-4">Find Your Perfect Roommate</motion.h1>
            <motion.p initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.4 }}
              className="text-white/90 text-lg mb-8">Connect with verified people looking for shared accommodation in Nepal. Safe, simple, and secure.</motion.p>
            <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.5 }} className="flex flex-wrap gap-4">
              <button onClick={openQuiz}
                className="px-6 py-3 bg-white text-primary font-bold rounded-full shadow-xl hover:bg-gray-100 transition-all">
                Take Compatibility Quiz
              </button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── SEARCH BAR ── */}
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}
          className="bg-white rounded-xl shadow-xl p-4 md:p-6 mb-8 -mt-8 relative z-10">
          <div className="flex flex-col md:flex-row gap-3 items-end">
            <div className="flex-1">
              <label className="block text-sm text-gray-500 font-normal mb-2">Search</label>
              <div className="relative">
                <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-button-primary pointer-events-none z-10" />
                <input type="text" value={searchInput} onChange={e => setSearchInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  placeholder="Search by name, bio, or interests..."
                  className="w-full pl-10 pr-4 py-3.5 rounded-xl border-2 border-button-primary/25 text-sm font-medium text-gray-900 placeholder-gray-400 focus:outline-none focus:border-button-primary focus:ring-2 focus:ring-button-primary/20 transition-all"
                  style={{ backgroundColor:'rgba(45,106,79,0.04)' }} />
              </div>
            </div>

            <CustomSelect label="Location" value={locationFilter} onChange={setLocationFilter}
              options={[{ value:'', label:'All Locations' },{ value:'kathmandu', label:'Kathmandu' },{ value:'lalitpur', label:'Lalitpur' },{ value:'bhaktapur', label:'Bhaktapur' },{ value:'pokhara', label:'Pokhara' }]} />

            <CustomSelect label="Gender" value={genderFilter} onChange={setGenderFilter}
              options={[{ value:'', label:'Any Gender' },{ value:'male', label:'Male' },{ value:'female', label:'Female' }]} />

            <div>
              <label className="block text-sm text-transparent font-normal mb-2 select-none">·</label>
              <motion.button whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }} onClick={handleSearch}
                className="flex items-center gap-2 px-6 py-3.5 bg-button-primary text-white font-bold rounded-xl hover:bg-button-primary/90 transition-all shadow-md whitespace-nowrap">
                <SearchIcon className="w-4 h-4" /> Search
              </motion.button>
            </div>

            {(searchTerm || locationFilter || genderFilter) && (
              <motion.button initial={{ opacity:0, scale:0.8 }} animate={{ opacity:1, scale:1 }}
                onClick={() => { setSearchInput(''); setSearchTerm(''); setLocationFilter(''); setGenderFilter('') }}
                className="flex items-center gap-1.5 px-4 py-3.5 text-sm text-red-500 font-semibold border border-red-200 rounded-xl hover:bg-red-50 transition-all whitespace-nowrap">
                <XIcon className="w-4 h-4" /> Clear
              </motion.button>
            )}
          </div>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1" id="profiles-section">
            {/* Featured Rooms */}
            <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} className="mb-10">
              <div className="flex items-center gap-2 mb-4">
                <HomeIcon className="w-5 h-5 text-button-primary" />
                <h2 className="text-xl font-bold text-primary">Featured Rooms</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {featuredRooms.map(room => (
                  <div key={room.id} className="relative rounded-xl overflow-hidden group cursor-pointer shadow-md h-40">
                    <img src={room.image} alt={room.location} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-3">
                      <p className="text-white font-bold text-sm">{room.location}</p>
                      <p className="text-white/90 text-xs">{room.price}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="mb-6 flex items-center justify-between flex-wrap gap-3">
              <p className="text-gray-600 text-sm">
                Showing <span className="font-bold text-primary">{filteredRoommates.length}</span> of{' '}
                <span className="font-bold text-primary">{allRoommates.length}</span> roommates
                {quizFiltersActive && <span className="ml-2 text-green-600 font-semibold">(Quiz Filtered)</span>}
              </p>
              {quizFiltersActive && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={() => {
                    setQuizFiltersActive(false)
                    toast.info('Quiz filters cleared')
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm text-red-500 font-semibold border border-red-200 rounded-xl hover:bg-red-50 transition-all">
                  <XIcon className="w-4 h-4" /> Clear Quiz Filters
                </motion.button>
              )}
            </motion.div>

            <AnimatePresence mode="popLayout">
              <motion.div layout className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {filteredRoommates.map((roommate, index) => (
                  <motion.div key={roommate.id} layout initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }}
                    exit={{ opacity:0, scale:0.9 }} transition={{ delay:index*0.05 }}>
                    <RoommateCard {...roommate} onMessage={() => handleMessageRoommate(roommate.id, roommate.name)} />
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>

            {filteredRoommates.length === 0 && (
              <div className="text-center py-12">
                <UsersIcon className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-primary mb-2">No roommates found</h3>
                <p className="text-gray-500 mb-6">Try adjusting your search filters</p>
                <button onClick={() => { setSearchInput(''); setSearchTerm(''); setLocationFilter(''); setGenderFilter('') }}
                  className="px-6 py-3 bg-button-primary text-white font-bold rounded-full">Clear Filters</button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:w-80 space-y-6">
            {sidebarCards.map((card, index) => {
              const Icon = card.icon
              return (
                <motion.div key={card.id} initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.3+index*0.1 }}>
                  <Link to={card.link}>
                    <motion.div whileHover={{ y:-5, boxShadow:'0 12px 24px rgba(0,0,0,0.15)' }} whileTap={{ scale:0.98 }}
                      className="relative h-48 overflow-hidden rounded-xl shadow-md cursor-pointer group">
                      <div className="absolute inset-0">
                        <img src={card.image} alt={card.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                        <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-80 group-hover:opacity-90 transition-opacity`} />
                      </div>
                      <div className="relative p-6 h-full flex flex-col text-white">
                        <div className="mb-auto">
                          <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                        </div>
                        <div>
                          <h3 className="font-bold text-xl mb-2">{card.title}</h3>
                          <p className="text-white/90 text-sm line-clamp-2">{card.description}</p>
                        </div>
                      </div>
                      <div className="absolute bottom-4 right-4 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all">
                        <ArrowRightIcon className="w-4 h-4 text-white" />
                      </div>
                    </motion.div>
                  </Link>
                </motion.div>
              )
            })}
            <Card className="p-6 bg-button-primary/5 border border-button-primary/15">
              <h3 className="font-bold text-primary mb-4">Platform Stats</h3>
              <div className="space-y-3">
                {[{ label:'Active Users', value:'2,500+' },{ label:'Successful Matches', value:'1,200+' },{ label:'Verified Profiles', value:'85%' }].map(s => (
                  <div key={s.label} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{s.label}</span>
                    <span className="font-bold text-button-primary">{s.value}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════
          COMPATIBILITY QUIZ MODAL — inline, no external file
      ════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showQuizModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={!quizDone ? closeQuiz : undefined} />

            <motion.div initial={{ opacity:0, scale:0.93, y:24 }} animate={{ opacity:1, scale:1, y:0 }}
              exit={{ opacity:0, scale:0.93 }} transition={{ type:'spring', stiffness:320, damping:28 }}
              className="relative bg-white rounded-3xl w-full max-w-xl shadow-2xl z-10 overflow-hidden">

              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-button-primary/10 rounded-lg flex items-center justify-center">
                    <SparklesIcon className="w-4 h-4 text-button-primary" />
                  </div>
                  <h2 className="font-black text-base text-primary">Compatibility Quiz</h2>
                </div>
                {!quizDone && (
                  <button onClick={closeQuiz} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <XIcon className="w-5 h-5 text-gray-400" />
                  </button>
                )}
              </div>

              <div className="p-6">
                {!quizDone ? (
                  <>
                    <div className="mb-5">
                      <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                        <span>Question {quizQ + 1} of {quizQuestions.length}</span>
                        <span>{Math.round((quizQ / quizQuestions.length) * 100)}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <motion.div className="bg-button-primary h-2 rounded-full"
                          animate={{ width:`${(quizQ / quizQuestions.length) * 100}%` }} />
                      </div>
                    </div>

                    <AnimatePresence mode="wait">
                      <motion.div key={quizQ} initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }}>
                        <h3 className="text-lg font-bold text-gray-900 mb-5">{quizQuestions[quizQ].question}</h3>
                        <div className="space-y-3">
                          {quizQuestions[quizQ].options.map((opt, i) => (
                            <motion.button key={i} type="button" whileHover={{ scale:1.01 }} whileTap={{ scale:0.98 }}
                              onClick={() => handleQuizAnswer(opt)}
                              className={`w-full p-4 text-left rounded-xl border-2 transition-all text-sm font-medium
                                ${quizAnswers[quizQ] === opt
                                  ? 'border-button-primary bg-button-primary/5 text-button-primary'
                                  : 'border-gray-200 text-gray-700 hover:border-button-primary/40 hover:bg-button-primary/5'}`}>
                              <div className="flex items-center justify-between">
                                <span>{opt}</span>
                                {quizAnswers[quizQ] === opt && <CheckIcon className="w-4 h-4 text-button-primary flex-shrink-0" />}
                              </div>
                            </motion.button>
                          ))}
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  </>
                ) : (
                  <motion.div initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }} className="text-center py-4">
                    <motion.div initial={{ scale:0 }} animate={{ scale:1 }} transition={{ delay:0.15, type:'spring', stiffness:240 }}
                      className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
                      <CheckIcon className="w-10 h-10 text-green-600" />
                    </motion.div>
                    <h3 className="text-2xl font-black text-gray-900 mb-2">Quiz Complete! 🎉</h3>
                    <p className="text-gray-500 mb-6">We've analyzed your preferences. Ready to see compatible roommates below!</p>
                    <div className="flex gap-3 justify-center">
                      <button onClick={() => { resetQuiz(); closeQuiz() }}
                        className="px-5 py-2.5 border-2 border-gray-200 text-gray-600 font-semibold rounded-xl text-sm hover:border-gray-300 transition-all">
                        Retake Quiz
                      </button>
                      <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
                        onClick={applyQuizFilters}
                        className="px-6 py-2.5 bg-button-primary text-white font-bold rounded-xl text-sm hover:bg-button-primary/90 transition-all flex items-center gap-2">
                        Show Compatible Matches →
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </main>
  )
}
