"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useState } from "react"
import { MessageSquare, X, Send, Sparkles } from "lucide-react"

export function FloatingAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState("")

  return (
    <>
      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-24 right-6 w-80 sm:w-96 h-[480px] glass-card rounded-2xl overflow-hidden z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-secondary/30">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-foreground">AI Assistant</h3>
                  <p className="text-xs text-muted-foreground">Always here to help</p>
                </div>
              </div>
              <motion.button
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-lg hover:bg-secondary flex items-center justify-center"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </motion.button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-2"
              >
                <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                </div>
                <div className="bg-secondary/50 rounded-xl rounded-tl-sm px-3 py-2 max-w-[85%]">
                  <p className="text-sm text-foreground">
                    Hello! I&apos;m your AI study assistant. How can I help you today?
                  </p>
                </div>
              </motion.div>

              <div className="flex flex-wrap gap-2">
                {["Summarize my notes", "Create flashcards", "Quiz me"].map((suggestion, i) => (
                  <motion.button
                    key={suggestion}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * (i + 1) }}
                    className="px-3 py-1.5 text-xs rounded-full border border-primary/30 text-primary hover:bg-primary/10 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {suggestion}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border/50">
              <div className="flex items-center gap-2 bg-secondary/50 rounded-xl px-3 py-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ask anything..."
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
                <motion.button
                  className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Send className="w-4 h-4 text-primary-foreground" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-2xl bg-primary glow-primary flex items-center justify-center z-50"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        animate={{
          boxShadow: isOpen 
            ? "0 0 0 0 rgba(59, 130, 246, 0)"
            : ["0 0 0 0 rgba(59, 130, 246, 0.3)", "0 0 0 20px rgba(59, 130, 246, 0)", "0 0 0 0 rgba(59, 130, 246, 0)"]
        }}
        transition={{
          boxShadow: { duration: 2, repeat: Infinity }
        }}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
            >
              <X className="w-6 h-6 text-primary-foreground" />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
            >
              <MessageSquare className="w-6 h-6 text-primary-foreground" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </>
  )
}
