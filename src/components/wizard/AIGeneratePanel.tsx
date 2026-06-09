/**
 * AIGeneratePanel - Collapsible panel for AI batch world book generation.
 * Extracted from StepWorldBook for better component granularity.
 */
import {TextInput} from '../shared/TextInput';
import {TextArea} from '../shared/TextArea';
import {Button} from '../shared/Button';

interface AIGeneratePanelProps {topic: string;
 worldRules: string;
 generating: boolean;
 skeletonMode: boolean;
 skeletonCount: number;
 onTopicChange: (topic: string) => void;
 onWorldRulesChange: (rules: string) => void;
 onSkeletonModeChange: (skeleton: boolean) => void;
 onSkeletonCountChange: (count: number) => void;
 onGenerate: () => void;
 onCancel: () => void;}

export function AIGeneratePanel({topic,
 worldRules,
 generating,
 skeletonMode,
 skeletonCount,
 onTopicChange,
 onWorldRulesChange,
 onSkeletonModeChange,
 onSkeletonCountChange,
 onGenerate,
 onCancel,}: AIGeneratePanelProps) {return (<div className="mb-6 rounded-xl border border-indigo-700/40 bg-indigo-950/30 p-4 space-y-3">
 <div>
 <label className="text-sm font-medium text-indigo-300">Chủ đề / Chủ đề</label>
 <TextInput
 value={topic}
 onChange={(e) => onTopicChange(e.target.value)}
 placeholder="Ví dụ: thế giới bất tử, học viện phép thuật, vùng đất hoang tận thế, cyberpunk..."
 />
 </div>

 {/* ── Skeleton mode ──────────────────────────── */}
 <div className="p-3 rounded-lg bg-emerald-900/20 border border-emerald-700/30 space-y-2">
 <div className="flex items-center justify-between">
 <div>
 <label className="text-sm font-medium text-emerald-300 flex items-center gap-2 cursor-pointer select-none">
 <input
 type="checkbox"
 checked={skeletonMode}
 onChange={(e) => onSkeletonModeChange(e.target.checked)}
 className="rounded border-emerald-600 bg-slate-800 text-emerald-500"
 />🦴 Chế độ khung</label>
 <p className="text-[10px] text-emerald-400/60 mt-0.5 ml-6">Nhanh chóng tạo một khung ngắn rồi sử dụng "✨ AI mở rộng" để mở rộng từng khung một thành một khung hoàn chỉnh.</p>
 </div>
 {skeletonMode && (<div className="flex items-center gap-2 shrink-0">
 <span className="text-xs text-emerald-400/70">Số lượng mục</span>
 <input
 type="number"
 value={skeletonCount}
 min={3}
 max={30}
 onChange={(e) => onSkeletonCountChange(Math.max(3, parseInt(e.target.value) || 6))}
 className="w-14 text-center rounded border border-emerald-600/40 bg-slate-800 px-2 py-1 text-sm font-semibold text-emerald-300"
 />
 </div>)}
 </div>
 {skeletonMode && (<div className="flex gap-1.5 ml-6">
 {[6, 10, 15, 20].map((n) => (<button
 key={n}
 onClick={() => onSkeletonCountChange(n)}
 className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors ${skeletonCount === n? 'border-emerald-500 bg-emerald-900/40 text-emerald-300': 'border-slate-600 bg-slate-700/50 text-slate-400 hover:border-emerald-600 hover:text-emerald-400'}`}
 >
 {n} mục</button>))}
 </div>)}
 </div>
 <div>
 <label className="text-sm font-medium text-indigo-300">Những hạn chế của thế giới quan và quy tắc vận hành<span className="text-xs text-slate-500 font-normal ml-2">(Tùy chọn, xác định luật thế giới, luật chơi, v.v.)</span>
 </label>
 <TextArea
 value={worldRules}
 onChange={(e) => onWorldRulesChange(e.target.value)}
 placeholder={`Ví dụ:\\n- Hệ thống tu luyện bất tử: Luyện khí → Kiến trúc → Kim dược → Nguyên sinh → Hóa thần → Vượt qua kiếp nạn\\n- Bối cảnh phục hồi năng lượng tâm linh: thành phố hiện đại + linh lực dần dần mạnh mẽ hơn\\n- Cơ cấu quyền lực: ba giáo phái bất tử lớn + liên minh tu sĩ lỏng lẻo + ma đạo\\n- Quy tắc sức mạnh chiến đấu: Mỗi cảnh giới lớn được chia thành ba cấp độ, và để đột phá cần có nguyên liệu tự nhiên và báu vật trần thế\\n- Luật chơi: Nhân vật hành động nghiêm ngặt theo bộ cá tính và tính cách không thể bị phá hủy`}
 rows={6}
 />
 <p className="text-[10px] text-slate-500 mt-1">Điền vào cài đặt thế giới quan, hệ thống quyền lực, quan hệ quyền lực, quy tắc vận hành, v.v. và AI sẽ tạo ra các mục sổ thế giới tuân thủ các ràng buộc.</p>
 </div>
 <div className="flex items-center gap-2 pt-1">
 <button
 onClick={onGenerate}
 disabled={generating}
 className="inline-flex items-center justify-center gap-2 rounded-lg font-medium px-5 py-2 text-sm
 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500
 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40
 transition-all duration-200 hover:scale-105 active:scale-95
 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer"
 >
 {generating? "⏳ Đang tạo...": "🚀 Tạo sổ thế giới"}
 </button>
 <Button variant="ghost" size="sm" onClick={onCancel}>Hủy bỏ</Button>
 {(topic || worldRules) && (<span className="text-[10px] text-slate-500 ml-auto">
 {topic && "chủ đề:" + topic.slice(0, 30) + (topic.length > 30? '...': '')}
 {topic && worldRules && ' · '}
 {worldRules && worldRules.length + "Quy tắc từ"}
 </span>)}
 </div>
 </div>);}