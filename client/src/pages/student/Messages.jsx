import React, { useState, useEffect, useRef } from "react";
import { useSocket } from "../../contexts/SocketContext";
import { useLocation, Link } from "react-router-dom";
import { useOnlineStatus } from "../../hooks/useOnlineStatus";
import { motion } from "framer-motion";
import {
  MessageCircle, Send, Search, ArrowLeft, Check, CheckCheck, Clock, Sun, Moon, GraduationCap
} from "lucide-react";
import axios from "axios";
import API_CONFIG from "../../config/api";

// Theme configuration
const getTheme = (isDark) => isDark ? {
  pageBg: 'bg-[#0a0612]',
  sidebarBg: 'bg-[#0f0a1a]/90',
  chatBg: 'bg-[#0d0815]/80',
  cardBg: 'bg-white/[0.03]',
  cardBorder: 'border-white/10',
  headerBg: 'bg-[#0f0a1a]/90',
  text: 'text-white',
  textMuted: 'text-slate-400',
  textSubtle: 'text-slate-500',
  inputBg: 'bg-white/[0.05]',
  inputBorder: 'border-white/10',
  inputText: 'text-white',
  inputPlaceholder: 'placeholder-slate-500',
  accentColor: 'text-violet-400',
  accentBg: 'bg-violet-500/10',
  ownMsgBg: 'bg-gradient-to-r from-violet-600 to-fuchsia-600',
  otherMsgBg: 'bg-white/[0.05]',
  otherMsgBorder: 'border-white/10',
  hoverBg: 'hover:bg-white/[0.06]',
  activeBg: 'bg-violet-500/10',
  onlineColor: 'text-emerald-400',
  offlineColor: 'text-red-400',
  orbColor1: 'bg-violet-600/20',
  orbColor2: 'bg-fuchsia-600/15',
} : {
  pageBg: 'bg-gradient-to-br from-slate-50 via-violet-50 to-purple-50',
  sidebarBg: 'bg-white/90',
  chatBg: 'bg-white/70',
  cardBg: 'bg-white/80',
  cardBorder: 'border-violet-100',
  headerBg: 'bg-white/90',
  text: 'text-slate-900',
  textMuted: 'text-slate-600',
  textSubtle: 'text-slate-500',
  inputBg: 'bg-white',
  inputBorder: 'border-violet-200',
  inputText: 'text-slate-900',
  inputPlaceholder: 'placeholder-slate-400',
  accentColor: 'text-violet-600',
  accentBg: 'bg-violet-100',
  ownMsgBg: 'bg-gradient-to-r from-violet-600 to-fuchsia-600',
  otherMsgBg: 'bg-white',
  otherMsgBorder: 'border-violet-100',
  hoverBg: 'hover:bg-violet-50',
  activeBg: 'bg-violet-100',
  onlineColor: 'text-emerald-600',
  offlineColor: 'text-red-500',
  orbColor1: 'bg-violet-300/30',
  orbColor2: 'bg-fuchsia-300/20',
};

