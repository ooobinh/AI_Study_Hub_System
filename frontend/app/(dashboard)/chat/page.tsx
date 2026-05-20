"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useState, useRef, useEffect } from "react"
import {
  Send,
  Sparkles,
  User,
  Plus,
  MessageSquare,
  FileText,
  Brain,
  Lightbulb,
  BookOpen,
  Clock,
  Trash2,
  MoreVertical,
  Paperclip,
  Copy,
  Check
} from "lucide-react"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

interface Chat {
  id: string
  title: string
  lastMessage: string
  date: string
}

const chatHistory: Chat[] = [
  { id: "1", title: "Machine Learning Basics", lastMessage: "Can you explain gradient descent?", date: "Today" },
  { id: "2", title: "Chemistry Questions", lastMessage: "What is covalent bonding?", date: "Today" },
  { id: "3", title: "Math Homework Help", lastMessage: "How do I solve integrals?", date: "Yesterday" },
  { id: "4", title: "Physics Concepts", lastMessage: "Explain Newton's laws", date: "Yesterday" },
  { id: "5", title: "Essay Writing", lastMessage: "Help me structure my essay", date: "2 days ago" },
]

const suggestedPrompts = [
  { icon: Brain, text: "Summarize my Machine Learning notes", color: "text-primary" },
  { icon: Lightbulb, text: "Create flashcards for Chemistry Ch.5", color: "text-accent" },
  { icon: BookOpen, text: "Generate a quiz on Linear Algebra", color: "text-chart-3" },
  { icon: FileText, text: "Explain key concepts from my notes", color: "text-chart-4" },
]

