# Kitchen Rescue Website

A modern, responsive single-page site for Kitchen Rescue — luxury temporary kitchen pod rentals. Built with vanilla HTML, CSS and JavaScript for easy hosting anywhere.

## Features

- **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices
- **Modern UI**: Clean, professional design with smooth animations
- **Interactive Elements**: 
  - Postcode availability checker
  - Quote request form with validation
  - Smooth scrolling navigation
  - Scroll-triggered animations
- **Accessibility**: Proper focus states, semantic HTML, and keyboard navigation
- **Performance**: Optimized CSS and JavaScript with minimal dependencies

## Files Structure

```
kitchen-rescue-website/
├── index.html          # Main HTML file
├── styles.css          # All CSS styles
├── script.js           # JavaScript functionality
├── assets/             # Images (logo, hero, gallery)
│   ├── logo-dark.png
│   └── logo-light.png
└── README.md           # This file
```

Note: The markup references `assets/logo.png` and `assets/hero.jpg` as placeholders. Update those paths or add matching files under `assets/` as needed.

## Getting Started

1. **Open the website**: Simply open `index.html` in any modern web browser
2. **Local server** (recommended): Use a local server for best experience:
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js (if you have it)
   npx serve .
   
   # Using PHP
   php -S localhost:8000
   ```
3. **View**: Navigate to `http://localhost:8000` in your browser

Or open directly from Finder/Terminal:

```bash
open /Users/jcicchirillo/kitchen-rescue-website/index.html
```

## Features Overview

### Header
- Fixed navigation with smooth scroll behavior
- Logo with Kitchen Rescue branding
- Responsive navigation menu

### Hero Section
- Compelling headline and description
- Call-to-action buttons
- Postcode availability checker
- Key features highlights

### Features Section
- 6 key features with icons
- Responsive grid layout
- Hover effects and animations

### Specifications
- Detailed technical specifications
- Insurance support information
- Visual spec diagram placeholder

### Gallery
- 6 placeholder images in responsive grid
- Click handlers for future lightbox functionality

### Pricing & Quote Form
- Flexible pricing information
- Interactive quote request form
- Form validation and submission handling

### FAQs
- 4 common questions and answers
- Clean card-based layout

### Footer
- Contact information
- Business hours
- Legal information

## Customization

### Colors
The website uses a consistent color scheme defined in CSS:
- Primary Red: `#dc2626`
- Black: `#000000`
- White: `#ffffff`
- Gray tones: Various shades for text and backgrounds

### Content
- Update contact information in the footer
- Modify pricing information in the pricing section
- Add real images to replace placeholders
- Update company details and legal information

### Styling
- All styles are in `styles.css`
- Responsive breakpoints: 640px, 768px, 1024px
- Easy to modify fonts, colors, and spacing

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Dependencies

- **Lucide Icons**: Loaded via CDN for consistent iconography
- **Google Fonts**: Inter font family for modern typography
- **No JavaScript frameworks**: Pure vanilla JavaScript for maximum compatibility

## Deployment

### Option 1: GitHub Pages (static hosting)
1. Initialize a repo and push:
   ```bash
   cd /Users/jcicchirillo/kitchen-rescue-website
   git init
   git add .
   git commit -m "Initial site"
   git branch -M main
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```
2. In GitHub → Settings → Pages:
   - Source: `Deploy from a branch`
   - Branch: `main` → `/ (root)` → Save
3. Your site will be available at the Pages URL shown in the banner.

### Option 2: Netlify (drag-and-drop or repo)
1. Sign in to Netlify and click "Add new site" → "Import an existing project".
2. Choose your Git repo and set:
   - Build command: leave empty (no build needed)
   - Publish directory: `/`
3. Or drag the whole folder onto the Netlify dashboard to deploy instantly.

### Option 3: Vercel (static export)
1. Import the repo in Vercel.
2. Framework preset: `Other` (no build step)
3. Output/public directory: `/`
4. Deploy.

### Custom domain
- Point your domain’s DNS to your host (A/CNAME as instructed by GitHub Pages/Netlify/Vercel).
- Add the domain in the host dashboard and ensure HTTPS is issued.

## Future Enhancements

- Add real images and photos
- Integrate with a backend for form submissions
- Add Google Analytics or similar tracking
- Implement a proper image gallery/lightbox
- Add more interactive animations
- Integrate with a booking system
- Add customer testimonials section

## Technical Notes

- Uses CSS Grid and Flexbox for layouts
- Implements smooth scrolling and scroll animations
- Form validation with visual feedback
- Responsive images with aspect ratio preservation
- Accessible navigation and focus states
- Optimized for performance and SEO

## License

This website template is created for Kitchen Rescue. Modify as needed for your business requirements.
