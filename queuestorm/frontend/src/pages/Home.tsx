import React, { useState } from 'react';

export default function Home() {
  const [ticket, setTicket] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const analyze = async () => {
    setLoading(true);
    try {
      const res = await fetch('/analyze-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: ticket,
      });
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setResult({ error: 'Failed to analyze ticket' });
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>QueueStorm Investigator</h1>
      <textarea
        rows={10}
        style={{ width: '100%' }}
        placeholder="Paste ticket JSON here..."
        value={ticket}
        onChange={(e) => setTicket(e.target.value)}
      />
      <br />
      <button onClick={analyze} disabled={loading}>
        {loading ? 'Analyzing...' : 'Analyze Ticket'}
      </button>
      {result && (
        <pre style={{ marginTop: '1rem', background: '#f4f4f4', padding: '1rem' }}>
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}
