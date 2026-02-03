//
//  ForumThreadDetailView.swift
//  BayTremor
//
//  Thread detail + replies — Reddit-style 10X sexy version
//

import SwiftUI

struct ForumThreadDetailSheet: View {
    let thread: ForumThread
    
    @Environment(\.dismiss) private var dismiss
    @State private var viewModel: ForumThreadDetailViewModel
    
    @AppStorage("communityDisplayName") private var savedAuthor = ""
    @AppStorage("communityLocation") private var savedLocation = ""
    
    @State private var author = ""
    @State private var authorLocation = ""
    @State private var reply = ""
    @State private var feltIt = false
    @State private var intensity = 3
    @State private var showReplyForm = false
    
    // Vote state for the thread
    @State private var threadVotes: Int
    @State private var threadUserVote: VoteDirection? = nil
    
    // New comment notification
    @State private var showNewCommentBanner = false
    @State private var newCommentAuthor: String? = nil
    @State private var previousCommentCount = 0
    
    enum VoteDirection {
        case up, down
    }
    
    init(thread: ForumThread) {
        self.thread = thread
        _viewModel = State(initialValue: ForumThreadDetailViewModel(threadId: thread.id))
        _threadVotes = State(initialValue: thread.viewCount)
    }
    
    // Filter out OP post from comments
    private var commentPosts: [ForumPost] {
        viewModel.posts.filter { !$0.isOriginalPost }
    }
    
