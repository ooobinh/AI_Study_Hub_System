"use client"

import { motion } from "framer-motion"
import { Search, Bell, User, Command } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LanguageSwitcher } from "@/components/layout/language-switcher"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function TopNav() {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="sticky top-0 z-30 flex items-center justify-between gap-4 px-4 md:px-6 py-3 glass border-b border-border/50"
    >
      {/* Search Bar */}
      <div className="flex-1 max-w-xl">
        <motion.div
          className="relative group"
          whileHover={{ scale: 1.01 }}
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Search documents, chats..."
            className="w-full pl-10 pr-16 py-2.5 rounded-xl bg-secondary/50 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-muted/50 border border-border/50">
            <Command className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">K</span>
          </div>
        </motion.div>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-2">
        {/* Language Switcher */}
        <LanguageSwitcher position="top" />

        {/* Notifications */}
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button variant="ghost" size="icon" className="relative rounded-xl hover:bg-secondary">
            <Bell className="w-5 h-5 text-muted-foreground" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary animate-pulse" />
          </Button>
        </motion.div>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <motion.button
              className="flex items-center gap-2 p-1.5 pr-3 rounded-xl hover:bg-secondary transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/80 to-accent/80 flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="hidden md:flex flex-col items-start">
                <span className="text-sm font-medium text-foreground">Alex Chen</span>
                <span className="text-xs text-muted-foreground">Student</span>
              </div>
            </motion.button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 glass-card border-border/50">
            <DropdownMenuLabel className="text-foreground">My Account</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border/50" />
            <DropdownMenuItem className="text-muted-foreground hover:text-foreground focus:text-foreground cursor-pointer">
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="text-muted-foreground hover:text-foreground focus:text-foreground cursor-pointer">
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem className="text-muted-foreground hover:text-foreground focus:text-foreground cursor-pointer">
              Billing
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border/50" />
            <DropdownMenuItem className="text-destructive focus:text-destructive cursor-pointer">
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.header>
  )
}
