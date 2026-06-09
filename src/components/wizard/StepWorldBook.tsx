/**
 * Step 3: World Book / Lorebook entries.
 * Full SillyTavern V2 + runtime parameter support (CardForge reference).
 */
import {useState} from 'react';
import {Button} from '../shared/Button';
import {useToast} from '../shared/Toast';
import {AIProgressPanel, type AIProgressStatus} from '../shared/AIProgressPanel';
import {LorebookEntryEditor} from './LorebookEntryEditor';
import {AIGeneratePanel} from './AIGeneratePanel';
import {OrganizePreviewTable} from './OrganizePreviewTable';
import {useAIGenerate} from '../../hooks/useAIGenerate';
import {createEmptyLorebookEntry} from '../../constants/defaults';
import type {LorebookEntry, LorebookPosition, AIOrganizeSuggestion} from '../../constants/defaults';

/** Rough token estimate (~1.3 tokens per char for CJK) */
function estimateTokens(text: string): number {return Math.round((text || '').length * 1.3);}

interface StepWorldBookProps {entries: LorebookEntry[];
 cardName: string;
 characterSummaries: string;
 existingWorldbookContext: string;
 onUpdate: (entries: LorebookEntry[]) => void;
 /** Called when user clicks "Bước tiếp theo" (rendered inline with other action buttons) */
 onNext?: () => void;}

