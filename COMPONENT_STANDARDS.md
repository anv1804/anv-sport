# ANV Sport — CMS Component Standards

Tài liệu này là nguồn duy nhất đúng (single source of truth) cho style và component trong toàn bộ CMS admin. Mọi code mới **phải** tuân theo tiêu chuẩn này.

---

## 1. Design Tokens

### Màu chính (Brand Color)

| Vai trò | Class | Hex |
|---|---|---|
| Primary action | `emerald-600` | #059669 |
| Primary hover | `emerald-700` | #047857 |
| Primary light bg | `emerald-50` | #ecfdf5 |
| Primary focus ring | `ring-emerald-500/20` | — |
| Danger | `red-500/600` | #ef4444 |
| Danger light bg | `red-50` | #fef2f2 |

> **Không dùng `indigo`, `violet`, `purple`, `blue` làm màu primary.** Các màu này chỉ dùng cho icon/badge phân loại theo ngữ nghĩa (ví dụ: Header=blue, Footer=purple trong Settings rows).

### Text

| Class | Dùng cho |
|---|---|
| `text-slate-800 font-black` | Tiêu đề trang (h1) |
| `text-slate-800 font-bold` | Tiêu đề section, tên trong bảng |
| `text-slate-600 font-semibold` | Menu sidebar (inactive) |
| `text-slate-500 font-medium` | Mô tả, phụ chú |
| `text-slate-400` | Placeholder, icon inactive |
| `text-[11px] text-slate-400 uppercase tracking-wider font-bold` | Table header, group label |

### Border Radius

| Loại | Class |
|---|---|
| Input, Select, Tag | `rounded-lg` |
| Button, Badge action | `rounded-lg` (default), `rounded-xl` (lg) |
| Card, Panel, Table wrapper | `rounded-2xl` |
| Modal | `rounded-2xl` |
| Avatar nhỏ | `rounded-full` |
| Icon box trong sidebar/settings | `rounded-xl` |

> Quy tắc: **`rounded-lg` cho form elements, `rounded-2xl` cho containers.** Không dùng `rounded-[24px]` (magic number).

### Spacing trong form

| Element | Padding |
|---|---|
| Input | `px-4 py-2.5` |
| Select (native + custom) | `px-3 py-2.5` |
| Button default | `px-4 py-2` |
| Button lg | `px-6 py-3` |
| Button sm | `px-3 py-1.5` |
| Table header cell | `py-4 px-5` |
| Table body cell | `py-3 px-5` |
| Card padding | `p-6` |
| Modal header | `px-6 py-4` |
| Modal body | `px-6 py-6` |

---

## 2. Canonical Component Paths

**Import component từ `/components/ui/`** cho mọi code mới. Đây là hệ thống duy nhất được duy trì.

```
/components/ui/
  Button.tsx     ← PRIMARY — dùng cho mọi button
  Input.tsx      ← PRIMARY — dùng cho mọi text input
  Select.tsx     ← PRIMARY — dùng cho native <select>
  Label.tsx      ← PRIMARY — dùng cho form label
  Card.tsx       ← PRIMARY — dùng cho container card
  Modal.tsx      ← PRIMARY — dùng cho overlay modal
```

> **`/components/base/`** là legacy — đừng import trong code mới. Migrate dần khi chỉnh sửa file cũ.

---

## 3. Button

**Import:** `import { Button } from '@/components/ui/Button'`

### Variants

| Variant | Màu | Dùng cho |
|---|---|---|
| `success` | emerald-600 | **Primary action** (Save, Submit, Tạo mới) |
| `default` | slate-800 | Secondary important (Configure, View detail) |
| `outline` | white + border | Tertiary / Cancel |
| `ghost` | transparent | Icon button, inline action |
| `danger` | red-50/red text | Delete, Remove (destructive) |
| `secondary` | gray-50 | Soft action (Add menu, Add child) |
| `blue` | blue-50/blue text | Info action |

> **Quy tắc quan trọng:** "Thêm mới" / "Lưu" / "Submit" → **variant="success"**, không dùng inline `bg-emerald-600` thuần.

### Sizes

| Size | Dùng cho |
|---|---|
| `default` (px-4 py-2, text-[13px]) | Hầu hết buttons trong admin |
| `sm` | Inline action trong table, tight space |
| `lg` | CTA lớn, login button |
| `icon` | Icon-only button (p-2) |

