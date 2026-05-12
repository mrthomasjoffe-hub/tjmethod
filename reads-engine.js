/* ===========================================================
   The Method Reads — generic survey engine
   ===========================================================
   Reads ?id=<readId> from the URL, looks up the read in
   window.METHOD_READS, and renders:
     - intro panel (collapses on start)
     - one step per dimension (questions grouped)
     - results panel (bars per dimension + interpretation)
     - email-export form (mailto:)
   =========================================================== */

(function () {

  const EMAIL = "thomas@thetjmethod.com.au";
  const data = window.METHOD_READS;
  if (!data) return;

  const { READS, LIKERT, helpers } = data;

  // ---------- locate the read by ?id= ----------
  function readIdFromUrl() {
    const u = new URL(window.location.href);
    return u.searchParams.get("id") || "leader";
  }

  const read = READS[readIdFromUrl()];
  const root = document.getElementById("readRoot");
  if (!read || !root) {
    if (root) {
      root.innerHTML = `
        <div class="survey-card">
          <h2>That read isn&rsquo;t available.</h2>
          <p class="muted">The link may be old. <a href="reads.html">See all the reads &rarr;</a></p>
        </div>`;
    }
    return;
  }

  // ---------- group questions by dimension to define steps ----------
  const steps = read.dimensions.map((dim) => ({
    dim: dim.key,
    name: dim.name,
    questions: read.questions.filter((q) => q.dim === dim.key)
  }));
  const totalSteps = steps.length;

  // ---------- render shell ----------
  document.title = `${read.name} — The Method Reads`;

  root.innerHTML = `
    <div class="survey-head">
      <p class="eyebrow">${read.eyebrow} &middot; The Method Reads</p>
      <h1>${read.name}</h1>
      <p>${read.tagline}</p>
    </div>

    <div class="survey-card">

      <section class="read-intro" id="readIntro">
        <p class="step-cee">${read.estimate}</p>
        <p class="read-intro-copy">${read.intro}</p>
        <p class="read-audience"><strong>Who it&rsquo;s for.</strong> ${read.audience}</p>
        <div class="step-nav">
          <a class="btn btn-back" href="reads.html">&larr; All reads</a>
          <button type="button" class="btn btn-primary" id="beginRead">Begin the read &rarr;</button>
        </div>
      </section>

      <div class="progress" id="progress" hidden>
        <span id="progressLabel">Step 1 of ${totalSteps}</span>
        <div class="progress-bar"><div class="progress-bar-fill" id="progressFill"></div></div>
        <span id="progressPct">0%</span>
      </div>

      <form id="readForm" novalidate>
        ${steps.map((s, idx) => `
          <section class="step" data-step="${idx + 1}" data-dim="${s.dim}">
            <p class="step-cee">Dimension ${idx + 1} of ${totalSteps} &middot; ${s.name}</p>
            <h2>${dimensionHeadline(read.id, s.dim)}</h2>
            <p class="step-desc">${dimensionDesc(read.id, s.dim)}</p>

            ${s.questions.map((q, qi) => `
              <div class="question">
                <p>${q.q}</p>
                <div class="scale" data-q="${read.id}_${s.dim}_${qi}"></div>
              </div>
            `).join("")}

            <div class="step-nav">
              ${idx === 0
                ? `<button type="button" class="btn btn-back" data-restart>&larr; Read intro</button>`
                : `<button type="button" class="btn btn-back" data-back>&larr; Back</button>`}
              ${idx === totalSteps - 1
                ? `<button type="button" class="btn btn-primary" id="seeResults">See my read &rarr;</button>`
                : `<button type="button" class="btn btn-primary" data-next>Continue &rarr;</button>`}
            </div>
          </section>
        `).join("")}
      </form>

    </div>

    <section class="results" id="results">
      <p class="step-cee">Your read</p>
      <h2 class="results-h">Here&rsquo;s where ${read.name.replace(/^The\s+/, "the ")} is reading strong &mdash; and where it isn&rsquo;t.</h2>

      <div class="bars" id="bars"></div>

      <div class="results-summary" id="resultsSummary"></div>

      <aside class="ssc-prompt" aria-label="Stop, Start, Continue reflection">
        <p class="ssc-kicker">Now &mdash; before you close this</p>
        <h3 class="ssc-h">Stop &middot; Start &middot; Continue.</h3>
        <p class="ssc-intro">
          Hold the read against three questions. Ten minutes. Honest answers, not novel ones.
          What you write here is the read translated into the only thing that matters next week.
        </p>
        <div class="ssc-cols">
          <div class="ssc-col">
            <span class="ssc-lbl">Stop</span>
            <p>What is the one thing this read suggests you should stop doing &mdash; even though it has been working until now?</p>
          </div>
          <div class="ssc-col">
            <span class="ssc-lbl">Start</span>
            <p>What is the one new behaviour, ritual, or conversation this read says you should start this week?</p>
          </div>
          <div class="ssc-col">
            <span class="ssc-lbl">Continue</span>
            <p>What is the one thing already working that this read confirms, and that you should protect?</p>
          </div>
        </div>
      </aside>

      <div class="results-cta">
        <h3 class="results-cta-h">Want the read translated into action?</h3>
        <p class="results-cta-p">
          Send the snapshot through. I&rsquo;ll come back to you within two business days
          with the one-page read and a time to talk if it&rsquo;s useful.
        </p>

        <form id="emailResults" class="email-form">
          <div class="email-row">
            <label>
              <span>Name</span>
              <input type="text" name="name" required autocomplete="name" />
            </label>
            <label>
              <span>Email</span>
              <input type="email" name="email" required autocomplete="email" />
            </label>
          </div>
          <label>
            <span>A line or two of context (optional)</span>
            <textarea name="context" rows="3" placeholder="What&rsquo;s the transition you&rsquo;re sitting inside?"></textarea>
          </label>
          <button class="btn btn-primary email-submit" type="submit">Send me the read &amp; book a call</button>
          <p class="form-note" id="emailNote" aria-live="polite"></p>
        </form>
      </div>

      <div class="results-actions">
        <a class="btn btn-ghost" href="reads.html">Back to all reads</a>
        <button class="btn btn-back" type="button" id="retake">Retake this read</button>
      </div>
    </section>
  `;

  // ---------- build the Likert scale inside each .scale ----------
  root.querySelectorAll(".scale[data-q]").forEach((el) => {
    const name = el.dataset.q;
    el.innerHTML = LIKERT.map((s) => `
      <label>
        <input type="radio" name="${name}" value="${s.v}" required />
        <span>
          <span class="scale-num">${s.n}</span>
          <span class="scale-lbl">${s.lbl}</span>
        </span>
      </label>
    `).join("");
  });

  // ---------- wizard state ----------
  const form = document.getElementById("readForm");
  const intro = document.getElementById("readIntro");
  const progress = document.getElementById("progress");
  const progressLabel = document.getElementById("progressLabel");
  const progressFill = document.getElementById("progressFill");
  const progressPct = document.getElementById("progressPct");
  const stepEls = Array.from(form.querySelectorAll(".step"));
  const results = document.getElementById("results");
  let current = 0;

  function showStep(i) {
    intro.hidden = true;
    progress.hidden = false;
    stepEls.forEach((s, idx) => s.classList.toggle("active", idx === i));
    results.classList.remove("active");
    current = i;
    const pct = Math.round(((i + 1) / totalSteps) * 100);
    progressLabel.textContent = `Step ${i + 1} of ${totalSteps}`;
    progressFill.style.width = pct + "%";
    progressPct.textContent = pct + "%";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function showIntro() {
    intro.hidden = false;
    progress.hidden = true;
    stepEls.forEach((s) => s.classList.remove("active"));
    results.classList.remove("active");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function validateStep(i) {
    const step = stepEls[i];
    const groups = new Set();
    step.querySelectorAll("input[type=radio]").forEach((r) => groups.add(r.name));
    for (const n of groups) {
      const picked = step.querySelector(`input[name="${n}"]:checked`);
      if (!picked) {
        const q = step.querySelector(`input[name="${n}"]`).closest(".question");
        q.scrollIntoView({ behavior: "smooth", block: "center" });
        q.animate(
          [{ transform: "translateX(0)" }, { transform: "translateX(-4px)" }, { transform: "translateX(4px)" }, { transform: "translateX(0)" }],
          { duration: 320 }
        );
        return false;
      }
    }
    return true;
  }

  document.getElementById("beginRead").addEventListener("click", () => showStep(0));
  form.querySelectorAll("[data-restart]").forEach((b) => b.addEventListener("click", showIntro));
  form.querySelectorAll("[data-next]").forEach((b) =>
    b.addEventListener("click", () => { if (validateStep(current)) showStep(current + 1); })
  );
  form.querySelectorAll("[data-back]").forEach((b) =>
    b.addEventListener("click", () => { if (current > 0) showStep(current - 1); })
  );

  document.getElementById("seeResults").addEventListener("click", () => {
    if (!validateStep(current)) return;
    renderResults();
  });

  document.getElementById("retake").addEventListener("click", () => {
    form.reset();
    showIntro();
  });

  // ---------- scoring & results ----------
  function score() {
    const fd = new FormData(form);
    const scores = {};
    let total = 0, max = 0;
    read.dimensions.forEach((dim) => {
      const qs = read.questions.filter((q) => q.dim === dim.key);
      const dMax = qs.length * 5;
      let dSum = 0;
      qs.forEach((q, qi) => {
        const val = Number(fd.get(`${read.id}_${dim.key}_${qi}`)) || 0;
        dSum += val;
      });
      scores[dim.key] = { name: dim.name, score: dSum, max: dMax };
      total += dSum;
      max += dMax;
    });
    const overall = Math.round((total / max) * 100);
    return { scores, overall };
  }

  function renderResults() {
    const { scores, overall } = score();

    // bars
    const bars = document.getElementById("bars");
    bars.innerHTML = Object.values(scores).map((s) => {
      const pct = Math.round((s.score / s.max) * 100);
      return `
        <div class="bar-row">
          <div class="bar-label">
            <span class="bar-name">${s.name}</span>
            <span class="bar-score">${s.score}/${s.max} &middot; ${helpers.interpretDim(s.score, s.max)}</span>
          </div>
          <div class="bar-track"><div class="bar-fill" data-pct="${pct}"></div></div>
        </div>
      `;
    }).join("");

    // summary
    document.getElementById("resultsSummary").innerHTML = read.summary(scores, overall);

    // show
    stepEls.forEach((s) => s.classList.remove("active"));
    intro.hidden = true;
    progress.hidden = false;
    progressLabel.textContent = "Your read";
    progressFill.style.width = "100%";
    progressPct.textContent = "100%";
    results.classList.add("active");
    window.scrollTo({ top: 0, behavior: "smooth" });

    requestAnimationFrame(() => {
      bars.querySelectorAll(".bar-fill").forEach((b) => { b.style.width = b.dataset.pct + "%"; });
    });

    form.dataset.scoresJson = JSON.stringify(
      Object.fromEntries(Object.entries(scores).map(([k, v]) => [v.name, `${v.score}/${v.max}`]))
    );
    form.dataset.overall = overall;
  }

  // ---------- email export ----------
  const emailForm = document.getElementById("emailResults");
  const emailNote = document.getElementById("emailNote");
  emailForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(emailForm);
    const name = (fd.get("name") || "").toString().trim();
    const email = (fd.get("email") || "").toString().trim();
    const context = (fd.get("context") || "").toString().trim();
    if (!name || !email) {
      emailNote.textContent = "Name and email are required.";
      emailNote.className = "form-note err";
      return;
    }
    const scores = JSON.parse(form.dataset.scoresJson || "{}");
    const overall = form.dataset.overall || "—";
    const scoresLine = Object.entries(scores).map(([k, v]) => `  ${k}: ${v}`).join("\n");
    const subject = encodeURIComponent(`${read.name} — ${name}`);
    const body = encodeURIComponent(
      `Read: ${read.name}\n` +
      `Name: ${name}\n` +
      `Email: ${email}\n\n` +
      `Overall reading: ${overall}%\n\n` +
      `Dimensions:\n${scoresLine}\n\n` +
      `Context:\n${context || "(none provided)"}\n\n` +
      `— Sent from The Method Reads`
    );
    window.location.href = `mailto:${EMAIL}?subject=${subject}&body=${body}`;
    emailNote.textContent = "Your mail client should open now. If nothing opens, email " + EMAIL + " directly.";
    emailNote.className = "form-note ok";
  });

  // ---------- per-dimension headlines & desc (kept light, brand-voiced) ----------
  function dimensionHeadline(readId, dimKey) {
    const map = {
      // leader
      "leader|Context":    "The environment around the work.",
      "leader|Culture":    "What this organisation rewards, ignores, and punishes.",
      "leader|Commitment": "How much skin in the game.",
      "leader|Circles":    "Influence, upward and lateral.",
      "leader|Confidence": "Your leadership DNA on a hard week.",
      // pressure
      "pressure|Load":      "How much is being asked.",
      "pressure|Velocity":  "How fast decisions move.",
      "pressure|Recovery":  "How much your people get back.",
      "pressure|Attention": "What's left of focus by Thursday.",
      // sponsor
      "sponsor|Visibility":        "Where your sponsor actually appears.",
      "sponsor|Decision":          "Whether decisions happen, or are deferred.",
      "sponsor|Costly support":    "What it has cost the sponsor — visibly.",
      "sponsor|Political capital": "What they will spend, not just say.",
      // signal
      "signal|Clarity":       "What you actually mean.",
      "signal|Channel":       "How it travels.",
      "signal|Receiver":      "What people do with it on Monday.",
      "signal|Repeatability": "How well it survives a fourth telling.",
      // impact
      "impact|Role":     "Whose day looks different.",
      "impact|Skill":    "Whose craft is changing.",
      "impact|Identity": "Whose status is shifting.",
      "impact|Recovery": "What support is proportional to impact.",
      // capability
      "capability|Skills":     "What people need to know.",
      "capability|Behaviours": "What they need to do differently.",
      "capability|Tools":      "What they need in their hands.",
      "capability|Confidence": "What they need to believe.",
      // bridge
      "bridge|As-is":      "How honestly you see today.",
      "bridge|To-be":      "How specifically you see tomorrow.",
      "bridge|Gap":        "What it actually costs to cross.",
      "bridge|Sequencing": "How you've designed the crossing.",
      // coppse
      "coppse|Customer":      "Who you exist for.",
      "coppse|Operating":     "How you're organised to deliver.",
      "coppse|People":        "Who is doing the work.",
      "coppse|Process":       "How the work flows.",
      "coppse|System":        "What technology underpins it.",
      "coppse|Environmental": "What is changing around you."
    };
    return map[`${readId}|${dimKey}`] || dimKey;
  }

  function dimensionDesc(readId, dimKey) {
    const map = {
      "leader|Context":    "What is the world actually asking of you — commercially, competitively, structurally?",
      "leader|Culture":    "Culture is the difference between what's in the plan and what actually happens on a hard week.",
      "leader|Commitment": "Where commitment is shallow, the work fractures under pressure.",
      "leader|Circles":    "No transition is delivered alone. The map of who you need, and where you stand with them, is usually the difference.",
      "leader|Confidence": "Not the version on a good day. The version on the third call after a difficult board meeting.",
      "pressure|Load":      "What is being asked of the system, not what's been authorised on a slide.",
      "pressure|Velocity":  "Speed isn't always progress. Decisions made too fast still need to be re-made.",
      "pressure|Recovery":  "Capacity is a renewable resource — unless it isn't being renewed.",
      "pressure|Attention": "Attention is the rarest resource in a high-pressure organisation. Measure it directly.",
      "sponsor|Visibility":        "Sponsors who are 'always supportive' but never present are a recognised failure mode.",
      "sponsor|Decision":          "Decisions deferred indefinitely become decisions made by absence.",
      "sponsor|Costly support":    "Anyone can say yes. A sponsor pays for the yes when it's expensive.",
      "sponsor|Political capital": "Budget without political backing rarely lands. The reverse, often does.",
      "signal|Clarity":       "Clarity is a property of what arrives, not what was sent.",
      "signal|Channel":       "Messages take the shape of the channels they travel through.",
      "signal|Receiver":      "If people can't act on it on Monday, the message did not arrive.",
      "signal|Repeatability": "Most messages need to be repeated more times than the sender finds comfortable.",
      "impact|Role":     "Roles change first. Identities follow. Both are observable, if you look.",
      "impact|Skill":    "Skill changes are easier to deny than to design for. Both populations notice.",
      "impact|Identity": "When status changes, naming it is more humane than pretending it hasn't.",
      "impact|Recovery": "Disruption without recovery becomes attrition. Eventually.",
      "capability|Skills":     "Named, baselined, and being built — or assumed.",
      "capability|Behaviours": "Behaviours change last and are coached, not announced.",
      "capability|Tools":      "Tooling lands before the work, or the work lands without the tooling.",
      "capability|Confidence": "Competence is half the story. Belief carries the other half.",
      "bridge|As-is":      "The honest map of what works today — including what works for reasons no one designed.",
      "bridge|To-be":      "A specific picture of a working day, not a strategy poster.",
      "bridge|Gap":        "The distance between, measured in everything it will actually cost to cross.",
      "bridge|Sequencing": "The order matters more than most plans acknowledge.",
      "coppse|Customer":      "Customer reality in the to-be state, observed not assumed.",
      "coppse|Operating":     "The mechanics of how value is delivered — designed, not inherited.",
      "coppse|People":        "Who you're growing, who you're keeping, who you're letting go — honestly.",
      "coppse|Process":       "What survives, what's retired, what's quietly preserved by habit.",
      "coppse|System":        "Technology that fits the new operating model, not the old one with patches.",
      "coppse|Environmental": "The world you're transitioning into — regulatory, competitive, societal."
    };
    return map[`${readId}|${dimKey}`] || "";
  }

})();
