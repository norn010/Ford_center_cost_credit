# Ford & Nissan Center Cost Credit Settlement System

ระบบจัดการและติดตามงานตัดชำระหนี้อะไหล่เงินเชื่อ (Credit Settlement) ออกแบบมาเพื่อช่วยฝ่ายบัญชีศูนย์บริการในการนำเข้าข้อมูลจาก Excel, ติดตามสถานะงาน และบันทึกการรับชำระเงินให้ตรงตามยอดใบกำกับภาษีอย่างแม่นยำ

---

## 📂 โครงสร้างโปรเจกต์ (Project Structure)

โปรเจกต์นี้แบ่งออกเป็น 2 ส่วนหลักคือ **Backend** (Node.js) และ **Frontend** (React) ตังนี้:

### 1. Backend (`/backend`)

- **`server.js`**: ไฟล์หลักในการรัน Express Server และรวมโมดูลต่างๆ
- **`db.js`**: ตัวจัดการการเชื่อมต่อกับ SQL Server (ใช้ `mssql` driver)
- **`routes/`**: รวบรวม API สำหรับแต่ละหน้างาน
  - `automate.js`: รับข้อมูลจาก Dashboard เข้าสู่คิวงาน
  - `settlements.js`: จัดการการสร้างและดึงข้อมูล Settlement (ระบบรับชำระเงิน)
- **`scripts/`**: เก็บสคริปต์สำหรับการจัดการฐานข้อมูล
  - `init_db.js`: สคริปต์สร้างตารางใหม่ (Queue, Settlement Header, Settlement Item)

### 2. Frontend (`/frontend`)

- **`src/pages/`**: รวบรวมหน้าจอหลักของระบบ
  - `Dashboard.jsx`: หน้านำเข้า Excel (รองรับ Ford/Nissan) และส่งเข้า Automation
  - `AutomateStatus.jsx`: ติดตามสถานะคิวที่กำลังประมวลผล
  - `AutomateCompleted.jsx`: เลือกรายการที่เสร็จแล้วเพื่อเริ่มทำ Settlement (จ่ายเงิน)
  - `AutomationReconcileReport.jsx`: หน้ารายงานประวัติการตัดชำระทั้งหมด
- **`src/components/`**: ส่วนประกอบ UI ที่นำกลับมาใช้ใหม่
  - `SalesTable.jsx`: ตารางแสดงข้อมูลพร้อมระบบเลือกและจัดเรียงข้อมูล
  - `AutomateButton.jsx`: ปุ่มส่งข้อมูลเข้าคิวงาน
- **`src/services/api.js`**: รวมฟังก์ชัน Axios สำหรับเรียกใช้งาน API ทั้งหมด

---

## 🛠️ วิธีการติดตั้งและรันระบบ (How to Run)

### 1. เตรียมฐานข้อมูล (SQL Server)

- สร้างฐานข้อมูลใหม่ใน SQL Server (เช่นชื่อ `Ford_center_cost_credit`)
- ตรวจสอบให้แน่ใจว่าเปิดการเชื่อมต่อผ่าน TCP/IP (Port 1433) เรียบร้อยแล้ว

### 2. ตั้งค่า Backend

1. **เข้าไปที่โฟลเดอร์ backend:**
   ```bash
   cd backend
   ```
2. **ติดตั้ง Dependencies:**
   ```bash
   npm install
   ```
3. **สร้างไฟล์ `.env` ในโฟลเดอร์ `backend/` และใส่ข้อมูลพื้นฐาน:**
   ```env
   PORT=5000
   DB_SERVER=localhost
   DB_USER=sa
   DB_PASSWORD=รหัสผ่าน_SQL_SERVER
   QUEUE_DB_NAME=ชื่อฐานข้อมูลที่คุณสร้าง
   ```
4. **สร้างตารางเริ่มต้น (รันเพียงครั้งแรก):**
   ```bash
   npm run init_db
   ```
5. **รันระบบ Backend:**
   ```bash
   npm run dev
   ```

### 3. ตั้งค่า Frontend

1. **เข้าไปที่โฟลเดอร์ frontend:**
   ```bash
   cd frontend
   ```
2. **ติดตั้ง Dependencies:**
   ```bash
   npm install
   ```
3. **รันระบบ Frontend:**
   ```bash
   npm run dev
   ```

---

## 🔄 Workflow การทำงาน (Step-by-Step)

1. **Dashboard**: เลือกแบรนด์ (Ford/Nissan) -> อัปโหลด Excel -> ระบบจะรวมยอด Batch และส่งเข้าคิว
2. **Automation Status**: ติดตามรายการที่ส่งเข้าไปประมวลผล
3. **Reports & Clearing**: เมื่อประมวลผลเสร็จแล้ว รายการจะไปแสดงที่หน้า "รายงานตัดชำระหนี้" เพื่อทำรายการรับชำระจริง (Settlement)
4. **History**: ตรวจสอบประวัติการตัดชำระย้อนหลังรายใบกำกับในหน้า "รายงานประวัติการตัดชำระหนี้"

---

## 🏗️ ฐานข้อมูลและโครงสร้างข้อมูล (Database Schema)

- **`Automation_Queue_Center_Cost_Credit`**: เก็บข้อมูลคิวหลัก (Invoices)
- **`Automation_Queue_Ford_Center_cost_Credit_Settlement`**: เก็บข้อมูลสรุปหัวเอกสารรับชำระ (Header)
- **`Automation_Queue_Ford_Center_cost_Credit_Settlement_Item`**: เก็บรายละเอียดรายการย่อยที่ระบุยอดเงินรายใบกำกับภาษี (Line Items)

---

_จัดทำโดย: หนอน (Update: 03/04/2026)_
