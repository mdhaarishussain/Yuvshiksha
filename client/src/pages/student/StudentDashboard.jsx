import React, { useState, useEffect, useCallback, createContext, useRef } from 'react';
import { fetchTeacherById } from '../../services/teacherAPI';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Home, Loader2, Bell, Search, LogOut, MessageSquare, User,
  ChevronLeft, ChevronRight, Calendar, Users, Heart, TrendingUp,
  Bookmark, BookCheck, Star, GraduationCap, AlertTriangle, Sun, Moon,
} from 'lucide-react';

const UserContext = createContext(null);

import { getFromLocalStorage, setToLocalStorage } from '../utils/storage';
import { useNotifications } from '../../contexts/NotificationContext';
import { useMessageNotifications } from '../../hooks/useMessageNotifications';
import API_CONFIG from '../../config/api';

// Theme configuration
const getTheme = (isDark) => isDark ? {
  // Dark theme
  pageBg: 'bg-[#0a0612]',
  sidebarBg: 'bg-[#0f0a1a]/80',
  sidebarBorder: 'border-white/10',
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
  inputPlaceholder: 'placeholder-slate-500',
  buttonActive: 'bg-gradient-to-r from-violet-600 to-fuchsia-600',
  buttonInactive: 'bg-white/[0.03] hover:bg-white/[0.08]',
  statCardBg: 'bg-white/[0.03]',
  statCardBorder: 'border-white/10',
  dropdownBg: 'bg-[#1a1225]',
  dropdownBorder: 'border-white/10',
  accentColor: 'text-violet-400',
  accentBg: 'bg-violet-500/10',
  successBg: 'bg-emerald-500/10',
  successText: 'text-emerald-400',
  warningBg: 'bg-amber-500/10',
  warningText: 'text-amber-400',
  orbColor1: 'bg-violet-600/20',
  orbColor2: 'bg-fuchsia-600/15',
  gridOpacity: 'opacity-[0.02]',
} : {
  // Light theme
  pageBg: 'bg-gradient-to-br from-slate-50 via-violet-50 to-purple-50',
  sidebarBg: 'bg-white/80',
  sidebarBorder: 'border-violet-100',
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
  inputPlaceholder: 'placeholder-slate-400',
  buttonActive: 'bg-gradient-to-r from-violet-600 to-fuchsia-600',
  buttonInactive: 'bg-white/60 hover:bg-white/80',
  statCardBg: 'bg-white/70',
  statCardBorder: 'border-violet-100',
  dropdownBg: 'bg-white',
  dropdownBorder: 'border-slate-200',
  accentColor: 'text-violet-600',
  accentBg: 'bg-violet-100',
  successBg: 'bg-emerald-50',
  successText: 'text-emerald-600',
  warningBg: 'bg-amber-50',
  warningText: 'text-amber-600',
  orbColor1: 'bg-violet-300/30',
  orbColor2: 'bg-fuchsia-300/20',
  gridOpacity: 'opacity-[0.03]',
};

