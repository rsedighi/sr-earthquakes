//
//  MapViewModel.swift
//  BayTremor
//
//  View model for the earthquake map
//

import Foundation
import MapKit

@MainActor
@Observable
class MapViewModel {
    // MARK: - Properties
    
    var earthquakes: [Earthquake] = []
    var isLoading = false
    var isRefreshing = false
    var error: Error?
    var selectedFilter: TimeFilter = .day
    
    // Bay Area center
    let bayAreaCenter = CLLocationCoordinate2D(latitude: 37.75, longitude: -122.0)
    
    // MARK: - Data Loading
    
    func loadEarthquakes() async {
        guard !isLoading else { return }
        
        isLoading = earthquakes.isEmpty
        error = nil
        
        do {
            let fetched = try await APIClient.shared.fetchEarthquakes(feed: selectedFilter.feedType)
            earthquakes = fetched.sorted { $0.timestamp > $1.timestamp }
            error = nil
        } catch {
            self.error = error
            print("❌ Map: Failed to load earthquakes: \(error)")
        }
        
        isLoading = false
    }
    
    func refresh() async {
        guard !isRefreshing else { return }
        
        isRefreshing = true
        await loadEarthquakes()
        try? await Task.sleep(nanoseconds: 300_000_000)
        isRefreshing = false
    }
    
    func changeFilter(to filter: TimeFilter) {
        selectedFilter = filter
        Task {
            await loadEarthquakes()
        }
    }
}
