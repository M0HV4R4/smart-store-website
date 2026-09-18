# Smart Store — موقع المنتج / Site produit

موقع تسويقي عربي (أساسي) / فرنسي (ثانوي) لبرنامج **Smart Store**.

> **ملاحظة تقنية:** بيئة هذا المشروع مثبّتة على **React 19 + Vite + TypeScript + Tailwind v4**
> (ملفا `package.json` و `vite.config.ts` غير قابلين للتعديل، والبناء ينتج `dist/index.html` واحد).
> لذلك لم يُستعمل Next.js، لكن بنية المجلدات والفصل بين الإعدادات والترجمة والمكوّنات مطابقة لما هو مطلوب،
> والانتقال إلى Next.js لاحقاً يتم بنسخ `components/` و `locales/` و `config/` كما هي.

---

## 1) أين أضع الملفات الحقيقية؟

### أ. لقطات شاشة Smart Store

```
public/smart-store/screenshots/
├── dashboard.png
├── pos.png
├── products.png
├── inventory.png
├── invoice.png
├── reports.png
├── customers.png
├── services.png
└── employees.png
```

ثم في `src/config/screenshots.ts` غيّر:

```ts
{ id: "dashboard", device: "desktop", image: null }
// إلى
{ id: "dashboard", device: "desktop", image: "/smart-store/screenshots/dashboard.png" }
```

المقاس المقترح: **1920×1200** (نسبة 16:10 مطابقة لإطار الحاسوب في الموقع).

> ما دامت `image: null`، يعرض الموقع **واجهة بديلة مبنية بالكامل بـ HTML/SVG** (مترجمة وتدعم RTL)،
> وليست صورة مزيّفة أو ادعاءً بوظائف غير موجودة.

### ب. ملفات التحميل (مهم جداً)

```
public/smart-store/downloads/
├── SmartStore-Setup.exe
└── SmartStore.apk
```

ثم في `src/config/downloads.ts`:

```ts
windows: {
  url: "/smart-store/downloads/SmartStore-Setup.exe",
  version: "1.0.0",     // اتركها null إن لم تكن مؤكدة
  size: "74 MB",        // اتركها null إن لم تكن مؤكدة
  updatedAt: "2026-02-14",
  requirements: "Windows 10 / 11",
}
```

- إن بقي `url: null` فالزر يظهر **معطّلاً** مع رسالة «الرابط غير متوفر بعد» بدل رابط ميّت.
- الحقول `version` / `size` / `updatedAt` **لا تُعرض إطلاقاً** إذا كانت `null` (لا اختراع بيانات).

### ج. الشعار وصورة المشاركة

```
public/smart-store/logos/smart-store.svg     ->  brandAssets.logo في config/screenshots.ts
public/smart-store/og-image.png (1200×630)   ->  meta og:image في index.html
```

---

## 2) تعديل المحتوى

| ماذا تريد تغييره | الملف |
| --- | --- |
| كل النصوص العربية | `src/locales/ar.ts` |
| كل النصوص الفرنسية | `src/locales/fr.ts` |
| السعر / الخطط / تفعيل التجربة | `src/config/pricing.ts` |
| روابط التحميل وبياناتها | `src/config/downloads.ts` |
| البريد / الهاتف / العنوان / الشبكات | `src/config/site.ts` |
| روابط القائمة والتذييل | `src/config/navigation.ts` |

`locales/ar.ts` هو **مصدر الأنواع**: أي مفتاح تضيفه هناك يصبح إلزامياً في `fr.ts` (خطأ TypeScript إن نسيته).

---

## 3) نزاهة المحتوى (مطبَّقة في الكود)

لا يحتوي الموقع على: عدد عملاء، تقييمات، شهادات، جوائز، عدد تحميلات،
نِسب جاهزية (uptime)، أرقام أداء بالميلي ثانية، أو ادّعاء **مزامنة سحابية تلقائية**.

- الأرقام داخل واجهات العرض **بيانات واجهة توضيحية** ومكتوبة صراحة في `common.sampleData`.
- معلومات التواصل غير موجودة ⇒ التذييل يعرض «ستُضاف قريباً» بدل بيانات مخترعة.
- أجوبة الأسئلة الشائعة تعكس فقط ما هو مؤكد (Windows، Android، باركود، فواتير، موظفون، تعدد متاجر، العمل بدون إنترنت).

---

## 4) البنية

```
src/
├── config/      site · navigation · pricing · downloads · screenshots
├── locales/     ar.ts (مرجع) · fr.ts
├── lib/         i18n.tsx  (تبديل حقيقي للاتجاه على <html dir lang>)
├── components/
│   ├── layout/    Navbar · Footer · Background · Brand (Logo + AR/FR)
│   ├── ui/        Section · Button · Card · Accordion · Dialog (مع حبس التركيز)
│   ├── motion/    Reveal · Stagger · WordsReveal (تحترم prefers-reduced-motion)
│   ├── devices/   Laptop · Phone (CSS فقط، بدون صور ثقيلة)
│   ├── product/   واجهات Smart Store المبنية داخلياً (سطح مكتب + هاتف)
│   └── sections/  Hero · Story · Solution · PosDemo · Devices · Modules ·
│                  Workflow · Gallery · Pricing · Download · Closing
└── App.tsx
```

---

## 5) تشغيل

```bash
npm install
npm run dev     # تطوير
npm run build   # إنتاج -> dist/index.html
```
