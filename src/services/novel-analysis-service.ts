import {callAIWithPrompt, callAIWithPromptStreaming, type StreamCallback} from './ai-service';
import {parseAIJson} from '../constants/prompts';
import {createEmptyLorebookEntry} from '../constants/defaults';
import type {LorebookEntry} from '../constants/defaults';

export const NOVEL_LOREBOOK_IMPORT_KEY = 'novel-analysis-lorebook-import';

export interface NovelChunk {id: number;
 title: string;
 content: string;
 start: number;
 end: number;}

export interface NovelLorebookMaterial {name: string;
 keys: string[];
 content: string;
 category: string;
 parent?: string;
 purpose?: string;}

export interface NovelAnalysisResult {summary: string;
 genre: string;
 tone: string;
 styleProfile: {narration: string;
 dialogue: string;
 pacing: string;
 imagery: string;
 taboos: string[];};
 characters: Array<{name: string;
 role: string;
 logicHub: string;
 traits: string[];
 appearance: string;
 outfits: Array<{scene: string; description: string}>;
 relationships: Array<{target: string; type: string; dynamic: string; evidence: string}>;
 evidence: string;}>;
 relationshipMap: Array<{source: string;
 target: string;
 relation: string;
 conflictOrBond: string;
 storyFunction: string;}>;
 uniqueSettings: Array<{name: string;
 category: string;
 description: string;
 difference: string;
 usage: string;}>;
 locations: Array<{name: string;
 description: string;
 significance: string;}>;
 factions: Array<{name: string;
 purpose: string;
 members: string[];}>;
 timeline: Array<{order: number;
 event: string;
 impact: string;}>;
 lorebookEntries: NovelLorebookMaterial[];
 cleaningNotes: string[];}

const CHAPTER_PATTERN = /(^|\n)(\s*(?:(?:chuong|chương|chapter|chap|phan|phần|hoi|hồi|tap|tập|quyen|quyển)\s*[\w\dIVXLCDM]+|\u7b2c[\u4e00-\u9fff\d]+[\u7ae0\u8282\u5377\u56de\u5e55\u90e8\u96c6]|\u756a\u5916|\u6954\u5b50|\u5e8f\u7ae0|\u7ec8\u7ae0|\u540e\u8bb0)[^\n]{0,60})/giu;
const NOVEL_SAMPLE_MAX_CHARS = 42000;
export const DEFAULT_NOVEL_OUTPUT_MAX_TOKENS = 16000;

export function splitNovelText(text: string, maxChunkChars = 12000): NovelChunk[] {const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
 if (!normalized) return [];

 const matches = Array.from(normalized.matchAll(CHAPTER_PATTERN));
 const chunks: NovelChunk[] = [];

 if (matches.length > 0) {for (let i = 0; i < matches.length; i++) {const current = matches[i];
 const next = matches[i + 1];
 const start = current.index?? 0;
 const end = next?.index?? normalized.length;
 const raw = normalized.slice(start, end).trim();
 const title = (current[2] || `chương ${i + 1}`).trim();
 pushSplitChunk(chunks, title, raw, start, maxChunkChars);}} else {pushSplitChunk(chunks, "khối 1", normalized, 0, maxChunkChars);}

 return chunks.map((chunk, index) => ({...chunk, id: index + 1}));}

function pushSplitChunk(chunks: NovelChunk[], title: string, content: string, start: number, maxChunkChars: number) {if (content.length <= maxChunkChars) {chunks.push({id: chunks.length + 1, title, content, start, end: start + content.length});
 return;}

 let offset = 0;
 while (offset < content.length) {const sliceEnd = Math.min(offset + maxChunkChars, content.length);
 let end = sliceEnd;
 if (sliceEnd < content.length) {const punctuation = content.lastIndexOf('\n', sliceEnd);
 if (punctuation > offset + maxChunkChars * 0.6) end = punctuation;}
 const part = content.slice(offset, end).trim();
 if (part) {const partNo = Math.floor(offset / maxChunkChars) + 1;
 chunks.push({id: chunks.length + 1,
 title: `${title} (${partNo})`,
 content: part,
 start: start + offset,
 end: start + end,});}
 offset = end;}}

