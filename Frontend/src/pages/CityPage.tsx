import React, { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MapPinIcon, HomeIcon, BuildingIcon, UsersIcon, StarIcon,
  ChevronRightIcon, ShieldCheckIcon, CheckCircleIcon, CloudIcon,
  SparklesIcon, TrainIcon, GraduationCapIcon, HeartPulseIcon,
  ShoppingBagIcon, TreesIcon, CameraIcon, ThermometerIcon,
  ArrowRightIcon, PhoneIcon, MailIcon, SearchIcon,
} from 'lucide-react'
import { PropertyCard } from '../components/PropertyCard'
import { Button } from '../components/ui/Button'

// ─── Types ────────────────────────────────────────────────────────────────────
interface CityData {
  name: string; tagline: string; description: string; image: string
  propertyCount: string; avgRent: string; popularAreas: string[]
  highlights: string[]; facts?: string[]; climate?: string; bestFor?: string[]
  galleryImages?: string[]
  cityHighlights?: { icon: any; title: string; desc: string }[]
}

// ─── City Database ────────────────────────────────────────────────────────────
const cityDatabase: Record<string, CityData> = {
  kathmandu: {
    name: 'Kathmandu', tagline: 'The Heart of Nepal',
    description: 'Kathmandu, the capital city, offers a vibrant mix of ancient culture and modern living. From bustling Thamel to serene Budhanilkantha, find apartments, flats, and rooms across every neighborhood. The city is home to universities, embassies, corporate offices, and thriving nightlife.',
    image: 'https://images.unsplash.com/photo-1558799401-1dcba79834c2?w=1400&fit=crop&q=80',
    propertyCount: '150+', avgRent: 'NPR 12,000 – 45,000',
    popularAreas: ['Thamel', 'Baneshwor', 'Lazimpat', 'Baluwatar', 'Koteshwor', 'Maharajgunj', 'Chabahil', 'Bouddha'],
    highlights: ['University hub', 'Corporate offices', 'Cultural heritage', 'Best nightlife'],
    facts: ['Altitude: 1,400m above sea level', 'Population: ~1 million', "Nepal's political & economic centre", '7 UNESCO World Heritage Sites nearby'],
    climate: 'Mild & temperate — cool winters, warm summers, monsoon July–Sept',
    bestFor: ['Working professionals', 'Students', 'Expats', 'Entrepreneurs'],
    galleryImages: [
      'https://images.unsplash.com/photo-1605640840605-14ac1855827b?w=700&fit=crop',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=700&fit=crop',
      'https://images.unsplash.com/photo-1609920658906-8223bd289001?w=700&fit=crop',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=700&fit=crop',
    ],
    cityHighlights: [
      { icon: BuildingIcon, title: 'Largest Rental Market', desc: "Nepal's most active rental market with options for every budget." },
      { icon: TrainIcon, title: 'Well Connected', desc: 'Ring roads, microbuses, and taxis connect all corners of the valley.' },
      { icon: GraduationCapIcon, title: 'Education Hub', desc: 'Home to Tribhuvan University and dozens of colleges.' },
      { icon: HeartPulseIcon, title: 'Top Healthcare', desc: 'Best hospitals in Nepal including TUTH, Bir Hospital, and more.' },
      { icon: ShoppingBagIcon, title: 'Shopping & Dining', desc: "From Thamel's tourist strip to Labim Mall and local bazaars." },
      { icon: CameraIcon, title: 'Cultural Heritage', desc: 'Pashupatinath, Boudhanath, Swayambhunath — UNESCO World Heritage Sites.' },
    ],
  },
  pokhara: {
    name: 'Pokhara', tagline: 'The Lake City',
    description: "Pokhara is Nepal's adventure capital and a paradise for nature lovers. With stunning views of the Annapurna range and the serene Phewa Lake, it offers a peaceful lifestyle with modern amenities. Popular among digital nomads, retirees, and tourism professionals.",
    image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1400&fit=crop&q=80',
    propertyCount: '90+', avgRent: 'NPR 8,000 – 30,000',
    popularAreas: ['Lakeside', 'Baidam', 'Prithvi Chowk', 'Chipledhunga', 'Mahendrapul', 'Simalchaur'],
    highlights: ['Lake views', 'Adventure sports', 'Digital nomad friendly', 'Peaceful living'],
    facts: ['Altitude: 822m above sea level', 'Gateway to Annapurna range', 'Known as "City of Lakes"', 'Best paragliding spot in Asia'],
    climate: 'Sub-tropical — warm summers, mild winters, heavy monsoon',
    bestFor: ['Nature lovers', 'Digital nomads', 'Trekkers', 'Retirees'],
    galleryImages: [
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=700&fit=crop',
      'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=700&fit=crop',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=700&fit=crop',
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=700&fit=crop',
    ],
    cityHighlights: [
      { icon: TreesIcon, title: 'Natural Beauty', desc: 'Phewa Lake, Annapurna views, and green hillsides at your doorstep.' },
      { icon: CloudIcon, title: 'Fresh Air', desc: "One of Nepal's cleanest cities with low pollution." },
      { icon: CameraIcon, title: 'Tourism Hub', desc: 'Gateway to Annapurna Circuit and world-class paragliding.' },
      { icon: ShoppingBagIcon, title: 'Lakeside Life', desc: 'Vibrant cafés, restaurants, and shops along Lakeside strip.' },
      { icon: GraduationCapIcon, title: 'Growing Education', desc: 'Pokhara University and several quality colleges.' },
      { icon: UsersIcon, title: 'Expat Community', desc: 'A growing international community and remote-work culture.' },
    ],
  },
  lalitpur: {
    name: 'Lalitpur', tagline: 'The City of Fine Arts',
    description: 'Lalitpur (Patan) is known for its rich artistic heritage and increasingly modern infrastructure. Home to Patan Durbar Square, the city blends traditional Newari architecture with contemporary apartments. Popular among expats and young professionals.',
    image: 'https://images.unsplash.com/photo-1605640840605-14ac1855827b?w=1400&fit=crop&q=80',
    propertyCount: '80+', avgRent: 'NPR 10,000 – 35,000',
    popularAreas: ['Jhamsikhel', 'Kupondole', 'Pulchowk', 'Mangalbazar', 'Sanepa', 'Satdobato'],
    highlights: ['Expat friendly', 'Art & culture', 'Walkable neighborhoods', 'Great cafes'],
    facts: ['Also known as Patan', 'Founded over 1,600 years ago', 'UNESCO Heritage Site in city centre', 'Home to many NGO & UN offices'],
    climate: 'Similar to Kathmandu — mild with four distinct seasons',
    bestFor: ['Expats & diplomats', 'Artists & creatives', 'Families', 'History lovers'],
    galleryImages: [
      'https://images.unsplash.com/photo-1609920658906-8223bd289001?w=700&fit=crop',
      'https://images.unsplash.com/photo-1558799401-1dcba79834c2?w=700&fit=crop',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=700&fit=crop',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=700&fit=crop',
    ],
    cityHighlights: [
      { icon: CameraIcon, title: 'Living Heritage', desc: 'Patan Durbar Square is a UNESCO World Heritage Site.' },
      { icon: BuildingIcon, title: 'Residential Feel', desc: 'Quieter than Kathmandu but equally well-connected.' },
      { icon: ShoppingBagIcon, title: 'Arts & Crafts', desc: 'World-renowned for metalwork, thangka painting, and woodcarving.' },
      { icon: GraduationCapIcon, title: 'International Schools', desc: 'Many expat families choose Lalitpur for quality schools.' },
      { icon: HeartPulseIcon, title: 'Good Healthcare', desc: 'Patan Hospital and several private clinics.' },
      { icon: UsersIcon, title: 'Expat Friendly', desc: 'Large expat community, embassies, and NGO headquarters.' },
    ],
  },
  bhaktapur: {
    name: 'Bhaktapur', tagline: 'The Living Heritage',
    description: 'Bhaktapur offers an authentic Nepali living experience with its preserved medieval architecture and rich cultural traditions. Increasingly popular among those seeking affordable rent close to Kathmandu, with excellent connectivity via the Araniko Highway.',
    image: 'https://images.unsplash.com/photo-1609920658906-8223bd289001?w=1400&fit=crop&q=80',
    propertyCount: '45+', avgRent: 'NPR 7,000 – 22,000',
    popularAreas: ['Suryabinayak', 'Kamal Binayak', 'Sallaghari', 'Dudhpati', 'Kamalbinayak'],
    highlights: ['Affordable rent', 'Cultural immersion', 'Close to Kathmandu', 'Traditional food'],
    facts: ["One of Nepal's 3 ancient kingdoms", 'Famous for Juju Dhau (King Curd)', '3 UNESCO World Heritage Zones', 'Newari culture best preserved here'],
    climate: 'Cool and crisp — slightly cooler than Kathmandu due to altitude',
    bestFor: ['Culture enthusiasts', 'Budget-conscious renters', 'Traditional lifestyle seekers', 'Artists'],
    galleryImages: [
      'https://images.unsplash.com/photo-1558799401-1dcba79834c2?w=700&fit=crop',
      'https://images.unsplash.com/photo-1605640840605-14ac1855827b?w=700&fit=crop',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=700&fit=crop',
      'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=700&fit=crop',
    ],
    cityHighlights: [
      { icon: CameraIcon, title: 'UNESCO Heritage', desc: 'Three UNESCO World Heritage Zones within the city.' },
      { icon: TreesIcon, title: 'Clean & Green', desc: 'Less traffic and pollution than Kathmandu.' },
      { icon: ShoppingBagIcon, title: 'Pottery & Crafts', desc: 'Famous Pottery Square and local handicrafts.' },
      { icon: BuildingIcon, title: 'Affordable Rents', desc: 'Most affordable rents in the Kathmandu Valley.' },
      { icon: UsersIcon, title: 'Tight Community', desc: 'Strong local Newari community.' },
      { icon: GraduationCapIcon, title: 'Growing Facilities', desc: 'Schools, colleges, and healthcare accessible.' },
    ],
  },
  dharan: {
    name: 'Dharan', tagline: 'Gateway to the East',
    description: 'Dharan is a vibrant city in eastern Nepal, known for its pleasant climate and growing educational institutions. Home to B.P. Koirala Institute of Health Sciences, the city attracts students and medical professionals with affordable modern apartments.',
    image: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=1400&fit=crop&q=80',
    propertyCount: '30+', avgRent: 'NPR 5,000 – 18,000',
    popularAreas: ['Putalisadak', 'Bhanu Chowk', 'Chatara Road', 'Panbari', 'Budhabare'],
    highlights: ['Student hub', 'Pleasant climate', 'Affordable', 'Growing city'],
    facts: ["Eastern Nepal's largest city", 'Home to BP Koirala Institute of Health Sciences', 'Famous for returning Gurkha soldiers', 'Rapid development in recent years'],
    climate: 'Sub-tropical foothills — warm, pleasant, distinct monsoon season',
    bestFor: ['Medical professionals', 'Students', 'Budget renters', 'Eastern Nepal residents'],
    galleryImages: [
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=700&fit=crop',
      'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=700&fit=crop',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=700&fit=crop',
      'https://images.unsplash.com/photo-1558799401-1dcba79834c2?w=700&fit=crop',
    ],
    cityHighlights: [
      { icon: HeartPulseIcon, title: 'Medical Hub', desc: "BP Koirala Institute — one of Nepal's best teaching hospitals." },
      { icon: ThermometerIcon, title: 'Pleasant Climate', desc: 'Cooler than terai, warmer than hills — near-perfect weather.' },
      { icon: ShoppingBagIcon, title: 'Commercial Centre', desc: 'Main shopping and trade hub for all of eastern Nepal.' },
      { icon: BuildingIcon, title: 'Affordable Living', desc: 'Low rents with modern amenities — great value.' },
      { icon: TreesIcon, title: 'Natural Surroundings', desc: 'Forests, parks, and easy access to hill treks.' },
      { icon: UsersIcon, title: 'Diverse Culture', desc: 'Vibrant blend of Rai, Limbu, Brahmin, and Chhetri communities.' },
    ],
  },
  butwal: {
    name: 'Butwal', tagline: 'The Industrial Hub',
    description: 'Butwal is a rapidly developing city in western Nepal, serving as a major commercial and industrial center. Its strategic location as a gateway to Lumbini and the Terai region makes it an important economic hub with growing residential developments.',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1400&fit=crop&q=80',
    propertyCount: '25+', avgRent: 'NPR 5,000 – 15,000',
    popularAreas: ['Traffic Chowk', 'Golpark', 'Kalikanagar', 'Devinagar', 'Yogikuti'],
    highlights: ['Industrial center', 'Gateway to Lumbini', 'Affordable living', 'Growing economy'],
    facts: ["Western Nepal's commercial capital", 'Near Lumbini — birthplace of Buddha', 'Major transit point on Mahendra Highway', 'Fast-growing real estate market'],
    climate: 'Hot terai climate — very warm summers, cool winters, heavy monsoon',
    bestFor: ['Industrial workers', 'Business owners', 'Budget renters', 'Families'],
    galleryImages: [
      'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=700&fit=crop',
      'https://images.unsplash.com/photo-1609920658906-8223bd289001?w=700&fit=crop',
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=700&fit=crop',
      'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=700&fit=crop',
    ],
    cityHighlights: [
      { icon: BuildingIcon, title: 'Industrial Growth', desc: "Home to factories and Nepal's western industrial corridor." },
      { icon: TrainIcon, title: 'Highway Hub', desc: 'Strategic location on Mahendra Highway.' },
      { icon: ShoppingBagIcon, title: 'Commercial Activity', desc: 'Bustling markets, malls, and trade centres.' },
      { icon: HomeIcon, title: 'Affordable Housing', desc: 'Best value-for-money rentals in Nepal.' },
      { icon: GraduationCapIcon, title: 'Educational Growth', desc: 'Multiple colleges and schools for the growing population.' },
      { icon: HeartPulseIcon, title: 'Healthcare Access', desc: 'Lumbini Provincial Hospital and private clinics.' },
    ],
  },
}

