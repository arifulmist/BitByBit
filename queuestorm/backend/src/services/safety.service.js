const FORBIDDEN_PHRASES = [
  'enter your pin',
  'provide your pin',
  'share your pin',
  'your otp',
  'enter otp',
  'share otp',
  'password',
  'card number',
  'we will refund you',
  'you will receive a refund',
  'refund has been processed',
  'we will reverse',
  'account will be unblocked',
  'contact this number',
  'call this number',
  'whatsapp',
];

const checkSafety = (result) => {
  const reply = (result.customer_reply || '').toLowerCase();
  const nextAction = (result.recommended_next_action || '').toLowerCase();

  let flagged = false;
  for (const phrase of FORBIDDEN_PHRASES) {
    if (reply.includes(phrase) || nextAction.includes(phrase)) {
      flagged = true;
      break;
    }
  }

  if (flagged) {
    result.human_review_required = true;
    result.reason_codes = [...(result.reason_codes || []), 'safety_flag'];
    result.customer_reply =
      'We have received your complaint and it is currently under review by our team. ' +
      'Any eligible amount will be returned through official channels. ' +
      'Please do not share your personal credentials with anyone. ' +
      'You can reach us through our official app or helpline.';
  }

  return result;
};

module.exports = { checkSafety };
