"use client"

import { motion } from "framer-motion"
import {
  BarChart3,
  TrendingUp,
  Clock,
  FileText,
  MessageSquare,
  Brain,
  Calendar,
  Target,
  Award
} from "lucide-react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from "recharts"

const weeklyActivity = [
  { day: "Mon", study: 2.5, ai: 1.2 },
  { day: "Tue", study: 3.2, ai: 1.8 },
  { day: "Wed", study: 2.8, ai: 2.1 },
  { day: "Thu", study: 4.1, ai: 2.5 },
  { day: "Fri", study: 3.5, ai: 1.9 },
  { day: "Sat", study: 5.2, ai: 3.2 },
  { day: "Sun", study: 4.8, ai: 2.8 },
]

const subjectDistribution = [
  { name: "Computer Science", value: 35, color: "#3b82f6" },
  { name: "Mathematics", value: 25, color: "#10b981" },
  { name: "Chemistry", value: 20, color: "#8b5cf6" },
  { name: "Physics", value: 12, color: "#f59e0b" },
  { name: "Others", value: 8, color: "#ef4444" },
]

const monthlyProgress = [
  { month: "Jan", documents: 12, quizzes: 8, flashcards: 45 },
  { month: "Feb", documents: 18, quizzes: 12, flashcards: 62 },
  { month: "Mar", documents: 15, quizzes: 15, flashcards: 78 },
  { month: "Apr", documents: 22, quizzes: 18, flashcards: 95 },
  { month: "May", documents: 28, quizzes: 22, flashcards: 120 },
  { month: "Jun", documents: 35, quizzes: 28, flashcards: 145 },
]

const topDocuments = [
  { name: "Machine Learning Notes.pdf", views: 156, subject: "Computer Science" },
  { name: "Linear Algebra Review.pdf", views: 124, subject: "Mathematics" },
  { name: "Organic Chemistry Ch.5.pdf", views: 98, subject: "Chemistry" },
  { name: "Data Structures.pdf", views: 87, subject: "Computer Science" },
  { name: "Calculus II Formulas.pdf", views: 76, subject: "Mathematics" },
]

const stats = [
  { icon: Clock, label: "Total Study Hours", value: "126.5", change: "+12.3%", color: "text-primary" },
  { icon: MessageSquare, label: "AI Conversations", value: "234", change: "+28.5%", color: "text-accent" },
  { icon: Brain, label: "Flashcards Reviewed", value: "1,247", change: "+15.2%", color: "text-chart-3" },
  { icon: Target, label: "Quizzes Completed", value: "45", change: "+8.7%", color: "text-chart-4" },
]

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

export default function AnalyticsPage() {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={item}>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Study Analytics</h1>
        <p className="text-muted-foreground mt-1">Track your learning progress and insights</p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            className="glass-card rounded-xl p-5"
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

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Activity Chart */}
        <motion.div variants={item} className="glass-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Weekly Activity</h2>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <span className="text-xs text-muted-foreground">Study Time</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-accent" />
                <span className="text-xs text-muted-foreground">AI Usage</span>
              </div>
            </div>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyActivity}>
                <defs>
                  <linearGradient id="studyGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="aiGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="day" stroke="#666" fontSize={12} />
                <YAxis stroke="#666" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "#1a1a24", 
                    border: "1px solid #333",
                    borderRadius: "8px",
                    color: "#fff"
                  }} 
                />
                <Area
                  type="monotone"
                  dataKey="study"
                  stroke="#3b82f6"
                  fillOpacity={1}
                  fill="url(#studyGradient)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="ai"
                  stroke="#10b981"
                  fillOpacity={1}
                  fill="url(#aiGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Subject Distribution */}
        <motion.div variants={item} className="glass-card rounded-xl p-5">
          <h2 className="text-lg font-semibold text-foreground mb-4">Subject Distribution</h2>
          <div className="h-[280px] flex items-center">
            <ResponsiveContainer width="50%" height="100%">
              <PieChart>
                <Pie
                  data={subjectDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {subjectDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1a1a24",
                    border: "1px solid #333",
                    borderRadius: "8px",
                    color: "#fff"
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-3">
              {subjectDistribution.map((subject) => (
                <div key={subject.name} className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: subject.color }}
                  />
                  <span className="text-sm text-muted-foreground flex-1">{subject.name}</span>
                  <span className="text-sm font-medium text-foreground">{subject.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Monthly Progress Chart */}
      <motion.div variants={item} className="glass-card rounded-xl p-5">
        <h2 className="text-lg font-semibold text-foreground mb-4">Monthly Progress</h2>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyProgress}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="month" stroke="#666" fontSize={12} />
              <YAxis stroke="#666" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1a1a24",
                  border: "1px solid #333",
                  borderRadius: "8px",
                  color: "#fff"
                }}
              />
              <Bar dataKey="documents" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="quizzes" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="flashcards" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-xs text-muted-foreground">Documents</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-accent" />
            <span className="text-xs text-muted-foreground">Quizzes</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-chart-3" />
            <span className="text-xs text-muted-foreground">Flashcards</span>
          </div>
        </div>
      </motion.div>

      {/* Top Documents */}
      <motion.div variants={item} className="glass-card rounded-xl p-5">
        <h2 className="text-lg font-semibold text-foreground mb-4">Most Viewed Documents</h2>
        <div className="space-y-3">
          {topDocuments.map((doc, i) => (
            <motion.div
              key={doc.name}
              className="flex items-center gap-4 p-3 rounded-xl hover:bg-secondary/50 transition-colors"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * i }}
            >
              <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center text-primary font-bold text-sm">
                {i + 1}
              </div>
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                <FileText className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{doc.name}</p>
                <p className="text-xs text-muted-foreground">{doc.subject}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">{doc.views}</p>
                <p className="text-xs text-muted-foreground">views</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}
