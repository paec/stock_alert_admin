# Frontend Migration Guide

## Overview

The frontend has been migrated from a CDN-based Vue application to a standard Vue 3 project using Vite as the build tool. This provides better development experience, package management, and maintainability.

## What Changed

### Before (CDN-based)
- Vue, Vue Router, PrimeVue loaded from CDN at runtime
- Manual component loading with separate HTML templates
- No build step required
- Direct serving of static files from `web/`

### After (Package-managed)
- Vue, Vue Router, PrimeVue installed via npm
- Single File Components (.vue files)
- Vite build tool for development and production
- Built output served from `web/dist/`

## Project Structure

```
web/
├── src/
│   ├── main.js              # App entry point
│   ├── App.vue              # Root component with navigation
│   ├── router/
│   │   └── index.js         # Vue Router configuration
│   ├── views/
│   │   ├── HomeView.vue     # Home/settings page
│   │   └── AdminView.vue    # Admin dashboard page
│   ├── components/
│   │   └── AdminOverviewPanel.vue
│   ├── services/
│   │   ├── api.js           # Base API utilities
│   │   ├── configService.js # Config API calls
│   │   └── adminService.js  # Admin API calls
│   └── assets/
│       └── styles.css       # Global styles
├── dist/                    # Built output (generated)
├── index.html               # Vite entry HTML
├── package.json             # Dependencies
└── vite.config.js           # Vite configuration

backend/
├── app.py                   # Flask backend (updated to serve web/dist/)
└── ...
```

## Development Workflow

### First-time Setup

1. **Install frontend dependencies:**
   ```bash
   cd web
   npm install
   ```

2. **Initialize backend database:**
   ```bash
   python backend/init_db.py
   ```

### Development Mode

There are two ways to develop:

#### Option 1: Frontend + Backend Separately (Recommended)

Run frontend dev server with hot reload:
```bash
cd web
npm run dev
```
This starts Vite dev server at http://localhost:5173 with API proxy to backend.

In another terminal, run Flask backend:
```bash
python backend/app.py
```
This starts Flask at http://127.0.0.1:5000

The Vite dev server will proxy all `/api/*` requests to the Flask backend.

#### Option 2: Build and Serve from Flask

Build the frontend:
```bash
cd web
npm run build
```

Then run Flask which will serve the built frontend:
```bash
python backend/app.py
```
Visit http://127.0.0.1:5000

### Production Build

```bash
cd web
npm run build
```

This creates optimized production files in `web/dist/`.

The Flask backend automatically serves from `web/dist/` if it exists, otherwise falls back to `web/`.

## Key Features Preserved

✅ All existing routes (`/`, `/admin`)  
✅ All backend API endpoints (`/api/config`, `/api/admin/trigger-job`)  
✅ Hash-based routing (no backend routing changes needed)  
✅ Tabulator integration for editable table  
✅ PrimeVue components  
✅ All UI functionality and styling  

## Migration Benefits

- **Better Developer Experience**: Hot module replacement, better error messages
- **Package Management**: Locked dependency versions, security updates
- **Type Safety**: Easier to add TypeScript later
- **Code Organization**: Single File Components are more maintainable
- **Modern Tooling**: Vite provides fast builds and dev server
- **Centralized API**: API calls now in service layer for consistency

## Breaking Changes

None! The migration is backward-compatible:
- Backend API contracts unchanged
- Routes unchanged
- UI behavior unchanged
- Flask can still serve the application

## Troubleshooting

### "Cannot GET /" in dev mode
Make sure Flask backend is running on port 5000 for API proxy to work.

### Build output too large warning
This is expected for first build. The main bundle includes Vue, PrimeVue, and Tabulator.
For optimization, consider code-splitting in the future.

### Flask serves old frontend
Run `npm run build` to regenerate `web/dist/`. Flask prefers `web/dist/` over `web/`.

## Next Steps (Optional Future Enhancements)

- Add TypeScript for type safety
- Split large dependencies using dynamic imports
- Add state management (Pinia) if app grows
- Add automated tests (Vitest)
- Consider migrating to history mode routing (requires backend changes)

## Migration Checklist for Developers

When making changes:
- ✅ Edit `.vue` files in `src/`, not old files in `web/`
- ✅ Use service layer (`src/services/`) for API calls
- ✅ Run `npm run build` before deploying
- ✅ Test both dev mode and built version
