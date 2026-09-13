import SwiftUI
import WebKit

/// Where the app loads The Foundry from.
///
/// `.bundled` serves the copy of `foundry/` inside the app, which is the point
/// of the native shell: the page is then plain local content, so calls out to
/// Ollama on the network are not blocked as mixed content the way they are on
/// the https site.
///
/// `.remote` just wraps the live site. Handy for a quick look, but the local
/// model will not be reachable from it.
enum Source {
    case bundled
    case remote(URL)
}

let source: Source = .bundled
let remoteFallback = URL(string: "https://thetjmethod.com.au/foundry/")!

struct ContentView: View {
    var body: some View {
        WebView()
            .ignoresSafeArea(edges: .bottom)
    }
}

struct WebView: UIViewRepresentable {
    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.allowsInlineMediaPlayback = true
        // The web app keeps everything in localStorage, so the store has to
        // survive a relaunch.
        config.websiteDataStore = .default()

        let webView = WKWebView(frame: .zero, configuration: config)
        webView.allowsBackForwardNavigationGestures = true
        webView.scrollView.contentInsetAdjustmentBehavior = .always
        webView.isOpaque = false
        webView.backgroundColor = UIColor(red: 0.11, green: 0.106, blue: 0.09, alpha: 1)
        webView.scrollView.backgroundColor = webView.backgroundColor

        load(into: webView)
        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {}

    private func load(into webView: WKWebView) {
        switch source {
        case .bundled:
            // `foundry` is added to the project as a folder reference (blue),
            // so the directory structure is preserved inside the bundle.
            guard let index = Bundle.main.url(
                forResource: "index",
                withExtension: "html",
                subdirectory: "foundry"
            ) else {
                webView.load(URLRequest(url: remoteFallback))
                return
            }
            let root = index.deletingLastPathComponent()
            webView.loadFileURL(index, allowingReadAccessTo: root)

        case .remote(let url):
            webView.load(URLRequest(url: url))
        }
    }
}
