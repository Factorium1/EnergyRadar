import { config } from 'dotenv'

// pnpm/turbo always run this with cwd = the app root, so `.env` is this
// app's own file and `../../.env` is the repo root's shared vars.
config({ path: ['.env', '../../.env'] })

import { app } from './app.js'
import { logger } from './lib/logger.js'

const port = process.env.PORT || 8080

app.listen(port, () => {
  logger.info(`Server is running on Port ${port}`)
})