export function buildNovelSample(chunks: NovelChunk[], maxChars = NOVEL_SAMPLE_MAX_CHARS): string {if (chunks.length === 0) return '';

 const selectedIndexes = new Set<number>();
 const anchors = [0, 1, Math.floor(chunks.length * 0.25), Math.floor(chunks.length * 0.5), Math.floor(chunks.length * 0.75), chunks.length - 2, chunks.length - 1];
 anchors.forEach((index) => {if (index >= 0 && index < chunks.length) selectedIndexes.add(index);});

 const selected = Array.from(selectedIndexes).sort((a, b) => a - b).map((index) => chunks[index]);
 const budgetPerChunk = Math.max(1800, Math.floor(maxChars / selected.length));

 return selected.map((chunk) => {const excerpt = chunk.content.length > budgetPerChunk? `${chunk.content.slice(0, budgetPerChunk)}\\n...(đoạn trích)`: chunk.content;
 return `# ${chunk.title}\n ${excerpt}`;}).join('\n\n---\n\n');}

export async function analyzeNovelText(title: string, chunks: NovelChunk[], outputMaxTokens = DEFAULT_NOVEL_OUTPUT_MAX_TOKENS): Promise<NovelAnalysisResult> {const sample = buildNovelSample(chunks);
 if (!sample) throw new Error("Vui lòng nhập hoặc tải lên văn bản tiểu thuyết trước");

 const system = `Bạn là chuyên gia trong việc giải nén có cấu trúc của "Văn bản tiểu thuyết → sổ thế giới SillyTavern". Mục tiêu của bạn không phải là viết một bài đánh giá chung mà là trực tiếp tạo ra một thư viện tài liệu có thể nhập vào world book.

Hướng cốt lõi:
- Chia theo cấu trúc của sổ thế giới, không trộn thành một phần lớn: nhân vật thuộc về nhân vật, ngoại hình thuộc về nhân vật, trang phục của nhân vật trong các cảnh khác nhau thuộc về trang phục, mối quan hệ của nhân vật thuộc về mối quan hệ, trung tâm logic của nhân vật thuộc về trung tâm logic, sự kiện thuộc về sự kiện, địa điểm thuộc về địa điểm, lực lượng thuộc về lực lượng, bối cảnh đặc biệt thuộc về bối cảnh đặc biệt và phong cách viết thuộc về phong cách viết.
- Cho phép tóm tắt sáng tạo hợp lý: các quy tắc ẩn, sự căng thẳng trong mối quan hệ, logic hành vi nhân vật và phong cách kể chuyện trong văn bản có thể được tóm tắt thành một cuốn sổ thế giới có thể sử dụng lại, nhưng phải dựa trên bằng chứng được trích xuất và không thêm các bối cảnh chưa từng nghe thấy.
- Các nhân vật quan trọng nên được chia thành nhiều sổ thế giới: ví dụ: "A - bối cảnh cốt lõi", "A - ngoại hình", "A - mặc quần áo cảnh", "A - logic hành vi", "A và B - căng thẳng trong mối quan hệ".
- Tập trung phân loại mạng lưới quan hệ của nhân vật: kiểu quan hệ, động lực cảm xúc, xung đột/lệ thuộc và chức năng tường thuật.
- Tập trung vào việc phân loại trung tâm logic của nhân vật: tại sao nhân vật lại hành động như vậy, mong muốn, nỗi sợ hãi, điểm mấu chốt, thành kiến ​​​​nhận thức và những mâu thuẫn chính.
- Tập trung trích xuất “cài đặt cụ thể”: chỉ đề cập đến những quy tắc, cơ chế thế giới, hệ thống tổ chức, vật phẩm, nghi lễ, điều cấm kỵ, hệ thống nghề nghiệp khác biệt với các mẫu văn bản web thông thường.
- Chú trọng trích rút phong cách viết: góc nhìn trần thuật, nhịp điệu câu, thói quen đối thoại, hệ thống hình ảnh, nền tảng cảm xúc, những vi phạm cần tránh.
- LorebookEntries là sản phẩm cuối cùng và số lượng có thể lớn. Tốt hơn là chia nhỏ nó ra hơn là nhét nó vào một mục lớn.
- Mỗi lorebookEntries.content sử dụng các trường, danh sách và đoạn văn ngắn rõ ràng, phù hợp để đưa vào sổ thế giới chứ không phải đánh giá cao văn xuôi.
- Khóa phải có ít nhất 2 ký tự, bao gồm tên người/bí danh/tên mối quan hệ/tên địa điểm/tên địa điểm, không được có từ kích hoạt một từ.
- Chỉ xuất JSON, không có khối mã đánh dấu.`;

 const user = `Tiêu đề tiểu thuyết: ${title || "Tiểu thuyết không tên"} Tổng số lần cắt: ${chunks.length} Tổng số từ: ${chunks.reduce((sum, chunk) => sum + chunk.content.length, 0)} Chiến lược lấy mẫu: lấy mẫu nhiều điểm ở đầu, trước, giữa, sau và cuối để bạn phân chia sổ thế giới có cấu trúc. ${sample} Vui lòng xuất JSON, phải tuân theo cấu trúc sau:
{"summary": "Tóm tắt cốt truyện/thế giới quan tổng thể, 200-500 từ",
 "thể loại": "loại",
 "giọng điệu": "không khí kể chuyện",
 "styleProfile": {"narration": "Quan điểm tường thuật, cấu trúc câu, mật độ thông tin",
 "dialogue": "Phong cách đối thoại, thói quen nói chuyện của nhân vật",
 "nhịp độ": "Nhịp điệu, điềm báo, phương pháp bùng nổ",
 "hình ảnh": "Những hình ảnh, từ ngữ mang bầu không khí, mô tả cảm giác thường được sử dụng",
 "điều cấm kỵ": ["Những phương pháp viết trái luật nên tránh khi viết tiếp"]},
 "nhân vật": [{"name": "Tên nhân vật",
 "vai trò": "định vị câu chuyện",
 "logicHub": "Trung tâm logic của hành động nhân vật: mong muốn/sợ hãi/điểm mấu chốt/mâu thuẫn/mô hình hành vi",
 "đặc điểm": ["Đặc điểm tính cách hoặc khả năng"],
 "ngoại hình": "Các điểm nhận dạng ngoại hình và cơ thể",
 "trang phục": [{"cảnh": "cảnh", "mô tả": "quần áo/thiết bị/trạng thái hình ảnh của cảnh này"}],
 "mối quan hệ": [{"mục tiêu": "đối tượng", "loại": "loại mối quan hệ", "động": "mối quan hệ căng thẳng và chế độ tương tác", "bằng chứng": "cơ sở"}],
 "bằng chứng": "Mô tả ngắn gọn về cơ sở ban đầu"}],
 "Bản đồ mối quan hệ": [{"nguồn": "Nhân vật A", "mục tiêu": "Nhân vật B", "quan hệ": "Mối quan hệ", "conflictOrBond": "Xung đột/Ràng buộc", "storyFunction": "Chức năng tường thuật"}],
 "Cài đặt duy nhất": [{"name": "Đặt tên", "danh mục": "Quy tắc/vật phẩm/hệ thống/khả năng/điều cấm kỵ/tổ chức/cơ chế thế giới", "description": "Đặt nội dung", "sự khác biệt": "Điều gì khiến nó khác với các mẫu văn bản web thông thường", "cách sử dụng": "Cách sử dụng văn bản hoặc sổ thế giới"}],
 "địa điểm": [{"tên": "Tên địa điểm", "mô tả": "Đặc điểm địa điểm", "ý nghĩa": "Tầm quan trọng của câu chuyện"}],
 "phe phái": [{"tên": "tên lực lượng", "mục đích": "mục đích/chức vụ", "thành viên": ["thành viên"]}],
 "dòng thời gian": [{"order": 1, "event": "event", "impact": "impact"}],
 "truyện truyền thuyếtEntries": [{"name": "Tên mục, ví dụ: A - bối cảnh cốt lõi / A - ngoại hình / A - trang phục cảnh / A và B - căng thẳng trong mối quan hệ / sự kiện nhất định - nhân quả / phong cách viết - đối thoại",
 "phím": ["từ kích hoạt"],
 "nội dung": "Văn bản của Sách Thế giới dựa trên trường và có thể được đưa vào trực tiếp. Chứa: định vị/điều kiện kích hoạt/sự kiện chính/ghi chú viết.",
 "danh mục": "Nhân vật/Ngoại hình nhân vật/Quần áo nhân vật/Mối quan hệ nhân vật/Logic nhân vật/Sự kiện/Địa điểm/Sức mạnh/Cài đặt đặc biệt/Phong cách/Làm sạch",
 "parent": "Người/địa điểm/sự kiện/khung cảnh thuộc về nó, có thể để trống",
 "mục đích": "Mục đích của mục này trong Sách Thế giới"}],
 "cleaningNotes": ["Các mẹo dọn dẹp như quảng cáo, ký tự bị cắt xén, thay thế chống trộm, định dạng bất thường, v.v. hoặc mảng trống"]}

Yêu cầu phân chia:
- Ít nhất hãy cố gắng tạo ra các nhân vật chính: cài đặt cốt lõi, ngoại hình, trạng thái trang phục/hình ảnh, logic hành vi và các mối quan hệ chính.
- Tạo riêng cuốn sổ thế giới "Mối quan hệ nhân vật" cho các mối quan hệ quan trọng, không chỉ nhồi nhét vào mục nhân vật.
- Các sự kiện quan trọng tạo ra những cuốn sổ thế giới “sự kiện” riêng biệt và ghi lại nguyên nhân, quá trình, kết quả và tác động.
- Cài đặt đặc biệt phải giải thích "tại sao chúng không phải là mẫu phổ quát".
- Phong cách viết phải tạo ra ít nhất một cuốn sổ thế giới riêng biệt cho lần sáng tạo tiếp theo để duy trì phong cách.`;

 const safeOutputMaxTokens = Math.min(Math.max(Math.floor(outputMaxTokens || DEFAULT_NOVEL_OUTPUT_MAX_TOKENS), 4000), 300000);
 const text = await callAIWithPrompt(system, user, {temperature: 0.7, max_tokens: safeOutputMaxTokens});
 const parsed = parseAIJson(text) as NovelAnalysisResult | null;
 if (!parsed) throw new Error("Nội dung do AI trả về không thể phân tích thành JSON, vui lòng thử lại hoặc giảm độ dài văn bản");

 return normalizeAnalysis(parsed);}

