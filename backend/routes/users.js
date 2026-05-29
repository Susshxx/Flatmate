// routes/users.js
import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

const router = express.Router();

// POST /api/users - Create new user (Admin only)
router.post('/', async (req, res) => {
  try {
    const { firstName, lastName, email, phone, role, status } = req.body;

    // Validation
    if (!firstName || !lastName || !email) {
      return res.status(400).json({ 
        success: false, 
        message: 'First name, last name, and email are required' 
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email already exists' 
      });
    }

    // Map 'owner' role to 'landlord' for database
    let userRole = role || 'tenant';
    if (userRole === 'owner') {
      userRole = 'landlord';
    }

    // Validate role
    if (!['tenant', 'landlord', 'admin'].includes(userRole)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid role. Must be tenant, landlord, or admin' 
      });
    }

    // Create new user with default password
    const defaultPassword = 'password123'; // User should change this on first login
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(defaultPassword, salt);

    const newUser = new User({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      phone: phone || '',
      password: hashedPassword,
      role: userRole,
      isVerified: status === 'active' ? true : false,
      isGoogleUser: false
    });

    await newUser.save();

    // Map 'landlord' back to 'owner' for frontend
    const displayRole = newUser.role === 'landlord' ? 'owner' : newUser.role;

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: {
        id: newUser._id.toString(),
        _id: newUser._id.toString(),
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        phone: newUser.phone || 'N/A',
        role: displayRole,
        status: newUser.isVerified ? 'active' : 'pending',
        joined: newUser.createdAt.toISOString().split('T')[0],
        lastAccess: newUser.updatedAt.toISOString().split('T')[0],
        reports: 0,
        billings: 0,
        bookings: 0,
        muted: false,
        blocked: newUser.blocked || false,
        blockReason: newUser.blockReason || '',
        archived: false,
        reportReason: '',
        isGoogleUser: false
      }
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// GET /api/users - Get all verified users (excluding admins)
router.get('/', async (req, res) => {
  try {
    const users = await User.find({ isVerified: true, role: { $ne: 'admin' } })
      .select('-password -otp -otpExpiry -loginOtp -loginOtpExpiry -googleId')
      .sort({ createdAt: -1 });

    const formattedUsers = users.map(user => ({
      id: user._id.toString(),
      _id: user._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone || 'N/A',
      role: user.role === 'landlord' ? 'owner' : user.role,
      status: 'active',
      joined: user.createdAt.toISOString().split('T')[0],
      lastAccess: user.updatedAt.toISOString().split('T')[0],
      reports: 0,
      billings: 0,
      bookings: 0,
      muted: false,
      blocked: user.blocked || false,
      blockReason: user.blockReason || '',
      archived: false,
      reportReason: user.blockReason || '',
      isGoogleUser: user.isGoogleUser || false
    }));

    res.json({
      success: true,
      users: formattedUsers
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// GET /api/users/:id - Get single user
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -otp -otpExpiry -loginOtp -loginOtpExpiry -googleId');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      user: {
        id: user._id.toString(),
        _id: user._id.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone || 'N/A',
        role: user.role,
        status: user.isVerified ? 'active' : 'pending',
        isVerified: user.isVerified || false,
        joined: user.createdAt.toISOString().split('T')[0],
        lastAccess: user.updatedAt.toISOString().split('T')[0],
        isGoogleUser: user.isGoogleUser || false
      }
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// GET /api/users/email/:email - Get user by email
router.get('/email/:email', async (req, res) => {
  try {
    const email = req.params.email.toLowerCase().trim();
    const user = await User.findOne({ email })
      .select('-password -otp -otpExpiry -loginOtp -loginOtpExpiry -googleId');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      user: {
        id: user._id.toString(),
        _id: user._id.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone || 'N/A',
        role: user.role,
        profilePicture: user.profilePicture || null,
        status: user.isVerified ? 'active' : 'pending',
        joined: user.createdAt.toISOString().split('T')[0],
        lastAccess: user.updatedAt.toISOString().split('T')[0],
        isGoogleUser: user.isGoogleUser || false
      }
    });
  } catch (error) {
    console.error('Error fetching user by email:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// PUT /api/users/:id - Update user
router.put('/:id', async (req, res) => {
  try {
    const { firstName, lastName, email, role, phone, isVerified, blocked, blockReason } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (email) user.email = email.toLowerCase().trim();
    if (role) user.role = role;
    if (phone !== undefined) user.phone = phone;
    if (isVerified !== undefined) user.isVerified = isVerified;
    if (blocked !== undefined) user.blocked = blocked;
    if (blockReason !== undefined) user.blockReason = blockReason;

    await user.save();

    res.json({
      success: true,
      message: 'User updated successfully',
      user: {
        id: user._id.toString(),
        _id: user._id.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone || 'N/A',
        role: user.role,
        status: user.isVerified ? 'active' : 'pending',
        blocked: user.blocked || false,
        blockReason: user.blockReason || null
      }
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// DELETE /api/users/:id - Delete user
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// PUT /api/users/:id/profile - Update user profile (including profile picture)
router.put('/:id/profile', async (req, res) => {
  try {
    const { firstName, lastName, email, role, phone, profilePicture } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if email is being changed and if it's already taken
    if (email && email.toLowerCase().trim() !== user.email) {
      const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'Email already in use' });
      }
    }

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (email) user.email = email.toLowerCase().trim();
    if (role) user.role = role;
    if (phone !== undefined) user.phone = phone;
    if (profilePicture !== undefined) user.profilePicture = profilePicture;

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id.toString(),
        _id: user._id.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone || 'N/A',
        role: user.role,
        profilePicture: user.profilePicture
      }
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// PUT /api/users/:id/password - Update user password
router.put('/:id/password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Current password and new password are required' 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'New password must be at least 6 characters long' 
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ 
        success: false, 
        message: 'Current password is incorrect' 
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    await user.save();

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// PUT /api/users/email/:email - Update user by email (for profile updates)
router.put('/email/:email', async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    const email = req.params.email.toLowerCase().trim();

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Update name (split into firstName and lastName)
    if (name) {
      const nameParts = name.trim().split(' ');
      user.firstName = nameParts[0] || '';
      user.lastName = nameParts.slice(1).join(' ') || '';
    }

    // Update other fields if provided
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address;

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        name: `${user.firstName} ${user.lastName}`.trim(),
        email: user.email,
        phone: user.phone,
        address: user.address
      }
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// GET /api/users/:id/notifications - Get user notifications
router.get('/:id/notifications', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('notifications');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      notifications: user.notifications || []
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// PUT /api/users/:id/notifications/:notificationId/read - Mark notification as read
router.put('/:id/notifications/:notificationId/read', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const notification = user.notifications.find(n => n.id === req.params.notificationId);
    if (notification) {
      notification.read = true;
      await user.save();
    }

    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// PUT /api/users/:id/notifications/mark-all-read - Mark all notifications as read
router.put('/:id/notifications/mark-all-read', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.notifications && user.notifications.length > 0) {
      user.notifications.forEach(notification => {
        notification.read = true;
      });
      await user.save();
    }

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// DELETE /api/users/:id/notifications - Clear all notifications
router.delete('/:id/notifications', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.notifications = [];
    await user.save();

    res.json({
      success: true,
      message: 'All notifications cleared'
    });
  } catch (error) {
    console.error('Error clearing notifications:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

export default router;
