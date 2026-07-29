import node from 'eslint-plugin-n'
import { base } from './base.js'

export const nodeConfig = [...base, node.configs['flat/recommended-module']]
