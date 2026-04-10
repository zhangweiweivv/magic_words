#!/usr/bin/env python3
"""
可可单词本自动扩充脚本

每3天从PET官方单词库中选10个新单词加入未记住单词本
配比：A1(20%) + A2(40%) + B1(40%)
"""

import json
import re
from datetime import datetime, timedelta
from pathlib import Path
from typing import Set, List, Tuple, Dict

# 路径配置
BASE_DIR = Path("/Users/vvhome/vv_obsidian/vv_obsidian/可可pet/可可单词本")
WORDBANK_PATH = BASE_DIR / "PET官方单词库.md"
UNLEARNED_PATH = BASE_DIR / "未记住单词.md"
LEARNED_PATH = BASE_DIR / "已记住单词.md"
REVIEW_STATE_PATH = BASE_DIR / "review-state.json"
EXPANSION_STATE_PATH = BASE_DIR / "expansion-state.json"

# 太简单的A1词黑名单（可可100%会的）
TOO_SIMPLE = {
    # 超高频虚词
    'the', 'a', 'an', 'be', 'is', 'am', 'are', 'was', 'were', 'and', 'or', 'but',
    'of', 'to', 'in', 'on', 'at', 'for', 'with', 'by', 'from', 'as',
    # 代词
    'i', 'you', 'he', 'she', 'it', 'we', 'they', 
    'my', 'your', 'his', 'her', 'its', 'our', 'their',
    'me', 'him', 'them', 'us',
    # 疑问词
    'what', 'when', 'where', 'who', 'why', 'how',
    # 基础助词
    'do', 'does', 'did', 'have', 'has', 'had', 'will', 'would', 'can', 'could',
    # 基础连词/介词短语（太简单的）
    'yes', 'no', 'not', 'so', 'if', 'this', 'that', 'these', 'those',
    # 基础名词（太简单的）
    'cat', 'dog', 'boy', 'girl', 'man', 'woman', 'mom', 'dad',
    # 基础数字
    'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
    # 基础颜色
    'red', 'blue', 'green', 'yellow', 'black', 'white',
}


def load_json(path: Path) -> dict:
    """加载JSON文件"""
    if not path.exists():
        return {}
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)


