const checkSafety = (result) => {
  const reply = (result.customer_reply || '').toLowerCase();
  const nextAction = (result.recommended_next_action || '').toLowerCase();

  let flagged = false;
  let reason = '';

  // 1. Check for credential requests (PIN, OTP, password, card details)
  const credentialNouns = [
    'pin',
    'otp',
    'password',
    'passwords',
    'card number',
    'card-number',
    'cvv',
    'cardno',
    'full card',
    'credit card',
    'debit card'
  ];

  // Check if any credential nouns are present
  for (const noun of credentialNouns) {
    if (reply.includes(noun)) {
      // Check if it is a disclaimer to protect credentials. If NOT, it might be asking for it.
      const isDisclaimer =
        reply.includes('never share') ||
        reply.includes('never ask') ||
        reply.includes('do not share') ||
        reply.includes('do not reveal') ||
        reply.includes('should not share') ||
        reply.includes('avoid sharing') ||
        reply.includes('must not share') ||
        reply.includes('keep your pin') ||
        reply.includes('do not give');

      if (!isDisclaimer) {
        flagged = true;
        reason = 'credential_request_detected';
        break;
      }
    }
  }

  // Double check explicit request patterns
  const credentialRequestPatterns = [
    /enter.*pin/i, /provide.*pin/i, /share.*pin/i, /give.*pin/i, /send.*pin/i, /verify.*pin/i, /confirm.*pin/i, /your.*pin/i,
    /enter.*otp/i, /provide.*otp/i, /share.*otp/i, /give.*otp/i, /send.*otp/i, /verify.*otp/i, /confirm.*otp/i, /your.*otp/i,
    /please.*pin/i, /please.*otp/i, /ask.*pin/i, /ask.*otp/i
  ];

  if (!flagged) {
    for (const pattern of credentialRequestPatterns) {
      if (pattern.test(reply)) {
        const isDisclaimer =
          reply.includes('never share') ||
          reply.includes('never ask') ||
          reply.includes('do not share') ||
          reply.includes('do not reveal');
        
        if (!isDisclaimer) {
          flagged = true;
          reason = 'credential_request_pattern_detected';
          break;
        }
      }
    }
  }

  // 2. Check for unauthorized refund/reversal/unblock confirmation
  const refundConfirmations = [
    'we will refund',
    'we have refunded',
    'i will refund',
    'refund you',
    'we will reverse',
    'we have reversed',
    'reverse the transaction',
    'reversal has been processed',
    'will be reversed',
    'refund has been processed',
    'refund is processed',
    'unblock your',
    'will unblock',
    'has been unblocked',
    'account is unblocked',
    'recover your',
    'will recover',
    'account is recovered',
    'account unblocked'
  ];

  for (const phrase of refundConfirmations) {
    if (reply.includes(phrase) || nextAction.includes(phrase)) {
      flagged = true;
      reason = 'unauthorized_confirmation_detected';
      break;
    }
  }

  // 3. Check for suspicious third party contact
  // If it mentions whatsapp, telegram, imo, or external phone numbers (e.g. mobile numbers starting with 01 or +8801)
  const suspiciousThirdPartyPatterns = [
    /whatsapp/i,
    /telegram/i,
    /imo/i,
    /viber/i,
    /contact.*facebook/i,
    /call.*01[3-9]\d{8}/i,
    /call.*\+?8801[3-9]\d{8}/i,
    /contact.*01[3-9]\d{8}/i,
    /contact.*\+?8801[3-9]\d{8}/i
  ];

  for (const pattern of suspiciousThirdPartyPatterns) {
    if (pattern.test(reply)) {
      flagged = true;
      reason = 'suspicious_third_party_detected';
      break;
    }
  }

  if (flagged) {
    console.log(`[Safety Guardrail] Intercepted response for: ${reason}`);
    result.human_review_required = true;
    result.reason_codes = [...(result.reason_codes || []), 'safety_flag', reason];
    result.customer_reply =
      'We have received your complaint and it is currently under review by our team. ' +
      'Any eligible amount will be returned through official channels. ' +
      'Please do not share your personal credentials (such as PIN, OTP, or password) with anyone. ' +
      'You can reach us through our official app or helpline at 16247.';
  }

  return result;
};

module.exports = { checkSafety };
