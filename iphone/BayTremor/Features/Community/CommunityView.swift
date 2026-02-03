//
//  CommunityView.swift
//  BayTremor
//
//  Standalone Community tab: Reddit-style threads feed + thread detail.
//

import SwiftUI

struct CommunityMainView: View {
    @State private var viewModel = CommunityViewModel()
    @State private var selectedThread: ForumThread?
    @State private var isShowingCreatePost = false
    @State private var isShowingRules = false
    @State private var isShowingLinks = false
    
    var body: some View {
        NavigationStack {
            ZStack {
                LinearGradient(
                    colors: [
                        Color(red: 0.05, green: 0.05, blue: 0.12),
                        Color.black
                    ],
                    startPoint: .top,
                    endPoint: .bottom
                )
                .ignoresSafeArea()
                
                if viewModel.isLoading && viewModel.threads.isEmpty {
                    VStack(spacing: 12) {
                        ProgressView()
                            .tint(.white)
                        Text("Loading discussions…")
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundStyle(.white.opacity(0.6))
                    }
                } else {
                    ScrollView(showsIndicators: false) {
                        VStack(alignment: .leading, spacing: 14) {
                            header
                            createPostCard
                            sortTabs
                            
                            // Rules & Links collapsible sections
                            rulesSection
                            usefulLinksSection
                            
                            if let error = viewModel.errorMessage {
                                Text(error)
                                    .font(.system(size: 12, weight: .semibold))
                                    .foregroundStyle(.red.opacity(0.9))
                            }
                            
                            if viewModel.threads.isEmpty {
                                emptyFeedCard
                            } else {
                                LazyVStack(spacing: 10) {
                                    ForEach(viewModel.threads) { thread in
                                        Button {
                                            selectedThread = thread
                                        } label: {
                                            ForumThreadRow(thread: thread)
                                        }
                                        .buttonStyle(.plain)
                                    }
                                }
                            }
                        }
                        .padding(20)
                        .padding(.bottom, 100)
                    }
                }
            }
            .navigationTitle("Community")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        Task { await viewModel.refresh() }
                    } label: {
                        Image(systemName: viewModel.isRefreshing ? "arrow.triangle.2.circlepath" : "arrow.clockwise")
                    }
                    .disabled(viewModel.isRefreshing)
                }
            }
            .sheet(item: $selectedThread) { thread in
                ForumThreadDetailSheet(thread: thread)
            }
            .sheet(isPresented: $isShowingCreatePost) {
                CreateForumThreadSheet(
                    defaultCategory: .earthquake,
                    onCreated: { created in
                        selectedThread = created
                        Task { await viewModel.refresh() }
                    }
                )
            }
        }
        .task {
            await viewModel.load()
        }
        .refreshable {
            await viewModel.refresh()
        }
    }
    
    private var header: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 14) {
                // Community avatar
                ZStack {
                    Circle()
                        .fill(LinearGradient(colors: [.orange, .amber], startPoint: .topLeading, endPoint: .bottomTrailing))
                        .frame(width: 52, height: 52)
                    Image(systemName: "waveform.path.ecg")
                        .font(.system(size: 22, weight: .bold))
                        .foregroundStyle(.white)
                }
                
                VStack(alignment: .leading, spacing: 4) {
                    Text("r/baytremor")
                        .font(.system(size: 18, weight: .bold))
                        .foregroundStyle(.white)
                    Text("Bay Area Earthquake Community")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundStyle(.white.opacity(0.6))
                }
                
                Spacer()
            }
            
            Text("Share your earthquake experiences, discuss seismic activity, and connect with Bay Area neighbors. Did you feel it? Let us know!")
                .font(.system(size: 12, weight: .medium))
                .foregroundStyle(.white.opacity(0.55))
                .lineLimit(3)
            
            if let stats = viewModel.stats {
                HStack(spacing: 16) {
                    StatPill(label: "Posts", value: "\(stats.totalPosts)", icon: "doc.text.fill")
                    StatPill(label: "Threads", value: "\(stats.totalThreads)", icon: "bubble.left.and.bubble.right.fill")
                    HStack(spacing: 4) {
                        Circle()
                            .fill(.green)
                            .frame(width: 6, height: 6)
                        Text("\(stats.activeToday)")
                            .font(.system(size: 12, weight: .bold, design: .rounded))
                            .foregroundStyle(.white)
                        Text("Online")
                            .font(.system(size: 11, weight: .semibold))
                            .foregroundStyle(.white.opacity(0.55))
                    }
                }
            }
            
            if PusherRealtimeClient.shared.isConfigured() {
                HStack(spacing: 6) {
                    Circle()
                        .fill(.green)
                        .frame(width: 6, height: 6)
                    Text("Comments update live")
                        .font(.system(size: 11, weight: .semibold))
                }
                .foregroundStyle(.green.opacity(0.9))
                .padding(.horizontal, 10)
                .padding(.vertical, 6)
                .background(Color.green.opacity(0.1))
                .clipShape(Capsule())
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
    
    private var createPostCard: some View {
        Button {
            isShowingCreatePost = true
        } label: {
            HStack(spacing: 12) {
                Circle()
                    .fill(Color.white.opacity(0.08))
                    .frame(width: 40, height: 40)
                    .overlay(
                        Image(systemName: "person.fill")
                            .font(.system(size: 16))
                            .foregroundStyle(.white.opacity(0.5))
                    )
                
                Text("Share your earthquake experience")
                    .font(.system(size: 13, weight: .medium))
                    .foregroundStyle(.white.opacity(0.5))
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.horizontal, 14)
                    .padding(.vertical, 10)
                    .background(
                        RoundedRectangle(cornerRadius: 12)
                            .fill(Color.white.opacity(0.04))
                            .overlay(
                                RoundedRectangle(cornerRadius: 12)
                                    .stroke(Color.white.opacity(0.08), lineWidth: 1)
                            )
                    )
                
                Image(systemName: "photo")
                    .font(.system(size: 18))
                    .foregroundStyle(.white.opacity(0.4))
                
                Image(systemName: "link")
                    .font(.system(size: 18))
                    .foregroundStyle(.white.opacity(0.4))
            }
            .padding(12)
            .background(
                RoundedRectangle(cornerRadius: 16)
                    .fill(Color.white.opacity(0.03))
                    .overlay(
                        RoundedRectangle(cornerRadius: 16)
                            .stroke(Color.white.opacity(0.08), lineWidth: 1)
                    )
            )
        }
        .buttonStyle(.plain)
    }
    
    private var sortTabs: some View {
        HStack(spacing: 8) {
            ForEach(ForumSort.allCases) { option in
                Button {
                    viewModel.sort = option
                    Task { await viewModel.load() }
                } label: {
                    HStack(spacing: 6) {
                        Image(systemName: option.icon)
                            .font(.system(size: 12, weight: .semibold))
                        Text(option.title)
                            .font(.system(size: 12, weight: .bold))
                    }
                    .foregroundStyle(viewModel.sort == option ? .white : .white.opacity(0.55))
                    .padding(.horizontal, 14)
                    .padding(.vertical, 10)
                    .background(
                        Capsule()
                            .fill(viewModel.sort == option ? Color.white.opacity(0.12) : Color.white.opacity(0.05))
                            .overlay(
                                Capsule()
                                    .stroke(Color.white.opacity(viewModel.sort == option ? 0.12 : 0.07), lineWidth: 1)
                            )
                    )
                }
                .buttonStyle(.plain)
            }
            Spacer()
        }
    }
    
    private var rulesSection: some View {
        VStack(alignment: .leading, spacing: 0) {
            Button {
                withAnimation(.spring(response: 0.3, dampingFraction: 0.8)) {
                    isShowingRules.toggle()
                }
            } label: {
                HStack {
                    Image(systemName: "doc.text.fill")
                        .font(.system(size: 14))
                        .foregroundStyle(.orange)
                    Text("r/baytremor Rules")
                        .font(.system(size: 13, weight: .bold))
                        .foregroundStyle(.white)
                    Spacer()
                    Image(systemName: "chevron.down")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundStyle(.white.opacity(0.5))
                        .rotationEffect(.degrees(isShowingRules ? 180 : 0))
                }
                .padding(14)
            }
            .buttonStyle(.plain)
            
            if isShowingRules {
                VStack(alignment: .leading, spacing: 12) {
                    ForEach(Array(CommunityRules.rules.enumerated()), id: \.offset) { index, rule in
                        HStack(alignment: .top, spacing: 12) {
                            Text("\(index + 1).")
                                .font(.system(size: 12, weight: .bold))
                                .foregroundStyle(.orange)
                                .frame(width: 20, alignment: .trailing)
                            Text(rule)
                                .font(.system(size: 12, weight: .medium))
                                .foregroundStyle(.white.opacity(0.7))
                        }
                    }
                }
                .padding(.horizontal, 14)
                .padding(.bottom, 14)
            }
        }
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color.white.opacity(0.03))
                .overlay(
                    RoundedRectangle(cornerRadius: 16)
                        .stroke(Color.white.opacity(0.08), lineWidth: 1)
                )
        )
    }
    
    private var usefulLinksSection: some View {
        VStack(alignment: .leading, spacing: 0) {
            Button {
                withAnimation(.spring(response: 0.3, dampingFraction: 0.8)) {
                    isShowingLinks.toggle()
                }
            } label: {
                HStack {
                    Image(systemName: "link")
                        .font(.system(size: 14))
                        .foregroundStyle(.blue)
                    Text("Useful Links")
                        .font(.system(size: 13, weight: .bold))
                        .foregroundStyle(.white)
                    Spacer()
                    Image(systemName: "chevron.down")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundStyle(.white.opacity(0.5))
                        .rotationEffect(.degrees(isShowingLinks ? 180 : 0))
                }
                .padding(14)
            }
            .buttonStyle(.plain)
            
            if isShowingLinks {
                VStack(alignment: .leading, spacing: 10) {
                    ForEach(CommunityLinks.links) { link in
                        Link(destination: link.url) {
                            HStack(spacing: 10) {
                                Image(systemName: "arrow.up.right.square")
                                    .font(.system(size: 12))
                                    .foregroundStyle(.white.opacity(0.5))
                                Text(link.title)
                                    .font(.system(size: 12, weight: .medium))
                                    .foregroundStyle(.white.opacity(0.7))
                                Spacer()
                            }
                        }
                    }
                }
                .padding(.horizontal, 14)
                .padding(.bottom, 14)
            }
        }
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color.white.opacity(0.03))
                .overlay(
                    RoundedRectangle(cornerRadius: 16)
                        .stroke(Color.white.opacity(0.08), lineWidth: 1)
                )
        )
    }
    
    private var emptyFeedCard: some View {
        VStack(spacing: 16) {
            Image(systemName: "waveform.path.ecg")
                .font(.system(size: 48))
                .foregroundStyle(.white.opacity(0.2))
            
            Text("No posts yet")
                .font(.system(size: 18, weight: .bold))
                .foregroundStyle(.white)
            
            Text("Be the first to share your earthquake experience!")
                .font(.system(size: 13, weight: .medium))
                .foregroundStyle(.white.opacity(0.5))
                .multilineTextAlignment(.center)
            
            Button {
                isShowingCreatePost = true
            } label: {
                Text("Create Post")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(.white)
                    .padding(.horizontal, 24)
                    .padding(.vertical, 12)
                    .background(
                        Capsule()
                            .fill(LinearGradient(colors: [.orange, .amber], startPoint: .leading, endPoint: .trailing))
                    )
            }
            .buttonStyle(.plain)
        }
        .frame(maxWidth: .infinity)
        .padding(40)
        .background(
            RoundedRectangle(cornerRadius: 20)
                .fill(Color.white.opacity(0.03))
                .overlay(
                    RoundedRectangle(cornerRadius: 20)
                        .stroke(Color.white.opacity(0.08), lineWidth: 1)
                )
        )
    }
}

