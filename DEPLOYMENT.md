# Deploying Guitar Harmony to Vercel

Your app is now configured to work with Vercel! Here's how to deploy it:

## Prerequisites

- A Vercel account (sign up at [vercel.com](https://vercel.com))
- Your code pushed to a Git repository (GitHub, GitLab, or Bitbucket)

## Deployment Steps

### 1. Connect Your Repository to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your Git repository
3. Vercel will auto-detect Next.js settings ✅

### 2. Add Postgres Database (via Neon)

1. In your Vercel project dashboard, go to the **Marketplace** tab
2. Find **Neon** (Serverless Postgres) - it's the recommended option
3. Click **Add** or **Connect**
4. Follow the prompts to create a Neon account (if needed) and database
5. Choose a database name (e.g., "guitar-harmony-db")
6. Click **Create & Connect**
7. Vercel will automatically add the `POSTGRES_URL` environment variable
   - Note: Neon also provides connection pooling and other optimization features

**Alternative:** You can also use Prisma Postgres, Supabase, or any other Postgres provider from the marketplace. The app works with any standard PostgreSQL database.

### 3. Add Blob Storage

Vercel Blob is still available in the Storage tab:

1. In your Vercel project dashboard, go to the **Storage** tab
2. Click **Create** and select **Blob**
3. Choose a store name (e.g., "guitar-files")
4. Click **Create**
5. Vercel will automatically add:
   - `BLOB_READ_WRITE_TOKEN`

### 4. Set Your Password (Required!)

Your app now has built-in password protection. Set your password:

1. In Vercel dashboard, go to **Settings** → **Environment Variables**
2. Click **Add New**
3. Set:
   - **Name:** `AUTH_PASSWORD`
   - **Value:** Your desired password (e.g., "MySecretPass123")
   - **Environment:** Production, Preview, Development (check all)
4. Click **Save**

**Important:** After adding the password, you must **redeploy** for it to take effect:

- Go to **Deployments** → Click **⋮** on latest → **Redeploy**

**How it works:**

- Anyone visiting your site will see a password prompt
- Password is saved in a cookie for 30 days
- No need to re-enter on the same device/browser
- Default password is `guitar123` if you don't set AUTH_PASSWORD

### 5. Deploy!

1. Click **Deploy** in the Vercel dashboard (or go to **Deployments** tab)
2. Wait for the build to complete (~2-3 minutes)
3. Your app will be live at `https://your-project.vercel.app` 🎉

### 6. First Visit Setup

When you first visit your deployed app, you'll see a password prompt. Enter your password (or `guitar123` if you haven't set AUTH_PASSWORD yet), and you'll be logged in for 30 days.

## Environment Variables Summary

Required environment variables:

- **`POSTGRES_URL`** - Automatically set when you add Neon database
- **`BLOB_READ_WRITE_TOKEN`** - Automatically set when you add Vercel Blob
- **`AUTH_PASSWORD`** - You must set this manually (your app password)

## Local Development

If you want to test with Vercel services locally:

1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel login`
3. Run `vercel link` in your project directory
4. Run `vercel env pull .env.local` to download environment variables
5. Start your dev server: `npm run dev`

**For local testing without setting up Vercel:**

- The default password is `guitar123` if AUTH_PASSWORD is not set
- Visit `http://localhost:3000` and enter the password

## What Changed from SQLite?

- **Database**: SQLite → Vercel Postgres
- **File Storage**: Local filesystem → Vercel Blob (cloud storage)
- **Files Changed**:
  - Created `lib/db-postgres.ts` (new Postgres module)
  - Updated all `/api` routes to use async/await and Postgres
  - Updated file upload/download to use Vercel Blob
  - Old `lib/db.ts` is kept for reference (not used anymore)

## Troubleshooting

**Database not initializing?**

- Tables are created on first API call
- Check Vercel logs for errors
- Verify Postgres environment variables are set

**File uploads failing?**

- Verify `BLOB_READ_WRITE_TOKEN` is set
- Check file size limits (Vercel Blob free tier: 500MB total)

**Can't connect locally?**

- Run `vercel env pull .env.local` to get environment variables
- Make sure `.env.local` is in your `.gitignore`

## Cost Information

- **Vercel Hobby (Free) Plan:**

  - Postgres: 60 hours compute/month, 256MB storage
  - Blob: 500MB total storage
  - Bandwidth: 100GB/month
  - Perfect for personal use!

- **Pro Plan** ($20/month):
  - More compute, storage, and bandwidth
  - Custom domains
  - Team collaboration

Your app should work perfectly on the free tier for personal use! 🎸
