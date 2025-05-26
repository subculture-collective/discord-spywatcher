# 🪄 UI Component Guide (Catppuccin Mocha + Tailwind v4.1)

This file documents all reusable Tailwind utility classes defined using `@layer components` in `src/index.css`.

---

## 🟦 Buttons

### Primary

```html
<button class="btn btn-primary">Save</button>
```

### Danger

```html
<button class="btn btn-danger">Delete</button>
```

### Outline

```html
<button class="btn btn-outline">Cancel</button>
```

---

## 🟫 Cards

```html
<div class="card">
  <h2 class="text-xl font-bold">Admin Panel</h2>
  <p class="text-ctp.subtext0">Manage users and settings</p>
</div>
```

---

## 🟪 Badges

```html
<span class="badge">ADMIN</span>
```

---

## 🔵 Links

```html
<a href="/settings" class="link">Go to settings</a>
```

---

## 📝 Inputs (Use with Tailwind utilities)

For forms, use normal Tailwind + Catppuccin colors:

```html
<input
  class="bg-ctp.surface0 border border-ctp.surface2 text-ctp.text p-2 rounded outline-none focus:ring focus:ring-ctp.blue"
/>
```

---

## 🔐 Alerts (optional custom styles)

```html
<div class="bg-ctp.red text-ctp.base p-4 rounded border border-ctp.maroon">
  <strong class="font-semibold">Error:</strong> Something went wrong.
</div>
```

---

## ✅ Recommended Usage

Define shortcuts in `@layer components` inside `index.css`:

```css
@layer components {
  .btn { @apply px-4 py-2 rounded-md ... }
  ...
}
```

To expand this guide:

- Add modals, tooltips, dropdowns
- Document utility-based layout patterns
