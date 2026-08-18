# The TJ Method

Marketing site for **The TJ Method Pty Ltd** — Certified Transition Coaching by Thomas Joffe.

A static HTML/CSS/JS site. Pages:

- `index.html` — landing page (hero, problem, method, audience, about, contact)
- `survey.html` — the **5 Cs Readiness Snapshot**, a 10-question diagnostic that scores the leader / transition across the five lenses (Context · Culture · Commitment · Circles · Confidence)
- `reads.html` / `read.html` — **The Method Reads**, eight diagnostics driven by `reads-data.js` + `reads-engine.js`
- `ai.html` — AI engine settings (see below)

## The AI layer

The scored read is deterministic and always renders first. On top of it, an
optional layer drafts the **long read** — what this particular pattern of
scores means dimension by dimension, plus a specific Stop / Start / Continue
and one concrete action.

| File | What it does |
| --- | --- |
| `ai.js` | Provider-agnostic engine layer. `TJAI.complete({system, user, schema, maxTokens})` against **Ollama** (local) or the **Claude API**, hybrid: the preferred engine is tried first and the other picks up the job if it isn't reachable. Nothing read-specific lives here. |
| `ai-read.js` | The Reads' prompt, JSON schema, and rendering. Listens for the `tjmethod:results` event both read engines fire once scoring is done. |
| `ai.html` | Per-browser settings — engine, Ollama URL and model, Claude key and model, connection test. |

Two rules hold it together:

1. **Scoring stays in JavaScript.** It is deterministic and identical for
   everyone. The model receives the numbers and writes about them; it never
   calculates, adjusts, or invents a score, and the prompt says so.
2. **The template renders first.** The AI layer is additive. No engine
   configured, Ollama switched off, or a failed draft — the visitor still sees
   exactly the read they see today.

### Configuring an engine

Open `/ai`, pick an engine, save. Settings live in that browser's
`localStorage` under `tjmethod.ai.v1` and are sent nowhere except the engine
chosen. Visitors who haven't configured one see no change at all.

For Ollama, `ollama pull llama3.1:8b` or larger — structured output needs a
reasonably capable model. Serving this site over https also requires
`OLLAMA_ORIGINS` to be set on the Ollama side.

**A local model only runs where it is installed.** `localhost` in a browser
means *that visitor's own machine*, so Ollama drafts reads on your laptop and
not for anyone else. Offering local drafting to visitors would mean putting
Ollama behind a proxy on a machine that stays online; the Claude side of the
hybrid is what covers everyone else in the meantime.

### Adding another surface

`ai.js` knows nothing about reads. Anything else on the site — the Frames on
the Workbench, the Foundry — plugs in by calling `TJAI.complete()` with its
own system prompt and JSON schema, in a sibling of `ai-read.js`. The settings
page and the hybrid fallback come along for free.

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

- Email — thomas@thetjmethod.com.au
- Phone — +61 473 833 625
- LinkedIn — [linkedin.com/in/thomasjoffe](https://www.linkedin.com/in/thomasjoffe)