def save_json(path: Path, data: dict):
    """保存JSON文件"""
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def extract_words_from_markdown(md_path: Path) -> Set[str]:
    """从markdown文件提取所有单词（小写）"""
    if not md_path.exists():
        return set()
    
    words = set()
    with open(md_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 提取表格中的单词（第一列）
    for line in content.split('\n'):
        line = line.strip()
        if line.startswith('|') and not line.startswith('| 单词'):
            parts = [p.strip() for p in line.split('|')]
            if len(parts) >= 3:
                word = parts[1].strip().lower()
                if word and word not in ['---', '单词']:
                    # 处理多个变体，如 "a/an"
                    for variant in word.split('/'):
                        words.add(variant.strip())
    
    return words


def build_blacklist() -> Set[str]:
    """构建黑名单：已学过的单词"""
    blacklist = set()
    
    # 1. 未记住单词本
    blacklist.update(extract_words_from_markdown(UNLEARNED_PATH))
    
    # 2. 已记住单词本
    blacklist.update(extract_words_from_markdown(LEARNED_PATH))
    
    # 3. review-state.json（兼容手动添加）
    review_state = load_json(REVIEW_STATE_PATH)
    if 'words' in review_state:
        blacklist.update(w.lower() for w in review_state['words'].keys())
    if 'phrases' in review_state:
        blacklist.update(p.lower() for p in review_state['phrases'].keys())
    
    # 4. 太简单的词
    blacklist.update(TOO_SIMPLE)
    
    print(f"黑名单构建完成：{len(blacklist)} 个词/短语")
    return blacklist


def is_substantive_word(pos: str) -> bool:
    """判断是否为实义词（优先选择）"""
    pos_lower = pos.lower()
    # 实义词：名词、动词、形容词、副词
    return any(x in pos_lower for x in ['n', 'v', 'adj', 'adv'])


def load_wordbank() -> Dict[str, List[Tuple[str, str, int]]]:
    """
    从PET官方单词库加载单词
    返回: {CEFR等级: [(word, pos, rank), ...]}
    """
    wordbank = {'A1': [], 'A2': [], 'B1': [], 'B2+': []}
    
    with open(WORDBANK_PATH, 'r', encoding='utf-8') as f:
        content = f.read()
    
    current_level = None
    for line in content.split('\n'):
        line = line.strip()
        
        # 检测CEFR等级标题
        if line.startswith('## 🏷️'):
            level = line.split('🏷️')[1].strip().split()[0]  # "A1 级别" -> "A1"
            if level in wordbank:
                current_level = level
            elif level.startswith('B2') or level.startswith('C'):
                current_level = 'B2+'
        
        # 提取单词行
        elif line.startswith('|') and current_level and not line.startswith('| #'):
            parts = [p.strip() for p in line.split('|')]
            if len(parts) >= 5:
                word = parts[2].strip()
                pos = parts[3].strip()
                rank_str = parts[4].strip()
                
                # 跳过表头
                if word == '单词' or word == '---':
                    continue
                
                rank = int(rank_str) if rank_str.isdigit() else 9999
                wordbank[current_level].append((word, pos, rank))
    
    for level, words in wordbank.items():
        print(f"{level}: {len(words)} 个单词")
    
    return wordbank


def filter_candidates(wordbank: Dict[str, List], blacklist: Set[str], level: str) -> List[Tuple[str, str, int]]:
    """
    过滤指定等级的候选词（包括短语）
    返回: [(word, pos, rank), ...]
    """
    candidates = wordbank.get(level, [])
    filtered = []
    
    for word, pos, rank in candidates:
        word_lower = word.lower()
        
        # 跳过黑名单
        if word_lower in blacklist:
            continue
        
        # 跳过太简单的（只过滤68个基础词，短语不过滤）
        if word_lower in TOO_SIMPLE:
            continue
        
        # 对于短语，降低优先级（词频排名 +1000）
        is_phrase = ' ' in word or ('/' in word and word != 'a/an')
        adjusted_rank = rank + 1000 if is_phrase else rank
        
        filtered.append((word, pos, adjusted_rank, is_phrase))
    
    # 优先实义词，按调整后的词频排序
    substantive = [(w, p, r) for w, p, r, ph in filtered if is_substantive_word(p)]
    non_substantive = [(w, p, r) for w, p, r, ph in filtered if not is_substantive_word(p)]
    
    # 按调整后的rank排序
    substantive.sort(key=lambda x: x[2])
    non_substantive.sort(key=lambda x: x[2])
    
    return substantive + non_substantive


def select_words(wordbank: Dict[str, List], blacklist: Set[str], 
                 ratio: Dict[str, float], total: int = 10) -> List[Tuple[str, str, str]]:
    """
    按配比选择单词，某等级不够时自动从其他等级补充
    返回: [(word, pos, level), ...]
    """
    selected = []
    
    # 计算每个等级的初始目标
    targets = {
        'A1': int(total * ratio['A1']),
        'A2': int(total * ratio['A2']),
        'B1': total - int(total * ratio['A1']) - int(total * ratio['A2'])
    }
    
    print(f"\n目标配比：A1={targets['A1']}, A2={targets['A2']}, B1={targets['B1']}")
    
    # 获取各等级的候选池
    pools = {
        level: filter_candidates(wordbank, blacklist, level)
        for level in ['A1', 'A2', 'B1']
    }
    
    # 第一轮：按目标配比选择
    shortfall = 0  # 累计缺额
    actual = {'A1': 0, 'A2': 0, 'B1': 0}
    
    for level in ['A1', 'A2', 'B1']:
        target = targets[level]
        pool = pools[level]
        
        for word, pos, rank in pool[:target]:
            selected.append((word, pos, level))
            blacklist.add(word.lower())
            actual[level] += 1
        
        # 记录缺额
        shortfall += target - actual[level]
        print(f"  {level}: 目标{target}, 选出{actual[level]}")
    
    # 第二轮：补充缺额（从有剩余的等级补）
    if shortfall > 0:
        print(f"\n补充缺额：{shortfall}个")
        
        # 按优先级顺序：B1 > A2 > A1（先补难的）
        for level in ['B1', 'A2', 'A1']:
            if shortfall <= 0:
                break
            
            pool = filter_candidates(wordbank, blacklist, level)  # 重新过滤
            added = 0
            
            for word, pos, rank in pool:
                if shortfall <= 0:
                    break
                selected.append((word, pos, level))
                blacklist.add(word.lower())
                shortfall -= 1
                added += 1
            
            if added > 0:
                print(f"  从{level}补充: {added}个")
    
    print(f"\n最终选出：{len(selected)}个")
    return selected


def add_to_unlearned(words: List[Tuple[str, str, str]]) -> bool:
    """
    添加单词到未记住单词本
    返回是否成功
    """
    if not words:
        print("没有新单词需要添加")
        return False
    
    today = datetime.now().strftime('%Y-%m-%d')
    
    # 构建新的Callout块
    lines = [
        "",
        f"> [!tip] 📅 {today} PET单词库扩充",
        "> | 单词 | 意思 | 记忆技巧 |",
        "> |------|------|----------|"
    ]
    
    for word, pos, level in words:
        # 简化意思（从词性推测基础中文）
        # 这里先用占位符，后续可以接入翻译API
        meaning = "待补充"
        tip = f"[{level}] {pos}"
        lines.append(f"> | {word} | {meaning} | {tip} |")
    
    # 读取现有文件
    with open(UNLEARNED_PATH, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 在文件末尾添加（在最后一行"*最后更新*"之前）
    if '*最后更新：' in content:
        parts = content.rsplit('*最后更新：', 1)
        new_content = parts[0] + '\n'.join(lines) + '\n\n---\n\n*最后更新：' + parts[1]
    else:
        new_content = content + '\n' + '\n'.join(lines) + '\n'
    
    # 写回文件
    with open(UNLEARNED_PATH, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print(f"✅ 已添加 {len(words)} 个单词到未记住单词本")
    return True


def update_review_state(words: List[Tuple[str, str, str]]):
    """更新review-state.json"""
    review_state = load_json(REVIEW_STATE_PATH)
    
    if 'words' not in review_state:
        review_state['words'] = {}
    
    today = datetime.now().strftime('%Y-%m-%d')
    tomorrow = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
    
    # 找到下一个空闲的复习日期
    def find_free_slot(start_date: str, daily_limit: int = 10) -> str:
        """找到负载<10的日期"""
        date = datetime.strptime(start_date, '%Y-%m-%d')
        while True:
            date_str = date.strftime('%Y-%m-%d')
            # 统计该日期的复习负载
            count = sum(1 for w in review_state['words'].values() 
                       if w.get('nextReview') == date_str)
            if 'phrases' in review_state:
                count += sum(1 for p in review_state['phrases'].values()
                           if p.get('nextReview') == date_str)
            
            if count < daily_limit:
                return date_str
            date += timedelta(days=1)
    
    # 添加新单词
    for word, pos, level in words:
        next_review = find_free_slot(tomorrow, 10)
        review_state['words'][word.lower()] = {
            'added': today,
            'reviewCount': 0,
            'nextReview': next_review,
            'meaning': '待补充'
        }
    
    save_json(REVIEW_STATE_PATH, review_state)
    print(f"✅ 已更新 review-state.json")


def update_expansion_state(added_count: int, level_counts: Dict[str, int] = None):
    """更新扩充状态"""
    state = load_json(EXPANSION_STATE_PATH)
    
    today = datetime.now().strftime('%Y-%m-%d')
    state['lastExpansion'] = today
    state['totalAdded'] = state.get('totalAdded', 0) + added_count
    
    # 更新各等级进度
    if level_counts:
        progress = state.get('progress', {'A1': 0, 'A2': 0, 'B1': 0})
        for level, count in level_counts.items():
            progress[level] = progress.get(level, 0) + count
        state['progress'] = progress
    
    save_json(EXPANSION_STATE_PATH, state)
    print(f"✅ 已更新扩充状态：total={state['totalAdded']}, progress={state.get('progress', {})}, last={today}")


def should_expand() -> bool:
    """检查是否应该扩充（距离上次>=3天）"""
    state = load_json(EXPANSION_STATE_PATH)
    
    last = state.get('lastExpansion')
    if not last:
        print("首次扩充，执行...")
        return True
    
    last_date = datetime.strptime(last, '%Y-%m-%d')
    today = datetime.now()
    days_since = (today - last_date).days
    
    if days_since >= 3:
        print(f"距离上次扩充 {days_since} 天，执行...")
        return True
    else:
        print(f"距离上次扩充 {days_since} 天，跳过（需>=3天）")
        return False


def main():
    """主函数"""
    print("=" * 60)
    print("可可单词本自动扩充")
    print("=" * 60)
    
    # 1. 检查是否需要扩充
    if not should_expand():
        return
    
    # 2. 构建黑名单
    blacklist = build_blacklist()
    
    # 3. 加载单词库
    print("\n加载PET官方单词库...")
    wordbank = load_wordbank()
    
    # 4. 选择单词
    state = load_json(EXPANSION_STATE_PATH)
    ratio = state.get('ratio', {'A1': 0.2, 'A2': 0.4, 'B1': 0.4})
    batch_size = state.get('config', {}).get('batchSize', 20)
    
    print(f"\n选择新单词（批次大小：{batch_size}）...")
    selected = select_words(wordbank, blacklist, ratio, total=batch_size)
    
    if not selected:
        print("❌ 没有符合条件的新单词！")
        return
    
    print(f"\n本次选出 {len(selected)} 个单词：")
    for word, pos, level in selected:
        print(f"  [{level}] {word} ({pos})")
    
    # 5. 添加到未记住单词本
    print("\n添加到未记住单词本...")
    if add_to_unlearned(selected):
        # 6. 更新review-state.json
        update_review_state(selected)
        
        # 7. 更新扩充状态（统计各等级数量）
        level_counts = {}
        for word, pos, level in selected:
            level_counts[level] = level_counts.get(level, 0) + 1
        update_expansion_state(len(selected), level_counts)
        
        print("\n🎉 扩充完成！")
    else:
        print("\n❌ 扩充失败")


if __name__ == '__main__':
    main()
