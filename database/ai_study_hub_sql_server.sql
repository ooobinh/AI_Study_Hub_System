CREATE TABLE [dbo].[achievements](
	[achievement_id] [bigint] IDENTITY(1,1) NOT NULL,
	[code] [varchar](100) NOT NULL,
	[title] [nvarchar](150) NOT NULL,
	[description] [nvarchar](max) NULL,
	[icon] [varchar](100) NULL,
	[created_at] [datetime2](7) NULL,
PRIMARY KEY CLUSTERED
(
	[achievement_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[activity_logs]    Script Date: 21/05/2026 11:29:46 CH ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[activity_logs](
	[activity_id] [bigint] IDENTITY(1,1) NOT NULL,
	[user_id] [bigint] NOT NULL,
	[activity_type] [varchar](50) NOT NULL,
	[entity_type] [varchar](50) NULL,
	[entity_id] [bigint] NULL,
	[description] [nvarchar](max) NULL,
	[created_at] [datetime2](7) NULL,
PRIMARY KEY CLUSTERED
(
	[activity_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
CREATE TABLE [dbo].[ai_flashcards](
	[flashcard_id] [bigint] IDENTITY(1,1) NOT NULL,
	[document_id] [bigint] NOT NULL,
	[user_id] [bigint] NOT NULL,
	[front_text] [nvarchar](max) NOT NULL,
	[back_text] [nvarchar](max) NOT NULL,
	[created_at] [datetime2](7) NULL,
PRIMARY KEY CLUSTERED 
(
	[flashcard_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[ai_quizzes]    Script Date: 21/05/2026 11:29:46 CH ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[ai_quizzes](
	[quiz_id] [bigint] IDENTITY(1,1) NOT NULL,
	[document_id] [bigint] NOT NULL,
	[user_id] [bigint] NOT NULL,
	[quiz_title] [nvarchar](255) NULL,
	[created_at] [datetime2](7) NULL,
PRIMARY KEY CLUSTERED 
(
	[quiz_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[ai_summaries]    Script Date: 21/05/2026 11:29:46 CH ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[ai_summaries](
	[summary_id] [bigint] IDENTITY(1,1) NOT NULL,
	[document_id] [bigint] NOT NULL,
	[user_id] [bigint] NOT NULL,
	[summary_text] [nvarchar](max) NOT NULL,
	[created_at] [datetime2](7) NULL,
PRIMARY KEY CLUSTERED 
(
	[summary_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[categories]    Script Date: 21/05/2026 11:29:46 CH ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[categories](
	[category_id] [bigint] IDENTITY(1,1) NOT NULL,
	[category_name] [nvarchar](100) NOT NULL,
	[description] [nvarchar](max) NULL,
	[created_at] [datetime2](7) NULL,
PRIMARY KEY CLUSTERED 
(
	[category_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[chat_messages]    Script Date: 21/05/2026 11:29:46 CH ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[chat_messages](
	[message_id] [bigint] IDENTITY(1,1) NOT NULL,
	[session_id] [bigint] NOT NULL,
	[sender] [varchar](10) NOT NULL,
	[message_text] [nvarchar](max) NOT NULL,
	[ai_model] [varchar](100) NULL,
	[created_at] [datetime2](7) NULL,
PRIMARY KEY CLUSTERED 
(
	[message_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[chat_sessions]    Script Date: 21/05/2026 11:29:46 CH ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[chat_sessions](
	[session_id] [bigint] IDENTITY(1,1) NOT NULL,
	[user_id] [bigint] NOT NULL,
	[document_id] [bigint] NULL,
	[session_title] [nvarchar](255) NULL,
	[created_at] [datetime2](7) NULL,
	[updated_at] [datetime2](7) NULL,
PRIMARY KEY CLUSTERED 
(
	[session_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[comments]    Script Date: 21/05/2026 11:29:46 CH ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[comments](
	[comment_id] [bigint] IDENTITY(1,1) NOT NULL,
	[document_id] [bigint] NOT NULL,
	[user_id] [bigint] NOT NULL,
	[content] [nvarchar](max) NOT NULL,
	[created_at] [datetime2](7) NULL,
	[updated_at] [datetime2](7) NULL,
PRIMARY KEY CLUSTERED 
(
	[comment_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[document_chunks]    Script Date: 21/05/2026 11:29:46 CH ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[document_chunks](
	[chunk_id] [bigint] IDENTITY(1,1) NOT NULL,
	[document_id] [bigint] NOT NULL,
	[chunk_index] [int] NOT NULL,
	[chunk_text] [nvarchar](max) NOT NULL,
	[embedding_vector] [nvarchar](max) NULL,
	[created_at] [datetime2](7) NULL,
PRIMARY KEY CLUSTERED 
(
	[chunk_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[document_contents]    Script Date: 21/05/2026 11:29:46 CH ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[document_contents](
	[content_id] [bigint] IDENTITY(1,1) NOT NULL,
	[document_id] [bigint] NOT NULL,
	[extracted_text] [nvarchar](max) NULL,
	[extraction_status] [varchar](20) NOT NULL,
	[extracted_at] [datetime2](7) NULL,
PRIMARY KEY CLUSTERED 
(
	[content_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[document_favorites]    Script Date: 21/05/2026 11:29:46 CH ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[document_folders](
	[folder_id] [bigint] IDENTITY(1,1) NOT NULL,
	[owner_id] [bigint] NOT NULL,
	[folder_name] [nvarchar](150) NOT NULL,
	[status] [varchar](20) NOT NULL,
	[created_at] [datetime2](7) NULL,
	[updated_at] [datetime2](7) NULL,
PRIMARY KEY CLUSTERED
(
	[folder_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF,
ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[document_favorites]    Script Date: 21/05/2026 11:29:46 CH ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[document_favorites](
	[user_id] [bigint] NOT NULL,
	[document_id] [bigint] NOT NULL,
	[created_at] [datetime2](7) NULL,
PRIMARY KEY CLUSTERED 
(
	[user_id] ASC,
	[document_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[document_shares]    Script Date: 21/05/2026 11:29:46 CH ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[document_shares](
	[share_id] [bigint] IDENTITY(1,1) NOT NULL,
	[document_id] [bigint] NOT NULL,
	[shared_by] [bigint] NOT NULL,
	[shared_with] [bigint] NULL,
	[share_token] [varchar](255) NULL,
	[permission] [varchar](20) NOT NULL,
	[expired_at] [datetime2](7) NULL,
	[created_at] [datetime2](7) NULL,
PRIMARY KEY CLUSTERED 
(
	[share_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[document_tag_mapping]    Script Date: 21/05/2026 11:29:46 CH ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[document_tag_mapping](
	[document_id] [bigint] NOT NULL,
	[tag_id] [bigint] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[document_id] ASC,
	[tag_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[document_tags]    Script Date: 21/05/2026 11:29:46 CH ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[document_tags](
	[tag_id] [bigint] IDENTITY(1,1) NOT NULL,
	[tag_name] [nvarchar](100) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[tag_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[document_views]    Script Date: 21/05/2026 11:29:46 CH ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[document_views](
	[view_id] [bigint] IDENTITY(1,1) NOT NULL,
	[document_id] [bigint] NOT NULL,
	[user_id] [bigint] NULL,
	[viewed_at] [datetime2](7) NULL,
PRIMARY KEY CLUSTERED 
(
	[view_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[documents]    Script Date: 21/05/2026 11:29:46 CH ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[documents](
	[document_id] [bigint] IDENTITY(1,1) NOT NULL,
	[owner_id] [bigint] NOT NULL,
	[subject_id] [bigint] NULL,
	[folder_id] [bigint] NULL,
	[category_id] [bigint] NULL,
	[title] [nvarchar](255) NOT NULL,
	[description] [nvarchar](max) NULL,
	[original_file_name] [nvarchar](255) NOT NULL,
	[file_url] [nvarchar](max) NOT NULL,
	[preview_url] [nvarchar](max) NULL,
	[file_type] [varchar](255) NULL,
	[file_size] [bigint] NULL,
	[page_count] [int] NULL,
	[visibility] [varchar](20) NOT NULL,
	[status] [varchar](30) NOT NULL,
	[download_count] [int] NULL,
	[view_count] [int] NULL,
	[created_at] [datetime2](7) NULL,
	[updated_at] [datetime2](7) NULL,
PRIMARY KEY CLUSTERED 
(
	[document_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[flashcard_reviews]    Script Date: 21/05/2026 11:29:46 CH ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[flashcard_reviews](
	[review_id] [bigint] IDENTITY(1,1) NOT NULL,
	[flashcard_id] [bigint] NOT NULL,
	[user_id] [bigint] NOT NULL,
	[rating] [int] NOT NULL,
	[reviewed_at] [datetime2](7) NULL,
	[next_review_at] [datetime2](7) NULL,
PRIMARY KEY CLUSTERED 
(
	[review_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[notifications]    Script Date: 21/05/2026 11:29:46 CH ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[notifications](
	[notification_id] [bigint] IDENTITY(1,1) NOT NULL,
	[user_id] [bigint] NOT NULL,
	[title] [nvarchar](255) NOT NULL,
	[content] [nvarchar](max) NULL,
	[is_read] [bit] NULL,
	[created_at] [datetime2](7) NULL,
PRIMARY KEY CLUSTERED 
(
	[notification_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[password_reset_tokens]    Script Date: 21/05/2026 11:29:46 CH ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[password_reset_tokens](
	[token_id] [bigint] IDENTITY(1,1) NOT NULL,
	[user_id] [bigint] NOT NULL,
	[token] [varchar](255) NOT NULL,
	[expired_at] [datetime2](7) NOT NULL,
	[used] [bit] NULL,
	[created_at] [datetime2](7) NULL,
PRIMARY KEY CLUSTERED 
(
	[token_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[quiz_attempts]    Script Date: 21/05/2026 11:29:46 CH ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[quiz_attempts](
	[attempt_id] [bigint] IDENTITY(1,1) NOT NULL,
	[quiz_id] [bigint] NOT NULL,
	[user_id] [bigint] NOT NULL,
	[score] [decimal](5, 2) NULL,
	[total_questions] [int] NULL,
	[correct_count] [int] NULL,
	[completed_at] [datetime2](7) NULL,
PRIMARY KEY CLUSTERED 
(
	[attempt_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[quiz_questions]    Script Date: 21/05/2026 11:29:46 CH ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[quiz_questions](
	[question_id] [bigint] IDENTITY(1,1) NOT NULL,
	[quiz_id] [bigint] NOT NULL,
	[question_text] [nvarchar](max) NOT NULL,
	[option_a] [nvarchar](max) NULL,
	[option_b] [nvarchar](max) NULL,
	[option_c] [nvarchar](max) NULL,
	[option_d] [nvarchar](max) NULL,
	[correct_answer] [varchar](1) NULL,
	[explanation] [nvarchar](max) NULL,
PRIMARY KEY CLUSTERED 
(
	[question_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[reports]    Script Date: 21/05/2026 11:29:46 CH ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[reports](
	[report_id] [bigint] IDENTITY(1,1) NOT NULL,
	[document_id] [bigint] NULL,
	[reported_by] [bigint] NOT NULL,
	[reason] [nvarchar](255) NOT NULL,
	[description] [nvarchar](max) NULL,
	[status] [varchar](20) NOT NULL,
	[created_at] [datetime2](7) NULL,
PRIMARY KEY CLUSTERED 
(
	[report_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[roles]    Script Date: 21/05/2026 11:29:46 CH ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[roles](
	[role_id] [bigint] IDENTITY(1,1) NOT NULL,
	[role_name] [varchar](50) NOT NULL,
	[description] [nvarchar](255) NULL,
PRIMARY KEY CLUSTERED 
(
	[role_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[study_sessions]    Script Date: 21/05/2026 11:29:46 CH ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[study_sessions](
	[study_session_id] [bigint] IDENTITY(1,1) NOT NULL,
	[user_id] [bigint] NOT NULL,
	[subject_id] [bigint] NULL,
	[started_at] [datetime2](7) NOT NULL,
	[ended_at] [datetime2](7) NULL,
	[duration_minutes] [int] NULL,
	[notes] [nvarchar](max) NULL,
PRIMARY KEY CLUSTERED 
(
	[study_session_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[subjects]    Script Date: 21/05/2026 11:29:46 CH ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[subjects](
	[subject_id] [bigint] IDENTITY(1,1) NOT NULL,
	[subject_code] [varchar](50) NOT NULL,
	[subject_name] [nvarchar](150) NOT NULL,
	[description] [nvarchar](max) NULL,
	[created_at] [datetime2](7) NULL,
PRIMARY KEY CLUSTERED 
(
	[subject_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[upload_logs]    Script Date: 21/05/2026 11:29:46 CH ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[upload_logs](
	[upload_id] [bigint] IDENTITY(1,1) NOT NULL,
	[user_id] [bigint] NOT NULL,
	[document_id] [bigint] NULL,
	[file_name] [nvarchar](255) NOT NULL,
	[storage_provider] [varchar](20) NOT NULL,
	[upload_status] [varchar](20) NOT NULL,
	[error_message] [nvarchar](max) NULL,
	[created_at] [datetime2](7) NULL,
PRIMARY KEY CLUSTERED 
(
	[upload_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[user_achievements]    Script Date: 21/05/2026 11:29:46 CH ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[user_achievements](
	[user_id] [bigint] NOT NULL,
	[achievement_id] [bigint] NOT NULL,
	[earned_at] [datetime2](7) NULL,
PRIMARY KEY CLUSTERED 
(
	[user_id] ASC,
	[achievement_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[user_roles]    Script Date: 21/05/2026 11:29:46 CH ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[user_roles](
	[user_id] [bigint] NOT NULL,
	[role_id] [bigint] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[user_id] ASC,
	[role_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[user_settings]    Script Date: 21/05/2026 11:29:46 CH ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[user_settings](
	[user_id] [bigint] NOT NULL,
	[theme] [varchar](20) NOT NULL,
	[language] [varchar](10) NOT NULL,
	[email_notifications] [bit] NOT NULL,
	[push_notifications] [bit] NOT NULL,
	[study_reminders] [bit] NOT NULL,
	[weekly_summary] [bit] NOT NULL,
	[updated_at] [datetime2](7) NULL,
PRIMARY KEY CLUSTERED 
(
	[user_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[users]    Script Date: 21/05/2026 11:29:46 CH ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[users](
	[user_id] [bigint] IDENTITY(1,1) NOT NULL,
	[full_name] [nvarchar](100) NOT NULL,
	[email] [varchar](150) NOT NULL,
	[password_hash] [varchar](255) NOT NULL,
	[avatar_url] [nvarchar](max) NULL,
	[phone] [varchar](20) NULL,
	[university] [nvarchar](150) NULL,
	[major] [nvarchar](150) NULL,
	[status] [varchar](20) NOT NULL,
	[email_verified] [bit] NOT NULL CONSTRAINT [DF_users_email_verified] DEFAULT ((0)),
	[email_verified_at] [datetime2](7) NULL,
	[google_subject] [nvarchar](255) NULL,
	[failed_login_count] [int] NOT NULL CONSTRAINT [DF_users_failed_login_count] DEFAULT ((0)),
	[locked_until] [datetime2](7) NULL,
	[password_changed_at] [datetime2](7) NULL,
	[last_login_at] [datetime2](7) NULL,
	[created_at] [datetime2](7) NULL,
	[updated_at] [datetime2](7) NULL,
PRIMARY KEY CLUSTERED
(
	[user_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[email_verification_tokens]    Script Date: 06/06/2026 12:00:00 SA ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[email_verification_tokens](
	[token_id] [bigint] IDENTITY(1,1) NOT NULL,
	[user_id] [bigint] NOT NULL,
	[token] [varchar](255) NOT NULL,
	[expires_at] [datetime2](7) NOT NULL,
	[used] [bit] NOT NULL,
	[created_at] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED
(
	[token_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
CONSTRAINT [UX_email_verification_tokens_token] UNIQUE NONCLUSTERED
(
	[token] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
CONSTRAINT [FK_email_verification_tokens_user] FOREIGN KEY([user_id])
	REFERENCES [dbo].[users] ([user_id])
) ON [PRIMARY]
GO
CREATE NONCLUSTERED INDEX [IX_email_verification_tokens_user] ON [dbo].[email_verification_tokens]
(
	[user_id] ASC,
	[used] ASC,
	[expires_at] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
ALTER TABLE [dbo].[email_verification_tokens] ADD  CONSTRAINT [DF_email_verification_tokens_used] DEFAULT ((0)) FOR [used]
GO
ALTER TABLE [dbo].[email_verification_tokens] ADD  CONSTRAINT [DF_email_verification_tokens_created_at] DEFAULT (sysdatetime()) FOR [created_at]
GO
/****** Object:  Table [dbo].[auth_login_logs]    Script Date: 06/06/2026 12:00:00 SA ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[auth_login_logs](
	[log_id] [bigint] IDENTITY(1,1) NOT NULL,
	[email] [varchar](150) NULL,
	[user_id] [bigint] NULL,
	[success] [bit] NOT NULL,
	[ip_address] [varchar](64) NULL,
	[user_agent] [varchar](300) NULL,
	[message] [varchar](300) NULL,
	[created_at] [datetime2](7) NOT NULL CONSTRAINT [DF_auth_login_logs_created_at] DEFAULT (sysdatetime()),
PRIMARY KEY CLUSTERED
(
	[log_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
CREATE NONCLUSTERED INDEX [ix_auth_login_logs_email] ON [dbo].[auth_login_logs]([email] ASC) ON [PRIMARY]
GO
CREATE NONCLUSTERED INDEX [ix_auth_login_logs_user] ON [dbo].[auth_login_logs]([user_id] ASC) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[user_sessions]    Script Date: 06/06/2026 12:00:00 SA ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[user_sessions](
	[session_id] [varchar](64) NOT NULL,
	[user_id] [bigint] NOT NULL,
	[issued_at] [datetime2](7) NOT NULL,
	[last_activity_at] [datetime2](7) NOT NULL,
	[expires_at] [datetime2](7) NOT NULL,
	[revoked_at] [datetime2](7) NULL,
	[revoke_reason] [varchar](120) NULL,
	[ip_address] [varchar](64) NULL,
	[user_agent] [varchar](300) NULL,
PRIMARY KEY CLUSTERED
(
	[session_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
CONSTRAINT [fk_user_sessions_user] FOREIGN KEY([user_id])
	REFERENCES [dbo].[users] ([user_id]) ON DELETE CASCADE
) ON [PRIMARY]
GO
CREATE NONCLUSTERED INDEX [ix_user_sessions_user] ON [dbo].[user_sessions]([user_id] ASC) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[admin_reauth_tokens]    Script Date: 06/06/2026 12:00:00 SA ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[admin_reauth_tokens](
	[token_id] [bigint] IDENTITY(1,1) NOT NULL,
	[admin_id] [bigint] NOT NULL,
	[token] [varchar](200) NOT NULL,
	[expires_at] [datetime2](7) NOT NULL,
	[used] [bit] NOT NULL CONSTRAINT [DF_admin_reauth_tokens_used] DEFAULT ((0)),
	[created_at] [datetime2](7) NOT NULL CONSTRAINT [DF_admin_reauth_tokens_created_at] DEFAULT (sysdatetime()),
PRIMARY KEY CLUSTERED
(
	[token_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
CONSTRAINT [fk_admin_reauth_tokens_admin] FOREIGN KEY([admin_id])
	REFERENCES [dbo].[users] ([user_id]) ON DELETE CASCADE
) ON [PRIMARY]
GO
CREATE NONCLUSTERED INDEX [ix_admin_reauth_tokens_token] ON [dbo].[admin_reauth_tokens]([token] ASC) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[system_settings]    Script Date: 06/06/2026 12:00:00 SA ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[system_settings](
	[setting_key] [varchar](120) NOT NULL,
	[setting_value] [varchar](500) NULL,
	[updated_at] [datetime2](7) NOT NULL CONSTRAINT [DF_system_settings_updated_at] DEFAULT (sysdatetime()),
PRIMARY KEY CLUSTERED
(
	[setting_key] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
INSERT [dbo].[system_settings] ([setting_key], [setting_value]) VALUES (N'upload.allowed_extensions', N'pdf,docx,pptx')
GO
INSERT [dbo].[system_settings] ([setting_key], [setting_value]) VALUES (N'upload.max_bytes', N'10485760')
GO
INSERT [dbo].[system_settings] ([setting_key], [setting_value]) VALUES (N'session.idle_minutes', N'60')
GO
INSERT [dbo].[system_settings] ([setting_key], [setting_value]) VALUES (N'session.max_minutes', N'720')
GO
/****** Object:  Table [dbo].[account_action_tokens]    Script Date: 06/06/2026 12:00:00 SA ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[account_action_tokens](
	[token_id] [bigint] IDENTITY(1,1) NOT NULL,
	[user_id] [bigint] NOT NULL,
	[action_type] [varchar](30) NOT NULL,
	[token] [varchar](255) NOT NULL,
	[new_email] [nvarchar](150) NULL,
	[used] [bit] NOT NULL CONSTRAINT [DF_account_action_tokens_used] DEFAULT ((0)),
	[expired_at] [datetime2](7) NOT NULL,
	[created_at] [datetime2](7) NOT NULL CONSTRAINT [DF_account_action_tokens_created_at] DEFAULT (sysdatetime()),
PRIMARY KEY CLUSTERED
(
	[token_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
CONSTRAINT [UX_account_action_tokens_token] UNIQUE NONCLUSTERED
(
	[token] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
CONSTRAINT [FK_account_action_tokens_user] FOREIGN KEY([user_id])
	REFERENCES [dbo].[users] ([user_id]),
CONSTRAINT [CHK_account_action_tokens_action_type] CHECK ([action_type] IN ('VERIFY_EMAIL', 'CHANGE_EMAIL', 'DELETE_ACCOUNT'))
) ON [PRIMARY]
GO
CREATE NONCLUSTERED INDEX [IX_account_action_tokens_user_action] ON [dbo].[account_action_tokens]
(
	[user_id] ASC,
	[action_type] ASC,
	[used] ASC,
	[expired_at] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
CREATE UNIQUE NONCLUSTERED INDEX [UX_users_google_subject] ON [dbo].[users]
(
	[google_subject] ASC
)
WHERE [google_subject] IS NOT NULL
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET IDENTITY_INSERT [dbo].[achievements] ON 

INSERT [dbo].[achievements] ([achievement_id], [code], [title], [description], [icon], [created_at]) VALUES (1, N'EARLY_ADOPTER', N'Early Adopter', N'Joined the platform early', N'Zap', CAST(N'2026-05-20T22:34:56.8066877' AS DateTime2))
INSERT [dbo].[achievements] ([achievement_id], [code], [title], [description], [icon], [created_at]) VALUES (2, N'KNOWLEDGE_SEEKER', N'Knowledge Seeker', N'Uploaded study documents', N'BookOpen', CAST(N'2026-05-20T22:34:56.8066877' AS DateTime2))
INSERT [dbo].[achievements] ([achievement_id], [code], [title], [description], [icon], [created_at]) VALUES (3, N'AI_EXPLORER', N'AI Explorer', N'Used AI study assistant', N'MessageSquare', CAST(N'2026-05-20T22:34:56.8066877' AS DateTime2))
SET IDENTITY_INSERT [dbo].[achievements] OFF
GO
SET IDENTITY_INSERT [dbo].[categories] ON 

INSERT [dbo].[categories] ([category_id], [category_name], [description], [created_at]) VALUES (1, N'Lecture Slide', N'Lecture slide documents', CAST(N'2026-05-20T22:34:56.7749505' AS DateTime2))
INSERT [dbo].[categories] ([category_id], [category_name], [description], [created_at]) VALUES (2, N'Assignment', N'Assignment documents', CAST(N'2026-05-20T22:34:56.7749505' AS DateTime2))
INSERT [dbo].[categories] ([category_id], [category_name], [description], [created_at]) VALUES (3, N'Exam Review', N'Exam preparation materials', CAST(N'2026-05-20T22:34:56.7749505' AS DateTime2))
INSERT [dbo].[categories] ([category_id], [category_name], [description], [created_at]) VALUES (4, N'Book', N'Textbooks and reference books', CAST(N'2026-05-20T22:34:56.7749505' AS DateTime2))
INSERT [dbo].[categories] ([category_id], [category_name], [description], [created_at]) VALUES (5, N'Note', N'Student notes', CAST(N'2026-05-20T22:34:56.7749505' AS DateTime2))
SET IDENTITY_INSERT [dbo].[categories] OFF
GO
SET IDENTITY_INSERT [dbo].[document_tags] ON 

INSERT [dbo].[document_tags] ([tag_id], [tag_name]) VALUES (4, N'AI')
INSERT [dbo].[document_tags] ([tag_id], [tag_name]) VALUES (6, N'Database')
INSERT [dbo].[document_tags] ([tag_id], [tag_name]) VALUES (1, N'Java')
INSERT [dbo].[document_tags] ([tag_id], [tag_name]) VALUES (2, N'Spring Boot')
INSERT [dbo].[document_tags] ([tag_id], [tag_name]) VALUES (3, N'SQL Server')
INSERT [dbo].[document_tags] ([tag_id], [tag_name]) VALUES (5, N'Testing')
SET IDENTITY_INSERT [dbo].[document_tags] OFF
GO
SET IDENTITY_INSERT [dbo].[roles] ON 

INSERT [dbo].[roles] ([role_id], [role_name], [description]) VALUES (1, N'GUEST', N'Guest user with limited access')
INSERT [dbo].[roles] ([role_id], [role_name], [description]) VALUES (2, N'USER', N'Normal student user')
INSERT [dbo].[roles] ([role_id], [role_name], [description]) VALUES (3, N'ADMIN', N'System administrator')
SET IDENTITY_INSERT [dbo].[roles] OFF
GO
SET IDENTITY_INSERT [dbo].[users] ON 

INSERT [dbo].[users] ([user_id], [full_name], [email], [password_hash], [university], [major], [status], [created_at], [updated_at]) VALUES (1, N'AI Study Hub Admin', N'admin@example.com', N'$2a$10$83cE5EdlLYssMSzffB/1dOVSfjBJ0rbNVLJHLV8G1BGjyPEG4Qzru', N'AI Study Hub', N'Administration', N'ACTIVE', SYSDATETIME(), SYSDATETIME())
SET IDENTITY_INSERT [dbo].[users] OFF
GO
INSERT [dbo].[user_roles] ([user_id], [role_id]) VALUES (1, 3)
GO
SET IDENTITY_INSERT [dbo].[subjects] ON 

INSERT [dbo].[subjects] ([subject_id], [subject_code], [subject_name], [description], [created_at]) VALUES (1, N'PRJ301', N'Java Web Application Development', N'Java Servlet, JSP, MVC, JDBC', CAST(N'2026-05-20T22:34:56.7749505' AS DateTime2))
INSERT [dbo].[subjects] ([subject_id], [subject_code], [subject_name], [description], [created_at]) VALUES (2, N'SWT301', N'Software Testing', N'Testing process, validation, verification', CAST(N'2026-05-20T22:34:56.7749505' AS DateTime2))
INSERT [dbo].[subjects] ([subject_id], [subject_code], [subject_name], [description], [created_at]) VALUES (3, N'CSD201', N'Data Structures and Algorithms', N'Linked List, Stack, Queue, Tree', CAST(N'2026-05-20T22:34:56.7749505' AS DateTime2))
INSERT [dbo].[subjects] ([subject_id], [subject_code], [subject_name], [description], [created_at]) VALUES (4, N'DBI202', N'Database Systems', N'SQL, ERD, relational database', CAST(N'2026-05-20T22:34:56.7749505' AS DateTime2))
SET IDENTITY_INSERT [dbo].[subjects] OFF
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [UQ__achievem__357D4CF9D7EEB03C]    Script Date: 21/05/2026 11:29:47 CH ******/
ALTER TABLE [dbo].[achievements] ADD UNIQUE NONCLUSTERED 
(
	[code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [idx_activity_user]    Script Date: 21/05/2026 11:29:47 CH ******/
CREATE NONCLUSTERED INDEX [idx_activity_user] ON [dbo].[activity_logs]
(
	[user_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [UQ__categori__5189E255207D294D]    Script Date: 21/05/2026 11:29:47 CH ******/
ALTER TABLE [dbo].[categories] ADD UNIQUE NONCLUSTERED 
(
	[category_name] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [idx_chat_sessions_user]    Script Date: 21/05/2026 11:29:47 CH ******/
CREATE NONCLUSTERED INDEX [idx_chat_sessions_user] ON [dbo].[chat_sessions]
(
	[user_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [uq_document_chunk]    Script Date: 21/05/2026 11:29:47 CH ******/
ALTER TABLE [dbo].[document_chunks] ADD  CONSTRAINT [uq_document_chunk] UNIQUE NONCLUSTERED 
(
	[document_id] ASC,
	[chunk_index] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [idx_document_chunks_document]    Script Date: 21/05/2026 11:29:47 CH ******/
CREATE NONCLUSTERED INDEX [idx_document_chunks_document] ON [dbo].[document_chunks]
(
	[document_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [UQ__document__9666E8AD4AD0C91F]    Script Date: 21/05/2026 11:29:47 CH ******/
ALTER TABLE [dbo].[document_contents] ADD UNIQUE NONCLUSTERED 
(
	[document_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [UQ__document__C79E80F42B049B47]    Script Date: 21/05/2026 11:29:47 CH ******/
ALTER TABLE [dbo].[document_shares] ADD UNIQUE NONCLUSTERED 
(
	[share_token] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [UQ__document__E298655C7F722EC7]    Script Date: 21/05/2026 11:29:47 CH ******/
ALTER TABLE [dbo].[document_tags] ADD UNIQUE NONCLUSTERED 
(
	[tag_name] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [idx_documents_owner]    Script Date: 21/05/2026 11:29:47 CH ******/
CREATE NONCLUSTERED INDEX [idx_documents_owner] ON [dbo].[documents]
(
	[owner_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [idx_documents_status]    Script Date: 21/05/2026 11:29:47 CH ******/
CREATE NONCLUSTERED INDEX [idx_documents_status] ON [dbo].[documents]
(
	[status] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [idx_documents_subject]    Script Date: 21/05/2026 11:29:47 CH ******/
CREATE NONCLUSTERED INDEX [idx_documents_subject] ON [dbo].[documents]
(
	[subject_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [idx_documents_title]    Script Date: 21/05/2026 11:29:47 CH ******/
CREATE NONCLUSTERED INDEX [idx_documents_title] ON [dbo].[documents]
(
	[title] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [idx_documents_visibility]    Script Date: 21/05/2026 11:29:47 CH ******/
CREATE NONCLUSTERED INDEX [idx_documents_visibility] ON [dbo].[documents]
(
	[visibility] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [UQ__password__CA90DA7AA75E45C9]    Script Date: 21/05/2026 11:29:47 CH ******/
ALTER TABLE [dbo].[password_reset_tokens] ADD UNIQUE NONCLUSTERED 
(
	[token] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [UQ__roles__783254B13C3A6D6B]    Script Date: 21/05/2026 11:29:47 CH ******/
ALTER TABLE [dbo].[roles] ADD UNIQUE NONCLUSTERED 
(
	[role_name] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [UQ__subjects__CEACD920547C9F98]    Script Date: 21/05/2026 11:29:47 CH ******/
ALTER TABLE [dbo].[subjects] ADD UNIQUE NONCLUSTERED 
(
	[subject_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [UQ__users__AB6E61644106EF27]    Script Date: 21/05/2026 11:29:47 CH ******/
ALTER TABLE [dbo].[users] ADD UNIQUE NONCLUSTERED 
(
	[email] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [idx_users_email]    Script Date: 21/05/2026 11:29:47 CH ******/
CREATE NONCLUSTERED INDEX [idx_users_email] ON [dbo].[users]
(
	[email] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
ALTER TABLE [dbo].[achievements] ADD  DEFAULT (sysdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[activity_logs] ADD  DEFAULT (sysdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[ai_flashcards] ADD  DEFAULT (sysdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[ai_quizzes] ADD  DEFAULT (sysdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[ai_summaries] ADD  DEFAULT (sysdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[categories] ADD  DEFAULT (sysdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[chat_messages] ADD  DEFAULT (sysdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[chat_sessions] ADD  DEFAULT (sysdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[chat_sessions] ADD  DEFAULT (sysdatetime()) FOR [updated_at]
GO
ALTER TABLE [dbo].[comments] ADD  DEFAULT (sysdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[comments] ADD  DEFAULT (sysdatetime()) FOR [updated_at]
GO
ALTER TABLE [dbo].[document_chunks] ADD  DEFAULT (sysdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[document_contents] ADD  DEFAULT ('PENDING') FOR [extraction_status]
GO
ALTER TABLE [dbo].[document_folders] ADD  DEFAULT ('ACTIVE') FOR [status]
GO
ALTER TABLE [dbo].[document_folders] ADD  DEFAULT (sysdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[document_folders] ADD  DEFAULT (sysdatetime()) FOR [updated_at]
GO
ALTER TABLE [dbo].[document_favorites] ADD  DEFAULT (sysdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[document_shares] ADD  DEFAULT ('VIEW') FOR [permission]
GO
ALTER TABLE [dbo].[document_shares] ADD  DEFAULT (sysdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[document_views] ADD  DEFAULT (sysdatetime()) FOR [viewed_at]
GO
ALTER TABLE [dbo].[documents] ADD  DEFAULT ('PRIVATE') FOR [visibility]
GO
ALTER TABLE [dbo].[documents] ADD  DEFAULT ('ACTIVE') FOR [status]
GO
ALTER TABLE [dbo].[documents] ADD  DEFAULT ((0)) FOR [download_count]
GO
ALTER TABLE [dbo].[documents] ADD  DEFAULT ((0)) FOR [view_count]
GO
ALTER TABLE [dbo].[documents] ADD  DEFAULT (sysdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[documents] ADD  DEFAULT (sysdatetime()) FOR [updated_at]
GO
ALTER TABLE [dbo].[flashcard_reviews] ADD  DEFAULT (sysdatetime()) FOR [reviewed_at]
GO
ALTER TABLE [dbo].[notifications] ADD  DEFAULT ((0)) FOR [is_read]
GO
ALTER TABLE [dbo].[notifications] ADD  DEFAULT (sysdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[password_reset_tokens] ADD  DEFAULT ((0)) FOR [used]
GO
ALTER TABLE [dbo].[password_reset_tokens] ADD  DEFAULT (sysdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[quiz_attempts] ADD  DEFAULT (sysdatetime()) FOR [completed_at]
GO
ALTER TABLE [dbo].[reports] ADD  DEFAULT ('PENDING') FOR [status]
GO
ALTER TABLE [dbo].[reports] ADD  DEFAULT (sysdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[study_sessions] ADD  DEFAULT (sysdatetime()) FOR [started_at]
GO
ALTER TABLE [dbo].[subjects] ADD  DEFAULT (sysdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[upload_logs] ADD  CONSTRAINT [DF_upload_logs_storage_provider]  DEFAULT ('SUPABASE') FOR [storage_provider]
GO
ALTER TABLE [dbo].[upload_logs] ADD  DEFAULT ('UPLOADING') FOR [upload_status]
GO
ALTER TABLE [dbo].[upload_logs] ADD  DEFAULT (sysdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[user_achievements] ADD  DEFAULT (sysdatetime()) FOR [earned_at]
GO
ALTER TABLE [dbo].[user_settings] ADD  DEFAULT ('system') FOR [theme]
GO
ALTER TABLE [dbo].[user_settings] ADD  DEFAULT ('en') FOR [language]
GO
ALTER TABLE [dbo].[user_settings] ADD  DEFAULT ((1)) FOR [email_notifications]
GO
ALTER TABLE [dbo].[user_settings] ADD  DEFAULT ((1)) FOR [push_notifications]
GO
ALTER TABLE [dbo].[user_settings] ADD  DEFAULT ((1)) FOR [study_reminders]
GO
ALTER TABLE [dbo].[user_settings] ADD  DEFAULT ((1)) FOR [weekly_summary]
GO
ALTER TABLE [dbo].[user_settings] ADD  DEFAULT (sysdatetime()) FOR [updated_at]
GO
ALTER TABLE [dbo].[users] ADD  DEFAULT ('ACTIVE') FOR [status]
GO
ALTER TABLE [dbo].[users] ADD  DEFAULT (sysdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[users] ADD  DEFAULT (sysdatetime()) FOR [updated_at]
GO
ALTER TABLE [dbo].[activity_logs]  WITH CHECK ADD  CONSTRAINT [fk_activity_user] FOREIGN KEY([user_id])
REFERENCES [dbo].[users] ([user_id])
GO
ALTER TABLE [dbo].[activity_logs] CHECK CONSTRAINT [fk_activity_user]
GO
ALTER TABLE [dbo].[ai_flashcards]  WITH CHECK ADD  CONSTRAINT [fk_flashcard_document] FOREIGN KEY([document_id])
REFERENCES [dbo].[documents] ([document_id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[ai_flashcards] CHECK CONSTRAINT [fk_flashcard_document]
GO
ALTER TABLE [dbo].[ai_flashcards]  WITH CHECK ADD  CONSTRAINT [fk_flashcard_user] FOREIGN KEY([user_id])
REFERENCES [dbo].[users] ([user_id])
GO
ALTER TABLE [dbo].[ai_flashcards] CHECK CONSTRAINT [fk_flashcard_user]
GO
ALTER TABLE [dbo].[ai_quizzes]  WITH CHECK ADD  CONSTRAINT [fk_quiz_document] FOREIGN KEY([document_id])
REFERENCES [dbo].[documents] ([document_id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[ai_quizzes] CHECK CONSTRAINT [fk_quiz_document]
GO
ALTER TABLE [dbo].[ai_quizzes]  WITH CHECK ADD  CONSTRAINT [fk_quiz_user] FOREIGN KEY([user_id])
REFERENCES [dbo].[users] ([user_id])
GO
ALTER TABLE [dbo].[ai_quizzes] CHECK CONSTRAINT [fk_quiz_user]
GO
ALTER TABLE [dbo].[ai_summaries]  WITH CHECK ADD  CONSTRAINT [fk_summary_document] FOREIGN KEY([document_id])
REFERENCES [dbo].[documents] ([document_id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[ai_summaries] CHECK CONSTRAINT [fk_summary_document]
GO
ALTER TABLE [dbo].[ai_summaries]  WITH CHECK ADD  CONSTRAINT [fk_summary_user] FOREIGN KEY([user_id])
REFERENCES [dbo].[users] ([user_id])
GO
ALTER TABLE [dbo].[ai_summaries] CHECK CONSTRAINT [fk_summary_user]
GO
ALTER TABLE [dbo].[chat_messages]  WITH CHECK ADD  CONSTRAINT [fk_message_session] FOREIGN KEY([session_id])
REFERENCES [dbo].[chat_sessions] ([session_id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[chat_messages] CHECK CONSTRAINT [fk_message_session]
GO
ALTER TABLE [dbo].[chat_sessions]  WITH CHECK ADD  CONSTRAINT [fk_chat_document] FOREIGN KEY([document_id])
REFERENCES [dbo].[documents] ([document_id])
GO
ALTER TABLE [dbo].[chat_sessions] CHECK CONSTRAINT [fk_chat_document]
GO
ALTER TABLE [dbo].[chat_sessions]  WITH CHECK ADD  CONSTRAINT [fk_chat_user] FOREIGN KEY([user_id])
REFERENCES [dbo].[users] ([user_id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[chat_sessions] CHECK CONSTRAINT [fk_chat_user]
GO
ALTER TABLE [dbo].[comments]  WITH CHECK ADD  CONSTRAINT [fk_comment_document] FOREIGN KEY([document_id])
REFERENCES [dbo].[documents] ([document_id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[comments] CHECK CONSTRAINT [fk_comment_document]
GO
ALTER TABLE [dbo].[comments]  WITH CHECK ADD  CONSTRAINT [fk_comment_user] FOREIGN KEY([user_id])
REFERENCES [dbo].[users] ([user_id])
GO
ALTER TABLE [dbo].[comments] CHECK CONSTRAINT [fk_comment_user]
GO
ALTER TABLE [dbo].[document_chunks]  WITH CHECK ADD  CONSTRAINT [fk_chunk_document] FOREIGN KEY([document_id])
REFERENCES [dbo].[documents] ([document_id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[document_chunks] CHECK CONSTRAINT [fk_chunk_document]
GO
ALTER TABLE [dbo].[document_contents]  WITH CHECK ADD  CONSTRAINT [fk_content_document] FOREIGN KEY([document_id])
REFERENCES [dbo].[documents] ([document_id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[document_contents] CHECK CONSTRAINT [fk_content_document]
GO
ALTER TABLE [dbo].[document_folders]  WITH CHECK ADD  CONSTRAINT [fk_document_folder_owner] FOREIGN KEY([owner_id])
REFERENCES [dbo].[users] ([user_id])
GO
ALTER TABLE [dbo].[document_folders] CHECK CONSTRAINT [fk_document_folder_owner]
GO
ALTER TABLE [dbo].[document_folders]  WITH CHECK ADD  CONSTRAINT [chk_document_folder_status] CHECK  (([status]='DELETED' OR [status]='ACTIVE'))
GO
ALTER TABLE [dbo].[document_folders] CHECK CONSTRAINT [chk_document_folder_status]
GO
ALTER TABLE [dbo].[document_favorites]  WITH CHECK ADD  CONSTRAINT [fk_fav_document] FOREIGN KEY([document_id])
REFERENCES [dbo].[documents] ([document_id])
GO
ALTER TABLE [dbo].[document_favorites] CHECK CONSTRAINT [fk_fav_document]
GO
ALTER TABLE [dbo].[document_favorites]  WITH CHECK ADD  CONSTRAINT [fk_fav_user] FOREIGN KEY([user_id])
REFERENCES [dbo].[users] ([user_id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[document_favorites] CHECK CONSTRAINT [fk_fav_user]
GO
ALTER TABLE [dbo].[document_shares]  WITH CHECK ADD  CONSTRAINT [fk_share_by] FOREIGN KEY([shared_by])
REFERENCES [dbo].[users] ([user_id])
GO
ALTER TABLE [dbo].[document_shares] CHECK CONSTRAINT [fk_share_by]
GO
ALTER TABLE [dbo].[document_shares]  WITH CHECK ADD  CONSTRAINT [fk_share_document] FOREIGN KEY([document_id])
REFERENCES [dbo].[documents] ([document_id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[document_shares] CHECK CONSTRAINT [fk_share_document]
GO
ALTER TABLE [dbo].[document_shares]  WITH CHECK ADD  CONSTRAINT [fk_share_with] FOREIGN KEY([shared_with])
REFERENCES [dbo].[users] ([user_id])
GO
ALTER TABLE [dbo].[document_shares] CHECK CONSTRAINT [fk_share_with]
GO
ALTER TABLE [dbo].[document_tag_mapping]  WITH CHECK ADD  CONSTRAINT [fk_doc_tag_document] FOREIGN KEY([document_id])
REFERENCES [dbo].[documents] ([document_id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[document_tag_mapping] CHECK CONSTRAINT [fk_doc_tag_document]
GO
ALTER TABLE [dbo].[document_tag_mapping]  WITH CHECK ADD  CONSTRAINT [fk_doc_tag_tag] FOREIGN KEY([tag_id])
REFERENCES [dbo].[document_tags] ([tag_id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[document_tag_mapping] CHECK CONSTRAINT [fk_doc_tag_tag]
GO
ALTER TABLE [dbo].[document_views]  WITH CHECK ADD  CONSTRAINT [fk_view_document] FOREIGN KEY([document_id])
REFERENCES [dbo].[documents] ([document_id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[document_views] CHECK CONSTRAINT [fk_view_document]
GO
ALTER TABLE [dbo].[document_views]  WITH CHECK ADD  CONSTRAINT [fk_view_user] FOREIGN KEY([user_id])
REFERENCES [dbo].[users] ([user_id])
GO
ALTER TABLE [dbo].[document_views] CHECK CONSTRAINT [fk_view_user]
GO
ALTER TABLE [dbo].[documents]  WITH CHECK ADD  CONSTRAINT [fk_document_category] FOREIGN KEY([category_id])
REFERENCES [dbo].[categories] ([category_id])
GO
ALTER TABLE [dbo].[documents] CHECK CONSTRAINT [fk_document_category]
GO
ALTER TABLE [dbo].[documents]  WITH CHECK ADD  CONSTRAINT [fk_document_owner] FOREIGN KEY([owner_id])
REFERENCES [dbo].[users] ([user_id])
GO
ALTER TABLE [dbo].[documents] CHECK CONSTRAINT [fk_document_owner]
GO
ALTER TABLE [dbo].[documents]  WITH CHECK ADD  CONSTRAINT [fk_document_folder] FOREIGN KEY([folder_id])
REFERENCES [dbo].[document_folders] ([folder_id])
GO
ALTER TABLE [dbo].[documents] CHECK CONSTRAINT [fk_document_folder]
GO
ALTER TABLE [dbo].[documents]  WITH CHECK ADD  CONSTRAINT [fk_document_subject] FOREIGN KEY([subject_id])
REFERENCES [dbo].[subjects] ([subject_id])
GO
ALTER TABLE [dbo].[documents] CHECK CONSTRAINT [fk_document_subject]
GO
ALTER TABLE [dbo].[flashcard_reviews]  WITH CHECK ADD  CONSTRAINT [fk_review_flashcard] FOREIGN KEY([flashcard_id])
REFERENCES [dbo].[ai_flashcards] ([flashcard_id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[flashcard_reviews] CHECK CONSTRAINT [fk_review_flashcard]
GO
ALTER TABLE [dbo].[flashcard_reviews]  WITH CHECK ADD  CONSTRAINT [fk_review_user] FOREIGN KEY([user_id])
REFERENCES [dbo].[users] ([user_id])
GO
ALTER TABLE [dbo].[flashcard_reviews] CHECK CONSTRAINT [fk_review_user]
GO
ALTER TABLE [dbo].[notifications]  WITH CHECK ADD  CONSTRAINT [fk_notification_user] FOREIGN KEY([user_id])
REFERENCES [dbo].[users] ([user_id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[notifications] CHECK CONSTRAINT [fk_notification_user]
GO
ALTER TABLE [dbo].[password_reset_tokens]  WITH CHECK ADD  CONSTRAINT [fk_reset_user] FOREIGN KEY([user_id])
REFERENCES [dbo].[users] ([user_id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[password_reset_tokens] CHECK CONSTRAINT [fk_reset_user]
GO
ALTER TABLE [dbo].[quiz_attempts]  WITH CHECK ADD  CONSTRAINT [fk_attempt_quiz] FOREIGN KEY([quiz_id])
REFERENCES [dbo].[ai_quizzes] ([quiz_id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[quiz_attempts] CHECK CONSTRAINT [fk_attempt_quiz]
GO
ALTER TABLE [dbo].[quiz_attempts]  WITH CHECK ADD  CONSTRAINT [fk_attempt_user] FOREIGN KEY([user_id])
REFERENCES [dbo].[users] ([user_id])
GO
ALTER TABLE [dbo].[quiz_attempts] CHECK CONSTRAINT [fk_attempt_user]
GO
ALTER TABLE [dbo].[quiz_questions]  WITH CHECK ADD  CONSTRAINT [fk_question_quiz] FOREIGN KEY([quiz_id])
REFERENCES [dbo].[ai_quizzes] ([quiz_id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[quiz_questions] CHECK CONSTRAINT [fk_question_quiz]
GO
ALTER TABLE [dbo].[reports]  WITH CHECK ADD  CONSTRAINT [fk_report_document] FOREIGN KEY([document_id])
REFERENCES [dbo].[documents] ([document_id])
GO
ALTER TABLE [dbo].[reports] CHECK CONSTRAINT [fk_report_document]
GO
ALTER TABLE [dbo].[reports]  WITH CHECK ADD  CONSTRAINT [fk_report_user] FOREIGN KEY([reported_by])
REFERENCES [dbo].[users] ([user_id])
GO
ALTER TABLE [dbo].[reports] CHECK CONSTRAINT [fk_report_user]
GO
ALTER TABLE [dbo].[study_sessions]  WITH CHECK ADD  CONSTRAINT [fk_study_subject] FOREIGN KEY([subject_id])
REFERENCES [dbo].[subjects] ([subject_id])
GO
ALTER TABLE [dbo].[study_sessions] CHECK CONSTRAINT [fk_study_subject]
GO
ALTER TABLE [dbo].[study_sessions]  WITH CHECK ADD  CONSTRAINT [fk_study_user] FOREIGN KEY([user_id])
REFERENCES [dbo].[users] ([user_id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[study_sessions] CHECK CONSTRAINT [fk_study_user]
GO
ALTER TABLE [dbo].[upload_logs]  WITH CHECK ADD  CONSTRAINT [fk_upload_document] FOREIGN KEY([document_id])
REFERENCES [dbo].[documents] ([document_id])
GO
ALTER TABLE [dbo].[upload_logs] CHECK CONSTRAINT [fk_upload_document]
GO
ALTER TABLE [dbo].[upload_logs]  WITH CHECK ADD  CONSTRAINT [fk_upload_user] FOREIGN KEY([user_id])
REFERENCES [dbo].[users] ([user_id])
GO
ALTER TABLE [dbo].[upload_logs] CHECK CONSTRAINT [fk_upload_user]
GO
ALTER TABLE [dbo].[user_achievements]  WITH CHECK ADD  CONSTRAINT [fk_user_achievement] FOREIGN KEY([achievement_id])
REFERENCES [dbo].[achievements] ([achievement_id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[user_achievements] CHECK CONSTRAINT [fk_user_achievement]
GO
ALTER TABLE [dbo].[user_achievements]  WITH CHECK ADD  CONSTRAINT [fk_user_achievement_user] FOREIGN KEY([user_id])
REFERENCES [dbo].[users] ([user_id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[user_achievements] CHECK CONSTRAINT [fk_user_achievement_user]
GO
ALTER TABLE [dbo].[user_roles]  WITH CHECK ADD  CONSTRAINT [fk_user_roles_role] FOREIGN KEY([role_id])
REFERENCES [dbo].[roles] ([role_id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[user_roles] CHECK CONSTRAINT [fk_user_roles_role]
GO
ALTER TABLE [dbo].[user_roles]  WITH CHECK ADD  CONSTRAINT [fk_user_roles_user] FOREIGN KEY([user_id])
REFERENCES [dbo].[users] ([user_id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[user_roles] CHECK CONSTRAINT [fk_user_roles_user]
GO
ALTER TABLE [dbo].[user_settings]  WITH CHECK ADD  CONSTRAINT [fk_user_settings_user] FOREIGN KEY([user_id])
REFERENCES [dbo].[users] ([user_id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[user_settings] CHECK CONSTRAINT [fk_user_settings_user]
GO
ALTER TABLE [dbo].[chat_messages]  WITH CHECK ADD  CONSTRAINT [chk_message_sender] CHECK  (([sender]='AI' OR [sender]='USER'))
GO
ALTER TABLE [dbo].[chat_messages] CHECK CONSTRAINT [chk_message_sender]
GO
ALTER TABLE [dbo].[document_contents]  WITH CHECK ADD  CONSTRAINT [chk_extraction_status] CHECK  (([extraction_status]='FAILED' OR [extraction_status]='SUCCESS' OR [extraction_status]='PENDING'))
GO
ALTER TABLE [dbo].[document_contents] CHECK CONSTRAINT [chk_extraction_status]
GO
ALTER TABLE [dbo].[document_shares]  WITH CHECK ADD  CONSTRAINT [chk_share_permission] CHECK  (([permission]='EDIT' OR [permission]='DOWNLOAD' OR [permission]='VIEW'))
GO
ALTER TABLE [dbo].[document_shares] CHECK CONSTRAINT [chk_share_permission]
GO
ALTER TABLE [dbo].[documents]  WITH CHECK ADD  CONSTRAINT [chk_documents_status] CHECK  (([status]='REJECTED' OR [status]='PENDING_REVIEW' OR [status]='DELETED' OR [status]='ACTIVE'))
GO
ALTER TABLE [dbo].[documents] CHECK CONSTRAINT [chk_documents_status]
GO
ALTER TABLE [dbo].[documents]  WITH CHECK ADD  CONSTRAINT [chk_documents_visibility] CHECK  (([visibility]='SHARED' OR [visibility]='PUBLIC' OR [visibility]='PRIVATE'))
GO
ALTER TABLE [dbo].[documents] CHECK CONSTRAINT [chk_documents_visibility]
GO
ALTER TABLE [dbo].[flashcard_reviews]  WITH CHECK ADD  CONSTRAINT [chk_flashcard_review_rating] CHECK  (([rating]>=(1) AND [rating]<=(5)))
GO
ALTER TABLE [dbo].[flashcard_reviews] CHECK CONSTRAINT [chk_flashcard_review_rating]
GO
ALTER TABLE [dbo].[quiz_questions]  WITH CHECK ADD  CONSTRAINT [chk_correct_answer] CHECK  (([correct_answer]='D' OR [correct_answer]='C' OR [correct_answer]='B' OR [correct_answer]='A'))
GO
ALTER TABLE [dbo].[quiz_questions] CHECK CONSTRAINT [chk_correct_answer]
GO
ALTER TABLE [dbo].[reports]  WITH CHECK ADD  CONSTRAINT [chk_report_status] CHECK  (([status]='REJECTED' OR [status]='RESOLVED' OR [status]='PENDING'))
GO
ALTER TABLE [dbo].[reports] CHECK CONSTRAINT [chk_report_status]
GO
ALTER TABLE [dbo].[upload_logs]  WITH CHECK ADD  CONSTRAINT [chk_storage_provider] CHECK  (([storage_provider]='S3' OR [storage_provider]='LOCAL' OR [storage_provider]='SUPABASE'))
GO
ALTER TABLE [dbo].[upload_logs] CHECK CONSTRAINT [chk_storage_provider]
GO
ALTER TABLE [dbo].[upload_logs]  WITH CHECK ADD  CONSTRAINT [chk_upload_status] CHECK  (([upload_status]='FAILED' OR [upload_status]='SUCCESS' OR [upload_status]='UPLOADING'))
GO
ALTER TABLE [dbo].[upload_logs] CHECK CONSTRAINT [chk_upload_status]
GO
ALTER TABLE [dbo].[user_settings]  WITH CHECK ADD  CONSTRAINT [chk_user_settings_language] CHECK  (([language]='vi' OR [language]='en'))
GO
ALTER TABLE [dbo].[user_settings] CHECK CONSTRAINT [chk_user_settings_language]
GO
ALTER TABLE [dbo].[user_settings]  WITH CHECK ADD  CONSTRAINT [chk_user_settings_theme] CHECK  (([theme]='system' OR [theme]='dark' OR [theme]='light'))
GO
ALTER TABLE [dbo].[user_settings] CHECK CONSTRAINT [chk_user_settings_theme]
GO
ALTER TABLE [dbo].[users]  WITH CHECK ADD  CONSTRAINT [chk_users_status] CHECK  (([status]='DELETED' OR [status]='BANNED' OR [status]='INACTIVE' OR [status]='ACTIVE'))
GO
ALTER TABLE [dbo].[users] CHECK CONSTRAINT [chk_users_status]
GO

IF OBJECT_ID(N'[dbo].[workspaces]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[workspaces](
        [workspace_id] [bigint] IDENTITY(1,1) NOT NULL,
        [name] [nvarchar](150) NOT NULL,
        [description] [nvarchar](max) NULL,
        [invite_code] [varchar](20) NOT NULL,
        [owner_id] [bigint] NOT NULL,
        [status] [varchar](20) NOT NULL CONSTRAINT [DF_workspaces_status] DEFAULT ('ACTIVE'),
        [created_at] [datetime2](7) NOT NULL CONSTRAINT [DF_workspaces_created_at] DEFAULT (sysdatetime()),
        [updated_at] [datetime2](7) NOT NULL CONSTRAINT [DF_workspaces_updated_at] DEFAULT (sysdatetime()),
        CONSTRAINT [PK_workspaces] PRIMARY KEY CLUSTERED ([workspace_id] ASC),
        CONSTRAINT [UQ_workspaces_invite_code] UNIQUE ([invite_code]),
        CONSTRAINT [chk_workspaces_status] CHECK ([status] IN ('ACTIVE', 'ARCHIVED'))
    )
END
GO

IF OBJECT_ID(N'[dbo].[workspace_members]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[workspace_members](
        [workspace_id] [bigint] NOT NULL,
        [user_id] [bigint] NOT NULL,
        [role] [varchar](20) NOT NULL CONSTRAINT [DF_workspace_members_role] DEFAULT ('MEMBER'),
        [joined_at] [datetime2](7) NOT NULL CONSTRAINT [DF_workspace_members_joined_at] DEFAULT (sysdatetime()),
        CONSTRAINT [PK_workspace_members] PRIMARY KEY CLUSTERED ([workspace_id] ASC, [user_id] ASC),
        CONSTRAINT [chk_workspace_members_role] CHECK ([role] IN ('OWNER', 'MEMBER'))
    )
END
GO

IF OBJECT_ID(N'[dbo].[workspace_documents]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[workspace_documents](
        [workspace_id] [bigint] NOT NULL,
        [document_id] [bigint] NOT NULL,
        [added_by] [bigint] NOT NULL,
        [created_at] [datetime2](7) NOT NULL CONSTRAINT [DF_workspace_documents_created_at] DEFAULT (sysdatetime()),
        CONSTRAINT [PK_workspace_documents] PRIMARY KEY CLUSTERED ([workspace_id] ASC, [document_id] ASC)
    )
END
GO

IF OBJECT_ID(N'[dbo].[workspace_messages]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[workspace_messages](
        [message_id] [bigint] IDENTITY(1,1) NOT NULL,
        [workspace_id] [bigint] NOT NULL,
        [user_id] [bigint] NOT NULL,
        [content] [nvarchar](max) NOT NULL,
        [created_at] [datetime2](7) NOT NULL CONSTRAINT [DF_workspace_messages_created_at] DEFAULT (sysdatetime()),
        CONSTRAINT [PK_workspace_messages] PRIMARY KEY CLUSTERED ([message_id] ASC)
    )
END
GO

IF OBJECT_ID(N'[dbo].[fk_workspace_owner]', N'F') IS NULL
BEGIN
    ALTER TABLE [dbo].[workspaces] WITH CHECK ADD CONSTRAINT [fk_workspace_owner]
    FOREIGN KEY([owner_id]) REFERENCES [dbo].[users] ([user_id])
END
GO

IF OBJECT_ID(N'[dbo].[fk_workspace_member_workspace]', N'F') IS NULL
BEGIN
    ALTER TABLE [dbo].[workspace_members] WITH CHECK ADD CONSTRAINT [fk_workspace_member_workspace]
    FOREIGN KEY([workspace_id]) REFERENCES [dbo].[workspaces] ([workspace_id]) ON DELETE CASCADE
END
GO

IF OBJECT_ID(N'[dbo].[fk_workspace_member_user]', N'F') IS NULL
BEGIN
    ALTER TABLE [dbo].[workspace_members] WITH CHECK ADD CONSTRAINT [fk_workspace_member_user]
    FOREIGN KEY([user_id]) REFERENCES [dbo].[users] ([user_id]) ON DELETE CASCADE
END
GO

IF OBJECT_ID(N'[dbo].[fk_workspace_document_workspace]', N'F') IS NULL
BEGIN
    ALTER TABLE [dbo].[workspace_documents] WITH CHECK ADD CONSTRAINT [fk_workspace_document_workspace]
    FOREIGN KEY([workspace_id]) REFERENCES [dbo].[workspaces] ([workspace_id]) ON DELETE CASCADE
END
GO

IF OBJECT_ID(N'[dbo].[fk_workspace_document_document]', N'F') IS NULL
BEGIN
    ALTER TABLE [dbo].[workspace_documents] WITH CHECK ADD CONSTRAINT [fk_workspace_document_document]
    FOREIGN KEY([document_id]) REFERENCES [dbo].[documents] ([document_id]) ON DELETE CASCADE
END
GO

IF OBJECT_ID(N'[dbo].[fk_workspace_document_user]', N'F') IS NULL
BEGIN
    ALTER TABLE [dbo].[workspace_documents] WITH CHECK ADD CONSTRAINT [fk_workspace_document_user]
    FOREIGN KEY([added_by]) REFERENCES [dbo].[users] ([user_id])
END
GO

IF OBJECT_ID(N'[dbo].[fk_workspace_message_workspace]', N'F') IS NULL
BEGIN
    ALTER TABLE [dbo].[workspace_messages] WITH CHECK ADD CONSTRAINT [fk_workspace_message_workspace]
    FOREIGN KEY([workspace_id]) REFERENCES [dbo].[workspaces] ([workspace_id]) ON DELETE CASCADE
END
GO

IF OBJECT_ID(N'[dbo].[fk_workspace_message_user]', N'F') IS NULL
BEGIN
    ALTER TABLE [dbo].[workspace_messages] WITH CHECK ADD CONSTRAINT [fk_workspace_message_user]
    FOREIGN KEY([user_id]) REFERENCES [dbo].[users] ([user_id])
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_workspace_members_user' AND object_id = OBJECT_ID(N'[dbo].[workspace_members]'))
BEGIN
    CREATE INDEX [idx_workspace_members_user] ON [dbo].[workspace_members]([user_id])
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_workspace_documents_document' AND object_id = OBJECT_ID(N'[dbo].[workspace_documents]'))
BEGIN
    CREATE INDEX [idx_workspace_documents_document] ON [dbo].[workspace_documents]([document_id])
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_workspace_messages_workspace_created' AND object_id = OBJECT_ID(N'[dbo].[workspace_messages]'))
BEGIN
    CREATE INDEX [idx_workspace_messages_workspace_created] ON [dbo].[workspace_messages]([workspace_id], [created_at])
END
GO

IF OBJECT_ID(N'[dbo].[user_presence]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[user_presence](
        [user_id] [bigint] NOT NULL,
        [last_seen_at] [datetime2](7) NOT NULL CONSTRAINT [DF_user_presence_last_seen_at] DEFAULT (sysdatetime()),
        CONSTRAINT [PK_user_presence] PRIMARY KEY CLUSTERED ([user_id] ASC)
    )
END
GO

IF OBJECT_ID(N'[dbo].[forum_posts]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[forum_posts](
        [post_id] [bigint] IDENTITY(1,1) NOT NULL,
        [author_id] [bigint] NOT NULL,
        [document_id] [bigint] NULL,
        [title] [nvarchar](255) NOT NULL,
        [content] [nvarchar](max) NULL,
        [post_type] [varchar](20) NOT NULL CONSTRAINT [DF_forum_posts_post_type] DEFAULT ('DISCUSSION'),
        [status] [varchar](20) NOT NULL CONSTRAINT [DF_forum_posts_status] DEFAULT ('ACTIVE'),
        [created_at] [datetime2](7) NOT NULL CONSTRAINT [DF_forum_posts_created_at] DEFAULT (sysdatetime()),
        [updated_at] [datetime2](7) NOT NULL CONSTRAINT [DF_forum_posts_updated_at] DEFAULT (sysdatetime()),
        CONSTRAINT [PK_forum_posts] PRIMARY KEY CLUSTERED ([post_id] ASC),
        CONSTRAINT [chk_forum_posts_type] CHECK ([post_type] IN ('QUESTION', 'DISCUSSION', 'DOCUMENT')),
        CONSTRAINT [chk_forum_posts_status] CHECK ([status] IN ('ACTIVE', 'DELETED'))
    )
END
GO

IF OBJECT_ID(N'[dbo].[forum_answers]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[forum_answers](
        [answer_id] [bigint] IDENTITY(1,1) NOT NULL,
        [post_id] [bigint] NOT NULL,
        [user_id] [bigint] NOT NULL,
        [content] [nvarchar](max) NOT NULL,
        [status] [varchar](20) NOT NULL CONSTRAINT [DF_forum_answers_status] DEFAULT ('ACTIVE'),
        [created_at] [datetime2](7) NOT NULL CONSTRAINT [DF_forum_answers_created_at] DEFAULT (sysdatetime()),
        [updated_at] [datetime2](7) NOT NULL CONSTRAINT [DF_forum_answers_updated_at] DEFAULT (sysdatetime()),
        CONSTRAINT [PK_forum_answers] PRIMARY KEY CLUSTERED ([answer_id] ASC),
        CONSTRAINT [chk_forum_answers_status] CHECK ([status] IN ('ACTIVE', 'DELETED'))
    )
END
GO

IF OBJECT_ID(N'[dbo].[fk_user_presence_user]', N'F') IS NULL
BEGIN
    ALTER TABLE [dbo].[user_presence] WITH CHECK ADD CONSTRAINT [fk_user_presence_user]
    FOREIGN KEY([user_id]) REFERENCES [dbo].[users] ([user_id]) ON DELETE CASCADE
END
GO

IF OBJECT_ID(N'[dbo].[fk_forum_post_author]', N'F') IS NULL
BEGIN
    ALTER TABLE [dbo].[forum_posts] WITH CHECK ADD CONSTRAINT [fk_forum_post_author]
    FOREIGN KEY([author_id]) REFERENCES [dbo].[users] ([user_id])
END
GO

IF OBJECT_ID(N'[dbo].[fk_forum_post_document]', N'F') IS NULL
BEGIN
    ALTER TABLE [dbo].[forum_posts] WITH CHECK ADD CONSTRAINT [fk_forum_post_document]
    FOREIGN KEY([document_id]) REFERENCES [dbo].[documents] ([document_id])
END
GO

IF OBJECT_ID(N'[dbo].[fk_forum_answer_post]', N'F') IS NULL
BEGIN
    ALTER TABLE [dbo].[forum_answers] WITH CHECK ADD CONSTRAINT [fk_forum_answer_post]
    FOREIGN KEY([post_id]) REFERENCES [dbo].[forum_posts] ([post_id]) ON DELETE CASCADE
END
GO

IF OBJECT_ID(N'[dbo].[fk_forum_answer_user]', N'F') IS NULL
BEGIN
    ALTER TABLE [dbo].[forum_answers] WITH CHECK ADD CONSTRAINT [fk_forum_answer_user]
    FOREIGN KEY([user_id]) REFERENCES [dbo].[users] ([user_id])
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_forum_posts_created' AND object_id = OBJECT_ID(N'[dbo].[forum_posts]'))
BEGIN
    CREATE INDEX [idx_forum_posts_created] ON [dbo].[forum_posts]([created_at] DESC)
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_forum_posts_type' AND object_id = OBJECT_ID(N'[dbo].[forum_posts]'))
BEGIN
    CREATE INDEX [idx_forum_posts_type] ON [dbo].[forum_posts]([post_type])
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_forum_answers_post_created' AND object_id = OBJECT_ID(N'[dbo].[forum_answers]'))
BEGIN
    CREATE INDEX [idx_forum_answers_post_created] ON [dbo].[forum_answers]([post_id], [created_at])
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_forum_answers_user_created' AND object_id = OBJECT_ID(N'[dbo].[forum_answers]'))
BEGIN
    CREATE INDEX [idx_forum_answers_user_created] ON [dbo].[forum_answers]([user_id], [created_at])
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_user_presence_last_seen' AND object_id = OBJECT_ID(N'[dbo].[user_presence]'))
BEGIN
    CREATE INDEX [idx_user_presence_last_seen] ON [dbo].[user_presence]([last_seen_at] DESC)
END
GO
