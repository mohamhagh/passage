# Passage - Consultant Booking System

A full-stack web application for booking consultations with consultants.

## Project Structure

- `backend/` - NestJS API server
- `frontend/` - Next.js frontend application
- `shared-config.ts` - Shared configuration for skills enum

## Quick Start

### Option 1: Using Setup Scripts (Recommended)

1. **Setup the project** (installs all dependencies):
```bash
npm run setup
# Or use the script directly:
./scripts/setup.sh
```

2. **Configure environment variables**:
   - Backend: Update `backend/.env` with your database credentials
   - Frontend: `frontend/.env.local` is created automatically (or create it manually)

3. **Start PostgreSQL** (if not already running):
```bash
./scripts/start-db.sh
# Or manually:
# macOS: brew services start postgresql
# Linux: sudo systemctl start postgresql
```

4. **Create the database**:
```bash
createdb passage
# Or using psql: psql -U postgres -c "CREATE DATABASE passage;"
```

5. **Run everything** (backend + frontend concurrently):
```bash
npm run dev
# Or use the script directly:
./scripts/dev.sh
```

The application will be available at:
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:3001`

### Option 2: Manual Setup

#### Backend

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the `backend/` directory with the following:
```
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=passage
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
```

4. Make sure PostgreSQL is running and create the database:
```bash
createdb passage
```

5. Start the backend server:
```bash
npm run start:dev
```

The backend will run on `http://localhost:3001`

#### Frontend

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. (Optional) Set up environment variables:
Create a `.env.local` file in the `frontend/` directory:
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

4. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

## Available Scripts

From the root directory:

- `npm run setup` - Install all dependencies (backend + frontend)
- `npm run dev` - Run backend and frontend concurrently
- `npm run build` - Build both backend and frontend for production
- `npm run check:db` - Check if PostgreSQL is running and database exists
- `./scripts/setup.sh` - Interactive setup script
- `./scripts/dev.sh` - Development startup script with checks
- `./scripts/start-db.sh` - Helper script to start PostgreSQL

## Features

### Backend API

- Authentication (signup, login)
- User management
- Consultant role management
- Availability management
- Availability exceptions
- Booking management

### Frontend

- User authentication (login/signup)
- Home dashboard with week view calendar
- Consultant role management
- Month view calendar
- Step-by-step booking flow
- Booking management

## API Endpoints

- `POST /signup` - Create a new user
- `POST /login` - Authenticate user
- `GET /users` - Get current user data
- `PATCH /users` - Update user data
- `POST /consultants` - Create consultant role
- `GET /consultants` - Get consultants (with optional filters)
- `POST /availabilities` - Create availability
- `PATCH /availabilities/:consultantId` - Update availability
- `DELETE /availabilities/:consultantId` - Delete availability
- `GET /availabilities?consultant_id=...` - Get availability with exceptions
- `POST /availability-exceptions` - Create exception
- `PATCH /availability-exceptions/:date` - Update exception
- `DELETE /availability-exceptions/:date` - Delete exception
- `POST /bookings` - Create booking
- `PATCH /bookings/:id` - Update booking
- `DELETE /bookings/:id` - Delete booking
- `GET /bookings` - Get bookings

