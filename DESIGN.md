---
name: อีอ้อ! Arena (Uno Custom Edition)
description: สังเวียนการ์ดสุดเท่ในสไตล์ Retro-Neon Arcade ที่ออกแบบมาเพื่อการประลองกับเพื่อน
colors:
  primary: "#ef4444"
  secondary: "#f59e0b"
  accent-cyan: "#22d3ee"
  accent-purple: "#a855f7"
  neutral-bg: "#0c0a09"
  card-back: "#0e0c0b"
typography:
  display:
    fontFamily: "'Press Start 2P', monospace"
    fontSize: "1.5rem"
    fontWeight: 900
    lineHeight: 1.2
  headline:
    fontFamily: "'Silkscreen', monospace"
    fontSize: "1.25rem"
    fontWeight: 700
  body:
    fontFamily: "system-ui, sans-serif"
    fontSize: "14px"
    lineHeight: 1.5
rounded:
  sm: "2px"
  md: "8px"
  lg: "12px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
components:
  card-base:
    rounded: "{rounded.lg}"
    padding: "8px"
    backgroundColor: "{colors.card-back}"
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.sm}"
---

# Design System: อีอ้อ! Arena

## 1. Overview

**Creative North Star: "Retro-Neon Arcade"**

ระบบดีไซน์ที่ผสมผสานเสน่ห์ของโลก 8-bit เข้ากับความตื่นเต้นของแสงสีนีออนสมัยใหม่ ให้ความรู้สึกเหมือนกำลังนั่งเล่นเกมในตู้ Arcade ยุค 90 แต่มีเอฟเฟกต์ที่คมชัดและทันสมัย ดีไซน์เน้นการใช้คอนทราสต์ที่รุนแรงระหว่างพื้นหลังสีเข้มสนิทกับสีสันจัดจ้านที่เรืองแสงออกมา

**Key Characteristics:**
- **Pixel Perfection**: ใช้ฟอนต์และองค์ประกอบแบบพิกเซลเพื่อดึงอารมณ์ย้อนยุค
- **Neon Glow**: ใช้แสงเรือง (Glow/Shadow) เพื่อสร้างมิติและความน่าสนใจ
- **High Contrast**: พื้นหลังสีเกือบดำ (Stone-950) เพื่อขับเน้นสีของการ์ดให้โดดเด่น
- **Tactile Response**: มี Animation ที่ดูฉับไวและมีพลัง (Spring Motion)

## 2. Colors

สีสันในสังเวียนนี้ถูกเลือกมาเพื่อสร้างความตื่นเต้นและแยกแยะประเภทของการ์ดได้อย่างชัดเจน

### Primary: Crimson Neon
- **Crimson Neon** (#ef4444): สีแดงหลักที่ใช้สำหรับการ์ดและปุ่มสำคัญ ให้ความรู้สึกถึงพลังและการโจมตี

### Secondary: Electric Gold
- **Electric Gold** (#f59e0b): สีเหลืองสดใสที่ใช้เป็นสีรองและขอบพิกเซล ให้ความรู้สึกเหมือนเหรียญในตู้เกม

### Accent
- **Cyber Cyan** (#22d3ee): สีฟ้าสว่างที่ใช้สำหรับสถานะ "จั่ว" หรือเอฟเฟกต์ Ping
- **Void Purple** (#a855f7): สีม่วงลึกลับที่ใช้สำหรับโลกฝั่งมืด (Dark Side) และการ์ดนนท์ดำ

### Neutral
- **Deep Abyss** (#0c0a09): สีพื้นหลังหลักที่มืดสนิทเพื่อให้แสงนีออนทำงานได้อย่างเต็มที่

**The Neon Glow Rule.** ทุกองค์ประกอบที่มีสีสันสดใสควรมีเงาเรืองแสง (Box Shadow/Drop Shadow) ที่แมตช์กับสีของตัวเอง เพื่อสร้างบรรยากาศแบบ Arcade

## 3. Typography

ใช้การผสมผสานระหว่างฟอนต์พิกเซลเพื่อความเท่ และฟอนต์ Sans-serif เพื่อการอ่านข้อมูลที่รวดเร็ว

### Hierarchy
- **Display (Press Start 2P, 24px/1.5rem)**: ใช้สำหรับหัวข้อใหญ่, ชื่อเกม, หรือการประกาศสำคัญ (Winner!)
- **Headline (Silkscreen, 20px/1.25rem)**: ใช้สำหรับชื่อผู้เล่นและหัวข้อย่อย
- **Body (Sans-serif, 14px)**: ใช้สำหรับคำอธิบายความสามารถของการ์ดและ Log ข้อความ

## 4. Elevation

ดีไซน์นี้ไม่เน้นความลึกแบบเงาธรรมชาติ (Soft Shadows) แต่ใช้การซ้อนทับ (Layering) และแสงนีออนเพื่อบอกระดับชั้น

### Shadow Vocabulary
- **Neon Pulse**: เงาเรืองแสงที่ใช้รอบตัวการ์ดที่เล่นได้ เพื่อบอกสถานะการโต้ตอบ
- **Pixel Outline**: การใช้เส้นขอบพิกเซลซ้อนกัน 1-2 ชั้นเพื่อสร้างมิติแบบ 2D

**The Layering Rule.** วัตถุที่อยู่ใกล้ผู้เล่นมากที่สุด (เช่น การ์ดในมือ) จะมีเส้นขอบที่ชัดเจนและแสงเรืองที่เข้มกว่าวัตถุที่เป็นพื้นหลัง

## 5. Components

### Uno Cards
- **Shape**: ขอบมน (12px)
- **Border**: เส้นขอบพิกเซลหนา (2px-3.5px)
- **Variants**: มีทั้งหน้าสว่าง (Light Side) และหน้ามืด (Dark Side) ที่มีโทนสีต่างกันชัดเจน

### Buttons
- **Shape**: เหลี่ยมพิกเซล (2px)
- **Style**: สีทึบ (Solid) พร้อมเส้นขอบสีทองหรือสีขาวสว่าง
- **Interaction**: ขยายขนาดเล็กน้อยเมื่อ Hover พร้อมแสงนีออนที่เข้มขึ้น

## 6. Do's and Don'ts

### Do:
- **Do** ใช้สีสันสดใสบนพื้นหลังมืดเสมอเพื่อให้เกิดเอฟเฟกต์นีออน
- **Do** ใช้ฟอนต์พิกเซลสำหรับคำที่ต้องการเน้นอารมณ์เกม
- **Do** ใช้ Spring Motion สำหรับการเคลื่อนที่ของการ์ดเพื่อให้ดู "มีชีวิต"

### Don't:
- **Don't** ใช้ Gradient ที่มีความละเอียดสูงเกินไปจนเสียลุค Pixel Art
- **Don't** ใช้สีเทาอ่อนหรือสีพาสเทลจางๆ เพราะจะทำให้ดีไซน์ดู "จืด" และไม่เข้ากับธีม Arcade
- **Don't** ใช้เงาฟุ้งๆ (Blur สูง) แบบแอปสมัยใหม่ทั่วไป ให้เน้นเงาเรืองแสงที่มีสีสันแทน
