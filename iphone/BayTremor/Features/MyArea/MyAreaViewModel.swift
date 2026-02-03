//
//  MyAreaViewModel.swift
//  BayTremor
//
//  View model for My Area tab
//

import Foundation
import CoreLocation
import Combine

@MainActor
@Observable
class MyAreaViewModel {
    // MARK: - Properties
    
    var earthquakes: [Earthquake] = []
    var isLoading = false
    var error: Error?
    var radiusMiles: Double = 15
    var minMagnitude: Double = 0.0
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
    
    var nearbyEarthquakes: [Earthquake] {
        guard let coord = cityCoordinate else { return [] }
        let cityLocation = CLLocation(latitude: coord.latitude, longitude: coord.longitude)
        
        return earthquakes
            .filter { earthquake in
                let distance = earthquake.distance(from: cityLocation)
                return distance <= radiusMiles && earthquake.magnitude >= minMagnitude
            }
            .sorted { $0.timestamp > $1.timestamp }
    }
    
    // MARK: - Methods
    
    func setCity(_ cityName: String) {
        cityCoordinate = cityCoordinates[cityName]
    }
    
    func loadEarthquakes() async {
        guard !isLoading else { return }
        
        isLoading = earthquakes.isEmpty
        error = nil
        
        do {
            let fetched = try await APIClient.shared.fetchEarthquakes(feed: "all_day")
            earthquakes = fetched
            error = nil
        } catch {
            self.error = error
            print("❌ MyArea: Failed to load earthquakes: \(error)")
        }
        
        isLoading = false
    }
}

// MARK: - Location Manager

class LocationManager: NSObject, ObservableObject, CLLocationManagerDelegate {
    private let manager = CLLocationManager()
    
    @Published var location: CLLocation?
    @Published var authorizationStatus: CLAuthorizationStatus = .notDetermined
    
    override init() {
        super.init()
        manager.delegate = self
        manager.desiredAccuracy = kCLLocationAccuracyKilometer
    }
    
    func requestPermission() {
        manager.requestWhenInUseAuthorization()
    }
    
    func requestLocation() {
        manager.requestLocation()
    }
    
    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        location = locations.last
    }
    
    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        print("Location error: \(error)")
    }
    
    func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        authorizationStatus = manager.authorizationStatus
    }
}
