import React, { useMemo, useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence, useScroll, useTransform, useInView } from 'framer-motion'
import { toast } from 'sonner'
import {
  MapPin, Star, CheckCircle2, XCircle, ShieldCheck, ArrowRight,
  Quote, Home, Heart, Shield, BadgeCheck, Calendar, X, ChevronDown,
  TrendingUp, Users, Award, Sparkles, ArrowUpRight, Check,
} from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'

// ─── MOCK DATA ────────────────────────────────────────────────────────────────

const stats = [
  { icon: Home,       value: '1,200+', label: 'Successful Rentals',   sub: 'Since 2021'         },
  { icon: Heart,      value: '95%',    label: 'Happy Tenants',        sub: 'Verified feedback'  },
  { icon: Shield,     value: '100%',   label: 'No Broker Guarantee',  sub: 'Zero commission'    },
  { icon: TrendingUp, value: '48hrs',  label: 'Avg. Time to Match',   sub: 'Industry-leading'   },
]

const featuredStory = {
  name: 'Aarav & Sneha',
  role: 'Tenants',
  location: 'Sanepa, Lalitpur',
  image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&auto=format&fit=crop',
  avatar: 'https://i.pravatar.cc/150?u=aarav',
  quote: 'We found our dream apartment without paying a single rupee in broker fees.',
  before: 'Spent 3 weeks dealing with unresponsive brokers and hidden commission fees.',
  after: 'Moved into a verified, beautiful 2BHK in Sanepa within 48 hours of matching.',
  stat: '₹0 broker fees',
}

