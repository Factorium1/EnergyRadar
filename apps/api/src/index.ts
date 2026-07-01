import express from 'express';
import { pinoHttp } from 'pino-http';
import pino from 'pino';

const logger = pino({
  transport:
    process.env.NODE_ENV !== 'production'
      ? { target: 'pino-pretty' }
      : undefined,
});

const app = express();
const port = process.env.PORT || 8080;

app.use(pinoHttp({ logger }));

app.listen(port, () => {
  logger.info(`Server is running on Port ${port}`);
});
