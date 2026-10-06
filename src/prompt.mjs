// AI prompt builder shared by the build (static text on brand pages) and the browser (live text when the visitor picks a tool / types their content).
// No imports, no DOM: same idea as layouts.mjs.

/** How each tool receives the files and what it should produce. Kept generic on purpose: tools change their UI often. */
export const TOOLS = [
  { key: 'any', label: 'ทั่วไป / ไม่ระบุเครื่องมือ',
    attach: 'ถ้าเครื่องมือให้แนบไฟล์ได้ ให้อ่านไฟล์ DESIGN.md และ tokens.css ที่แนบมา ถ้าแนบไม่ได้ ผมจะวางเนื้อหาทั้งสองไฟล์ต่อท้ายข้อความนี้',
    stack: 'ใช้ Tailwind CSS (หรือ CSS ธรรมดา) โดยตั้งค่าจาก tokens.css' },
  { key: 'claude', label: 'Claude / Claude Code',
    attach: 'ไฟล์ DESIGN.md และ tokens.css แนบมาในแชตนี้ (ถ้าเป็น Claude Code ไฟล์อยู่ที่รากโปรเจกต์) อ่านทั้งสองไฟล์ให้ครบก่อนเริ่มเขียน',
    stack: 'ถ้าเป็นแชตทั่วไป ให้ตอบเป็นไฟล์ HTML ไฟล์เดียวที่มี CSS ในตัวและเปิดในเบราว์เซอร์ได้ทันที ถ้าเป็น Claude Code ให้สร้างไฟล์ในโปรเจกต์ตามโครงสร้างที่มีอยู่ ใช้ Tailwind CSS หรือ CSS ธรรมดาตาม tokens.css' },
  { key: 'chatgpt', label: 'ChatGPT',
    attach: 'อัปโหลดไฟล์ DESIGN.md และ tokens.css ในแชตนี้ (ถ้าอัปโหลดไม่ได้ ผมจะวางเนื้อหาไว้ต่อท้ายข้อความ) แล้วอ่านให้ครบก่อนเริ่มเขียน',
    stack: 'ตอบเป็นโค้ดบล็อกเดียว: ไฟล์ HTML ไฟล์เดียวที่มี CSS อยู่ใน <style> ใช้ CSS variables จาก tokens.css และเปิดในเบราว์เซอร์ได้โดยไม่ต้อง build' },
  { key: 'cursor', label: 'Cursor',
    attach: 'ไฟล์ DESIGN.md และ tokens.css อยู่ที่รากโปรเจกต์นี้แล้ว อ้างอิงด้วย @DESIGN.md และ @tokens.css และอ่านให้ครบก่อนแก้ไฟล์',
    stack: 'สร้างหรือแก้ไฟล์ในโปรเจกต์ตามโครงสร้างและเฟรมเวิร์กที่มีอยู่ (ถ้ายังไม่มี ให้ใช้ HTML + Tailwind CSS) ผูก tokens.css เข้ากับสไตล์ของโปรเจกต์ ห้ามใส่ค่าสีหรือขนาดซ้ำในโค้ดโดยตรง' },
  { key: 'lovable', label: 'Lovable',
    attach: 'เนื้อหาของ DESIGN.md และ tokens.css ผมวางไว้ในข้อความนี้/แนบมาด้วย ให้ถือเป็นระบบดีไซน์ของโปรเจกต์และทำตามทุกครั้งที่สร้างหรือแก้หน้า',
    stack: 'ใช้ React + Tailwind CSS ตามที่โปรเจกต์ใช้อยู่ แปลงค่าใน tokens.css เป็น CSS variables และ theme ของ Tailwind ก่อน แล้วค่อยสร้างหน้า' },
  { key: 'v0', label: 'v0',
    attach: 'เนื้อหาของ DESIGN.md และ tokens.css ผมวางไว้ต่อท้ายข้อความนี้ ให้ถือเป็นระบบดีไซน์และทำตามอย่างเคร่งครัด',
    stack: 'ใช้ React + Tailwind CSS (และ shadcn/ui ถ้าจำเป็น) แปลงค่าใน tokens.css เป็น CSS variables ใน globals.css แล้วใช้ตัวแปรเหล่านั้นแทนค่าสีตรงๆ' }
];

