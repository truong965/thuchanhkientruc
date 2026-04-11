# Sử dụng Python 3.9 làm base image
FROM python:3.9

# Thiết lập thư mục làm việc
WORKDIR /app

# Copy file requirements trước để tận dụng cache
COPY requirements.txt .

# Cài dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code vào container
COPY . .

# Mở cổng 5000
EXPOSE 5000

# Lệnh chạy ứng dụng
CMD ["python", "app.py"]