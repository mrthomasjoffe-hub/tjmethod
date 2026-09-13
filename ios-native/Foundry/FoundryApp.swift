import SwiftUI

@main
struct FoundryApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
                .ignoresSafeArea(.keyboard)
                .preferredColorScheme(.light)
        }
    }
}
