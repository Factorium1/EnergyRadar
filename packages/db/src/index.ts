import { config } from 'dotenv'

// pnpm/turbo always run this with cwd = the package root, so `.env` is this
// package's own file and `../../.env` is the repo root's shared vars.
config({ path: ['.env', '../../.env'] })

import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from './generated/prisma/client.js'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)

export const prisma = new PrismaClient({ adapter })

export * from './generated/prisma/client.js'
