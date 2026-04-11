/**
 * Slack notification service for Poetry (古诗文).
 * Sends summaries when articles are completed or graduated.
 *
 * Reuses the same bot-token reading pattern as the vocab Slack service.
 * Channel defaults to #可可晨读计划 but can be overridden via:
 *   - env POETRY_SLACK_CHANNEL_ID
 *   - poetry config file (future)
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const log = (level, msg, data) => console[level](`[poetry:slack] ${msg}`, data || '');

// Default: #可可晨读计划
const DEFAULT_CHANNEL_ID = 'C0AL4DAQ02U';

/**
 * Get Slack channel ID from env or fallback to default.
 */
function getChannelId() {
  return process.env.POETRY_SLACK_CHANNEL_ID || DEFAULT_CHANNEL_ID;
}

/**
 * Read bot token from openclaw config (same approach as vocab slack).
 */
function getBotToken() {
  try {
    const configPath = path.join(
      process.env.HOME || '/Users/vvhome',
      '.openclaw',
      'openclaw.json'
    );
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    return config.channels?.slack?.botToken;
  } catch (e) {
    log('error', '读取 bot token 失败:', e.message);
    return null;
  }
}

/**
 * Send a message to the configured Slack channel.
 * @param {string} text - message text
 * @returns {Promise<boolean>}
 */
function sendMessage(text) {
  return new Promise((resolve) => {
    // Skip real API calls during tests
    if (process.env.NODE_ENV === 'test' || process.env.POETRY_SLACK_DISABLE === '1') {
      log('log', '(skip: test/disabled) would send:', text.slice(0, 60));
      resolve(true);
      return;
    }

    const token = getBotToken();
    if (!token) {
      log('error', '没有找到 bot token，跳过 Slack 通知');
      resolve(false);
      return;
    }

    const payload = JSON.stringify({
      channel: getChannelId(),
      text,
    });

    const options = {
      hostname: 'slack.com',
      port: 443,
      path: '/api/chat.postMessage',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        Authorization: `Bearer ${token}`,
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.ok) {
            log('log', '消息发送成功');
            resolve(true);
          } else {
            log('error', 'API 错误:', result.error);
            resolve(false);
          }
        } catch (e) {
          log('error', '解析响应失败:', e.message);
          resolve(false);
        }
      });
    });

    req.on('error', (e) => {
      log('error', '请求失败:', e.message);
      resolve(false);
    });

    req.setTimeout(15000, () => {
      log('error', '请求超时');
      req.destroy();
      resolve(false);
    });

    req.write(payload);
    req.end();
  });
}

// ────────────────────────── Message Formatters ──────────────────────────

/**
 * Format a stage completion message.
 * @param {object} state - article state after completion
 * @param {object[]} events - events emitted by the transition
 * @returns {string}
 */
function formatStageComplete(state, events) {
  const graduated = events.some((e) => e.type === 'graduated');
  const stageEvent = events.find((e) => e.type === 'stage_completed');

  // Use 1-based stage numbers for human display
  const currentStage = state.stage + 1;

  if (graduated) {
    // Graduated: show totalStages/totalStages (all done)
    const stageLabel = `第${state.totalStages}/${state.totalStages}阶段`;
    return (
      `🎓 可可完成了古诗文《${state.title}》的全部学习！\n\n` +
      `📖 集合：${state.collection}\n` +
      `📚 阶段：${stageLabel}（已毕业 🎉）\n` +
      `📅 开始日期：${state.startedAt}\n` +
      `✅ 毕业日期：${state.lastCompletedAt}`
    );
  }

  const fromStageRaw = stageEvent?.data?.fromStage;
  const fromStage = fromStageRaw != null ? fromStageRaw + 1 : '?';
  return (
    `📜 可可完成了古诗文复习！\n\n` +
    `📖 《${state.title}》（${state.collection}）\n` +
    `📚 阶段：${fromStage} → ${currentStage}/${state.totalStages}\n` +
    `📅 下次复习：${state.nextDueDate || '无'}`
  );
}

/**
 * Format a new article started message.
 * @param {object} state - article state after start
 * @returns {string}
 */
function formatArticleStarted(state) {
  return (
    `📝 可可开始学习新古诗文！\n\n` +
    `📖 《${state.title}》（${state.collection}）\n` +
    `📚 计划阶段数：${state.totalStages}\n` +
    `📅 下次复习：${state.nextDueDate || '无'}`
  );
}

// ────────────────────────── Public API ──────────────────────────

/**
 * Notify Slack about an article completion/start.
 * Called after state transition in the route handler.
 *
 * @param {object} state - resulting article state
 * @param {object[]} events - events from the transition
 * @returns {Promise<boolean>}
 */
async function notifyArticleComplete(state, events) {
  const isStart = events.some((e) => e.type === 'article_started');
  const text = isStart
    ? formatArticleStarted(state)
    : formatStageComplete(state, events);
  return sendMessage(text);
}

module.exports = {
  sendMessage,
  notifyArticleComplete,
  // Exported for testing
  formatStageComplete,
  formatArticleStarted,
  getChannelId,
};