// Sub-Components
const SidebarButton = ({ icon: Icon, text, onClick, isActive, count, isCollapsed, theme }) => (
  <div className="relative">
    <button
      onClick={onClick}
      className={`group flex items-center w-full rounded-xl text-left font-medium transition-all duration-300 ${
        isCollapsed ? 'p-3 justify-center' : 'p-3'
      } ${isActive ? theme.buttonActive + ' text-white shadow-lg shadow-violet-500/25' : theme.buttonInactive + ' ' + theme.textMuted}`}
      title={isCollapsed ? text : ''}
    >
      <Icon className={`w-5 h-5 ${isCollapsed ? '' : 'mr-3'} ${isActive ? 'text-white' : theme.accentColor} transition-colors duration-300 flex-shrink-0`} />
      {!isCollapsed && <span className="transition-all duration-300 truncate">{text}</span>}
    </button>
    {isCollapsed && count > 0 && (
      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-[#0a0612]">
        {count > 9 ? '9+' : count}
      </span>
    )}
  </div>
);

const MainHeader = ({ currentUser, unreadMessageCount, theme, isDarkMode, toggleTheme }) => {
  const { unreadCount } = useNotifications();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Morning';
    if (hour < 18) return 'Afternoon';
    return 'Evening';
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (err) {}
    setToLocalStorage('currentUser', null);
    navigate('/login');
  };

  return (
    <div className="flex justify-between items-center mb-8">
      <div>
        <h1 className={`text-3xl md:text-4xl font-bold ${theme.text} mb-2`}>
          Good {getTimeOfDay()}, <span className={`bg-gradient-to-r ${theme.headingGradient} bg-clip-text text-transparent`}>{currentUser.firstName}!</span>
        </h1>
        <p className={`${theme.textMuted} text-lg`}>Welcome back to your personalized dashboard.</p>
      </div>
      <div className="flex items-center space-x-3 relative">
        {/* Theme Toggle */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleTheme}
          className={`p-3 rounded-xl backdrop-blur-md border transition-all duration-300 ${
            isDarkMode ? 'bg-white/[0.05] border-white/10 hover:bg-white/[0.1]' : 'bg-white/80 border-violet-200 hover:bg-white shadow-sm'
          }`}
        >
          {isDarkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-violet-600" />}
        </motion.button>

        {/* Search */}
        <div className="relative hidden md:block">
          <input
            type="text"
            placeholder="Search..."
            className={`pl-10 pr-4 py-2.5 ${theme.inputBg} backdrop-blur-sm border ${theme.inputBorder} rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all duration-200 ${theme.inputText} ${theme.inputPlaceholder} w-48`}
          />
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${theme.textSubtle}`} />
        </div>

        {/* Notifications */}
        <button
          onClick={() => navigate('/notifications')}
          className={`relative p-3 ${theme.cardBg} backdrop-blur-sm rounded-xl border ${theme.cardBorder} ${theme.cardHover} transition-all duration-200`}
        >
          <Bell className={`w-5 h-5 ${theme.textMuted}`} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-[#0a0612]">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {/* Messages */}
        <Link
          to="/student/messages"
          className={`relative p-3 ${theme.cardBg} backdrop-blur-sm rounded-xl border ${theme.cardBorder} ${theme.cardHover} transition-all duration-200`}
        >
          <MessageSquare className={`w-5 h-5 ${theme.textMuted}`} />
          {unreadMessageCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-[#0a0612]">
              {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
            </span>
          )}
        </Link>

        {/* Profile */}
        <div
          className="w-11 h-11 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-violet-500/25 cursor-pointer transform hover:scale-105 transition-all duration-200"
          onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
        >
          {currentUser.firstName?.charAt(0)}{currentUser.lastName?.charAt(0)}
        </div>

        {profileDropdownOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className={`absolute right-0 top-full mt-2 w-64 ${theme.dropdownBg} backdrop-blur-xl rounded-xl shadow-xl border ${theme.dropdownBorder} py-2 z-50`}
          >
            <div className={`flex items-center space-x-3 px-4 py-3 border-b ${theme.cardBorder} mb-2`}>
              <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-lg flex items-center justify-center text-white font-bold">
                {currentUser.firstName?.charAt(0)}{currentUser.lastName?.charAt(0)}
              </div>
              <div>
                <p className={`font-semibold ${theme.text}`}>{currentUser.firstName} {currentUser.lastName}</p>
                <p className={`text-sm ${theme.textSubtle}`}>{currentUser.email}</p>
              </div>
            </div>
            <Link to="/student/profile" className={`flex items-center px-4 py-2 ${theme.textMuted} hover:${theme.accentBg} ${theme.cardHover} transition-colors duration-150`}>
              <User className={`w-4 h-4 mr-2 ${theme.accentColor}`} />
              View Profile
            </Link>
            <div className={`border-t ${theme.cardBorder} mt-2 pt-2`}>
              <button onClick={handleLogout} className="flex items-center w-full text-left px-4 py-2 text-red-500 hover:bg-red-500/10 transition-colors duration-150">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, color, description, theme }) => {
  const gradients = {
    primary: 'from-violet-600 to-indigo-600',
    secondary: 'from-purple-600 to-pink-600',
    accent: 'from-blue-600 to-cyan-600',
    success: 'from-emerald-500 to-green-600',
  };
  const gradient = gradients[color] || gradients.primary;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`relative p-6 ${theme.statCardBg} backdrop-blur-sm rounded-2xl border ${theme.statCardBorder} overflow-hidden transition-all duration-300 group`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-5 group-hover:opacity-10 transition-opacity duration-300`} />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-base font-medium ${theme.textMuted}`}>{title}</h3>
          <div className={`p-2.5 rounded-xl text-white bg-gradient-to-br ${gradient} shadow-lg`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
        <p className={`text-3xl font-bold ${theme.text} mb-1`}>{value}</p>
        <p className={`text-sm ${theme.textSubtle}`}>{description}</p>
      </div>
    </motion.div>
  );
};

const SessionCard = ({ session, onViewDetail, theme }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`${theme.cardBg} backdrop-blur-sm rounded-xl p-4 border ${theme.cardBorder} ${theme.cardHover} transition-all duration-200`}
    >
      <div className="mb-3">
        <h4 className={`font-semibold ${theme.text} text-base`}>{session.teacherName}</h4>
        <p className={`text-xs ${theme.textSubtle}`}>
          {formatDate(session.date)} • {session.time} ({session.duration}h)
        </p>
      </div>
      <div className={`flex items-center justify-between text-sm ${theme.textMuted} mb-3`}>
        <span>{session.subject}</span>
        <span className={`font-semibold ${theme.successText}`}>₹{session.amount}</span>
      </div>
      <button
        className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white py-2.5 px-4 rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-violet-500/25 transition-all duration-200"
        onClick={() => onViewDetail(session)}
      >
        View Details
      </button>
    </motion.div>
  );
};

const TeacherCard = ({ teacher, onToggleFavorite, theme }) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    className={`${theme.cardBg} backdrop-blur-sm rounded-xl p-4 border ${theme.cardBorder} ${theme.cardHover} transition-all duration-200`}
  >
    <div className="flex items-start justify-between mb-3">
      <div className="flex items-center space-x-3">
        <img src={teacher.image} alt={teacher.name} className="w-12 h-12 rounded-full object-cover border-2 border-violet-500/30" />
        <div>
          <h4 className={`font-semibold ${theme.text} text-sm`}>{teacher.name}</h4>
          <p className={`${theme.textSubtle} text-xs`}>{teacher.experience}</p>
        </div>
      </div>
      <button
        onClick={() => onToggleFavorite?.(teacher.id)}
        className={`p-2 rounded-full transition-all duration-200 ${teacher.isFavorite ? 'text-red-500 bg-red-500/10' : `${theme.textSubtle} hover:text-red-500 hover:bg-red-500/10`}`}
      >
        <Heart className={`w-4 h-4 ${teacher.isFavorite ? 'fill-current' : ''}`} />
      </button>
    </div>
    <div className="flex flex-wrap gap-1 mb-2">
      {teacher.subjects?.slice(0, 2).map((subject, i) => (
        <span key={i} className={`px-2 py-1 ${theme.accentBg} ${theme.accentColor} text-xs font-medium rounded-full`}>{subject}</span>
      ))}
    </div>
    <div className={`flex items-center justify-between text-xs ${theme.textSubtle}`}>
      {teacher.rating > 0 && (
        <div className="flex items-center">
          <Star className="w-3 h-3 text-yellow-500 fill-current mr-1" />
          <span>{teacher.rating}</span>
        </div>
      )}
      <span className={`font-semibold ${theme.successText}`}>₹{teacher.hourlyRate}/hr</span>
    </div>
  </motion.div>
);

const SessionDetailModal = ({ session, onClose, theme }) => {
  const [teacherDetails, setTeacherDetails] = useState(null);
  
  useEffect(() => {
    if (!session) return;
    const teacherId = session.teacher?.id || session.teacherId;
    if (teacherId) {
      fetchTeacherById(teacherId).then(setTeacherDetails).catch(() => setTeacherDetails(null));
    }
  }, [session]);

  if (!session) return null;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const teacherName = teacherDetails ? `${teacherDetails.firstName || ''} ${teacherDetails.lastName || ''}`.trim() : session.teacherName || 'N/A';
  const teacherPhone = teacherDetails?.teacherProfile?.phone || session.teacherPhone || 'N/A';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-black/50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`${theme.dropdownBg} backdrop-blur-xl rounded-2xl shadow-2xl p-8 w-full max-w-md relative border ${theme.dropdownBorder}`}
      >
        <button className={`absolute top-4 right-4 ${theme.textSubtle} hover:text-red-500 text-2xl`} onClick={onClose}>&times;</button>
        <h2 className={`text-2xl font-bold mb-6 bg-gradient-to-r ${theme.headingGradient} bg-clip-text text-transparent`}>Session Details</h2>
        <div className={`space-y-3 ${theme.textMuted}`}>
          <div className="flex justify-between"><span className={theme.textSubtle}>Teacher:</span><span className={`font-medium ${theme.text}`}>{teacherName}</span></div>
          <div className="flex justify-between"><span className={theme.textSubtle}>Phone:</span><span className={`font-medium ${theme.text}`}>{teacherPhone}</span></div>
          <div className="flex justify-between"><span className={theme.textSubtle}>Subject:</span><span className={`font-medium ${theme.text}`}>{session.subject}</span></div>
          <div className="flex justify-between"><span className={theme.textSubtle}>Date:</span><span className={`font-medium ${theme.text}`}>{formatDate(session.date)}</span></div>
          <div className="flex justify-between"><span className={theme.textSubtle}>Duration:</span><span className={`font-medium ${theme.text}`}>{session.duration}h</span></div>
          <div className="flex justify-between"><span className={theme.textSubtle}>Amount:</span><span className={`font-semibold ${theme.successText}`}>₹{session.amount}</span></div>
        </div>
      </motion.div>
    </div>
  );
};

// Main Component
const StudentDashboard = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('dashboardTheme');
    return saved ? saved === 'dark' : true;
  });
  const theme = getTheme(isDarkMode);

  const [selectedSession, setSelectedSession] = useState(null);
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [activeMenuItem, setActiveMenuItem] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [favorites, setFavorites] = useState(() => getFromLocalStorage('favoriteTeachers', []));
  const hasFetchedData = useRef(false);

  const { unreadCount } = useNotifications();
  const { unreadMessageCount } = useMessageNotifications();

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem('dashboardTheme', newTheme ? 'dark' : 'light');
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (err) {}
    setToLocalStorage('currentUser', null);
    navigate('/login');
  };

  const handleFetchData = useCallback(async () => {
    if (hasFetchedData.current) return;
    hasFetchedData.current = true;
    setLoading(true);

    const userFromStorage = getFromLocalStorage('currentUser');
    if (!userFromStorage) {
      navigate('/login');
      setLoading(false);
      return;
    }

    try {
      const API_BASE_URL = API_CONFIG.BASE_URL;
      const [profileRes, bookingsRes, favsRes, teachersRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/profile/student`, { credentials: 'include' }),
        fetch(`${API_BASE_URL}/api/bookings/student?status=all&limit=1000`, { credentials: 'include' }),
        fetch(`${API_BASE_URL}/api/profile/favourites`, { credentials: 'include' }),
        fetch(`${API_BASE_URL}${API_CONFIG.ENDPOINTS.TEACHERS_LIST}?sortByLocation=true`, { credentials: 'include' })
      ]);

      let profileData = userFromStorage;
      if (profileRes.ok) {
        profileData = await profileRes.json();
        setToLocalStorage('currentUser', profileData);
      }

      if (!profileData.profileComplete) {
        navigate('/student/profile-setup');
        return;
      }
      setCurrentUser(profileData);

      const [bookingsData, favsData, teachersData] = await Promise.all([
        bookingsRes.ok ? bookingsRes.json() : { bookings: [] },
        favsRes.ok ? favsRes.json() : { favourites: [] },
        teachersRes.ok ? teachersRes.json() : { teachers: [] }
      ]);

      const bookings = bookingsData.bookings || [];
      const favIds = favsData.favourites || [];
      const teachers = teachersData.teachers || teachersData;
      setFavorites(favIds);

      const formattedTeachers = teachers.map(t => ({
        id: t._id || t.id,
        name: `${t.firstName || ''} ${t.lastName || ''}`.trim() || 'Teacher',
        experience: `${t.teacherProfile?.experienceYears || 1} years`,
        image: t.teacherProfile?.photoUrl || `https://ui-avatars.com/api/?name=${t.firstName}&background=7c3aed&color=fff`,
        subjects: (t.teacherProfile?.subjectsTaught || []).map(s => s.text || s).slice(0, 3),
        rating: t.rating || 0,
        hourlyRate: t.teacherProfile?.hourlyRate || 500,
        isFavorite: favIds.includes(t._id || t.id),
      }));

      const newDashboardData = {
        stats: {
          upcomingSessions: bookings.filter(b => b.status !== 'completed' && b.status !== 'cancelled').length,
          completedSessions: bookings.filter(b => b.status === 'completed').length,
          favoriteTeachers: favIds.length,
          totalSpent: bookings.filter(b => b.status === 'confirmed' || b.status === 'completed').reduce((s, b) => s + (b.amount || 0), 0)
        },
        upcomingSessions: bookings.filter(b => new Date(b.date) >= new Date() && (b.status === 'pending' || b.status === 'confirmed')),
        recentTeachers: formattedTeachers.slice(0, 3),
        allSessions: bookings,
        favoriteTeachersData: formattedTeachers.filter(t => favIds.includes(t.id)),
      };

      setDashboardData(newDashboardData);
    } catch (error) {
      console.error('Error fetching data:', error);
      setDashboardData({
        stats: { upcomingSessions: 0, completedSessions: 0, favoriteTeachers: 0, totalSpent: 0 },
        upcomingSessions: [], recentTeachers: [], allSessions: [], favoriteTeachersData: [],
      });
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => { handleFetchData(); }, [handleFetchData]);

  const toggleFavorite = async (teacherId) => {
    const isFav = favorites.includes(teacherId);
    const updatedFavorites = isFav ? favorites.filter(id => id !== teacherId) : [...favorites, teacherId];
    setFavorites(updatedFavorites);

    try {
      await fetch(`${API_CONFIG.BASE_URL}/api/profile/favourites`, {
        method: isFav ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacherId }),
        credentials: 'include'
      });
    } catch (error) {
      setFavorites(isFav ? [...favorites, teacherId] : favorites.filter(id => id !== teacherId));
    }
  };

  if (loading || !currentUser) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme.pageBg}`}>
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-violet-500 mx-auto mb-4" />
          <span className={`text-lg ${theme.textMuted}`}>Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <UserContext.Provider value={currentUser}>
      <div className={`flex min-h-screen ${theme.pageBg} relative overflow-hidden transition-colors duration-500`}>
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className={`absolute -top-40 -right-40 w-96 h-96 ${theme.orbColor1} rounded-full blur-[120px] animate-pulse`} />
          <div className={`absolute -bottom-40 -left-40 w-80 h-80 ${theme.orbColor2} rounded-full blur-[100px] animate-pulse`} style={{ animationDelay: '1s' }} />
          <div className={`absolute inset-0 ${theme.gridOpacity}`} style={{
            backgroundImage: `linear-gradient(rgba(139, 92, 246, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(139, 92, 246, 0.3) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }} />
        </div>

        {/* Sidebar */}
        <aside className={`${isSidebarCollapsed ? 'w-20' : 'w-64'} ${theme.sidebarBg} backdrop-blur-xl border-r ${theme.sidebarBorder} p-4 flex flex-col relative z-10 transition-all duration-300`}>
          <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'} mb-8`}>
            {!isSidebarCollapsed && (
              <Link to="/" className="flex items-center gap-3 group">
                <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/25">
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className={`text-lg font-bold ${theme.text}`}>Yuvsiksha</h2>
                  <p className={`text-xs ${theme.textSubtle}`}>Student Portal</p>
                </div>
              </Link>
            )}
            {isSidebarCollapsed && (
              <Link to="/" className="w-10 h-10 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/25">
                <GraduationCap className="w-5 h-5 text-white" />
              </Link>
            )}
          </div>

          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className={`absolute -right-3 top-20 w-6 h-6 ${theme.cardBg} border ${theme.cardBorder} rounded-full flex items-center justify-center ${theme.textMuted} hover:${theme.accentColor} transition-colors`}
          >
            {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          <nav className="flex-1 space-y-2">
            <SidebarButton icon={Home} text="Dashboard" onClick={() => setActiveMenuItem('dashboard')} isActive={activeMenuItem === 'dashboard'} isCollapsed={isSidebarCollapsed} theme={theme} />
            <SidebarButton icon={Calendar} text="My Sessions" onClick={() => setActiveMenuItem('sessions')} isActive={activeMenuItem === 'sessions'} count={dashboardData?.upcomingSessions?.length || 0} isCollapsed={isSidebarCollapsed} theme={theme} />
            <SidebarButton icon={Bookmark} text="Favorites" onClick={() => setActiveMenuItem('favorites')} isActive={activeMenuItem === 'favorites'} count={favorites.length} isCollapsed={isSidebarCollapsed} theme={theme} />
            
            <div className={`border-t ${theme.cardBorder} my-4`} />
            
            <Link to="/student/messages" className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : ''} p-3 rounded-xl ${theme.buttonInactive} ${theme.textMuted} transition-all duration-200 relative`}>
              <MessageSquare className={`w-5 h-5 ${isSidebarCollapsed ? '' : 'mr-3'} ${theme.accentColor}`} />
              {!isSidebarCollapsed && <span>Messages</span>}
              {unreadMessageCount > 0 && (
                <span className={`absolute ${isSidebarCollapsed ? '-top-1 -right-1' : 'right-3'} w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center`}>
                  {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
                </span>
              )}
            </Link>
            
            <Link to="/student/find-teachers" className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : ''} p-3 rounded-xl ${theme.buttonInactive} ${theme.textMuted} transition-all duration-200`}>
              <Search className={`w-5 h-5 ${isSidebarCollapsed ? '' : 'mr-3'} ${theme.accentColor}`} />
              {!isSidebarCollapsed && <span>Find Teachers</span>}
            </Link>
          </nav>

          <button
            onClick={handleLogout}
            className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : ''} p-3 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all duration-200 mt-4`}
          >
            <LogOut className={`w-5 h-5 ${isSidebarCollapsed ? '' : 'mr-3'}`} />
            {!isSidebarCollapsed && <span className="font-medium">Logout</span>}
          </button>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto relative z-10">
          <MainHeader currentUser={currentUser} unreadMessageCount={unreadMessageCount} theme={theme} isDarkMode={isDarkMode} toggleTheme={toggleTheme} />

          {activeMenuItem === 'dashboard' && dashboardData && (
            <div className="space-y-8">
              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Upcoming Sessions" value={dashboardData.stats.upcomingSessions} icon={Calendar} color="primary" description="Scheduled" theme={theme} />
                <StatCard title="Completed Sessions" value={dashboardData.stats.completedSessions} icon={BookCheck} color="secondary" description="All time" theme={theme} />
                <StatCard title="Favorite Teachers" value={favorites.length} icon={Heart} color="accent" description="Bookmarked" theme={theme} />
                <StatCard title="Total Spent" value={`₹${dashboardData.stats.totalSpent.toLocaleString()}`} icon={TrendingUp} color="success" description="Investment" theme={theme} />
              </div>

              {/* Upcoming Sessions */}
              <section className={`${theme.cardBg} backdrop-blur-sm rounded-2xl p-6 border ${theme.cardBorder}`}>
                <h2 className={`text-xl font-bold ${theme.text} mb-6 flex items-center gap-3`}>
                  <Calendar className={`w-6 h-6 ${theme.accentColor}`} />
                  Upcoming Sessions
                </h2>
                {dashboardData.upcomingSessions.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {dashboardData.upcomingSessions.slice(0, 6).map(session => (
                      <SessionCard key={session.id || session._id} session={session} onViewDetail={setSelectedSession} theme={theme} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Calendar className={`w-12 h-12 ${theme.textSubtle} mx-auto mb-4 opacity-50`} />
                    <p className={`${theme.textMuted} mb-4`}>No upcoming sessions</p>
                    <Link to="/student/find-teachers" className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg hover:shadow-violet-500/25 transition-all">
                      <Search className="w-5 h-5" /> Find Teachers
                    </Link>
                  </div>
                )}
              </section>

              {/* Recommended Teachers */}
              <section className={`${theme.cardBg} backdrop-blur-sm rounded-2xl p-6 border ${theme.cardBorder}`}>
                <h2 className={`text-xl font-bold ${theme.text} mb-6 flex items-center gap-3`}>
                  <Users className={`w-6 h-6 ${theme.accentColor}`} />
                  Recommended Teachers
                </h2>
                {dashboardData.recentTeachers.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {dashboardData.recentTeachers.map(teacher => (
                      <TeacherCard key={teacher.id} teacher={teacher} onToggleFavorite={toggleFavorite} theme={theme} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Users className={`w-12 h-12 ${theme.textSubtle} mx-auto mb-4 opacity-50`} />
                    <p className={`${theme.textMuted}`}>No teachers available</p>
                  </div>
                )}
              </section>
            </div>
          )}

          {activeMenuItem === 'sessions' && dashboardData && (
            <section className={`${theme.cardBg} backdrop-blur-sm rounded-2xl p-6 border ${theme.cardBorder}`}>
              <h2 className={`text-xl font-bold ${theme.text} mb-6 flex items-center gap-3`}>
                <Calendar className={`w-6 h-6 ${theme.accentColor}`} />
                All Sessions
              </h2>
              <div className="space-y-4">
                {dashboardData.allSessions.filter(s => ['confirmed', 'pending', 'completed'].includes(s.status?.toLowerCase())).map(session => (
                  <div key={session.id || session._id} className={`${theme.cardBg} rounded-xl p-4 border ${theme.cardBorder} flex flex-col md:flex-row md:items-center justify-between gap-4`}>
                    <div>
                      <h4 className={`font-semibold ${theme.text}`}>{session.teacherName || 'Teacher'}</h4>
                      <p className={`text-sm ${theme.textSubtle}`}>{new Date(session.date).toLocaleDateString()} • {session.subject}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`${theme.successText} font-semibold`}>₹{session.amount}</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        session.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' :
                        session.status === 'confirmed' ? 'bg-blue-500/10 text-blue-500' :
                        'bg-amber-500/10 text-amber-500'
                      }`}>{session.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {activeMenuItem === 'favorites' && dashboardData && (
            <section className={`${theme.cardBg} backdrop-blur-sm rounded-2xl p-6 border ${theme.cardBorder}`}>
              <h2 className={`text-xl font-bold ${theme.text} mb-6 flex items-center gap-3`}>
                <Heart className={`w-6 h-6 ${theme.accentColor}`} />
                Favorite Teachers
              </h2>
              {dashboardData.favoriteTeachersData.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {dashboardData.favoriteTeachersData.map(teacher => (
                    <TeacherCard key={teacher.id} teacher={teacher} onToggleFavorite={toggleFavorite} theme={theme} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Heart className={`w-12 h-12 ${theme.textSubtle} mx-auto mb-4 opacity-50`} />
                  <p className={`${theme.textMuted} mb-4`}>No favorite teachers yet</p>
                  <Link to="/student/find-teachers" className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg hover:shadow-violet-500/25 transition-all">
                    <Search className="w-5 h-5" /> Discover Teachers
                  </Link>
                </div>
              )}
            </section>
          )}
        </main>

        {selectedSession && <SessionDetailModal session={selectedSession} onClose={() => setSelectedSession(null)} theme={theme} />}
      </div>
    </UserContext.Provider>
  );
};

export default StudentDashboard;
