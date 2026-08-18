/* ===========================================================
   The TJ Method — site + survey JS
   - Renders the 5-point scale into every .scale[data-q]
   - Multi-step survey wizard with progress
   - Score per C lens, results bars, interpretation
   - Sends results & contact-form notes via mailto:
   =========================================================== */

(function () {

  const EMAIL = "thomas@thetjmethod.com.au";

  // ---------- Build scales (1-5 likert) ----------
  const SCALE = [
    { v: 1, n: "1", lbl: "Strongly disagree" },
    { v: 2, n: "2", lbl: "Disagree" },
    { v: 3, n: "3", lbl: "Mixed" },
    { v: 4, n: "4", lbl: "Agree" },
    { v: 5, n: "5", lbl: "Strongly agree" }
  ];

  document.querySelectorAll(".scale[data-q]").forEach((el) => {
    const q = el.dataset.q;
    el.innerHTML = SCALE.map((s) => `
      <label>
        <input type="radio" name="${q}" value="${s.v}" required />
        <span>
          <span class="scale-num">${s.n}</span>
          <span class="scale-lbl">${s.lbl}</span>
        </span>
      </label>
    `).join("");
  });

  // ---------- Survey wizard ----------
  const form = document.getElementById("surveyForm");
  if (form) {

    const steps = Array.from(form.querySelectorAll(".step"));
    const results = document.getElementById("results");
    const progressLabel = document.getElementById("progressLabel");
    const progressFill = document.getElementById("progressFill");
    const progressPct = document.getElementById("progressPct");
    const total = steps.length;
    let current = 0;

    function showStep(i) {
      steps.forEach((s, idx) => s.classList.toggle("active", idx === i));
      results.classList.remove("active");
      current = i;
      updateProgress();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function updateProgress() {
      const pct = Math.round(((current + 1) / total) * 100);
      progressLabel.textContent = `Step ${current + 1} of ${total}`;
      progressFill.style.width = pct + "%";
      progressPct.textContent = pct + "%";
    }

    function validateStep(i) {
      const step = steps[i];
      const groups = new Set();
      step.querySelectorAll("input[type=radio]").forEach((r) => groups.add(r.name));
      for (const name of groups) {
        const picked = step.querySelector(`input[name="${name}"]:checked`);
        if (!picked) {
          const first = step.querySelector(`input[name="${name}"]`);
          first.closest(".question").scrollIntoView({ behavior: "smooth", block: "center" });
          first.closest(".question").animate(
            [{ transform: "translateX(0)" }, { transform: "translateX(-4px)" }, { transform: "translateX(4px)" }, { transform: "translateX(0)" }],
            { duration: 320 }
          );
          return false;
        }
      }
      return true;
    }

    form.querySelectorAll("[data-next]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (!validateStep(current)) return;
        if (current < total - 1) showStep(current + 1);
      });
    });

    form.querySelectorAll("[data-back]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (current > 0) showStep(current - 1);
      });
    });

    const seeResultsBtn = document.getElementById("seeResults");
    if (seeResultsBtn) {
      seeResultsBtn.addEventListener("click", () => {
        if (!validateStep(current)) return;
        renderResults();
      });
    }

    document.getElementById("retake")?.addEventListener("click", () => {
      form.reset();
      showStep(0);
    });

    // ---------- Scoring ----------
    function calcScores() {
      const fd = new FormData(form);
      const cees = ["Context", "Culture", "Commitment", "Circles", "Confidence"];
      const scores = {};
      cees.forEach((c, idx) => {
        const a = Number(fd.get(`c${idx + 1}q1`)) || 0;
        const b = Number(fd.get(`c${idx + 1}q2`)) || 0;
        // 2 questions × 5 max = 10. Normalise to /10.
        scores[c] = a + b;
      });
      return { scores, cees };
    }

    function interpret(score) {
      if (score >= 9) return "strong";
      if (score >= 7) return "steady";
      if (score >= 5) return "uneven";
      return "leaking";
    }

    function summaryText(scores) {
      const entries = Object.entries(scores).sort((a, b) => b[1] - a[1]);
      const strongest = entries[0];
      const weakest = entries[entries.length - 1];

      const total = entries.reduce((s, [, v]) => s + v, 0);
      const max = entries.length * 10;
      const overall = Math.round((total / max) * 100);

      let band;
      if (overall >= 80) band = "Your foundation is in good shape. The work now is sharpening, not rebuilding.";
      else if (overall >= 60) band = "Steady, with one or two specific lenses pulling weight away from the rest.";
      else if (overall >= 40) band = "The signal is mixed. Energy is going into the work, but the system isn't reliably converting it.";
      else band = "This transition is asking more of you, or the organisation, than the current foundation can carry. That's a finding, not a failing.";

      return `
        <strong>Overall readiness:</strong> ${overall}%. ${band}
        <br/><br/>
        <strong>Your strongest lens is ${strongest[0]} (${strongest[1]}/10).</strong>
        This is where the transition has the most reliable footing &mdash; protect it.
        <br/><br/>
        <strong>Your weakest lens is ${weakest[0]} (${weakest[1]}/10).</strong>
        This is where the work is quietly leaking energy. Most leaders try to fix this with more effort.
        Usually it's a structural conversation that&rsquo;s been postponed &mdash; with a sponsor, a peer, or yourself.
      `;
    }

    function renderResults() {
      const { scores, cees } = calcScores();

      const bars = document.getElementById("bars");
      bars.innerHTML = cees.map((c) => {
        const s = scores[c];
        const pct = Math.round((s / 10) * 100);
        return `
          <div class="bar-row">
            <div class="bar-label">
              <span class="bar-name">${c}</span>
              <span class="bar-score">${s}/10 &middot; ${interpret(s)}</span>
            </div>
            <div class="bar-track"><div class="bar-fill" data-pct="${pct}"></div></div>
          </div>
        `;
      }).join("");

      document.getElementById("resultsSummary").innerHTML = summaryText(scores);

      steps.forEach((s) => s.classList.remove("active"));
      results.classList.add("active");
      progressLabel.textContent = "Your snapshot";
      progressFill.style.width = "100%";
      progressPct.textContent = "100%";
      window.scrollTo({ top: 0, behavior: "smooth" });

      // animate fills
      requestAnimationFrame(() => {
        bars.querySelectorAll(".bar-fill").forEach((b) => {
          b.style.width = b.dataset.pct + "%";
        });
      });

      // stash for email
      form.dataset.scoresJson = JSON.stringify(scores);

      // Scoring is done and final by this point. Anything listening
      // (ai-read.js) gets the numbers to write about, never to change.
      const entries = Object.entries(scores);
      const overall = Math.round(
        (entries.reduce((sum, [, v]) => sum + v, 0) / (entries.length * 10)) * 100
      );
      document.dispatchEvent(new CustomEvent("tjmethod:results", {
        detail: {
          readId: "leader",
          readName: "The 5 Cs Readiness Snapshot",
          tagline: "Where is your transition strong — and where is it leaking energy?",
          overall,
          band: bandFor(overall),
          dimensions: entries.map(([name, v]) => ({
            name,
            score: v,
            max: 10,
            pct: Math.round((v / 10) * 100),
            verdict: interpret(v),
            headline: "",
            desc: ""
          }))
        }
      }));
    }

    // Same thresholds summaryText() uses, given a tag so a draft can
    // match the band's tone without re-deriving it.
    function bandFor(overall) {
      if (overall >= 80) return { tag: "Solid",    line: "Your foundation is in good shape. The work now is sharpening, not rebuilding." };
      if (overall >= 60) return { tag: "Steady",   line: "Steady, with one or two specific lenses pulling weight away from the rest." };
      if (overall >= 40) return { tag: "Mixed",    line: "The signal is mixed. Energy is going into the work, but the system isn't reliably converting it." };
      return { tag: "Strained", line: "This transition is asking more of you, or the organisation, than the current foundation can carry. That's a finding, not a failing." };
    }

    // ---------- Email results form ----------
    const emailForm = document.getElementById("emailResults");
    const emailNote = document.getElementById("emailNote");
    emailForm?.addEventListener("submit", (e) => {
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
      const scoresLine = Object.entries(scores).map(([k, v]) => `  ${k}: ${v}/10`).join("\n");
      const subject = encodeURIComponent("5 Cs Readiness Snapshot — " + name);
      const body = encodeURIComponent(
        `Name: ${name}\n` +
        `Email: ${email}\n\n` +
        `Scores:\n${scoresLine}\n\n` +
        (form.dataset.aiHeadline
          ? `The long read:\n  ${form.dataset.aiHeadline}\n  If you do one thing: ${form.dataset.aiOneThing}\n\n`
          : "") +
        `Context:\n${context || "(none provided)"}\n\n` +
        `— Sent from thetjmethod`
      );
      window.location.href = `mailto:${EMAIL}?subject=${subject}&body=${body}`;
      emailNote.textContent = "Your mail client should open now. If nothing opens, email " + EMAIL + " directly.";
      emailNote.className = "form-note ok";
    });
  }

  // ---------- Contact form (homepage) ----------
  const contact = document.getElementById("contactForm");
  if (contact) {
    const note = document.getElementById("formNote");
    contact.addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(contact);
      const name = (fd.get("name") || "").toString().trim();
      const email = (fd.get("email") || "").toString().trim();
      const message = (fd.get("message") || "").toString().trim();
      if (!name || !email || !message) {
        note.textContent = "Please fill in name, email, and a short note.";
        note.className = "form-note err";
        return;
      }
      const subject = encodeURIComponent("Enquiry from " + name + " — The TJ Method");
      const body = encodeURIComponent(
        `Name: ${name}\nEmail: ${email}\n\n${message}\n\n— Sent from thetjmethod`
      );
      window.location.href = `mailto:${EMAIL}?subject=${subject}&body=${body}`;
      note.textContent = "Your mail client should open now. If nothing opens, email " + EMAIL + " directly.";
      note.className = "form-note ok";
    });
  }

})();
