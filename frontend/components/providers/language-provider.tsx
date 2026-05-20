'use client'

import { createContext, useContext, useState, useEffect } from 'react'

type Language = 'en' | 'vi'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export const translations = {
  en: {
    'dashboard': 'Dashboard',
    'documents': 'Documents',
    'chat': 'AI Chat',
    'analytics': 'Analytics',
    'profile': 'Profile',
    'admin': 'Admin',
    'settings': 'Settings',
    'upgrade': 'Upgrade to Pro',
    'unlockFeatures': 'Unlock unlimited AI chats and advanced analytics',
    'upgradeNow': 'Upgrade Now',
    'welcome': 'Welcome back',
    'totalDocuments': 'Total Documents',
    'aiChats': 'AI Chats',
    'subjects': 'Subjects',
    'recentUploads': 'Recent Uploads',
    'recentDocuments': 'Recent Documents',
    'aiRecommendations': 'AI Recommendations',
    'activityTimeline': 'Activity Timeline',
    'quickActions': 'Quick Actions',
    'uploadDocument': 'Upload Document',
    'startChat': 'Start Chat',
    'viewAnalytics': 'View Analytics',
    'browseSubjects': 'Browse Subjects',
    'searchDocuments': 'Search documents...',
    'uploadedBy': 'Uploaded by',
    'pages': 'pages',
    'download': 'Download',
    'share': 'Share',
    'delete': 'Delete',
    'favorite': 'Favorite',
    'dragDrop': 'Drag and drop files here or click to select',
    'dragDropMulti': 'You can upload multiple PDF files at once',
    'uploading': 'Uploading',
    'selectFile': 'Select File',
    'gridView': 'Grid View',
    'listView': 'List View',
    'filterBySubject': 'Filter by subject...',
    'noDocuments': 'No documents yet',
    'startUploading': 'Start uploading documents to get started',
    'chatPlaceholder': 'Ask me anything about your documents...',
    'send': 'Send',
    'newChat': 'New Chat',
    'chatHistory': 'Chat History',
    'suggestedPrompts': 'Suggested Prompts',
    'summarize': 'Summarize this document',
    'generateFlashcards': 'Generate flashcards',
    'createQuiz': 'Create a quiz',
    'explainConcept': 'Explain this concept',
    'studyAnalytics': 'Study Analytics',
    'learningProgress': 'Learning Progress',
    'documentViews': 'Document Views',
    'aiUsage': 'AI Usage Statistics',
    'weeklyActivity': 'Weekly Activity',
    'userManagement': 'User Management',
    'documentModeration': 'Document Moderation',
    'adminReports': 'Admin Reports',
    'approve': 'Approve',
    'reject': 'Reject',
    'moderationQueue': 'Moderation Queue',
    'profileSettings': 'Profile Settings',
    'notificationPreferences': 'Notification Preferences',
    'appearance': 'Appearance Settings',
    'security': 'Security Settings',
    'changePassword': 'Change Password',
    'twoFactor': 'Two-Factor Authentication',
    'language': 'Language',
    'darkMode': 'Dark Mode',
    'emailNotifications': 'Email Notifications',
    'pushNotifications': 'Push Notifications',
    'smartLanguage': 'Smart Learning'
  },
  vi: {
    'dashboard': 'Bảng điều khiển',
    'documents': 'Tài liệu',
    'chat': 'Trò chuyện AI',
    'analytics': 'Phân tích',
    'profile': 'Hồ sơ',
    'admin': 'Quản trị',
    'settings': 'Cài đặt',
    'upgrade': 'Nâng cấp lên Pro',
    'unlockFeatures': 'Mở khóa trò chuyện AI không giới hạn và phân tích nâng cao',
    'upgradeNow': 'Nâng cấp ngay',
    'welcome': 'Chào mừng trở lại',
    'totalDocuments': 'Tổng tài liệu',
    'aiChats': 'Cuộc trò chuyện AI',
    'subjects': 'Môn học',
    'recentUploads': 'Tải lên gần đây',
    'recentDocuments': 'Tài liệu gần đây',
    'aiRecommendations': 'Gợi ý AI',
    'activityTimeline': 'Dòng thời gian hoạt động',
    'quickActions': 'Hành động nhanh',
    'uploadDocument': 'Tải lên tài liệu',
    'startChat': 'Bắt đầu trò chuyện',
    'viewAnalytics': 'Xem phân tích',
    'browseSubjects': 'Duyệt môn học',
    'searchDocuments': 'Tìm kiếm tài liệu...',
    'uploadedBy': 'Tải lên bởi',
    'pages': 'trang',
    'download': 'Tải xuống',
    'share': 'Chia sẻ',
    'delete': 'Xóa',
    'favorite': 'Yêu thích',
    'dragDrop': 'Kéo và thả các tệp tại đây hoặc nhấp để chọn',
    'dragDropMulti': 'Bạn có thể tải lên nhiều tệp PDF cùng một lúc',
    'uploading': 'Đang tải lên',
    'selectFile': 'Chọn tệp',
    'gridView': 'Chế độ lưới',
    'listView': 'Chế độ danh sách',
    'filterBySubject': 'Lọc theo môn học...',
    'noDocuments': 'Chưa có tài liệu nào',
    'startUploading': 'Bắt đầu tải lên tài liệu để bắt đầu',
    'chatPlaceholder': 'Hỏi tôi bất cứ điều gì về tài liệu của bạn...',
    'send': 'Gửi',
    'newChat': 'Trò chuyện mới',
    'chatHistory': 'Lịch sử trò chuyện',
    'suggestedPrompts': 'Gợi ý nhắc nhở',
    'summarize': 'Tóm tắt tài liệu này',
    'generateFlashcards': 'Tạo thẻ ghi nhớ',
    'createQuiz': 'Tạo bài kiểm tra',
    'explainConcept': 'Giải thích khái niệm này',
    'studyAnalytics': 'Phân tích học tập',
    'learningProgress': 'Tiến độ học tập',
    'documentViews': 'Lượt xem tài liệu',
    'aiUsage': 'Thống kê sử dụng AI',
    'weeklyActivity': 'Hoạt động hàng tuần',
    'userManagement': 'Quản lý người dùng',
    'documentModeration': 'Kiểm duyệt tài liệu',
    'adminReports': 'Báo cáo quản trị',
    'approve': 'Phê duyệt',
    'reject': 'Từ chối',
    'moderationQueue': 'Hàng đợi kiểm duyệt',
    'profileSettings': 'Cài đặt hồ sơ',
    'notificationPreferences': 'Tùy chọn thông báo',
    'appearance': 'Cài đặt giao diện',
    'security': 'Cài đặt bảo mật',
    'changePassword': 'Đổi mật khẩu',
    'twoFactor': 'Xác thực hai yếu tố',
    'language': 'Ngôn ngữ',
    'darkMode': 'Chế độ tối',
    'emailNotifications': 'Thông báo email',
    'pushNotifications': 'Thông báo đẩy',
    'smartLanguage': 'Học tập thông minh'
  }
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en')

  useEffect(() => {
    const saved = localStorage.getItem('language') as Language | null
    if (saved === 'vi' || saved === 'en') {
      setLanguageState(saved)
    }
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem('language', lang)
  }

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations['en']] || key
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider')
  }
  return context
}
