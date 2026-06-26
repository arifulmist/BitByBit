const express = require('express');
const router = express.Router();
const { analyzeTicket } = require('../controllers/ticket.controller');

router.post('/analyze-ticket', analyzeTicket);

module.exports = router;
