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
    
    // MARK: - Community Comments APIs
    
    func fetchComments(earthquakeId: String) async throws -> [Comment] {
        var components = URLComponents(string: "\(baseURL)/api/comments")
        components?.queryItems = [
            URLQueryItem(name: "earthquakeId", value: earthquakeId),
        ]
        
        guard let url = components?.url else {
            throw APIError.invalidURL
        }
        
        let (data, response) = try await session.data(from: url)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }
        
        guard (200...299).contains(httpResponse.statusCode) else {
            throw APIError.serverError(httpResponse.statusCode)
        }
        
        let apiResponse = try Self.commentsDecoder().decode(CommentsResponse.self, from: data)
        return apiResponse.comments.sorted { $0.createdAt > $1.createdAt }
    }
    
    func postComment(_ requestBody: CreateCommentRequest) async throws -> Comment {
        guard let url = URL(string: "\(baseURL)/api/comments") else {
            throw APIError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONEncoder().encode(requestBody)
        
        let (data, response) = try await session.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }
        
        guard (200...299).contains(httpResponse.statusCode) else {
            if let errorResponse = try? JSONDecoder().decode(APIErrorResponse.self, from: data) {
                throw APIClientError(message: errorResponse.error)
            }
            throw APIError.serverError(httpResponse.statusCode)
        }
        
        let apiResponse = try Self.commentsDecoder().decode(CommentResponse.self, from: data)
        return apiResponse.comment
    }
    
    // MARK: - Community Feed APIs
    
    func fetchCommunityFeed(limit: Int = 50) async throws -> [CommunityFeedComment] {
        var components = URLComponents(string: "\(baseURL)/api/community")
        components?.queryItems = [
            URLQueryItem(name: "type", value: "feed"),
            URLQueryItem(name: "limit", value: String(max(1, min(200, limit)))),
        ]
        
        guard let url = components?.url else {
            throw APIError.invalidURL
        }
        
        let (data, response) = try await session.data(from: url)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }
        
        guard (200...299).contains(httpResponse.statusCode) else {
            throw APIError.serverError(httpResponse.statusCode)
        }
        
        let apiResponse = try Self.commentsDecoder().decode(CommunityFeedResponse.self, from: data)
        return apiResponse.comments.sorted { $0.createdAt > $1.createdAt }
    }
    
    static func commentsDecoder() -> JSONDecoder {
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .custom { decoder in
            let container = try decoder.singleValueContainer()
            
            if let milliseconds = try? container.decode(Double.self) {
                return Date(timeIntervalSince1970: milliseconds / 1000.0)
            }
            
            let stringValue = try container.decode(String.self)
            
            let isoWithFractional = ISO8601DateFormatter()
            isoWithFractional.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
            if let date = isoWithFractional.date(from: stringValue) {
                return date
            }
            
            let iso = ISO8601DateFormatter()
            iso.formatOptions = [.withInternetDateTime]
            if let date = iso.date(from: stringValue) {
                return date
            }
            
            throw DecodingError.dataCorruptedError(
                in: container,
                debugDescription: "Invalid date format: \(stringValue)"
            )
        }
        return decoder
    }

    // MARK: - Forum (Reddit-style) APIs
    
    func fetchForumThreads(sort: ForumSort, limit: Int = 25, skip: Int = 0) async throws -> ForumThreadsResponse {
        var components = URLComponents(string: "\(baseURL)/api/forum/threads")
        components?.queryItems = [
            URLQueryItem(name: "sortBy", value: sort.apiSortBy),
            URLQueryItem(name: "limit", value: String(max(1, min(50, limit)))),
            URLQueryItem(name: "skip", value: String(max(0, skip))),
        ]
        
        guard let url = components?.url else { throw APIError.invalidURL }
        
        let (data, response) = try await session.data(from: url)
        
        guard let httpResponse = response as? HTTPURLResponse else { throw APIError.invalidResponse }
        guard (200...299).contains(httpResponse.statusCode) else { throw APIError.serverError(httpResponse.statusCode) }
        
        return try Self.commentsDecoder().decode(ForumThreadsResponse.self, from: data)
    }
    
    func fetchForumStats() async throws -> ForumStatsResponse.Stats {
        var components = URLComponents(string: "\(baseURL)/api/forum/threads")
        components?.queryItems = [
            URLQueryItem(name: "stats", value: "true"),
        ]
        
        guard let url = components?.url else { throw APIError.invalidURL }
        
        let (data, response) = try await session.data(from: url)
        
        guard let httpResponse = response as? HTTPURLResponse else { throw APIError.invalidResponse }
        guard (200...299).contains(httpResponse.statusCode) else { throw APIError.serverError(httpResponse.statusCode) }
        
        return try Self.commentsDecoder().decode(ForumStatsResponse.self, from: data).stats
    }
    
    func fetchForumThreadDetail(identifier: String, postsLimit: Int = 50, postsSkip: Int = 0) async throws -> ForumThreadDetailResponse {
        var components = URLComponents(string: "\(baseURL)/api/forum/threads/\(identifier)")
        components?.queryItems = [
            URLQueryItem(name: "postsLimit", value: String(max(1, min(100, postsLimit)))),
            URLQueryItem(name: "postsSkip", value: String(max(0, postsSkip))),
        ]
        
        guard let url = components?.url else { throw APIError.invalidURL }
        
        let (data, response) = try await session.data(from: url)
        
        guard let httpResponse = response as? HTTPURLResponse else { throw APIError.invalidResponse }
        guard (200...299).contains(httpResponse.statusCode) else { throw APIError.serverError(httpResponse.statusCode) }
        
        return try Self.commentsDecoder().decode(ForumThreadDetailResponse.self, from: data)
    }
    
    func createForumThread(_ requestBody: CreateForumThreadRequest) async throws -> ForumThread {
        guard let url = URL(string: "\(baseURL)/api/forum/threads") else { throw APIError.invalidURL }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONEncoder().encode(requestBody)
        
        let (data, response) = try await session.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else { throw APIError.invalidResponse }
        guard (200...299).contains(httpResponse.statusCode) else {
            if let errorResponse = try? JSONDecoder().decode(APIErrorResponse.self, from: data) {
                throw APIClientError(message: errorResponse.error)
            }
            throw APIError.serverError(httpResponse.statusCode)
        }
        
        let created = try Self.commentsDecoder().decode(CreateForumThreadResponse.self, from: data)
        return created.thread
    }
    
    func createForumPost(_ requestBody: CreateForumPostRequest) async throws -> ForumPost {
        guard let url = URL(string: "\(baseURL)/api/forum/posts") else { throw APIError.invalidURL }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONEncoder().encode(requestBody)
        
        let (data, response) = try await session.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else { throw APIError.invalidResponse }
        guard (200...299).contains(httpResponse.statusCode) else {
            if let errorResponse = try? JSONDecoder().decode(APIErrorResponse.self, from: data) {
                throw APIClientError(message: errorResponse.error)
            }
            throw APIError.serverError(httpResponse.statusCode)
        }
        
        let created = try Self.commentsDecoder().decode(CreateForumPostResponse.self, from: data)
        return created.post
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

// MARK: - Comments Types

struct Comment: Identifiable, Codable, Hashable {
    let id: String
    let earthquakeId: String
    let parentId: String?
    let author: String
    let content: String
    let createdAt: Date
    let updatedAt: Date?
    let likes: Int
    let location: String?
    let feltIt: Bool?
    
    enum CodingKeys: String, CodingKey {
        case id = "_id"
        case earthquakeId
        case parentId
        case author
        case content
        case createdAt
        case updatedAt
        case likes
        case location
        case feltIt
    }
}

struct CommentsResponse: Codable {
    let comments: [Comment]
}

struct CommentResponse: Codable {
    let comment: Comment
}

struct CreateCommentRequest: Codable {
    let earthquakeId: String
    let parentId: String?
    let author: String
    let content: String
    let location: String?
    let feltIt: Bool
}

struct APIErrorResponse: Codable {
    let error: String
}

struct APIClientError: LocalizedError {
    let message: String
    var errorDescription: String? { message }
}

// MARK: - Community Feed Types

struct CommunityFeedComment: Identifiable, Codable, Hashable {
    let id: String
    let earthquakeId: String
    let parentId: String?
    let author: String
    let content: String
    let createdAt: Date
    let updatedAt: Date?
    let likes: Int
    let location: String?
    let feltIt: Bool?
    
    // Enriched by /api/community
    let earthquakePlace: String?
    let earthquakeMagnitude: Double?
    let earthquakeTime: Date?
    
    enum CodingKeys: String, CodingKey {
        case id = "_id"
        case earthquakeId
        case parentId
        case author
        case content
        case createdAt
        case updatedAt
        case likes
        case location
        case feltIt
        case earthquakePlace
        case earthquakeMagnitude
        case earthquakeTime
    }
}

struct CommunityFeedResponse: Codable {
    let comments: [CommunityFeedComment]
}
