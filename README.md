# GTO Portfolio Dashboard

This dashboard is built from `Report AI Smartsheet.xlsx` and is ready for GitHub Pages.

## How to publish
1. Create a new GitHub repository.
2. Upload these files to the root of the repository: `index.html`, `styles.css`, `app.js`, and `data.js`.
3. Go to **Settings > Pages**.
4. Under **Build and deployment**, select **Deploy from a branch**.
5. Select your branch, usually `main`, and the `/root` folder.
6. Save and open the GitHub Pages URL.

## What this version shows
- Parent initiative count from `Business Solution = 1`.
- Ticket counts by `GTO Work Category`: Initiative, BAU/KTLO, Enhancement.
- Status by category using `Jira Status`.
- Top 10 completed parent initiatives by highest annual savings.
- Backlog / active parent initiatives grouped by Jira Status.
- Users impacted and type of savings.
- Search and filters by Department, Jira Status, GTO Category, and Type of Savings.

## Important
This version is fully self-contained and does not require Chart.js or any external library. It should work both locally and on GitHub Pages.
