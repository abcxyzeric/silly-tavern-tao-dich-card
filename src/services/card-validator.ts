/**
 * Card Validator - validates a card against SillyTavern Character Card V2 spec.
 *
 * V2 Spec: https://github.com/malfoyslastname/character-card-spec-v2
 *
 * Returns errors (blocking) and warnings (non-blocking).
 */

interface ValidationResult {valid: boolean;
 errors: string[];
 warnings: string[];}

const VALID_POSITIONS = ['before_char',
 'after_char',
 'before_example',
 'after_example',
 'before_author',
 'after_author',
 'at_depth',];

function estimateTokens(text: string): number {return Math.round((text || '').length * 1.3);}

export function validateCard(card: Record<string, unknown>): ValidationResult {const errors: string[] = [];
 const warnings: string[] = [];

 // ── V2 envelope validation ──────────────────────────────────────────────
 if (!card.spec || card.spec!== 'chara_card_v2') {errors.push("Thiếu thông số kỹ thuật: \"chara_card_v 2\"");}

 if (!card.spec_version || card.spec_version!== '2.0') {errors.push("Thiếu spec_version: \"2.0\"");}

 const data = card.data as Record<string, unknown> | undefined;

 if (!data) {errors.push("đối tượng dữ liệu bị thiếu");
 return {valid: false, errors, warnings};}

 // ── Required V1 fields (nested in data) ────────────────────────────────
 if (!data.name || typeof data.name!== 'string') {errors.push("Tên thẻ (tên) là bắt buộc");}

 if (!data.description || typeof data.description!== 'string') {warnings.push("mô tả trống - vai trò có thể không được hiển thị chính xác");}

 if (!data.first_mes || typeof data.first_mes!== 'string') {warnings.push("phần mở đầu (first_mes) trống — cuộc trò chuyện sẽ không có phần mở đầu");}

 // personality, scenario, mes_example can be empty strings per spec
 if (data.personality!== undefined && typeof data.personality!== 'string') {warnings.push("tính cách phải thuộc loại chuỗi");}

 if (data.scenario!== undefined && typeof data.scenario!== 'string') {warnings.push("kịch bản phải có kiểu chuỗi");}

 // ── V2 specific fields ─────────────────────────────────────────────────
 // extensions must exist and default to {}
 if (data.extensions!== undefined && typeof data.extensions!== 'object') {errors.push("tiện ích mở rộng phải thuộc loại đối tượng");}

 // alternate_greetings should be an array
 if (data.alternate_greetings!== undefined &&!Array.isArray(data.alternate_greetings)) {warnings.push("alter_greetings phải là một mảng");}

 // tags should be an array of strings
 if (data.tags!== undefined) {if (!Array.isArray(data.tags)) {warnings.push("thẻ phải là một chuỗi các chuỗi");}}

 // ── character_book validation ──────────────────────────────────────────
 const charBook = data.character_book as Record<string, unknown> | undefined;
 if (charBook) {
  // character_book.extensions must exist
 if (charBook.extensions!== undefined && typeof charBook.extensions!== 'object') {warnings.push("character_book.extensions phải là một đối tượng");}

 if (charBook.entries && Array.isArray(charBook.entries)) {let constantTokenEstimate = 0;
 let enabledCount = 0;
 let disabledWithContentCount = 0;
 let emptyContentCount = 0;

 charBook.entries.forEach((entry: Record<string, unknown>, i: number) => {const entryName = (entry.name as string) || `lối vào ${i + 1}`;
 const keys = Array.isArray(entry.keys)? entry.keys as string[]: [];
 const secondaryKeys = Array.isArray(entry.secondary_keys)? entry.secondary_keys as string[]: [];
 const content = typeof entry.content === 'string'? entry.content: '';
 const enabled = entry.enabled!== false;
 const constant = entry.constant === true;
 const selective = entry.selective === true;
 const probability = entry.extensions && typeof entry.extensions === 'object'? ((entry.extensions as Record<string, unknown>).probability as number | undefined): undefined;

 if (enabled) enabledCount++;
 if (!enabled && content.trim()) disabledWithContentCount++;
 if (!content.trim()) emptyContentCount++;
 if (enabled && constant) constantTokenEstimate += estimateTokens(content);

 // keys: required for non-constant entries
 if (!entry.keys ||!Array.isArray(entry.keys)) {warnings.push(`Nhập sổ thế giới"${entryName}"Mảng khóa bị thiếu`);} else if (keys.length === 0 &&!constant) {warnings.push(`Nhập sổ thế giới"${entryName}" Không có từ khóa kích hoạt (các mục không phải hằng sẽ không được kích hoạt)`);}

 if (!constant && keys.some((key) => key.trim().length === 1)) {warnings.push(`Nhập sổ thế giới"${entryName}"Có một từ kích hoạt một ký tự, rất dễ kích hoạt nhầm.`);}

 if (selective && secondaryKeys.length === 0) {warnings.push(`Nhập sổ thế giới"${entryName}"chọn lọc được bật nhưng không có khóa_phụ`);}

 if (enabled && probability === 0) {warnings.push(`Nhập sổ thế giới"${entryName}" có xác suất là 0 và sẽ không kích hoạt ngay cả khi nó được bật.`);}

 // content: should not be empty
 if (!content.trim()) {warnings.push(`Nhập sổ thế giới"${entryName}"Nội dung trống`);}

 if (content.length > 2500) {warnings.push(`Nhập sổ thế giới"${entryName}"Nội dung dài (>2500 ký tự), nên chia thành nhiều mục`);}

 // insertion_order: should be a number
 if (entry.insertion_order!== undefined && typeof entry.insertion_order!== 'number') {warnings.push(`Nhập sổ thế giới"${entryName}"insert_order phải là số`);}

 // position validation
 if (entry.position &&!VALID_POSITIONS.includes(entry.position as string)) {warnings.push(`Nhập sổ thế giới"${entryName}" giá trị vị trí không hợp lệ`);}

 // entry.extensions must exist
 if (entry.extensions!== undefined && typeof entry.extensions!== 'object') {warnings.push(`Nhập sổ thế giới"${entryName}" phần mở rộng phải là đối tượng`);}});

 if (enabledCount === 0 && charBook.entries.length > 0) {warnings.push("Tất cả các mục Sách Thế giới đều bị vô hiệu hóa");}

 if (disabledWithContentCount > 0) {warnings.push(`${disabledWithContentCount} Các mục Sách Thế giới có nội dung bị vô hiệu hóa`);}

 if (emptyContentCount > 3) {warnings.push(`hiện hữu ${emptyContentCount} Các mục trong Sách Thế giới có nội dung trống, bạn nên làm sạch chúng trước khi xuất.`);}

 const tokenBudget = typeof charBook.token_budget === 'number'? charBook.token_budget: 1500;
 if (constantTokenEstimate > tokenBudget) {warnings.push(`Cuộc hẹn Sách Thế giới Thường trực ${constantTokenEstimate} Token, vượt quá ngân sách sổ thế giới hiện tại ${tokenBudget}`);}}}

 // Token count estimation warning
 if (typeof data.description === 'string' && data.description.length > 5000) {warnings.push("Mô tả quá dài (>5000 ký tự) - Nên chuyển chi tiết vào mục Sách Thế giới để lưu Token");}

 return {valid: errors.length === 0, errors, warnings};}
