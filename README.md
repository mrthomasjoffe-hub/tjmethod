# The TJ Method

Marketing site for **The TJ Method Pty Ltd** — Certified Transition Coaching by Thomas Joffe.

A static HTML/CSS/JS site. Two pages:

- `index.html` — landing page (hero, problem, method, audience, about, contact)
- `survey.html` — the **5 Cs Readiness Snapshot**, a 10-question diagnostic that scores the leader / transition across the five lenses (Context · Culture · Commitment · Circles · Confidence)

## Local preview

Open `index.html` directly in a browser, or serve the folder with any static server:

```
python -m http.server 8000
```

then visit `http://localhost:8000`.

## Deploy

This repo includes a `render.yaml` blueprint. In Render:

1. **New → Blueprint**
2. Connect this GitHub repo
3. Accept the proposed `tjmethod` static-site service

That's it — pushes to `main` auto-deploy.

## Contact

- Email — mrthomasjoffe@gmail.com
- Phone — +61 473 833 625
- LinkedIn — [linkedin.com/in/thomasjoffe](https://www.linkedin.com/in/thomasjoffe)
