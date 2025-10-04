# Single-Page CV Development Plan

## Tech Stack
- **HTML5**: Semantic markup for structure  
- **CSS3**: For future styling (optional in initial version)  
- **Optional**: Favicon image (`.ico` or `.png`)  
- **No JS required** for this initial version

---

## Step-by-Step Actionable Plan

### 1. Project Setup
1. Create a project folder named `single-page-cv`.
2. Inside the folder, create the following files:
   - `index.html` → main CV page  
   - `favicon.ico` → optional favicon for the page  
   - `README.md` → project documentation

---

### 2. Define HTML Boilerplate
1. Add `<!DOCTYPE html>` and `<html>` tags with `lang="en"`.
2. Add `<head>` section:
   - `<meta charset="UTF-8">`  
   - `<meta name="viewport" content="width=device-width, initial-scale=1.0">`  
   - SEO meta tags: `description`, `keywords`, `author`  
   - Open Graph tags for social sharing: `og:title`, `og:description`, `og:type`, `og:url`, `og:image`  
   - Favicon link: `<link rel="icon" href="favicon.ico" type="image/x-icon">`  
   - `<title>` tag

---

### 3. Build Header Section
1. Create `<header>` tag.
2. Add:
   - `<h1>` for the name.  
   - `<p>` for tagline/professional title.  
   - `<nav>` with links to `#education`, `#skills`, `#career`.

---

### 4. Create Main Content
1. Use `<main>` tag to wrap all sections.  
2. Create `<section>` tags for:
   - **Education**:  
     - Use `<article>` for each qualification.  
     - Include `<h3>` for degree/title, `<p>` for institution and dates.
   - **Skills**:  
     - Use `<ul>` for listing skills.
   - **Career History**:  
     - Use `<article>` for each job.  
     - Include `<h3>` for job title, `<p>` for company and dates, `<ul>` for responsibilities.

---

### 5. Build Footer
1. Add `<footer>` tag.  
2. Include contact info (`mailto:` link) and copyright.

---

### 6. Semantic and Accessibility Checks
1. Ensure all tags are semantic (`header`, `main`, `section`, `article`, `footer`).  
2. Use proper heading hierarchy: `<h1>` → `<h2>` → `<h3>`.  
3. Ensure `<nav>` links point to section IDs.  
4. Check that `<alt>` attributes are added to any future images.

---

### 7. Documentation
1. In `README.md`, include:
   - Project description  
   - Tech stack  
   - File structure  
   - Instructions for opening `index.html` in a browser  
2. Document each section of the HTML structure with comments.

---

### 8. Optional Enhancements
1. Add **placeholder CSS classes** for future styling.  
2. Prepare **placeholder sections for future content** (projects, hobbies, certifications).  
3. Consider **responsive design meta tags** and testing on different devices.

---

### 9. Testing
1. Open `index.html` in multiple browsers (Chrome, Firefox, Edge).  
2. Test navigation links in `<nav>`.  
3. Verify favicon appears in the browser tab.  
4. Validate HTML via [W3C Validator](https://validator.w3.org/).

---

### 10. Version Control (Optional but Recommended)
1. Initialize Git repository: `git init`  
2. Commit initial HTML structure: `git add . && git commit -m "Initial CV structure"`  
3. Document all subsequent updates with meaningful commit messages.

---

### File Structure Example

```
single-page-cv/
│
├─ index.html
├─ favicon.ico
└─ README.md
```

