import Foundation
import Capacitor
import StoreKit

/// Trip passes (non-renewing subscriptions) and tips (consumables) with StoreKit 2, for the web
/// app's lib/passes.ts. Each pass comes back as Apple's signed transaction (JWS), which the
/// server checks at /api/pass before lifting the free limits.
@objc(PassesPlugin)
public class PassesPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "PassesPlugin"
    public let jsName = "Passes"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "products", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "buy", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "entitlements", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "restore", returnType: CAPPluginReturnPromise),
    ]
    private var updates: Task<Void, Never>?

    override public func load() {
        // Purchases that finish outside buy() (Ask to Buy, interrupted payments) still get finished.
        updates = Task.detached {
            for await result in Transaction.updates {
                if case .verified(let transaction) = result { await transaction.finish() }
            }
        }
    }

    deinit { updates?.cancel() }

    @objc func products(_ call: CAPPluginCall) {
        let ids = call.getArray("ids", String.self) ?? []
        Task {
            do {
                let items = try await Product.products(for: ids)
                call.resolve(["products": items.map { p -> [String: Any] in
                    ["id": p.id, "displayPrice": p.displayPrice, "price": NSDecimalNumber(decimal: p.price).doubleValue, "currency": p.priceFormatStyle.currencyCode]
                }])
            } catch {
                call.reject(error.localizedDescription)
            }
        }
    }

    @objc func buy(_ call: CAPPluginCall) {
        guard let id = call.getString("id") else { return call.reject("id required") }
        Task {
            do {
                guard let product = try await Product.products(for: [id]).first else { return call.reject("unknown product") }
                switch try await product.purchase() {
                case .success(let verification):
                    guard case .verified(let transaction) = verification else { return call.reject("unverified transaction") }
                    await transaction.finish()
                    call.resolve(["status": "purchased", "jws": verification.jwsRepresentation])
                case .pending:
                    call.resolve(["status": "pending"])
                default:
                    call.resolve(["status": "cancelled"])
                }
            } catch {
                call.reject(error.localizedDescription)
            }
        }
    }

    /// The newest pass transactions on this Apple ID (non-renewing stay in the history).
    private func passTransactions() async -> [String] {
        var found: [(Date, String)] = []
        for await result in Transaction.all {
            if case .verified(let t) = result, t.productType == .nonRenewable, t.revocationDate == nil {
                found.append((t.purchaseDate, result.jwsRepresentation))
            }
        }
        return found.sorted { $0.0 > $1.0 }.prefix(10).map { $0.1 }
    }

    @objc func entitlements(_ call: CAPPluginCall) {
        Task { call.resolve(["transactions": await passTransactions()]) }
    }

    /// Restore Purchases: syncs with the App Store (may ask to sign in), then returns the passes.
    @objc func restore(_ call: CAPPluginCall) {
        Task {
            do { try await AppStore.sync() } catch { return call.reject(error.localizedDescription) }
            call.resolve(["transactions": await passTransactions()])
        }
    }
}
