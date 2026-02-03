//
//  APIClient.swift
//  BayTremor
//
//  Network layer for API communication
//

import Foundation

/// Main API client for fetching earthquake data
actor APIClient {
    static let shared = APIClient()
    
    // MARK: - Configuration
    
    /// Base URL for the backend API
    /// Update this to your production URL when deploying
    private let baseURL = "https://baytremor.com"
    
    /// Direct USGS API (fallback)
    private let usgsBaseURL = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary"
    
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
    
    // MARK: - Bay Area Bounds (for filtering USGS data)
    
    private let bayAreaBounds = (
        minLat: 36.9,
        maxLat: 38.35,
        minLon: -123.0,
        maxLon: -121.4
    )
    
    // MARK: - Earthquake APIs
    
    /// Fetch earthquakes from your backend API
    func fetchEarthquakes(feed: String = "all_day") async throws -> [Earthquake] {
        // Try backend first, fall back to USGS directly
        do {
            return try await fetchFromBackend(feed: feed)
        } catch {
            print("⚠️ Backend unavailable, using USGS directly: \(error)")
            return try await fetchFromUSGS(feed: feed)
        }
    }
    
    /// Fetch from your Next.js backend
    private func fetchFromBackend(feed: String) async throws -> [Earthquake] {
        guard let url = URL(string: "\(baseURL)/api/earthquakes?feed=\(feed)") else {
            throw APIError.invalidURL
        }
        
        let (data, response) = try await session.data(from: url)
        
        guard let httpResponse = response as? HTTPURLResponse,
              (200...299).contains(httpResponse.statusCode) else {
            throw APIError.invalidResponse
        }
        
        let apiResponse = try decoder.decode(Earthquake.APIResponse.self, from: data)
        return apiResponse.features.map { Earthquake.from(feature: $0) }
    }
    
    /// Fetch directly from USGS (fallback)
    private func fetchFromUSGS(feed: String) async throws -> [Earthquake] {
        let feedPath: String
        switch feed {
        case "all_hour": feedPath = "all_hour.geojson"
        case "all_week": feedPath = "all_week.geojson"
        default: feedPath = "all_day.geojson"
        }
        
        guard let url = URL(string: "\(usgsBaseURL)/\(feedPath)") else {
            throw APIError.invalidURL
        }
        
        let (data, response) = try await session.data(from: url)
        
        guard let httpResponse = response as? HTTPURLResponse,
              (200...299).contains(httpResponse.statusCode) else {
            throw APIError.invalidResponse
        }
        
        let apiResponse = try decoder.decode(Earthquake.APIResponse.self, from: data)
        
        // Filter to Bay Area only
        let bayAreaQuakes = apiResponse.features.filter { feature in
            let coords = feature.geometry.coordinates
            guard coords.count >= 2 else { return false }
            let lon = coords[0]
            let lat = coords[1]
            return lat >= bayAreaBounds.minLat &&
                   lat <= bayAreaBounds.maxLat &&
                   lon >= bayAreaBounds.minLon &&
                   lon <= bayAreaBounds.maxLon
        }
        
        return bayAreaQuakes.map { Earthquake.from(feature: $0) }
    }
}

// MARK: - API Errors

enum APIError: LocalizedError {
    case invalidURL
    case invalidResponse
    case invalidData
    case networkError(Error)
    case serverError(Int)
    
    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid URL"
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
