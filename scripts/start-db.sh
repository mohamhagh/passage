#!/bin/bash

# Script to start PostgreSQL database
# This is a helper script - adjust based on your setup

OS="$(uname -s)"

case "$OS" in
    Darwin*)
        echo "🍎 macOS detected"
        if command -v brew &> /dev/null; then
            echo "Starting PostgreSQL via Homebrew..."
            brew services start postgresql@14 || brew services start postgresql
        else
            echo "Homebrew not found. Please start PostgreSQL manually."
            exit 1
        fi
        ;;
    Linux*)
        echo "🐧 Linux detected"
        if command -v systemctl &> /dev/null; then
            echo "Starting PostgreSQL via systemd..."
            sudo systemctl start postgresql
        elif command -v service &> /dev/null; then
            echo "Starting PostgreSQL via service..."
            sudo service postgresql start
        else
            echo "Please start PostgreSQL manually."
            exit 1
        fi
        ;;
    *)
        echo "❌ Unsupported OS. Please start PostgreSQL manually."
        exit 1
        ;;
esac

echo "✅ PostgreSQL should be starting..."
echo "💡 Wait a few seconds and check with: pg_isready"

