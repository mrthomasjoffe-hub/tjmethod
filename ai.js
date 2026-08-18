/* ===========================================================
   The TJ Method — AI engine layer
   ===========================================================
   A tiny provider-agnostic wrapper around two engines:

     - Ollama   (a local LLM on this machine, via its HTTP API)
     - Claude   (the Anthropic Messages API, direct from the browser)

   Hybrid by default: the preferred engine is tried first, and if it
   isn't reachable the other one picks the job up — so a laptop with
   Ollama running gets the local model, and the same page falls back
   to Claude when Ollama is off.

   Nothing here is read-specific. The Reads use it via ai-read.js;
   anything else on the site (the Frames, the Foundry) can use the
   same TJAI.complete() with its own prompt and schema.

   Settings live in this browser only (localStorage). No key, no
   answer, and no draft is ever sent anywhere except to the engine
   the visitor has configured themselves.
   =========================================================== */

window.TJAI = (function () {

  const STORE = "tjmethod.ai.v1";

  // Anthropic models offered in the settings page.
  const CLAUDE_MODELS = [
    { id: "claude-opus-5",     label: "Claude Opus 5 — best quality (default)" },
    { id: "claude-sonnet-5",   label: "Claude Sonnet 5 — faster, near-Opus on drafting" },
    { id: "claude-haiku-4-5",  label: "Claude Haiku 4.5 — cheapest, quick drafts" }
  ];

  const DEFAULTS = {
    enabled:     false,
    provider:    "ollama",                    // "ollama" | "claude"
    fallback:    true,                        // try the other engine if the first fails
    ollamaUrl:   "http://localhost:11434",
    ollamaModel: "",
    apiKey:      "",
    model:       "claude-opus-5"
  };

  // A local model's context window. Ollama will happily accept more and
  // silently truncate, which produces confident nonsense — so we check first.
  const LOCAL_CTX = 32768;

  // ---------- errors ----------
  // One error type, always with a message a non-engineer can act on.
  class TJAIError extends Error {
    constructor(message, engine) {
      super(message);
      this.name = "TJAIError";
      this.engine = engine || null;
    }
  }

  // ---------- settings ----------
  function settings() {
    try {
      const raw = localStorage.getItem(STORE);
      if (raw) {
        const s = { ...DEFAULTS, ...JSON.parse(raw) };
        if (!CLAUDE_MODELS.some((m) => m.id === s.model)) s.model = DEFAULTS.model;
        if (s.provider !== "ollama" && s.provider !== "claude") s.provider = DEFAULTS.provider;
        return s;
      }
    } catch (_) { /* corrupt or unavailable storage — fall through to defaults */ }
    return { ...DEFAULTS };
  }

  function saveSettings(s) {
    localStorage.setItem(STORE, JSON.stringify({ ...DEFAULTS, ...s }));
  }

  // Is a given engine actually usable right now (as far as settings can tell)?
  function engineReady(engine, s) {
    s = s || settings();
    if (engine === "ollama") return s.ollamaModel.trim().length > 0;
    if (engine === "claude") return s.apiKey.trim().length > 0;
    return false;
  }

  // Should the site offer AI at all? False for every visitor who hasn't
  // configured an engine — they get the deterministic read, unchanged.
  function available() {
    const s = settings();
    return s.enabled && (engineReady("ollama", s) || engineReady("claude", s));
  }

  // The order engines are tried in, given the current settings.
  function engineOrder(s) {
    s = s || settings();
    const order = s.provider === "ollama" ? ["ollama", "claude"] : ["claude", "ollama"];
    return (s.fallback ? order : [order[0]]).filter((e) => engineReady(e, s));
  }

  // ---------- Ollama ----------
  function ollamaBase(s) {
    return (s.ollamaUrl || "").trim().replace(/\/+$/, "") || DEFAULTS.ollamaUrl;
  }

  async function listOllamaModels(url) {
    const base = (url ?? settings().ollamaUrl).trim().replace(/\/+$/, "") || DEFAULTS.ollamaUrl;
    let res;
    try {
      res = await fetch(`${base}/api/tags`);
    } catch (_) {
      throw new TJAIError(
        `Couldn't reach Ollama at ${base}. Is it running? (If this page is served over https, Ollama also needs OLLAMA_ORIGINS set to allow this site.)`,
        "ollama"
      );
    }
    if (!res.ok) throw new TJAIError(`Ollama answered ${res.status} when listing models.`, "ollama");
    const body = await res.json();
    return (body.models ?? []).map((m) => m.name);
  }

  // Round the context window up to a sensible multiple, within the local cap.
  function ctxFor(chars, maxTokens) {
    const wanted = Math.ceil(chars / 3.5) + maxTokens + 512;
    const rounded = 4096 * Math.ceil(wanted / 4096);
    return Math.min(LOCAL_CTX, Math.max(4096, rounded));
  }

  async function ollamaComplete({ system, user, schema, maxTokens }) {
    const s = settings();
    const base = ollamaBase(s);

    const estimate = Math.ceil((system.length + user.length) / 3.5);
    if (estimate + maxTokens > LOCAL_CTX) {
      throw new TJAIError(
        `This request is too large for the local model's context (~${Math.round(estimate / 1000)}k tokens against a ~${Math.round(LOCAL_CTX / 1000)}k window). Shorten the context, or use Claude for this one.`,
        "ollama"
      );
    }

    let res;
    try {
      res = await fetch(`${base}/api/chat`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          model: s.ollamaModel,
          stream: false,
          format: schema,                     // Ollama constrains output to this JSON schema
          messages: [
            { role: "system", content: system },
            { role: "user",   content: user }
          ],
          options: {
            num_predict: maxTokens,
            num_ctx: ctxFor(system.length + user.length, maxTokens)
          }
        })
      });
    } catch (_) {
      throw new TJAIError(`Couldn't reach Ollama at ${base}. Is it running?`, "ollama");
    }

    if (!res.ok) {
      let detail = "";
      try { detail = (await res.json()).error ?? ""; } catch (_) { /* no JSON body */ }
      if (/not found/i.test(detail)) {
        throw new TJAIError(
          `Ollama doesn't have that model: ${detail}. Pull it first (ollama pull ${s.ollamaModel}) or pick another in AI settings.`,
          "ollama"
        );
      }
      throw new TJAIError(`Ollama error (${res.status})${detail ? `: ${detail}` : ""}.`, "ollama");
    }

    const text = (await res.json())?.message?.content ?? "";
    if (!text.trim()) throw new TJAIError("The local model returned nothing.", "ollama");

    try {
      return { data: JSON.parse(text), model: s.ollamaModel, engine: "ollama" };
    } catch (_) {
      throw new TJAIError(
        "The local model returned invalid JSON. Smaller models struggle with structured output — try an 8B model or larger, or switch to Claude.",
        "ollama"
      );
    }
  }

  // ---------- Claude ----------
  // Raw fetch rather than the Anthropic SDK: this site is plain static
  // HTML with no build step, so there's nothing to bundle an SDK with.
  async function claudeComplete({ system, user, schema, maxTokens }) {
    const s = settings();

    let res;
    try {
      res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": s.apiKey.trim(),
          "anthropic-version": "2023-06-01",
          // Required for calls made directly from a browser.
          "anthropic-dangerous-direct-browser-access": "true"
        },
        body: JSON.stringify({
          model: s.model,
          max_tokens: maxTokens,
          system: system,
          messages: [{ role: "user", content: user }],
          output_config: {
            effort: "medium",
            format: { type: "json_schema", schema: schema }
          }
        })
      });
    } catch (_) {
      throw new TJAIError("Couldn't reach the Claude API. Check your connection.", "claude");
    }

    if (!res.ok) {
      let detail = "";
      try { detail = (await res.json())?.error?.message ?? ""; } catch (_) { /* no JSON body */ }
      if (res.status === 401) throw new TJAIError("The Claude API key was rejected. Check it in AI settings.", "claude");
      if (res.status === 429) throw new TJAIError("Rate limited by the Claude API — wait a moment and try again.", "claude");
      throw new TJAIError(`Claude API error (${res.status})${detail ? `: ${detail}` : ""}.`, "claude");
    }

    const body = await res.json();
    if (body.stop_reason === "refusal") throw new TJAIError("The model declined this request.", "claude");
    if (body.stop_reason === "max_tokens") throw new TJAIError("The draft was cut off before it finished — try again.", "claude");

    const block = (body.content || []).find((b) => b.type === "text");
    if (!block) throw new TJAIError("Empty response from Claude.", "claude");

    try {
      return { data: JSON.parse(block.text), model: body.model, engine: "claude" };
    } catch (_) {
      throw new TJAIError("Claude returned something that wasn't valid JSON.", "claude");
    }
  }

  // ---------- the one call everything else uses ----------
  // Returns { data, model, engine, fellBack } or throws a TJAIError whose
  // message is safe to show a user as-is.
  async function complete({ system, user, schema, maxTokens = 4000 }) {
    const s = settings();
    const order = engineOrder(s);

    if (order.length === 0) {
      throw new TJAIError("No AI engine is configured yet. Open AI settings to add one.");
    }

    let firstError = null;
    for (let i = 0; i < order.length; i++) {
      try {
        const run = order[i] === "ollama" ? ollamaComplete : claudeComplete;
        const out = await run({ system, user, schema, maxTokens });
        return { ...out, fellBack: i > 0 };
      } catch (err) {
        if (!(err instanceof TJAIError)) throw err;
        if (!firstError) firstError = err;
        // fall through to the next engine, if there is one
      }
    }
    throw firstError;
  }

  // ---------- connection test (used by the settings page) ----------
  async function testConnection() {
    const s = settings();

    if (s.provider === "ollama") {
      const models = await listOllamaModels(s.ollamaUrl);
      if (models.length === 0) {
        throw new TJAIError("Connected to Ollama, but no models are installed — run `ollama pull llama3.1:8b` first.", "ollama");
      }
      const wanted = s.ollamaModel.trim();
      if (!wanted) throw new TJAIError(`Connected to Ollama. Now pick a model — installed: ${models.slice(0, 5).join(", ")}.`, "ollama");
      if (!(models.includes(wanted) || models.includes(`${wanted}:latest`))) {
        throw new TJAIError(`Connected to Ollama, but "${wanted}" isn't installed. Available: ${models.slice(0, 5).join(", ")}${models.length > 5 ? "…" : ""}`, "ollama");
      }
      return `Connected — Ollama is running and ${wanted} is installed.`;
    }

    if (!s.apiKey.trim()) throw new TJAIError("Add a Claude API key first.", "claude");
    const out = await claudeComplete({
      system: "You are a connection test. Answer with the JSON object {\"ok\": true}.",
      user: "Confirm the connection.",
      schema: { type: "object", properties: { ok: { type: "boolean" } }, required: ["ok"], additionalProperties: false },
      maxTokens: 1000
    });
    return `Connected — ${out.model} answered.`;
  }

  return {
    TJAIError,
    CLAUDE_MODELS,
    DEFAULTS,
    settings,
    saveSettings,
    engineReady,
    engineOrder,
    available,
    listOllamaModels,
    complete,
    testConnection
  };

})();
