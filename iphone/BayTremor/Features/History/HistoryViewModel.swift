//
//  HistoryViewModel.swift
//  BayTremor
//
//  View model for History tab
//

import Foundation

@MainActor
@Observable
class HistoryViewModel {
    // MARK: - Properties
    
    var earthquakes: [Earthquake] = []
    var isLoading = false
    var error: Error?
    var selectedFilter: TimeFilter = .day
    
    // MARK: - Computed Properties
    
    var largestMagnitude: Double? {
        earthquakes.map(\.magnitude).max()
    }
    
    var smallestMagnitude: Double? {
        earthquakes.map(\.magnitude).min()
    }
    
    var averageMagnitude: Double {
        guard !earthquakes.isEmpty else { return 0 }
        return earthquakes.map(\.magnitude).reduce(0, +) / Double(earthquakes.count)
    }
    
    var averageDepth: Double {
        guard !earthquakes.isEmpty else { return 0 }
        return earthquakes.map(\.depth).reduce(0, +) / Double(earthquakes.count)
    }
    
    var significantEarthquakes: [Earthquake] {
        earthquakes
            .filter { $0.magnitude >= 2.5 }
            .sorted { $0.magnitude > $1.magnitude }
    }
    
    var feltEarthquakes: [Earthquake] {
        earthquakes.filter { ($0.felt ?? 0) > 0 }
    }
    
    // MARK: - Methods
    
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
            print("❌ History: Failed to load earthquakes: \(error)")
        }
        
        isLoading = false
    }
    
    func changeFilter(to filter: TimeFilter) {
        guard filter != selectedFilter else { return }
        selectedFilter = filter
        Task {
            await loadEarthquakes()
        }
    }
}
