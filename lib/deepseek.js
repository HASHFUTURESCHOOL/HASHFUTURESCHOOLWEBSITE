const DEEPSEEK_ENDPOINT = 'https://api.deepseek.com/chat/completions';
const DEFAULT_MODEL = 'deepseek-chat';

/**
 * Minimal OpenAI-compatible chat completion client for DeepSeek.
 * Requires DEEPSEEK_API_KEY to be set in the environment.
 *
 * @param {object} options
 * @param {Array<{role: string, content: string}>} options.messages
 * @param {string} [options.model]
 * @param {number} [options.temperature]
 * @param {number} [options.max_tokens]
 * @returns {Promise<string>} The assistant's content text.
 */
export async function chatCompletion({
  messages,
  model = DEFAULT_MODEL,
  temperature = 0.8,
  max_tokens = 1800,
}) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY is not set');
  }
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error('chatCompletion requires a non-empty messages array');
  }

  const response = await fetch(DEEPSEEK_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens,
      stream: false,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    const detail = body.slice(0, 300);
    throw new Error(`DeepSeek API error (${response.status}): ${detail || response.statusText}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('DeepSeek API returned no content');
  }
  return content;
}
