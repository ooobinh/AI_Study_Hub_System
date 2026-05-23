"use client"

import { AnimatePresence, motion } from "framer-motion"
import { type FormEvent, type ReactNode, useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useDropzone } from "react-dropzone"
import {
  ArrowRight,
  Check,
  Download,
  FileText,
  HelpCircle,
  Loader2,
  MessageCircle,
  MessagesSquare,
  Plus,
  Search,
  Send,
  Share2,
  Trophy,
  Upload,
  UsersRound,
  X,
} from "lucide-react"
import { useAuth } from "@/components/providers/auth-provider"
import { useLanguage } from "@/components/providers/language-provider"
import { getApiUrl, getNetworkErrorMessage } from "@/lib/api"

interface ForumPostDto {
  id: number
  authorId: number
  authorName: string
  authorAvatarUrl?: string | null
  documentId?: number | null
  documentTitle?: string | null
  originalFileName?: string | null
  fileType?: string | null
  fileSize?: number | null
  title: string
  content?: string | null
  type: "QUESTION" | "DISCUSSION" | "DOCUMENT"
  answerCount: number
  createdAt: string
  updatedAt: string
}

interface ForumAnswerDto {
  id: number
  postId: number
  userId: number
  userName: string
  userAvatarUrl?: string | null
  content: string
  createdAt: string
  updatedAt: string
}

interface ForumDetailDto {
  post: ForumPostDto
  answers: ForumAnswerDto[]
}

interface ForumRankingDto {
  userId: number
  fullName: string
  avatarUrl?: string | null
  answerCount: number
  period: string
}

interface ActiveUserDto {
  userId: number
  fullName: string
  email: string
  avatarUrl?: string | null
  lastSeenAt: string
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

const typeTabs = [
  { value: "ALL", label: "All" },
  { value: "QUESTION", label: "Questions" },
  { value: "DISCUSSION", label: "Discussions" },
  { value: "DOCUMENT", label: "Documents" },
]

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "U"
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return "Unknown"
  }
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

function formatFileSize(bytes?: number | null) {
  if (!bytes) {
    return "Unknown size"
  }

  const units = ["B", "KB", "MB", "GB"]
  let size = bytes
  let unit = 0
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024
    unit += 1
  }
  return `${size.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`
}

function typeMeta(type: ForumPostDto["type"]) {
  if (type === "QUESTION") {
    return { label: "Question", icon: HelpCircle, className: "bg-primary/15 text-primary" }
  }
  if (type === "DOCUMENT") {
    return { label: "Document", icon: FileText, className: "bg-accent/15 text-accent" }
  }
  return { label: "Discussion", icon: MessagesSquare, className: "bg-secondary text-muted-foreground" }
}

