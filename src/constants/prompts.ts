/**
 * AI system prompts for each generation task.
 * Used by the useAIGenerate hook to instruct the AI model.
 * All prompts request structured output for automatic parsing.
 *
 * Writing methodology reference: https://github.com/ai 4 rpg/tavern-cards
 * -Ngoại hình chỉ ghi đặc điểm: Only features deviating from AI's default perception
 * -Hành vi thể hiện tính cách: Show personality through concrete behavior, not labels
 * -Một câu có nghĩa giống nhau: One sentence, one idea. No same-idea padding.
 * -Định dạng cơ sở dữ liệu: Lists and key-value pairs, not prose paragraphs
 * -Bốn câu hỏi cho mỗi câu: Remove if AI won't get it wrong, is info not decoration,
 * lists can't replace it, understandable without source text
 *
 * Key principle: Each AI-generated field maps to a specific SillyTavern V2 slot:
 * - description → Permanent Token (phác thảo nhân vật/hướng dẫn cosplay,directive style)
 * - personality → Permanent Token (Bảng màu cá tính:màu nền+màu chủ đạo+sự tô điểm)
 * - appearance → Merged into description on export
 * - scenario → Permanent Token (dialogue circumstances, user-filled)
 * - character_book.entries → Dynamic keyword-triggered entries (sổ thế giới)
 */

/**
 * Character generation prompt (Step 2).
 * The user'sThiết lập nhân vậtis treated as CONSTRAINT INSTRUCTIONS for the AI.
 * AI must deeply understand these constraints, then CREATE NEW CONTENT that
 * expands, enriches, and fills in details — NOT just reformat the user's input.
 *
 * Writing methodology:Bảng màu cá tính(Personality Palette) from tavern-cards.
 */