### Examples

```tsx
// Primary action
<Button variant="success">
  <Save className="w-4 h-4 mr-1.5" /> Lưu
</Button>

// Destructive
<Button variant="danger" size="sm">
  <Trash2 className="w-4 h-4" />
</Button>

// Add new (page header)
<Button variant="success">
  <Plus className="w-4 h-4 mr-1.5" /> Thêm Mới
</Button>

// Loading state
<Button variant="success" isLoading={loading}>Đang lưu...</Button>
```

---

## 4. Input

**Import:** `import { Input } from '@/components/ui/Input'`

```tsx
<Input
  placeholder="Nhập tên..."
  error={hasError}   // boolean — turns border red
/>
```

- Luôn dùng cùng `<Label>` phía trên.
- `error={true}` để highlight đỏ khi validation fail.

---

## 5. Label

**Import:** `import { Label } from '@/components/ui/Label'`

```tsx
<Label htmlFor="name" required>Tên cầu thủ</Label>
<Input id="name" ... />
```

- `required` tự thêm dấu `*` màu đỏ.
- Luôn dùng cặp `Label + Input`, không inline label text.

---

## 6. Select (Native)

**Import:** `import { Select } from '@/components/ui/Select'`

Dùng khi danh sách option ngắn (< 15 items), không cần search.

```tsx
<Select value={value} onChange={e => setValue(e.target.value)} error={hasError}>
  <option value="">-- Chọn --</option>
  <option value="FOOTBALL_PLAYER">Bóng đá</option>
</Select>
```

---

## 7. SearchableSelect (Custom Dropdown)

**Import:** `import { SearchableSelect } from '@/components/base/SearchableSelect'`

Dùng khi danh sách > 15 items hoặc cần search. Hỗ trợ group, depth (cây phân cấp).

```tsx
<SearchableSelect
  options={[
    { value: 'abc', label: 'Tên mục', group: 'Nhóm A', depth: 0 },
    { value: 'def', label: 'Mục con', group: 'Nhóm A', depth: 1 },
  ]}
  value={selected}
  onChange={setSelected}
  placeholder="Chọn danh mục..."
/>
```

> `CategorySearchSelect` (dùng `id` thay vì `value`) dành riêng cho category picker trong MenuSettings — không dùng cho use case khác.

---

## 8. Modal

**Import:** `import { Modal } from '@/components/ui/Modal'`

```tsx
<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Tiêu đề modal"
  maxWidth="lg"    // sm | md | lg | xl | 2xl | 3xl | 4xl | 5xl
  footer={
    <>
      <Button variant="outline" onClick={() => setIsOpen(false)}>Hủy</Button>
      <Button variant="success" isLoading={loading}>Lưu</Button>
    </>
  }
>
  {/* nội dung */}
</Modal>
```

- Luôn có footer khi modal có action (Save/Cancel).
- Không đặt Save button trong body, đặt trong `footer`.

---

## 9. Card

**Import:** `import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card'`

```tsx
<Card>
  <CardHeader>
    <CardTitle>Thông tin cơ bản</CardTitle>
    <CardDescription>Điền đầy đủ các trường bắt buộc</CardDescription>
  </CardHeader>
  <CardContent>
    {/* form fields */}
  </CardContent>
  <CardFooter>
    <Button variant="success">Lưu</Button>
  </CardFooter>
</Card>
```

---

## 10. Page Layout Patterns

### Admin Page Header (dùng cho mọi trang admin)

```tsx
<div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
  <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
    <div>
      <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-2">
        Tên trang
      </h1>
      <p className="text-slate-500 font-medium">Mô tả ngắn</p>
    </div>
    <div className="flex items-center gap-3">
      {/* Action buttons */}
      <Button variant="success">
        <Plus className="w-4 h-4 mr-1.5" /> Thêm Mới
      </Button>
    </div>
  </div>
  {/* Page content */}
</div>
```

### Data Table

