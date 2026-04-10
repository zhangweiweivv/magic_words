/**
 * 翻译 API 路由
 * 使用免费词典 API 获取单词释义
 */

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// 缓存文件路径
const CACHE_FILE = path.join(__dirname, '../data/word-details-cache.json');

// 常用同义词/反义词表（兜底用）
const COMMON_SYNONYMS = {
  'happy': ['joyful', 'cheerful', 'glad', 'pleased'],
  'sad': ['unhappy', 'sorrowful', 'gloomy', 'melancholy'],
  'big': ['large', 'huge', 'enormous', 'giant'],
  'small': ['little', 'tiny', 'miniature', 'petite'],
  'good': ['excellent', 'great', 'fine', 'wonderful'],
  'bad': ['poor', 'terrible', 'awful', 'dreadful'],
  'fast': ['quick', 'rapid', 'swift', 'speedy'],
  'slow': ['sluggish', 'leisurely', 'unhurried'],
  'beautiful': ['pretty', 'lovely', 'gorgeous', 'stunning'],
  'ugly': ['unattractive', 'hideous', 'unsightly'],
  'smart': ['intelligent', 'clever', 'bright', 'wise'],
  'stupid': ['foolish', 'dumb', 'silly'],
  'easy': ['simple', 'effortless', 'straightforward'],
  'hard': ['difficult', 'tough', 'challenging'],
  'hot': ['warm', 'heated', 'burning', 'scorching'],
  'cold': ['cool', 'chilly', 'freezing', 'icy'],
  'old': ['ancient', 'aged', 'elderly'],
  'new': ['fresh', 'modern', 'recent', 'novel'],
  'rich': ['wealthy', 'affluent', 'prosperous'],
  'poor': ['needy', 'impoverished', 'destitute'],
  'strong': ['powerful', 'mighty', 'sturdy', 'robust'],
  'weak': ['feeble', 'frail', 'fragile'],
  'tall': ['high', 'towering', 'lofty'],
  'short': ['brief', 'little', 'low'],
  'long': ['lengthy', 'extended', 'prolonged'],
  'clean': ['tidy', 'neat', 'spotless', 'pure'],
  'dirty': ['filthy', 'messy', 'grimy', 'unclean'],
  'bright': ['brilliant', 'radiant', 'shining', 'luminous'],
  'dark': ['dim', 'gloomy', 'shadowy', 'murky'],
  'loud': ['noisy', 'booming', 'thunderous'],
  'quiet': ['silent', 'peaceful', 'calm', 'hushed'],
  'begin': ['start', 'commence', 'initiate'],
  'end': ['finish', 'conclude', 'terminate'],
  'buy': ['purchase', 'acquire', 'obtain'],
  'sell': ['vend', 'trade', 'market'],
  'love': ['adore', 'cherish', 'treasure'],
  'hate': ['detest', 'loathe', 'despise'],
  'like': ['enjoy', 'appreciate', 'fancy'],
  'help': ['assist', 'aid', 'support'],
  'hurt': ['harm', 'injure', 'damage'],
  'make': ['create', 'produce', 'build'],
  'break': ['shatter', 'smash', 'destroy'],
  'find': ['discover', 'locate', 'uncover'],
  'lose': ['misplace', 'forfeit'],
  'give': ['donate', 'provide', 'offer'],
  'take': ['grab', 'seize', 'obtain'],
  'run': ['sprint', 'dash', 'race', 'jog'],
  'walk': ['stroll', 'amble', 'wander'],
  'eat': ['consume', 'devour', 'dine'],
  'drink': ['sip', 'gulp', 'swallow'],
  'speak': ['talk', 'say', 'tell', 'communicate'],
  'listen': ['hear', 'attend', 'heed'],
  'see': ['view', 'observe', 'watch', 'notice'],
  'look': ['gaze', 'stare', 'glance', 'peer'],
  'think': ['consider', 'ponder', 'contemplate'],
  'know': ['understand', 'comprehend', 'realize'],
  'want': ['desire', 'wish', 'crave'],
  'need': ['require', 'demand', 'necessitate'],
  'important': ['significant', 'crucial', 'vital', 'essential'],
  'interesting': ['fascinating', 'intriguing', 'engaging'],
  'boring': ['dull', 'tedious', 'monotonous'],
  'angry': ['furious', 'mad', 'irritated', 'annoyed'],
  'afraid': ['scared', 'frightened', 'terrified'],
  'brave': ['courageous', 'fearless', 'bold'],
  'kind': ['nice', 'gentle', 'caring', 'generous'],
  'mean': ['cruel', 'unkind', 'nasty'],
  'funny': ['humorous', 'amusing', 'comical', 'hilarious'],
  'serious': ['grave', 'solemn', 'earnest']
};

const COMMON_ANTONYMS = {
  'happy': ['sad', 'unhappy'],
  'sad': ['happy', 'joyful'],
  'big': ['small', 'little'],
  'small': ['big', 'large'],
  'good': ['bad', 'poor'],
  'bad': ['good', 'excellent'],
  'fast': ['slow'],
  'slow': ['fast', 'quick'],
  'beautiful': ['ugly'],
  'ugly': ['beautiful', 'pretty'],
  'smart': ['stupid', 'dumb'],
  'stupid': ['smart', 'intelligent'],
  'easy': ['hard', 'difficult'],
  'hard': ['easy', 'simple'],
  'hot': ['cold', 'cool'],
  'cold': ['hot', 'warm'],
  'old': ['new', 'young'],
  'new': ['old', 'ancient'],
  'young': ['old', 'elderly'],
  'rich': ['poor'],
  'poor': ['rich', 'wealthy'],
  'strong': ['weak'],
  'weak': ['strong', 'powerful'],
  'tall': ['short'],
  'short': ['tall', 'long'],
  'long': ['short', 'brief'],
  'clean': ['dirty'],
  'dirty': ['clean'],
  'bright': ['dark', 'dim'],
  'dark': ['bright', 'light'],
  'loud': ['quiet', 'silent'],
  'quiet': ['loud', 'noisy'],
  'begin': ['end', 'finish'],
  'end': ['begin', 'start'],
  'start': ['end', 'finish'],
  'buy': ['sell'],
  'sell': ['buy'],
  'love': ['hate'],
  'hate': ['love'],
  'like': ['dislike', 'hate'],
  'find': ['lose'],
  'lose': ['find', 'win'],
  'win': ['lose'],
  'give': ['take', 'receive'],
  'take': ['give'],
  'open': ['close', 'shut'],
  'close': ['open'],
  'come': ['go', 'leave'],
  'go': ['come', 'stay'],
  'up': ['down'],
  'down': ['up'],
  'in': ['out'],
  'out': ['in'],
  'yes': ['no'],
  'no': ['yes'],
  'true': ['false'],
  'false': ['true'],
  'right': ['wrong', 'left'],
  'wrong': ['right', 'correct'],
  'day': ['night'],
  'night': ['day'],
  'early': ['late'],
  'late': ['early'],
  'first': ['last'],
  'last': ['first'],
  'full': ['empty'],
  'empty': ['full'],
  'heavy': ['light'],
  'light': ['heavy', 'dark'],
  'wet': ['dry'],
  'dry': ['wet'],
  'safe': ['dangerous'],
  'dangerous': ['safe'],
  'important': ['unimportant'],
  'interesting': ['boring'],
  'boring': ['interesting'],
  'angry': ['calm', 'happy'],
  'afraid': ['brave', 'fearless'],
  'brave': ['afraid', 'cowardly'],
  'kind': ['mean', 'cruel'],
  'mean': ['kind', 'nice']
};

