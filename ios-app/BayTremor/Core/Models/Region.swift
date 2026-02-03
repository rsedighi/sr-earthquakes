//
//  Region.swift
//  BayTremor
//
//  Bay Area region definitions
//

import Foundation
import SwiftUI

struct Region: Identifiable, Codable {
    let id: String
    let name: String
    let description: String
    let bounds: Bounds
    let colorHex: String
    let faultLine: String
    let areaCode: String
    let county: String
    
    struct Bounds: Codable {
        let minLat: Double
        let maxLat: Double
        let minLon: Double
        let maxLon: Double
        
        func contains(latitude: Double, longitude: Double) -> Bool {
            latitude >= minLat &&
            latitude <= maxLat &&
            longitude >= minLon &&
            longitude <= maxLon
        }
    }
    
    var color: Color {
        Color(hex: colorHex)
    }
}

// MARK: - Region Service
enum RegionService {
    
    static let regions: [Region] = [
        Region(
            id: "san-francisco",
            name: "San Francisco",
            description: "The City by the Bay, straddling the San Andreas Fault",
            bounds: Region.Bounds(minLat: 37.708, maxLat: 37.833, minLon: -122.527, maxLon: -122.357),
            colorHex: "#f59e0b",
            faultLine: "San Andreas Fault",
            areaCode: "415",
            county: "San Francisco"
        ),
        Region(
            id: "marin",
            name: "Marin / Sausalito / San Rafael",
            description: "North Bay across the Golden Gate Bridge along the San Andreas Fault",
            bounds: Region.Bounds(minLat: 37.833, maxLat: 38.10, minLon: -122.76, maxLon: -122.45),
            colorHex: "#10b981",
            faultLine: "San Andreas Fault",
            areaCode: "415",
            county: "Marin"
        ),
        Region(
            id: "fremont-newark",
            name: "Fremont / Newark / Union City",
            description: "Southern Alameda County along the Hayward Fault",
            bounds: Region.Bounds(minLat: 37.455, maxLat: 37.620, minLon: -122.15, maxLon: -121.85),
            colorHex: "#06b6d4",
            faultLine: "Hayward Fault",
            areaCode: "510",
            county: "Alameda"
        ),
        Region(
            id: "san-ramon",
            name: "San Ramon / Dublin / Pleasanton",
            description: "I-680/I-580 corridor along the Calaveras Fault",
            bounds: Region.Bounds(minLat: 37.620, maxLat: 37.919, minLon: -122.109, maxLon: -121.70),
            colorHex: "#ffffff",
            faultLine: "Calaveras Fault",
            areaCode: "925",
            county: "Contra Costa / Alameda"
        ),
        Region(
            id: "berkeley-oakland",
            name: "Berkeley / Oakland / Piedmont",
            description: "Western East Bay along the Hayward Fault",
            bounds: Region.Bounds(minLat: 37.620, maxLat: 38.071, minLon: -122.439, maxLon: -122.047),
            colorHex: "#e5e5e5",
            faultLine: "Hayward Fault",
            areaCode: "510",
            county: "Alameda"
        ),
        Region(
            id: "sf-peninsula",
            name: "SF Peninsula / Millbrae / Pacifica",
            description: "Peninsula along the San Andreas Fault",
            bounds: Region.Bounds(minLat: 37.317, maxLat: 37.708, minLon: -122.533, maxLon: -122.066),
            colorHex: "#d4d4d4",
            faultLine: "San Andreas Fault",
            areaCode: "650",
            county: "San Mateo"
        ),
        Region(
            id: "santa-clara",
            name: "Santa Clara / San Jose / Morgan Hill",
            description: "South Bay along the Calaveras Fault",
            bounds: Region.Bounds(minLat: 36.95, maxLat: 37.455, minLon: -122.44, maxLon: -121.632),
            colorHex: "#a3a3a3",
            faultLine: "Calaveras Fault",
            areaCode: "408",
            county: "Santa Clara"
        ),
        Region(
            id: "sonoma-north",
            name: "Sonoma / Napa / North Bay",
            description: "Wine Country along the Rodgers Creek Fault",
            bounds: Region.Bounds(minLat: 38.10, maxLat: 38.66, minLon: -123.069, maxLon: -122.421),
            colorHex: "#525252",
            faultLine: "Rodgers Creek Fault",
            areaCode: "707",
            county: "Sonoma / Napa"
        ),
    ]
    
    static func getRegionId(latitude: Double, longitude: Double) -> String {
        for region in regions {
            if region.bounds.contains(latitude: latitude, longitude: longitude) {
                return region.id
            }
        }
        return "unknown"
    }
    
    static func getRegion(byId id: String) -> Region? {
        regions.first { $0.id == id }
    }
    
    static func getRegionName(byId id: String) -> String {
        getRegion(byId: id)?.name ?? "Unknown Region"
    }
}

// MARK: - Color Extension for Hex
extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: // RGB (12-bit)
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB (32-bit)
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (1, 1, 1, 0)
        }
        
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}
