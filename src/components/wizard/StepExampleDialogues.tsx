/**
 * Step 5: Example Dialogues (optional).
 * Shows the AI how the character speaks. Uses <START>, {{user}}, and actual character names.
 * Supports AI generation with real-time streaming progress.
 */
import {useState, useCallback} from 'react';
import {TextArea} from '../shared/TextArea';
import {Button} from '../shared/Button';
import {AIProgressPanel, type AIProgressStatus} from '../shared/AIProgressPanel';
import {useAIGenerate} from '../../hooks/useAIGenerate';

interface StepExampleDialoguesProps {exampleDialogues: string;
 cardName: string;
 characterDescriptions: string;
 existingWorldbookContext?: string;
 onChange: (dialogues: string) => void;}

export function StepExampleDialogues({exampleDialogues, cardName, characterDescriptions, existingWorldbookContext, onChange}: StepExampleDialoguesProps) {const {generateExampleDialoguesStreaming} = useAIGenerate();
 const [aiStatus, setAiStatus] = useState<AIProgressStatus>('idle');
 const [aiText, setAiText] = useState('');
 const [aiError, setAiError] = useState<string | null>(null);
 const [pendingResult, setPendingResult] = useState<string | null>(null);

 const handleStreamGenerate = useCallback(async () => {setAiStatus('generating');
 setAiText('');
 setAiError(null);
 setPendingResult(null);

 try {const fullText = await generateExampleDialoguesStreaming(cardName,
 characterDescriptions,
 (chunk) => {setAiText((prev) => prev + chunk);},
 existingWorldbookContext,);
 setAiStatus('done');
 setPendingResult(fullText);} catch (err: unknown) {setAiStatus('error');
 setAiError(err instanceof Error? err.message: "Xây dựng không thành công");}}, [cardName, characterDescriptions, existingWorldbookContext, generateExampleDialoguesStreaming]);

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
 <div className="flex items-center justify-between mb-6">
 <div>
 <h2 className="text-xl font-bold text-white">Cuộc trò chuyện mẫu<span className="text-sm font-normal text-slate-500">(không bắt buộc)</span></h2>
 <p className="text-sm text-slate-400 mt-1">Đoạn hội thoại mẫu có thể dạy nhân vật AI cách nói. sử dụng {'<START>'} Tách các nhóm hội thoại khác nhau.</p>
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

 {/* AI Progress Panel */}
 {aiStatus!== 'idle' && (<div className="mb-4">
 <AIProgressPanel
 status={aiStatus}
 text={aiText}
 error={aiError}
 title="Tạo đối thoại mẫu AI"
 onClear={handleClear}
 />
 </div>)}

 <TextArea
 value={exampleDialogues}
 onChange={(e) => onChange(e.target.value)}
 placeholder={`<START>\\n{{user}}: Xin chào!\\nTên nhân vật: *ngẩng lên* Ồ, xin chào. Tôi không mong đợi có bạn đồng hành.\\n\\n<START>\\n{{user}}: Hãy kể cho tôi nghe về bản thân bạn.\\nTên nhân vật: *thở dài* Đó là một câu chuyện dài...`}
 rows={12}
 className="font-mono"
 />
 <p className="mt-2 text-xs text-slate-500">Định dạng: Mỗi nhóm hội thoại bắt đầu bằng {'<START>'} Bắt đầu rồi đó {'{{user}}'}: Tin nhắn, tên vai trò: Trả lời (sử dụng tên cài đặt vai trò, không sử dụng {'{{char}}'}). Viết 2-3 đoạn hội thoại ngắn.</p>
 </div>);}