// 常用词根词缀表（适合小学生理解的简化版）
const COMMON_ROOTS = {
  // 常用前缀
  'un': { type: 'prefix', meaning: '不、没有', examples: 'unhappy, unkind, unable' },
  're': { type: 'prefix', meaning: '再、重新', examples: 'redo, replay, return' },
  'pre': { type: 'prefix', meaning: '在...之前', examples: 'preview, prepare, preschool' },
  'mis': { type: 'prefix', meaning: '错误地', examples: 'mistake, misuse, misread' },
  'dis': { type: 'prefix', meaning: '不、相反', examples: 'dislike, disagree, disappear' },
  'over': { type: 'prefix', meaning: '过度、在上方', examples: 'overflow, overcome, overseas' },
  'under': { type: 'prefix', meaning: '在下方、不足', examples: 'understand, underwater, underline' },
  'out': { type: 'prefix', meaning: '超过、外面', examples: 'outside, outdoor, outstanding' },
  'super': { type: 'prefix', meaning: '超级、上方', examples: 'superman, supermarket, superstar' },
  'inter': { type: 'prefix', meaning: '在...之间', examples: 'international, internet, interview' },
  'trans': { type: 'prefix', meaning: '穿过、转移', examples: 'transport, translate, transform' },
  'sub': { type: 'prefix', meaning: '在下面', examples: 'subway, submarine, subject' },
  'im': { type: 'prefix', meaning: '不、没有', examples: 'impossible, impolite, impatient' },
  'in': { type: 'prefix', meaning: '不、向内', examples: 'inside, incorrect, invisible' },
  'non': { type: 'prefix', meaning: '不、非', examples: 'nonstop, nonsense, nonfiction' },
  'bi': { type: 'prefix', meaning: '二、两', examples: 'bicycle, bilingual, biweekly' },
  'tri': { type: 'prefix', meaning: '三', examples: 'triangle, tricycle, triple' },
  'mid': { type: 'prefix', meaning: '中间', examples: 'midnight, midday, middle' },
  'multi': { type: 'prefix', meaning: '多', examples: 'multiply, multicolor, multimedia' },
  'auto': { type: 'prefix', meaning: '自己', examples: 'automatic, automobile, autograph' },
  'tele': { type: 'prefix', meaning: '远距离', examples: 'telephone, television, telescope' },
  'micro': { type: 'prefix', meaning: '微小', examples: 'microscope, microphone, microwave' },
  'semi': { type: 'prefix', meaning: '半', examples: 'semicircle, semifinal, semiconductor' },
  
  // 常用后缀
  'ful': { type: 'suffix', meaning: '充满...的', examples: 'beautiful, helpful, colorful' },
  'less': { type: 'suffix', meaning: '没有...的', examples: 'homeless, careless, endless' },
  'ness': { type: 'suffix', meaning: '...的状态', examples: 'happiness, kindness, darkness' },
  'ment': { type: 'suffix', meaning: '行为/结果', examples: 'movement, agreement, excitement' },
  'tion': { type: 'suffix', meaning: '行为/状态', examples: 'action, education, collection' },
  'sion': { type: 'suffix', meaning: '行为/状态', examples: 'decision, television, expression' },
  'able': { type: 'suffix', meaning: '能够...的', examples: 'comfortable, readable, washable' },
  'ible': { type: 'suffix', meaning: '能够...的', examples: 'possible, visible, terrible' },
  'ly': { type: 'suffix', meaning: '...地（副词）', examples: 'quickly, happily, carefully' },
  'er': { type: 'suffix', meaning: '做...的人/更...', examples: 'teacher, worker, bigger' },
  'or': { type: 'suffix', meaning: '做...的人', examples: 'actor, doctor, visitor' },
  'ist': { type: 'suffix', meaning: '...的人', examples: 'artist, scientist, tourist' },
  'ous': { type: 'suffix', meaning: '充满...的', examples: 'famous, dangerous, delicious' },
  'ive': { type: 'suffix', meaning: '有...性质的', examples: 'active, creative, expensive' },
  'al': { type: 'suffix', meaning: '...的', examples: 'national, musical, natural' },
  'ish': { type: 'suffix', meaning: '有点...的', examples: 'childish, selfish, foolish' },
  'ward': { type: 'suffix', meaning: '向...方向', examples: 'forward, backward, upward' },
  'dom': { type: 'suffix', meaning: '...的领域/状态', examples: 'freedom, kingdom, wisdom' },
  'ship': { type: 'suffix', meaning: '...的关系/状态', examples: 'friendship, leadership, membership' },
  'hood': { type: 'suffix', meaning: '...的时期/状态', examples: 'childhood, neighborhood, brotherhood' },

  // 常用词根
  'port': { type: 'root', meaning: '搬运、携带', examples: 'transport, airport, import, export' },
  'vis': { type: 'root', meaning: '看', examples: 'visit, visible, vision, television' },
  'vid': { type: 'root', meaning: '看', examples: 'video, evidence, provide' },
  'aud': { type: 'root', meaning: '听', examples: 'audience, audio, auditorium' },
  'scrib': { type: 'root', meaning: '写', examples: 'describe, subscribe, prescribe' },
  'script': { type: 'root', meaning: '写', examples: 'manuscript, scripture, transcript' },
  'dict': { type: 'root', meaning: '说', examples: 'dictionary, predict, contradict' },
  'graph': { type: 'root', meaning: '写/画', examples: 'photograph, autograph, paragraph' },
  'phon': { type: 'root', meaning: '声音', examples: 'phone, microphone, earphone' },
  'struct': { type: 'root', meaning: '建造', examples: 'construct, structure, instruct' },
  'ject': { type: 'root', meaning: '投掷', examples: 'project, reject, inject' },
  'duct': { type: 'root', meaning: '引导', examples: 'conduct, produce, educate' },
  'form': { type: 'root', meaning: '形状', examples: 'uniform, transform, inform' },
  'tract': { type: 'root', meaning: '拉、拖', examples: 'attract, subtract, tractor' },
  'spect': { type: 'root', meaning: '看', examples: 'inspect, respect, spectacle' },
  'mit': { type: 'root', meaning: '发送', examples: 'submit, permit, admit' },
  'mot': { type: 'root', meaning: '移动', examples: 'motion, motor, promote' },
  'mov': { type: 'root', meaning: '移动', examples: 'move, movie, remove' },
  'terra': { type: 'root', meaning: '地球/土地', examples: 'territory, terrace, terrain' },
  'aqua': { type: 'root', meaning: '水', examples: 'aquarium, aquatic, aqualung' },
  'bio': { type: 'root', meaning: '生命', examples: 'biology, biography, biome' },
  'geo': { type: 'root', meaning: '地球', examples: 'geography, geology, geometry' },
  'photo': { type: 'root', meaning: '光', examples: 'photograph, photon, photocopy' },
  'cycle': { type: 'root', meaning: '圆/循环', examples: 'bicycle, recycle, motorcycle' },
  'act': { type: 'root', meaning: '行动', examples: 'action, active, actor, react' },
  'cent': { type: 'root', meaning: '百', examples: 'century, percent, centimeter' },
  'cap': { type: 'root', meaning: '头/抓', examples: 'captain, capital, capture' },
  'man': { type: 'root', meaning: '手', examples: 'manual, manage, manufacture' },
  'ped': { type: 'root', meaning: '脚', examples: 'pedal, pedestrian, centipede' },
};

// ===== 音节拆分与 Phonics 功能 =====

/**
 * 英语音节拆分算法（规则兜底）
 * 关键规则：
 * - 每个音节至少一个元音
 * - silent e 不单独成音节
 * - 常见后缀识别
 * - 双辅音中间断开
 * - 前缀识别
 */

