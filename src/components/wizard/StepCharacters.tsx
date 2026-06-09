/**
 * Step 2: Character configuration — simplified.
 *
 * Each character has: name + description only.
 * Generated results are displayed as world book entries below,
 * allowing users to review and edit before proceeding.
 *
 * When navigating to Step 3, character descriptions are auto-injected
 * as world book entries for efficient token usage.
 */
import {useRef, useCallback} from 'react';
import {CharacterEditor} from './CharacterEditor';
import {TextArea} from '../shared/TextArea';
import {Button} from '../shared/Button';
import type {WizardCharacter, LorebookEntry} from '../../constants/defaults';

interface StepCharactersProps {characters: WizardCharacter[];
 entries: LorebookEntry[];
 onAdd: () => void;
 onRemove: (index: number) => void;
 onUpdate: (index: number, updates: Partial<WizardCharacter>) => void;
 onGenerateCharacter: (index: number) => void;
 onEntriesUpdate: (entries: LorebookEntry[]) => void;
 generatingIndex: number | null;}

export function StepCharacters({characters,
 entries,
 onAdd,
 onRemove,
 onUpdate,
 onGenerateCharacter,
 onEntriesUpdate,
 generatingIndex,}: StepCharactersProps) {const lastEditorRef = useRef<HTMLDivElement>(null);

 const handleAdd = useCallback(() => {onAdd();
 // Scroll to the new character after React re-renders
 requestAnimationFrame(() => {requestAnimationFrame(() => {lastEditorRef.current?.scrollIntoView({behavior: 'smooth', block: 'center'});});});}, [onAdd]);

 // Get character-linked entries (those with entryIds)
 const charEntryIds = new Set<string>();
 for (const c of characters) {for (const eid of c.entryIds?? []) charEntryIds.add(eid);}
 const linkedEntries = entries.filter(e => charEntryIds.has(e.id));
 const userEntries = entries.filter(e =>!charEntryIds.has(e.id));

 // Update a single linked entry
 const updateLinkedEntry = useCallback((entryId: string, content: string) => {const updated = entries.map(e =>
 e.id === entryId? {...e, content}: e);
 onEntriesUpdate(updated);}, [entries, onEntriesUpdate]);

 return (<div>
 <div className="mb-4">
 <h2 className="text-xl font-bold text-white">Cấu hình vai trò</h2>
 <p className="text-sm text-slate-400 mt-1">Mỗi nhân vật chỉ cần: tên nhân vật + thiết lập nhân vật. Kết quả tạo ra sẽ được tự động chuyển sang định dạng sổ thế giới.</p>
 </div>

 {/* Writing methodology guidance */}
 <div className="rounded-lg bg-indigo-900/20 border border-indigo-700/40 px-4 py-3 mb-4">
 <p className="text-xs text-indigo-300 leading-relaxed">
 <span className="font-semibold">Quy tắc viết (tham khảo phương pháp thẻ Tavern):</span>
 </p>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 mt-1.5 text-[11px] text-indigo-300/80">
 <p>✦ <strong>Một câu có nghĩa giống nhau</strong>: Dừng lại sau khi viết thái độ và không lặp lại điều tương tự</p>
 <p>✦ <strong>Định dạng cơ sở dữ liệu</strong>: Sử dụng danh sách và cặp khóa-giá trị, không sử dụng đoạn văn xuôi</p>
 <p>✦ <strong>Hành vi thể hiện tính cách</strong>: Viết hành vi cụ thể, không nhãn mác trừu tượng</p>
 <p>✦ <strong>Bốn câu hỏi cho mỗi câu</strong>: Xóa AI có sai không? Đó là thông tin hay trang trí? Một danh sách có thể được thay thế? Bạn có thể hiểu nó mà không cần đọc văn bản gốc?</p>
 </div>
 </div>

 {/* Character list */}
 <div className="space-y-4">
 {characters.map((char, i) => (<div key={char.id} ref={i === characters.length - 1? lastEditorRef: undefined}>
 <CharacterEditor
 character={char}
 index={i}
 onUpdate={(updates) => onUpdate(i, updates)}
 onRemove={() => onRemove(i)}
 onGenerate={onGenerateCharacter}
 canRemove={characters.length > 1}
 isGenerating={generatingIndex === i}
 />
 </div>))}
 </div>

 {/* Add character button */}
 <div className="mt-4">
 <Button variant="secondary" onClick={handleAdd}>+ thêm nhân vật</Button>
 </div>

 {/* Generated world book entries preview */}
 {linkedEntries.length > 0 && (<div className="mt-8">
 <div className="flex items-center gap-2 mb-3">
 <h3 className="text-lg font-semibold text-indigo-300">Tạo kết quả (định dạng Sách Thế giới)</h3>
 <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-600/20 text-indigo-400 border border-indigo-600/30">tiêm tự động</span>
 </div>
 <p className="text-xs text-slate-500 mb-4">Các mục sau đây được tạo tự động bởi thiết lập nhân vật và có thể được sửa đổi trước khi chuyển sang bước tiếp theo.</p>
 <div className="space-y-3">
 {linkedEntries.map((entry) => (<div
 key={entry.id}
 className="rounded-xl border border-indigo-600/30 bg-slate-800/50 p-4 space-y-2"
 >
 <div className="flex items-center gap-2">
 <span className="text-sm">{entry.constant? '🔵': '🟢'}</span>
 <h4 className="text-sm font-medium text-white">{entry.name}</h4>
 <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-400">Sự ưu tiên:{entry.priority}
 </span>
 <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-400">Từ kích hoạt:{entry.keys.join(', ') || "Vĩnh viễn"}
 </span>
 </div>
 <TextArea
 value={entry.content}
 onChange={(e) => updateLinkedEntry(entry.id, e.target.value)}
 placeholder="Nội dung nhập..."
 rows={3}
 />
 </div>))}
 </div>
 </div>)}
 </div>);}