/** Rules that stop the "default AI website" look. */
export const ANTI_AI = [
  'ห้ามใช้ gradient ม่วง-น้ำเงิน หรือสีใดๆ ที่ไม่มีใน DESIGN.md',
  'ห้ามใช้ emoji แทนไอคอน ให้ใช้ไอคอน SVG ชุดเดียวกันทั้งหน้า',
  'ห้ามวางการ์ด 3 ใบเรียงกันซ้ำในทุก section ให้เปลี่ยนโครงตามเนื้อหา (ตาราง, รายการ, ภาพคู่ข้อความ, ตัวเลขเด่น)',
  'ห้ามใช้เงา มุมโค้ง หรือขนาดตัวอักษรที่ไม่ได้กำหนดไว้ในไฟล์',
  'ห้ามใช้ข้อความโฆษณากลวงๆ (เช่น “ยกระดับธุรกิจของคุณ”, “ปฏิวัติวงการ”) ห้ามใช้ lorem ipsum และห้ามแต่งตัวเลข รีวิว หรือโลโก้ลูกค้าปลอม ถ้าขาดข้อมูลให้ถามผมก่อน'
];

export const contentLines = (c = {}) => {
  const rows = [['ชื่อเว็บ/ธุรกิจ', c.name], ['บริการหรือสินค้าหลัก', c.offer], ['กลุ่มลูกค้า', c.audience]].filter(([, v]) => v && String(v).trim());
  return rows.length ? rows.map(([k, v]) => `- ${k}: ${String(v).trim().replace(/\s+/g, ' ')}`).join('\n') : '[ใส่ชื่อเว็บ ธุรกิจ และสิ่งที่อยากสื่อ]';
};

/**
 * @param {{title:string, extra:string}} type  page type (title + required sections)
 * @param {{avoid?:string, tool?:string, content?:{name?:string,offer?:string,audience?:string}}} o  `avoid` = name of the inspiration brand(s) that must not be copied
 */
export function buildPrompt(type, o = {}) {
  const tool = TOOLS.find((t) => t.key === o.tool) || TOOLS[0];
  const avoid = o.avoid || 'แบรนด์ที่เป็นแรงบันดาลใจ';
  return `ฉันกำลังสร้าง${type.title} ช่วยออกแบบและเขียนโค้ดตามระบบดีไซน์ในไฟล์ DESIGN.md และ tokens.css
${tool.attach}

เนื้อหาของฉัน:
${contentLines(o.content)}
${type.extra}

กติกา:
1. ยึดสี ฟอนต์ รัศมีมุม ระยะห่าง และคอมโพเนนต์ตาม DESIGN.md อย่างเคร่งครัด ห้ามเพิ่มสีหรือสไตล์ที่ไม่มีในไฟล์ (ใช้ค่าจาก tokens.css)
2. อ่านส่วน Do's and Don'ts ให้ครบและทำตาม
3. ใช้ชื่อ โลโก้ และข้อความของฉันเอง — ห้ามใช้ชื่อหรือโลโก้ของ ${avoid}
4. รองรับมือถือ และใช้ HTML ที่เข้าถึงได้ง่าย (semantic tags, คอนทราสต์ผ่านเกณฑ์)
5. ${tool.stack}
6. ถ้าเนื้อหาเป็นภาษาไทย ให้ตั้ง <html lang="th"> และใช้ฟอนต์ไทยตามส่วน Thai Typography ใน DESIGN.md (line-height เนื้อความอย่างน้อย 1.7 และห้ามใช้ letter-spacing กับตัวอักษรไทย)
7. เมื่อเสร็จ สรุปสั้นๆ ว่าตัดสินใจเรื่องดีไซน์อะไรไปบ้าง

ข้อห้ามกันหน้าตา AI ทั่วไป:
${ANTI_AI.map((x) => `- ${x}`).join('\n')}`;
}
