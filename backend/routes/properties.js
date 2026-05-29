import express from 'express';
import Property from '../models/Property.js';

const router = express.Router();

// POST /api/properties - Create new property
router.post('/', async (req, res) => {
  try {
    console.log('📝 Creating new property:', req.body.title);
    
    const { title, location, latitude, longitude, rent, beds, baths, type, area, furnishing, parking, wifi, description, amenities, image, images, ownerName, ownerId, ownerEmail, ownerPhone, isPremium } = req.body;

    // Validate required fields
    if (!title || !location || !rent || !type || !area || !ownerName || !ownerId) {
      console.error('❌ Missing required fields:', { title: !!title, location: !!location, rent: !!rent, type: !!type, area: !!area, ownerName: !!ownerName, ownerId: !!ownerId });
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Ensure images array exists and has at least one image
    const propertyImages = images && images.length > 0 
      ? images 
      : (image ? [image] : ['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop']);

    const property = await Property.create({
      title,
      location,
      latitude: latitude || null,
      longitude: longitude || null,
      rent,
      beds: beds || 1,
      baths: baths || 1,
      type,
      area,
      furnishing: furnishing || 'Unfurnished',
      parking: parking || 'Not available',
      wifi: wifi || false,
      description: description || '',
      amenities: amenities || [],
      image: propertyImages[0], // First image as main image
      images: propertyImages,
      ownerName,
      ownerEmail: ownerEmail || '',
      ownerPhone: ownerPhone || '',
      ownerId,
      isPremium: isPremium || false,
      status: 'pending'
    });

    console.log('✅ Property created successfully:', {
      id: property._id,
      title: property.title,
      status: property.status,
      ownerId: property.ownerId,
      ownerName: property.ownerName,
      latitude: property.latitude,
      longitude: property.longitude
    });

    res.status(201).json({ 
      success: true,
      message: 'Property submitted for admin review. You will be notified once approved.', 
      property: {
        id: property._id.toString(),
        _id: property._id.toString(),
        ...property.toObject()
      }
    });
  } catch (error) {
    console.error('❌ Error creating property:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// IMPORTANT: /all route MUST come before /:id route to prevent "all" being treated as an ID
// GET /api/properties/all - Get all properties (for admin)
router.get('/all', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const skip = (page - 1) * limit;

    console.log('📋 Admin fetching all properties (page:', page, ')');

    const properties = await Property.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(); // Use lean() for faster reads

    const total = await Property.countDocuments({});

    console.log(`✅ Admin query returned ${properties.length} properties (total: ${total})`);

    res.json({
      success: true,
      properties: properties.map(p => ({
        id: p._id.toString(),
        _id: p._id.toString(),
        ...p
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('❌ Error fetching all properties:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// GET /api/properties/approved - Get only approved properties (for public)
router.get('/approved', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    const { type, location } = req.query;

    console.log('📋 Public fetching approved properties');

    let query = { status: 'approved' };
    
    if (type) {
      query.type = type;
    }
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }

    const properties = await Property.find(query)
      .sort({ isPremium: -1, createdAt: -1 }) // Premium first, then newest
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Property.countDocuments(query);

    console.log(`✅ Public query returned ${properties.length} approved properties (total: ${total})`);

    res.json({
      success: true,
      properties: properties.map(p => ({
        id: p._id.toString(),
        _id: p._id.toString(),
        ...p
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('❌ Error fetching approved properties:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// GET /api/properties - Get properties (with filters)
router.get('/', async (req, res) => {
  try {
    const { status, ownerId, ownerName, type, location, page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    console.log('📋 Fetching properties with filters:', { status, ownerId, ownerName, type, location, page, limit });
    
    let query = {};
    
    // If no status specified, only show approved properties (for public)
    if (status) {
      query.status = status;
    } else if (!ownerId && !ownerName) {
      query.status = 'approved';
      console.log('🔍 Public query - showing only approved properties');
    }
    
    // Filter by owner
    if (ownerId) {
      query.ownerId = ownerId;
      console.log('🔍 Filtering by ownerId:', ownerId);
    }
    if (ownerName) {
      query.ownerName = ownerName;
      console.log('🔍 Filtering by ownerName:', ownerName);
    }
    
    // Filter by type
    if (type) {
      query.type = type;
    }
    
    // Filter by location
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }
    
    const properties = await Property.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(); // Use lean() for faster reads

    const total = await Property.countDocuments(query);
    
    console.log(`✅ Found ${properties.length} properties (total: ${total})`);
    
    res.json({
      success: true,
      properties: properties.map(p => ({
        id: p._id.toString(),
        _id: p._id.toString(),
        ...p
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('❌ Error fetching properties:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// GET /api/properties/:id - Get single property
router.get('/:id', async (req, res) => {
  try {
    // Validate MongoDB ObjectId format to avoid false matches
    const { id } = req.params;
    
    // Check if id looks like a MongoDB ObjectId (24 hex characters)
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({ success: false, message: 'Invalid property ID format' });
    }

    const property = await Property.findById(id).lean();
    if (!property) {
      console.warn(`Property not found for ID: ${id}`);
      return res.status(404).json({ success: false, message: 'Property not found' });
    }
    res.json({
      success: true,
      property: {
        id: property._id.toString(),
        _id: property._id.toString(),
        ...property
      }
    });
  } catch (error) {
    console.error('Error fetching property:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// PUT /api/properties/:id - Update property
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate MongoDB ObjectId format
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({ success: false, message: 'Invalid property ID format' });
    }

    const property = await Property.findById(id);
    
    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }

    const updatedProperty = await Property.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    console.log('Property updated:', updatedProperty._id);

    res.json({ 
      success: true,
      message: 'Property updated successfully', 
      property: {
        id: updatedProperty._id.toString(),
        _id: updatedProperty._id.toString(),
        ...updatedProperty.toObject()
      }
    });
  } catch (error) {
    console.error('Error updating property:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// PUT /api/properties/:id/approve - Approve property
router.put('/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate MongoDB ObjectId format
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({ success: false, message: 'Invalid property ID format' });
    }

    const property = await Property.findByIdAndUpdate(
      id,
      { status: 'approved', rejectionReason: '' },
      { new: true }
    );

    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }

    // Send notification to property owner
    if (property.ownerId) {
      try {
        const User = (await import('../models/User.js')).default;
        console.log('Looking for owner with ID:', property.ownerId);
        const owner = await User.findById(property.ownerId);
        
        if (owner) {
          const notification = {
            id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'property_approved',
            title: 'Property Approved',
            message: `Your property "${property.title}" has been approved and is now live!`,
            propertyId: property._id.toString(),
            propertyTitle: property.title,
            read: false,
            createdAt: new Date()
          };

          owner.notifications = owner.notifications || [];
          owner.notifications.unshift(notification);
          await owner.save();

          console.log('✅ Notification sent to owner:', owner.email, 'Total notifications:', owner.notifications.length);
        } else {
          console.log('⚠️ Owner not found in database with ID:', property.ownerId);
          console.log('Property owner details:', { ownerName: property.ownerName, ownerEmail: property.ownerEmail });
        }
      } catch (notifError) {
        console.error('❌ Error sending notification:', notifError);
      }
    } else {
      console.log('⚠️ Property has no ownerId:', property._id);
    }

    console.log('Property approved:', property._id);

    res.json({ 
      success: true,
      message: 'Property approved successfully', 
      property: {
        id: property._id.toString(),
        _id: property._id.toString(),
        ...property.toObject()
      }
    });
  } catch (error) {
    console.error('Error approving property:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// PUT /api/properties/:id/reject - Reject property
router.put('/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    // Validate MongoDB ObjectId format
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({ success: false, message: 'Invalid property ID format' });
    }

    const property = await Property.findByIdAndUpdate(
      id,
      { status: 'rejected', rejectionReason: reason || 'Not specified' },
      { new: true }
    );

    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }

    // Send notification to property owner
    if (property.ownerId) {
      try {
        const User = (await import('../models/User.js')).default;
        console.log('Looking for owner with ID:', property.ownerId);
        const owner = await User.findById(property.ownerId);
        
        if (owner) {
          const notification = {
            id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'property_rejected',
            title: 'Property Rejected',
            message: `Your property "${property.title}" was rejected. Reason: ${reason || 'Not specified'}`,
            propertyId: property._id.toString(),
            propertyTitle: property.title,
            read: false,
            createdAt: new Date()
          };

          owner.notifications = owner.notifications || [];
          owner.notifications.unshift(notification);
          await owner.save();

          console.log('✅ Rejection notification sent to owner:', owner.email, 'Total notifications:', owner.notifications.length);
        } else {
          console.log('⚠️ Owner not found in database with ID:', property.ownerId);
          console.log('Property owner details:', { ownerName: property.ownerName, ownerEmail: property.ownerEmail });
        }
      } catch (notifError) {
        console.error('❌ Error sending notification:', notifError);
      }
    } else {
      console.log('⚠️ Property has no ownerId:', property._id);
    }

    console.log('Property rejected:', property._id);

    res.json({ 
      success: true,
      message: 'Property rejected successfully', 
      property: {
        id: property._id.toString(),
        _id: property._id.toString(),
        ...property.toObject()
      }
    });
  } catch (error) {
    console.error('Error rejecting property:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// DELETE /api/properties/:id - Delete property
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate MongoDB ObjectId format
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({ success: false, message: 'Invalid property ID format' });
    }

    const property = await Property.findById(id);
    
    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }

    const propertyTitle = property.title;
    const ownerName = property.ownerName;

    await Property.findByIdAndDelete(id);

    console.log('Property deleted:', id);

    res.json({ 
      success: true,
      message: 'Property deleted successfully',
      notification: {
        type: 'property_deleted',
        title: 'Property Deleted',
        message: `${ownerName} deleted property: "${propertyTitle}"`,
        propertyId: id
      }
    });
  } catch (error) {
    console.error('Error deleting property:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

export default router;