/**
 * Streaming version of analyzeNovelText.
 * Returns the parsed analysis result and calls onChunk for real-time progress display.
 * The onChunk callback receives the accumulated text so far — suitable for showing
 * a "Người sáng tạo không thể can thiệp" progress display.
 */
export async function analyzeNovelTextStreaming(title: string,
 chunks: NovelChunk[],
 outputMaxTokens: number,
 onChunk: StreamCallback,): Promise<NovelAnalysisResult> {const sample = buildNovelSample(chunks);
 if (!sample) throw new Error("Vui lòng nhập hoặc tải lên văn bản tiểu thuyết trước");

 const system = `Bạn là chuyên gia trong việc giải nén có cấu trúc của "Văn bản tiểu thuyết → sổ thế giới SillyTavern". Mục tiêu của bạn không phải là viết một bài đánh giá chung mà là trực tiếp tạo ra một thư viện tài liệu có thể nhập vào world book.

Hướng cốt lõi:
- Chia theo cấu trúc của sổ thế giới, không trộn thành một phần lớn: nhân vật thuộc về nhân vật, ngoại hình thuộc về nhân vật, trang phục của nhân vật trong các cảnh khác nhau thuộc về trang phục, mối quan hệ của nhân vật thuộc về mối quan hệ, trung tâm logic của nhân vật thuộc về trung tâm logic, sự kiện thuộc về sự kiện, địa điểm thuộc về địa điểm, lực lượng thuộc về lực lượng, bối cảnh đặc biệt thuộc về bối cảnh đặc biệt và phong cách viết thuộc về phong cách viết.
- Cho phép tóm tắt sáng tạo hợp lý: các quy tắc ẩn, sự căng thẳng trong mối quan hệ, logic hành vi nhân vật và phong cách kể chuyện trong văn bản có thể được tóm tắt thành một cuốn sổ thế giới có thể sử dụng lại, nhưng phải dựa trên bằng chứng được trích xuất và không thêm các bối cảnh chưa từng nghe thấy.
- Các nhân vật quan trọng nên được chia thành nhiều sổ thế giới: ví dụ: "A - bối cảnh cốt lõi", "A - ngoại hình", "A - mặc quần áo cảnh", "A - logic hành vi", "A và B - căng thẳng trong mối quan hệ".
- Tập trung phân loại mạng lưới quan hệ của nhân vật: kiểu quan hệ, động lực cảm xúc, xung đột/lệ thuộc và chức năng tường thuật.
- Tập trung vào việc phân loại trung tâm logic của nhân vật: tại sao nhân vật lại hành động như vậy, mong muốn, nỗi sợ hãi, điểm mấu chốt, thành kiến ​​​​nhận thức và những mâu thuẫn chính.
- Tập trung trích xuất “cài đặt cụ thể”: chỉ đề cập đến những quy tắc, cơ chế thế giới, hệ thống tổ chức, vật phẩm, nghi lễ, điều cấm kỵ, hệ thống nghề nghiệp khác biệt với các mẫu văn bản web thông thường.
- Chú trọng trích rút phong cách viết: góc nhìn trần thuật, nhịp điệu câu, thói quen đối thoại, hệ thống hình ảnh, nền tảng cảm xúc, những vi phạm cần tránh.
- LorebookEntries là sản phẩm cuối cùng và số lượng có thể lớn. Tốt hơn là chia nhỏ nó ra hơn là nhét nó vào một mục lớn.
- Mỗi lorebookEntries.content sử dụng các trường, danh sách và đoạn văn ngắn rõ ràng, phù hợp để đưa vào sổ thế giới chứ không phải đánh giá cao văn xuôi.
- Khóa phải có ít nhất 2 ký tự, bao gồm tên người/bí danh/tên mối quan hệ/tên địa điểm/tên địa điểm, không được có từ kích hoạt một từ.
- Chỉ xuất JSON, không có khối mã đánh dấu.`;

 const user = `Tiêu đề tiểu thuyết: ${title || "Tiểu thuyết không tên"} Tổng số lần cắt: ${chunks.length} Tổng số từ: ${chunks.reduce((sum, chunk) => sum + chunk.content.length, 0)} Chiến lược lấy mẫu: lấy mẫu nhiều điểm ở đầu, trước, giữa, sau và cuối để bạn phân chia sổ thế giới có cấu trúc. ${sample} Vui lòng xuất JSON, phải tuân theo cấu trúc sau:
{"summary": "Tóm tắt cốt truyện/thế giới quan tổng thể, 200-500 từ",
 "thể loại": "loại",
 "giọng điệu": "không khí kể chuyện",
 "styleProfile": {"narration": "Quan điểm tường thuật, cấu trúc câu, mật độ thông tin",
 "dialogue": "Phong cách đối thoại, thói quen nói chuyện của nhân vật",
 "nhịp độ": "Nhịp điệu, điềm báo, phương pháp bùng nổ",
 "hình ảnh": "Những hình ảnh, từ ngữ mang bầu không khí, mô tả cảm giác thường được sử dụng",
 "điều cấm kỵ": ["Những phương pháp viết trái luật nên tránh khi viết tiếp"]},
 "nhân vật": [{"name": "Tên nhân vật",
 "vai trò": "định vị câu chuyện",
 "logicHub": "Trung tâm logic của hành động nhân vật: mong muốn/sợ hãi/điểm mấu chốt/mâu thuẫn/mô hình hành vi",
 "đặc điểm": ["Đặc điểm tính cách hoặc khả năng"],
 "ngoại hình": "Các điểm nhận dạng ngoại hình và cơ thể",
 "trang phục": [{"cảnh": "cảnh", "mô tả": "quần áo/thiết bị/trạng thái hình ảnh của cảnh này"}],
 "mối quan hệ": [{"mục tiêu": "đối tượng", "loại": "loại mối quan hệ", "động": "mối quan hệ căng thẳng và chế độ tương tác", "bằng chứng": "cơ sở"}],
 "bằng chứng": "Mô tả ngắn gọn về cơ sở ban đầu"}],
 "Bản đồ mối quan hệ": [{"nguồn": "Nhân vật A", "mục tiêu": "Nhân vật B", "quan hệ": "Mối quan hệ", "conflictOrBond": "Xung đột/Ràng buộc", "storyFunction": "Chức năng tường thuật"}],
 "Cài đặt duy nhất": [{"name": "Đặt tên", "danh mục": "Quy tắc/vật phẩm/hệ thống/khả năng/điều cấm kỵ/tổ chức/cơ chế thế giới", "description": "Đặt nội dung", "sự khác biệt": "Điều gì khiến nó khác với các mẫu văn bản web thông thường", "cách sử dụng": "Cách sử dụng văn bản hoặc sổ thế giới"}],
 "địa điểm": [{"tên": "Tên địa điểm", "mô tả": "Đặc điểm địa điểm", "ý nghĩa": "Tầm quan trọng của câu chuyện"}],
 "phe phái": [{"tên": "tên lực lượng", "mục đích": "mục đích/chức vụ", "thành viên": ["thành viên"]}],
 "dòng thời gian": [{"order": 1, "event": "event", "impact": "impact"}],
 "truyện truyền thuyếtEntries": [{"name": "Tên mục, ví dụ: A - bối cảnh cốt lõi / A - ngoại hình / A - trang phục cảnh / A và B - căng thẳng trong mối quan hệ / sự kiện nhất định - nhân quả / phong cách viết - đối thoại",
 "phím": ["từ kích hoạt"],
 "nội dung": "Văn bản của Sách Thế giới dựa trên trường và có thể được đưa vào trực tiếp. Chứa: định vị/điều kiện kích hoạt/sự kiện chính/ghi chú viết.",
 "danh mục": "Nhân vật/Ngoại hình nhân vật/Quần áo nhân vật/Mối quan hệ nhân vật/Logic nhân vật/Sự kiện/Địa điểm/Sức mạnh/Cài đặt đặc biệt/Phong cách/Làm sạch",
 "parent": "Người/địa điểm/sự kiện/khung cảnh thuộc về nó, có thể để trống",
 "mục đích": "Mục đích của mục này trong Sách Thế giới"}],
 "cleaningNotes": ["Các mẹo dọn dẹp như quảng cáo, ký tự bị cắt xén, thay thế chống trộm, định dạng bất thường, v.v. hoặc mảng trống"]}

Yêu cầu phân chia:
- Ít nhất hãy cố gắng tạo ra các nhân vật chính: cài đặt cốt lõi, ngoại hình, trạng thái trang phục/hình ảnh, logic hành vi và các mối quan hệ chính.
- Tạo riêng cuốn sổ thế giới "Mối quan hệ nhân vật" cho các mối quan hệ quan trọng, không chỉ nhồi nhét vào mục nhân vật.
- Các sự kiện quan trọng tạo ra những cuốn sổ thế giới “sự kiện” riêng biệt và ghi lại nguyên nhân, quá trình, kết quả và tác động.
- Cài đặt đặc biệt phải giải thích "tại sao chúng không phải là mẫu phổ quát".
- Phong cách viết phải tạo ra ít nhất một cuốn sổ thế giới riêng biệt cho lần sáng tạo tiếp theo để duy trì phong cách.`;

 const safeOutputMaxTokens = Math.min(Math.max(Math.floor(outputMaxTokens || DEFAULT_NOVEL_OUTPUT_MAX_TOKENS), 4000), 300000);
 const text = await callAIWithPromptStreaming(system, user, onChunk, {temperature: 0.7, max_tokens: safeOutputMaxTokens});
 const parsed = parseAIJson(text) as NovelAnalysisResult | null;
 if (!parsed) throw new Error("Nội dung do AI trả về không thể phân tích thành JSON, vui lòng thử lại hoặc giảm độ dài văn bản");

 return normalizeAnalysis(parsed);}

