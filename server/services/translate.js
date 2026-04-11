/**
 * Translation service - reusable translation lookup logic
 * Extracted from routes/translate.js for direct use by other services (e.g. expansion.js)
 */

// Simple in-memory cache
const cache = new Map();

/**
 * Look up Chinese translation for an English word via Youdao API.
 * @param {string} word
 * @returns {Promise<string|null>} translation string or null if not found
 */
async function lookupTranslation(word) {
  const normalized = word.toLowerCase().trim();

  // 1. Check in-memory cache
  if (cache.has(normalized)) {
    return cache.get(normalized);
  }

  // 2. Try Youdao API
  try {
    const response = await fetch(
      `https://dict.youdao.com/jsonapi_s?doctype=json&jsonversion=4&q=${encodeURIComponent(normalized)}`
    );
    if (response.ok) {
      const data = await response.json();

      // ec.word.trs → Chinese definitions
      if (data.ec && data.ec.word && data.ec.word.trs) {
        const returnedWord = data.simple?.word?.[0]?.['return-phrase']?.toLowerCase();
        if (returnedWord === normalized || !returnedWord) {
          const trs = data.ec.word.trs;
          const translation = trs.slice(0, 2).map(t => `${t.pos} ${t.tran}`).join('；');
          cache.set(normalized, translation);
          return translation;
        }
      }

      // web_trans fallback
      if (data.web_trans && data.web_trans['web-translation']) {
        for (const item of data.web_trans['web-translation']) {
          if (item.key && item.key.toLowerCase() === normalized && item.trans) {
            const translation = item.trans.slice(0, 2).map(t => t.value).join('，');
            cache.set(normalized, translation);
            return translation;
          }
        }
      }
    }
  } catch (apiError) {
    console.log('[translate-service] Youdao API error:', apiError.message);
  }

  // 3. Not found
  return null;
}

module.exports = { lookupTranslation };
