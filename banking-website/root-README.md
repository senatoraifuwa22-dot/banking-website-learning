# Banking Website Learning Path

A beginner-friendly practice project that evolves from a static banking UI into a fully interactive experience and, eventually, an Express API. Each stage is intentionally simple so you can focus on one concept at a time without getting overwhelmed.

## Folder structure
- `01-static-html-css`: Pure HTML and CSS pages that establish the visual layout and accessible markup.
- `02-vanilla-js-enhancement`: The same pages, lightly enhanced with vanilla JavaScript to mock API calls and interactivity.
- `03-backend-api`: Placeholder for a future Express server that will power the UI for real. (Currently scaffolded; implementation coming next.)
- `shared`: Reference docs and the `officer-contact.json` helper file that both the UI and API can read.

## How to run the stages
Use a Live Server extension (VS Code or similar) so the pages load assets correctly; `file://` won’t work for relative imports.

A) **Static stage**
- Open `01-static-html-css/pages/index.html` with Live Server.
- Example path: `/banking-website/01-static-html-css/pages/index.html`.

B) **JavaScript enhancement stage**
- Use Live Server to open the HTML in `01-static-html-css/pages`; each page already imports `../../02-vanilla-js-enhancement/index.js`, which then pulls in the right module from `/js`.
- Great for seeing mocked dashboards, transfers, and admin lists without needing a backend.

C) **Backend stage** (coming next)
- From `03-backend-api`, install dependencies (`npm install`) and run `node src/server.js`.
- The server file is a stub today; the API routes will be added later as the course progresses.

## Common troubleshooting
- **Live Server required:** Opening pages over `file://` will break asset paths and mocked API calls—always launch via Live Server.
- **Favicon 404 warnings:** A data URL favicon is included to silence these warnings. If you still see one, it is harmless.
- **`officer-contact.json` 404:** Ensure requests point to `/shared/officer-contact.json`. You can also provide a fallback contact inline in the UI until the backend serves it.

## Learning order (recommended)
1. Skim this `root-README.md` to understand the stages.
2. Open `01-static-html-css/pages/index.html` and `.../dashboard.html` to see the core layout patterns.
3. Review `01-static-html-css/assets/css/base.css` and `layout.css` to learn the design tokens and grid.
4. Move to `02-vanilla-js-enhancement/index.js` plus the files in `02-vanilla-js-enhancement/js/` to see how light DOM scripting layers onto the markup.
5. Check `shared/docs/user-stories.md` and `shared/docs/api-spec.md` to connect UI flows to upcoming backend endpoints.
6. Finally, peek at `03-backend-api/src/server.js` to visualize where the API will live once implemented.
