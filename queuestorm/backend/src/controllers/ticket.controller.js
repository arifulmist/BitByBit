const { validateTicket } = require('../validators/ticket.validator');
const { investigate } = require('../services/investigator.service');
const { checkSafety } = require('../services/safety.service');

const analyzeTicket = async (req, res) => {
  try {
    const { valid, error } = validateTicket(req.body);
    if (!valid) return res.status(400).json({ error });

    const result = await investigate(req.body);
    const safeResult = checkSafety(result);

    return res.status(200).json(safeResult);
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { analyzeTicket };
