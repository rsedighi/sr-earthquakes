//
//  DashboardViewModel.swift
//  BayTremor
//
//  Premium view model for the live earthquake dashboard
//

import Foundation
import SwiftUI
import CoreLocation

@MainActor
@Observable
class DashboardViewModel {
    // MARK: - Published Properties
    
    var earthquakes: [Earthquake] = []
    var isLoading = false
    var isRefreshing = false
    var error: Error?
    var selectedFilter: TimeFilter = .day
    var quickFilter: QuickFilter = .all
    var lastUpdated: Date?
    var cityCoordinate: CLLocationCoordinate2D?
    
    // City coordinates lookup
    private let cityCoordinates: [String: CLLocationCoordinate2D] = [
        "San Francisco": CLLocationCoordinate2D(latitude: 37.7749, longitude: -122.4194),
        "Oakland": CLLocationCoordinate2D(latitude: 37.8044, longitude: -122.2712),
        "Berkeley": CLLocationCoordinate2D(latitude: 37.8716, longitude: -122.2727),
        "San Jose": CLLocationCoordinate2D(latitude: 37.3382, longitude: -121.8863),
        "Palo Alto": CLLocationCoordinate2D(latitude: 37.4419, longitude: -122.1430),
        "Mountain View": CLLocationCoordinate2D(latitude: 37.3861, longitude: -122.0839),
        "Sunnyvale": CLLocationCoordinate2D(latitude: 37.3688, longitude: -122.0363),
        "Santa Clara": CLLocationCoordinate2D(latitude: 37.3541, longitude: -121.9552),
        "Fremont": CLLocationCoordinate2D(latitude: 37.5485, longitude: -121.9886),
        "Hayward": CLLocationCoordinate2D(latitude: 37.6688, longitude: -122.0808),
        "San Ramon": CLLocationCoordinate2D(latitude: 37.7799, longitude: -121.9780),
        "Dublin": CLLocationCoordinate2D(latitude: 37.7022, longitude: -121.9358),
        "Pleasanton": CLLocationCoordinate2D(latitude: 37.6624, longitude: -121.8747),
        "Livermore": CLLocationCoordinate2D(latitude: 37.6819, longitude: -121.7680),
        "Walnut Creek": CLLocationCoordinate2D(latitude: 37.9101, longitude: -122.0652),
        "Concord": CLLocationCoordinate2D(latitude: 37.9780, longitude: -122.0311),
        "Richmond": CLLocationCoordinate2D(latitude: 37.9358, longitude: -122.3478),
        "San Mateo": CLLocationCoordinate2D(latitude: 37.5630, longitude: -122.3255),
        "Redwood City": CLLocationCoordinate2D(latitude: 37.4852, longitude: -122.2364),
        "Daly City": CLLocationCoordinate2D(latitude: 37.6879, longitude: -122.4702),
        "San Rafael": CLLocationCoordinate2D(latitude: 37.9735, longitude: -122.5311),
        "Vallejo": CLLocationCoordinate2D(latitude: 38.1041, longitude: -122.2566),
        "Santa Rosa": CLLocationCoordinate2D(latitude: 38.4404, longitude: -122.7141),
        "Napa": CLLocationCoordinate2D(latitude: 38.2975, longitude: -122.2869),
    ]
    
    // MARK: - Computed Properties
    
    var earthquakeCount: Int {
        earthquakes.count
    }
    
    var largestMagnitude: Double? {
        earthquakes.map(\.magnitude).max()
    }
    
    var largestEarthquake: Earthquake? {
        earthquakes.max(by: { $0.magnitude < $1.magnitude })
    }
    
    var feltCount: Int {
        earthquakes.filter { ($0.felt ?? 0) > 0 }.count
    }
    
    var strongCount: Int {
        earthquakes.filter { $0.magnitude >= 3.0 }.count
    }
    
    var activityLevel: ActivityLevel {
        switch earthquakeCount {
        case 0...2: return .quiet
        case 3...10: return .normal
        case 11...25: return .elevated
        default: return .high
        }
    }
    
    var trend: TrendDirection {
        // Simple trend based on recent activity
        let recentCount = earthquakes.filter {
            Date().timeIntervalSince($0.time) < 3600 // Last hour
        }.count
        
        if recentCount > 3 {
            return .up
        } else if recentCount == 0 && earthquakeCount > 5 {
            return .down
        }
        return .stable
    }
    
    var filteredEarthquakes: [Earthquake] {
        var result = earthquakes
        
        switch quickFilter {
        case .all:
            break
        case .felt:
            result = result.filter { ($0.felt ?? 0) > 0 }
        case .strong:
            result = result.filter { $0.magnitude >= 3.0 }
        case .nearby:
            if let coord = cityCoordinate {
                let location = CLLocation(latitude: coord.latitude, longitude: coord.longitude)
                result = result.filter { earthquake in
                    earthquake.distance(from: location) <= 25
                }
            }
        }
        
        return result.sorted { $0.timestamp > $1.timestamp }
    }
    
    var sortedEarthquakes: [Earthquake] {
        earthquakes.sorted { $0.timestamp > $1.timestamp }
    }
    
    // MARK: - Auto-refresh
    
    private var refreshTask: Task<Void, Never>?
    private let refreshInterval: TimeInterval = 30 // 30 seconds
    
    init() {
        startAutoRefresh()
    }
    
    func stopRefreshing() {
        refreshTask?.cancel()
        refreshTask = nil
    }
    
    // MARK: - Data Loading
    
    func loadEarthquakes() async {
        guard !isLoading else { return }
        
        isLoading = earthquakes.isEmpty
        error = nil
        
        do {
            let fetched = try await APIClient.shared.fetchEarthquakes(feed: selectedFilter.feedType)
            
            // Sort by timestamp (newest first)
            earthquakes = fetched.sorted { $0.timestamp > $1.timestamp }
            lastUpdated = Date()
            error = nil
            
            // Haptic feedback for new significant earthquakes
            if let newest = earthquakes.first,
               newest.magnitude >= 3.0,
               Date().timeIntervalSince(newest.time) < 300 {
                await triggerHaptic(.heavy)
            }
            
        } catch {
            self.error = error
            print("❌ Failed to load earthquakes: \(error)")
        }
        
        isLoading = false
    }
    
    func refresh() async {
        guard !isRefreshing else { return }
        
        isRefreshing = true
        await triggerHaptic(.light)
        await loadEarthquakes()
        
        // Brief delay for visual feedback
        try? await Task.sleep(nanoseconds: 300_000_000)
        isRefreshing = false
    }
    
    func changeFilter(to filter: TimeFilter) {
        selectedFilter = filter
        Task {
            await loadEarthquakes()
        }
    }
    
    func setCity(_ cityName: String) {
        cityCoordinate = cityCoordinates[cityName]
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
    
    // MARK: - Haptics
    
    private func triggerHaptic(_ style: UIImpactFeedbackGenerator.FeedbackStyle) async {
        await MainActor.run {
            let generator = UIImpactFeedbackGenerator(style: style)
            generator.impactOccurred()
        }
    }
}
