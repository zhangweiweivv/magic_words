// Words too basic for PET students - these are typically mastered by Chinese primary school students
// by grade 2-3 and don't need explicit vocabulary drilling.
// Source: Common English high-frequency words known by most Chinese 8-year-olds.
// Updated: 2026-04-15 — expanded from 303 to ~460 words
module.exports = new Set([
  // === Articles, prepositions, conjunctions ===
  'a', 'an', 'the',
  'of', 'to', 'in', 'on', 'at', 'by', 'for', 'with', 'from', 'as',
  'up', 'out', 'off', 'down', 'about', 'into', 'over', 'after', 'before',
  'between', 'through', 'during', 'since', 'until', 'under', 'around',
  'against', 'along', 'across', 'behind', 'near', 'above', 'below',
  'or', 'and', 'but', 'not', 'no', 'so', 'if', 'because', 'than', 'while',
  'though', 'such', 'per', 'without',

  // === Pronouns & determiners ===
  'i', 'you', 'he', 'she', 'it', 'we', 'they',
  'me', 'him', 'her', 'us', 'them',
  'my', 'his', 'our', 'your', 'its', 'their',
  'myself', 'yourself', 'himself', 'herself', 'itself', 'themselves',
  'this', 'that', 'these', 'those',
  'who', 'what', 'where', 'when', 'how', 'why', 'which',
  'some', 'any', 'all', 'both', 'each', 'every', 'other', 'another',
  'something', 'anything', 'nothing', 'everything',
  'someone', 'anyone', 'everyone',

  // === Be / have / do / modal verbs ===
  'be', 'am', 'is', 'are', 'was', 'were', 'been', 'being',
  'have', 'has', 'had',
  'do', 'does', 'did', 'done',
  'will', 'would', 'can', 'could', 'may', 'might', 'shall', 'should', 'must',

  // === Basic verbs (grade 1-3) ===
  'go', 'come', 'get', 'make', 'take', 'give', 'say', 'tell', 'ask',
  'see', 'look', 'watch', 'hear', 'listen', 'feel', 'think', 'know',
  'want', 'need', 'like', 'love', 'hate', 'hope', 'wish', 'try',
  'use', 'put', 'let', 'help', 'show', 'find', 'keep', 'leave', 'call',
  'run', 'walk', 'sit', 'stand', 'stop', 'start', 'begin', 'end',
  'open', 'close', 'turn', 'move', 'play', 'work', 'study', 'learn',
  'read', 'write', 'draw', 'sing', 'dance', 'swim', 'jump', 'fly',
  'eat', 'drink', 'cook', 'wash', 'clean', 'sleep', 'wake',
  'buy', 'sell', 'pay', 'spend', 'send', 'bring', 'carry', 'hold',
  'wait', 'live', 'die', 'grow', 'change', 'talk', 'speak', 'meet',
  'remember', 'forget', 'understand', 'happen', 'seem', 'become',
  'follow', 'own', 'continue', 'set', 'fall', 'cut', 'reach',
  'pass', 'pick', 'wear', 'win', 'lose', 'hit', 'catch', 'throw',
  'pull', 'push', 'break', 'build', 'drive', 'ride',
  'mean', 'include',

  // === Basic nouns — people ===
  'man', 'woman', 'boy', 'girl', 'baby', 'child', 'children', 'people', 'person',
  'mom', 'dad', 'mother', 'father', 'brother', 'sister', 'family', 'friend',
  'teacher', 'student', 'kid',

  // === Basic nouns — body ===
  'head', 'eye', 'ear', 'nose', 'mouth', 'face', 'hand', 'foot', 'arm', 'leg',
  'hair', 'body', 'heart', 'back', 'finger', 'tooth',

  // === Basic nouns — daily objects ===
  'book', 'pen', 'bag', 'desk', 'door', 'window', 'table', 'chair', 'bed',
  'box', 'ball', 'toy', 'game', 'phone', 'car', 'bus', 'bike',
  'picture', 'letter', 'paper', 'key', 'cup', 'glass', 'bottle',

  // === Basic nouns — food ===
  'food', 'water', 'milk', 'rice', 'bread', 'egg', 'meat', 'fish',
  'fruit', 'apple', 'cake', 'candy', 'tea', 'coffee', 'juice',

  // === Basic nouns — places ===
  'home', 'house', 'room', 'school', 'class', 'park', 'shop', 'store',
  'street', 'road', 'city', 'town', 'country', 'place', 'world',

  // === Basic nouns — nature ===
  'sun', 'moon', 'star', 'sky', 'air', 'tree', 'flower', 'river',
  'sea', 'land', 'mountain', 'rain', 'snow', 'wind', 'fire',
  'dog', 'cat', 'bird',

  // === Basic nouns — time ===
  'day', 'night', 'morning', 'afternoon', 'evening',
  'today', 'tomorrow', 'yesterday',
  'week', 'month', 'year', 'time', 'hour', 'minute', 'second',
  'spring', 'summer', 'autumn', 'fall', 'winter',

  // === Basic nouns — other common ===
  'name', 'thing', 'way', 'part', 'side', 'end', 'line', 'life', 'story',
  'word', 'number', 'answer', 'question', 'idea', 'rest', 'kind', 'lot',
  'group', 'example', 'point', 'problem', 'money', 'news', 'mile',
  'color',

  // === Numbers ===
  'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'hundred', 'thousand', 'first', 'last', 'next',

  // === Colors ===
  'red', 'blue', 'green', 'yellow', 'black', 'white', 'brown', 'pink',
  'orange', 'purple', 'grey', 'gray',

  // === Basic adjectives ===
  'good', 'bad', 'big', 'small', 'long', 'short', 'tall', 'old', 'new', 'young',
  'happy', 'sad', 'nice', 'great', 'beautiful', 'pretty', 'cute', 'ugly',
  'hot', 'cold', 'warm', 'cool', 'fast', 'slow', 'hard', 'easy', 'soft',
  'high', 'low', 'full', 'empty', 'right', 'wrong', 'left', 'same', 'different',
  'early', 'late', 'sure', 'ready', 'free', 'busy', 'able', 'true', 'real',
  'fine', 'dear', 'dark', 'light', 'bright', 'strong', 'weak', 'rich', 'poor',
  'clean', 'dirty', 'safe', 'sick', 'tired', 'hungry', 'thirsty', 'angry',
  'afraid', 'sorry', 'glad', 'funny', 'interesting', 'important', 'special',
  'own', 'whole', 'certain', 'possible', 'main', 'common', 'clear', 'simple',
  'best', 'better', 'more', 'most',
  'serious', 'recent', 'public', 'local', 'national',

  // === Basic adverbs ===
  'very', 'too', 'also', 'just', 'still', 'even', 'ever', 'never', 'always',
  'often', 'usually', 'sometimes',
  'now', 'then', 'here', 'there', 'again', 'back', 'away',
  'only', 'really', 'well', 'far', 'quite', 'rather',
  'already', 'yet', 'soon', 'ago', 'almost',
  'maybe', 'perhaps', 'probably', 'enough',
  'together', 'else',
  'yes', 'yeah', 'ok', 'oh', 'hey',

  // === Other common words ===
  'many', 'much', 'few', 'little', 'less', 'least',
  'however', 'also', 'least',
])
