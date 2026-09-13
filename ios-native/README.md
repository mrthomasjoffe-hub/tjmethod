# The Foundry as a native iPhone app

This is the optional path. The home-screen web app in [`../IPHONE.md`](../IPHONE.md)
needs no Mac, no Xcode and no expiry, and it is what I would reach for first.

Build this one when you want the local model to work away from a plain-HTTP
LAN server. A native shell loads The Foundry from inside the app bundle, so the
page is local content rather than an https page, and Safari's mixed-content
rule no longer stands between it and Ollama.

What it costs: a Mac with Xcode, and a rebuild every 7 days if you sign with a
free Apple ID. A paid Apple Developer account stretches that to a year.

## Build it

1. **New project.** Xcode, File, New, Project, iOS, App.
   Product Name `Foundry`, Interface SwiftUI, Language Swift.
   Organisation Identifier something of yours, e.g. `com.thetjmethod`.

2. **Drop in the sources.** Replace the generated `ContentView.swift` and
   `FoundryApp.swift` with the two files in `Foundry/` here. Delete whichever
   generated file Xcode named differently.

3. **Bundle the web app.** Drag the repo's `foundry/` directory into the
   project navigator. In the sheet: tick *Copy items if needed*, choose
   **Create folder references** (the folder turns blue, not yellow), and tick
   the `Foundry` target. The blue folder matters. A yellow group flattens the
   directory and `assets/` stops resolving.

4. **Permissions.** Open the target, Info tab, and add the keys from
   `Info.additions.plist`. `NSAllowsLocalNetworking` is the one that lets the
   app reach Ollama.

5. **Signing.** Target, Signing & Capabilities, tick *Automatically manage
   signing*, and pick your Apple ID under Team. Add the account first under
   Xcode, Settings, Accounts if it is not listed.

6. **Run it.** Plug the iPhone in, pick it as the destination, press Run.
   First time only, on the phone: Settings, General, VPN & Device Management,
   trust your developer certificate. Then launch it again.

## Point it at the local model

Ollama has to accept a request from a file-backed page, which arrives with a
null origin. Start it like this on your computer:

```
OLLAMA_HOST=0.0.0.0 OLLAMA_ORIGINS='*' ollama serve
```

Then in the app: Settings, Ollama (local), and set the URL to your computer's
address on the network, e.g. `http://192.168.1.20:11434`.

`OLLAMA_ORIGINS='*'` lets any page on your machine's network call the model.
That is fine on a home or office network you control. I would not run it that
way on shared Wi-Fi.

## Updating

The web app is copied into the bundle at build time, so pull the repo and press
Run again to pick up changes.

## Loading the live site instead

In `ContentView.swift`:

```swift
let source: Source = .remote(URL(string: "https://thetjmethod.com.au/foundry/")!)
```

The app then wraps the live site. Claude API drafting works. The local Ollama
path does not, for the mixed-content reason above.
