"use client"

import { motion } from "framer-motion"
import { useRef, useState } from "react"
import { useAuth } from "@/components/providers/auth-provider"
import { apiFetch, getApiUrl, getNetworkErrorMessage } from "@/lib/api"
import {
  User,
  Mail,
  MapPin,
  Calendar,
  BookOpen,
  Award,
  Clock,
  Target,
  Edit3,
  Camera,
  Github,
  Linkedin,
  Twitter,
  FileText,
  MessageSquare,
  Zap,
  TrendingUp,
  Star,
  ChevronRight,
  Upload,
  Trash2,
  X
} from "lucide-react"
import Link from "next/link"

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

const stats = [
  { label: "Documents", value: "47", icon: FileText, color: "from-blue-500 to-cyan-500" },
  { label: "AI Chats", value: "128", icon: MessageSquare, color: "from-violet-500 to-purple-500" },
  { label: "Study Hours", value: "234", icon: Clock, color: "from-emerald-500 to-teal-500" },
  { label: "Achievements", value: "12", icon: Award, color: "from-amber-500 to-orange-500" },
]

const achievements = [
  { title: "Early Adopter", description: "Joined in the first month", icon: Zap, earned: true },
  { title: "Knowledge Seeker", description: "Uploaded 50+ documents", icon: BookOpen, earned: true },
  { title: "AI Explorer", description: "100+ AI conversations", icon: MessageSquare, earned: true },
  { title: "Consistency King", description: "7-day study streak", icon: Target, earned: true },
  { title: "Top Performer", description: "Top 10% in analytics", icon: TrendingUp, earned: false },
  { title: "Master Scholar", description: "Complete all courses", icon: Star, earned: false },
]

const recentActivity = [
  { action: "Uploaded", item: "Machine Learning Notes.pdf", time: "2 hours ago", icon: FileText },
  { action: "AI Chat", item: "Asked about neural networks", time: "4 hours ago", icon: MessageSquare },
  { action: "Studied", item: "Data Structures flashcards", time: "Yesterday", icon: BookOpen },
  { action: "Achievement", item: "Earned Knowledge Seeker badge", time: "2 days ago", icon: Award },
]

const subjects = [
  { name: "Machine Learning", progress: 78, color: "bg-blue-500" },
  { name: "Data Structures", progress: 92, color: "bg-emerald-500" },
  { name: "Calculus III", progress: 65, color: "bg-violet-500" },
  { name: "Physics", progress: 45, color: "bg-amber-500" },
]

