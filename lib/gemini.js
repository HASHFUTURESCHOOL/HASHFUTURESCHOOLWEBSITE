/**
 * Minimal Gemini client for the site search's "Ask AI" answer.
 *
 * The website answers with whichever provider it has a key for — Gemini first,
 * then DeepSeek, then the Future Assist deployment that holds both. This module
 * is the Gemini end of that chain: one request, one answer, no provider
 * juggling, because the caller decides what to do when it fails.
 *
 * The key travels in the `x-goog-api-key` header rather than the query string so
 * it never lands in a URL, a log line or a referrer.
 *
 * Environment:
 *   GEMINI_API_KEY  required — from Google AI Studio (aistudio.google.com/apikey)
 *   GEMINI_MODEL    optional — defaults to gemini-3.1-flash-lite, the current
 *                   flash-lite model. Free-tier keys only cover a handful of
 *                   requests a day, so the caller must be ready to fall through
 *                   to another provider when this one answers 429.
 */

const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';
const DEFAULT_MODEL = 'gemini-3.1-flash-lite';

export function geminiConfigured() {
  return Boolean((process.env.GEMINI_API_KEY || '').trim());
}

export function geminiModel() {
  return (process.env.GEMINI_MODEL || '').trim() || DEFAULT_MODEL;
}

/**
 * @param {object} options
 * @param {string} options.system   Instructions the model must follow.
 * @param {string} options.prompt   The visitor's question plus the passages.
 * @param {number} [options.maxOutputTokens]
 * @param {number} [options.temperature]
 * @param {number} [options.timeoutMs]
 * @returns {Promise<string>} the answer text
 */
export async function generateAnswer({
  system,
  prompt,
  maxOutputTokens = 420,
  temperature = 0.2,
  timeoutMs = 15000,
}) {
  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set');
  if (!prompt) throw new Error('generateAnswer requires a prompt');

  const model = geminiModel();
  const response = await fetch(`${ENDPOINT}/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature, maxOutputTokens },
    }),
    // An interactive answer: the visitor is watching the panel.
    signal: AbortSignal.timeout(timeoutMs),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = String(data?.error?.message || `Gemini responded ${response.status}`);
    const error = new Error(message.replace(/\s+/g, ' ').slice(0, 300));
    error.status = response.status;
    throw error;
  }

  const text = (data?.candidates?.[0]?.content?.parts || [])
    .map(part => part?.text || '')
    .join(' ')
    .trim();
  if (!text) throw new Error('Gemini returned no text');
  return text;
}
