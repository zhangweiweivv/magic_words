const express = require('express');
const cors = require('cors');
const wordsRouter = require('./routes/words');
const reviewRoutes = require('./routes/review');
const pointsRouter = require('./routes/points');
const achievementsRouter = require('./routes/achievements');
const statsRouter = require('./routes/stats');
const shopRouter = require('./routes/shop');
const translateRouter = require('./routes/translate');
const backupRouter = require('./routes/backup');
const gardenRouter = require('./routes/garden');
const expansionRouter = require('./routes/expansion');
const weeklyExamRouter = require('./routes/weekly-exam');
const { error: errRes } = require('./utils/response');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// --- Issue #2: Simple Bearer token authentication ---
const API_TOKEN = process.env.KEKE_API_TOKEN;
if (!API_TOKEN) {
  console.warn('⚠️  KEKE_API_TOKEN not set — running without authentication (dev mode)');
}

function authMiddleware(req, res, next) {
  // Skip auth if token not configured (dev mode)
  if (!API_TOKEN) return next();
  
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Missing or invalid Authorization header' });
  }
  
  const token = authHeader.slice(7);
  if (token !== API_TOKEN) {
    return res.status(403).json({ success: false, error: 'Invalid token' });
  }
  
  next();
}

// Apply auth to all /api/* routes
app.use('/api', authMiddleware);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '多多在线！🐬' });
});

// 配置 API
const path = require('path');
const fs = require('fs');
const CONFIG_PATH = path.join(__dirname, 'config/quiz-config.json');

// --- Issue #4: Safe config reading with fallback defaults ---
const CONFIG_DEFAULTS = {
  quizConfig: {
    '0': { spelling: 5, fillBlank: 5, choice: 5, passRate: 1 },
    '1': { spelling: 6, fillBlank: 6, choice: 3, passRate: 1 },
    '2': { spelling: 3, fillBlank: 8, choice: 4, passRate: 1 }
  },
  fillBlankHideRatio: 0.5,
  dailyLimit: 15,
  intervals: [0, 1, 3],
  stageNames: ['Day 0 首学', 'Day 1 复习1', 'Day 3 毕业考']
};

function readConfig() {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
  } catch (e) {
    console.warn('⚠️  Failed to read config file, using defaults:', e.message);
    return { ...CONFIG_DEFAULTS };
  }
}

// --- Issue #5: Config key whitelist with validation ---
const ALLOWED_CONFIG_KEYS = {
  quizConfig: (v) => typeof v === 'object' && v !== null,
  fillBlankHideRatio: (v) => typeof v === 'number' && v >= 0 && v <= 1,
  dailyLimit: (v) => Number.isInteger(v) && v >= 1 && v <= 100,
  intervals: (v) => Array.isArray(v) && v.every(n => Number.isInteger(n) && n >= 0),
  stageNames: (v) => Array.isArray(v) && v.every(s => typeof s === 'string'),
  expansionConfig: (v) => typeof v === 'object' && v !== null,
  weeklyExamConfig: (v) => typeof v === 'object' && v !== null,
  slackChannelId: (v) => typeof v === 'string'
};

app.get('/api/config', (req, res) => {
  try {
    const { success: sendSuccess } = require('./utils/response');
    sendSuccess(res, readConfig());
  } catch (e) {
    errRes(res, e.message);
  }
});

app.put('/api/config', (req, res) => {
  try {
    const config = readConfig();
    
    // Issue #5: Only merge whitelisted keys with validation
    const unknownKeys = [];
    const invalidKeys = [];
    
    for (const [key, value] of Object.entries(req.body)) {
      const validator = ALLOWED_CONFIG_KEYS[key];
      if (!validator) {
        unknownKeys.push(key);
      } else if (!validator(value)) {
        invalidKeys.push(key);
      } else {
        config[key] = value;
      }
    }
    
    if (unknownKeys.length > 0) {
      return errRes(res, `Unknown config keys: ${unknownKeys.join(', ')}`, 400,
        { allowedKeys: Object.keys(ALLOWED_CONFIG_KEYS) });
    }
    
    if (invalidKeys.length > 0) {
      return errRes(res, `Invalid values for keys: ${invalidKeys.join(', ')}`, 400);
    }
    
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
    const { success: sendSuccess } = require('./utils/response');
    sendSuccess(res, config);
  } catch (e) {
    errRes(res, e.message);
  }
});

// 单词 API 路由
app.use('/api/words', wordsRouter);

// 复习 API 路由
app.use('/api/review', reviewRoutes);

// 积分 API 路由
app.use('/api/points', pointsRouter);

// 成就 API 路由
app.use('/api/achievements', achievementsRouter);

// 统计 API 路由
app.use('/api/stats', statsRouter);

// 商店 API 路由
app.use('/api/shop', shopRouter);

// 翻译 API 路由
app.use('/api/translate', translateRouter);

// 备份 API 路由
app.use('/api/backup', backupRouter);

// 花园 API 路由
app.use('/api/garden', gardenRouter);

// 扩展 API 路由
app.use('/api/expansion', expansionRouter);

// 周考 API 路由
app.use('/api/weekly-exam', weeklyExamRouter);

// Global error-handling middleware (catch-all)
app.use((err, req, res, _next) => {
  console.error('[server] Unhandled error:', err);
  errRes(res, err.message || 'Internal Server Error');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🐬 可可单词服务运行在 http://localhost:${PORT}`);
});
