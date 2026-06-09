/**
 * SettingsPage - API configuration page (sibling to homepage).
 * Features: API URL presets, API key management, model selection, parameters.
 */
import {useState, useEffect, useCallback, useRef} from 'react';
import {getAISettings, saveAISettings, maskApiKey, type AISettings} from '../db/database';
import {fetchModels} from '../services/ai-service';
import {useToast} from '../components/shared/Toast';
import {Button} from '../components/shared/Button';

// ─── Preset endpoints (base URL only, /chat/completions auto-appended) ─────────
const PRESETS = [{label: 'OpenAI', url: 'https://api.openai.com/v1'
},
 {label: 'OpenRouter', url: 'https://openrouter.ai/api/v1'
},
 {label: 'DeepSeek', url: 'https://api.deepseek.com'
},
 {label: "Oobabooga địa phương", url: 'http://127.0.0.1:5000/v1'
},
 {label: "KoboldCPP địa phương", url: 'http://127.0.0.1:5001/v1'
},];

export function SettingsPage() {const {addToast} = useToast();
 const [settings, setSettings] = useState<AISettings | null>(null);
 const [modelList, setModelList] = useState<Array<{id: string; owned_by: string}>>([]);
 const [fetchingModels, setFetchingModels] = useState(false);
 const [editingKey, setEditingKey] = useState(false);
 const [tempKey, setTempKey] = useState('');

 // ── Load settings on mount ───────────────────────────────────────────────
 useEffect(() => {getAISettings().then((s) => {setSettings(s);
 setTempKey(s.apiKey);}).catch((err) => {console.error('Failed to load AI settings:', err);});}, []);

 // ── Clear model list when API URL changes (user switched endpoint) ──────
 const lastFetchedUrlRef = useRef<string>('');
 useEffect(() => {if (lastFetchedUrlRef.current && lastFetchedUrlRef.current!== settings?.apiUrl) {setModelList([]);}}, [settings?.apiUrl]);

 // ── Fetch models from API endpoint ───────────────────────────────────────
 const handleFetchModels = useCallback(async () => {if (!settings) return;
 const url = settings.apiUrl.trim();
 const key = tempKey.trim();
 if (!url) {addToast('error', "Vui lòng điền địa chỉ API trước");
 return;}

 setFetchingModels(true);
 try {const models = await fetchModels(url, key);
 setModelList(models);
 lastFetchedUrlRef.current = url;

 if (models.length > 0) {
  // If old model exists in new list, keep it; otherwise default to first
 const currentInList = models.some((m) => m.id === settings.model);
 const modelToSave = currentInList? settings.model: models[0].id;

 const updated = await saveAISettings({apiUrl: url,
 apiKey: key,
 model: modelToSave,
 keyVerified: true,});
 setSettings(updated);
 setEditingKey(false);
 addToast('success', `Đã kéo thành công ${models.length} mô hình ${currentInList? '': ", cái đầu tiên đã được chọn tự động"}`);} else {addToast('error', "Không tìm thấy mẫu nào, vui lòng kiểm tra địa chỉ và chìa khóa");}} catch (err: unknown) {const msg = err instanceof Error? err.message: "Không kéo được mô hình";
 addToast('error', msg);} finally {setFetchingModels(false);}}, [settings, tempKey, addToast]);

 // ── Unlock key for editing ───────────────────────────────────────────────
 const handleUnlockKey = () => {setTempKey(settings?.apiKey || '');
 setEditingKey(true);};

 // ── Quick fill preset URL ────────────────────────────────────────────────
 const handlePresetClick = (url: string) => {if (settings) setSettings({...settings, apiUrl: url});};

 // ── Save non-key settings ────────────────────────────────────────────────
 const handleSaveSettings = async (patch: Partial<AISettings>) => {if (!settings) return;
 const updated = await saveAISettings(patch);
 setSettings(updated);
 addToast('success', "Đã lưu cài đặt");};

 // Key display: masked if verified and not editing
 const keyIsLocked = settings?.keyVerified &&!editingKey;

 if (!settings) {return (<div className="animate-fade-in flex items-center justify-center h-[calc(100dvh-4rem)]">
 <p className="text-slate-400">đang tải...</p>
 </div>);}

 return (<div className="animate-fade-in max-w-3xl mx-auto">
 {/* ── Header ──────────────────────────────────────────────────────────── */}
 <div className="mb-6">
 <h1 className="text-2xl font-bold text-white">cài đặt API</h1>
 <p className="text-sm text-slate-400 mt-1">Định cấu hình giao diện dịch vụ AI để hỗ trợ tất cả các giao diện tương thích OpenAI (trạm trung chuyển, triển khai cục bộ, v.v.)</p>
 </div>

 {/* ── Settings Card ───────────────────────────────────────────────────── */}
 <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6 space-y-6">
 {/* Row 1: API URL + Presets */}
 <div>
 <label className="block text-sm font-medium text-slate-300 mb-1">địa chỉ API</label>
 <input
 className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none font-mono"
 value={settings.apiUrl}
 onChange={(e) => setSettings({...settings, apiUrl: e.target.value})}
 placeholder="https://api.openai.com/v1"
 />
 <p className="text-[11px] text-slate-500 mt-0.5">Chỉ cần điền URL cơ bản và hệ thống sẽ tự động ghép nó.<code className="bg-slate-700 px-1 rounded">/chat/completions</code>con đường</p>
 <div className="flex gap-1.5 mt-1.5 flex-wrap">
 {PRESETS.map((p) => (<button
 key={p.label}
 onClick={() => handlePresetClick(p.url)}
 className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors
 ${settings.apiUrl === p.url? 'border-indigo-500 bg-indigo-900/40 text-indigo-300': 'border-slate-600 bg-slate-700/50 text-slate-400 hover:border-slate-500 hover:text-slate-300'}`}
 >
 {p.label}
 </button>))}
 </div>
 </div>

 {/* Row 2: API Key */}
 <div>
 <label className="block text-sm font-medium text-slate-300 mb-1">Khóa API</label>
 {keyIsLocked? (<div className="flex items-center gap-2">
 <div className="flex-1 rounded-lg border border-slate-600 bg-slate-900/60 px-3 py-2 text-sm text-slate-400 font-mono select-none">
 🔒 {maskApiKey(settings.apiKey)}
 </div>
 <button
 onClick={handleUnlockKey}
 className="text-xs text-indigo-400 hover:text-indigo-300 px-2 py-1 rounded border border-slate-600 hover:border-indigo-500 transition-colors"
 >✏️ Sửa đổi</button>
 </div>): (<input
 type="password"
 className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none font-mono"
 value={tempKey}
 onChange={(e) => setTempKey(e.target.value)}
 placeholder="sk-... hoặc phím chuyển tuyến"
 />)}
 </div>

 {/* Row 3: Model + Fetch */}
 <div>
 <div className="flex items-end gap-2">
 <div className="flex-1">
 <label className="block text-sm font-medium text-slate-300 mb-1">Người mẫu</label>
 {modelList.length > 0? (<select
 value={settings.model}
 onChange={(e) => handleSaveSettings({model: e.target.value})}
 className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
 >
 {modelList.map((m) => (<option key={m.id} value={m.id}>
 {m.id}
 {m.owned_by? ` (${m.owned_by})`: ''}
 </option>))}
 </select>): (<input
 className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
 value={settings.model}
 onChange={(e) => setSettings({...settings, model: e.target.value})}
 placeholder="gpt-3.5-turbo"
 />)}
 </div>
 <Button
 variant="secondary"
 size="sm"
 onClick={handleFetchModels}
 disabled={fetchingModels}
 className="shrink-0"
 >
 {fetchingModels? "⏳ Kéo...": "🔄 Mô hình kéo"}
 </Button>
 </div>
 {modelList.length > 0 && (<p className="text-[11px] text-slate-500 mt-1">kéo{modelList.length} mô hình · Khóa đã được ẩn tự động</p>)}
 </div>

 {/* Row 4: Temperature + Max Tokens + Retry */}
 <div className="grid grid-cols-3 gap-4">
 <div className="flex flex-col gap-1">
 <label className="text-xs font-medium text-slate-300">nhiệt độ:<span className="text-indigo-400">{settings.temperature.toFixed(1)}</span>
 </label>
 <input
 type="range"
 min="0"
 max="2"
 step="0.1"
 value={settings.temperature}
 onChange={(e) => setSettings({...settings, temperature: parseFloat(e.target.value)})}
 className="w-full accent-indigo-600"
 />
 <div className="flex justify-between text-[10px] text-slate-500">
 <span>Chính xác (0)</span>
 <span>sáng tạo (2)</span>
 </div>
 </div>
 <div className="flex flex-col gap-1">
 <label className="text-xs font-medium text-slate-300">Số lượng token tối đa</label>
 <input
 type="number"
 min={100}
 max={200000}
 step={100}
 value={settings.maxTokens}
 onChange={(e) => setSettings({...settings, maxTokens: parseInt(e.target.value) || 2000})}
 className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-1.5 text-xs text-slate-200 w-full"
 />
 <p className="text-[10px] text-slate-500">Hỗ trợ điền theo mô hình đã chọn và giới hạn trên được nới lỏng thành 300000</p>
 </div>
 <div className="flex flex-col gap-1">
 <label className="text-xs font-medium text-slate-300">Số lần thử lại<span className="text-slate-500">({settings.retryCount?? 3})</span>
 </label>
 <input
 type="number"
 min={0}
 max={10}
 step={1}
 value={settings.retryCount?? 3}
 onChange={(e) => setSettings({...settings, retryCount: parseInt(e.target.value) || 0})}
 className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-1.5 text-xs text-slate-200 w-full"
 />
 <p className="text-[10px] text-slate-500">Tự động thử lại khi mạng có biến động</p>
 </div>
 </div>

 {/* Save button */}
 <div className="flex items-center justify-end pt-2 border-t border-slate-700">
 <Button
 size="sm"
 onClick={() => handleSaveSettings({apiUrl: settings.apiUrl, 
 model: settings.model,
 temperature: settings.temperature,
 maxTokens: settings.maxTokens,
 retryCount: settings.retryCount,...(editingKey? {apiKey: tempKey}: {}),})}
 >💾 Lưu cài đặt</Button>
 </div>
 </div>

 {/* ── Help section ─────────────────────────────────────────────────────── */}
 <div className="mt-6 rounded-xl border border-slate-700/50 bg-slate-800/30 p-5">
 <h3 className="text-sm font-medium text-slate-300 mb-3">💡 Hướng dẫn sử dụng</h3>
 <ul className="text-xs text-slate-400 space-y-2">
 <li>• <strong>địa chỉ API</strong>: Điền URL cơ sở tương thích với định dạng OpenAI</li>
 <li>• <strong>Khóa API</strong>:Khóa chính thức hoặc khóa trạm trung chuyển, tự động ẩn sau khi xác minh</li>
 <li>• <strong>Mô hình kéo</strong>: Lấy danh sách các model có sẵn từ API</li>
 <li>• <strong>nhiệt độ</strong>:0 = chính xác hơn, 2 = sáng tạo hơn</li>
 <li>• Hỗ trợ: OpenAI, OpenRouter, DeepSeek, Oobabooga bản địa, KoboldCPP, v.v.</li>
 </ul>
 </div>
 </div>);}
