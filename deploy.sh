#!/bin/bash

# Thiết lập màu sắc hiển thị cho dễ nhìn
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Bắt đầu tiến trình tự động deploy NexToolX lên VPS...${NC}"

# 1. Đóng gói mã nguồn React cục bộ trên Mac
echo -e "${BLUE}📦 Bước 1: Đóng gói mã nguồn React (Frontend & Admin)...${NC}"
npm run build:all

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Lỗi: Tiến trình build thất bại! Đã hủy bỏ deploy.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Đóng gói mã nguồn thành công.${NC}"

# 2. Đồng bộ file lên VPS bằng rsync
echo -e "${BLUE}📤 Bước 2: Tự động tải code lên VPS (84.75.144.17)...${NC}"
rsync -avz --delete frontend/dist/ root@84.75.144.17:/var/www/nextoolx/frontend/dist
rsync -avz --delete admin/dist/ root@84.75.144.17:/var/www/nextoolx/admin/dist
rsync -avz --exclude 'node_modules' --exclude 'database.sqlite' backend/ root@84.75.144.17:/var/www/nextoolx/backend

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Lỗi: Không thể đồng bộ tệp lên VPS qua rsync.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Đồng bộ tệp lên VPS thành công.${NC}"

# 3. Khởi động lại backend trên VPS thông qua SSH
echo -e "${BLUE}🔄 Bước 3: Khởi động lại dịch vụ Backend trên VPS...${NC}"
ssh root@84.75.144.17 "pm2 restart nextoolx-backend"

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Lỗi: Không thể khởi động lại dịch vụ Backend trên VPS.${NC}"
    exit 1
fi

echo -e "${GREEN}🎉 Chúc mừng! Tiến trình deploy hoàn tất thành công. Website đã được cập nhật trực tuyến!${NC}"
