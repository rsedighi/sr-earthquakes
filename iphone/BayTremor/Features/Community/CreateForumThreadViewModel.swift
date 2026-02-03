//
//  CreateForumThreadViewModel.swift
//  BayTremor
//

import Foundation
import Observation

@MainActor
@Observable
final class CreateForumThreadViewModel {
    var isSubmitting = false
    var errorMessage: String?
    
    func submit(_ request: CreateForumThreadRequest) async -> ForumThread? {
        guard !isSubmitting else { return nil }
        isSubmitting = true
        errorMessage = nil
        
        do {
            let created = try await APIClient.shared.createForumThread(request)
            isSubmitting = false
            return created
        } catch {
            errorMessage = error.localizedDescription
            isSubmitting = false
            return nil
        }
    }
}