function normalizeAnalysis(parsed: Partial<NovelAnalysisResult>): NovelAnalysisResult {return {summary: parsed.summary || '',
 genre: parsed.genre || '',
 tone: parsed.tone || '',
 styleProfile: {narration: parsed.styleProfile?.narration || '',
 dialogue: parsed.styleProfile?.dialogue || '',
 pacing: parsed.styleProfile?.pacing || '',
 imagery: parsed.styleProfile?.imagery || '',
 taboos: Array.isArray(parsed.styleProfile?.taboos)? parsed.styleProfile.taboos: [],},
 characters: Array.isArray(parsed.characters)? parsed.characters: [],
 relationshipMap: Array.isArray(parsed.relationshipMap)? parsed.relationshipMap: [],
 uniqueSettings: Array.isArray(parsed.uniqueSettings)? parsed.uniqueSettings: [],
 locations: Array.isArray(parsed.locations)? parsed.locations: [],
 factions: Array.isArray(parsed.factions)? parsed.factions: [],
 timeline: Array.isArray(parsed.timeline)? parsed.timeline: [],
 lorebookEntries: Array.isArray(parsed.lorebookEntries)? parsed.lorebookEntries: [],
 cleaningNotes: Array.isArray(parsed.cleaningNotes)? parsed.cleaningNotes: [],};}

