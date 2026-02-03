//
//  DashboardViewModel.swift
//  BayTremor
//
//  View model for the dashboard
//

import Foundation
import SwiftUI

@MainActor
class DashboardViewModel: ObservableObject {
    // MARK: - Published Properties
    
    @Published var earthquakes: [Earthquake] = []
    @Published var isLoading = false
    @Published var isRefreshing = false
    @Published var error: Error?
    @Published var timeFilter: TimeFilter = .day {
        didSet {
            Task { await loadEarthquakes() }
        }
    }
    @Published var selectedEarthquake: Earthquake?
    @Published var lastUpdated: Date?
    
    // MARK: - Computed Properties
    
    var largestMagnitude: Double? {
        earthquakes.map(\.magnitude).max()
    }
    
    var sortedEarthquakes: [Earthquake] {
        earthquakes.sorted { $0.timestamp > $1.timestamp }
    }
    
    // MARK: - Auto-refresh Timer
    
    private var refreshTask: Task<Void, Never>?
    private let refreshInterval: TimeInterval = 30 // 30 seconds
    
    init() {
        startAutoRefresh()
    }
    
    deinit {
        refreshTask?.cancel()
    }
    
    // MARK: - Data Loading
    
    func loadEarthquakes() async {
        isLoading = earthquakes.isEmpty
        error = nil
        
        do {
            let fetched = try await APIClient.shared.fetchEarthquakes(feed: timeFilter.feedType)
            
            // Sort by timestamp (newest first)
            earthquakes = fetched.sorted { $0.timestamp > $1.timestamp }
            lastUpdated = Date()
            
            // Provide haptic feedback for significant new earthquakes
            if let newest = earthquakes.first,
               newest.magnitude >= 3.0,
               Date().timeIntervalSince(newest.time) < 300 { // Within 5 minutes
                await HapticService.shared.impact(.medium)
            }
        } catch {
            self.error = error
            print("❌ Failed to load earthquakes: \(error)")
        }
        
        isLoading = false
    }
    
    func refresh() async {
        isRefreshing = true
        await loadEarthquakes()
        
        // Brief delay for visual feedback
        try? await Task.sleep(nanoseconds: 500_000_000)
        isRefreshing = false
    }
    
    // MARK: - Auto-refresh
    
    private func startAutoRefresh() {
        refreshTask = Task {
            while !Task.isCancelled {
                try? await Task.sleep(nanoseconds: UInt64(refreshInterval * 1_000_000_000))
                
                if !Task.isCancelled {
                    await loadEarthquakes()
                }
            }
        }
    }
    
    // MARK: - Filtering
    
    func earthquakesNear(latitude: Double, longitude: Double, radiusMiles: Double) -> [Earthquake] {
        earthquakes.filter { earthquake in
            let distance = calculateDistance(
                lat1: latitude, lon1: longitude,
                lat2: earthquake.latitude, lon2: earthquake.longitude
            )
            return distance <= radiusMiles
        }
    }
    
    func earthquakesByMagnitude(minimum: Double) -> [Earthquake] {
        earthquakes.filter { $0.magnitude >= minimum }
    }
    
    // MARK: - Distance Calculation
    
    private func calculateDistance(lat1: Double, lon1: Double, lat2: Double, lon2: Double) -> Double {
        let R = 3958.8 // Earth's radius in miles
        let dLat = (lat2 - lat1) * .pi / 180
        let dLon = (lon2 - lon1) * .pi / 180
        let a = sin(dLat / 2) * sin(dLat / 2) +
                cos(lat1 * .pi / 180) * cos(lat2 * .pi / 180) *
                sin(dLon / 2) * sin(dLon / 2)
        let c = 2 * atan2(sqrt(a), sqrt(1 - a))
        return R * c
    }
}

// MARK: - Haptic Service

actor HapticService {
    static let shared = HapticService()
    
    func impact(_ style: UIImpactFeedbackGenerator.FeedbackStyle) {
        await MainActor.run {
            let generator = UIImpactFeedbackGenerator(style: style)
            generator.impactOccurred()
        }
    }
    
    func notification(_ type: UINotificationFeedbackGenerator.FeedbackType) {
        await MainActor.run {
            let generator = UINotificationFeedbackGenerator()
            generator.notificationOccurred(type)
        }
    }
}