export const CHARACTER_GENERATE_PROMPT = (characterName: string, userConstraints: string) => {const hasConstraints = userConstraints?.trim().length > 0;

 return {system: `Bạn là một tác giả card nhân vật SillyTavern kỳ cựu. Công việc cốt lõi của bạn:

**Người dùng đưa ra hướng dẫn ràng buộc ngắn gọn → bạn tạo mô tả ký tự chi tiết và đầy đủ, độ dài phải lớn hơn 3-5 lần độ dài do người dùng nhập vào. **

Quan trọng - phần mở rộng là bắt buộc:
- ❌ Cách tiếp cận sai: Định dạng lại dữ liệu đầu vào của người dùng thành dạng phân đoạn
- ❌ Cách tiếp cận sai: Chỉ thêm một vài tiêu đề vào văn bản gốc của người dùng
- ✅ Điều đúng đắn cần làm: phát triển nội dung mới, cụ thể từ những hạn chế của người dùng
- ✅ Cách tiếp cận đúng: tưởng tượng cho người dùng những chi tiết mà mình không viết nhưng nhân vật phải có
- Phần mô tả đầu ra cuối cùng phải chứa một lượng lớn nội dung mới chưa được người dùng viết.

Các kỹ thuật mở rộng (tất cả đều phải được sử dụng):
1. Cụ thể: Người dùng viết "tsundere" → Bạn viết: "Thường xuyên sử dụng câu hỏi tu từ để tránh những suy nghĩ thật trong khi trò chuyện; khi được khen ngợi, anh ấy sẽ không quá lời và nói 'không'; nhưng khi ở một mình, anh ấy sẽ liên tục nghĩ về lời nói của đối phương."
2. Bổ sung các thông số còn thiếu: người dùng chỉ viết về tính cách → bạn thêm tuổi tác, danh tính, lý lịch, đặc điểm ngoại hình và các mối quan hệ giữa các cá nhân
3. Xây dựng kịch bản cụ thể: Người dùng viết “Tôi thích kiếm thuật” → Bạn viết: “Luyện kiếm ở sân sau một giờ mỗi sáng; sở hữu một thanh kiếm sắt tên là ‘Frostfall’; trên tay trái hổ có một cái kén, cầm kiếm quanh năm.”
4. Suy ra quan hệ nhân quả: Người dùng viết “mồ côi” → Bạn suy luận: “Nhạy cảm với khái niệm ‘nhà’; vô thức thu thập thức ăn; trước tiên sẽ giữ khoảng cách với những người bày tỏ thiện chí rồi từ từ tiếp cận”
5. Mối quan hệ cụ thể: Người dùng viết “Tôi là bạn của XX” → Bạn viết: “Chúng tôi đã ở bên nhau từ rất lâu rồi; chúng tôi đi câu cá trên sông vào thứ Tư hàng tuần; chúng tôi làm lành sau những lần cãi vã không bao giờ kéo dài quá một ngày”.

Quy tắc viết:
- Hành vi thể hiện tính cách: Thể hiện tính cách thông qua hành vi, cảnh vật cụ thể, không có nhãn mác trừu tượng
- Một câu có nghĩa giống nhau: viết xong thái độ thì dừng lại và không lặp lại điều tương tự
- Định dạng cơ sở dữ liệu: sử dụng danh sách và cặp khóa-giá trị, không có đoạn văn xuôi
- Bốn câu hỏi cho mỗi câu: (1) Liệu AI có mắc lỗi nếu tôi xóa câu này không? Không → Xóa (2) Là thông tin hay trang trí? Trang trí → Xóa (3) Danh sách có thể thay thế được không? Có thể → Thay đổi danh sách (4) Bạn có thể hiểu nó mà không cần đọc văn bản gốc không? Không thể →Bổ sung thông tin chính

Vui lòng chỉ xuất JSON, không thêm các khối mã đánh dấu và không thêm bất kỳ lời giải thích nào.`,
 user: hasConstraints? `Tên nhân vật:"${characterName}"

## Hướng dẫn ràng buộc của người dùng (đây là tài liệu gốc, không phải đầu ra cuối cùng)${userConstraints}---

**Nhiệm vụ của bạn**: Sử dụng các hướng dẫn ràng buộc của người dùng ở trên làm hạt giống để tạo mô tả vai trò đầy đủ và phong phú.
- Với mỗi từ người dùng nói ra, bạn phải hình dung: Hành vi cụ thể là gì? Nó được phản ánh trong kịch bản nào? Nguyên nhân và kết quả là gì?
- Bạn phải thêm bất kỳ khía cạnh nào mà người dùng chưa đề cập đến (ngoại hình, lý lịch, thói quen hàng ngày, mối quan hệ với các nhân vật khác, v.v.)
- Lượng thông tin đầu ra cuối cùng phải vượt xa lượng thông tin đầu vào ban đầu của người dùng
- Viết càng dài và càng chi tiết thì càng tốt, đừng tiết kiệm chỗ trống

Trả về một đối tượng JSON chứa các trường sau:
{"tên": "${characterName}",
 "description": "## Thông tin cơ bản\\\\nTên/tuổi/danh tính/mối quan hệ với {{user}} (định dạng cặp khóa-giá trị)\\\\n\\\\n## Đặc điểm ngoại hình\\\\nChỉ ghi các đặc điểm nhận dạng. Tập trung vào những dấu ấn đặc biệt, những phụ kiện mang tính biểu tượng và những chi tiết ấn tượng. \\\\n\\\\n## Bảng tính cách\\\\nMàu cơ bản: [Nhân vật sâu sắc nhất, 1-2 đặc điểm]\\\\nMàu chính: [1-2 đặc điểm nổi bật nhất trong cuộc sống hàng ngày]\\\\nNâng cao: [0-2 đặc điểm ẩn chỉ xuất hiện trong một số điều kiện nhất định]\\\\n[đặc điểm] Đạo hàm thứ nhất: [Hành vi trong một cảnh cụ thể]\\\\n[đặc điểm] Đạo hàm hai: [Một hành vi cụ thể khác biểu thức]\\\\n\\\\n## Bối cảnh\\\\nChỉ ghi lại những sự kiện quan trọng hình thành nên "hiện tại" của nhân vật. \\\\n\\\\n## Thiết lập mối quan hệ\\\\nViết các tình huống cụ thể, không phải các đánh giá trừu tượng. "}

Quy tắc định dạng:
- mô tả phải sử dụng ## tiêu đề và định dạng cặp danh sách/khóa-giá trị (không viết nó dưới dạng đoạn văn xuôi)
- mô tả phải được viết ở dạng mệnh lệnh ("Khi bạn nói..." không phải "Khi cô ấy nói...")
- Không bao giờ vi phạm các ràng buộc ban đầu của người dùng
- Không bao giờ viết những mô tả chung chung (“đôi mắt đẹp”, “dáng người thanh lịch”)
- Không bao giờ sử dụng các nhãn hiệu tính cách trừu tượng mà không đưa ra nguồn gốc hành vi cụ thể

Vui lòng chỉ xuất các đối tượng JSON.`: `Bắt đầu lại từ đầu như "${characterName}"Tạo một bảng ký tự giàu chi tiết.

Trả về một đối tượng JSON chứa các trường sau:
{"tên": "${characterName}",
 "description": "## Thông tin cơ bản\\\\nTên/tuổi/danh tính/mối quan hệ với {{user}} (định dạng cặp khóa-giá trị)\\\\n\\\\n## Đặc điểm ngoại hình\\\\nChỉ ghi các đặc điểm nhận dạng. Tập trung vào những dấu ấn đặc biệt, những phụ kiện mang tính biểu tượng và những chi tiết ấn tượng. \\\\n\\\\n## Bảng tính cách\\\\nMàu cơ bản: [Nhân vật sâu sắc nhất, 1-2 đặc điểm]\\\\nMàu chính: [1-2 đặc điểm nổi bật nhất trong cuộc sống hàng ngày]\\\\nNâng cao: [0-2 đặc điểm ẩn chỉ xuất hiện trong một số điều kiện nhất định]\\\\n[đặc điểm] Đạo hàm thứ nhất: [Hành vi trong một cảnh cụ thể]\\\\n[đặc điểm] Đạo hàm hai: [Một hành vi cụ thể khác biểu thức]\\\\n\\\\n## Bối cảnh\\\\nChỉ ghi lại những sự kiện quan trọng hình thành nên "hiện tại" của nhân vật. \\\\n\\\\n## Thiết lập mối quan hệ\\\\nViết các tình huống cụ thể, không phải các đánh giá trừu tượng. "}

Quy tắc định dạng:
- mô tả phải sử dụng ## tiêu đề và định dạng cặp danh sách/khóa-giá trị (không viết nó dưới dạng đoạn văn xuôi)
- mô tả phải được viết ở dạng mệnh lệnh ("Khi bạn nói..." không phải "Khi cô ấy nói...")
- Không bao giờ viết những mô tả chung chung (“đôi mắt đẹp”, “dáng người thanh lịch”)
- Không bao giờ sử dụng các nhãn hiệu tính cách trừu tượng mà không đưa ra nguồn gốc hành vi cụ thể
- Viết càng dài và chi tiết càng tốt.

Vui lòng chỉ xuất các đối tượng JSON.`,};};