export function exportAnalysisAsJson(title: string, chunks: NovelChunk[], analysis: NovelAnalysisResult): string {return JSON.stringify({title,
 generatedAt: new Date().toISOString(),
 chunkCount: chunks.length,
 totalChars: chunks.reduce((sum, chunk) => sum + chunk.content.length, 0),
 analysis,}, null, 2);}

export function analysisToLorebookEntries(analysis: NovelAnalysisResult): LorebookEntry[] {return analysis.lorebookEntries.map((entry, index) => {const category = entry.category || "vật liệu";
 const lore = createEmptyLorebookEntry();
 lore.name = entry.name || `Tài liệu mới lạ ${index + 1}`;
 lore.comment = `[Phân tích tiểu thuyết/${category}]${entry.parent? ` ${entry.parent}`: ''}${entry.purpose? ` - ${entry.purpose}`: ''}`;
 lore.keys = Array.isArray(entry.keys)? entry.keys.map((key) => key.trim()).filter((key) => key.length >= 2): [];
 lore.content = entry.content || '';
 lore.constant = category === "phong cách viết" || category === "Cài đặt đặc biệt";
 lore.enabled = true;
 lore.position = category === "phong cách viết" || category === "Cài đặt đặc biệt"? 'before_char': 'after_char';
 lore.insertion_order = categoryOrder(category, index);
 lore.priority = categoryPriority(category);
 lore.prevent_recursion = true;
 lore.match_whole_words = true;
 return lore;}).filter((entry) => entry.content.trim());}