// MARK: - Community Rules
private enum CommunityRules {
    static let rules: [String] = [
        "Be respectful to fellow Bay Area residents",
        "Share real experiences only",
        "Include location when reporting felt quakes",
        "No misinformation or fear-mongering",
        "Use proper flair for your posts"
    ]
}

// MARK: - Useful Links
private struct UsefulLink: Identifiable {
    let id = UUID()
    let title: String
    let url: URL
}

private enum CommunityLinks {
    static let links: [UsefulLink] = [
        UsefulLink(title: "USGS Earthquake Data", url: URL(string: "https://earthquake.usgs.gov")!),
        UsefulLink(title: "Earthquake Preparedness", url: URL(string: "https://www.ready.gov/earthquakes")!),
        UsefulLink(title: "Bay Tremor Live Map", url: URL(string: "https://baytremor.com")!)
    ]
}

// MARK: - ForumSort Extension
extension ForumSort {
    var icon: String {
        switch self {
        case .hot: return "flame.fill"
        case .new: return "sparkles"
        case .top: return "chart.line.uptrend.xyaxis"
        }
    }
}

private struct ForumThreadRow: View {
    let thread: ForumThread
    @State private var votes: Int
    @State private var userVote: VoteDirection? = nil
    
    init(thread: ForumThread) {
        self.thread = thread
        self._votes = State(initialValue: thread.viewCount)
    }
    
