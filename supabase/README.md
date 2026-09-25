# Sunbeam English School, Bhagwanpur — Supabase Backend Guide

This project includes a **Supabase PostgreSQL Backend** to manage all admission leads, parent enquiries, follow-ups, and CRM activity logs with Realtime synchronization.

---

## 🚀 Quick Setup in 3 Minutes

### Step 1: Create a Free Supabase Project
1. Go to [supabase.com](https://supabase.com) and click **"Start your project"**.
2. Sign in with GitHub or your email.
3. Click **"New Project"**, select your organization, and fill in:
   - **Name**: `sunbeam-school-crm` (or your choice)
   - **Database Password**: Set a secure password
   - **Region**: Select closest to your users (e.g. `South Asia (Mumbai)` or nearest)
4. Click **"Create new project"** and wait ~1-2 minutes for provisioning.

---

### Step 2: Run the Database Schema Migration
1. In your Supabase dashboard, click **"SQL Editor"** from the left sidebar.
2. Click **"New query"**.
3. Copy the entire contents of [`supabase/schema.sql`](schema.sql) and paste it into the editor.
4. Click **"Run"** (or press `Ctrl+Enter`).
5. You should see `Success. No rows returned`.

This creates:
- ✅ `public.leads` table (all admission & contact form submissions with grade, priority, status, contact details).
- ✅ `public.lead_activities` table (counselor notes, call logs, WhatsApp records, status history).
- ✅ Automated triggers (`updated_at` timestamps & automatic status change audit logging).
- ✅ Row Level Security (RLS) policies allowing public website submissions and CRM dashboard management.
- ✅ Realtime publication enabled so new enquiries pop up in the CRM instantly without page refresh!
- ✅ Sample seed leads from Bhagwanpur / Varanasi for instant testing.

---

### Step 3: Get Your Project URL and Anon Public Key
1. In your Supabase dashboard, navigate to **Project Settings** (gear icon at bottom-left) &rarr; **API**.
2. Under **Project URL**, copy the URL (looks like `https://abcdefghijkl.supabase.co`).
3. Under **Project API keys**, copy the `anon` / `public` key (starts with `eyJ...`).

---

### Step 4: Connect to Sunbeam School CRM
You have two simple ways to connect:

#### Option A: Direct in the CRM UI (Recommended)
1. Open [`crm.html`](../crm.html) in your browser (e.g. `http://localhost:8080/crm.html`).
2. Click the **"⚙️ Supabase Settings"** button in the top right bar.
3. Paste your **Project URL** and **Anon Key**.
4. Click **"Test & Save Connection"**.
5. The badge will turn **🟢 Live Supabase Connected**!

#### Option B: Configure in Code
Open [`js/supabase-client.js`](../js/supabase-client.js) and update:
```javascript
const DEFAULT_SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
```

---

## 📊 Features Included in the CRM
- **Kanban Board**: Drag or move leads through 6 admissions stages (*New Inquiry &rarr; Contacted &rarr; Campus Visit &rarr; Assessment &rarr; Enrolled &rarr; Dropped*).
- **Direct WhatsApp Integration**: 1-click WhatsApp message to parents with a prefilled school greeting.
- **Direct Phone Call**: 1-click `tel:` link.
- **Notes & Timeline**: Counselors can log call notes, tour feedback, and parent interactions.
- **Analytics & Funnel**: Real-time breakdown of enquiries by class, source, and conversion rate.
- **CSV Export**: Export all filtered leads to CSV for school administration reports.
- **Offline / Local Fallback**: If offline or before Supabase credentials are input, the CRM stores data in `localStorage` so you never lose an enquiry.
