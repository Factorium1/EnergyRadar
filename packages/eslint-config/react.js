import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import { base } from './base.js'

export const reactConfig = [
  ...base,
  react.configs.flat.recommended,
  react.configs.flat['jsx-runtime'],
  reactHooks.configs.flat['recommended-latest'],
  {
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
]
