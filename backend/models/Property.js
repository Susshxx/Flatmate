// models/Property.js
import mongoose from 'mongoose';

const propertySchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    location: { type: String, required: true },
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    rent: { type: Number, required: true },
    beds: { type: Number, default: 1 },
    baths: { type: Number, default: 1 },
    type: { type: String, required: true }, // Apartment, House, Flat, Studio, Room
    area: { type: String, required: true },
    status: { 
      type: String, 
      enum: ['pending', 'approved', 'rejected', 'unavailable'], 
      default: 'pending' 
    },
    isBooked: { type: Boolean, default: false },
    furnishing: { type: String, default: 'Unfurnished' },
    parking: { type: String, default: 'Not available' },
    wifi: { type: Boolean, default: false },
    views: { type: Number, default: 0 },
    saves: { type: Number, default: 0 },
    inquiries: { type: Number, default: 0 },
    reports: { type: Number, default: 0 },
    image: { type: String, default: '' }, // Main image (first from images array)
    images: [{ type: String }], // Array of all property images
    description: { type: String, default: '' },
    amenities: [{ type: String }],
    ownerName: { type: String, required: true },
    ownerId: { type: String, required: true },
    ownerEmail: { type: String, default: '' },
    ownerPhone: { type: String, default: '' },
    isPremium: { type: Boolean, default: false },
    rejectionReason: { type: String, default: '' },
  },
  { timestamps: true }
);

// CRITICAL: Add compound indexes for fast queries
// Index for filtering approved properties
propertySchema.index({ status: 1, createdAt: -1 });

// Index for owner's properties queries
propertySchema.index({ ownerId: 1, createdAt: -1 });

// Index for owner name queries
propertySchema.index({ ownerName: 1 });

// Index for location-based queries
propertySchema.index({ location: 1, status: 1 });

// Index for premium listings
propertySchema.index({ isPremium: 1, status: 1 });

// Index for type filtering
propertySchema.index({ type: 1, status: 1 });

// TTL index for rejected/pending properties (optional - keeps database clean)
// propertySchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 }); // 90 days

export default mongoose.model('Property', propertySchema);
