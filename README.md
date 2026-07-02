# Smartsheet Portfolio Dashboard

GitHub Pages-ready interactive dashboard generated from `Report AI Smartsheet(1).xlsx`.

## Files

- `index.html` - main dashboard page
- `styles.css` - visual styling
- `app.js` - dashboard logic, filters, charts, and tables
- `data.js` - extracted dashboard data from the Excel file

## How to host in GitHub Pages

1. Create a new GitHub repository.
2. Upload all files in this folder to the repository root.
3. Go to **Settings > Pages**.
4. Under **Build and deployment**, select **Deploy from a branch**.
5. Select the `main` branch and `/root` folder.
6. Save. GitHub will provide your public dashboard URL.

## Counting logic

- Business Solutions are counted only from parent rows where `Business Solution` is populated.
- Ticket volume uses all rows.
- Ticket categories use `GTO Work Category`.
- Savings tables are based on Business Solution parent records, enriched with child-row totals when parent values are blank.
