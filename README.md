# Writing Assistant

A minimal, AI-powered writing interface that helps you create content and automatically formats it for different platforms (LinkedIn, X, Newsletter, YouTube).

## Features

### ✍️ Minimal Writing Interface
- Clean, distraction-free WYSIWYG editor powered by TipTap
- White background, no borders, minimal toolbar
- Auto-save functionality with draft management
- Document organization with folder system

### 🤖 AI-Powered Suggestions
- Real-time contextual suggestions as you write
- Pulls from your personal context database
- References previous writings and uploaded documents
- Helps remember facts, stories, and ideas

### 📄 Context Database
- Upload PDF and DOCX documents to build your knowledge base
- AI analyzes and references your personal content
- Secure storage using Wasabi S3
- Easy document management interface

### 🎯 Multi-Format Publishing
- Automatically transforms content for different platforms:
  - **LinkedIn**: Professional posts with hashtags and CTAs
  - **X (Twitter)**: Threaded tweets with optimal character counts
  - **Newsletter**: Email-friendly format with sections
  - **YouTube**: Video scripts with engagement prompts
- Custom prompts and context files for each format
- Review and approve generated content before publishing

### 📅 Content Calendar
- Automated scheduling based on posting rules
- Visual calendar view of all scheduled content
- Copy-to-clipboard functionality for each platform
- Track published vs. scheduled content

## Setup Instructions

### 1. Environment Configuration

Copy the example environment file and configure your settings:

```bash
cp .env.example .env.local
```

Update `.env.local` with your configuration:

```env
# Database
DATABASE_URL="file:./dev.db"

# OpenAI API Key (required for AI suggestions and format generation)
OPENAI_API_KEY=your_openai_api_key_here

# Wasabi S3 Configuration (for PDF storage)
WASABI_ACCESS_KEY_ID=your_wasabi_access_key
WASABI_SECRET_ACCESS_KEY=your_wasabi_secret_key
WASABI_BUCKET_NAME=your_bucket_name
WASABI_REGION=us-east-1
WASABI_ENDPOINT=https://s3.us-east-1.wasabisys.com
```

### 2. Database Setup

Initialize the database:

```bash
npx prisma db push
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run the Application

```bash
npm run dev
```

Visit `http://localhost:3000` to start using the writing assistant.

## 🚀 Railway Deployment

For production deployment on Railway, see the detailed [Railway Deployment Guide](./RAILWAY_DEPLOY.md).

**Quick Railway Setup:**
1. Connect your GitHub repo to Railway
2. Add PostgreSQL database service
3. Set environment variables (OpenAI API key, Wasabi credentials)
4. Deploy automatically
5. Run `npm run db:deploy` to initialize database

## How to Use

### 1. Start Writing
- Click "New Document" or "Start Writing" to open the minimal editor
- Begin typing your thoughts - the interface is completely clean and distraction-free
- AI suggestions will appear on the right as you write more content

### 2. Build Your Context Database
- Click the "Context Library" button (available on all pages)
- Upload PDF and DOCX documents containing your personal writing, stories, and context
- The AI will reference this content to provide better suggestions across all your writing

### 3. Save and Organize
- Documents auto-save as drafts while you write
- Use the sidebar to organize documents in folders
- Edit saved documents by selecting them from the sidebar

### 4. Generate Formats
- When ready to publish, click "Push to Formats"
- The AI will automatically generate platform-specific versions
- Review each format and approve the ones you like

### 5. Schedule and Publish
- Approved formats are automatically added to your content calendar
- View the calendar to see all scheduled posts
- Copy content directly to paste into each platform

## Technical Architecture

- **Frontend**: Next.js 14 with TypeScript and Tailwind CSS
- **Editor**: TipTap for minimal WYSIWYG experience
- **Database**: SQLite with Prisma ORM
- **AI**: OpenAI GPT-4 for suggestions and format generation
- **Storage**: Wasabi S3 for PDF document storage
- **UI Components**: Radix UI and Lucide icons

## Platform-Specific Formatting

### LinkedIn Posts
- Professional tone with clear hooks
- Optimal hashtag usage (3-5 tags)
- Call-to-action for engagement
- Under 1300 characters for best reach

### X (Twitter) Threads
- Broken into digestible tweets (<280 chars)
- Numbered thread format (1/n, 2/n, etc.)
- Strategic hashtag placement
- Engaging hook and summary

### Newsletter Format
- Compelling subject lines
- Scannable sections with headers
- Conversational, friendly tone
- Clear call-to-action

### YouTube Scripts
- Strong 15-second hook
- Natural, spoken language
- Engagement prompts throughout
- Suggested timestamps and title

## Customization

You can customize the format prompts and posting rules by:

1. Accessing the format management interface
2. Editing the default prompts for each platform
3. Uploading additional context files for specific formats
4. Adjusting posting frequency and timing rules

## Support

For issues or questions, please check the application logs or create an issue in the project repository.