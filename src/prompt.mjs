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

/** Web-app mode: the files live in design/ and design-rules.md drives the choices. */
export const APP_ATTACH = {
  any: 'ไฟล์ชุดดีไซน์อยู่ในโฟลเดอร์ design/ ของโปรเจกต์ (DESIGN.md, tokens.css, tokens.tailwind.css, design-rules.md, check-design.mjs) ถ้าแนบไฟล์ได้ ให้อ่านทั้งหมด ถ้าแนบไม่ได้ ผมจะวางเนื้อหา design-rules.md ต่อท้ายข้อความนี้',
  claude: 'ไฟล์ชุดดีไซน์อยู่ในโฟลเดอร์ design/ ของโปรเจกต์ และ CLAUDE.md โหลด @design/design-rules.md ไว้แล้ว (ถ้ายังไม่มี ให้เพิ่มบรรทัดนั้นก่อน) อ่าน design-rules.md และ tokens.tailwind.css ให้ครบก่อนแก้ไฟล์',
  chatgpt: 'ผมแนบ design-rules.md, tokens.tailwind.css และ tokens.css ไว้ในแชตนี้ (ถ้าแนบไม่ได้ ผมจะวางเนื้อหาต่อท้าย) อ่านให้ครบก่อนเริ่มเขียน',
  cursor: 'ไฟล์ชุดดีไซน์อยู่ในโฟลเดอร์ design/ อ้างอิงด้วย @design/design-rules.md และ @design/tokens.tailwind.css และอ่านให้ครบก่อนแก้ไฟล์',
  lovable: 'เนื้อหาของ design-rules.md และ tokens.tailwind.css ผมวางไว้ในข้อความนี้/แนบมาด้วย ให้ถือเป็นระบบดีไซน์ของโปรเจกต์และทำตามทุกครั้งที่สร้างหรือแก้หน้า',
  v0: 'เนื้อหาของ design-rules.md และ tokens.tailwind.css ผมวางไว้ต่อท้ายข้อความนี้ ให้ถือเป็นระบบดีไซน์และทำตามอย่างเคร่งครัด'
};
export const ANTI_APP = [
  'ห้ามเขียนค่าสี (#hex, rgb()) และห้ามใช้พาเลตต์ของ Tailwind (red-500, slate-*, emerald-*) ให้ใช้เฉพาะบทบาท app-* และสีแบรนด์ใน design-rules.md',
  'ห้ามสร้างชื่อคลาส Tailwind ด้วยการต่อข้อความ (เช่น bg-${color}-500) ให้เขียนชื่อคลาสเต็มและจับคู่ตัวเลือกกับข้อความเต็ม',
  'ห้ามใช้สีสถานะ (แดง เขียว ส้ม ฟ้า) กับอันดับ แท็ก หรือการตกแต่ง ใช้กับสถานะจริงเท่านั้น หมวดหมู่ใช้ chart-* หรือ accent-soft',
  'ห้ามใช้ข้อความเล็กกว่า text-xs (12px) ห้ามใช้ text-[10px] และห้ามใช้ emoji แทนไอคอน',
  'ห้ามแต่งข้อมูลจริงให้ดูน่าเชื่อถือโดยไม่บอก ถ้าใช้ข้อมูลตัวอย่างให้ระบุว่าเป็นข้อมูลตัวอย่าง'
];

function buildAppPrompt(type, o, tool, avoid) {
  const attach = APP_ATTACH[tool.key] || APP_ATTACH.any;
  return `ฉันกำลังสร้าง${type.title} ช่วยออกแบบและเขียนโค้ดตามชุดไฟล์ดีไซน์ในโฟลเดอร์ design/
${attach}

เนื้อหาของฉัน:
${contentLines(o.content)}
${type.extra}

กติกา:
1. อ่าน design/design-rules.md ให้ครบและทำตามอย่างเคร่งครัด โดยเฉพาะตารางบทบาทสีและแพตเทิร์น (การ์ด ปุ่ม ช่องกรอก ตาราง แจ้งเตือน เมนู)
2. เลือกสีตามหน้าที่ด้วยบทบาท app-* (bg-app-surface, text-app-danger, border-app-border ...) สถานะต้องใช้ 3 คลาสคู่กัน (soft + border + text) ตัวหนังสือสี accent ใช้ text-app-accent-text และพื้น accent ที่มีข้อความเล็กใช้ bg-app-accent-strong
3. ตั้ง <html lang="th"> เมื่อเนื้อหาเป็นภาษาไทย (ชุดไฟล์จัด line-height และปิด letter-spacing ให้อัตโนมัติ) ใช้ rounded-control กับปุ่ม/ช่องกรอก และ rounded-card กับการ์ด
4. ใช้ Tailwind CSS v4: @import "./tokens.tailwind.css" ต่อจาก @import "tailwindcss" (ถ้าโปรเจกต์ไม่ใช้ Tailwind ให้ใช้ tokens.css และคลาส .ds-app-* เช่น .ds-app-card, .ds-app-btn-primary, .ds-app-table)
5. ใช้ชื่อ โลโก้ และข้อความของฉันเอง — ห้ามใช้ชื่อหรือโลโก้ของ ${avoid}
6. รองรับมือถือ ปุ่มและพื้นที่แตะอย่างน้อย 40px และใช้ HTML ที่เข้าถึงได้ง่าย (semantic tags, วงโฟกัสแป้นพิมพ์ชัดเจน)
7. ห้ามแก้ เขียนทับ หรือ "ทำให้ง่ายขึ้น" กับไฟล์ในโฟลเดอร์ design/ (โดยเฉพาะ check-design.mjs เพราะตัวตรวจที่ถูกเขียนใหม่จะผ่านง่ายขึ้นแต่ตรวจน้อยลง) ถ้ากฎหรือตัวตรวจขัดกับงาน ให้บอกฉันพร้อมเหตุผล แทนการแก้ไฟล์
8. เมื่อเสร็จ รัน node design/check-design.mjs src แก้ทุกข้อที่ขึ้น ✗ แล้วสรุปสั้นๆ ว่าตัดสินใจเรื่องดีไซน์อะไรไปบ้าง

ข้อห้ามสำหรับเว็บแอป:
${ANTI_APP.map((x) => `- ${x}`).join('\n')}`;
}

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
  if (type.app) return buildAppPrompt(type, o, tool, avoid);
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
