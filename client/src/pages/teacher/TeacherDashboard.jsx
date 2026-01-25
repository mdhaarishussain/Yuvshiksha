import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CalendarDays, Users, DollarSign, LogOut, UserRound, ArrowRight, CheckCircle,
  Wallet, ListChecks, LayoutDashboard, Loader2, Info, XCircle, Bell, MessageSquare,
  User, BookOpen, Clock, GraduationCap, Sun, Moon, Home, Settings
} from 'lucide-react';

import { getFromLocalStorage, setToLocalStorage } from "../utils/storage";
import { bookingAPI } from '../../services/bookingAPI';
import { paymentsAPI } from '../../services/paymentsAPI';

const LISTING_FEE = 100;

// Theme configuration
const getTheme = (isDark) => isDark ? {
  pageBg: 'bg-[#0a0612]',
  cardBg: 'bg-white/[0.03]',
  cardBorder: 'border-white/10',
  cardHover: 'hover:bg-white/[0.06]',
  text: 'text-white',
  textMuted: 'text-slate-400',
  textSubtle: 'text-slate-500',
  headingGradient: 'from-violet-400 to-fuchsia-400',
  inputBg: 'bg-white/[0.05]',
  inputBorder: 'border-white/10',
  inputText: 'text-white',
  navBg: 'bg-[#0f0a1a]/80',
  navBorder: 'border-white/10',
  accentColor: 'text-violet-400',
  accentBg: 'bg-violet-500/10',
  successBg: 'bg-emerald-500/10',
  successText: 'text-emerald-400',
  warningBg: 'bg-amber-500/10',
  warningText: 'text-amber-400',
  orbColor1: 'bg-violet-600/20',
  orbColor2: 'bg-fuchsia-600/15',
  gridOpacity: 'opacity-[0.02]',
  statRowBg: 'bg-white/[0.03]',
  statRowBorder: 'border-white/5',
} : {
  pageBg: 'bg-gradient-to-br from-slate-50 via-violet-50 to-purple-50',
  cardBg: 'bg-white/70',
  cardBorder: 'border-violet-100',
  cardHover: 'hover:bg-white/90',
  text: 'text-slate-900',
  textMuted: 'text-slate-600',
  textSubtle: 'text-slate-500',
  headingGradient: 'from-violet-600 to-fuchsia-600',
  inputBg: 'bg-white',
  inputBorder: 'border-slate-200',
  inputText: 'text-slate-900',
  navBg: 'bg-white/80',
  navBorder: 'border-violet-100',
  accentColor: 'text-violet-600',
  accentBg: 'bg-violet-100',
  successBg: 'bg-emerald-50',
  successText: 'text-emerald-600',
  warningBg: 'bg-amber-50',
  warningText: 'text-amber-600',
  orbColor1: 'bg-violet-300/30',
  orbColor2: 'bg-fuchsia-300/20',
  gridOpacity: 'opacity-[0.03]',
  statRowBg: 'bg-white/50',
  statRowBorder: 'border-violet-100',
};

// Sub-Components
const DashboardCard = ({ icon: Icon, title, children, className = '', theme }) => (
  <motion.div
    whileHover={{ scale: 1.01 }}
    className={`relative ${theme.cardBg} backdrop-blur-sm shadow-xl p-6 rounded-2xl border ${theme.cardBorder} overflow-hidden transition-all duration-300 ${className}`}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
    <div className="relative z-10 flex flex-col h-full min-h-[280px]">
      <div className="flex items-center gap-3 mb-6">
        {Icon && <div className={`p-2 rounded-xl ${theme.accentBg}`}><Icon className={`w-5 h-5 ${theme.accentColor}`} /></div>}
        <h2 className={`text-lg font-semibold ${theme.text}`}>{title}</h2>
      </div>
      <div className="flex-grow flex flex-col justify-center">{children}</div>
    </div>
  </motion.div>
);

const StatRow = ({ label, value, theme }) => (
  <div className={`flex items-center justify-between p-4 ${theme.statRowBg} backdrop-blur-sm rounded-xl border ${theme.statRowBorder} transition-all duration-200`}>
    <span className={`${theme.textMuted} font-medium text-sm`}>{label}:</span>
    <span className={`text-lg font-bold ${theme.accentColor}`}>{value}</span>
  </div>
);

