/**
 * Slack 通知服务
 * 直接调用 Slack Web API 发送消息
 */

const https = require('https');

// Slack 频道配置
const CHANNEL_ID = 'C0AL4DAQ02U'; // #可可pet 频道

// 从 openclaw 配置读取 bot token
function getBotToken() {
  try {
    const fs = require('fs');
    const path = require('path');
    const configPath = path.join(process.env.HOME || '/Users/vvhome', '.openclaw', 'openclaw.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    return config.channels?.slack?.botToken;
  } catch (e) {
    console.error('[Slack] 读取 bot token 失败:', e.message);
    return null;
  }
}

/**
 * 发送 Slack 消息（直接调用 Slack Web API）
 * @param {string} message - 消息内容
 * @returns {Promise<boolean>} - 是否发送成功
 */
function sendMessage(message) {
  return new Promise((resolve) => {
    const token = getBotToken();
    if (!token) {
      console.error('[Slack] 没有找到 bot token');
      resolve(false);
      return;
    }

    const payload = JSON.stringify({
      channel: CHANNEL_ID,
      text: message,
    });

    const options = {
      hostname: 'slack.com',
      port: 443,
      path: '/api/chat.postMessage',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Authorization': `Bearer ${token}`,
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
            console.log('[Slack] 消息发送成功');
            resolve(true);
          } else {
            console.error('[Slack] API 错误:', result.error);
            resolve(false);
          }
        } catch (e) {
          console.error('[Slack] 解析响应失败:', e.message);
          resolve(false);
        }
      });
    });

    req.on('error', (e) => {
      console.error('[Slack] 请求失败:', e.message);
      resolve(false);
    });

    req.setTimeout(15000, () => {
      console.error('[Slack] 请求超时');
      req.destroy();
      resolve(false);
    });

    req.write(payload);
    req.end();
  });
}

/**
 * 发送每日任务完成通知
 * @param {Object} stats - 统计数据
 * @returns {Promise<boolean>}
 */
async function sendDailyComplete(stats = {}) {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  
  const messages = [
    '🎉 可可完成了今天的单词探险任务！',
    '🏆 可可今日的单词冒险圆满成功！',
    '⭐ 可可又征服了今天的单词挑战！',
    '🐬 多多说：可可今天超棒！任务完成啦！',
    '🌟 太厉害了！可可完成了每日探险！'
  ];
  
  const randomMsg = messages[Math.floor(Math.random() * messages.length)];
  
  // 阶段名称映射
  const stageNames = { 0: 'Day 0 首学', 1: 'Day 1 复习', 2: 'Day 3 毕业考' };
  const stageName = stageNames[stats.stage] || `Stage ${stats.stage}`;
  
  let text = `${randomMsg}\n📚 阶段：${stageName}`;
  
  // 添加测试轮次详情
  if (stats.rounds && stats.rounds.length > 0) {
    const totalRounds = stats.rounds.length;
    text += `\n\n📊 测试统计（共${totalRounds}轮）`;
    
    for (const round of stats.rounds) {
      text += `\n\n┌ 第${round.roundNumber}轮 ⏰ ${round.timestamp}`;
      text += `\n│ ✅ 答对 ${round.correctCount}题 ❌ 答错 ${round.wrongCount}题`;
      
      if (round.wrongWords && round.wrongWords.length > 0) {
        const typeMap = { choice: '选择', spelling: '拼写', fillBlank: '补全' };
        const wrongList = round.wrongWords.map(w => `${w.word}(${typeMap[w.type] || w.type})`).join(', ');
        text += `\n│ 错题：${wrongList}`;
      }
      
      text += `\n└ ${round.passed ? '✅ 通过！' : '❌ 未通过'}`;
    }
  }
  
  text += `\n\n⏰ 完成时间：${timeStr}`;
  
  if (stats.points) {
    text += `\n💎 获得积分：+${stats.points}`;
  }
  
  return sendMessage(text);
}

/**
 * 发送周考准备通知
 * @param {Object} info - 周考信息
 * @returns {Promise<boolean>}
 */
async function sendWeeklyExamReady({ generatedDate, total, wrongCount, sampledCount, windowWeeks }) {
  const text = `📝 可可的周考已生成！\n\n` +
    `📅 考试周期：${generatedDate}（最近${windowWeeks}周）\n` +
    `📊 共 ${total} 题\n` +
    `  - 错题池：${wrongCount} 题（必考）\n` +
    `  - 抽样新词：${sampledCount} 题\n\n` +
    `💪 加油，可可！`;
  return sendMessage(text);
}

/**
 * 发送周考完成通知
 * @param {Object} info - 周考完成信息
 * @returns {Promise<boolean>}
 */
async function sendWeeklyExamComplete({ generatedDate, score, total, rounds, wrongWords }) {
  const scorePercent = total > 0 ? Math.round((score / total) * 100) : 0;
  let text = `🎉 可可完成了 ${generatedDate} 的周考！\n\n` +
    `📊 成绩：${score}/${total} (${scorePercent}%)\n` +
    `🔄 共 ${rounds} 轮`;

  if (wrongWords && wrongWords.length > 0) {
    text += `\n❌ 错误单词：${wrongWords.join('、')}`;
  } else {
    text += `\n✅ 全部正确！太棒了！`;
  }

  return sendMessage(text);
}

module.exports = {
  sendMessage,
  sendDailyComplete,
  sendWeeklyExamReady,
  sendWeeklyExamComplete
};
