const validateTicket = (body) => {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Invalid JSON body' };
  }
  if (!body.ticket_id || typeof body.ticket_id !== 'string') {
    return { valid: false, error: 'Missing or invalid field: ticket_id' };
  }
  if (!body.complaint || typeof body.complaint !== 'string' || body.complaint.trim() === '') {
    return { valid: false, error: 'Missing or empty field: complaint' };
  }
  if (body.transaction_history && !Array.isArray(body.transaction_history)) {
    return { valid: false, error: 'transaction_history must be an array' };
  }
  return { valid: true };
};

module.exports = { validateTicket };
