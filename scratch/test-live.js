import { GoogleGenAI } from '@google/genai'
import { safeStorage } from 'electron'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { app } from 'electron'

// This script will run in electron context or node
console.log('Testing Gemini connection...')
