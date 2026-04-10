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

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '多多在线！🐬' });
});

// 配置 API
const path = require('path');
const fs = require('fs');
const CONFIG_PATH = path.join(__dirname, 'config/quiz-config.json');

function readConfig() {
  return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
}

app.get('/api/config', (req, res) => {
  try {
    res.json({ success: true, data: readConfig() });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.put('/api/config', (req, res) => {
  try {
    const config = readConfig();
    Object.assign(config, req.body);
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
    res.json({ success: true, data: config });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
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

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🐬 可可单词服务运行在 http://localhost:${PORT}`);
});