// ─── Property generator ───────────────────────────────────────────────────────
const getCityProperties = (cityName: string) => {
  const images = [
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&auto=format&fit=crop',
  ]
  const city = cityDatabase[cityName.toLowerCase()]
  if (!city) return []
  const types = ['Modern 2BHK Apartment', 'Cozy Studio Room', 'Spacious 3BHK Flat', 'Budget-Friendly Room', 'Family Apartment', 'Premium Flat']
  return types.map((title, i) => ({
    id: `${cityName}-${i}`, image: images[i], title,
    location: `${city.popularAreas[i % city.popularAreas.length]}, ${city.name}`,
    rent: 10000 + i * 5000, bedrooms: (i % 3) + 1, bathrooms: (i % 2) + 1, views: 100 + i * 47,
  }))
}

// ─── Neighbourhood area images ────────────────────────────────────────────────
const AREA_IMAGES = [
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=500&fit=crop',
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=500&fit=crop',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=500&fit=crop',
  'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=500&fit=crop',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=500&fit=crop',
  'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=500&fit=crop',
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=500&fit=crop',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=500&fit=crop',
]

// ─── Main Component ───────────────────────────────────────────────────────────
export function CityPage() {
  const { citySlug = 'kathmandu' } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'overview' | 'neighbourhoods' | 'highlights'>('overview')

  const city = cityDatabase[citySlug.toLowerCase()]

  if (!city) {
    return (
      <main className="min-h-screen bg-background-light flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary mb-4">City Not Found</h1>
          <p className="text-gray-600 mb-6">We couldn't find information for this city.</p>
          <Button onClick={() => navigate('/')}>Back to Home</Button>
        </div>
      </main>
    )
  }

  const properties = getCityProperties(citySlug)
  const otherCities = Object.entries(cityDatabase).filter(([key]) => key !== citySlug.toLowerCase()).slice(0, 3)

  return (
    <main className="min-h-screen bg-background-light">

      {/* ══════════════════════════════════════════════════
          HERO — animated split layout: text left, image right
          with floating shapes, badges, and staggered entrance
      ══════════════════════════════════════════════════ */}
      <section className="bg-background-light pt-28 pb-16 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Breadcrumb */}
          <motion.nav
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="flex items-center gap-2 text-sm text-gray-400 mb-14"
          >
            <Link to="/" className="hover:text-button-primary transition-colors font-medium">Home</Link>
            <ChevronRightIcon className="w-3 h-3" />
            <Link to="/" className="hover:text-button-primary transition-colors font-medium">Cities</Link>
            <ChevronRightIcon className="w-3 h-3" />
            <span className="text-button-primary font-semibold">{city.name}</span>
          </motion.nav>

          {/* Split layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

            {/* LEFT — text + info */}
            <div>
              {/* City label pill */}
              <motion.div
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-button-primary/10 border border-button-primary/20 rounded-full mb-5"
              >
                <MapPinIcon className="w-3.5 h-3.5 text-button-primary" />
                <span className="text-button-primary text-xs font-bold uppercase tracking-widest">Nepal · {city.name}</span>
              </motion.div>

              {/* Big heading */}
              <motion.h1
                initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.65 }}
                className="text-6xl md:text-7xl font-black text-primary tracking-tight uppercase leading-none mb-4"
              >
                {city.name}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                className="text-xl text-gray-500 font-medium mb-6"
              >
                {city.tagline}
              </motion.p>
              <motion.p
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.48 }}
                className="text-gray-500 text-base leading-relaxed mb-8 max-w-md"
              >
                {city.description}
              </motion.p>

              {/* Quick facts */}
              {city.facts && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
                  className="space-y-2 mb-8"
                >
                  {city.facts.map((fact, i) => (
                    <div key={i} className="flex items-center gap-2.5">
                      <CheckCircleIcon className="w-4 h-4 text-button-primary flex-shrink-0" />
                      <span className="text-gray-600 text-sm">{fact}</span>
                    </div>
                  ))}
                </motion.div>
              )}

              {/* CTA buttons */}
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.62 }}
                className="flex flex-wrap gap-3"
              >
                <motion.button
                  whileHover={{ scale: 1.04, boxShadow: '0 12px 30px rgba(0,0,0,0.15)' }} whileTap={{ scale: 0.96 }}
                  onClick={() => navigate('/properties')}
                  className="group flex items-center gap-2 px-6 py-3 bg-button-primary text-white font-bold rounded-full shadow-lg hover:shadow-xl transition-all text-sm"
                >
                  <SearchIcon className="w-4 h-4" />
                  Browse Properties
                  <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                  onClick={() => navigate('/')}
                  className="flex items-center gap-2 px-6 py-3 bg-white text-primary font-semibold rounded-full border-2 border-gray-200 hover:border-button-primary/40 transition-all text-sm shadow-sm"
                >
                  Back to Cities
                </motion.button>
              </motion.div>
            </div>

            {/* RIGHT — hero image with floating shapes & badges */}
            <div className="relative">
              {/* Decorative blobs behind image */}
              <motion.div
                animate={{ scale: [1, 1.08, 1], rotate: [0, 6, 0] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -top-8 -right-8 w-72 h-72 bg-button-primary/10 rounded-full blur-2xl pointer-events-none"
              />
              <motion.div
                animate={{ scale: [1.05, 1, 1.05], rotate: [0, -5, 0] }}
                transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                className="absolute -bottom-8 -left-8 w-56 h-56 bg-primary/8 rounded-full blur-2xl pointer-events-none"
              />

              {/* Decorative shape ring */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
                className="absolute -top-4 -right-4 w-24 h-24 border-2 border-dashed border-button-primary/25 rounded-full pointer-events-none"
              />

              {/* Main city image */}
              <motion.div
                initial={{ opacity: 0, scale: 0.94, x: 30 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                transition={{ delay: 0.35, duration: 0.75, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="relative z-10"
              >
                <div className="w-full h-[380px] md:h-[460px] rounded-[2.5rem] overflow-hidden shadow-2xl">
                  <motion.img
                    src={city.image} alt={city.name}
                    className="w-full h-full object-cover"
                    whileHover={{ scale: 1.04 }}
                    transition={{ duration: 0.5 }}
                  />
                  {/* Subtle inner gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                </div>

                {/* Properties count badge — top right of image */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.7 }}
                  className="absolute -top-4 -right-4 bg-button-primary text-white text-sm font-black px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2"
                >
                  <BuildingIcon className="w-4 h-4" />
                  {city.propertyCount} Properties
                </motion.div>

                {/* Avg rent badge — bottom left */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.75 }}
                  className="absolute -bottom-5 -left-4 bg-white border border-gray-100 shadow-xl rounded-2xl px-4 py-3 flex items-center gap-3"
                >
                  <div className="w-9 h-9 bg-button-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <HomeIcon className="w-4 h-4 text-button-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Avg. Rent / mo</p>
                    <p className="text-primary font-black text-sm leading-tight">{city.avgRent}</p>
                  </div>
                </motion.div>

                {/* Verified badge — bottom right */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.82 }}
                  className="absolute -bottom-5 right-6 bg-white border border-gray-100 shadow-xl rounded-2xl px-3 py-2.5 flex items-center gap-2"
                >
                  <ShieldCheckIcon className="w-4 h-4 text-button-primary" />
                  <span className="text-gray-700 text-xs font-semibold">Verified Listings</span>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          STATS STRIP
      ══════════════════════════════════════════════════ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-100 grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-100"
        >
          {[
            { icon: BuildingIcon, value: city.propertyCount, label: 'Verified Listings' },
            { icon: HomeIcon, value: city.avgRent, label: 'Avg. Monthly Rent' },
            { icon: MapPinIcon, value: `${city.popularAreas.length}`, label: 'Popular Areas' },
            { icon: StarIcon, value: '98%', label: 'Satisfaction Rate' },
          ].map((stat, i) => {
            const Icon = stat.icon
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 + i * 0.07 }}
                className="flex flex-col items-center justify-center py-7 px-4 text-center group"
              >
                <div className="w-10 h-10 bg-button-primary/10 group-hover:bg-button-primary rounded-xl flex items-center justify-center mb-3 transition-colors duration-200">
                  <Icon className="w-5 h-5 text-button-primary group-hover:text-white transition-colors duration-200" />
                </div>
                <p className="text-2xl font-black text-gray-900 leading-tight">{stat.value}</p>
                <p className="text-xs text-gray-400 font-medium mt-0.5">{stat.label}</p>
              </motion.div>
            )
          })}
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════════
          TAB NAV
      ══════════════════════════════════════════════════ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center gap-1 bg-white border border-gray-100 rounded-2xl p-1.5 shadow-sm w-fit">
          {(['overview', 'neighbourhoods', 'highlights'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold capitalize transition-all duration-200 ${
                activeTab === tab ? 'bg-button-primary text-white shadow-md' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          TAB CONTENT
      ══════════════════════════════════════════════════ */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatePresence mode="wait">

          {/* ── OVERVIEW ── */}
          {activeTab === 'overview' && (
            <motion.div key="overview" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.25 }}>

              {/* Climate + Best For */}
              {(city.climate || city.bestFor) && (
                <section className="pb-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {city.climate && (
                      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <CloudIcon className="w-4 h-4 text-blue-500" />
                          <span className="text-xs font-bold text-gray-600 uppercase tracking-widest">Climate</span>
                        </div>
                        <p className="text-gray-500 text-sm leading-relaxed">{city.climate}</p>
                      </div>
                    )}
                    {city.bestFor && (
                      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                          <UsersIcon className="w-4 h-4 text-button-primary" />
                          <span className="text-xs font-bold text-gray-600 uppercase tracking-widest">Best For</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {city.bestFor.map(tag => (
                            <span key={tag} className="text-xs bg-button-primary/10 text-button-primary px-2.5 py-1 rounded-full font-semibold">{tag}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* ── Popular Neighbourhoods — BOLD, EYE-CATCHING ── */}
              <section className="pb-8">
                <div className="flex items-end justify-between mb-6">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="h-px w-7 bg-button-primary" />
                      <span className="text-button-primary text-xs font-bold uppercase tracking-widest">Areas to Explore</span>
                    </div>
                    <h2 className="text-2xl font-black text-gray-900">Popular Neighbourhoods</h2>
                  </div>
                  <Link to="/properties" className="text-button-primary text-sm font-semibold flex items-center gap-1 hover:gap-2 transition-all">
                    View all <ArrowRightIcon className="w-4 h-4" />
                  </Link>
                </div>

                {/* Large feature card row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {city.popularAreas.map((area, i) => (
                    <motion.div
                      key={area}
                      initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                      whileHover={{ y: -6, scale: 1.02 }}
                      onClick={() => navigate('/properties')}
                      className="group relative cursor-pointer rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300"
                      style={{ height: i % 3 === 0 ? '200px' : '160px' }}
                    >
                      <img
                        src={AREA_IMAGES[i % AREA_IMAGES.length]}
                        alt={area}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      {/* Green tint on hover */}
                      <div className="absolute inset-0 bg-button-primary/0 group-hover:bg-button-primary/20 transition-colors duration-300" />

                      {/* Content */}
                      <div className="absolute inset-0 flex flex-col justify-end p-3.5">
                        <p className="text-white font-bold text-sm leading-tight mb-1">{area}</p>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <span className="text-white/80 text-xs">Browse</span>
                          <ArrowRightIcon className="w-3 h-3 text-white/80" />
                        </div>
                      </div>

                      {/* Arrow icon top-right on hover */}
                      <div className="absolute top-3 right-3 w-7 h-7 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 scale-75 group-hover:scale-100">
                        <ArrowRightIcon className="w-3.5 h-3.5 text-white" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>

              {/* Quick nav links */}
              <section className="pb-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { tab: 'neighbourhoods' as const, icon: MapPinIcon, title: 'Explore Neighbourhoods', sub: 'Find the right area for you' },
                    { tab: 'highlights' as const, icon: SparklesIcon, title: 'City Highlights', sub: 'Why people love living here' },
                  ].map(item => {
                    const Icon = item.icon
                    return (
                      <motion.div
                        key={item.tab} whileHover={{ y: -3 }}
                        onClick={() => setActiveTab(item.tab)}
                        className="group cursor-pointer bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md hover:border-button-primary/25 transition-all flex items-center gap-4"
                      >
                        <div className="w-11 h-11 bg-button-primary/10 group-hover:bg-button-primary rounded-xl flex items-center justify-center transition-colors flex-shrink-0">
                          <Icon className="w-5 h-5 text-button-primary group-hover:text-white transition-colors" />
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-gray-900 text-sm">{item.title}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{item.sub}</p>
                        </div>
                        <ChevronRightIcon className="w-4 h-4 text-gray-300 group-hover:text-button-primary transition-colors" />
                      </motion.div>
                    )
                  })}
                </div>
              </section>
            </motion.div>
          )}

          {/* ── NEIGHBOURHOODS ── */}
          {activeTab === 'neighbourhoods' && (
            <motion.div key="hoods" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.25 }}>
              <section className="pt-2 pb-4">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="h-px w-8 bg-button-primary" />
                      <span className="text-button-primary text-xs font-bold uppercase tracking-widest">Areas to Rent</span>
                    </div>
                    <h2 className="text-3xl font-black text-gray-900">Popular Neighbourhoods</h2>
                    <p className="text-gray-400 text-sm mt-1">Click any area to browse available properties</p>
                  </div>
                  <Link to="/properties">
                    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="mt-4 sm:mt-0 flex items-center gap-2 px-5 py-2.5 bg-button-primary text-white text-sm font-semibold rounded-full hover:shadow-lg transition-all">
                      View All <ArrowRightIcon className="w-4 h-4" />
                    </motion.button>
                  </Link>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {city.popularAreas.map((area, i) => (
                    <motion.div
                      key={area}
                      initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}
                      whileHover={{ y: -6, scale: 1.02 }}
                      onClick={() => navigate('/properties')}
                      className="group relative cursor-pointer rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300"
                      style={{ height: i % 3 === 0 ? '200px' : '160px' }}
                    >
                      <img src={AREA_IMAGES[i % AREA_IMAGES.length]} alt={area} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <div className="absolute inset-0 bg-button-primary/0 group-hover:bg-button-primary/20 transition-colors duration-300" />
                      <div className="absolute inset-0 flex flex-col justify-end p-3.5">
                        <p className="text-white font-bold text-sm leading-tight mb-1">{area}</p>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-white/80 text-xs">Browse</span>
                          <ArrowRightIcon className="w-3 h-3 text-white/80" />
                        </div>
                      </div>
                      <div className="absolute top-3 right-3 w-7 h-7 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100">
                        <ArrowRightIcon className="w-3.5 h-3.5 text-white" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>

              <section className="pt-8 pb-10">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-black text-gray-900">Properties in {city.name}</h2>
                    <p className="text-gray-400 text-sm">{city.propertyCount} verified listings available</p>
                  </div>
                  <Link to="/properties"><Button variant="outline" size="sm">View All <ChevronRightIcon className="w-4 h-4 ml-1" /></Button></Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {properties.slice(0, 3).map((p, i) => (
                    <motion.div key={p.id} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                      <PropertyCard {...p} />
                    </motion.div>
                  ))}
                </div>
              </section>
            </motion.div>
          )}

          {/* ── HIGHLIGHTS ── */}
          {activeTab === 'highlights' && (
            <motion.div key="highlights" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.25 }}>
              <section className="pt-2 pb-4">
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="h-px w-8 bg-button-primary" />
                    <span className="text-button-primary text-xs font-bold uppercase tracking-widest">Why Live Here</span>
                  </div>
                  <h2 className="text-3xl font-black text-gray-900">What Makes {city.name} Special</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(city.cityHighlights || []).map((h, i) => {
                    const Icon = h.icon
                    return (
                      <motion.div
                        key={h.title}
                        initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}
                        whileHover={{ y: -5 }}
                        className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-lg transition-all group relative overflow-hidden"
                      >
                        <div className="absolute top-4 right-4 text-6xl font-black text-gray-50 leading-none select-none">{String(i + 1).padStart(2, '0')}</div>
                        <div className="w-12 h-12 bg-button-primary/10 group-hover:bg-button-primary rounded-xl flex items-center justify-center mb-4 transition-colors">
                          <Icon className="w-6 h-6 text-button-primary group-hover:text-white transition-colors" />
                        </div>
                        <h3 className="font-bold text-gray-900 mb-2">{h.title}</h3>
                        <p className="text-gray-500 text-sm leading-relaxed">{h.desc}</p>
                      </motion.div>
                    )
                  })}
                </div>
              </section>
              <section className="pt-8 pb-10">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-black text-gray-900">Properties in {city.name}</h2>
                    <p className="text-gray-400 text-sm">{city.propertyCount} verified listings available</p>
                  </div>
                  <Link to="/properties"><Button variant="outline" size="sm">View All <ChevronRightIcon className="w-4 h-4 ml-1" /></Button></Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {properties.slice(0, 3).map((p, i) => (
                    <motion.div key={p.id} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                      <PropertyCard {...p} />
                    </motion.div>
                  ))}
                </div>
              </section>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* ══════════════════════════════════════════════════
          ALL PROPERTIES
      ══════════════════════════════════════════════════ */}
      <section className="bg-white border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="flex items-end justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="h-px w-8 bg-button-primary" />
                <span className="text-button-primary text-xs font-bold uppercase tracking-widest">Listings</span>
              </div>
              <h2 className="text-3xl font-black text-gray-900">Properties in {city.name}</h2>
              <p className="text-gray-400 text-sm mt-1">{city.propertyCount} verified listings available right now</p>
            </div>
            <Link to="/properties">
              <Button variant="outline" size="sm" className="flex items-center gap-1.5 font-semibold">
                View All <ChevronRightIcon className="w-4 h-4" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property, i) => (
              <motion.div key={property.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}>
                <PropertyCard {...property} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          EXPLORE OTHER CITIES — Image 3 style
      ══════════════════════════════════════════════════ */}
      <section className="bg-background-light">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="flex items-center gap-2 mb-3">
            <span className="h-px w-8 bg-button-primary" />
            <span className="text-button-primary text-xs font-bold uppercase tracking-widest">Discover More</span>
          </div>
          <h2 className="text-3xl font-black text-gray-900 mb-8">Explore Other Cities</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {otherCities.map(([key, otherCity], index) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }}
                whileHover={{ y: -6 }}
                onClick={() => navigate(`/city/${key}`)}
                className="relative h-56 rounded-2xl overflow-hidden cursor-pointer shadow-md group"
              >
                <img src={otherCity.image} alt={otherCity.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                <div className="absolute inset-0 flex flex-col justify-end p-5">
                  <h3 className="text-white text-xl font-black">{otherCity.name}</h3>
                  <p className="text-white/75 text-sm">{otherCity.propertyCount} Properties</p>
                </div>
                <div className="absolute top-4 right-4 w-9 h-9 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100">
                  <ArrowRightIcon className="w-4 h-4 text-white" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          CTA — Exact match to Image 4: green bg, dots,
          left text + buttons, right glassmorphism contact card
      ══════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1a4731 0%, #2d6a4f 50%, #1a4731 100%)' }}>
        {/* Dot pattern — exact match to Image 4 */}
        <div
          className="absolute inset-0 pointer-events-none opacity-30"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.35) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
        {/* Subtle glow orbs */}
        <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.25, 0.1] }} transition={{ duration: 7, repeat: Infinity }} className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <motion.div animate={{ scale: [1.2, 1, 1.2], opacity: [0.15, 0.05, 0.15] }} transition={{ duration: 9, repeat: Infinity, delay: 2 }} className="absolute bottom-0 left-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

            {/* LEFT — heading + buttons */}
            <motion.div initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              {/* Properties count badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-full mb-6">
                <HomeIcon className="w-4 h-4 text-white/80" />
                <span className="text-white/90 text-sm font-semibold">{city.propertyCount} Properties in {city.name}</span>
              </div>

              <h2 className="text-4xl md:text-5xl font-black text-white mb-5 leading-tight">
                Ready to Find Your<br />Home in {city.name}?
              </h2>
              <p className="text-white/70 text-base mb-10 max-w-sm leading-relaxed">
                Browse verified listings and connect directly with trusted landlords — no middleman, no hidden fees.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <motion.button
                  whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                  onClick={() => navigate('/properties')}
                  className="flex items-center justify-center gap-2.5 px-6 py-3.5 bg-white text-primary font-bold rounded-full shadow-xl hover:shadow-2xl transition-all text-sm"
                >
                  <SearchIcon className="w-4 h-4" />
                  Browse {city.name} Listings
                  <ArrowRightIcon className="w-4 h-4" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                  onClick={() => navigate('/')}
                  className="flex items-center justify-center px-6 py-3.5 bg-white/10 text-white font-bold rounded-full border border-white/25 hover:bg-white/20 transition-all text-sm"
                >
                  Explore Other Cities
                </motion.button>
              </div>
            </motion.div>

            {/* RIGHT — contact card (glassmorphism, exact Image 4) */}
            <motion.div initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.15 }}>
              <div
                className="rounded-2xl p-8 border border-white/15"
                style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(16px)' }}
              >
                <h3 className="text-xl font-black text-white mb-2">Need Help Finding a Home?</h3>
                <p className="text-white/60 text-sm mb-7 leading-relaxed">
                  Our team is available 7 days a week to help you find the perfect rental in {city.name}.
                </p>

                {/* Call us */}
                <div
                  className="flex items-center gap-4 p-4 rounded-xl mb-3 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors"
                  style={{ background: 'rgba(255,255,255,0.06)' }}
                  onClick={() => window.location.href = 'tel:+97712345678'}
                >
                  <div className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <PhoneIcon className="w-4 h-4 text-white/80" />
                  </div>
                  <div>
                    <p className="text-white/50 text-xs font-medium">Call us</p>
                    <p className="text-white font-bold text-sm">+977-1-234-5678</p>
                  </div>
                </div>

                {/* Email us */}
                <div
                  className="flex items-center gap-4 p-4 rounded-xl mb-6 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors"
                  style={{ background: 'rgba(255,255,255,0.06)' }}
                  onClick={() => window.location.href = 'mailto:hello@flatmate.com.np'}
                >
                  <div className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MailIcon className="w-4 h-4 text-white/80" />
                  </div>
                  <div>
                    <p className="text-white/50 text-xs font-medium">Email us</p>
                    <p className="text-white font-bold text-sm">hello@flatmate.com.np</p>
                  </div>
                </div>

                {/* Get Started Free */}
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={() => navigate('/signup')}
                  className="w-full py-4 bg-white text-primary font-black rounded-xl flex items-center justify-center gap-2 shadow-lg hover:bg-white/95 transition-all text-base"
                >
                  Get Started Free
                  <ArrowRightIcon className="w-4 h-4" />
                </motion.button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

    </main>
  )
}
