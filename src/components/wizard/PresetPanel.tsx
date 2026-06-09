/**
 * PresetPanel - Import and manage SillyTavern prompt presets.
 * Allows importing.json preset files and toggling individual rules.
 * Active preset content is injected into AI generation prompts.
 */
import {useState, useRef, useCallback} from 'react';
import {Button} from '../shared/Button';
import {importPresetFile,
 loadSavedPreset,
 clearSavedPreset,
 togglePresetPrompt,
 type LoadedPreset,} from '../../services/preset-service';

export function PresetPanel() {const [preset, setPreset] = useState<LoadedPreset | null>(() => loadSavedPreset());
 const [error, setError] = useState<string | null>(null);
 const [importing, setImporting] = useState(false);
 const fileRef = useRef<HTMLInputElement>(null);

 const handleImport = useCallback(async () => {fileRef.current?.click();}, []);

 const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {const file = e.target.files?.[0];
 if (!file) return;
 setImporting(true);
 setError(null);
 try {const loaded = await importPresetFile(file);
 setPreset(loaded);} catch (err: unknown) {setError(err instanceof Error? err.message: "Nhập không thành công");} finally {setImporting(false);
 if (fileRef.current) fileRef.current.value = '';}}, []);

 const handleClear = useCallback(() => {clearSavedPreset();
 setPreset(null);}, []);

 const handleToggle = useCallback((index: number) => {const updated = togglePresetPrompt(index);
 setPreset(updated);}, []);

 const enabledCount = preset?.prompts.filter(p => p.enabled).length?? 0;

 const typeLabel = (type: string) => {switch (type) {case 'example': return <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-900/30 text-green-300">Ví dụ</span>;
 case 'jailbreak': return <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-900/30 text-amber-300">JB</span>;
 default: return <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-400">system</span>;}};

 return (<div className="rounded-lg border border-slate-700/50 bg-slate-800/30 p-4">
 {/* Hidden file input */}
 <input
 ref={fileRef}
 type="file"
 accept=".json,application/json"
 className="hidden"
 onChange={handleFileChange}
 />

 <div className="flex items-center justify-between mb-2">
 <div className="flex items-center gap-2">
 <span className="text-sm font-semibold text-white">📋 Mặc định ghi thẻ</span>
 {preset && (<span className="text-[10px] text-indigo-300 bg-indigo-900/30 px-1.5 py-0.5 rounded">
 {enabledCount}/{preset.prompts.length} đã bật quy tắc</span>)}
 </div>
 <div className="flex gap-2">
 <Button
 variant="secondary"
 size="sm"
 onClick={handleImport}
 disabled={importing}
 >
 {importing? "Đang nhập khẩu...": preset? "🔄 Thay đổi mặc định": "📂 Nhập cài đặt trước"}
 </Button>
 {preset && (<Button variant="danger" size="sm" onClick={handleClear}>✕ Xóa</Button>)}
 </div>
 </div>

 {/* Error */}
 {error && (<p className="text-xs text-red-400 mb-2">{error}</p>)}

 {/* Empty state */}
 {!preset &&!error && (<p className="text-xs text-slate-500">Nhập tệp cài sẵn tavern.json và trích xuất các quy tắc làm hướng dẫn về văn phong và cách viết khi tạo AI.
 Hỗ trợ định dạng cài sẵn tiêu chuẩn SillyTavern, định dạng system_prompt, v.v.</p>)}

 {/* Preset info + rule list */}
 {preset && (<div className="mt-2 space-y-1">
 <p className="text-[10px] text-slate-500">nguồn:{preset.fileName}· Đã tải{preset.prompts.length} quy tắc</p>
 <div className="max-h-[200px] overflow-y-auto space-y-0.5">
 {preset.prompts.map((p, i) => (<label
 key={p.id}
 className="flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-700/30 cursor-pointer text-xs"
 >
 <input
 type="checkbox"
 checked={p.enabled}
 onChange={() => handleToggle(i)}
 className="rounded border-slate-600 bg-slate-800 text-indigo-600"
 />
 <span className={`truncate ${p.enabled? 'text-slate-200': 'text-slate-500 line-through'}`}>
 {p.name}
 </span>
 {typeLabel(p.type)}
 <span className="text-[10px] text-slate-600 ml-auto shrink-0">
 {p.content.length} ký tự</span>
 </label>))}
 </div>
 </div>)}
 </div>);}
