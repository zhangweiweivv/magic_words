const express = require('express');
const path = require('path');
const cors = require('cors');
const healthRoutes = require('./routes/health');
const articleRoutes = require('./routes/articles');
const stateRoutes = require('./routes/state');
const configRoutes = require('./routes/config');

const app = express();
const PORT = process.env.POETRY_PORT || 3002;

app.use(cors());
app.use(express.json());

// API Routes
app.use(healthRoutes);
app.use(articleRoutes);
app.use(stateRoutes);
app.use(configRoutes);

// Serve built SPA from client/dist
const distPath = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(distPath));

// SPA fallback: serve index.html for all non-API, non-file routes
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Only listen when run directly (not when required by tests)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`📜 Poetry server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
