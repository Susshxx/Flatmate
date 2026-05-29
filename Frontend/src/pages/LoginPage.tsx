// src/pages/LoginPage.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth, UserRole } from '../contexts/AuthContext';
import { toast } from '../utils/toast';
import {
  ShieldCheckIcon, UsersIcon, HomeIcon,
  MailIcon, LockIcon, EyeIcon, EyeOffIcon,
  CheckIcon, CheckCircleIcon, BuildingIcon,
} from 'lucide-react';

import { BACKEND_URL } from '../config/api';

const GOOGLE_CLIENT_ID = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID ?? '';
type LoginStep = 'role' | 'form' | 'otp' | 'success';

export function LoginPage() {
  const navigate = useNavigate();
  const { login, user, isAuthenticated } = useAuth();
  const [step, setStep] = useState<LoginStep>('role');

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'admin') {
        navigate('/dashboard/admin', { replace: true });
      } else if (user.role === 'landlord' || user.role === 'owner') {
        navigate('/dashboard/owner', { replace: true });
      } else if (user.role === 'tenant') {
        navigate('/', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  const [selectedRole, setSelectedRole] = useState<UserRole | ''>('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLogin, setIsGoogleLogin] = useState(false);
  const [userData, setUserData] = useState({ name: '', role: 'tenant' as UserRole });
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const acceptedTermsRef = useRef(false);
  const selectedRoleRef = useRef<UserRole | ''>('');

  const handleTermsChange = (checked: boolean) => {
    setAcceptedTerms(checked);
    acceptedTermsRef.current = checked;
  };

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    selectedRoleRef.current = role;
    setStep('form');
  };

  // ─── Google Button ───────────────────────────────────────────
  useEffect(() => {

    //user interface initialization
    if (step !== 'form') return;

    const handleCredentialResponse = async (response: any) => {
      if (!acceptedTermsRef.current) { 
        toast.error('Please accept Terms & Conditions first', {
          style: {
            background: '#ef4444',
            color: 'white',
          },
        }); 
        return; 
      }
      setIsLoading(true);
      setIsGoogleLogin(true);
      try {
        const res = await fetch(`${BACKEND_URL}/auth/google-login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken: response.credential, role: selectedRoleRef.current }),
        });
        const data = await res.json();
        if (res.ok) {
          setUserData({ name: data.user.name, role: data.user.role });
          setEmail(data.user.email);
          localStorage.setItem('token', data.token);
          localStorage.setItem('flatmate_token', data.token);
          toast.success('Login successful!', {
            style: {
              background: '#2F7D5F',
              color: 'white',
            },
          });
          setStep('success');
          setTimeout(() => {
            login(data.user.name, data.user.role, data.user.email, data.user.id);
            if (data.user.role === 'admin') navigate('/dashboard/admin');
            else if (data.user.role === 'landlord' || data.user.role === 'owner') navigate('/dashboard/owner');
            else navigate('/');
          }, 1500);
        } else {
          if (data.shouldSignup) { 
            toast.error('No account found. Please sign up.', {
              style: {
                background: '#ef4444',
                color: 'white',
              },
            }); 
            navigate('/signup'); 
          }
          else if (data.wrongRole) {
            toast.info(data.message || `This account is not a ${selectedRoleRef.current}.`, {
              style: {
                background: '#2F7D5F',
                color: 'white',
              },
            });
          }
          else {
            toast.error(data.message || 'Google login failed', {
              style: {
                background: '#ef4444',
                color: 'white',
              },
            });
          }
          setIsGoogleLogin(false);
        }
      } catch { 
        toast.error('Failed to login with Google', {
          style: {
            background: '#ef4444',
            color: 'white',
          },
        }); 
        setIsGoogleLogin(false); 
      }
      finally { setIsLoading(false); }
    };

    const renderBtn = () => {
      const g = (window as any).google;
      if (!g?.accounts?.id || !googleButtonRef.current) return;
      googleButtonRef.current.innerHTML = '';
      g.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: handleCredentialResponse, auto_select: false });
      g.accounts.id.renderButton(googleButtonRef.current, { theme: 'outline', size: 'large', width: 400, text: 'signin_with', shape: 'rectangular', logo_alignment: 'left' });
    };

    const tryRender = () => {
      if ((window as any).google?.accounts?.id) { renderBtn(); return; }
      if (!document.querySelector('script[src="https://accounts.google.com/gsi/client"]')) {
        const s = document.createElement('script');
        s.src = 'https://accounts.google.com/gsi/client';
        s.async = true; s.defer = true;
        s.onload = renderBtn;
        document.body.appendChild(s);
      } else {
        let n = 0;
        const poll = setInterval(() => {
          n++;
          if ((window as any).google?.accounts?.id) { clearInterval(poll); renderBtn(); }
          else if (n > 50) clearInterval(poll);
        }, 100);
      }
    };

    const t = setTimeout(tryRender, 300);
    return () => clearTimeout(t);
  }, [step]);

  // ─── Form Submit ─────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptedTerms) { 
      toast.error('Please accept Terms & Conditions', {
        style: {
          background: '#ef4444',
          color: 'white',
        },
      }); 
      return; 
    }
    setIsLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password, role: selectedRole }),
      });
      const data = await res.json();
      if (res.ok) {
        setUserData({ name: data.user.name, role: data.user.role });
        localStorage.setItem('token', data.token);
        localStorage.setItem('flatmate_token', data.token);
        toast.success('Login successful!', {
          style: {
            background: '#2F7D5F',
            color: 'white',
          },
        });
        setStep('success');
        setTimeout(() => {
          login(data.user.name, data.user.role, data.user.email, data.user.id, data.user.isVerified);
          if (data.user.role === 'admin') navigate('/dashboard/admin');
          else if (data.user.role === 'landlord' || data.user.role === 'owner') navigate('/dashboard/owner');
          else navigate('/');
        }, 1500);
      } else {
        if (res.status === 403 && data.notVerified) { 
          toast.error(data.message, {
            style: {
              background: '#ef4444',
              color: 'white',
            },
          }); 
          navigate('/verify-email', { state: { email } }); 
        }
        else if (data.wrongRole) {
          toast.info(data.message || `This account is not registered as a ${selectedRole}.`, {
            style: {
              background: '#2F7D5F',
              color: 'white',
            },
          });
        }
        else {
          toast.error(data.message || 'Invalid email or password', {
            style: {
              background: '#ef4444',
              color: 'white',
            },
          });
        }
      }
    } catch { 
      toast.error('Server connection failed.', {
        style: {
          background: '#ef4444',
          color: 'white',
        },
      }); 
    }
    finally { setIsLoading(false); }
  };

  // ─── OTP ─────────────────────────────────────────────────────
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const n = [...otp]; n[index] = value; setOtp(n);
    if (value && index < 5) document.getElementById(`lotp-${index + 1}`)?.focus();
  };
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) document.getElementById(`lotp-${index - 1}`)?.focus();
  };
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpValue = otp.join('');
    if (otpValue.length !== 6) { 
      toast.error('Please enter the complete OTP', {
        style: {
          background: '#ef4444',
          color: 'white',
        },
      }); 
      return; 
    }
    setIsLoading(true);
    try {
      const endpoint = isGoogleLogin ? `${BACKEND_URL}/auth/verify-google-login-otp` : `${BACKEND_URL}/auth/verify-login-otp`;
      const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, otp: otpValue }) });
      const data = await res.json();
      if (res.ok) {
        setStep('success');
        toast.success('Login successful!', {
          style: {
            background: '#2F7D5F',
            color: 'white',
          },
        });
        localStorage.setItem('token', data.token);
        localStorage.setItem('flatmate_token', data.token);
        setTimeout(() => {
          login(data.user.name, data.user.role, data.user.email, data.user.id, data.user.isVerified);
          // Route based on role
          if (data.user.role === 'admin') navigate('/dashboard/admin');
          else if (data.user.role === 'landlord' || data.user.role === 'owner') navigate('/dashboard/owner');
          else navigate('/');
        }, 1500);
      } else {
        toast.error(data.message || 'Invalid OTP', {
          style: {
            background: '#ef4444',
            color: 'white',
          },
        });
      }
    } catch { 
      toast.error('Verification failed.', {
        style: {
          background: '#ef4444',
          color: 'white',
        },
      }); 
    }
    finally { setIsLoading(false); }
  };
  const handleResendOtp = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/auth/resend-login-otp`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
      const data = await res.json();
      if (res.ok) { 
        toast.success('OTP resent!', {
          style: {
            background: '#2F7D5F',
            color: 'white',
          },
        }); 
        setOtp(['', '', '', '', '', '']); 
      }
      else {
        toast.error(data.message || 'Failed to resend', {
          style: {
            background: '#ef4444',
            color: 'white',
          },
        });
      }
    } catch { 
      toast.error('Network error', {
        style: {
          background: '#ef4444',
          color: 'white',
        },
      }); 
    }
  };

  const isOwner = selectedRole === 'landlord' || selectedRole === 'owner' || userData.role === 'landlord' || userData.role === 'owner';

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-button-primary via-primary to-button-primary">
      <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }} transition={{ duration: 4, repeat: Infinity }} className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
      <motion.div animate={{ scale: [1.2, 1, 1.2], opacity: [0.5, 0.3, 0.5] }} transition={{ duration: 5, repeat: Infinity, delay: 1 }} className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">

          {/* Left branding */}
          <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }} className="text-white space-y-8 hidden lg:block">
            <Link to="/"><motion.div whileHover={{ scale: 1.05 }} className="flex items-center gap-3"><div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center"><span className="text-white font-bold text-2xl">F</span></div><span className="text-3xl font-bold">Flat-Mate</span></motion.div></Link>
            <div><h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">Welcome Back to<br /><span className="text-white/90">Flat-Mate</span></h1><p className="text-white/80 text-lg">Sign in to access your account.</p></div>
            <div className="space-y-4">{[{ icon: ShieldCheckIcon, text: 'Verified Properties & Secure Transactions' }, { icon: UsersIcon, text: '10,000+ Happy Tenants & Landlords' }, { icon: HomeIcon, text: 'Find Your Perfect Home in Minutes' }].map((f, i) => (<motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.1 }} className="flex items-center gap-3"><div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0"><f.icon className="w-5 h-5" /></div><span className="text-white/90">{f.text}</span></motion.div>))}</div>
            <div className="flex gap-8 pt-4">{[{ value: '500+', label: 'Properties' }, { value: '10K+', label: 'Users' }, { value: '50+', label: 'Locations' }].map((s, i) => (<div key={i}><p className="text-3xl font-bold">{s.value}</p><p className="text-white/70 text-sm">{s.label}</p></div>))}</div>
          </motion.div>

          {/* Right card */}
          <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.2 }}>
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
              <AnimatePresence mode="wait">

                {/* STEP 1 — Role */}
                {step === 'role' && (
                  <motion.div key="role" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="p-8">
                    <div className="lg:hidden text-center mb-6"><Link to="/"><h1 className="text-2xl font-bold text-primary">Flat-Mate</h1></Link></div>
                    <div className="text-center mb-8"><h2 className="text-2xl font-bold text-primary mb-2">Welcome Back</h2><p className="text-gray-500 text-sm">Who are you logging in as?</p></div>
                    <div className="space-y-4">
                      <motion.button whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }} onClick={() => handleRoleSelect('tenant')} className="group w-full p-5 border-2 border-gray-200 rounded-2xl text-left hover:border-button-primary hover:shadow-lg transition-all duration-200">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 bg-blue-50 group-hover:bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors"><HomeIcon className="w-7 h-7 text-blue-500" /></div>
                          <div className="flex-1"><h3 className="text-base font-bold text-primary">I'm a Tenant</h3><p className="text-sm text-gray-500 mt-0.5">Looking for a place to rent</p></div>
                          <div className="w-7 h-7 border-2 border-gray-300 group-hover:border-button-primary group-hover:bg-button-primary rounded-full flex items-center justify-center transition-all"><CheckIcon className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" /></div>
                        </div>
                      </motion.button>
                      <motion.button whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }} onClick={() => handleRoleSelect('landlord')} className="group w-full p-5 border-2 border-gray-200 rounded-2xl text-left hover:border-button-primary hover:shadow-lg transition-all duration-200">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 bg-green-50 group-hover:bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors"><BuildingIcon className="w-7 h-7 text-green-600" /></div>
                          <div className="flex-1"><h3 className="text-base font-bold text-primary">I'm a Landlord / Owner</h3><p className="text-sm text-gray-500 mt-0.5">Manage your properties and tenants</p></div>
                          <div className="w-7 h-7 border-2 border-gray-300 group-hover:border-button-primary group-hover:bg-button-primary rounded-full flex items-center justify-center transition-all"><CheckIcon className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" /></div>
                        </div>
                      </motion.button>
                      <motion.button whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }} onClick={() => handleRoleSelect('admin' as any)} className="group w-full p-5 border-2 border-gray-200 rounded-2xl text-left hover:border-button-primary hover:shadow-lg transition-all duration-200">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 bg-purple-50 group-hover:bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors"><ShieldCheckIcon className="w-7 h-7 text-purple-600" /></div>
                          <div className="flex-1"><h3 className="text-base font-bold text-primary">I'm an Admin</h3><p className="text-sm text-gray-500 mt-0.5">Manage the platform and users</p></div>
                          <div className="w-7 h-7 border-2 border-gray-300 group-hover:border-button-primary group-hover:bg-button-primary rounded-full flex items-center justify-center transition-all"><CheckIcon className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" /></div>
                        </div>
                      </motion.button>
                    </div>
                    <p className="text-center text-sm text-gray-500 mt-6">Don't have an account?{' '}<Link to="/signup" className="text-button-primary font-semibold hover:underline">Sign up</Link></p>
                  </motion.div>
                )}

                {/* STEP 2 — Form */}
                {step === 'form' && (
                  <motion.div key="form" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="p-8">
                    <div className="flex items-center justify-between mb-5">
                      <button onClick={() => setStep('role')} className="text-sm text-gray-400 hover:text-primary transition-colors">← Change role</button>
                      <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${isOwner ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                        {selectedRole === 'admin' ? <><ShieldCheckIcon className="w-3 h-3" />Admin</> : isOwner ? <><BuildingIcon className="w-3 h-3" />Landlord / Owner</> : <><HomeIcon className="w-3 h-3" />Tenant</>}
                      </span>
                    </div>
                    <div className="text-center mb-5"><h2 className="text-2xl font-bold text-primary mb-1">Sign In</h2><p className="text-gray-500 text-sm">{selectedRole === 'admin' ? 'Welcome back, Admin' : isOwner ? 'Welcome back, Owner' : 'Welcome back, Tenant'}</p></div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <div className="relative"><MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" /><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your email" required className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-button-primary transition-colors text-sm" /></div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <div className="relative">
                          <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                          <input 
                            type={showPassword ? 'text' : 'password'} 
                            value={password} 
                            onChange={e => setPassword(e.target.value)} 
                            placeholder="Enter your password" 
                            required 
                            autoComplete="current-password" 
                            className="w-full pl-10 pr-10 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-button-primary transition-colors text-sm" 
                          />
                          <button 
                            type="button" 
                            onClick={() => setShowPassword(!showPassword)} 
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            {showPassword ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <div className="relative flex-shrink-0 w-5 h-5">
                          <input type="checkbox" checked={acceptedTerms} onChange={e => handleTermsChange(e.target.checked)} className="w-5 h-5 rounded border-2 border-gray-300 checked:bg-button-primary checked:border-button-primary cursor-pointer appearance-none" style={{ accentColor: 'transparent' }} />
                          {acceptedTerms && <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><CheckIcon className="w-3 h-3 text-white" strokeWidth={3} /></div>}
                        </div>
                        <span className="text-sm text-gray-600 leading-5">I accept the <Link to="/terms" className="text-button-primary hover:underline">Terms & Conditions</Link></span>
                      </label>
                      <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} type="submit" disabled={isLoading} className="w-full py-3 bg-button-primary text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 text-sm">{isLoading ? 'Signing in...' : 'Continue'}</motion.button>
                      <div className="relative flex items-center gap-3"><div className="flex-1 h-px bg-gray-200" /><span className="text-xs text-gray-400 whitespace-nowrap">or sign in with</span><div className="flex-1 h-px bg-gray-200" /></div>
                      {/* Google button container — fixed width so GSI can render correctly */}
                      <div className="w-full flex justify-center">
                        <div ref={googleButtonRef} style={{ width: '400px', minHeight: '44px' }} />
                      </div>
                      <div className="text-center"><Link to="/forgot-password" className="text-sm text-button-primary hover:underline">Forgot Password?</Link></div>
                    </form>
                    <p className="text-center text-sm text-gray-500 mt-4">Don't have an account?{' '}<Link to="/signup" className="text-button-primary font-semibold hover:underline">Sign up</Link></p>
                  </motion.div>
                )}

                {/* STEP 3 — OTP */}
                {step === 'otp' && (
                  <motion.div key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-8">
                    <div className="text-center mb-8"><h2 className="text-2xl font-bold text-primary mb-2">Verify Your Login</h2><p className="text-gray-500 text-sm">Enter the 6-digit code sent to</p><p className="text-button-primary font-medium text-sm mt-1">{email}</p></div>
                    <form onSubmit={handleOtpSubmit} className="space-y-6">
                      <div className="flex justify-center gap-2">{otp.map((digit, i) => (<input key={i} id={`lotp-${i}`} type="text" inputMode="numeric" maxLength={1} value={digit} onChange={e => handleOtpChange(i, e.target.value)} onKeyDown={e => handleOtpKeyDown(i, e)} className="w-11 text-center text-xl font-bold border-2 border-gray-200 rounded-xl focus:outline-none focus:border-button-primary transition-colors" style={{ height: '52px' }} />))}</div>
                      <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} type="submit" disabled={isLoading} className="w-full py-3 bg-button-primary text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 text-sm">{isLoading ? 'Verifying...' : 'Verify & Login'}</motion.button>
                      <p className="text-center text-sm text-gray-500">Didn't receive the code?{' '}<button type="button" onClick={handleResendOtp} className="text-button-primary font-semibold hover:underline">Resend</button></p>
                    </form>
                  </motion.div>
                )}

                {/* STEP 4 — Success */}
                {step === 'success' && (
                  <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="p-8 text-center py-16">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }} className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircleIcon className="w-12 h-12 text-green-600" /></motion.div>
                    <h2 className="text-2xl font-bold text-primary mb-2">Login Successful!</h2>
                    <p className="text-gray-500 text-sm">{isOwner ? 'Taking you to your Owner Dashboard...' : 'Taking you to home page...'}</p>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
            <div className="text-center mt-6"><Link to="/" className="text-sm text-white/80 hover:text-white transition-colors">← Back to Home</Link></div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
