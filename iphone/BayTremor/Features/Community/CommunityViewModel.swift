//
//  CommunityViewModel.swift
//  BayTremor
//
//  Standalone entrypoint to per-earthquake discussions
//

import Foundation
import Observation

@MainActor
@Observable
final class CommunityViewModel {
    var threads: [ForumThread] = []
    var stats: ForumStatsResponse.Stats?
    var sort: ForumSort = .hot
    var isLoading = false
    var isRefreshing = false
    var errorMessage: String?
    
    func load() async {
        guard !isLoading else { return }
        isLoading = true
        errorMessage = nil
        
        do {
            async let threadsResponse = APIClient.shared.fetchForumThreads(sort: sort, limit: 25, skip: 0)
            async let statsResponse = APIClient.shared.fetchForumStats()
            
            let (threadsResult, statsResult) = try await (threadsResponse, statsResponse)
            threads = threadsResult.threads
            stats = statsResult
        } catch {
            errorMessage = error.localizedDescription
        }
        
        isLoading = false
    }
    
    func refresh() async {
        guard !isRefreshing else { return }
        isRefreshing = true
        await load()
        try? await Task.sleep(nanoseconds: 250_000_000)
        isRefreshing = false
    }
}