export function StepWorldBook({entries, cardName, characterSummaries, existingWorldbookContext, onUpdate, onNext}: StepWorldBookProps) {const [generating, setGenerating] = useState(false);
 const [topic, setTopic] = useState('');
 const [worldRules, setWorldRules] = useState('');
 const [showAiPanel, setShowAiPanel] = useState(false);
 // Skeleton mode
 const [skeletonMode, setSkeletonMode] = useState(false);
 const [skeletonCount, setSkeletonCount] = useState(6);
 // AI streaming state
 const [aiStatus, setAiStatus] = useState<AIProgressStatus>('idle');
 const [aiText, setAiText] = useState('');
 const [aiError, setAiError] = useState<string | null>(null);
 // AI organize state
 const [organizing, setOrganizing] = useState(false);
 const [organizeResults, setOrganizeResults] = useState<AIOrganizeSuggestion[] | null>(null);
 // AI key generation state
 const [generatingKeys, setGeneratingKeys] = useState(false);
 const [searchQuery, setSearchQuery] = useState('');
 // AI expand state
 const [expandingIndex, setExpandingIndex] = useState<number | null>(null);
 // Collapse state: Set of collapsed entry IDs
 const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
 const {generateLorebookParsed, generateLorebookSkeleton, organizeEntries, generateEntryKeys, expandLorebookEntry} = useAIGenerate();
 const {addToast} = useToast();

 const toggleCollapse = (id: string) => {setCollapsedIds(prev => {const next = new Set(prev);
 if (next.has(id)) next.delete(id); else next.add(id);
 return next;});};

 const collapseAll = () => setCollapsedIds(new Set(entries.map(e => e.id)));
 const expandAll = () => setCollapsedIds(new Set());
 const allCollapsed = entries.length > 0 && entries.every(e => collapsedIds.has(e.id));

 const addEntry = () => {onUpdate([...entries, createEmptyLorebookEntry()]);};

 const removeEntry = (index: number) => {onUpdate(entries.filter((_, i) => i!== index));};

 const updateEntry = (index: number, updates: Partial<LorebookEntry>) => {onUpdate(entries.map((e, i) => (i === index? {...e,...updates}: e)));};

 const handleBatchGenerate = async () => {setGenerating(true);
 setAiError(null);
 const consistencyRules = [worldRules,
 existingWorldbookContext? `sổ thế giới hiện có (phải nhất quán và không xung đột; các mục mới phải điền vào chỗ trống và tránh trùng lặp):\\n ${existingWorldbookContext}`: '',].filter(Boolean).join('\n\n');
 try {if (skeletonMode) {
  // ── Skeleton mode: batch generation in groups of 5 ──
 let allSkeletons: Array<{comment: string; content: string; keys: string[]; strategy: string}> = [];
 let remaining = skeletonCount;
 let batchIndex = 0;

 while (remaining > 0) {const batchSize = Math.min(remaining, 5);
 batchIndex++;
 const existingTitles = allSkeletons.map((s) => s.comment).join('、');
 const skeletons = await generateLorebookSkeleton(cardName, characterSummaries, topic, batchSize, existingTitles, consistencyRules || undefined,);
 allSkeletons = [...allSkeletons,...skeletons];
 remaining -= batchSize;
 if (remaining > 0) await new Promise((r) => setTimeout(r, 300));}

 // Convert skeletons to lorebook entries
 const newEntries = allSkeletons.map((sk) => ({...createEmptyLorebookEntry(),
 name: sk.comment.replace(/^=+|=+$/g, '').trim() || sk.comment,
 comment: sk.comment,
 content: sk.content,
 keys: sk.keys,
 constant: sk.strategy === 'constant',
 position: 'after_char' as LorebookPosition,
 insertion_order: 100,
 priority: 50,
 probability: 100,
 depth: 4,})) as LorebookEntry[];

 onUpdate([...entries,...newEntries]);
 // Auto-collapse newly generated entries
 setCollapsedIds(prev => {const next = new Set(prev);
 newEntries.forEach(e => next.add(e.id));
 return next;});
 addToast('success', `Đã tạo ${newEntries.length} khung, nhấp vào "✨ AI mở rộng" để mở rộng từng cái một`);} else {
  // ── Full mode: original behavior ──
 const result = await generateLorebookParsed(cardName, characterSummaries, topic, consistencyRules || undefined);
 if (Array.isArray(result) && result.length > 0) {const newEntries = result.map((item) => {const base = createEmptyLorebookEntry();
 return {...base,
 name: item.name || '',
 keys: item.keys || [],
 secondary_keys: item.secondary_keys || [],
 content: item.content || '',
 comment: item.comment || item.name || '',
 constant: item.constant?? false,
 selective: item.selective?? false,
 insertion_order: item.insertion_order?? 100,
 position: item.position?? 'after_char',
 priority: item.priority?? 50,
 probability: item.probability?? 100,
 group: item.group || '',
 group_weight: item.group_weight?? 100,
 selectiveLogic: item.selectiveLogic?? 0,
 role: item.role?? 0,
 depth: item.depth?? 4,
 exclude_recursion: item.exclude_recursion?? false,
 prevent_recursion: item.prevent_recursion?? false,
 use_regex: item.use_regex?? false,
 match_whole_words: item.match_whole_words?? true,
 sticky: item.sticky?? 0,
 cooldown: item.cooldown?? 0,
 delay: item.delay?? 0,
 ignore_budget: item.ignore_budget?? false,} as LorebookEntry;});
 onUpdate([...entries,...newEntries]);
 // Auto-collapse newly generated entries
 setCollapsedIds(prev => {const next = new Set(prev);
 newEntries.forEach(e => next.add(e.id));
 return next;});}}} catch (err: unknown) {const msg = err instanceof Error? err.message: "lỗi không xác định";
 setAiError(msg);
 addToast('error', `Thế hệ sổ thế giới thất bại: ${msg}`);} finally {setGenerating(false);
 setShowAiPanel(false);
 setTopic('');
 setWorldRules('');}};

 // ── AI mở rộng single entry ──────────────────────────────────────────
 const handleExpandEntry = async (index: number) => {const entry = entries[index];
 if (!entry) return;

 setExpandingIndex(index);
 try {const result = await expandLorebookEntry({comment: entry.comment || entry.name || '',
 content: entry.content,
 keys: entry.keys,
 strategy: entry.constant? 'constant': 'selective',
 position: entry.insertion_order,},
 existingWorldbookContext? `${characterSummaries}\\n\\nSách thế giới hiện có (phải nhất quán):\\n ${existingWorldbookContext}`: characterSummaries,);
 updateEntry(index, {comment: result.comment,
 content: result.content,
 keys: result.keys,
 constant: result.strategy === 'constant',});
 addToast('success', `「${result.comment || entry.name}"Mở rộng hoàn tất`);} catch (err: unknown) {const msg = err instanceof Error? err.message: "lỗi không xác định";
 addToast('error', `Mở rộng không thành công: ${msg}`);} finally {setExpandingIndex(null);}};

 // ── AI Organize handler ────────────────────────────────────────
 const handleOrganize = async () => {if (entries.length === 0) return;
 setOrganizing(true);
 try {const results = await organizeEntries(entries.map((e, i) => ({index: i,
 name: e.name || e.comment || `lối vào ${i + 1}`,
 content: e.content,
 keys: e.keys,
 position: e.position,
 insertion_order: e.insertion_order,
 depth: e.depth,
 probability: e.probability,
 constant: e.constant,})));
 setOrganizeResults(results.length > 0? results: null);} catch (err: unknown) {const msg = err instanceof Error? err.message: "lỗi không xác định";
 setAiError(msg);
 addToast('error', `Hoàn thiện thông minh không thành công: ${msg}`);} finally {setOrganizing(false);}};

 const applyOrganize = () => {if (!organizeResults) return;
 const updated = [...entries];
 for (const r of organizeResults) {if (r.index >= 0 && r.index < updated.length) {const entry = {...updated[r.index]};
 if (r.position!== undefined) entry.position = r.position as LorebookPosition;
 if (r.insertion_order!== undefined) entry.insertion_order = r.insertion_order;
 if (r.depth!== undefined) entry.depth = r.depth;
 if (r.probability!== undefined) entry.probability = r.probability;
 if (r.constant!== undefined) entry.constant = r.constant;
 updated[r.index] = entry;}}
 onUpdate(updated);
 setOrganizeResults(null);};

 // ── AI Key Generation handler ──────────────────────────────────
 const handleGenerateKeys = async () => {const needsKeys = entries.map((e, i) => ({entry: e, index: i})).filter(({entry}) => entry.content.trim() && entry.keys.length < 2);
 if (needsKeys.length === 0) return;

 setGeneratingKeys(true);
 try {const results = await generateEntryKeys(needsKeys.map(({entry, index}) => ({index,
 name: entry.name || entry.comment || `lối vào ${index + 1}`,
 content: entry.content,
 existingKeys: entry.keys,})));
 if (results.length > 0) {const updated = [...entries];
 for (const r of results) {if (r.index >= 0 && r.index < updated.length && Array.isArray(r.keys)) {const existing = new Set(updated[r.index].keys);
 const merged = [...updated[r.index].keys,...r.keys.filter(k =>!existing.has(k))];
 updated[r.index] = {...updated[r.index], keys: merged};}}
 onUpdate(updated);}} catch (err: unknown) {const msg = err instanceof Error? err.message: "lỗi không xác định";
 setAiError(msg);
 addToast('error', `Việc tạo từ kích hoạt không thành công: ${msg}`);} finally {setGeneratingKeys(false);}};

 const cleanupEmptyEntries = () => {const updated = entries.filter(e => e.content.trim() || e.name.trim() || e.keys.length > 0);
 onUpdate(updated);
 addToast('success', `Đã làm sạch ${entries.length - updated.length} mục trống`);};

 const sortEntries = () => {onUpdate([...entries].sort((a, b) => a.insertion_order - b.insertion_order));
 addToast('success', "Sắp xếp theo thứ tự");};

 const disableEmptyKeyEntries = () => {const updated = entries.map(e => (!e.constant && e.keys.length === 0? {...e, enabled: false}: e));
 const count = entries.filter(e =>!e.constant && e.keys.length === 0 && e.enabled).length;
 onUpdate(updated);
 addToast('success', `Đã tắt ${count} mục không có từ kích hoạt`);};

 const enableAllEntries = () => {onUpdate(entries.map(e => ({...e, enabled: true})));
 addToast('success', "Tất cả các mục được kích hoạt");};

 const q = searchQuery.trim().toLowerCase();
 const visibleEntries = q? entries.map((entry, index) => ({entry, index})).filter(({entry}) => {const text = [entry.name, entry.comment, entry.content, entry.keys.join(' '), entry.secondary_keys.join(' ')].join(' ').toLowerCase();
 return text.includes(q);}): entries.map((entry, index) => ({entry, index}));

 // Stats
 const totalEntries = entries.length;
 const enabledEntries = entries.filter(e => e.enabled).length;
 const constantEntries = entries.filter(e => e.constant && e.enabled).length;
 const totalTokens = entries.reduce((sum, e) => sum + estimateTokens(e.content), 0);

 return (<div>
 {/* Guidance banner */}
 <div className="rounded-lg bg-indigo-900/20 border border-indigo-700/40 px-4 py-3 mb-4">
 <p className="text-xs text-indigo-300 leading-relaxed">
 <span className="font-semibold">sổ thế giới = Thư viện cài đặt chi tiết nhân vật:</span>Mỗi mục đi qua<strong>từ khóa</strong>Đã được kích hoạt, ngữ cảnh AI sẽ tự động được đưa vào khi nội dung liên quan được đề cập trong cuộc trò chuyện.</p>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-0.5 mt-1.5 text-[10px] text-indigo-300/60">
 <p>✦ <strong>Bốn câu hỏi cho mỗi câu</strong>: Xóa AI có sai không? Đó là thông tin hay trang trí? Một danh sách có thể được thay thế? Bạn có thể hiểu nó mà không cần đọc văn bản gốc?</p>
 <p>✦ <strong>Định dạng cơ sở dữ liệu</strong>: Sử dụng các cặp và danh sách khóa-giá trị, không có văn xuôi</p>
 <p>✦ <strong>Không viết thông tin AI đã biết</strong>: Chỉ viết thông tin khác biệt</p>
 <p>✦ <strong>Nghiêm cấm từ khóa một chữ</strong>: Sử dụng tên dài hơn 2 ký tự</p>
 <p>✦ <strong>Thay thế các liên từ bằng dấu hai chấm/dấu phẩy</strong>: Nén lượng thông tin</p>
 <p>✦ <strong>gợi ý đặt hàng</strong>: Bối cảnh=100 · Khả năng=200 · Mối quan hệ=300 · Vị trí=400</p>
 </div>
 </div>

 {/* Stats bar */}
 <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4 text-[11px]">
 <span className="bg-indigo-900/30 text-indigo-300 px-2 py-0.5 rounded">{totalEntries} tổng cộng</span>
 <span className="bg-green-900/30 text-green-300 px-2 py-0.5 rounded">{enabledEntries} đã bật</span>
 <span className="bg-amber-900/30 text-amber-300 px-2 py-0.5 rounded">{constantEntries} Vĩnh viễn</span>
 <span className="bg-slate-800 text-slate-400 px-2 py-0.5 rounded">~{totalTokens} Token</span>
 </div>

 {/* Batch tools bar */}
 {entries.length > 0 && (<div className="space-y-3 mb-4">
 <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg bg-slate-900/40 border border-slate-700/50">
 <input
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 placeholder="Tìm kiếm tên, nội dung, từ khóa..."
 className="min-w-[220px] flex-1 rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
 />
 <Button variant="ghost" size="sm" onClick={sortEntries}>Sắp xếp theo thứ tự</Button>
 <Button variant="ghost" size="sm" onClick={enableAllEntries}>Kích hoạt tất cả</Button>
 <Button variant="ghost" size="sm" onClick={disableEmptyKeyEntries}>Tắt các từ không kích hoạt</Button>
 <Button variant="ghost" size="sm" onClick={cleanupEmptyEntries}>Dọn dẹp các mục trống</Button>
 <Button variant="ghost" size="sm" onClick={allCollapsed? expandAll: collapseAll}>
 {allCollapsed? "📖 Mở rộng tất cả": "📕 Thu gọn tất cả"}
 </Button>
 </div>
 {searchQuery && (<p className="text-[11px] text-slate-500">Kết quả tìm kiếm:{visibleEntries.length} / {entries.length}</p>)}
 </div>)}

 {/* AI Tools bar */}
 {entries.length > 0 && (<div className="flex flex-wrap items-center gap-2 mb-4 p-3 rounded-lg bg-amber-900/10 border border-amber-700/30">
 <span className="text-xs text-amber-300 font-medium shrink-0">🧹 Công cụ AI:</span>
 <Button
 variant="secondary"
 size="sm"
 onClick={handleOrganize}
 disabled={organizing || generatingKeys}
 >
 {organizing? "Đang phân tích...": "⚡ Tổ chức thông minh"}
 </Button>
 <Button
 variant="secondary"
 size="sm"
 onClick={handleGenerateKeys}
 disabled={generatingKeys || organizing}
 >
 {generatingKeys? "Đang tạo...": "🗝️ Bổ sung các từ kích hoạt"}
 </Button>
 <span className="text-[10px] text-slate-500 ml-auto">Sắp xếp và tối ưu hóa thông minh vị trí/độ sâu/thứ tự/thăm dò · Các từ kích hoạt bổ sung để tạo khóa cho các mục nhập thiếu từ khóa</span>
 </div>)}

 {/* Organize preview table */}
 {organizeResults && organizeResults.length > 0 && (<OrganizePreviewTable
 entries={entries}
 suggestions={organizeResults}
 onApply={applyOrganize}
 onDismiss={() => setOrganizeResults(null)}
 />)}

 {/* Header */}
 <div className="flex items-center justify-between mb-6">
 <div>
 <h2 className="text-xl font-bold text-white">sổ thế giới</h2>
 <p className="text-sm text-slate-400 mt-1">Thêm các mục để làm phong phú thêm thiết lập nhân vật. Tổng cộng {entries.length} mục.</p>
 </div>
 <div className="flex gap-2">
 <Button variant="secondary" onClick={addEntry}>+ thêm mục</Button>
 <button
 onClick={() => setShowAiPanel(!showAiPanel)}
 disabled={generating}
 className="inline-flex items-center justify-center gap-2 rounded-lg font-medium px-4 py-2 text-sm
 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500
 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40
 transition-all duration-200 hover:scale-105 active:scale-95
 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer"
 >
 {showAiPanel? "đóng": "✨AI được tạo ra"}
 </button>
 </div>
 </div>

 {/* AI Generate Panel */}
 {showAiPanel && (<AIGeneratePanel
 topic={topic}
 worldRules={worldRules}
 generating={generating}
 onTopicChange={setTopic}
 onWorldRulesChange={setWorldRules}
 skeletonMode={skeletonMode}
 skeletonCount={skeletonCount}
 onSkeletonModeChange={setSkeletonMode}
 onSkeletonCountChange={setSkeletonCount}
 onGenerate={handleBatchGenerate}
 onCancel={() => {setShowAiPanel(false); setTopic(''); setWorldRules('');}}
 />)}

 {entries.length === 0 &&!showAiPanel && (<div className="text-center py-12 text-slate-500 border border-dashed border-slate-700 rounded-xl">
 <p>Chưa có mục Sách Thế giới nào.</p>
 <p className="text-sm mt-1">Thêm các mục theo cách thủ công hoặc sử dụng AI để tạo chúng theo đợt.</p>
 </div>)}

 <div className="space-y-3">
 {visibleEntries.map(({entry, index}) => {const isSkeleton = (entry.content || '').length < 120;
 return (<div key={entry.id} className="relative">
 <LorebookEntryEditor
 entry={entry}
 index={index}
 onUpdate={updateEntry}
 onRemove={removeEntry}
 collapsed={collapsedIds.has(entry.id)}
 onToggleCollapse={() => toggleCollapse(entry.id)}
 />
 {/* AI mở rộng button — shows on skeletons */}
 {isSkeleton && (<div className="absolute top-3 right-16 z-10">
 <Button
 variant="secondary"
 size="sm"
 onClick={() => handleExpandEntry(index)}
 disabled={expandingIndex === index}
 className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs"
 >
 {expandingIndex === index? "⏳ Mở rộng...": "🦴→📖 AI mở rộng"}
 </Button>
 </div>)}
 </div>);})}
 </div>

 {/* Fixed bottom action buttons */}
 <div className="fixed bottom-4 right-4 z-40 flex gap-2">
 <Button
 onClick={addEntry}
 variant="secondary"
 className="shadow-lg shadow-slate-900/50 hover:scale-105 transition-transform"
 >
 <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
 <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
 </svg>Thêm mục</Button>
 <Button
 onClick={() => setShowAiPanel(true)}
 disabled={generating}
 className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
 >
 <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
 <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
 </svg>AI được tạo ra</Button>
 {onNext && (<Button
 onClick={onNext}
 className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-200 hover:scale-105 active:scale-95"
 >Bước tiếp theo<svg className="w-4 h-4 ml-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
 <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
 </svg>
 </Button>)}
 </div>
 </div>);}
