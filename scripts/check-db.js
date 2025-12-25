const { execSync } = require('child_process');

function checkPostgreSQL() {
  try {
    // Try to check if PostgreSQL is running
    execSync('pg_isready -h localhost', { stdio: 'ignore' });
    console.log('✅ PostgreSQL is running');
    return true;
  } catch (error) {
    console.log('❌ PostgreSQL is not running or not accessible');
    console.log('💡 Please start PostgreSQL before running the application');
    console.log('   On macOS with Homebrew: brew services start postgresql');
    console.log('   Or start it using your preferred method');
    return false;
  }
}

function checkDatabaseExists() {
  try {
    execSync('psql -h localhost -U postgres -lqt | cut -d \\| -f 1 | grep -qw passage', { 
      stdio: 'ignore',
      env: { ...process.env, PGPASSWORD: process.env.DATABASE_PASSWORD || 'postgres' }
    });
    console.log('✅ Database "passage" exists');
    return true;
  } catch (error) {
    console.log('⚠️  Database "passage" does not exist');
    console.log('💡 Create it with: createdb passage');
    return false;
  }
}

if (require.main === module) {
  const pgRunning = checkPostgreSQL();
  if (pgRunning) {
    checkDatabaseExists();
  }
  process.exit(pgRunning ? 0 : 1);
}

module.exports = { checkPostgreSQL, checkDatabaseExists };

