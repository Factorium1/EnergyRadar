import next from '@next/eslint-plugin-next'
import { reactConfig } from './react.js'

export const nextConfig = [...reactConfig, next.flatConfig.coreWebVitals]
