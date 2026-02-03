//
//  LocationService.swift
//  BayTremor
//
//  Location services for user position
//

import Foundation
import CoreLocation

@MainActor
class LocationService: NSObject, ObservableObject {
    static let shared = LocationService()
    
    private let locationManager = CLLocationManager()
    
    @Published var currentLocation: CLLocation?
    @Published var authorizationStatus: CLAuthorizationStatus = .notDetermined
    @Published var isAuthorized = false
    @Published var error: LocationError?
    
    override init() {
        super.init()
        locationManager.delegate = self
        locationManager.desiredAccuracy = kCLLocationAccuracyKilometer
        authorizationStatus = locationManager.authorizationStatus
        updateAuthorizationState()
    }
    
    // MARK: - Authorization
    
    func requestPermission() {
        locationManager.requestWhenInUseAuthorization()
    }
    
    private func updateAuthorizationState() {
        switch authorizationStatus {
        case .authorizedWhenInUse, .authorizedAlways:
            isAuthorized = true
        default:
            isAuthorized = false
        }
    }
    
    // MARK: - Location Updates
    
    func requestCurrentLocation() {
        guard isAuthorized else {
            requestPermission()
            return
        }
        
        locationManager.requestLocation()
    }
    
    func startUpdatingLocation() {
        guard isAuthorized else {
            requestPermission()
            return
        }
        
        locationManager.startUpdatingLocation()
    }
    
    func stopUpdatingLocation() {
        locationManager.stopUpdatingLocation()
    }
    
    // MARK: - Distance Calculation
    
    func distance(to coordinate: CLLocationCoordinate2D) -> Double? {
        guard let currentLocation = currentLocation else { return nil }
        
        let destination = CLLocation(
            latitude: coordinate.latitude,
            longitude: coordinate.longitude
        )
        
        // Return distance in miles
        return currentLocation.distance(from: destination) / 1609.344
    }
    
    func distance(toEarthquake earthquake: Earthquake) -> Double? {
        return distance(to: earthquake.coordinate)
    }
}

// MARK: - CLLocationManagerDelegate

extension LocationService: CLLocationManagerDelegate {
    nonisolated func locationManager(
        _ manager: CLLocationManager,
        didUpdateLocations locations: [CLLocation]
    ) {
        guard let location = locations.last else { return }
        
        Task { @MainActor in
            self.currentLocation = location
            self.error = nil
        }
    }
    
    nonisolated func locationManager(
        _ manager: CLLocationManager,
        didFailWithError error: Error
    ) {
        Task { @MainActor in
            if let clError = error as? CLError {
                switch clError.code {
                case .denied:
                    self.error = .denied
                case .locationUnknown:
                    self.error = .unknown
                default:
                    self.error = .failed(error)
                }
            } else {
                self.error = .failed(error)
            }
        }
    }
    
    nonisolated func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        Task { @MainActor in
            self.authorizationStatus = manager.authorizationStatus
            self.updateAuthorizationState()
            
            if self.isAuthorized {
                self.requestCurrentLocation()
            }
        }
    }
}

// MARK: - Location Errors

enum LocationError: LocalizedError {
    case denied
    case unknown
    case failed(Error)
    
    var errorDescription: String? {
        switch self {
        case .denied:
            return "Location access denied. Enable in Settings."
        case .unknown:
            return "Unable to determine location."
        case .failed(let error):
            return "Location error: \(error.localizedDescription)"
        }
    }
}
