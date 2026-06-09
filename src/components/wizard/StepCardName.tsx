/**
 * Step 1: Card Name + Tags.
 * Card name is the only field that cannot be AI-generated.
 * Tags are for frontend sorting/filtering (not used in AI prompts).
 */
import {TextInput} from '../shared/TextInput';
import {TagInput} from '../shared/TagInput';

interface StepCardNameProps {cardName: string;
 tags: string[];
 onNameChange: (name: string) => void;
 onTagsChange: (tags: string[]) => void;}

export function StepCardName({cardName, tags, onNameChange, onTagsChange}: StepCardNameProps) {return (<div className="space-y-8">
 <div>
 <h2 className="text-xl font-bold text-white mb-2">Tên thẻ</h2>
 <p className="text-sm text-slate-400 mb-6">Đặt tên cho card nhân vật của bạn để hiển thị và tìm kiếm trong thư viện thẻ.</p>
 <TextInput
 label="Tên thẻ"
 value={cardName}
 onChange={(e) => onNameChange(e.target.value)}
 placeholder="Ví dụ: Kẻ lang thang bí ẩn"
 autoFocus
 />
 </div>

 <div className="border-t border-white/5 pt-6">
 <h3 className="text-lg font-semibold text-white mb-2">Nhãn thẻ (tùy chọn)</h3>
 <p className="text-xs text-slate-400 mb-2">Được sử dụng để phân loại và lọc và sẽ không xuất hiện trong các từ nhắc của AI.</p>
 <TagInput
 tags={tags}
 onChange={onTagsChange}
 placeholder="Ví dụ: giả tưởng, khuôn viên trường, phép thuật..."
 />
 </div>
 </div>);}
