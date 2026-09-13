# The TJ Method

Marketing site for **The TJ Method Pty Ltd** — Certified Transition Coaching by Thomas Joffe.

A static HTML/CSS/JS site.

- `index.html` — landing page (hero, problem, method, audience, about, contact)
- `survey.html` — the **5 Cs Readiness Snapshot**, a 10-question diagnostic that scores the leader / transition across the five lenses (Context · Culture · Commitment · Circles · Confidence)
- `reads.html` / `read.html` — **The Method Reads**, eight diagnostic reads with a hub and a runner
- `foundry/` — **The Foundry**, the change-management workbench. Drafts against the Claude API or a local model through Ollama

## The Foundry on iPhone

The Foundry installs to the iPhone home screen straight from Safari — no App
Store, no TestFlight. Share → Add to Home Screen and it opens full screen with
its own icon, and keeps working offline.

Getting the **local** model working from a phone takes one extra step, because
`localhost` on a phone is the phone. Full walkthrough, including the
Safari mixed-content rule and the three ways around it:
**[IPHONE.md](IPHONE.md)**.

Serve the site to your phone over the network:

```
./tools/serve-lan.sh
```

Check the phone can actually reach Ollama: open `/foundry/connect.html` on the
phone, test the address, save the model into the app.

A native shell, for when you want the local model reachable without a
plain-HTTP LAN server, is in [`ios-native/`](ios-native/README.md).

## Local preview

Open `index.html` directly in a browser, or serve the folder with any static server:

```
python -m http.server 8000
```

then visit `http://localhost:8000`.

App icons and launch screens are generated, not hand-drawn. To rebuild them:

```
node tools/make-icons.mjs
```

## Deploy

This repo includes a `render.yaml` blueprint. In Render:

1. **New → Blueprint**
2. Connect this GitHub repo
3. Accept the proposed `tjmethod` static-site service

That's it — pushes to `main` auto-deploy.

## Contact

- Email — thomas@thetjmethod.com.au
- Phone — +61 473 833 625
- LinkedIn — [linkedin.com/in/thomasjoffe](https://www.linkedin.com/in/thomasjoffe)
