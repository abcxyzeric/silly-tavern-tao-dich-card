# Hướng dẫn sử dụng Bardic - Hướng dẫn triển khai

## Tùy chọn 1: Triển khai miễn phí Vercel (khuyến nghị)

HTTPS miễn phí, tự động, CDN toàn cầu, không cần vận hành và bảo trì.

### Các bước triển khai

1. Đẩy mã lên GitHub (hoặc GitLab/Bitbucket)

2. Mở [vercel.com/new](https://vercel.com/new) và nhập kho của bạn

3. Vercel sẽ tự động phát hiện cấu hình, chỉ cần nhấp vào **Triển khai**

4. Sau khi quá trình triển khai hoàn tất, bạn sẽ được cấp một tên miền `xxx.vercel.app`, tên miền này có thể được sử dụng bằng cách chia sẻ nó với những người khác.

### Cập nhật mã

Mỗi khi bạn đẩy tới nhánh chính GitHub, Vercel sẽ tự động triển khai lại mà không cần thao tác thủ công.

### Liên kết tên miền tùy chỉnh (tùy chọn)

Thêm tên miền của bạn vào Cài đặt dự án Vercel → Tên miền và làm theo lời nhắc để định cấu hình DNS.

### Hạn ngạch miễn phí

- Yêu cầu tĩnh không giới hạn
- Gọi chức năng serverless: 100 GB-giờ/tháng
-Một lần thực hiện chức năng duy nhất kéo dài tới 60 giây
- HTTPS tự động
- CDN toàn cầu

---

## Tùy chọn 2: Triển khai Docker

### Điều kiện tiên quyết
- Cài đặt máy chủ Docker và Docker Compose

### Các bước triển khai

1. Tải dự án lên máy chủ

2. Xây dựng và bắt đầu:
```bash
docker compose up -d --build
```

3. Truy cập `http://IP máy chủ của bạn:3001`

### Các lệnh thông dụng
```bash
# Xem nhật ký
docker compose logs -f

#ngừng dịch vụ
docker compose down

# Xây dựng lại (sau khi cập nhật mã)
docker compose up -d --build
```

---

## Phương án 3: Triển khai trực tiếp

### Điều kiện tiên quyết
- Cài đặt máy chủ Node.js 18+

### Các bước triển khai

1. Tải dự án lên máy chủ

2. Cài đặt và xây dựng các phụ thuộc:
```bash
npm ci
npx vite build
```

3. Bắt đầu dịch vụ:
```bash
# Chạy ở phía trước
npm start

# Hoặc sử dụng PM2 để chạy ở chế độ nền (khuyến nghị)
npm install -g pm2
pm2 start server/index.js --name tavern-helper
pm2 save
pm2 startup
```

4. Truy cập `http://IP máy chủ của bạn:3001`

---

## Giải pháp 4: Proxy ngược Nginx + HTTPS

Thích hợp cho các tình huống với tên miền:

```nginx
server {listen 443 ssl;
 server_name your-domain.com;

 ssl_certificate /path/to/cert.pem;
 ssl_certificate_key /path/to/key.pem;

 location / {proxy_pass http://127.0.0.1:3001;
 proxy_http_version 1.1;
 proxy_set_header Upgrade $http_upgrade;
 proxy_set_header Connection "upgrade";
 proxy_set_header Host $host;
 proxy_set_header X-Real-IP $remote_addr;

# Phát trực tuyến SSE phải tắt tính năng đệm
 proxy_buffering off;
 proxy_cache off;
 proxy_read_timeout 300s;}}
```

---

## Biến môi trường

| biến | giá trị mặc định | mô tả |
|------|--------|------|
| CẢNG | 3001 | Cảng dịch vụ |
| CHỦ | 0.0.0.0 | Địa chỉ nghe |
| CORS_ORIGINS | (đã bật tất cả) | Tên miền được phép, phân tách bằng dấu phẩy |

---

## Ghi chú

1. **Dữ liệu được lưu trữ trong trình duyệt**: Dữ liệu người dùng được lưu trữ trong IndexedDB của mỗi trình duyệt và dữ liệu không thể tương tác giữa các thiết bị/trình duyệt khác nhau.
2. **Khóa API do người dùng cung cấp**: Máy chủ chỉ thực hiện chuyển tiếp proxy CORS và không lưu trữ bất kỳ Khóa API nào.
3. **Khuyến nghị về HTTPS**: Vercel đi kèm với HTTPS; nên định cấu hình SSL cho các máy chủ tự xây dựng.
