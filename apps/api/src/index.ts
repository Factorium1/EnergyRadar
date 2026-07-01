import express from 'express';
import { pinoHttp } from 'pino-http';
import pino from 'pino';
import brands from './routes/brands.js';
import products from './routes/products.js';
import deals from './routes/deals.js';
import errorHandler from './middleware/error.js';

const logger = pino({
  transport:
    process.env.NODE_ENV !== 'production'
      ? { target: 'pino-pretty' }
      : undefined,
});

const app = express();
const port = process.env.PORT || 8080;

app.use(pinoHttp({ logger }));

app.use('/api/v1/deals', deals);
app.use('/api/v1/brands', brands);
app.use('/api/v1/products', products);

app.use(errorHandler);
app.listen(port, () => {
  logger.info(`Server is running on Port ${port}`);
});
