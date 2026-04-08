# SectionBingo

A simple GitHub Pages-friendly icebreaker bingo site for UCSC CMPM 121 / CSGD students.

## Customize the prompts

Edit `items.json` and update the `items` array with your own prompts.

## Run locally

You can serve the folder with any static file server, for example:

```powershell
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Publish to GitHub Pages

1. Push this repo to GitHub.
2. Open **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Select your main branch and the `/ (root)` folder.
5. Save, then wait for the Pages URL to appear.

Because this site is plain `HTML`, `CSS`, and `JavaScript`, it works well on GitHub Pages with no build step.