const initialMessages: Message[] = [
  {
    id: "1",
    role: "assistant",
    content: "Hello! I'm your AI study assistant. I can help you understand your documents, create flashcards, generate quizzes, and answer questions about your study materials. What would you like to learn today?",
    timestamp: new Date()
  }
]

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [selectedChat, setSelectedChat] = useState("1")
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput("")
    setIsTyping(true)

    // Simulate AI response
    setTimeout(() => {
      const aiResponses: Record<string, string> = {
        "summarize": "Based on your Machine Learning notes, here are the key concepts:\n\n**1. Supervised Learning**\nLearning from labeled data to make predictions.\n\n**2. Unsupervised Learning**\nFinding patterns in unlabeled data.\n\n**3. Gradient Descent**\nAn optimization algorithm used to minimize the cost function.\n\n**4. Neural Networks**\nComputing systems inspired by biological neural networks.\n\nWould you like me to explain any of these in more detail?",
        "flashcard": "I've created 10 flashcards from your Chemistry Ch.5 notes:\n\n**Card 1:**\nQ: What is a covalent bond?\nA: A chemical bond where electrons are shared between atoms.\n\n**Card 2:**\nQ: What is electronegativity?\nA: The tendency of an atom to attract electrons.\n\n**Card 3:**\nQ: Define polar molecules.\nA: Molecules with unequal electron distribution.\n\nWould you like me to create more flashcards or start a study session?",
        "quiz": "Here's a quick quiz on Linear Algebra:\n\n**Question 1:**\nWhat is the determinant of a 2x2 identity matrix?\na) 0  b) 1  c) 2  d) -1\n\n**Question 2:**\nWhat does it mean if two vectors are orthogonal?\na) They are parallel  b) They are perpendicular  c) They have the same magnitude  d) They are collinear\n\n**Question 3:**\nWhat is the rank of a matrix?\n\nReply with your answers and I'll check them!",
        "default": "That's a great question! Let me help you understand this concept.\n\nBased on your uploaded documents, I can see this topic is covered in your notes. The key points to understand are:\n\n1. **Foundation**: Start with the basic principles\n2. **Application**: See how it applies in real scenarios\n3. **Practice**: Work through examples to solidify understanding\n\nWould you like me to go deeper into any specific aspect, or shall I create some practice questions for you?"
      }

      let response = aiResponses.default
      const lowerInput = input.toLowerCase()
      
      if (lowerInput.includes("summarize")) response = aiResponses.summarize
      else if (lowerInput.includes("flashcard")) response = aiResponses.flashcard
      else if (lowerInput.includes("quiz")) response = aiResponses.quiz

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, aiMessage])
      setIsTyping(false)
    }, 1500)
  }

  const copyMessage = (id: string, content: string) => {
    navigator.clipboard.writeText(content)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* Chat History Sidebar */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="hidden lg:flex flex-col w-72 glass-card rounded-xl overflow-hidden"
      >
        {/* New Chat Button */}
        <div className="p-3 border-b border-border/50">
          <motion.button
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/50 hover:bg-primary/5 transition-all"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">New Chat</span>
          </motion.button>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {chatHistory.map((chat) => (
            <motion.button
              key={chat.id}
              onClick={() => setSelectedChat(chat.id)}
              className={`w-full text-left p-3 rounded-xl transition-all ${
                selectedChat === chat.id
                  ? "bg-primary/15 border border-primary/20"
                  : "hover:bg-secondary/50"
              }`}
              whileHover={{ x: 4 }}
            >
              <div className="flex items-start gap-2">
                <MessageSquare className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                  selectedChat === chat.id ? "text-primary" : "text-muted-foreground"
                }`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${
                    selectedChat === chat.id ? "text-primary" : "text-foreground"
                  }`}>
                    {chat.title}
                  </p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {chat.lastMessage}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {chat.date}
                </span>
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col glass-card rounded-xl overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
            >
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                message.role === "assistant"
                  ? "bg-primary/20"
                  : "bg-gradient-to-br from-chart-3 to-chart-4"
              }`}>
                {message.role === "assistant" ? (
                  <Sparkles className="w-4 h-4 text-primary" />
                ) : (
                  <User className="w-4 h-4 text-white" />
                )}
              </div>

              {/* Message Content */}
              <div className={`flex-1 max-w-[80%] ${message.role === "user" ? "text-right" : ""}`}>
                <div className={`inline-block px-4 py-3 rounded-2xl ${
                  message.role === "assistant"
                    ? "bg-secondary/50 rounded-tl-sm text-left"
                    : "bg-primary text-primary-foreground rounded-tr-sm"
                }`}>
                  <div className={`text-sm whitespace-pre-wrap ${
                    message.role === "assistant" ? "text-foreground" : "text-primary-foreground"
                  }`}>
                    {message.content}
                  </div>
                </div>
                
                {/* Message Actions */}
                {message.role === "assistant" && (
                  <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <motion.button
                      onClick={() => copyMessage(message.id, message.content)}
                      className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      {copiedId === message.id ? (
                        <Check className="w-3.5 h-3.5 text-accent" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </motion.button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}

          {/* Typing Indicator */}
          <AnimatePresence>
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <div className="bg-secondary/50 rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex items-center gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-2 h-2 rounded-full bg-muted-foreground"
                        animate={{ y: [0, -5, 0] }}
                        transition={{
                          duration: 0.6,
                          repeat: Infinity,
                          delay: i * 0.2
                        }}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompts */}
        {messages.length === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-4 pb-4"
          >
            <p className="text-sm text-muted-foreground mb-3">Suggested prompts:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {suggestedPrompts.map((prompt, i) => (
                <motion.button
                  key={prompt.text}
                  onClick={() => setInput(prompt.text)}
                  className="flex items-center gap-3 p-3 rounded-xl border border-border/50 hover:border-primary/30 hover:bg-secondary/30 transition-all text-left"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * i }}
                >
                  <div className={`w-8 h-8 rounded-lg bg-secondary flex items-center justify-center ${prompt.color}`}>
                    <prompt.icon className="w-4 h-4" />
                  </div>
                  <span className="text-sm text-foreground">{prompt.text}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Input Area */}
        <div className="p-4 border-t border-border/50">
          <div className="flex items-end gap-3">
            <motion.button
              className="p-2.5 rounded-xl bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Paperclip className="w-5 h-5" />
            </motion.button>
            <div className="flex-1 relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
                placeholder="Ask anything about your documents..."
                rows={1}
                className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all resize-none"
                style={{ minHeight: "48px", maxHeight: "200px" }}
              />
            </div>
            <motion.button
              onClick={handleSend}
              disabled={!input.trim()}
              className={`p-2.5 rounded-xl transition-all ${
                input.trim()
                  ? "bg-primary text-primary-foreground glow-primary"
                  : "bg-secondary/50 text-muted-foreground"
              }`}
              whileHover={input.trim() ? { scale: 1.1 } : {}}
              whileTap={input.trim() ? { scale: 0.9 } : {}}
            >
              <Send className="w-5 h-5" />
            </motion.button>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-3">
            AI Study Hub can make mistakes. Consider checking important information.
          </p>
        </div>
      </div>
    </div>
  )
}
