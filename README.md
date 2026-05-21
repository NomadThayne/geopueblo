# GeoPueblo

**The world is your pueblo** — a bilingual blog covering global money, culture, and cross-border life.

## Tech Stack

- [Astro](https://astro.build) — static site generator
- Deployed via [Cloudflare Pages](https://pages.cloudflare.com) (free)
- Source hosted on [GitHub](https://github.com)

## Local Development

```bash
# Install dependencies
npm install

# Start dev server at http://localhost:4321
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
geopueblo/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── Nav.astro
│   │   └── Footer.astro
│   ├── layouts/
│   │   └── BaseLayout.astro
│   └── pages/
│       ├── index.astro     ← Landing page
│       └── blog.astro      ← Blog index
├── astro.config.mjs
└── package.json
```

## Deploy to Cloudflare Pages

1. Push this repo to GitHub
2. Go to [Cloudflare Pages](https://pages.cloudflare.com)
3. Click **Create a project** → Connect to Git → select this repo
4. Set build settings:
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
5. Click **Save and Deploy**

Cloudflare will auto-deploy on every push to `main`. Done!

## Adding Blog Posts

Add new `.astro` files to `src/pages/blog/` or connect a headless CMS like [Contentful](https://contentful.com) or [Sanity](https://sanity.io).

## Hero Image

The hero uses a free Unsplash photo. To replace it:
1. Download your preferred image to `public/images/hero.jpg`
2. In `src/pages/index.astro`, change the `background-image` URL to `/images/hero.jpg`

## Affiliate Links

Add affiliate links naturally within blog posts. High-converting programs:
- [Wise](https://wise.com/partners) — $50–100/referral
- [Remitly](https://remitly.com/affiliates) — $20–40/signup
- [Revolut](https://revolut.com/referral) — $30–60/activation
