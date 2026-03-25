# TodayGrid

TodayGrid is a lightweight daily task check-in webpage for tracking what you want to do each day, marking tasks as completed, and reviewing progress by date.

## Features

- Add daily tasks with title, note, and priority
- Mark tasks as completed or switch them back to pending
- Edit and delete existing tasks
- Filter tasks by all, pending, and completed
- View task progress for a selected date
- Highlight the current focus task on the homepage
- Save data locally with browser `localStorage`
- Responsive layout for desktop and mobile

## Tech Stack

- HTML
- CSS
- JavaScript
- Browser `localStorage`

## Project Structure

```text
.
├── index.html
├── style.css
├── script.js
├── README.md
└── .gitignore
```

## Local Usage

1. Open `index.html` directly in your browser.
2. Add tasks from the right-side form.
3. Manage tasks from the homepage task list.
4. Data is stored in your current browser only.

## Important Note

This project is currently a pure frontend static site.

That means:
- Different users do not share the same task data
- Data is stored only in each user's browser
- Clearing browser storage may remove saved tasks

If you want all users to see the same tasks, you will need a backend service and a database.

## Deployment

This project can be deployed as a static site on platforms such as:
- Vercel
- GitHub Pages
- Netlify
- Cloudflare Pages

## Vercel Update Workflow

If your project is already connected to GitHub and deployed with Vercel, use this workflow whenever you update the code:

1. Modify local files
2. Test locally in your browser
3. Run:

```bash
git add .
git commit -m "describe your update"
git push
```

4. Wait for Vercel to deploy automatically
5. Open the production URL to verify the changes

## Suggested Commit Messages

```bash
git commit -m "update homepage layout"
git commit -m "add task filters"
git commit -m "rename project to TodayGrid"
```

## Future Improvements

- Shared data across multiple users
- User accounts and login
- Cloud database support
- Weekly and monthly statistics
- Task categories and tags
- Reminder notifications

## License

This project is for personal learning and product prototyping.
