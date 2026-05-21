"use client"

import { motion } from "framer-motion"
import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { useAuth } from "@/components/providers/auth-provider"
import { useLanguage } from "@/components/providers/language-provider"
import {
  User,
  Bell,
  Lock,
  Palette,
  Globe,
  CreditCard,
  HelpCircle,
  Save,
  Camera,
  Moon,
  Sun,
  Smartphone
} from "lucide-react"

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile")
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()
  const { user } = useAuth()
  const { t } = useLanguage()
  const tabs = [
    { id: "profile", label: t("profile"), icon: User },
    { id: "notifications", label: t("notifications"), icon: Bell },
    { id: "security", label: t("security"), icon: Lock },
    { id: "appearance", label: t("appearance"), icon: Palette },
    { id: "billing", label: t("billing"), icon: CreditCard },
    { id: "help", label: t("help"), icon: HelpCircle },
  ]

  useEffect(() => {
    setMounted(true)
  }, [])

  const selectedTheme = mounted ? theme : "dark"
  const nameParts = user?.name?.trim().split(/\s+/) || []
  const firstName = nameParts[0] || ""
  const lastName = nameParts.slice(1).join(" ")

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={item}>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">{t("settings")}</h1>
        <p className="text-muted-foreground mt-1">{t("managePreferences")}</p>
      </motion.div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <motion.div variants={item} className="lg:w-64">
          <div className="glass-card rounded-xl p-3 space-y-1">
            {tabs.map((tab) => (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                  activeTab === tab.id
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
                whileHover={{ x: 4 }}
              >
                <tab.icon className="w-4 h-4" />
                <span className="text-sm font-medium">{tab.label}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Content */}
        <motion.div variants={item} className="flex-1">
          {activeTab === "profile" && (
            <div className="glass-card rounded-xl p-6 space-y-6">
              <h2 className="text-lg font-semibold text-foreground">{t("profileInformation")}</h2>
              
              {/* Avatar */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/80 to-accent/80 flex items-center justify-center">
                    <User className="w-10 h-10 text-white" />
                  </div>
                  <motion.button
                    className="absolute -bottom-1 -right-1 w-8 h-8 rounded-lg bg-secondary border border-border flex items-center justify-center"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Camera className="w-4 h-4 text-muted-foreground" />
                  </motion.button>
                </div>
                <div>
                  <p className="text-foreground font-medium">{user?.name || t("student")}</p>
                  <p className="text-sm text-muted-foreground">{user?.email || t("noEmail")}</p>
                </div>
              </div>

              {/* Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">{t("firstName")}</label>
                  <input
                    type="text"
                    value={firstName}
                    readOnly
                    className="w-full px-4 py-2.5 rounded-xl bg-secondary/50 border border-border/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">{t("lastName")}</label>
                  <input
                    type="text"
                    value={lastName}
                    readOnly
                    className="w-full px-4 py-2.5 rounded-xl bg-secondary/50 border border-border/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-foreground mb-2">{t("email")}</label>
                  <input
                    type="email"
                    value={user?.email || ""}
                    readOnly
                    className="w-full px-4 py-2.5 rounded-xl bg-secondary/50 border border-border/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-foreground mb-2">{t("bio")}</label>
                  <textarea
                    rows={3}
                    value={user?.major ? `${user.major} ${t("bioTemplate")} ${user.university || t("yourUniversity")}.` : t("noBioYet")}
                    readOnly
                    className="w-full px-4 py-2.5 rounded-xl bg-secondary/50 border border-border/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all resize-none"
                  />
                </div>
              </div>

              <motion.button
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Save className="w-4 h-4" />
                {t("saveChanges")}
              </motion.button>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="glass-card rounded-xl p-6 space-y-6">
              <h2 className="text-lg font-semibold text-foreground">{t("notificationPreferences")}</h2>
              
              <div className="space-y-4">
                {[
                  { title: t("emailNotifications"), description: t("emailNotificationsDesc") },
                  { title: t("pushNotifications"), description: t("pushNotificationsDesc") },
                  { title: t("studyReminders"), description: t("studyRemindersDesc") },
                  { title: t("weeklySummary"), description: t("weeklySummaryDesc") },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-secondary/30">
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                    <motion.button
                      className="w-12 h-6 rounded-full bg-primary/20 relative"
                      whileTap={{ scale: 0.95 }}
                    >
                      <motion.div
                        className="w-5 h-5 rounded-full bg-primary absolute top-0.5 left-0.5"
                        layout
                      />
                    </motion.button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "appearance" && (
            <div className="glass-card rounded-xl p-6 space-y-6">
              <h2 className="text-lg font-semibold text-foreground">{t("appearance")}</h2>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-3">{t("theme")}</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: "light", label: t("light"), icon: Sun },
                    { id: "dark", label: t("dark"), icon: Moon },
                    { id: "system", label: t("system"), icon: Smartphone },
                  ].map((option) => (
                    <motion.button
                      key={option.id}
                      onClick={() => setTheme(option.id)}
                      aria-pressed={selectedTheme === option.id}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                        selectedTheme === option.id
                          ? "bg-primary/15 border-primary/30 text-primary"
                          : "border-border/50 text-muted-foreground hover:text-foreground hover:bg-secondary/30"
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <option.icon className="w-6 h-6" />
                      <span className="text-sm font-medium">{option.label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="glass-card rounded-xl p-6 space-y-6">
              <h2 className="text-lg font-semibold text-foreground">{t("securitySettings")}</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">{t("currentPassword")}</label>
                  <input
                    type="password"
                    placeholder={t("enterCurrentPassword")}
                    className="w-full px-4 py-2.5 rounded-xl bg-secondary/50 border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">{t("newPassword")}</label>
                  <input
                    type="password"
                    placeholder={t("enterNewPassword")}
                    className="w-full px-4 py-2.5 rounded-xl bg-secondary/50 border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">{t("confirmNewPassword")}</label>
                  <input
                    type="password"
                    placeholder={t("confirmNewPasswordPlaceholder")}
                    className="w-full px-4 py-2.5 rounded-xl bg-secondary/50 border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                  />
                </div>
              </div>

              <motion.button
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Lock className="w-4 h-4" />
                {t("updatePassword")}
              </motion.button>
            </div>
          )}

          {(activeTab === "billing" || activeTab === "help") && (
            <div className="glass-card rounded-xl p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-secondary/50 flex items-center justify-center mx-auto mb-4">
                {activeTab === "billing" ? (
                  <CreditCard className="w-8 h-8 text-muted-foreground" />
                ) : (
                  <HelpCircle className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {activeTab === "billing" ? t("billingSubscription") : t("helpSupport")}
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                {t("comingSoon")}
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  )
}
