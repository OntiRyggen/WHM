require('dotenv').config();
const app = require('./app');
const { checkHealth, closePool } = require('./db/connection');

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    console.log('Checking database connection...');
    const health = await checkHealth();
    
    if (!health.healthy) {
      console.error('Database connection failed:', health.error);
      console.error('Please ensure PostgreSQL is running and configured correctly.');
      process.exit(1);
    }
    
    console.log('Database connection successful');
    
    const server = app.listen(PORT, () => {
      console.log(`Warehouse Management System running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
    });
    
    const gracefulShutdown = async () => {
      console.log('\nShutting down gracefully...');
      
      server.close(async () => {
        console.log('HTTP server closed');
        
        await closePool();
        console.log('Database connections closed');
        
        process.exit(0);
      });
      
      setTimeout(() => {
        console.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };
    
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
