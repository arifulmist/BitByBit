const testCases = [
  {
    name: 'Wrong Transfer (Consistent)',
    payload: {
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
    payload: {
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
    payload: {
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
  }
];

const runTests = async () => {
  console.log('🧪 Starting ticket analysis endpoint tests...\n');
  for (const tc of testCases) {
    console.log(`--------------------------------------------------`);
    console.log(`Running Case: ${tc.name}`);
    console.log(`--------------------------------------------------`);
    try {
      const res = await fetch('http://localhost:3000/analyze-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tc.payload)
      });
      if (!res.ok) {
        console.error(`Status ${res.status}:`, await res.text());
        continue;
      }
      const data = await res.json();
      console.log('Response:', JSON.stringify(data, null, 2));
      console.log('\n');
    } catch (e) {
      console.error('Fetch failed:', e.message);
    }
  }
};

runTests();
