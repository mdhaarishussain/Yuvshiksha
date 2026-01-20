import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import {
  Loader2,
  CalendarDays,
  Clock,
  UserRound,
  BookOpen,
  AlertCircle,
  CheckCircle,
  DollarSign,
  ArrowLeft,
  Star,
} from "lucide-react";
import { getFromLocalStorage } from "../utils/storage";
import { bookingAPI } from "../../services/bookingAPI";

export default function BookClass() {
  const [teacher, setTeacher] = useState(null);
  const [teacherSubjects, setTeacherSubjects] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [availableDays, setAvailableDays] = useState([]);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [subject, setSubject] = useState("");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingStatus, setBookingStatus] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { teacherId } = useParams();
  const getToday = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  useEffect(() => {
    const loadAvailability = async () => {
      if (!teacherId || !selectedDate) return;
      const yyyy = selectedDate.getFullYear();
      const mm = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const dd = String(selectedDate.getDate()).padStart(2, "0");
      const formattedDate = `${yyyy}-${mm}-${dd}`;
      try {
        const response = await bookingAPI.getTeacherAvailability(
          teacherId,
          formattedDate
        );
        console.log("DEBUG: slots from backend:", response.slots);
        setAvailableSlots(response.availableSlots || response.slots || []);
      } catch (error) {
        console.error("Error loading availability:", error);
        setAvailableSlots([]);
      }
    };
    loadAvailability();
  }, [teacherId, selectedDate]);
  useEffect(() => {
    const fetchTeacherData = async () => {
      setIsLoading(true);
      try {
        const currentUser = getFromLocalStorage("currentUser");
        if (!currentUser || currentUser.role !== "student") {
          navigate("/login");
          return;
        }
        if (!teacherId) {
          setIsLoading(false);
          return;
        }
        let teacherData = null;
        try {
          // Use full backend URL and credentials: 'include'
          const backendUrl =
            import.meta.env.VITE_BACKEND_URL || "https://api.yuvsiksha.in";
          const response = await fetch(
            `${backendUrl}/api/teachers/${teacherId}`,
            {
              method: "GET",
              credentials: "include",
            }
          );
          if (response.ok) {
            teacherData = await response.json();
          } else {
            console.error(
              "API response not OK:",
              response.status,
              response.statusText
            );
            if (response.status === 401) {
              setErrorMessage("Authentication required. Please log in again.");
              setTimeout(() => navigate("/login"), 2000);
              return;
            } else if (response.status === 404) {
              setErrorMessage("Teacher not found.");
              return;
            } else {
              const errorData = await response.json().catch(() => null);
              setErrorMessage(
                errorData?.message || "Failed to fetch teacher data."
              );
              return;
            }
          }
        } catch (apiError) {
          console.error("API fetch error:", apiError);
          setErrorMessage(
            "Network error while fetching teacher data. Please check your connection."
          );
          return;
        }
        if (teacherData) {
          let firstInitial = "T";
          if (
            typeof teacherData.firstName === "string" &&
            teacherData.firstName.length > 0
          ) {
            firstInitial = teacherData.firstName.charAt(0).toUpperCase();
          } else if (
            typeof teacherData.name === "string" &&
            teacherData.name.length > 0
          ) {
            firstInitial = teacherData.name.charAt(0).toUpperCase();
          }
          const safeAvatar =
            teacherData.teacherProfile?.photoUrl ||
            teacherData.teacherProfile?.profilePicture ||
            teacherData.avatar ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(
              firstInitial
            )}&background=random`;
          let subjectsArr = [];
          if (
            Array.isArray(teacherData.teacherProfile?.subjects) &&
            teacherData.teacherProfile.subjects.length > 0
          ) {
            subjectsArr = teacherData.teacherProfile.subjects.map(
              (s) => s.text || s
            );
          } else if (
            Array.isArray(teacherData.teacherProfile?.subjectsTaught) &&
            teacherData.teacherProfile.subjectsTaught.length > 0
          ) {
            subjectsArr = teacherData.teacherProfile.subjectsTaught.map(
              (s) => s.text || s
            );
          }
          setTeacherSubjects(subjectsArr);
          setSubject(subjectsArr[0] || "");
          if (teacherData.teacherProfile?.availability) {
            setAvailableDays(
              teacherData.teacherProfile.availability.map((a) => a.day)
            );
          } else {
            setAvailableDays([]);
          }
          const formattedTeacher = {
            id: teacherData._id || teacherData.id || "",
            name:
              teacherData.firstName && teacherData.lastName
                ? `${teacherData.firstName} ${teacherData.lastName}`
                : teacherData.name || "Teacher",
            subject:
              subjectsArr.length > 0
                ? subjectsArr.join(", ")
                : "Multiple Subjects",
            bio:
              teacherData.teacherProfile?.bio ||
              teacherData.bio ||
              "Experienced educator with expertise in various subjects.",
            hourlyRate:
              teacherData.teacherProfile?.hourlyRate ||
              teacherData.hourlyRate ||
              800,
            avatar: safeAvatar,
          };
          setTeacher(formattedTeacher);
          setSelectedDate(new Date());
        }
      } catch (error) {
        console.error("Error loading teacher data:", error);
        setErrorMessage("Unexpected error occurred. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchTeacherData();
  }, [teacherId, navigate]);
  const handleBooking = async () => {
    if (!selectedDate || selectedSlots.length === 0 || !subject) {
      setErrorMessage("Please fill in all required fields");
      setBookingStatus("error");
      setTimeout(() => setBookingStatus(null), 3000);
      return;
    }
    setIsBooking(true);
    setErrorMessage("");
    try {
      // Prepare booking data
      const bookingData = {
        teacherId,
        subject,
        date: selectedDate,
        slots: selectedSlots,
        notes: notes.trim(),
        status: "pending", // always pending until teacher confirms
      };
      await bookingAPI.createBooking(bookingData);
      setBookingStatus("success");
      setIsBooking(false);
      setTimeout(() => {
        navigate("/student/dashboard");
      }, 1200);
    } catch (error) {
      setErrorMessage("Booking could not be created. Please try again.");
      setBookingStatus("error");
      setIsBooking(false);
    }
  };
  // Removed handlePayment, logic merged into handleBooking
  const calculateAmount = () => {
    const hourlyRate = teacher?.hourlyRate || 800;
    return hourlyRate * selectedSlots.length;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin mx-auto"></div>
            <div
              className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-pink-400 rounded-full animate-spin mx-auto"
              style={{
                animationDirection: "reverse",
                animationDuration: "1.5s",
              }}
            ></div>
          </div>
          <p className="text-xl font-semibold text-white mt-6">
            Loading teacher information...
          </p>
          <p className="text-purple-300 text-sm mt-2">
            Please wait while we fetch the details
          </p>
        </div>
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-3">
            Teacher Not Found
          </h2>
          <p className="text-gray-300 mb-6">
            {errorMessage ||
              "We couldn't find the teacher you're looking for. Please go back to the teacher list and try again."}
          </p>
          <button
            onClick={() => navigate("/student/dashboard")}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl shadow-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header with Back Button */}
      <div className="sticky top-0 z-10 bg-black/20 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-white/80 hover:text-white transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Dashboard</span>
          </button>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Teacher Profile Card */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 mb-8">
          <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6">
            <div className="relative">
              <div className="w-32 h-32 rounded-2xl overflow-hidden border-4 border-gradient-to-r from-purple-400 to-pink-400 shadow-2xl">
                <img
                  src={teacher.avatar}
                  alt={teacher.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full p-2">
                <Star className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="flex-1 text-center lg:text-left">
              <h1 className="text-4xl font-bold text-white mb-3">
                {teacher.name}
              </h1>
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 mb-4">
                <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full">
                  <BookOpen className="w-4 h-4 text-purple-400" />
                  <span className="text-white text-sm">{teacher.subject}</span>
                </div>
                <div className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 px-3 py-1 rounded-full">
                  <span className="text-white text-lg font-bold">₹</span>
<<<<<<< HEAD
                  <span className="text-white text-sm font-semibold">
                    {teacher.hourlyRate}/hour
                  </span>
=======
                  <span className="text-white text-sm font-semibold">₹{teacher.hourlyRate}/hour</span>
                  <span className="text-white text-sm font-semibold">{teacher.hourlyRate}/hour</span>
>>>>>>> origin/main
                </div>
              </div>
              <p className="text-gray-300 leading-relaxed">{teacher.bio}</p>
            </div>
          </div>
        </div>
        {/* Booking Form */}
        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-white mb-6">
            Book Your Class
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Subject Selection */}
              <div>
                <label className="block text-lg font-semibold text-white mb-3">
                  <BookOpen className="w-5 h-5 inline mr-2" />
                  Subject
                </label>
                <div className="relative">
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full p-4 rounded-2xl bg-white/10 backdrop-blur-lg border border-white/20 text-white placeholder-gray-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/50 focus:outline-none transition-all duration-300 appearance-none cursor-pointer"
                    style={{
                      backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23a855f7' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpath d='m6 9 6 6 6-6'/%3e%3c/svg%3e")`,
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 1rem center",
                      backgroundSize: "1rem",
                    }}
                  >
                    {teacherSubjects.length === 0 && (
                      <option
                        value=""
                        className="bg-slate-900 text-white p-3 rounded-xl"
                      >
                        No subjects found
                      </option>
                    )}
                    {teacherSubjects.map((subj, idx) => (
                      <option
                        key={idx}
                        value={subj}
                        className="bg-slate-900 text-white p-3 rounded-xl border border-white/10"
                      >
                        {subj}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {/* Date Selection */}
              <div>
                <label className="block text-lg font-semibold text-white mb-3">
                  <CalendarDays className="w-5 h-5 inline mr-2" />
                  Select Date
                </label>
                <div className="relative">
                  <DatePicker
                    selected={selectedDate}
                    onChange={(date) => setSelectedDate(date)}
                    minDate={new Date()}
                    filterDate={(date) => {
                      const dayOfWeek = date.toLocaleDateString("en-US", {
                        weekday: "long",
                      });
                      return availableDays.includes(dayOfWeek);
                    }}
                    dateFormat="yyyy-MM-dd"
                    className="w-full p-4 rounded-2xl bg-white/10 backdrop-blur-lg border border-white/20 text-white placeholder-gray-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/50 focus:outline-none transition-all duration-300"
                    placeholderText="Select a date"
                    calendarClassName="!bg-slate-900/95 !backdrop-blur-lg !border-white/20 !rounded-2xl !shadow-2xl"
                    dayClassName={(date) => {
                      const dayOfWeek = date.toLocaleDateString("en-US", {
                        weekday: "long",
                      });
                      const isAvailable =
                        availableDays.includes(dayOfWeek) &&
                        date >= new Date().setHours(0, 0, 0, 0);
                      return isAvailable
                        ? "!text-white !bg-white/10 hover:!bg-purple-500/50 !rounded-xl !border !border-white/20"
                        : "!text-gray-600 !bg-black/30 !rounded-xl !cursor-not-allowed";
                    }}
                    wrapperClassName="w-full"
                    popperClassName="react-datepicker-popper-custom z-50"
                  />
                </div>
                <style jsx>{`
                  :global(.react-datepicker__header) {
                    background: rgba(15, 23, 42, 0.8) !important;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
                    border-radius: 1rem 1rem 0 0 !important;
                  }
                  :global(.react-datepicker__current-month) {
                    color: white !important;
                  }
                  :global(.react-datepicker__day-name) {
                    color: #a855f7 !important;
                  }
                  :global(.react-datepicker__navigation) {
                    border: 0.45rem solid transparent !important;
                  }
                  :global(.react-datepicker__navigation--previous) {
                    border-right-color: white !important;
                  }
                  :global(.react-datepicker__navigation--next) {
                    border-left-color: white !important;
                  }
                `}</style>
              </div>
              {/* Notes */}
              <div>
                <label className="block text-lg font-semibold text-white mb-3">
                  Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/50 focus:outline-none transition-all duration-300 resize-none h-32"
                  placeholder="Any specific topics you'd like to focus on?"
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Time Slots */}
              {selectedDate && (
                <div>
                  <label className="block text-lg font-semibold text-white mb-3">
                    <Clock className="w-5 h-5 inline mr-2" />
                    Available Slots
                  </label>

                  {availableSlots.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                      {availableSlots.map((slot, idx) => {
                        const slotValue =
                          typeof slot === "object" ? slot.text : slot;

                        const isSelected = selectedSlots.includes(slotValue);

                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setSelectedSlots((prev) =>
                                isSelected
                                  ? prev.filter((s) => s !== slotValue)
                                  : [...prev, slotValue]
                              );
                            }}
                            className={`p-3 rounded-xl border-2 transition-all duration-300 font-medium ${
                              isSelected
                                ? "border-purple-400 bg-purple-500/30 text-purple-200 shadow-lg"
                                : "border-white/20 bg-white/5 text-gray-300 hover:bg-white/10 hover:border-white/30"
                            }`}
                          >
                            {slotValue}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center p-8 bg-white/5 rounded-xl border border-white/10">
                      <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />

                      <p className="text-gray-400">
                        No available slots for this date
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Summary Card */}

              {selectedSlots.length > 0 && (
                <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4">
                    Booking Summary
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Selected Slots:</span>
                      <span className="text-white font-semibold">
                        {selectedSlots.length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Rate per hour:</span>
<<<<<<< HEAD
                      <span className="text-white font-semibold">
                        {teacher.hourlyRate}
                      </span>
=======
                      <span className="text-white font-semibold">â‚¹{teacher.hourlyRate}</span>
>>>>>>> origin/main
                    </div>
                    <div className="border-t border-white/20 pt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold text-white">
                          Total Amount:
                        </span>
                        <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                          â‚¹{calculateAmount()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          {bookingStatus === "error" && errorMessage && (
            <div className="mt-6 p-4 bg-red-500/20 border border-red-400 rounded-xl">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <span className="text-red-200">{errorMessage}</span>
              </div>
            </div>
          )}
          {bookingStatus === "success" && (
            <div className="mt-6 p-4 bg-green-500/20 border border-green-400 rounded-xl">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-green-200">
                  Booking confirmed! Redirecting to dashboard...
                </span>
              </div>
            </div>
          )}

          <div className="mt-8 space-y-4">
            <button
              disabled={
                !selectedDate ||
                selectedSlots.length === 0 ||
                !subject ||
                isBooking
              }
              onClick={handleBooking}
              className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all duration-300 ${
                !selectedDate ||
                selectedSlots.length === 0 ||
                !subject ||
                isBooking
                  ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
              }`}
            >
              {isBooking ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-6 h-6" />
                  <span>Book Slot</span>
                </>
              )}
            </button>
            <div className="text-center text-purple-200 text-sm mt-2">
              After booking, please contact your teacher directly for payment
              and confirmation.
            </div>
            {/* Back to Dashboard Button */}
            <button
              onClick={() => navigate("/student/dashboard")}
              className="w-full py-3 text-purple-300 font-semibold rounded-xl border border-purple-400/30 bg-white/5 hover:bg-white/10 hover:border-purple-400/50 transition-all duration-300"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}