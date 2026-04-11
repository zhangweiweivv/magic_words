const express = require('express');
const cors = require('cors');
const healthRoutes = require('./routes/health');
const articleRoutes = require('./routes/articles');
const stateRoutes = require('./routes/state');
const configRoutes = require('./routes/config');

const app = express();
const PORT = process.env.POETRY_PORT || 3002;

app.use(cors());
app.use(express.json());

// Routes
app.use(healthRoutes);
app.use(articleRoutes);
app.use(stateRoutes);
app.use(configRoutes);

// Only listen when run directly (not when required by tests)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Poetry server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
