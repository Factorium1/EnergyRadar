import express from 'express';
import { pinoHttp } from 'pino-http';
import { logger } from '../lib/logger.js';
import brands from './routes/brands.js';
import products from './routes/products.js';
import deals from './routes/deals.js';
import search from './routes/search.js';
import errorHandler from './middleware/error.js';

const app = express();
const port = process.env.PORT || 8080;

app.use(pinoHttp({ logger }));

app.use('/api/v1/deals', deals);
app.use('/api/v1/brands', brands);
app.use('/api/v1/products', products);
app.use('/api/v1/search', search);

app.use(errorHandler);
app.listen(port, () => {
  logger.info(`Server is running on Port ${port}`);
});