    enum VoteDirection {
        case up, down
    }
    
    var body: some View {
        HStack(alignment: .top, spacing: 0) {
            voteColumn
            contentColumn
        }
        .background(rowBackground)
    }
    
    // MARK: - Sub-views (broken up to help compiler)
    
    private var voteColumn: some View {
        VStack(spacing: 4) {
            Button {
                handleVote(.up)
            } label: {
                Image(systemName: userVote == .up ? "arrowtriangle.up.fill" : "arrowtriangle.up")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(userVote == .up ? .orange : .white.opacity(0.4))
            }
            .buttonStyle(.plain)
            
            Text("\(votes)")
                .font(.system(size: 11, weight: .bold, design: .rounded))
                .foregroundStyle(voteColor)
            
            Button {
                handleVote(.down)
            } label: {
                Image(systemName: userVote == .down ? "arrowtriangle.down.fill" : "arrowtriangle.down")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(userVote == .down ? .blue : .white.opacity(0.4))
            }
            .buttonStyle(.plain)
        }
        .frame(width: 40)
        .padding(.vertical, 10)
        .background(Color.white.opacity(0.02))
    }
    
    private var contentColumn: some View {
        VStack(alignment: .leading, spacing: 10) {
            metaRow
            titleView
            earthquakeBanner
            contentPreview
            actionBar
        }
        .padding(12)
    }
    
