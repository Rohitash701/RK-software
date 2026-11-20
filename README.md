# RK SOFTWARE — New Website

A responsive, multi-section website starter for RK SOFTWARE. It is designed to work as a static GitHub Pages site.

## Included
- Home / landing page
- Services overview
- Tools catalogue with category filters
- Credits section
- Support enquiry form
- Login / registration front-end demo
- Customer dashboard and demo order history
- Local admin demo to add/remove catalogue products
- Responsive layout for phones, tablets and desktop

## Run locally
Open `index.html` in a browser. For a local server, run:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000`.

## Publish to GitHub Pages
1. Extract this ZIP.
2. Open your GitHub repository for the RK SOFTWARE website.
3. Upload `index.html`, `styles.css`, `app.js`, and `README.md` to the repository root.
4. Commit the changes.
5. In **Settings → Pages**, select the branch and `/ (root)` folder, then save.
6. Open the published Pages URL.

## Important before real launch
This package is a front-end prototype, not a secure production store:
- Login and registration are browser-only demonstrations using `localStorage`. Passwords are **not securely protected**.
- Demo orders and support enquiries stay only in the current browser. They are not sent to you.
- The admin demo is not protected by server-side authentication. Anyone who can open the site can inspect/change local demo data.
- No real payment gateway, credit top-up, automated fulfilment, IMEI lookup, device unlock, or server API is connected.
- Sample products and prices are placeholders. Replace them with your actual lawful services, prices, delivery terms and contact details.
- For production, connect a backend (for example Firebase or Supabase) with server-side access rules, secure authentication, database storage, admin roles, order processing and a payment provider. Never put API secrets in front-end JavaScript or a public GitHub repository.

## Customise
- Change the brand text and contact details in `index.html`.
- Edit sample products in `seedProducts` inside `app.js`.
- Adjust colours and layout in `styles.css`.
- Update `support@example.com` and business hours in the Support section.