    var body: some View {
        NavigationStack {
            ZStack {
                // Rich gradient background
                LinearGradient(
                    colors: [
                        Color(red: 0.06, green: 0.06, blue: 0.14),
                        Color(red: 0.02, green: 0.02, blue: 0.08),
                        Color.black
                    ],
                    startPoint: .top,
                    endPoint: .bottom
                )
                .ignoresSafeArea()
                
                ScrollViewReader { proxy in
                    ScrollView(showsIndicators: false) {
                        VStack(alignment: .leading, spacing: 0) {
                            // Breadcrumb
                            breadcrumbHeader
                            
                            // Main post card
                            mainPostCard
                                .padding(.horizontal, 16)
                                .padding(.top, 12)
                            
                            // Reply prompt or form
                            replySection
                                .padding(.horizontal, 16)
                                .padding(.top, 12)
                            
                            // Comments section
                            commentsSection
                                .padding(.horizontal, 16)
                                .padding(.top, 16)
                        }
                        .padding(.bottom, 60)
                    }
                    .onChange(of: commentPosts.count) { oldCount, newCount in
                        // Show new comment notification if count increased and we had previous data
                        if newCount > oldCount && previousCommentCount > 0 {
                            if let lastPost = commentPosts.last {
                                newCommentAuthor = lastPost.author
                                withAnimation(.spring(response: 0.4, dampingFraction: 0.8)) {
                                    showNewCommentBanner = true
                                }
                                // Auto-hide after 4 seconds
                                DispatchQueue.main.asyncAfter(deadline: .now() + 4) {
                                    withAnimation(.easeOut(duration: 0.3)) {
                                        showNewCommentBanner = false
                                    }
                                }
                            }
                        }
                        previousCommentCount = newCount
                        
                        // Scroll to new comment
                        if let last = commentPosts.last?.id {
                            withAnimation(.easeOut(duration: 0.25)) {
                                proxy.scrollTo(last, anchor: .bottom)
                            }
                        }
                    }
                }
                
                // New comment notification banner
                if showNewCommentBanner {
                    VStack {
                        HStack(spacing: 10) {
                            Image(systemName: "bubble.left.fill")
                                .font(.system(size: 14, weight: .bold))
                                .foregroundStyle(.white)
                            
                            VStack(alignment: .leading, spacing: 2) {
                                Text("New comment")
                                    .font(.system(size: 13, weight: .bold))
                                    .foregroundStyle(.white)
                                if let author = newCommentAuthor {
                                    Text("\(author) just replied")
                                        .font(.system(size: 11, weight: .medium))
                                        .foregroundStyle(.white.opacity(0.7))
                                }
                            }
                            
                            Spacer()
                            
                            Button {
                                withAnimation(.easeOut(duration: 0.2)) {
                                    showNewCommentBanner = false
                                }
                            } label: {
                                Image(systemName: "xmark")
                                    .font(.system(size: 12, weight: .bold))
                                    .foregroundStyle(.white.opacity(0.6))
                            }
                        }
                        .padding(.horizontal, 16)
                        .padding(.vertical, 12)
                        .background(
                            RoundedRectangle(cornerRadius: 12)
                                .fill(
                                    LinearGradient(
                                        colors: [Color.orange, Color.orange.opacity(0.85)],
                                        startPoint: .leading,
                                        endPoint: .trailing
                                    )
                                )
                                .shadow(color: .orange.opacity(0.4), radius: 8, y: 4)
                        )
                        .padding(.horizontal, 16)
                        
                        Spacer()
                    }
                    .padding(.top, 60)
                    .transition(.move(edge: .top).combined(with: .opacity))
                }
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .principal) {
                    HStack(spacing: 6) {
                        Image(systemName: "waveform.path.ecg")
                            .font(.system(size: 14, weight: .bold))
                            .foregroundStyle(.orange)
                        Text("r/baytremor")
                            .font(.system(size: 15, weight: .bold))
                            .foregroundStyle(.white)
                    }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        dismiss()
                    } label: {
                        Image(systemName: "xmark.circle.fill")
                            .font(.system(size: 24))
                            .foregroundStyle(.white.opacity(0.3))
                    }
                }
            }
        }
        .presentationDetents([.large])
        .presentationDragIndicator(.visible)
        .presentationBackground(.clear)
        .task {
            author = savedAuthor
            authorLocation = savedLocation
            await viewModel.load()
            previousCommentCount = commentPosts.count
            viewModel.startRealtime()
        }
        .onDisappear {
            viewModel.stopRealtime()
        }
        .onChange(of: author) { _, newValue in savedAuthor = newValue }
        .onChange(of: authorLocation) { _, newValue in savedLocation = newValue }
    }
    
    // MARK: - Breadcrumb Header
    
    private var breadcrumbHeader: some View {
        HStack(spacing: 8) {
            Image(systemName: "waveform.path.ecg")
                .font(.system(size: 12, weight: .bold))
                .foregroundStyle(.orange)
            
            Text("r/baytremor")
                .font(.system(size: 12, weight: .bold))
                .foregroundStyle(.orange)
            
            Text("/")
                .foregroundStyle(.white.opacity(0.25))
            
            Text(thread.category.rawValue)
                .font(.system(size: 12, weight: .medium))
                .foregroundStyle(.white.opacity(0.5))
            
            Spacer()
            
            // Live indicator
            if PusherRealtimeClient.shared.isConfigured() && viewModel.isRealtimeEnabled {
                HStack(spacing: 5) {
                    Circle()
                        .fill(.green)
                        .frame(width: 6, height: 6)
                        .overlay(
                            Circle()
                                .stroke(.green.opacity(0.5), lineWidth: 2)
                                .scaleEffect(1.5)
                                .opacity(0.5)
                        )
                    Text("Live updates")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundStyle(.green)
                }
                .padding(.horizontal, 10)
                .padding(.vertical, 5)
                .background(
                    Capsule()
                        .fill(Color.green.opacity(0.12))
                        .overlay(
                            Capsule()
                                .stroke(.green.opacity(0.3), lineWidth: 1)
                        )
                )
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background(Color.white.opacity(0.03))
    }
    
    // MARK: - Main Post Card
    
    private var mainPostCard: some View {
        VStack(spacing: 0) {
            HStack(alignment: .top, spacing: 0) {
                // Vote column - PROMINENT
                voteColumn
                
                // Content
                VStack(alignment: .leading, spacing: 12) {
                    postMeta
                    postTitle
                    earthquakeBanner
                    postContent
                    actionBar
                }
                .padding(16)
            }
        }
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color.white.opacity(0.04))
                .overlay(
                    RoundedRectangle(cornerRadius: 16)
                        .stroke(Color.white.opacity(0.08), lineWidth: 1)
                )
        )
    }
    
    private var voteColumn: some View {
        VStack(spacing: 6) {
            Button {
                withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                    handleThreadVote(.up)
                }
            } label: {
                Image(systemName: threadUserVote == .up ? "arrow.up.circle.fill" : "arrow.up.circle")
                    .font(.system(size: 28, weight: .medium))
                    .foregroundStyle(threadUserVote == .up ? .orange : .white.opacity(0.4))
                    .scaleEffect(threadUserVote == .up ? 1.1 : 1.0)
            }
            .buttonStyle(.plain)
            
            Text("\(threadVotes)")
                .font(.system(size: 14, weight: .black, design: .rounded))
                .foregroundStyle(threadVoteColor)
            
            Button {
                withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                    handleThreadVote(.down)
                }
            } label: {
                Image(systemName: threadUserVote == .down ? "arrow.down.circle.fill" : "arrow.down.circle")
                    .font(.system(size: 28, weight: .medium))
                    .foregroundStyle(threadUserVote == .down ? .blue : .white.opacity(0.4))
                    .scaleEffect(threadUserVote == .down ? 1.1 : 1.0)
            }
            .buttonStyle(.plain)
        }
        .frame(width: 56)
        .padding(.vertical, 16)
        .background(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .fill(Color.white.opacity(0.02))
        )
    }
    
    private var postMeta: some View {
        HStack(spacing: 8) {
            // Category flair
            Text(thread.category.flair)
                .font(.system(size: 11, weight: .bold))
                .foregroundStyle(thread.category.flairColor)
                .padding(.horizontal, 10)
                .padding(.vertical, 5)
                .background(thread.category.flairColor.opacity(0.15))
                .clipShape(Capsule())
            
            // Author with avatar
            HStack(spacing: 6) {
                Circle()
                    .fill(LinearGradient(colors: [.orange.opacity(0.6), .red.opacity(0.4)], startPoint: .topLeading, endPoint: .bottomTrailing))
                    .frame(width: 20, height: 20)
                    .overlay(
                        Text(String(thread.author.prefix(1)).uppercased())
                            .font(.system(size: 10, weight: .bold))
                            .foregroundStyle(.white)
                    )
                
                Text("u/\(thread.author)")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(.white.opacity(0.7))
            }
            
            if let location = thread.authorLocation {
                HStack(spacing: 3) {
                    Image(systemName: "mappin.circle.fill")
                        .font(.system(size: 10))
                    Text(location)
                        .font(.system(size: 11, weight: .medium))
                }
                .foregroundStyle(.white.opacity(0.45))
            }
            
            Spacer()
            
            Text(Self.relativeTimeString(from: thread.createdAt))
                .font(.system(size: 11, weight: .medium))
                .foregroundStyle(.white.opacity(0.4))
        }
    }
    
    private var postTitle: some View {
        Text(thread.title)
            .font(.system(size: 20, weight: .bold))
            .foregroundStyle(.white)
            .fixedSize(horizontal: false, vertical: true)
    }
    
    @ViewBuilder
    private var earthquakeBanner: some View {
        if let eq = thread.earthquakeData {
            let magColor = magnitudeColor(eq.magnitude)
            HStack(spacing: 14) {
                // Big magnitude badge
                ZStack {
                    RoundedRectangle(cornerRadius: 12)
                        .fill(magColor.opacity(0.2))
                        .frame(width: 56, height: 56)
                    
                    VStack(spacing: 2) {
                        Text(String(format: "%.1f", eq.magnitude))
                            .font(.system(size: 22, weight: .black, design: .rounded))
                            .foregroundStyle(magColor)
                        Text("MAG")
                            .font(.system(size: 8, weight: .bold))
                            .foregroundStyle(magColor.opacity(0.7))
                    }
                }
                
                VStack(alignment: .leading, spacing: 4) {
                    Text(eq.place)
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(.white)
                        .lineLimit(2)
                    
                    HStack(spacing: 12) {
                        if let depth = eq.depth {
                            HStack(spacing: 4) {
                                Image(systemName: "arrow.down.to.line")
                                    .font(.system(size: 10))
                                Text("\(Int(depth)) km depth")
                            }
                        }
                        
                        HStack(spacing: 4) {
                            Image(systemName: "clock")
                                .font(.system(size: 10))
                            Text(eq.time, style: .time)
                        }
                    }
                    .font(.system(size: 11, weight: .medium))
                    .foregroundStyle(.white.opacity(0.5))
                }
                
                Spacer()
            }
            .padding(14)
            .background(
                RoundedRectangle(cornerRadius: 14)
                    .fill(magColor.opacity(0.08))
                    .overlay(
                        RoundedRectangle(cornerRadius: 14)
                            .stroke(magColor.opacity(0.2), lineWidth: 1)
                    )
            )
        }
    }
    
    private var postContent: some View {
        Text(thread.content)
            .font(.system(size: 15, weight: .regular))
            .foregroundStyle(.white.opacity(0.85))
            .lineSpacing(4)
            .fixedSize(horizontal: false, vertical: true)
    }
    
    private var actionBar: some View {
        HStack(spacing: 0) {
            actionButton(icon: "bubble.left.fill", label: "\(commentPosts.count)", highlight: true)
            actionButton(icon: "square.and.arrow.up", label: "Share")
            actionButton(icon: "bookmark", label: "Save")
            Spacer()
        }
        .padding(.top, 8)
    }
    
    private func actionButton(icon: String, label: String, highlight: Bool = false) -> some View {
        HStack(spacing: 6) {
            Image(systemName: icon)
                .font(.system(size: 14, weight: .medium))
            Text(label)
                .font(.system(size: 12, weight: .semibold))
        }
        .foregroundStyle(highlight ? .orange : .white.opacity(0.45))
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
        .background(
            Capsule()
                .fill(highlight ? Color.orange.opacity(0.1) : Color.white.opacity(0.03))
        )
        .padding(.trailing, 8)
    }
    
    // MARK: - Reply Section
    
    private var replySection: some View {
        VStack(spacing: 0) {
            if showReplyForm {
                expandedReplyForm
            } else {
                collapsedReplyPrompt
            }
        }
    }
    
    private var collapsedReplyPrompt: some View {
        Button {
            withAnimation(.spring(response: 0.4, dampingFraction: 0.8)) {
                showReplyForm = true
            }
        } label: {
            HStack(spacing: 12) {
                // Avatar placeholder
                Circle()
                    .fill(Color.white.opacity(0.08))
                    .frame(width: 36, height: 36)
                    .overlay(
                        Image(systemName: "person.fill")
                            .font(.system(size: 14))
                            .foregroundStyle(.white.opacity(0.4))
                    )
                
                Text("What are your thoughts?")
                    .font(.system(size: 14, weight: .medium))
                    .foregroundStyle(.white.opacity(0.4))
                
                Spacer()
            }
            .padding(14)
            .background(
                RoundedRectangle(cornerRadius: 14)
                    .fill(Color.white.opacity(0.03))
                    .overlay(
                        RoundedRectangle(cornerRadius: 14)
                            .stroke(Color.white.opacity(0.08), lineWidth: 1)
                    )
            )
        }
        .buttonStyle(.plain)
    }
    
    private var expandedReplyForm: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack {
                Text("Comment as...")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(.white.opacity(0.6))
                Spacer()
                Button {
                    withAnimation(.spring(response: 0.3, dampingFraction: 0.8)) {
                        showReplyForm = false
                    }
                } label: {
                    Image(systemName: "xmark")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundStyle(.white.opacity(0.4))
                        .padding(8)
                        .background(Circle().fill(Color.white.opacity(0.05)))
                }
                .buttonStyle(.plain)
            }
            
            // Name and location row
            HStack(spacing: 10) {
                HStack(spacing: 8) {
                    Image(systemName: "person.fill")
                        .font(.system(size: 12))
                        .foregroundStyle(.white.opacity(0.4))
                    TextField("Your name", text: $author)
                        .textInputAutocapitalization(.words)
                        .textContentType(.name)
                }
                .font(.system(size: 14, weight: .medium))
                .foregroundStyle(.white)
                .padding(12)
                .background(Color.white.opacity(0.05))
                .clipShape(RoundedRectangle(cornerRadius: 10))
                
                HStack(spacing: 8) {
                    Image(systemName: "mappin")
                        .font(.system(size: 12))
                        .foregroundStyle(.white.opacity(0.4))
                    TextField("Location", text: $authorLocation)
                        .textInputAutocapitalization(.words)
                }
                .font(.system(size: 14, weight: .medium))
                .foregroundStyle(.white)
                .padding(12)
                .background(Color.white.opacity(0.05))
                .clipShape(RoundedRectangle(cornerRadius: 10))
            }
            
            // Reply text
            ZStack(alignment: .topLeading) {
                if reply.isEmpty {
                    Text("Share your thoughts...")
                        .font(.system(size: 14, weight: .medium))
                        .foregroundStyle(.white.opacity(0.3))
                        .padding(.horizontal, 14)
                        .padding(.vertical, 14)
                }
                
                TextEditor(text: $reply)
                    .font(.system(size: 14, weight: .medium))
                    .foregroundStyle(.white)
                    .scrollContentBackground(.hidden)
                    .frame(minHeight: 100)
                    .padding(10)
            }
            .background(Color.white.opacity(0.05))
            .clipShape(RoundedRectangle(cornerRadius: 12))
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(Color.white.opacity(0.08), lineWidth: 1)
            )
            
            // Felt it toggle for earthquake threads
            if thread.category == .earthquake {
                feltItSection
            }
            
            // Error and submit
            HStack {
                if let error = viewModel.errorMessage {
                    Text(error)
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundStyle(.red)
                }
                
                Spacer()
                
                Button {
                    Task { await submitReply() }
                } label: {
                    HStack(spacing: 8) {
                        if viewModel.isSubmitting {
                            ProgressView()
                                .tint(.white)
                                .scaleEffect(0.8)
                        } else {
                            Image(systemName: "paperplane.fill")
                                .font(.system(size: 14))
                        }
                        Text(viewModel.isSubmitting ? "Posting..." : "Comment")
                            .font(.system(size: 14, weight: .bold))
                    }
                    .foregroundStyle(.white)
                    .padding(.horizontal, 20)
                    .padding(.vertical, 12)
                    .background(
                        Capsule()
                            .fill(canSubmit ? LinearGradient(colors: [.orange, .red.opacity(0.8)], startPoint: .leading, endPoint: .trailing) : LinearGradient(colors: [.gray.opacity(0.3), .gray.opacity(0.3)], startPoint: .leading, endPoint: .trailing))
                    )
                }
                .buttonStyle(.plain)
                .disabled(!canSubmit)
            }
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color.white.opacity(0.04))
                .overlay(
                    RoundedRectangle(cornerRadius: 16)
                        .stroke(Color.white.opacity(0.1), lineWidth: 1)
                )
        )
    }
    
    private var feltItSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            Toggle(isOn: $feltIt) {
                HStack(spacing: 8) {
                    Image(systemName: "waveform.path.ecg")
                        .font(.system(size: 14))
                        .foregroundStyle(.orange)
                    Text("I felt this earthquake")
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(.white.opacity(0.8))
                }
            }
            .tint(.orange)
            
            if feltIt {
                VStack(alignment: .leading, spacing: 8) {
                    Text("How strong?")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundStyle(.white.opacity(0.5))
                    
                    HStack(spacing: 8) {
                        ForEach(1...5, id: \.self) { level in
                            Button {
                                withAnimation(.spring(response: 0.25, dampingFraction: 0.7)) {
                                    intensity = level
                                }
                            } label: {
                                VStack(spacing: 4) {
                                    Text("\(level)")
                                        .font(.system(size: 16, weight: .bold, design: .rounded))
                                    Text(intensityLabel(level))
                                        .font(.system(size: 8, weight: .bold))
                                }
                                .foregroundStyle(intensity == level ? .white : .white.opacity(0.4))
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 10)
                                .background(
                                    RoundedRectangle(cornerRadius: 10)
                                        .fill(intensity == level ? intensityColor(level).opacity(0.3) : Color.white.opacity(0.03))
                                        .overlay(
                                            RoundedRectangle(cornerRadius: 10)
                                                .stroke(intensity == level ? intensityColor(level) : Color.clear, lineWidth: 2)
                                        )
                                )
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }
                .padding(12)
                .background(
                    RoundedRectangle(cornerRadius: 12)
                        .fill(Color.orange.opacity(0.05))
                )
            }
        }
    }
    
    private var canSubmit: Bool {
        !viewModel.isSubmitting &&
        !author.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty &&
        !reply.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }
    
    private func submitReply() async {
        let didPost = await viewModel.submitReply(
            author: author,
            authorLocation: authorLocation.isEmpty ? nil : authorLocation,
            content: reply,
            feltIt: thread.category == .earthquake ? feltIt : nil,
            intensity: thread.category == .earthquake && feltIt ? intensity : nil
        )
        if didPost {
            withAnimation(.spring(response: 0.3, dampingFraction: 0.8)) {
                reply = ""
                feltIt = false
                intensity = 3
                showReplyForm = false
            }
        }
    }
    
    // MARK: - Comments Section
    
    private var commentsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Header
            HStack {
                HStack(spacing: 8) {
                    Image(systemName: "bubble.left.and.bubble.right.fill")
                        .font(.system(size: 14))
                        .foregroundStyle(.orange)
                    Text("Comments")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundStyle(.white)
                    
                    Text("(\(commentPosts.count))")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(.white.opacity(0.5))
                }
                
                Spacer()
                
                if viewModel.isLoading {
                    ProgressView()
                        .tint(.orange)
                        .scaleEffect(0.8)
                }
            }
            
            if commentPosts.isEmpty && !viewModel.isLoading {
                emptyCommentsState
            } else {
                LazyVStack(spacing: 12) {
                    ForEach(commentPosts) { post in
                        CommentCard(post: post, threadAuthor: thread.author)
                            .id(post.id)
                    }
                }
            }
        }
    }
    
    private var emptyCommentsState: some View {
        VStack(spacing: 16) {
            Image(systemName: "bubble.left.and.bubble.right")
                .font(.system(size: 44))
                .foregroundStyle(.white.opacity(0.15))
            
            Text("No comments yet")
                .font(.system(size: 16, weight: .bold))
                .foregroundStyle(.white.opacity(0.6))
            
            Text("Be the first to share your thoughts!")
                .font(.system(size: 13, weight: .medium))
                .foregroundStyle(.white.opacity(0.35))
            
            Button {
                withAnimation(.spring(response: 0.4, dampingFraction: 0.8)) {
                    showReplyForm = true
                }
            } label: {
                Text("Add a comment")
                    .font(.system(size: 13, weight: .bold))
                    .foregroundStyle(.orange)
                    .padding(.horizontal, 20)
                    .padding(.vertical, 10)
                    .background(
                        Capsule()
                            .stroke(Color.orange.opacity(0.5), lineWidth: 1.5)
                    )
            }
            .buttonStyle(.plain)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 40)
    }
    
    // MARK: - Helpers
    
    private var threadVoteColor: Color {
        switch threadUserVote {
        case .up: return .orange
        case .down: return .blue
        case nil: return .white.opacity(0.7)
        }
    }
    
    private func handleThreadVote(_ direction: VoteDirection) {
        if threadUserVote == direction {
            threadVotes += direction == .up ? -1 : 1
            threadUserVote = nil
        } else {
            let change = threadUserVote != nil ? 2 : 1
            threadVotes += direction == .up ? change : -change
            threadUserVote = direction
        }
    }
    
    private func magnitudeColor(_ mag: Double) -> Color {
        switch mag {
        case ..<2.0: return .green
        case 2.0..<3.0: return .yellow
        case 3.0..<4.0: return .orange
        case 4.0..<5.0: return .red
        default: return .purple
        }
    }
    
    private func intensityColor(_ level: Int) -> Color {
        switch level {
        case 1: return .green
        case 2: return Color(red: 0.6, green: 0.8, blue: 0.2)
        case 3: return .yellow
        case 4: return .orange
        case 5: return .red
        default: return .gray
        }
    }
    
    private func intensityLabel(_ level: Int) -> String {
        switch level {
        case 1: return "WEAK"
        case 2: return "LIGHT"
        case 3: return "MOD"
        case 4: return "STRONG"
        case 5: return "SEVERE"
        default: return ""
        }
    }
    
    private static func relativeTimeString(from date: Date) -> String {
        let formatter = RelativeDateTimeFormatter()
        formatter.unitsStyle = .abbreviated
        return formatter.localizedString(for: date, relativeTo: Date())
    }
}

