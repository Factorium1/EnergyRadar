import { config } from 'dotenv';

// pnpm/turbo always run this with cwd = the app root, so `.env` is this
// app's own file and `../../.env` is the repo root's shared vars.
config({ path: ['.env', '../../.env'] });

import express from 'express';
import cors from 'cors';
import { pinoHttp } from 'pino-http';
import { logger } from '../lib/logger.js';
import brands from './routes/brands.js';
import products from './routes/products.js';
import deals from './routes/deals.js';
import search from './routes/search.js';
import errorHandler from './middleware/error.js';

const app = express();
const port = process.env.PORT || 8080;

app.use(cors());
app.use(pinoHttp({ logger }));

app.use('/api/v1/deals', deals);
app.use('/api/v1/brands', brands);
app.use('/api/v1/products', products);
app.use('/api/v1/search', search);

app.use(errorHandler);
app.listen(port, () => {
  logger.info(`Server is running on Port ${port}`);
});
