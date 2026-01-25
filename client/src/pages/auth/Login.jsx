import { GoogleLogin } from "@react-oauth/google";
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye,
  EyeOff,
  Check,
  X,
  Mail,
  Lock,
  Loader2,
  LogIn,
  Shield,
  AlertTriangle,
  Globe,
  ArrowLeft,
  Sparkles,
  Sun,
  Moon,
} from "lucide-react";
import { setToLocalStorage, getFromLocalStorage } from "../../utils/storage";

const Login = () => {
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('authTheme');
    return saved ? saved === 'dark' : true;
  });

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  const [uiState, setUiState] = useState({
    showPassword: false,
    isSubmitting: false,
    focusedField: null,
    showCapsLockWarning: false,
    loginAttempts: 0,
    isLocked: false,
    lockoutTime: 0,
    passwordStrength: 0,
    isOnline: true,
    lastLoginTime: null,
    emailValid: false,
    passwordValid: false,
    errorMessage: "",
  });

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const isFormValid =
    uiState.emailValid &&
    uiState.passwordValid &&
    !uiState.isLocked &&
    uiState.isOnline;

  // Theme configuration
  const theme = isDarkMode ? {
    bg: 'bg-[#0a0612]',
    gradientFrom: 'from-[#0a0612]',
    gradientVia: 'via-[#120a1e]',
    gradientTo: 'to-[#0a0612]',
    orbColor1: 'bg-violet-600/20',
    orbColor2: 'bg-fuchsia-600/15',
    orbColor3: 'bg-purple-500/10',
    gridColor: 'rgba(139, 92, 246, 0.3)',
    particleColor: 'bg-violet-400/60',
    cardBg: 'bg-white/[0.03]',
    cardBorder: 'border-white/10',
    topGlow: 'via-violet-500/50',
    text: 'text-white',
    textMuted: 'text-slate-400',
    textSubtle: 'text-slate-500',
    inputBg: 'bg-white/[0.03]',
    inputBorder: 'border-white/10',
    inputFocusBorder: 'focus:border-violet-500/50',
    inputFocusRing: 'focus:ring-violet-500/30',
    inputText: 'text-white',
    inputPlaceholder: 'placeholder-slate-500',
    dividerBg: 'bg-[#0a0612]',
    dividerBorder: 'border-white/10',
    checkboxBg: 'bg-white/5',
    checkboxBorder: 'border-white/20',
    linkColor: 'text-violet-400',
    linkHover: 'hover:text-violet-300',
    errorBg: 'bg-red-500/10',
    errorBorder: 'border-red-500/20',
    errorText: 'text-red-300',
    successBorder: 'border-emerald-500/50',
    successIcon: 'text-emerald-400',
    disabledBg: 'bg-white/5',
    disabledText: 'text-slate-500',
  } : {
    bg: 'bg-gradient-to-br from-slate-50 via-violet-50 to-purple-50',
    gradientFrom: 'from-slate-50',
    gradientVia: 'via-violet-50',
    gradientTo: 'to-purple-50',
    orbColor1: 'bg-violet-300/30',
    orbColor2: 'bg-fuchsia-300/20',
    orbColor3: 'bg-purple-300/15',
    gridColor: 'rgba(139, 92, 246, 0.1)',
    particleColor: 'bg-violet-500/40',
    cardBg: 'bg-white/80',
    cardBorder: 'border-violet-100',
    topGlow: 'via-violet-400/30',
    text: 'text-slate-900',
    textMuted: 'text-slate-600',
    textSubtle: 'text-slate-500',
    inputBg: 'bg-white',
    inputBorder: 'border-slate-200',
    inputFocusBorder: 'focus:border-violet-500',
    inputFocusRing: 'focus:ring-violet-500/20',
    inputText: 'text-slate-900',
    inputPlaceholder: 'placeholder-slate-400',
    dividerBg: 'bg-white',
    dividerBorder: 'border-slate-200',
    checkboxBg: 'bg-white',
    checkboxBorder: 'border-slate-300',
    linkColor: 'text-violet-600',
    linkHover: 'hover:text-violet-700',
    errorBg: 'bg-red-50',
    errorBorder: 'border-red-200',
    errorText: 'text-red-600',
    successBorder: 'border-emerald-400',
    successIcon: 'text-emerald-500',
    disabledBg: 'bg-slate-100',
    disabledText: 'text-slate-400',
  };

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem('authTheme', newTheme ? 'dark' : 'light');
  };

  // Effects
  useEffect(() => {
    const lastLogin = getFromLocalStorage("lastLoginTime", null);
    setUiState((u) => ({
      ...u,
      lastLoginTime: lastLogin ? new Date(lastLogin) : null,
    }));
  }, []);

  useEffect(() => {
    const handleOnline = () => setUiState((u) => ({ ...u, isOnline: true }));
    const handleOffline = () => setUiState((u) => ({ ...u, isOnline: false }));
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (uiState.focusedField === "password") {
        const capsLock = e.getModifierState && e.getModifierState("CapsLock");
        if (typeof capsLock === "boolean") {
          setUiState((u) => ({ ...u, showCapsLockWarning: capsLock }));
        }
      } else {
        setUiState((u) => ({ ...u, showCapsLockWarning: false }));
      }
    };
    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, [uiState.focusedField]);

  useEffect(() => {
    if (uiState.lockoutTime > 0) {
      const timer = setTimeout(() => {
        setUiState((u) => ({ ...u, lockoutTime: u.lockoutTime - 1 }));
      }, 1000);
      return () => clearTimeout(timer);
    } else if (uiState.isLocked && uiState.lockoutTime === 0) {
      setUiState((u) => ({
        ...u,
        isLocked: false,
        loginAttempts: 0,
        errorMessage: "",
      }));
    }
  }, [uiState.lockoutTime, uiState.isLocked]);

  useEffect(() => {
    const emailValid = emailRegex.test(formData.email);
    const passwordValid = formData.password.length >= 6;
    setUiState((u) => ({
      ...u,
      emailValid,
      passwordValid,
    }));
  }, [formData.email, formData.password]);

  const handleInputChange = useCallback(
    ({ target: { name, value, type, checked } }) => {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
      setUiState((u) => ({ ...u, errorMessage: "" }));
    },
    []
  );

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      if (!isFormValid || uiState.isLocked || uiState.isSubmitting) {
        setUiState((u) => ({
          ...u,
          errorMessage: "Please ensure all fields are valid.",
        }));
        return;
      }

      setUiState((u) => ({ ...u, isSubmitting: true, errorMessage: "" }));

      try {
        const response = await fetch(import.meta.env.VITE_BACKEND_URL + '/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: formData.email, password: formData.password }),
          credentials: 'include'
        });

        const data = await response.json();

        if (response.ok) {
          setToLocalStorage('currentUser', data.user);
          setToLocalStorage('lastLoginTime', new Date());

          if (data.user.role === 'student') {
            navigate(data.user.profileComplete ? '/student/dashboard' : '/student/profile');
          } else if (data.user.role === 'teacher') {
            navigate(data.user.profileComplete ? '/teacher/dashboard' : '/teacher/profile-setup');
          } else {
            navigate('/');
          }

          setFormData({ email: '', password: '', rememberMe: false });
        } else {
          throw new Error(data.message || 'Login failed. Please try again.');
        }
      } catch (error) {
        const message = error.message || 'Login failed. Please try again.';
        setUiState((u) => {
          const newAttempts = u.loginAttempts + 1;
          if (newAttempts >= 3) {
            return {
              ...u,
              isSubmitting: false,
              loginAttempts: newAttempts,
              isLocked: true,
              lockoutTime: 60,
              errorMessage: `Too many failed attempts. Account locked for 60 seconds.`,
            };
          } else {
            return {
              ...u,
              isSubmitting: false,
              loginAttempts: newAttempts,
              errorMessage: message + (newAttempts === 2 ? ' 1 attempt remaining.' : ''),
            };
          }
        });
      }
    },
    [formData, isFormValid, navigate, uiState.isLocked, uiState.isSubmitting]
  );

  const handleGoogleLogin = useCallback(
    async (credentialResponse) => {
      if (!credentialResponse?.credential) {
        setUiState((u) => ({
          ...u,
          isSubmitting: false,
          errorMessage: "Invalid Google login response",
        }));
        return;
      }

      setUiState((u) => ({ ...u, isSubmitting: true, errorMessage: "" }));

      try {
        const response = await axios.post(
          import.meta.env.VITE_BACKEND_URL + '/api/auth/google',
          { credential: credentialResponse.credential },
          { withCredentials: true }
        );

        const { user } = response.data;
        setToLocalStorage("currentUser", user);
        setToLocalStorage("lastLoginTime", new Date());

        const redirectPath = user.profileComplete
          ? `/${user.role}/dashboard`
          : `/${user.role}/profile-setup`;

        navigate(redirectPath);
      } catch (error) {
        setUiState((u) => ({
          ...u,
          isSubmitting: false,
          errorMessage: error.response?.data?.message || "Google login failed",
        }));
      }
    },
    [navigate]
  );

  return (
    <div className={`min-h-screen flex items-center justify-center relative overflow-hidden transition-colors duration-500 ${theme.bg}`}>
      {/* Animated Background */}
      <div className="absolute inset-0">
        {isDarkMode && (
          <div className={`absolute inset-0 bg-gradient-to-br ${theme.gradientFrom} ${theme.gradientVia} ${theme.gradientTo}`} />
        )}
        
        {/* Animated orbs */}
        <div className={`absolute top-1/4 left-1/4 w-[500px] h-[500px] ${theme.orbColor1} rounded-full blur-[120px] animate-pulse`} />
        <div className={`absolute bottom-1/4 right-1/4 w-[400px] h-[400px] ${theme.orbColor2} rounded-full blur-[100px] animate-pulse`} style={{ animationDelay: '1s' }} />
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] ${theme.orbColor3} rounded-full blur-[80px]`} />
        
        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(${theme.gridColor} 1px, transparent 1px), linear-gradient(90deg, ${theme.gridColor} 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />
        
        {/* Floating particles */}
        <div className={`absolute top-20 left-[15%] w-1.5 h-1.5 ${theme.particleColor} rounded-full animate-float`} />
        <div className={`absolute top-40 right-[20%] w-1 h-1 ${theme.particleColor} rounded-full animate-float`} style={{ animationDelay: '0.5s' }} />
        <div className={`absolute bottom-32 left-[25%] w-2 h-2 ${theme.particleColor} rounded-full animate-float`} style={{ animationDelay: '1s' }} />
        <div className={`absolute bottom-20 right-[30%] w-1.5 h-1.5 ${theme.particleColor} rounded-full animate-float`} style={{ animationDelay: '1.5s' }} />
      </div>

      {/* Back to Home */}
      <Link
        to="/"
        className={`absolute top-6 left-6 z-50 flex items-center gap-2 px-4 py-2 ${theme.textMuted} hover:${theme.text} transition-colors duration-300 group`}
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-medium">Back to Home</span>
      </Link>

      {/* Theme Toggle & Network Status */}
      <div className="absolute top-6 right-6 z-50 flex items-center gap-3">
        {/* Theme Toggle */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleTheme}
          className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md border transition-all duration-300 ${
            isDarkMode 
              ? 'bg-white/10 border-white/20 hover:bg-white/20' 
              : 'bg-white/80 border-violet-200 hover:bg-white shadow-sm'
          }`}
        >
          {isDarkMode ? (
            <Sun className="w-5 h-5 text-amber-400" />
          ) : (
            <Moon className="w-5 h-5 text-violet-600" />
          )}
        </motion.button>

        {/* Network Status */}
        <div className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md border ${
          uiState.isOnline 
            ? isDarkMode ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'
            : isDarkMode ? 'bg-red-500/10 border-red-500/30' : 'bg-red-50 border-red-200'
        }`}>
          <Globe className={`w-5 h-5 ${uiState.isOnline ? 'text-emerald-500' : 'text-red-500'}`} />
        </div>
      </div>

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        {/* Glass Card */}
        <div className={`relative ${theme.cardBg} backdrop-blur-xl rounded-3xl border ${theme.cardBorder} shadow-2xl ${isDarkMode ? 'shadow-purple-500/10' : 'shadow-violet-200/50'} overflow-hidden transition-all duration-500`}>
          {/* Top glow */}
          <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent ${theme.topGlow} to-transparent`} />
          
          {/* Header */}
          <div className="relative px-8 pt-10 pb-8">
            {/* Logo */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex justify-center mb-6"
            >
              <div className="relative">
                <div className={`absolute inset-0 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-2xl blur-xl ${isDarkMode ? 'opacity-50' : 'opacity-30'}`} />
                <img 
                  src="/Yuvsiksha_logo.png" 
                  alt="Yuvsiksha" 
                  className="relative w-16 h-16 rounded-2xl"
                />
              </div>
            </motion.div>

            {/* Title */}
            <div className="text-center">
              <h1 className={`text-2xl font-bold ${theme.text} mb-2`}>Welcome Back</h1>
              <p className={`${theme.textMuted} text-sm`}>Sign in to continue your learning journey</p>
            </div>

            {uiState.lastLoginTime && (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`text-center text-xs ${theme.textSubtle} mt-3`}
              >
                Last login: {uiState.lastLoginTime.toLocaleDateString()} at{" "}
                {uiState.lastLoginTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </motion.p>
            )}
          </div>

          {/* Form */}
          <div className="px-8 pb-8 space-y-5">
            {/* Error Messages */}
            <AnimatePresence>
              {!uiState.isOnline && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`flex items-center gap-3 p-4 rounded-xl ${theme.errorBg} border ${theme.errorBorder}`}
                >
                  <Globe className={`w-5 h-5 ${isDarkMode ? 'text-red-400' : 'text-red-500'}`} />
                  <div>
                    <p className={`${theme.errorText} font-medium text-sm`}>No internet connection</p>
                    <p className={`${isDarkMode ? 'text-red-400/70' : 'text-red-500/70'} text-xs`}>Please check your connection</p>
                  </div>
                </motion.div>
              )}

              {uiState.isLocked && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`flex items-center gap-3 p-4 rounded-xl ${theme.errorBg} border ${theme.errorBorder}`}
                >
                  <Shield className={`w-5 h-5 ${isDarkMode ? 'text-red-400' : 'text-red-500'}`} />
                  <div>
                    <p className={`${theme.errorText} font-medium text-sm`}>Account temporarily locked</p>
                    <p className={`${isDarkMode ? 'text-red-400/70' : 'text-red-500/70'} text-xs`}>Try again in {uiState.lockoutTime}s</p>
                  </div>
                </motion.div>
              )}

              {uiState.errorMessage && !uiState.isLocked && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`flex items-center gap-3 p-4 rounded-xl ${theme.errorBg} border ${theme.errorBorder}`}
                >
                  <AlertTriangle className={`w-5 h-5 ${isDarkMode ? 'text-red-400' : 'text-red-500'}`} />
                  <p className={`${theme.errorText} text-sm`}>{uiState.errorMessage}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Google Login */}
            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleLogin}
                onError={() => setUiState((u) => ({ ...u, errorMessage: "Google login failed" }))}
                useOneTap
                theme={isDarkMode ? "filled_black" : "outline"}
                size="large"
                text="continue_with"
                shape="pill"
                width={300}
              />
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className={`w-full border-t ${theme.dividerBorder}`} />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className={`px-4 ${theme.dividerBg} ${theme.textSubtle}`}>or continue with email</span>
              </div>
            </div>

            {/* Email Input */}
            <div className="space-y-2">
              <label className={`flex items-center gap-2 text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                <Mail className="w-4 h-4 text-violet-500" />
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  onFocus={() => setUiState((u) => ({ ...u, focusedField: 'email' }))}
                  onBlur={() => setUiState((u) => ({ ...u, focusedField: null }))}
                  disabled={uiState.isLocked || uiState.isSubmitting}
                  className={`w-full px-4 py-3.5 ${theme.inputBg} border rounded-xl ${theme.inputText} ${theme.inputPlaceholder} transition-all duration-300 focus:outline-none ${
                    formData.email && !uiState.emailValid
                      ? `border-red-500/50 focus:border-red-500 focus:ring-1 focus:ring-red-500/30`
                      : formData.email && uiState.emailValid
                      ? `${theme.successBorder} focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30`
                      : `${theme.inputBorder} ${theme.inputFocusBorder} focus:ring-1 ${theme.inputFocusRing}`
                  }`}
                  placeholder="Enter your email"
                />
                {formData.email && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    {uiState.emailValid ? (
                      <Check className={`w-5 h-5 ${theme.successIcon}`} />
                    ) : (
                      <X className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label className={`flex items-center gap-2 text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                <Lock className="w-4 h-4 text-violet-500" />
                Password
              </label>
              <div className="relative">
                <input
                  type={uiState.showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  onFocus={() => setUiState((u) => ({ ...u, focusedField: 'password' }))}
                  onBlur={() => setUiState((u) => ({ ...u, focusedField: null, showCapsLockWarning: false }))}
                  disabled={uiState.isLocked || uiState.isSubmitting}
                  className={`w-full px-4 py-3.5 pr-12 ${theme.inputBg} border rounded-xl ${theme.inputText} ${theme.inputPlaceholder} transition-all duration-300 focus:outline-none ${
                    formData.password && !uiState.passwordValid
                      ? `border-red-500/50 focus:border-red-500 focus:ring-1 focus:ring-red-500/30`
                      : formData.password && uiState.passwordValid
                      ? `${theme.successBorder} focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30`
                      : `${theme.inputBorder} ${theme.inputFocusBorder} focus:ring-1 ${theme.inputFocusRing}`
                  }`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setUiState((u) => ({ ...u, showPassword: !u.showPassword }))}
                  className={`absolute right-4 top-1/2 -translate-y-1/2 ${theme.textMuted} hover:text-violet-500 transition-colors`}
                >
                  {uiState.showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* Caps Lock Warning */}
              <AnimatePresence>
                {uiState.showCapsLockWarning && uiState.focusedField === 'password' && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className={`flex items-center gap-2 text-amber-500 text-xs ${isDarkMode ? 'bg-amber-500/10' : 'bg-amber-50'} px-3 py-2 rounded-lg`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Caps Lock is on
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleInputChange}
                  className={`w-4 h-4 rounded ${theme.checkboxBorder} ${theme.checkboxBg} text-violet-500 focus:ring-violet-500/30 focus:ring-offset-0`}
                />
                <span className={`text-sm ${theme.textMuted} group-hover:${isDarkMode ? 'text-slate-300' : 'text-slate-700'} transition-colors`}>
                  Remember me
                </span>
              </label>
              <button
                type="button"
                onClick={() => navigate("/forgot-password")}
                className={`text-sm ${theme.linkColor} ${theme.linkHover} transition-colors`}
              >
                Forgot password?
              </button>
            </div>

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: isFormValid && !uiState.isSubmitting ? 1.02 : 1 }}
              whileTap={{ scale: isFormValid && !uiState.isSubmitting ? 0.98 : 1 }}
              onClick={handleSubmit}
              disabled={!isFormValid || uiState.isSubmitting}
              className={`w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-300 ${
                isFormValid && !uiState.isSubmitting
                  ? 'bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 text-white shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30'
                  : `${theme.disabledBg} ${theme.disabledText} cursor-not-allowed`
              }`}
            >
              {uiState.isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : uiState.isLocked ? (
                <>
                  <Shield className="w-5 h-5" />
                  <span>Account Locked ({uiState.lockoutTime}s)</span>
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>Sign In</span>
                </>
              )}
            </motion.button>

            {/* Sign Up Link */}
            <p className={`text-center ${theme.textMuted} text-sm`}>
              Don't have an account?{' '}
              <Link
                to="/signup"
                className={`${theme.linkColor} ${theme.linkHover} font-medium transition-colors`}
              >
                Sign up
              </Link>
            </p>

            {/* Security Badge */}
            <div className={`flex items-center justify-center gap-4 pt-4 border-t ${isDarkMode ? 'border-white/5' : 'border-slate-100'}`}>
              <div className={`flex items-center gap-1.5 text-xs ${theme.textSubtle}`}>
                <Shield className="w-3.5 h-3.5" />
                <span>Secure Login</span>
              </div>
              <div className={`flex items-center gap-1.5 text-xs ${theme.textSubtle}`}>
                <Sparkles className="w-3.5 h-3.5" />
                <span>SSL Protected</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
