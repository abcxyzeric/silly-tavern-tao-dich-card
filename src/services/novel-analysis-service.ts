import { callAIWithPrompt } from './ai-service';
import { parseAIJson } from '../constants/prompts';

export interface NovelChunk {
  id: number;
  title: string;
  content: string;
  start: number;
  end: number;
}

export interface NovelAnalysisResult {
  summary: string;
  genre: string;
  tone: string;
  characters: Array<{
    name: string;
    role: string;
    traits: string[];
    relationships: string[];
    evidence: string;
  }>;
  locations: Array<{
    name: string;
    description: string;
    significance: string;
  }>;
  factions: Array<{
    name: string;
    purpose: string;
    members: string[];
  }>;
  timeline: Array<{
    order: number;
    event: string;
    impact: string;
  }>;
  lorebookEntries: Array<{
    name: string;
    keys: string[];
    content: string;
    category: string;
  }>;
  cleaningNotes: string[];
}

const CHAPTER_PATTERN = /(^|\n)(\s*(?:第[一二三四五六七八九十百千万零〇两\d]+[章节卷回幕部集]|番外|楔子|序章|终章|后记)[^\n]{0,60})/g;

export function splitNovelText(text: string, maxChunkChars = 8000): NovelChunk[] {
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
  if (!normalized) return [];

  const matches = Array.from(normalized.matchAll(CHAPTER_PATTERN));
  const chunks: NovelChunk[] = [];

  if (matches.length > 0) {
    for (let i = 0; i < matches.length; i++) {
      const current = matches[i];
      const next = matches[i + 1];
      const start = current.index ?? 0;
      const end = next?.index ?? normalized.length;
      const raw = normalized.slice(start, end).trim();
      const title = (current[2] || `章节 ${i + 1}`).trim();
      pushSplitChunk(chunks, title, raw, start, maxChunkChars);
    }
  } else {
    pushSplitChunk(chunks, '区块 1', normalized, 0, maxChunkChars);
  }

  return chunks.map((chunk, index) => ({ ...chunk, id: index + 1 }));
}

function pushSplitChunk(chunks: NovelChunk[], title: string, content: string, start: number, maxChunkChars: number) {
  if (content.length <= maxChunkChars) {
    chunks.push({ id: chunks.length + 1, title, content, start, end: start + content.length });
    return;
  }

  let offset = 0;
  while (offset < content.length) {
    const sliceEnd = Math.min(offset + maxChunkChars, content.length);
    let end = sliceEnd;
    if (sliceEnd < content.length) {
      const punctuation = content.lastIndexOf('\n', sliceEnd);
      if (punctuation > offset + maxChunkChars * 0.6) end = punctuation;
    }
    const part = content.slice(offset, end).trim();
    if (part) {
      const partNo = Math.floor(offset / maxChunkChars) + 1;
      chunks.push({
        id: chunks.length + 1,
        title: `${title} (${partNo})`,
        content: part,
        start: start + offset,
        end: start + end,
      });
    }
    offset = end;
  }
}

export function buildNovelSample(chunks: NovelChunk[], maxChars = 18000): string {
  if (chunks.length === 0) return '';
  const selected = [chunks[0], chunks[Math.floor(chunks.length / 2)], chunks[chunks.length - 1]]
    .filter((chunk, index, arr) => chunk && arr.findIndex((c) => c.id === chunk.id) === index);

  const budgetPerChunk = Math.max(1000, Math.floor(maxChars / selected.length));
  return selected.map((chunk) => {
    const excerpt = chunk.content.length > budgetPerChunk
      ? `${chunk.content.slice(0, budgetPerChunk)}\n...(节选)`
      : chunk.content;
    return `# ${chunk.title}\n${excerpt}`;
  }).join('\n\n---\n\n');
}

export async function analyzeNovelText(title: string, chunks: NovelChunk[]): Promise<NovelAnalysisResult> {
  const sample = buildNovelSample(chunks);
  if (!sample) throw new Error('请先输入或上传小说文本');

  const system = `你是小说文本分析与角色卡素材提取专家。参考 World-Agent 的做法：先进行结构抽样，再做语境判断、异常数据识别、设定实体提取，最后输出可用于 SillyTavern 角色卡/世界书的结构化素材。

要求：
- 只基于给定节选分析，不要编造未出现的信息。
- 优先提取对角色卡有用的信息：人物、关系、地点、势力、关键事件、世界规则。
- 如果发现广告、防盗版乱码、拼音替换、异常符号，写入 cleaningNotes。
- lorebookEntries 要写成数据库格式，使用键值对和列表，不写散文。
- 每个世界书条目的 keys 不能是单字，至少 2 个字符。
- 只输出 JSON，不要 markdown 代码块。`;

  const user = `小说标题：${title || '未命名小说'}
总切块数：${chunks.length}
总字数：${chunks.reduce((sum, chunk) => sum + chunk.content.length, 0)}

以下是开头/中段/结尾抽样：

${sample}

请输出 JSON：
{
  "summary": "整体剧情/世界观摘要，200-400字",
  "genre": "类型",
  "tone": "叙事氛围",
  "characters": [
    { "name": "人物名", "role": "定位", "traits": ["特征"], "relationships": ["关系"], "evidence": "原文依据简述" }
  ],
  "locations": [
    { "name": "地点名", "description": "描述", "significance": "重要性" }
  ],
  "factions": [
    { "name": "势力名", "purpose": "目的/立场", "members": ["成员"] }
  ],
  "timeline": [
    { "order": 1, "event": "事件", "impact": "影响" }
  ],
  "lorebookEntries": [
    { "name": "条目名", "keys": ["触发词"], "content": "条目内容，键值对/列表格式", "category": "人物/地点/势力/事件/规则" }
  ],
  "cleaningNotes": ["发现的清洗问题或空数组"]
}`;

  const text = await callAIWithPrompt(system, user, { temperature: 0.35, max_tokens: 9000 });
  const parsed = parseAIJson(text) as NovelAnalysisResult | null;
  if (!parsed) throw new Error('AI 返回内容无法解析为 JSON，请重试或减少文本长度');

  return {
    summary: parsed.summary || '',
    genre: parsed.genre || '',
    tone: parsed.tone || '',
    characters: Array.isArray(parsed.characters) ? parsed.characters : [],
    locations: Array.isArray(parsed.locations) ? parsed.locations : [],
    factions: Array.isArray(parsed.factions) ? parsed.factions : [],
    timeline: Array.isArray(parsed.timeline) ? parsed.timeline : [],
    lorebookEntries: Array.isArray(parsed.lorebookEntries) ? parsed.lorebookEntries : [],
    cleaningNotes: Array.isArray(parsed.cleaningNotes) ? parsed.cleaningNotes : [],
  };
}

export function exportAnalysisAsJson(title: string, chunks: NovelChunk[], analysis: NovelAnalysisResult): string {
  return JSON.stringify({
    title,
    generatedAt: new Date().toISOString(),
    chunkCount: chunks.length,
    totalChars: chunks.reduce((sum, chunk) => sum + chunk.content.length, 0),
    analysis,
  }, null, 2);
}
