import { Routes, Route, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { getUserId } from "./utils/getUserId";

// Payment Pages
import PaymentPage from "./pages/PaymentPage";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentFailed from "./pages/PaymentFailed";

// Shared Components
import Navbar from "./components/Navbar.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { SocketProvider } from "./contexts/SocketContext.jsx";
import { NotificationProvider } from "./contexts/NotificationContext.jsx";

// Utility Pages
import Landing from "./pages/utils/Landing.jsx";
import NotificationsPage from "./pages/utils/NotificationsPage.jsx";
import Unauthorized from "./pages/utils/Unauthorized.jsx";

// Auth Pages
import Login from "./pages/auth/Login.jsx";
import Signup from "./pages/auth/Signup.jsx";
import ForgotPassword from "./pages/auth/ForgotPassword.jsx";
import ResetPassword from "./pages/auth/ResetPassword.jsx";
import NotFound from "./pages/auth/NotFound.jsx";

// Student Pages
import StudentDashboard from "./pages/student/StudentDashboard.jsx";
import StudentProfileForm from "./pages/student/StudentProfileForm.jsx";
import StudentProfile from "./pages/student/StudentProfile.jsx";
import TeacherList from "./pages/student/TeacherList.jsx";
import BookClass from "./pages/student/BookClass.jsx";
import StudentMessages from "./pages/student/Messages.jsx";

// Teacher Pages
import TeacherDashboard from "./pages/teacher/TeacherDashboard.jsx";
import TeacherProfileForm from "./pages/teacher/TeacherProfileForm.jsx";
import TeacherProfile from "./pages/teacher/TeacherProfile.jsx";
import TeacherProfileEdit from "./pages/teacher/TeacherProfileEdit.jsx";
import TeacherSchedule from "./pages/teacher/TeacherSchedule.jsx";
import Bookings from "./pages/teacher/Bookings.jsx";
import TeacherMessages from "./pages/teacher/Messages.jsx";

// Define constants for roles
const USER_ROLES = {
  STUDENT: 'student',
  TEACHER: 'teacher',
};

function App() {
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState(null);
  const [userId, setUserId] = useState(null);
  
  // Get current user and user ID for socket connection
  useEffect(() => {
    const loadUserData = async () => {
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('currentUser');
      console.log('🔍 App.jsx - Loading user for socket:', { token: !!token, user: !!user });
      
      if (token && user) {
        try {
          const parsedUser = JSON.parse(user);
          console.log('🔍 App.jsx - Parsed user:', { 
            id: parsedUser._id, 
            name: parsedUser.firstName, 
            role: parsedUser.role 
          });
          setCurrentUser(parsedUser);
          
          // Try to get user ID from various sources
          const foundUserId = await getUserId();
          console.log('🔍 App.jsx - Found userId:', foundUserId);
          setUserId(foundUserId);
          
        } catch (error) {
          console.error('Error parsing user from localStorage:', error);
        }
      } else {
        console.log('🔍 App.jsx - No token or user found in localStorage');
      }
    };
    
    loadUserData();
  }, []);

  // Define routes where navbar should NOT be shown
  const noNavbarRoutes = [
    '/login',
    '/signup',
    '/student/dashboard',
    '/teacher/dashboard',
    '/student/profile-setup',
    '/teacher/profile-setup',
    '/student/profile',
    '/teacher/profile',
    '/teacher/profile/edit',
    '/teacher/profile/edit-availability',
    '/student/find-teachers',
    '/student/book-class',
    '/student/messages',
    '/teacher/schedule',
    '/teacher/bookings',
    '/teacher/messages',
    '/notifications'
  ];

  // Check if current route should show navbar
  const shouldShowNavbar = !noNavbarRoutes.includes(location.pathname);

  // Debug the userId being passed to SocketProvider
  console.log('🔍 App.jsx - Rendering with userId:', userId, 'from user:', currentUser);

  return (
    <SocketProvider userId={userId}>
      <NotificationProvider>
        {shouldShowNavbar && <Navbar />}
        <Routes>
          {/* Payment Routes */}
          <Route path="/payment" element={<PaymentPage />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/payment-failed" element={<PaymentFailed />} />

          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Protected Utility Routes */}
          <Route
            path="/notifications"
            element={
              <ProtectedRoute allowedRoles={[USER_ROLES.STUDENT, USER_ROLES.TEACHER]} profileCompleteRequired={true}>
                <NotificationsPage />
              </ProtectedRoute>
            }
          />

          {/* Student Routes */}
          <Route
            path="/student/profile-setup"
            element={
              <ProtectedRoute allowedRoles={[USER_ROLES.STUDENT]} profileCompleteRequired={false}>
                <StudentProfileForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/dashboard"
            element={
              <ProtectedRoute allowedRoles={[USER_ROLES.STUDENT]} profileCompleteRequired={true}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/find-teachers"
            element={
              <ProtectedRoute allowedRoles={[USER_ROLES.STUDENT]} profileCompleteRequired={true}>
                <TeacherList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/book-class"
            element={
              <ProtectedRoute allowedRoles={[USER_ROLES.STUDENT]} profileCompleteRequired={true}>
                <BookClass />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/book-class/:teacherId"
            element={
              <ProtectedRoute allowedRoles={[USER_ROLES.STUDENT]} profileCompleteRequired={true}>
                <BookClass />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/messages"
            element={
              <ProtectedRoute allowedRoles={[USER_ROLES.STUDENT]} profileCompleteRequired={true}>
                <StudentMessages />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/profile"
            element={
              <ProtectedRoute allowedRoles={[USER_ROLES.STUDENT]} profileCompleteRequired={true}>
                <StudentProfile />
              </ProtectedRoute>
            }
          />

          {/* Teacher Routes */}
          <Route
            path="/teacher/profile-setup"
            element={
              <ProtectedRoute allowedRoles={[USER_ROLES.TEACHER]} profileCompleteRequired={null}>
                <TeacherProfileForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/dashboard"
            element={
              <ProtectedRoute allowedRoles={[USER_ROLES.TEACHER]} profileCompleteRequired={true}>
                <TeacherDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/schedule"
            element={
              <ProtectedRoute allowedRoles={[USER_ROLES.TEACHER]} profileCompleteRequired={true}>
                <TeacherSchedule />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/bookings"
            element={
              <ProtectedRoute allowedRoles={[USER_ROLES.TEACHER]} profileCompleteRequired={true}>
                <Bookings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/messages"
            element={
              <ProtectedRoute allowedRoles={[USER_ROLES.TEACHER]} profileCompleteRequired={true}>
                <TeacherMessages />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/profile"
            element={
              <ProtectedRoute allowedRoles={[USER_ROLES.TEACHER]} profileCompleteRequired={true}>
                <TeacherProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/profile/edit"
            element={
              <ProtectedRoute allowedRoles={[USER_ROLES.TEACHER]} profileCompleteRequired={true}>
                <TeacherProfileEdit />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/profile/edit-availability"
            element={
              <ProtectedRoute allowedRoles={[USER_ROLES.TEACHER]} profileCompleteRequired={true}>
                <TeacherProfileEdit />
              </ProtectedRoute>
            }
          />

          {/* Catch-all for undefined routes */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </NotificationProvider>
    </SocketProvider>
  );
}

export default App;