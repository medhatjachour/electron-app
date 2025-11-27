const { execSync } = require('child_process')
const path = require('path')
const fs = require('fs')

// Create a template sqlite DB with schema and minimal seed (admin user)
const repoRoot = path.resolve(__dirname, '..')
const templatePath = path.join(repoRoot, 'prisma', 'template.db')

console.log('Creating template DB at', templatePath)

// Ensure prisma client generated
execSync('npm run prisma:generate', { stdio: 'inherit', cwd: repoRoot, env: process.env })

// Run prisma db push to initialize schema into template.db
const env = Object.assign({}, process.env)
env.DATABASE_URL = `file:${templatePath}`

console.log('Pushing Prisma schema to template DB...')
execSync('npx prisma db push --schema=prisma/schema.prisma', { stdio: 'inherit', cwd: repoRoot, env })

// Run production seed to create setup account in template.db
console.log('Seeding setup account into template DB (production seed)...')
execSync('npx ts-node prisma/seed-production.ts', { stdio: 'inherit', cwd: repoRoot, env })

console.log('Template DB created successfully:', templatePath)
