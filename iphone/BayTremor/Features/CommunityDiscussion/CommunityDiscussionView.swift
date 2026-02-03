//
//  CommunityDiscussionView.swift
//  BayTremor
//
//  Simple per-earthquake discussion thread
//

import SwiftUI

struct CommunityDiscussionSheet: View {
    let earthquake: Earthquake
    
    @Environment(\.dismiss) private var dismiss
    @State private var viewModel: CommunityDiscussionViewModel
    
    @AppStorage("communityDisplayName") private var savedAuthor = ""
    @AppStorage("communityLocation") private var savedLocation = ""
    
    @State private var author = ""
    @State private var location = ""
    @State private var content = ""
    @State private var feltIt = false
    
    init(earthquake: Earthquake) {
        self.earthquake = earthquake
        _viewModel = State(initialValue: CommunityDiscussionViewModel(earthquakeId: earthquake.id))
    }
    
    var body: some View {
        NavigationStack {
            ZStack {
                LinearGradient(
                    colors: [
                        Color(red: 0.04, green: 0.04, blue: 0.12),
                        Color.black
                    ],
                    startPoint: .top,
                    endPoint: .bottom
                )
                .ignoresSafeArea()
                
                ScrollView(showsIndicators: false) {
                    VStack(alignment: .leading, spacing: 16) {
                        header
                        composer
                        commentsSection
                    }
                    .padding(20)
                    .padding(.bottom, 40)
                }
            }
            .navigationTitle("Discussion")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button {
                        Task { await viewModel.refresh() }
                    } label: {
                        Image(systemName: viewModel.isRefreshing ? "arrow.triangle.2.circlepath" : "arrow.clockwise")
                    }
                    .disabled(viewModel.isRefreshing)
                }
                
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        dismiss()
                    } label: {
                        Image(systemName: "xmark.circle.fill")
                            .foregroundStyle(.white.opacity(0.5))
                    }
                }
            }
        }
        .presentationDetents([.medium, .large])
        .presentationDragIndicator(.visible)
        .presentationBackground(.clear)
        .task {
            author = savedAuthor
            location = savedLocation
            await viewModel.load()
            viewModel.startRealtime()
            viewModel.startAutoRefresh() // fallback safety net
        }
        .onDisappear {
            viewModel.stopRealtime()
            viewModel.stopAutoRefresh()
        }
        .onChange(of: author) { _, newValue in
            savedAuthor = newValue
        }
        .onChange(of: location) { _, newValue in
            savedLocation = newValue
        }
    }
    
    private var header: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(alignment: .firstTextBaseline, spacing: 10) {
                Text(String(format: "M %.1f", earthquake.magnitude))
                    .font(.system(size: 20, weight: .black, design: .rounded))
                    .foregroundStyle(earthquake.magnitudeColor)
                
                Text(earthquake.relativeTimeString)
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(.white.opacity(0.5))
                
                Spacer()
                
                Text("\(viewModel.comments.count)")
                    .font(.system(size: 12, weight: .bold, design: .rounded))
                    .foregroundStyle(.white.opacity(0.7))
                    .padding(.horizontal, 10)
                    .padding(.vertical, 6)
                    .background(
                        Capsule()
                            .fill(.ultraThinMaterial)
                            .overlay(
                                Capsule()
                                    .stroke(Color.white.opacity(0.1), lineWidth: 1)
                            )
                    )
            }
            
            Text(earthquake.place)
                .font(.system(size: 16, weight: .semibold))
                .foregroundStyle(.white)
                .lineLimit(2)
            
            Text("Auto-updates every ~10 seconds while open.")
                .font(.system(size: 11, weight: .medium))
                .foregroundStyle(.white.opacity(0.4))
            
            if PusherRealtimeClient.shared.isConfigured() {
                Text(viewModel.isRealtimeEnabled ? "Realtime: ON" : "Realtime: connecting…")
                    .font(.system(size: 11, weight: .bold))
                    .foregroundStyle(viewModel.isRealtimeEnabled ? .green : .yellow)
            } else {
                Text("Realtime: OFF (Pusher not configured)")
                    .font(.system(size: 11, weight: .bold))
                    .foregroundStyle(.white.opacity(0.35))
            }
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 20)
                .fill(.ultraThinMaterial)
                .overlay(
                    RoundedRectangle(cornerRadius: 20)
                        .stroke(Color.white.opacity(0.1), lineWidth: 1)
                )
        )
    }
    
    private var composer: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 10) {
                Image(systemName: "message.fill")
                    .foregroundStyle(.cyan)
                Text("Post an update")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(.white.opacity(0.85))
                Spacer()
            }
            
            HStack(spacing: 10) {
                TextField("Your name", text: $author)
                    .textInputAutocapitalization(.words)
                    .textContentType(.name)
                    .submitLabel(.done)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 10)
                    .background(Color.white.opacity(0.06))
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                
                TextField("Location (optional)", text: $location)
                    .textInputAutocapitalization(.words)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 10)
                    .background(Color.white.opacity(0.06))
                    .clipShape(RoundedRectangle(cornerRadius: 12))
            }
            .font(.system(size: 13, weight: .medium))
            .foregroundStyle(.white)
            
            TextEditor(text: $content)
                .font(.system(size: 13, weight: .medium))
                .foregroundStyle(.white)
                .scrollContentBackground(.hidden)
                .frame(minHeight: 90)
                .padding(12)
                .background(Color.white.opacity(0.06))
                .clipShape(RoundedRectangle(cornerRadius: 12))
                .overlay(
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(Color.white.opacity(0.08), lineWidth: 1)
                )
            
            HStack(spacing: 12) {
                Toggle(isOn: $feltIt) {
                    Text("I felt it")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundStyle(.white.opacity(0.75))
                }
                .toggleStyle(.switch)
                .tint(.orange)
                
                Spacer()
                
                Button {
                    Task {
                        let didPost = await viewModel.submit(
                            author: author,
                            content: content,
                            location: location.isEmpty ? nil : location,
                            feltIt: feltIt
                        )
                        if didPost {
                            content = ""
                            feltIt = false
                        }
                    }
                } label: {
                    HStack(spacing: 8) {
                        if viewModel.isSubmitting {
                            ProgressView()
                                .tint(.white)
                                .scaleEffect(0.9)
                        } else {
                            Image(systemName: "paperplane.fill")
                                .font(.system(size: 12, weight: .bold))
                        }
                        Text(viewModel.isSubmitting ? "Posting..." : "Post")
                            .font(.system(size: 13, weight: .bold))
                    }
                    .foregroundStyle(.white)
                    .padding(.horizontal, 14)
                    .padding(.vertical, 10)
                    .background(
                        RoundedRectangle(cornerRadius: 12)
                            .fill(
                                LinearGradient(colors: [.cyan, .blue], startPoint: .leading, endPoint: .trailing)
                            )
                    )
                }
                .disabled(viewModel.isSubmitting || author.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || content.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
            }
            
            if let error = viewModel.errorMessage {
                Text(error)
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(.red.opacity(0.9))
            }
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 20)
                .fill(.ultraThinMaterial)
                .overlay(
                    RoundedRectangle(cornerRadius: 20)
                        .stroke(Color.white.opacity(0.1), lineWidth: 1)
                )
        )
    }
    
    private var commentsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Latest")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(.white.opacity(0.85))
                
                Spacer()
                
                if viewModel.isLoading {
                    ProgressView()
                        .tint(.white.opacity(0.8))
                        .scaleEffect(0.9)
                }
            }
            
            if !viewModel.isLoading, viewModel.comments.isEmpty {
                Text("No messages yet. Be the first to share what you felt.")
                    .font(.system(size: 13, weight: .medium))
                    .foregroundStyle(.white.opacity(0.55))
                    .padding(.vertical, 10)
            } else {
                LazyVStack(spacing: 10) {
                    ForEach(viewModel.comments) { comment in
                        CommentCard(comment: comment)
                    }
                }
            }
        }
    }
}