// 常见英语单词表（用于复合词拆分）
const COMMON_WORDS = new Set([
  'air', 'back', 'ball', 'band', 'bank', 'base', 'bath', 'bed', 'bell', 'bird', 'birth', 'black', 'block', 'blood', 'blow',
  'blue', 'board', 'boat', 'body', 'bomb', 'bone', 'book', 'born', 'box', 'boy', 'brain', 'break', 'bridge', 'bright',
  'broad', 'brown', 'build', 'burn', 'bus', 'butter', 'cake', 'camp', 'car', 'card', 'care', 'case', 'cast', 'cat',
  'catch', 'chair', 'child', 'church', 'class', 'clean', 'clear', 'climb', 'clock', 'close', 'cloud', 'club', 'coast',
  'coat', 'cold', 'come', 'cook', 'cool', 'copy', 'corn', 'cost', 'count', 'country', 'course', 'court', 'cover',
  'cross', 'cup', 'cut', 'dance', 'dark', 'day', 'dead', 'deal', 'deep', 'dog', 'door', 'down', 'draw', 'dream',
  'dress', 'drink', 'drive', 'drop', 'dry', 'dust', 'ear', 'earth', 'east', 'end', 'eye', 'face', 'fact', 'fall',
  'farm', 'fast', 'father', 'field', 'fight', 'film', 'find', 'fine', 'fire', 'fish', 'flat', 'flight', 'floor',
  'flower', 'fly', 'food', 'foot', 'force', 'forest', 'form', 'free', 'friend', 'front', 'fruit', 'full', 'fun',
  'game', 'garden', 'gate', 'girl', 'glass', 'goal', 'gold', 'good', 'grand', 'grass', 'green', 'ground', 'group',
  'grow', 'guard', 'gun', 'hair', 'half', 'hall', 'hand', 'hang', 'hard', 'hat', 'head', 'heart', 'heat', 'help',
  'high', 'hill', 'hold', 'hole', 'home', 'hook', 'hope', 'horse', 'host', 'hot', 'house', 'hunt', 'ice', 'iron',
  'island', 'job', 'jump', 'keep', 'key', 'kid', 'kill', 'kind', 'king', 'kitchen', 'knee', 'knife', 'knock',
  'lake', 'land', 'large', 'last', 'late', 'law', 'lay', 'lead', 'leaf', 'left', 'leg', 'let', 'letter', 'life',
  'lift', 'light', 'like', 'line', 'link', 'list', 'live', 'lock', 'long', 'look', 'lord', 'love', 'low', 'luck',
  'lunch', 'mad', 'mail', 'main', 'make', 'man', 'map', 'mark', 'market', 'master', 'match', 'meal', 'meat',
  'meet', 'mid', 'milk', 'mind', 'mine', 'moon', 'morning', 'mother', 'mount', 'mouth', 'move', 'mud', 'name',
  'neck', 'net', 'new', 'news', 'night', 'noise', 'north', 'nose', 'note', 'now', 'nurse', 'nut', 'off', 'old',
  'one', 'open', 'out', 'over', 'own', 'pack', 'page', 'pain', 'paint', 'pair', 'pan', 'paper', 'park', 'part',
  'pass', 'path', 'pay', 'peace', 'pen', 'person', 'pick', 'piece', 'pig', 'pin', 'pipe', 'place', 'plain',
  'plan', 'plant', 'play', 'point', 'pool', 'pop', 'port', 'post', 'pot', 'pound', 'power', 'press', 'price',
  'print', 'proof', 'pull', 'push', 'put', 'queen', 'race', 'rain', 'raise', 'range', 'rate', 'reach', 'read',
  'red', 'rest', 'rich', 'ride', 'ring', 'rise', 'risk', 'river', 'road', 'rock', 'roll', 'roof', 'room', 'root',
  'round', 'row', 'rule', 'run', 'safe', 'salt', 'sand', 'save', 'say', 'school', 'sea', 'seat', 'self', 'sell',
  'send', 'set', 'shadow', 'shake', 'shape', 'share', 'sharp', 'she', 'shell', 'shine', 'ship', 'shoe', 'shoot',
  'shop', 'shore', 'short', 'shot', 'show', 'shut', 'sick', 'side', 'sight', 'sign', 'silver', 'sing', 'sit',
  'site', 'size', 'skin', 'sky', 'sleep', 'slide', 'slip', 'slow', 'small', 'smell', 'smile', 'smoke', 'snow',
  'soft', 'soil', 'some', 'son', 'song', 'sort', 'sound', 'south', 'space', 'speed', 'spend', 'sport', 'spot',
  'spring', 'square', 'stage', 'stair', 'stand', 'star', 'start', 'state', 'stay', 'step', 'stick', 'still',
  'stock', 'stone', 'stop', 'store', 'storm', 'story', 'straight', 'strange', 'street', 'strength', 'strike',
  'strong', 'stuff', 'suit', 'summer', 'sun', 'support', 'sure', 'sweet', 'swim', 'swing', 'table', 'tail',
  'take', 'talk', 'tall', 'taste', 'tea', 'team', 'tell', 'term', 'test', 'thing', 'think', 'tie', 'tight',
  'time', 'tip', 'title', 'top', 'total', 'touch', 'town', 'track', 'trade', 'train', 'travel', 'tree', 'trick',
  'trip', 'trouble', 'true', 'trust', 'turn', 'type', 'unit', 'use', 'view', 'voice', 'walk', 'wall', 'war',
  'warm', 'wash', 'watch', 'water', 'wave', 'way', 'wear', 'week', 'weight', 'well', 'west', 'wheel', 'white',
  'whole', 'wide', 'wife', 'wild', 'will', 'win', 'wind', 'window', 'wine', 'wing', 'winter', 'wire', 'wish',
  'wood', 'word', 'work', 'world', 'worth', 'write', 'wrong', 'yard', 'year', 'young',
  // 常见后缀/组件
  'berry', 'board', 'book', 'bury', 'craft', 'field', 'fish', 'fly', 'folk', 'foot', 'ful', 'ground', 'guard',
  'hood', 'house', 'keeper', 'land', 'like', 'line', 'man', 'mark', 'mate', 'men', 'mill', 'mind', 'place',
  'proof', 'room', 'scape', 'ship', 'shop', 'shore', 'side', 'smith', 'some', 'stead', 'stone', 'storm',
  'style', 'tail', 'thing', 'time', 'top', 'town', 'ward', 'ware', 'way', 'wise', 'woman', 'wood', 'work',
  'wright', 'yard'
]);

/**
 * 复合词拆分：尝试将单词拆成两个已知单词
 * 例如：campsite → camp + site, sunflower → sun + flower
 */
function tryCompoundSplit(word) {
  if (word.length < 5) return null;
  
  // 从中间往两边试，优先找更均匀的拆分
  const mid = Math.floor(word.length / 2);
  let bestSplit = null;
  let bestBalance = Infinity;
  
  for (let i = 2; i < word.length - 2; i++) {
    const left = word.slice(0, i);
    const right = word.slice(i);
    if (COMMON_WORDS.has(left) && COMMON_WORDS.has(right)) {
      const balance = Math.abs(left.length - right.length);
      if (balance < bestBalance) {
        bestBalance = balance;
        bestSplit = [left, right];
      }
    }
  }
  
  return bestSplit;
}

