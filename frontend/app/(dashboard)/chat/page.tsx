"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useState, useRef, useEffect, useMemo } from "react"
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
import { useAuth } from "@/components/providers/auth-provider"
import { useLanguage } from "@/components/providers/language-provider"
import { getApiUrl, getNetworkErrorMessage } from "@/lib/api"

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

interface ChatMessageDto {
  id: number
  sessionId: number
  sender: "USER" | "AI"
  messageText: string
  createdAt: string
}

interface ChatSessionDto {
  id: number
  documentId?: number | null
  sessionTitle: string
  lastMessage?: string | null
  updatedAt: string
}

interface DocumentOption {
  id: number
  title: string
  originalFileName: string
}

export default function ChatPage() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const initialMessages = useMemo<Message[]>(() => [
    {
      id: "1",
      role: "assistant",
      content: t("aiIntro"),
      timestamp: new Date()
    }
  ], [t])
  const suggestedPrompts = [
    { icon: Brain, text: t("promptSummarize"), color: "text-primary" },
    { icon: Lightbulb, text: t("promptFlashcards"), color: "text-accent" },
    { icon: BookOpen, text: t("promptQuiz"), color: "text-chart-3" },
    { icon: FileText, text: t("promptConcepts"), color: "text-chart-4" },
  ]
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [selectedChat, setSelectedChat] = useState<string | null>(null)
  const [selectedDocumentId, setSelectedDocumentId] = useState("")
  const [chatHistory, setChatHistory] = useState<Chat[]>([])
  const [documents, setDocuments] = useState<DocumentOption[]>([])
  const [error, setError] = useState("")
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (!selectedChat && messages.length === 1 && messages[0]?.id === "1") {
      setMessages(initialMessages)
    }
  }, [initialMessages, messages, selectedChat])

  useEffect(() => {
    if (!user) return

    fetch(`${getApiUrl()}/api/chat/sessions?userId=${user.id}`)
      .then((response) => response.ok ? response.json() : [])
      .then((sessions: ChatSessionDto[]) => {
        setChatHistory(sessions.map((session) => ({
          id: String(session.id),
          title: session.sessionTitle,
          lastMessage: session.lastMessage || t("noMessagesYet"),
          date: t("recent"),
        })))
      })
      .catch(() => setChatHistory([]))

    fetch(`${getApiUrl()}/api/documents?userId=${user.id}`)
      .then((response) => response.ok ? response.json() : [])
      .then((data: DocumentOption[]) => setDocuments(data))
      .catch(() => setDocuments([]))
  }, [user])

  const loadMessages = async (sessionId: string) => {
    const response = await fetch(`${getApiUrl()}/api/chat/sessions/${sessionId}/messages`)
    if (!response.ok) return
    const data = await response.json() as ChatMessageDto[]
    setMessages([
      ...initialMessages,
      ...data.map((message) => ({
        id: String(message.id),
        role: message.sender === "AI" ? "assistant" as const : "user" as const,
        content: message.messageText,
        timestamp: new Date(message.createdAt),
      }))
    ])
  }

  const ensureSession = async (firstMessage: string) => {
    if (selectedChat) return selectedChat
    if (!user) throw new Error(t("loginFirst"))

    const response = await fetch(`${getApiUrl()}/api/chat/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.id,
        documentId: selectedDocumentId ? Number(selectedDocumentId) : null,
        sessionTitle: firstMessage.slice(0, 60) || t("newStudyChat"),
      }),
    })
    if (!response.ok) {
      const body = await response.json().catch(() => null)
      throw new Error(body?.message || t("createChatFailed"))
    }
    const session = await response.json() as ChatSessionDto
    setSelectedChat(String(session.id))
    setChatHistory(prev => [{
      id: String(session.id),
      title: session.sessionTitle,
      lastMessage: firstMessage,
      date: t("recent"),
    }, ...prev])
    return String(session.id)
  }

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    const question = input
    setInput("")
    setError("")
    setIsTyping(true)

    try {
      const sessionId = await ensureSession(question)
      const response = await fetch(`${getApiUrl()}/api/chat/sessions/${sessionId}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageText: question }),
      })
      if (!response.ok) {
        const body = await response.json().catch(() => null)
        throw new Error(body?.message || t("aiRequestFailed"))
      }
      const data = await response.json() as ChatMessageDto
      const aiMessage: Message = {
        id: String(data.id),
        role: "assistant",
        content: data.messageText,
        timestamp: new Date(data.createdAt)
      }
      setMessages(prev => [...prev, aiMessage])
      setChatHistory(prev => prev.map(chat => chat.id === sessionId ? { ...chat, lastMessage: data.messageText } : chat))
    } catch (err) {
      setError(getNetworkErrorMessage(err))
    } finally {
      setIsTyping(false)
    }
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
            onClick={() => { setSelectedChat(null); setMessages(initialMessages); setError("") }}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/50 hover:bg-primary/5 transition-all"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">{t("newChat")}</span>
          </motion.button>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {chatHistory.map((chat) => (
            <motion.button
              key={chat.id}
              onClick={() => { setSelectedChat(chat.id); loadMessages(chat.id) }}
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
            <p className="text-sm text-muted-foreground mb-3">{t("suggestedPrompts")}</p>
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
          {error && (
            <div className="mb-3 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              {t("documentContext")}
            </div>
            <select
              value={selectedDocumentId}
              onChange={(event) => setSelectedDocumentId(event.target.value)}
              disabled={!!selectedChat}
              className="min-w-0 flex-1 rounded-xl border border-border/50 bg-secondary/50 px-3 py-2 text-sm text-foreground disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="">{t("generalAiChat")}</option>
              {documents.map((document) => (
                <option key={document.id} value={document.id}>
                  {document.title || document.originalFileName}
                </option>
              ))}
            </select>
          </div>
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
                placeholder={t("chatPlaceholder")}
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
            {t("aiDisclaimer")}
          </p>
        </div>
      </div>
    </div>
  )
}
