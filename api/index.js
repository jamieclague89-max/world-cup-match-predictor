/**
 * Vercel Serverless Function entry point.
 * All /api/* requests are routed here by vercel.json rewrites.
 * The Express app handles routing internally.
 */
module.exports = require('../server/server');
