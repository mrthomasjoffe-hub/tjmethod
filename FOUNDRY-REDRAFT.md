# The Foundry — messaging redraft

Prepared for review. Nothing here is final. Every line is arguable.

---

## 1. The diagnosis

Your contact was right, and the fix is more specific than "go deeper".

### What was actually wrong

**The Foundry did not exist on your website.**

Before this redraft, the word "Foundry" appeared zero times in `index.html`,
`reads.html` and `survey.html`. The only way to reach it was to already know the URL
`/foundry/`. A visitor met the software for the first time on a sign-in screen. Nobody
relates to a product they have never been introduced to.

**The copy that did exist sold the deliverable, not the pain.**

The live hero read:

> Enter the change. Leave with the work: strategy, communications, stakeholder analysis,
> surveys and SteerCo packs — produced from your inputs, ready to use.

That sentence is accurate, well written, and it only converts a buyer who has already
decided they need a stakeholder analysis. It asks the reader to do the translation work
from *"I am drowning and go-live is in nine weeks"* to *"ah, that is what a stakeholder
analysis is for"*. Most readers will not do that work for you.

The vocabulary is also insider vocabulary. **Artifact set**, **SteerCo pack**,
**benchmarking instrument** and **intake** are words a change practitioner uses. They
are not words a COO uses when they are worried. And the COO is often the one who pays.

### Chet Holmes, from the Business Mastery stage

Holmes' number is the one that matters here. In any market at any moment:

- **3%** are actively looking to buy right now
- **7%** are open to it
- **30%** are not thinking about it
- **30%** think they are not interested
- **30%** are definitely not interested

Lead with the product and you speak only to the 3%. To reach the other 97% you have to
lead with **the problem they already know they have**, before you have earned the right
to mention what you sell. Holmes calls it the stadium pitch. The old Foundry page was a
pitch to the 3%.

### Keith Cunningham, same stage

> "The problem you see is rarely the problem."

The stated problem is *"I do not have the documents."*
The real problem is *"I am accountable for a change that is about to land on four
hundred people and I cannot tell you who it lands on, how hard, or whether they will
move."*

And underneath that, the one nobody says out loud: *"If this goes badly, it is my name
on it."*

### Tony Robbins, the six human needs

The buyer is not buying artifacts. They are buying **certainty** and protecting
**significance**.

| Need | What the buyer is actually asking |
|---|---|
| Certainty | Will this land? Can I see the problem while I can still fix it? |
| Significance | My reputation is on this go-live. |
| Connection | The PM owns the plan. Nobody owns the people. I am carrying it alone. |
| Growth / contribution | I want to leave this place better, not bruised. |

Every line of the new copy is written to one of those four.

### Jay Abraham, the Strategy of Preeminence

Fall in love with the client, not the product. Be their most trusted advisor, which
means you describe their situation back to them **more accurately than they could
describe it themselves**. That is what the symptom list is for.

---

## 2. What changed

### New page: `the-foundry.html`

A full sales page, routed at `/the-foundry`. The existing demo app at `/foundry/` is
untouched, so any link you have already shared still works.

Structure, and why each section is there:

| Section | Job | Business Mastery principle |
|---|---|---|
| Hero | Name the gap in one line | Enter the conversation already in their head |
| The part that gets skipped | Explain *why* it is skipped, without blame | Preeminence, diagnose before prescribe |
| **Tick the ones that are true this week** | Eight symptoms, self-scored | Holmes stadium pitch, self-identification |
| Every symptom has a mechanism | One-to-one symptom → feature map | The literal instruction you were given |
| Enter the change, leave with the work | The artifact set, reframed as outcomes | Features tell, benefits sell |
| Six weeks or an afternoon | Value anchoring against consultant rates | Robbins, raise the perceived value |
| Three steps | Reduce perceived effort | Lower the cost of action |
| Who it is for | Two avatars, inside and serving | Avatar clarity |
| A real change is already loaded | Risk-free trial, no signup | Remove every reason to say no |
| Where it came from | Ties the software back to you | Your credibility is the asset |

### The eight symptoms

This is the heart of the redraft. Each one is written so a reader either recognises
it instantly or does not, with no jargon required.

