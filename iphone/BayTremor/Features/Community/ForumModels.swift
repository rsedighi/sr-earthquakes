//
//  ForumModels.swift
//  BayTremor
//
//  Reddit-style community models backed by /api/forum/*
//

import Foundation

enum ForumSort: String, CaseIterable, Identifiable {
    case hot
    case new
    case top
    
    var id: String { rawValue }
    
    var title: String {
        switch self {
        case .hot: return "Hot"
        case .new: return "New"
        case .top: return "Top"
        }
    }
    
    /// Maps to server query param sortBy.
    var apiSortBy: String {
        switch self {
        case .hot: return "popular"
        case .new: return "latest"
        case .top: return "popular"
        }
    }
}

enum ForumCategory: String, CaseIterable, Identifiable, Codable {
    case earthquake
    case general
    case neighborhood
    case preparedness
    case science
    
    var id: String { rawValue }
    
    var label: String {
        switch self {
        case .general: return "💬 General Discussion"
        case .earthquake: return "🌋 Earthquake Report"
        case .neighborhood: return "📍 Neighborhood"
        case .preparedness: return "🛡️ Preparedness & Safety"
        case .science: return "🔬 Science & Research"
        }
    }
}

struct ForumThread: Identifiable, Codable, Hashable {
    let id: String
    let title: String
    let slug: String
    let category: ForumCategory
    let author: String
    let authorLocation: String?
    let content: String
    let earthquakeId: String?
    let earthquakeData: ForumEarthquakeData?
    let isPinned: Bool
    let isLocked: Bool
    let viewCount: Int
    let postCount: Int
    let lastPostAt: Date
    let lastPostAuthor: String?
    let createdAt: Date
    let updatedAt: Date
    let tags: [String]?
    
    enum CodingKeys: String, CodingKey {
        case id = "_id"
        case title
        case slug
        case category
        case author
        case authorLocation
        case content
        case earthquakeId
        case earthquakeData
        case isPinned
        case isLocked
        case viewCount
        case postCount
        case lastPostAt
        case lastPostAuthor
        case createdAt
        case updatedAt
        case tags
    }
}

struct ForumEarthquakeData: Codable, Hashable {
    let magnitude: Double
    let place: String
    let time: Date
    let depth: Double?
}

struct ForumPost: Identifiable, Codable, Hashable {
    let id: String
    let threadId: String
    let parentPostId: String?
    let author: String
    let authorLocation: String?
    let content: String
    let feltIt: Bool?
    let intensity: Int?
    let likes: Int
    let createdAt: Date
    let updatedAt: Date?
    let isOriginalPost: Bool
    
    enum CodingKeys: String, CodingKey {
        case id = "_id"
        case threadId
        case parentPostId
        case author
        case authorLocation
        case content
        case feltIt
        case intensity
        case likes
        case createdAt
        case updatedAt
        case isOriginalPost
    }
}

struct ForumThreadsResponse: Codable {
    let threads: [ForumThread]
    let total: Int
}

struct ForumThreadDetailResponse: Codable {
    let thread: ForumThread
    let posts: [ForumPost]
    let totalPosts: Int
}

struct ForumPostsResponse: Codable {
    let posts: [ForumPost]
    let total: Int
}

struct ForumStatsResponse: Codable {
    struct Stats: Codable {
        let totalThreads: Int
        let totalPosts: Int
        let earthquakeThreads: Int
        let activeToday: Int
    }
    let stats: Stats
}

struct CreateForumThreadRequest: Codable {
    let title: String
    let category: ForumCategory
    let author: String
    let authorLocation: String?
    let content: String
    let earthquakeId: String?
    let earthquakeData: CreateForumThreadEarthquakeData?
    let tags: [String]?
}

struct CreateForumThreadEarthquakeData: Codable {
    let magnitude: Double
    let place: String
    let time: Date
    let depth: Double?
}

struct CreateForumThreadResponse: Codable {
    let thread: ForumThread
}

struct CreateForumPostRequest: Codable {
    let threadId: String
    let parentPostId: String?
    let author: String
    let authorLocation: String?
    let content: String
    let feltIt: Bool?
    let intensity: Int?
}

struct CreateForumPostResponse: Codable {
    let post: ForumPost
}