private struct CommentCard: View {
    let comment: Comment
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(alignment: .firstTextBaseline) {
                Text(comment.author)
                    .font(.system(size: 13, weight: .bold))
                    .foregroundStyle(.white)
                
                if let location = comment.location, !location.isEmpty {
                    Text("• \(location)")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundStyle(.white.opacity(0.5))
                }
                
                Spacer()
                
                Text(Self.relativeTimeString(from: comment.createdAt))
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundStyle(.white.opacity(0.45))
            }
            
            Text(comment.content)
                .font(.system(size: 13, weight: .medium))
                .foregroundStyle(.white.opacity(0.85))
                .fixedSize(horizontal: false, vertical: true)
            
            if comment.feltIt == true {
                HStack(spacing: 6) {
                    Image(systemName: "hand.raised.fill")
                        .font(.system(size: 10, weight: .bold))
                    Text("Felt it")
                        .font(.system(size: 11, weight: .bold))
                }
                .foregroundStyle(.orange)
                .padding(.horizontal, 10)
                .padding(.vertical, 6)
                .background(Color.orange.opacity(0.15))
                .clipShape(Capsule())
            }
        }
        .padding(14)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color.white.opacity(0.04))
                .overlay(
                    RoundedRectangle(cornerRadius: 16)
                        .stroke(Color.white.opacity(0.07), lineWidth: 1)
                )
        )
    }
    
    private static func relativeTimeString(from date: Date) -> String {
        let formatter = RelativeDateTimeFormatter()
        formatter.unitsStyle = .abbreviated
        return formatter.localizedString(for: date, relativeTo: Date())
    }
}