1. Change and comms is one line on a slide.
2. Nobody can tell you how many people this actually touches.
3. You know who will block this, and you have not had the conversation.
4. The SteerCo pack gets built the night before.
5. Comms arrive after the rumour, not before it.
6. You will find out whether people were ready on the day you can no longer do anything about it.
7. The last change is still in the room.
8. Consultation is a legal obligation nobody has diarised.

Symptom 8 is the sharpest commercial hook you have. Enterprise agreement consultation
is a **legal exposure with a clock on it**, and The Foundry raises it automatically. That
converts fear into a reason to click, and it is the one thing a generic project tool
will never do.

Every symptom then maps to something The Foundry genuinely already does. I pulled the
mechanisms out of the shipped build rather than inventing them, so nothing on the page
overpromises.

### The Fortuna One reference

The image you sent is a good device and I used its structure directly. Gold numeral in
a left column, a question or a statement as the heading, a short plain-language
explanation underneath, hairline rule between items. It works because the reader
diagnoses themselves before you ever pitch. The new `.sympt-list` component is that
layout, in your existing type and colour.

### Homepage changes

- **Nav** now carries a Foundry link. Same on the Reads page.
- **Hero lede** gains one bridging line: *"For the leader, in the room. For the
  organisation, in software."* That is the whole business model in nine words, and it
  is how a coaching site earns the right to sell software.
- **Hero buttons** are now the 5 Cs Snapshot and The Foundry. The Reads moved into the
  note underneath, where they were already mentioned.
- **The problem section** goes deeper, as instructed. Each of the three items gains a
  concrete **The tell** line, so an abstract idea becomes something a reader can check
  against their own week:
  - *Everyone can name the go-live date. Nobody can describe what good looks like the week after it.*
  - *You are still doing the job you were promoted out of, and calling it staying close to the detail.*
  - *The behaviour your strategy needs is the behaviour your last performance cycle marked down.*
- **New Foundry band** sits between "Who I work with" and the Reads teaser, three steps
  and two buttons.

---

## 3. Things for you to decide

1. **The hero line.** I went with *"Your change has a plan. It does not have a people
   plan."* Two alternatives I like almost as much:
   - *"The strategy is approved. The four hundred people it lands on are still a rumour."*
   - *"Every programme has a swimlane called Change and Comms. Yours is empty."*

2. **The pricing anchor.** The value section says four to six weeks of a senior
   practitioner at consulting rates. If you are comfortable naming a number, that
   section gets much stronger. "Thirty thousand dollars of consulting, or an afternoon"
   is a materially better sentence than the one I wrote.

3. **Proof.** There is none on the page yet, which is the biggest remaining weakness.
   One named engagement, one number, or one quote from a change lead would lift it more
   than any rewrite I can do. The clients band on the homepage is doing that job by
   proximity only.

4. **The demo path.** The demo opens on a sign-in screen. Every step between the click
   and the finished artifacts costs you conversions. If the sign-in can be skipped for
   the pre-loaded Meridian example, the page will convert noticeably better.

5. **House voice.** Your written preference is no em-dashes, no semicolons and no
   contractions. The existing site uses all three heavily as a deliberate signature. I
   wrote the new copy in the lower-punctuation style, leaning on periods and colons,
   which also reads harder and more commercial. If you want the new pages to match the
   old em-dash rhythm exactly, say so and I will put them back.

6. **The name.** "The Foundry" is a strong name and I kept it. Worth noting it does not
   say what the product does, so on the page it always appears next to a line that
   explains it. If a search-led strategy matters later, the page title is where you
   would carry "change management software".

7. **Artifact or artefact.** The shipped app uses the American spelling "artifact"
   throughout its interface, and I matched it on the page so the words agree. The rest of
   the site is Australian English. If you want "artefact", it needs changing in the app
   build as well as the page.

---

## 4. Files touched

| File | Change |
|---|---|
| `the-foundry.html` | New. The full sales page. |
| `index.html` | Foundry nav link, hero bridging line and new button, three "The tell" lines in the problem section, new Foundry band. |
| `reads.html` | Foundry nav link. |
| `styles.css` | New components appended at the end: `.fdry-hero`, `.sympt-list`, `.fix`, `.deliv`, `.econ`. Nothing existing was modified. |
| `render.yaml` | Clean route added for `/the-foundry`. |

The demo app at `/foundry/` was not touched. Every link you have already shared still works.

## 5. To review it

```
python3 -m http.server 8000
```

Then open `http://localhost:8000/the-foundry.html` and `http://localhost:8000/index.html`.
