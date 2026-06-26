import React, { useState, useEffect } from 'react';

// Interfaces for structured data
interface Transaction {
  transaction_id: string;
  timestamp: string;
  type: 'transfer' | 'payment' | 'cash_in' | 'cash_out' | 'settlement' | 'refund';
  amount: number;
  counterparty: string;
  status: 'completed' | 'failed' | 'pending' | 'reversed';
}

interface TicketInput {
  ticket_id: string;
  complaint: string;
  language: 'en' | 'bn' | 'mixed';
  channel: 'in_app_chat' | 'call_center' | 'email' | 'merchant_portal' | 'field_agent';
  user_type: 'customer' | 'merchant' | 'agent' | 'unknown';
  campaign_context: string;
  transaction_history: Transaction[];
}

interface AnalysisResult {
  ticket_id: string;
  relevant_transaction_id: string | null;
  evidence_verdict: 'consistent' | 'inconsistent' | 'insufficient_data';
  case_type:
    | 'wrong_transfer'
    | 'payment_failed'
    | 'refund_request'
    | 'duplicate_payment'
    | 'merchant_settlement_delay'
    | 'agent_cash_in_issue'
    | 'phishing_or_social_engineering'
    | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  department:
    | 'customer_support'
    | 'dispute_resolution'
    | 'payments_ops'
    | 'merchant_operations'
    | 'agent_operations'
    | 'fraud_risk';
  agent_summary: string;
  recommended_next_action: string;
  customer_reply: string;
  human_review_required: boolean;
  confidence: number;
  reason_codes: string[];
}

