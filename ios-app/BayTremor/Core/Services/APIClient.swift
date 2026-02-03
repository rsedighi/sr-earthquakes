//
//  APIClient.swift
//  BayTremor
//
//  Network layer for API communication
//

import Foundation

actor APIClient {
    static let shared = APIClient()
    
    // MARK: - Configuration
    
    /// Base URL for your backend API
    /// Change this to your production URL when deploying
    private let baseURL: String = {
        #if DEBUG
        return "http://localhost:3000"
        #else
        return "https://your-production-url.com"
        #endif
    }()
    
    private let session: URLSession
    private let decoder: JSONDecoder
    
    private init() {
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 30
        config.timeoutIntervalForResource = 60
        config.waitsForConnectivity = true
        
        self.session = URLSession(configuration: config)
        
        self.decoder = JSONDecoder()
        self.decoder.dateDecodingStrategy = .millisecondsSince1970
    }
    
    // MARK: - Earthquake APIs
    
    /// Fetch earthquakes from the API
    func fetchEarthquakes(feed: String = "all_day") async throws -> [Earthquake] {
        let url = URL(string: "\(baseURL)/api/earthquakes?feed=\(feed)")!
        
        let (data, response) = try await session.data(from: url)
        
        guard let httpResponse = response as? HTTPURLResponse,
              (200...299).contains(httpResponse.statusCode) else {
            throw APIError.invalidResponse
        }
        
        let apiResponse = try decoder.decode(Earthquake.APIResponse.self, from: data)
        return apiResponse.features.map { Earthquake(from: $0) }
    }
    
    /// Fetch a single earthquake by ID
    func fetchEarthquake(id: String) async throws -> Earthquake {
        let url = URL(string: "\(baseURL)/api/earthquake/\(id)")!
        
        let (data, response) = try await session.data(from: url)
        
        guard let httpResponse = response as? HTTPURLResponse,
              (200...299).contains(httpResponse.statusCode) else {
            throw APIError.invalidResponse
        }
        
        let feature = try decoder.decode(Earthquake.APIResponse.Feature.self, from: data)
        return Earthquake(from: feature)
    }
    
    /// Fetch historical earthquakes
    func fetchHistoricalEarthquakes(startDate: Date, endDate: Date) async throws -> [Earthquake] {
        let formatter = ISO8601DateFormatter()
        let start = formatter.string(from: startDate)
        let end = formatter.string(from: endDate)
        
        let url = URL(string: "\(baseURL)/api/earthquakes/historical?start=\(start)&end=\(end)")!
        
        let (data, response) = try await session.data(from: url)
        
        guard let httpResponse = response as? HTTPURLResponse,
              (200...299).contains(httpResponse.statusCode) else {
            throw APIError.invalidResponse
        }
        
        let apiResponse = try decoder.decode(Earthquake.APIResponse.self, from: data)
        return apiResponse.features.map { Earthquake(from: $0) }
    }
    
    // MARK: - Device Registration (Push Notifications)
    
    /// Register device for push notifications
    func registerDevice(token: String, preferences: NotificationPreferences? = nil) async {
        guard let url = URL(string: "\(baseURL)/api/devices") else { return }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let body: [String: Any] = [
            "deviceToken": token,
            "platform": "ios",
            "preferences": preferences?.toDictionary() ?? [:]
        ]
        
        do {
            request.httpBody = try JSONSerialization.data(withJSONObject: body)
            let (_, response) = try await session.data(for: request)
            
            if let httpResponse = response as? HTTPURLResponse {
                print("📱 Device registered: \(httpResponse.statusCode)")
            }
        } catch {
            print("❌ Failed to register device: \(error)")
        }
    }
    
    /// Update notification preferences
    func updateNotificationPreferences(_ preferences: NotificationPreferences) async {
        guard let url = URL(string: "\(baseURL)/api/devices/preferences") else { return }
        
        var request = URLRequest(url: url)
        request.httpMethod = "PUT"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        do {
            request.httpBody = try JSONSerialization.data(withJSONObject: preferences.toDictionary())
            let _ = try await session.data(for: request)
        } catch {
            print("❌ Failed to update preferences: \(error)")
        }
    }
}

// MARK: - API Errors

enum APIError: LocalizedError {
    case invalidResponse
    case invalidData
    case networkError(Error)
    case serverError(Int)
    
    var errorDescription: String? {
        switch self {
        case .invalidResponse:
            return "Invalid response from server"
        case .invalidData:
            return "Unable to parse response data"
        case .networkError(let error):
            return "Network error: \(error.localizedDescription)"
        case .serverError(let code):
            return "Server error: \(code)"
        }
    }
}

// MARK: - Notification Preferences

struct NotificationPreferences {
    var enabled: Bool
    var minimumMagnitude: Double
    var radiusMiles: Double
    var alertOnFelt: Bool
    var alertOnSwarms: Bool
    var latitude: Double?
    var longitude: Double?
    
    func toDictionary() -> [String: Any] {
        var dict: [String: Any] = [
            "enabled": enabled,
            "minimumMagnitude": minimumMagnitude,
            "radiusMiles": radiusMiles,
            "alertOnFelt": alertOnFelt,
            "alertOnSwarms": alertOnSwarms
        ]
        if let lat = latitude, let lon = longitude {
            dict["latitude"] = lat
            dict["longitude"] = lon
        }
        return dict
    }
}
