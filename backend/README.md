# Backend - NestJS API

NestJS backend API for the Passage booking system.

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v12 or higher)

## Installation

```bash
npm install
```

## Database Setup

Make sure PostgreSQL is running and create a database:

```bash
createdb passage
```

## Environment Variables

Create a `.env` file in the backend directory:

```
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=passage
JWT_SECRET=your-secret-key-change-this-in-production
JWT_EXPIRES_IN=7d
```

## Running the Application

```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

The API will be available at `http://localhost:3001`

## Database Schema

- `users` - User accounts
- `consultants` - Consultant roles for users
- `availabilities` - Weekly availability patterns for consultants
- `availability_exceptions` - Date-specific exceptions to availability
- `bookings` - Booking records