// MARK: - Comment Card

private struct CommentCard: View {
    let post: ForumPost
    let threadAuthor: String
    
    @State private var votes: Int = 0
    @State private var userVote: VoteDirection? = nil
    
    enum VoteDirection {
        case up, down
    }
    
    private var isOP: Bool {
        post.author.lowercased() == threadAuthor.lowercased()
    }
    
    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            avatarView
            contentColumn
        }
        .padding(14)
        .background(cardBackground)
    }
    
    // MARK: - Sub-views
    
    private var avatarView: some View {
        Circle()
            .fill(avatarGradient)
            .frame(width: 36, height: 36)
            .overlay(
                Text(String(post.author.prefix(1)).uppercased())
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(isOP ? .white : .white.opacity(0.6))
            )
    }
    
    private var avatarGradient: LinearGradient {
        if isOP {
            return LinearGradient(colors: [.orange, .red.opacity(0.7)], startPoint: .topLeading, endPoint: .bottomTrailing)
        } else {
            return LinearGradient(colors: [.white.opacity(0.1), .white.opacity(0.05)], startPoint: .topLeading, endPoint: .bottomTrailing)
        }
    }
    
    private var contentColumn: some View {
        VStack(alignment: .leading, spacing: 8) {
            metaRow
            feltItBadge
            contentText
            actionsRow
        }
    }
    
    private var metaRow: some View {
        HStack(spacing: 8) {
            Text("u/\(post.author)")
                .font(.system(size: 13, weight: .bold))
                .foregroundStyle(.white)
            
            if isOP {
                opBadge
            }
            
            locationBadge
            
            Spacer()
            
            Text(Self.relativeTimeString(from: post.createdAt))
                .font(.system(size: 11, weight: .medium))
                .foregroundStyle(.white.opacity(0.35))
        }
    }
    
    private var opBadge: some View {
        Text("OP")
            .font(.system(size: 9, weight: .black))
            .foregroundStyle(.orange)
            .padding(.horizontal, 6)
            .padding(.vertical, 3)
            .background(Color.orange.opacity(0.2))
            .clipShape(Capsule())
    }
    
    @ViewBuilder
    private var locationBadge: some View {
        if let location = post.authorLocation, !location.isEmpty {
            HStack(spacing: 3) {
                Image(systemName: "mappin.circle.fill")
                    .font(.system(size: 10))
                Text(location)
            }
            .font(.system(size: 11, weight: .medium))
            .foregroundStyle(.white.opacity(0.4))
        }
    }
    
    @ViewBuilder
    private var feltItBadge: some View {
        if post.feltIt == true {
            HStack(spacing: 4) {
                Image(systemName: "waveform.path.ecg")
                    .font(.system(size: 10))
                Text("Felt it")
                if let intensity = post.intensity {
                    Text("(\(intensity)/5)")
                }
            }
            .font(.system(size: 11, weight: .bold))
            .foregroundStyle(Color.amber)
            .padding(.horizontal, 10)
            .padding(.vertical, 5)
            .background(Color.amber.opacity(0.15))
            .clipShape(Capsule())
        }
    }
    
    private var contentText: some View {
        Text(post.content)
            .font(.system(size: 14, weight: .regular))
            .foregroundStyle(.white.opacity(0.85))
            .lineSpacing(3)
            .fixedSize(horizontal: false, vertical: true)
    }
    
    private var actionsRow: some View {
        HStack(spacing: 16) {
            voteButtons
            replyButton
            shareButton
            Spacer()
        }
    }
    
    private var voteButtons: some View {
        HStack(spacing: 4) {
            Button {
                withAnimation(.spring(response: 0.25, dampingFraction: 0.7)) {
                    handleVote(.up)
                }
            } label: {
                Image(systemName: userVote == .up ? "arrow.up.circle.fill" : "arrow.up.circle")
                    .font(.system(size: 18))
                    .foregroundStyle(userVote == .up ? .orange : .white.opacity(0.35))
            }
            .buttonStyle(.plain)
            
            Text("\(votes)")
                .font(.system(size: 12, weight: .bold, design: .rounded))
                .foregroundStyle(voteColor)
                .frame(minWidth: 20)
            
            Button {
                withAnimation(.spring(response: 0.25, dampingFraction: 0.7)) {
                    handleVote(.down)
                }
            } label: {
                Image(systemName: userVote == .down ? "arrow.down.circle.fill" : "arrow.down.circle")
                    .font(.system(size: 18))
                    .foregroundStyle(userVote == .down ? .blue : .white.opacity(0.35))
            }
            .buttonStyle(.plain)
        }
    }
    
    private var replyButton: some View {
        Button { } label: {
            HStack(spacing: 4) {
                Image(systemName: "arrowshape.turn.up.left")
                    .font(.system(size: 12))
                Text("Reply")
                    .font(.system(size: 11, weight: .semibold))
            }
        }
        .buttonStyle(.plain)
        .foregroundStyle(.white.opacity(0.4))
    }
    
    private var shareButton: some View {
        Button { } label: {
            HStack(spacing: 4) {
                Image(systemName: "square.and.arrow.up")
                    .font(.system(size: 12))
                Text("Share")
                    .font(.system(size: 11, weight: .semibold))
            }
        }
        .buttonStyle(.plain)
        .foregroundStyle(.white.opacity(0.4))
    }
    
    private var cardBackground: some View {
        RoundedRectangle(cornerRadius: 14)
            .fill(isOP ? Color.orange.opacity(0.03) : Color.white.opacity(0.025))
            .overlay(
                RoundedRectangle(cornerRadius: 14)
                    .stroke(isOP ? Color.orange.opacity(0.15) : Color.white.opacity(0.06), lineWidth: 1)
            )
    }
    
    // MARK: - Helpers
    
    private var voteColor: Color {
        switch userVote {
        case .up: return .orange
        case .down: return .blue
        case nil: return .white.opacity(0.5)
        }
    }
    
    private func handleVote(_ direction: VoteDirection) {
        if userVote == direction {
            votes += direction == .up ? -1 : 1
            userVote = nil
        } else {
            let change = userVote != nil ? 2 : 1
            votes += direction == .up ? change : -change
            userVote = direction
        }
    }
    
    private static func relativeTimeString(from date: Date) -> String {
        let formatter = RelativeDateTimeFormatter()
        formatter.unitsStyle = .abbreviated
        return formatter.localizedString(for: date, relativeTo: Date())
    }
}

// MARK: - Color Extensions
private extension Color {
    static let amber = Color(red: 0.98, green: 0.74, blue: 0.18)
}
