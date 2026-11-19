import Foundation
import Capacitor
import StoreKit

/// Asks iOS to show the App Store rating prompt, for the web app's lib/review.ts. The web app
/// decides when (a success moment, at most once in 90 days, never in allergy or emergency flows);
/// iOS then decides whether the prompt actually appears (at most 3 times a year, never in
/// TestFlight), and never says whether it did.
@objc(ReviewPlugin)
public class ReviewPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "ReviewPlugin"
    public let jsName = "Review"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "request", returnType: CAPPluginReturnPromise),
    ]

    @objc func request(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            let scene = UIApplication.shared.connectedScenes
                .compactMap { $0 as? UIWindowScene }
                .first { $0.activationState == .foregroundActive }
            guard let scene else { return call.resolve(["requested": false]) }
            if #available(iOS 16.0, *) {
                AppStore.requestReview(in: scene)
            } else {
                SKStoreReviewController.requestReview(in: scene)
            }
            call.resolve(["requested": true])
        }
    }
}