export default function ProfilePage() {
  const { user, updateUser } = useAuth()
  const avatarInputRef = useRef<HTMLInputElement | null>(null)
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false)
  const [avatarMessage, setAvatarMessage] = useState("")
  const [avatarError, setAvatarError] = useState("")
  const [isAvatarSaving, setIsAvatarSaving] = useState(false)
  const displayName = user?.name || "Student"
  const major = user?.major || "Student"
  const university = user?.university || "University"
  const roleLabel = user?.roles.includes("ADMIN") ? "Administrator" : "Student"

  const applyBackendUser = (backendUser: {
    fullName: string
    email: string
    avatarUrl?: string | null
    university?: string | null
    major?: string | null
    roles: string[]
  }) => {
    updateUser({
      name: backendUser.fullName,
      email: backendUser.email,
      avatarUrl: backendUser.avatarUrl,
      university: backendUser.university,
      major: backendUser.major,
      roles: backendUser.roles,
      role: backendUser.roles.includes("ADMIN") ? "admin" : "user",
    })
  }

  const uploadAvatar = async (file?: File) => {
    if (!user || !file) return
    setAvatarError("")
    setAvatarMessage("")
    setIsAvatarSaving(true)

    const formData = new FormData()
    formData.append("file", file)

    try {
      const response = await apiFetch(`${getApiUrl()}/api/auth/users/${user.id}/avatar`, {
        method: "POST",
        body: formData,
      })
      const body = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(body?.message || "Could not upload avatar")
      }
      applyBackendUser(body)
      setAvatarMessage("Avatar updated")
      setAvatarMenuOpen(false)
    } catch (err) {
      setAvatarError(getNetworkErrorMessage(err))
    } finally {
      setIsAvatarSaving(false)
      if (avatarInputRef.current) {
        avatarInputRef.current.value = ""
      }
    }
  }

  const removeAvatar = async () => {
    if (!user) return
    setAvatarError("")
    setAvatarMessage("")
    setIsAvatarSaving(true)
    try {
      const response = await apiFetch(`${getApiUrl()}/api/auth/users/${user.id}/avatar`, {
        method: "DELETE",
      })
      const body = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(body?.message || "Could not remove avatar")
      }
      applyBackendUser(body)
      setAvatarMessage("Avatar removed")
      setAvatarMenuOpen(false)
    } catch (err) {
      setAvatarError(getNetworkErrorMessage(err))
    } finally {
      setIsAvatarSaving(false)
    }
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Profile Header */}
      <motion.div variants={item} className="glass-card rounded-2xl overflow-hidden">
        {/* Cover Image */}
        <div className="h-32 md:h-48 bg-gradient-to-br from-primary/30 via-accent/20 to-primary/10 relative">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
          <motion.div
            className="absolute top-3 right-3 md:top-4 md:right-4"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link
              href="/settings"
              className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-xl bg-background/80 backdrop-blur-sm border border-border/50 text-sm text-foreground hover:bg-background transition-colors"
            >
              <Edit3 className="w-4 h-4" />
              <span className="hidden md:inline">Edit Profile</span>
            </Link>
          </motion.div>
        </div>

        {/* Profile Info */}
        <div className="px-4 md:px-8 pb-6 md:pb-8 -mt-12 md:-mt-16">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            {/* Avatar & Name */}
            <div className="flex flex-col md:flex-row md:items-end gap-4">
              <motion.div
                className="relative"
                whileHover={{ scale: 1.02 }}
              >
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => uploadAvatar(event.target.files?.[0])}
                />
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-gradient-to-br from-primary to-accent p-1 shadow-lg shadow-primary/20">
                  <div className="w-full h-full rounded-xl bg-background flex items-center justify-center overflow-hidden">
                    {user?.avatarUrl ? (
                      <img src={user.avatarUrl} alt={displayName} className="h-full w-full object-cover" />
                    ) : (
                      <User className="w-12 h-12 md:w-16 md:h-16 text-muted-foreground" />
                    )}
                  </div>
                </div>
                <motion.button
                  type="button"
                  onClick={() => setAvatarMenuOpen((open) => !open)}
                  className="absolute -bottom-2 -right-2 w-8 h-8 md:w-10 md:h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Camera className="w-4 h-4 md:w-5 md:h-5" />
                </motion.button>
                {avatarMenuOpen && (
                  <div className="absolute left-0 top-full z-20 mt-4 w-56 rounded-xl border border-border/50 bg-background/95 p-2 shadow-xl backdrop-blur">
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={isAvatarSaving}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Upload className="h-4 w-4 text-primary" />
                      Upload avatar
                    </button>
                    {user?.avatarUrl && (
                      <button
                        type="button"
                        onClick={removeAvatar}
                        disabled={isAvatarSaving}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Trash2 className="h-4 w-4" />
                        Remove avatar
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setAvatarMenuOpen(false)}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                      Close
                    </button>
                  </div>
                )}
              </motion.div>

              <div className="space-y-1 md:pb-2">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">{displayName}</h1>
                <p className="text-muted-foreground">{user?.roles.includes("ADMIN") ? "AI Study Hub Administrator" : `${major} ${roleLabel}`}</p>
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground pt-1">
                  <span className="flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    {user?.email || "No email"}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {university}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Joined March 2024
                  </span>
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-2">
              {[
                { icon: Github, href: "#" },
                { icon: Linkedin, href: "#" },
                { icon: Twitter, href: "#" },
              ].map((social, i) => (
                <motion.a
                  key={i}
                  href={social.href}
                  className="w-10 h-10 rounded-xl bg-secondary/50 hover:bg-secondary border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <social.icon className="w-5 h-5" />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Bio */}
          <motion.div
            className="mt-6 p-4 rounded-xl bg-secondary/30 border border-border/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <p className="text-muted-foreground leading-relaxed">
              {user?.major
                ? `${displayName} is currently studying ${user.major}${user.university ? ` at ${user.university}` : ""}.`
                : "No profile bio has been added yet."}
            </p>
          </motion.div>
        </div>
      </motion.div>

      {(avatarMessage || avatarError) && (
        <motion.div
          variants={item}
          className={`rounded-xl border px-4 py-3 text-sm ${
            avatarError
              ? "border-destructive/30 bg-destructive/10 text-destructive"
              : "border-accent/30 bg-accent/10 text-accent"
          }`}
        >
          {avatarError || avatarMessage}
        </motion.div>
      )}

      {/* Stats Grid */}
      <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            className="glass-card rounded-xl p-4 md:p-5"
            whileHover={{ scale: 1.02, y: -4 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3`}>
              <stat.icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <p className="text-2xl md:text-3xl font-bold text-foreground">{stat.value}</p>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Subject Progress */}
          <motion.div variants={item} className="glass-card rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-foreground">Subject Progress</h2>
              <Link
                href="/analytics"
                className="flex items-center gap-1 text-sm text-primary hover:underline"
              >
                View All
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-4">
              {subjects.map((subject, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">{subject.name}</span>
                    <span className="text-sm text-muted-foreground">{subject.progress}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary/50 overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${subject.color}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${subject.progress}%` }}
                      transition={{ duration: 1, delay: i * 0.1, ease: "easeOut" }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Achievements */}
          <motion.div variants={item} className="glass-card rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-foreground">Achievements</h2>
              <span className="text-sm text-muted-foreground">4/6 Earned</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {achievements.map((achievement, i) => (
                <motion.div
                  key={i}
                  className={`p-4 rounded-xl border transition-all ${
                    achievement.earned
                      ? "bg-primary/10 border-primary/30"
                      : "bg-secondary/20 border-border/30 opacity-50"
                  }`}
                  whileHover={{ scale: achievement.earned ? 1.02 : 1 }}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                    achievement.earned
                      ? "bg-primary/20 text-primary"
                      : "bg-secondary/50 text-muted-foreground"
                  }`}>
                    <achievement.icon className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-medium text-foreground">{achievement.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{achievement.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Recent Activity */}
          <motion.div variants={item} className="glass-card rounded-xl p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h2>
            <div className="space-y-4">
              {recentActivity.map((activity, i) => (
                <motion.div
                  key={i}
                  className="flex items-start gap-3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <div className="w-8 h-8 rounded-lg bg-secondary/50 flex items-center justify-center flex-shrink-0">
                    <activity.icon className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">
                      <span className="text-muted-foreground">{activity.action}:</span>{" "}
                      <span className="font-medium">{activity.item}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </motion.div>
              ))}
            </div>
            <Link
              href="/dashboard"
              className="flex items-center justify-center gap-2 mt-4 py-2.5 rounded-xl bg-secondary/50 hover:bg-secondary text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              View All Activity
              <ChevronRight className="w-4 h-4" />
            </Link>
          </motion.div>

          {/* Study Streak */}
          <motion.div
            variants={item}
            className="glass-card rounded-xl p-6 bg-gradient-to-br from-primary/10 to-accent/5"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">7 Days</p>
                <p className="text-sm text-muted-foreground">Current Streak</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                <motion.div
                  key={day}
                  className={`flex-1 h-2 rounded-full ${
                    day <= 7 ? "bg-amber-500" : "bg-secondary/50"
                  }`}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: day * 0.1 }}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Keep studying daily to maintain your streak!
            </p>
          </motion.div>

          {/* Quick Links */}
          <motion.div variants={item} className="glass-card rounded-xl p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Quick Links</h2>
            <div className="space-y-2">
              {[
                { label: "My Documents", href: "/documents", icon: FileText },
                { label: "AI Chat", href: "/chat", icon: MessageSquare },
                { label: "Analytics", href: "/analytics", icon: TrendingUp },
                { label: "Settings", href: "/settings", icon: Edit3 },
              ].map((link, i) => (
                <motion.div key={i} whileHover={{ x: 4 }}>
                  <Link
                    href={link.href}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-secondary/50 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <link.icon className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-foreground">{link.label}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}
