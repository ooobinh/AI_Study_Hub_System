"use client"

import { motion } from "framer-motion"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/providers/auth-provider"
import { useLanguage } from "@/components/providers/language-provider"
import { getApiUrl } from "@/lib/api"
import {
  FileText,
  MessageSquare,
  FolderOpen,
  Upload,
  TrendingUp,
  Clock,
  Sparkles,
  ArrowRight,
  BookOpen,
  Brain,
  Zap,
  Star
} from "lucide-react"

interface DocumentDto {
  id: number
  title: string
  originalFileName: string
  subjectName?: string | null
  pageCount?: number | null
  createdAt: string
}

interface SubjectDto {
  id: number
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

export default function DashboardPage() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const router = useRouter()
  const firstName = user?.name?.split(" ")[0] || t("student")
  const [recentDocuments, setRecentDocuments] = useState<DocumentDto[]>([])
  const [documentCount, setDocumentCount] = useState(0)
  const [subjects, setSubjects] = useState<SubjectDto[]>([])

  useEffect(() => {
    if (!user) return

    Promise.all([
      fetch(`${getApiUrl()}/api/documents/mine?userId=${user.id}`).then((response) => response.ok ? response.json() : []),
      fetch(`${getApiUrl()}/api/subjects?userId=${user.id}`).then((response) => response.ok ? response.json() : []),
    ])
      .then(([documentsData, subjectsData]: [DocumentDto[], SubjectDto[]]) => {
        setDocumentCount(documentsData.length)
        setRecentDocuments(documentsData.slice(0, 4))
        setSubjects(subjectsData)
      })
      .catch(() => {
        setDocumentCount(0)
        setRecentDocuments([])
        setSubjects([])
      })
  }, [user])

  const stats = [
    { icon: FileText, label: t("totalDocuments"), value: String(documentCount), change: t("realData"), color: "text-primary", href: "/documents" },
    { icon: MessageSquare, label: t("aiChats"), value: "0", change: t("soon"), color: "text-accent", href: "/chat" },
    { icon: FolderOpen, label: t("subjects"), value: String(subjects.length), change: t("realData"), color: "text-chart-3", href: "/subjects" },
    { icon: Upload, label: t("recentUploads"), value: String(recentDocuments.length), change: t("latest"), color: "text-chart-4", href: "/documents" },
  ]
  const aiRecommendations = [
    { icon: Brain, title: t("reviewFlashcards"), description: t("reviewFlashcardsDesc"), action: t("startReview") },
    { icon: Zap, title: t("quizAvailable"), description: t("quizAvailableDesc"), action: t("takeQuiz") },
    { icon: BookOpen, title: t("studySession"), description: t("studySessionDesc"), action: t("continue") },
  ]

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      <motion.div variants={item} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            {t("welcome")}, <span className="text-primary">{firstName}</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            {t("learningQuestion")}
          </p>
        </div>
        <motion.button
          onClick={() => router.push("/chat")}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium w-fit"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Sparkles className="w-4 h-4" />
          {t("askAi")}
        </motion.button>
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.button
            key={stat.label}
            onClick={() => router.push(stat.href)}
            className="glass-card rounded-xl p-5 text-left hover:border-primary/30 transition-all duration-300"
            whileHover={{ y: -4, scale: 1.02 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * i }}
          >
            <div className="flex items-start justify-between">
              <div className={`w-10 h-10 rounded-xl bg-secondary flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium text-accent flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {stat.change}
              </span>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          </motion.button>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div variants={item} className="lg:col-span-2">
          <div className="glass-card rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">{t("recentDocuments")}</h2>
              <motion.a
                href="/documents"
                className="text-sm text-primary flex items-center gap-1 hover:underline"
                whileHover={{ x: 4 }}
              >
                {t("viewAll")} <ArrowRight className="w-4 h-4" />
              </motion.a>
            </div>
            <div className="space-y-3">
              {recentDocuments.length === 0 && (
                <div className="rounded-xl bg-secondary/30 p-6 text-center text-sm text-muted-foreground">
                  {t("noRecentDocuments")}
                </div>
              )}
              {recentDocuments.map((doc, i) => (
                <motion.div
                  key={doc.id}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-secondary/50 transition-colors cursor-pointer group"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * i }}
                  whileHover={{ x: 4 }}
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                      {doc.title || doc.originalFileName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {doc.subjectName || t("uncategorized")} {doc.pageCount ? `- ${doc.pageCount} ${t("pages")}` : ""}
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(doc.createdAt).toLocaleDateString()}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div variants={item}>
          <div className="glass-card rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">{t("aiRecommendations")}</h2>
            </div>
            <div className="space-y-3">
              {aiRecommendations.map((rec, i) => (
                <motion.div
                  key={rec.title}
                  className="p-3 rounded-xl bg-secondary/30 border border-border/50 hover:border-primary/30 transition-all cursor-pointer"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * i }}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
                      <rec.icon className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{rec.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{rec.description}</p>
                      <button className="text-xs text-primary font-medium mt-2 hover:underline">
                        {rec.action}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div variants={item} className="lg:col-span-1">
          <div className="glass-card rounded-xl p-5">
            <h2 className="text-lg font-semibold text-foreground mb-4">{t("quickActions")}</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Upload, label: t("upload"), color: "bg-primary/15 text-primary", href: "/documents" },
                { icon: MessageSquare, label: t("chat"), color: "bg-accent/15 text-accent", href: "/chat" },
                { icon: Brain, label: t("flashcards"), color: "bg-chart-3/15 text-chart-3", href: "/chat" },
                { icon: Star, label: t("favorites"), color: "bg-chart-4/15 text-chart-4", href: "/documents" },
              ].map((action) => (
                <motion.button
                  key={action.label}
                  onClick={() => router.push(action.href)}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className={`w-10 h-10 rounded-xl ${action.color} flex items-center justify-center`}>
                    <action.icon className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-medium text-foreground">{action.label}</span>
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div variants={item} className="lg:col-span-2">
          <div className="glass-card rounded-xl p-5">
            <h2 className="text-lg font-semibold text-foreground mb-4">{t("recentActivity")}</h2>
            <div className="rounded-xl bg-secondary/30 p-6 text-center text-sm text-muted-foreground">
              {t("activityPlaceholder")}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
