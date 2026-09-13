# The Foundry on your iPhone

No App Store, no TestFlight, no review. The Foundry installs straight from
Safari and lands on your home screen with its own icon, opening full screen
with no browser chrome around it.

There are two ways in. Start with the first.

---

## 1. Put it on the home screen

On the iPhone, in **Safari** (this does not work from Chrome):

1. Open the app.
   - Live site: `https://thetjmethod.com.au/foundry/`
   - Or your own machine, see *Running the local model* below.
2. Tap **Share**, the square with the arrow.
3. Scroll down, tap **Add to Home Screen**.
4. Name it **Foundry**, tap **Add**.

It is now an app. Tap it and it opens full screen, on brand, with no address
bar. It keeps working with no signal, because the app shell is cached on the
phone.

Everything is stored in the phone's own storage, so the projects you create on
the phone stay on the phone. Nothing syncs to the desktop.

---

## 2. Running the local model

This is the part with a genuine catch, so it is worth being clear about it.

The AI engine has two settings: the **Claude API**, and **Ollama** running
locally. Under Ollama the default address is `http://localhost:11434`.

On a phone, `localhost` means *the phone*. There is no Ollama on the phone. So
the address has to be your computer's address on the network, something like
`http://192.168.1.20:11434`.

That leaves one more obstacle. Safari will not let a page served over **https**
call a plain **http** address. The live site is https, Ollama is http, so from
the live site the local model is simply unreachable. No setting in the app
changes that. It is a browser rule.

Three ways round it, easiest first.

### a. Serve the app from your own machine

Both sides end up on plain http, so nothing is blocked. On the computer that
runs Ollama:

```
./tools/serve-lan.sh
```

It prints the address to open on the phone. Add *that* to the home screen
rather than the live site.

Then restart Ollama so it listens to the network and allows the page. The
script prints the exact line, which looks like:

```
OLLAMA_HOST=0.0.0.0 OLLAMA_ORIGINS=http://192.168.1.20:8080 ollama serve
```

Phone and computer have to be on the same Wi-Fi. Works at home or in the
office, not on the road.

### b. Put Ollama behind https with Tailscale

Best of both. The app stays on the live https site, the local model becomes
reachable, and it works from anywhere, not only on your own Wi-Fi.

Install Tailscale on the computer and on the iPhone, sign both into the same
account, then on the computer:

```
tailscale serve --bg --https=11435 http://127.0.0.1:11434
tailscale serve status
```

That prints an `https://your-machine.your-tailnet.ts.net:11435` address with a
real certificate. Use it as the Ollama URL in the app.

Ollama also needs to accept the request:

```
OLLAMA_ORIGINS=https://thetjmethod.com.au ollama serve
```

### c. Build the native app

A native shell loads The Foundry from inside the app bundle, which sidesteps
the mixed-content rule entirely. Costs a Mac, Xcode and a rebuild every 7 days
on a free Apple ID. See [`ios-native/README.md`](ios-native/README.md).

---

## 3. The connection checker

Fiddling with this on a phone screen is miserable, so there is a page for it:

```
/foundry/connect.html
```

It tells you what the phone can actually see: the origin the page came from,
whether it is a secure context, whether the home-screen app or the browser is
running it. Then you enter the Ollama address, tap **Test connection**, and it
either lists the models it found or tells you precisely which of the four usual
causes you have hit, with the command to fix it.

Pick a model, tap **Save into The Foundry**, and the app picks it up. It writes
the same setting the Settings screen writes.

---

## What works where

| | Home screen, live https site | Home screen, served from your machine | Native app |
|---|---|---|---|
| Installs without the App Store | yes | yes | yes, 7-day rebuild on a free Apple ID |
| Needs a Mac | no | no | yes |
| Claude API drafting | yes | yes | yes |
| Local Ollama model | only via Tailscale | yes, same Wi-Fi | yes, same Wi-Fi |
| Works offline | yes, app shell | yes, app shell | yes |
| Works away from home | yes | no | no, unless on Tailscale |

---

## Troubleshooting

**No Add to Home Screen in the Share sheet.** You are in Chrome or another
browser. iOS only offers this from Safari.

**It opens in Safari with an address bar.** The tile was made from a bookmark
rather than Add to Home Screen. Delete it and add it again.

**A change to the site does not show up.** The app shell is cached. Pull down
to refresh inside the app. When a new version has been cached you get a small
"new version ready" bar with a Reload button.

**"Could not reach it" on the connection checker.** Work down the list it
prints. In practice it is nearly always the first one: Ollama defaults to
listening only to itself, and needs `OLLAMA_HOST=0.0.0.0` to listen on the
network.

**Sign-in is not remembered.** Content blockers and Private Relay can clear
site data. Check Settings, Safari, and allow the site.

**Everything disappeared.** iOS reclaims storage for web apps that have not
been opened in a while. Open it every so often, or use the native build, which
is not subject to that.