const stories = [
  {
    id: 's1',
    name: 'Priya Sharma',
    role: 'Tenant',
    location: 'Kathmandu',
    propertyType: 'Room',
    budget: 'Under 10K',
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&auto=format&fit=crop',
    avatar: 'https://i.pravatar.cc/150?u=priya',
    before: 'Struggled to find a safe room, faced creepy brokers.',
    after: 'Found a verified room with a lovely family in 2 days.',
    preview: "I was new to the valley and terrified of living alone. Flat-Mate's verification gave me the confidence I needed.",
    fullStory: "Moving to Kathmandu for my bachelor's was daunting. Every broker I met showed me dark, unventilated rooms and demanded a month's rent as commission. I almost gave up until a senior recommended Flat-Mate. I used the \"Female Only\" and \"Verified Owner\" filters. Within 48 hours, I connected with a wonderful family in Baneshwor. No brokers, no hidden fees, just a safe, beautiful room.",
    outcomeBadges: ['Fast Booking', 'No Broker', 'Verified Owner'],
    accentColor: '#4F7FFF',
    timeline: [
      { label: 'Joined',    date: '10 Oct', desc: 'Created profile and verified student ID.' },
      { label: 'Searched',  date: '11 Oct', desc: 'Used female-only and budget filters.' },
      { label: 'Booked',    date: '12 Oct', desc: 'Connected with owner and paid token.' },
      { label: 'Moved In',  date: '15 Oct', desc: 'Safely moved into the new room.' },
    ],
    journeyProof: { bookingId: 'BKG-88291A', status: 'Payment Verified' },
  },
  {
    id: 's3',
    name: 'Rajesh Shrestha',
    role: 'Owner',
    location: 'Pokhara',
    propertyType: 'Apartment',
    budget: '20K–50K',
    rating: 5.0,
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&auto=format&fit=crop',
    avatar: 'https://i.pravatar.cc/150?u=rajesh',
    before: 'Apartment sat empty for 3 months, dealt with unreliable tenants.',
    after: 'Rented to a verified expat family within a week.',
    preview: 'As an owner living abroad, I needed tenants I could trust. The verification process here is unmatched.',
    fullStory: "I built a beautiful apartment in Lakeside, Pokhara, but since I work in Australia, managing it was a nightmare. Brokers brought people who wouldn't pay on time. I listed it on Flat-Mate as a Premium Property. The platform verified the income and identity of the applicants. I rented it to a lovely expat family. The rent comes directly to my account on the 1st of every month.",
    outcomeBadges: ['Verified Tenant', 'Automated Rent'],
    accentColor: '#10B981',
    timeline: [
      { label: 'Listed',    date: '15 Jan', desc: 'Uploaded premium property photos.' },
      { label: 'Verified',  date: '16 Jan', desc: 'Property ownership verified by team.' },
      { label: 'Booked',    date: '22 Jan', desc: 'Expat family paid 3 months advance.' },
      { label: 'Moved In',  date: '01 Feb', desc: 'Automated rent collection started.' },
    ],
    journeyProof: { bookingId: 'BKG-77321C', status: 'Rent Automated' },
  },
  {
    id: 's4',
    name: 'Sita & Maya',
    role: 'Tenant',
    location: 'Lalitpur',
    propertyType: 'Room',
    budget: '10K–20K',
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&auto=format&fit=crop',
    avatar: 'https://i.pravatar.cc/150?u=sita',
    before: 'Commuting 2 hours daily because nearby places were too expensive.',
    after: 'Found a budget-friendly shared room 10 mins from campus.',
    preview: 'We used the map feature to find a place exactly between our college and part-time jobs.',
    fullStory: "The daily commute from Kathmandu to our college in Lalitpur was draining our energy and money. We used Flat-Mate's search and budget filters. We found an older but well-maintained room just 10 minutes walking distance from campus. The owner was verified and very sweet. We save so much time and money now!",
    outcomeBadges: ['Student Friendly', 'Great Location'],
    accentColor: '#F59E0B',
    timeline: [
      { label: 'Joined',    date: '05 Feb', desc: 'Signed up as a roommate pair.' },
      { label: 'Searched',  date: '08 Feb', desc: 'Used radius search near campus.' },
      { label: 'Booked',    date: '10 Feb', desc: 'Met the owner and finalized.' },
      { label: 'Moved In',  date: '12 Feb', desc: 'Started walking to college!' },
    ],
    journeyProof: { bookingId: 'BKG-44129D', status: 'Payment Verified' },
  },
  {
    id: 's5',
    name: 'Bikash Tamang',
    role: 'Owner',
    location: 'Kathmandu',
    propertyType: 'House',
    budget: '50K+',
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=600&auto=format&fit=crop',
    avatar: 'https://i.pravatar.cc/150?u=bikash',
    before: 'Tired of paying 1 month rent as broker commission every year.',
    after: 'Found long-term corporate tenants directly.',
    preview: 'The corporate tenant verification feature saved me from endless background checks.',
    fullStory: 'Renting out a full house in Baluwatar is tricky. Brokers always brought short-term tenants and charged hefty commissions. I listed on Flat-Mate and used the "Corporate Only" tag. Within a week, an INGO contacted me for their expatriate staff. The platform handled the background checks and digital agreement. Seamless experience.',
    outcomeBadges: ['Corporate Tenant', 'Zero Commission'],
    accentColor: '#8B5CF6',
    timeline: [
      { label: 'Listed',    date: '01 Mar', desc: 'Added corporate-only preference.' },
      { label: 'Contacted', date: '05 Mar', desc: 'INGO reached out via platform.' },
      { label: 'Booked',    date: '08 Mar', desc: 'Signed 2-year lease agreement.' },
      { label: 'Moved In',  date: '15 Mar', desc: 'Tenants settled in smoothly.' },
    ],
    journeyProof: { bookingId: 'BKG-11829E', status: 'Lease Active' },
  },
  {
    id: 's6',
    name: 'Nima Sherpa',
    role: 'Tenant',
    location: 'Kathmandu',
    propertyType: 'Flat',
    budget: '20K–50K',
    rating: 5.0,
    image: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600&auto=format&fit=crop',
    avatar: 'https://i.pravatar.cc/150?u=nima',
    before: 'Lost advance payment to a scammer on a Facebook group.',
    after: 'Safely booked a verified flat with escrow payment.',
    preview: "After being scammed online, Flat-Mate's secure payment system was exactly what I needed.",
    fullStory: "I was desperate to find a flat in Thamel and blindly trusted a Facebook listing. I transferred 10K as an advance, and the person blocked me. I was devastated. A friend told me about Flat-Mate's verified listings and secure escrow payments. I found a beautiful flat, paid through the platform, and the owner only got the money after I moved in and confirmed everything was okay.",
    outcomeBadges: ['Secure Payment', 'Verified Listing'],
    accentColor: '#EF4444',
    timeline: [
      { label: 'Joined',    date: '12 Apr', desc: 'Completed identity verification.' },
      { label: 'Searched',  date: '14 Apr', desc: 'Browsed only verified listings.' },
      { label: 'Booked',    date: '16 Apr', desc: 'Paid securely via platform escrow.' },
      { label: 'Moved In',  date: '20 Apr', desc: 'Confirmed move-in, funds released.' },
    ],
    journeyProof: { bookingId: 'BKG-55912F', status: 'Escrow Released' },
  },
]

