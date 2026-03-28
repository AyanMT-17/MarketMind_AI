import { startServer } from './src/app.js';

startServer().then((serverInstance) => {
  const shutdown = async () => {
    await new Promise((resolve) => serverInstance.close(resolve));
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
});
