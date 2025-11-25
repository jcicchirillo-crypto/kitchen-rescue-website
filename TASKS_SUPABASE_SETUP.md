# Tasks Supabase Setup

## What Was Implemented

The task planner now uses **Supabase** for storage instead of localStorage. This allows tasks to sync across all your devices (laptop, phone, tablet).

## Setup Steps

### 1. Create Tables in Supabase

1. Go to https://supabase.com/dashboard
2. Select your project
3. Click on **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy and paste the contents of `SUPABASE_TASKS_SETUP.sql`
6. Click **Run** to execute the query

This will create:
- `tasks` table - stores all your tasks
- `projects` table - stores your project list

### 2. Verify Tables Created

1. Go to **Table Editor** in Supabase
2. You should see `tasks` and `projects` tables
3. They should be empty initially

### 3. Deploy

The code is already updated! Just:
1. Push your changes to GitHub
2. Vercel will automatically deploy
3. Tasks will now sync to Supabase

## How It Works

- **Tasks sync automatically** - Any change (add, edit, delete, move) saves to Supabase
- **Works across devices** - Access your tasks from laptop, phone, or tablet
- **Backup included** - Still saves to localStorage as backup
- **Auto-loads** - Tasks load from Supabase when you log in

## Features

✅ Tasks sync across all devices  
✅ Projects sync across all devices  
✅ Real-time updates (refresh to see changes from other devices)  
✅ Automatic backup to localStorage  
✅ Works on Vercel (serverless compatible)  

## Migration

- **Existing tasks**: If you had tasks in localStorage, they'll be loaded on first login and then saved to Supabase
- **New tasks**: All new tasks go directly to Supabase
- **No data loss**: localStorage is used as backup if API fails

## Testing

1. Create a task on your laptop
2. Open the planner on your phone
3. Refresh the page
4. You should see the task you created on your laptop!

## Notes

- Tasks are stored in Supabase using the same admin client as bookings
- Uses service role key (bypasses RLS policies)
- All operations are authenticated with admin token

