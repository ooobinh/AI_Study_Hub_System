"use client"

import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSidebar } from "@/components/providers/sidebar-provider"
import { useAuth } from "@/components/providers/auth-provider"
import { useLanguage } from "@/components/providers/language-provider"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  BarChart3,
  Settings,
  ChevronLeft,
  Sparkles,
  Menu,
  X,
  Shield,
  BookOpen,
  User,
  UsersRound,
  MessagesSquare
} from "lucide-react"

const navItems = [
  { icon: LayoutDashboard, labelKey: "dashboard", href: "/dashboard" },
  { icon: FileText, labelKey: "documents", href: "/documents" },
  { icon: BookOpen, labelKey: "subjects", href: "/subjects" },
  { icon: UsersRound, labelKey: "workspaces", href: "/workspaces" },
  { icon: MessagesSquare, labelKey: "forum", href: "/forum" },
  { icon: MessageSquare, labelKey: "chat", href: "/chat" },
  { icon: BarChart3, labelKey: "analytics", href: "/analytics" },
  { icon: User, labelKey: "profile", href: "/profile" },
  { icon: Shield, labelKey: "admin", href: "/admin", adminOnly: true },
  { icon: Settings, labelKey: "settings", href: "/settings" },
]

export function Sidebar() {
  const { isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen } = useSidebar()
  const { user } = useAuth()
  const { t } = useLanguage()
  const pathname = usePathname()
  const visibleNavItems = navItems.filter((item) => !item.adminOnly || user?.roles.includes("ADMIN"))

  const sidebarVariants = {
    expanded: { width: 260 },
    collapsed: { width: 80 },
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-6">
        <motion.div
          className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/20 glow-primary"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Sparkles className="w-5 h-5 text-primary" />
        </motion.div>
        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col"
            >
              <span className="font-semibold text-foreground">AI Study Hub</span>
              <span className="text-xs text-muted-foreground">{t("smartLearning")}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {visibleNavItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link key={item.href} href={item.href} onClick={() => setIsMobileOpen(false)}>
              <motion.div
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
                  "hover:bg-secondary/80",
                  isActive && "bg-primary/15 text-primary border border-primary/20"
                )}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
              >
                <item.icon className={cn(
                  "w-5 h-5 flex-shrink-0",
                  isActive ? "text-primary" : "text-muted-foreground"
                )} />
                <AnimatePresence mode="wait">
                  {!isCollapsed && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                      className={cn(
                        "text-sm font-medium",
                        isActive ? "text-primary" : "text-muted-foreground"
                      )}
                    >
                      {t(item.labelKey)}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            </Link>
          )
        })}
      </nav>

      {/* Collapse Button */}
      <div className="hidden md:flex items-center justify-center p-3 border-t border-border/50">
        <motion.button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-secondary transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <motion.div
            animate={{ rotate: isCollapsed ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          </motion.div>
        </motion.button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Menu Button */}
      <motion.button
        onClick={() => setIsMobileOpen(true)}
        className="fixed top-4 left-4 z-50 md:hidden flex items-center justify-center w-10 h-10 rounded-xl glass"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Menu className="w-5 h-5 text-foreground" />
      </motion.button>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
              className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-[260px] glass border-r border-border/50 md:hidden"
            >
              <motion.button
                onClick={() => setIsMobileOpen(false)}
                className="absolute top-4 right-4 flex items-center justify-center w-8 h-8 rounded-lg hover:bg-secondary transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </motion.button>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <motion.aside
        variants={sidebarVariants}
        initial="expanded"
        animate={isCollapsed ? "collapsed" : "expanded"}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="hidden md:flex flex-col h-screen sticky top-0 glass border-r border-border/50"
      >
        <SidebarContent />
      </motion.aside>
    </>
  )
}
