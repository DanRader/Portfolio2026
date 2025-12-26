# My Static Website

A simple static website built with HTML, CSS, and JavaScript, powered by Vite for fast development.

## Project Structure

```
portfolio/
├── index.html          # Main HTML file
├── css/
│   └── styles.css      # Stylesheet
├── js/
│   └── script.js       # JavaScript functionality
├── assets/             # Images and other assets
├── vite.config.js      # Vite configuration
├── package.json        # Node dependencies
└── README.md           # This file
```

## Features

- ⚡️ Vite dev server with HMR (Hot Module Replacement)
- 📦 Plugin ecosystem support
- 🔄 Automatic browser refresh on file changes
- 🎨 Responsive design
- 📱 Mobile-friendly layout

## Getting Started

### Install Dependencies

```bash
npm install
```

### Development

Start the dev server with live reload:

```bash
npm run dev
```

This will start Vite at http://localhost:3000 and automatically open your browser.

### Build for Production

```bash
npm run build
```

Output will be in the `dist/` folder.

### Preview Production Build

```bash
npm run preview
```

## Adding Plugins

Vite has a rich plugin ecosystem. To add plugins:

1. Install the plugin: `npm install -D plugin-name`
2. Import it in `vite.config.js`
3. Add it to the `plugins` array

Popular plugins:
- `vite-plugin-imagemin` - Image optimization
- `vite-plugin-svg-icons` - SVG sprite generation
- `vite-plugin-html` - HTML transformations

## Customization

- Edit `index.html` to change content
- Modify `css/styles.css` to adjust styling
- Add JavaScript functionality in `js/script.js`
- Place images in the `assets/` folder
- Configure Vite in `vite.config.js`

## Deployment

Build the project and deploy the `dist/` folder to:
- Netlify
- Vercel
- GitHub Pages
- Any static hosting service

## Third-party assets

- `public/assets/hand-pointer.svg` is from Font Awesome Free (Icons: CC BY 4.0): https://fontawesome.com/license/free
