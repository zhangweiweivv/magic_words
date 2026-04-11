const express = require('express')
const path = require('path')

const app = express()
const PORT = process.env.PORTAL_PORT || 3010

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'keke-portal', timestamp: new Date().toISOString() })
})

// Serve static files from portal client dist
const distPath = path.join(__dirname, '..', 'client', 'dist')
app.use(express.static(distPath))

// SPA fallback: serve index.html for all non-file routes
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

app.listen(PORT, () => {
  console.log(`🏰 Portal server running on http://localhost:${PORT}`)
})
