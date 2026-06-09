/**
 * Step 6: Beautification / MVU - optional step for adding MVU state tracking
 * and frontend beautification to the character card.
 *
 * Features:
 * - AI-powered MVU variable suggestion based on card content
 * - Manual variable editor
 * - Live preview of generated MVU five-piece set
 * - Status bar configuration (safe_macro / dynamic_js)
 * - Story view beautification
 * - Asset download for use with SillyTavern
 *
 * Based on world-book-mcp v5 MVU methodology:
 * schema.js → initvar.yaml → update-rules.yaml → variable-list.md → output-format.md
 */
import {useState, useCallback, useMemo} from 'react';
import {generateId} from '../../constants/defaults';
import type {MvuConfig, MvuVariable, MvuVariableKind} from '../../constants/defaults';
import {useAIGenerate} from '../../hooks/useAIGenerate';
import {Button} from '../shared/Button';
import {generateAllMvuAssets,
 downloadMvuAssets,
 packageMvuAssets,} from '../../services/mvu-generator';

interface StepBeautifyProps {mvu: MvuConfig;
 cardName: string;
 characterSummaries: string;
 worldbookSummary: string;
 firstMessageExcerpt: string;
 onChange: (mvu: MvuConfig) => void;}

type PreviewTab = 'schema' | 'initvar' | 'update-rules' | 'variable-list' | 'output-format' | 'statusbar' | 'story';

const KIND_OPTIONS: {value: MvuVariableKind; label: string}[] = [{value: 'number', label: "con số"},
 {value: 'string', label: "chữ"},
 {value: 'boolean', label: "Boolean"},
 {value: 'enum', label: "liệt kê"},
 {value: 'record', label: "Ghi"},
 {value: 'object', label: "sự vật"},];

