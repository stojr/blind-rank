# BCE Comics Pod — Blind Top 5

A single-file, zero-dependency browser app for blind comic cover ranking. Users upload a set of covers, and the app presents them one at a time — no filenames, no context — so they can place each into a ranked slot purely on visual instinct.

---

## How It Works

1. **Load images** — Select 5+ comic cover images from your device.
2. **Start** — The app randomly picks 5 covers and shuffles them.
3. **Place blindly** — One cover appears at a time. Tap or drag it into a rank slot (1–5). The filename stays hidden throughout.
4. **Undo** if needed — Step back one placement at a time.
5. **Export** — When all 5 slots are filled, export a 1080×1920 PNG share card (or use the native share sheet on mobile).

---

## Files

| File | Purpose |
|---|---|
| `index.html` | Entire app — HTML, CSS, and JS in one file |
| `bce-logo.jpeg` | Podcast logo shown in the hero |
| `bce-logo.png` | Alternate logo asset |
| `bce-banner.png` | Banner image shown behind the hero header |

---

## Key Features

- **Blind flow** — Cover filenames are never shown during a run
- **Drag-and-drop + tap** — Works on desktop and mobile
- **Undo** — Revert the last placement and re-rank
- **New run** — Re-shuffle the same image pool for another attempt
- **Export card** — Renders a branded 1080×1920 PNG with rank numbers and cover thumbnails
- **Mobile share** — Uses the Web Share API when available (iOS/Android)
- **Portrait lock** — Attempts to lock screen orientation on mobile during a run
- **No dependencies** — Pure HTML/CSS/JS, no build step, no server required

---

## Customization

All branding is set at the top of the `<script>` block in `index.html`:

```js
const BRAND_LOGO_SRC  = "./bce-logo.jpeg";
const BRAND_BANNER_SRC = "./bce-banner.png";
```

Replace these paths (or swap the image files) to rebrand for a different show or event.

The export card hard-codes the text `"BCE COMICS POD"` and `"Blind Top 5"` — search for those strings in the `exportRanking()` function to update them.

---

## State & Data Flow

```
fileInput → allImages[]
           ↓
         shuffle → pickedFive[5]
                     ↓
              currentIndex (0–4)
                     ↓
              placeIntoSlot() → slots[5]
                                  ↓
                             history[] (undo stack)
                                  ↓
                           exportRanking() → PNG
```

All image data lives as `ObjectURL`s in memory. Nothing is sent to a server. `URL.revokeObjectURL()` is called on reset to free memory.

---

## Deployment

The app is a static file — host it anywhere:

- **Local** — Open `index.html` directly in a browser (file:// works)
- **GitHub Pages** — Push to a repo, enable Pages on `main`
- **Netlify / Vercel** — Drop the folder in; no build command needed
- **CDN** — Upload `index.html` + the three image assets to any object storage bucket with public read

The only requirement is that `bce-logo.jpeg`, `bce-logo.png`, and `bce-banner.png` are served from the same directory as `index.html`.

---

## Known Limitations & Potential Improvements

| Area | Note |
|---|---|
| Fixed top-5 | Pool size and slot count are hard-coded to 5. Would need a variable `N` refactor to support other counts. |
| No persistence | Closing the tab loses all state. Could add `localStorage` save/restore. |
| Export font | Canvas uses `system-ui` — font rendering varies by OS. A bundled web font would make exports consistent. |
| Filename reveal | Currently always hidden. Could add a post-run reveal toggle once all 5 are placed. |
| Accessibility | Drag-and-drop has no keyboard alternative beyond the tap/click path. |
| Single file | Convenient for distribution but harder to maintain at scale. Could split into separate CSS/JS files with a simple build step. |

---

## Running Locally

No install required:

```bash
# Option 1 — just open the file
open index.html

# Option 2 — serve with Python (avoids some file:// restrictions)
python3 -m http.server 8080
# then visit http://localhost:8080

# Option 3 — serve with Node
npx serve .
```

---

## Branch

Active development branch: `claude/create-blind-rank-md-IpFUT`
