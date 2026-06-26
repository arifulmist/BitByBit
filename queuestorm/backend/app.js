const express = require('express');
const app = express();

const requestLogger = require('./src/middleware/requestLogger');
const errorHandler = require('./src/middleware/errorHandler');
const healthRoutes = require('./src/routes/health.routes');
const analyzeRoutes = require('./src/routes/analyze.routes');

app.use(express.json());
app.use(requestLogger);

app.use('/', healthRoutes);
app.use('/', analyzeRoutes);

app.use(errorHandler);

module.exports = app;
