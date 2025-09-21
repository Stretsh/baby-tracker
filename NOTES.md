# Baby Tracker - Development Notes

## 🎯 Current Status
- ✅ **Deployed**: Successfully running on production network
- ✅ **User Feedback**: Wifey likes the app!
- ✅ **Core Features**: Timezone handling, toast notifications, feeding tracking

## 📋 Feature Requests & Improvements

### 🔥 High Priority Features

#### 1. PWA Implementation
**Goal**: Make it feel like a native app with home screen shortcut
- Add manifest.json and service worker for app-like experience
- Configure PWA icons and splash screens for mobile devices
- Add PWA install prompt and offline capabilities
- **User Benefit**: One-tap access from home screen, no browser UI clutter

#### 2. History Redesign
**Goal**: Daily grouped view with time buttons instead of flat list
- Group feedings by date (local time)
- Display times as clickable buttons
- Modal popup for details/edit/delete when clicking time buttons
- **Current**: Flat list of all feedings
- **New**: Daily groups with time buttons like [14:30] [16:45] [19:20]

### 🐛 Bug Fixes

#### 3. Floating Buttons Visibility
**Issue**: When a modal is shown, the floating buttons are still visible
- Hide floating buttons when modals are open
- Improve modal z-index and backdrop handling
- Better UX for modal interactions

### 🚀 Deployment Improvements

#### 4. Git Management
- Add `ecosystem.config.cjs` to `.gitignore`
- Create `ecosystem.config.example.cjs` template file
- Update deployment documentation with PM2 setup instructions

## 🛠️ Technical Implementation Notes

### Current Architecture
- **Frontend**: Nuxt 4, Vue 3, TypeScript, Tailwind CSS 4
- **Backend**: Nuxt Server API, PostgreSQL
- **Deployment**: PM2 with ecosystem.config.cjs
- **Database**: PostgreSQL with proper timezone handling (UTC storage, local display)

### Key Components
- `FloatingButtons.vue` - Quick save functionality
- `FeedingForm.vue` - Main form with timezone handling
- `HistoryView.vue` - Current flat list (needs redesign)
- `Toast.vue` - Enhanced notifications with progress bar
- `useFeedings.js` - Global state management
- `useToast.js` - Toast notification system

### Database Schema
- `feeding_records` table with UTC timestamp storage
- Proper timezone conversion using Luxon
- API endpoints handle UTC ↔ local time conversion

## 📱 PWA Implementation Plan

### Phase 1: Basic PWA Setup
1. Add Nuxt PWA module
2. Configure manifest.json
3. Set up service worker
4. Add app icons (192x192, 512x512)

### Phase 2: Enhanced PWA Features
1. Offline functionality
2. Install prompt
3. Splash screens
4. App-like navigation

## 📅 History Redesign Plan

### Current Structure
```
- Feeding 1 (14:30)
- Feeding 2 (16:45)  
- Feeding 3 (19:20)
```

### New Structure
```
📅 Today
  [14:30] [16:45] [19:20]
  
📅 Yesterday  
  [08:15] [12:30] [18:00]
```

### Implementation Steps
1. Group feedings by date
2. Create time button components
3. Implement click-to-details modal
4. Add edit/delete functionality
5. Smooth animations

## 🎨 UI/UX Improvements

### Modal System
- Fix floating buttons visibility
- Improve z-index management
- Better backdrop handling
- Consistent modal behavior

### User Experience
- One-tap access (PWA)
- Intuitive daily grouping
- Quick time-based navigation
- Smooth transitions

## 🚀 Deployment Notes

### Current Setup
- **Port**: 3300 (configured in nuxt.config.ts)
- **Database**: PostgreSQL on 192.168.5.11:5433
- **PM2**: ecosystem.config.cjs with environment variables
- **Network**: Accessible on local network

### Environment Variables
```javascript
NUXT_PUBLIC_DB_HOST: '192.168.5.11'
NUXT_PUBLIC_DB_PORT: '5433'
NUXT_PUBLIC_DB_NAME: 'baby-tracker'
NUXT_PUBLIC_DB_USER: 'baby-tracker'
NUXT_DB_PASSWORD: 'WqlytAdxShWV4qRA2Het'
```

## 📝 Development Context

### User Feedback
- **Wifey likes it!** 🎉
- Wants PWA for quick access
- Prefers daily grouped history
- Time buttons for quick navigation

### Technical Debt
- Floating buttons visibility issue
- Git management (ecosystem file)
- Documentation updates needed

### Next Steps Priority
1. **PWA** - Most requested by user
2. **History redesign** - Better daily UX
3. **UI fixes** - Polish experience
4. **Deployment** - Clean up repo

---

*Last updated: $(date)*
*Context files available in: `/home/rehuel/projects/cursor-context/baby-tracker`*
