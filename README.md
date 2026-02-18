# CLL - Lazada E-Commerce Management Platform

A full-stack web application for managing Lazada seller operations with advanced analytics, order management, and multi-account support.

## Overview

CLL is a comprehensive e-commerce management platform designed to streamline Lazada seller operations. The application provides real-time data synchronization, role-based access control, and powerful analytics tools to help sellers manage their online stores efficiently.

## Tech Stack

### Frontend
- **React 19.2.0** - Modern UI library
- **Vite 7.2.2** - Lightning-fast build tool
- **TailwindCSS 3.4.0** - Utility-first CSS framework
- **React Router DOM 7.9.6** - Client-side routing
- **Recharts 3.6.0** - Data visualization
- **Axios** - HTTP client
- **Lucide React** & **Heroicons** - Icon libraries
- **XLSX** - Excel export functionality

### Backend
- **Node.js 18+** - JavaScript runtime
- **Express 4.18.2** - Web framework
- **Supabase** - Database and authentication
- **node-cron 4.2.1** - Scheduled tasks
- **Axios** - API requests to Lazada

### Database
- **Supabase (PostgreSQL)** - Cloud database with real-time capabilities

### External APIs
- **Lazada Open Platform API** - E-commerce data integration

## Features

### Authentication & Authorization
- Secure login with Supabase authentication
- OAuth integration with Lazada seller accounts
- Role-based access control with three user types:
  - **Admin**: Full system access
  - **Warehouse**: Order and fulfillment management
  - **Marketing**: Data insights and analytics

### Multi-Account Management
- Connect and manage multiple Lazada seller accounts
- Switch between accounts seamlessly
- Account-specific data isolation
- Token refresh handling

### Order Management
- View and filter orders across all connected stores
- Real-time order status updates
- Order item details with product information
- Export orders to Excel

### Fulfillment (FFR)
- Ready-to-ship order tracking
- Fulfillment status monitoring
- Warehouse operations support

### Data Insights & Analytics
- Interactive charts and visualizations
- Sales performance metrics
- Product performance analysis
- Time-series data analysis
- Custom date range filtering
- Export analytics to Excel

### Data Synchronization
- Manual and scheduled data sync from Lazada API
- Sync status monitoring
- Background job scheduling with node-cron
- Sync history tracking
- Cached data service for improved performance

### Settings Management
- User profile management
- Account preferences
- Store configuration
- Token management

### User Management (Admin Only)
- Create new users with role assignment
- Manage user permissions
- View user activity

## Project Structure

```
cll/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── Auth/          # Authentication components
│   │   │   ├── Login.jsx
│   │   │   └── ForgotPassword.jsx
│   │   ├── components/    # Reusable UI components
│   │   │   ├── Sidebar.jsx
│   │   │   ├── TopNav.jsx
│   │   │   ├── DataCharts.jsx
│   │   │   └── SyncDashboard.jsx
│   │   ├── pages/         # Page components
│   │   │   ├── Dashboard.jsx
│   │   │   ├── OrderItems.jsx
│   │   │   ├── Ffr.jsx
│   │   │   ├── DataInsights.jsx
│   │   │   ├── Settings.jsx
│   │   │   ├── UserCreation.jsx
│   │   │   ├── LazadaAuth.jsx
│   │   │   └── Callback.jsx
│   │   ├── utils/         # Utility functions
│   │   │   ├── AccountManager.jsx
│   │   │   └── CachedDataService.js
│   │   ├── context/       # React context providers
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Library configurations (Supabase)
│   │   ├── App.jsx        # Main application component
│   │   └── main.jsx       # Application entry point
│   ├── dist/              # Production build output
│   ├── public/            # Static assets
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── server/                # Backend Node.js application
│   ├── routes/           # API route handlers
│   │   └── syncRoutes.js
│   ├── services/         # Business logic services
│   │   └── syncService.js
│   ├── scheduler/        # Cron job schedulers
│   ├── utils/            # Utility functions
│   │   ├── lazadaAuth.js
│   │   └── supabase.js
│   ├── server.js         # Express server entry point
│   └── package.json
│
├── database/             # Database schemas
│   └── supabase-cache-schema.sql
│
├── package.json          # Root package configuration
├── eslint.config.js      # ESLint configuration
└── README.md            # This file
```

