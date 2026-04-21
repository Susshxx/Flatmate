import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  GridIcon, ListIcon, FilterIcon, SparklesIcon, ArrowRightIcon,
  MapIcon, DoorOpenIcon, HomeIcon, Building2Icon, BuildingIcon,
  UsersIcon, InfoIcon, LightbulbIcon, SearchIcon, XIcon,
  ChevronDownIcon, MapPinIcon, BedDoubleIcon, SlidersHorizontalIcon, CheckIcon,
} from 'lucide-react'
import { PropertyCard } from '../components/PropertyCard'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'

// ─── Data ─────────────────────────────────────────────────────────────────────
const categories = [
  { id: 'all',    name: 'All',    icon: SparklesIcon,  count: '500+' },
  { id: 'rooms',  name: 'Rooms',  icon: DoorOpenIcon,  count: '200+' },
  { id: '1bhk',   name: '1BHK',   icon: HomeIcon,      count: '150+' },
  { id: '2bhk',   name: '2BHK',   icon: Building2Icon, count: '120+' },
  { id: '3bhk',   name: '3BHK+',  icon: BuildingIcon,  count: '80+'  },
  { id: 'studio', name: 'Studio', icon: HomeIcon,      count: '60+'  },
  { id: 'shared', name: 'Shared', icon: UsersIcon,     count: '90+'  },
]

const LOCATIONS_LIST = ['All Locations','Kathmandu','Lalitpur','Bhaktapur','Pokhara','Chitwan','Dharan']
const TYPES_LIST     = ['All Types','Apartment','Studio','House','Flat','Room']
const BEDROOMS_LIST  = ['Any Bedrooms','1 Bedroom','2 Bedrooms','3 Bedrooms','4+ Bedrooms']
const PRICE_LIST     = ['Any Price','Under रू 10,000','रू 10,000 – 25,000','रू 25,000 – 50,000','Above रू 50,000']
const SORT_OPTIONS   = [
  { value: 'latest',      label: 'Latest First' },
  { value: 'oldest',      label: 'Oldest First' },
  { value: 'price-high',  label: 'Price: High to Low' },
  { value: 'price-low',   label: 'Price: Low to High' },
  { value: 'most-viewed', label: 'Most Viewed' },
]

const IMGS = [
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&auto=format&fit=crop',
]
const TITLE_BY_TYPE: Record<string,string[]> = {
  'Apartment': ['Modern Apartment','Bright Apartment','Spacious Apartment','Premium Apartment'],
  'Studio':    ['Cozy Studio','Compact Studio','Modern Studio','Bright Studio'],
  'House':     ['Family House','Spacious House','Garden House','Quiet House'],
  'Flat':      ['2BHK Flat','3BHK Flat','Furnished Flat','Modern Flat'],
  'Room':      ['Budget Room','Furnished Room','Single Room','Double Room'],
}
const OWNERS = ['Ram Thapa','Sita Sharma','Hari Krishna','Gita Rai','Bikash Shrestha','Anita Gurung']
const LOCS   = ['Kathmandu','Lalitpur','Bhaktapur','Pokhara','Chitwan','Dharan']
const TYPES  = ['Apartment','Studio','House','Flat','Room']
const BEDS   = [1,2,3,4]
const RENTS  = [8000,10000,12000,15000,18000,20000,25000,28000,32000,35000,40000,45000,55000,65000]

// Build 120 properties — one for every (location × type × bed) combo
const allProperties = (() => {
  const combos = LOCS.flatMap(loc => TYPES.flatMap(type => BEDS.map(bed => ({ loc, type, bed }))))
  return combos.map(({ loc, type, bed }, idx) => {
    const titles = TITLE_BY_TYPE[type]
    return {
      id:        `prop-${idx + 1}`,
      image:     IMGS[idx % 6],
      title:     `${titles[idx % titles.length]} in ${loc}`,
      location:  loc,
      type,
      rent:      RENTS[idx % RENTS.length],
      bedrooms:  bed,
      bathrooms: (idx % 2) + 1,
      ownerName: OWNERS[idx % OWNERS.length],
      views:     80 + idx * 7,
      isPremium: idx % 8 === 0,
      createdAt: idx,
    }
  })
})()

