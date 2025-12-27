# Screenshot Guide

Use this folder to store documentation screenshots for the banking website.

## What to capture
- **Home**: full landing page including hero, features, and footer.
- **Dashboard**: logged-in view showing account summary and recent activity.
- **Transfer/Receipt**: transfer initiation screen and the resulting confirmation/receipt view.

## Capture settings
- Recommended width: **1200px** (or closest available viewport). Adjust height as needed to avoid clipping key sections.
- Prefer PNG for clarity; JPEG is acceptable for large images when file size is a concern.

## Naming and placement
- Name files by page and state, e.g., `home.png`, `dashboard.png`, `transfer-receipt.png`.
- Keep all images in this `screenshots/` directory.

## Referencing images in markdown
Use relative links from the document that includes the screenshot:

```markdown
![Dashboard overview](./screenshots/dashboard.png)
```

If the markdown file is in the same directory as this guide, omit the `screenshots/` prefix:

```markdown
![Home page](./home.png)
```
