# Single-Page CV

A clean, semantic, and accessible single-page CV built with HTML5 and CSS3.

## Tech Stack
- **HTML5**: Semantic markup for structure
- **CSS3**: For styling (optional in initial version)
- **Optional**: Favicon image (`.ico` or `.png`)
- **No JS required** for this initial version

## File Structure
```
single-page-cv/
│
├─ index.html
├─ style.css
├─ README.md
└─ build_log.md
```

## Description
This project is a single-page CV that follows modern web standards with semantic HTML structure. It includes sections for education, skills, and career history, with proper navigation and accessibility features.

## Features
- Semantic HTML structure for accessibility
- Responsive design ready
- SEO-friendly meta tags
- Social sharing Open Graph tags
- Navigation to different sections
- Clean and professional layout

## How to Use
1. Clone or download this repository
2. Open `index.html` in any modern web browser
3. Customize the content with your personal information
4. Replace the placeholder favicon with your own
5. Add CSS styling as needed

## Sections
- **Header**: Name, professional title, and navigation
- **Education**: Academic qualifications
- **Skills**: Professional skills
- **Career History**: Work experience
- **Footer**: Contact information and copyright

## Customization
To customize this CV:
1. Replace all placeholder text (enclosed in brackets) with your personal information
2. Add your own favicon file
3. Style with CSS as desired
4. Update meta tags with your information

## HTML Structure
The CV follows semantic HTML5 structure:
- `<header>`: Contains name, title, and navigation
- `<nav>`: Main navigation with links to sections
- `<main>`: Main content area with:
  - `<section>` elements for different CV sections
  - `<article>` elements for individual items (education, jobs)
  - `<time>` elements with datetime attributes for dates
  - Proper heading hierarchy (h1 → h2 → h3)
- `<footer>`: Contact information and copyright

## Accessibility Features
- Semantic HTML elements for proper document structure
- ARIA labels for navigation
- Skip link for keyboard navigation
- Proper heading hierarchy
- Time elements with datetime attributes
- Alt attributes for images (to be added)
- Landmark roles for screen readers