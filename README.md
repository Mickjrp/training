# Weekly Training App (PWA) · v1.3

แอปจดการซ้อมสำหรับ iPhone ใช้งาน offline ได้ ข้อมูลทั้งหมดเก็บในเครื่องเท่านั้น
ไม่มีขั้นตอน build: ไฟล์ในโฟลเดอร์นี้คือแอปที่ใช้งานจริง แก้แล้ว refresh ดูผลได้ทันที

## แผนที่โค้ด

```
index.html            โครง HTML + โหลด CSS/JS ตามลำดับ
css/app.css           หน้าตาทั้งหมด (สีอยู่บนสุดใน :root แยก light / dark)
js/data.js            เวอร์ชันแอป, ไอคอน, รายชื่อกล้ามเนื้อ, ท่าและตารางเริ่มต้น (DEF_EX, defaultProgram)
js/utils.js           ฟังก์ชันช่วย: $, esc, num, fmt, วันที่
js/ui.js              แถบแจ้งเตือนด้านบน + toast
js/storage.js         อ่าน/เขียน localStorage, state ของแอป, ข้อมูลที่จดแต่ละวัน
js/exercise.js        ข้อมูลท่า, ระบบแนะนำเพิ่มน้ำหนัก (evalEntry, adviceFor), คลิป YouTube
js/muscle-map.js      รูปร่างกาย SVG + นับ sets ต่อกล้ามเนื้อ
js/timer.js           Rest timer + กันจอดับ
js/views/workout.js   หน้า Workout, แถบวัน, โหมดแก้ไข (สลับ/ลบท่า)
js/views/sheets.js    หน้าต่างเด้งจากล่าง: แก้ไขท่า, เพิ่มท่า, ตั้งเวลาพัก
js/views/body.js      หน้า Body (น้ำหนักตัว)
js/views/week.js      หน้า Week (พร้อมเพิ่มน้ำหนัก, muscle map ทั้งสัปดาห์, กฎ)
js/views/settings.js  หน้า Settings, Backup/Restore, Export CSV
js/main.js            สลับแท็บ, รับการแตะ/พิมพ์ทั้งหมด, เริ่มแอป
sw.js                 ทำให้ใช้ offline ได้ (cache ทุกไฟล์)
fonts/  icons/        ฟอนต์และไอคอน
```

ไฟล์ JS ทุกไฟล์ใช้ตัวแปรร่วมกัน (global scope) และต้องโหลดตามลำดับใน index.html
ถ้าสร้างไฟล์ใหม่ ให้ใส่ `<script>` ก่อน `js/main.js` และเพิ่มชื่อไฟล์ใน `ASSETS` ของ `sw.js`

## แก้โค้ดใน VS Code
- **Cmd+P** พิมพ์ชื่อไฟล์เพื่อเปิด
- **Cmd+Shift+O** กระโดดไปฟังก์ชันในไฟล์นั้น
- **F12** บนชื่อฟังก์ชัน → ไปยังที่ประกาศไว้ แม้อยู่คนละไฟล์ (ใช้ได้เพราะมี `jsconfig.json`)
- **Shift+F12** ดูว่าฟังก์ชันนี้ถูกเรียกที่ไหนบ้าง
- **Option+Z** ตัดบรรทัดยาว (ส่วนที่สร้าง HTML เป็น template string บรรทัดยาว)
- ติดตั้ง extension **Prettier** แล้วเปิด Format On Save โค้ดจะจัดรูปแบบเดียวกันทุกไฟล์ (ตั้งค่าไว้ใน `.prettierrc`)

`.prettierrc`, `jsconfig.json` และ `README.md` ใช้ตอนแก้โค้ดเท่านั้น ไม่ต้องอัปโหลดก็ได้

## ทดสอบบน Mac
```bash
cd weekly-training-app
python3 -m http.server 8000
```
เปิด http://localhost:8000 ใน Chrome → Cmd+Option+I → Cmd+Shift+M (ขนาด iPhone)
ในแท็บ Application → Service workers ติ๊ก **Update on reload** ไม่อย่างนั้นจะเห็นไฟล์เก่าจาก cache

## อัปโหลด (GitHub Pages)
1. อัปโหลดทั้งโฟลเดอร์ รวม `css/`, `js/`, `fonts/`, `icons/` โดยให้โครงสร้างเหมือนเดิม
2. ทุกครั้งที่แก้ ให้เปลี่ยนเลขใน `sw.js`: `const CACHE = "weekly-training-v1.3.0";` → `v1.3.1`
3. เปิดแอปบน iPhone 2 ครั้ง ครั้งแรกจะโหลดเวอร์ชันใหม่ ครั้งที่สองจะเห็นผล

อัปเกรดจากเวอร์ชันไฟล์เดียว (v1.0–v1.2) ได้เลย ข้อมูลที่จดไว้ยังอยู่ครบ แต่กด Backup ก่อนเสมอ

## ติดตั้งบน iPhone
เปิดลิงก์ใน **Safari** → Share → **Add to Home Screen** → Add แล้วเปิดจากไอคอน **Training**

## ฟีเจอร์
- จด kg × reps ทุก set, ประวัติครั้งก่อน, แก้/สลับ/เพิ่มท่าได้ในแอป
- แนะนำเพิ่มน้ำหนักเมื่อครบ reps สูงสุดทุก set และเติมน้ำหนักใหม่ไว้ให้ครั้งถัดไป
- Rest timer เริ่มเองเมื่อกด ✓
- Muscle map รายวันและรายสัปดาห์
- ลิงก์ YouTube ต่อท่า + คลิปบนการ์ดที่เล่นเองแบบไม่มีเสียง (แก้ไขท่า → แสดงคลิปบนการ์ด)
- น้ำหนักตัวรายสัปดาห์ + เตือนเมื่อไม่ขึ้น 2 สัปดาห์
- Backup (.json) / Restore / Export CSV
