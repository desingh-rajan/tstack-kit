# TStack Storefront Starter

> Premium, "Batteries-Included" E-commerce Storefront for TStack Kit.

Part of the **TStack Kit** ecosystem, this starter provides a production-ready, highly performant storefront built on **Fresh** (Deno's next-gen web framework).

## Features

### 🔋 Batteries Included
Unlike bare-bones "Hello World" templates, this starter comes with a complete, professional landing page structure:

- **Hero Section**: High-conversion hero component with CTA
- **Features Grid**: Clean, icon-based feature highlights
- **About Section**: Brand storytelling with visual layout
- **Contact Form**: Professional contact/lead gen section
- **Responsive Footer**: Multi-column SEO-friendly footer

### ⚡ Technical Excellence
- **Fresh Framework**: Zero-runtime overhead, edge-ready architecture.
- **Preact**: Lightweight, fast React alternative for interactive "islands".
- **Tailwind CSS 4**: The latest utility-first styling with Vite integration.
- **TypeScript**: Full type safety from backend to frontend.

### 🔗 TStack Integration
Designed to work seamlessly with your TStack Workspace:

- **API Integration**: Pre-configured to consume your TStack API (`my-api`).
- **Unified Types**: Share DTOs and types with your backend (via copied types or shared packages).
- **Admin Managed**: Content displayed here is managed via your TStack Admin UI.

## Getting Started

This project is automatically generated when you run:

```bash
tstack create workspace my-shop
```

To run it locally:

```bash
cd my-shop/my-shop-store
deno task dev
```

Your storefront will be available at `http://localhost:8000` (or the next available port).

## Project Structure

```text
src/
├── components/        # Reusable UI components (Hero, Footer, etc.)
├── islands/           # Interactive client-side components (Preact)
├── routes/            # File-system based routing
│   ├── index.tsx      # Landing page
│   └── [name].tsx     # Dynamic routes
├── static/            # Static assets (images, fonts)
└── fresh.config.ts    # Framework configuration
```

## Customization

### Styling
We use **Tailwind CSS**. Customize your theme in the tailwind configuration or directly in components using utility classes.

### Data Fetching
Use Fresh's powerful [Handlers](https://fresh.deno.dev/docs/getting-started/fetching-data) in your routes to fetch data from your **TStack API** before rendering.

```typescript
// routes/products/[id].tsx
export const handler: Handlers<Product> = {
  async GET(_, ctx) {
    const resp = await fetch(`http://localhost:8000/api/products/${ctx.params.id}`);
    const product = await resp.json();
    return ctx.render(product);
  },
};
```