export function StepBeautify({mvu,
 cardName,
 characterSummaries,
 worldbookSummary,
 firstMessageExcerpt,
 onChange,}: StepBeautifyProps) {const [aiLoading, setAiLoading] = useState(false);
 const [aiError, setAiError] = useState<string | null>(null);
 const [previewTab, setPreviewTab] = useState<PreviewTab>('schema');
 const [showPreview, setShowPreview] = useState(false);
 const [editingVarId, setEditingVarId] = useState<string | null>(null);
 const {generateMvuVariables} = useAIGenerate();

 // ── Toggle MVU on/off ───────────────────────────────────────────────────

 const toggleMvu = useCallback(() => {onChange({...mvu, enabled:!mvu.enabled});}, [mvu, onChange]);

 // ── AI variable suggestion ──────────────────────────────────────────────

 const handleAiSuggest = useCallback(async () => {if (!cardName?.trim()) {setAiError("Vui lòng điền tên thẻ trước");
 return;}
 setAiLoading(true);
 setAiError(null);
 try {const suggestions = await generateMvuVariables(cardName,
 characterSummaries,
 worldbookSummary,
 firstMessageExcerpt,);

 if (suggestions.length === 0) {setAiError("AI không tạo được đề xuất biến, vui lòng thêm chúng theo cách thủ công");
 return;}

 // Merge with existing variables (avoid duplicates by path)
 const existingPaths = new Set(mvu.variables.map(v => v.path.join('.')));
 const newVars: MvuVariable[] = suggestions.filter(s => {const p = Array.isArray(s.path)? s.path.join('.'): '';
 return p &&!existingPaths.has(p);}).map(s => ({id: generateId(),
 path: Array.isArray(s.path)? s.path: [],
 kind: s.kind || 'string',
 defaultValue: s.defaultValue?? (s.kind === 'number'? 0: s.kind === 'boolean'? false: ''),
 description: s.description || '',
 enumValues: s.enumValues,
 min: s.min,
 max: s.max,
 hidden: s.hidden || false,
 readonly: s.readonly || false,}));

 if (newVars.length > 0) {onChange({...mvu,
 enabled: true,
 variables: [...mvu.variables,...newVars],});}} catch (err) {setAiError(err instanceof Error? err.message: "Thế hệ AI thất bại");} finally {setAiLoading(false);}}, [cardName, characterSummaries, worldbookSummary, firstMessageExcerpt, mvu, onChange, generateMvuVariables]);

 // ── Variable CRUD ──────────────────────────────────────────────────────

 const addVariable = useCallback(() => {const newVar: MvuVariable = {id: generateId(),
 path: ["biến mới"],
 kind: 'number',
 defaultValue: 0,
 description: '',};
 onChange({...mvu, variables: [...mvu.variables, newVar]});
 setEditingVarId(newVar.id);}, [mvu, onChange]);

 const removeVariable = useCallback((id: string) => {onChange({...mvu, variables: mvu.variables.filter(v => v.id!== id)});
 if (editingVarId === id) setEditingVarId(null);}, [mvu, onChange, editingVarId]);

 const updateVariable = useCallback((id: string, updates: Partial<MvuVariable>) => {onChange({...mvu,
 variables: mvu.variables.map(v => v.id === id? {...v,...updates}: v),});}, [mvu, onChange]);

 // ── Generate preview ───────────────────────────────────────────────────

 const generatedConfig = useMemo(() => {if (!mvu.enabled || mvu.variables.length === 0) return null;
 return generateAllMvuAssets(mvu);}, [mvu]);

 const handleGeneratePreview = useCallback(() => {setShowPreview(true);}, []);

 const handleDownload = useCallback(() => {if (generatedConfig) {downloadMvuAssets(generatedConfig);}}, [generatedConfig]);

 // ── Status bar toggle ──────────────────────────────────────────────────

 const toggleStatusBar = useCallback(() => {onChange({...mvu, statusBarEnabled:!mvu.statusBarEnabled});}, [mvu, onChange]);

 const toggleStoryBeautify = useCallback(() => {onChange({...mvu, storyBeautifyEnabled:!mvu.storyBeautifyEnabled});}, [mvu, onChange]);

 // ── Render ─────────────────────────────────────────────────────────────

 return (<div>
 <h2 className="text-xl font-bold text-white mb-2">Làm đẹp/Theo dõi trạng thái MVU</h2>
 <p className="text-sm text-slate-400 mb-6">Bước tùy chọn. Việc kích hoạt MVU có thể thêm hệ thống theo dõi trạng thái (mức độ ưa thích, vị trí, thời gian, v.v.) vào card nhân vật và tạo ra nội dung làm đẹp giao diện người dùng.
 dựa trên<a href="https://github.com/QiHuang02/world-book-mcp" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300">world-book-mcp v5</a>Phương pháp luận.</p>

 {/* MVU Toggle */}
 <div className="flex items-center gap-3 mb-6">
 <label className="relative inline-flex items-center cursor-pointer">
 <input
 type="checkbox"
 checked={mvu.enabled}
 onChange={toggleMvu}
 className="sr-only peer"
 />
 <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600" />
 </label>
 <span className="text-sm text-white">Bật theo dõi trạng thái MVU</span>
 </div>

 {mvu.enabled && (<div className="space-y-6">
 {/* AI Suggest button */}
 <div className="flex items-center gap-3">
 <Button
 variant="secondary"
 onClick={handleAiSuggest}
 disabled={aiLoading}
 size="sm"
 >
 {aiLoading? "Đang tiến hành phân tích AI...": "Các biến được đề xuất AI"}
 </Button>
 <span className="text-xs text-slate-500">Tự động đề xuất các biến theo dõi trạng thái dựa trên nội dung thẻ</span>
 </div>
 {aiError && (<p className="text-xs text-red-400">{aiError}</p>)}

 {/* Variable list */}
 <div>
 <div className="flex items-center justify-between mb-3">
 <h3 className="text-sm font-semibold text-indigo-300">danh sách biến ({mvu.variables.length})
 </h3>
 <Button variant="ghost" size="sm" onClick={addVariable}>+ thêm biến</Button>
 </div>

 {mvu.variables.length === 0? (<p className="text-sm text-slate-500 italic py-4 text-center border border-dashed border-slate-700 rounded-lg">Chưa có biến nào. Nhấp vào nút bên trên để thêm thủ công hoặc sử dụng đề xuất AI.</p>): (<div className="space-y-2">
 {mvu.variables.map(v => (<VariableRow
 key={v.id}
 variable={v}
 editing={editingVarId === v.id}
 onEdit={() => setEditingVarId(editingVarId === v.id? null: v.id)}
 onUpdate={(updates) => updateVariable(v.id, updates)}
 onRemove={() => removeVariable(v.id)}
 />))}
 </div>)}
 </div>

 {/* Frontend beautification options */}
 <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-5 space-y-4">
 <h3 className="text-sm font-semibold text-indigo-300">Tùy chọn làm đẹp mặt trước</h3>

 {/* Status bar */}
 <div className="flex flex-wrap items-center gap-3">
 <label className="relative inline-flex items-center cursor-pointer">
 <input
 type="checkbox"
 checked={mvu.statusBarEnabled}
 onChange={toggleStatusBar}
 className="sr-only peer"
 />
 <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600" />
 </label>
 <span className="text-sm text-white">Thanh trạng thái HTML</span>
 {mvu.statusBarEnabled && (<select
 value={mvu.statusBarMode}
 onChange={(e) => onChange({...mvu, statusBarMode: e.target.value as 'safe_macro' | 'dynamic_js'})}
 className="ml-2 text-xs bg-slate-700 text-slate-300 border border-slate-600 rounded px-2 py-1"
 >
 <option value="safe_macro">safe_macro (được khuyến nghị)</option>
 <option value="dynamic_js">Dynamic_js (nâng cao)</option>
 </select>)}
 </div>

 {/* Story beautification */}
 <div className="flex flex-wrap items-center gap-3">
 <label className="relative inline-flex items-center cursor-pointer">
 <input
 type="checkbox"
 checked={mvu.storyBeautifyEnabled}
 onChange={toggleStoryBeautify}
 className="sr-only peer"
 />
 <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600" />
 </label>
 <span className="text-sm text-white">Thẻ làm đẹp văn bản</span>
 {mvu.storyBeautifyEnabled && (<input
 type="text"
 value={mvu.storyBeautifyTag}
 onChange={(e) => onChange({...mvu, storyBeautifyTag: e.target.value})}
 placeholder="story_view"
 className="ml-0 sm:ml-2 text-xs bg-slate-700 text-slate-300 border border-slate-600 rounded px-2 py-1 w-full sm:w-32"
 />)}
 </div>
 </div>

 {/* Generate & Download */}
 {mvu.variables.length > 0 && (<div className="flex items-center gap-3">
 <Button onClick={handleGeneratePreview} size="sm">Tạo bản xem trước</Button>
 <Button variant="secondary" onClick={handleDownload} size="sm">Tải xuống tệp nội dung MVU</Button>
 <span className="text-xs text-slate-500">
 {packageMvuAssets(generatedConfig || mvu).length} tập tin</span>
 </div>)}

 {/* Asset preview */}
 {showPreview && generatedConfig && (<div className="rounded-xl border border-slate-700 bg-slate-900/80 overflow-hidden">
 {/* Tabs */}
 <div className="flex border-b border-slate-700 overflow-x-auto">
 {([['schema', 'schema.js'],
 ['initvar', 'initvar.yaml'],
 ['update-rules', 'update-rules.yaml'],
 ['variable-list', 'variable-list.md'],
 ['output-format', 'output-format.md'],...(mvu.statusBarEnabled? [['statusbar', "thanh trạng thái"]] as const: []),...(mvu.storyBeautifyEnabled? [['story', "Làm đẹp văn bản"]] as const: []),] as Array<[PreviewTab, string]>).map(([tab, label]) => (<button
 key={tab}
 onClick={() => setPreviewTab(tab)}
 className={`px-3 py-2 text-xs whitespace-nowrap transition-colors ${previewTab === tab? 'text-indigo-300 border-b-2 border-indigo-500 bg-slate-800/50': 'text-slate-500 hover:text-slate-300'}`}
 >
 {label}
 </button>))}
 </div>

 {/* Preview content */}
 <div className="p-4 max-h-[400px] overflow-y-auto">
 <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap">
 {getPreviewContent(generatedConfig, previewTab)}
 </pre>
 </div>
 </div>)}
 </div>)}
 </div>);}