// Preset Test Cases
const PRESETS: { name: string; desc: string; data: TicketInput }[] = [
  {
    name: 'Wrong Transfer (Consistent)',
    desc: 'Customer sent money to a wrong number. History shows completed transfer.',
    data: {
      ticket_id: 'TKT-101',
      complaint: 'I sent 5000 BDT to the wrong number +8801719876543 around 2 PM today. Please revert this transaction and refund my money!',
      language: 'en',
      channel: 'in_app_chat',
      user_type: 'customer',
      campaign_context: 'boishakh_bonanza_day_1',
      transaction_history: [
        {
          transaction_id: 'TXN-9101',
          timestamp: '2026-04-14T14:08:22Z',
          type: 'transfer',
          amount: 5000,
          counterparty: '+8801719876543',
          status: 'completed'
        },
        {
          transaction_id: 'TXN-9021',
          timestamp: '2026-04-14T10:12:00Z',
          type: 'payment',
          amount: 350,
          counterparty: 'merchant_dhaka_food',
          status: 'completed'
        }
      ]
    }
  },
  {
    name: 'Failed Payment (Inconsistent)',
    desc: 'Customer says payment failed, but transaction is marked completed.',
    data: {
      ticket_id: 'TKT-102',
      complaint: 'Tried to pay 1200 taka at merchant shop, app showed "payment failed" but the money was cut from my wallet. Please refund immediately!',
      language: 'mixed',
      channel: 'in_app_chat',
      user_type: 'customer',
      campaign_context: 'ramadan_cashback_2026',
      transaction_history: [
        {
          transaction_id: 'TXN-9102',
          timestamp: '2026-04-15T18:02:10Z',
          type: 'payment',
          amount: 1200,
          counterparty: 'merchant_grocery_super',
          status: 'completed'
        }
      ]
    }
  },
  {
    name: 'Phishing Attempt (Safety Alert)',
    desc: 'Scam call asking for OTP/PIN. Triggers fraud routing & auto-reply block.',
    data: {
      ticket_id: 'TKT-103',
      complaint: 'Amar kache +8801999111222 theke phone kore bolse ami 10,000 taka cashback jitesi. Confirm korar jonno PIN ar phone asha OTP code chaisilo. Ami OTP ar PIN share korsi. Tarpor dekhi 4000 taka send money hoye gese!',
      language: 'mixed',
      channel: 'call_center',
      user_type: 'customer',
      campaign_context: 'none',
      transaction_history: [
        {
          transaction_id: 'TXN-9103',
          timestamp: '2026-04-16T11:15:30Z',
          type: 'cash_out',
          amount: 4000,
          counterparty: 'agent_scam_cashout',
          status: 'completed'
        }
      ]
    }
  },
  {
    name: 'Duplicate Payment (Consistent)',
    desc: 'Two identical charges within a minute. System identifies duplicate.',
    data: {
      ticket_id: 'TKT-104',
      complaint: 'I paid 450 taka at grocery, but history shows it charged twice! Same shop, same amount. Fix this.',
      language: 'en',
      channel: 'in_app_chat',
      user_type: 'customer',
      campaign_context: 'none',
      transaction_history: [
        {
          transaction_id: 'TXN-9104',
          timestamp: '2026-04-17T09:30:00Z',
          type: 'payment',
          amount: 450,
          counterparty: 'merchant_grocery',
          status: 'completed'
        },
        {
          transaction_id: 'TXN-9105',
          timestamp: '2026-04-17T09:30:45Z',
          type: 'payment',
          amount: 450,
          counterparty: 'merchant_grocery',
          status: 'completed'
        }
      ]
    }
  },
  {
    name: 'Insufficient Transaction Data',
    desc: 'Vague complaint, history has no matching amounts or recipients.',
    data: {
      ticket_id: 'TKT-105',
      complaint: 'I think some money disappeared from my wallet last week. I had around 800 BDT, now it is less. Refund me.',
      language: 'en',
      channel: 'email',
      user_type: 'customer',
      campaign_context: 'none',
      transaction_history: [
        {
          transaction_id: 'TXN-8812',
          timestamp: '2026-04-10T12:00:00Z',
          type: 'cash_in',
          amount: 2000,
          counterparty: 'agent_main_branch',
          status: 'completed'
        }
      ]
    }
  }
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<'form' | 'json'>('form');
  const [ticketState, setTicketState] = useState<TicketInput>({
    ticket_id: 'TKT-001',
    complaint: '',
    language: 'en',
    channel: 'in_app_chat',
    user_type: 'customer',
    campaign_context: 'none',
    transaction_history: [
      {
        transaction_id: 'TXN-1001',
        timestamp: new Date().toISOString(),
        type: 'transfer',
        amount: 2000,
        counterparty: '+8801700000000',
        status: 'completed',
      },
    ],
  });
  
  const [rawJsonStr, setRawJsonStr] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [serverOnline, setServerOnline] = useState<boolean | null>(null);
  const [isSimulated, setIsSimulated] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Sync rawJsonStr when ticketState changes
  useEffect(() => {
    try {
      setRawJsonStr(JSON.stringify(ticketState, null, 2));
    } catch (e) {}
  }, [ticketState]);

  // Ping health endpoint to determine if backend is online
  const checkHealth = async () => {
    try {
      const res = await fetch('/health', { signal: AbortSignal.timeout(2000) });
      const data = await res.json();
      if (data && data.status === 'ok') {
        setServerOnline(true);
      } else {
        setServerOnline(false);
      }
    } catch (e) {
      setServerOnline(false);
    }
  };

  useEffect(() => {
    checkHealth();
    // Re-check periodically
    const interval = setInterval(checkHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  const handlePresetSelect = (preset: TicketInput) => {
    setTicketState(preset);
  };

  const handleRawJsonChange = (val: string) => {
    setRawJsonStr(val);
    try {
      const parsed = JSON.parse(val);
      if (parsed.ticket_id && parsed.complaint) {
        setTicketState(parsed);
      }
    } catch (e) {
      // Allow invalid json while typing
    }
  };

  const updateTicketField = (field: keyof TicketInput, val: any) => {
    setTicketState((prev) => ({ ...prev, [field]: val }));
  };

  // Dynamic Transaction Handlers
  const addTransaction = () => {
    const newTx: Transaction = {
      transaction_id: `TXN-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString(),
      type: 'transfer',
      amount: 1000,
      counterparty: '+8801700000000',
      status: 'completed',
    };
    setTicketState((prev) => ({
      ...prev,
      transaction_history: [...prev.transaction_history, newTx],
    }));
  };

  const removeTransaction = (index: number) => {
    setTicketState((prev) => {
      const updated = [...prev.transaction_history];
      updated.splice(index, 1);
      return { ...prev, transaction_history: updated };
    });
  };

  const updateTransactionField = (index: number, field: keyof Transaction, val: any) => {
    setTicketState((prev) => {
      const updated = prev.transaction_history.map((tx, idx) => {
        if (idx === index) {
          let updatedVal = val;
          if (field === 'amount') {
            updatedVal = parseFloat(val) || 0;
          }
          return { ...tx, [field]: updatedVal };
        }
        return tx;
      });
      return { ...prev, transaction_history: updated };
    });
  };

  // Smart Client-side Simulator (for offline/demo fallback mode)
  const runSimulatedAnalysis = (input: TicketInput): AnalysisResult => {
    const text = (input.complaint || '').toLowerCase();
    const history = input.transaction_history || [];
    
    let verdict: 'consistent' | 'inconsistent' | 'insufficient_data' = 'insufficient_data';
    let relevantId: string | null = null;
    let caseType: AnalysisResult['case_type'] = 'other';
    let severity: AnalysisResult['severity'] = 'low';
    let department: AnalysisResult['department'] = 'customer_support';
    let summary = '';
    let nextAction = '';
    let reply = '';
    let reviewRequired = false;
    let confidence = 0.85;
    let reasonCodes: string[] = [];

    // 1. Phishing / Social Engineering Check (Highest priority safety)
    const hasPhishingKeywords = 
      text.includes('pin') || 
      text.includes('otp') || 
      text.includes('password') || 
      text.includes('code share') ||
      text.includes('card number') ||
      text.includes('lottery') ||
      text.includes('win') ||
      text.includes('bongo') ||
      text.includes('offhead');

    if (hasPhishingKeywords) {
      caseType = 'phishing_or_social_engineering';
      severity = 'critical';
      department = 'fraud_risk';
      reviewRequired = true;
      confidence = 0.95;
      reasonCodes.push('suspicious_activity_pattern', 'safety_flag');
      verdict = history.length > 0 ? 'consistent' : 'insufficient_data';
      if (history.length > 0) {
        relevantId = history[0].transaction_id;
      }
      summary = 'Customer reports sharing credentials (PIN/OTP) after receiving a suspicious call promising lottery/cashback awards.';
      nextAction = 'Block agent/merchant wallet associated with the scam immediately. Escalate to anti-fraud cell.';
      reply = 'We have received your report regarding suspicious calls and unauthorized cash out. For your security, any eligible amount will be returned through official channels after investigation. Please note that bKash will never ask you for your PIN, OTP, or password. Do not share these credentials with anyone.';
      
      return {
        ticket_id: input.ticket_id,
        relevant_transaction_id: relevantId,
        evidence_verdict: verdict,
        case_type: caseType,
        severity,
        department,
        agent_summary: summary,
        recommended_next_action: nextAction,
        customer_reply: reply,
        human_review_required: reviewRequired,
        confidence,
        reason_codes: reasonCodes
      };
    }

    // 2. Duplicate Payment Analysis
    const isDuplicateQuery = text.includes('double') || text.includes('twice') || text.includes('2 bar') || text.includes('duplicate') || text.includes('bhul kore double');
    if (isDuplicateQuery && history.length >= 2) {
      // Find two transactions of same type, amount, counterparty, status, close together
      let dup1: Transaction | null = null;
      let dup2: Transaction | null = null;
      for (let i = 0; i < history.length; i++) {
        for (let j = i + 1; j < history.length; j++) {
          const t1 = history[i];
          const t2 = history[j];
          if (t1.amount === t2.amount && t1.counterparty === t2.counterparty && t1.type === t2.type) {
            dup1 = t1;
            dup2 = t2;
            break;
          }
        }
        if (dup1) break;
      }

      if (dup1 && dup2) {
        verdict = 'consistent';
        relevantId = dup2.transaction_id;
        caseType = 'duplicate_payment';
        severity = 'medium';
        department = 'payments_ops';
        reasonCodes.push('duplicate_amount_match', 'transaction_match');
        summary = `Customer reports double charge of BDT ${dup1.amount} at ${dup1.counterparty}. Two identical completed transactions were found.`;
        nextAction = 'Initiate standard chargeback for the duplicate transaction. Verify with merchant system.';
        reply = `We have verified that transaction ${dup1.transaction_id} and ${dup2.transaction_id} are duplicate charges of BDT ${dup1.amount} to ${dup1.counterparty}. Any eligible amount will be returned through official channels.`;
      }
    }

    // 3. Wrong Transfer Analysis
    if (caseType === 'other' && (text.includes('wrong') || text.includes('bhul number') || text.includes('vul number') || text.includes('misplaced') || text.includes('sent to wrong'))) {
      caseType = 'wrong_transfer';
      department = 'dispute_resolution';
      severity = 'high';
      reviewRequired = true;

      // Extract BDT amount from text if possible
      const amountRegex = /(\d+)\s*(taka|bdt|tk)/i;
      const match = text.match(amountRegex);
      const parsedAmount = match ? parseInt(match[1]) : null;

      // Look for a transaction
      const matchedTx = history.find(t => t.type === 'transfer' && (!parsedAmount || t.amount === parsedAmount));
      if (matchedTx) {
        relevantId = matchedTx.transaction_id;
        if (matchedTx.status === 'completed') {
          verdict = 'consistent';
          reasonCodes.push('wrong_transfer', 'transaction_match');
          summary = `Customer reports sending BDT ${matchedTx.amount} to a wrong wallet number. Transaction ${matchedTx.transaction_id} is completed.`;
          nextAction = 'Hold funds in recipient wallet. Contact recipient to obtain consent for reversal according to regulation.';
          reply = `We have logged your wrong transfer complaint for transaction ${matchedTx.transaction_id} of BDT ${matchedTx.amount}. Any eligible amount will be returned through official channels following regulatory dispute procedures.`;
        } else {
          verdict = 'inconsistent';
          reasonCodes.push('wrong_transfer', 'status_mismatch');
          summary = `Customer reports wrong transfer, but the matched transaction ${matchedTx.transaction_id} is status: ${matchedTx.status}.`;
          nextAction = 'Inform customer that the transaction has already failed or been reversed. No action needed.';
          reply = `We noted your concern regarding a wrong transfer. However, our records show that transaction ${matchedTx.transaction_id} was ${matchedTx.status}. Please check your balance.`;
        }
      } else {
        verdict = 'insufficient_data';
        reasonCodes.push('wrong_transfer', 'no_matching_transaction');
        summary = 'Customer reports a wrong transfer, but no matching transfer transaction is present in their recent history.';
        nextAction = 'Request correct transaction ID, exact timestamp, and recipient wallet number from the customer.';
        reply = 'We could not locate any matching transfer transaction in your recent history. Please provide the exact transaction ID and recipient number for us to investigate.';
      }
    }

    // 4. Payment Failed Analysis
    if (caseType === 'other' && (text.includes('failed') || text.includes('fail') || text.includes('taka keteche') || text.includes('deducted') || text.includes('merchant payment failed'))) {
      caseType = 'payment_failed';
      department = 'payments_ops';
      
      const amountRegex = /(\d+)\s*(taka|bdt|tk)/i;
      const match = text.match(amountRegex);
      const parsedAmount = match ? parseInt(match[1]) : null;

      const matchedTx = history.find(t => t.type === 'payment' && (!parsedAmount || t.amount === parsedAmount));
      if (matchedTx) {
        relevantId = matchedTx.transaction_id;
        if (matchedTx.status === 'completed') {
          verdict = 'inconsistent';
          severity = 'high';
          reviewRequired = true;
          reasonCodes.push('payment_failed_claim', 'contradictory_completed_status');
          summary = `Customer reports payment of BDT ${matchedTx.amount} failed, but database transaction ${matchedTx.transaction_id} shows status is completed.`;
          nextAction = 'Verify merchant terminal records. Check if reconciliation is pending or if merchant received settlement.';
          reply = `We received your ticket regarding a failed merchant payment. Our records show transaction ${matchedTx.transaction_id} of BDT ${matchedTx.amount} was completed successfully. We are checking details with the merchant.`;
        } else {
          verdict = 'consistent';
          severity = 'medium';
          reasonCodes.push('payment_failed_claim', 'status_failed_match');
          summary = `Customer reports payment failed, and transaction ${matchedTx.transaction_id} status is indeed failed/reversed.`;
          nextAction = 'Check if balance was auto-credited back to customer wallet. If not, trigger manual reversal.';
          reply = `We have confirmed that transaction ${matchedTx.transaction_id} failed. Any eligible amount will be returned through official channels if it was not auto-reversed.`;
        }
      } else {
        verdict = 'insufficient_data';
        reasonCodes.push('payment_failed_claim', 'no_matching_transaction');
        summary = 'Customer reports a failed payment, but no matching payment transaction was found in the recent history.';
        nextAction = 'Ask the customer to provide the exact merchant name, transaction ID, or screenshot of the payment receipt.';
        reply = 'We were unable to locate this payment in your recent transactions. Please share the merchant ID and transaction ID, and we will look into it immediately.';
      }
    }

    // 5. Refund Request
    if (caseType === 'other' && (text.includes('refund') || text.includes('ferot') || text.includes('return'))) {
      caseType = 'refund_request';
      department = 'customer_support';
      severity = 'low';

      const matchedTx = history.length > 0 ? history[0] : null;
      if (matchedTx) {
        relevantId = matchedTx.transaction_id;
        verdict = 'consistent';
        reasonCodes.push('refund_inquiry');
        summary = `Customer is requesting a refund for their recent transaction ${matchedTx.transaction_id} of BDT ${matchedTx.amount}.`;
        nextAction = 'Explain standard merchant refund guidelines. Instruct user that refunds must be initiated by the merchant.';
        reply = `For transaction ${matchedTx.transaction_id}, please contact the merchant directly to request a refund. Any eligible amount will be returned through official channels once processed by the merchant.`;
      } else {
        verdict = 'insufficient_data';
        reasonCodes.push('refund_inquiry_no_data');
        summary = 'Customer requested a refund but no recent transaction data was provided to evaluate.';
        nextAction = 'Ask customer which merchant or transaction they are requesting a refund for.';
        reply = 'Please share the transaction ID or merchant details for the purchase you would like refunded.';
      }
    }

    // Fallback default
    if (caseType === 'other') {
      verdict = 'insufficient_data';
      reasonCodes.push('general_query');
      summary = 'General customer support inquiry not matching specialized transaction flows.';
      nextAction = 'Route to general customer service queue for standard ticket review.';
      reply = 'Thank you for reaching out. We have logged your concern and a customer service representative will check your account history and get back to you shortly.';
    }

    return {
      ticket_id: input.ticket_id,
      relevant_transaction_id: relevantId,
      evidence_verdict: verdict,
      case_type: caseType,
      severity,
      department,
      agent_summary: summary,
      recommended_next_action: nextAction,
      customer_reply: reply,
      human_review_required: reviewRequired,
      confidence,
      reason_codes: reasonCodes
    };
  };

  const analyze = async () => {
    setLoading(true);
    setResult(null);
    setIsSimulated(false);

    let finalInput: TicketInput;
    if (activeTab === 'json') {
      try {
        finalInput = JSON.parse(rawJsonStr);
      } catch (e) {
        alert('Invalid JSON in editor. Please correct it first.');
        setLoading(false);
        return;
      }
    } else {
      finalInput = ticketState;
    }

    // Attempt calling real backend if online
    if (serverOnline) {
      try {
        const res = await fetch('/analyze-ticket', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(finalInput),
        });
        if (res.ok) {
          const data = await res.json();
          setResult(data);
          setLoading(false);
          return;
        }
      } catch (e) {
        console.warn('Backend call failed, falling back to local simulation...');
      }
    }

    // Local Simulation Fallback
    setTimeout(() => {
      const mockResult = runSimulatedAnalysis(finalInput);
      setResult(mockResult);
      setIsSimulated(true);
      setLoading(false);
    }, 800);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  // Format Helper for enums
  const formatEnum = (val: string) => {
    return val.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  return (
    <div className="app-container">
      <style>{`
        /* Import outfit font */
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

        :root {
          --bg-main: #0b0c15;
          --bg-surface: #141526;
          --bg-card: #1c1e36;
          --border-color: rgba(255, 255, 255, 0.08);
          --border-active: #6366f1;
          
          --text-primary: #f8fafc;
          --text-secondary: #94a3b8;
          --text-muted: #64748b;
          
          --color-indigo: #6366f1;
          --color-purple: #8b5cf6;
          --color-emerald: #10b981;
          --color-amber: #f59e0b;
          --color-rose: #ef4444;
          --color-cyan: #06b6d4;
        }

        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        body {
          background-color: var(--bg-main);
          color: var(--text-primary);
          font-family: 'Outfit', sans-serif;
          line-height: 1.5;
          overflow-x: hidden;
        }

        .app-container {
          min-height: 100vh;
          padding: 2.5rem 1.5rem;
          background: radial-gradient(circle at 10% 20%, rgba(99, 102, 241, 0.05) 0%, transparent 40%),
                      radial-gradient(circle at 90% 80%, rgba(139, 92, 246, 0.05) 0%, transparent 45%);
        }

        header {
          max-width: 1300px;
          margin: 0 auto 2rem auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 1.5rem;
        }

        .logo-section h1 {
          font-size: 2.2rem;
          font-weight: 800;
          letter-spacing: -0.5px;
          background: linear-gradient(135deg, #a5b4fc 0%, #c084fc 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .logo-section p {
          color: var(--text-secondary);
          font-size: 0.95rem;
          margin-top: 0.2rem;
        }

        .status-badge {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border-color);
          padding: 0.5rem 1rem;
          border-radius: 9999px;
          font-size: 0.85rem;
          font-weight: 500;
        }

        .pulse-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          display: inline-block;
        }

        .pulse-dot.online {
          background-color: var(--color-emerald);
          box-shadow: 0 0 10px var(--color-emerald);
          animation: pulse 1.8s infinite;
        }

        .pulse-dot.offline {
          background-color: var(--color-amber);
          box-shadow: 0 0 10px var(--color-amber);
          animation: pulse 1.8s infinite;
        }

        @keyframes pulse {
          0% { transform: scale(0.95); opacity: 0.5; }
          50% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(0.95); opacity: 0.5; }
        }

        main {
          max-width: 1300px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 2rem;
          align-items: start;
        }

        @media (max-width: 1024px) {
          main {
            grid-template-columns: 1fr;
          }
        }

        .card {
          background: var(--bg-surface);
          border: 1px solid var(--border-color);
          border-radius: 20px;
          padding: 2rem;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        }

        .card-title {
          font-size: 1.3rem;
          font-weight: 600;
          margin-bottom: 1.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: var(--text-primary);
        }

        .tabs {
          display: flex;
          background: rgba(0, 0, 0, 0.25);
          padding: 0.3rem;
          border-radius: 12px;
          margin-bottom: 1.5rem;
          border: 1px solid rgba(255, 255, 255, 0.03);
        }

        .tab-btn {
          flex: 1;
          background: none;
          border: none;
          color: var(--text-secondary);
          padding: 0.6rem;
          border-radius: 9px;
          cursor: pointer;
          font-family: inherit;
          font-size: 0.9rem;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .tab-btn.active {
          background: var(--bg-card);
          color: var(--text-primary);
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.2rem;
          margin-bottom: 1.5rem;
        }

        @media (max-width: 600px) {
          .form-grid {
            grid-template-columns: 1fr;
          }
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }

        .form-group.full-width {
          grid-column: span 2;
        }

        @media (max-width: 600px) {
          .form-group.full-width {
            grid-column: span 1;
          }
        }

        label {
          font-size: 0.85rem;
          font-weight: 500;
          color: var(--text-secondary);
          letter-spacing: 0.2px;
        }

        input[type="text"], select, textarea {
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid var(--border-color);
          border-radius: 10px;
          color: var(--text-primary);
          padding: 0.8rem 1rem;
          font-family: inherit;
          font-size: 0.95rem;
          transition: all 0.25s ease;
          width: 100%;
        }

        input[type="text"]:focus, select:focus, textarea:focus {
          outline: none;
          border-color: var(--border-active);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
          background: rgba(0, 0, 0, 0.3);
        }

        textarea {
          resize: vertical;
          min-height: 110px;
        }

        /* Transactions list styling */
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin: 1.8rem 0 1rem 0;
          padding-top: 1rem;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }

        .section-title {
          font-size: 1rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .btn-small {
          background: rgba(99, 102, 241, 0.1);
          color: #a5b4fc;
          border: 1px solid rgba(99, 102, 241, 0.3);
          padding: 0.4rem 0.8rem;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.8rem;
          font-weight: 500;
          transition: all 0.2s ease;
          font-family: inherit;
        }

        .btn-small:hover {
          background: var(--color-indigo);
          color: white;
        }

        .tx-list {
          display: flex;
          flex-direction: column;
          gap: 0.8rem;
          max-height: 250px;
          overflow-y: auto;
          padding-right: 0.3rem;
        }

        .tx-item {
          background: rgba(0, 0, 0, 0.15);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 1rem;
          display: grid;
          grid-template-columns: 1.2fr 1fr 1fr 1fr 0.3fr;
          gap: 0.8rem;
          align-items: center;
        }

        @media (max-width: 768px) {
          .tx-item {
            grid-template-columns: 1fr 1fr;
          }
          .tx-delete-col {
            grid-column: span 2;
            text-align: right;
          }
        }

        .btn-delete {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #fca5a5;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 1.1rem;
          transition: all 0.2s ease;
        }

        .btn-delete:hover {
          background: var(--color-rose);
          color: white;
        }

        .btn-investigate {
          background: linear-gradient(135deg, var(--color-indigo) 0%, var(--color-purple) 100%);
          color: white;
          border: none;
          padding: 1.1rem;
          border-radius: 14px;
          font-weight: 600;
          font-size: 1.1rem;
          cursor: pointer;
          width: 100%;
          margin-top: 1.8rem;
          box-shadow: 0 4px 20px rgba(99, 102, 241, 0.3);
          transition: all 0.3s ease;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 0.8rem;
          font-family: inherit;
        }

        .btn-investigate:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 24px rgba(99, 102, 241, 0.4);
          filter: brightness(1.1);
        }

        .btn-investigate:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Scenarios bar */
        .scenarios-section {
          margin-top: 2rem;
          padding-top: 1.5rem;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }

        .scenarios-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.8rem;
          margin-top: 0.8rem;
        }

        @media (max-width: 600px) {
          .scenarios-grid {
            grid-template-columns: 1fr;
          }
        }

        .scenario-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 0.8rem 1rem;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: left;
        }

        .scenario-card:hover {
          background: rgba(99, 102, 241, 0.05);
          border-color: rgba(99, 102, 241, 0.3);
          transform: translateY(-1px);
        }

        .scenario-card h4 {
          font-size: 0.9rem;
          font-weight: 600;
          color: #a5b4fc;
          margin-bottom: 0.2rem;
        }

        .scenario-card p {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        /* Results / Dashboard Panel */
        .results-container {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .placeholder-results {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 6rem 2rem;
          text-align: center;
          color: var(--text-muted);
          border: 2px dashed rgba(255, 255, 255, 0.05);
          border-radius: 20px;
        }

        .placeholder-results svg {
          width: 64px;
          height: 64px;
          stroke: var(--text-muted);
          margin-bottom: 1.2rem;
          opacity: 0.6;
        }

        .placeholder-results h3 {
          color: var(--text-secondary);
          margin-bottom: 0.4rem;
          font-weight: 500;
        }

        .simulation-banner {
          background: rgba(245, 158, 11, 0.08);
          border: 1px solid rgba(245, 158, 11, 0.2);
          padding: 0.8rem 1.2rem;
          border-radius: 12px;
          color: #fcd34d;
          font-size: 0.85rem;
          display: flex;
          align-items: center;
          gap: 0.6rem;
          font-weight: 500;
        }

        /* Verdict Header Cards */
        .verdict-card {
          padding: 1.5rem;
          border-radius: 16px;
          display: flex;
          align-items: flex-start;
          gap: 1.2rem;
          color: white;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        }

        .verdict-card.consistent {
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(6, 182, 212, 0.15) 100%);
          border: 1px solid rgba(16, 185, 129, 0.3);
        }

        .verdict-card.inconsistent {
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(245, 158, 11, 0.15) 100%);
          border: 1px solid rgba(239, 68, 68, 0.3);
        }

        .verdict-card.insufficient_data {
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%);
          border: 1px solid rgba(99, 102, 241, 0.3);
        }

        .verdict-icon {
          font-size: 2.2rem;
          line-height: 1;
        }

        .verdict-info h2 {
          font-size: 1.4rem;
          font-weight: 700;
          margin-bottom: 0.3rem;
          letter-spacing: -0.3px;
        }

        .verdict-info p {
          font-size: 0.9rem;
          opacity: 0.9;
        }

        /* Classification Sub-grid */
        .classification-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
        }

        .stat-box {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-color);
          padding: 1.2rem;
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
        }

        .stat-box span.lbl {
          font-size: 0.8rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 600;
        }

        .stat-box span.val {
          font-size: 1.05rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        /* Badges */
        .badge {
          display: inline-flex;
          align-items: center;
          padding: 0.25rem 0.65rem;
          border-radius: 9999px;
          font-size: 0.8rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.2px;
          margin-top: 0.2rem;
        }

        .badge.critical {
          background: rgba(239, 68, 68, 0.2);
          color: #fca5a5;
          border: 1px solid rgba(239, 68, 68, 0.4);
          animation: pulse-danger 2s infinite;
        }

        .badge.high {
          background: rgba(245, 158, 11, 0.2);
          color: #fcd34d;
          border: 1px solid rgba(245, 158, 11, 0.4);
        }

        .badge.medium {
          background: rgba(99, 102, 241, 0.2);
          color: #c7d2fe;
          border: 1px solid rgba(99, 102, 241, 0.4);
        }

        .badge.low {
          background: rgba(148, 163, 184, 0.15);
          color: #e2e8f0;
          border: 1px solid rgba(148, 163, 184, 0.3);
        }

        @keyframes pulse-danger {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
          70% { box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }

        /* Progress gauge */
        .confidence-container {
          display: flex;
          align-items: center;
          gap: 0.8rem;
          margin-top: 0.2rem;
        }

        .progress-bar {
          height: 8px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 9999px;
          flex: 1;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.02);
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--color-indigo) 0%, var(--color-cyan) 100%);
          border-radius: 9999px;
        }

        /* Detail Blocks */
        .detail-block {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          padding: 1.5rem;
        }

        .detail-block h4 {
          font-size: 0.9rem;
          color: var(--text-secondary);
          margin-bottom: 0.6rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
          padding-bottom: 0.4rem;
        }

        .detail-block p {
          font-size: 0.95rem;
          color: var(--text-primary);
          line-height: 1.6;
        }

        .reply-editor {
          position: relative;
        }

        .reply-text {
          background: rgba(0, 0, 0, 0.25);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 10px;
          padding: 1rem;
          color: var(--text-primary);
          font-size: 0.95rem;
          line-height: 1.6;
          min-height: 100px;
          padding-bottom: 3rem;
        }

        .btn-copy {
          position: absolute;
          bottom: 0.8rem;
          right: 0.8rem;
          background: var(--bg-surface);
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          padding: 0.4rem 0.8rem;
          border-radius: 8px;
          font-size: 0.8rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }

        .btn-copy:hover {
          color: var(--text-primary);
          border-color: var(--border-active);
        }

        /* Alert Callout */
        .alert-callout {
          padding: 1.2rem;
          border-radius: 14px;
          font-size: 0.9rem;
          line-height: 1.5;
          display: flex;
          gap: 0.8rem;
          align-items: center;
        }

        .alert-callout.alarm {
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: #fca5a5;
        }

        .alert-callout.safe {
          background: rgba(16, 185, 129, 0.08);
          border: 1px solid rgba(16, 185, 129, 0.2);
          color: #a7f3d0;
        }

        .reason-tag {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.06);
          padding: 0.3rem 0.6rem;
          border-radius: 6px;
          font-size: 0.8rem;
          color: var(--text-secondary);
          display: inline-block;
          margin-right: 0.4rem;
          margin-top: 0.4rem;
        }

        /* Collapsible JSON */
        .collapsible-json {
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          overflow: hidden;
        }

        .collapsible-header {
          padding: 0.8rem 1.2rem;
          background: rgba(255, 255, 255, 0.01);
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.85rem;
          font-weight: 500;
          color: var(--text-secondary);
        }

        .collapsible-header:hover {
          background: rgba(255, 255, 255, 0.03);
        }

        .json-content {
          padding: 1.2rem;
          border-top: 1px solid var(--border-color);
          background: #06070d;
          overflow-x: auto;
        }

        .json-content pre {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.85rem;
          color: #38bdf8;
        }

        /* Skeleton Loading animation */
        .skeleton-pulse {
          background: linear-gradient(-90deg, #1c1e36 0%, #252848 50%, #1c1e36 100%);
          background-size: 400% 400%;
          animation: pulse-shimmer 1.5s ease-in-out infinite;
          border-radius: 16px;
          height: 120px;
          border: 1px solid var(--border-color);
        }

        @keyframes pulse-shimmer {
          0% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>

      <header>
        <div className="logo-section">
          <h1>QueueStorm Investigator</h1>
          <p>AI SupportOps Copilot & Financial Transaction Auditor</p>
        </div>
        <div className="status-badge">
          <span className={`pulse-dot ${serverOnline ? 'online' : 'offline'}`}></span>
          <span>
            {serverOnline === null
              ? 'Checking status...'
              : serverOnline
              ? 'Backend API Online'
              : 'Backend API Offline (Simulated Fallback)'}
          </span>
        </div>
      </header>

      <main>
        {/* Left Column: Input Panel */}
        <section className="card">
          <h2 className="card-title">
            <span>Ticket Investigator Input</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>
              Configure ticket parameters
            </span>
          </h2>

          <div className="tabs">
            <button
              className={`tab-btn ${activeTab === 'form' ? 'active' : ''}`}
              onClick={() => setActiveTab('form')}
            >
              Interactive Builder
            </button>
            <button
              className={`tab-btn ${activeTab === 'json' ? 'active' : ''}`}
              onClick={() => setActiveTab('json')}
            >
              Raw JSON Editor
            </button>
          </div>

          {activeTab === 'form' ? (
            <div>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="ticket_id">Ticket ID</label>
                  <input
                    id="ticket_id"
                    type="text"
                    value={ticketState.ticket_id}
                    onChange={(e) => updateTicketField('ticket_id', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="user_type">User Type</label>
                  <select
                    id="user_type"
                    value={ticketState.user_type}
                    onChange={(e) => updateTicketField('user_type', e.target.value)}
                  >
                    <option value="customer">Customer</option>
                    <option value="merchant">Merchant</option>
                    <option value="agent">Agent</option>
                    <option value="unknown">Unknown</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="language">Language</label>
                  <select
                    id="language"
                    value={ticketState.language}
                    onChange={(e) => updateTicketField('language', e.target.value)}
                  >
                    <option value="en">English (en)</option>
                    <option value="bn">Bangla (bn)</option>
                    <option value="mixed">Mixed (Banglish)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="channel">Channel</label>
                  <select
                    id="channel"
                    value={ticketState.channel}
                    onChange={(e) => updateTicketField('channel', e.target.value)}
                  >
                    <option value="in_app_chat">In App Chat</option>
                    <option value="call_center">Call Center</option>
                    <option value="email">Email</option>
                    <option value="merchant_portal">Merchant Portal</option>
                    <option value="field_agent">Field Agent</option>
                  </select>
                </div>
                <div className="form-group full-width">
                  <label htmlFor="campaign_context">Campaign Context</label>
                  <input
                    id="campaign_context"
                    type="text"
                    placeholder="e.g. boishakh_bonanza_day_1"
                    value={ticketState.campaign_context}
                    onChange={(e) => updateTicketField('campaign_context', e.target.value)}
                  />
                </div>
                <div className="form-group full-width">
                  <label htmlFor="complaint">Customer Complaint</label>
                  <textarea
                    id="complaint"
                    placeholder="Type or paste customer complaint text here..."
                    value={ticketState.complaint}
                    onChange={(e) => updateTicketField('complaint', e.target.value)}
                  />
                </div>
              </div>

              {/* Transactions List */}
              <div>
                <div className="section-header">
                  <h3 className="section-title">Recent Transactions History</h3>
                  <button type="button" className="btn-small" onClick={addTransaction}>
                    + Add Transaction
                  </button>
                </div>

                {ticketState.transaction_history.length === 0 ? (
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>
                    No recent transactions configured. Add one or load a preset scenario.
                  </p>
                ) : (
                  <div className="tx-list">
                    {ticketState.transaction_history.map((tx, idx) => (
                      <div className="tx-item" key={tx.transaction_id || idx}>
                        <div className="form-group">
                          <label>Tx ID</label>
                          <input
                            type="text"
                            style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
                            value={tx.transaction_id}
                            onChange={(e) => updateTransactionField(idx, 'transaction_id', e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label>Type</label>
                          <select
                            style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
                            value={tx.type}
                            onChange={(e) => updateTransactionField(idx, 'type', e.target.value)}
                          >
                            <option value="transfer">Transfer</option>
                            <option value="payment">Payment</option>
                            <option value="cash_in">Cash In</option>
                            <option value="cash_out">Cash Out</option>
                            <option value="settlement">Settlement</option>
                            <option value="refund">Refund</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Amount (BDT)</label>
                          <input
                            type="text"
                            style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
                            value={tx.amount}
                            onChange={(e) => updateTransactionField(idx, 'amount', e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label>Status</label>
                          <select
                            style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
                            value={tx.status}
                            onChange={(e) => updateTransactionField(idx, 'status', e.target.value)}
                          >
                            <option value="completed">Completed</option>
                            <option value="failed">Failed</option>
                            <option value="pending">Pending</option>
                            <option value="reversed">Reversed</option>
                          </select>
                        </div>
                        <div className="form-group tx-delete-col" style={{ display: 'flex', justifyContent: 'center' }}>
                          <label style={{ visibility: 'hidden' }}>Del</label>
                          <button
                            type="button"
                            className="btn-delete"
                            onClick={() => removeTransaction(idx)}
                            title="Delete transaction"
                          >
                            ×
                          </button>
                        </div>
                        <div className="form-group full-width" style={{ gridColumn: 'span 4', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '-0.3rem' }}>
                          <div>
                            <label style={{ fontSize: '0.75rem' }}>Counterparty / Wallet ID</label>
                            <input
                              type="text"
                              style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem' }}
                              value={tx.counterparty}
                              onChange={(e) => updateTransactionField(idx, 'counterparty', e.target.value)}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '0.75rem' }}>Timestamp (ISO)</label>
                            <input
                              type="text"
                              style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem' }}
                              value={tx.timestamp}
                              onChange={(e) => updateTransactionField(idx, 'timestamp', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="form-group">
              <label>Ticket Payload JSON</label>
              <textarea
                style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.85rem', minHeight: '350px' }}
                value={rawJsonStr}
                onChange={(e) => handleRawJsonChange(e.target.value)}
              />
            </div>
          )}

          {/* Quick Scenario Preset Section */}
          <div className="scenarios-section">
            <h3 className="section-title">Pre-loaded Test Scenarios</h3>
            <div className="scenarios-grid">
              {PRESETS.map((preset, index) => (
                <button
                  key={index}
                  type="button"
                  className="scenario-card"
                  onClick={() => handlePresetSelect(preset.data)}
                >
                  <h4>{preset.name}</h4>
                  <p>{preset.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            className="btn-investigate"
            onClick={analyze}
            disabled={loading || !ticketState.complaint.trim()}
          >
            {loading ? (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="pulse-dot online" style={{ animation: 'spin 1s linear infinite' }}><path d="M21 12a9 9 0 11-6.219-8.56" /></svg>
                <span>Analyzing Ticket...</span>
              </>
            ) : (
              <>
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <span>Investigate Ticket</span>
              </>
            )}
          </button>
        </section>

        {/* Right Column: Analysis Output Panel */}
        <section className="card" style={{ minHeight: '600px' }}>
          <h2 className="card-title">
            <span>Investigation Results</span>
            {result && isSimulated && (
              <span className="simulation-badge" style={{ fontSize: '0.75rem', color: 'var(--color-amber)', background: 'rgba(245, 158, 11, 0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                Offline Simulation
              </span>
            )}
          </h2>

          {loading ? (
            <div className="results-container">
              <div className="skeleton-pulse" style={{ height: '80px' }}></div>
              <div className="skeleton-pulse" style={{ height: '140px' }}></div>
              <div className="skeleton-pulse" style={{ height: '200px' }}></div>
            </div>
          ) : !result ? (
            <div className="placeholder-results">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3>No Active Audit</h3>
              <p>Configure input on the left and run analysis to view SupportOps copilot details.</p>
            </div>
          ) : (
            <div className="results-container">
              {/* Simulation Disclaimer */}
              {isSimulated && (
                <div className="simulation-banner">
                  <span>ℹ️</span>
                  <span>Currently showing client-side audit simulation because the backend service is offline.</span>
                </div>
              )}

              {/* 1. Verdict Banner */}
              <div className={`verdict-card ${result.evidence_verdict}`}>
                <div className="verdict-icon">
                  {result.evidence_verdict === 'consistent' && '✅'}
                  {result.evidence_verdict === 'inconsistent' && '⚠️'}
                  {result.evidence_verdict === 'insufficient_data' && '❓'}
                </div>
                <div className="verdict-info">
                  <h2>{formatEnum(result.evidence_verdict)}</h2>
                  <p>
                    {result.evidence_verdict === 'consistent' && 'Recent transaction history matches the customer\'s claim.'}
                    {result.evidence_verdict === 'inconsistent' && 'Warning: Recent transaction history conflicts with the customer\'s claim.'}
                    {result.evidence_verdict === 'insufficient_data' && 'Attention: Unable to confirm the claim from the provided transactions.'}
                  </p>
                  <p style={{ fontSize: '0.8rem', marginTop: '0.4rem', opacity: 0.8 }}>
                    Matched Transaction ID: <code style={{ background: 'rgba(0,0,0,0.2)', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>{result.relevant_transaction_id || 'None'}</code>
                  </p>
                </div>
              </div>

              {/* 2. Safety Escalation Banner */}
              {result.human_review_required ? (
                <div className="alert-callout alarm">
                  <span style={{ fontSize: '1.5rem' }}>🚨</span>
                  <div>
                    <strong>Human Review Escalation Required</strong>
                    <p style={{ fontSize: '0.8rem', opacity: 0.9, marginTop: '0.1rem' }}>
                      This case has been marked as high risk, disputed, or requires manual compliance approval before reply.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="alert-callout safe">
                  <span style={{ fontSize: '1.5rem' }}>🛡️</span>
                  <div>
                    <strong>Automated Routing Approved</strong>
                    <p style={{ fontSize: '0.8rem', opacity: 0.9, marginTop: '0.1rem' }}>
                      No critical safety guidelines were violated. Safe to use automated draft reply.
                    </p>
                  </div>
                </div>
              )}

              {/* 3. Classification Stats */}
              <div className="classification-grid">
                <div className="stat-box">
                  <span className="lbl">Case Classification</span>
                  <span className="val" style={{ color: '#a5b4fc' }}>{formatEnum(result.case_type)}</span>
                </div>
                <div className="stat-box">
                  <span className="lbl">Audit Severity</span>
                  <div>
                    <span className={`badge ${result.severity}`}>{result.severity}</span>
                  </div>
                </div>
                <div className="stat-box">
                  <span className="lbl">Routing Department</span>
                  <span className="val" style={{ color: '#c084fc' }}>{formatEnum(result.department)}</span>
                </div>
                <div className="stat-box">
                  <span className="lbl">Copilot Confidence</span>
                  <div className="confidence-container">
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${result.confidence * 100}%` }}></div>
                    </div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{Math.round(result.confidence * 100)}%</span>
                  </div>
                </div>
              </div>

              {/* 4. Reason Codes */}
              {result.reason_codes && result.reason_codes.length > 0 && (
                <div style={{ marginTop: '-0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Reason Flags: </span>
                  {result.reason_codes.map((code) => (
                    <span className="reason-tag" key={code}>{code}</span>
                  ))}
                </div>
              )}

              {/* 5. Summaries and actions */}
              <div className="detail-block">
                <h4>Agent Executive Summary</h4>
                <p>{result.agent_summary}</p>
              </div>

              <div className="detail-block">
                <h4>Recommended Next Action</h4>
                <p style={{ fontWeight: '500', color: '#cbd5e1' }}>{result.recommended_next_action}</p>
              </div>

              <div className="detail-block reply-editor">
                <h4>Safe Customer Communication Reply Draft</h4>
                <div className="reply-text">{result.customer_reply}</div>
                <button
                  type="button"
                  className="btn-copy"
                  onClick={() => copyToClipboard(result.customer_reply)}
                >
                  {copySuccess ? 'Copied!' : 'Copy Reply'}
                </button>
              </div>

              {/* Collapsible raw json output */}
              <div className="collapsible-json">
                <details>
                  <summary className="collapsible-header">
                    <span>View Raw Output Analysis JSON</span>
                    <span>▼</span>
                  </summary>
                  <div className="json-content">
                    <pre>{JSON.stringify(result, null, 2)}</pre>
                  </div>
                </details>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