const Messages = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('dashboardTheme');
    return saved ? saved === 'dark' : true;
  });
  const theme = getTheme(isDarkMode);

  const { socket, isConnected } = useSocket();
  const location = useLocation();
  const isOnline = useOnlineStatus();

  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [queuedMessages, setQueuedMessages] = useState([]);
  const [showOfflineNotice, setShowOfflineNotice] = useState(false);
  const messagesEndRef = useRef(null);
  const [currentUser, setCurrentUser] = useState(null);

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem('dashboardTheme', newTheme ? 'dark' : 'light');
  };

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await axios.get(`${API_CONFIG.BASE_URL}/api/profile`, { withCredentials: true });
        setCurrentUser(response.data);
      } catch (error) {
        console.error("Error fetching current user:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("queuedMessages");
    if (saved) setQueuedMessages(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("queuedMessages", JSON.stringify(queuedMessages));
  }, [queuedMessages]);

  useEffect(() => {
    if (isOnline && queuedMessages.length > 0) {
      sendQueuedMessages();
      fetchConversations();
      if (selectedConversation) fetchMessages(selectedConversation.participant._id);
    }
    if (!isOnline) {
      setShowOfflineNotice(true);
      setTimeout(() => setShowOfflineNotice(false), 3000);
    }
  }, [isOnline]);

  const sendQueuedMessages = async () => {
    if (!socket || !isConnected || !currentUser || queuedMessages.length === 0) return;
    for (const queuedMsg of queuedMessages) {
      try {
        socket.emit("send_message", queuedMsg);
        if (selectedConversation && queuedMsg.recipient === selectedConversation.participant._id) {
          setMessages((prev) => [...prev, {
            _id: "temp_" + Date.now(),
            sender: { _id: currentUser._id },
            content: queuedMsg.content,
            createdAt: new Date(),
            isRead: false,
          }]);
        }
      } catch (error) {
        console.error("Error sending queued message:", error);
      }
    }
    setQueuedMessages([]);
  };

  useEffect(() => {
    const shouldStartConversation = location.state?.selectedTeacherId;
    if (shouldStartConversation && currentUser) {
      const teacherId = location.state.selectedTeacherId;
      const teacherName = location.state.teacherName;
      const teacherAvatar = location.state.teacherAvatar;

      if (conversations.length > 0) {
        const existingConversation = conversations.find(conv => conv.participant._id === teacherId);
        if (existingConversation) {
          handleSelectConversation(existingConversation);
          return;
        }
      }

      setSelectedConversation({
        participant: {
          _id: teacherId,
          firstName: teacherName ? teacherName.split(" ")[0] : "Teacher",
          lastName: teacherName ? (teacherName.split(" ")[1] || "") : "",
          avatar: teacherAvatar,
        },
        lastMessage: { content: "Start a conversation", createdAt: new Date() },
        unreadCount: 0,
      });
      setNewMessage(`Hi ${teacherName || "there"}, I'm interested in your classes. Can we discuss the details?`);
    }
  }, [location.state, conversations, currentUser]);

  useEffect(() => {
    if (currentUser) fetchConversations();
  }, [currentUser]);

  useEffect(() => {
    if (socket && isConnected && currentUser) {
      const handleNewMessage = (message) => {
        if (message.sender._id === currentUser._id) {
          fetchConversations();
          return;
        }
        if (selectedConversation && message.sender._id === selectedConversation.participant._id && message.recipient._id === currentUser._id) {
          setMessages(prev => {
            const exists = prev.find(m => m._id === message._id);
            return !exists ? [...prev, message] : prev;
          });
        }
        fetchConversations();
      };

      const handleMessageSent = (sentMessage) => {
        setMessages(prev => prev.map(msg =>
          (msg.content === sentMessage.content && msg.status === "sending") || msg._id?.toString().startsWith('temp_')
            ? { ...msg, _id: sentMessage._id, status: "sent", createdAt: sentMessage.createdAt }
            : msg
        ));
      };

      const handleMessageNotification = () => fetchConversations();
      const handleNewConversation = (data) => {
        setConversations(prev => {
          const exists = prev.find(conv => conv.participant._id === data.participant._id);
          if (!exists) return [data, ...prev];
          return prev.map(conv => conv.participant._id === data.participant._id ? { ...conv, ...data } : conv);
        });
      };

      const handleUserOnline = (userId) => setConversations(prev => prev.map(conv =>
        conv.participant._id === userId ? { ...conv, participant: { ...conv.participant, isOnline: true } } : conv
      ));

      const handleUserOffline = (userId) => setConversations(prev => prev.map(conv =>
        conv.participant._id === userId ? { ...conv, participant: { ...conv.participant, isOnline: false } } : conv
      ));

      socket.on("new_message", handleNewMessage);
      socket.on("message_sent", handleMessageSent);
      socket.on("message_notification", handleMessageNotification);
      socket.on("new_conversation", handleNewConversation);
      socket.on("user_online", handleUserOnline);
      socket.on("user_offline", handleUserOffline);

      return () => {
        socket.off("new_message", handleNewMessage);
        socket.off("message_sent", handleMessageSent);
        socket.off("message_notification", handleMessageNotification);
        socket.off("new_conversation", handleNewConversation);
        socket.off("user_online", handleUserOnline);
        socket.off("user_offline", handleUserOffline);
      };
    }
  }, [socket, isConnected, selectedConversation, currentUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchConversations = async () => {
    if (!currentUser) return;
    try {
      const response = await axios.get(`${API_CONFIG.BASE_URL}/api/messages/conversations`, { withCredentials: true });
      setConversations(response.data);
    } catch (error) {
      console.error("Error fetching conversations:", error.response?.data);
    }
  };

  const fetchMessages = async (participantId) => {
    if (!currentUser) return;
    try {
      const response = await axios.get(`${API_CONFIG.BASE_URL}/api/messages/conversation/${participantId}`, { withCredentials: true });
      setMessages(response.data);
      if (socket && currentUser) {
        const roomId = [currentUser._id, participantId].sort().join("_");
        socket.emit("join_room", roomId);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !currentUser || sendingMessage) return;
    setSendingMessage(true);

    const messageData = {
      sender: currentUser._id,
      recipient: selectedConversation.participant._id,
      content: newMessage.trim(),
      messageType: "text",
    };

    const tempId = "temp_" + Date.now();
    const localMessage = {
      _id: tempId,
      sender: { _id: currentUser._id, firstName: currentUser.firstName, lastName: currentUser.lastName },
      recipient: { _id: selectedConversation.participant._id },
      content: messageData.content,
      createdAt: new Date(),
      isRead: false,
      status: "sending",
    };

    setMessages(prev => [...prev, localMessage]);
    setNewMessage("");

    try {
      if (socket && isConnected && isOnline) {
        socket.emit('send_message', messageData);
      } else {
        const apiResponse = await axios.post(`${API_CONFIG.BASE_URL}/api/messages/send`, messageData, { withCredentials: true });
        setMessages(prev => prev.map(msg => msg._id === tempId ? { ...msg, _id: apiResponse.data._id, status: "sent", createdAt: apiResponse.data.createdAt } : msg));
        fetchConversations();
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages(prev => prev.map(msg => msg._id === tempId ? { ...msg, status: "queued" } : msg));
      setQueuedMessages(prev => [...prev, messageData]);
      if (!isOnline) {
        setShowOfflineNotice(true);
        setTimeout(() => setShowOfflineNotice(false), 3000);
      }
    } finally {
      setSendingMessage(false);
    }
  };

  const handleSelectConversation = (conversation) => {
    setConversations(prev => prev.map(conv =>
      conv.participant._id === conversation.participant._id ? { ...conv, unreadCount: 0 } : conv
    ));
    setSelectedConversation(conversation);
    fetchMessages(conversation.participant._id);
  };

  const formatTime = (date) => new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const formatDate = (date) => {
    const messageDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (messageDate.toDateString() === today.toDateString()) return "Today";
    if (messageDate.toDateString() === yesterday.toDateString()) return "Yesterday";
    return messageDate.toLocaleDateString();
  };

  const filteredConversations = conversations.filter(conv =>
    conv.participant.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.participant.lastName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className={`min-h-screen ${theme.pageBg} flex items-center justify-center`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme.pageBg} transition-colors duration-500`}>
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-40 -right-40 w-96 h-96 ${theme.orbColor1} rounded-full blur-[120px] animate-pulse`} />
        <div className={`absolute -bottom-40 -left-40 w-80 h-80 ${theme.orbColor2} rounded-full blur-[100px] animate-pulse`} style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 h-screen flex">
        {/* Sidebar */}
        <div className={`${selectedConversation ? "hidden lg:flex" : "flex"} w-full lg:w-1/3 xl:w-1/4 flex-col ${theme.sidebarBg} backdrop-blur-xl border-r ${theme.cardBorder}`}>
          {/* Sidebar Header */}
          <div className={`p-4 border-b ${theme.cardBorder} ${theme.headerBg} backdrop-blur-sm`}>
            <div className="flex items-center justify-between mb-4">
              <Link to="/student/dashboard" className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-xl hover:shadow-lg hover:shadow-violet-500/25 transition-all text-sm font-medium">
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isOnline ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
                  <span className={`text-xs font-medium ${isOnline ? theme.onlineColor : theme.offlineColor}`}>
                    {isOnline ? "Online" : "Offline"}
                  </span>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={toggleTheme}
                  className={`p-2 rounded-xl border transition-all ${isDarkMode ? 'bg-white/[0.05] border-white/10 hover:bg-white/[0.1]' : 'bg-white border-violet-200 hover:bg-violet-50'}`}
                >
                  {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-violet-600" />}
                </motion.button>
              </div>
            </div>

            <h1 className={`text-2xl font-bold bg-gradient-to-r from-violet-500 to-fuchsia-500 bg-clip-text text-transparent mb-4`}>Messages</h1>

            <div className="relative">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${theme.textSubtle} w-5 h-5`} />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 ${theme.inputBg} border ${theme.inputBorder} rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 ${theme.inputText} ${theme.inputPlaceholder} transition-all`}
              />
            </div>
          </div>

          {/* Offline Notice */}
          {(showOfflineNotice || (!isOnline && queuedMessages.length > 0)) && (
            <div className="p-3 bg-amber-500/10 border-l-4 border-amber-500">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <span className={`text-sm font-medium ${theme.textMuted}`}>
                  {!isOnline && queuedMessages.length > 0 ? `${queuedMessages.length} message(s) queued` : "You're offline"}
                </span>
              </div>
            </div>
          )}

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-violet-500/25">
                  <MessageCircle className="w-8 h-8 text-white" />
                </div>
                <p className={`${theme.text} font-medium text-lg mb-2`}>No conversations yet</p>
                <p className={`text-sm ${theme.textSubtle}`}>Start a conversation from Find Teachers</p>
              </div>
            ) : (
              filteredConversations.map((conversation) => (
                <motion.div
                  key={conversation.participant._id}
                  whileHover={{ scale: 1.01 }}
                  onClick={() => handleSelectConversation(conversation)}
                  className={`p-4 border-b ${theme.cardBorder} cursor-pointer transition-all ${theme.hoverBg} ${
                    selectedConversation?.participant._id === conversation.participant._id ? `${theme.activeBg} border-l-4 border-l-violet-500` : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-full flex items-center justify-center text-white font-semibold shadow-lg shadow-violet-500/25">
                        {conversation.participant.firstName[0]}{conversation.participant.lastName[0]}
                      </div>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 ${conversation.participant.isOnline ? 'bg-emerald-500' : 'bg-slate-400'} border-2 ${isDarkMode ? 'border-[#0f0a1a]' : 'border-white'} rounded-full`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`text-sm font-semibold ${theme.text} truncate`}>
                          {conversation.participant.firstName} {conversation.participant.lastName}
                        </p>
                        <span className={`text-xs ${theme.textSubtle}`}>{formatTime(conversation.lastMessage.createdAt)}</span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <p className={`text-sm ${theme.textMuted} truncate`}>{conversation.lastMessage.content}</p>
                        {conversation.unreadCount > 0 && (
                          <span className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center font-medium">
                            {conversation.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`${selectedConversation ? "flex" : "hidden lg:flex"} flex-1 flex-col ${theme.chatBg} backdrop-blur-sm`}>
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className={`p-4 ${theme.headerBg} backdrop-blur-sm border-b ${theme.cardBorder} flex items-center justify-between`}>
                <div className="flex items-center gap-3">
                  <button onClick={() => setSelectedConversation(null)} className={`lg:hidden p-2 ${theme.hoverBg} rounded-xl transition-colors`}>
                    <ArrowLeft className={`w-5 h-5 ${theme.textMuted}`} />
                  </button>
                  <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-full flex items-center justify-center text-white font-semibold shadow-lg shadow-violet-500/25">
                    {selectedConversation.participant.firstName[0]}{selectedConversation.participant.lastName[0]}
                  </div>
                  <div>
                    <h3 className={`font-semibold ${theme.text}`}>
                      {selectedConversation.participant.firstName} {selectedConversation.participant.lastName}
                    </h3>
                    <p className={`text-sm ${selectedConversation.participant.isOnline ? theme.onlineColor : theme.offlineColor}`}>
                      {selectedConversation.participant.isOnline ? "Online" : "Offline"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message, index) => {
                  const isOwnMessage = String(message.sender?._id) === String(currentUser?._id);
                  const showDate = index === 0 || formatDate(message.createdAt) !== formatDate(messages[index - 1].createdAt);

                  return (
                    <div key={message._id}>
                      {showDate && (
                        <div className="text-center my-4">
                          <span className={`${theme.cardBg} backdrop-blur-sm px-3 py-1 rounded-full text-xs ${theme.textSubtle} border ${theme.cardBorder}`}>
                            {formatDate(message.createdAt)}
                          </span>
                        </div>
                      )}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex items-end gap-2 ${isOwnMessage ? "justify-end" : "justify-start"}`}
                      >
                        {!isOwnMessage && (
                          <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-full flex items-center justify-center text-white text-sm font-semibold shadow-md">
                            {selectedConversation?.participant?.firstName?.[0]}{selectedConversation?.participant?.lastName?.[0]}
                          </div>
                        )}
                        <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-lg ${
                          isOwnMessage ? `${theme.ownMsgBg} text-white rounded-br-sm` : `${theme.otherMsgBg} ${theme.text} border ${theme.otherMsgBorder} rounded-bl-sm`
                        }`}>
                          <p className="text-sm break-words">{message.content}</p>
                          <div className={`flex items-center mt-1 gap-1 ${isOwnMessage ? "justify-end text-white/70" : `justify-start ${theme.textSubtle}`}`}>
                            <span className="text-xs">{formatTime(message.createdAt)}</span>
                            {isOwnMessage && (
                              message.status === "queued" ? <Clock className="w-3 h-3 text-amber-300" />
                              : message.isRead ? <CheckCheck className="w-3 h-3" />
                              : <Check className="w-3 h-3" />
                            )}
                          </div>
                        </div>
                        {isOwnMessage && <div className="w-8 h-8" />}
                      </motion.div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className={`p-4 ${theme.headerBg} backdrop-blur-sm border-t ${theme.cardBorder}`}>
                <div className="flex items-end gap-3">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                    placeholder={isOnline ? "Type a message..." : "Type a message... (will send when online)"}
                    className={`w-full px-4 py-3 ${theme.inputBg} border ${theme.inputBorder} rounded-2xl focus:outline-none focus:ring-2 focus:ring-violet-500 ${theme.inputText} ${theme.inputPlaceholder} resize-none transition-all`}
                    rows={1}
                    style={{ minHeight: "48px", maxHeight: "120px" }}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || sendingMessage}
                    className={`p-3.5 rounded-2xl transition-all shadow-lg shadow-violet-500/25 ${
                      isOnline ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:shadow-xl" : "bg-amber-500"
                    } text-white disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {sendingMessage ? <Clock className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-violet-500/25">
                  <MessageCircle className="w-10 h-10 text-white" />
                </div>
                <h3 className={`text-xl font-semibold ${theme.text} mb-2`}>Welcome to Yuvsiksha Messages</h3>
                <p className={theme.textMuted}>Select a conversation to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;
