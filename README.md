# Somewhere in the Universe — Cinematic Love Experience

A mobile-first, vanilla HTML/CSS/JS interactive romantic short film with a pink/magenta nebula universe.

## Files

- `index.html`
- `style.css`
- `script.js`

Flat structure; no build system required.

## Run locally

Open `index.html` in a browser, or serve the folder with any static server.

For example:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Deploy to GitHub Pages

1. Create a repository.
2. Put the three files in the repository root.
3. Push to the default branch.
4. In GitHub: Settings → Pages → deploy from the repository branch.
5. Select the root folder.

## Remote media

The experience uses the exact media URLs requested:

- photo1.jpg
- photo2.jpg
- photo3.JPG
- love.mp3

No assets directory is required.

## Customization

Most pacing is in `CONFIG` inside `script.js`.

Scene durations are on each `.scene` in `index.html` using `data-duration`.

The final message and all story copy can be edited directly in `index.html`.

## Browser notes

- Audio intentionally waits for a user gesture.
- The main story is gated until `audio.play()` resolves successfully.
- Touch, pointer, keyboard and reduced-motion fallbacks are included.
- The experience is designed portrait-first and scales to desktop.
