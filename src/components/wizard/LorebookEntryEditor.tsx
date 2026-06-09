/**
 * LorebookEntryEditor - Single lorebook entry editor panel.
 * Extracted from StepWorldBook for better component granularity.
 *
 * Entry layout (3 sections):
 * 1. Core: name, keys, content, enabled, strategy
 * 2. Trigger & Insertion: position, order, priority, probability, depth
 * 3. Advanced: selective+logic, group+weight, recursion, timed effects, options
 */
import {TextInput} from '../shared/TextInput';
import {TextArea} from '../shared/TextArea';
import {TagInput} from '../shared/TagInput';
import {Button} from '../shared/Button';
import {LOREBOOK_POSITION_OPTIONS,
 SELECTIVE_LOGIC_OPTIONS,
 LOREBOOK_ROLE_OPTIONS,} from '../../constants/defaults';
import type {LorebookEntry, LorebookPosition} from '../../constants/defaults';

/** Determine trigger strategy badge */
function getStrategyBadge(entry: LorebookEntry) {if (entry.constant) return {icon: '🔵', label: "Vĩnh viễn"};
 if (entry.keys.length === 0) return {icon: '🔗', label: "Nhúng"};
 return {icon: '🟢', label: "cò súng"};}

/** Rough token estimate (~1.3 tokens per char for CJK) */
function estimateTokens(text: string): number {return Math.round((text || '').length * 1.3);}

interface LorebookEntryEditorProps {entry: LorebookEntry;
 index: number;
 onUpdate: (index: number, updates: Partial<LorebookEntry>) => void;
 onRemove: (index: number) => void;
 /** Whether the entry body is collapsed (only header visible) */
 collapsed?: boolean;
 /** Toggle collapse state */
 onToggleCollapse?: () => void;}