function categoryOrder(category: string, index: number): number {const base: Record<string, number> = {"phong cách viết": 80,
 "Cài đặt đặc biệt": 120,
 "nhân vật": 300,
 "logic nhân vật": 320,
 "Ngoại hình nhân vật": 340,
 "Quần áo nhân vật": 360,
 "Mối quan hệ nhân vật": 380,
 "Địa điểm": 450,
 "quyền lực": 500,
 "sự kiện": 650,
 "Lau dọn": 900,};
 return (base[category]?? 550) + index;}

function categoryPriority(category: string): number {const priority: Record<string, number> = {"phong cách viết": 95,
 "Cài đặt đặc biệt": 90,
 "nhân vật": 85,
 "logic nhân vật": 85,
 "Mối quan hệ nhân vật": 82,
 "Ngoại hình nhân vật": 75,
 "Quần áo nhân vật": 70,
 "sự kiện": 70,
 "Địa điểm": 60,
 "quyền lực": 60,};
 return priority[category]?? 50;}

export function saveAnalysisLorebookImport(title: string, analysis: NovelAnalysisResult): LorebookEntry[] {const entries = analysisToLorebookEntries(analysis);
 sessionStorage.setItem(NOVEL_LOREBOOK_IMPORT_KEY, JSON.stringify({title,
 entries,
 createdAt: new Date().toISOString(),}));
 return entries;}

export function consumeAnalysisLorebookImport(): {title: string; entries: LorebookEntry[]} | null {const raw = sessionStorage.getItem(NOVEL_LOREBOOK_IMPORT_KEY);
 if (!raw) return null;
 sessionStorage.removeItem(NOVEL_LOREBOOK_IMPORT_KEY);

 try {const parsed = JSON.parse(raw) as {title?: string; entries?: LorebookEntry[]};
 if (!Array.isArray(parsed.entries)) return null;
 return {title: parsed.title || '',
 entries: parsed.entries,};} catch {return null;}}
