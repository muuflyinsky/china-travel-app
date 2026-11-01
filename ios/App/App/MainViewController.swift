import Capacitor

/// The app's web view controller: Capacitor's, plus the plugins that live in this app target.
class MainViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(PassesPlugin())
    }
}
