// run_port.js
// Helper to run server/index.js on a custom port without shell env assignment.
// Usage: node run_port.js 3999

const port = process.argv[2];
if (port) process.env.PORT = String(port);

// Require after setting env so server/index.js uses it.
require('./index');
