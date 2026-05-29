// routes/auth.js
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ─── Email Transporter ────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const sendOTPEmail = async (email, otp, subject) => {
  await transporter.sendMail({
    from: `"Flat-Mate" <${process.env.EMAIL_USER}>`,
    to: email,
    subject,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px;border-radius:12px;border:1px solid #e2e8f0;">
        <h2 style="color:#1a202c;margin-bottom:8px;">Flat-Mate Verification</h2>
        <p style="color:#718096;margin-bottom:24px;">Use the code below. It expires in <strong>10 minutes</strong>.</p>
        <div style="background:#f7fafc;border-radius:8px;padding:24px;text-align:center;letter-spacing:12px;font-size:32px;font-weight:bold;color:#2d7a5c;">
          ${otp}
        </div>
        <p style="color:#a0aec0;font-size:12px;margin-top:24px;">If you didn't request this, ignore this email.</p>
      </div>
    `,
  });
};

// ═══════════════════════════════════════════════════════════════════════════════
// SIGNUP
// ═══════════════════════════════════════════════════════════════════════════════
router.post('/signup', async (req, res) => {
  try {
    let { firstName, lastName, email, password, role } = req.body;
    email = email.trim().toLowerCase();

    const existingUser = await User.findOne({ email });

    if (existingUser && existingUser.isVerified) {
      return res.status(400).json({ message: 'An account with this email already exists. Please log in.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    if (existingUser && !existingUser.isVerified) {
      existingUser.firstName = firstName;
      existingUser.lastName = lastName;
      existingUser.password = hashedPassword;
      existingUser.role = role || 'tenant';
      existingUser.otp = otp;
      existingUser.otpExpiry = otpExpiry;
      await existingUser.save();
    } else {
      await User.create({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        role: role || 'tenant',
        isVerified: false,
        otp,
        otpExpiry,
      });
    }

    await sendOTPEmail(email, otp, 'Verify Your Flat-Mate Account');
    res.status(200).json({ message: 'OTP sent to your email.' });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// VERIFY OTP (signup)
// ═══════════════════════════════════════════════════════════════════════════════
router.post('/verify-otp', async (req, res) => {
  try {
    let { email, otp } = req.body;
    email = email.trim().toLowerCase();

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found.' });
    if (user.otp !== otp) return res.status(400).json({ message: 'Invalid OTP.' });
    if (!user.otpExpiry || new Date() > user.otpExpiry) {
      return res.status(400).json({ message: 'OTP expired. Please request a new one.' });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    res.status(200).json({
      message: 'Account verified successfully.',
      user: {
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('OTP verify error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// RESEND OTP (signup)
// ═══════════════════════════════════════════════════════════════════════════════
router.post('/resend-otp', async (req, res) => {
  try {
    let { email } = req.body;
    email = email.trim().toLowerCase();

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await sendOTPEmail(email, otp, 'Your New Verification Code');
    res.status(200).json({ message: 'OTP resent.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// LOGIN
// ═══════════════════════════════════════════════════════════════════════════════
router.post('/login', async (req, res) => {
  try {
    let { email, password, role } = req.body;
    email = email.trim().toLowerCase();

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'No account found with this email.' });

    if (!user.isVerified) {
      return res.status(403).json({
        message: 'Please verify your email before logging in.',
        notVerified: true,
      });
    }

    // Validate that the user's role matches what they selected
    if (role) {
      const normalizedRole = role === 'owner' ? 'landlord' : role;
      const userRole = user.role === 'owner' ? 'landlord' : user.role;
      if (normalizedRole !== userRole) {
        return res.status(403).json({
          message: `This account is registered as a ${user.role}, not a ${role}. Please select the correct role.`,
          wrongRole: true,
        });
      }
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Incorrect password.' });

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      message: 'Login successful.',
      token,
      user: {
        id: user._id.toString(),
        _id: user._id.toString(),
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture || null,
        phone: user.phone || null,
        isVerified: user.isVerified || false
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// VERIFY LOGIN OTP
// ═══════════════════════════════════════════════════════════════════════════════
router.post('/verify-login-otp', async (req, res) => {
  try {
    let { email, otp } = req.body;
    email = email.trim().toLowerCase();

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found.' });
    if (user.loginOtp !== otp) return res.status(400).json({ message: 'Invalid OTP.' });
    if (!user.loginOtpExpiry || new Date() > user.loginOtpExpiry) {
      return res.status(400).json({ message: 'OTP expired. Please log in again.' });
    }

    user.loginOtp = undefined;
    user.loginOtpExpiry = undefined;
    await user.save();

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      message: 'Login successful.',
      token,
      user: {
        id: user._id.toString(),
        _id: user._id.toString(),
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture || null,
        phone: user.phone || null,
        isVerified: user.isVerified || false
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});
// ═══════════════════════════════════════════════════════════════════════════════
router.post('/resend-login-otp', async (req, res) => {
  try {
    let { email } = req.body;
    email = email.trim().toLowerCase();

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const otp = generateOTP();
    user.loginOtp = otp;
    user.loginOtpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await sendOTPEmail(email, otp, 'Your New Login Code');
    res.status(200).json({ message: 'OTP resent.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// GOOGLE SIGNUP
// ═══════════════════════════════════════════════════════════════════════════════
router.post('/google-signup', async (req, res) => {
  try {
    const { idToken, role } = req.body;

    console.log('🔐 Google signup attempt with role:', role);

    if (!idToken) {
      return res.status(400).json({ message: 'ID token is required.' });
    }

    if (!process.env.GOOGLE_CLIENT_ID) {
      console.error('❌ GOOGLE_CLIENT_ID not configured in environment variables');
      return res.status(500).json({ message: 'Google authentication not configured.' });
    }

    let ticket, payload;
    try {
      ticket = await client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch (verifyError) {
      console.error('❌ Google token verification failed:', verifyError.message);
      return res.status(401).json({ message: 'Invalid Google token.' });
    }

    const email = payload.email.toLowerCase();
    const firstName = payload.given_name || payload.name.split(' ')[0];
    const lastName = payload.family_name || payload.name.split(' ').slice(1).join(' ') || firstName;

    console.log('✅ Google token verified for:', email);

    const existingUser = await User.findOne({ email });
    if (existingUser && existingUser.isVerified) {
      console.log('⚠️ User already exists:', email);
      return res.status(400).json({ message: 'Account already exists. Please log in instead.' });
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    if (existingUser) {
      existingUser.firstName = firstName;
      existingUser.lastName = lastName;
      existingUser.role = role || 'tenant';
      existingUser.isGoogleUser = true;
      existingUser.googleId = payload.sub;
      existingUser.otp = otp;
      existingUser.otpExpiry = otpExpiry;
      await existingUser.save();
      console.log('✅ Updated existing unverified user:', email);
    } else {
      await User.create({
        firstName,
        lastName,
        email,
        password: await bcrypt.hash(Math.random().toString(36), 10),
        role: role || 'tenant',
        isVerified: false,
        isGoogleUser: true,
        googleId: payload.sub,
        otp,
        otpExpiry,
      });
      console.log('✅ Created new user:', email);
    }

    await sendOTPEmail(email, otp, 'Verify Your Flat-Mate Account');
    console.log('✅ OTP sent to:', email);

    res.status(200).json({
      message: 'OTP sent.',
      user: { name: `${firstName} ${lastName}`, email },
    });
  } catch (error) {
    console.error('❌ Google signup error:', error);
    res.status(500).json({ 
      message: 'Google signup failed.', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// VERIFY GOOGLE SIGNUP OTP
// ═══════════════════════════════════════════════════════════════════════════════
router.post('/verify-google-otp', async (req, res) => {
  try {
    let { email, otp } = req.body;
    email = email.trim().toLowerCase();

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found.' });
    if (user.otp !== otp) return res.status(400).json({ message: 'Invalid OTP.' });
    if (!user.otpExpiry || new Date() > user.otpExpiry) {
      return res.status(400).json({ message: 'OTP expired.' });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    res.status(200).json({
      message: 'Account verified.',
      user: { name: `${user.firstName} ${user.lastName}`, email: user.email, role: user.role },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// GOOGLE LOGIN (Auto-register if user doesn't exist)
// ═══════════════════════════════════════════════════════════════════════════════
router.post('/google-login', async (req, res) => {
  try {
    const { idToken, role } = req.body;

    console.log('🔐 Google login attempt with role:', role);

    if (!idToken) {
      return res.status(400).json({ message: 'ID token is required.' });
    }

    if (!process.env.GOOGLE_CLIENT_ID) {
      console.error('❌ GOOGLE_CLIENT_ID not configured in environment variables');
      return res.status(500).json({ message: 'Google authentication not configured.' });
    }

    let ticket, payload;
    try {
      ticket = await client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch (verifyError) {
      console.error('❌ Google token verification failed:', verifyError.message);
      return res.status(401).json({ message: 'Invalid Google token.' });
    }

    const email = payload.email.toLowerCase();
    const firstName = payload.given_name || payload.name.split(' ')[0];
    const lastName = payload.family_name || payload.name.split(' ').slice(1).join(' ') || firstName;
    const googleId = payload.sub;

    console.log('✅ Google token verified for:', email);

    let user = await User.findOne({ email });

    // If user doesn't exist, auto-register them with Google
    if (!user) {
      user = await User.create({
        firstName,
        lastName,
        email,
        password: await bcrypt.hash(Math.random().toString(36), 10), // Random password (not used)
        role: role || 'tenant',
        isVerified: true, // Auto-verify Google users
        isGoogleUser: true,
        googleId,
      });
      console.log('✅ New Google user auto-registered:', email, 'with role:', user.role);
    } else if (!user.isVerified) {
      // If user exists but not verified, verify them now
      user.isVerified = true;
      user.isGoogleUser = true;
      user.googleId = googleId;
      await user.save();
      console.log('✅ Existing unverified user verified via Google:', email);
    } else {
      console.log('✅ Existing verified user logging in:', email);
    }

    // ✅ Validate that the user's role matches what they selected
    if (role) {
      const normalizedRole = role === 'owner' ? 'landlord' : role;
      const userRole = user.role === 'owner' ? 'landlord' : user.role;
      if (normalizedRole !== userRole) {
        console.log('⚠️ Role mismatch: user is', user.role, 'but selected', role);
        return res.status(403).json({
          message: `This account is registered as a ${user.role}, not a ${role}. Please select the correct role.`,
          wrongRole: true,
        });
      }
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('✅ Login successful for:', email);

    res.status(200).json({
      message: 'Login successful.',
      token,
      user: {
        id: user._id.toString(),
        _id: user._id.toString(),
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture || null,
        phone: user.phone || null,
        isVerified: user.isVerified || false
      },
    });
  } catch (error) {
    console.error('❌ Google login error:', error);
    res.status(500).json({ 
      message: 'Google login failed.', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// VERIFY GOOGLE LOGIN OTP
// ═══════════════════════════════════════════════════════════════════════════════
router.post('/verify-google-login-otp', async (req, res) => {
  try {
    let { email, otp } = req.body;
    email = email.trim().toLowerCase();

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found.' });
    if (user.loginOtp !== otp) return res.status(400).json({ message: 'Invalid OTP.' });
    if (!user.loginOtpExpiry || new Date() > user.loginOtpExpiry) {
      return res.status(400).json({ message: 'OTP expired.' });
    }

    user.loginOtp = undefined;
    user.loginOtpExpiry = undefined;
    await user.save();

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      message: 'Login successful.',
      token,
      user: {
        id: user._id.toString(),
        _id: user._id.toString(),
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture || null,
        phone: user.phone || null,
        isVerified: user.isVerified || false
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// FORGOT PASSWORD
// ═══════════════════════════════════════════════════════════════════════════════
router.post('/forgot-password', async (req, res) => {
  try {
    let { email } = req.body;
    email = email.trim().toLowerCase();

    const user = await User.findOne({ email, isVerified: true });
    if (!user) return res.status(404).json({ message: 'No verified account found with this email.' });

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await sendOTPEmail(email, otp, 'Reset Your Flat-Mate Password');
    res.status(200).json({ message: 'OTP sent to your email.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// VERIFY FORGOT PASSWORD OTP
// ═══════════════════════════════════════════════════════════════════════════════
router.post('/verify-forgot-otp', async (req, res) => {
  try {
    let { email, otp } = req.body;
    email = email.trim().toLowerCase();

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found.' });
    if (user.otp !== otp) return res.status(400).json({ message: 'Invalid OTP.' });
    if (!user.otpExpiry || new Date() > user.otpExpiry) {
      return res.status(400).json({ message: 'OTP expired.' });
    }

    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    res.status(200).json({ message: 'OTP verified.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// RESET PASSWORD
// ═══════════════════════════════════════════════════════════════════════════════
router.post('/reset-password', async (req, res) => {
  try {
    let { email, newPassword } = req.body;
    email = email.trim().toLowerCase();

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found.' });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.status(200).json({ message: 'Password reset successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

export default router;