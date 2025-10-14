# Railway Deployment Guide

## Required Environment Variables

Set these environment variables in your Railway project dashboard:

### 🗄️ Database
```
DATABASE_URL=postgresql://username:password@hostname:port/database
```
**Note:** Railway will automatically provide this when you add a PostgreSQL database service.

### 🤖 OpenAI Configuration (Required)
```
OPENAI_API_KEY=sk-your-openai-api-key-here
```
Get your API key from: https://platform.openai.com/api-keys

### ☁️ Wasabi S3 Configuration (Required for PDF uploads)
```
WASABI_ACCESS_KEY_ID=your_wasabi_access_key
WASABI_SECRET_ACCESS_KEY=your_wasabi_secret_key
WASABI_BUCKET_NAME=your_bucket_name
WASABI_REGION=us-east-1
WASABI_ENDPOINT=https://s3.us-east-1.wasabisys.com
```

### 🔐 Next.js Configuration
```
NEXTAUTH_URL=https://your-railway-app-url.railway.app
NEXTAUTH_SECRET=your-random-secret-string-here
```

## Railway Deployment Steps

### 1. Create Railway Project
1. Go to [Railway.app](https://railway.app)
2. Connect your GitHub repository: `jonathanbodnar/contentsystem`
3. Railway will automatically detect it's a Next.js project

### 2. Add PostgreSQL Database
1. In your Railway project dashboard, click "New Service"
2. Select "Database" → "PostgreSQL"
3. Railway will automatically set the `DATABASE_URL` environment variable

### 3. Set Environment Variables
In your Railway project settings, add all the environment variables listed above.

### 4. Deploy
1. Railway will automatically build and deploy your app
2. After deployment, you'll need to run database migrations

### 5. Run Database Migrations
After first deployment, you need to initialize your database:

1. Go to your Railway project dashboard
2. Open the service terminal or use Railway CLI
3. Run: `npm run db:deploy`

This will create all the necessary database tables.

## Railway Configuration Files

The following files have been added/updated for Railway deployment:

- `railway.json` - Railway-specific configuration
- `Procfile` - Process file for deployment
- `package.json` - Updated with build scripts and Prisma generation
- `prisma/schema.prisma` - Updated to use PostgreSQL instead of SQLite

## Post-Deployment Setup

### 1. Test the Application
Visit your Railway app URL and verify:
- ✅ Homepage loads correctly
- ✅ Can create new documents
- ✅ Writing interface works
- ✅ AI suggestions appear (requires OpenAI API key)
- ✅ PDF upload works (requires Wasabi configuration)

### 2. Default Formats
The app will automatically create default publishing formats (LinkedIn, X, Newsletter, YouTube) on first use.

## Environment Variables Summary

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection (auto-provided by Railway) |
| `OPENAI_API_KEY` | ✅ | For AI suggestions and format generation |
| `WASABI_ACCESS_KEY_ID` | ✅ | For PDF storage |
| `WASABI_SECRET_ACCESS_KEY` | ✅ | For PDF storage |
| `WASABI_BUCKET_NAME` | ✅ | Your Wasabi bucket name |
| `WASABI_REGION` | ❌ | Defaults to us-east-1 |
| `WASABI_ENDPOINT` | ❌ | Defaults to us-east-1 endpoint |
| `NEXTAUTH_URL` | ❌ | Your Railway app URL |
| `NEXTAUTH_SECRET` | ❌ | Random secret string |

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL service is running in Railway
- Check that `DATABASE_URL` is automatically set
- Run `npm run db:deploy` after first deployment

### AI Suggestions Not Working
- Verify `OPENAI_API_KEY` is set correctly
- Check Railway logs for API errors
- Ensure you have OpenAI API credits

### PDF Upload Issues
- Verify all Wasabi environment variables are set
- Check that your Wasabi bucket exists and is accessible
- Ensure bucket permissions allow uploads

### Build Issues
- Check Railway build logs
- Ensure all dependencies are in `package.json`
- Verify Node.js version compatibility

## Railway CLI Commands (Optional)

Install Railway CLI for easier management:
```bash
npm install -g @railway/cli
railway login
railway link [your-project-id]
railway run npm run db:deploy
```
