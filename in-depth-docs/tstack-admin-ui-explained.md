# TStack Admin UI: The Human Guide

This package creates a professional Admin Dashboard for your application. It is
designed to save you from the boredom of writing the same HTML forms over and
over again.

## The "Magic" (Configuration-Driven UI)

In a traditional admin panel, if you want to manage "Products", you have to:

1. Write an HTML Table to list them.
2. Write a Pagination component.
3. Write a Search bar logic.
4. Write an HTML Form to create them.
5. Write another HTML Form to edit them.
6. Write the Javascript to fetch the data.

**In TStack Admin, you do none of this.**

We use a philosophy called **Configuration-Driven**. You simply tell the system
_what_ your data looks like, and the system _draws_ the UI for you.

### How it Works

You create one "Config" file for your entity (e.g., `products.config.ts`). In
this file, you describe the fields:

> "I have a field called 'Price'. It is a **number**. Show it on the list. Show
> it in the form."

> "I have a field called 'Status'. It is a **select** dropdown. The options are
> 'Active' and 'Draft'."

**That's it.** The system reads this and instantly generates:

- A **Data Table** with columns for Price and Status.
- A **Create Form** where 'Price' is a number input and 'Status' is a dropdown
  menu.
- Validation logic that ensures 'Price' is actually a number.

---

## The User Interface

The Admin Panel is built with **Fresh** (a modern, fast web framework) and
styled with **Tailwind CSS** and **DaisyUI**.

### 1. The List Page

By default, every entity gets a powerful list view.

- **Smart Columns**: It shows the columns you asked for.
- **Formatting**: It knows how to format Dates, Money, and Badges automatically.
- **Pagination**: Built-in support for pages (1, 2, 3...) and page sizes (10,
  20, 50 items).

### 2. The Forms

The generic form system is intelligent.

- It handles layout (labels, inputs, error messages).
- It handles state (typing in boxes).
- It handles submission (sending data to the API and showing success/error
  notifications).

### 3. Customization

"Configuration-Driven" doesn't mean "Limited".

- **Custom Rendering**: You can tell the config: "For the 'Image' field, don't
  just show the URL text. Render an actual `<img>` tag."
- **Custom Logic**: Since this is all standard code, you can eject from the
  generic system at any time and write a custom page (e.g., a complex Analytics
  dashboard) using standard React/Preact components.

---

## The Workflow

1. **Define**: You or the CLI creates the `config` file.
2. **Scaffold**: The CLI creates 4 small files that link your route (URL) to
   that config.
3. **Launch**: Your Admin Panel is live.

If you need to change something later (e.g., "Let's hide the 'Created At' date
from the form"), you just change `showInForm: false` in the config file. You
don't have to dig through HTML.

---

## Why this architecture?

We chose this approach because **Admin Panels are internal tools**. You
shouldn't spend weeks building them. You should spend minutes. This system
allows you to build a robust tool for your support staff or operations team in a
fraction of the time, while still looking professional and polished.

---

## Image Uploads with ImageUploadPane

The Admin UI includes a powerful `ImageUploadPane` island component for S3 image
uploads. It's used on product pages but can be added to any entity.

### Features

- **Drag & Drop**: Drop files directly onto the upload zone
- **Preview**: See images before uploading
- **Progress**: Visual upload progress indicators
- **Primary Selection**: Click to set a primary image
- **Delete**: Remove images (also deletes from S3)
- **Queue Mode**: On "create" pages, queues uploads until entity is saved
- **Immediate Mode**: On "edit" pages, uploads instantly

### Adding to Your Entity

1. Add an `image` type field to your entity config:

```typescript
{
  name: "images",
  label: "Images",
  type: "image",
  showInShow: true,
  showInForm: false,
  imageConfig: {
    entityType: "posts",
    allowMultiple: true,
    maxFiles: 10,
  },
}
```

2. Use in your show/edit page:

```typescript
import ImageUploadPane from "@/islands/ImageUploadPane.tsx";

<ShowPage config={config} item={item}>
  <ImageUploadPane entityType="posts" entityId={item.id} />
</ShowPage>;
```

The API backend handles all S3 operations - you just configure and use.
