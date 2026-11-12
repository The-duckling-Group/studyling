// ============================================================================
// Vercel Serverless Catch-All Route: /api/[...route].js
// Forwards any /api/* request to the unified handler
// ============================================================================

const handler = require('./index');

module.exports = handler;