// ─── ANIMATION VARIANTS ───────────────────────────────────────────────────────

const spring = { type: 'spring', stiffness: 120, damping: 20 }
const ease   = { duration: 0.5, ease: [0.22, 1, 0.36, 1] }

const fadeUp = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: ease },
}

const stagger = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
}

const cardVariant = {
  hidden:  { opacity: 0, y: 32, scale: 0.97 },
  visible: { opacity: 1, y: 0,  scale: 1, transition: { ...ease } },
}

// ─── HELPER COMPONENTS ───────────────────────────────────────────────────────

function RatingStars({ value }: { value: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star
          key={s}
          className={`w-3 h-3 ${s <= Math.round(value) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'}`}
        />
      ))}
      <span className="ml-1 text-xs font-semibold text-gray-700">{value}</span>
    </span>
  )
}

function RolePill({ role }: { role: string }) {
  const isTenant = role === 'Tenant'
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase
      ${isTenant
        ? 'bg-button-primary/10 text-button-primary'
        : 'bg-emerald-50 text-emerald-700'}`}>
      {role}
    </span>
  )
}

function AnimatedCounter({ value, duration = 2000 }: { value: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })
  const [display, setDisplay] = useState('0')

  useEffect(() => {
    if (!inView) return
    const num = parseFloat(value.replace(/[^0-9.]/g, ''))
    if (isNaN(num)) { setDisplay(value); return }
    const suffix = value.replace(/[0-9.]/g, '')
    const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      const cur = Math.round(eased * num * 10) / 10
      setDisplay(`${Number.isInteger(cur) ? cur : cur.toFixed(0)}${suffix}`)
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [inView, value, duration])

  return <span ref={ref}>{display}</span>
}

// ─── MODAL ────────────────────────────────────────────────────────────────────

function StoryModal({ story, onClose }: { story: typeof stories[0] | undefined; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <AnimatePresence>
      {story && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={spring}
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Header image strip */}
            <div className="relative h-52 overflow-hidden rounded-t-3xl">
              <img
                src={story.image}
                alt={story.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/50 transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-5 left-6 flex items-center gap-3">
                <img
                  src={story.avatar}
                  alt={story.name}
                  className="w-12 h-12 rounded-full border-2 border-white shadow-md"
                />
                <div>
                  <p className="text-white font-bold text-lg leading-tight">{story.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <RolePill role={story.role} />
                    <span className="text-white/70 text-xs flex items-center gap-1">
                      <MapPin className="w-3 h-3" />{story.location}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8">
              {/* Before / After */}
              <div className="grid grid-cols-2 gap-3 mb-8">
                <div className="p-4 rounded-2xl bg-red-50 border border-red-100">
                  <p className="text-xs font-bold text-red-500 uppercase tracking-wider mb-2">Before</p>
                  <div className="flex gap-2">
                    <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{story.before}</p>
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                  <p className="text-xs font-bold text-emerald-500 uppercase tracking-wider mb-2">After</p>
                  <div className="flex gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <p className="text-sm text-emerald-700">{story.after}</p>
                  </div>
                </div>
              </div>

              {/* Full story */}
              <div className="mb-8">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">The Full Story</h3>
                <p className="text-gray-700 leading-relaxed text-[15px]">{story.fullStory}</p>
              </div>

              {/* Timeline */}
              <div className="mb-8">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-5">Journey Timeline</h3>
                <div className="relative">
                  {/* Connecting line */}
                  <div className="absolute left-[19px] top-5 bottom-5 w-px bg-gray-100" />
                  <div className="space-y-5">
                    {story.timeline.map((step, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 + i * 0.12, ...spring }}
                        className="relative flex items-start gap-4"
                      >
                        <div className="relative z-10 w-10 h-10 rounded-full bg-white border-2 flex items-center justify-center text-xs font-bold shrink-0"
                          style={{ borderColor: story.accentColor, color: story.accentColor }}>
                          {i + 1}
                        </div>
                        <div className="pt-1.5 pb-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-bold text-gray-900 text-sm">{step.label}</span>
                            <span className="text-[11px] text-gray-400 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />{step.date}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500">{step.desc}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer badges + proof */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-6 border-t border-gray-100">
                <div className="flex flex-wrap gap-2">
                  {story.outcomeBadges.map((b, i) => (
                    <span key={i} className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full bg-background-accent/50 text-primary">
                      <BadgeCheck className="w-3.5 h-3.5 text-button-primary" />{b}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full border border-button-primary/20 bg-button-primary/5 text-button-primary">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {story.journeyProof.status} · {story.journeyProof.bookingId}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ─── STORY CARD ───────────────────────────────────────────────────────────────

function StoryCard({ story, onClick }: { story: typeof stories[0]; onClick: () => void }) {
  const [hovered, setHovered] = useState(false)

  return (
    <motion.div
      variants={cardVariant}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onClick={onClick}
      className="group cursor-pointer h-full"
    >
      <div className="h-full bg-white rounded-[22px] border border-gray-100 overflow-hidden flex flex-col transition-all duration-500 hover:shadow-2xl hover:shadow-gray-200/80 hover:-translate-y-1">
        {/* Image */}
        <div className="relative h-52 overflow-hidden shrink-0">
          <motion.img
            src={story.image}
            alt={story.name}
            className="w-full h-full object-cover"
            animate={{ scale: hovered ? 1.05 : 1 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />

          {/* Top badges */}
          <div className="absolute top-4 left-4 right-4 flex items-start justify-between">
            <RolePill role={story.role} />
            <div className="bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1 shadow-sm">
              <RatingStars value={story.rating} />
            </div>
          </div>

          {/* Bottom author */}
          <div className="absolute bottom-4 left-4 flex items-center gap-3">
            <img
              src={story.avatar}
              alt={story.name}
              className="w-10 h-10 rounded-full border-2 border-white shadow-md"
            />
            <div>
              <p className="text-white font-bold text-sm leading-tight">{story.name}</p>
              <p className="text-white/70 text-xs flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3" />{story.location}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 flex-1 flex flex-col">
          <p className="text-[14px] text-gray-600 leading-relaxed mb-4 flex-1">
            "{story.preview}"
          </p>

          <div className="space-y-2 mb-4 p-3 rounded-xl bg-gray-50 border border-gray-100">
            <div className="flex gap-2 text-xs text-red-500">
              <XCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span className="line-clamp-1">{story.before}</span>
            </div>
            <div className="flex gap-2 text-xs text-emerald-600 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span className="line-clamp-1">{story.after}</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div className="flex flex-wrap gap-1.5">
              {story.outcomeBadges.slice(0, 2).map((b, i) => (
                <span
                  key={i}
                  className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-background-accent/60 text-gray-600"
                >
                  {b}
                </span>
              ))}
            </div>
            <motion.span
              animate={{ x: hovered ? 4 : 0 }}
              transition={spring}
              className="flex items-center gap-1 text-xs font-bold text-button-primary"
            >
              Read story <ArrowRight className="w-3.5 h-3.5" />
            </motion.span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export function SuccessStoriesPage() {
  const [selectedId, setSelectedId]       = useState<string | null>(null)
  const [filterRole, setFilterRole]       = useState<'All' | 'Tenant' | 'Owner'>('All')
  const [formName, setFormName]           = useState('')
  const [formAnon, setFormAnon]           = useState(false)
  const [formRole, setFormRole]           = useState('Tenant')
  const [formLocation, setFormLocation]   = useState('')
  const [formRating, setFormRating]       = useState(5)
  const [hoverRating, setHoverRating]     = useState(0)
  const [formStory, setFormStory]         = useState('')
  const [formSubmitted, setFormSubmitted] = useState(false)

  const selectedStory = useMemo(() => stories.find(s => s.id === selectedId), [selectedId])

  const filtered = useMemo(() =>
    filterRole === 'All' ? stories : stories.filter(s => s.role === filterRole),
    [filterRole],
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formStory.trim() || !formLocation.trim()) {
      toast.error('Please fill in location and your story.')
      return
    }
    setFormSubmitted(true)
    toast.success('Your story has been submitted for review!')
  }

  const handleReset = () => {
    setFormSubmitted(false)
    setFormName(''); setFormLocation(''); setFormStory('')
    setFormRating(5); setFormAnon(false)
  }

  // Prevent body scroll when modal open
  useEffect(() => {
    document.body.style.overflow = selectedId ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [selectedId])

  return (
    <main className="min-h-screen bg-[#F8F8F6] font-sans">

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative pt-28 pb-20 overflow-hidden">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <motion.div
            animate={{ y: [0, -18, 0], opacity: [0.4, 0.6, 0.4] }}
            transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -top-32 -left-32 w-[560px] h-[560px] bg-button-primary/8 rounded-full blur-3xl"
          />
          <motion.div
            animate={{ y: [0, 18, 0], opacity: [0.25, 0.4, 0.25] }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
            className="absolute -bottom-24 -right-24 w-[480px] h-[480px] bg-emerald-400/10 rounded-full blur-3xl"
          />
        </div>

        <div className="relative max-w-6xl mx-auto px-6 z-10">
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="text-center"
          >
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full bg-white border border-gray-200 shadow-sm text-sm font-semibold text-button-primary">
              <Sparkles className="w-4 h-4" />
              Over 1,000+ happy matches across Nepal
            </motion.div>

            <motion.h1 variants={fadeUp} className="text-5xl md:text-6xl lg:text-[72px] font-black text-primary tracking-tight leading-[1.05] mb-5">
              Real People.<br />
              <span className="text-button-primary relative">
                Real Homes.
                <svg className="absolute -bottom-2 left-0 w-full" height="6" viewBox="0 0 400 6" preserveAspectRatio="none">
                  <path d="M0 5 Q100 1 200 4 Q300 7 400 3" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.4" />
                </svg>
              </span>
            </motion.h1>

            <motion.p variants={fadeUp} className="text-lg text-gray-500 max-w-xl mx-auto mb-14 leading-relaxed">
              Discover how people across Nepal are escaping the broker trap to find safe, verified, and beautiful places to live.
            </motion.p>

            {/* Stat cards */}
            <motion.div variants={stagger} className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
              {stats.map((s, i) => (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  className="bg-white rounded-2xl border border-gray-100 p-5 text-center hover:shadow-lg hover:shadow-gray-100 transition-all duration-300 group"
                >
                  <div className="w-10 h-10 bg-background-accent rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                    <s.icon className="w-5 h-5 text-button-primary" />
                  </div>
                  <p className="text-2xl font-black text-primary mb-0.5">
                    <AnimatedCounter value={s.value} />
                  </p>
                  <p className="text-xs font-bold text-gray-700">{s.label}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{s.sub}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── FEATURED STORY ────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 mb-20">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ ...ease, delay: 0.1 }}
        >
          <div className="relative bg-primary rounded-[28px] overflow-hidden group">
            {/* Background image */}
            <div className="absolute inset-0">
              <img
                src={featuredStory.image}
                alt="Featured"
                className="w-full h-full object-cover opacity-20 transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/90 to-primary/60" />
            </div>

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-5 gap-8 p-10 lg:p-14">
              {/* Left content */}
              <div className="lg:col-span-3">
                <div className="flex items-center gap-2 mb-6">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span className="text-white/60 text-sm font-semibold uppercase tracking-wider">Featured Story</span>
                </div>

                <blockquote className="text-3xl md:text-4xl font-black text-white leading-tight mb-8">
                  "{featuredStory.quote}"
                </blockquote>

                <div className="flex items-center gap-4 mt-8">
                  <img
                    src={featuredStory.avatar}
                    alt={featuredStory.name}
                    className="w-14 h-14 rounded-full border-2 border-white/30"
                  />
                  <div>
                    <p className="text-white font-bold text-lg">{featuredStory.name}</p>
                    <p className="text-white/50 text-sm flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" />{featuredStory.location}
                    </p>
                  </div>
                  <div className="ml-auto">
                    <span className="px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white text-sm font-bold backdrop-blur-sm">
                      {featuredStory.stat}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right before/after */}
              <div className="lg:col-span-2 flex flex-col justify-center gap-4">
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                      <XCircle className="w-4 h-4 text-red-400" />
                    </div>
                    <div>
                      <p className="text-white/40 text-[11px] font-bold uppercase tracking-wider mb-1">Before Flat-Mate</p>
                      <p className="text-white/80 text-sm">{featuredStory.before}</p>
                    </div>
                  </div>
                </div>
                <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-400/20 backdrop-blur-sm">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-400/20 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-emerald-300/70 text-[11px] font-bold uppercase tracking-wider mb-1">After Flat-Mate</p>
                      <p className="text-emerald-100 text-sm">{featuredStory.after}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── STORY GRID ────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 mb-24">
        {/* Section header + filters */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
          <div>
            <p className="text-xs font-bold text-button-primary uppercase tracking-widest mb-2">Community Stories</p>
            <h2 className="text-3xl font-black text-primary">More Journeys</h2>
          </div>
          <div className="flex items-center gap-2 p-1 bg-white rounded-xl border border-gray-200">
            {(['All', 'Tenant', 'Owner'] as const).map(r => (
              <button
                key={r}
                onClick={() => setFilterRole(r)}
                className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all duration-200
                  ${filterRole === r
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-800'}`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={filterRole}
            variants={stagger}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filtered.map(story => (
              <StoryCard
                key={story.id}
                story={story}
                onClick={() => setSelectedId(story.id)}
              />
            ))}
          </motion.div>
        </AnimatePresence>

        {filtered.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-semibold">No stories match this filter.</p>
          </div>
        )}
      </section>

      {/* ── SHARE YOUR STORY ──────────────────────────────────────────────── */}
      <section className="max-w-2xl mx-auto px-6 mb-28">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={ease}
        >
          <div className="bg-white rounded-[28px] border border-gray-100 shadow-xl shadow-gray-100/80 overflow-hidden">
            {/* Form header */}
            <div className="bg-gradient-to-br from-background-accent/40 to-white px-8 pt-10 pb-8 text-center border-b border-gray-100">
              <div className="w-14 h-14 bg-white border border-gray-100 shadow-md rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Heart className="w-7 h-7 text-button-primary fill-button-primary/20" />
              </div>
              <h2 className="text-2xl font-black text-primary mb-2">Share Your Story</h2>
              <p className="text-gray-500 text-sm">Help others find their perfect home. Your story matters.</p>
            </div>

            <div className="p-8">
              <AnimatePresence mode="wait">
                {formSubmitted ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={spring}
                    className="text-center py-12"
                  >
                    <div className="w-16 h-16 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Check className="w-8 h-8 text-emerald-500" />
                    </div>
                    <h3 className="text-xl font-black text-primary mb-2">Story submitted!</h3>
                    <p className="text-gray-500 text-sm mb-6">Our team will review and publish it shortly.</p>
                    <button
                      onClick={handleReset}
                      className="text-button-primary text-sm font-bold hover:underline"
                    >
                      Submit another story
                    </button>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onSubmit={handleSubmit}
                    className="space-y-5"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      {/* Name */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Your Name</label>
                        <input
                          type="text"
                          value={formName}
                          onChange={e => setFormName(e.target.value)}
                          disabled={formAnon}
                          required={!formAnon}
                          placeholder="Ram Bahadur"
                          className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-button-primary/20 focus:border-button-primary outline-none transition-all disabled:opacity-40"
                        />
                        <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer mt-1 select-none">
                          <input
                            type="checkbox"
                            checked={formAnon}
                            onChange={e => setFormAnon(e.target.checked)}
                            className="rounded accent-button-primary"
                          />
                          Stay anonymous
                        </label>
                      </div>
                      {/* Location */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Location *</label>
                        <input
                          type="text"
                          value={formLocation}
                          onChange={e => setFormLocation(e.target.value)}
                          required
                          placeholder="Baneshwor, Kathmandu"
                          className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-button-primary/20 focus:border-button-primary outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Role */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">I am a…</label>
                        <div className="relative">
                          <select
                            value={formRole}
                            onChange={e => setFormRole(e.target.value)}
                            className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-button-primary/20 focus:border-button-primary outline-none transition-all appearance-none"
                          >
                            <option value="Tenant">Tenant</option>
                            <option value="Owner">Owner</option>
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                      </div>
                      {/* Rating */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Rating</label>
                        <div className="flex items-center gap-1 h-[42px]">
                          {[1, 2, 3, 4, 5].map(s => (
                            <button
                              key={s}
                              type="button"
                              onMouseEnter={() => setHoverRating(s)}
                              onMouseLeave={() => setHoverRating(0)}
                              onClick={() => setFormRating(s)}
                              className="focus:outline-none transition-transform hover:scale-110 active:scale-95"
                              aria-label={`Rate ${s} stars`}
                            >
                              <Star
                                className={`w-7 h-7 transition-colors ${
                                  s <= (hoverRating || formRating)
                                    ? 'text-yellow-400 fill-yellow-400'
                                    : 'text-gray-200 fill-gray-200'
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Story */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Your Story *</label>
                      <textarea
                        value={formStory}
                        onChange={e => setFormStory(e.target.value)}
                        required
                        placeholder="Tell us about your experience before and after using Flat-Mate…"
                        className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-button-primary/20 focus:border-button-primary outline-none transition-all min-h-[120px] resize-y"
                      />
                      <p className="text-right text-[11px] text-gray-400">{formStory.length} chars</p>
                    </div>

                    <Button type="submit" size="lg" className="w-full !rounded-xl text-base font-bold shadow-md shadow-button-primary/20 hover:shadow-lg hover:shadow-button-primary/30 transition-all">
                      Submit My Story
                    </Button>

                    <p className="text-[11px] text-center text-gray-400 flex items-center justify-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      All stories are verified by our team before publishing.
                    </p>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── STORY MODAL ───────────────────────────────────────────────────── */}
      <StoryModal story={selectedStory} onClose={() => setSelectedId(null)} />
    </main>
  )
}