    private var metaRow: some View {
        HStack(alignment: .firstTextBaseline, spacing: 6) {
            categoryFlair
            
            Text("•")
                .foregroundStyle(.white.opacity(0.35))
            
            Text("u/\(thread.author)")
                .font(.system(size: 11, weight: .medium))
                .foregroundStyle(.white.opacity(0.55))
            
            authorLocationView
            
            Spacer()
            
            Text(Self.relativeTimeString(from: thread.createdAt))
                .font(.system(size: 10, weight: .semibold))
                .foregroundStyle(.white.opacity(0.45))
        }
    }
    
    private var categoryFlair: some View {
        Text(thread.category.flair)
            .font(.system(size: 10, weight: .bold))
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(thread.category.flairColor.opacity(0.15))
            .foregroundStyle(thread.category.flairColor)
            .clipShape(Capsule())
    }
    
    @ViewBuilder
    private var authorLocationView: some View {
        if let location = thread.authorLocation {
            HStack(spacing: 2) {
                Image(systemName: "mappin")
                    .font(.system(size: 8))
                Text(location)
            }
            .font(.system(size: 10, weight: .medium))
            .foregroundStyle(.white.opacity(0.45))
        }
    }
    
    private var titleView: some View {
        Text(thread.title)
            .font(.system(size: 15, weight: .semibold))
            .foregroundStyle(.white)
            .lineLimit(2)
            .multilineTextAlignment(.leading)
    }
    
