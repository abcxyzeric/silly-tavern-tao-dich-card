/**
 * Step 4: First Message - the character's opening message.
 * Supports AI generation with real-time streaming progress and word count control.
 */
import {useState, useCallback} from 'react';
import {TextArea} from '../shared/TextArea';
import {Button} from '../shared/Button';
import {AIProgressPanel, type AIProgressStatus} from '../shared/AIProgressPanel';
import {useAIGenerate} from '../../hooks/useAIGenerate';

interface StepFirstMessageProps {firstMessage: string;
 cardName: string;
 characterDescriptions: string;
 worldbookContext: string;
 onChange: (message: string) => void;}

const WORD_COUNT_PRESETS = [{label: "Không giới hạn", value: 0},
 {label: "200 từ", value: 200},
 {label: "500 từ", value: 500},
 {label: "800 từ", value: 800},
 {label: "1200 từ", value: 1200},];

export function StepFirstMessage({firstMessage, cardName, characterDescriptions, worldbookContext, onChange}: StepFirstMessageProps) {const {generateFirstMessageStreaming} = useAIGenerate();
 const [aiStatus, setAiStatus] = useState<AIProgressStatus>('idle');
 const [aiText, setAiText] = useState('');
 const [aiError, setAiError] = useState<string | null>(null);
 const [pendingResult, setPendingResult] = useState<string | null>(null);
 const [targetWordCount, setTargetWordCount] = useState(0);

 const handleStreamGenerate = useCallback(async () => {setAiStatus('generating');
 setAiText('');
 setAiError(null);
 setPendingResult(null);

 try {const fullText = await generateFirstMessageStreaming(cardName,
 characterDescriptions,
 '', // no scene hint for quick generate
 (chunk) => {setAiText((prev) => prev + chunk);},
 targetWordCount || undefined,
 worldbookContext,);
 setAiStatus('done');
 setPendingResult(fullText);} catch (err: unknown) {setAiStatus('error');
 setAiError(err instanceof Error? err.message: "Xây dựng không thành công");}}, [cardName, characterDescriptions, generateFirstMessageStreaming, targetWordCount, worldbookContext]);

 const handleAccept = useCallback(() => {if (pendingResult) {onChange(pendingResult);
 setPendingResult(null);}
 setAiStatus('idle');
 setAiText('');}, [pendingResult, onChange]);

 const handleReject = useCallback(() => {setPendingResult(null);
 setAiStatus('idle');
 setAiText('');}, []);

 const handleClear = useCallback(() => {setAiStatus('idle');
 setAiText('');
 setAiError(null);
 setPendingResult(null);}, []);

 return (<div>
 <div className="flex items-center justify-between mb-4">
 <div>
 <h2 className="text-xl font-bold text-white">phát biểu khai mạc</h2>
 <p className="text-sm text-slate-400 mt-1">Tin nhắn đầu tiên mà một nhân vật gửi khi bắt đầu cuộc trò chuyện. Có sẵn {'{{user}}'} Với tư cách là người giữ chỗ, vai trò này sẽ trực tiếp sử dụng tên đã đặt.</p>
 </div>
 <div className="flex gap-2">
 <Button
 variant="secondary"
 size="sm"
 onClick={handleStreamGenerate}
 disabled={aiStatus === 'generating'}
 >
 {aiStatus === 'generating'? "⏳ Đang tạo...": "✨AI được tạo ra"}
 </Button>
 {pendingResult && (<>
 <Button size="sm" onClick={handleAccept}>✅ Áp dụng</Button>
 <Button size="sm" variant="ghost" onClick={handleReject}>Bỏ qua</Button>
 </>)}
 </div>
 </div>

 {/* Word count presets */}
 <div className="flex flex-wrap items-center gap-2 mb-4">
 <span className="text-xs text-slate-400 shrink-0">Số từ mục tiêu:</span>
 <div className="flex flex-wrap gap-1.5">
 {WORD_COUNT_PRESETS.map((preset) => (<button
 key={preset.value}
 onClick={() => setTargetWordCount(preset.value)}
 className={`px-3 py-1 text-xs rounded-lg border transition-colors ${targetWordCount === preset.value? 'bg-indigo-600/30 border-indigo-500/50 text-indigo-300': 'border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-300'}`}
 >
 {preset.label}
 </button>))}
 </div>
 </div>

 {/* AI Progress Panel */}
 {aiStatus!== 'idle' && (<div className="mb-4">
 <AIProgressPanel
 status={aiStatus}
 text={aiText}
 error={aiError}
 title="Tạo đường mở AI"
 onClear={handleClear}
 />
 </div>)}

 <TextArea
 value={firstMessage}
 onChange={(e) => onChange(e.target.value)}
 placeholder="Nhân vật từ từ mở mắt ra, sàn đá lạnh lẽo áp vào lưng anh ta..."
 rows={10}
 className="font-mono"
 />
 <div className="flex items-center justify-between mt-2">
 <p className="text-xs text-slate-500">Mẹo: Những phần mở đầu hay thường đặt ra bối cảnh, bao gồm các chi tiết mang tính giác quan và tạo cho người dùng sự hấp dẫn để phản hồi.</p>
 {firstMessage && (<span className="text-xs text-slate-500 shrink-0 ml-4">Hiện có {firstMessage.length} ký tự</span>)}
 </div>
 </div>);}
