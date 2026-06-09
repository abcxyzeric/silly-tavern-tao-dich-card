/**
 * CharacterEditor - Single character editor panel used in Step 2.
 * Simplified to: name + description only.
 * Uses local state for editing and syncs to parent on blur.
 */
import {useState, useEffect} from 'react';
import {TextInput} from '../shared/TextInput';
import {TextArea} from '../shared/TextArea';
import {Button} from '../shared/Button';
import type {WizardCharacter} from '../../constants/defaults';

interface CharacterEditorProps {character: WizardCharacter;
 index: number;
 onUpdate: (updates: Partial<WizardCharacter>) => void;
 onRemove: () => void;
 onGenerate: (index: number) => void;
 canRemove: boolean;
 isGenerating: boolean;}

export function CharacterEditor({character,
 index,
 onUpdate,
 onRemove,
 onGenerate,
 canRemove,
 isGenerating,}: CharacterEditorProps) {const [localName, setLocalName] = useState(character.name?? '');
 const [localDesc, setLocalDesc] = useState(character.description?? '');

 useEffect(() => {setLocalName(character.name?? '');}, [character.name]);
 useEffect(() => {setLocalDesc(character.description?? '');}, [character.description]);

 const hasName = (character.name?? '').trim().length > 0;

 return (<div className="rounded-xl border border-slate-700 bg-slate-800/50 p-5 space-y-4">
 {/* Header */}
 <div className="flex items-center justify-between">
 <h3 className="text-base font-semibold text-white">Vai trò{index + 1}{localName? `: ${localName}`: ''}
 </h3>
 <div className="flex items-center gap-2">
 {hasName && (<Button
 variant="secondary"
 size="sm"
 onClick={() => onGenerate(index)}
 disabled={isGenerating}
 >
 {isGenerating? "Đang tạo...": "AI được tạo ra"}
 </Button>)}
 {canRemove && (<Button variant="danger" size="sm" onClick={onRemove} disabled={isGenerating}>Xóa</Button>)}
 </div>
 </div>

 {/* Fields */}
 <TextInput
 label="Tên nhân vật"
 value={localName}
 onChange={(e) => setLocalName(e.target.value)}
 onBlur={(e) => onUpdate({name: e.target.value})}
 placeholder="Nhập tên vai trò"
 />

 <TextArea
 label="Thiết lập nhân vật (AI sẽ được tạo dựa trên tiện ích mở rộng này)"
 value={localDesc}
 onChange={(e) => setLocalDesc(e.target.value)}
 onBlur={(e) => onUpdate({description: e.target.value})}
 placeholder="Các hướng dẫn ràng buộc được ghi cho AI, chẳng hạn như cài đặt nhân vật cốt lõi, quy tắc ứng xử, yêu cầu về mối quan hệ, v.v. AI sẽ mở rộng liên kết này để tạo ra mô tả nhân vật hoàn chỉnh và mục nhập sổ thế giới."
 rows={4}
 />
 </div>);}