const QuickActionButton = ({ label, icon: Icon, path, badge, onClick, theme }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 p-3 ${theme.cardBg} backdrop-blur-sm ${theme.textMuted} rounded-xl ${theme.cardHover} transition-all duration-200 font-medium border ${theme.cardBorder} relative`}
  >
    <div className={`p-2 rounded-lg ${theme.accentBg}`}>
      <Icon className={`w-4 h-4 ${theme.accentColor}`} />
    </div>
    <span className="text-sm">{label}</span>
    {badge > 0 && (
      <span className="absolute right-4 top-1/2 -translate-y-1/2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5 font-bold">
        {badge}
      </span>
    )}
  </button>
);

const BookingRow = ({ booking, theme }) => (
  <div className={`p-4 ${theme.cardBg} rounded-xl border ${theme.cardBorder} transition-shadow duration-200 hover:shadow-lg`}>
    <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
      <div className="flex items-center gap-3">
        <div className={`p-2 ${theme.accentBg} rounded-lg`}><User className={`w-4 h-4 ${theme.accentColor}`} /></div>
        <div>
          <p className={`text-xs ${theme.textSubtle}`}>Student</p>
          <p className={`font-medium ${theme.text} text-sm`}>{booking.student?.name || 'Student'}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-500/10 rounded-lg"><BookOpen className="w-4 h-4 text-blue-500" /></div>
        <div>
          <p className={`text-xs ${theme.textSubtle}`}>Subject</p>
          <p className={`font-medium ${theme.text} text-sm`}>{booking.subject || 'Subject'}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className={`p-2 ${theme.successBg} rounded-lg`}><CalendarDays className={`w-4 h-4 ${theme.successText}`} /></div>
        <div>
          <p className={`text-xs ${theme.textSubtle}`}>Date</p>
          <p className={`font-medium ${theme.text} text-sm`}>{booking.date ? new Date(booking.date).toLocaleDateString() : 'TBD'}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className={`p-2 ${theme.warningBg} rounded-lg`}><Clock className={`w-4 h-4 ${theme.warningText}`} /></div>
        <div>
          <p className={`text-xs ${theme.textSubtle}`}>Time</p>
          <p className={`font-medium ${theme.text} text-sm`}>{booking.time || 'TBD'}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="p-2 bg-emerald-500/10 rounded-lg"><DollarSign className="w-4 h-4 text-emerald-500" /></div>
        <div>
          <p className={`text-xs ${theme.textSubtle}`}>Amount</p>
          <p className={`font-medium ${theme.successText} text-sm`}>₹{booking.amount || '0'}</p>
        </div>
      </div>
      <div className="flex justify-end">
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
          booking.status === 'pending' ? 'bg-amber-500/10 text-amber-500' :
          booking.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-500' :
          booking.status === 'completed' ? 'bg-blue-500/10 text-blue-500' :
          'bg-red-500/10 text-red-500'
        }`}>
          {booking.status?.charAt(0).toUpperCase() + booking.status?.slice(1) || 'Pending'}
        </span>
      </div>
    </div>
  </div>
);

