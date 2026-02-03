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
    
    // Display settings
    var showFeltEarthquakesOnly: Bool = false
    var hapticFeedbackEnabled: Bool = true
    var defaultTimeFilter: String = "day"
    
    // First launch tracking
    var hasCompletedOnboarding: Bool = false
    var firstLaunchDate: Date?
    
    init() {
        self.firstLaunchDate = Date()
    }
}

// MARK: - Time Filter

enum TimeFilter: String, CaseIterable {
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
