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

### 4. Enable Password Protection (Recommended!)

Protect your app with a simple password - no code changes needed:

1. In your Vercel project dashboard, go to **Settings** → **Deployment Protection**
2. Enable **Password Protection** or **Vercel Authentication**
3. For **Password Protection** (simplest):
   - Toggle it on
   - Set a password (save it somewhere safe!)
   - Anyone visiting your site must enter this password
   - **Password is saved in browser** - you only need to enter it once per device/browser
4. Click **Save**

Now your app is protected! Only people with the password can access it. The password is remembered on each device, so you won't need to re-enter it every visit. Perfect for personal use without the complexity of user accounts.

### 5. Deploy!

1. Click **Deploy** in the Vercel dashboard (or go to **Deployments** tab)
2. Wait for the build to complete (~2-3 minutes)
3. Your app will be live at `https://your-project.vercel.app` 🎉

### 6. First Visit Setup

When you first visit your deployed app, the database tables will be created automatically, and 14 starter guitars will be seeded into your collection.

## Environment Variables Summary

All environment variables are automatically set by Vercel when you create the Postgres and Blob storage. You don't need to manually configure anything!

## Local Development

If you want to test with Vercel services locally:

1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel login`
3. Run `vercel link` in your project directory
4. Run `vercel env pull .env.local` to download environment variables
5. Start your dev server: `npm run dev`

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