export default function ForumPage() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const router = useRouter()
  const [posts, setPosts] = useState<ForumPostDto[]>([])
  const [detail, setDetail] = useState<ForumDetailDto | null>(null)
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState("ALL")
  const [rankPeriod, setRankPeriod] = useState<"week" | "month">("week")
  const [rankings, setRankings] = useState<ForumRankingDto[]>([])
  const [activeUsers, setActiveUsers] = useState<ActiveUserDto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [newContent, setNewContent] = useState("")
  const [newType, setNewType] = useState<"QUESTION" | "DISCUSSION">("QUESTION")
  const [answerText, setAnswerText] = useState("")
  const [isSavingPost, setIsSavingPost] = useState(false)
  const [isSavingAnswer, setIsSavingAnswer] = useState(false)
  const [uploadTitle, setUploadTitle] = useState("")
  const [uploadContent, setUploadContent] = useState("")
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [uploadLabel, setUploadLabel] = useState("")

  const loadPosts = useCallback(async () => {
    setIsLoading(true)
    setError("")
    try {
      const params = new URLSearchParams()
      if (searchQuery.trim()) {
        params.set("search", searchQuery.trim())
      }
      if (typeFilter !== "ALL") {
        params.set("type", typeFilter)
      }
      const query = params.toString()
      const response = await fetch(`${getApiUrl()}/api/forum/posts${query ? `?${query}` : ""}`)
      const body = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(body?.message || "Could not load forum")
      }

      const data = body as ForumPostDto[]
      setPosts(data)
      setSelectedPostId((current) => {
        if (current && data.some((post) => post.id === current)) {
          return current
        }
        return data[0]?.id ?? null
      })
      if (data.length === 0) {
        setDetail(null)
      }
    } catch (err) {
      setError(getNetworkErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }, [searchQuery, typeFilter])

  const loadDetail = useCallback(async (postId: number) => {
    setIsDetailLoading(true)
    setError("")
    try {
      const response = await fetch(`${getApiUrl()}/api/forum/posts/${postId}`)
      const body = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(body?.message || "Could not load post")
      }
      setDetail(body as ForumDetailDto)
    } catch (err) {
      setError(getNetworkErrorMessage(err))
    } finally {
      setIsDetailLoading(false)
    }
  }, [])

  const loadSidebarData = useCallback(async () => {
    try {
      const [rankingResponse, activeResponse] = await Promise.all([
        fetch(`${getApiUrl()}/api/forum/rankings?period=${rankPeriod}`),
        fetch(`${getApiUrl()}/api/forum/presence/active`),
      ])

      if (rankingResponse.ok) {
        setRankings(await rankingResponse.json() as ForumRankingDto[])
      }
      if (activeResponse.ok) {
        setActiveUsers(await activeResponse.json() as ActiveUserDto[])
      }
    } catch {
      return
    }
  }, [rankPeriod])

  useEffect(() => {
    loadPosts()
  }, [loadPosts])

  useEffect(() => {
    if (selectedPostId) {
      loadDetail(selectedPostId)
    }
  }, [loadDetail, selectedPostId])

  useEffect(() => {
    loadSidebarData()
    const interval = window.setInterval(loadSidebarData, 30000)
    return () => window.clearInterval(interval)
  }, [loadSidebarData])

  const selectedPost = detail?.post || posts.find((post) => post.id === selectedPostId) || null

  const stats = useMemo(() => {
    const questions = posts.filter((post) => post.type === "QUESTION").length
    const documents = posts.filter((post) => post.type === "DOCUMENT").length
    const answers = posts.reduce((total, post) => total + post.answerCount, 0)
    return { questions, documents, answers }
  }, [posts])

  const createPost = async () => {
    if (!user || !newTitle.trim()) {
      setError("Title is required")
      return
    }

    setIsSavingPost(true)
    setError("")
    setMessage("")
    try {
      const response = await fetch(`${getApiUrl()}/api/forum/posts?authorId=${user.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          content: newContent.trim() || null,
          type: newType,
        }),
      })
      const body = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(body?.message || "Could not create post")
      }

      const created = body as ForumPostDto
      setPosts((current) => [created, ...current.filter((post) => post.id !== created.id)])
      setSelectedPostId(created.id)
      setNewTitle("")
      setNewContent("")
      setNewType("QUESTION")
      setIsCreateOpen(false)
      setMessage("Post created")
      setTimeout(() => setMessage(""), 1400)
      loadSidebarData()
    } catch (err) {
      setError(getNetworkErrorMessage(err))
    } finally {
      setIsSavingPost(false)
    }
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!user || acceptedFiles.length === 0) {
      return
    }

    setError("")
    setMessage("")
    const file = acceptedFiles[0]
    const formData = new FormData()
    formData.append("authorId", user.id)
    formData.append("file", file)
    if (uploadTitle.trim()) {
      formData.append("title", uploadTitle.trim())
    }
    if (uploadContent.trim()) {
      formData.append("content", uploadContent.trim())
    }

    try {
      setUploadProgress(20)
      setUploadLabel(`Uploading ${file.name}`)
      const response = await fetch(`${getApiUrl()}/api/forum/posts/upload`, {
        method: "POST",
        body: formData,
      })
      const body = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(body?.message || "Could not upload document")
      }

      const created = body as ForumPostDto
      setUploadProgress(100)
      setUploadLabel("Upload complete")
      setPosts((current) => [created, ...current.filter((post) => post.id !== created.id)])
      setSelectedPostId(created.id)
      setUploadTitle("")
      setUploadContent("")
      setTimeout(() => {
        setUploadProgress(null)
        setUploadLabel("")
        setIsUploadOpen(false)
      }, 1000)
      loadSidebarData()
    } catch (err) {
      setError(getNetworkErrorMessage(err))
      setUploadProgress(null)
      setUploadLabel("")
    }
  }, [loadSidebarData, uploadContent, uploadTitle, user])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    accept: {
      "application/pdf": [".pdf"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "application/vnd.ms-powerpoint": [".ppt"],
      "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
    },
  })

  const sendAnswer = async (event: FormEvent) => {
    event.preventDefault()
    if (!user || !selectedPostId || !answerText.trim()) {
      return
    }

    setIsSavingAnswer(true)
    setError("")
    try {
      const response = await fetch(`${getApiUrl()}/api/forum/posts/${selectedPostId}/answers?userId=${user.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: answerText.trim() }),
      })
      const body = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(body?.message || "Could not send answer")
      }

      const created = body as ForumAnswerDto
      setDetail((current) => current ? { ...current, answers: [...current.answers, created] } : current)
      setPosts((current) => current.map((post) => post.id === selectedPostId ? { ...post, answerCount: post.answerCount + 1 } : post))
      setAnswerText("")
      loadSidebarData()
    } catch (err) {
      setError(getNetworkErrorMessage(err))
    } finally {
      setIsSavingAnswer(false)
    }
  }

  const viewDocument = (post: ForumPostDto) => {
    if (post.documentId) {
      router.push(`/documents/${post.documentId}/view`)
    }
  }

  const downloadDocument = (post: ForumPostDto) => {
    if (!post.documentId) {
      return
    }
    const userParam = user ? `userId=${user.id}&` : ""
    window.open(`${getApiUrl()}/api/documents/${post.documentId}/file?${userParam}download=true`, "_blank")
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">{t("forum")}</h1>
          <p className="mt-1 text-muted-foreground">Public questions, shared documents, and answers from every learner.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <motion.button
            onClick={() => setIsUploadOpen(true)}
            className="flex items-center gap-2 rounded-xl border border-border/50 bg-secondary/50 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-secondary"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Upload className="h-4 w-4 text-primary" />
            Share Document
          </motion.button>
          <motion.button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus className="h-4 w-4" />
            New Post
          </motion.button>
        </div>
      </motion.div>

      {(error || message) && (
        <motion.div
          variants={item}
          className={`rounded-xl border px-4 py-3 text-sm ${
            error
              ? "border-destructive/30 bg-destructive/10 text-destructive"
              : "border-accent/30 bg-accent/10 text-accent"
          }`}
        >
          {error || message}
        </motion.div>
      )}

      <motion.div variants={item} className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border/50 bg-secondary/25 p-4">
          <p className="text-xs text-muted-foreground">Questions</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{stats.questions}</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-secondary/25 p-4">
          <p className="text-xs text-muted-foreground">Shared Documents</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{stats.documents}</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-secondary/25 p-4">
          <p className="text-xs text-muted-foreground">Answers</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{stats.answers}</p>
        </div>
      </motion.div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,360px)_minmax(0,1fr)_320px]">
        <motion.div variants={item} className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search forum..."
              className="w-full rounded-xl border border-border/50 bg-secondary/50 py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {typeTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setTypeFilter(tab.value)}
                className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                  typeFilter === tab.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary/50 text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center gap-2 rounded-xl border border-border/50 bg-secondary/20 py-14 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading forum...
            </div>
          ) : posts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/60 bg-secondary/20 p-8 text-center">
              <MessagesSquare className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
              <p className="font-medium text-foreground">No posts yet</p>
              <p className="mt-1 text-sm text-muted-foreground">Ask a question or share a document.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {posts.map((post) => {
                const meta = typeMeta(post.type)
                const TypeIcon = meta.icon
                return (
                  <motion.button
                    key={post.id}
                    onClick={() => setSelectedPostId(post.id)}
                    className={`glass-card w-full rounded-xl p-4 text-left transition-all ${
                      selectedPost?.id === post.id ? "border-primary/40 bg-primary/10" : "hover:border-primary/30"
                    }`}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${meta.className}`}>
                        <TypeIcon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-sm font-semibold text-foreground">{post.title}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span>{meta.label}</span>
                          <span>{post.answerCount} answers</span>
                          <span>{formatDate(post.createdAt)}</span>
                        </div>
                        <p className="mt-2 truncate text-xs text-muted-foreground">by {post.authorName}</p>
                      </div>
                    </div>
                  </motion.button>
                )
              })}
            </div>
          )}
        </motion.div>

        <motion.div variants={item} className="min-w-0">
          {!selectedPost ? (
            <div className="glass-card rounded-xl px-6 py-20 text-center">
              <MessagesSquare className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-lg font-semibold text-foreground">Choose a post</p>
              <p className="mt-1 text-sm text-muted-foreground">Questions, answers, and shared files will appear here.</p>
            </div>
          ) : (
            <div className="glass-card rounded-xl p-5">
              {isDetailLoading && !detail ? (
                <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading post...
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary/15 text-xs font-semibold text-primary">
                      {selectedPost.authorAvatarUrl ? (
                        <img src={selectedPost.authorAvatarUrl} alt={selectedPost.authorName} className="h-full w-full object-cover" />
                      ) : (
                        initials(selectedPost.authorName)
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span>{selectedPost.authorName}</span>
                        <span>{formatDate(selectedPost.createdAt)}</span>
                      </div>
                      <h2 className="mt-2 text-xl font-semibold text-foreground">{selectedPost.title}</h2>
                      {selectedPost.content && (
                        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{selectedPost.content}</p>
                      )}
                    </div>
                  </div>

                  {selectedPost.documentId && (
                    <div className="rounded-xl border border-border/50 bg-secondary/25 p-4">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
                          <FileText className="h-6 w-6" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {selectedPost.documentTitle || selectedPost.originalFileName}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {selectedPost.originalFileName} - {formatFileSize(selectedPost.fileSize)}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => viewDocument(selectedPost)}
                            className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
                          >
                            <ArrowRight className="h-4 w-4" />
                            View
                          </button>
                          <button
                            onClick={() => downloadDocument(selectedPost)}
                            className="rounded-lg border border-border/50 bg-secondary/50 p-2 text-muted-foreground hover:text-foreground"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="border-t border-border/50 pt-5">
                    <div className="mb-4 flex items-center gap-2">
                      <MessageCircle className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold text-foreground">{detail?.answers.length || 0} answers</h3>
                    </div>

                    <div className="space-y-3">
                      {detail?.answers.map((answer) => (
                        <div key={answer.id} className="rounded-xl border border-border/50 bg-secondary/25 p-4">
                          <div className="mb-2 flex items-center gap-3">
                            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary/15 text-xs font-semibold text-primary">
                              {answer.userAvatarUrl ? (
                                <img src={answer.userAvatarUrl} alt={answer.userName} className="h-full w-full object-cover" />
                              ) : (
                                initials(answer.userName)
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-foreground">{answer.userName}</p>
                              <p className="text-xs text-muted-foreground">{formatDate(answer.createdAt)}</p>
                            </div>
                          </div>
                          <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{answer.content}</p>
                        </div>
                      ))}

                      {detail?.answers.length === 0 && (
                        <div className="rounded-xl border border-dashed border-border/60 bg-secondary/20 px-6 py-10 text-center text-sm text-muted-foreground">
                          No answers yet.
                        </div>
                      )}
                    </div>

                    <form onSubmit={sendAnswer} className="mt-4 flex gap-2">
                      <input
                        value={answerText}
                        onChange={(event) => setAnswerText(event.target.value)}
                        placeholder="Write an answer..."
                        className="min-w-0 flex-1 rounded-xl border border-border/50 bg-secondary/50 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/30"
                      />
                      <button
                        type="submit"
                        disabled={isSavingAnswer || !answerText.trim()}
                        className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isSavingAnswer ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        Reply
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>

        <motion.div variants={item} className="space-y-6">
          <div className="glass-card rounded-xl p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-foreground">Answer Ranking</h3>
              </div>
              <div className="flex rounded-lg bg-secondary/50 p-1">
                {(["week", "month"] as const).map((period) => (
                  <button
                    key={period}
                    onClick={() => setRankPeriod(period)}
                    className={`rounded-md px-2 py-1 text-xs font-medium ${
                      rankPeriod === period ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {period === "week" ? "Week" : "Month"}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              {rankings.map((ranking, index) => (
                <div key={ranking.userId} className="flex items-center gap-3 rounded-xl border border-border/50 bg-secondary/25 p-3">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary/15 text-xs font-semibold text-primary">
                    {ranking.avatarUrl ? (
                      <img src={ranking.avatarUrl} alt={ranking.fullName} className="h-full w-full object-cover" />
                    ) : (
                      initials(ranking.fullName)
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium text-foreground">{ranking.fullName}</p>
                      {index === 0 && <span className="rounded-md bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">Top</span>}
                    </div>
                    <p className="text-xs text-muted-foreground">{ranking.answerCount} answers</p>
                  </div>
                  <span className="text-sm font-semibold text-foreground">#{index + 1}</span>
                </div>
              ))}

              {rankings.length === 0 && (
                <div className="rounded-xl border border-dashed border-border/60 px-4 py-8 text-center text-sm text-muted-foreground">
                  No ranking yet.
                </div>
              )}
            </div>
          </div>

          <div className="glass-card rounded-xl p-5">
            <div className="mb-4 flex items-center gap-2">
              <UsersRound className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">Active Users</h3>
            </div>
            <div className="space-y-2">
              {activeUsers.map((activeUser) => (
                <div key={activeUser.userId} className="flex items-center gap-3 rounded-xl px-2 py-2">
                  <div className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-secondary text-xs font-semibold text-muted-foreground">
                    {activeUser.avatarUrl ? (
                      <img src={activeUser.avatarUrl} alt={activeUser.fullName} className="h-full w-full object-cover" />
                    ) : (
                      initials(activeUser.fullName)
                    )}
                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border border-background bg-accent" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{activeUser.fullName}</p>
                    <p className="truncate text-xs text-muted-foreground">{activeUser.email}</p>
                  </div>
                </div>
              ))}

              {activeUsers.length === 0 && (
                <div className="rounded-xl border border-dashed border-border/60 px-4 py-8 text-center text-sm text-muted-foreground">
                  No active users.
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {isCreateOpen && (
          <ForumModal
            title="New Forum Post"
            icon={<Share2 className="h-5 w-5" />}
            onClose={() => setIsCreateOpen(false)}
            footer={
              <>
                <button
                  onClick={() => setIsCreateOpen(false)}
                  className="rounded-xl border border-border/50 px-4 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  {t("cancel")}
                </button>
                <button
                  onClick={createPost}
                  disabled={isSavingPost}
                  className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSavingPost ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  Post
                </button>
              </>
            }
          >
            <div className="space-y-4">
              <div className="flex rounded-xl bg-secondary/50 p-1">
                {(["QUESTION", "DISCUSSION"] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setNewType(type)}
                    className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ${
                      newType === type ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {type === "QUESTION" ? "Question" : "Discussion"}
                  </button>
                ))}
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Title</label>
                <input
                  value={newTitle}
                  onChange={(event) => setNewTitle(event.target.value)}
                  placeholder="What do you want to ask?"
                  className="w-full rounded-xl border border-border/50 bg-secondary/50 px-4 py-2.5 text-foreground placeholder:text-muted-foreground outline-none transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Content</label>
                <textarea
                  value={newContent}
                  onChange={(event) => setNewContent(event.target.value)}
                  rows={4}
                  placeholder="Add context so others can answer well."
                  className="w-full resize-none rounded-xl border border-border/50 bg-secondary/50 px-4 py-2.5 text-foreground placeholder:text-muted-foreground outline-none transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
          </ForumModal>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isUploadOpen && (
          <ForumModal
            title="Share Document"
            icon={<Upload className="h-5 w-5" />}
            onClose={() => setIsUploadOpen(false)}
            footer={
              <button
                onClick={() => setIsUploadOpen(false)}
                className="rounded-xl border border-border/50 px-4 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                {t("cancel")}
              </button>
            }
          >
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Title</label>
                <input
                  value={uploadTitle}
                  onChange={(event) => setUploadTitle(event.target.value)}
                  placeholder="Lecture notes, lab guide, exam review..."
                  className="w-full rounded-xl border border-border/50 bg-secondary/50 px-4 py-2.5 text-foreground placeholder:text-muted-foreground outline-none transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Description</label>
                <textarea
                  value={uploadContent}
                  onChange={(event) => setUploadContent(event.target.value)}
                  rows={3}
                  placeholder="Tell everyone what this file is useful for."
                  className="w-full resize-none rounded-xl border border-border/50 bg-secondary/50 px-4 py-2.5 text-foreground placeholder:text-muted-foreground outline-none transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div
                {...getRootProps()}
                className={`relative cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all ${
                  isDragActive
                    ? "border-primary bg-primary/10"
                    : "border-border/60 bg-secondary/20 hover:border-primary/50 hover:bg-secondary/30"
                }`}
              >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center gap-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
                    <Upload className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    {isDragActive ? "Drop the file here" : "Drop a file or click to upload"}
                  </p>
                  <p className="text-xs text-muted-foreground">PDF, Word, and PowerPoint</p>
                </div>
                <AnimatePresence>
                  {uploadProgress !== null && (
                    <motion.div
                      className="absolute inset-0 flex items-center justify-center rounded-xl bg-background/80 backdrop-blur-sm"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <div className="flex flex-col items-center gap-3">
                        {uploadProgress < 100 ? (
                          <>
                            <div className="h-2 w-48 overflow-hidden rounded-full bg-secondary">
                              <motion.div className="h-full bg-primary" animate={{ width: `${uploadProgress}%` }} />
                            </div>
                            <p className="text-sm text-foreground">{uploadLabel}</p>
                          </>
                        ) : (
                          <div className="flex items-center gap-2 text-accent">
                            <Check className="h-4 w-4" />
                            <span className="text-sm font-medium">{uploadLabel}</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </ForumModal>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function ForumModal({
  title,
  icon,
  children,
  footer,
  onClose,
}: {
  title: string
  icon: ReactNode
  children: ReactNode
  footer: ReactNode
  onClose: () => void
}) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="glass-card w-full max-w-lg rounded-xl p-6"
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
              {icon}
            </div>
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
        <div className="mt-6 flex justify-end gap-3">
          {footer}
        </div>
      </motion.div>
    </motion.div>
  )
}
