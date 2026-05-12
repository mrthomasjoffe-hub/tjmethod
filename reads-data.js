/* ===========================================================
   The Method Reads — diagnostic data
   ===========================================================
   Each read is a self-contained object with:
   - id           short URL slug
   - name         display name
   - eyebrow      short label ("Read 2 of 8")
   - tagline      one-liner for the hub card
   - intro        full paragraph for the read's own page
   - estimate     "8 questions · 5 minutes"
   - dimensions   ordered list of dimension keys + display names
   - questions    each { dim, q } — dim must match a dimensions key
   - bands        interpretation bands by overall % (overrideable)
   - summary(scores, overall) -> HTML interpretation
   =========================================================== */

(function () {

  // Likert scale used by every read (1-5)
  const LIKERT = [
    { v: 1, n: "1", lbl: "Strongly disagree" },
    { v: 2, n: "2", lbl: "Disagree" },
    { v: 3, n: "3", lbl: "Mixed" },
    { v: 4, n: "4", lbl: "Agree" },
    { v: 5, n: "5", lbl: "Strongly agree" }
  ];

  // ---------- shared scoring helpers ----------

  function band(overall) {
    if (overall >= 80) return { tag: "Solid", line: "Your foundation is in good shape. The work now is sharpening, not rebuilding." };
    if (overall >= 65) return { tag: "Steady", line: "Largely intact, with one or two specific dimensions pulling weight away from the rest." };
    if (overall >= 45) return { tag: "Mixed",  line: "The signal is mixed. Energy is going into the work, but the system isn't reliably converting it." };
    if (overall >= 30) return { tag: "Strained", line: "There's effort, but the underlying conditions aren't holding it. Something structural is being asked to absorb what it can't." };
    return { tag: "Critical", line: "This is a finding, not a failing. The current foundation cannot carry what's being asked of it. The conversation now is structural, not operational." };
  }

  function interpretDim(score, max) {
    const pct = (score / max) * 100;
    if (pct >= 80) return "strong";
    if (pct >= 60) return "steady";
    if (pct >= 40) return "uneven";
    return "leaking";
  }

  function rank(scores) {
    const entries = Object.entries(scores).sort((a, b) => b[1].score - a[1].score);
    return { strongest: entries[0], weakest: entries[entries.length - 1] };
  }

  // Standard summary template — used by most reads, parameterised by lead-in copy.
  function makeSummary(strongLine, weakLine) {
    return (scores, overall) => {
      const b = band(overall);
      const { strongest, weakest } = rank(scores);
      return `
        <strong>Overall reading: ${overall}% &mdash; ${b.tag}.</strong> ${b.line}
        <br/><br/>
        <strong>Strongest dimension: ${strongest[1].name} (${strongest[1].score}/${strongest[1].max}).</strong>
        ${strongLine}
        <br/><br/>
        <strong>Weakest dimension: ${weakest[1].name} (${weakest[1].score}/${weakest[1].max}).</strong>
        ${weakLine}
      `;
    };
  }

  // ---------- the eight reads ----------

  const READS = {

    // =========================================================
    // 1. THE LEADER'S READ — 5 Cs Snapshot
    // =========================================================
    leader: {
      id: "leader",
      name: "The Leader's Read",
      eyebrow: "Read 1 of 8",
      tagline: "Where is your transition strong — and where is it leaking energy?",
      intro: "The original Snapshot. Ten questions across the five lenses I use in every coaching engagement — Context, Culture, Commitment, Circles, Confidence. A one-page read on where your transition has reliable footing, and where the work is quietly leaking energy. Five minutes. No account, no follow-up unless you ask for one.",
      estimate: "10 questions · 5 minutes",
      audience: "For the leader inside the transition.",
      dimensions: [
        { key: "Context",    name: "Context" },
        { key: "Culture",    name: "Culture" },
        { key: "Commitment", name: "Commitment" },
        { key: "Circles",    name: "Circles" },
        { key: "Confidence", name: "Confidence" }
      ],
      questions: [
        { dim: "Context",    q: "I can articulate, in one sentence, the external pressure driving this transition." },
        { dim: "Context",    q: "The pace of change in my environment matches what my organisation can absorb." },
        { dim: "Culture",    q: "The behaviours we reward today match the behaviours this transition requires." },
        { dim: "Culture",    q: "When something goes wrong, we examine the system, not the individual." },
        { dim: "Commitment", q: "The most senior sponsor of this work has personal skin in the game — not just rhetorical support." },
        { dim: "Commitment", q: "We have the time and resources this transition realistically needs." },
        { dim: "Circles",    q: "I know exactly whose buy-in I need this quarter, and where I stand with each of them." },
        { dim: "Circles",    q: "The people whose work this will reshape have a seat at the table — not just a status update." },
        { dim: "Confidence", q: "I can describe what I bring to this transition without immediately qualifying it." },
        { dim: "Confidence", q: "My team would describe me, this month, the way I want to be described." }
      ],
      summary: makeSummary(
        "This is where the transition has the most reliable footing &mdash; protect it.",
        "This is where the work is quietly leaking energy. Most leaders try to fix this with more effort. Usually it&rsquo;s a structural conversation that&rsquo;s been postponed &mdash; with a sponsor, a peer, or yourself."
      )
    },

    // =========================================================
    // 2. THE PRESSURE READ — change load, not initiative count
    // =========================================================
    pressure: {
      id: "pressure",
      name: "The Pressure Read",
      eyebrow: "Read 2 of 8",
      tagline: "How loud is your organisation right now?",
      intro: "Most leaders count initiatives. Operators count what's actually being absorbed. This read isn't a list of programmes — it's a check on what your system has left to give. Eight questions across the four signals of change load: how much is being asked, how fast decisions move, how much recovery your people get, and what's left of their attention by Thursday afternoon.",
      estimate: "8 questions · 4 minutes",
      audience: "For executives carrying or designing the change portfolio.",
      dimensions: [
        { key: "Load",      name: "Load" },
        { key: "Velocity",  name: "Velocity" },
        { key: "Recovery",  name: "Recovery" },
        { key: "Attention", name: "Attention" }
      ],
      questions: [
        { dim: "Load",      q: "We are running fewer initiatives than our people can realistically absorb in a quarter." },
        { dim: "Load",      q: "We finish initiatives before starting new ones, more often than not." },
        { dim: "Velocity",  q: "The decisions we make this month will still feel like the right ones in three months." },
        { dim: "Velocity",  q: "We can move quickly without leaving the rest of the system behind to clean up." },
        { dim: "Recovery",  q: "Most people in this organisation have time to think between meetings, not just attend them." },
        { dim: "Recovery",  q: "After a hard quarter, the system gets to recover before the next one begins." },
        { dim: "Attention", q: "The number of priorities a senior leader could list right now, off the top of their head, is fewer than five." },
        { dim: "Attention", q: "The signal-to-noise ratio in our internal communications is high enough that people actually read them." }
      ],
      summary: makeSummary(
        "This is where the organisation has spare capacity &mdash; or at least, where it isn&rsquo;t leaking. Notice what makes this dimension hold up, and protect it.",
        "This is where the system is being asked for more than it can return. Adding effort here makes it worse, not better. The conversation is usually structural &mdash; what gets stopped, slowed, or sequenced differently."
      )
    },

    // =========================================================
    // 3. THE SPONSOR READ — sponsorship effectiveness
    // =========================================================
    sponsor: {
      id: "sponsor",
      name: "The Sponsor Read",
      eyebrow: "Read 3 of 8",
      tagline: "Is your sponsor sponsoring, or watching?",
      intro: "Sponsorship is the single largest predictor of whether a transformation lands. And yet — most sponsors are misnamed. A sponsor who shows up to the kickoff and then 'trusts the team' is not sponsoring; they are abdicating. This read measures the four signals that distinguish a sponsor from a name on the org chart: visible decision-making, costly proximity, public skin in the game, and willingness to spend political capital. You will see your sponsor differently after.",
      estimate: "8 questions · 4 minutes",
      audience: "For programme leads, transformation directors, and sponsors themselves.",
      dimensions: [
        { key: "Visibility",        name: "Visibility" },
        { key: "Decision",          name: "Decision-making" },
        { key: "Costly support",    name: "Costly support" },
        { key: "Political capital", name: "Political capital" }
      ],
      questions: [
        { dim: "Visibility",        q: "The sponsor of this work is visibly in the room — not just on the cc line." },
        { dim: "Visibility",        q: "The sponsor names this transformation, by name, in their own monthly communications." },
        { dim: "Decision",          q: "When this transformation makes the wrong department uncomfortable, the sponsor goes there." },
        { dim: "Decision",          q: "When the sponsor is in the room, the right people stop hedging." },
        { dim: "Costly support",    q: "The sponsor has made at least one personally costly decision in service of this work." },
        { dim: "Costly support",    q: "The sponsor has skin in the game — their performance, reputation, or trust hangs on this." },
        { dim: "Political capital", q: "The sponsor spends political capital on this work, not just budget." },
        { dim: "Political capital", q: "I could tell you in one sentence what the sponsor would and wouldn't trade for this work." }
      ],
      summary: makeSummary(
        "This is where sponsorship is doing its job. Don&rsquo;t take it for granted &mdash; sponsorship erodes quietly when other work pulls the sponsor away.",
        "This is the gap. Most programme failures attribute to delivery; most are actually a slow loss of sponsorship in this exact dimension. The fix is rarely more meetings &mdash; it&rsquo;s a single direct conversation with the sponsor, in their language, about what the absence is costing."
      )
    },

    // =========================================================
    // 4. THE SIGNAL READ — communication clarity
    // =========================================================
    signal: {
      id: "signal",
      name: "The Signal Read",
      eyebrow: "Read 4 of 8",
      tagline: "What actually lands when you speak?",
      intro: "Most communication audits measure what was sent. This one measures what arrived. Eight questions on the four signals that decide whether messages travel cleanly through your organisation — or get rewritten, softened, and quietly contradicted on the way down. A clean signal isn't louder. It's the same shape, three layers deep, on a Thursday afternoon.",
      estimate: "8 questions · 4 minutes",
      audience: "For comms leads, transformation directors, and any executive whose words travel through more than two layers.",
      dimensions: [
        { key: "Clarity",       name: "Signal clarity" },
        { key: "Channel",       name: "Channel discipline" },
        { key: "Receiver",      name: "Receiver-readiness" },
        { key: "Repeatability", name: "Repeatability" }
      ],
      questions: [
        { dim: "Clarity",       q: "A person three layers down can repeat, in their own words, what this transformation is for." },
        { dim: "Clarity",       q: "We say hard things directly. We don't outsource them to slides." },
        { dim: "Channel",       q: "Our messages travel through the system without losing their shape." },
        { dim: "Channel",       q: "The frontline hears the same story from their leader as we tell ourselves at the top." },
        { dim: "Receiver",      q: "People know what to do differently on Monday morning — not just what was announced on Friday." },
        { dim: "Receiver",      q: "Silence in our channels usually means agreement, not avoidance." },
        { dim: "Repeatability", q: "Internal communications repeat the same message until it lands — not just until we're tired of saying it." },
        { dim: "Repeatability", q: "The hardest news we've delivered in the last six months travelled cleanly through the organisation." }
      ],
      summary: makeSummary(
        "This is where the signal stays intact across distance. Use this dimension as the channel for the message that matters most this quarter.",
        "This is where messages are arriving in a different shape than they left. The fix is rarely more communication &mdash; it&rsquo;s a structural change to how this dimension carries weight."
      )
    },

    // =========================================================
    // 5. THE IMPACT READ — people impact / change impact
    // =========================================================
    impact: {
      id: "impact",
      name: "The Impact Read",
      eyebrow: "Read 5 of 8",
      tagline: "Who actually changes — and by how much?",
      intro: "Transformations are usually designed by people they don't change. The Impact Read flips the lens: who, specifically, will live a different working day on the other side of this — and is the organisation honest about what we're asking of them? Eight questions across role, skill, identity, and recovery. The harder the read is to answer, the more revealing it is.",
      estimate: "8 questions · 5 minutes",
      audience: "For HR directors, CPOs, transformation leads, and anyone designing change someone else has to live.",
      dimensions: [
        { key: "Role",     name: "Role disruption" },
        { key: "Skill",    name: "Skill disruption" },
        { key: "Identity", name: "Identity disruption" },
        { key: "Recovery", name: "Recovery support" }
      ],
      questions: [
        { dim: "Role",     q: "I can name the three populations most disrupted by this transformation, by population — not by team." },
        { dim: "Role",     q: "For each disrupted population, I know what they will spend Monday morning doing differently." },
        { dim: "Skill",    q: "We know which skills become more valuable, and which become quietly obsolete, in the to-be state." },
        { dim: "Skill",    q: "The people whose craft is changing are being told that, by name, before they read it elsewhere." },
        { dim: "Identity", q: "The people who lose status in this transformation know that they are losing status." },
        { dim: "Identity", q: "We have made specific commitments to the people whose work this most reshapes." },
        { dim: "Recovery", q: "Affected populations have a forum where they can name what's hard — that isn't run by their manager." },
        { dim: "Recovery", q: "The recovery support we are offering is proportional to the impact we are causing." }
      ],
      summary: makeSummary(
        "This dimension is honestly seen. That alone gives the affected population somewhere to land &mdash; even when the change is hard.",
        "This is where the organisation is causing more disruption than it&rsquo;s acknowledging. The cost compounds quietly &mdash; in attrition, in trust, in the next transformation&rsquo;s sponsor saying no."
      )
    },

    // =========================================================
    // 6. THE CAPABILITY READ — training / capability gap
    // =========================================================
    capability: {
      id: "capability",
      name: "The Capability Read",
      eyebrow: "Read 6 of 8",
      tagline: "Can your people do what you're asking of them?",
      intro: "Capability is usually treated as a training problem. It rarely is. This read separates the four things people actually need to operate in a to-be state — skills, behaviours, tools, and confidence — and asks whether each is being built deliberately, or assumed into existence. The honest answer is uncomfortable. The honest answer is also actionable.",
      estimate: "8 questions · 4 minutes",
      audience: "For L&D directors, CPOs, transformation leads, and operating-model designers.",
      dimensions: [
        { key: "Skills",     name: "Skills" },
        { key: "Behaviours", name: "Behaviours" },
        { key: "Tools",      name: "Tools" },
        { key: "Confidence", name: "Confidence" }
      ],
      questions: [
        { dim: "Skills",     q: "The skills required to operate in the to-be state have been named — not assumed." },
        { dim: "Skills",     q: "We have evidence, not opinion, of where the current skills baseline sits." },
        { dim: "Behaviours", q: "Behavioural changes are being supported as deliberately as technical ones." },
        { dim: "Behaviours", q: "Managers can coach the new way of working — not just announce it." },
        { dim: "Tools",      q: "Tooling will be in people's hands before they are asked to deliver with it." },
        { dim: "Tools",      q: "The new tools have been tested by the people who will actually use them, before launch." },
        { dim: "Confidence", q: "We have a plan for the gap between 'trained' and 'competent' — and we have resourced it." },
        { dim: "Confidence", q: "Confidence is being built alongside capability. We are not assuming one follows the other." }
      ],
      summary: makeSummary(
        "This dimension is being built deliberately. Keep the discipline &mdash; capability erodes fast when attention moves elsewhere.",
        "This is where the organisation is asking people to operate beyond what they have been equipped to do. The failure won&rsquo;t look like a capability gap on the dashboard. It will look like missed targets, attrition, or quiet workarounds."
      )
    },

    // =========================================================
    // 7. THE BRIDGE READ — as-is to to-be clarity
    // =========================================================
    bridge: {
      id: "bridge",
      name: "The Bridge Read",
      eyebrow: "Read 7 of 8",
      tagline: "Can you see the river from both banks?",
      intro: "A transformation is a bridge across a real river. Most plans describe the far bank in glossy detail and leave the near bank — the as-is — as a vague problem. This read asks whether you can see both banks honestly, whether the distance between them has been measured, and whether the crossing itself has been designed. Most teams discover one of the banks is fog.",
      estimate: "8 questions · 5 minutes",
      audience: "For transformation directors, strategy leads, COOs, and anyone holding the plan.",
      dimensions: [
        { key: "As-is",      name: "As-is honesty" },
        { key: "To-be",      name: "To-be specificity" },
        { key: "Gap",        name: "Gap measurement" },
        { key: "Sequencing", name: "Sequencing" }
      ],
      questions: [
        { dim: "As-is",      q: "We can describe the as-is state honestly — including the parts that work better than they should." },
        { dim: "As-is",      q: "The people who built the as-is have been consulted before we replace it." },
        { dim: "To-be",      q: "We can describe the to-be state specifically — not as a poster, as a working day." },
        { dim: "To-be",      q: "The to-be state has been pressure-tested by the people who will live inside it." },
        { dim: "Gap",        q: "The gap between as-is and to-be has been measured in time, money, and discomfort — not just in slides." },
        { dim: "Gap",        q: "We know which parts of the as-is we are deliberately keeping." },
        { dim: "Sequencing", q: "We are sequencing the transition — not announcing it all at once." },
        { dim: "Sequencing", q: "The transition itself — the time between as-is and to-be — has been designed, not just hoped for." }
      ],
      summary: makeSummary(
        "This is where the plan is honest. Honest dimensions become the spine the rest of the work hangs off &mdash; pull other dimensions up to this one.",
        "This is where the plan is wishful. The cost shows up later, in the form of a transition that everyone agreed to and nobody can describe. Specificity here, now, is cheaper than discovery later."
      )
    },

    // =========================================================
    // 8. THE COPPSE READ — master org diagnostic (6 dims)
    // =========================================================
    coppse: {
      id: "coppse",
      name: "The COPPSE Read",
      eyebrow: "Read 8 of 8",
      tagline: "The six dimensions of organisational readiness.",
      intro: "The master read. Twelve questions across the six dimensions of organisational change — Customer, Operating model, People, Process, System/Technology, and Environmental change. Use it once at the start of a transformation, and again at the half-way point. The pattern of which dimensions hold and which slip will tell you more than any progress report.",
      estimate: "12 questions · 7 minutes",
      audience: "For CEOs, transformation directors, and anyone accountable for the whole programme.",
      dimensions: [
        { key: "Customer",      name: "Customer" },
        { key: "Operating",     name: "Operating model" },
        { key: "People",        name: "People" },
        { key: "Process",       name: "Process" },
        { key: "System",        name: "System / Technology" },
        { key: "Environmental", name: "Environmental change" }
      ],
      questions: [
        { dim: "Customer",      q: "We have a current, observed (not stated) understanding of what our customer needs in the to-be state." },
        { dim: "Customer",      q: "Our customers will notice the change we are making — and the notice will be the one we want." },
        { dim: "Operating",     q: "The operating model of the to-be state has been designed, not inferred." },
        { dim: "Operating",     q: "Decision rights in the new structure are clear enough that someone could draw them from memory." },
        { dim: "People",        q: "We have named who we are asking to grow into the to-be state, and who we are asking to leave." },
        { dim: "People",        q: "The capacity, capability, and commitment of our people has been honestly mapped." },
        { dim: "Process",       q: "The processes that survive into the to-be state have been tested in their new context." },
        { dim: "Process",       q: "The processes that are being retired are being retired — not quietly preserved by individual habit." },
        { dim: "System",        q: "The technology landscape supports the to-be state, not just the legacy state with extra steps." },
        { dim: "System",        q: "We know what we are decommissioning — and when — by name." },
        { dim: "Environmental", q: "We have read the regulatory, competitive, and societal environment we are transitioning into — not the one we left." },
        { dim: "Environmental", q: "The environment is changing faster than our plan accounts for, and we have built that into the plan." }
      ],
      summary: makeSummary(
        "This is the dimension carrying the rest. Most COPPSE failures aren&rsquo;t evenly distributed &mdash; one dimension over-performs and disguises the underlying gap.",
        "This is the dimension most likely to break the transformation. Investing here returns more, faster, than investing in anything else on the programme plan."
      )
    }

  };

  // expose
  window.METHOD_READS = {
    READS,
    LIKERT,
    helpers: { band, interpretDim, rank }
  };

})();