function splitSyllables(word) {
  const lowerWord = word.toLowerCase();
  
  // 复合词检测：尝试拆成两个已知单词
  const compoundSplit = tryCompoundSplit(lowerWord);
  if (compoundSplit) return compoundSplit;
  
  // 单音节短词直接返回
  if (lowerWord.length <= 3) return [lowerWord];
  
  // 先计算整个词的音节数
  const totalSyllables = countSyllables(lowerWord);
  if (totalSyllables <= 1) return [lowerWord];
  
  // ---- 后缀处理（音节级别） ----
  let stem = lowerWord;
  let suffix = '';
  
  // -ed: 只有在 t/d 后才是独立音节 (regarded → re·gard·ed)
  // 其他情况不加音节 (enclosed → en·closed, stopped → stopped)
  if (lowerWord.endsWith('ed') && lowerWord.length > 3) {
    const beforeEd = lowerWord[lowerWord.length - 3];
    if (beforeEd === 't' || beforeEd === 'd') {
      // -ted/-ded: -ed 是独立音节
      stem = lowerWord.slice(0, -2);
      suffix = 'ed';
    } else {
      // 非音节 -ed: 去掉 -ed 拆 stem，再合并回去
      const stemWithoutEd = lowerWord.slice(0, -2);
      const stemSyl = countSyllables(stemWithoutEd);
      if (stemSyl <= 1) {
        return [lowerWord]; // enclosed → 1音节stem+ed → 整词
      } else {
        const parts = splitByVowelPattern(stemWithoutEd);
        parts[parts.length - 1] += 'ed';
        return parts;
      }
    }
  }
  // -ing: 独立音节，前面辅音归 stem
  else if (lowerWord.endsWith('ing') && lowerWord.length > 4) {
    const beforeIng = lowerWord.slice(0, -3);
    // 双写辅音：running → run + ning
    if (beforeIng.length >= 2 && beforeIng[beforeIng.length - 1] === beforeIng[beforeIng.length - 2]) {
      stem = beforeIng.slice(0, -1);
      suffix = beforeIng[beforeIng.length - 1] + 'ing';
    } else {
      stem = beforeIng;
      suffix = 'ing';
    }
  }
  // -ence/-ance: 独立音节 (experience, silence, distance)
  else if (lowerWord.match(/(ence|ance)$/) && lowerWord.length > 5) {
    stem = lowerWord.slice(0, -4);
    suffix = lowerWord.slice(-4);
  }
  // -tion/-sion: 独立音节
  else if (lowerWord.match(/(tion|sion)$/) && lowerWord.length > 5) {
    stem = lowerWord.slice(0, -4);
    suffix = lowerWord.slice(-4);
  }
  // -ture: 独立音节
  else if (lowerWord.endsWith('ture') && lowerWord.length > 5) {
    stem = lowerWord.slice(0, -4);
    suffix = 'ture';
  }
  // -ous
  else if (lowerWord.endsWith('ous') && lowerWord.length > 4) {
    stem = lowerWord.slice(0, -3);
    suffix = 'ous';
  }
  // -ment
  else if (lowerWord.endsWith('ment') && lowerWord.length > 5) {
    stem = lowerWord.slice(0, -4);
    suffix = 'ment';
  }
  // -ness
  else if (lowerWord.endsWith('ness') && lowerWord.length > 5) {
    stem = lowerWord.slice(0, -4);
    suffix = 'ness';
  }
  // -ful
  else if (lowerWord.endsWith('ful') && lowerWord.length > 4) {
    stem = lowerWord.slice(0, -3);
    suffix = 'ful';
  }
  // -less
  else if (lowerWord.endsWith('less') && lowerWord.length > 5) {
    stem = lowerWord.slice(0, -4);
    suffix = 'less';
  }
  // -ly
  else if (lowerWord.endsWith('ly') && lowerWord.length > 3) {
    stem = lowerWord.slice(0, -2);
    suffix = 'ly';
  }
  // -ure (failure, closure)
  else if (lowerWord.endsWith('ure') && lowerWord.length > 4) {
    stem = lowerWord.slice(0, -3);
    suffix = 'ure';
  }
  // -age (courage, village)
  else if (lowerWord.endsWith('age') && lowerWord.length > 4) {
    stem = lowerWord.slice(0, -3);
    suffix = 'age';
  }
  // -ive (active, creative)
  else if (lowerWord.endsWith('ive') && lowerWord.length > 4) {
    stem = lowerWord.slice(0, -3);
    suffix = 'ive';
  }
  // -let (leaflet, booklet)
  else if (lowerWord.endsWith('let') && lowerWord.length > 4) {
    stem = lowerWord.slice(0, -3);
    suffix = 'let';
  }
  
  // 计算 stem 的音节数
  const stemSyllables = countSyllables(stem);
  
  if (stemSyllables <= 1 && !suffix) {
    return [lowerWord];
  }
  
  if (stemSyllables <= 1 && suffix) {
    return [stem, suffix];
  }
  
  // stem 多音节，拆 stem
  const stemParts = splitByVowelPattern(stem);
  if (suffix) {
    return [...stemParts, suffix];
  }
  return stemParts;
}

/**
 * 计算音节数（不拆分）
 */
function countSyllables(word) {
  const vowels = 'aeiouy';
  const isVowel = (ch) => vowels.includes(ch);
  
  let count = 0;
  let prevWasVowel = false;
  for (const ch of word) {
    if (isVowel(ch)) {
      if (!prevWasVowel) count++;
      prevWasVowel = true;
    } else {
      prevWasVowel = false;
    }
  }
  
  // silent e: 词尾 e 前面是辅音
  // -le 结尾：只有 -ble, -tle, -ple, -dle, -gle, -fle, -zle 等才是独立音节
  // whole, while 等词的 -le 不是独立音节
  if (word.endsWith('e') && !word.endsWith('ee') && count > 1) {
    const beforeE = word[word.length - 2];
    if (!isVowel(beforeE)) {
      if (word.endsWith('le') && word.length > 3) {
        // -Cle 结尾：检查是否是真正的 -le 音节（前面是辅音+le）
        const beforeL = word[word.length - 3];
        // 只有辅音+le（如 ta·ble, lit·tle）才保持，元音+le（如 whole）减去
        if (isVowel(beforeL)) {
          count--; // whale, whole, while 等
        }
        // 否则保持（ta·ble, lit·tle, puz·zle 等）
      } else {
        count--; // 普通 silent e: make, come, close
      }
    }
  }
  
  // -ed 后 t/d 前才是独立音节，其他情况减 1
  if (word.endsWith('ed') && !word.endsWith('eed') && count > 1) {
    const beforeEd = word[word.length - 3];
    if (beforeEd !== 't' && beforeEd !== 'd') {
      count--;
    }
  }
  
  return Math.max(1, count);
}

function splitByVowelPattern(word) {
  const vowels = 'aeiouy';
  const isVowel = (ch) => vowels.includes(ch);
  
  // 常见不可分辅音组合（这些辅音组合应该归到同一个音节）
  const blends = ['bl', 'br', 'ch', 'cl', 'cr', 'dr', 'fl', 'fr', 'gl', 'gr', 'pl', 'pr', 'sc', 'sh', 'sk', 'sl', 'sm', 'sn', 'sp', 'st', 'str', 'sw', 'th', 'tr', 'tw', 'wh', 'wr', 'scr', 'spl', 'spr', 'squ', 'thr', 'ph'];
  
  const syllables = [];
  let current = '';
  let i = 0;
  
  while (i < word.length) {
    const ch = word[i];
    current += ch;
    
    if (isVowel(ch)) {
      // 吃掉后续元音（元音组合 ea, ou, ai, oo, ee 等）
      while (i + 1 < word.length && isVowel(word[i + 1])) {
        i++;
        current += word[i];
      }
      
      // 统计后面连续辅音数量
      let consStart = i + 1;
      let consEnd = consStart;
      while (consEnd < word.length && !isVowel(word[consEnd])) {
        consEnd++;
      }
      const consonantCount = consEnd - consStart;
      
      if (consEnd >= word.length) {
        // 后面没有更多元音，剩余全部归当前音节
        current += word.slice(i + 1);
        i = word.length;
      } else if (consonantCount === 0) {
        // 直接是元音，断开
        syllables.push(current);
        current = '';
        i++;
      } else if (consonantCount === 1) {
        // 单个辅音：默认开音节（辅音归后）
        // 闭音节例外：当前音节是 CVC 结构且已有前面的音节
        // （如 in·ter·est 中的 ter，不是词首）
        const cons = word[consStart];
        // CVC 结构：当前音节有 辅音+元音 且已经有前缀音节
        const hasLeadingCons = current.length >= 2 && !isVowel(current[0]);
        const isNonInitial = syllables.length > 0;
        if (hasLeadingCons && isNonInitial) {
          // 非词首的 CVC 音节
          // 但如果后面只剩一个元音（如 com·pa + n + y），保持开音节
          const remainingAfterCons = word.length - consStart - 1;
          if (remainingAfterCons <= 1) {
            // 辅音后只剥1个字符，用开音节避免尾音节太短
            syllables.push(current);
            current = '';
            i++;
          } else {
            // 闭音节 (in·ter, ac·tiv)
            current += cons;
            syllables.push(current);
            current = '';
            i = consStart + 1;
          }
        } else {
          // 词首音节或元音开头 → 开音节 (re·gard, pa·per, ti·ger, o·pen)
          syllables.push(current);
          current = '';
          i++;
        }
      } else if (consonantCount >= 2) {
        // 多个辅音：检查是否是不可分blend
        const consChunk = word.slice(consStart, consEnd);
        
        // 检查整个辅音群是否是一个blend
        if (blends.includes(consChunk)) {
          // 整个辅音组合归下一音节
          syllables.push(current);
          current = '';
          i++;
        } else {
          // 检查尾部是否有blend（应归下一音节）
          let blendLen = 0;
          for (const b of blends) {
            if (consChunk.endsWith(b) && b.length > blendLen && b.length < consChunk.length) {
              blendLen = b.length;
            }
          }
          
          if (blendLen > 0) {
            // 把blend前的辅音归当前音节，blend归下一音节
            const keepCount = consonantCount - blendLen;
            current += word.slice(consStart, consStart + keepCount);
            syllables.push(current);
            current = '';
            i = consStart + keepCount;
          } else {
            // 默认在中间断开
            const splitAt = Math.floor(consonantCount / 2);
            current += word.slice(consStart, consStart + splitAt);
            syllables.push(current);
            current = '';
            i = consStart + splitAt;
          }
        }
      }
    } else {
      i++;
    }
  }
  
  if (current) syllables.push(current);
  
  // 后处理
  return cleanupSyllables(syllables);
}

