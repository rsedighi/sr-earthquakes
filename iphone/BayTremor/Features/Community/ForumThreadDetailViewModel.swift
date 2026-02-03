//
//  ForumThreadDetailViewModel.swift
//  BayTremor
//
//  Thread detail (posts) + realtime updates via Pusher
//

import Foundation
import Observation

@MainActor
@Observable
final class ForumThreadDetailViewModel {
    let threadId: String
    
    var thread: ForumThread?
    var posts: [ForumPost] = []
    var isLoading = false
    var isSubmitting = false
    var errorMessage: String?
    var isRealtimeEnabled = false
    
    private var pusherToken: UUID?
    
    init(threadId: String) {
        self.threadId = threadId
    }
    
    func load() async {
        guard !isLoading else { return }
        isLoading = true
        errorMessage = nil
        
        do {
            let detail = try await APIClient.shared.fetchForumThreadDetail(identifier: threadId, postsLimit: 100, postsSkip: 0)
            thread = detail.thread
            posts = detail.posts
        } catch {
            errorMessage = error.localizedDescription
        }
        
        isLoading = false
    }
    
    func startRealtime() {
        guard pusherToken == nil else { return }
        
        let channel = "forum-thread-\(threadId)"
        pusherToken = PusherRealtimeClient.shared.subscribe(
            channel: channel,
            event: "new-comment",
            handler: { [weak self] payload in
                guard let self else { return }
                Task { @MainActor in
                    self.handleRealtime(payload)
                }
            }
        )
        
        isRealtimeEnabled = pusherToken != nil
    }
    
    func stopRealtime() {
        let channel = "forum-thread-\(threadId)"
        if let token = pusherToken {
            PusherRealtimeClient.shared.unsubscribe(channel: channel, token: token)
        }
        pusherToken = nil
        isRealtimeEnabled = false
    }
    
    private func handleRealtime(_ payload: Any) {
        let data: Data?
        if let s = payload as? String {
            data = s.data(using: .utf8)
        } else if JSONSerialization.isValidJSONObject(payload),
                  let d = try? JSONSerialization.data(withJSONObject: payload) {
            data = d
        } else {
            data = nil
        }
        
        guard let data else { return }
        guard let post = try? APIClient.commentsDecoder().decode(ForumPost.self, from: data) else { return }
        
        if !posts.contains(where: { $0.id == post.id }) {
            posts.append(post)
            posts.sort { $0.createdAt < $1.createdAt }
        }
    }
    
    func submitReply(author: String, authorLocation: String?, content: String, feltIt: Bool?, intensity: Int?) async -> Bool {
        guard !isSubmitting else { return false }
        
        let a = author.trimmingCharacters(in: .whitespacesAndNewlines)
        let c = content.trimmingCharacters(in: .whitespacesAndNewlines)
        let loc = authorLocation?.trimmingCharacters(in: .whitespacesAndNewlines)
        
        guard !a.isEmpty, !c.isEmpty else {
            errorMessage = "Name and reply are required."
            return false
        }
        
        isSubmitting = true
        errorMessage = nil
        
        do {
            let created = try await APIClient.shared.createForumPost(
                CreateForumPostRequest(
                    threadId: threadId,
                    parentPostId: nil,
                    author: a,
                    authorLocation: loc?.isEmpty == true ? nil : loc,
                    content: c,
                    feltIt: feltIt,
                    intensity: intensity
                )
            )
            
            if !posts.contains(where: { $0.id == created.id }) {
                posts.append(created)
                posts.sort { $0.createdAt < $1.createdAt }
            }
            
            isSubmitting = false
            return true
        } catch {
            errorMessage = error.localizedDescription
            isSubmitting = false
            return false
        }
    }
}

