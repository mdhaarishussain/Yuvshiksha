import React, { useState, useEffect, useCallback, createContext, useContext, useRef } from 'react';
import { fetchTeacherById } from '../../services/teacherAPI';
import { useNavigate, Link } from 'react-router-dom';
import {
  Home,
  Loader2,
  Bell,
  Search,
  ChevronDown,
  ChevronUp,
  LogOut,
  MessageSquare,
  User,
  ClipboardPenLine,
  ChevronLeft,
  ChevronRight,
  Menu,
  Calendar,
  Clock,
  Users,
  Heart,
  Video,
  MapPin,
  TrendingUp,
  Bookmark,
  BookCheck,
  Star,
  GraduationCap,
  AlertTriangle,
} from 'lucide-react';
import Cookies from 'js-cookie';

const UserContext = createContext(null);

import { getFromLocalStorage, setToLocalStorage } from '../utils/storage';
import { useNotifications } from '../../contexts/NotificationContext';
import { useMessageNotifications } from '../../hooks/useMessageNotifications';
import API_CONFIG from '../../config/api';

// --- Sub-Components (Unchanged) ---
const SidebarButton = ({ icon: Icon, text, onClick, isActive, count, isCollapsed = false }) => {
  return (
    <div className="relative">
      <button
        onClick={onClick}
        className={`group flex items-center w-full rounded-xl text-left font-medium transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg overflow-hidden ${isCollapsed ? 'p-3 justify-center' : 'p-3'
          } ${isActive
            ? 'bg-blue-600 text-white shadow-lg'
            : 'text-slate-700 hover:bg-white/60 hover:text-blue-600 hover:backdrop-blur-sm'
          }`}
        title={isCollapsed ? text : ''}
      >
        <Icon className={`w-5 h-5 ${isCollapsed ? '' : 'mr-3'} ${isActive ? 'text-white' : 'text-slate-600 group-hover:text-blue-600'} transition-colors duration-300 flex-shrink-0`} />
        {!isCollapsed && (
          <span className="transition-all duration-300 truncate">{text}</span>
        )}
      </button>
      {isCollapsed && count > 0 && (
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border border-white shadow-sm">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </div>
  );
};

const MainHeader = ({ currentUser, unreadMessageCount }) => {
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
    } catch (err) {
      // Ignore network errors, still clear local data
    }
    setToLocalStorage('currentUser', null);
    // You should also clear notifications context state on logout
    // clearNotifications();
    navigate('/login');
  };

  return (
    <div className="flex justify-between items-center mb-8">
      <div>
        <h1 className="text-4xl font-bold text-slate-900 mb-2">
          Good {getTimeOfDay()}, <span className="text-blue-600">{currentUser.firstName}!</span>
        </h1>
        <p className="text-slate-600 text-lg">Welcome back to your personalized dashboard.</p>
      </div>
      <div className="flex items-center space-x-4 relative">
        <div className="relative">
          <input
            type="text"
            placeholder="Search anything..."
            className="pl-10 pr-4 py-2 bg-white/70 backdrop-blur-sm border border-white/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 text-slate-700 placeholder-slate-400 shadow-sm"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        </div>

        <button
          onClick={() => navigate('/notifications')}
          className="relative p-3 bg-white/70 backdrop-blur-sm rounded-xl hover:bg-white/80 transition-all duration-200 shadow-sm"
        >
          <Bell className="w-5 h-5 text-slate-700" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white animate-bounce-once">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
        <Link
          to="/student/messages"
          className="relative p-3 bg-white/70 backdrop-blur-sm rounded-xl hover:bg-white/80 transition-all duration-200 shadow-sm"
        >
          <MessageSquare className="w-5 h-5 text-slate-700" />
          {unreadMessageCount > 0 && (
            <span className="absolute top-1 right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white animate-bounce-once">
              {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
            </span>
          )}
        </Link>

        <div
          className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg cursor-pointer transform hover:scale-105 transition-all duration-200"
          onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
        >
          {currentUser.firstName.charAt(0)}{currentUser.lastName.charAt(0)}
        </div>

        {profileDropdownOpen && (
          <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl py-2 z-50 animate-fade-in-down transform scale-95 origin-top-right transition-all duration-200">
            <div className="flex items-center space-x-3 px-4 py-3 border-b border-slate-100 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-md">
                {currentUser.firstName.charAt(0)}{currentUser.lastName.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-slate-800">{currentUser.firstName} {currentUser.lastName}</p>
                <p className="text-sm text-slate-500">{currentUser.email}</p>
              </div>
            </div>
            <Link to="/student/profile" className="flex items-center px-4 py-2 text-slate-700 hover:bg-slate-50 transition-colors duration-150">
              <User className="w-4 h-4 mr-2 text-purple-500" />
              View Profile
            </Link>
            <div className="border-t border-slate-100 mt-2 pt-2">
              <button onClick={handleLogout} className="flex items-center w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 transition-colors duration-150">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
const SessionCard = ({ session, onViewDetail }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };
  return (
    <div className="bg-white/80 rounded-xl p-4 border border-slate-200 shadow hover:shadow-lg transition-all duration-200">
      <div className="mb-2">
        <div className="flex-1">
          <h4 className="font-semibold text-slate-800 text-base">{session.teacherName}</h4>
          <div className="flex items-center text-xs text-slate-500">
            {formatDate(session.date)}
            <span className="ml-3">{session.time} ({session.duration}h)</span>
          </div>
        </div>
      </div>
      <div className="flex items-center text-sm text-slate-700 mb-2">
        <span className="font-medium">Subject:</span>&nbsp;{session.subject}
      </div>
      <div className="flex items-center text-sm text-slate-700 mb-2">
        <span className="font-medium">Amount:</span>&nbsp;₹{session.amount}
      </div>
      <button
        className="w-full mt-2 bg-gradient-to-r from-purple-600 to-violet-600 text-white py-2 px-3 rounded-lg text-sm font-semibold hover:from-purple-700 hover:to-violet-700 transition-all duration-200"
        onClick={() => onViewDetail(session)}
      >
        View Details
      </button>
    </div>
  );
};
const StatCard = ({ title, value, icon: Icon, color, description }) => {
  const colorClasses = {
    primary: 'from-violet-600 to-indigo-600',
    secondary: 'from-purple-600 to-pink-600',
    accent: 'from-blue-600 to-cyan-600',
    success: 'from-emerald-500 to-green-600',
  };

  const gradient = colorClasses[color] || colorClasses.primary;

  return (
    <div className={`relative p-6 bg-white/60 backdrop-blur-sm rounded-2xl shadow-sm border border-white/40 overflow-hidden transform hover:scale-[1.02] transition-all duration-300 hover:shadow-lg group`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-10 group-hover:opacity-20 transition-opacity duration-300`}></div>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
          <div className={`p-2 rounded-full text-white bg-gradient-to-br ${gradient} shadow-md`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
        <p className="text-4xl font-bold text-gray-900 mb-2">{value}</p>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
    </div>
  );
};
const SessionDetailModal = ({ session, onClose }) => {
  const [teacherDetails, setTeacherDetails] = useState(null);
  useEffect(() => {
    if (!session) return;
    let teacherId = null;
    if (session.teacher && typeof session.teacher === 'object') {
      teacherId = session.teacher.id;
    } else if (session.teacherId) {
      teacherId = session.teacherId;
    }
    if (teacherId) {
      fetchTeacherById(teacherId)
        .then(data => setTeacherDetails(data))
        .catch(() => setTeacherDetails(null));
    }
  }, [session]);

  if (!session) return null;
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };
  let teacherName = 'N/A';
  let teacherPhone = 'N/A';
  if (teacherDetails) {
    teacherName = `${teacherDetails.firstName || ''} ${teacherDetails.lastName || ''}`.trim() || teacherDetails.name || 'N/A';
    teacherPhone = teacherDetails.teacherProfile?.phone || 'N/A';
  } else if (session.teacher && typeof session.teacher === 'object') {
    teacherName = session.teacher.name || 'N/A';
    teacherPhone = session.teacher.phone || 'N/A';
  } else {
    teacherName = session.teacherName || session.teacher || 'N/A';
    teacherPhone = session.teacherPhone || session.phone || 'N/A';
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md relative animate-fade-in">
        <button className="absolute top-3 right-3 text-slate-400 hover:text-red-500 text-xl" onClick={onClose}>&times;</button>
        <h2 className="text-2xl font-bold mb-4 text-purple-700">Session Details</h2>
        <div className="space-y-2 text-slate-700">
          <div><span className="font-semibold">Teacher:</span> {teacherName}</div>
          <div><span className="font-semibold">Phone:</span> {teacherPhone}</div>
          <div><span className="font-semibold">Subject:</span> {session.subject}</div>
          <div><span className="font-semibold">Date & Time:</span> {formatDate(session.date)} ({session.time})</div>
          <div><span className="font-semibold">Duration:</span> {session.duration} hour(s)</div>
          <div><span className="font-semibold">Amount:</span> ₹{session.amount}</div>
          {session.notes && <div><span className="font-semibold">Notes:</span> {session.notes}</div>}
        </div>
      </div>
    </div>
  );
};
const TeacherCard = ({ teacher, onToggleFavorite }) => {
  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-white/40 hover:bg-white/80 transition-all duration-200 hover:shadow-lg transform hover:scale-[1.02]">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <img
            src={teacher.image}
            alt={teacher.name}
            className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
          />
          <div>
            <h4 className="font-semibold text-slate-800 text-sm">{teacher.name}</h4>
            <p className="text-slate-600 text-xs">{teacher.experience}</p>
            {teacher.matchBadge?.text && (
              <div className="flex items-center gap-1 mt-1 text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full w-fit">
                <span>{teacher.matchBadge.emoji}</span>
                <span>{teacher.matchBadge.text}</span>
              </div>
            )}
          </div>
        </div>
        <button
          onClick={() => onToggleFavorite && onToggleFavorite(teacher.id)}
          className={`p-2 rounded-full transition-all duration-200 ${teacher.isFavorite
            ? 'text-red-500 bg-red-50 hover:bg-red-100'
            : 'text-slate-400 hover:text-red-500 hover:bg-red-50'
            }`}
        >
          <Heart className={`w-4 h-4 ${teacher.isFavorite ? 'fill-current' : ''}`} />
        </button>
      </div>

      <div className="space-y-2 mb-3">
        <div className="flex flex-wrap gap-1">
          {teacher.subjects.slice(0, 2).map((subject, index) => (
            <span key={index} className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
              {subject}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between text-xs text-slate-600">
          {teacher.rating > 0 && (
            <div className="flex items-center">
              <Star className="w-3 h-3 text-yellow-500 fill-current mr-1" />
              <span>{teacher.rating}</span>
            </div>
          )}
          {teacher.students > 0 && (
            <div className="flex items-center">
              <Users className="w-3 h-3 mr-1" />
              <span>{teacher.students} students</span>
            </div>
          )}
          {teacher.rating === 0 && teacher.students === 0 && (
            <div className="flex items-center text-slate-400">
              <span>New teacher</span>
            </div>
          )}
        </div>

        <div className="flex items-center text-sm font-semibold text-slate-800">
          <span className="text-green-600 mr-1">₹</span>
          {teacher.hourlyRate}/hour
        </div>
      </div>
    </div>
  );
};
const NotificationItem = ({ notification }) => {
  const notificationIcon = {
    session: <Calendar className="w-5 h-5 text-purple-500" />,
    booking: <BookCheck className="w-5 h-5 text-emerald-500" />,
    reminder: <Bell className="w-5 h-5 text-amber-500" />,
    message: <MessageSquare className="w-5 h-5 text-blue-500" />,
    alert: <AlertTriangle className="w-5 h-5 text-red-500" />,
  };

  return (
    <div className={`flex items-start p-4 rounded-xl transition-all duration-300 transform hover:scale-[1.01] hover:shadow-md ${notification.read ? 'bg-slate-50 text-slate-600' : 'bg-purple-50 text-slate-800 font-medium border border-purple-200'}`}>
      <div className="mr-3 flex-shrink-0">
        {notificationIcon[notification.type] || <Bell className="w-5 h-5 text-slate-400" />}
      </div>
      <div className="flex-1">
        <p className="text-sm">{notification.message}</p>
        <p className="text-xs text-slate-500 mt-1">{notification.time}</p>
      </div>
      {!notification.read && (
        <span className="ml-3 w-2 h-2 bg-purple-500 rounded-full animate-pulse"></span>
      )}
    </div>
  );
};

const StudentDashboard = () => {
  const [selectedSession, setSelectedSession] = useState(null);
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [activeMenuItem, setActiveMenuItem] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [favorites, setFavorites] = useState(() => getFromLocalStorage('favoriteTeachers', []));
  const [favoriteTeachersData, setFavoriteTeachersData] = useState([]);
  const hasFetchedData = useRef(false);

  const { unreadCount } = useNotifications();
<<<<<<< HEAD
=======
  
  // Use message notifications
>>>>>>> origin/main
  const { unreadMessageCount } = useMessageNotifications();

  // FIX: Move handleLogout inside StudentDashboard to avoid ReferenceError
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (err) {
      // Ignore network errors, still clear local data
    }
    setToLocalStorage('currentUser', null);
    // You should also clear notifications context state on logout
    // clearNotifications();
    navigate('/login');
  };

  const handleFetchData = useCallback(async () => {
    if (hasFetchedData.current) return;
    hasFetchedData.current = true;

    setLoading(true);

    const userFromStorage = getFromLocalStorage('currentUser');

    const cachedDashboardData = getFromLocalStorage('dashboardData');
    const cachedTeachers = getFromLocalStorage('cachedTeachers');

    if (userFromStorage && cachedDashboardData && cachedTeachers) {
      setCurrentUser(userFromStorage);
      setDashboardData(cachedDashboardData);
      setFavoriteTeachersData(cachedDashboardData.favoriteTeachersData || []);
      setLoading(false);
    }

    if (!userFromStorage) {
      navigate('/login');
      setLoading(false);
      return;
    }

    try {
      const API_BASE_URL = API_CONFIG.BASE_URL;

      // FIX: Changed fetch calls to rely on withCredentials and removed manual token headers
      const [profileRes, bookingsRes, favsRes, teachersRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/profile/student`, {
          credentials: 'include'
        }),
        fetch(`${API_BASE_URL}/api/bookings/student?status=all&limit=1000`, {
          credentials: 'include'
        }),
        fetch(`${API_BASE_URL}/api/profile/favourites`, {
          credentials: 'include'
        }),
        fetch(`${API_BASE_URL}${API_CONFIG.ENDPOINTS.TEACHERS_LIST}?sortByLocation=true`, {
          credentials: 'include'
        })
      ]);

      let profileData = userFromStorage || {};
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

      const formattedTeachers = formatTeachersForDashboard(teachers, favIds);
      // Use top 3 recommended teachers (already sorted by location from backend)
      const recommendedTeachers = formattedTeachers.slice(0, 3);

      const favTeachersData = formattedTeachers.filter(t => favIds.includes(t.id));

      const upcomingSessions = bookings.filter(b => b.status !== 'completed' && b.status !== 'cancelled' && b.status !== 'rejected').length;
      const completedSessions = bookings.filter(b => b.status === 'completed').length;
      const totalSpent = bookings.filter(b => b.status === 'confirmed' || b.status === 'completed').reduce((sum, b) => sum + (b.amount || 0), 0);

      const newDashboardData = {
        firstName: profileData.firstName,
        stats: {
          upcomingSessions,
          completedSessions,
          favoriteTeachers: favsData.favourites.length,
          totalSpent
        },
        upcomingSessions: bookings.filter(b => {
          const sessionDate = new Date(b.date);
          return (sessionDate >= new Date() && (b.status === 'pending' || b.status === 'confirmed'));
        }),
        recentTeachers: recommendedTeachers,
        allSessions: bookings,
        favoriteTeachersData: favTeachersData,
      };

      setDashboardData(newDashboardData);
      setToLocalStorage('dashboardData', newDashboardData);
      setToLocalStorage('cachedTeachers', formattedTeachers);

    } catch (error) {
      console.error('Error fetching data:', error);
      const storedData = getFromLocalStorage('dashboardData');
      if (storedData) {
        setDashboardData(storedData);
        setFavoriteTeachersData(storedData.favoriteTeachersData || []);
      } else {
        setDashboardData({
          firstName: userFromStorage?.firstName || 'Student',
          stats: { upcomingSessions: 0, completedSessions: 0, favoriteTeachers: 0, totalSpent: 0 },
          upcomingSessions: [],
          recentTeachers: [],
          allSessions: [],
          favoriteTeachersData: [],
        });
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    handleFetchData();
  }, [handleFetchData]);

  const toggleFavorite = async (teacherId) => {
    const isFav = favorites.includes(teacherId);
    let updatedFavorites;

    if (isFav) {
      updatedFavorites = favorites.filter(id => id !== teacherId);
    } else {
      updatedFavorites = [...favorites, teacherId];
    }
    setFavorites(updatedFavorites);
    localStorage.setItem('favoriteTeachers', JSON.stringify(updatedFavorites));

    setDashboardData(prevData => {
      const updatedFavTeachersData = prevData.favoriteTeachersData.filter(t => updatedFavorites.includes(t.id));
      const updatedRecentTeachers = prevData.recentTeachers.map(teacher => ({
        ...teacher,
        isFavorite: updatedFavorites.includes(teacher.id)
      }));
      return {
        ...prevData,
        recentTeachers: updatedRecentTeachers,
        favoriteTeachersData: updatedFavTeachersData,
        stats: {
          ...prevData.stats,
          favoriteTeachers: updatedFavorites.length,
        },
      };
    });

    try {
      // FIX: Removed manual token handling
      const API_BASE_URL = API_CONFIG.BASE_URL;
      const response = await fetch(`${API_BASE_URL}/api/profile/favourites`, {
        method: isFav ? 'DELETE' : 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ teacherId }),
        credentials: 'include'
      });

      if (!response.ok) {
        console.error('Failed to update favorite status on server.');
        setFavorites(isFav ? [...favorites, teacherId] : favorites.filter(id => id !== teacherId));
      }
    } catch (error) {
      console.error('Error toggling favorite on server:', error);
      setFavorites(isFav ? [...favorites, teacherId] : favorites.filter(id => id !== teacherId));
    }
  };

  const formatTeachersForDashboard = (teachers, currentFavorites) => {
    return teachers.map(teacher => {
      const subjects = teacher.teacherProfile?.subjectsTaught || teacher.teacherProfile?.subjects || [];
      const teacherId = teacher._id || teacher.id || `teacher_${Date.now()}_${Math.random()}`;
      const isFavorite = currentFavorites.includes(teacherId);

      return {
        id: teacherId,
        name: `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim() || 'Teacher',
        experience: `${teacher.teacherProfile?.experienceYears || 1} years experience`,
        image: teacher.teacherProfile?.photoUrl || teacher.profilePicture || `https://via.placeholder.com/150/9CA3AF/FFFFFF?text=${(teacher.firstName || 'T').charAt(0)}`,
        subjects: Array.isArray(subjects) ? subjects.map(s => s.text || s).slice(0, 3) : [subjects].filter(Boolean).slice(0, 3),
        rating: teacher.rating || 0,
        students: teacher.totalStudents || 0,
        hourlyRate: teacher.teacherProfile?.hourlyRate || 500,
        isFavorite: isFavorite,
        bio: teacher.teacherProfile?.bio || 'Experienced educator dedicated to student success.',
        email: teacher.email,
        phone: teacher.teacherProfile?.phone,
        location: teacher.teacherProfile?.location || 'India',
        teachingMode: teacher.teacherProfile?.teachingMode || 'hybrid',
        availability: teacher.teacherProfile?.availability || [],
        locationScore: teacher.locationScore,
        matchBadge: teacher.matchBadge
      };
    });
  };

  const getRandomTeachers = (teachers, count = 3) => {
    if (!teachers || teachers.length === 0) return [];
    if (teachers.length <= count) return teachers;
    const shuffled = [...teachers].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  };

  if (loading || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 text-slate-700">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
          <span className="text-lg">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  const cardClass = "relative p-6 bg-white/60 backdrop-blur-sm rounded-2xl shadow-sm border border-white/40";
  const sectionTitleClass = "text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3";
  const sidebarClass = `${isSidebarCollapsed ? 'w-24' : 'w-72'} bg-white/80 backdrop-blur-xl border-r border-white/20 ${isSidebarCollapsed ? 'p-4' : 'p-6'} flex flex-col relative overflow-hidden shadow-lg z-10 transition-all duration-300`;
  const mainContentClass = `flex-1 p-8 overflow-y-auto`;

  return (
    <UserContext.Provider value={currentUser}>
      <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/30 to-purple-600/30 rounded-full blur-3xl animate-float"></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-purple-400/20 to-pink-600/20 rounded-full blur-3xl animate-float-delayed"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-indigo-400/10 to-blue-600/10 rounded-full blur-3xl animate-float-slow"></div>
        </div>
        <div className="relative z-10 flex min-h-screen w-full">
<<<<<<< HEAD
          <aside className={sidebarClass}>
            <div className="relative z-10 flex flex-col h-full">
              <div className={`flex items-center mb-8 ${isSidebarCollapsed ? 'flex-col space-y-4' : 'justify-between'}`}>
                {!isSidebarCollapsed && (
                  <Link to="/" className="flex items-center group">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mr-3 transform group-hover:scale-105 transition-all duration-300">
                      <GraduationCap className="w-6 h-6 text-white" />
=======
        {/* Sidebar */}
        <aside className={sidebarClass}>
          <div className="relative z-10 flex flex-col h-full">
            {/* Collapse Toggle Button */}
            <div className={`flex items-center mb-8 ${isSidebarCollapsed ? 'flex-col space-y-4' : 'justify-between'}`}>
              {!isSidebarCollapsed && (
                <Link to="/" className="flex items-center group">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mr-3 transform group-hover:scale-105 transition-all duration-300">
                    <GraduationCap className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors duration-200">Yuvshiksha</h2>
                    <p className="text-slate-600 text-xs group-hover:text-slate-700 transition-colors duration-200">Student Portal</p>
                  </div>
                </Link>
              )}
              
              {isSidebarCollapsed && (
                <Link to="/" className="group mb-2">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center transform group-hover:scale-105 transition-all duration-300 shadow-lg">
                    <GraduationCap className="w-7 h-7 text-white" />
                  </div>
                </Link>
              )}
              
              <button
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className={`p-2 rounded-lg hover:bg-white/60 transition-colors duration-200 text-slate-600 hover:text-blue-600 shadow-sm ${isSidebarCollapsed ? 'w-full' : ''}`}
                title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {isSidebarCollapsed ? <ChevronRight className="w-5 h-5 mx-auto" /> : <ChevronLeft className="w-5 h-5" />}
              </button>
            </div>

            <nav className={`flex-1 mb-8 overflow-hidden ${isSidebarCollapsed ? 'space-y-3' : 'space-y-2'}`}>
              <SidebarButton
                icon={Home}
                text="Dashboard"
                onClick={() => setActiveMenuItem('dashboard')}
                isActive={activeMenuItem === 'dashboard'}
                isCollapsed={isSidebarCollapsed}
              />
              <SidebarButton
                icon={Calendar}
                text="My Sessions"
                onClick={() => setActiveMenuItem('sessions')}
                isActive={activeMenuItem === 'sessions'}
                count={dashboardData?.upcomingSessions?.length || 0}
                isCollapsed={isSidebarCollapsed}
              />
              <SidebarButton
                icon={Bookmark}
                text="Favorites"
                onClick={() => setActiveMenuItem('favorites')}
                isActive={activeMenuItem === 'favorites'}
                count={dashboardData?.recentTeachers?.filter(t => t.isFavorite).length || 0}
                isCollapsed={isSidebarCollapsed}
              />
              
              {/* Messages Navigation */}
              <div className="relative">
                <Link
                  to="/student/messages"
                  className={`flex items-center w-full rounded-xl text-left font-medium transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg overflow-hidden ${
                    isSidebarCollapsed ? 'p-3 justify-center' : 'p-3'
                  } text-slate-700 hover:bg-white/60 hover:text-blue-600 hover:backdrop-blur-sm`}
                  title={isSidebarCollapsed ? 'Messages' : ''}
                >
                  <MessageSquare className={`w-5 h-5 ${isSidebarCollapsed ? '' : 'mr-3'} text-slate-600 hover:text-blue-600 transition-colors duration-300 flex-shrink-0`} />
                  {!isSidebarCollapsed && (
                    <span className="transition-all duration-300 truncate">Messages</span>
                  )}
                </Link>
                {unreadMessageCount > 0 && (
                  <span className={`absolute bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border border-white shadow-sm ${
                    isSidebarCollapsed 
                      ? 'w-4 h-4 -top-1 -right-1' 
                      : 'w-5 h-5 top-2 right-2'
                  }`}>
                    {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
                  </span>
                )}
              </div>
              
              {/* Navigation Links */}
              <div className="border-t border-white/20 pt-4 mt-4">
                <Link
                  to="/student/find-teachers"
                  className={`flex items-center w-full p-3 text-left text-slate-700 hover:bg-white/40 rounded-xl transition-all duration-200 group overflow-hidden ${isSidebarCollapsed ? 'justify-center' : 'space-x-3'}`}
                  title={isSidebarCollapsed ? 'Find Teachers' : ''}
                >
                  <Search className="w-5 h-5 group-hover:text-blue-600 transition-colors duration-200 flex-shrink-0" />
                  {!isSidebarCollapsed && <span className="group-hover:text-blue-600 transition-colors duration-200 truncate">Find Teachers</span>}
                </Link>
                {/* Messages button hidden as per request */}
              </div>
            </nav>

            <div className="mt-auto">
              <button
                onClick={() => {
                  // Correctly use the imported setToLocalStorage
                  setToLocalStorage('currentUser', null); // Clear current user
                  navigate('/login');
                }}
                className={`w-full bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-semibold hover:from-red-700 hover:to-red-800 transition-all duration-300 shadow-lg flex items-center justify-center transform hover:scale-[1.02] hover:-translate-y-1 ${isSidebarCollapsed ? 'py-3 px-3' : 'py-3 space-x-2'}`}
                title={isSidebarCollapsed ? 'Logout' : ''}
              >
                <LogOut className={`w-5 h-5 ${isSidebarCollapsed ? '' : ''}`} />
                {!isSidebarCollapsed && <span>Logout</span>}
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className={mainContentClass}>
          <MainHeader currentUser={currentUser} />

          {activeMenuItem === 'dashboard' && (
            <section className="space-y-10">
              {/* Stat Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  title="Upcoming Sessions"
                  value={dashboardData.stats.upcomingSessions}
                  icon={Calendar}
                  color="primary"
                  description="All time"
                />
                <StatCard
                  title="Completed Sessions"
                  value={dashboardData.stats.completedSessions}
                  icon={BookCheck}
                  color="secondary"
                  description="All time"
                />
                <StatCard
                  title="Favorite Teachers"
                  value={dashboardData.stats.favoriteTeachers}
                  icon={Heart}
                  color="accent"
                  description="Bookmarked"
                />
                <StatCard
                  title="Total Spent"
                  value={`₹${dashboardData.stats.totalSpent.toLocaleString()}`}
                  icon={TrendingUp}
                  color="success"
                  description="Learning investment"
                />
              </div>

              {/* Upcoming Sessions */}
              <div className={cardClass}>
                <h2 className={sectionTitleClass}>
                  <Calendar className="w-7 h-7 text-purple-600" />
                  Upcoming Sessions
                </h2>
                <SessionDetailModal session={selectedSession} onClose={() => setSelectedSession(null)} />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...dashboardData.upcomingSessions]
                    .sort((a, b) => new Date(a.date) - new Date(b.date))
                    .map(session => (
                      <SessionCard key={session.id} session={session} onViewDetail={setSelectedSession} />
                    ))}
                </div>
                {dashboardData.upcomingSessions.length === 0 && (
                  <div className="text-center py-12">
                    <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-500 text-lg mb-4">No upcoming sessions</p>
                    <Link 
                      to="/student/find-teachers"
                      className="inline-flex items-center bg-gradient-to-r from-purple-600 to-violet-600 text-white px-6 py-3 rounded-xl font-medium hover:from-purple-700 hover:to-violet-700 transition-all duration-200"
                    >
                      <Search className="w-5 h-5 mr-2" />
                      Find Teachers
                    </Link>
                  </div>
                )}
              </div>

              {/* Recommended Teachers */}
              <div className={cardClass}>
                <h2 className={sectionTitleClass}>
                  <Users className="w-7 h-7 text-purple-600" />
                  Recommended Teachers
                </h2>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-purple-600 mr-2" />
                    <span className="text-slate-600">Loading teachers...</span>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {dashboardData.recentTeachers.map(teacher => (
                        <TeacherCard key={teacher.id} teacher={teacher} onToggleFavorite={toggleFavorite} />
                      ))}
>>>>>>> origin/main
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors duration-200">Yuvsiksha</h2>
                      <p className="text-slate-600 text-xs group-hover:text-slate-700 transition-colors duration-200">Student Portal</p>
                    </div>
                  </Link>
                )}
                {isSidebarCollapsed && (
                  <Link to="/" className="group mb-2">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center transform group-hover:scale-105 transition-all duration-300 shadow-lg">
                      <GraduationCap className="w-7 h-7 text-white" />
                    </div>
                  </Link>
                )}
                <button
                  onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                  className={`p-2 rounded-lg hover:bg-white/60 transition-colors duration-200 text-slate-600 hover:text-blue-600 shadow-sm ${isSidebarCollapsed ? 'w-full' : ''}`}
                  title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                  {isSidebarCollapsed ? <ChevronRight className="w-5 h-5 mx-auto" /> : <ChevronLeft className="w-5 h-5" />}
                </button>
              </div>
              <nav className={`flex-1 mb-8 overflow-hidden ${isSidebarCollapsed ? 'space-y-3' : 'space-y-2'}`}>
                <SidebarButton
                  icon={Home}
                  text="Dashboard"
                  onClick={() => setActiveMenuItem('dashboard')}
                  isActive={activeMenuItem === 'dashboard'}
                  isCollapsed={isSidebarCollapsed}
                />
                <SidebarButton
                  icon={Calendar}
                  text="My Sessions"
                  onClick={() => setActiveMenuItem('sessions')}
                  isActive={activeMenuItem === 'sessions'}
                  count={dashboardData?.upcomingSessions?.length || 0}
                  isCollapsed={isSidebarCollapsed}
                />
                <SidebarButton
                  icon={Bookmark}
                  text="Favorites"
                  onClick={() => setActiveMenuItem('favorites')}
                  isActive={activeMenuItem === 'favorites'}
                  count={favorites.length}
                  isCollapsed={isSidebarCollapsed}
                />
                <div className="relative">
                  <Link
                    to="/student/messages"
                    className={`flex items-center w-full rounded-xl text-left font-medium transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg overflow-hidden ${isSidebarCollapsed ? 'p-3 justify-center' : 'p-3'
                      } text-slate-700 hover:bg-white/60 hover:text-blue-600 hover:backdrop-blur-sm`}
                    title={isSidebarCollapsed ? 'Messages' : ''}
                  >
                    <MessageSquare className={`w-5 h-5 ${isSidebarCollapsed ? '' : 'mr-3'} text-slate-600 hover:text-blue-600 transition-colors duration-300 flex-shrink-0`} />
                    {!isSidebarCollapsed && (
                      <span className="transition-all duration-300 truncate">Messages</span>
                    )}
                  </Link>
                  {unreadMessageCount > 0 && (
                    <span className={`absolute bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border border-white shadow-sm ${isSidebarCollapsed
                      ? 'w-4 h-4 -top-1 -right-1'
                      : 'w-5 h-5 top-2 right-2'
                      }`}>
                      {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
                    </span>
                  )}
                </div>
                <div className="border-t border-white/20 pt-4 mt-4">
                  <Link
                    to="/student/find-teachers"
                    className={`flex items-center w-full p-3 text-left text-slate-700 hover:bg-white/40 rounded-xl transition-all duration-200 group overflow-hidden ${isSidebarCollapsed ? 'justify-center' : 'space-x-3'}`}
                    title={isSidebarCollapsed ? 'Find Teachers' : ''}
                  >
                    <Search className="w-5 h-5 group-hover:text-blue-600 transition-colors duration-200 flex-shrink-0" />
                    {!isSidebarCollapsed && <span className="group-hover:text-blue-600 transition-colors duration-200 truncate">Find Teachers</span>}
                  </Link>
                </div>
              </nav>
              <div className="mt-auto">
                <button
                  onClick={handleLogout}
                  className={`w-full bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-semibold hover:from-red-700 hover:to-red-800 transition-all duration-300 shadow-lg flex items-center justify-center transform hover:scale-[1.02] hover:-translate-y-1 ${isSidebarCollapsed ? 'py-3 px-3' : 'py-3 space-x-2'}`}
                  title={isSidebarCollapsed ? 'Logout' : ''}
                >
                  <LogOut className={`w-5 h-5 ${isSidebarCollapsed ? '' : ''}`} />
                  {!isSidebarCollapsed && <span>Logout</span>}
                </button>
              </div>
            </div>
          </aside>
          <main className={mainContentClass}>
            <MainHeader currentUser={currentUser} unreadMessageCount={unreadMessageCount} />
            {activeMenuItem === 'dashboard' && dashboardData && (
              <section className="space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatCard
                    title="Upcoming Sessions"
                    value={dashboardData.stats.upcomingSessions}
                    icon={Calendar}
                    color="primary"
                    description="All time"
                  />
                  <StatCard
                    title="Completed Sessions"
                    value={dashboardData.stats.completedSessions}
                    icon={BookCheck}
                    color="secondary"
                    description="All time"
                  />
                  <StatCard
                    title="Favorite Teachers"
                    value={favorites.length}
                    icon={Heart}
                    color="accent"
                    description="Bookmarked"
                  />
                  <StatCard
                    title="Total Spent"
                    value={`₹${dashboardData.stats.totalSpent.toLocaleString()}`}
                    icon={TrendingUp}
                    color="success"
                    description="Learning investment"
                  />
                </div>
                <div className={cardClass}>
                  <h2 className={sectionTitleClass}>
                    <Calendar className="w-7 h-7 text-purple-600" />
                    Upcoming Sessions
                  </h2>
                  <SessionDetailModal session={selectedSession} onClose={() => setSelectedSession(null)} />
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {dashboardData.upcomingSessions.length > 0 ? (
                      dashboardData.upcomingSessions
                        .sort((a, b) => new Date(a.date) - new Date(b.date))
                        .map(session => (
                          <SessionCard key={session.id || session._id} session={session} onViewDetail={setSelectedSession} />
                        ))
                    ) : (
                      <div className="text-center py-12 col-span-full">
                        <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                        <p className="text-slate-500 text-lg mb-4">No upcoming sessions</p>
                        <Link
                          to="/student/find-teachers"
                          className="inline-flex items-center bg-gradient-to-r from-purple-600 to-violet-600 text-white px-6 py-3 rounded-xl font-medium hover:from-purple-700 hover:to-violet-700 transition-all duration-200"
                        >
                          <Search className="w-5 h-5 mr-2" />
                          Find Teachers
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
                <div className={cardClass}>
                  <h2 className={sectionTitleClass}>
                    <Users className="w-7 h-7 text-purple-600" />
                    Recommended Teachers
                  </h2>
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-purple-600 mr-2" />
                      <span className="text-slate-600">Loading teachers...</span>
                    </div>
                  ) : dashboardData.recentTeachers && dashboardData.recentTeachers.length > 0 ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {dashboardData.recentTeachers.map(teacher => (
                          <TeacherCard key={teacher.id} teacher={teacher} onToggleFavorite={toggleFavorite} />
                        ))}
                      </div>
                      <div className="text-center mt-8">
                        <Link
                          to="/student/find-teachers"
                          className="inline-flex items-center text-purple-600 hover:text-purple-800 font-medium transition-colors duration-200"
                        >
                          View All Teachers
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Link>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                      <p className="text-slate-500 text-lg mb-4">No teachers available</p>
                      <p className="text-slate-400 mb-6">Start exploring and save your favorite teachers for quick access</p>
                      <Link
                        to="/student/find-teachers"
                        className="inline-flex items-center bg-gradient-to-r from-purple-600 to-violet-600 text-white px-6 py-3 rounded-xl font-medium hover:from-purple-700 hover:to-violet-700 transition-all duration-200"
                      >
                        <Search className="w-5 h-5 mr-2" />
                        Discover Teachers
                      </Link>
                    </div>
                  )}
                </div>
                {(() => {
                  const { notifications = [] } = useNotifications();
                  return (
                    <div className={cardClass}>
                      <h2 className={sectionTitleClass}>
                        <Bell className="w-7 h-7 text-purple-600" />
                        Recent Notifications
                      </h2>
                      <div className="space-y-4">
                        {notifications.length > 0 ? (
                          notifications
                            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                            .slice(0, 2)
                            .map(notification => (
                              <NotificationItem key={notification.id || notification._id} notification={notification} />
                            ))
                        ) : (
                          <div className="text-center py-4">
                            <p className="text-slate-500">No new notifications.</p>
                          </div>
                        )}
                      </div>
                      {notifications.length > 2 && (
                        <div className="text-center mt-6">
                          <Link to="/notifications" className="inline-flex items-center text-purple-600 font-semibold hover:text-purple-800 transition-colors duration-200">
                            View All Notifications <ChevronRight className="w-4 h-4 ml-1" />
                          </Link>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </section>
            )}

            {activeMenuItem === 'sessions' && dashboardData && (
              <section>
                <h2 className={sectionTitleClass}>
                  <Calendar className="w-7 h-7 text-purple-600" /> My Sessions
                </h2>
                <div className="space-y-6">
                  {dashboardData.allSessions && dashboardData.allSessions.length > 0 ? (
                    dashboardData.allSessions
                      .filter(session => ['confirmed', 'pending', 'completed', 'complete', 'reject', 'rejected'].includes((session.status || '').toLowerCase()))
                      .sort((a, b) => new Date(a.date) - new Date(b.date))
                      .map(session => (
                        <div key={session.id || session._id} className="overflow-x-auto">
                          <div className="bg-white/80 rounded-xl p-4 border border-slate-200 shadow hover:shadow-lg transition-all duration-200 min-w-[320px] flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div>
                              <div className="font-semibold text-slate-800 text-base mb-1">{session.teacherName || (session.teacher && session.teacher.name) || session.teacher || 'N/A'}</div>
                              <div className="flex items-center text-xs text-slate-500 mb-2">
                                {new Date(session.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                <span className="ml-3">{session.time} ({session.duration}h)</span>
                              </div>
                              <div className="flex items-center text-sm text-slate-700 mb-1">
                                <span className="font-medium">Subject:</span>&nbsp;{session.subject}
                              </div>
                              <div className="flex items-center text-sm text-slate-700 mb-1">
                                <span className="font-medium">Amount:</span>&nbsp;₹{session.amount}
                              </div>
                            </div>
                            <div className="mt-2 text-xs font-semibold px-2 py-1 rounded-full w-fit self-start md:self-auto"
                              style={{ backgroundColor: session.status === 'completed' || session.status === 'complete' ? '#d1fae5' : session.status === 'confirmed' ? '#e0e7ff' : session.status === 'pending' ? '#fef9c3' : '#fee2e2', color: session.status === 'completed' || session.status === 'complete' ? '#065f46' : session.status === 'confirmed' ? '#3730a3' : session.status === 'pending' ? '#92400e' : '#991b1b' }}>
                              {session.status}
                            </div>
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="text-center py-12">
                      <Calendar className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                      <p className="text-slate-500 text-lg mb-4">No sessions scheduled</p>
                      <Link
                        to="/student/find-teachers"
                        className="inline-flex items-center bg-gradient-to-r from-purple-600 to-violet-600 text-white px-6 py-3 rounded-xl font-medium hover:from-purple-700 hover:to-violet-700 transition-all duration-200"
                      >
                        <Search className="w-5 h-5 mr-2" />
                        Book Your First Session
                      </Link>
                    </div>
                  )}
                </div>
              </section>
            )}

            {activeMenuItem === 'favorites' && dashboardData && (
              <section>
                <h2 className={sectionTitleClass}>
                  <Heart className="w-7 h-7 text-purple-600" /> Favorite Teachers
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {dashboardData.favoriteTeachersData && dashboardData.favoriteTeachersData.length > 0 ? (
                    dashboardData.favoriteTeachersData.map(teacher => (
                      <TeacherCard key={teacher.id} teacher={teacher} onToggleFavorite={toggleFavorite} />
                    ))
                  ) : (
                    <div className="text-center py-12 col-span-full">
                      <Heart className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                      <p className="text-slate-500 text-lg mb-4">No favorite teachers yet</p>
                      <p className="text-slate-400 mb-6">Start exploring and save your favorite teachers for quick access</p>
                      <Link
                        to="/student/find-teachers"
                        className="inline-flex items-center bg-gradient-to-r from-purple-600 to-violet-600 text-white px-6 py-3 rounded-xl font-medium hover:from-purple-700 hover:to-violet-700 transition-all duration-200"
                      >
                        <Search className="w-5 h-5 mr-2" />
                        Discover Teachers
                      </Link>
                    </div>
                  )}
                </div>
              </section>
            )}
          </main>
        </div>
      </div>
    </UserContext.Provider>
  );
};

export default StudentDashboard;