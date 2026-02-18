# CLL - Comprehensive Technical Documentation

**Cloud Logic Limited - Lazada E-Commerce Management Platform**

Version: 1.1.0
Last Updated: January 27, 2026

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture & Tech Stack](#2-architecture--tech-stack)
3. [Prerequisites & Environment Setup](#3-prerequisites--environment-setup)
4. [Installation Guide](#4-installation-guide)
5. [Database Schema](#5-database-schema)
6. [Authentication & Authorization](#6-authentication--authorization)
7. [Complete API Reference](#7-complete-api-reference)
8. [File-by-File Documentation](#8-file-by-file-documentation)
9. [Frontend Components Guide](#9-frontend-components-guide)
10. [Backend Services Guide](#10-backend-services-guide)
11. [Data Flow & State Management](#11-data-flow--state-management)
12. [Lazada API Integration](#12-lazada-api-integration)
13. [Development Workflow](#13-development-workflow)
14. [Deployment Guide](#14-deployment-guide)
15. [Troubleshooting](#15-troubleshooting)
16. [Security Considerations](#16-security-considerations)

---

## 1. Project Overview

### 1.1 What is CLL?

CLL (Cloud Logic Limited) is a full-stack web application designed to manage Lazada seller operations. It provides a centralized dashboard for:

- Multi-account Lazada store management
- Order tracking and fulfillment
- Marketing campaign analytics
- Performance metrics visualization
- Data synchronization and caching
- Role-based team collaboration

### 1.2 Key Features

**Multi-Account Management**
- Connect multiple Lazada seller accounts via OAuth
- Switch between accounts seamlessly
- Automatic token refresh and management

**Order Management**
- View orders across all connected stores
- Filter by date range, status, account
- Search by order ID or customer
- Export to Excel (XLSX)
- Pagination support (20 items per page)
- OMS Status column (placeholder for Anchanto OMS integration)

**Fast Fulfillment (FFR)**
- Track ready-to-ship orders
- Monitor fulfillment performance
- Multi-account aggregation

**Data Insights & Analytics**
- Campaign performance metrics
- Pre-placement analysis reports
- Discovery reports by campaign/ad group
- Interactive chart visualizations (Recharts)
- Custom date range selection (default: 7 days)
- Excel export for analytics data

**Data Synchronization**
- Manual sync triggers for Orders, Campaigns, Metrics
- Background job scheduling (node-cron)
- Real-time sync status monitoring
- Sync history tracking
- Cached data service for performance

**Notification System**
- In-app notification bell in top navigation
- Real-time unread count badge
- Notification types: sync, success, error, info
- localStorage persistence across sessions
- Mark as read / mark all as read
- Currently used for sync events; extensible for future features

**User Management (Admin Only)**
- Create users with role assignment
- Three roles: Admin, Warehouse, Marketing
- Role-based page access control
- User profile management

### 1.3 System Requirements

**Development Environment**
- Node.js >= 18.0.0
- npm >= 9.0.0
- Git
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Code editor (VS Code recommended)

**Production Environment**
- Node.js hosting (Heroku, DigitalOcean, AWS, Railway, etc.)
- Static hosting for frontend (GitHub Pages, Vercel, Netlify)
- Supabase account (PostgreSQL database)
- Lazada Seller Center account with API access

---

## 2. Architecture & Tech Stack

### 2.1 System Architecture

```
+---------------------------------------------------------------------+
|                           USER ROLES                                 |
+---------------------+---------------------+-------------------------+
|       ADMIN         |      WAREHOUSE      |       MARKETING         |
|    (Full Access)    |   (Orders & FFR)    |    (Data Insights)      |
+---------------------+---------------------+-------------------------+
| - Dashboard         | - Dashboard         | - Dashboard             |
| - Orders            | - Orders            | - Data Insights         |
| - FFR               | - FFR               |                         |
| - Data Insights     |                     |                         |
| - Sync Dashboard    |                     |                         |
| - Settings          |                     |                         |
| - User Creation     |                     |                         |
+---------------------+---------------------+-------------------------+
                              |
                              v
+---------------------------------------------------------------------+
|                      CLIENT (Frontend)                               |
|  React 19 + Vite + TailwindCSS + React Router                       |
|  [Auth] [Pages] [Components] [Utils]                                |
+----------------------------------+----------------------------------+
                                   |
                                   | HTTPS / REST API
                                   | (JWT Bearer Token)
                                   v
+----------------------------------+----------------------------------+
|                      SERVER (Backend)                                |
|  Node.js + Express                                                   |
|  [Routes] [Services] [Utils] [Scheduler]                            |
+------------------+---------------------------+----------------------+
                   |                           |
                   | Supabase SDK              | HMAC-SHA256 Signed
                   | PostgreSQL                | Requests
                   v                           v
+---------------------------+    +--------------------------------+
|   SUPABASE (Database)     |    |  LAZADA OPEN PLATFORM API      |
|  - User Authentication    |    |  - Orders API                  |
|  - lazada_accounts        |    |  - Products API                |
|  - cached_orders          |    |  - Seller API                  |
|  - cached_campaigns       |    |  - Sponsor Solutions API       |
|  - cached_metrics         |    |  - OAuth 2.0 Authentication    |
|  - sync_logs              |    +--------------------------------+
|  - user_profiles          |
|  - user_preferences       |
+---------------------------+
```

### 2.2 Technology Stack

#### Frontend Stack
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.2.0 | UI library for building interactive interfaces |
| Vite | 7.2.2 | Build tool and dev server (fast HMR) |
| TailwindCSS | 3.4.0 | Utility-first CSS framework |
| React Router DOM | 7.9.6 | Client-side routing and navigation |
| Recharts | 3.6.0 | Data visualization and charting |
| Axios | 1.13.2+ | HTTP client for API requests |
| @supabase/supabase-js | 2.89.0 | Supabase client for auth & database |
| Lucide React | 0.555.0 | Icon library |
| @heroicons/react | 2.2.0 | Additional icon set |
| XLSX | 0.18.5 | Excel file generation and export |

#### Backend Stack
| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | >= 18.0.0 | JavaScript runtime |
| Express | 4.18.2 | Web framework for API routes |
| @supabase/supabase-js | 2.90.0 | Database operations |
| node-cron | 4.2.1 | Scheduled task execution |
| Axios | 1.6.2+ | HTTP client for Lazada API |
| CORS | 2.8.5 | Cross-origin resource sharing |
| dotenv | 16.3.1 | Environment variable management |
| crypto | built-in | HMAC-SHA256 signature generation |

#### Development Tools
| Tool | Purpose |
|------|---------|
| ESLint | Code quality and linting |
| Nodemon | Auto-reload server on changes |
| gh-pages | GitHub Pages deployment |
| concurrently | Run multiple npm scripts |

### 2.3 Folder Structure

```
cll/
|-- client/                          # Frontend React Application
|   |-- dist/                        # Production build output
|   |-- public/                      # Static assets
|   |   |-- vite.svg                # Vite logo
|   |   |-- 404.html                # 404 error page
|   |   +-- .nojekyll               # Disable Jekyll on GitHub Pages
|   |-- src/                        # Source code
|   |   |-- Auth/                   # Authentication components
|   |   |   |-- Login.jsx           # Login page with domain validation
|   |   |   +-- ForgotPassword.jsx  # Password reset page
|   |   |-- assets/                 # Images and static files
|   |   |   +-- react.svg
|   |   |-- components/             # Reusable UI components
|   |   |   |-- Sidebar.jsx         # Main navigation sidebar
|   |   |   |-- TopNav.jsx          # Top navigation bar
|   |   |   |-- DataCharts.jsx      # Chart visualizations
|   |   |   +-- SyncDashboard.jsx   # Data sync interface
|   |   |-- context/                # React Context providers
|   |   |   +-- AuthContext.jsx     # Legacy auth context
|   |   |-- hooks/                  # Custom React hooks
|   |   |   +-- useCachedData.js    # Hooks for cached data
|   |   |-- lib/                    # Library configurations
|   |   |   +-- supabase.js         # Supabase client setup
|   |   |-- pages/                  # Route pages
|   |   |   |-- Dashboard.jsx       # Main dashboard (placeholder)
|   |   |   |-- OrderItems.jsx      # Order management page
|   |   |   |-- Ffr.jsx            # Fast fulfillment page
|   |   |   |-- DataInsights.jsx   # Analytics dashboard
|   |   |   |-- Settings.jsx       # User settings page
|   |   |   |-- UserCreation.jsx   # User management (admin)
|   |   |   |-- LazadaAuth.jsx     # OAuth initiation page
|   |   |   |-- Callback.jsx       # OAuth callback handler
|   |   |   |-- Orders.jsx         # Legacy orders page
|   |   |   |-- Orders-Cached.jsx  # Cached orders variant
|   |   |   |-- DataAPI.jsx        # API data viewer
|   |   |   +-- Tiktok.jsx         # TikTok integration (placeholder)
|   |   |-- utils/                  # Utility functions
|   |   |   |-- AccountManager.jsx  # Lazada account management
|   |   |   |-- CachedDataService.js # Frontend caching service
|   |   |   +-- NotificationContext.jsx # Notification system provider
|   |   |-- App.jsx                # Main app component with routing
|   |   |-- App.css                # Global styles
|   |   |-- main.jsx               # Application entry point
|   |   +-- index.css              # Base CSS
|   |-- .env                       # Development environment variables
|   |-- .env.production            # Production environment variables
|   |-- .gitignore                 # Git ignore rules
|   |-- index.html                 # HTML template
|   |-- package.json               # Frontend dependencies
|   |-- postcss.config.js          # PostCSS configuration
|   |-- tailwind.config.js         # TailwindCSS configuration
|   +-- vite.config.js             # Vite build configuration
|
|-- server/                         # Backend Node.js Application
|   |-- routes/                    # API route handlers
|   |   +-- syncRoutes.js          # Data sync endpoints
|   |-- services/                  # Business logic layer
|   |   +-- syncService.js         # Sync service functions
|   |-- scheduler/                 # Cron job schedulers (empty)
|   |-- utils/                     # Utility functions
|   |   |-- lazadaAuth.js          # Lazada API authentication
|   |   +-- supabase.js            # Supabase database operations
|   |-- .env                       # Server environment variables
|   |-- package.json               # Backend dependencies
|   +-- server.js                  # Express server entry point
|
|-- database/                       # Database schemas
|   +-- supabase-cache-schema.sql  # PostgreSQL schema
|
|-- node_modules/                   # Root dependencies
|-- .git/                          # Git repository
|-- .gitignore                     # Root git ignore
|-- 404.html                       # Root 404 page
|-- eslint.config.js               # ESLint configuration
|-- package.json                   # Root package.json (workspace)
|-- package-lock.json              # Dependency lock file
|-- README.md                      # Project readme
+-- DOCUMENTATION.md               # This file
```

---

## 3. Prerequisites & Environment Setup

### 3.1 Required Accounts & Services

#### 3.1.1 Supabase Account
1. Sign up at https://supabase.com
2. Create a new project
3. Note down:
   - Project URL (e.g., `https://xxxxx.supabase.co`)
   - Anon/Public Key (for client)
   - Service Role Key (for server - keep secret!)

#### 3.1.2 Lazada Seller Center
1. Register as a seller at https://sellercenter.lazada.com
2. Apply for API access:
   - Go to Developer Center
   - Create an application
   - Note down:
     - App Key
     - App Secret
     - Choose API URL based on region:
       - Philippines: `https://api.lazada.com.ph/rest`
       - Singapore: `https://api.lazada.sg/rest`
       - Thailand: `https://api.lazada.co.th/rest`
       - Malaysia: `https://api.lazada.com.my/rest`
       - Vietnam: `https://api.lazada.vn/rest`
       - Indonesia: `https://api.lazada.co.id/rest`

#### 3.1.3 GitHub Account (Optional - for deployment)
- Required for GitHub Pages deployment
- Fork/clone the repository to your account

### 3.2 Software Installation

```bash
# Check Node.js version (must be >= 18.0.0)
node --version

# Check npm version (must be >= 9.0.0)
npm --version

# If not installed, download from https://nodejs.org

# Install Git
# macOS: brew install git
# Windows: https://git-scm.com/download/win
# Linux: sudo apt-get install git

git --version
```

### 3.3 Environment Variables Configuration

#### 3.3.1 Client Environment (.env)

Create `client/.env` for development:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# API Configuration
VITE_API_URL=http://localhost:5000/api

# Optional: App Configuration
VITE_APP_NAME=CLL Platform
VITE_APP_VERSION=1.0.0
```

Create `client/.env.production` for production:

```env
# Supabase Configuration (same as development)
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# Production API URL
VITE_API_URL=https://your-production-api.com/api

# Production App Configuration
VITE_APP_NAME=CLL Platform
VITE_APP_VERSION=1.0.0
```

#### 3.3.2 Server Environment (.env)

Create `server/.env`:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Lazada API Configuration
LAZADA_APP_KEY=your_app_key_here
LAZADA_APP_SECRET=your_app_secret_here
LAZADA_API_URL=https://api.lazada.com.ph/rest

# CORS Origins (comma-separated)
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,https://your-github-pages-url.github.io

# Optional: Cron Schedule
SYNC_CRON_SCHEDULE=0 */6 * * *
```

**Important Notes:**
- Never commit `.env` files to Git
- Keep `SUPABASE_SERVICE_ROLE_KEY` and `LAZADA_APP_SECRET` secure
- Use different Supabase projects for development and production
- Update `ALLOWED_ORIGINS` to include your production domain

---

## 4. Installation Guide

### 4.1 Clone the Repository

```bash
# Clone the repository
git clone <your-repository-url>
cd cll

# Or if you already have the code
cd path/to/cll
```

### 4.2 Install Dependencies

```bash
# Install all dependencies (root, client, server)
npm run install:all

# This runs:
# - npm install (root dependencies)
# - cd client && npm install
# - cd server && npm install
```

**Alternative: Manual Installation**

```bash
# Install root dependencies
npm install

# Install client dependencies
cd client
npm install
cd ..

# Install server dependencies
cd server
npm install
cd ..
```

### 4.3 Configure Environment Variables

1. Copy environment templates:

```bash
# Client
cp client/.env.example client/.env
cp client/.env.production.example client/.env.production

# Server
cp server/.env.example server/.env
```

2. Edit each file and fill in your credentials (see section 3.3)

### 4.4 Set Up Database

1. Log into your Supabase dashboard
2. Go to SQL Editor
3. Run the following schema to create tables:

```sql
-- See section 5.1 for complete schema
-- Execute the SQL provided in section 5.1
```

4. Verify tables were created:
   - lazada_accounts
   - user_profiles
   - user_preferences
   - cached_orders
   - cached_campaigns
   - cached_campaign_metrics
   - sync_logs
   - sync_settings

### 4.5 Create First Admin User

1. Go to Supabase Dashboard → Authentication → Users
2. Click "Add user"
3. Create user with email: `admin@cloudlogiclimited.com`
4. Set password
5. Go to SQL Editor and run:

```sql
-- Create admin user profile
INSERT INTO user_profiles (id, email, full_name, role)
VALUES (
  'user-id-from-auth-users',
  'admin@cloudlogiclimited.com',
  'Administrator',
  'admin'
);
```

### 4.6 Start Development Servers

```bash
# Run both client and server concurrently
npm run dev

# This starts:
# - Client at http://localhost:5173
# - Server at http://localhost:5000
```

**Alternative: Run Separately**

```bash
# Terminal 1: Start server
npm run dev:server

# Terminal 2: Start client
npm run dev:client
```

### 4.7 Verify Installation

1. Open browser to http://localhost:5173
2. You should see the login page
3. Log in with admin credentials
4. After login, you should see the sidebar and dashboard
5. Check browser console for any errors
6. Check server terminal for logs

### 4.8 Connect Your First Lazada Account

1. Log in as admin
2. Navigate to Settings or click "Add Store"
3. Click "Connect Lazada Account"
4. You'll be redirected to Lazada authorization
5. Log in to your Lazada Seller Center
6. Authorize the application
7. You'll be redirected back with account connected

---

## 5. Database Schema

### 5.1 Complete SQL Schema

**Note:** This is the actual production database schema. Execute in order for proper foreign key dependencies.

```sql
-- ============================================
-- SUPABASE DATABASE SCHEMA FOR CLL
-- Production Schema - Execute in Supabase SQL Editor
-- ============================================

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. USER PROFILES TABLE
-- Stores user information with roles
-- Linked to auth.users for authentication
-- ============================================
CREATE TABLE public.user_profiles (
  id uuid NOT NULL,
  email text NOT NULL UNIQUE,
  full_name text,
  role user_role NOT NULL DEFAULT 'warehouse'::user_role,
  is_active boolean DEFAULT true,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_profiles_pkey PRIMARY KEY (id),
  CONSTRAINT user_profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id),
  CONSTRAINT user_profiles_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);

-- Note: user_role is a custom ENUM type
-- CREATE TYPE user_role AS ENUM ('admin', 'warehouse', 'marketing');

-- ============================================
-- 2. LAZADA ACCOUNTS TABLE
-- Stores connected Lazada seller accounts with OAuth tokens
-- ============================================
CREATE TABLE public.lazada_accounts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  seller_id text NOT NULL,
  account_name text,
  country text,
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  expires_in integer,
  token_expires_at timestamp with time zone,
  country_user_info jsonb,
  account_platform text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT lazada_accounts_pkey PRIMARY KEY (id),
  CONSTRAINT lazada_accounts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- ============================================
-- 3. USER PREFERENCES TABLE
-- Stores user-specific settings and active account
-- ============================================
CREATE TABLE public.user_preferences (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  active_account_id uuid,
  theme text DEFAULT 'light'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_preferences_pkey PRIMARY KEY (id),
  CONSTRAINT user_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT user_preferences_active_account_id_fkey FOREIGN KEY (active_account_id) REFERENCES public.lazada_accounts(id)
);

-- ============================================
-- 4. CACHED ORDERS TABLE
-- Stores synced order data from Lazada API
-- Main order information without item details
-- ============================================
CREATE TABLE public.cached_orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  account_id uuid NOT NULL,
  order_id text NOT NULL,
  order_number text,
  status text,
  price numeric,
  currency text DEFAULT 'PHP'::text,
  items_count integer DEFAULT 0,
  order_created_at timestamp with time zone,
  order_updated_at timestamp with time zone,
  raw_data jsonb,
  synced_at timestamp with time zone DEFAULT now(),
  CONSTRAINT cached_orders_pkey PRIMARY KEY (id),
  CONSTRAINT cached_orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT cached_orders_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.lazada_accounts(id)
);

-- ============================================
-- 5. CACHED ORDER ITEMS TABLE
-- Stores individual items within orders
-- Detailed product/SKU level information
-- ============================================
CREATE TABLE public.cached_order_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  account_id uuid NOT NULL,
  order_id text NOT NULL,
  order_item_id text NOT NULL,
  name text,
  sku text,
  variation text,
  quantity integer DEFAULT 1,
  paid_price numeric,
  currency text DEFAULT 'PHP'::text,
  status text,
  raw_data jsonb,
  synced_at timestamp with time zone DEFAULT now(),
  CONSTRAINT cached_order_items_pkey PRIMARY KEY (id),
  CONSTRAINT cached_order_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT cached_order_items_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.lazada_accounts(id)
);

-- ============================================
-- 6. CACHED CAMPAIGNS TABLE
-- Stores advertising campaign data from Sponsor Solutions
-- ============================================
CREATE TABLE public.cached_campaigns (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  account_id uuid NOT NULL,
  campaign_id text NOT NULL,
  campaign_name text,
  campaign_type text,
  campaign_objective text,
  status text,
  day_budget numeric,
  raw_data jsonb,
  synced_at timestamp with time zone DEFAULT now(),
  CONSTRAINT cached_campaigns_pkey PRIMARY KEY (id),
  CONSTRAINT cached_campaigns_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT cached_campaigns_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.lazada_accounts(id)
);

-- ============================================
-- 7. CACHED CAMPAIGN METRICS TABLE
-- Stores daily performance metrics for campaigns
-- ============================================
CREATE TABLE public.cached_campaign_metrics (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  account_id uuid NOT NULL,
  campaign_id text NOT NULL,
  campaign_name text,
  metric_date date NOT NULL,
  spend numeric DEFAULT 0,
  day_budget numeric DEFAULT 0,
  store_revenue numeric DEFAULT 0,
  product_revenue numeric DEFAULT 0,
  store_orders integer DEFAULT 0,
  product_orders integer DEFAULT 0,
  store_unit_sold integer DEFAULT 0,
  product_unit_sold integer DEFAULT 0,
  impressions integer DEFAULT 0,
  clicks integer DEFAULT 0,
  ctr numeric DEFAULT 0,
  cpc numeric DEFAULT 0,
  store_roi numeric DEFAULT 0,
  store_cvr numeric DEFAULT 0,
  product_cvr numeric DEFAULT 0,
  store_a2c integer DEFAULT 0,
  product_a2c integer DEFAULT 0,
  raw_data jsonb,
  synced_at timestamp with time zone DEFAULT now(),
  CONSTRAINT cached_campaign_metrics_pkey PRIMARY KEY (id),
  CONSTRAINT cached_campaign_metrics_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT cached_campaign_metrics_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.lazada_accounts(id)
);

-- ============================================
-- 8. CHARTS TABLE
-- Stores saved chart configurations and data
-- For analytics dashboard persistence
-- ============================================
CREATE TABLE public.charts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  chart_type text NOT NULL DEFAULT 'bar'::text,
  data jsonb NOT NULL,
  config jsonb,
  file_name text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT charts_pkey PRIMARY KEY (id)
);

-- ============================================
-- 9. SYNC LOGS TABLE
-- Tracks all data synchronization operations
-- Used for audit trail and debugging
-- ============================================
CREATE TABLE public.sync_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  account_id uuid,
  sync_type text NOT NULL,
  status text NOT NULL,
  started_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  records_synced integer DEFAULT 0,
  error_message text,
  params jsonb,
  CONSTRAINT sync_logs_pkey PRIMARY KEY (id),
  CONSTRAINT sync_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT sync_logs_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.lazada_accounts(id)
);

-- ============================================
-- 10. SYNC SETTINGS TABLE
-- Per-user sync configuration and scheduling
-- ============================================
CREATE TABLE public.sync_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  auto_sync_enabled boolean DEFAULT true,
  sync_time time without time zone DEFAULT '00:00:00'::time without time zone,
  timezone text DEFAULT 'Asia/Manila'::text,
  sync_orders boolean DEFAULT true,
  sync_campaigns boolean DEFAULT true,
  sync_campaign_metrics boolean DEFAULT true,
  orders_days_back integer DEFAULT 30,
  metrics_days_back integer DEFAULT 7,
  last_sync_at timestamp with time zone,
  last_sync_status text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT sync_settings_pkey PRIMARY KEY (id),
  CONSTRAINT sync_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- User Profiles indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);

-- Lazada Accounts indexes
CREATE INDEX IF NOT EXISTS idx_lazada_accounts_user_id ON public.lazada_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_lazada_accounts_seller_id ON public.lazada_accounts(seller_id);
CREATE INDEX IF NOT EXISTS idx_lazada_accounts_is_active ON public.lazada_accounts(is_active);

-- Cached Orders indexes
CREATE INDEX IF NOT EXISTS idx_cached_orders_account_id ON public.cached_orders(account_id);
CREATE INDEX IF NOT EXISTS idx_cached_orders_order_id ON public.cached_orders(order_id);
CREATE INDEX IF NOT EXISTS idx_cached_orders_status ON public.cached_orders(status);
CREATE INDEX IF NOT EXISTS idx_cached_orders_created_at ON public.cached_orders(order_created_at DESC);

-- Cached Order Items indexes
CREATE INDEX IF NOT EXISTS idx_cached_order_items_order_id ON public.cached_order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_cached_order_items_account_id ON public.cached_order_items(account_id);
CREATE INDEX IF NOT EXISTS idx_cached_order_items_sku ON public.cached_order_items(sku);

-- Cached Campaigns indexes
CREATE INDEX IF NOT EXISTS idx_cached_campaigns_account_id ON public.cached_campaigns(account_id);
CREATE INDEX IF NOT EXISTS idx_cached_campaigns_campaign_id ON public.cached_campaigns(campaign_id);
CREATE INDEX IF NOT EXISTS idx_cached_campaigns_status ON public.cached_campaigns(status);

-- Cached Campaign Metrics indexes
CREATE INDEX IF NOT EXISTS idx_cached_campaign_metrics_account_id ON public.cached_campaign_metrics(account_id);
CREATE INDEX IF NOT EXISTS idx_cached_campaign_metrics_campaign_id ON public.cached_campaign_metrics(campaign_id);
CREATE INDEX IF NOT EXISTS idx_cached_campaign_metrics_date ON public.cached_campaign_metrics(metric_date DESC);

-- Sync Logs indexes
CREATE INDEX IF NOT EXISTS idx_sync_logs_user_id ON public.sync_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_account_id ON public.sync_logs(account_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_started_at ON public.sync_logs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_sync_logs_sync_type ON public.sync_logs(sync_type);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Enable RLS on all tables
-- ============================================

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lazada_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cached_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cached_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cached_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cached_campaign_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.charts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_settings ENABLE ROW LEVEL SECURITY;

-- User Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.user_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Lazada Accounts policies
CREATE POLICY "Authenticated users can view all active accounts"
  ON public.lazada_accounts FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Cached data policies - All authenticated users can view
CREATE POLICY "Authenticated users can view all orders"
  ON public.cached_orders FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view all order items"
  ON public.cached_order_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view all campaigns"
  ON public.cached_campaigns FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view all metrics"
  ON public.cached_campaign_metrics FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view all charts"
  ON public.charts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view all sync logs"
  ON public.sync_logs FOR SELECT
  TO authenticated
  USING (true);

-- User-specific policies
CREATE POLICY "Users can manage their own preferences"
  ON public.user_preferences FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their sync settings"
  ON public.sync_settings FOR ALL
  USING (user_id = auth.uid());

-- ============================================
-- TRIGGERS FOR AUTO-UPDATE TIMESTAMPS
-- ============================================

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to tables with updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lazada_accounts_updated_at
  BEFORE UPDATE ON public.lazada_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_charts_updated_at
  BEFORE UPDATE ON public.charts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sync_settings_updated_at
  BEFORE UPDATE ON public.sync_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- UNIQUE CONSTRAINTS FOR DATA INTEGRITY
-- ============================================

-- Ensure no duplicate orders per account
ALTER TABLE public.cached_orders ADD CONSTRAINT unique_account_order
  UNIQUE (account_id, order_id);

-- Ensure no duplicate campaigns per account
ALTER TABLE public.cached_campaigns ADD CONSTRAINT unique_account_campaign
  UNIQUE (account_id, campaign_id);

-- Ensure no duplicate metrics per campaign per date
ALTER TABLE public.cached_campaign_metrics ADD CONSTRAINT unique_account_campaign_date
  UNIQUE (account_id, campaign_id, metric_date);

-- Ensure no duplicate order items
ALTER TABLE public.cached_order_items ADD CONSTRAINT unique_order_item
  UNIQUE (account_id, order_id, order_item_id);

-- ============================================
-- END OF SCHEMA
-- ============================================
```

### 5.2 Tables Overview

**Total Tables: 10**

| Table Name | Purpose | Key Fields | Row Count (Typical) |
|------------|---------|------------|---------------------|
| **user_profiles** | User accounts with roles | id, email, role, full_name | 10-50 |
| **lazada_accounts** | Connected seller accounts | seller_id, access_token, is_active | 5-20 |
| **user_preferences** | User settings | active_account_id, theme | 10-50 |
| **cached_orders** | Order summaries | order_id, status, price | 1,000-100,000 |
| **cached_order_items** | Individual order items | order_item_id, sku, quantity | 2,000-200,000 |
| **cached_campaigns** | Ad campaign list | campaign_id, campaign_name, status | 10-100 |
| **cached_campaign_metrics** | Daily campaign metrics | metric_date, spend, revenue | 100-10,000 |
| **charts** | Saved chart configs | title, chart_type, data | 0-50 |
| **sync_logs** | Sync operation history | sync_type, status, records_synced | 100-10,000 |
| **sync_settings** | Sync configuration | auto_sync_enabled, last_sync_at | 10-50 |

**Storage Estimates:**
- Small deployment (1 account, 30 days data): ~50 MB
- Medium deployment (5 accounts, 90 days data): ~500 MB
- Large deployment (20 accounts, 365 days data): ~5 GB

### 5.3 Table Relationships

```
auth.users (Supabase Auth)
    ↓ (one-to-one)
user_profiles
    ↓ (one-to-many)
lazada_accounts
    ↓ (one-to-many)
    |-- cached_orders
    |   +-- (referenced by) cached_order_items
    |-- cached_campaigns
    +-- cached_campaign_metrics

user_profiles
    ↓ (one-to-one)
user_preferences
    ↓ (references)
lazada_accounts (active_account_id)

user_profiles
    ↓ (one-to-many)
    |-- sync_logs
    +-- sync_settings

charts (standalone table, no foreign keys)
```

**Key Relationships:**

1. **auth.users → user_profiles** (1:1)
   - Each authenticated user has one profile
   - Profile stores role and display information

2. **user_profiles → lazada_accounts** (1:many)
   - Users can connect multiple Lazada seller accounts
   - Each account has OAuth tokens

3. **lazada_accounts → cached_orders** (1:many)
   - Each account has many orders
   - Orders are synced from Lazada API

4. **cached_orders → cached_order_items** (1:many)
   - Each order contains multiple line items
   - Items have individual SKU, quantity, price

5. **lazada_accounts → cached_campaigns** (1:many)
   - Each account has advertising campaigns
   - Campaign data from Sponsor Solutions API

6. **lazada_accounts → cached_campaign_metrics** (1:many)
   - Daily performance metrics for each campaign
   - Time-series data for analytics

7. **user_profiles → user_preferences** (1:1)
   - User settings and active account selection

8. **user_profiles → sync_logs** (1:many)
   - Audit trail of sync operations

9. **user_profiles → sync_settings** (1:1)
   - Per-user sync configuration

---

### 5.3.1 Entity Relationship Diagram (ERD)

```
+===========================================================================+
|                         CLL DATABASE SCHEMA (ERD)                         |
+===========================================================================+

                            +-------------------+
                            |   auth.users      |
                            |   (Supabase)      |
                            |-------------------|
                            | * id (PK)         |
                            | * email           |
                            | * encrypted_pwd   |
                            +---------+---------+
                                      |
                                      | 1:1
                                      v
                            +-------------------+
                            |  user_profiles    |
                            |-------------------|
                            | * id (PK,FK)      |
                            | * email           |
                            | * full_name       |
                            | * role            |<-----+
                            | * is_active       |      | created_by
                            | * created_by (FK) |------+
                            +----+--------+-----+
                                 |        |
              +------------------+        +------------------+
              |                                              |
              | 1:many                                  1:1  |
              v                                              v
    +--------------------+                    +----------------------+
    |  lazada_accounts   |                    |  user_preferences    |
    |--------------------|                    |----------------------|
    | * id (PK)          |                    | * id (PK)            |
    | * user_id (FK)     |                    | * user_id (FK)       |
    | * seller_id        |<-------------------| * active_acct_id(FK) |
    | * account_name     |                    | * theme              |
    | * access_token     |                    +----------------------+
    | * refresh_token    |
    | * is_active        |                    +----------------------+
    +--------+-----------+                    |  sync_settings       |
             |                                |----------------------|
             | 1:many                         | * id (PK)            |
             |                                | * user_id (FK)       |
             +--------------------------------| * auto_sync_on       |
             |                                | * sync_time          |
             |                                | * orders_days_back   |
             |                                +----------------------+
             |
             |                                +----------------------+
             |                                |  sync_logs           |
             |                                |----------------------|
             |                                | * id (PK)            |
             |                                | * user_id (FK)       |
             |                                | * account_id (FK)    |
             |                                | * sync_type          |
             |                                | * status             |
             |                                | * records_synced     |
             |                                +----------------------+
             |
    +--------+--------+-----------+-----------+
    |                 |           |           |
    | 1:many          | 1:many    | 1:many    |
    v                 v           v           |
+------------------+  +------------------+    |  +---------------------+
|  cached_orders   |  | cached_campaigns |    |  | cached_campaign_    |
|------------------|  |------------------|    |  | metrics             |
| * id (PK)        |  | * id (PK)        |    |  |---------------------|
| * account_id(FK) |  | * account_id(FK) |    |  | * id (PK)           |
| * order_id       |  | * campaign_id    |    |  | * account_id(FK)    |
| * order_number   |  | * campaign_name  |    |  | * campaign_id       |
| * status         |  | * campaign_type  |    |  | * metric_date       |
| * price          |  | * status         |    |  | * spend             |
| * items_count    |  | * day_budget     |    |  | * revenue           |
| * raw_data       |  | * raw_data       |    |  | * impressions       |
+--------+---------+  +------------------+    |  | * clicks, ctr...    |
         |                                    |  +---------------------+
         | 1:many                             |
         v                                    |
+--------------------+                        |
|  cached_order_     |                        |
|  items             |                        |
|--------------------|                        |
| * id (PK)          |                        |
| * account_id(FK)   |                        |
| * order_id         |                        |
| * order_item_id    |                        |
| * name             |                        |
| * sku              |                        |
| * quantity         |                        |
| * paid_price       |                        |
+--------------------+                        |
                                              |
                            +-----------------+-----+
                            |  charts               |
                            |  (standalone)         |
                            |-----------------------|
                            | * id (PK)             |
                            | * title               |
                            | * chart_type          |
                            | * data (JSONB)        |
                            | * config (JSONB)      |
                            +-----------------------+

LEGEND:
  * PK = Primary Key
  * FK = Foreign Key
  * 1:1 = One-to-One Relationship
  * 1:many = One-to-Many Relationship
```

---

### 5.3.2 Data Flow Architecture

```
+===========================================================================+
|                    DATA FLOW: USER --> LAZADA --> CACHE                   |
+===========================================================================+

   USER LAYER              ACCOUNT LAYER           LAZADA DATA CACHE
   ----------              -------------           -----------------

+----------------+
|  auth.users    |
|  (Supabase)    |------+
+----------------+      |
                        | stores
                        v
              +----------------+       OAuth        +----------------+
              | user_profiles  |------ Tokens ---->|    Lazada      |
              |                |     stored in     |      API       |
              | * role         |         |         |                |
              | * email        |         v         +-------+--------+
              +------+---------+  +--------------+         |
                     |            | lazada_      |         | Sync
                     | creates    | accounts     |         | Operations
                     |            |              |         |
                     v            | * tokens     |         |
              +----------------+  | * seller_id  |         |
              | user_          |  +------+-------+         |
              | preferences    |         |                 |
              |                |         | owns            |
              | * active_      |         |                 |
              |   account_id   |---------+                 |
              +----------------+                           |
                     |                                     |
                     | tracks                              |
                     v                                     |
              +----------------+                           |
              | sync_settings  |                           |
              |                |                           |
              | * auto_sync    |                           |
              | * days_back    |                           |
              +----------------+                           |
                     |                                     |
                     | logs                                |
                     v                                     |
              +----------------+                           |
              | sync_logs      |<--------------------------+
              |                |       Records sync
              | * status       |       operations
              | * records      |
              +----------------+
                                                           |
                     +-----------------------------------------+
                     |
                     | Synced Data Stored In:
                     |
        +------------+----------+--------------+
        |            |          |              |
        v            v          v              v
+------------+ +------------+ +------------+ +--------------+
| cached_    | | cached_    | | cached_    | | cached_      |
| orders     | | order_     | | campaigns  | | campaign_    |
|            | | items      | |            | | metrics      |
| [Orders]   | | [Items]    | | [Ads]      | | [Analytics]  |
+------------+ +------------+ +------------+ +--------------+
```

---

### 5.3.3 Table Structure Visualizations

**User & Authentication Tables:**

| Field | Type | Nullable | Key/Default |
|-------|------|----------|-------------|
| id | uuid | NOT NULL | PK, FK->auth |
| email | text | NOT NULL | UNIQUE |
| full_name | text | NULL | |
| role | user_role | NOT NULL | ='warehouse' |
| is_active | boolean | NULL | =true |
| created_by | uuid | NULL | FK->user_profiles |
| created_at | timestamptz | NULL | =now() |
| updated_at | timestamptz | NULL | =now() |

> **Indexes:** email, role
> **RLS:** Users view own profile; Admins view all

---

**Lazada Integration Tables:**

| Field | Type | Nullable | Key/Default |
|-------|------|----------|-------------|
| id | uuid | NOT NULL | PK |
| user_id | uuid | NOT NULL | FK->user_profiles |
| seller_id | text | NOT NULL | |
| account_name | text | NULL | |
| country | text | NULL | (PH, SG, TH...) |
| access_token | text | NOT NULL | [SENSITIVE] |
| refresh_token | text | NOT NULL | [SENSITIVE] |
| expires_in | integer | NULL | (seconds) |
| token_expires_at | timestamptz | NULL | |
| country_user_info | jsonb | NULL | |
| account_platform | text | NULL | |
| is_active | boolean | NULL | =true |
| created_at | timestamptz | NULL | =now() |
| updated_at | timestamptz | NULL | =now() |

> **Indexes:** user_id, seller_id, is_active
> **RLS:** All authenticated users can view active accounts

---

**Order Data Tables:**

**Table: cached_orders**

| Field | Type | Nullable | Key/Default |
|-------|------|----------|-------------|
| id | uuid | NOT NULL | PK |
| user_id | uuid | NULL | FK->auth.users |
| account_id | uuid | NOT NULL | FK->lazada_accts |
| order_id | text | NOT NULL | UNIQUE w/acct |
| order_number | text | NULL | |
| status | text | NULL | (pending, etc.) |
| price | numeric | NULL | |
| currency | text | NULL | ='PHP' |
| items_count | integer | NULL | =0 |
| order_created_at | timestamptz | NULL | from Lazada |
| order_updated_at | timestamptz | NULL | from Lazada |
| raw_data | jsonb | NULL | full API data |
| synced_at | timestamptz | NULL | =now() |

> **Indexes:** account_id, order_id, status, order_created_at
> **Unique:** (account_id, order_id)

**Relationship:** 1:many (cached_orders -> cached_order_items)

**Table: cached_order_items**

| Field | Type | Nullable | Key/Default |
|-------|------|----------|-------------|
| id | uuid | NOT NULL | PK |
| user_id | uuid | NOT NULL | FK->auth.users |
| account_id | uuid | NOT NULL | FK->lazada_accts |
| order_id | text | NOT NULL | |
| order_item_id | text | NOT NULL | |
| name | text | NULL | product name |
| sku | text | NULL | product SKU |
| variation | text | NULL | size, color... |
| quantity | integer | NULL | =1 |
| paid_price | numeric | NULL | |
| currency | text | NULL | ='PHP' |
| status | text | NULL | |
| raw_data | jsonb | NULL | |
| synced_at | timestamptz | NULL | =now() |

> **Indexes:** order_id, account_id, sku
> **Unique:** (account_id, order_id, order_item_id)

---

**Campaign Data Tables:**

**Table: cached_campaigns**

| Field | Type | Nullable | Key/Default |
|-------|------|----------|-------------|
| id | uuid | NOT NULL | PK |
| user_id | uuid | NULL | FK->auth.users |
| account_id | uuid | NOT NULL | FK->lazada_accts |
| campaign_id | text | NOT NULL | from Lazada |
| campaign_name | text | NULL | |
| campaign_type | text | NULL | SPONSORED_SEARCH |
| campaign_objective | text | NULL | |
| status | text | NULL | ACTIVE, PAUSED |
| day_budget | numeric | NULL | daily budget |
| raw_data | jsonb | NULL | |
| synced_at | timestamptz | NULL | =now() |

> **Unique:** (account_id, campaign_id)

**Relationship:** 1:many (cached_campaigns -> cached_campaign_metrics by date)

**Table: cached_campaign_metrics** (Time-Series Data)

| Field | Type | Nullable | Key/Default |
|-------|------|----------|-------------|
| id | uuid | NOT NULL | PK |
| user_id | uuid | NULL | FK->auth.users |
| account_id | uuid | NOT NULL | FK->lazada_accts |
| campaign_id | text | NOT NULL | |
| campaign_name | text | NULL | |
| metric_date | date | NOT NULL | YYYY-MM-DD |
| spend | numeric | NULL | =0 |
| day_budget | numeric | NULL | =0 |
| store_revenue | numeric | NULL | =0 |
| product_revenue | numeric | NULL | =0 |
| store_orders | integer | NULL | =0 |
| product_orders | integer | NULL | =0 |
| impressions | integer | NULL | =0 |
| clicks | integer | NULL | =0 |
| ctr | numeric | NULL | =0 (%) |
| cpc | numeric | NULL | =0 (cost/click) |
| store_roi | numeric | NULL | =0 |
| ... (17 metrics total) | | | |

> **Unique:** (account_id, campaign_id, metric_date)
> **Indexes:** metric_date DESC (for time-series queries)

---

### 5.4 Data Types & Constraints

**Unique Constraints:**
- `email` must be unique in `user_profiles`
- `account_id + order_id` must be unique in `cached_orders`
- `account_id + order_id + order_item_id` must be unique in `cached_order_items`
- `account_id + campaign_id` must be unique in `cached_campaigns`
- `account_id + campaign_id + metric_date` must be unique in `cached_campaign_metrics`
- `user_id` must be unique in `user_preferences`
- `user_id` must be unique in `sync_settings`

**Data Type Constraints:**
- **role** (user_role ENUM): 'admin', 'warehouse', 'marketing'
- **sync_type**: 'orders', 'campaigns', 'campaign_metrics', 'all'
- **sync_status**: 'started', 'completed', 'failed'
- **chart_type**: 'bar', 'line', 'pie', etc.
- **currency**: Text (default 'PHP')
- **timezone**: Text (default 'Asia/Manila')

**Default Values:**
- `is_active` = true (user_profiles, lazada_accounts)
- `auto_sync_enabled` = true (sync_settings)
- `orders_days_back` = 30 (sync_settings)
- `metrics_days_back` = 7 (sync_settings)
- `quantity` = 1 (cached_order_items)
- All numeric metrics default to 0
- Timestamps default to NOW()

**Cascading Deletes:**
- Delete auth.users → deletes user_profiles (CASCADE)
- Delete user_profiles → deletes lazada_accounts (CASCADE)
- Delete user_profiles → deletes user_preferences (CASCADE)
- Delete user_profiles → deletes sync_settings (CASCADE)
- Delete lazada_accounts → deletes all cached data (CASCADE)
- Delete lazada_accounts → sets user_preferences.active_account_id to NULL
- Delete user from sync_logs → sets user_id to NULL (not CASCADE)
- **Soft Delete:** Accounts use `is_active = false` instead of hard delete

**JSONB Columns:**
- `country_user_info` - Lazada country-specific seller data
- `raw_data` - Complete API response for debugging
- `params` - Sync operation parameters
- `data` - Chart data (charts table)
- `config` - Chart configuration (charts table)

---

## 6. Authentication & Authorization

### 6.1 Authentication Flow

```
Step 1: User navigates to /login
         |
         v
+----------------+
|   Login.jsx    |  Step 2: User enters email/password
+----------------+         (@cloudlogiclimited.com only)
         |
         | Step 3: supabase.auth.signInWithPassword()
         v
+----------------+
|   Supabase     |  Step 4: Validates credentials
|     Auth       |  Step 5: Returns JWT token + user object
+----------------+
         |
         | Step 6: Token stored in localStorage
         v
+----------------+
|   App.jsx      |  Step 7: AuthProvider checks user
|  AuthProvider  |  Step 8: Fetch user profile from user_profiles
+----------------+  Step 9: Check role (admin/warehouse/marketing)
         |
         | Step 10: Role cached in localStorage
         v
+----------------+
|   Protected    |  Step 11: User can access pages based on role
|    Routes      |  Step 12: Sidebar shows only allowed pages
+----------------+
```

### 6.2 OAuth Flow (Lazada)

```
Step 1: User clicks "Connect Lazada Account"
         |
         v
+------------------+
|  LazadaAuth.jsx  |  Step 2: GET /api/lazada/auth-url
+------------------+         Server returns authorization URL
         |
         | Step 3: Redirect to Lazada
         v
+------------------+
|     Lazada       |  Step 4: User logs in to Seller Center
|   Auth Page      |  Step 5: User approves application
+------------------+  Step 6: Redirect back with ?code=xxx
         |
         v
+------------------+
|  Callback.jsx    |  Step 7: Extract authorization code
+------------------+  Step 8: POST /api/lazada/token with code
         |
         v
+------------------+
|     Server       |  Step 9: Exchange code for access_token
|   server.js      |  Step 10: Save to lazada_accounts table
+------------------+  Step 11: Calculate token expiry
         |
         | Step 12: Return account object
         v
+------------------+
|    Browser       |  Step 13: Redirect to /settings or /orders
+------------------+  Step 14: Account appears in dropdown
```

### 6.3 Role-Based Access Control (RBAC)

**Permission Matrix:**

| Feature | Admin | Warehouse | Marketing |
|---------|-------|-----------|-----------|
| View Dashboard | Yes | No | No |
| View Orders | Yes | Yes | No |
| View FFR | Yes | Yes | No |
| View Data Insights | Yes | No | Yes |
| Sync Data | Yes | Yes | Yes |
| View Settings | Yes | Yes | Yes |
| Manage Users | Yes | No | No |
| Add Lazada Store | Yes | No | No |
| Export Data | Yes | Yes | Yes |
| Delete Cached Data | Yes | No | No |

**Implementation:**

```javascript
// In App.jsx
const ROLE_PERMISSIONS = {
  admin: {
    pages: ['dashboard', 'orders', 'ffr', 'data_insights', 'sync', 'settings', 'users'],
    canAddStore: true,
    canManageUsers: true,
    canSync: true,
    canExport: true,
    canDeleteData: true,
  },
  warehouse: {
    pages: ['orders', 'ffr'],
    canAddStore: false,
    canManageUsers: false,
    canSync: true,
    canExport: true,
    canDeleteData: false,
  },
  marketing: {
    pages: ['data_insights'],
    canAddStore: false,
    canManageUsers: false,
    canSync: true,
    canExport: true,
    canDeleteData: false,
  },
};
```

### 6.4 Token Management

**JWT Tokens (Supabase):**
- Issued on login
- Valid for 1 hour by default
- Auto-refresh handled by Supabase client
- Sent in `Authorization: Bearer <token>` header

**Lazada Access Tokens:**
- Obtained via OAuth code exchange
- Valid for variable duration (check `expires_in`)
- Stored in `lazada_accounts` table
- Auto-refresh before expiry (1-hour buffer)
- Refresh token valid for longer period

**Token Refresh Logic:**

```javascript
// In server/utils/supabase.js
async function getFreshToken(account) {
  const now = new Date();
  const expiresAt = new Date(account.token_expires_at);

  // Refresh if expires in less than 1 hour
  if (expiresAt <= new Date(now.getTime() + 60 * 60 * 1000)) {
    const tokenData = await lazadaAuth.refreshAccessToken(account.refresh_token);
    // Update tokens in database
    await updateLazadaTokens(...);
    return tokenData.access_token;
  }

  return account.access_token;
}
```

### 6.5 Security Best Practices

**Implemented:**
- [x] Email domain restriction (@cloudlogiclimited.com)
- [x] JWT authentication on all API endpoints
- [x] HTTPS-only in production
- [x] CORS configuration (whitelist origins)
- [x] Environment variables for secrets
- [x] Supabase RLS (Row Level Security)
- [x] Automatic token refresh
- [x] Soft delete for accounts

**Recommended Additions:**
- [ ] Rate limiting on API endpoints
- [ ] CSRF token protection
- [ ] 2-factor authentication (2FA)
- [ ] Password complexity requirements
- [ ] Session timeout after inactivity
- [ ] IP whitelisting for admin
- [ ] Audit logging for sensitive operations

---

## 7. Complete API Reference

### 7.1 Base URLs

**Development:**
- Client: `http://localhost:5173`
- Server: `http://localhost:5000`

**Production:**
- Client: `https://your-github-pages-url.github.io/cll/`
- Server: `https://your-production-api.com`

### 7.2 Authentication Headers

All protected endpoints require:

```http
Authorization: Bearer <supabase_jwt_token>
```

Some Lazada API endpoints may also require:

```http
X-Account-Id: <lazada_account_uuid>
X-Lazada-Token: <lazada_access_token>
```

### 7.3 API Endpoints

#### 7.3.1 Health & Testing

**GET /health**

Check server status.

```http
GET /health
```

Response:
```json
{
  "status": "OK",
  "timestamp": "2026-01-22T10:30:00.000Z",
  "environment": "development"
}
```

**GET /api/test**

Test API connectivity.

```http
GET /api/test
```

Response:
```json
{
  "message": "API is working!",
  "timestamp": "2026-01-22T10:30:00.000Z"
}
```

---

#### 7.3.2 Lazada Authentication

**GET /api/lazada/auth-url**

Get Lazada OAuth authorization URL.

```http
GET /api/lazada/auth-url
```

Response:
```json
{
  "authUrl": "https://auth.lazada.com/oauth/authorize?response_type=code&...",
  "redirectUri": "http://localhost:5173/callback",
  "clientId": "your_app_key"
}
```

**POST /api/lazada/token**

Exchange authorization code for access token and save account.

```http
POST /api/lazada/token
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "code": "authorization_code_from_callback"
}
```

Response:
```json
{
  "success": true,
  "account": {
    "id": "uuid",
    "seller_id": "12345",
    "account_name": "My Store",
    "country": "PH",
    "is_active": true,
    "created_at": "2026-01-22T10:30:00.000Z"
  },
  "access_token": "xxxxx",
  "refresh_token": "xxxxx",
  "expires_in": 604800,
  "country_user_info": [...]
}
```

**POST /api/lazada/refresh-token**

Refresh Lazada access token.

```http
POST /api/lazada/refresh-token
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "refreshToken": "refresh_token_string",
  "accountId": "account_uuid" // optional
}
```

Response:
```json
{
  "success": true,
  "access_token": "new_access_token",
  "refresh_token": "new_refresh_token",
  "expires_in": 604800,
  "refresh_expires_in": 15552000
}
```

---

#### 7.3.3 Account Management

**GET /api/accounts**

Get all active Lazada accounts for the user.

```http
GET /api/accounts
Authorization: Bearer <jwt_token>
```

Response:
```json
{
  "success": true,
  "accounts": [
    {
      "id": "uuid-1",
      "seller_id": "12345",
      "account_name": "Store 1",
      "country": "PH",
      "token_expires_at": "2026-02-01T00:00:00.000Z",
      "is_active": true
    },
    {
      "id": "uuid-2",
      "seller_id": "67890",
      "account_name": "Store 2",
      "country": "SG",
      "token_expires_at": "2026-02-05T00:00:00.000Z",
      "is_active": true
    }
  ],
  "activeAccountId": "uuid-1"
}
```

**GET /api/accounts/:accountId**

Get specific account details.

```http
GET /api/accounts/uuid-123
Authorization: Bearer <jwt_token>
```

Response:
```json
{
  "success": true,
  "account": {
    "id": "uuid-123",
    "seller_id": "12345",
    "account_name": "My Store",
    "country": "PH",
    "access_token": "xxxx",
    "token_expires_at": "2026-02-01T00:00:00.000Z",
    "country_user_info": {...},
    "is_active": true
  }
}
```

**POST /api/accounts/:accountId/activate**

Set an account as the active account.

```http
POST /api/accounts/uuid-123/activate
Authorization: Bearer <jwt_token>
```

Response:
```json
{
  "success": true,
  "account": {...},
  "message": "Account activated successfully"
}
```

**DELETE /api/accounts/:accountId**

Soft-delete an account (sets is_active = false).

```http
DELETE /api/accounts/uuid-123
Authorization: Bearer <jwt_token>
```

Response:
```json
{
  "success": true,
  "message": "Account removed successfully"
}
```

---

#### 7.3.4 Lazada Seller API

**GET /api/lazada/seller**

Get seller information.

```http
GET /api/lazada/seller
Authorization: Bearer <jwt_token>
X-Account-Id: <account_uuid>
```

Response: Lazada API response
```json
{
  "code": "0",
  "data": {
    "seller_id": "12345",
    "name": "Seller Name",
    "email": "seller@example.com",
    ...
  }
}
```

**GET /api/lazada/seller/policy**

Get seller policy information.

```http
GET /api/lazada/seller/policy?locale=en_US
Authorization: Bearer <jwt_token>
X-Account-Id: <account_uuid>
```

Response: Lazada API response

---

#### 7.3.5 Lazada Products API

**GET /api/lazada/products**

Get products list.

```http
GET /api/lazada/products?filter=all&limit=20&offset=0
Authorization: Bearer <jwt_token>
X-Account-Id: <account_uuid>
```

Query Parameters:
- `filter`: all, live, inactive, deleted, image-missing, pending, rejected, sold-out
- `limit`: Number of items (default: 20)
- `offset`: Offset for pagination (default: 0)

Response: Lazada API response
```json
{
  "code": "0",
  "data": {
    "total_products": 150,
    "products": [...]
  }
}
```

---

#### 7.3.6 Lazada Orders API

**GET /api/lazada/orders**

Get orders list with filters.

```http
GET /api/lazada/orders?created_after=2026-01-01T00:00:00Z&limit=20&offset=0
Authorization: Bearer <jwt_token>
X-Account-Id: <account_uuid>
```

Query Parameters:
- `created_after`: ISO timestamp (required)
- `created_before`: ISO timestamp (optional)
- `status`: pending, ready_to_ship, shipped, delivered, canceled, etc.
- `limit`: Number of orders (default: 20)
- `offset`: Pagination offset (default: 0)
- `sort_by`: created_at, updated_at (default: created_at)
- `sort_direction`: ASC, DESC (default: DESC)

Response:
```json
{
  "code": "0",
  "data": {
    "count": 150,
    "orders": [
      {
        "order_id": 123456789,
        "order_number": "ORD-2026-0001",
        "statuses": ["pending"],
        "price": "1500.00",
        "currency": "PHP",
        "items_count": 2,
        "created_at": "2026-01-15T10:30:00Z",
        "updated_at": "2026-01-15T10:30:00Z"
      },
      ...
    ]
  }
}
```

**GET /api/lazada/order/:orderId**

Get single order details.

```http
GET /api/lazada/order/123456789
Authorization: Bearer <jwt_token>
X-Account-Id: <account_uuid>
```

Response: Lazada API response with order details

**GET /api/lazada/order/:orderId/items**

Get items for a single order.

```http
GET /api/lazada/order/123456789/items
Authorization: Bearer <jwt_token>
X-Account-Id: <account_uuid>
```

Response:
```json
{
  "code": "0",
  "data": [
    {
      "order_item_id": 987654321,
      "product_id": 111222333,
      "name": "Product Name",
      "sku": "SKU-001",
      "quantity": 2,
      "item_price": "750.00",
      "paid_price": "700.00",
      "status": "pending"
    },
    ...
  ]
}
```

**POST /api/lazada/orders/items**

Get items for multiple orders (batch).

```http
POST /api/lazada/orders/items
Authorization: Bearer <jwt_token>
X-Account-Id: <account_uuid>
Content-Type: application/json

{
  "orderIds": [123456789, 987654321, 555666777]
}
```

Response:
```json
{
  "code": "0",
  "data": [
    {
      "order_id": 123456789,
      "items": [...]
    },
    {
      "order_id": 987654321,
      "items": [...]
    },
    ...
  ]
}
```

---

#### 7.3.7 Lazada Sponsor Solutions API (Advertising)

**GET /api/lazada/sponsor/solutions/report/getReportOverview**

Get advertising campaign overview report.

```http
GET /api/lazada/sponsor/solutions/report/getReportOverview?startDate=2026-01-15&endDate=2026-01-22
Authorization: Bearer <jwt_token>
X-Account-Id: <account_uuid>
```

Query Parameters:
- `startDate`: YYYY-MM-DD (required)
- `endDate`: YYYY-MM-DD (required)
- `dimensions`: Optional dimensions
- `metrics`: Optional metrics
- `currencyType`: Optional currency

Response:
```json
{
  "code": "0",
  "result": {
    "overview": {
      "impressions": 150000,
      "clicks": 3000,
      "spend": 5000.00,
      "revenue": 15000.00,
      "roi": 3.0
    }
  }
}
```

**GET /api/lazada/sponsor/solutions/campaign/getCampaignList**

Get list of advertising campaigns.

```http
GET /api/lazada/sponsor/solutions/campaign/getCampaignList?pageNo=1&pageSize=100
Authorization: Bearer <jwt_token>
X-Account-Id: <account_uuid>
```

Query Parameters:
- `pageNo`: Page number (default: 1)
- `pageSize`: Items per page (default: 100)

Response:
```json
{
  "code": "0",
  "result": {
    "campaignList": [
      {
        "campaignId": "111222333",
        "campaignName": "Summer Sale",
        "campaignType": "SPONSORED_SEARCH",
        "status": "ACTIVE",
        "dayBudget": 1000.00
      },
      ...
    ]
  }
}
```

**GET /api/lazada/sponsor/solutions/report/getDiscoveryReportAdgroup**

Get discovery report by ad group.

```http
GET /api/lazada/sponsor/solutions/report/getDiscoveryReportAdgroup?campaignId=111222333&startDate=2026-01-15&endDate=2026-01-22
Authorization: Bearer <jwt_token>
X-Account-Id: <account_uuid>
```

Query Parameters:
- `campaignId`: Campaign ID (required)
- `startDate`: YYYY-MM-DD (required)
- `endDate`: YYYY-MM-DD (required)
- `pageNo`: Page number (default: 1)
- `pageSize`: Items per page (default: 1000)

Response: Lazada API response with ad group metrics

**GET /api/lazada/sponsor/solutions/report/getReportCampaignOnPrePlacement**

Get campaign report on pre-placement (where ads appear).

```http
GET /api/lazada/sponsor/solutions/report/getReportCampaignOnPrePlacement?startDate=2026-01-15&endDate=2026-01-22&campaignId=111222333
Authorization: Bearer <jwt_token>
X-Account-Id: <account_uuid>
```

Query Parameters:
- `startDate`: YYYY-MM-DD (required)
- `endDate`: YYYY-MM-DD (required)
- `campaignId`: Optional filter by campaign
- `campaignName`: Optional filter by name
- `productType`: ALL, SPONSORED_PRODUCT (default: ALL)
- `sort`: impressions, clicks, spend, etc. (default: impressions)
- `order`: ASC, DESC (default: DESC)
- `pageNo`: Page number (default: 1)
- `pageSize`: Items per page (default: 100)
- `useRtTable`: true/false (default: true)

Response: Lazada API response with placement performance

**GET /api/lazada/sponsor/solutions/report/getDiscoveryReportCampaign**

Get discovery report by campaign.

```http
GET /api/lazada/sponsor/solutions/report/getDiscoveryReportCampaign?startDate=2026-01-15&endDate=2026-01-22
Authorization: Bearer <jwt_token>
X-Account-Id: <account_uuid>
```

Query Parameters:
- `startDate`: YYYY-MM-DD (required)
- `endDate`: YYYY-MM-DD (required)
- `pageNo`: Page number (default: 1)
- `pageSize`: Items per page (default: 1000)

Response:
```json
{
  "code": "0",
  "result": {
    "result": [
      {
        "campaignId": "111222333",
        "campaignName": "Summer Sale",
        "impressions": 50000,
        "clicks": 1000,
        "spend": 1500.00,
        "revenue": 5000.00,
        "roi": 3.33,
        ...
      },
      ...
    ]
  }
}
```

---

#### 7.3.8 Data Sync API

**POST /api/sync/all**

Trigger full sync (orders, campaigns, metrics).

```http
POST /api/sync/all
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "ordersDaysBack": 30,
  "metricsDaysBack": 7
}
```

Response:
```json
{
  "success": true,
  "message": "Sync completed",
  "data": {
    "orders": {
      "total_synced": 150,
      "accounts": [...]
    },
    "campaigns": {
      "total_synced": 5,
      "accounts": [...]
    },
    "campaign_metrics": {
      "total_synced": 35,
      "dates_processed": 7,
      "accounts": [...]
    },
    "duration_ms": 45000,
    "status": "completed"
  }
}
```

**POST /api/sync/orders**

Sync orders only.

```http
POST /api/sync/orders
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "accountId": "uuid-123", // optional, syncs all if omitted
  "daysBack": 30
}
```

Response:
```json
{
  "success": true,
  "message": "Orders sync completed",
  "data": {
    "total_synced": 150,
    "accounts": [
      {
        "account_id": "uuid-123",
        "account_name": "Store 1",
        "orders_synced": 150,
        "status": "success"
      }
    ]
  }
}
```

**POST /api/sync/campaigns**

Sync campaigns only.

```http
POST /api/sync/campaigns
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "accountId": "uuid-123" // optional
}
```

Response: Similar to orders sync

**POST /api/sync/campaign-metrics**

Sync campaign metrics only.

```http
POST /api/sync/campaign-metrics
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "accountId": "uuid-123", // optional
  "daysBack": 7
}
```

Response:
```json
{
  "success": true,
  "message": "Campaign metrics sync completed",
  "data": {
    "total_synced": 35,
    "dates_processed": 7,
    "accounts": [...]
  }
}
```

**GET /api/sync/status**

Get sync status and statistics.

```http
GET /api/sync/status
Authorization: Bearer <jwt_token>
```

Response:
```json
{
  "success": true,
  "data": {
    "settings": {
      "last_sync_at": "2026-01-22T10:00:00.000Z",
      "last_sync_status": "completed"
    },
    "recent_logs": [
      {
        "id": "uuid",
        "sync_type": "orders",
        "status": "completed",
        "records_synced": 150,
        "started_at": "2026-01-22T10:00:00.000Z",
        "completed_at": "2026-01-22T10:00:45.000Z"
      },
      ...
    ],
    "data_counts": {
      "orders": 1500,
      "campaigns": 10,
      "campaign_metrics": 70
    }
  }
}
```

**GET /api/sync/data/orders**

Get cached orders with filters.

```http
GET /api/sync/data/orders?accountId=uuid-123&status=pending&dateFrom=2026-01-01&dateTo=2026-01-22&page=1&limit=50
Authorization: Bearer <jwt_token>
```

Query Parameters:
- `accountId`: Filter by account (use 'all' for all accounts)
- `status`: Filter by status (use 'all' for all statuses)
- `dateFrom`: YYYY-MM-DD
- `dateTo`: YYYY-MM-DD
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 50)

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "account_id": "uuid-123",
      "order_id": "123456789",
      "order_number": "ORD-2026-0001",
      "status": "pending",
      "price": 1500.00,
      "currency": "PHP",
      "items_count": 2,
      "order_created_at": "2026-01-15T10:30:00.000Z",
      "synced_at": "2026-01-22T10:00:00.000Z",
      "lazada_accounts": {
        "account_name": "Store 1",
        "seller_id": "12345",
        "country": "PH"
      }
    },
    ...
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150
  }
}
```

**GET /api/sync/data/campaigns**

Get cached campaigns.

```http
GET /api/sync/data/campaigns?accountId=uuid-123
Authorization: Bearer <jwt_token>
```

Query Parameters:
- `accountId`: Filter by account (use 'all' for all accounts)

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "account_id": "uuid-123",
      "campaign_id": "111222333",
      "campaign_name": "Summer Sale",
      "campaign_type": "SPONSORED_SEARCH",
      "status": "ACTIVE",
      "day_budget": 1000.00,
      "synced_at": "2026-01-22T10:00:00.000Z",
      "lazada_accounts": {...}
    },
    ...
  ]
}
```

**GET /api/sync/data/campaign-metrics**

Get cached campaign metrics.

```http
GET /api/sync/data/campaign-metrics?accountId=uuid-123&campaignId=111222333&dateFrom=2026-01-15&dateTo=2026-01-22
Authorization: Bearer <jwt_token>
```

Query Parameters:
- `accountId`: Filter by account (use 'all' for all accounts)
- `campaignId`: Filter by campaign (optional)
- `dateFrom`: YYYY-MM-DD (optional)
- `dateTo`: YYYY-MM-DD (optional)

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "account_id": "uuid-123",
      "campaign_id": "111222333",
      "campaign_name": "Summer Sale",
      "metric_date": "2026-01-22",
      "spend": 150.00,
      "day_budget": 1000.00,
      "store_revenue": 450.00,
      "product_revenue": 400.00,
      "store_orders": 10,
      "product_orders": 8,
      "impressions": 5000,
      "clicks": 100,
      "ctr": 2.0,
      "cpc": 1.50,
      "store_roi": 3.0,
      "synced_at": "2026-01-22T10:00:00.000Z",
      "lazada_accounts": {...}
    },
    ...
  ]
}
```

---

### 7.4 Error Responses

All endpoints follow this error format:

```json
{
  "error": "Error title",
  "message": "Detailed error message",
  "details": "Additional error details",
  "code": "ERROR_CODE",
  "status": 400
}
```

**Common HTTP Status Codes:**
- `200 OK` - Success
- `400 Bad Request` - Invalid parameters
- `401 Unauthorized` - Missing or invalid JWT token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

**Common Lazada API Error Codes:**
- `0` - Success
- `IllegalAccessToken` - Invalid or expired access token
- `E00005` - Invalid signature
- `E00010` - System error
- `E00011` - Request throttled

---

## 8. File-by-File Documentation

### 8.1 Client Files

#### client/src/App.jsx (Main Application Component)

**Purpose:** Root component with routing, authentication, and role-based access control.

**Key Features:**
- `AuthProvider` - Manages user authentication state
- `useAuth()` hook - Access auth context from any component
- Role-based permission system (ROLE_PERMISSIONS object)
- Protected routes with role checking
- Automatic user profile loading from Supabase
- LocalStorage caching for instant load on refresh
- Multi-account management via `AccountManager`

**Routing Structure:**
```
/ (redirect to /orders if logged in, else /login)
/login - Login page
/lazada-auth - Lazada OAuth initiation
/callback - OAuth callback handler
/orders - Order management (admin, warehouse)
/ffr - Fast fulfillment (admin, warehouse)
/data-insights - Analytics dashboard (admin, marketing)
/sync - Data sync dashboard (all roles)
/settings - User settings (all roles)
/users - User management (admin only)
```

**Important Functions:**
- `loadUserProfile()` - Fetch user profile from Supabase
- `hasAccess(page)` - Check if user can access a page
- `ProtectedRoute` - Wrapper component for role checking

---

#### client/src/Auth/Login.jsx

**Purpose:** Login page with email/password authentication and domain validation.

**Key Features:**
- Email domain validation (@cloudlogiclimited.com only)
- Supabase authentication integration
- Error handling and user feedback
- Auto-redirect after successful login
- Password visibility toggle

**Validation:**
```javascript
if (!email.endsWith('@cloudlogiclimited.com')) {
  setError('Only Cloud Logic Limited emails are allowed');
  return;
}
```

---

#### client/src/pages/OrderItems.jsx

**Purpose:** Order management interface with filtering, search, and Excel export.

**Key Features:**
- Display orders from multiple Lazada accounts
- Date range filtering
- Status filtering (all, pending, ready_to_ship, etc.)
- Account filtering (all accounts or specific account)
- Search by order ID or order number
- Pagination (20 items per page)
- Excel export (current page or all filtered results)
- Manual sync trigger with notification feedback
- Real-time sync status display
- Order statistics (total orders count)
- OMS Status column (placeholder for future Anchanto OMS integration)

**Table Columns:**
| Column | Description |
|--------|-------------|
| Checkbox | Bulk selection |
| Account | Account name with avatar and country |
| Order Number | Order number and ID |
| Status | Lazada order status badge |
| OMS Status | Placeholder -- shows "Not Connected" (future: Anchanto OMS status) |
| Price | Order price with currency |
| Created At | Date and time of order creation |

**Data Flow:**
1. User selects filters and date range
2. Component fetches cached data from Supabase
3. Data is displayed in table format
4. User can export to Excel or trigger sync
5. Sync success/failure pushes a notification via `useNotifications()`

**State Management:**
```javascript
const [orders, setOrders] = useState([]);
const [filters, setFilters] = useState({ dateFrom, dateTo, status, accountId });
const [page, setPage] = useState(1);
const [loading, setLoading] = useState(false);
```

---

#### client/src/pages/DataInsights.jsx

**Purpose:** Analytics dashboard with campaign metrics and visualizations.

**Key Features:**
- Campaign overview metrics
- Pre-placement analysis reports
- Discovery reports by campaign and ad group
- Multiple chart types (LineChart, BarChart from Recharts)
- Date range filtering (default: 7 days back)
- Campaign selection dropdown
- Multi-account support
- Excel export for analytics data
- Raw JSON response viewer
- Interactive chart tooltips

**API Integrations:**
- Campaign list from `/api/lazada/sponsor/solutions/campaign/getCampaignList`
- Overview from `/api/lazada/sponsor/solutions/report/getReportOverview`
- Pre-placement from `/api/lazada/sponsor/solutions/report/getReportCampaignOnPrePlacement`
- Discovery reports from Sponsor Solutions API

**Charts Displayed:**
- Impressions over time
- Clicks over time
- Spend trend
- Revenue trend
- ROI calculation

---

#### client/src/pages/Ffr.jsx

**Purpose:** Fast Fulfillment (Ready-to-ship) tracking page.

**Key Features:**
- FFR performance metrics
- Multi-account aggregation
- Parallel data fetching for multiple accounts
- Raw response data viewer
- Account-specific performance breakdown

---

#### client/src/pages/Settings.jsx

**Purpose:** User and account settings management.

**Key Features:**
- User profile display
- Connected accounts list
- Add new Lazada account
- Remove existing accounts
- Token status display
- Account preferences management

---

#### client/src/pages/UserCreation.jsx

**Purpose:** Admin-only user management page.

**Key Features:**
- Create new users
- Assign roles (admin, warehouse, marketing)
- View all users
- Edit user roles
- Delete users
- User list with role badges

**Access Control:**
```javascript
// Only accessible by admin role
if (userProfile?.role !== 'admin') {
  return <Navigate to="/orders" />;
}
```

---

#### client/src/pages/LazadaAuth.jsx & Callback.jsx

**Purpose:** Handle Lazada OAuth flow.

**LazadaAuth.jsx:**
- Fetches authorization URL from server
- Redirects user to Lazada Seller Center
- Displays loading state

**Callback.jsx:**
- Receives authorization code from URL params
- Exchanges code for access token via API
- Saves account to database
- Redirects to appropriate page

---

#### client/src/components/Sidebar.jsx

**Purpose:** Main navigation sidebar with role-based menu filtering.

**Key Features:**
- Collapsible sidebar with toggle button
- Role-based menu item filtering
- Current page highlighting
- User profile display at bottom
- Role badge indicator
- Icons from Lucide React

**Menu Items:**
- Dashboard (admin only)
- Orders (admin, warehouse)
- FFR (admin, warehouse)
- Data Insights (admin, marketing)
- Sync Dashboard (all roles)
- Settings (all roles)
- User Management (admin only)

---

#### client/src/components/TopNav.jsx

**Purpose:** Top navigation bar with notification bell, breadcrumb, and user menu.

**Key Features:**
- Dynamic page title breadcrumb
- Notification bell with unread count badge
- Notification dropdown panel (up to 20 recent notifications)
- Mark as read / mark all as read
- Type-specific icons (sync = purple, error = red, success = green)
- Relative timestamps ("Just now", "5m ago", "2h ago", "3d ago")
- User avatar with role badge and dropdown
- Logout button
- Click-outside-to-close for both dropdowns

**Notification Bell:**
```javascript
const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

// Badge only shows when unreadCount > 0
// Dropdown lists notifications with icon, title, message, and timestamp
// Clicking a notification marks it as read
```

---

#### client/src/components/SyncDashboard.jsx

**Purpose:** Data synchronization interface with manual triggers.

**Key Features:**
- Manual sync buttons for Orders, Campaigns, Metrics
- Sync status display with icons (in-progress, completed, failed)
- Last sync time tracking
- Configurable sync parameters (days back)
- Sync history log
- Real-time status updates

**Sync Triggers:**
- Sync All Data (orders + campaigns + metrics)
- Sync Orders Only
- Sync Campaigns Only
- Sync Metrics Only

---

#### client/src/utils/AccountManager.jsx

**Purpose:** Lazada account management with caching.

**Key Features:**
- React hook: `useAccounts()`
- Get all Lazada accounts from API
- Local cache with 5-minute TTL
- localStorage fallback for persistence
- Active account selection
- Account switching
- Account removal
- Token expiry checking
- Auto-refresh on API failures

**Hook Return Value:**
```javascript
const {
  accounts,        // Array of account objects
  activeAccount,   // Currently selected account
  loading,        // Loading state
  error,          // Error message
  refresh,        // Function to refresh accounts
  switchAccount,  // Function to switch active account
  removeAccount   // Function to remove an account
} = useAccounts();
```

**Caching Logic:**
```javascript
// Cache key: 'lazada_accounts_cache'
// Cache TTL: 5 minutes
// Falls back to API if cache expired
```

---

#### client/src/utils/CachedDataService.js

**Purpose:** Frontend data caching service for sync operations.

**Key Features:**
- Sync status management
- Order data retrieval from cache
- Campaign metrics from cache
- Sync time tracking in localStorage
- SyncService class for triggering backend syncs
- Helper functions for formatted sync times

**Methods:**
- `getSyncStatus()` - Get last sync time from localStorage
- `setSyncStatus(type, time)` - Update sync time
- `getCachedOrders(filters)` - Retrieve cached orders
- `getCachedCampaignMetrics(filters)` - Retrieve cached metrics
- `triggerSync(type, params)` - Trigger backend sync

---

#### client/src/utils/NotificationContext.jsx

**Purpose:** In-app notification system with React Context and localStorage persistence.

**Key Features:**
- `NotificationProvider` wraps the app to provide notification state
- `useNotifications()` hook for consuming and dispatching notifications
- Persists to `localStorage` (key: `cll_notifications`)
- Caps at 50 stored notifications (FIFO)
- Each notification has: `id`, `type`, `title`, `message`, `timestamp`, `read`

**Notification Types:**
| Type | Use Case | Icon Color |
|------|----------|------------|
| `sync` | Sync completed | Purple |
| `error` | Sync or operation failed | Red |
| `success` | General success events | Green |
| `info` | Informational messages | Gray |

**Hook API:**
```javascript
const {
  notifications,    // Array of notification objects
  unreadCount,      // Number of unread notifications
  addNotification,  // ({ type, title, message }) => void
  markAsRead,       // (id) => void
  markAllAsRead,    // () => void
  clearAll,         // () => void
} = useNotifications();
```

**Usage Example:**
```javascript
addNotification({
  type: 'sync',
  title: 'Sync Completed',
  message: '150 orders synced successfully.',
});
```

**Current Integrations:**
- `OrderItems.jsx` -- pushes `sync` notification on successful sync, `error` on failure

**Future Integrations (planned):**
- Anchanto OMS status change alerts
- New order alerts
- Token expiration warnings

---

#### client/src/hooks/useCachedData.js

**Purpose:** Custom React hooks for cached data management.

**Hooks:**

1. `useCachedOrders(filters)` - Order data fetching and management
   ```javascript
   const { orders, loading, error, refresh, pagination } = useCachedOrders({
     accountId: 'uuid-123',
     status: 'pending',
     dateFrom: '2026-01-01',
     dateTo: '2026-01-22',
     page: 1,
     limit: 50
   });
   ```

2. `useCachedCampaignMetrics(filters)` - Campaign metrics retrieval
   ```javascript
   const { metrics, loading, error, refresh } = useCachedCampaignMetrics({
     accountId: 'uuid-123',
     campaignId: '111222333',
     dateFrom: '2026-01-15',
     dateTo: '2026-01-22'
   });
   ```

3. `useSyncStatus()` - Sync status monitoring and control
   ```javascript
   const { status, logs, counts, syncAll, syncOrders, refreshStatus } = useSyncStatus();
   ```

---

#### client/src/lib/supabase.js

**Purpose:** Supabase client initialization and auth helpers.

**Exports:**
- `supabase` - Supabase client instance
- `auth` - Authentication helper functions

**Helper Functions:**
- `signInWithPassword(email, password)` - Email/password login
- `signUp(email, password, metadata)` - Create new user
- `signOut()` - Logout
- `getSession()` - Get current session
- `getUser()` - Get current user
- `onAuthStateChange(callback)` - Listen to auth changes

---

### 8.2 Server Files

#### server/server.js

**Purpose:** Main Express application with all API endpoints.

**Middleware:**
- CORS configuration (whitelist origins)
- JSON body parser
- URL-encoded body parser
- Request logging
- `verifyUser` - JWT authentication middleware
- `withLazadaToken` - Lazada token middleware with auto-refresh

**Endpoint Groups:**
1. Health & Testing (2 endpoints)
2. Lazada Authentication (3 endpoints)
3. Account Management (4 endpoints)
4. Lazada Seller API (2 endpoints)
5. Lazada Products API (1 endpoint)
6. Lazada Orders API (4 endpoints)
7. Sponsor Solutions API (5 endpoints)
8. Data Sync API (mounted from syncRoutes)

**Error Handling:**
- 404 handler for unknown endpoints
- Global error handler with stack trace in development

**Server Startup:**
- Logs environment configuration
- Lists all available endpoints
- Shows which environment variables are set

---

#### server/routes/syncRoutes.js

**Purpose:** API routes for data synchronization operations.

**Middleware:**
- `verifyUser` - Applied to all routes

**Endpoints:**
- POST `/all` - Sync all data types
- POST `/orders` - Sync orders only
- POST `/campaigns` - Sync campaigns only
- POST `/campaign-metrics` - Sync metrics only
- GET `/status` - Get sync status and logs
- GET `/data/orders` - Get cached orders
- GET `/data/campaigns` - Get cached campaigns
- GET `/data/campaign-metrics` - Get cached metrics

**Important Note:**
- All sync endpoints do NOT filter by user_id
- All authenticated users can sync and view all data
- This design choice enables team collaboration

---

#### server/services/syncService.js

**Purpose:** Business logic for data synchronization with Lazada API.

**Functions:**

1. **syncOrders(userId, accountId, options)**
   - Fetches orders from Lazada API
   - Caches in `cached_orders` table
   - Configurable date range (default: 30 days back)
   - Pagination handling (100 orders per request)
   - Auto token refresh
   - Sync log tracking
   - Batch upsert (100 orders per chunk)

2. **syncCampaigns(userId, accountId)**
   - Fetches campaign list from Sponsor Solutions API
   - Caches in `cached_campaigns` table
   - Upserts based on account_id + campaign_id

3. **syncCampaignMetrics(userId, accountId, options)**
   - Fetches daily campaign metrics
   - Configurable date range (default: 7 days back)
   - One API call per date
   - Caches in `cached_campaign_metrics` table
   - Rate limiting (100ms delay between requests)

4. **syncAllData(userId, options)**
   - Orchestrates all sync operations
   - Syncs orders, campaigns, and metrics sequentially
   - Updates sync_settings table
   - Returns combined results with duration

**Helper Functions:**
- `getLazadaAccounts(accountId)` - Get all active accounts
- `getFreshToken(account)` - Get valid token with auto-refresh
- `createSyncLog(userId, accountId, syncType, params)` - Create log entry
- `updateSyncLog(logId, updates)` - Update log status

---

#### server/utils/lazadaAuth.js

**Purpose:** Lazada API authentication and request signing.

**Class: LazadaAuth**

**Constructor:**
```javascript
new LazadaAuth(appKey, appSecret, apiUrl)
```

**Methods:**

1. `generateSignature(apiPath, params)` - HMAC-SHA256 signature generation
   - Sorts parameters alphabetically
   - Concatenates as `key1value1key2value2...`
   - Prepends API path
   - Signs with HMAC-SHA256 using app secret
   - Returns uppercase hex signature

2. `createAccessToken(code)` - OAuth token exchange
   - Exchanges authorization code for access token
   - Returns token data or error

3. `refreshAccessToken(refreshToken)` - Token refresh
   - Refreshes expired access token
   - Returns new token data

4. `makeRequest(apiPath, accessToken, params, method)` - Authenticated API request
   - Adds app_key, timestamp, sign_method, access_token to params
   - Generates signature with ALL parameters
   - Makes GET request with signed parameters
   - Logs detailed request/response information
   - Returns Lazada API response

5. `getOrderItems(accessToken, orderId)` - Get items for single order
   - Wrapper for `/order/items/get` endpoint

6. `getMultipleOrderItems(accessToken, orderIds)` - Batch order items
   - Wrapper for `/orders/items/get` endpoint
   - Accepts array of order IDs

**Signature Algorithm:**
```
Input: /orders/get, {app_key: "123", timestamp: "1234567890", limit: "20"}

Step 1: Sort params alphabetically
app_key123limit20timestamp1234567890

Step 2: Prepend API path
/orders/getapp_key123limit20timestamp1234567890

Step 3: HMAC-SHA256 with app secret
signature = HMAC-SHA256(step2_string, app_secret).toUpperCase()

Step 4: Add signature to params and make request
GET /orders/get?app_key=123&timestamp=1234567890&limit=20&sign=SIGNATURE
```

---

#### server/utils/supabase.js

**Purpose:** Supabase database operations and user management.

**Exports:**

1. `supabaseAdmin` - Supabase client with service role key

2. **Functions:**

   **Authentication:**
   - `verifySupabaseToken(token)` - Verify JWT token, return user or null

   **Account Management:**
   - `saveLazadaAccount(userId, accountData)` - Save/update Lazada account
   - `getUserLazadaAccounts(userId)` - Get all active accounts (no user filter)
   - `getLazadaAccount(userId, accountId)` - Get specific account (no user filter)
   - `updateLazadaTokens(userId, accountId, tokenData)` - Update access/refresh tokens
   - `deleteLazadaAccount(userId, accountId)` - Soft delete account

   **User Preferences:**
   - `getUserPreferences(userId)` - Get user preferences
   - `setActiveAccount(userId, accountId)` - Set active account

**Important Security Note:**
- `getUserLazadaAccounts()` does NOT filter by user_id
- `getLazadaAccount()` does NOT filter by user_id
- This allows all authenticated users to access all accounts
- Design choice for team collaboration

---

### 8.3 Configuration Files

#### package.json (Root)

**Scripts:**
- `install:all` - Install dependencies for root, client, and server
- `dev` - Run client and server concurrently
- `dev:client` - Run client only
- `dev:server` - Run server only
- `build` - Build client for production
- `deploy` - Deploy to GitHub Pages
- `clean` - Remove all node_modules
- `reinstall` - Clean and reinstall

**Dependencies:**
- `concurrently` - Run multiple npm scripts
- `gh-pages` - GitHub Pages deployment

---

#### client/vite.config.js

**Configuration:**
- Base path: `/cll/` (for GitHub Pages)
- Build output: `dist/`
- Assets directory: `assets/`
- React plugin enabled

---

#### client/tailwind.config.js

**Configuration:**
- Content: `index.html`, `src/**/*.{js,jsx}`
- Theme: Default TailwindCSS theme
- Plugins: None

---

#### eslint.config.js

**Configuration:**
- ESLint for code quality
- React plugin
- React Hooks plugin
- React Refresh plugin

---

## 9. Frontend Components Guide

### 9.1 Component Hierarchy

```
App.jsx (Root)
|-- AuthProvider (Context)
|   +-- NotificationProvider (Context)
|       |-- Login.jsx (Public Route)
|       +-- ProtectedRoute (Authenticated Routes)
|           |-- Layout (Sidebar + TopNav + Content)
|           |   |-- Sidebar
|           |   |-- TopNav (notification bell + user menu)
|           |   +-- Page Components
|           |       |-- Dashboard.jsx
|           |       |-- OrderItems.jsx
|           |       |-- Ffr.jsx
|           |       |-- DataInsights.jsx
|           |       |   +-- DataCharts.jsx
|           |       |-- SyncDashboard.jsx
|           |       |-- Settings.jsx
|           |       +-- UserCreation.jsx
|           |-- LazadaAuth.jsx
|           +-- Callback.jsx
```

### 9.2 State Management Patterns

**Global State (Context API):**
- `AuthContext` in App.jsx
  - user
  - session
  - lazadaAccounts
  - userProfile
  - loading states
- `NotificationContext` in NotificationContext.jsx
  - notifications
  - unreadCount

**Component Local State:**
- Page-specific filters
- Pagination
- Form inputs
- UI states (modals, dropdowns)

**Shared State via Custom Hooks:**
- `useAccounts()` - Account management
- `useNotifications()` - Notification dispatch and state
- `useCachedOrders()` - Order data
- `useCachedCampaignMetrics()` - Metrics data
- `useSyncStatus()` - Sync operations

**Caching Strategy:**
- localStorage for user profile (instant load)
- localStorage for account list (5-min TTL)
- localStorage for notifications (up to 50 items)
- localStorage for sync status
- Supabase for persistent data
- In-memory cache for API responses

### 9.3 Common Patterns

**Data Fetching Pattern:**
```javascript
const [data, setData] = useState([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

const fetchData = async () => {
  setLoading(true);
  setError(null);
  try {
    const response = await axios.get('/api/endpoint', {
      headers: { Authorization: `Bearer ${session.access_token}` }
    });
    setData(response.data);
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  fetchData();
}, [filters]);
```

**Protected Component Pattern:**
```javascript
function ProtectedPage() {
  const { userProfile, hasPermission } = useAuth();

  if (!hasPermission('page_name')) {
    return <Navigate to="/unauthorized" />;
  }

  return <div>Protected Content</div>;
}
```

**Account Switcher Pattern:**
```javascript
const { accounts, activeAccount, switchAccount } = useAccounts();

<select onChange={(e) => switchAccount(e.target.value)}>
  {accounts.map(account => (
    <option key={account.id} value={account.id}>
      {account.account_name}
    </option>
  ))}
</select>
```

---

## 10. Backend Services Guide

### 10.1 Service Architecture

```
Client Request
     ↓
Express Middleware (CORS, Auth)
     ↓
Route Handler (server.js or syncRoutes.js)
     ↓
Service Layer (syncService.js)
     ↓
Utility Layer (lazadaAuth.js, supabase.js)
     ↓
External APIs (Lazada, Supabase)
```

### 10.2 Authentication Flow

**Request Lifecycle:**
1. Client sends request with `Authorization: Bearer <jwt_token>`
2. `verifyUser` middleware extracts and verifies token
3. Supabase validates JWT
4. User object attached to `req.user`
5. Route handler accesses `req.user.id`

**Lazada Token Flow:**
1. Client sends request with `X-Account-Id` header
2. `withLazadaToken` middleware gets account from database
3. Checks if token expired
4. If expired, refreshes token automatically
5. Updates database with new tokens
6. Attaches `req.accessToken` and `req.account`

### 10.3 Error Handling Strategy

**Error Response Format:**
```javascript
res.status(statusCode).json({
  error: 'Error Title',
  message: 'Detailed message',
  details: errorDetails,
  code: 'ERROR_CODE'
});
```

**Common Error Handlers:**
- Database errors → 500 Internal Server Error
- Authentication errors → 401 Unauthorized
- Validation errors → 400 Bad Request
- Not found → 404 Not Found
- Lazada API errors → Pass through with original code

---

## 11. Data Flow & State Management

### 11.1 Order Management Flow

```
User opens /orders page
     ↓
OrderItems.jsx loads
     ↓
useEffect triggers data fetch
     ↓
Check cache validity (localStorage)
     ↓
If cache valid: Display cached data
If cache expired:
     ↓
     Fetch from /api/lazada/orders or /api/sync/data/orders
     ↓
     Server checks for fresh data
     ↓
     If synced recently: Return from cached_orders table
     If stale: Trigger background sync
     ↓
     Return data to client
     ↓
     Update cache
     ↓
Display orders in table
     ↓
User can filter, search, paginate
     ↓
User can export to Excel (client-side XLSX generation)
     ↓
User can trigger manual sync
     ↓
Sync updates cached_orders table
     ↓
Push notification via useNotifications()
  - Success: type 'sync', shows count of synced orders
  - Failure: type 'error', shows error message
     ↓
Auto-refresh UI with new data
```

### 11.2 Analytics Data Flow

```
User opens /data-insights page
     ↓
DataInsights.jsx loads
     ↓
Fetch campaign list from /api/lazada/sponsor/solutions/campaign/getCampaignList
     ↓
User selects date range and campaign
     ↓
Parallel API calls:
  - getReportOverview
  - getReportCampaignOnPrePlacement
  - getDiscoveryReportCampaign
  - getDiscoveryReportAdgroup
     ↓
Process and format data for charts
     ↓
Render Recharts components
     ↓
User can:
  - Change date range → Re-fetch data
  - Change campaign → Re-fetch campaign-specific data
  - Export to Excel → Generate XLSX file
  - View raw JSON → Display response in modal
```

### 11.3 Sync Operation Flow

```
User clicks "Sync Orders" button
     ↓
SyncDashboard.jsx calls syncOrders()
     ↓
POST /api/sync/orders with { daysBack: 30 }
     ↓
Server: syncService.syncOrders()
     ↓
For each Lazada account:
     ↓
     Create sync_log entry (status: started)
     ↓
     Get fresh access token (auto-refresh if needed)
     ↓
     Call Lazada API /orders/get with pagination
     ↓
     For each page:
       - Fetch 100 orders
       - Transform to database format
       - Upsert to cached_orders table
     ↓
     Update sync_log (status: completed, records_synced: X)
     ↓
Return summary to client
     ↓
Client displays success message
     ↓
Update sync status in UI
     ↓
Refresh order list
```

---

## 12. Lazada API Integration

### 12.1 API Authentication

**Lazada uses HMAC-SHA256 signing for all API requests.**

**Required Parameters:**
- `app_key` - Your application key
- `timestamp` - Current time in milliseconds
- `sign_method` - Always "sha256"
- `access_token` - OAuth access token (for authenticated requests)
- `sign` - HMAC-SHA256 signature

**Signature Generation:**
1. Collect all parameters (including access_token if present)
2. Sort parameters alphabetically by key
3. Concatenate as `key1value1key2value2...`
4. Prepend API path (e.g., `/orders/get`)
5. Sign with HMAC-SHA256 using app_secret
6. Convert to uppercase hex string

**Example:**
```javascript
// Parameters
const params = {
  app_key: "123456",
  timestamp: "1674123456789",
  sign_method: "sha256",
  access_token: "50000...xxxxx",
  limit: "20"
};

// Sort and concatenate
const sortedStr = "access_token50000...xxxxxapp_key123456limit20sign_methodsha256timestamp1674123456789";

// Sign
const signString = "/orders/get" + sortedStr;
const signature = crypto.createHmac('sha256', appSecret)
                       .update(signString)
                       .digest('hex')
                       .toUpperCase();

// Add to params
params.sign = signature;

// Make request
axios.get('https://api.lazada.com.ph/rest/orders/get', { params });
```

### 12.2 OAuth Flow

**Step 1: Get Authorization URL**
```javascript
const authUrl = `https://auth.lazada.com/oauth/authorize?response_type=code&force_auth=true&redirect_uri=${redirectUri}&client_id=${appKey}`;
// Redirect user to authUrl
```

**Step 2: User Approves**
- User logs in to Lazada Seller Center
- User approves application
- Lazada redirects to: `{redirectUri}?code=AUTHORIZATION_CODE`

**Step 3: Exchange Code for Token**
```javascript
POST /auth/token/create
Parameters:
  - app_key
  - timestamp
  - sign_method
  - code (authorization code)
  - sign (signature)

Response:
{
  "code": "0",
  "access_token": "50000...xxxxx",
  "refresh_token": "50001...xxxxx",
  "expires_in": 604800,
  "refresh_expires_in": 15552000,
  "account": "seller_email@example.com",
  "country": "ph",
  "country_user_info": [...]
}
```

**Step 4: Refresh Token (when expired)**
```javascript
POST /auth/token/refresh
Parameters:
  - app_key
  - timestamp
  - sign_method
  - refresh_token
  - sign

Response: Same as Step 3 with new tokens
```

### 12.3 Common API Endpoints

**Orders API:**
- `/orders/get` - Get orders list with filters
- `/order/get` - Get single order details
- `/order/items/get` - Get items for single order
- `/orders/items/get` - Get items for multiple orders
- `/order/rts` - Mark order ready to ship
- `/order/pack` - Pack order
- `/order/ship` - Ship order

**Products API:**
- `/products/get` - Get products list
- `/product/item/get` - Get single product
- `/product/create` - Create new product
- `/product/update` - Update product
- `/product/remove` - Remove product

**Seller API:**
- `/seller/get` - Get seller information
- `/seller/policy/fetch` - Get seller policies

**Sponsor Solutions API (Advertising):**
- `/sponsor/solutions/campaign/getCampaignList` - List campaigns
- `/sponsor/solutions/report/getReportOverview` - Campaign overview
- `/sponsor/solutions/report/getDiscoveryReportCampaign` - Campaign discovery
- `/sponsor/solutions/report/getDiscoveryReportAdgroup` - Ad group discovery
- `/sponsor/solutions/report/getReportCampaignOnPrePlacement` - Placement analysis

### 12.4 Rate Limiting

**Lazada API Limits:**
- Varies by endpoint and seller tier
- Typical: 10-100 requests per minute
- 429 Too Many Requests if exceeded
- Implement retry with exponential backoff

**Implemented in syncService.js:**
```javascript
// Small delay between requests to avoid rate limiting
await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
```

### 12.5 Error Handling

**Lazada API Error Codes:**
- `0` - Success
- `IllegalAccessToken` - Invalid or expired token
- `E00005` - Invalid signature
- `E00010` - System error
- `E00011` - Request throttled (rate limit)

**Handling in Code:**
```javascript
const response = await lazadaAuth.makeRequest('/orders/get', accessToken, params);

if (response.code !== '0' && response.code !== 0) {
  // Handle error
  if (response.code === 'IllegalAccessToken') {
    // Refresh token and retry
  } else {
    throw new Error(response.message);
  }
}

// Success
const orders = response.data.orders;
```

---

## 13. Development Workflow

### 13.1 Daily Development

```bash
# Start development servers
npm run dev

# This runs:
# - Client at http://localhost:5173 (Vite dev server with HMR)
# - Server at http://localhost:5000 (Nodemon auto-reload)

# Make changes to files
# - Client: Changes auto-reload in browser
# - Server: Nodemon auto-restarts server

# Test changes
# - Open browser to http://localhost:5173
# - Use browser DevTools for debugging
# - Check server terminal for logs

# Commit changes
git add .
git commit -m "Descriptive message"
git push
```

### 13.2 Adding New Features

**Frontend Feature:**
1. Create new component in `client/src/pages/` or `client/src/components/`
2. Add route in `client/src/App.jsx` if needed
3. Update role permissions in `ROLE_PERMISSIONS` if needed
4. Add to sidebar menu in `client/src/components/Sidebar.jsx`
5. Test with different roles
6. Commit and push

**Backend Feature:**
1. Add endpoint to `server/server.js` or create new route file
2. Add authentication middleware if needed
3. Implement business logic in `server/services/` if complex
4. Update API documentation in this file
5. Test with Postman or curl
6. Commit and push

**Database Change:**
1. Write SQL migration in `database/` folder
2. Apply to Supabase via SQL Editor
3. Update schema documentation in this file
4. Update server code to use new schema
5. Test thoroughly
6. Commit and push

### 13.3 Testing Checklist

**Before Committing:**
- [ ] Code runs without errors
- [ ] All console errors fixed
- [ ] Browser DevTools shows no warnings
- [ ] Server logs show no errors
- [ ] Feature works for all roles (if applicable)
- [ ] Feature works with multiple accounts
- [ ] Feature works with no accounts
- [ ] Mobile responsive (if UI change)
- [ ] Excel export works (if applicable)
- [ ] Sync operations work
- [ ] Token refresh works
- [ ] Error states display correctly
- [ ] Loading states display correctly
- [ ] Code formatted consistently
- [ ] No commented-out code
- [ ] No console.log() statements (use proper logging)

**Testing Roles:**
1. Test as Admin
   - Can access all pages
   - Can manage users
   - Can add accounts
   - Can delete data
2. Test as Warehouse
   - Can only access Orders and FFR
   - Cannot manage users
   - Cannot add accounts
3. Test as Marketing
   - Can only access Data Insights
   - Cannot manage users

### 13.4 Debugging Tips

**Frontend Debugging:**
```javascript
// Use React DevTools browser extension
// Add to component for debugging:
console.log('Component rendered', { prop1, prop2 });
useEffect(() => {
  console.log('Effect ran', { dependency });
}, [dependency]);

// Use debugger statement:
debugger; // Pauses execution in browser DevTools

// Check network requests:
// Browser DevTools → Network tab → Filter by XHR/Fetch
```

**Backend Debugging:**
```javascript
// Server logs are in terminal
// Add detailed logging:
console.log('Endpoint hit:', req.path);
console.log('User:', req.user.id);
console.log('Params:', req.query);
console.log('Body:', req.body);

// Use VS Code debugger:
// 1. Add breakpoint in VS Code
// 2. Run "Node: Auto Attach" in VS Code
// 3. Server will pause at breakpoint
```

**Database Debugging:**
```sql
-- Check Supabase logs
-- Go to Supabase Dashboard → Logs → Postgres Logs

-- Check table data:
SELECT * FROM user_profiles WHERE id = 'user-id';
SELECT * FROM lazada_accounts WHERE user_id = 'user-id';

-- Check sync logs:
SELECT * FROM sync_logs ORDER BY started_at DESC LIMIT 10;
```

---

## 14. Deployment Guide

### 14.1 Frontend Deployment (GitHub Pages)

**Prerequisites:**
- GitHub repository
- GitHub Pages enabled in repo settings

**Steps:**

1. Update production environment variables in `client/.env.production`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_API_URL=https://your-production-api.com/api
```

2. Update `client/vite.config.js` base path:
```javascript
export default defineConfig({
  base: '/your-repo-name/', // Must match GitHub repo name
  ...
});
```

3. Update `client/package.json` homepage:
```json
{
  "homepage": "https://your-username.github.io/your-repo-name/"
}
```

4. Build and deploy:
```bash
npm run deploy

# This runs:
# - cd client && npm run build (creates dist/ folder)
# - gh-pages -d dist (deploys to gh-pages branch)
```

5. Wait 1-2 minutes for GitHub Pages to update

6. Visit `https://your-username.github.io/your-repo-name/`

**Alternative: Deploy to Vercel/Netlify**

```bash
# Build client
cd client
npm run build

# Deploy dist/ folder to Vercel or Netlify
# Follow their respective deployment guides
```

### 14.2 Backend Deployment

**Option 1: Heroku**

1. Create Heroku app:
```bash
heroku create your-app-name
```

2. Set environment variables:
```bash
heroku config:set PORT=5000
heroku config:set SUPABASE_URL=https://...
heroku config:set SUPABASE_SERVICE_ROLE_KEY=...
heroku config:set LAZADA_APP_KEY=...
heroku config:set LAZADA_APP_SECRET=...
heroku config:set LAZADA_API_URL=https://...
heroku config:set NODE_ENV=production
```

3. Create `Procfile` in server/:
```
web: node server.js
```

4. Deploy:
```bash
git subtree push --prefix server heroku main
```

5. Check logs:
```bash
heroku logs --tail
```

**Option 2: DigitalOcean App Platform**

1. Create new app on DigitalOcean
2. Connect GitHub repository
3. Set root directory to `server/`
4. Add environment variables in dashboard
5. Deploy

**Option 3: AWS EC2**

1. Launch EC2 instance (Ubuntu)
2. SSH into instance
3. Install Node.js:
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

4. Clone repository:
```bash
git clone <repo-url>
cd cll/server
npm install
```

5. Set environment variables in `.env`

6. Install PM2:
```bash
sudo npm install -g pm2
pm2 start server.js
pm2 startup
pm2 save
```

7. Set up nginx reverse proxy (optional)

**Option 4: Railway**

1. Go to railway.app
2. Create new project from GitHub repo
3. Select `server/` as root directory
4. Add environment variables
5. Deploy

### 14.3 Post-Deployment

**1. Update CORS Origins**

Update `server/server.js`:
```javascript
const corsOptions = {
  origin: [
    'https://your-frontend-domain.com',
    'https://your-github-pages-url.github.io'
  ],
  ...
};
```

**2. Update Lazada OAuth Redirect URI**

Update in Lazada Developer Center:
- Old: `http://localhost:5173/callback`
- New: `https://your-frontend-domain.com/callback`

**3. Test Production**

- [ ] Can login
- [ ] Can connect Lazada account
- [ ] OAuth redirect works
- [ ] Orders load
- [ ] Analytics load
- [ ] Sync works
- [ ] Token refresh works
- [ ] Excel export works
- [ ] All roles work correctly

**4. Monitor Logs**

- Supabase Dashboard → Logs
- Server logs (Heroku, Railway, etc.)
- Browser console errors

**5. Set Up Monitoring (Optional)**

- Sentry for error tracking
- LogRocket for session replay
- New Relic for performance monitoring

---

## 15. Troubleshooting

### 15.1 Common Issues

**Issue: "Cannot connect to database"**

Solution:
- Check `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env`
- Verify Supabase project is active
- Check Supabase dashboard for outages
- Test connection in Supabase SQL Editor

**Issue: "Lazada API returns E00005 (Invalid signature)"**

Solution:
- Check `LAZADA_APP_KEY` and `LAZADA_APP_SECRET` are correct
- Verify timestamp is current (within 5 minutes)
- Check signature generation logic
- Ensure all parameters are included in signature
- Check parameter ordering (must be alphabetical)

**Issue: "Token expired" or "IllegalAccessToken"**

Solution:
- Check `token_expires_at` in database
- Token should auto-refresh (check withLazadaToken middleware)
- If refresh fails, re-authenticate account
- Check refresh_token is still valid

**Issue: "CORS error in browser"**

Solution:
- Check server CORS configuration includes frontend URL
- Verify `Access-Control-Allow-Origin` header in response
- Check browser DevTools → Network tab for CORS headers
- Ensure credentials: true in CORS config

**Issue: "Cannot read property 'role' of undefined"**

Solution:
- User profile not loaded yet
- Check `user_profiles` table has entry for user
- Check AuthProvider in App.jsx is loading profile
- Add loading state while profile loads

**Issue: "Sync fails with 'No accounts found'"**

Solution:
- No Lazada accounts connected
- Check `lazada_accounts` table
- Connect account via Settings → Add Store
- Verify account is_active = true

**Issue: "Orders not showing after sync"**

Solution:
- Check sync_logs table for errors
- Verify sync completed successfully
- Check cached_orders table has data
- Verify account_id matches
- Check date filters aren't excluding all orders

**Issue: "Build fails with 'Module not found'"**

Solution:
- Run `npm install` in affected directory
- Clear node_modules and reinstall: `npm run reinstall`
- Check import paths are correct (case-sensitive on Linux)
- Verify file exists at import path

**Issue: "Heroku deployment fails"**

Solution:
- Check Procfile exists and is correct
- Verify package.json has all dependencies
- Check Heroku logs: `heroku logs --tail`
- Ensure PORT is read from environment: `process.env.PORT`
- Check Node version compatibility

### 15.2 Debug Checklist

**Frontend Issues:**
1. [ ] Check browser console for errors
2. [ ] Check Network tab for failed requests
3. [ ] Verify localStorage has data
4. [ ] Check React DevTools for component state
5. [ ] Verify API URLs are correct
6. [ ] Check authentication token exists
7. [ ] Test in incognito mode (clear cache)
8. [ ] Test on different browser

**Backend Issues:**
1. [ ] Check server terminal for errors
2. [ ] Verify environment variables are set
3. [ ] Test endpoint with Postman/curl
4. [ ] Check database connection
5. [ ] Verify Lazada API credentials
6. [ ] Check token expiry
7. [ ] Review recent code changes
8. [ ] Check Supabase logs

**Database Issues:**
1. [ ] Check table exists
2. [ ] Verify RLS policies
3. [ ] Check for missing columns
4. [ ] Verify data types
5. [ ] Check foreign key constraints
6. [ ] Review Supabase logs
7. [ ] Test queries in SQL Editor
8. [ ] Check indexes for performance

---

## 16. Security Considerations

### 16.1 Current Security Measures

**Authentication:**
- [x] JWT token authentication via Supabase
- [x] Email domain restriction (@cloudlogiclimited.com)
- [x] Password hashing by Supabase
- [x] Token expiry and auto-refresh

**Authorization:**
- [x] Role-based access control (RBAC)
- [x] Supabase Row Level Security (RLS) policies
- [x] Protected API endpoints (verifyUser middleware)
- [x] Frontend route protection by role

**Data Protection:**
- [x] Environment variables for secrets
- [x] HTTPS in production
- [x] CORS whitelist (specific origins only)
- [x] Sensitive data in database (not localStorage)
- [x] Soft delete for accounts (data retention)

**API Security:**
- [x] HMAC-SHA256 signature for Lazada API
- [x] Token refresh before expiry
- [x] Request logging for audit
- [x] Error messages don't expose sensitive data

### 16.2 Security Recommendations

**High Priority:**
1. **Rate Limiting** - Prevent brute force attacks
   ```javascript
   import rateLimit from 'express-rate-limit';

   const limiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 100 // limit each IP to 100 requests per windowMs
   });

   app.use('/api/', limiter);
   ```

2. **CSRF Protection** - Prevent cross-site request forgery
   ```javascript
   import csrf from 'csurf';
   app.use(csrf({ cookie: true }));
   ```

3. **Helmet.js** - Set security HTTP headers
   ```javascript
   import helmet from 'helmet';
   app.use(helmet());
   ```

4. **Input Validation** - Validate all user inputs
   ```javascript
   import Joi from 'joi';

   const schema = Joi.object({
     email: Joi.string().email().required(),
     password: Joi.string().min(8).required()
   });
   ```

5. **SQL Injection Prevention** - Use parameterized queries
   - Supabase already does this
   - Never concatenate user input in SQL

**Medium Priority:**
1. **2-Factor Authentication (2FA)**
   - Add TOTP-based 2FA
   - Use libraries like `otplib`

2. **Session Timeout**
   - Auto-logout after inactivity
   - Configurable timeout duration

3. **Password Policy**
   - Minimum 8 characters
   - Require uppercase, lowercase, number, symbol
   - Password strength meter

4. **Audit Logging**
   - Log all sensitive operations
   - Track who did what and when
   - Store in separate audit_logs table

5. **IP Whitelisting (Admin)**
   - Restrict admin access to specific IPs
   - Configurable whitelist

**Low Priority:**
1. **Content Security Policy (CSP)**
   ```javascript
   app.use(helmet.contentSecurityPolicy({
     directives: {
       defaultSrc: ["'self'"],
       scriptSrc: ["'self'", "'unsafe-inline'"],
       styleSrc: ["'self'", "'unsafe-inline'"],
       imgSrc: ["'self'", "data:", "https:"],
     }
   }));
   ```

2. **Subresource Integrity (SRI)**
   - Add integrity hashes to CDN scripts

3. **Regular Security Audits**
   - Run `npm audit` regularly
   - Update dependencies
   - Scan for vulnerabilities

### 16.3 Data Privacy

**Personal Data Handling:**
- User email (PII) stored in Supabase auth
- User profile in user_profiles table
- No payment information stored
- Lazada tokens encrypted in transit (HTTPS)

**GDPR Compliance Considerations:**
- User can delete account (implement if needed)
- Data export functionality (implement if needed)
- Privacy policy (add to website)
- Terms of service (add to website)
- Cookie consent (add if using cookies beyond auth)

### 16.4 Secrets Management

**Do NOT commit to Git:**
- `.env` files
- API keys
- Database passwords
- JWT secrets
- Lazada app secret

**Use Environment Variables:**
- Development: `.env` files (in `.gitignore`)
- Production: Hosting platform env vars (Heroku Config Vars, etc.)

**Rotate Secrets Regularly:**
- Change Supabase service role key every 90 days
- Refresh Lazada app secret if compromised
- Update JWT secrets periodically

---

## Appendix

### A. Environment Variables Reference

**Client (.env):**
```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_API_URL=http://localhost:5000/api
```

**Server (.env):**
```env
PORT=5000
NODE_ENV=development
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
LAZADA_APP_KEY=your_lazada_app_key
LAZADA_APP_SECRET=your_lazada_app_secret
LAZADA_API_URL=https://api.lazada.com.ph/rest
```

### B. NPM Scripts Reference

**Root:**
- `npm run install:all` - Install all dependencies
- `npm run dev` - Run both client and server
- `npm run dev:client` - Run client only
- `npm run dev:server` - Run server only
- `npm run build` - Build client
- `npm run deploy` - Deploy to GitHub Pages
- `npm run clean` - Remove node_modules
- `npm run reinstall` - Clean and reinstall

**Client:**
- `npm run dev` - Start Vite dev server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run deploy` - Deploy to GitHub Pages

**Server:**
- `npm start` - Start production server
- `npm run dev` - Start with Nodemon (auto-reload)

### C. Useful SQL Queries

**Check user role:**
```sql
SELECT email, role FROM user_profiles WHERE email = 'user@cloudlogiclimited.com';
```

**Count orders by account:**
```sql
SELECT
  la.account_name,
  COUNT(co.id) as order_count
FROM cached_orders co
JOIN lazada_accounts la ON co.account_id = la.id
GROUP BY la.account_name;
```

**Recent sync logs:**
```sql
SELECT
  sl.sync_type,
  sl.status,
  sl.records_synced,
  sl.started_at,
  sl.completed_at,
  up.email as triggered_by
FROM sync_logs sl
JOIN user_profiles up ON sl.user_id = up.id
ORDER BY sl.started_at DESC
LIMIT 10;
```

**Active accounts:**
```sql
SELECT
  seller_id,
  account_name,
  country,
  token_expires_at,
  is_active
FROM lazada_accounts
WHERE is_active = true
ORDER BY created_at DESC;
```

**Campaign performance:**
```sql
SELECT
  campaign_name,
  SUM(spend) as total_spend,
  SUM(store_revenue) as total_revenue,
  SUM(impressions) as total_impressions,
  SUM(clicks) as total_clicks,
  AVG(ctr) as avg_ctr
FROM cached_campaign_metrics
WHERE metric_date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY campaign_name
ORDER BY total_spend DESC;
```

### D. API Response Examples

See section 7 for complete API documentation with request/response examples.

### E. Glossary

- **FFR** - Fast Fulfillment by Rider (Ready-to-ship orders)
- **RLS** - Row Level Security (Supabase database security)
- **JWT** - JSON Web Token (authentication token)
- **OAuth** - Open Authorization (authentication protocol)
- **HMAC** - Hash-based Message Authentication Code
- **SHA256** - Secure Hash Algorithm 256-bit
- **CORS** - Cross-Origin Resource Sharing
- **RBAC** - Role-Based Access Control
- **TTL** - Time To Live (cache expiry)
- **2FA** - Two-Factor Authentication
- **CSRF** - Cross-Site Request Forgery
- **XSS** - Cross-Site Scripting
- **SQL Injection** - Database attack vector
- **API** - Application Programming Interface
- **REST** - Representational State Transfer
- **SPA** - Single Page Application
- **HMR** - Hot Module Replacement (Vite)
- **SSR** - Server-Side Rendering
- **CSR** - Client-Side Rendering

### F. Additional Resources

**Documentation:**
- [Supabase Docs](https://supabase.com/docs)
- [Lazada Open Platform](https://open.lazada.com/doc/doc.htm)
- [React Documentation](https://react.dev)
- [Vite Guide](https://vitejs.dev/guide/)
- [TailwindCSS Docs](https://tailwindcss.com/docs)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)

**Tools:**
- [Postman](https://www.postman.com/) - API testing
- [DBeaver](https://dbeaver.io/) - Database client
- [VS Code](https://code.visualstudio.com/) - Code editor

**Libraries:**
- [Recharts](https://recharts.org/) - React charts
- [XLSX](https://docs.sheetjs.com/) - Excel files
- [Axios](https://axios-http.com/) - HTTP client
- [React Router](https://reactrouter.com/) - Routing

---

## Document Information

**Version:** 1.1.0
**Last Updated:** January 27, 2026
**Author:** CLL Development Team
**Contact:** support@cloudlogiclimited.com

**Change Log:**
- 2026-01-27: Removed unused action buttons from Orders table (View Items, More Actions dropdown, and all sub-actions)
- 2026-01-27: Added OMS Status placeholder column to Orders table (for future Anchanto OMS integration)
- 2026-01-27: Added in-app notification system (NotificationContext, notification bell in TopNav, sync notifications)
- 2026-01-22: Initial comprehensive documentation created

---

**End of Documentation**