## Installation

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0
- Supabase account
- Lazada Seller account with API credentials

### 1. Clone the repository
```bash
git clone <repository-url>
cd cll
```

### 2. Install dependencies
```bash
npm run install:all
```

This command installs dependencies for the root, client, and server directories.

### 3. Configure environment variables

#### Client (.env in client/)
```env
VITE_API_URL=http://localhost:5000/api
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### Client Production (.env.production in client/)
```env
VITE_API_URL=your_production_api_url
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### Server (.env in server/)
```env
PORT=5000
LAZADA_APP_KEY=your_lazada_app_key
LAZADA_APP_SECRET=your_lazada_app_secret
LAZADA_API_URL=https://api.lazada.com/rest
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
```

### 4. Set up Supabase database
Run the SQL schema from `database/supabase-cache-schema.sql` in your Supabase SQL editor.

## Development

### Run in development mode
```bash
# Run both client and server concurrently
npm run dev

# Or run separately:
npm run dev:client  # Frontend only (port 5173)
npm run dev:server  # Backend only (port 5000)
```

### Build for production
```bash
npm run build        # Build client
```

### Deploy
```bash
npm run deploy       # Deploy client to GitHub Pages
```

## Available Scripts

### Root level
- `npm run install:all` - Install all dependencies
- `npm run dev` - Run client and server concurrently
- `npm run dev:client` - Run client only
- `npm run dev:server` - Run server only
- `npm run build` - Build client for production
- `npm run deploy` - Deploy to GitHub Pages
- `npm run clean` - Remove all node_modules
- `npm run reinstall` - Clean and reinstall all dependencies

### Client
- `npm run dev` - Start Vite dev server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Server
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon

## API Endpoints

### Authentication
- `POST /auth/lazada/authorize` - Get Lazada authorization URL
- `GET /auth/lazada/callback` - Handle Lazada OAuth callback
- `GET /auth/lazada/accounts` - Get user's Lazada accounts

### Sync Operations
- `POST /api/sync/trigger` - Trigger manual data sync
- `GET /api/sync/status` - Get sync status
- `GET /api/sync/history` - Get sync history

### User Management
- Protected endpoints require Bearer token authentication

## Role Permissions

### Admin
- Pages: Dashboard, Orders, FFR, Data Insights, Sync, Settings, Users
- Permissions: Add stores, manage users, sync data, export data, delete data

### Warehouse
- Pages: Orders, FFR
- Permissions: Sync data, export data

### Marketing
- Pages: Data Insights
- Permissions: Sync data, export data

## Key Dependencies

### Client
- **@supabase/supabase-js**: Supabase client library
- **axios**: Promise-based HTTP client
- **react-router-dom**: Routing library
- **recharts**: Charting library
- **xlsx**: Excel file generation
- **lucide-react**: Icon set

### Server
- **express**: Web framework
- **@supabase/supabase-js**: Database client
- **node-cron**: Task scheduler
- **cors**: CORS middleware
- **dotenv**: Environment configuration

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

ISC

## Support

For issues and questions, please create an issue in the repository.

## Deployment

The application supports deployment to:
- **Frontend**: GitHub Pages (configured in package.json)
- **Backend**: Any Node.js hosting service (Heroku, DigitalOcean, AWS, etc.)

Make sure to update CORS settings in `server/server.js` to include your production domain.

## Security Notes

- All API endpoints are protected with JWT authentication
- Lazada tokens are securely stored in Supabase
- Environment variables are used for sensitive data
- CORS is configured to allow only specific origins
- Token refresh is handled automatically

## Performance Optimization

- Cached data service for reduced API calls
- Lazy loading of route components
- Optimized bundle size with Vite
- Background data synchronization
- LocalStorage caching for user profiles

## Future Enhancements

Consider implementing:
- Real-time notifications
- Advanced reporting features
- Inventory management
- Multi-marketplace support (Shopee, TikTok Shop)
- Mobile app version
- Webhook integration for real-time updates
