const app = require('./app');
const connectDB = require('./config/db');
const config = require('./config/env');
const cron = require('node-cron');
const sessionService = require('./services/session.service');

// Connect to MongoDB
connectDB();

// Start server
const PORT = config.port;
app.listen(PORT, () => {
   console.log(`🚀 Server running on port ${PORT} in ${config.nodeEnv} mode`);
   console.log(`📍 API available at http://localhost:${PORT}/api`);
});

// Schedule session status updates to run every minute
cron.schedule('* * * * *', async () => {
   try {
      console.log('⏰ Running automatic session status updates...');
      await sessionService.autoUpdateStatuses();
   } catch (error) {
      console.error('❌ Error in status update cron job:', error.message);
   }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
   console.error('❌ Unhandled Promise Rejection:', err.message);
   console.error(err.stack);
   // Close server & exit process
   process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
   console.error('❌ Uncaught Exception:', err.message);
   console.error(err.stack);
   process.exit(1);
});
