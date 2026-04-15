
import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { MapPinIcon, BriefcaseIcon, CalendarIcon, ShieldCheckIcon, MessageCircleIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

interface RoommateCardProps {
  id: string
  name: string
  age: number
  gender?: string
  occupation?: string
  budget?: string
  location: string
  moveInDate?: string
  bio: string
  tags?: string[]
  verified?: boolean
  image?: string
  onMessage?: () => void
}

export function RoommateCard({
  id, name, age, gender, occupation, budget, location,
  moveInDate, bio, tags = [], verified = false, image, onMessage,
}: RoommateCardProps) {

  const handleMessage = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation()
    if (onMessage) { onMessage(); return }
    toast.info('Please log in to message roommates')
  }

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-lg transition-all"
    >
      <Link to={`/roommate/${id}`} className="block">
        {/* Top: avatar + basic info */}
        <div className="flex items-start gap-4 p-5 pb-4">
          <div className="relative flex-shrink-0">
            {image ? (
              <img src={image} alt={name} className="w-16 h-16 rounded-xl object-cover" />
            ) : (
              <div className="w-16 h-16 bg-button-primary/10 rounded-xl flex items-center justify-center text-button-primary font-black text-xl">
                {name.charAt(0)}
              </div>
            )}
            {verified && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
                <ShieldCheckIcon className="w-3 h-3 text-white" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-bold text-gray-900 text-base">{name}, {age}</h3>
                <p className="text-xs text-gray-500">{gender} · {occupation}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-2">
              {budget && (
                <span className="text-xs font-semibold text-button-primary bg-button-primary/10 px-2 py-0.5 rounded-full">
                  {budget}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="px-5 pb-3 space-y-1.5">
          <div className="flex items-center gap-1.5 text-gray-500 text-xs">
            <MapPinIcon className="w-3.5 h-3.5 text-button-primary flex-shrink-0" />
            <span className="truncate">{location}</span>
          </div>
          {moveInDate && (
            <div className="flex items-center gap-1.5 text-gray-500 text-xs">
              <CalendarIcon className="w-3.5 h-3.5 text-button-primary flex-shrink-0" />
              <span>Move-in: {moveInDate}</span>
            </div>
          )}
        </div>

        {/* Bio */}
        <div className="px-5 pb-3">
          <p className="text-gray-600 text-xs leading-relaxed line-clamp-2">{bio}</p>
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="px-5 pb-4 flex flex-wrap gap-1.5">
            {tags.map(tag => (
              <span key={tag} className="text-[10px] font-semibold px-2 py-0.5 bg-gray-50 border border-gray-200 text-gray-600 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        )}
      </Link>

      {/* Action buttons — outside Link to prevent navigation */}
      <div className="px-5 pb-5 flex gap-2 border-t border-gray-50 pt-3">
        <Link to={`/roommate/${id}`} className="flex-1">
          <button className="w-full py-2 text-xs font-bold border-2 border-button-primary/30 text-button-primary rounded-xl hover:bg-button-primary/5 hover:border-button-primary transition-all">
            View Profile
          </button>
        </Link>
        {/* Message button — green, matches site theme */}
        <motion.button
          data-message-btn="true"
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={handleMessage}
          className="flex-1 py-2 text-xs font-bold bg-button-primary text-white rounded-xl hover:bg-button-primary/90 transition-all flex items-center justify-center gap-1.5 shadow-sm"
        >
          <MessageCircleIcon className="w-3.5 h-3.5" /> Message
        </motion.button>
      </div>
    </motion.div>
  )
}
