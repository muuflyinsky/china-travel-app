// Renders the App Store icon (1024×1024, square, no alpha): 游 on cobalt, matching app/icon.svg.
//   swiftc native/make-icon.swift -o /tmp/make-icon && /tmp/make-icon native/assets/icon-1024.png
import CoreGraphics
import CoreText
import Foundation
import ImageIO
import UniformTypeIdentifiers

let size = 1024
let out = CommandLine.arguments.count > 1 ? CommandLine.arguments[1] : "icon-1024.png"
let ctx = CGContext(data: nil, width: size, height: size, bitsPerComponent: 8, bytesPerRow: 0,
                    space: CGColorSpace(name: CGColorSpace.sRGB)!, bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue)!
ctx.setFillColor(CGColor(srgbRed: 0x2b / 255, green: 0x4a / 255, blue: 0xcb / 255, alpha: 1))
ctx.fill(CGRect(x: 0, y: 0, width: size, height: size))

let font = CTFontCreateWithName("PingFangSC-Semibold" as CFString, CGFloat(size) * 0.53, nil)
let attr = NSAttributedString(string: "游", attributes: [
  NSAttributedString.Key(kCTFontAttributeName as String): font,
  NSAttributedString.Key(kCTForegroundColorAttributeName as String): CGColor(gray: 1, alpha: 1),
])
let line = CTLineCreateWithAttributedString(attr)
let glyph = CTLineGetImageBounds(line, ctx)
ctx.textPosition = CGPoint(x: (CGFloat(size) - glyph.width) / 2 - glyph.minX, y: (CGFloat(size) - glyph.height) / 2 - glyph.minY)
CTLineDraw(line, ctx)

let dest = CGImageDestinationCreateWithURL(URL(fileURLWithPath: out) as CFURL, UTType.png.identifier as CFString, 1, nil)!
CGImageDestinationAddImage(dest, ctx.makeImage()!, nil)
CGImageDestinationFinalize(dest)
