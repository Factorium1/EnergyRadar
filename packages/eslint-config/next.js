import nextVitals from 'eslint-config-next/core-web-vitals'
import { base } from './base.js'

export const nextConfig = [
  ...base,
  ...nextVitals,
]