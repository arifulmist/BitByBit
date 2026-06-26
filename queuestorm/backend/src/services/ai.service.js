const Anthropic = require('@anthropic-ai/sdk');

/**
 * Call the appropriate AI API based on configured environment variables.
 * @param {string} systemPrompt
 * @param {string} userPrompt
 * @returns {Promise<string|null>} Response text, or null if no keys configured
 */
const callAI = async (systemPrompt, userPrompt) => {
  // 1. Prefer Gemini 1.5 Flash
  if (process.env.GEMINI_API_KEY) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: userPrompt }]
            }
          ],
          systemInstruction: {
            parts: [{ text: systemPrompt }]
          },
          generationConfig: {
            responseMimeType: 'application/json'
          }
        })
      });

      if (!response.ok) {
        const err = await response.text();
        console.error(`Gemini API HTTP error ${response.status}: ${err}`);
        throw new Error(`Gemini API error status: ${response.status}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text;
    } catch (e) {
      console.error('Error calling Gemini API:', e.message);
      // Fall through to other keys if Gemini fails
    }
  }

  // 2. Fallback to OpenAI GPT-4o-mini
  if (process.env.OPENAI_API_KEY) {
    try {
      const url = 'https://api.openai.com/v1/chat/completions';
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          response_format: { type: 'json_object' }
        })
      });

      if (!response.ok) {
        const err = await response.text();
        console.error(`OpenAI API HTTP error ${response.status}: ${err}`);
        throw new Error(`OpenAI API error status: ${response.status}`);
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content;
      if (text) return text;
    } catch (e) {
      console.error('Error calling OpenAI API:', e.message);
      // Fall through to Claude if OpenAI fails
    }
  }

  // 3. Fallback to Claude (Anthropic SDK)
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const response = await client.messages.create({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      });
      const text = response.content[0].text;
      if (text) return text;
    } catch (e) {
      console.error('Error calling Claude API:', e.message);
    }
  }

  // If no API keys are available or all API calls fail, return null
  return null;
};

module.exports = { callAI };
