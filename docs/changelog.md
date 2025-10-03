# Changelog

All notable changes to the Baby Tracker project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- ✅ PWA (Progressive Web App) functionality - **COMPLETED**
- ✅ App installation support for mobile and desktop - **COMPLETED**
- ✅ Service worker for offline caching - **COMPLETED**
- ✅ App manifest with proper icons - **COMPLETED**
- ✅ Install prompt and manual installation fallback - **COMPLETED**
- ✅ Time button grid view for feeding history - **COMPLETED**
- ✅ Daily grouped feeding display with clickable time buttons - **COMPLETED**
- ✅ Feeding details modal with edit/delete functionality - **COMPLETED**
- ✅ View toggle between list and grid views - **COMPLETED**
- ✅ Uniform time button sizing with monospace font - **COMPLETED**
- ✅ Improved time display in details modal (time first, date second) - **COMPLETED**
- ✅ Enhanced PWA update notifications for better user experience - **COMPLETED**
- ✅ Documentation organization and structure - **COMPLETED**
- ✅ Comprehensive .gitignore for Nuxt 4 projects - **COMPLETED**
- ✅ MIT License - **COMPLETED**
- ✅ Contributing guidelines - **COMPLETED**
- ✅ Changelog tracking - **COMPLETED**
- ✅ Enhanced Quick Save button with timer - **COMPLETED**
  - Real-time display of time since last feeding on Quick Save button
  - Two-line layout: "FEED NOW" + time info with "since last" phrasing
  - Color-coded urgency (green < 3h, orange 3-4h, red 4h+) with hard thresholds
  - Special "Just fed" state for anything under 1 minute
  - Automatic updates every minute
  - Rounded rectangle button design (w-32 h-16) with improved typography
  - Graceful handling of empty feeding history and edge cases

### Changed
- ✅ Default history view changed from list to time button grid - **COMPLETED**
- ✅ History view now supports two display modes with toggle button - **COMPLETED**

### Fixed
- ✅ Delete functionality now properly updates global state - **COMPLETED**
- ✅ Time buttons disappear immediately after deletion - **COMPLETED**
- ✅ Proper Heroicons list-bullet icon for view toggle - **COMPLETED**
- ✅ Floating buttons hidden when modals are open (z-index solution) - **COMPLETED**
- ✅ Toast notifications always visible above modals (z-index 80) - **COMPLETED**
- ✅ Toast notifications for edit/delete operations in details modal - **COMPLETED**
- ✅ PWA update handling with user-friendly notifications - **COMPLETED**

## [0.1.0] - 2024-09-17

### Added
- Initial project setup with Nuxt 4
- PostgreSQL database integration
- Basic CRUD API endpoints
- Quick save functionality
- History management
- Dark mode support
- Mobile responsive design
- Complete documentation suite
- API design documentation
- Database schema documentation
- Deployment guide
- UI/UX design specifications

### Changed
- Migrated from Nuxt UI to custom Tailwind CSS components
- Updated port configuration to 3300
- Organized documentation structure

### Fixed
- Database connection issues
- Import path errors in API endpoints
- Dark theme text visibility issues

### Technical Details
- Built with Nuxt 4, Vue 3, TypeScript
- PostgreSQL database with pg driver
- Custom Tailwind CSS styling
- Server API routes for all operations
- Mobile-first responsive design
