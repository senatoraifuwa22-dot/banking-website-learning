## How to open the static pages

- The quickest way to view the site is to open `pages/index.html` in your browser (double-click the file from your file explorer or `open pages/index.html` from the terminal).
- Recommended: use the VS Code “Live Server” extension to serve the `pages/` folder so links resolve correctly and you can auto-reload as you edit.

## CSS organization

- `assets/css/base.css`: resets, typography, colors, and tokens used across the site.
- `assets/css/layout.css`: global layout scaffolding such as grid helpers, containers, header/footer, and spacing rules.
- `assets/css/components.css`: shared UI pieces like buttons, form controls, cards, tables, navigation, alerts, and toast/modal primitives.
- `assets/css/pages/`: page-specific overrides:
  - `home.css` for the marketing/landing page.
  - `auth.css` for login/register/forgot/reset flows.
  - `dashboard.css`, `accounts.css`, `transactions.css`, `transfer.css` for customer experiences.
  - `admin.css` and supporting admin page styles.

## Page map by audience

- Public/unauthenticated: `index.html`, `login.html`, `register.html`, `forgot-password.html`, `reset-password.html`, `contact.html`, `terms.html`, `privacy.html`, and `admin-login.html` (admin entry point).
- Authenticated customers: `dashboard.html`, `accounts.html`, `transactions.html`, `transfer.html`, `notifications.html`, `profile.html`, `receipt.html`.
- Admin users: `admin-dashboard.html`, `admin-accounts.html`, `admin-transactions.html`, `admin-audit.html`, `admin-users.html`.

## Notes on future JS enhancements

Each app shell includes `#toast-root` and `#modal-root` containers. They are placeholders for future JavaScript-driven toasts and dialogs; in the static build they remain empty.