function cleanupSyllables(syllables) {
  if (syllables.length <= 1) return syllables;
  
  const vowels = 'aeiouy';
  const hasVowel = (s) => [...s].some(c => vowels.includes(c));
  const result = [];
  
  for (const syl of syllables) {
    if (result.length > 0 && !hasVowel(syl)) {
      // 没有元音的音节合并到前一个
      result[result.length - 1] += syl;
    } else {
      result.push(syl);
    }
  }
  
  // Silent e 处理：最后一个音节如果是 辅音+e 模式（如 te, pe, ke, ne, se, ze）
  // 且不是特殊后缀（le, ble, tle, ple），合并到前一个音节
  if (result.length > 1) {
    const last = result[result.length - 1];
    // 辅音+e 且只有 e 作为元音，且不是 -le 结尾
    if (last.endsWith('e') && last.length <= 3 && !last.endsWith('le')) {
      const vowelCount = [...last].filter(c => vowels.includes(c)).length;
      if (vowelCount === 1) {
        result[result.length - 2] += result.pop();
      }
    }
  }
  
  return result;
}

/**
 * 将完整 IPA 按音节数拆分分配
 */
function distributeIpa(syllables, fullIpa) {
  if (!fullIpa || syllables.length <= 1) {
    return syllables.map(s => ({ syllable: s, ipa: fullIpa || '' }));
  }
  
  // 去掉首尾的 /
  let ipa = fullIpa.replace(/^\/?/, '').replace(/\/?$/, '');
  
  // IPA 元音符号（包括常见的）
  const isIpaVowel = (ch) => 'aeiouyæøœɛɔəɪʊʌɒɑɐ'.includes(ch);
  
  // 找到所有元音核心位置
  const vowelPositions = [];
  for (let i = 0; i < ipa.length; i++) {
    if (isIpaVowel(ipa[i])) {
      vowelPositions.push(i);
      // 跳过双元音/长元音标记（ː 或紧跟的另一个元音）
      while (i + 1 < ipa.length && (isIpaVowel(ipa[i + 1]) || ipa[i + 1] === 'ː' || ipa[i + 1] === 'ˈ' || ipa[i + 1] === 'ˌ')) {
        i++;
      }
    }
  }
  
  // 如果元音数 == 音节数，按元音位置分割
  if (vowelPositions.length === syllables.length) {
    const parts = [];
    for (let i = 0; i < vowelPositions.length; i++) {
      let start;
      if (i === 0) {
        start = 0;
      } else {
        // 在前一个元音后和当前元音前的辅音群中间分割
        const prevVowelEnd = vowelPositions[i - 1] + 1;
        // 跳过长元音标记
        let consonantStart = prevVowelEnd;
        while (consonantStart < vowelPositions[i] && (ipa[consonantStart] === 'ː')) {
          consonantStart++;
        }
        const consonantEnd = vowelPositions[i];
        // 重音标记应跟随后面的音节
        let mid = Math.ceil((consonantStart + consonantEnd) / 2);
        while (mid > 0 && (ipa[mid - 1] === 'ˈ' || ipa[mid - 1] === 'ˌ')) {
          mid--;
        }
        start = mid;
      }
      parts.push(start);
    }
    parts.push(ipa.length);
    
    return syllables.map((syl, idx) => ({
      syllable: syl,
      ipa: '/' + ipa.slice(parts[idx], parts[idx + 1]) + '/'
    }));
  }
  
  // 元音数不匹配，粗略均分
  const chunkSize = Math.ceil(ipa.length / syllables.length);
  return syllables.map((syl, idx) => {
    const start = idx * chunkSize;
    const end = Math.min(start + chunkSize, ipa.length);
    const chunk = ipa.slice(start, end);
    return {
      syllable: syl,
      ipa: chunk ? '/' + chunk + '/' : ''
    };
  });
}

/**
 * 获取单词的 phonics 信息（音节拆解 + IPA）
 * 首选 Free Dictionary API，兜底用规则拆分
 */
