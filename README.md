# DESIGN.md Hub

เว็บสถิต (static site) สำหรับดู **ตัวอย่างหน้าเว็บ** และ **ดาวน์โหลด `DESIGN.md`** ของเว็บไซต์ดังหลายสิบแบบ
จัดทำเพื่อการเรียนรู้ ไม่แสวงหาผลกำไร — ไม่มีฐานข้อมูล ไม่มีเซิร์ฟเวอร์ ไม่เก็บข้อมูลผู้ใช้

## ทำงานอย่างไร

```
content/<brand>/DESIGN.md  ──(scripts/build.mjs)──▶  public/   ──▶  Vercel
```

ตอน build สคริปต์จะ
1. อ่าน YAML front matter ของแต่ละไฟล์ (สี ตัวอักษร รัศมีมุม ระยะห่าง คอมโพเนนต์)
2. สร้างหน้าแบรนด์ (`/b/<brand>/`) พร้อมตัวอย่างหน้าเว็บ พาเลตสี สเกลตัวอักษร และคอมโพเนนต์
3. สร้างไฟล์ดาวน์โหลด `/d/<brand>/DESIGN.md`, `tokens.css`, `tokens.json`
4. ไฟล์รูปแบบเก่าที่ไม่มี YAML จะดึงเฉพาะสีจากข้อความ (ระบุไว้บนหน้านั้น)

ไม่มี dependency ภายนอก ใช้แค่ Node.js 18+

## รันในเครื่อง

```bash
node scripts/build.mjs        # สร้างโฟลเดอร์ public/
node scripts/serve.mjs 4173   # เปิด http://localhost:4173
```

## เพิ่มหรืออัปเดตแบรนด์

1. วางไฟล์ที่ `content/<ชื่อแบรนด์>/DESIGN.md` (หรือรัน `node scripts/sync.mjs <path ของ design-md>`)
2. เพิ่มชื่อโฟลเดอร์ในหมวดที่ `categories.json` (ถ้าไม่ใส่ สคริปต์จะเตือนตอน build)
3. ถ้าชื่อแสดงผลไม่สวย เพิ่มใน `NAMES` ที่ `scripts/build.mjs`
4. commit และ push — Vercel build ให้อัตโนมัติ

## Deploy บน Vercel

1. push โปรเจกต์นี้ขึ้น Git (GitHub/GitLab)
2. Vercel → **Add New Project** → เลือก repo
3. ค่าตั้งต้นอ่านจาก `vercel.json` อยู่แล้ว (Build: `node scripts/build.mjs`, Output: `public`) — ไม่ต้องตั้ง Framework
4. Deploy

แก้ `site.config.json` เพื่อเปลี่ยนชื่อเว็บ ข้อความหน้าแรก และข้อความปฏิเสธความรับผิดชอบ
ใส่ `url` (เช่น `https://your-site.vercel.app`) เพื่อให้ `sitemap.txt` เป็น URL เต็ม

## ลิขสิทธิ์และข้อควรระวัง

- เนื้อหา `DESIGN.md` มาจาก [VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md) ภายใต้ MIT License
  (ดู `LICENSE-upstream`) ต้องคงประกาศนี้ไว้เมื่อเผยแพร่ซ้ำ
- ไฟล์เหล่านี้เป็นการวิเคราะห์เชิงแรงบันดาลใจ **ไม่ใช่ไฟล์ทางการของแบรนด์** เว็บนี้ไม่เกี่ยวข้องกับแบรนด์ใดที่ปรากฏ
  ชื่อและเครื่องหมายการค้าเป็นของเจ้าของ — ไม่ใช้โลโก้ของแบรนด์ และไม่ควรทำให้ผลงานของคุณดูเหมือนเว็บของแบรนด์นั้น
- ฟอนต์บางตัว (เช่น Sohne, SF Pro) เป็นของเสียเงิน หน้าตัวอย่างจึงแสดงด้วย Inter แทน
- ตรวจเงื่อนไขของ repo ต้นทางอีกครั้งก่อนเผยแพร่ เพราะอาจเปลี่ยนแปลงได้
