//
//  Earthquake.swift
//  BayTremor
//
//  Core earthquake data model
//

import Foundation
import SwiftData
import SwiftUI
import CoreLocation

@Model
final class Earthquake: Identifiable {
    @Attribute(.unique) var id: String
    var magnitude: Double
    var place: String
    var time: Date
    var timestamp: TimeInterval
    var latitude: Double
    var longitude: Double
    var depth: Double
    var felt: Int?
    var significance: Int
    var url: String
    var regionId: String
    
    init(
        id: String,
        magnitude: Double,
        place: String,
        time: Date,
        timestamp: TimeInterval,
        latitude: Double,
        longitude: Double,
        depth: Double,
        felt: Int? = nil,
        significance: Int,
        url: String,
        regionId: String
    ) {
        self.id = id
        self.magnitude = magnitude
        self.place = place
        self.time = time
        self.timestamp = timestamp
        self.latitude = latitude
        self.longitude = longitude
        self.depth = depth
        self.felt = felt
        self.significance = significance
        self.url = url
        self.regionId = regionId
    }
    
    // MARK: - Computed Properties
    
    var coordinate: CLLocationCoordinate2D {
        CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
    }
    
    var magnitudeColor: Color {
        switch magnitude {
        case ..<2.0:
            return .green
        case 2.0..<3.0:
            return .yellow
        case 3.0..<4.0:
            return .orange
        case 4.0..<5.0:
            return .red
        default:
            return .purple
        }
    }
    
    var magnitudeLabel: String {
        switch magnitude {
        case ..<2.0:
            return "Micro"
        case 2.0..<3.0:
            return "Minor"
        case 3.0..<4.0:
            return "Light"
        case 4.0..<5.0:
            return "Moderate"
        case 5.0..<6.0:
            return "Strong"
        default:
            return "Major"
        }
    }
    
    var depthInMiles: Double {
        depth * 0.621371
    }
    
    var formattedMagnitude: String {
        String(format: "M %.1f", magnitude)
    }
    
    var relativeTimeString: String {
        let formatter = RelativeDateTimeFormatter()
        formatter.unitsStyle = .abbreviated
        return formatter.localizedString(for: time, relativeTo: Date())
    }
    
    // Calculate distance from a given location (in miles)
    func distance(from location: CLLocation) -> Double {
        let earthquakeLocation = CLLocation(latitude: latitude, longitude: longitude)
        let distanceMeters = location.distance(from: earthquakeLocation)
        return distanceMeters / 1609.344 // Convert to miles
    }
}

// MARK: - Decodable Extension for API Response
extension Earthquake {
    
    struct APIResponse: Codable {
        let features: [Feature]
        let metadata: Metadata
        
        struct Metadata: Codable {
            let count: Int
            let region: String?
        }
        
        struct Feature: Codable {
            let id: String
            let properties: Properties
            let geometry: Geometry
            
            struct Properties: Codable {
                let mag: Double?
                let place: String?
                let time: Int64
                let url: String?
                let felt: Int?
                let sig: Int?
            }
            
            struct Geometry: Codable {
                let coordinates: [Double] // [longitude, latitude, depth]
            }
        }
    }
    
    convenience init(from feature: APIResponse.Feature) {
        let coords = feature.geometry.coordinates
        let timestamp = TimeInterval(feature.properties.time) / 1000.0
        
        self.init(
            id: feature.id,
            magnitude: feature.properties.mag ?? 0,
            place: feature.properties.place ?? "Unknown location",
            time: Date(timeIntervalSince1970: timestamp),
            timestamp: timestamp * 1000,
            latitude: coords.count > 1 ? coords[1] : 0,
            longitude: coords.count > 0 ? coords[0] : 0,
            depth: coords.count > 2 ? coords[2] : 0,
            felt: feature.properties.felt,
            significance: feature.properties.sig ?? 0,
            url: feature.properties.url ?? "",
            regionId: RegionService.getRegionId(
                latitude: coords.count > 1 ? coords[1] : 0,
                longitude: coords.count > 0 ? coords[0] : 0
            )
        )
    }
}