```tsx
<div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
  <table className="w-full text-left">
    <thead className="bg-slate-50 border-b border-slate-200">
      <tr>
        <th className="py-4 px-5 font-bold text-slate-500 text-xs uppercase tracking-wider">
          Cột
        </th>
        <th className="py-4 px-5 font-bold text-slate-500 text-xs uppercase tracking-wider text-right">
          Thao tác
        </th>
      </tr>
    </thead>
    <tbody className="divide-y divide-slate-100">
      {items.map(item => (
        <tr key={item.id} className="hover:bg-slate-50 transition-colors">
          <td className="py-3 px-5">...</td>
          <td className="py-3 px-5 text-right">
            <div className="flex items-center justify-end gap-2">
              <Button variant="ghost" size="icon" asChild>
                <Link href={`/admin/xyz/${item.id}/edit`}>
                  <Edit className="w-4 h-4" />
                </Link>
              </Button>
              <Button variant="danger" size="icon">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

### Form Page (Create/Edit)

```tsx
<div className="max-w-3xl mx-auto space-y-6">
  {/* Breadcrumb back link */}
  <Link href="/admin/xyz" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors">
    <ArrowLeft className="w-4 h-4" /> Quay lại danh sách
  </Link>

  <Card>
    <CardHeader>
      <CardTitle>Thêm mới / Chỉnh sửa</CardTitle>
    </CardHeader>
    <CardContent className="space-y-5">
      <div>
        <Label htmlFor="name" required>Tên</Label>
        <Input id="name" name="name" placeholder="..." />
      </div>
    </CardContent>
    <CardFooter className="justify-end gap-3">
      <Button variant="outline" asChild>
        <Link href="/admin/xyz">Hủy</Link>
      </Button>
      <Button variant="success" type="submit" isLoading={pending}>
        <Save className="w-4 h-4 mr-1.5" /> Lưu
      </Button>
    </CardFooter>
  </Card>
</div>
```

### Status / Feedback Messages

```tsx
{/* Success */}
<div className="flex items-center gap-2 p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-sm font-bold text-emerald-600">
  <CheckCircle2 className="w-5 h-5" /> Lưu thành công!
</div>

{/* Error */}
<div className="flex items-center gap-2 p-4 bg-red-50 border border-red-100 rounded-xl text-sm font-bold text-red-600">
  <XCircle className="w-5 h-5" /> Có lỗi xảy ra.
</div>
```

---

## 11. Badge / Status Tags

```tsx
{/* Type badge in table */}
<span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded text-xs font-bold">
  Bóng đá
</span>

{/* Active status */}
<span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold">
  Đang hoạt động
</span>

{/* Inactive status */}
<span className="px-2.5 py-1 bg-slate-100 text-slate-500 rounded-full text-xs font-bold">
  Ẩn
</span>
```

---

## 12. Các lỗi thường gặp cần tránh

| ❌ Sai | ✅ Đúng |
|---|---|
| `className="px-4 py-2 bg-emerald-600 text-white rounded-lg"` | `<Button variant="success">` |
| Import từ `@/components/base/Button` trong file mới | Import từ `@/components/ui/Button` |
| `focus:ring-indigo-500` trên form element | `focus:ring-emerald-500/20 focus:border-emerald-500` |
| `rounded-[24px]` | `rounded-2xl` |
| Tiêu đề h1 không có `font-black` | `text-3xl font-black text-slate-800 tracking-tight` |
| Modal header có gradient violet/indigo | Modal header trắng, border-b slate-100 |
| Table wrapper `rounded-[24px]` | `rounded-2xl` |
| Dùng native `<select>` cho danh sách > 15 item | Dùng `SearchableSelect` |

---

## 13. Migration Path: `/base/` → `/ui/`

Khi chỉnh sửa bất kỳ file nào trong `/app/admin/` dùng `@/components/base/`, hãy migrate sang `/ui/` trong cùng PR:

| `/base/Button` prop | `/ui/Button` tương đương |
|---|---|
| `variant="primary"` | `variant="success"` |
| `variant="secondary"` | `variant="outline"` |
| `variant="danger"` | `variant="danger"` |
| `loading={true}` | `isLoading={true}` |
| `fullWidth` | `className="w-full"` |

| `/base/Input` prop | `/ui/Input` tương đương |
|---|---|
| `label="..."` | Dùng `<Label>` riêng bên ngoài |
| `error="message"` | `error={true}` + thêm `<p>` error message bên ngoài |

| `/base/Modal` prop | `/ui/Modal` tương đương |
|---|---|
| `maxWidth="max-w-2xl"` | `maxWidth="2xl"` |
| `noScrollBody` | Đặt children trong `<div className="overflow-auto">` |
