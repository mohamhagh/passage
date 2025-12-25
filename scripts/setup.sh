#!/bin/bash

set -e

echo "🚀 Setting up Passage project..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✅ Node.js found: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ npm found: $(npm --version)"

# Install root dependencies
echo ""
echo "📦 Installing root dependencies..."
npm install

# Setup backend
echo ""
echo "📦 Setting up backend..."
cd backend
if [ ! -f ".env" ]; then
    echo "⚠️  No .env file found in backend. Creating from template..."
    if [ -f "env.template" ]; then
        cp env.template .env
        echo "✅ Created .env file from template. Please update it with your database credentials."
    elif [ -f ".env.example" ]; then
        cp .env.example .env
        echo "✅ Created .env file from .env.example. Please update it with your database credentials."
    else
        echo "⚠️  No template found. You'll need to create a .env file manually with:"
        echo "   DATABASE_HOST=localhost"
        echo "   DATABASE_PORT=5432"
        echo "   DATABASE_USER=postgres"
        echo "   DATABASE_PASSWORD=postgres"
        echo "   DATABASE_NAME=passage"
        echo "   JWT_SECRET=your-secret-key"
        echo "   JWT_EXPIRES_IN=7d"
    fi
fi
npm install
cd ..

# Setup frontend
echo ""
echo "📦 Setting up frontend..."
cd frontend
npm install
if [ ! -f ".env.local" ]; then
    echo "⚠️  No .env.local file found in frontend. Creating default..."
    echo "NEXT_PUBLIC_API_URL=http://localhost:3001" > .env.local
    echo "✅ Created .env.local file."
fi
cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Make sure PostgreSQL is running"
echo "2. Update backend/.env with your database credentials"
echo "3. Create the database: createdb passage (or use your preferred method)"
echo "4. Run the project: npm run dev"
echo ""

