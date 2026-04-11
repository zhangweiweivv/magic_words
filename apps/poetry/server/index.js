const express = require('express');
const cors = require('cors');
const healthRoutes = require('./routes/health');

const app = express();
const PORT = process.env.POETRY_PORT || 3002;

app.use(cors());
app.use(express.json());

// Routes
app.use(healthRoutes);

app.listen(PORT, () => {
  console.log(`Poetry server running on http://localhost:${PORT}`);
});

module.exports = app;
