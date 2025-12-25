# Scripts

Helper scripts for setting up and running the Passage project.

## setup.sh

Interactive setup script that:
- Checks for Node.js and npm
- Installs root dependencies
- Sets up backend (creates .env from .env.example if missing)
- Sets up frontend (creates .env.local if missing)
- Provides next steps

Usage:
```bash
./scripts/setup.sh
# Or
npm run setup
```

## dev.sh

Development startup script that:
- Checks if dependencies are installed (runs setup if needed)
- Checks PostgreSQL status
- Starts backend and frontend concurrently

Usage:
```bash
./scripts/dev.sh
# Or
npm run dev
```

## start-db.sh

Helper script to start PostgreSQL based on your OS:
- macOS: Uses Homebrew services
- Linux: Uses systemd or service

Usage:
```bash
./scripts/start-db.sh
```

## check-db.js

Node.js script to check:
- If PostgreSQL is running
- If the database exists

Usage:
```bash
node scripts/check-db.js
# Or
npm run check:db
```