    @ViewBuilder
    private var earthquakeBanner: some View {
        if let eq = thread.earthquakeData {
            let magColor = magnitudeColor(eq.magnitude)
            HStack(spacing: 10) {
                HStack(spacing: 6) {
                    Image(systemName: "waveform.path.ecg")
                        .font(.system(size: 12))
                        .foregroundStyle(magColor)
                    Text(String(format: "M%.1f", eq.magnitude))
                        .font(.system(size: 13, weight: .black, design: .rounded))
                        .foregroundStyle(magColor)
                }
                
                Text(eq.place)
                    .font(.system(size: 12, weight: .medium))
                    .foregroundStyle(.white.opacity(0.7))
                    .lineLimit(1)
                
                if let depth = eq.depth {
                    Text("•")
                        .foregroundStyle(.white.opacity(0.3))
                    Text("\(Int(depth))km")
                        .font(.system(size: 11, weight: .medium))
                        .foregroundStyle(.white.opacity(0.5))
                }
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(magColor.opacity(0.08))
            .clipShape(RoundedRectangle(cornerRadius: 10))
            .overlay(
                RoundedRectangle(cornerRadius: 10)
                    .stroke(magColor.opacity(0.15), lineWidth: 1)
            )
        }
    }
    
    @ViewBuilder
    private var contentPreview: some View {
        if !thread.content.isEmpty {
            Text(thread.content)
                .font(.system(size: 12, weight: .regular))
                .foregroundStyle(.white.opacity(0.65))
                .lineLimit(2)
        }
    }
    
    private var actionBar: some View {
        HStack(spacing: 16) {
            HStack(spacing: 5) {
                Image(systemName: "bubble.left")
                    .font(.system(size: 12))
                Text("\(max(0, thread.postCount - 1))")
                    .font(.system(size: 11, weight: .semibold))
            }
            
            HStack(spacing: 5) {
                Image(systemName: "square.and.arrow.up")
                    .font(.system(size: 12))
                Text("Share")
                    .font(.system(size: 11, weight: .semibold))
            }
            
            HStack(spacing: 5) {
                Image(systemName: "bookmark")
                    .font(.system(size: 12))
                Text("Save")
                    .font(.system(size: 11, weight: .semibold))
            }
            
            Spacer()
        }
        .foregroundStyle(.white.opacity(0.45))
    }
    
    private var rowBackground: some View {
        RoundedRectangle(cornerRadius: 16)
            .fill(Color.white.opacity(0.035))
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .stroke(Color.white.opacity(0.08), lineWidth: 1)
            )
    }
    
    // MARK: - Helpers
    
    private var voteColor: Color {
        switch userVote {
        case .up: return .orange
        case .down: return .blue
        case nil: return .white.opacity(0.6)
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
    
    private func magnitudeColor(_ mag: Double) -> Color {
        switch mag {
        case ..<2.0: return .green
        case 2.0..<3.0: return .yellow
        case 3.0..<4.0: return .orange
        case 4.0..<5.0: return .red
        default: return .purple
        }
    }
    
    private static func relativeTimeString(from date: Date) -> String {
        let formatter = RelativeDateTimeFormatter()
        formatter.unitsStyle = .abbreviated
        return formatter.localizedString(for: date, relativeTo: Date())
    }
}

// MARK: - ForumCategory Extension for Flairs
extension ForumCategory {
    var flair: String {
        switch self {
        case .earthquake: return "🌋 Felt Report"
        case .general: return "💬 Discussion"
        case .neighborhood: return "📍 Local"
        case .preparedness: return "🛡️ Safety"
        case .science: return "🔬 Science"
        }
    }
    
    var flairColor: Color {
        switch self {
        case .earthquake: return .orange
        case .general: return .blue
        case .neighborhood: return .green
        case .preparedness: return .red
        case .science: return .purple
        }
    }
}

private struct StatPill: View {
    let label: String
    let value: String
    var icon: String? = nil
    
    var body: some View {
        HStack(spacing: 5) {
            if let icon = icon {
                Image(systemName: icon)
                    .font(.system(size: 10))
                    .foregroundStyle(.white.opacity(0.5))
            }
            Text(value)
                .font(.system(size: 12, weight: .bold, design: .rounded))
                .foregroundStyle(.white)
            Text(label)
                .font(.system(size: 11, weight: .semibold))
                .foregroundStyle(.white.opacity(0.55))
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 6)
        .background(Color.white.opacity(0.05))
        .clipShape(Capsule())
    }
}

// MARK: - Amber Color Extension
private extension Color {
    static let amber = Color(red: 0.98, green: 0.74, blue: 0.18)
}