async function getPhonics(word, fallbackIpa) {
  const lowerWord = word.toLowerCase();
  
  // 短语不拆分音节（包含空格的是短语）
  if (lowerWord.includes(' ')) {
    return [{ syllable: lowerWord, ipa: fallbackIpa || '' }];
  }
  let ipa = '';
  let apiSyllables = null;
  
  try {
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(lowerWord)}`);
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        const entry = data[0];
        
        // 获取 IPA
        if (entry.phonetics && entry.phonetics.length > 0) {
          for (const p of entry.phonetics) {
            if (p.text) {
              ipa = p.text;
              break;
            }
          }
        }
        // 也可能在顶层
        if (!ipa && entry.phonetic) {
          ipa = entry.phonetic;
        }
        
        // 尝试从 API 获取音节信息（有些词条的 word 字段可能带连字符）
        if (entry.word && entry.word.includes('-')) {
          apiSyllables = entry.word.split('-').map(s => s.trim()).filter(s => s);
        }
      }
    }
  } catch (e) {
    console.log('Free Dictionary API error:', e.message);
  }
  
  // 如果 Free Dictionary 没返回音标，用有道的音标兆底
  if (!ipa && fallbackIpa) {
    ipa = fallbackIpa;
  }
  
  // 音节拆分：优先 API 结果，兜底规则
  const syllables = (apiSyllables && apiSyllables.length > 1) ? apiSyllables : splitSyllables(lowerWord);
  
  // 构建 phonics 数组
  if (syllables.length === 1) {
    // 单音节词
    return [{ syllable: syllables[0], ipa: ipa || '' }];
  }
  
  // 多音节词：将完整 IPA 按音节数均分
  const phonics = distributeIpa(syllables, ipa);
  return phonics;
}

// 分析单词的词根词缀
function analyzeRoots(word) {
  const lowerWord = word.toLowerCase();
  const results = [];
  
  // 太短的词不分析
  if (lowerWord.length < 4) return results;
  
  // 检查前缀（从长到短匹配）
  const prefixes = Object.keys(COMMON_ROOTS)
    .filter(k => COMMON_ROOTS[k].type === 'prefix')
    .sort((a, b) => b.length - a.length);
  
  let remaining = lowerWord;
  for (const prefix of prefixes) {
    if (remaining.startsWith(prefix) && remaining.length > prefix.length + 2) {
      results.push({
        part: prefix + '-',
        type: '前缀',
        meaning: COMMON_ROOTS[prefix].meaning
      });
      remaining = remaining.slice(prefix.length);
      break; // 只匹配一个前缀
    }
  }
  
  // 检查后缀（从长到短匹配）
  const suffixes = Object.keys(COMMON_ROOTS)
    .filter(k => COMMON_ROOTS[k].type === 'suffix')
    .sort((a, b) => b.length - a.length);
  
  for (const suffix of suffixes) {
    if (remaining.endsWith(suffix) && remaining.length > suffix.length + 2) {
      results.push({
        part: '-' + suffix,
        type: '后缀',
        meaning: COMMON_ROOTS[suffix].meaning
      });
      remaining = remaining.slice(0, remaining.length - suffix.length);
      break; // 只匹配一个后缀
    }
  }
  
  // 检查词根（在剩余部分中查找）
  const roots = Object.keys(COMMON_ROOTS)
    .filter(k => COMMON_ROOTS[k].type === 'root')
    .sort((a, b) => b.length - a.length);
  
  for (const root of roots) {
    if (remaining.includes(root) && remaining.length >= root.length) {
      results.push({
        part: root,
        type: '词根',
        meaning: COMMON_ROOTS[root].meaning
      });
      break; // 只匹配一个词根
    }
  }
  
  return results;
}

// 读取缓存
function readCache() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const data = fs.readFileSync(CACHE_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.log('读取缓存失败:', e.message);
  }
  return {};
}

// 写入缓存
function writeCache(cache) {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf8');
  } catch (e) {
    console.log('写入缓存失败:', e.message);
  }
}

// 生成词形变化（规则兜底）
function generateForms(word, pos) {
  const forms = {};
  const lowerWord = word.toLowerCase();
  
  // 名词：复数
  if (pos.includes('n')) {
    if (lowerWord.endsWith('s') || lowerWord.endsWith('x') || lowerWord.endsWith('z') || 
        lowerWord.endsWith('ch') || lowerWord.endsWith('sh')) {
      forms.plural = lowerWord + 'es';
    } else if (lowerWord.endsWith('y') && !'aeiou'.includes(lowerWord[lowerWord.length - 2])) {
      forms.plural = lowerWord.slice(0, -1) + 'ies';
    } else if (lowerWord.endsWith('f')) {
      forms.plural = lowerWord.slice(0, -1) + 'ves';
    } else if (lowerWord.endsWith('fe')) {
      forms.plural = lowerWord.slice(0, -2) + 'ves';
    } else {
      forms.plural = lowerWord + 's';
    }
  }
  
  // 动词：过去式、进行时、第三人称
  if (pos.includes('v')) {
    // 过去式 -ed
    if (lowerWord.endsWith('e')) {
      forms.past = lowerWord + 'd';
      forms.pastParticiple = lowerWord + 'd';
    } else if (lowerWord.endsWith('y') && !'aeiou'.includes(lowerWord[lowerWord.length - 2])) {
      forms.past = lowerWord.slice(0, -1) + 'ied';
      forms.pastParticiple = lowerWord.slice(0, -1) + 'ied';
    } else {
      forms.past = lowerWord + 'ed';
      forms.pastParticiple = lowerWord + 'ed';
    }
    
    // 进行时 -ing
    if (lowerWord.endsWith('e') && !lowerWord.endsWith('ee')) {
      forms.presentParticiple = lowerWord.slice(0, -1) + 'ing';
    } else if (lowerWord.endsWith('ie')) {
      forms.presentParticiple = lowerWord.slice(0, -2) + 'ying';
    } else {
      forms.presentParticiple = lowerWord + 'ing';
    }
    
    // 第三人称单数
    if (lowerWord.endsWith('s') || lowerWord.endsWith('x') || lowerWord.endsWith('z') ||
        lowerWord.endsWith('ch') || lowerWord.endsWith('sh')) {
      forms.thirdPerson = lowerWord + 'es';
    } else if (lowerWord.endsWith('y') && !'aeiou'.includes(lowerWord[lowerWord.length - 2])) {
      forms.thirdPerson = lowerWord.slice(0, -1) + 'ies';
    } else {
      forms.thirdPerson = lowerWord + 's';
    }
  }
  
  return forms;
}

// 简单的单词词典缓存
const cache = new Map();

// 常用单词词典（离线备用）
const basicDict = {
  'the': '这，那',
  'a': '一个',
  'an': '一个',
  'is': '是',
  'are': '是',
  'am': '是',
  'was': '是（过去）',
  'were': '是（过去）',
  'be': '是',
  'been': '是（过去分词）',
  'being': '正在是',
  'have': '有',
  'has': '有',
  'had': '有（过去）',
  'do': '做',
  'does': '做',
  'did': '做（过去）',
  'will': '将要',
  'would': '会',
  'can': '能够',
  'could': '能够',
  'should': '应该',
  'may': '可能',
  'might': '可能',
  'must': '必须',
  'to': '到，去',
  'of': '的',
  'in': '在...里',
  'on': '在...上',
  'at': '在',
  'for': '为了',
  'with': '和，用',
  'by': '被，通过',
  'from': '从',
  'up': '向上',
  'down': '向下',
  'out': '出去',
  'into': '进入',
  'over': '在...上方',
  'under': '在...下面',
  'again': '再次',
  'then': '然后',
  'here': '这里',
  'there': '那里',
  'when': '当...时',
  'where': '哪里',
  'why': '为什么',
  'how': '怎样',
  'what': '什么',
  'who': '谁',
  'which': '哪个',
  'this': '这个',
  'that': '那个',
  'these': '这些',
  'those': '那些',
  'it': '它',
  'he': '他',
  'she': '她',
  'they': '他们',
  'we': '我们',
  'you': '你',
  'i': '我',
  'my': '我的',
  'your': '你的',
  'his': '他的',
  'her': '她的',
  'its': '它的',
  'our': '我们的',
  'their': '他们的',
  'and': '和',
  'or': '或者',
  'but': '但是',
  'if': '如果',
  'because': '因为',
  'so': '所以',
  'not': '不',
  'no': '不',
  'yes': '是',
  'all': '全部',
  'each': '每个',
  'every': '每个',
  'some': '一些',
  'any': '任何',
  'many': '许多',
  'much': '很多',
  'more': '更多',
  'most': '最多',
  'other': '其他',
  'new': '新的',
  'old': '旧的',
  'good': '好的',
  'bad': '坏的',
  'big': '大的',
  'small': '小的',
  'long': '长的',
  'short': '短的',
  'high': '高的',
  'low': '低的',
  'first': '第一',
  'last': '最后',
  'next': '下一个',
  'same': '相同的',
  'different': '不同的',
  'very': '非常',
  'just': '只是',
  'also': '也',
  'only': '只有',
  'now': '现在',
  'today': '今天',
  'day': '天',
  'time': '时间',
  'year': '年',
  'people': '人们',
  'way': '方式',
  'thing': '事物',
  'man': '男人',
  'woman': '女人',
  'child': '孩子',
  'world': '世界',
  'life': '生活',
  'hand': '手',
  'part': '部分',
  'place': '地方',
  'case': '情况',
  'week': '周',
  'work': '工作',
  'fact': '事实',
  'group': '组',
  'number': '数字',
  'night': '夜晚',
  'point': '点',
  'home': '家',
  'water': '水',
  'room': '房间',
  'mother': '母亲',
  'father': '父亲',
  'area': '区域',
  'money': '钱',
  'story': '故事',
  'go': '去',
  'come': '来',
  'make': '制作',
  'take': '拿',
  'get': '得到',
  'give': '给',
  'see': '看',
  'know': '知道',
  'think': '思考',
  'say': '说',
  'tell': '告诉',
  'ask': '问',
  'use': '使用',
  'find': '找到',
  'want': '想要',
  'look': '看',
  'put': '放',
  'need': '需要',
  'feel': '感觉',
  'try': '尝试',
  'leave': '离开',
  'call': '叫',
  'keep': '保持',
  'let': '让',
  'begin': '开始',
  'seem': '似乎',
  'help': '帮助',
  'show': '展示',
  'hear': '听',
  'play': '玩',
  'run': '跑',
  'move': '移动',
  'live': '住',
  'believe': '相信',
  'hold': '握住',
  'bring': '带来',
  'write': '写',
  'read': '读',
  'learn': '学习',
  'change': '改变',
  'watch': '观看',
  'follow': '跟随',
  'stop': '停止',
  'create': '创造',
  'speak': '说话',
  'allow': '允许',
  'meet': '遇见',
  'pay': '支付',
  'send': '发送',
  'build': '建造',
  'stay': '停留',
  'fall': '落下',
  'cut': '切',
  'reach': '到达',
  'kill': '杀',
  'remain': '保持',
  'love': '爱',
  'like': '喜欢',
  'open': '打开',
  'close': '关闭',
  'eat': '吃',
  'drink': '喝',
  'sleep': '睡觉',
  'walk': '走',
  'sit': '坐',
  'stand': '站',
  'buy': '买',
  'sell': '卖',
  'happy': '快乐的',
  'sad': '悲伤的',
  'beautiful': '美丽的',
  'ugly': '丑陋的',
  'fast': '快的',
  'slow': '慢的',
  'hot': '热的',
  'cold': '冷的',
  'warm': '温暖的',
  'cool': '凉爽的',
  'easy': '容易的',
  'hard': '困难的',
  'difficult': '困难的',
  'simple': '简单的',
  'important': '重要的',
  'right': '正确的',
  'wrong': '错误的',
  'true': '真的',
  'false': '假的',
  'young': '年轻的',
  'early': '早的',
  'late': '晚的',
  'best': '最好的',
  'great': '伟大的',
  'little': '小的',
  'own': '自己的',
  'able': '能够的',
  'real': '真实的',
  'sure': '确定的',
  'better': '更好的',
  'full': '满的',
  'special': '特别的',
  'free': '自由的',
  'strong': '强壮的',
  'never': '从不',
  'always': '总是',
  'sometimes': '有时',
  'often': '经常',
  'usually': '通常',
  'maybe': '也许',
  'really': '真的',
  'still': '仍然',
  'even': '甚至',
  'back': '回来',
  'away': '离开',
  'together': '一起',
  'please': '请',
  'thank': '谢谢',
  'sorry': '对不起',
  'hello': '你好',
  'goodbye': '再见',
  // 扩展词汇
  'booking': '预订，预约',
  'book': '书；预订',
  'ticket': '票',
  'hotel': '酒店',
  'restaurant': '餐厅',
  'airport': '机场',
  'train': '火车',
  'bus': '公交车',
  'car': '汽车',
  'bike': '自行车',
  'plane': '飞机',
  'ship': '轮船',
  'travel': '旅行',
  'trip': '旅行',
  'vacation': '假期',
  'holiday': '假日',
  'beach': '海滩',
  'mountain': '山',
  'river': '河流',
  'lake': '湖',
  'sea': '海',
  'ocean': '海洋',
  'forest': '森林',
  'park': '公园',
  'zoo': '动物园',
  'museum': '博物馆',
  'library': '图书馆',
  'school': '学校',
  'teacher': '老师',
  'student': '学生',
  'class': '班级；课',
  'lesson': '课程',
  'homework': '家庭作业',
  'test': '测试',
  'exam': '考试',
  'book': '书',
  'pen': '钢笔',
  'pencil': '铅笔',
  'paper': '纸',
  'desk': '书桌',
  'chair': '椅子',
  'table': '桌子',
  'door': '门',
  'window': '窗户',
  'floor': '地板',
  'wall': '墙',
  'ceiling': '天花板',
  'computer': '电脑',
  'phone': '电话',
  'television': '电视',
  'movie': '电影',
  'music': '音乐',
  'song': '歌曲',
  'game': '游戏',
  'sport': '运动',
  'ball': '球',
  'football': '足球',
  'basketball': '篮球',
  'swimming': '游泳',
  'running': '跑步',
  'dancing': '跳舞',
  'singing': '唱歌',
  'drawing': '画画',
  'painting': '绑画',
  'cooking': '做饭',
  'eating': '吃',
  'drinking': '喝',
  'sleeping': '睡觉',
  'waking': '醒来',
  'morning': '早上',
  'afternoon': '下午',
  'evening': '晚上',
  'midnight': '午夜',
  'breakfast': '早餐',
  'lunch': '午餐',
  'dinner': '晚餐',
  'food': '食物',
  'fruit': '水果',
  'apple': '苹果',
  'banana': '香蕉',
  'orange': '橙子',
  'grape': '葡萄',
  'strawberry': '草莓',
  'vegetable': '蔬菜',
  'meat': '肉',
  'fish': '鱼',
  'chicken': '鸡肉',
  'egg': '鸡蛋',
  'rice': '米饭',
  'bread': '面包',
  'cake': '蛋糕',
  'candy': '糖果',
  'chocolate': '巧克力',
  'ice': '冰',
  'milk': '牛奶',
  'juice': '果汁',
  'tea': '茶',
  'coffee': '咖啡',
  'family': '家庭',
  'parent': '父母',
  'parents': '父母',
  'brother': '兄弟',
  'sister': '姐妹',
  'son': '儿子',
  'daughter': '女儿',
  'baby': '婴儿',
  'friend': '朋友',
  'neighbor': '邻居',
  'doctor': '医生',
  'nurse': '护士',
  'police': '警察',
  'driver': '司机',
  'worker': '工人',
  'farmer': '农民',
  'animal': '动物',
  'dog': '狗',
  'cat': '猫',
  'bird': '鸟',
  'horse': '马',
  'cow': '牛',
  'pig': '猪',
  'sheep': '羊',
  'lion': '狮子',
  'tiger': '老虎',
  'elephant': '大象',
  'monkey': '猴子',
  'bear': '熊',
  'rabbit': '兔子',
  'mouse': '老鼠',
  'duck': '鸭子',
  'hen': '母鸡',
  'snake': '蛇',
  'frog': '青蛙',
  'butterfly': '蝴蝶',
  'flower': '花',
  'tree': '树',
  'grass': '草',
  'leaf': '叶子',
  'sun': '太阳',
  'moon': '月亮',
  'star': '星星',
  'sky': '天空',
  'cloud': '云',
  'rain': '雨',
  'snow': '雪',
  'wind': '风',
  'weather': '天气',
  'spring': '春天',
  'summer': '夏天',
  'autumn': '秋天',
  'winter': '冬天',
  'color': '颜色',
  'red': '红色',
  'blue': '蓝色',
  'green': '绿色',
  'yellow': '黄色',
  'white': '白色',
  'black': '黑色',
  'pink': '粉色',
  'purple': '紫色',
  'brown': '棕色',
  'gray': '灰色',
  'clothes': '衣服',
  'shirt': '衬衫',
  'pants': '裤子',
  'dress': '裙子',
  'skirt': '短裙',
  'coat': '外套',
  'jacket': '夹克',
  'shoes': '鞋子',
  'hat': '帽子',
  'body': '身体',
  'head': '头',
  'face': '脸',
  'eye': '眼睛',
  'nose': '鼻子',
  'mouth': '嘴巴',
  'ear': '耳朵',
  'hair': '头发',
  'arm': '手臂',
  'leg': '腿',
  'foot': '脚',
  'feet': '脚（复数）',
  'finger': '手指',
  'heart': '心',
  'happy': '快乐的',
  'angry': '生气的',
  'tired': '疲倦的',
  'hungry': '饿的',
  'thirsty': '渴的',
  'sick': '生病的',
  'healthy': '健康的',
  'clean': '干净的',
  'dirty': '脏的',
  'quiet': '安静的',
  'loud': '大声的',
  'soft': '柔软的',
  'light': '轻的；光',
  'dark': '黑暗的',
  'bright': '明亮的',
  'heavy': '重的',
  'wet': '湿的',
  'dry': '干的',
  'rich': '富有的',
  'poor': '贫穷的',
  'safe': '安全的',
  'dangerous': '危险的',
  'possible': '可能的',
  'impossible': '不可能的',
  'lucky': '幸运的',
  'ready': '准备好的',
  'busy': '忙碌的',
  'empty': '空的',
  'famous': '著名的',
  'popular': '流行的',
  'interesting': '有趣的',
  'boring': '无聊的',
  'exciting': '令人兴奋的',
  'wonderful': '精彩的',
  'terrible': '糟糕的',
  'amazing': '惊人的',
  'fantastic': '极好的',
  'perfect': '完美的',
  'finally': '最终',
  'quickly': '快速地',
  'slowly': '慢慢地',
  'carefully': '小心地',
  'happily': '快乐地',
  'easily': '容易地',
  'suddenly': '突然',
  'probably': '可能',
  'certainly': '当然',
  'especially': '特别',
  'almost': '几乎',
  'enough': '足够',
  'already': '已经',
  'else': '其他',
  'quite': '相当',
  'rather': '相当',
  'such': '如此',
  'until': '直到',
  'while': '当...时候',
  'since': '自从',
  'though': '虽然',
  'although': '虽然',
  'however': '然而',
  'therefore': '因此',
  'during': '在...期间',
  'through': '通过',
  'across': '穿过',
  'along': '沿着',
  'around': '围绕',
  'behind': '在...后面',
  'beside': '在...旁边',
  'between': '在...之间',
  'among': '在...中间',
  'above': '在...上方',
  'below': '在...下方',
  'near': '在...附近',
  'far': '远',
  'outside': '在外面',
  'inside': '在里面',
  'front': '前面',
  'middle': '中间',
  'side': '旁边',
  'corner': '角落',
  'everything': '一切',
  'something': '某事',
  'nothing': '没什么',
  'anything': '任何事',
  'everyone': '每个人',
  'someone': '某人',
  'nobody': '没有人',
  'anybody': '任何人',
  'everywhere': '到处',
  'somewhere': '某处',
  'nowhere': '无处',
  'anywhere': '任何地方'
};

// GET /api/translate/:word - 获取单词翻译
router.get('/:word', async (req, res) => {
  try {
    const word = req.params.word.toLowerCase().trim();
    
    // 检查缓存
    if (cache.has(word)) {
      return res.json({ success: true, data: cache.get(word) });
    }
    
    // 检查基础词典
    if (basicDict[word]) {
      const result = { word, translation: basicDict[word], source: 'basic' };
      cache.set(word, result);
      return res.json({ success: true, data: result });
    }
    
    // 使用有道词典 API（返回中文释义）
    try {
      const response = await fetch(`https://dict.youdao.com/jsonapi_s?doctype=json&jsonversion=4&q=${encodeURIComponent(word)}`);
      if (response.ok) {
        const data = await response.json();
        
        // 尝试从 ec.word.trs 获取中文释义（确保是同一个词）
        if (data.ec && data.ec.word && data.ec.word.trs) {
          // 验证返回的是请求的词
          const returnedWord = data.simple?.word?.[0]?.['return-phrase']?.toLowerCase();
          if (returnedWord === word || !returnedWord) {
            const trs = data.ec.word.trs;
            const translations = trs.slice(0, 2).map(t => `${t.pos} ${t.tran}`).join('；');
            const phonetic = data.ec.word.ukphone ? `/${data.ec.word.ukphone}/` : '';
            
            const result = { 
              word, 
              translation: translations,
              phonetic: phonetic,
              source: 'youdao'
            };
            cache.set(word, result);
            return res.json({ success: true, data: result });
          }
        }
        
        // 尝试从 web_trans 获取（精确匹配）
        if (data.web_trans && data.web_trans['web-translation']) {
          for (const item of data.web_trans['web-translation']) {
            if (item.key && item.key.toLowerCase() === word && item.trans) {
              const translations = item.trans.slice(0, 2).map(t => t.value).join('，');
              const result = { 
                word, 
                translation: translations,
                phonetic: '',
                source: 'youdao'
              };
              cache.set(word, result);
              return res.json({ success: true, data: result });
            }
          }
        }
      }
    } catch (apiError) {
      console.log('Youdao API error:', apiError.message);
    }
    
    // 如果都找不到，返回未找到
    res.json({ 
      success: false, 
      error: '未找到翻译',
      data: { word, translation: null }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/translate/:word/detail - 获取单词详细信息（词性、音标、同/反义词、词形变化）
router.get('/:word/detail', async (req, res) => {
  try {
    const word = req.params.word.toLowerCase().trim();
    
    // 1. 先查本地缓存（检查是否有 phonics 字段，没有则重新获取）
    const cacheData = readCache();
    if (cacheData[word] && cacheData[word].phonics) {
      return res.json({ success: true, data: cacheData[word] });
    }
    
    // 2. 调用有道API
    let result = {
      word: word,
      phonetic: '',
      pos: '',
      translation: '',
      synonyms: [],
      antonyms: [],
      forms: {},
      roots: []
    };
    
    try {
      const response = await fetch(`https://dict.youdao.com/jsonapi_s?doctype=json&jsonversion=4&q=${encodeURIComponent(word)}`);
      if (response.ok) {
        const data = await response.json();
        
        // 提取词性和释义
        if (data.ec && data.ec.word && data.ec.word.trs) {
          const trs = data.ec.word.trs;
          if (trs.length > 0) {
            // 取第一个作为主词性
            result.pos = trs[0].pos || '';
            result.translation = trs[0].tran || '';
          }
          
          // 音标
          result.phonetic = data.ec.word.ukphone ? `/${data.ec.word.ukphone}/` : 
                           (data.ec.word.usphone ? `/${data.ec.word.usphone}/` : '');
        }
        
        // 提取同义词
        if (data.syno && data.syno.synos && data.syno.synos.length > 0) {
          const synoData = data.syno.synos[0];
          if (synoData.syno && synoData.syno.ws) {
            result.synonyms = synoData.syno.ws.map(w => w.w).filter(w => w).slice(0, 5);
          }
        }
        
        // 提取词形变化
        if (data.rel_word && data.rel_word.rels) {
          for (const rel of data.rel_word.rels) {
            if (rel.rel && rel.rel.words) {
              const relType = (rel.rel.pos || '').toLowerCase();
              const words = rel.rel.words.map(w => w.word).filter(w => w);
              if (words.length > 0) {
                // 映射常见词形
                if (relType.includes('复数') || relType.includes('plural')) {
                  result.forms.plural = words[0];
                } else if (relType.includes('过去式') || relType.includes('past')) {
                  result.forms.past = words[0];
                } else if (relType.includes('过去分词')) {
                  result.forms.pastParticiple = words[0];
                } else if (relType.includes('现在分词') || relType.includes('ing')) {
                  result.forms.presentParticiple = words[0];
                } else if (relType.includes('第三人称')) {
                  result.forms.thirdPerson = words[0];
                }
              }
            }
          }
        }
        
        // 也尝试从 ec.word.wfs 提取词形变化
        if (data.ec && data.ec.word && data.ec.word.wfs) {
          for (const wf of data.ec.word.wfs) {
            if (wf.wf) {
              const name = (wf.wf.name || '').toLowerCase();
              const value = wf.wf.value;
              if (value) {
                if (name.includes('复数') || name === 'pl') {
                  result.forms.plural = value;
                } else if (name.includes('过去式') || name === 'pt') {
                  result.forms.past = value;
                } else if (name.includes('过去分词') || name === 'pp') {
                  result.forms.pastParticiple = value;
                } else if (name.includes('现在分词') || name === 'pres') {
                  result.forms.presentParticiple = value;
                } else if (name.includes('第三人称') || name === '3rd') {
                  result.forms.thirdPerson = value;
                }
              }
            }
          }
        }
      }
    } catch (apiError) {
      console.log('Youdao API error (detail):', apiError.message);
    }
    
    // 3. 兜底处理
    // 同义词兜底
    if (result.synonyms.length === 0 && COMMON_SYNONYMS[word]) {
      result.synonyms = COMMON_SYNONYMS[word].slice(0, 5);
    }
    
    // 反义词兜底
    if (COMMON_ANTONYMS[word]) {
      result.antonyms = COMMON_ANTONYMS[word].slice(0, 3);
    }
    
    // 词形变化兜底（如果API没有返回，用规则生成）
    if (Object.keys(result.forms).length === 0 && result.pos) {
      result.forms = generateForms(word, result.pos);
    }
    
    // 词根词缀分析
    result.roots = analyzeRoots(word);
    
    // Phonics 音节拆解（传入有道音标作为兆底）
    try {
      result.phonics = await getPhonics(word, result.phonetic);
    } catch (e) {
      console.log('Phonics error:', e.message);
      result.phonics = [{ syllable: word, ipa: '' }];
    }
    
    // 4. 写入缓存
    cacheData[word] = result;
    writeCache(cacheData);
    
    res.json({ success: true, data: result });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
