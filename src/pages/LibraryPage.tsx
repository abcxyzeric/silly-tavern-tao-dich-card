/**
 * LibraryPage - Character card library management.
 * Lists all saved cards with search, sort, edit, delete, and JSON/PNG export/import.
 */
import {useState, useMemo, useCallback} from 'react';
import {useNavigate} from 'react-router-dom';
import {useCardLibrary} from '../hooks/useCardLibrary';
import {useAIGenerate} from '../hooks/useAIGenerate';
import {db} from '../db/database';
import {useToast} from '../components/shared/Toast';
import {Button} from '../components/shared/Button';
import {TextInput} from '../components/shared/TextInput';
import {Modal} from '../components/shared/Modal';
import {exportAsJson, exportAsPng, importFromPng} from '../services/card-exporter';

export function LibraryPage() {const {cards, trashCards, loading, deleteCard, restoreCard, permanentDelete, emptyTrash, loadCards} = useCardLibrary();
 const navigate = useNavigate();
 const {addToast} = useToast();
 const [searchQuery, setSearchQuery] = useState('');
 const [sortBy, setSortBy] = useState<'updatedAt' | 'name'>('updatedAt');
 const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
 const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
 const [permanentDeleteConfirm, setPermanentDeleteConfirm] = useState<number | null>(null);
 const [exportMenuCard, setExportMenuCard] = useState<Record<string, unknown> | null>(null);
 const [translatingId, setTranslatingId] = useState<number | null>(null);
 const [showTrash, setShowTrash] = useState(false);
 const {translateCard} = useAIGenerate();

 // Filter and sort cards
 const filteredCards = useMemo(() => {let result = [...cards];

 if (searchQuery) {const q = searchQuery.toLowerCase();
 result = result.filter((c) => (c.name as string).toLowerCase().includes(q));}

 result.sort((a, b) => {let cmp = 0;
 if (sortBy === 'name') {cmp = ((a.name as string) || '').localeCompare((b.name as string) || '');} else {cmp = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();}
 return sortDir === 'asc'? cmp: -cmp;});

 return result;}, [cards, searchQuery, sortBy, sortDir]);

 const handleDelete = async (id: number) => {await deleteCard(id);
 addToast('success', "Thẻ đã được chuyển vào thùng rác");
 setDeleteConfirm(null);};

 const handleRestore = async (id: number) => {await restoreCard(id);
 addToast('success', "Đã khôi phục thẻ");};

 const handlePermanentDelete = async (id: number) => {await permanentDelete(id);
 addToast('success', "Thẻ đã bị xóa hoàn toàn");
 setPermanentDeleteConfirm(null);};

 const handleEmptyTrash = async () => {if (confirm("Bạn có chắc chắn muốn dọn sạch Thùng rác không? Không thể hoàn tác hành động này.")) {await emptyTrash();
 addToast('success', "Thùng rác đã trống");}};

 const handleExportJson = (card: Record<string, unknown>) => {try {exportAsJson(card as Parameters<typeof exportAsJson>[0]);
 addToast('success', "JSON đã được xuất");} catch {addToast('error', "Xuất JSON không thành công");}
 setExportMenuCard(null);};

 const handleExportPng = async (card: Record<string, unknown>) => {try {await exportAsPng(card as Parameters<typeof exportAsPng>[0]);
 addToast('success', "Đã xuất PNG (có nhúng JSON)");} catch {addToast('error', "Xuất PNG không thành công");}
 setExportMenuCard(null);};

 const handleExportPngWithImage = async (card: Record<string, unknown>) => {
  // Let user pick a PNG image to use as the base
 const input = document.createElement('input');
 input.type = 'file';
 input.accept = '.png,image/png';
 input.onchange = async (e) => {const file = (e.target as HTMLInputElement).files?.[0];
 if (!file) return;
 try {const buffer = await file.arrayBuffer();
 await exportAsPng(card as Parameters<typeof exportAsPng>[0], buffer);
 addToast('success', "Đã xuất PNG (hình ảnh tùy chỉnh + JSON được nhúng)");} catch {addToast('error', "Xuất PNG không thành công");}};
 input.click();
 setExportMenuCard(null);};

 const handleTranslateCard = useCallback(async (card: Record<string, unknown>, targetLang: 'zh' | 'en') => {const cardId = card.id as number;
 setTranslatingId(cardId);
 setExportMenuCard(null);
 try {const cardData = (card.data || card) as Record<string, unknown>;
 const translated = await translateCard(cardData, targetLang);
 if (!translated) {addToast('error', "Nội dung thẻ trống và không thể dịch được");
 return;}

 // Apply translated fields back to card data
 const updatedData = {...cardData};
 const fields = ['name', 'description', 'personality', 'scenario', 'first_mes', 'mes_example',
 'system_prompt', 'post_history_instructions', 'creator_notes'];
 for (const key of fields) {if (translated[key] && typeof translated[key] === 'string') {updatedData[key] = translated[key];}}

 // Apply translated worldbook entries back
 const wbEntries = translated._worldbook_entries as Array<Record<string, unknown>> | undefined;
 if (wbEntries && updatedData.character_book) {const charBook = updatedData.character_book as Record<string, unknown>;
 const entries = charBook.entries as Array<Record<string, unknown>> | undefined;
 if (entries && Array.isArray(entries)) {for (let i = 0; i < Math.min(wbEntries.length, entries.length); i++) {if (wbEntries[i].name) entries[i].name = wbEntries[i].name;
 if (wbEntries[i].comment) entries[i].comment = wbEntries[i].comment;
 if (wbEntries[i].content) entries[i].content = wbEntries[i].content;
 if (wbEntries[i].keys) entries[i].keys = wbEntries[i].keys;}}}

 // Update the card name at top level too
 const updatedCard = {...card,
 name: (translated.name as string) || card.name,
 data: updatedData,
 updatedAt: new Date(),};

 await db.cards.put(updatedCard as Record<string, unknown>);
 await loadCards();
 addToast('success', `thẻ"${updatedCard.name}” đã được dịch là ${targetLang === 'zh'? "Tiếng Trung": "Tiếng Anh"}`);} catch (err: unknown) {const msg = err instanceof Error? err.message: "Dịch không thành công";
 addToast('error', `Dịch không thành công: ${msg}`);} finally {setTranslatingId(null);}}, [translateCard, loadCards, addToast]);

 const handleImport = async () => {const input = document.createElement('input');
 input.type = 'file';
 input.accept = '.json,.png,image/png';
 input.onchange = async (e) => {const file = (e.target as HTMLInputElement).files?.[0];
 if (!file) return;

 try {let cardData: Record<string, unknown>;

 if (file.name.endsWith('.png') || file.type === 'image/png') {
  // PNG import: extract embedded JSON
 const buffer = await file.arrayBuffer();
 const extracted = await importFromPng(buffer);
 if (!extracted) {addToast('error', "Không tìm thấy dữ liệu card nhân vật ở định dạng PNG (yêu cầu định dạng SillyTavern)");
 return;}
 cardData = extracted;} else {
  // JSON import
 const text = await file.text();
 cardData = JSON.parse(text);}

 // Strip id to avoid overwriting existing cards in DB
 const {id: _discardId,...cardWithoutId} = cardData;
 const card = {...cardWithoutId,
 name: (cardData.data as Record<string, unknown>)?.name || cardData.name || 'Imported Card',
 createdAt: new Date(),
 updatedAt: new Date(),};
 await db.cards.add(card as Record<string, unknown>);
 await loadCards();
 addToast('success', `thẻ"${card.name}"Nhập thành công`);} catch (err: unknown) {const msg = err instanceof Error? err.message: "Định dạng tệp không hợp lệ";
 addToast('error', `Nhập không thành công: ${msg}`);}};
 input.click();};

 const formatDate = (date: Date | string) => {try {return new Date(date).toLocaleDateString(undefined, {year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',});} catch {return 'Unknown';}};

 return (<div className="animate-fade-in">
 <div className="flex items-center justify-between mb-6">
 <div>
 <h1 className="text-2xl font-bold text-white">
 {showTrash? "thùng rác": "thư viện thẻ"}
 </h1>
 <p className="text-sm text-slate-400 mt-1">
 {showTrash? `Có trong thùng rác ${trashCards.length} thẻ`: `Có tổng cộng ${cards.length} thẻ`}
 </p>
 </div>
 <div className="flex gap-2">
 {!showTrash && (<>
 <Button variant="secondary" onClick={handleImport}>📥 Nhập</Button>
 <Button onClick={() => navigate('/wizard')}>✨ Tạo thẻ mới</Button>
 </>)}
 <Button
 variant={showTrash? 'secondary': 'ghost'}
 onClick={() => setShowTrash(!showTrash)}
 >
 {showTrash? "📚 Quay lại thư viện thẻ": `🗑️ Thùng rác (${trashCards.length})`}
 </Button>
 </div>
 </div>

 {!showTrash && (<p className="text-xs text-slate-500 mb-4 -mt-3">Hỗ trợ nhập tệp JSON và hình ảnh card nhân vật PNG ở định dạng SillyTavern</p>)}

 {/* Trash view */}
 {showTrash && (<div className="mb-6">
 {trashCards.length > 0 && (<div className="flex items-center gap-3 mb-4">
 <Button variant="danger" size="sm" onClick={handleEmptyTrash}>🗑️ Dọn thùng rác</Button>
 <span className="text-xs text-slate-500">Thẻ đã xóa sẽ đi vào thùng rác và có thể được khôi phục bất kỳ lúc nào.</span>
 </div>)}
 {trashCards.length === 0 &&!loading && (<div className="text-center py-16 border border-dashed border-slate-700 rounded-xl">
 <p className="text-slate-400 text-lg mb-2">Thùng rác đang trống</p>
 <p className="text-slate-500 text-sm">Thẻ đã xóa sẽ xuất hiện ở đây</p>
 </div>)}
 <div className="space-y-3">
 {trashCards.map((card) => (<div
 key={card.id}
 className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-5 opacity-70"
 >
 <div className="flex items-start justify-between">
 <div className="flex-1 min-w-0">
 <h3 className="text-lg font-semibold text-slate-400 truncate">
 {card.name || 'Untitled'}
 </h3>
 <p className="text-xs text-slate-600 mt-1">Thời gian xóa:{formatDate(card.deletedAt || card.updatedAt)}
 </p>
 </div>
 <div className="flex items-center gap-2 ml-4 shrink-0">
 <Button
 variant="secondary"
 size="sm"
 onClick={() => handleRestore(card.id!)}
 >♻️Phục hồi</Button>
 <Button
 variant="danger"
 size="sm"
 onClick={() => setPermanentDeleteConfirm(card.id!)}
 >🗑️ Xóa hoàn toàn</Button>
 </div>
 </div>
 </div>))}
 </div>
 </div>)}

 {/* Normal card view (only when not in trash) */}
 {!showTrash && (<>

 {/* Search and sort bar */}
 <div className="flex gap-3 mb-6">
 <div className="flex-1">
 <TextInput
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 placeholder="Tìm kiếm tên thẻ..."
 />
 </div>
 <select
 value={sortBy}
 onChange={(e) => setSortBy(e.target.value as 'updatedAt' | 'name')}
 className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-200"
 >
 <option value="updatedAt">Sắp xếp theo ngày</option>
 <option value="name">Sắp xếp theo tên</option>
 </select>
 <Button
 variant="ghost"
 size="sm"
 onClick={() => setSortDir((d) => (d === 'asc'? 'desc': 'asc'))}
 >
 {sortDir === 'asc'? '↑': '↓'}
 </Button>
 </div>

 {/* Loading state */}
 {loading && (<div className="text-center py-12 text-slate-500">Đang tải thẻ...</div>)}

 {/* Empty state */}
 {!loading && filteredCards.length === 0 && (<div className="text-center py-16 border border-dashed border-slate-700 rounded-xl">
 <p className="text-slate-400 text-lg mb-2">
 {searchQuery? "Không có thẻ phù hợp": "Thư viện thẻ trống"}
 </p>
 <p className="text-slate-500 text-sm mb-4">
 {searchQuery? "Hãy thử các cụm từ tìm kiếm khác": "Tạo card nhân vật đầu tiên của bạn!"}
 </p>
 {!searchQuery && (<Button onClick={() => navigate('/wizard')}>✨ Tạo thẻ đầu tiên của bạn</Button>)}
 </div>)}

 {/* Card list */}
 <div className="space-y-3">
 {filteredCards.map((card) => {const data = (card.data || {}) as Record<string, unknown>;
 const meta = (card._meta || {}) as Record<string, unknown>;
 const charCount = Array.isArray(meta.characters)? meta.characters.length: 1;
 const lorebookEntries = ((data.character_book as Record<string, unknown>)?.entries as unknown[]) || [];
 const cardTags = (data.tags as string[]) || [];

 return (<div
 key={card.id}
 className="rounded-xl border border-slate-700 bg-slate-800/50 p-5 hover:border-slate-600 transition-colors"
 >
 <div className="flex items-start justify-between">
 <div className="flex-1 min-w-0">
 <h3 className="text-lg font-semibold text-white truncate">{card.name || 'Untitled'}</h3>
 <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
 <span>👤 {charCount} vai trò</span>
 <span>📖 {lorebookEntries.length} cài đặt</span>
 <span>🕐 {formatDate(card.updatedAt)}</span>
 </div>
 {cardTags.length > 0 && (<div className="flex flex-wrap gap-1 mt-1.5">
 {cardTags.slice(0, 6).map((tag, i) => (<span key={i} className="px-1.5 py-0.5 bg-slate-700 text-slate-400 text-[10px] rounded">
 {tag}
 </span>))}
 </div>)}
 {(data.description as string) && (<p className="mt-2 text-sm text-slate-400 line-clamp-2">{data.description as string}</p>)}
 </div>
 <div className="flex items-center gap-2 ml-4 shrink-0">
 <Button variant="secondary" size="sm" onClick={() => navigate(`/wizard/${card.id}`)}>✏️ Chỉnh sửa</Button>
 {/* Export dropdown */}
 <div className="relative">
 <Button
 variant="ghost"
 size="sm"
 onClick={() => setExportMenuCard(exportMenuCard?.id === card.id? null: (card as unknown as Record<string, unknown>),)}
 >
 📤
 </Button>
 {exportMenuCard?.id === card.id && (<div className="absolute right-0 top-full mt-1 w-48 rounded-lg border border-slate-600 bg-slate-800 shadow-xl z-10 py-1">
 <button
 className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-slate-700 transition-colors"
 onClick={() => handleExportJson(card as unknown as Record<string, unknown>)}
 >📄 Xuất JSON</button>
 <button
 className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-slate-700 transition-colors"
 onClick={() => handleExportPng(card as unknown as Record<string, unknown>)}
 >🖼️ Xuất PNG (được tạo tự động)</button>
 <button
 className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-slate-700 transition-colors"
 onClick={() => handleExportPngWithImage(card as unknown as Record<string, unknown>)}
 >🎨 Xuất PNG (chọn hình ảnh)</button>
 <div className="border-t border-slate-700 my-1" />
 <button
 className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-slate-700 transition-colors disabled:opacity-50"
 onClick={() => handleTranslateCard(card as unknown as Record<string, unknown>, 'zh')}
 disabled={translatingId === card.id}
 >🇨🇳 Dịch sang tiếng Trung Quốc</button>
 <button
 className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-slate-700 transition-colors disabled:opacity-50"
 onClick={() => handleTranslateCard(card as unknown as Record<string, unknown>, 'en')}
 disabled={translatingId === card.id}
 >
 🇬🇧 Translate to English
 </button>
 </div>)}
 </div>
 <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(card.id!)}>
 🗑️
 </Button>
 </div>
 </div>
 </div>);})}
 </div>

 </>)}

 {/* Delete confirmation modal (soft delete → trash) */}
 <Modal isOpen={deleteConfirm!== null} onClose={() => setDeleteConfirm(null)} title="Chuyển vào thùng rác">
 <p className="text-slate-300 mb-4">Bạn có chắc chắn muốn chuyển thẻ này vào thùng rác không? Bạn có thể khôi phục nó trong Thùng rác.</p>
 <div className="flex justify-end gap-2">
 <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>Hủy bỏ</Button>
 <Button variant="danger" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>Chuyển vào thùng rác</Button>
 </div>
 </Modal>

 {/* Permanent delete confirmation modal */}
 <Modal isOpen={permanentDeleteConfirm!== null} onClose={() => setPermanentDeleteConfirm(null)} title="Xóa hoàn toàn">
 <p className="text-red-300 mb-4">Bạn có chắc chắn muốn xóa hoàn toàn thẻ này không? Hành động này không thể hoàn tác được!</p>
 <div className="flex justify-end gap-2">
 <Button variant="ghost" onClick={() => setPermanentDeleteConfirm(null)}>Hủy bỏ</Button>
 <Button variant="danger" onClick={() => permanentDeleteConfirm && handlePermanentDelete(permanentDeleteConfirm)}>Xóa hoàn toàn</Button>
 </div>
 </Modal>
 </div>);}