export function LorebookEntryEditor({entry, index, onUpdate, onRemove, collapsed, onToggleCollapse}: LorebookEntryEditorProps) {const badge = getStrategyBadge(entry);
 const fieldCls = 'w-full rounded border border-slate-600 bg-slate-800 px-2 py-1 text-sm text-slate-200';
 const labelCls = 'text-xs text-slate-400';
 const hintCls = 'text-[10px] text-slate-500 mt-0.5';

 return (<div className={`rounded-xl border bg-slate-800/50 overflow-hidden ${!entry.enabled? 'border-slate-700/50 opacity-50':
 entry.constant? 'border-amber-700/60': 'border-slate-700'}`}>
 {/* ── Header (always visible, clickable to toggle) ────────────── */}
 <div
 className={`flex items-center justify-between gap-2 px-4 py-3 ${collapsed!== undefined? 'cursor-pointer hover:bg-slate-700/30': ''}`}
 onClick={collapsed!== undefined? onToggleCollapse: undefined}
 >
 <div className="flex items-center gap-2 min-w-0">
 {collapsed!== undefined && (<span className="text-xs text-slate-500 shrink-0 transition-transform duration-200" style={{transform: collapsed? 'rotate(-90deg)': 'rotate(0deg)'}}>▼</span>)}
 <span className="text-base">{badge.icon}</span>
 <h3 className="text-sm font-semibold text-white truncate">
 {entry.name || `lối vào ${index + 1}`}
 </h3>
 <span className="text-[10px] text-slate-500 bg-slate-700/50 px-1.5 py-0.5 rounded shrink-0">
 {badge.label}
 </span>
 <span className="text-[10px] text-slate-600 font-mono shrink-0">
 {entry.position}
 </span>
 {collapsed && entry.keys.length > 0 && (<span className="text-[10px] text-slate-500 truncate max-w-[120px] shrink-0">
 {entry.keys.slice(0, 3).join(', ')}{entry.keys.length > 3? '...': ''}
 </span>)}
 {collapsed && entry.content && (<span className="text-[10px] text-slate-600 shrink-0">
 {entry.content.length} ký tự</span>)}
 </div>
 <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
 <label className="flex items-center gap-1 text-xs text-slate-400">
 <input type="checkbox" checked={entry.enabled}
 onChange={(e) => onUpdate(index, {enabled: e.target.checked})}
 className="rounded border-slate-600 bg-slate-800 text-indigo-600" />đã bật</label>
 <Button variant="danger" size="sm" onClick={() => onRemove(index)}>×</Button>
 </div>
 </div>

 {/* ── Body (hidden when collapsed) ────────────────────────────── */}
 {!collapsed && (<div className="px-4 pb-4 space-y-3 border-t border-slate-700/30 pt-3">

 {/* ── Section 1:tiêu đề+Chiến lược kích hoạt+từ khóa+nội dung─────── */}
 <div className="grid grid-cols-[1fr,auto] gap-3">
 <TextInput
 label="Tiêu đề (bản ghi nhớ)"
 value={entry.name}
 onChange={(e) => onUpdate(index, {name: e.target.value})}
 placeholder="Tiêu đề bài viết, chỉ hiển thị với bạn"
 />
 <div className="flex flex-col gap-1 pt-5">
 <label className="flex items-center gap-1 text-xs text-slate-300">
 <input type="checkbox" checked={entry.constant}
 onChange={(e) => onUpdate(index, {constant: e.target.checked})}
 className="rounded border-slate-600 bg-slate-800 text-indigo-600" />🔵Vĩnh viễn</label>
 </div>
 </div>

 {!entry.constant && (<div className="grid grid-cols-[1fr,auto] gap-3">
 <TagInput
 label="Từ khóa kích hoạt"
 tags={entry.keys}
 onChange={(keys) => onUpdate(index, {keys})}
 placeholder="Từ khóa kích hoạt mục này (3-6)..."
 />
 <div className="flex flex-col gap-1 pt-5 text-[10px] text-slate-500">
 <label className="flex items-center gap-1">
 <input type="checkbox" checked={entry.use_regex}
 onChange={(e) => onUpdate(index, {use_regex: e.target.checked})}
 className="rounded border-slate-600 bg-slate-800 text-indigo-600" />thường xuyên</label>
 </div>
 </div>)}

 <TextArea
 label="nội dung"
 value={entry.content}
 onChange={(e) => onUpdate(index, {content: e.target.value})}
 placeholder="Văn bản được truyền tải bằng AI. Ngôi thứ ba, thì hiện tại, 3-5 câu. Từ khóa và tiêu đề không được gửi đến AI."
 rows={3}
 />
 <p className="text-[10px] text-slate-500 -mt-2">
 {(entry.content || '').length} Nhân vật · ~{estimateTokens(entry.content)} Token
 </p>

 {/* ── Section 2:Kích hoạt và chèn tham số─────────────────────── */}
 <div className="border-t border-slate-700/50 pt-3">
 <p className="text-[11px] font-medium text-slate-400 mb-2">Kích hoạt và chèn tham số</p>
 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">

 {/* Position */}
 <div>
 <label className={labelCls}>Vị trí chèn (vị trí)</label>
 <select value={entry.position}
 onChange={(e) => onUpdate(index, {position: e.target.value as LorebookPosition})}
 className={fieldCls}>
 {LOREBOOK_POSITION_OPTIONS.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
 </select>
 </div>

 {/* Insertion order */}
 <div>
 <label className={labelCls}>Đặt hàng (insertion_order)</label>
 <input type="number" value={entry.insertion_order}
 onChange={(e) => onUpdate(index, {insertion_order: parseInt(e.target.value) || 0})}
 className={fieldCls} />
 <p className={hintCls}>Càng lớn thì càng gần đến đích.</p>
 </div>

 {/* Priority */}
 <div>
 <label className={labelCls}>sự ưu tiên</label>
 <input type="number" value={entry.priority}
 onChange={(e) => onUpdate(index, {priority: parseInt(e.target.value) || 0})}
 className={fieldCls} />
 <p className={hintCls}>Khi không có đủ Token, mức độ ưu tiên thấp hơn sẽ bị loại bỏ trước tiên.</p>
 </div>

 {/* Probability */}
 <div>
 <label className={labelCls}>Xác suất kích hoạt (xác suất)</label>
 <div className="flex items-center gap-1.5">
 <input type="range" min={0} max={100} step={5} value={entry.probability}
 onChange={(e) => onUpdate(index, {probability: parseInt(e.target.value)})}
 className="flex-1 accent-indigo-600" />
 <span className="text-xs text-indigo-400 w-8 text-right">{entry.probability}%</span>
 </div>
 </div>

 {/* Depth */}
 <div>
 <label className={labelCls}>Độ sâu quét (độ sâu)</label>
 <input type="number" min={0} value={entry.depth}
 onChange={(e) => onUpdate(index, {depth: parseInt(e.target.value) || 0})}
 className={fieldCls} />
 <p className={hintCls}>Quét N tin nhắn gần đây để tìm từ khóa phù hợp</p>
 </div>

 {/* Role */}
 <div>
 <label className={labelCls}>vai trò tin nhắn</label>
 <select value={entry.role}
 onChange={(e) => onUpdate(index, {role: parseInt(e.target.value) || 0})}
 className={fieldCls}>
 {LOREBOOK_ROLE_OPTIONS.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
 </select>
 </div>
 </div>
 </div>

 {/* ── Section 3:Tùy chọn nâng cao─────────────────────────────── */}
 <details className="text-sm">
 <summary className="text-slate-500 cursor-pointer hover:text-slate-300">Tùy chọn nâng cao (chọn chế độ, nhóm, hiệu ứng thời gian, đệ quy, ngân sách)</summary>
 <div className="mt-2 space-y-3">

 {/* Selective + secondary keys */}
 <div className="grid grid-cols-[auto,1fr] gap-3 items-start">
 <label className="flex items-center gap-1.5 text-xs text-slate-400 pt-2">
 <input type="checkbox" checked={entry.selective}
 onChange={(e) => onUpdate(index, {selective: e.target.checked})}
 className="rounded border-slate-600 bg-slate-800 text-indigo-600" />Bật bộ lọc từ</label>
 {entry.selective && (<div className="space-y-2">
 <select value={entry.selectiveLogic}
 onChange={(e) => onUpdate(index, {selectiveLogic: parseInt(e.target.value) || 0})}
 className={fieldCls}>
 {SELECTIVE_LOGIC_OPTIONS.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label} — {opt.desc}</option>))}
 </select>
 <TagInput
 label="Lọc từ khóa (secondary_keys)"
 tags={entry.secondary_keys}
 onChange={(secondary_keys) => onUpdate(index, {secondary_keys})}
 placeholder="Yêu cầu các từ lọc phù hợp..."
 />
 </div>)}
 </div>

 {/* Group + weight */}
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 <div>
 <label className={labelCls}>Chứa nhóm</label>
 <input type="text" value={entry.group || ''}
 onChange={(e) => onUpdate(index, {group: e.target.value})}
 className={fieldCls}
 placeholder="Các mục loại trừ lẫn nhau có chung một tên nhóm..." />
 <p className={hintCls}>Chỉ một mục trong cùng một nhóm kích hoạt</p>
 </div>
 <div>
 <label className={labelCls}>Trọng lượng nhóm (group_weight)</label>
 <input type="number" value={entry.group_weight}
 onChange={(e) => onUpdate(index, {group_weight: parseInt(e.target.value) || 100})}
 className={fieldCls} />
 <p className={hintCls}>Càng cao thì khả năng được chọn càng cao.</p>
 </div>
 </div>

 {/* Timed effects: sticky, cooldown, delay */}
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
 <div>
 <label className={labelCls}>dính</label>
 <input type="number" min={0} value={entry.sticky}
 onChange={(e) => onUpdate(index, {sticky: parseInt(e.target.value) || 0})}
 className={fieldCls} />
 <p className={hintCls}>Tiếp tục cho N tin nhắn sau khi kích hoạt</p>
 </div>
 <div>
 <label className={labelCls}>hạ nhiệt</label>
 <input type="number" min={0} value={entry.cooldown}
 onChange={(e) => onUpdate(index, {cooldown: parseInt(e.target.value) || 0})}
 className={fieldCls} />
 <p className={hintCls}>Làm mát N tin nhắn sau khi thất bại</p>
 </div>
 <div>
 <label className={labelCls}>trì hoãn</label>
 <input type="number" min={0} value={entry.delay}
 onChange={(e) => onUpdate(index, {delay: parseInt(e.target.value) || 0})}
 className={fieldCls} />
 <p className={hintCls}>Nó chỉ có thể được kích hoạt sau ít nhất N tin nhắn.</p>
 </div>
 </div>

 {/* Recursion + options toggles */}
 <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-400">
 <label className="flex items-center gap-1.5">
 <input type="checkbox" checked={entry.exclude_recursion}
 onChange={(e) => onUpdate(index, {exclude_recursion: e.target.checked})}
 className="rounded border-slate-600 bg-slate-800 text-indigo-600" />loại trừ đệ quy</label>
 <label className="flex items-center gap-1.5">
 <input type="checkbox" checked={entry.prevent_recursion}
 onChange={(e) => onUpdate(index, {prevent_recursion: e.target.checked})}
 className="rounded border-slate-600 bg-slate-800 text-indigo-600" />ngăn ngừa đệ quy</label>
 <label className="flex items-center gap-1.5">
 <input type="checkbox" checked={entry.match_whole_words}
 onChange={(e) => onUpdate(index, {match_whole_words: e.target.checked})}
 className="rounded border-slate-600 bg-slate-800 text-indigo-600" />khớp toàn bộ từ</label>
 <label className="flex items-center gap-1.5">
 <input type="checkbox" checked={entry.case_sensitive}
 onChange={(e) => onUpdate(index, {case_sensitive: e.target.checked})}
 className="rounded border-slate-600 bg-slate-800 text-indigo-600" />Phân biệt chữ hoa chữ thường</label>
 <label className="flex items-center gap-1.5">
 <input type="checkbox" checked={entry.ignore_budget}
 onChange={(e) => onUpdate(index, {ignore_budget: e.target.checked})}
 className="rounded border-slate-600 bg-slate-800 text-indigo-600" />bỏ qua ngân sách</label>
 </div>

 {/* Comment */}
 <div>
 <label className={labelCls}>bình luận</label>
 <input type="text" value={entry.comment || ''}
 onChange={(e) => onUpdate(index, {comment: e.target.value})}
 className={fieldCls}
 placeholder="Ghi chú chỉ hiển thị với bạn..." />
 </div>
 </div>
 </details>
 </div>)}
 </div>);}