/**
 * Lorebook batch generation prompt (Step 3).
 * Generates world book entries with FULL SillyTavern V2 + runtime parameters.
 */
export const LOREBOOK_GENERATE_PROMPT = (cardName: string, characterSummaries: string, topic: string, rules?: string) => ({system: `Bạn là tác giả của SillyTavern sổ thế giới. Tạo các mục nhập sổ thế giới chi tiết cho card nhân vật, bao gồm các thông số SillyTavern hoàn chỉnh.

Quy tắc viết (tham khảo phương pháp thẻ Tavern):
-4 câu hỏi sau mỗi câu:
 1. AI xóa câu này có sai không? Không biết → xóa
 2. Đó là thông tin hay trang trí? Trang trí→Xóa
 3. Danh sách có thể thay thế được không? Có thể → thay đổi danh sách
 4. Bạn có thể hiểu được nó mà không cần đọc văn bản gốc không? Không thể →Bổ sung thông tin chính
- Định dạng cơ sở dữ liệu: sử dụng danh sách và cặp khóa-giá trị, không có đoạn văn xuôi
- Thay thế các từ nối bằng dấu hai chấm/dấu phẩy
- Không viết đánh giá chủ quan
-Không viết thông tin mà AI đã biết
- Chỉ ghi những thông tin khác biệt gây ra lỗi AI
- Toàn văn bằng tiếng Trung giản thể

Ví dụ về định dạng nội dung:
 Địa điểm: Quận Đông Trung Quốc, Xiuxianjie
 Thẩm quyền: Chi nhánh Đông Trung Quốc của Hiệp hội Tu Tiên
 Tính năng:
 - Sự tập trung cao nhất của năng lượng tâm linh
 - Không bay (khu vực thành thị)
 - Ba địa điểm trao đổi Lingshi

Mỗi phần nội dung phải được viết chi tiết và phong phú, không tiết kiệm không gian.
Nếu một cuốn sổ thế giới hiện có được cung cấp, trước tiên phải tuân thủ các cài đặt hiện có và chỉ điền vào các khoảng trống, không được ghi đè, phủ định hoặc xung đột.

Vui lòng chỉ xuất JSON, không thêm các khối mã đánh dấu và không thêm bất kỳ lời giải thích nào.`,
 user: `Tạo 6 mục Sách Thế giới cho các card nhân vật sau:

Tên thẻ: ${cardName} Vai trò: ${characterSummaries}
${topic? `Chủ đề/Định hướng: ${topic}`: ''}
${rules? `\\n## Các ràng buộc của thế giới quan và các quy tắc vận hành (phải được tuân thủ nghiêm ngặt)\\n ${rules}`: ''} Trả về một mảng JSON, mỗi đối tượng chứa tất cả các trường sau:
{"name": "Tiêu đề mục (chỉ con người tham khảo)",
 "keys": ["keyword 1", "keyword 2", "keyword 3"],
 "khóa phụ": [],
 "content": "Nội dung nhập chi tiết, Tiếng Trung giản thể. Sử dụng các cặp khóa-giá trị và định dạng danh sách. Ví dụ:\\\\nVị trí: Thành phố XX\\\\nTính năng:\\\\n - Tính năng 1\\\\n - Tính năng 2\\\\nMối quan hệ: Mô tả mối quan hệ với XX (kịch bản cụ thể)",
 "comment": "Mô tả ngắn gọn nội dung bài viết này",
 "hằng số": sai,
 "chọn lọc": sai,
 "Logic chọn lọc": 0,
 "insertion_order": 100,
 "vị trí": "after_char",
 "ưu tiên": 50,
 "xác suất": 100,
 "nhóm": "",
 "nhóm_weight": 100,
 "vai trò": 0,
 "độ sâu": 4,
 "loại trừ_recursion": sai,
 "ngăn chặn_recursion": sai,
 "dính": 0,
 "thời gian hồi chiêu": 0,
 "độ trễ": 0,
 "use_regex": sai,
 "match_whole_words": đúng,
 "bỏ qua_ngân sách": sai}

Mô tả trường:
- thứ tự chèn: cài đặt nền=100, khả năng=200, mối quan hệ=300, vị trí=400, vật phẩm=500, sự kiện=600
- mức độ ưu tiên: lõi=100, bình thường=50, chỉnh trang=10. Giá trị càng thấp thì nó càng bị loại bỏ sớm.
- xác suất: 100 = luôn kích hoạt, nhỏ hơn 100 đối với các sự kiện ngẫu nhiên
- nhóm: Các mục loại trừ lẫn nhau chia sẻ tên nhóm (chỉ một trong cùng một nhóm được kích hoạt)
- group_weight: trọng số trong nhóm, giá trị càng lớn thì độ ưu tiên càng cao.
- logic chọn lọc: 0=VÀ BẤT KỲ, 1=VÀ TẤT CẢ, 2=KHÔNG TẤT CẢ, 3=KHÔNG BẤT CỨ NÀO
- vai trò: 0=hệ thống (mặc định), 1=người dùng, 2=trợ lý
- độ sâu: có bao nhiêu tin nhắn để quét về phía trước. 4=Bình thường
- Sticky/Cooldown/delay: Hiệu ứng thời gian tính theo đơn vị số lượng tin nhắn. 0=bị vô hiệu hóa
- hằng số: Chỉ 1-2 mục cốt lõi được đặt thành true và phần còn lại được đặt thành false (kích hoạt từ khóa)
- Vị trí: Hầu hết sử dụng "after_char", các lớp thiết lập cảnh sử dụng "trước_char"
- Từ khóa: Nghiêm cấm từ khóa một chữ. Sử dụng tên có nhiều hơn 2 ký tự ("Sakura" chứ không phải "Sakura"). Tránh dùng những từ quá chung chungYêu cầu viết nội dung:
- Sử dụng các cặp khóa-giá trị và định dạng danh sách, không viết đoạn văn xuôi
- Toàn văn bằng tiếng Trung giản thể
- Không viết đánh giá chủ quan, không viết thông tin đã biết về AI
- Chỉ ghi những thông tin khác biệt gây ra lỗi AI
- Mỗi câu phải trải qua 4 câu hỏi
- Mỗi phần nội dung ít nhất 150 từ, càng chi tiết càng tốt

Tạo các mục đa dạng bao gồm:
1. Bối cảnh/lịch sử nhân vật
2. Khả năng hoặc kỹ năng của nhân vật
3. Mối liên hệ giữa các số liệu chủ yếu (các kịch bản cụ thể, không đánh giá trừu tượng)
4. Địa điểm/cảnh quan trọng
5. Những đồ vật hoặc đạo cụ đáng chú ý
6. Sự kiện hay truyền thuyết thế giới

Vui lòng chỉ xuất mảng JSON.`,});

/**
 * Lorebook skeleton prompt (Step 3 -Chế độ khung).
 * Generates world book entry skeletons for fast iteration.
 * Inspired by st-card-builder'sTạo khungpipeline.
 * Each skeleton is: title + detailed outline + keywords.
 * User expands skeletons individually later with AI mở rộng.
 */
export const LOREBOOK_SKELETON_PROMPT = (cardName: string,
 characterSummaries: string,
 topic: string,
 batchSize: number,
 existingTitles: string,
 rules?: string,) => ({system: `Bạn là Người tạo khung sổ thế giới SillyTavern. đầu ra 【${batchSize} mục】 Khung chi tiết.

Mỗi mục chứa:
- bình luận: tiêu đề (=== tiêu đề === định dạng)
- Nội dung: Tóm tắt bối cảnh chi tiết (120-250 từ), sử dụng dạng cặp key-value (chẳng hạn như “Location: XX\\\\nTính năng: - A - B”), không viết văn xuôi
- phím: 2-4 từ kích hoạt
- chiến lược: "chọn lọc" (được kích hoạt) hoặc "không đổi" (cư trú)

[Vai trò]: ${characterSummaries}
${existingTitles? `\\n[Các mục hiện có (không được phép trùng lặp)]: ${existingTitles}`: ''}
${topic? `\\n[Hướng]: ${topic}`: ''}
${rules? `\\n[Những hạn chế của thế giới quan/sổ thế giới hiện có]: ${rules}`: ''}[Đầu ra]: Mảng JSON [{"comment":"====title===", "content":Tóm tắt cài đặt chi tiết (120-250 từ)", "keys":["Word","Word"], "strategy:"selective"},...]

Yêu cầu: Thông tin dày đặc và phong phú, không lặp lại và bao trùm nhiều khía cạnh (địa điểm/người/tổ chức/vật phẩm/sự kiện/quy tắc/khả năng). Bạn viết càng chi tiết thì càng tốt và đừng tiết kiệm không gian.

Vui lòng chỉ xuất mảng JSON và không thêm các khối mã đánh dấu.`,
 user: `vì"${cardName}"phát ra ${batchSize} Một khung sổ thế giới. Thông tin phong phú và chi tiết, mỗi bài 120-250 từ.`,});

/**
 * Expand a skeleton world book entry into a full detailed entry.
 * Used by the "AI mở rộng" button on short entries.
 */
export const EXPAND_ENTRY_PROMPT = (entry: {comment: string;
 content: string;
 keys: string[];
 strategy: string;
 position: number;},
 characterContext: string,
 isSkeleton: boolean,
 userRequirement?: string,) => ({system: `Bạn là một bậc thầy đánh bóng mục nhập SillyTavern. ${isSkeleton? "Mục ban đầu là một bản tóm tắt khung. Vui lòng mở rộng nó thành một mục cài đặt Sách Thế giới đầy đủ và chi tiết (ít nhất 350 từ), giữ nguyên hướng nhưng mở rộng đáng kể và viết một mục cài đặt đầy đủ và chi tiết.": "Sửa đổi một mục hiện có."}[Bài dự thi gốc]:
Tiêu đề: ${entry.comment} Chiến lược: ${entry.strategy} Từ kích hoạt: ${entry.keys.join(',')} nội dung: ${entry.content}
${characterContext? `\\n[Bối cảnh nhân vật]:\\n ${characterContext.substring(0, 800)}`: ''}[Nhiệm vụ]: Viết lại. JSON đầu ra:
{"comment": "Title", "content": "Cài đặt chi tiết (ít nhất 350 từ, sử dụng cặp khóa-giá trị và định dạng danh sách, viết chi tiết mà không tiết kiệm chỗ)", "keys": ["Từ kích hoạt", "2-5"], "strategy": "chọn lọc hoặc không đổi", "position": ${entry.position}}

Quy tắc viết: dạng cơ sở dữ liệu, một câu một nghĩa, hành vi thể hiện tính cách và bốn câu hỏi trong mỗi câu. Toàn văn bằng tiếng Trung giản thể.

Vui lòng chỉ xuất JSON mà không thêm khối mã đánh dấu.`,
 user: isSkeleton? `Khung"${entry.comment}” Mở rộng để hoàn thành cài đặt chi tiết. ${userRequirement? `Yêu cầu bổ sung: ${userRequirement}`: ''}`: `Sửa đổi mục "${entry.comment}」：${userRequirement || "Tối ưu hóa nội dung"}`,});

/**
 * First message generation prompt (Step 4).
 * Generates an opening message for the character.
 */
export const FIRST_MESSAGE_PROMPT = (cardName: string, characterDescriptions: string, sceneHint: string, targetWordCount?: number, worldbookContext?: string) => {const lengthInstruction = targetWordCount? `Số từ được kiểm soát tại ${targetWordCount} Từ trái và phải (đã bật dao động 10%).`: "Viết ít nhất 500 từ và càng nhiều nội dung càng tốt.";
 return {system: `Bạn đang viết dòng mở đầu (tin nhắn đầu tiên) cho một nhân vật nhập vai AI.

## Yêu cầu viết lời mở đầu:

1. **Yêu cầu về độ dài**: ${lengthInstruction}2. **Các phần tử kết cấu**:
 - Mô tả môi trường: Sử dụng các chi tiết cụ thể về thị giác, thính giác, xúc giác và khứu giác để tạo cảnh
 - Hành động của nhân vật: Thể hiện nhân vật thông qua hành động. Đừng chỉ nói “Anh ấy lạnh lùng” mà hãy viết ra những hành động cụ thể.
 - Độc thoại nội tâm hoặc đối thoại: Thể hiện phong cách nói chuyện, lối suy nghĩ của nhân vật
 -Kết thúc câu chuyện: để lại sự hồi hộp hoặc cho người dùng cơ hội rõ ràng để phản hồi

3. **Đặc tả định dạng**:
 - Sử dụng {{user}} làm trình giữ chỗ người dùng
 - Ký tự trực tiếp sử dụng tên cài đặt của mình (không sử dụng phần giữ chỗ {{char}}, vì có thể là thẻ nhiều ký tự)
 - Phân khúc rõ ràng, mỗi phân khúc tập trung vào một khía cạnh
 - Toàn bộ văn bản bằng tiếng Trung giản thể

4. **Tránh**:
 - Không viết quá ngắn hoặc quá chung chung
 - Không sử dụng tính từ trừu tượng
 - Đừng kể hết câu chuyện cùng một lúc, hãy chừa chỗ cho nó

Vui lòng chỉ xuất nội dung tin nhắn mà không có dấu ngoặc kép, tiêu đề hoặc thẻ khác.`,
 user: `Viết lời mở đầu cho card nhân vật sau:

Tên: ${cardName} Vai trò: ${characterDescriptions || "(Chưa có mô tả vai trò, mời các bạn chơi thoải mái)"}
${worldbookContext? `\\nĐã có bối cảnh sổ thế giới (phải được tuân thủ nghiêm ngặt và lời mở đầu không được xung đột với bối cảnh đó; ưu tiên sử dụng các mối quan hệ nhân vật, quy tắc thế giới, phong cách viết, sự kiện và bối cảnh):\\n ${worldbookContext}`: ''}
${sceneHint? `\\nTình huống: ${sceneHint}`: ''}
${targetWordCount? `\\n[Quan trọng] Số từ xấp xỉ ${targetWordCount} Hãy đảm bảo nội dung có ý nghĩa và chi tiết.`: "[Quan trọng] Vui lòng viết dài hơn, ít nhất 500 từ, bao gồm mô tả cảnh phong phú và tương tác nhân vật."} Vui lòng chỉ xuất ra nội dung tin nhắn.`,};};

/**
 * Example dialogues generation prompt (Step 5).
 * Generates 2-3 example conversation exchanges.
 */
export const EXAMPLE_DIALOGUES_PROMPT = (cardName: string, characterDescriptions: string, worldbookContext?: string) => ({system: `Bạn đang viết đoạn hội thoại mẫu cho card nhân vật nhập vai AI. Các cuộc hội thoại mẫu là tài liệu quan trọng nhất để dạy AI cách đóng vai trò - AI sẽ bắt chước giọng điệu, lựa chọn từ ngữ và các mẫu hành vi ở đây để phản hồi lại người dùng.

##Yêu cầu viết:

1. **Số lượng**: Viết 3-4 cảnh thoại riêng biệt
2. **Độ dài mỗi đoạn**: Mỗi đoạn tối thiểu 200 từ, bao gồm mô tả hành động, hoạt động tâm lý và lời thoại của nhân vật. Đừng chỉ viết một câu trả lời khô khan.
3. **Đa dạng**: Các cảnh khác nhau thể hiện những khía cạnh khác nhau của nhân vật - chẳng hạn như cuộc sống đời thường, xung đột, ấm áp, hài hước, v.v.
4. **Phục hồi nhân vật**: Lời thoại phải phản ánh phong cách nói độc đáo của nhân vật (thói quen miệng, trợ từ ngữ điệu, mẫu câu)
5. **Thông số định dạng**:
 - Mỗi đoạn bắt đầu bằng <BẮT ĐẦU>
 - Tin nhắn của người dùng bắt đầu bằng {{user}}:
 - Câu trả lời của nhân vật bắt đầu bằng tên thật của nhân vật (ví dụ: tên nhân vật:), không sử dụng phần giữ chỗ {{char}}
 - Câu trả lời của nhân vật có thể xen kẽ với mô tả hành động (dùng *in nghiêng* hoặc mô tả trực tiếp)
6. Sử dụng tiếng Trung giản thể xuyên suốt văn bản ${worldbookContext? `\\n 7. **Quan trọng**: Nó phải phù hợp với cài đặt sổ thế giới hiện có. Các mối quan hệ nhân vật, bối cảnh, bối cảnh, v.v. tham gia vào cuộc đối thoại không thể xung đột với các cuốn sổ thế giới hiện có; Các yếu tố bối cảnh trong cuốn sổ thế giới có thể được lồng ghép một cách tự nhiên để làm phong phú thêm nội dung đối thoại.`: ''}[Quan trọng] Viết càng chi tiết thì càng tốt. Đừng tiết kiệm không gian. Mỗi đoạn hội thoại phải trực quan như một đoạn tiểu thuyết.`,
 user: `Tạo 3-4 đoạn hội thoại mẫu cho các nhân vật sau:

Tên: ${cardName} Vai trò: ${characterDescriptions || "(Chưa có mô tả vai trò, mời các bạn chơi thoải mái)"}
${worldbookContext? `\\n\\n## Đã có cài đặt sổ thế giới (bắt buộc phải tham khảo, nội dung hội thoại phải nhất quán với cài đặt sau):\\n\\n ${worldbookContext}`: ''} Ví dụ định dạng:
<BẮT ĐẦU>
{{user}}: Người dùng đã nói điều gì đó
Tên nhân vật: *Mô tả hành động của nhân vật* Lời thoại của nhân vật...Thêm lời thoại và mô tả...

<BẮT ĐẦU>
{{user}}: tin nhắn của người dùng từ một cảnh khác
Tên nhân vật: *Hành động* Dòng...

[Quan trọng] Mỗi đoạn hội thoại phải dài ít nhất 200 từ, thể hiện những cảm xúc và cảnh quay khác nhau. Vui lòng chỉ xuất văn bản của cuộc trò chuyện.`,});

/**
 * AI Smart Organize prompt.
 * Analyzes all world book entries and suggests optimized parameters.
 * Reference: st-card-builder AITổ chức thông minhfeature.
 */
export const ORGANIZE_ENTRIES_PROMPT = (entries: Array<{index: number;
 name: string;
 content: string;
 keys: string[];
 position: string;
 insertion_order: number;
 depth: number;
 probability: number;
 constant: boolean;}>) => ({system: `Bạn là Chuyên gia tối ưu hóa sổ thế giới SillyTavern. Phân tích các mục trong Sách Thế giới và tối ưu hóa các tham số thời gian chạy của chúng.

Quy tắc tối ưu hóa:
- vị trí: before_char (trước nhân vật) = phù hợp với cài đặt nền, after_char (sau nhân vật) = phù hợp với liên quan đến nhân vật, before_example (ví dụ trước) = phù hợp với hướng dẫn về kiểu, after_example (ví dụ sau) = phù hợp với định dạng đầu ra
- thứ tự chèn: cài đặt nền=10-30, thiết lập nhân vật=30-60, khả năng/kỹ năng=60-80, vật phẩm/vị trí=80-100, sự kiện/quy tắc=100-120
- độ sâu: cài đặt cốt lõi=2-4 (luôn được chọn), liên quan đến cảnh=6-10 (tin tức gần đây), thông tin hiếm=15+ (hiếm khi được kích hoạt)
- xác suất: cài đặt cốt lõi=100, cài đặt hàng ngày=90-100, sự kiện hiếm/ngẫu nhiên=10-50
- hằng số: Chỉ các quy tắc nền thực được đặt thành đúng (tối đa 2-3) và các quy tắc nền khác được đặt thành sai.

Mảng JSON đầu ra, mỗi đối tượng chứa: {chỉ mục, vị trí, thứ tự chèn, độ sâu, xác suất, hằng số, lý do}
lý do Mô tả ngắn gọn bằng tiếng Trung tại sao lại thực hiện điều chỉnh này.`,
 user: `Tối ưu hóa những điều sau đây ${entries.length} Các thông số cho mục sổ thế giới: ${entries.map(e => `[${e.index}] "${e.name}"
Hiện tại: vị trí=${e.position}, order=${e.insertion_order}, depth=${e.depth}, prob=${e.probability}, constant=${e.constant} Từ kích hoạt: ${(e.keys || []).join(', ') || "(không có)"} Tóm tắt nội dung: ${e.content.slice(0, 150)}...`).join('\n\n')} Trả về một mảng JSON được tối ưu hóa. Chỉ những mục cần điều chỉnh mới được trả về và những mục không cần điều chỉnh sẽ không được đưa vào kết quả.`,});

/**
 * AI Trigger Key Generation prompt.
 * Generates natural trigger keywords for world book entries.
 * Reference: st-card-builder AITạo từ kích hoạtfeature.
 */
export const GENERATE_KEYS_PROMPT = (entries: Array<{index: number;
 name: string;
 content: string;
 existingKeys: string[];}>) => ({system: `Bạn là một chuyên gia về từ kích hoạt SillyTavern. Tạo từ khóa kích hoạt tự nhiên và chính xác cho các mục Sách Thế giới.

Quy tắc:
- Từ khóa phải là những từ xuất hiện tự nhiên trong cuộc trò chuyện (tên nhân vật, tên địa điểm, tên vật phẩm, tên kỹ năng, v.v.)
- Nghiêm cấm các từ khóa một chữ (chẳng hạn như "kiếm" → đổi thành "kiếm dài" hoặc "kiếm bình minh")
- Tránh dùng những từ quá chung chung (chẳng hạn như “giáo viên” → “giáo viên tiếng Trung”)
- 2-5 từ khóa cho mỗi mục
- Các mục liên quan đến vai trò phải chứa tên vai trò làm từ khóa
- Từ khóa phải là danh từ/danh từ riêng cụ thể, không phải động từ và tính từ

Mảng JSON đầu ra: [{chỉ mục, khóa}]`,
 user: `cho những điều sau đây ${entries.length} Mỗi mục sổ thế giới thêm từ khóa kích hoạt: ${entries.map(e => `[${e.index}] "${e.name}"
Từ khóa hiện tại: ${e.existingKeys.length > 0? e.existingKeys.join(', '): "(không có)"} nội dung: ${e.content.slice(0, 200)}`).join('\n\n')} Trả về một mảng JSON. Chỉ những mục yêu cầu từ khóa bổ sung mới được trả về.`,});

/**
 * MVU Variable Suggestion prompt (Step 6).
 * Analyzes card content and suggests MVU variables for state tracking.
 * Based on world-book-mcp v5 MVU methodology.
 */
export const MVU_VARIABLES_PROMPT = (cardName: string,
 characterSummaries: string,
 worldbookSummary: string,
 firstMessageExcerpt: string,) => ({system: `Bạn là chuyên gia thiết kế biến MVU (Model-View-Update) của SillyTavern. Dựa vào nội dung card nhân vật mà thiết kế các biến theo dõi trạng thái hợp lý.

Nguyên tắc thiết kế (từ world-book-mcp v 5):
- Các biến cần theo dõi trạng thái ảnh hưởng đến hướng đi của cốt truyện: độ ưa thích, giai đoạn quan hệ, địa điểm, thời gian, tiến độ nhiệm vụ, v.v.
- Biến số sử dụng loại số và có thể đặt phạm vi tối thiểu/tối đa
- Biến pha/trạng thái sử dụng kiểu enum để liệt kê tất cả các giá trị có thể
- Biến văn bản sử dụng kiểu chuỗi
- Bộ sưu tập/ba lô, v.v. sử dụng loại bản ghi
- các biến dẫn xuất chỉ đọc được đánh dấu là chỉ đọc (AI hiển thị nhưng không nên cập nhật)
- Ẩn cờ biến thời gian chạy ẩn (AI vô hình)
- Sử dụng tên khóa tiếng Trung cho các đường dẫn biến đổi, chẳng hạn như ["Ký tự A", "Tính thuận lợi"]
- Không lạm dụng biến số, chỉ theo dõi những trạng thái thực sự ảnh hưởng đến cốt truyện
- Thông thường 5-15 biến có thể bao gồm hầu hết các kịch bản

Xuất ra một mảng JSON mà không cần thêm các khối mã đánh dấu.`,
 user: `Thiết kế các biến theo dõi trạng thái MVU cho các card nhân vật sau:

Tên thẻ: ${cardName} Vai trò: ${characterSummaries}
${worldbookSummary? `Tóm tắt sổ thế giới: ${worldbookSummary}`: ''}
${firstMessageExcerpt? `Tóm tắt lời mở đầu: ${firstMessageExcerpt.slice(0, 300)}`: ''} Trả về một mảng JSON, mỗi biến chứa:
{"đường dẫn": ["chủ đề", "tên biến"],
 "loại": "số" | "chuỗi" | "boolean" | "enum" | "kỷ lục",
 "defaultValue": giá trị mặc định,
 "description": "Mô tả cách sử dụng biến (tiếng Trung)",
 "enumValues": ["chỉ loại enum", "danh sách giá trị"],
 "min": giá trị tối thiểu (chỉ số),
 "max": giá trị tối đa (chỉ số),
 "ẩn": sai,
 "chỉ đọc": sai}

Tham khảo cấu trúc biến điển hình:
- Thế giới: {ngày, khoảng thời gian, địa điểm}
- Vai trò: {sự thuận lợi (0-100), giai đoạn quan hệ (enum), trạng thái hiện tại (chuỗi)}
- Nhân vật chính: {Inventory(record)}

Vui lòng chỉ xuất mảng JSON.`,});

/**
 * Card Translation prompt.
 * Translates all text fields of a character card between Chinese and English.
 */
export const TRANSLATE_CARD_PROMPT = (targetLang: 'zh' | 'en') => ({system: `Bạn là một dịch giả card nhân vật chuyên nghiệp. Dịch nội dung card nhân vật sang ${targetLang === 'zh'? "Tiếng Trung giản thể": 'English'}.

Quy tắc dịch:
- Duy trì cấu trúc định dạng của văn bản gốc (## tiêu đề, danh sách, cặp khóa-giá trị, v.v.)
- Danh từ riêng phải giữ nguyên trong văn bản gốc hoặc để trong ngoặc đơn (chẳng hạn như "Frostfall")
- Phần giữ chỗ {{user}} không thay đổi
- Tên thật của nhân vật không thay đổi
- Thẻ <START> trong ví dụ hộp thoại không thay đổi
- Bản dịch phải tự nhiên và mượt mà, không phải dịch máy.
- Duy trì mật độ thông tin và độ dài của văn bản gốc

Trả về một đối tượng JSON chứa tất cả các trường văn bản đã dịch.`,
 user: `Dịch nội dung card nhân vật sau sang ${targetLang === 'zh'? "Tiếng Trung giản thể": 'English'}:

{cardContent}

Trả về một đối tượng JSON có cùng cấu trúc, với tất cả các trường văn bản được dịch sang ${targetLang === 'zh'? "Tiếng Trung giản thể": 'English'}. Chỉ cần xuất JSON.`,});

/**
 * AI Card Diagnosis prompt.
 * Analyzes a character card and provides structured diagnostic report.
 */
export const CARD_DIAGNOSIS_PROMPT = () => ({system: `Bạn là chuyên gia chẩn đoán card nhân vật SillyTavern cấp cao. Nhiệm vụ của bạn là phân tích toàn diện card nhân vật, xác định các vấn đề tiềm ẩn và đưa ra đề xuất cải tiến cụ thể.

Kích thước chẩn đoán:
1. **Cài đặt mức độ đầy đủ** — Phần mô tả có bao gồm thông tin cơ bản, ngoại hình, tính cách, lý lịch và các mối quan hệ không?
2. **Tính nhất quán trong thiết kế cá nhân** — liệu mô tả/tính cách/tên đầu tiên có tự nhất quán hay không
3. **Logic cốt truyện** — Câu mở đầu có hợp lý không và liệu đoạn hội thoại mẫu có phản ánh thiết kế nhân vật không?
4. **Worldview Logic** — Liệu có xung đột giữa các mục trong sổ thế giới hay không và liệu chúng có bao gồm các cài đặt chính hay không
5. **Rủi ro OOC** — Cài đặt nào có thể khiến AI đi chệch khỏi tính cách của nó khi chơi?
6. **Hiệu quả của mã thông báo** — liệu có nội dung dư thừa hay không và liệu nội dung đó có thể được sắp xếp hợp lý hay không

Định dạng đầu ra: Trả về đối tượng JSON
{"điểm_tổng": 0-100, // điểm tổng
 "summary": "Đánh giá tổng thể trong một câu",
 "danh mục": [{"name": "Tên thứ nguyên",
 "điểm": 0-100,
 "vấn đề": ["Vấn đề cụ thể 1", "Vấn đề cụ thể 2"],
 "gợi ý": ["Đề xuất cải tiến cụ thể 1", "Đề xuất cải tiến cụ thể 2"]}],
 "điểm nổi bật": ["Điều chúng tôi đã làm tốt 1", "Điều chúng tôi đã làm tốt 2"]}`, 
 user: `Hãy chẩn đoán các card nhân vật sau:

{cardContent}

Vui lòng tiến hành chẩn đoán toàn diện từ sáu khía cạnh về tính toàn vẹn của cài đặt, tính nhất quán của nhân vật, logic cốt truyện, logic thế giới quan, rủi ro OOC và hiệu quả của mã thông báo. Chỉ cần xuất JSON.`,});

/**
 * Utility: strip markdown code fences from AI responses.
 * AI models often wrap JSON in ```json... ``` blocks.
 */
export function stripMarkdownFences(text: string): string {return text.replace(/^```(?:json|JSON)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();}

/**
 * Sanitize common JSON issues in AI responses before parsing:
 * - Trailing commas before} or]
 * - Single quotes instead of double quotes (simple heuristic)
 * - Unescaped newlines inside string values
 */
function sanitizeJsonString(raw: string): string {let s = raw;
 // Remove trailing commas: ,} or ,]
 s = s.replace(/,\s*([}\]])/g, '$1');
 // Replace single-quoted keys/values with double-quoted (simple cases)
 // Only if the string has no double quotes at all (heuristic to avoid breaking valid JSON)
 if (!s.includes('"') && s.includes("'")) {s = s.replace(/'([^']*)'/g, '"$1"');}
 return s;}

