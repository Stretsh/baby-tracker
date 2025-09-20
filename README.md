# Baby Tracker

A simple baby feeding tracking application built with Nuxt 4, Vue 3, and Tailwind CSS. Designed for quick feeding record entry and history management.

## Features

- **Quick Save**: One-click feeding record with current time
- **Quick Food Buttons**: Save immediately with frequently used foods
- **History Management**: View, edit, and delete feeding records
- **Search**: Find feedings by food type or notes
- **Dark Mode**: Toggle between light and dark themes
- **Mobile Responsive**: Works on phones, tablets, and desktops

## Tech Stack

- **Frontend**: Nuxt 4, Vue 3, TypeScript, Tailwind CSS 4
- **Backend**: Nuxt Server API, PostgreSQL
- **UI**: Custom HTML/CSS with Tailwind (no external UI library)
- **Database**: PostgreSQL with pg driver

## Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp env.example .env
   # Edit .env with your database credentials
   ```

3. **Set up database**:
   ```bash
   # Create PostgreSQL database
   createdb baby_feeding
   
   # Run schema
   psql baby_feeding < schema.sql
   ```

4. **Start development server**:
   ```bash
   npm run dev
   ```
   
   The app will be available at `http://localhost:3300`

## Environment Variables

Create a `.env` file with your database configuration:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=baby_feeding
DB_USER=your_username
DB_PASSWORD=your_password
```

## API Endpoints

- `GET /api/feedings` - List all feeding records
- `POST /api/feedings` - Create new feeding record
- `PUT /api/feedings/:id` - Update feeding record
- `DELETE /api/feedings/:id` - Delete feeding record
- `GET /api/food-types` - Get food type suggestions
- `GET /api/food-types/recent` - Get recently used foods
- `GET /api/health` - Health check endpoint

## Project Structure

```
baby-tracker/
├── app/                    # Nuxt 4 app directory
│   ├── components/         # Vue components
│   ├── layouts/           # Layout components
│   ├── pages/             # Pages/routes
│   └── assets/            # CSS and static assets
├── server/                # Server-side code
│   ├── api/               # API routes
│   └── utils/             # Server utilities
├── docs/                  # Documentation
├── schema.sql             # Database schema
└── nuxt.config.ts         # Nuxt configuration
```

## Documentation

- [API Design](./docs/api-design.md) - API endpoint documentation
- [Database Schema](./docs/database-schema.md) - Database structure
- [Deployment Guide](./docs/deployment.md) - Production deployment
- [UI Design](./docs/ui-design.md) - User interface specifications
- [Changelog](./docs/changelog.md) - Version history
- [Contributing](./docs/contributing.md) - Contribution guidelines

## Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## License

MIT License - see LICENSE file for details.
