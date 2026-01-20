import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Filter, Star, Clock, BookOpen, Award, ChevronDown, X, Check, Heart, MapPin, Calendar, DollarSign, Users, Zap, SlidersHorizontal, Loader2, MessageCircle } from "lucide-react";
import API_CONFIG from '../../config/api';
// Helper function to get teacher avatar, availability days, etc.
const getTeacherAvatar = (teacher) => {
  if (teacher.profilePicture) {
    return teacher.profilePicture;
  }
  const firstName = teacher.name || 'T';
  return firstName.charAt(0).toUpperCase();
};

const getAvailabilityDays = (availability) => {
  if (!availability || !Array.isArray(availability)) return ["Mon", "Wed", "Fri"];
  return availability.map(slot => slot.day).slice(0, 3);
};

export default function EnhancedTeacherPlatform() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [showFavouritesOnly, setShowFavouritesOnly] = useState(false);

  // Load favorites from backend on mount
  useEffect(() => {
    const fetchFavourites = async () => {
      try {
        const API_BASE_URL = API_CONFIG.BASE_URL;
        const res = await fetch(`${API_BASE_URL}/api/profile/favourites`, {
          credentials: 'include'
        });
        if (res.ok) {
          const data = await res.json();
          setFavorites(data.favourites || []);
        }
      } catch (err) {
        console.error('Failed to load favourites from backend', err);
      }
    };
    fetchFavourites();
  }, []);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterBoard, setFilterBoard] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [sortBy, setSortBy] = useState("location");
  const [viewMode, setViewMode] = useState("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [experienceRange, setExperienceRange] = useState([0, 10]);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    date: "",
    time: "",
    duration: "1",
    message: "",
  });
  const [notification, setNotification] = useState("");

  const navigate = useNavigate();

  // Get current user
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

  // Check login status function, defined as a stable useCallback
  const checkLoginStatus = useCallback(() => {
    const token = localStorage.getItem('token');
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

    if (!token || !currentUser.role) {
      console.error('❌ Authentication failed. Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
      return false;
    }
    return true;
  }, [navigate]);

  // Fetch real teachers from backend
  const fetchTeachers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');

      // Check if user is logged in
      if (!currentUser || !currentUser.role) {
        console.log('❌ No current user found, redirecting to login');
        setError('Please login to view teachers');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
        return;
      }

      // Use the API config instead of hardcoded URL
      const API_BASE_URL = API_CONFIG.BASE_URL;

      // Always request location-based sorting/data to enable "Near Me" features
      const response = await fetch(`${API_BASE_URL}${API_CONFIG.ENDPOINTS.TEACHERS_LIST}?sortByLocation=true`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        const teachersData = await response.json();

        // Format teachers data for the UI
        const formattedTeachers = teachersData.map(teacher => {
          // Handle both possible data structures for subjects
          const subjects = teacher.teacherProfile?.subjectsTaught ||
            teacher.teacherProfile?.subjects ||
            [];
          const boards = teacher.teacherProfile?.boardsTaught ||
            teacher.teacherProfile?.boards ||
            [];

          return {
            id: teacher._id || teacher.id,
            name: `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim() || 'Teacher',
            subject: Array.isArray(subjects) ? subjects[0]?.text || subjects[0] : subjects,
            board: Array.isArray(boards) ? boards[0]?.text || boards[0] : boards,
            experience: teacher.teacherProfile?.experienceYears || 1,
            fee: teacher.teacherProfile?.hourlyRate || 500,
            rating: teacher.rating || 0,
            totalStudents: teacher.totalStudents || 0,
            avatar: getTeacherAvatar(teacher),
            specializations: Array.isArray(subjects) ? subjects.map(s => s.text || s) : [subjects].filter(Boolean),
            location: teacher.teacherProfile?.location || 'India',
            availability: getAvailabilityDays(teacher.teacherProfile?.availability) || ["Mon", "Wed", "Fri"],
            bio: teacher.teacherProfile?.bio || 'Experienced educator dedicated to student success.',
            languages: ["English", "Hindi"],
            qualifications: [teacher.teacherProfile?.qualifications || 'Graduate'],
            verified: true,
            email: teacher.email,
            phone: teacher.teacherProfile?.phone,
            teachingMode: teacher.teacherProfile?.teachingMode || 'hybrid',
            profilePicture: teacher.teacherProfile?.photoUrl,
            locationScore: teacher.locationScore,
            matchBadge: teacher.matchBadge
          };
        });

        setTeachers(formattedTeachers);
        return;
      } else {
        const errorText = await response.text();
        console.error('❌ API Error:', response.status, errorText);

        if (response.status === 401) {
          console.log('🔑 Token is invalid, removing and redirecting');
          setError('Your session has expired. Please login again.');
          setTimeout(() => {
            navigate('/login');
          }, 2000);
          return;
        }

        throw new Error('API request failed');
      }
    } catch (apiError) {
      console.log('⚠️ API not available, trying localStorage fallback...');

      // Get all users from localStorage
      const allUsers = JSON.parse(localStorage.getItem('users') || '[]');

      // If no users in localStorage but we have a current teacher user, add them
      let usersToCheck = allUsers;
      if (allUsers.length === 0 && currentUser.role === 'teacher' && currentUser.teacherProfile) {
        usersToCheck = [currentUser];
        // Also save to localStorage for future use
        localStorage.setItem('users', JSON.stringify([currentUser]));
      }

      const listedTeachers = usersToCheck.filter(user => {
        const isTeacher = user.role === 'teacher';
        const hasProfile = user.teacherProfile;
        const isListed = user.teacherProfile?.isListed === true;

        return isTeacher && hasProfile && isListed;
      });

      if (listedTeachers.length === 0) {
        // If current user is a teacher but not in the list, check their status
        if (currentUser.role === 'teacher' && currentUser.teacherProfile) {
          if (currentUser.teacherProfile.isListed) {
            listedTeachers.push(currentUser);
          }
        }
      }

      const formattedTeachers = listedTeachers.map(teacher => {
        // Handle both possible data structures
        const subjects = teacher.teacherProfile?.subjectsTaught ||
          teacher.teacherProfile?.subjects ||
          [];
        const boards = teacher.teacherProfile?.boardsTaught ||
          teacher.teacherProfile?.boards ||
          [];

        return {
          id: teacher._id || teacher.id,
          name: `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim() || 'Teacher',
          subject: Array.isArray(subjects) ? (subjects[0]?.text || subjects[0]) : subjects,
          board: Array.isArray(boards) ? (boards[0]?.text || boards[0]) : boards,
          experience: teacher.teacherProfile?.experienceYears || 1,
          fee: teacher.teacherProfile?.hourlyRate || 500,
          rating: teacher.rating || 0,
          totalStudents: teacher.totalStudents || 0,
          avatar: getTeacherAvatar(teacher),
          specializations: Array.isArray(subjects) ? subjects.map(s => s.text || s) : [subjects].filter(Boolean),
          location: teacher.teacherProfile?.location || 'India',
          availability: getAvailabilityDays(teacher.teacherProfile?.availability),
          bio: teacher.teacherProfile?.bio || 'Experienced educator dedicated to student success.',
          languages: ["English", "Hindi"],
          qualifications: [teacher.teacherProfile?.qualifications || 'Graduate'],
          verified: true,
          email: teacher.email,
          phone: teacher.teacherProfile?.phone,
          teachingMode: teacher.teacherProfile?.teachingMode || 'hybrid',
          profilePicture: teacher.teacherProfile?.photoUrl
        };
      });

      setTeachers(formattedTeachers);
    } finally {
      setLoading(false);
    }
  }, [navigate, checkLoginStatus]);

  // Load teachers on component mount
  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  // Animated notification system
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Advanced filtering and sorting
  const filteredAndSortedTeachers = useMemo(() => {
    let filtered = teachers.filter((teacher) => {
      const matchesSearch =
        teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        teacher.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        teacher.specializations.some(spec =>
          spec.toLowerCase().includes(searchTerm.toLowerCase())
        );
      const matchesBoard = !filterBoard || teacher.board === filterBoard;
      const matchesSubject = !filterSubject || teacher.subject === filterSubject;
      const matchesPrice = teacher.fee >= priceRange[0] && teacher.fee <= priceRange[1];
      const matchesExperience = teacher.experience >= experienceRange[0] && teacher.experience <= experienceRange[1];
      const matchesFavourite = !showFavouritesOnly || favorites.includes(teacher.id);
      return matchesSearch && matchesBoard && matchesSubject && matchesPrice && matchesExperience && matchesFavourite;
    });
    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "location":
          // Sort by location score (highest first)
          return (b.locationScore?.score || 0) - (a.locationScore?.score || 0);
        case "rating": return b.rating - a.rating;
        case "experience": return b.experience - a.experience;
        case "fee-low": return a.fee - b.fee;
        case "fee-high": return b.fee - a.fee;
        case "students": return b.totalStudents - a.totalStudents;
        default: return 0;
      }
    });
    return filtered;
  }, [teachers, searchTerm, filterBoard, filterSubject, sortBy, priceRange, experienceRange, showFavouritesOnly, favorites]);

  const handleBook = (teacher) => {
    // Redirect to BookClass.jsx with teacher id
    navigate(`/student/book-class/${teacher.id}`);
  };

  const handleMessage = (teacher) => {
    // Navigate to messages page with teacher ID
    navigate('/student/messages', {
      state: {
        selectedTeacherId: teacher._id || teacher.id,
        teacherName: teacher.name || `${teacher.firstName} ${teacher.lastName}`
      }
    });
  };

  const toggleFavorite = async (teacherId) => {
    const API_BASE_URL = API_CONFIG.BASE_URL;
    const isFav = favorites.includes(teacherId);
    try {
      const res = await fetch(`${API_BASE_URL}/api/profile/favourites`, {
        method: isFav ? 'DELETE' : 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ teacherId }),
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setFavorites(data.favourites || []);
        setNotification(isFav ? "Removed from favorites ❤️" : "Added to favorites! ❤️");
      } else {
        setNotification('Failed to update favourites');
      }
    } catch (err) {
      setNotification('Failed to update favourites');
    }
  };

  const uniqueBoards = [...new Set(teachers.map(t => t.board))];
  const uniqueSubjects = [...new Set(teachers.map(t => t.subject))];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100">
      {/* Floating orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300/30 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute top-0 -left-4 w-72 h-72 bg-blue-300/30 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-40 left-20 w-80 h-80 bg-indigo-300/30 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 bg-white/90 backdrop-blur-xl border border-white/20 text-slate-800 px-6 py-3 rounded-xl shadow-xl transform transition-all duration-300 animate-pulse">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="font-medium">{notification}</span>
          </div>
        </div>
      )}

      {/* Hero Header */}
      <div className="relative z-10 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white py-16 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mr-4 mb-2">
              <Search className="w-8 h-8 text-white/80" />
            </div>
            <h1 className="text-5xl font-bold">
              Find Your Perfect Teacher
            </h1>
          </div>
          <p className="text-xl opacity-90 mb-8">
            Discover exceptional educators and transform your learning journey
          </p>

          {/* Advanced Search Bar */}
          <div className="max-w-2xl mx-auto relative">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-2 shadow-xl">
              <div className="flex items-center">
                <div className="pl-4">
                  <Search className="text-white/80 w-5 h-5" />
                </div>
                <input
                  type="text"
                  placeholder="Search teachers, subjects, or specializations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 bg-transparent text-white placeholder-white/80 px-4 py-4 focus:outline-none text-lg font-medium"
                />
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="bg-white/20 hover:bg-white/30 transition-all duration-200 rounded-xl p-3 mr-2 group"
                >
                  <SlidersHorizontal className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Favourites Toggle */}
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setShowFavouritesOnly(fav => !fav)}
            className={`px-4 py-2 rounded-lg font-semibold border transition-all duration-200 ${showFavouritesOnly ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white/70 text-indigo-600 border-indigo-200 hover:bg-indigo-50 backdrop-blur-sm'}`}
          >
            {showFavouritesOnly ? 'Show All Teachers' : 'Show Favourites'}
          </button>
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <div className="bg-white/60 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl p-6 mb-8 transform transition-all duration-300">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                <Filter className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800">Advanced Filters</h3>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Board</label>
                <select
                  value={filterBoard}
                  onChange={(e) => setFilterBoard(e.target.value)}
                  className="w-full p-3 bg-white/70 backdrop-blur-sm border border-white/30 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
                >
                  <option value="">All Boards</option>
                  {uniqueBoards.map(board => (
                    <option key={board} value={board}>{board}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Subject</label>
                <select
                  value={filterSubject}
                  onChange={(e) => setFilterSubject(e.target.value)}
                  className="w-full p-3 bg-white/70 backdrop-blur-sm border border-white/30 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
                >
                  <option value="">All Subjects</option>
                  {uniqueSubjects.map(subject => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full p-3 bg-white/70 backdrop-blur-sm border border-white/30 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
                >
                  <option value="location">Near Me</option>
                  <option value="experience">Most Experienced</option>
                  <option value="fee-low">Price: Low to High</option>
                  <option value="fee-high">Price: High to Low</option>
                  <option value="students">Most Popular</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Price Range (₹/hour)</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={priceRange[0]}
                    onChange={(e) => setPriceRange([parseInt(e.target.value), priceRange[1]])}
                    className="w-20 p-2 bg-white/70 backdrop-blur-sm border border-white/30 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    placeholder="Min"
                  />
                  <span className="text-slate-600">-</span>
                  <input
                    type="number"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                    className="w-20 p-2 bg-white/70 backdrop-blur-sm border border-white/30 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    placeholder="Max"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results Header */}
        <div className="bg-white/60 backdrop-blur-xl border border-white/20 rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <h2 className="text-2xl font-bold text-gray-800">
                {filteredAndSortedTeachers.length} Teachers Found
              </h2>
              {teachers.length === 0 && !loading && (
                <div className="text-sm text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
                  No teachers are currently listed
                </div>
              )}
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-lg transition-all ${viewMode === "grid" ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white" : "bg-white/70 hover:bg-white/90 text-slate-600"}`}
              >
                <div className="grid grid-cols-2 gap-1 w-4 h-4">
                  <div className="bg-current rounded-sm"></div>
                  <div className="bg-current rounded-sm"></div>
                  <div className="bg-current rounded-sm"></div>
                  <div className="bg-current rounded-sm"></div>
                </div>
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-lg transition-all ${viewMode === "list" ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white" : "bg-white/70 hover:bg-white/90 text-slate-600"}`}
              >
                <div className="space-y-1 w-4 h-4">
                  <div className="bg-current h-1 rounded"></div>
                  <div className="bg-current h-1 rounded"></div>
                  <div className="bg-current h-1 rounded"></div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="bg-white/60 backdrop-blur-xl border border-white/20 rounded-2xl p-8 text-center">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
              <p className="text-slate-600 font-medium">Loading amazing teachers...</p>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <div className="bg-red-50/60 backdrop-blur-xl border border-red-200/40 rounded-2xl p-8 max-w-md mx-auto">
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-2xl font-bold text-red-800 mb-2">Oops! Something went wrong</h3>
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={fetchTeachers}
                className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white font-semibold py-2 px-6 rounded-xl transition-all duration-200"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Teachers Grid/List */}
            <div className={`${viewMode === "grid" ? "grid md:grid-cols-2 lg:grid-cols-3 gap-8" : "space-y-6"}`}>
              {filteredAndSortedTeachers.map((teacher, index) => (
                <div
                  key={teacher.id}
                  className={`group bg-white/60 backdrop-blur-xl border border-white/20 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden hover:border-indigo-200/50 transform hover:-translate-y-2 ${viewMode === "list" ? "flex" : "flex flex-col h-full"
                    }`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className={`${viewMode === "list" ? "flex-shrink-0 w-48" : ""} relative`}>
                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 text-white relative overflow-hidden h-full">
                      <div className="absolute inset-0 bg-black/10 group-hover:bg-black/5 transition-all duration-300"></div>
                      <div className="relative z-10 h-full flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <div className="text-4xl">
                              {teacher.profilePicture ? (
                                <img
                                  src={teacher.profilePicture}
                                  alt={teacher.name}
                                  className="w-16 h-16 rounded-full object-cover border-2 border-white/20"
                                />
                              ) : (
                                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-xl font-bold border-2 border-white/20">
                                  {teacher.avatar}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              {teacher.verified && (
                                <div className="bg-green-500 rounded-full p-1">
                                  <Check className="w-3 h-3 text-white" />
                                </div>
                              )}
                              <button
                                onClick={() => toggleFavorite(teacher.id)}
                                className="hover:scale-110 transition-transform duration-200"
                              >
                                <Heart
                                  className={`w-5 h-5 ${favorites.includes(teacher.id)
                                      ? "fill-red-500 text-red-500"
                                      : "text-white/70 hover:text-white"
                                    }`}
                                />
                              </button>
                            </div>
                          </div>
                          <h3 className="text-xl font-bold mb-1">{teacher.name}</h3>
                          <p className="text-white/90 text-sm line-clamp-2">{teacher.bio}</p>
                          {/* Location Match Badge */}
                          {teacher.matchBadge && teacher.matchBadge.text && (
                            <div className="mt-2 inline-flex items-center bg-white/20 backdrop-blur-md px-2 py-1 rounded-full text-xs font-semibold border border-white/30">
                              <span className="mr-1">{teacher.matchBadge.emoji}</span>
                              {teacher.matchBadge.text}
                            </div>
                          )}
                        </div>
                        {viewMode === "grid" && teacher.rating > 0 && (
                          <div className="mt-4 flex items-center space-x-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-semibold">{teacher.rating}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className={`p-6 ${viewMode === "list" ? "flex-1" : "flex-1 flex flex-col"}`}>
                    <div className={`${viewMode === "list" ? "flex justify-between items-start" : ""}`}>
                      <div className={`${viewMode === "list" ? "flex-1 pr-6" : ""}`}>
                        {viewMode === "list" && (
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <h3 className="text-xl font-bold text-gray-800">{teacher.name}</h3>
                              {/* Location Match Badge for List View */}
                              {teacher.matchBadge && teacher.matchBadge.text && (
                                <div className="inline-flex items-center bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full text-xs font-semibold border border-indigo-100">
                                  <span className="mr-1">{teacher.matchBadge.emoji}</span>
                                  {teacher.matchBadge.text}
                                </div>
                              )}
                            </div>
                            {teacher.rating > 0 && (
                              <div className="flex items-center space-x-1">
                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                <span className="text-sm font-semibold">{teacher.rating}</span>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="flex items-center space-x-2 text-gray-600">
                            <BookOpen className="w-4 h-4 text-indigo-500" />
                            <span className="text-sm">{teacher.subject}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-gray-600">
                            <Award className="w-4 h-4 text-purple-500" />
                            <span className="text-sm">{teacher.board}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-gray-600">
                            <Clock className="w-4 h-4 text-green-500" />
                            <span className="text-sm">{teacher.experience}y exp</span>
                          </div>
                          <div className="flex items-center space-x-2 text-gray-600">
                            <Users className="w-4 h-4 text-blue-500" />
                            <span className="text-sm">{teacher.totalStudents} students</span>
                          </div>
                        </div>

                        <div className="mb-4">
                          <div className="text-xs text-gray-500 mb-1">Specializations</div>
                          <div className="flex flex-wrap gap-1">
                            {teacher.specializations.slice(0, 3).map((spec, i) => (
                              <span
                                key={i}
                                className="bg-indigo-50/70 text-indigo-700 px-2 py-1 rounded-full text-xs font-medium backdrop-blur-sm"
                              >
                                {spec}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="mb-4">
                          <div className="text-xs text-gray-500 mb-1">Available</div>
                          <div className="flex flex-wrap gap-1 mb-2">
                            {teacher.availability.map((day, i) => (
                              <span
                                key={i}
                                className="bg-green-100/70 text-green-700 px-2 py-1 rounded text-xs backdrop-blur-sm"
                              >
                                {day}
                              </span>
                            ))}
                          </div>
                          <div className="flex items-center space-x-2 text-gray-600 mt-2">
                            {/* Phone removed as per request */}
                          </div>
                          <div className="flex items-center space-x-2 text-gray-600 mt-1">
                            <span className="text-xs font-semibold">Email:</span>
                            <span className="text-xs">{teacher.email || 'N/A'}</span>
                          </div>
                        </div>
                      </div>

                      <div className={`${viewMode === "list" ? "text-right" : "mt-auto"}`}>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-2 text-gray-600">
                            <MapPin className="w-4 h-4 text-red-500" />
                            <span className="text-sm">{teacher.location}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-gray-800">₹{teacher.fee}</div>
                            <div className="text-xs text-gray-500">per hour</div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <button
                            onClick={() => handleBook(teacher)}
                            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 flex items-center justify-center space-x-2 group"
                          >
                            <Calendar className="w-4 h-4 group-hover:animate-pulse" />
                            <span>Book Session</span>
                          </button>

                          <button
                            onClick={() => handleMessage(teacher)}
                            className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-semibold py-2.5 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 flex items-center justify-center space-x-2 group"
                          >
                            <MessageCircle className="w-4 h-4 group-hover:animate-pulse" />
                            <span>Message Teacher</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredAndSortedTeachers.length === 0 && (
              <div className="text-center py-16">
                <div className="bg-white/60 backdrop-blur-xl border border-white/20 rounded-2xl p-8 max-w-md mx-auto">
                  <div className="w-16 h-16 bg-slate-100/70 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">No teachers found</h3>
                  <p className="text-gray-600">Try adjusting your search criteria</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}