// ─── Helpers ──────────────────────────────────────────────────────────────────
function matchPrice(rent: number, range: string) {
  if (!range || range === 'Any Price') return true
  if (range === 'Under रू 10,000')     return rent < 10000
  if (range === 'रू 10,000 – 25,000')  return rent >= 10000 && rent <= 25000
  if (range === 'रू 25,000 – 50,000')  return rent > 25000  && rent <= 50000
  if (range === 'Above रू 50,000')     return rent > 50000
  return true
}
function matchBeds(beds: number, filter: string) {
  if (!filter || filter === 'Any Bedrooms') return true
  if (filter.includes('4+')) return beds >= 4
  return beds === parseInt(filter, 10)
}
function applyCategory(type: string, beds: number, cat: string) {
  if (cat === 'all')    return true
  if (cat === 'rooms')  return type === 'Room'
  if (cat === '1bhk')   return beds === 1
  if (cat === '2bhk')   return beds === 2
  if (cat === '3bhk')   return beds >= 3
  if (cat === 'studio') return type === 'Studio'
  return true
}

// ─── Custom Dropdown (replaces native <select> for full styling control) ──────
function CustomSelect({
  label, value, options, icon, onChange,
}: {
  label: string; value: string; options: string[]
  icon?: React.ReactNode; onChange: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const isDefault = value === options[0]

  return (
    <div className="flex-1 min-w-[150px]" ref={ref}>
      {/* Label — same font as subtitle "Search from hundreds..." */}
      <label className="block text-sm text-gray-500 font-normal mb-2">
        {label}
      </label>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={`w-full flex items-center gap-2.5 pl-4 pr-3.5 py-3.5 rounded-xl border-2 text-base font-medium text-left transition-all
          ${open
            ? 'border-button-primary bg-button-primary/10 ring-2 ring-button-primary/20'
            : 'border-button-primary/25 bg-button-primary/6 hover:border-button-primary/50 hover:bg-button-primary/10'
          }
          ${isDefault ? 'text-gray-500' : 'text-gray-900'}`}
        style={{ backgroundColor: open ? 'rgba(45,106,79,0.08)' : 'rgba(45,106,79,0.04)' }}
      >
        {icon && <span className="text-button-primary flex-shrink-0">{icon}</span>}
        <span className="flex-1 truncate">{value}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDownIcon className="w-4 h-4 text-button-primary flex-shrink-0" />
        </motion.span>
      </button>

      {/* Dropdown panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="absolute z-50 mt-1.5 min-w-full w-max bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden py-1.5"
            style={{ minWidth: '100%' }}
          >
            {options.map(opt => {
              const selected = opt === value
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => { onChange(opt); setOpen(false) }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm font-medium transition-colors
                    ${selected
                      ? 'bg-button-primary text-white'
                      : 'text-gray-700 hover:bg-button-primary/10 hover:text-button-primary'
                    }`}
                >
                  {selected
                    ? <CheckIcon className="w-4 h-4 flex-shrink-0 text-white" />
                    : <span className="w-4 h-4 flex-shrink-0" />
                  }
                  {opt}
                </button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export function PropertiesPage() {
  const navigate       = useNavigate()
  const [searchParams] = useSearchParams()

  const [location,       setLocation]       = useState(searchParams.get('location') || 'All Locations')
  const [propType,       setPropType]       = useState(searchParams.get('type')     || 'All Types')
  const [bedrooms,       setBedrooms]       = useState(searchParams.get('bedrooms') || 'Any Bedrooms')
  const [priceRange,     setPriceRange]     = useState(searchParams.get('price')    || 'Any Price')
  const [sortBy,         setSortBy]         = useState('latest')
  const [viewMode,       setViewMode]       = useState<'grid'|'list'>('grid')
  const [activeCategory, setActiveCategory] = useState('all')
  const [displayCount,   setDisplayCount]   = useState(9)
  const [showAdvanced,   setShowAdvanced]   = useState(false)
  const [showSortMenu,   setShowSortMenu]   = useState(false)
  const [ownerProperties, setOwnerProperties] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loc = searchParams.get('location')
    const typ = searchParams.get('type')
    const bed = searchParams.get('bedrooms')
    const pr  = searchParams.get('price')
    if (loc) setLocation(loc)
    if (typ) setPropType(typ)
    if (bed) setBedrooms(bed)
    if (pr)  setPriceRange(pr)
  }, [searchParams.toString()])

  // Fetch approved properties from backend
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        // Fetch only approved properties from backend
        const response = await fetch('http://localhost:5000/api/properties?status=approved');
        if (response.ok) {
          const data = await response.json();
          setOwnerProperties(data.properties || []);
        } else {
          console.error('Failed to fetch properties from backend');
          setOwnerProperties([]);
        }
      } catch (error) {
        console.error('Error fetching properties:', error);
        setOwnerProperties([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
    // Check for updates every 5 seconds
    const interval = setInterval(fetchProperties, 5000);
    return () => clearInterval(interval);
  }, []);

  // Merge owner-submitted properties (deduplicated) at the front — only approved ones
  const mergedProperties = [
    ...ownerProperties.map((op: any) => ({
      id: op._id || op.id,
      image: op.image || op.images?.[0] || IMGS[0],
      title: op.title,
      location: op.location,
      type: op.type,
      rent: op.rent,
      bedrooms: op.beds || op.bedrooms || 1,
      bathrooms: op.baths || op.bathrooms || 1,
      ownerName: op.ownerName,
      views: op.views || 0,
      isPremium: op.isPremium || false,
      createdAt: -1, // Always sort to top (newest)
    })),
    ...allProperties,
  ]

  // ── Strict filter ─────────────────────────────────────────────────────────
  const strictFiltered = mergedProperties.filter(p => {
    if (location !== 'All Locations' && p.location !== location)         return false
    if (propType !== 'All Types'     && p.type !== propType)             return false
    if (!matchBeds(p.bedrooms || 1, bedrooms))                           return false
    if (!matchPrice(p.rent, priceRange))                                 return false
    if (!applyCategory(p.type, p.bedrooms || 1, activeCategory))         return false
    return true
  })

  // ── Smart fallback: if strict <4, progressively relax ────────────────────
  const MIN_RESULTS = 8
  let displayProps   = strictFiltered
  let fallbackLabel  = ''

  if (strictFiltered.length < MIN_RESULTS) {
    // Fallback 1: drop bedrooms
    const fb1 = mergedProperties.filter(p => {
      if (location !== 'All Locations' && p.location !== location) return false
      if (propType !== 'All Types'     && p.type !== propType)     return false
      if (!matchPrice(p.rent, priceRange))                         return false
      if (!applyCategory(p.type, p.bedrooms || 1, activeCategory)) return false
      return true
    })
    if (fb1.length >= MIN_RESULTS) {
      displayProps  = fb1
      fallbackLabel = bedrooms !== 'Any Bedrooms' ? `Showing similar properties — relaxed bedroom filter` : ''
    } else {
      // Fallback 2: drop type too
      const fb2 = mergedProperties.filter(p => {
        if (location !== 'All Locations' && p.location !== location) return false
        if (!matchPrice(p.rent, priceRange))                         return false
        if (!applyCategory(p.type, p.bedrooms || 1, activeCategory)) return false
        return true
      })
      if (fb2.length >= MIN_RESULTS) {
        displayProps  = fb2
        fallbackLabel = `Showing all properties in ${location !== 'All Locations' ? location : 'Nepal'}`
      } else {
        // Fallback 3: show all (price only)
        displayProps  = mergedProperties.filter(p => matchPrice(p.rent, priceRange))
        fallbackLabel = 'Showing all available properties'
      }
    }
  }

  // ── Sort ─────────────────────────────────────────────────────────────────
  const sorted = [...displayProps].sort((a, b) => {
    if (sortBy === 'price-high')   return b.rent - a.rent
    if (sortBy === 'price-low')    return a.rent - b.rent
    if (sortBy === 'most-viewed')  return b.views - a.views
    if (sortBy === 'oldest')       return a.createdAt - b.createdAt
    return a.createdAt - b.createdAt  // 'latest': backend props have createdAt=-1, always first
  })

  const hasFilters = location !== 'All Locations' || propType !== 'All Types' ||
    bedrooms !== 'Any Bedrooms' || priceRange !== 'Any Price'

  const clearAll = () => {
    setLocation('All Locations'); setPropType('All Types')
    setBedrooms('Any Bedrooms');  setPriceRange('Any Price')
    setActiveCategory('all');     setDisplayCount(9)
    navigate('/properties', { replace: true })
  }

  return (
    <main className="min-h-screen bg-background-light dark:bg-gray-900 pb-16 transition-colors duration-300">

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative bg-gradient-to-br from-white dark:from-gray-900 via-background-light dark:via-gray-800 to-white dark:to-gray-900 border-b border-gray-100 dark:border-gray-800 overflow-hidden pt-28 pb-16">
        <motion.div animate={{ scale:[1,1.2,1], rotate:[0,90,0] }} transition={{ duration:20, repeat:Infinity, ease:'linear' }} className="absolute top-0 right-0 w-96 h-96 bg-button-primary/5 rounded-full blur-3xl pointer-events-none" />
        <motion.div animate={{ scale:[1.2,1,1.2], rotate:[90,0,90] }} transition={{ duration:15, repeat:Infinity, ease:'linear' }} className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity:0, x:-30 }} animate={{ opacity:1, x:0 }} transition={{ duration:0.8 }}>
              <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }} className="inline-flex items-center gap-2 px-4 py-2 bg-button-primary/10 rounded-full mb-6">
                <SparklesIcon className="w-4 h-4 text-button-primary" />
                <span className="text-sm font-semibold text-button-primary">500+ Verified Properties</span>
              </motion.div>
              <motion.h1 initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3 }} className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                <span className="text-primary">Discover Your Next</span><br />
                <span className="bg-gradient-to-r from-button-primary to-primary bg-clip-text text-transparent">Dream Home</span>
              </motion.h1>
              <motion.p initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.4 }} className="text-lg text-gray-600 mb-8 leading-relaxed">
                Explore the widest range of verified properties in Nepal.
              </motion.p>
              <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.6 }} className="flex gap-8">
                {[{value:'500+',label:'Properties'},{value:'1000+',label:'Happy Tenants'},{value:'50+',label:'Locations'}].map((s,i) => (
                  <motion.div key={s.label} initial={{ opacity:0, scale:0.8 }} animate={{ opacity:1, scale:1 }} transition={{ delay:0.7+i*0.1 }}>
                    <p className="text-2xl font-bold text-primary">{s.value}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{s.label}</p>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
            <motion.div initial={{ opacity:0, x:30 }} animate={{ opacity:1, x:0 }} transition={{ duration:0.8, delay:0.2 }} className="relative hidden md:block">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                <motion.img initial={{ scale:1.2 }} animate={{ scale:1 }} transition={{ duration:1.2 }} src="https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&auto=format&fit=crop" alt="Modern Home" className="w-full h-[420px] object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>
              <motion.div initial={{ opacity:0, y:30, scale:0.8 }} animate={{ opacity:1, y:0, scale:1 }} transition={{ delay:0.8, type:'spring', stiffness:200 }} className="absolute -bottom-5 -left-5 bg-white p-4 rounded-2xl shadow-2xl border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 p-2.5 rounded-xl"><MapIcon className="w-5 h-5 text-green-600" /></div>
                  <div><p className="font-bold text-gray-900 dark:text-white">500+ Locations</p><p className="text-xs text-gray-500 dark:text-gray-400">Across Nepal</p></div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── SEARCH BAR ────────────────────────────────────────────────────── */}
      <section className="py-8 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3 }} className="text-center mb-6">
            <h2 className="text-2xl font-bold text-primary">Find Your Perfect Home</h2>
            {/* Subtitle — same font as label text below */}
            <p className="text-sm text-gray-500 font-normal mt-1">
              Search from hundreds of verified properties across Nepal
            </p>
          </motion.div>

          {/* Filter row — each item is relative-positioned for the dropdown */}
          <div className="flex flex-col md:flex-row gap-4 items-end mb-4">
            <div className="relative flex-1 min-w-[150px]">
              <CustomSelect label="Location"      value={location}  options={LOCATIONS_LIST} icon={<MapPinIcon className="w-4 h-4" />}   onChange={setLocation} />
            </div>
            <div className="relative flex-1 min-w-[150px]">
              <CustomSelect label="Property Type" value={propType}  options={TYPES_LIST}     icon={<HomeIcon className="w-4 h-4" />}      onChange={setPropType} />
            </div>
            <div className="relative flex-1 min-w-[150px]">
              <CustomSelect label="Bedrooms"      value={bedrooms}  options={BEDROOMS_LIST}  icon={<BedDoubleIcon className="w-4 h-4" />} onChange={setBedrooms} />
            </div>
            <motion.button
              whileHover={{ scale:1.03, boxShadow:'0 8px 24px rgba(45,106,79,0.3)' }}
              whileTap={{ scale:0.97 }}
              onClick={() => setDisplayCount(9)}
              className="flex items-center gap-2.5 px-8 py-3.5 bg-button-primary text-white font-semibold text-base rounded-xl hover:bg-button-primary/90 transition-all shadow-md whitespace-nowrap flex-shrink-0 min-h-[52px]"
            >
              <SearchIcon className="w-5 h-5" /> Search
            </motion.button>
          </div>

          <div className="flex items-center justify-between">
            <button onClick={() => setShowAdvanced(v => !v)} className="flex items-center gap-2 text-button-primary text-sm font-semibold hover:underline">
              <SlidersHorizontalIcon className="w-4 h-4" />
              {showAdvanced ? 'Hide Advanced Filters' : 'Show Advanced Filters'}
            </button>
            {hasFilters && (
              <button onClick={clearAll} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-red-500 transition-colors">
                <XIcon className="w-3.5 h-3.5" /> Clear Filters
              </button>
            )}
          </div>

          <AnimatePresence>
            {showAdvanced && (
              <motion.div initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }} exit={{ height:0, opacity:0 }} transition={{ duration:0.3 }} className="overflow-visible">
                <div className="pt-4 flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1 min-w-[150px]">
                    <CustomSelect label="Price Range" value={priceRange} options={PRICE_LIST} onChange={setPriceRange} />
                  </div>
                  <div className="flex-1" /><div className="flex-1" />
                  <div style={{ minWidth:'130px' }} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* ── ACTIVE FILTER PILLS ──────────────────────────────────────────── */}
        <AnimatePresence>
          {hasFilters && (
            <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-10 }} className="mb-8 flex flex-wrap items-center gap-2 p-4 bg-button-primary/5 border border-button-primary/20 rounded-2xl">
              <span className="text-sm font-semibold text-button-primary mr-1">Filters:</span>
              {location !== 'All Locations' && <span className="flex items-center gap-1.5 px-3 py-1 bg-white border border-button-primary/30 rounded-full text-sm font-medium text-gray-700 dark:text-gray-200"><MapPinIcon className="w-3.5 h-3.5 text-button-primary"/>{location}</span>}
              {propType  !== 'All Types'     && <span className="flex items-center gap-1.5 px-3 py-1 bg-white border border-button-primary/30 rounded-full text-sm font-medium text-gray-700 dark:text-gray-200"><HomeIcon className="w-3.5 h-3.5 text-button-primary"/>{propType}</span>}
              {bedrooms  !== 'Any Bedrooms'  && <span className="flex items-center gap-1.5 px-3 py-1 bg-white border border-button-primary/30 rounded-full text-sm font-medium text-gray-700 dark:text-gray-200"><BedDoubleIcon className="w-3.5 h-3.5 text-button-primary"/>{bedrooms}</span>}
              {priceRange !== 'Any Price'    && <span className="px-3 py-1 bg-white border border-button-primary/30 rounded-full text-sm font-medium text-gray-700 dark:text-gray-200">{priceRange}</span>}
              <button onClick={clearAll} className="ml-auto flex items-center gap-1.5 text-sm text-gray-400 hover:text-red-500 transition-colors"><XIcon className="w-4 h-4"/>Clear all</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── FALLBACK NOTICE ──────────────────────────────────────────────── */}
        <AnimatePresence>
          {fallbackLabel && (
            <motion.div initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} className="mb-6 flex items-center gap-2 px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-800 font-medium">
              <InfoIcon className="w-4 h-4 text-yellow-600 flex-shrink-0" />
              {fallbackLabel}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── CATEGORY TABS ────────────────────────────────────────────────── */}
        <section className="mb-10">
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => {
              const Icon = cat.icon
              return (
                <motion.button key={cat.id} whileHover={{ scale:1.04 }} whileTap={{ scale:0.96 }}
                  onClick={() => { setActiveCategory(cat.id); setDisplayCount(9) }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-full border text-sm font-semibold transition-all ${
                    activeCategory === cat.id
                      ? 'bg-button-primary text-white border-button-primary shadow-md'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-button-primary/50 hover:text-primary'
                  }`}
                >
                  <Icon className="w-4 h-4"/>
                  {cat.name}
                  <span className={`text-xs ${activeCategory === cat.id ? 'text-white/80' : 'text-gray-400'}`}>{cat.count}</span>
                </motion.button>
              )
            })}
          </div>
        </section>

        {/* ── MOST LIKED ───────────────────────────────────────────────────── */}
        {!hasFilters && activeCategory === 'all' && (
          <section className="mb-14">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-primary">Most Liked Properties</h2>
              <Button variant="ghost" size="sm">View All</Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {allProperties.slice(0, 4).map(p => (
                <motion.div key={`liked-${p.id}`} whileHover={{ y:-8 }} transition={{ duration:0.3 }}>
                  <PropertyCard {...p} />
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* ── INFO CARDS ───────────────────────────────────────────────────── */}
        {!hasFilters && activeCategory === 'all' && (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-14">
            <motion.div whileHover={{ y:-5 }}>
              <Card className="p-6 bg-gradient-to-br from-blue-50 to-white border-blue-100">
                <div className="flex items-start gap-4">
                  <div className="bg-blue-100 p-3 rounded-lg flex-shrink-0"><InfoIcon className="w-6 h-6 text-blue-600"/></div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Renting Guide</h3>
                    <p className="text-gray-600 mb-4 text-sm">New to renting? Check out our comprehensive guide on rental agreements and tenant rights.</p>
                    <Link to="/renting-guide"><Button variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50">Read Guide</Button></Link>
                  </div>
                </div>
              </Card>
            </motion.div>
            <motion.div whileHover={{ y:-5 }}>
              <Card className="p-6 bg-gradient-to-br from-yellow-50 to-white border-yellow-100">
                <div className="flex items-start gap-4">
                  <div className="bg-yellow-100 p-3 rounded-lg flex-shrink-0"><LightbulbIcon className="w-6 h-6 text-yellow-600"/></div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Safety Tips</h3>
                    <p className="text-gray-600 mb-4 text-sm">Stay safe while house hunting. Learn how to spot scams and verify owners.</p>
                    <Link to="/property-safety-tips"><Button variant="outline" className="text-button-primary border-button-primary hover:bg-button-primary/10">View Tips</Button></Link>
                  </div>
                </div>
              </Card>
            </motion.div>
          </section>
        )}

        {/* ── MAIN GRID ────────────────────────────────────────────────────── */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <div>
              <h2 className="text-2xl font-bold text-primary mb-1">
                {hasFilters || activeCategory !== 'all' ? 'Search Results' : 'Featured Properties'}
              </h2>
              <p className="text-gray-500 text-sm">
                Showing {Math.min(displayCount, sorted.length)} of {sorted.length} properties
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* Sort */}
              <div className="relative">
                <button onClick={() => setShowSortMenu(v => !v)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-button-primary/20 rounded-xl text-sm font-semibold text-gray-700 hover:border-button-primary/50 transition-all"
                  style={{ backgroundColor:'rgba(45,106,79,0.04)' }}
                >
                  <FilterIcon className="w-4 h-4 text-button-primary"/>
                  {SORT_OPTIONS.find(s => s.value === sortBy)?.label}
                  <ChevronDownIcon className="w-4 h-4 text-button-primary"/>
                </button>
                <AnimatePresence>
                  {showSortMenu && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowSortMenu(false)}/>
                      <motion.div initial={{ opacity:0, y:-8, scale:0.95 }} animate={{ opacity:1, y:0, scale:1 }} exit={{ opacity:0, y:-8, scale:0.95 }} transition={{ duration:0.15 }}
                        className="absolute right-0 top-full mt-1.5 w-52 bg-white border border-gray-100 rounded-2xl shadow-xl z-20 overflow-hidden py-1.5"
                      >
                        {SORT_OPTIONS.map(opt => (
                          <button key={opt.value} onClick={() => { setSortBy(opt.value); setShowSortMenu(false) }}
                            className={`w-full px-4 py-2.5 text-left text-sm transition-colors flex items-center gap-2 ${
                              sortBy === opt.value ? 'bg-button-primary/10 text-button-primary font-bold' : 'text-gray-700 hover:bg-button-primary/8 hover:text-button-primary'
                            }`}
                          >
                            {sortBy === opt.value && <span className="w-1.5 h-1.5 bg-button-primary rounded-full"/>}
                            {opt.label}
                          </button>
                        ))}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
              {/* View toggle */}
              <div className="flex items-center border-2 border-button-primary/20 rounded-xl overflow-hidden" style={{ backgroundColor:'rgba(45,106,79,0.04)' }}>
                <button onClick={() => setViewMode('grid')} className={`p-2.5 transition-colors ${viewMode==='grid' ? 'bg-button-primary text-white' : 'text-button-primary hover:bg-button-primary/10'}`}>
                  <GridIcon className="w-4 h-4"/>
                </button>
                <button onClick={() => setViewMode('list')} className={`p-2.5 transition-colors ${viewMode==='list' ? 'bg-button-primary text-white' : 'text-button-primary hover:bg-button-primary/10'}`}>
                  <ListIcon className="w-4 h-4"/>
                </button>
              </div>
            </div>
          </div>

          <div className={`grid gap-6 mb-8 ${viewMode==='grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
            {sorted.slice(0, displayCount).map((property, index) => (
              <motion.div key={property.id} initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ delay:index*0.04 }} whileHover={{ y:-8 }}>
                <PropertyCard {...property} />
              </motion.div>
            ))}
          </div>

          {displayCount < sorted.length && (
            <div className="text-center">
              <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
                onClick={() => setDisplayCount(prev => Math.min(prev+9, sorted.length))}
                className="px-8 py-3.5 bg-white border-2 border-button-primary/30 hover:border-button-primary text-button-primary font-semibold rounded-full transition-all hover:bg-button-primary/5"
              >
                Load More Properties
              </motion.button>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
