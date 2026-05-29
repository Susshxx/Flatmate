# Property Management Workflow

## Overview
This document explains how properties flow through the Flat-Mate system from creation to display.

## Property Lifecycle

### 1. **Property Creation (Owner/Landlord)**

**Endpoint:** `POST /api/properties`

**Process:**
1. Owner fills out property form with details (title, location, rent, images, etc.)
2. Frontend sends POST request to backend with property data
3. Backend creates property with `status: 'pending'`
4. Property is saved to MongoDB database
5. Owner receives confirmation message

**Required Fields:**
- title
- location
- rent
- type (Apartment, House, Flat, Studio, Room)
- area
- ownerName
- ownerId

**Response:**
```json
{
  "success": true,
  "message": "Property submitted for admin review. You will be notified once approved.",
  "property": { ...propertyData }
}
```

---

### 2. **Admin Review**

**Endpoint:** `GET /api/properties/all` (Admin only)

**Process:**
1. Admin views all properties (pending, approved, rejected)
2. Admin can filter by status, owner, type, etc.
3. Admin reviews property details

---

### 3. **Property Approval**

**Endpoint:** `PUT /api/properties/:id/approve`

**Process:**
1. Admin clicks "Approve" button
2. Backend updates property: `status: 'approved'`
3. Backend sends notification to property owner
4. Property becomes visible to public users

**Notification Sent to Owner:**
```json
{
  "type": "property_approved",
  "title": "Property Approved",
  "message": "Your property '{title}' has been approved and is now live!",
  "propertyId": "...",
  "read": false
}
```

---

### 4. **Property Rejection**

**Endpoint:** `PUT /api/properties/:id/reject`

**Process:**
1. Admin clicks "Reject" button with reason
2. Backend updates property: `status: 'rejected'`
3. Backend sends notification to property owner with rejection reason
4. Property remains hidden from public

**Notification Sent to Owner:**
```json
{
  "type": "property_rejected",
  "title": "Property Rejected",
  "message": "Your property '{title}' was rejected. Reason: {reason}",
  "propertyId": "...",
  "read": false
}
```

---

### 5. **Public Display**

**Endpoints:**
- `GET /api/properties` - Get approved properties (default)
- `GET /api/properties/approved` - Explicitly get only approved properties

**Process:**
1. User visits properties page
2. Frontend fetches properties with `status: 'approved'`
3. Only approved properties are displayed
4. Properties sorted by: Premium first, then newest

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 50)
- `type` - Filter by property type
- `location` - Filter by location (case-insensitive search)

---

### 6. **Owner Dashboard**

**Endpoint:** `GET /api/properties?ownerId={userId}`

**Process:**
1. Owner views their dashboard
2. Frontend fetches properties filtered by ownerId
3. Owner sees ALL their properties (pending, approved, rejected)
4. Owner can see status and notifications

**Property Statuses:**
- 🟡 **pending** - Waiting for admin review
- 🟢 **approved** - Live and visible to public
- 🔴 **rejected** - Not approved (with reason)
- ⚫ **unavailable** - Temporarily hidden by owner

---

## API Endpoints Summary

| Endpoint | Method | Purpose | Access |
|----------|--------|---------|--------|
| `/api/properties` | POST | Create new property | Owner/Landlord |
| `/api/properties` | GET | Get properties (filtered) | Public/Owner |
| `/api/properties/all` | GET | Get all properties | Admin |
| `/api/properties/approved` | GET | Get only approved properties | Public |
| `/api/properties/:id` | GET | Get single property | Public |
| `/api/properties/:id` | PUT | Update property | Owner |
| `/api/properties/:id/approve` | PUT | Approve property | Admin |
| `/api/properties/:id/reject` | PUT | Reject property | Admin |
| `/api/properties/:id` | DELETE | Delete property | Owner/Admin |

---

## Database Schema

```javascript
{
  title: String (required),
  location: String (required),
  latitude: Number,
  longitude: Number,
  rent: Number (required),
  beds: Number (default: 1),
  baths: Number (default: 1),
  type: String (required), // Apartment, House, Flat, Studio, Room
  area: String (required),
  status: String (enum: ['pending', 'approved', 'rejected', 'unavailable'], default: 'pending'),
  isBooked: Boolean (default: false),
  furnishing: String (default: 'Unfurnished'),
  parking: String (default: 'Not available'),
  wifi: Boolean (default: false),
  views: Number (default: 0),
  saves: Number (default: 0),
  inquiries: Number (default: 0),
  reports: Number (default: 0),
  image: String, // Main image
  images: [String], // All images
  description: String,
  amenities: [String],
  ownerName: String (required),
  ownerId: String (required),
  ownerEmail: String,
  ownerPhone: String,
  isPremium: Boolean (default: false),
  rejectionReason: String,
  createdAt: Date,
  updatedAt: Date
}
```

---

## Frontend Integration

### Creating a Property
```typescript
const response = await fetch(`${BACKEND_URL}/api/properties`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Beautiful Apartment',
    location: 'Kathmandu',
    rent: 25000,
    type: 'Apartment',
    area: '1200 sq ft',
    ownerName: 'John Doe',
    ownerId: userId,
    // ... other fields
  })
});
```

### Fetching Approved Properties (Public)
```typescript
const response = await fetch(`${BACKEND_URL}/api/properties/approved?page=1&limit=20`);
const data = await response.json();
// data.properties contains only approved properties
```

### Fetching Owner's Properties
```typescript
const response = await fetch(`${BACKEND_URL}/api/properties?ownerId=${userId}`);
const data = await response.json();
// data.properties contains all owner's properties (all statuses)
```

### Admin Approving Property
```typescript
const response = await fetch(`${BACKEND_URL}/api/properties/${propertyId}/approve`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' }
});
```

---

## Troubleshooting

### Property not showing on public page?
✅ Check property status is 'approved'
✅ Check backend logs for query filters
✅ Verify frontend is calling correct endpoint

### Owner not receiving notifications?
✅ Check ownerId is correctly set on property
✅ Check User model has notifications array
✅ Check backend logs for notification errors

### Properties not saving?
✅ Check all required fields are provided
✅ Check MongoDB connection is active
✅ Check backend logs for validation errors

---

## Testing Checklist

- [ ] Owner can create property
- [ ] Property starts with 'pending' status
- [ ] Admin can see all properties
- [ ] Admin can approve property
- [ ] Admin can reject property with reason
- [ ] Owner receives approval notification
- [ ] Owner receives rejection notification
- [ ] Approved properties show on public page
- [ ] Pending/rejected properties don't show on public page
- [ ] Owner can see all their properties in dashboard
- [ ] Property details page works for approved properties