// Main Component
export default function TeacherDashboard() {
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('dashboardTheme');
    return saved ? saved === 'dark' : true;
  });
  const theme = getTheme(isDarkMode);

  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [unreadBookingCount, setUnreadBookingCount] = useState(() => parseInt(localStorage.getItem('unreadBookingCount') || '0', 10));
  const [currentUser, setCurrentUser] = useState(() => getFromLocalStorage('currentUser'));
  const [loading, setLoading] = useState(true);
  const [isProcessingListing, setIsProcessingListing] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [stats, setStats] = useState({ upcomingSessions: 0, totalSessions: 0, totalEarnings: 0 });
  const [statsLoading, setStatsLoading] = useState(false);
  const [recentBookings, setRecentBookings] = useState([]);
  const [isListed, setIsListed] = useState(() => {
    const user = getFromLocalStorage('currentUser');
    return user?.teacherProfileData?.isListed || user?.isListed || false;
  });

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem('dashboardTheme', newTheme ? 'dark' : 'light');
  };

  const showMessage = useCallback((text, type = 'info', duration = 3000) => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => { setMessage(''); setMessageType(''); }, duration);
  }, []);

  const handleNavigation = (path, type) => {
    if (type === 'messages') setUnreadMessageCount(0);
    else if (type === 'bookings') {
      setUnreadBookingCount(0);
      localStorage.setItem('unreadBookingCount', '0');
    }
    navigate(path);
  };

  const hasFetchedData = useRef(false);
  const fetchUserData = useCallback(async () => {
    if (hasFetchedData.current) return;
    hasFetchedData.current = true;
    setLoading(true);
    let user = getFromLocalStorage('currentUser');

    if (!user || user.role !== 'teacher') {
      showMessage("Access denied. Please log in as a teacher.", 'error');
      navigate('/login', { replace: true });
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(import.meta.env.VITE_BACKEND_URL + '/api/profile/teacher', {
        method: 'GET',
        credentials: 'include'
      });

      if (response.ok) {
        const profileData = await response.json();
        const teacherProfileData = profileData.teacherProfile || {};
        const updatedUser = {
          ...user, ...profileData,
          id: profileData._id || user?._id,
          _id: profileData._id || user?._id,
          teacherProfileData: { ...(user.teacherProfileData || {}), ...teacherProfileData },
          profileComplete: profileData.profileComplete || user.profileComplete || false,
          isListed: teacherProfileData.isListed
        };
        setToLocalStorage('currentUser', updatedUser);
        setCurrentUser(updatedUser);
        setIsListed(updatedUser.isListed);
      }
    } catch (apiError) {
      console.warn('Backend not available, using localStorage:', apiError);
    } finally {
      setLoading(false);
    }
  }, [navigate, showMessage]);

  useEffect(() => { fetchUserData(); }, [fetchUserData]);

  const fetchStatsAndBookings = useCallback(async () => {
    if (!currentUser || !(currentUser.id || currentUser._id)) return;
    setStatsLoading(true);
    try {
      const response = await bookingAPI.getTeacherBookings({ page: 1, limit: 10 });
      const bookings = response.bookings || [];
      const now = new Date();
      
      const upcomingSessions = bookings.filter(b => (b.status === 'pending' || b.status === 'confirmed') && new Date(b.date) >= now).length;
      const totalSessions = bookings.length;
      const totalEarnings = bookings.filter(b => b.status === 'confirmed' || b.status === 'completed').reduce((sum, b) => sum + (b.amount || 0), 0);
      
      setStats({ upcomingSessions, totalSessions, totalEarnings });
      setRecentBookings(bookings);
    } catch (err) {
      console.error("Failed to fetch stats:", err);
      setStats({ upcomingSessions: 0, totalSessions: 0, totalEarnings: 0 });
      setRecentBookings([]);
    } finally {
      setStatsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => { fetchStatsAndBookings(); }, [fetchStatsAndBookings]);

  useEffect(() => {
    const fetchUnreadMessages = async () => {
      try {
        const res = await fetch(import.meta.env.VITE_BACKEND_URL + '/api/messages/unread-count', { credentials: 'include' });
        const data = await res.json();
        setUnreadMessageCount(data.unreadCount || 0);
      } catch (e) { setUnreadMessageCount(0); }
    };
    fetchUnreadMessages();
  }, []);

  const teacherProfile = currentUser?.teacherProfileData || currentUser || {};
  const isListedStatus = teacherProfile.isListed || false;
  const isProfileComplete = currentUser?.profileComplete || false;

  const paymentInProgress = useRef(false);
  const handleGetListed = async () => {
    if (paymentInProgress.current) return;
    paymentInProgress.current = true;
    setIsProcessingListing(true);
    const user = getFromLocalStorage('currentUser');
    const phone = user.teacherProfileData?.phone || user.phone || '';
    const listingData = {
      teacherId: user._id,
      name: user.firstName + ' ' + user.lastName,
      email: user.email, phone,
      fee: LISTING_FEE,
      timestamp: Date.now(),
    };
    try {
      const res = await paymentsAPI.createOrder({
        amount: LISTING_FEE,
        customerId: user._id,
        customerName: user.firstName + ' ' + user.lastName,
        customerEmail: user.email,
        customerPhone: phone,
        purpose: 'Teacher Listing Fee'
      });
      if (!res.paymentSessionId || !res.orderId) {
        setMessage('Failed to initiate payment.');
        setMessageType('error');
        setIsProcessingListing(false);
        paymentInProgress.current = false;
        return;
      }
      localStorage.setItem('pendingListingData', JSON.stringify(listingData));
      localStorage.setItem('pendingPaymentType', 'listing');
      localStorage.setItem('pendingOrderId', res.orderId);
      setIsProcessingListing(false);
      paymentInProgress.current = false;
      navigate('/payment', {
        state: { orderId: res.orderId, paymentSessionId: res.paymentSessionId, listingData, type: 'listing' }
      });
    } catch (err) {
      setMessage('Failed to initiate payment.');
      setMessageType('error');
      setIsProcessingListing(false);
      paymentInProgress.current = false;
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (err) {}
    setToLocalStorage('currentUser', null);
    localStorage.removeItem('token');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme.pageBg}`}>
        <Loader2 className="w-12 h-12 text-violet-500 animate-spin" />
        <p className={`${theme.textMuted} text-xl ml-4`}>Loading Dashboard...</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme.pageBg} ${theme.text} p-4 sm:p-6 lg:p-10 relative overflow-hidden transition-colors duration-500`}>
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-40 -right-40 w-96 h-96 ${theme.orbColor1} rounded-full blur-[120px] animate-pulse`} />
        <div className={`absolute -bottom-40 -left-40 w-80 h-80 ${theme.orbColor2} rounded-full blur-[100px] animate-pulse`} style={{ animationDelay: '1s' }} />
        <div className={`absolute inset-0 ${theme.gridOpacity}`} style={{
          backgroundImage: `linear-gradient(rgba(139, 92, 246, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(139, 92, 246, 0.3) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }} />
      </div>
      
      <div className="relative z-10">
        {/* Toast Message */}
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`fixed top-8 left-1/2 -translate-x-1/2 p-4 rounded-xl shadow-lg z-50 flex items-center gap-3 ${
              messageType === 'success' ? 'bg-emerald-600 text-white' :
              messageType === 'error' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'
            }`}
          >
            {messageType === 'success' && <CheckCircle className="w-5 h-5" />}
            {messageType === 'error' && <XCircle className="w-5 h-5" />}
            {messageType === 'info' && <Info className="w-5 h-5" />}
            <span className="font-semibold">{message}</span>
          </motion.div>
        )}

        {/* Navbar */}
        <nav className={`w-full flex items-center justify-between px-4 py-4 md:px-6 ${theme.navBg} backdrop-blur-xl shadow-lg rounded-2xl border ${theme.navBorder} mb-8`}>
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/25">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className={`text-xl font-bold ${theme.text}`}>Yuvsiksha</span>
          </Link>
          
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleTheme}
              className={`p-2.5 rounded-xl border transition-all duration-300 ${isDarkMode ? 'bg-white/[0.05] border-white/10 hover:bg-white/[0.1]' : 'bg-white border-violet-200 hover:bg-violet-50 shadow-sm'}`}
            >
              {isDarkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-violet-600" />}
            </motion.button>

            <div className="flex flex-col items-end mr-2">
              <span className={`font-semibold ${theme.text} text-sm`}>{currentUser?.firstName} {currentUser?.lastName}</span>
              <span className={`text-xs ${theme.textSubtle}`}>{currentUser?.email}</span>
            </div>
            
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center text-white font-bold shadow-lg shadow-violet-500/25">
              {currentUser?.firstName?.charAt(0)}{currentUser?.lastName?.charAt(0)}
            </div>
            
            <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 text-red-500 font-semibold transition-all duration-200 hover:bg-red-500/20">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </nav>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className={`p-2 ${theme.accentBg} rounded-xl`}>
              <LayoutDashboard className={`w-7 h-7 ${theme.accentColor}`} />
            </div>
            <h1 className={`text-3xl md:text-4xl font-bold bg-gradient-to-r ${theme.headingGradient} bg-clip-text text-transparent`}>
              Teacher Dashboard
            </h1>
          </div>
          <p className={`text-lg ${theme.textMuted}`}>
            Welcome back, <span className={`font-semibold ${theme.accentColor}`}>{currentUser?.firstName || 'Teacher'}</span>!
          </p>
        </div>

        {/* Profile Incomplete Warning */}
        {!isProfileComplete && (
          <motion.section
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-8 flex flex-col sm:flex-row items-center justify-between"
          >
            <div className="flex items-center gap-4 mb-4 sm:mb-0">
              <Settings className="w-8 h-8" />
              <div>
                <h2 className="font-bold text-lg">Complete Your Profile</h2>
                <p className="text-sm opacity-80">Finish setup to get listed and connect with students.</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/teacher/profile-setup')}
              className="px-5 py-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 transition duration-300 flex items-center gap-2 shadow-lg font-semibold"
            >
              Complete Profile <ArrowRight className="w-4 h-4" />
            </button>
          </motion.section>
        )}

        {/* Dashboard Cards */}
        <main className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 xl:gap-8">
            {/* Listing Status */}
            <DashboardCard icon={ListChecks} title="Listing Status" theme={theme}>
              <div className="text-center flex flex-col items-center justify-center h-full space-y-4">
                {isListedStatus ? (
                  <>
                    <div className={`w-16 h-16 ${theme.successBg} rounded-full flex items-center justify-center`}>
                      <CheckCircle className={`w-8 h-8 ${theme.successText}`} />
                    </div>
                    <p className={`${theme.successText} font-bold text-lg`}>You are Listed!</p>
                    <p className={`${theme.textSubtle} text-sm`}>Students can now find and book you.</p>
                  </>
                ) : (
                  <>
                    <div className={`w-16 h-16 ${theme.warningBg} rounded-full flex items-center justify-center`}>
                      <Info className={`w-8 h-8 ${theme.warningText}`} />
                    </div>
                    <p className={`${theme.warningText} font-bold text-lg`}>Not Yet Listed</p>
                    <p className={`${theme.textSubtle} text-sm`}>Appear in searches and receive bookings.</p>
                    <button
                      onClick={handleGetListed}
                      disabled={isProcessingListing || !isProfileComplete}
                      className={`mt-4 px-5 py-2.5 rounded-xl text-white font-medium flex items-center gap-2 transition-all duration-300 shadow-lg ${
                        isProfileComplete ? 'bg-gradient-to-r from-emerald-600 to-green-600 hover:shadow-emerald-500/25' : 'bg-slate-600 cursor-not-allowed'
                      }`}
                    >
                      {isProcessingListing ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</> : <><Wallet className="w-4 h-4" /> Get Listed (₹{LISTING_FEE})</>}
                    </button>
                  </>
                )}
              </div>
            </DashboardCard>

            {/* Summary */}
            <DashboardCard icon={DollarSign} title="Your Summary" theme={theme}>
              {statsLoading ? (
                <div className="space-y-4 animate-pulse">
                  <div className={`h-14 ${theme.cardBg} rounded-xl`} />
                  <div className={`h-14 ${theme.cardBg} rounded-xl`} />
                  <div className={`h-14 ${theme.cardBg} rounded-xl`} />
                </div>
              ) : (
                <div className="space-y-4">
                  <StatRow label="Upcoming Sessions" value={stats.upcomingSessions} theme={theme} />
                  <StatRow label="Total Sessions" value={stats.totalSessions} theme={theme} />
                  <StatRow label="Total Earnings" value={stats.totalEarnings.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })} theme={theme} />
                </div>
              )}
            </DashboardCard>

            {/* Quick Actions */}
            <DashboardCard icon={LayoutDashboard} title="Quick Actions" theme={theme}>
              <div className="space-y-3">
                <QuickActionButton label="View Profile" icon={UserRound} onClick={() => handleNavigation('/teacher/profile', null)} theme={theme} />
                <QuickActionButton label="View Bookings" icon={Users} badge={unreadBookingCount} onClick={() => handleNavigation('/teacher/bookings', 'bookings')} theme={theme} />
                <QuickActionButton label="View Schedule" icon={CalendarDays} onClick={() => handleNavigation('/teacher/schedule', null)} theme={theme} />
                <QuickActionButton label="Messages" icon={MessageSquare} badge={unreadMessageCount} onClick={() => handleNavigation('/teacher/messages', 'messages')} theme={theme} />
              </div>
            </DashboardCard>

            {/* Recent Activity */}
            <div className="lg:col-span-3">
              <DashboardCard icon={CalendarDays} title="Recent Bookings" theme={theme} className="min-h-0">
                <div className="flex items-center justify-between mb-6">
                  <h3 className={`text-lg font-semibold ${theme.text}`}>Latest Activity</h3>
                  <button onClick={() => navigate('/teacher/bookings')} className={`text-sm ${theme.accentColor} hover:underline font-medium flex items-center gap-1`}>
                    View all <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                  {statsLoading ? (
                    <div className="text-center py-8">
                      <Loader2 className="w-8 h-8 text-violet-500 animate-spin mx-auto mb-4" />
                      <p className={theme.textMuted}>Loading bookings...</p>
                    </div>
                  ) : recentBookings.length > 0 ? (
                    recentBookings.slice(0, 5).map(booking => (
                      <BookingRow key={booking.id || booking._id} booking={booking} theme={theme} />
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <CalendarDays className={`w-16 h-16 ${theme.textSubtle} mx-auto mb-4 opacity-30`} />
                      <p className={`${theme.textMuted} text-lg`}>No bookings yet</p>
                      <p className={`${theme.textSubtle} text-sm mt-2`}>When students book sessions, they'll appear here.</p>
                    </div>
                  )}
                </div>
              </DashboardCard>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
