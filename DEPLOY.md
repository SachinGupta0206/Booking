# Production Deployment Guide

## Prerequisites

- GitHub account (to push this repo)
- [Render](https://render.com) account (backend hosting, free tier available)
- [Vercel](https://vercel.com) account (frontend hosting, free tier available)
- Supabase project already set up with the schema from `database/schema.sql`

---

## Step-by-Step Deployment

### 1️⃣ Push to GitHub

```bash
cd "c:\Users\Sonam Gupta\Desktop\Booking"
git init
git add .
git commit -m "Initial commit: Event Booking App"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

---

### 2️⃣ Deploy Backend to Render

#### Manual Web Service (Recommended)

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **New +** → **Web Service**
3. Connect your GitHub repo
4. Configure:
   - **Name**: `event-booking-api`
   - **Region**: Oregon (or closest to you)
   - **Root Directory**: `backend`
   - **Environment**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free
5. Add **Environment Variables**:
   - `NODE_VERSION` = `20.14.0`
   - `SUPABASE_URL` = `https://heysljqldxsttsqzdnnf.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY` = (paste your full key)
   - `FRONTEND_URL` = `http://localhost:5173` (update after Step 3)
6. Click **Create Web Service**
7. Wait 3-5 minutes for the build to complete
8. Once deployed, copy the backend URL (e.g., `https://event-booking-api.onrender.com`)
9. Test it: `curl https://event-booking-api.onrender.com/health` → should return `{"status":"ok"}`

**Note:** If the build fails with "Cannot find package.json", double-check **Root Directory** is set to `backend` exactly.

---

### 3️⃣ Deploy Frontend to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/new)
2. Click **Import Project** → **Continue with GitHub**
3. Select your repo
4. Configure:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Vite (auto-detected)
   - **Build Command**: `npm run build` (auto-filled)
   - **Output Directory**: `dist` (auto-filled)
5. Add **Environment Variable**:
   - `VITE_API_URL` = `https://event-booking-api.onrender.com` (your Render URL from Step 2)
6. Click **Deploy**
7. Once deployed, copy the Vercel URL (e.g., `https://booking-app-xyz.vercel.app`)

---

### 4️⃣ Update Backend CORS (Critical!)

Your backend currently allows CORS only from `http://localhost:5173`. Update it to your Vercel URL:

1. Go back to [Render Dashboard](https://dashboard.render.com)
2. Open your `event-booking-api` service
3. Go to **Environment** tab
4. Update `FRONTEND_URL` = `https://booking-app-xyz.vercel.app` (your Vercel URL from Step 3)
5. Click **Save Changes** → Render auto-redeploys

---

### 5️⃣ Test Production

1. Open your Vercel URL: `https://booking-app-xyz.vercel.app`
2. Click **+ New event** → create an event
3. Click **Book** → book seats → verify the count updates
4. Click **View bookings** → verify the admin panel works
5. Cancel a booking → verify seats are freed
6. Book all remaining seats → verify "Sold out" badge appears

---

## Troubleshooting

### Frontend can't reach backend (CORS error)

- Check `VITE_API_URL` in Vercel env vars matches your Render URL exactly (no trailing slash)
- Check `FRONTEND_URL` in Render env vars matches your Vercel URL exactly
- Open browser DevTools → Network tab → check the request URL

### Backend errors 500 on booking

- Check Render logs: Dashboard → your service → Logs tab
- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are correct
- Verify you ran `database/schema.sql` in Supabase

### "Event not found" on valid event

- The Supabase service role key might be wrong
- Check Render logs for database connection errors

### Vercel build fails

- Check the build logs in Vercel dashboard
- Verify `frontend/package.json` has all dependencies
- Try deploying from CLI: `npx vercel --prod`

---

## Environment Variables Reference

### Backend (Render)

```bash
SUPABASE_URL=https://heysljqldxsttsqzdnnf.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhleXNsanFsZHhzdHRzcXpkbm5mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MzEwOTEyMywiZXhwIjoyMTA4Njg1MTIzfQ.mExOlcFpPgliP_BLmkFcezf2uN4XUP_8YxBjPwNEGqA
FRONTEND_URL=https://your-app.vercel.app  # UPDATE THIS
NODE_VERSION=20.14.0
# PORT is auto-injected by Render
```

### Frontend (Vercel)

```bash
VITE_API_URL=https://your-api.onrender.com  # UPDATE THIS
```

---

## Post-Deployment

### Monitor your app

- **Render logs**: Dashboard → event-booking-api → Logs
- **Vercel logs**: Dashboard → your project → Deployments → click a deployment → Function Logs
- **Supabase**: Dashboard → Database → check the `events` and `bookings` tables

### Free tier limits

- **Render Free**: Spins down after 15 min of inactivity (first request wakes it ~30s delay)
- **Vercel Free**: 100 GB bandwidth/month, unlimited deployments
- **Supabase Free**: 500 MB database, 2 GB bandwidth/month

### Next steps

- Set up a custom domain in Vercel
- Add monitoring (e.g., Sentry for error tracking)
- Set up a staging environment (Vercel Preview Deployments handle this automatically)

---

## Quick Links

- [Render Dashboard](https://dashboard.render.com)
- [Vercel Dashboard](https://vercel.com/dashboard)
- [Supabase Dashboard](https://supabase.com/dashboard/project/heysljqldxsttsqzdnnf)
- [Your Backend Health Check](https://event-booking-api.onrender.com/health) (update URL)
- [Your Frontend](https://your-app.vercel.app) (update URL)
