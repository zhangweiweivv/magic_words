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

/**
 * Look up word details: short Chinese meaning + example sentences
 * Returns { meaning: string, examples: string } suitable for word cards
 */
async function lookupWordDetails(word) {
  const normalized = word.toLowerCase().trim();

  try {
    const response = await fetch(
      `https://dict.youdao.com/jsonapi_s?doctype=json&jsonversion=4&q=${encodeURIComponent(normalized)}`
    );
    if (!response.ok) return null;
    const data = await response.json();

    // 1. Short meaning: first 2 translations, truncated
    let meaning = null;
    if (data.ec && data.ec.word && data.ec.word.trs) {
      const trs = data.ec.word.trs;
      // Take first 1-2 tran entries, strip pos prefix, keep concise
      meaning = trs.slice(0, 2).map(t => {
        // t.tran might be "收到，接到；获得，得到；..." — take first 2 meanings
        const parts = t.tran.split(/[；;，,]/).slice(0, 2).map(s => s.trim()).filter(Boolean);
        return parts.join('，');
      }).join('；');
      // Final truncation: max ~20 chars
      if (meaning.length > 20) {
        meaning = meaning.slice(0, 20).replace(/[，；、]$/, '');
      }
    }

    // 2. Example sentences from blng_sents_part (bilingual examples)
    let examples = '';
    const EMOJIS = ['🌟', '✨', '📚', '💡', '🎯', '🌈', '⭐', '🎨', '🔑', '💪'];
    if (data.blng_sents_part && data.blng_sents_part['sentence-pair']) {
      const pairs = data.blng_sents_part['sentence-pair'].slice(0, 2);
      examples = pairs.map((p, i) => {
        let en = p['sentence'].replace(/<[^>]*>/g, '').trim();
        // Truncate very long sentences
        if (en.length > 60) en = en.slice(0, 57) + '...';
        const emoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
        return `${i + 1}. ${en} ${emoji}`;
      }).join(' ');
    }

    return { meaning, examples };
  } catch (e) {
    console.log('[translate-service] lookupWordDetails error:', e.message);
    return null;
  }
}

module.exports = { lookupTranslation, lookupWordDetails };
