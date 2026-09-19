// Lift the subject out of a photograph using the macOS Vision framework, and
// write it with a real alpha channel.
//
//   swiftc -O cutout.swift -o cutout && ./cutout in.png out.png
//
// Vision leaves a one-to-two pixel rim of the original background blended into
// the subject's edge. On this photograph that rim is violet, and it is plainly
// visible against black, so the caller erodes the alpha afterwards (see
// portrait.sh). Inspect the result against two contrasting grounds before
// trusting it.
import Foundation
import Vision
import CoreImage
import AppKit

let args = CommandLine.arguments
guard args.count >= 3 else { print("usage: cutout <in> <out.png>"); exit(2) }
let inURL = URL(fileURLWithPath: args[1])
let outURL = URL(fileURLWithPath: args[2])

let handler = VNImageRequestHandler(url: inURL, options: [:])
let req = VNGenerateForegroundInstanceMaskRequest()
do { try handler.perform([req]) } catch { print("vision failed: \(error)"); exit(1) }
guard let obs = req.results?.first else { print("no foreground instance found"); exit(1) }
let pb = try! obs.generateMaskedImage(ofInstances: obs.allInstances,
                                      from: handler, croppedToInstancesExtent: false)
let masked = CIImage(cvPixelBuffer: pb)
let ctx = CIContext()
guard let data = ctx.pngRepresentation(of: masked, format: .RGBA8,
                                       colorSpace: CGColorSpace(name: CGColorSpace.sRGB)!) else {
  print("encode failed"); exit(1)
}
try! data.write(to: outURL)
print("ok \(masked.extent)")
