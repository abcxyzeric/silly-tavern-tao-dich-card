# Tien do dich du an

## Muc tieu
- Lam viec chi trong thu muc `F:\mvu card\webtaocard`.
- Clone nguon tu `https://github.com/shankongjiu-dot/tavern-card-helper`.
- Dich toan bo tieng Trung sang tieng Viet.
- Giu nguyen tieng Anh.
- Tranh loi dinh chu tieng Viet, vi du khong de `tinhyeu`.
- Giu UTF-8 de tranh mojibake tieng Viet.
- Sau khi quet sach tieng Trung, push len `https://github.com/abcxyzeric/silly-tavern-tao-dich-card.git`.
- Thu deploy len Vercel voi ten `silly-tavern-tao-dich-card`.

## Trang thai
- [x] Tao thu muc `webtaocard`.
- [x] Clone repo nguon vao `webtaocard\tavern-card-helper`.
- [x] Khao sat cau truc du an.
- [x] Liet ke tat ca file co tieng Trung.
- [x] Dich noi dung tieng Trung sang tieng Viet.
- [x] Quet lai de dam bao khong con ky tu Trung.
- [x] Build/test.
- [ ] Cau hinh remote dich va push.
- [ ] Deploy Vercel.

## Ghi chu dich thuat
- Khong dich cac cum tieng Anh, ten bien, package, command, URL.
- Chi dich chu Trung trong UI, README, comment, thong bao, metadata neu co.
- Khi ghep cau tieng Viet, them khoang trang tu nhien giua cac tu.

## Nhat ky
- 2026-06-09: Da clone repo, xac dinh du an React/Vite + Express, co cau hinh Vercel san.
- 2026-06-09: Quet thay 48 file co ky tu Trung; co 4 ten file bang tieng Trung can doi ten.
- 2026-06-09: Cac nhom can dich: tai lieu goc, file.bat/.vbs, public metadata/service worker, server route, src UI, src prompts/services/hooks.
- 2026-06-09: Da cai dependency bang `npm install`; `package-lock.json` co thay doi do npm cap nhat metadata, se kiem tra lai truoc khi push.
- 2026-06-09: Da chay vong dich tu dong, sua tay phan con sot, doi ten 4 file tieng Trung sang ten Viet khong dau.
- 2026-06-09: `rg "[\p{Han}]"` va quet ten file deu khong con ket qua.
- 2026-06-09: Da sua cac cho dich may bi dinh chu quanh `{...}` va mot so cum sai nghia nhu nut "Ap dung", "Bo qua", "Xoa".
- 2026-06-09: `npm run build` thanh cong; chi con canh bao chunk lon cua Vite/Rolldown.
