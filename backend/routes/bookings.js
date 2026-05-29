import express from 'express';
import Booking from '../models/Booking.js';
import Property from '../models/Property.js';
import User from '../models/User.js';

const router = express.Router();

// POST /api/bookings - Create new booking
router.post('/', async (req, res) => {
  try {
    console.log('📝 Creating new booking:', req.body);
    
    const {
      propertyId,
      propertyTitle,
      propertyLocation,
      ownerName,
      ownerId,
      ownerEmail,
      ownerPhone,
      tenantName,
      tenantId,
      tenantEmail,
      tenantPhone,
      checkInDate,
      checkOutDate,
      rent,
      amount,
      paymentMethod,
      paymentType,
      transactionId,
      receiptId,
      moveInDate,
      specialRequests
    } = req.body;

    // Validation
    if (!propertyId || !propertyTitle || !tenantName || !tenantEmail || !tenantPhone || !checkInDate || !amount || !paymentMethod || !paymentType || !receiptId) {
      console.error('❌ Missing required fields for booking');
      return res.status(400).json({
        success: false,
        message: 'Required fields are missing'
      });
    }

    // Check if property already has a pending or confirmed booking
    const existingBooking = await Booking.findOne({
      propertyId,
      status: { $in: ['pending', 'confirmed'] }
    });

    if (existingBooking) {
      console.log('⚠️ Property already has a pending booking:', propertyId);
      return res.status(400).json({
        success: false,
        message: 'This property already has a pending booking. Please wait for landlord confirmation.',
        hasExistingBooking: true
      });
    }

    // Create booking
    const booking = await Booking.create({
      propertyId,
      propertyTitle,
      propertyLocation: propertyLocation || '',
      ownerName: ownerName || '',
      ownerId: ownerId || '',
      ownerEmail: ownerEmail || '',
      ownerPhone: ownerPhone || '',
      tenantName,
      tenantId: tenantId || '',
      tenantEmail,
      tenantPhone,
      checkInDate: new Date(checkInDate),
      checkOutDate: checkOutDate ? new Date(checkOutDate) : new Date(new Date(checkInDate).setMonth(new Date(checkInDate).getMonth() + 1)),
      rent: rent || 0,
      amount,
      paymentMethod,
      paymentType,
      paymentStatus: paymentMethod === 'Cash' ? 'pending' : 'on_hold', // Cash is pending, online payment is on hold
      transactionId: transactionId || '',
      receiptId,
      moveInDate: moveInDate || '',
      specialRequests: specialRequests || '',
      status: 'pending'
    });

    console.log('✅ Booking created successfully:', {
      id: booking._id,
      propertyTitle: booking.propertyTitle,
      tenantName: booking.tenantName,
      status: booking.status,
      paymentStatus: booking.paymentStatus
    });

    // Send notification to owner
    if (ownerId) {
      try {
        const owner = await User.findById(ownerId);
        if (owner) {
          const notification = {
            id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'booking_request',
            title: 'New Booking Request',
            message: `${tenantName} wants to book "${propertyTitle}". Please review and confirm.`,
            propertyId,
            propertyTitle,
            read: false,
            createdAt: new Date()
          };
          owner.notifications = owner.notifications || [];
          owner.notifications.unshift(notification);
          await owner.save();
          console.log('✅ Notification sent to owner:', owner.email);
        }
      } catch (error) {
        console.error('❌ Error sending notification:', error);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Booking request submitted successfully. Waiting for landlord confirmation.',
      booking: {
        id: booking._id.toString(),
        _id: booking._id.toString(),
        ...booking.toObject()
      }
    });

  } catch (error) {
    console.error('❌ Booking creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// GET /api/bookings - Get all bookings (with filters)
router.get('/', async (req, res) => {
  try {
    const { ownerId, tenantId, propertyId, status } = req.query;
    
    console.log('📋 Fetching bookings with filters:', { ownerId, tenantId, propertyId, status });
    
    let query = {};
    if (ownerId) query.ownerId = ownerId;
    if (tenantId) query.tenantId = tenantId;
    if (propertyId) query.propertyId = propertyId;
    if (status) query.status = status;

    const bookings = await Booking.find(query).sort({ createdAt: -1 });

    console.log(`✅ Found ${bookings.length} bookings`);

    res.json({
      success: true,
      bookings: bookings.map(b => ({
        id: b._id.toString(),
        _id: b._id.toString(),
        ...b.toObject()
      }))
    });
  } catch (error) {
    console.error('❌ Error fetching bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// GET /api/bookings/:id - Get single booking
router.get('/:id', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    res.json({
      success: true,
      booking: {
        id: booking._id.toString(),
        _id: booking._id.toString(),
        ...booking.toObject()
      }
    });
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// PUT /api/bookings/:id/confirm - Confirm booking (landlord)
router.put('/:id/confirm', async (req, res) => {
  try {
    console.log('✅ Confirming booking:', req.params.id);
    
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      console.error('❌ Booking not found:', req.params.id);
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    booking.status = 'confirmed';
    booking.paymentStatus = 'completed'; // Payment is now completed
    await booking.save();

    console.log('✅ Booking confirmed, updating property status');

    // Update property status to unavailable
    await Property.findByIdAndUpdate(booking.propertyId, {
      status: 'unavailable',
      isBooked: true
    });

    // Reject all other pending bookings for this property
    const rejectedCount = await Booking.updateMany(
      {
        propertyId: booking.propertyId,
        _id: { $ne: booking._id },
        status: 'pending'
      },
      {
        status: 'rejected',
        paymentStatus: 'refunded', // Refund other bookings
        rejectionReason: 'Property already booked by another tenant'
      }
    );

    console.log(`✅ Rejected ${rejectedCount.modifiedCount} other pending bookings`);

    // Send notification to tenant
    if (booking.tenantId) {
      try {
        const tenant = await User.findById(booking.tenantId);
        if (tenant) {
          const notification = {
            id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'booking_confirmed',
            title: 'Booking Confirmed!',
            message: `Your booking for "${booking.propertyTitle}" has been confirmed by the landlord. Payment completed.`,
            propertyId: booking.propertyId,
            propertyTitle: booking.propertyTitle,
            read: false,
            createdAt: new Date()
          };
          tenant.notifications = tenant.notifications || [];
          tenant.notifications.unshift(notification);
          await tenant.save();
          console.log('✅ Notification sent to tenant:', tenant.email);
        }
      } catch (error) {
        console.error('❌ Error sending notification:', error);
      }
    }

    res.json({
      success: true,
      message: 'Booking confirmed and payment completed successfully',
      booking: {
        id: booking._id.toString(),
        _id: booking._id.toString(),
        ...booking.toObject()
      }
    });
  } catch (error) {
    console.error('❌ Error confirming booking:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// PUT /api/bookings/:id/reject - Reject booking (landlord)
router.put('/:id/reject', async (req, res) => {
  try {
    const { reason } = req.body;
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    booking.status = 'rejected';
    booking.paymentStatus = 'refunded'; // Refund the payment
    booking.rejectionReason = reason || 'Not specified';
    await booking.save();

    // Send notification to tenant
    if (booking.tenantId) {
      try {
        const tenant = await User.findById(booking.tenantId);
        if (tenant) {
          const notification = {
            id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'booking_rejected',
            title: 'Booking Rejected',
            message: `Your booking for "${booking.propertyTitle}" was rejected. Payment will be refunded. Reason: ${reason || 'Not specified'}`,
            propertyId: booking.propertyId,
            propertyTitle: booking.propertyTitle,
            read: false,
            createdAt: new Date()
          };
          tenant.notifications = tenant.notifications || [];
          tenant.notifications.unshift(notification);
          await tenant.save();
        }
      } catch (error) {
        console.error('Error sending notification:', error);
      }
    }

    res.json({
      success: true,
      message: 'Booking rejected and payment refunded',
      booking: {
        id: booking._id.toString(),
        _id: booking._id.toString(),
        ...booking.toObject()
      }
    });
  } catch (error) {
    console.error('Error rejecting booking:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// DELETE /api/bookings/:id - Cancel booking
router.delete('/:id', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // If booking was confirmed, make property available again
    if (booking.status === 'confirmed') {
      await Property.findByIdAndUpdate(booking.propertyId, {
        status: 'approved',
        isBooked: false
      });
    }

    await Booking.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Booking cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

export default router;