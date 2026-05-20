"use client"

import { motion } from "framer-motion"
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

const stats = [
  { icon: FileText, label: "Total Documents", value: "47", change: "+12%", color: "text-primary" },
  { icon: MessageSquare, label: "AI Chats", value: "156", change: "+28%", color: "text-accent" },
  { icon: FolderOpen, label: "Subjects", value: "8", change: "+2", color: "text-chart-3" },
  { icon: Upload, label: "Recent Uploads", value: "5", change: "this week", color: "text-chart-4" },
]

const recentDocuments = [
  { name: "Machine Learning Notes.pdf", subject: "Computer Science", date: "2 hours ago", pages: 24 },
  { name: "Organic Chemistry Ch.5.pdf", subject: "Chemistry", date: "5 hours ago", pages: 18 },
  { name: "Linear Algebra Review.pdf", subject: "Mathematics", date: "Yesterday", pages: 32 },
  { name: "Psychology Lecture Notes.pdf", subject: "Psychology", date: "2 days ago", pages: 15 },
]

const aiRecommendations = [
  { icon: Brain, title: "Review Flashcards", description: "15 cards due for review in Machine Learning", action: "Start Review" },
  { icon: Zap, title: "Quiz Available", description: "Test your knowledge on Organic Chemistry Ch.5", action: "Take Quiz" },
  { icon: BookOpen, title: "Study Session", description: "Continue reading Linear Algebra notes", action: "Continue" },
]

const activities = [
  { type: "upload", text: "Uploaded Machine Learning Notes", time: "2 hours ago" },
  { type: "chat", text: "Asked AI about quantum physics", time: "4 hours ago" },
  { type: "quiz", text: "Completed Chemistry quiz - 85%", time: "Yesterday" },
  { type: "flashcard", text: "Created 20 flashcards for Math", time: "Yesterday" },
  { type: "upload", text: "Uploaded Psychology Lecture Notes", time: "2 days ago" },
]

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
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Welcome Section */}
      <motion.div variants={item} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Welcome back, <span className="text-primary">Alex</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            Ready to continue your learning journey?
          </p>
        </div>
        <motion.button
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium w-fit"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Sparkles className="w-4 h-4" />
          Ask AI
        </motion.button>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            className="glass-card rounded-xl p-5 hover:border-primary/30 transition-all duration-300"
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
          </motion.div>
        ))}
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Documents */}
        <motion.div variants={item} className="lg:col-span-2">
          <div className="glass-card rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Recent Documents</h2>
              <motion.button
                className="text-sm text-primary flex items-center gap-1 hover:underline"
                whileHover={{ x: 4 }}
              >
                View All <ArrowRight className="w-4 h-4" />
              </motion.button>
            </div>
            <div className="space-y-3">
              {recentDocuments.map((doc, i) => (
                <motion.div
                  key={doc.name}
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
                      {doc.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {doc.subject} • {doc.pages} pages
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {doc.date}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* AI Recommendations */}
        <motion.div variants={item}>
          <div className="glass-card rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">AI Recommendations</h2>
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

      {/* Quick Actions & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <motion.div variants={item} className="lg:col-span-1">
          <div className="glass-card rounded-xl p-5">
            <h2 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Upload, label: "Upload", color: "bg-primary/15 text-primary" },
                { icon: MessageSquare, label: "Chat", color: "bg-accent/15 text-accent" },
                { icon: Brain, label: "Flashcards", color: "bg-chart-3/15 text-chart-3" },
                { icon: Star, label: "Favorites", color: "bg-chart-4/15 text-chart-4" },
              ].map((action) => (
                <motion.button
                  key={action.label}
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

        {/* Activity Timeline */}
        <motion.div variants={item} className="lg:col-span-2">
          <div className="glass-card rounded-xl p-5">
            <h2 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h2>
            <div className="space-y-4">
              {activities.map((activity, i) => (
                <motion.div
                  key={i}
                  className="flex items-start gap-3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * i }}
                >
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-foreground">{activity.text}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