// ── Variable row component ────────────────────────────────────────────────

function VariableRow({variable,
 editing,
 onEdit,
 onUpdate,
 onRemove,}: {variable: MvuVariable;
 editing: boolean;
 onEdit: () => void;
 onUpdate: (updates: Partial<MvuVariable>) => void;
 onRemove: () => void;}) {const dotPath = variable.path.join('.');
 const kindLabel = KIND_OPTIONS.find(k => k.value === variable.kind)?.label?? variable.kind;

 if (!editing) {return (<div
 className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-700 bg-slate-800/50 cursor-pointer hover:bg-slate-800 transition-colors"
 onClick={onEdit}
 >
 <div className="flex-1 min-w-0">
 <span className="text-sm text-white font-mono">{dotPath}</span>
 <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-400">
 {kindLabel}
 </span>
 {variable.hidden && (<span className="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-500">$ ẩn</span>)}
 {variable.readonly && (<span className="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-500">_ chỉ đọc</span>)}
 </div>
 <span className="text-xs text-slate-500 truncate max-w-[150px]">
 {variable.description || String(variable.defaultValue)}
 </span>
 <button
 onClick={(e) => {e.stopPropagation(); onRemove();}}
 className="text-xs text-red-400 hover:text-red-300 ml-2"
 >
 x
 </button>
 </div>);}

 return (<div className="rounded-lg border border-indigo-600/50 bg-slate-800/80 p-4 space-y-3">
 {/* Path */}
 <div className="flex items-center gap-2">
 <label className="text-xs text-slate-400 w-16 shrink-0">con đường</label>
 <input
 type="text"
 value={variable.path.join('.')}
 onChange={(e) => {const newPath = e.target.value.split('.').map(s => s.trim()).filter(Boolean);
 if (newPath.length > 0) onUpdate({path: newPath});}}
 className="flex-1 text-sm bg-slate-700 text-white border border-slate-600 rounded px-2 py-1 font-mono"
 placeholder="Chủ đề. Tên biến"
 />
 </div>

 {/* Kind & default value */}
 <div className="flex items-center gap-2">
 <label className="text-xs text-slate-400 w-16 shrink-0">kiểu</label>
 <select
 value={variable.kind}
 onChange={(e) => {const kind = e.target.value as MvuVariableKind;
 const defaultValue = kind === 'number'? 0: kind === 'boolean'? false: kind === 'enum'? '': '';
 onUpdate({kind, defaultValue});}}
 className="text-sm bg-slate-700 text-white border border-slate-600 rounded px-2 py-1"
 >
 {KIND_OPTIONS.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
 </select>

 <label className="text-xs text-slate-400 ml-2">giá trị mặc định</label>
 {variable.kind === 'boolean'? (<select
 value={String(variable.defaultValue)}
 onChange={(e) => onUpdate({defaultValue: e.target.value === 'true'})}
 className="text-sm bg-slate-700 text-white border border-slate-600 rounded px-2 py-1"
 >
 <option value="false">false</option>
 <option value="true">true</option>
 </select>): variable.kind === 'enum'? (<input
 type="text"
 value={String(variable.defaultValue?? '')}
 onChange={(e) => onUpdate({defaultValue: e.target.value})}
 className="flex-1 text-sm bg-slate-700 text-white border border-slate-600 rounded px-2 py-1"
 placeholder="Giá trị enum mặc định"
 />): (<input
 type={variable.kind === 'number'? 'number': 'text'}
 value={String(variable.defaultValue?? '')}
 onChange={(e) => {const val = variable.kind === 'number'? Number(e.target.value): e.target.value;
 onUpdate({defaultValue: val});}}
 className="flex-1 text-sm bg-slate-700 text-white border border-slate-600 rounded px-2 py-1"
 />)}
 </div>

 {/* Enum values (only for enum type) */}
 {variable.kind === 'enum' && (<div className="flex items-center gap-2">
 <label className="text-xs text-slate-400 w-16 shrink-0">giá trị liệt kê</label>
 <input
 type="text"
 value={(variable.enumValues?? []).join(', ')}
 onChange={(e) => {onUpdate({enumValues: e.target.value.split(',').map(s => s.trim()).filter(Boolean)});}}
 className="flex-1 text-sm bg-slate-700 text-white border border-slate-600 rounded px-2 py-1"
 placeholder="giá trị 1, giá trị 2, giá trị 3"
 />
 </div>)}

 {/* Number range */}
 {variable.kind === 'number' && (<div className="flex items-center gap-2">
 <label className="text-xs text-slate-400 w-16 shrink-0">phạm vi</label>
 <input
 type="number"
 value={variable.min?? ''}
 onChange={(e) => onUpdate({min: e.target.value? Number(e.target.value): undefined})}
 className="w-20 text-sm bg-slate-700 text-white border border-slate-600 rounded px-2 py-1"
 placeholder="nhỏ nhất"
 />
 <span className="text-slate-500">~</span>
 <input
 type="number"
 value={variable.max?? ''}
 onChange={(e) => onUpdate({max: e.target.value? Number(e.target.value): undefined})}
 className="w-20 text-sm bg-slate-700 text-white border border-slate-600 rounded px-2 py-1"
 placeholder="tối đa"
 />
 </div>)}

 {/* Description */}
 <div className="flex items-center gap-2">
 <label className="text-xs text-slate-400 w-16 shrink-0">minh họa</label>
 <input
 type="text"
 value={variable.description}
 onChange={(e) => onUpdate({description: e.target.value})}
 className="flex-1 text-sm bg-slate-700 text-white border border-slate-600 rounded px-2 py-1"
 placeholder="Mô tả cách sử dụng biến"
 />
 </div>

 {/* Flags */}
 <div className="flex items-center gap-4">
 <label className="flex items-center gap-1.5 cursor-pointer">
 <input
 type="checkbox"
 checked={variable.hidden?? false}
 onChange={(e) => onUpdate({hidden: e.target.checked})}
 className="rounded border-slate-600 bg-slate-700 text-indigo-600"
 />
 <span className="text-xs text-slate-400">$ Ẩn (AI vô hình)</span>
 </label>
 <label className="flex items-center gap-1.5 cursor-pointer">
 <input
 type="checkbox"
 checked={variable.readonly?? false}
 onChange={(e) => onUpdate({readonly: e.target.checked})}
 className="rounded border-slate-600 bg-slate-700 text-indigo-600"
 />
 <span className="text-xs text-slate-400">_ Chỉ đọc (AI chưa được cập nhật)</span>
 </label>
 <button
 onClick={onEdit}
 className="text-xs text-indigo-400 hover:text-indigo-300 ml-auto"
 >Chỉnh sửa hoàn chỉnh</button>
 </div>
 </div>);}

// ── Preview content helper ────────────────────────────────────────────────

function getPreviewContent(config: MvuConfig, tab: PreviewTab): string {switch (tab) {case 'schema': return config.schemaJs || "(vô giá trị)";
 case 'initvar': return config.initvarYaml || "(vô giá trị)";
 case 'update-rules': return config.updateRulesYaml || "(vô giá trị)";
 case 'variable-list': return config.variableListMd || "(vô giá trị)";
 case 'output-format': return config.outputFormatMd || "(vô giá trị)";
 case 'statusbar': return config.statusBarHtml || "(chưa được kích hoạt)";
 case 'story': return config.storyBeautifyHtml || "(chưa được kích hoạt)";
 default: return '';}}
