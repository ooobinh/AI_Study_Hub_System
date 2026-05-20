"use client"

import { motion } from "framer-motion"
import { useState } from "react"
import {
  Users,
  FileText,
  BarChart3,
  Shield,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Ban,
  CheckCircle,
  XCircle,
  TrendingUp,
  Download,
  Filter
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const users = [
  { id: 1, name: "Alex Chen", email: "alex.chen@university.edu", role: "Student", documents: 47, status: "active", joined: "Mar 15, 2024" },
  { id: 2, name: "Sarah Johnson", email: "sarah.j@university.edu", role: "Student", documents: 32, status: "active", joined: "Feb 28, 2024" },
  { id: 3, name: "Michael Brown", email: "m.brown@university.edu", role: "Admin", documents: 15, status: "active", joined: "Jan 10, 2024" },
  { id: 4, name: "Emily Davis", email: "emily.d@university.edu", role: "Student", documents: 28, status: "inactive", joined: "Apr 5, 2024" },
  { id: 5, name: "James Wilson", email: "j.wilson@university.edu", role: "Student", documents: 51, status: "active", joined: "Mar 22, 2024" },
  { id: 6, name: "Lisa Anderson", email: "l.anderson@university.edu", role: "Moderator", documents: 8, status: "active", joined: "Feb 15, 2024" },
]

const pendingDocuments = [
  { id: 1, name: "Advanced Physics Notes.pdf", user: "Alex Chen", subject: "Physics", uploaded: "2 hours ago", size: "3.2 MB" },
  { id: 2, name: "Biology Lab Report.pdf", user: "Sarah Johnson", subject: "Biology", uploaded: "5 hours ago", size: "1.8 MB" },
  { id: 3, name: "Economics Essay.pdf", user: "James Wilson", subject: "Economics", uploaded: "1 day ago", size: "2.1 MB" },
]

const stats = [
  { icon: Users, label: "Total Users", value: "1,247", change: "+12.3%", color: "text-primary" },
  { icon: FileText, label: "Total Documents", value: "8,432", change: "+8.5%", color: "text-accent" },
  { icon: BarChart3, label: "Daily Active", value: "458", change: "+15.2%", color: "text-chart-3" },
  { icon: Shield, label: "Pending Review", value: "23", change: "-5.7%", color: "text-chart-4" },
]

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<"users" | "documents" | "reports">("users")
  const [searchQuery, setSearchQuery] = useState("")

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={item} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage users, documents, and platform settings</p>
        </div>
        <motion.button
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium w-fit"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Download className="w-4 h-4" />
          Export Report
        </motion.button>
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
              <span className={`text-xs font-medium flex items-center gap-1 ${
                stat.change.startsWith("+") ? "text-accent" : "text-destructive"
              }`}>
                <TrendingUp className={`w-3 h-3 ${stat.change.startsWith("-") ? "rotate-180" : ""}`} />
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

      {/* Tabs */}
      <motion.div variants={item} className="flex items-center gap-2 border-b border-border/50 pb-2">
        {[
          { id: "users" as const, label: "User Management", icon: Users },
          { id: "documents" as const, label: "Document Moderation", icon: FileText },
          { id: "reports" as const, label: "Reports", icon: BarChart3 },
        ].map((tab) => (
          <motion.button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </motion.button>
        ))}
      </motion.div>

      {/* Content */}
      {activeTab === "users" && (
        <motion.div variants={item} className="space-y-4">
          {/* Search */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-secondary/50 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
              />
            </div>
            <motion.button
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary/50 border border-border/50 text-muted-foreground hover:text-foreground transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Filter className="w-4 h-4" />
              Filter
            </motion.button>
          </div>

          {/* Users Table */}
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">User</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Role</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Documents</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Joined</th>
                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/80 to-accent/80 flex items-center justify-center text-white font-medium">
                            {user.name.split(" ").map(n => n[0]).join("")}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{user.name}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                          user.role === "Admin"
                            ? "bg-chart-4/15 text-chart-4"
                            : user.role === "Moderator"
                            ? "bg-accent/15 text-accent"
                            : "bg-primary/15 text-primary"
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-foreground">{user.documents}</td>
                      <td className="p-4">
                        <span className={`flex items-center gap-1 text-xs font-medium ${
                          user.status === "active" ? "text-accent" : "text-muted-foreground"
                        }`}>
                          {user.status === "active" ? (
                            <CheckCircle className="w-3 h-3" />
                          ) : (
                            <XCircle className="w-3 h-3" />
                          )}
                          {user.status}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">{user.joined}</td>
                      <td className="p-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <motion.button
                              className="p-1 rounded-lg hover:bg-secondary"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <MoreVertical className="w-4 h-4 text-muted-foreground" />
                            </motion.button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="glass-card border-border/50">
                            <DropdownMenuItem className="text-muted-foreground hover:text-foreground focus:text-foreground cursor-pointer gap-2">
                              <Eye className="w-4 h-4" /> View Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-muted-foreground hover:text-foreground focus:text-foreground cursor-pointer gap-2">
                              <Edit className="w-4 h-4" /> Edit User
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-muted-foreground hover:text-foreground focus:text-foreground cursor-pointer gap-2">
                              <Ban className="w-4 h-4" /> Suspend
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive focus:text-destructive cursor-pointer gap-2">
                              <Trash2 className="w-4 h-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === "documents" && (
        <motion.div variants={item} className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Pending Documents for Review</h3>
          <div className="space-y-3">
            {pendingDocuments.map((doc) => (
              <div
                key={doc.id}
                className="glass-card rounded-xl p-4 flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/15 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{doc.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Uploaded by {doc.user} • {doc.subject} • {doc.size}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">{doc.uploaded}</span>
                <div className="flex items-center gap-2">
                  <motion.button
                    className="p-2 rounded-lg bg-accent/15 text-accent hover:bg-accent/25 transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <CheckCircle className="w-4 h-4" />
                  </motion.button>
                  <motion.button
                    className="p-2 rounded-lg bg-destructive/15 text-destructive hover:bg-destructive/25 transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <XCircle className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {activeTab === "reports" && (
        <motion.div variants={item} className="glass-card rounded-xl p-8 text-center">
          <BarChart3 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Advanced Reports Coming Soon</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Detailed analytics, export capabilities, and custom report generation will be available in the next update.
          </p>
        </motion.div>
      )}
    </motion.div>
  )
}
