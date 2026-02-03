//
//  CommunityDiscussionViewModel.swift
//  BayTremor
//
//  Lightweight "chat-style" discussion per earthquake using /api/comments
//

import Foundation
import Observation

@MainActor
@Observable
final class CommunityDiscussionViewModel {
    let earthquakeId: String
    
    var comments: [Comment] = []
    var isLoading = false
    var isRefreshing = false
    var isSubmitting = false
    var errorMessage: String?
    var isRealtimeEnabled = false
    
    private var autoRefreshTask: Task<Void, Never>?
    private let autoRefreshIntervalNs: UInt64 = 10_000_000_000 // 10s
    private var pusherSubscriptionToken: UUID?
    
    init(earthquakeId: String) {
        self.earthquakeId = earthquakeId
    }
    
    func load() async {
        guard !isLoading else { return }
        isLoading = true
        errorMessage = nil
        
        do {
            comments = try await APIClient.shared.fetchComments(earthquakeId: earthquakeId)
        } catch {
            errorMessage = error.localizedDescription
        }
        
        isLoading = false
    }
    
    func refresh() async {
        guard !isRefreshing else { return }
        isRefreshing = true
        errorMessage = nil
        
        do {
            comments = try await APIClient.shared.fetchComments(earthquakeId: earthquakeId)
        } catch {
            errorMessage = error.localizedDescription
        }
        
        try? await Task.sleep(nanoseconds: 250_000_000)
        isRefreshing = false
    }
    
    func startAutoRefresh() {
        guard autoRefreshTask == nil else { return }
        
        autoRefreshTask = Task { [weak self] in
            while let self, !Task.isCancelled {
                try? await Task.sleep(nanoseconds: autoRefreshIntervalNs)
                if Task.isCancelled { break }
                await self.refresh()
            }
        }
    }
    
    func stopAutoRefresh() {
        autoRefreshTask?.cancel()
        autoRefreshTask = nil
    }
    
    func startRealtime() {
        // Avoid double-subscribe
        guard pusherSubscriptionToken == nil else { return }
        let channel = "earthquake-\(earthquakeId)"
        
        pusherSubscriptionToken = PusherRealtimeClient.shared.subscribe(
            channel: channel,
            event: "new-comment",
            handler: { [weak self] payload in
                guard let self else { return }
                Task { @MainActor in
                    self.handleRealtimePayload(payload)
                }
            }
        )
        
        isRealtimeEnabled = pusherSubscriptionToken != nil
    }
    
    func stopRealtime() {
        let channel = "earthquake-\(earthquakeId)"
        if let token = pusherSubscriptionToken {
            PusherRealtimeClient.shared.unsubscribe(channel: channel, token: token)
        }
        pusherSubscriptionToken = nil
        isRealtimeEnabled = false
    }
    
    private func handleRealtimePayload(_ payload: Any) {
        // payload is either a JSON string or an object
        let commentData: Data?
        if let string = payload as? String {
            commentData = string.data(using: .utf8)
        } else if JSONSerialization.isValidJSONObject(payload),
                  let data = try? JSONSerialization.data(withJSONObject: payload) {
            commentData = data
        } else {
            commentData = nil
        }
        
        guard let commentData else { return }
        
        if let decoded = try? APIClient.commentsDecoder().decode(Comment.self, from: commentData) {
            if !comments.contains(where: { $0.id == decoded.id }) {
                comments.insert(decoded, at: 0)
            }
        }
    }
    
    func submit(author: String, content: String, location: String?, feltIt: Bool) async -> Bool {
        guard !isSubmitting else { return false }
        
        let trimmedAuthor = author.trimmingCharacters(in: .whitespacesAndNewlines)
        let trimmedContent = content.trimmingCharacters(in: .whitespacesAndNewlines)
        let trimmedLocation = location?.trimmingCharacters(in: .whitespacesAndNewlines)
        
        guard !trimmedAuthor.isEmpty, !trimmedContent.isEmpty else {
            errorMessage = "Name and message are required."
            return false
        }
        
        guard trimmedAuthor.count <= 50 else {
            errorMessage = "Name is too long (max 50 characters)."
            return false
        }
        
        guard trimmedContent.count <= 1000 else {
            errorMessage = "Message is too long (max 1000 characters)."
            return false
        }
        
        if let trimmedLocation, trimmedLocation.count > 50 {
            errorMessage = "Location is too long (max 50 characters)."
            return false
        }
        
        isSubmitting = true
        errorMessage = nil
        
        do {
            let created = try await APIClient.shared.postComment(
                CreateCommentRequest(
                    earthquakeId: earthquakeId,
                    parentId: nil,
                    author: trimmedAuthor,
                    content: trimmedContent,
                    location: (trimmedLocation?.isEmpty == true) ? nil : trimmedLocation,
                    feltIt: feltIt
                )
            )
            
            if !comments.contains(where: { $0.id == created.id }) {
                comments.insert(created, at: 0)
            }
            
            // If realtime is disabled/misconfigured, the periodic refresh will still pull new messages.
            
            isSubmitting = false
            return true
        } catch {
            errorMessage = error.localizedDescription
            isSubmitting = false
            return false
        }
    }
}