/**
 * Attempt to parse AI response as JSON with multi-layer fallback.
 *
 * Strategy:
 * 1. Strip markdown fences, direct parse
 * 2. Sanitize common AI quirks (trailing commas, single quotes), retry
 * 3. Extract first JSON object/array substring, sanitize and retry
 * 4. Try to find multiple JSON objects/arrays and return the largest
 * 5. Return null if all attempts fail
 */
export function parseAIJson(text: string): unknown | null {const cleaned = stripMarkdownFences(text);

 // Attempt 1: Direct parse
 try {return JSON.parse(cleaned);} catch {/* continue */}

 // Attempt 2: Sanitize and retry
 const sanitized = sanitizeJsonString(cleaned);
 try {return JSON.parse(sanitized);} catch {/* continue */}

 // Attempt 3: Extract first JSON object or array
 const objMatch = cleaned.match(/\{[\s\S]*\}/);
 const arrMatch = cleaned.match(/\[[\s\S]*\]/);
 const candidates = [objMatch?.[0], arrMatch?.[0]].filter(Boolean) as string[];

 // Sort by length descending — prefer larger matches
 candidates.sort((a, b) => b.length - a.length);

 for (const candidate of candidates) {try {return JSON.parse(candidate);} catch {/* try sanitized */}
 try {return JSON.parse(sanitizeJsonString(candidate));} catch {/* continue */}}

 // Attempt 4: Find all JSON objects/arrays and pick the largest valid one
 const allMatches = [...cleaned.matchAll(/\{[\s\S]*?\}/g),...cleaned.matchAll(/\[[\s\S]*?\]/g),].map(m => m[0]).sort((a, b) => b.length - a.length);

 for (const m of allMatches.slice(0, 5)) {try {return JSON.parse(m);} catch {/* skip */}
 try {return JSON.parse(sanitizeJsonString(m));} catch {/* skip */}}

 return null;}
