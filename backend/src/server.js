const app = require('./app');
const { testConnection } = require('./config/database');

const PORT = process.env.PORT || 5000;

async function startServer() {
  const isDbConnected = await testConnection();
  if (!isDbConnected) {
    console.error('CRITICAL: Database connection failed. Please check MySQL configuration.');
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`Hotel Booking Backend running on http://localhost:${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
    console.log(`Hotels endpoint: http://localhost:${PORT}/api/hotels`);
  });
}

startServer();
