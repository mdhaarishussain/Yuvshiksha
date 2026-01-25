import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye,
  EyeOff,
  Check,
  X,
  User,
  Mail,
  Lock,
  Loader2,
  Shield,
  CheckCircle2,
  UserCheck,
  GraduationCap,
  Globe,
  AlertTriangle,
  ArrowLeft,
  Sun,
  Moon,
} from "lucide-react";

import { setToLocalStorage } from "../utils/storage";
import PrivacyPolicyModal from './PrivacyPolicyModal';

const passwordStrengthLevels = ["Very Weak", "Weak", "Fair", "Good", "Strong"];
const passwordStrengthColors = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-blue-500", "bg-emerald-500"];

const initialForm = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  confirmPassword: "",
  acceptTerms: false,
  role: "",
  gender: "",
  maritalStatus: "",
};

const Signup = () => {
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('authTheme');
    return saved ? saved === 'dark' : true;
  });

  const [formData, setFormData] = useState(initialForm);
  const [ui, setUi] = useState({
    showPassword: false,
    showConfirmPassword: false,
    isSubmitting: false,
    submitSuccess: false,
    focusedField: null,
    passwordStrength: 0,
    isOnline: true,
    showCapsLockWarning: false,
    signupError: "",
    otpStep: false,
    otp: "",
    otpError: "",
    otpLoading: false,
  });
  const [validation, setValidation] = useState({
    firstName: { valid: false, message: "" },
    lastName: { valid: true, message: "" },
    email: { valid: false, message: "" },
    password: { valid: false, message: "", strength: 0 },
    confirmPassword: { valid: false, message: "" },
    role: { valid: false, message: "" },
    gender: { valid: true, message: "" },
    maritalStatus: { valid: true, message: "" },
  });
  const [showPolicy, setShowPolicy] = useState(false);

  // Theme configuration
  const theme = isDarkMode ? {
    bg: 'bg-[#0a0612]',
    gradientFrom: 'from-[#0a0612]',
    gradientVia: 'via-[#120a1e]',
    gradientTo: 'to-[#0a0612]',
    orbColor1: 'bg-violet-600/20',
    orbColor2: 'bg-fuchsia-600/15',
    gridColor: 'rgba(139, 92, 246, 0.3)',
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
    labelText: 'text-slate-300',
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
    selectorBg: 'bg-white/[0.02]',
    selectorBorder: 'border-white/10',
    selectorActiveBg: 'bg-violet-500/10',
    selectorActiveBorder: 'border-violet-500/50',
    selectorHoverBorder: 'hover:border-violet-500/30',
    selectorHoverBg: 'hover:bg-violet-500/5',
    iconBg: 'bg-white/5',
    iconActiveBg: 'bg-violet-500/20',
    strengthBarBg: 'bg-white/10',
  } : {
    bg: 'bg-gradient-to-br from-slate-50 via-violet-50 to-purple-50',
    gradientFrom: 'from-slate-50',
    gradientVia: 'via-violet-50',
    gradientTo: 'to-purple-50',
    orbColor1: 'bg-violet-300/30',
    orbColor2: 'bg-fuchsia-300/20',
    gridColor: 'rgba(139, 92, 246, 0.1)',
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
    labelText: 'text-slate-700',
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
    selectorBg: 'bg-white',
    selectorBorder: 'border-slate-200',
    selectorActiveBg: 'bg-violet-50',
    selectorActiveBorder: 'border-violet-500',
    selectorHoverBorder: 'hover:border-violet-300',
    selectorHoverBg: 'hover:bg-violet-50',
    iconBg: 'bg-slate-100',
    iconActiveBg: 'bg-violet-100',
    strengthBarBg: 'bg-slate-200',
  };

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem('authTheme', newTheme ? 'dark' : 'light');
  };

  useEffect(() => {
    const handleOnline = () => setUi((u) => ({ ...u, isOnline: true }));
    const handleOffline = () => setUi((u) => ({ ...u, isOnline: false }));
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    setUi((u) => ({ ...u, isOnline: navigator.onLine }));
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (ui.focusedField === "password" || ui.focusedField === "confirmPassword") {
        const capsLock = e.getModifierState && e.getModifierState("CapsLock");
        if (typeof capsLock === "boolean") {
          setUi((u) => ({ ...u, showCapsLockWarning: capsLock }));
        }
      } else {
        setUi((u) => ({ ...u, showCapsLockWarning: false }));
      }
    };
    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, [ui.focusedField]);

  const handleInputChange = useCallback(
    ({ target: { name, value, type, checked } }) => {
      setFormData((p) => ({
        ...p,
        [name]: type === "checkbox" ? checked : value,
      }));
      if (ui.signupError) setUi((u) => ({ ...u, signupError: "" }));
    },
    [ui.signupError]
  );

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const validateField = useCallback(
    (field, value) => {
      const nameRegex = /^[a-zA-Z\s]+$/;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      let isValid = false;
      let message = "";

      switch (field) {
        case "firstName":
          isValid = value.length >= 2 && nameRegex.test(value);
          message = value && (!nameRegex.test(value) || value.length < 2) ? "Min 2 characters, letters only" : "";
          break;
        case "lastName":
          isValid = value === "" || (value.length >= 1 && nameRegex.test(value));
          message = value && (!nameRegex.test(value) || value.length < 1) ? "Letters only" : "";
          break;
        case "email":
          isValid = emailRegex.test(value);
          message = value && !isValid ? "Please enter a valid email" : "";
          break;
        case "password":
          const strength = calculatePasswordStrength(value);
          isValid = strength >= 3;
          message = value && !isValid ? "Min 8 chars with uppercase, lowercase & numbers" : "";
          setUi((u) => ({ ...u, passwordStrength: strength }));
          break;
        case "confirmPassword":
          isValid = value === formData.password;
          message = value && !isValid ? "Passwords do not match" : "";
          break;
        case "role":
          isValid = !!value;
          message = !isValid ? "Please select your role" : "";
          break;
        case "gender":
          isValid = formData.role !== "teacher" || !!value;
          message = !isValid ? "Please select gender" : "";
          break;
        case "maritalStatus":
          isValid = formData.role !== "teacher" || !!value;
          message = !isValid ? "Please select status" : "";
          break;
        default:
          break;
      }

      setValidation((v) => ({ ...v, [field]: { valid: isValid, message } }));
    },
    [formData.password, formData.role]
  );

  useEffect(() => {
    Object.entries(formData).forEach(([field, value]) => {
      validateField(field, value);
    });
  }, [formData, validateField]);

  const isFormFullyValid = useCallback(() => {
    return (
      validation.firstName.valid &&
      validation.lastName.valid &&
      validation.email.valid &&
      validation.password.valid &&
      validation.confirmPassword.valid &&
      validation.role.valid &&
      (formData.role !== "teacher" || (validation.gender.valid && validation.maritalStatus.valid)) &&
      formData.acceptTerms
    );
  }, [validation, formData.role, formData.acceptTerms]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormFullyValid()) return;

    setUi((u) => ({ ...u, isSubmitting: true, signupError: "" }));

    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/email-otp/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to send OTP");

      setUi((u) => ({ ...u, isSubmitting: false, otpStep: true, otp: "", otpError: "" }));
    } catch (error) {
      setUi((u) => ({
        ...u,
        isSubmitting: false,
        signupError: error.message || "Signup failed. Please try again.",
      }));
    }
  };

  const handleOtpVerify = async (e) => {
    e.preventDefault();
    if (ui.otp.length !== 6) {
      setUi((u) => ({ ...u, otpError: "Please enter a valid 6-digit OTP" }));
      return;
    }

    setUi((u) => ({ ...u, otpLoading: true, otpError: "" }));

    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/email-otp/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, otp: ui.otp })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "OTP verification failed");

      const registerRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const registerData = await registerRes.json();
      if (!registerRes.ok) throw new Error(registerData.message || "Registration failed");

      setToLocalStorage("user", registerData.user);
      setToLocalStorage("currentUser", registerData.user);
      localStorage.setItem("token", registerData.token);

      if (registerData.user.role === "teacher") {
        navigate("/teacher/profile-setup");
      } else {
        navigate("/student/profile-setup");
      }
    } catch (error) {
      setUi((u) => ({
        ...u,
        otpLoading: false,
        otpError: error.message || "Invalid OTP. Please try again.",
      }));
    }
  };

  const InputField = ({ label, name, type = "text", icon: Icon, toggleable = false }) => {
    const val = formData[name];
    const error = validation[name]?.message;
    const valid = validation[name]?.valid;
    const isFocused = ui.focusedField === name;
    const isRequired = ["firstName", "email", "password", "confirmPassword", "role"].includes(name);
    const showToggle = toggleable && (name === "password" || name === "confirmPassword");
    const isPasswordVisible = name === "password" ? ui.showPassword : ui.showConfirmPassword;

    return (
      <div className="space-y-2">
        <label className={`flex items-center gap-2 text-sm font-medium ${theme.labelText}`}>
          {Icon && <Icon className="w-4 h-4 text-violet-500" />}
          {label}
          {isRequired && <span className="text-red-500">*</span>}
        </label>
        <div className="relative">
          <input
            type={toggleable ? (isPasswordVisible ? "text" : "password") : type}
            name={name}
            value={val}
            onChange={handleInputChange}
            onFocus={() => setUi((u) => ({ ...u, focusedField: name }))}
            onBlur={() => setUi((u) => ({ ...u, focusedField: null }))}
            disabled={ui.isSubmitting}
            className={`w-full px-4 py-3 ${theme.inputBg} border rounded-xl ${theme.inputText} ${theme.inputPlaceholder} transition-all duration-300 focus:outline-none ${
              error && val
                ? 'border-red-500/50 focus:border-red-500 focus:ring-1 focus:ring-red-500/30'
                : valid && val
                ? `${theme.successBorder} focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30`
                : `${theme.inputBorder} ${theme.inputFocusBorder} focus:ring-1 ${theme.inputFocusRing}`
            } ${showToggle ? 'pr-12' : 'pr-10'}`}
            placeholder={`Enter your ${label.toLowerCase()}`}
          />
          {val && !toggleable && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              {valid ? <Check className={`w-5 h-5 ${theme.successIcon}`} /> : <X className="w-5 h-5 text-red-500" />}
            </div>
          )}
          {showToggle && (
            <button
              type="button"
              onClick={() => setUi((u) => ({
                ...u,
                [name === "password" ? "showPassword" : "showConfirmPassword"]: !isPasswordVisible
              }))}
              className={`absolute right-4 top-1/2 -translate-y-1/2 ${theme.textMuted} hover:text-violet-500 transition-colors`}
            >
              {isPasswordVisible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          )}
        </div>
        {error && val && (
          <p className="text-xs text-red-500 flex items-center gap-1">
            <X className="w-3.5 h-3.5" />
            {error}
          </p>
        )}
      </div>
    );
  };

  const RoleSelector = () => (
    <div className="space-y-3">
      <label className={`flex items-center gap-2 text-sm font-medium ${theme.labelText}`}>
        <UserCheck className="w-4 h-4 text-violet-500" />
        I am a <span className="text-red-500">*</span>
      </label>
      <div className="grid grid-cols-2 gap-3">
        {[
          { value: "student", label: "Student", icon: GraduationCap },
          { value: "teacher", label: "Teacher", icon: UserCheck },
        ].map(({ value, label, icon: Icon }) => (
          <label
            key={value}
            className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-300 ${
              formData.role === value
                ? `${theme.selectorActiveBorder} ${theme.selectorActiveBg} shadow-lg ${isDarkMode ? 'shadow-violet-500/10' : 'shadow-violet-200/50'}`
                : `${theme.selectorBorder} ${theme.selectorBg} ${theme.selectorHoverBorder} ${theme.selectorHoverBg}`
            }`}
          >
            <input
              type="radio"
              name="role"
              value={value}
              checked={formData.role === value}
              onChange={handleInputChange}
              className="sr-only"
            />
            <div className={`p-2 rounded-lg ${formData.role === value ? theme.iconActiveBg : theme.iconBg}`}>
              <Icon className={`w-5 h-5 ${formData.role === value ? 'text-violet-500' : theme.textMuted}`} />
            </div>
            <span className={`font-medium ${formData.role === value ? theme.text : theme.textMuted}`}>
              {label}
            </span>
          </label>
        ))}
      </div>
    </div>
  );

  const GenderSelector = () => (
    <div className="space-y-3">
      <label className={`text-sm font-medium ${theme.labelText}`}>Gender <span className="text-red-500">*</span></label>
      <div className="grid grid-cols-2 gap-3">
        {["male", "female"].map((g) => (
          <label
            key={g}
            className={`flex items-center justify-center p-3 rounded-xl border cursor-pointer transition-all duration-300 ${
              formData.gender === g
                ? `${theme.selectorActiveBorder} ${theme.selectorActiveBg}`
                : `${theme.selectorBorder} ${theme.selectorBg} ${theme.selectorHoverBorder}`
            }`}
          >
            <input
              type="radio"
              name="gender"
              value={g}
              checked={formData.gender === g}
              onChange={handleInputChange}
              className="sr-only"
            />
            <span className={`font-medium capitalize ${formData.gender === g ? theme.text : theme.textMuted}`}>
              {g}
            </span>
          </label>
        ))}
      </div>
    </div>
  );

  const MaritalStatusSelector = () => (
    <div className="space-y-3">
      <label className={`text-sm font-medium ${theme.labelText}`}>Marital Status <span className="text-red-500">*</span></label>
      <div className="grid grid-cols-2 gap-3">
        {["married", "unmarried"].map((s) => (
          <label
            key={s}
            className={`flex items-center justify-center p-3 rounded-xl border cursor-pointer transition-all duration-300 ${
              formData.maritalStatus === s
                ? `${theme.selectorActiveBorder} ${theme.selectorActiveBg}`
                : `${theme.selectorBorder} ${theme.selectorBg} ${theme.selectorHoverBorder}`
            }`}
          >
            <input
              type="radio"
              name="maritalStatus"
              value={s}
              checked={formData.maritalStatus === s}
              onChange={handleInputChange}
              className="sr-only"
            />
            <span className={`font-medium capitalize ${formData.maritalStatus === s ? theme.text : theme.textMuted}`}>
              {s}
            </span>
          </label>
        ))}
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen flex items-center justify-center relative overflow-hidden transition-colors duration-500 py-12 px-4 ${theme.bg}`}>
      {/* Animated Background */}
      <div className="absolute inset-0">
        {isDarkMode && (
          <div className={`absolute inset-0 bg-gradient-to-br ${theme.gradientFrom} ${theme.gradientVia} ${theme.gradientTo}`} />
        )}
        <div className={`absolute top-1/4 left-1/4 w-[500px] h-[500px] ${theme.orbColor1} rounded-full blur-[120px] animate-pulse`} />
        <div className={`absolute bottom-1/4 right-1/4 w-[400px] h-[400px] ${theme.orbColor2} rounded-full blur-[100px] animate-pulse`} style={{ animationDelay: '1s' }} />
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(${theme.gridColor} 1px, transparent 1px), linear-gradient(90deg, ${theme.gridColor} 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />
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

        <div className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md border ${
          ui.isOnline 
            ? isDarkMode ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'
            : isDarkMode ? 'bg-red-500/10 border-red-500/30' : 'bg-red-50 border-red-200'
        }`}>
          <Globe className={`w-5 h-5 ${ui.isOnline ? 'text-emerald-500' : 'text-red-500'}`} />
        </div>
      </div>

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className={`relative ${theme.cardBg} backdrop-blur-xl rounded-3xl border ${theme.cardBorder} shadow-2xl ${isDarkMode ? 'shadow-purple-500/10' : 'shadow-violet-200/50'} overflow-hidden transition-all duration-500`}>
          <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent ${theme.topGlow} to-transparent`} />
          
          {/* Header */}
          <div className="relative px-8 pt-10 pb-6">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex justify-center mb-6"
            >
              <div className="relative">
                <div className={`absolute inset-0 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-2xl blur-xl ${isDarkMode ? 'opacity-50' : 'opacity-30'}`} />
                <img src="/Yuvsiksha_logo.png" alt="Yuvsiksha" className="relative w-14 h-14 rounded-2xl" />
              </div>
            </motion.div>
            <div className="text-center">
              <h1 className={`text-2xl font-bold ${theme.text} mb-2`}>
                {ui.otpStep ? "Verify Your Email" : "Create Account"}
              </h1>
              <p className={`${theme.textMuted} text-sm`}>
                {ui.otpStep
                  ? `Enter the 6-digit OTP sent to ${formData.email}`
                  : "Join our vibrant learning community"}
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="px-8 pb-8">
            <AnimatePresence mode="wait">
              {!ui.otpStep ? (
                <motion.form
                  key="signup-form"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  onSubmit={handleSubmit}
                  className="space-y-5"
                >
                  {/* Error Messages */}
                  {!ui.isOnline && (
                    <div className={`flex items-center gap-3 p-4 rounded-xl ${theme.errorBg} border ${theme.errorBorder}`}>
                      <Globe className={`w-5 h-5 ${isDarkMode ? 'text-red-400' : 'text-red-500'}`} />
                      <p className={`${theme.errorText} text-sm`}>No internet connection</p>
                    </div>
                  )}

                  {ui.signupError && (
                    <div className={`flex items-center gap-3 p-4 rounded-xl ${theme.errorBg} border ${theme.errorBorder}`}>
                      <AlertTriangle className={`w-5 h-5 ${isDarkMode ? 'text-red-400' : 'text-red-500'}`} />
                      <p className={`${theme.errorText} text-sm`}>{ui.signupError}</p>
                    </div>
                  )}

                  <RoleSelector />

                  <div className="grid grid-cols-2 gap-4">
                    <InputField label="First Name" name="firstName" icon={User} />
                    <InputField label="Last Name" name="lastName" icon={User} />
                  </div>

                  {formData.role === "teacher" && (
                    <>
                      <GenderSelector />
                      <MaritalStatusSelector />
                    </>
                  )}

                  <InputField label="Email Address" name="email" type="email" icon={Mail} />
                  <InputField label="Password" name="password" type="password" icon={Lock} toggleable />

                  {/* Password Strength */}
                  {formData.password && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className={`text-xs ${theme.textMuted}`}>Password Strength</span>
                        <span className={`text-xs font-medium ${
                          ui.passwordStrength >= 4 ? 'text-emerald-500' :
                          ui.passwordStrength >= 3 ? 'text-blue-500' :
                          ui.passwordStrength >= 2 ? 'text-yellow-500' : 'text-red-500'
                        }`}>
                          {passwordStrengthLevels[ui.passwordStrength] || passwordStrengthLevels[0]}
                        </span>
                      </div>
                      <div className={`h-1.5 ${theme.strengthBarBg} rounded-full overflow-hidden`}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(ui.passwordStrength / 4) * 100}%` }}
                          className={`h-full rounded-full ${passwordStrengthColors[ui.passwordStrength] || passwordStrengthColors[0]}`}
                        />
                      </div>
                    </div>
                  )}

                  <InputField label="Confirm Password" name="confirmPassword" type="password" icon={Lock} toggleable />

                  {/* Terms */}
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      name="acceptTerms"
                      checked={formData.acceptTerms}
                      onChange={handleInputChange}
                      className={`mt-1 w-4 h-4 rounded ${theme.checkboxBorder} ${theme.checkboxBg} text-violet-500 focus:ring-violet-500/30 focus:ring-offset-0`}
                    />
                    <span className={`text-sm ${theme.textMuted}`}>
                      I agree to the{' '}
                      <button
                        type="button"
                        onClick={() => setShowPolicy(true)}
                        className={`${theme.linkColor} ${theme.linkHover} underline`}
                      >
                        Terms & Conditions
                      </button>
                    </span>
                  </label>

                  {/* Submit */}
                  <motion.button
                    whileHover={{ scale: isFormFullyValid() && !ui.isSubmitting ? 1.02 : 1 }}
                    whileTap={{ scale: isFormFullyValid() && !ui.isSubmitting ? 0.98 : 1 }}
                    type="submit"
                    disabled={!isFormFullyValid() || ui.isSubmitting}
                    className={`w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-300 ${
                      isFormFullyValid() && !ui.isSubmitting
                        ? 'bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 text-white shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30'
                        : `${theme.disabledBg} ${theme.disabledText} cursor-not-allowed`
                    }`}
                  >
                    {ui.isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Creating Account...</span>
                      </>
                    ) : (
                      <>
                        <UserCheck className="w-5 h-5" />
                        <span>Create Account</span>
                      </>
                    )}
                  </motion.button>

                  {/* Login Link */}
                  <p className={`text-center ${theme.textMuted} text-sm pt-4 border-t ${isDarkMode ? 'border-white/5' : 'border-slate-100'}`}>
                    Already have an account?{' '}
                    <Link to="/login" className={`${theme.linkColor} ${theme.linkHover} font-medium transition-colors`}>
                      Log in
                    </Link>
                  </p>

                  {/* Security Badge */}
                  <div className="flex items-center justify-center gap-4">
                    <div className={`flex items-center gap-1.5 text-xs ${theme.textSubtle}`}>
                      <Shield className="w-3.5 h-3.5" />
                      <span>Secure</span>
                    </div>
                    <div className={`flex items-center gap-1.5 text-xs ${theme.textSubtle}`}>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>SSL Protected</span>
                    </div>
                  </div>
                </motion.form>
              ) : (
                <motion.form
                  key="otp-form"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={handleOtpVerify}
                  className="space-y-6"
                >
                  <div className="text-center">
                    <div className={`w-16 h-16 ${isDarkMode ? 'bg-violet-500/10' : 'bg-violet-100'} rounded-full flex items-center justify-center mx-auto mb-4`}>
                      <Mail className="w-8 h-8 text-violet-500" />
                    </div>
                  </div>

                  {ui.otpError && (
                    <div className={`flex items-center gap-3 p-4 rounded-xl ${theme.errorBg} border ${theme.errorBorder}`}>
                      <AlertTriangle className={`w-5 h-5 ${isDarkMode ? 'text-red-400' : 'text-red-500'}`} />
                      <p className={`${theme.errorText} text-sm`}>{ui.otpError}</p>
                    </div>
                  )}

                  <input
                    type="text"
                    value={ui.otp}
                    onChange={(e) => setUi((u) => ({ ...u, otp: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                    className={`w-full px-4 py-4 ${theme.inputBg} border ${theme.inputBorder} rounded-xl ${theme.inputText} text-center text-2xl tracking-[0.5em] ${theme.inputPlaceholder} focus:outline-none ${theme.inputFocusBorder} focus:ring-1 ${theme.inputFocusRing}`}
                    placeholder="000000"
                    maxLength={6}
                    autoFocus
                  />

                  <motion.button
                    whileHover={{ scale: ui.otp.length === 6 && !ui.otpLoading ? 1.02 : 1 }}
                    whileTap={{ scale: ui.otp.length === 6 && !ui.otpLoading ? 0.98 : 1 }}
                    type="submit"
                    disabled={ui.otpLoading || ui.otp.length !== 6}
                    className={`w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-300 ${
                      ui.otp.length === 6 && !ui.otpLoading
                        ? 'bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 text-white shadow-lg shadow-purple-500/25'
                        : `${theme.disabledBg} ${theme.disabledText} cursor-not-allowed`
                    }`}
                  >
                    {ui.otpLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        <span>Verify OTP</span>
                      </>
                    )}
                  </motion.button>

                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={ui.otpLoading}
                    className={`w-full ${theme.linkColor} ${theme.linkHover} text-sm font-medium transition-colors`}
                  >
                    Resend OTP
                  </button>

                  <button
                    type="button"
                    onClick={() => setUi((u) => ({ ...u, otpStep: false }))}
                    className={`w-full ${theme.textSubtle} hover:${theme.textMuted} text-sm transition-colors flex items-center justify-center gap-2`}
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to signup
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {showPolicy && <PrivacyPolicyModal onClose={() => setShowPolicy(false)} />}
    </div>
  );
};

export default Signup;
