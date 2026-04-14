# Baby Tracker Documentation

This directory contains comprehensive documentation for the Baby Tracker application.

## Documentation Index

- [API Design](./api-design.md) - Sync and health endpoints (browser uses IndexedDB + service worker for feeding CRUD)
- [Database Schema](./database-schema.md) - PostgreSQL structure and `client_id` / sync fields
- [Deployment Guide](./deployment.md) - Production deployment instructions
- [UI Design](./ui-design.md) - User interface specifications and components
- [Changelog](./changelog.md) - Project version history
- [Contributing](./contributing.md) - Contribution guidelines
- [Architecture decision](./architecture-decision.md) - Offline-first architecture and sync protocol
- [Dexie schema](./dexie-schema-design.md) - Local IndexedDB schema
- [Features](./features/) - Detailed feature specifications
  - [Last Feeding Timer](./features/last-feeding-timer.md) - Real-time feeding timer feature

## Getting Started

1. **Read the main README.md** in the project root for quick setup
2. **Review the API documentation** for sync and health behavior
3. **Check the database schema** for data structure (including migrations for sync)
4. **Follow the deployment guide** for production setup

## Contributing

When adding new features or making changes:

1. Update relevant documentation files
2. Exercise sync and health endpoints where applicable, and document any changes
3. Update the database schema or migration scripts if needed
4. Follow the UI design patterns for consistency
