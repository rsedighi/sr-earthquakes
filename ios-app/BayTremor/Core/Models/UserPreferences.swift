//
//  UserPreferences.swift
//  BayTremor
//
//  User preferences and settings
//

import Foundation
import SwiftData

@Model
final class UserPreferences {
    // Location settings
    var selectedCityName: String?
    var selectedCityLat: Double?
    var selectedCityLon: Double?
    
    // Notification settings
    var notificationsEnabled: Bool = true
    var minimumMagnitudeAlert: Double = 3.0
    var alertRadiusMiles: Double = 25.0
    var alertOnFeltEarthquakes: Bool = true
    var alertOnSwarms: Bool = true
    var dailySummaryEnabled: Bool = true
    var dailySummaryTime: Date = Calendar.current.date(from: DateComponents(hour: 18, minute: 0)) ?? Date()
    
    // Display settings
    var showFeltEarthquakesOnly: Bool = false
    var hapticFeedbackEnabled: Bool = true
    var defaultTimeFilter: TimeFilter = .day
    
    // First launch tracking
    var hasCompletedOnboarding: Bool = false
    var firstLaunchDate: Date?
    
    init() {
        self.firstLaunchDate = Date()
    }
}

// MARK: - Time Filter
enum TimeFilter: String, Codable, CaseIterable {
    case hour = "Past Hour"
    case day = "Past 24 Hours"
    case week = "Past Week"
    
    var feedType: String {
        switch self {
        case .hour: return "all_hour"
        case .day: return "all_day"
        case .week: return "all_week"
        }
    }
    
    var icon: String {
        switch self {
        case .hour: return "clock"
        case .day: return "sun.max"
        case .week: return "calendar"
        }
    }
}

// MARK: - Bay Area Cities
struct BayAreaCity: Identifiable, Hashable {
    let id = UUID()
    let name: String
    let latitude: Double
    let longitude: Double
    let county: String
    let areaCode: String
}

enum BayAreaCities {
    static let all: [BayAreaCity] = [
        // San Francisco
        BayAreaCity(name: "San Francisco", latitude: 37.7749, longitude: -122.4194, county: "San Francisco", areaCode: "415"),
        
        // Alameda County
        BayAreaCity(name: "Oakland", latitude: 37.8044, longitude: -122.2712, county: "Alameda", areaCode: "510"),
        BayAreaCity(name: "Berkeley", latitude: 37.8716, longitude: -122.2727, county: "Alameda", areaCode: "510"),
        BayAreaCity(name: "Fremont", latitude: 37.5485, longitude: -121.9886, county: "Alameda", areaCode: "510"),
        BayAreaCity(name: "Hayward", latitude: 37.6688, longitude: -122.0808, county: "Alameda", areaCode: "510"),
        BayAreaCity(name: "Dublin", latitude: 37.7022, longitude: -121.9358, county: "Alameda", areaCode: "925"),
        BayAreaCity(name: "Pleasanton", latitude: 37.6624, longitude: -121.8747, county: "Alameda", areaCode: "925"),
        BayAreaCity(name: "Livermore", latitude: 37.6819, longitude: -121.7680, county: "Alameda", areaCode: "925"),
        
        // Contra Costa County
        BayAreaCity(name: "San Ramon", latitude: 37.7799, longitude: -121.9780, county: "Contra Costa", areaCode: "925"),
        BayAreaCity(name: "Concord", latitude: 37.9780, longitude: -122.0311, county: "Contra Costa", areaCode: "925"),
        BayAreaCity(name: "Walnut Creek", latitude: 37.9101, longitude: -122.0652, county: "Contra Costa", areaCode: "925"),
        BayAreaCity(name: "Danville", latitude: 37.8216, longitude: -121.9997, county: "Contra Costa", areaCode: "925"),
        BayAreaCity(name: "Richmond", latitude: 37.9358, longitude: -122.3478, county: "Contra Costa", areaCode: "510"),
        
        // Santa Clara County
        BayAreaCity(name: "San Jose", latitude: 37.3382, longitude: -121.8863, county: "Santa Clara", areaCode: "408"),
        BayAreaCity(name: "Palo Alto", latitude: 37.4419, longitude: -122.1430, county: "Santa Clara", areaCode: "650"),
        BayAreaCity(name: "Mountain View", latitude: 37.3861, longitude: -122.0839, county: "Santa Clara", areaCode: "650"),
        BayAreaCity(name: "Sunnyvale", latitude: 37.3688, longitude: -122.0363, county: "Santa Clara", areaCode: "408"),
        BayAreaCity(name: "Santa Clara", latitude: 37.3541, longitude: -121.9552, county: "Santa Clara", areaCode: "408"),
        BayAreaCity(name: "Cupertino", latitude: 37.3230, longitude: -122.0322, county: "Santa Clara", areaCode: "408"),
        
        // San Mateo County
        BayAreaCity(name: "San Mateo", latitude: 37.5630, longitude: -122.3255, county: "San Mateo", areaCode: "650"),
        BayAreaCity(name: "Redwood City", latitude: 37.4852, longitude: -122.2364, county: "San Mateo", areaCode: "650"),
        BayAreaCity(name: "Daly City", latitude: 37.6879, longitude: -122.4702, county: "San Mateo", areaCode: "650"),
        
        // Marin County
        BayAreaCity(name: "San Rafael", latitude: 37.9735, longitude: -122.5311, county: "Marin", areaCode: "415"),
        BayAreaCity(name: "Sausalito", latitude: 37.8591, longitude: -122.4853, county: "Marin", areaCode: "415"),
        BayAreaCity(name: "Novato", latitude: 38.1074, longitude: -122.5697, county: "Marin", areaCode: "415"),
        
        // Sonoma/Napa
        BayAreaCity(name: "Santa Rosa", latitude: 38.4404, longitude: -122.7141, county: "Sonoma", areaCode: "707"),
        BayAreaCity(name: "Napa", latitude: 38.2975, longitude: -122.2869, county: "Napa", areaCode: "707"),
        BayAreaCity(name: "Petaluma", latitude: 38.2324, longitude: -122.6367, county: "Sonoma", areaCode: "707"),
        
        // Solano
        BayAreaCity(name: "Vallejo", latitude: 38.1041, longitude: -122.2566, county: "Solano", areaCode: "707"),
        BayAreaCity(name: "Fairfield", latitude: 38.2494, longitude: -122.0400, county: "Solano", areaCode: "707"),
    ].sorted { $0.name < $1.name }
}
