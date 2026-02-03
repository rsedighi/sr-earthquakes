//
//  CreateForumThreadView.swift
//  BayTremor
//
//  Create a Reddit-style thread, optionally attached to an earthquake.
//

import SwiftUI

struct CreateForumThreadSheet: View {
    let defaultCategory: ForumCategory
    let onCreated: (ForumThread) -> Void
    
    @Environment(\.dismiss) private var dismiss
    @State private var viewModel = CreateForumThreadViewModel()
    
    @AppStorage("communityDisplayName") private var savedAuthor = ""
    @AppStorage("communityLocation") private var savedLocation = ""
    
    @State private var postType: PostType = .post
    @State private var category: ForumCategory
    @State private var title = ""
    @State private var content = ""
    @State private var author = ""
    @State private var authorLocation = ""
    @State private var feltIntensity: Int = 3
    
    @State private var selectedEarthquake: Earthquake?
    @State private var earthquakes: [Earthquake] = []
    @State private var isLoadingEarthquakes = false
    
    enum PostType: String, CaseIterable, Identifiable {
        case post
        case felt
        var id: String { rawValue }
    }
    
    init(defaultCategory: ForumCategory, onCreated: @escaping (ForumThread) -> Void) {
        self.defaultCategory = defaultCategory
        self.onCreated = onCreated
        _category = State(initialValue: defaultCategory)
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
                    VStack(alignment: .leading, spacing: 14) {
                        postTypeTabs
                        
                        if postType == .felt {
                            feltReportBanner
                        }
                        
                        categoryPicker
                        
                        if category == .earthquake {
                            earthquakePicker
                        }
                        
                        TextField(postType == .felt ? "e.g., Just felt a strong shake in Downtown SF!" : "Title", text: $title)
                            .textInputAutocapitalization(.sentences)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 12)
                            .background(Color.white.opacity(0.06))
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                            .foregroundStyle(.white)
                        
                        TextEditor(text: $content)
                            .font(.system(size: 13, weight: .medium))
                            .foregroundStyle(.white)
                            .scrollContentBackground(.hidden)
                            .frame(minHeight: 140)
                            .padding(12)
                            .background(Color.white.opacity(0.06))
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                            .overlay(
                                Group {
                                    if content.isEmpty {
                                        Text(postType == .felt
                                            ? "Describe what you experienced - how strong was the shaking? What were you doing? Any damage?"
                                            : "Share your thoughts...")
                                            .font(.system(size: 13, weight: .medium))
                                            .foregroundStyle(.white.opacity(0.35))
                                            .padding(16)
                                    }
                                }
                                , alignment: .topLeading
                            )
                            .overlay(
                                RoundedRectangle(cornerRadius: 12)
                                    .stroke(Color.white.opacity(0.08), lineWidth: 1)
                            )
                        
                        // Intensity selector for "Did You Feel It?" posts
                        if postType == .felt {
                            intensitySelector
                        }
                        
                        HStack(spacing: 10) {
                            TextField("Your name", text: $author)
                                .textInputAutocapitalization(.words)
                                .textContentType(.name)
                                .padding(.horizontal, 12)
                                .padding(.vertical, 10)
                                .background(Color.white.opacity(0.06))
                                .clipShape(RoundedRectangle(cornerRadius: 12))
                                .foregroundStyle(.white)
                            
                            HStack(spacing: 6) {
                                Image(systemName: "mappin")
                                    .font(.system(size: 12))
                                    .foregroundStyle(.white.opacity(0.4))
                                TextField("Location", text: $authorLocation)
                                    .textInputAutocapitalization(.words)
                            }
                            .padding(.horizontal, 12)
                            .padding(.vertical, 10)
                            .background(Color.white.opacity(0.06))
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                            .foregroundStyle(.white)
                        }
                        .font(.system(size: 13, weight: .medium))
                        
                        if let error = viewModel.errorMessage {
                            Text(error)
                                .font(.system(size: 12, weight: .semibold))
                                .foregroundStyle(.red.opacity(0.9))
                        }
                        
                        Button {
                            Task { await submit() }
                        } label: {
                            HStack(spacing: 10) {
                                if viewModel.isSubmitting {
                                    ProgressView().tint(.white)
                                } else {
                                    Image(systemName: "paperplane.fill")
                                }
                                Text(viewModel.isSubmitting ? "Posting…" : "Create Post")
                                    .font(.system(size: 14, weight: .bold))
                            }
                            .foregroundStyle(.white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 14)
                            .background(
                                RoundedRectangle(cornerRadius: 14)
                                    .fill(LinearGradient(colors: [.orange, .amber], startPoint: .leading, endPoint: .trailing))
                            )
                        }
                        .disabled(viewModel.isSubmitting || authorTrimmed.isEmpty || titleTrimmed.isEmpty || contentTrimmed.isEmpty)
                    }
                    .padding(20)
                    .padding(.bottom, 40)
                }
            }
            .navigationTitle("Create Post")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
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
        .presentationDetents([.large])
        .presentationDragIndicator(.visible)
        .presentationBackground(.clear)
        .task {
            author = savedAuthor
            authorLocation = savedLocation
            
            if postType == .felt {
                category = .earthquake
            }
            await loadEarthquakesIfNeeded()
        }
        .onChange(of: postType) { _, newValue in
            if newValue == .felt {
                category = .earthquake
            }
        }
        .onChange(of: category) { _, newValue in
            if newValue != .earthquake {
                selectedEarthquake = nil
            } else {
                Task { await loadEarthquakesIfNeeded() }
            }
        }
        .onChange(of: author) { _, newValue in savedAuthor = newValue }
        .onChange(of: authorLocation) { _, newValue in savedLocation = newValue }
    }
    
    private var postTypeTabs: some View {
        HStack(spacing: 10) {
            ForEach(PostType.allCases) { type in
                Button {
                    withAnimation(.spring(response: 0.3, dampingFraction: 0.8)) {
                        postType = type
                    }
                } label: {
                    HStack(spacing: 6) {
                        Image(systemName: type == .post ? "doc.text" : "waveform.path.ecg")
                            .font(.system(size: 12, weight: .semibold))
                        Text(type == .post ? "Post" : "Did You Feel It?")
                            .font(.system(size: 12, weight: .bold))
                    }
                    .foregroundStyle(postType == type ? .white : .white.opacity(0.55))
                    .padding(.horizontal, 14)
                    .padding(.vertical, 10)
                    .background(
                        Capsule()
                            .fill(postType == type ? Color.white.opacity(0.12) : Color.white.opacity(0.05))
                            .overlay(
                                Capsule()
                                    .stroke(postType == type ? Color.orange.opacity(0.3) : Color.clear, lineWidth: 1)
                            )
                    )
                }
                .buttonStyle(.plain)
            }
            Spacer()
        }
    }
    
    private var feltReportBanner: some View {
        HStack(spacing: 12) {
            Image(systemName: "waveform.path.ecg")
                .font(.system(size: 20, weight: .semibold))
                .foregroundStyle(Color.amber)
            
            VStack(alignment: .leading, spacing: 4) {
                Text("Report an earthquake you felt")
                    .font(.system(size: 13, weight: .bold))
                    .foregroundStyle(Color.amber)
                Text("Share your experience to help others understand the impact in your area.")
                    .font(.system(size: 11, weight: .medium))
                    .foregroundStyle(.white.opacity(0.6))
            }
            
            Spacer()
        }
        .padding(14)
        .background(feltReportBannerBackground)
    }
    
    private var feltReportBannerBackground: some View {
        RoundedRectangle(cornerRadius: 14)
            .fill(Color.amber.opacity(0.1))
            .overlay(
                RoundedRectangle(cornerRadius: 14)
                    .stroke(Color.amber.opacity(0.25), lineWidth: 1)
            )
    }
    
    private var intensitySelector: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("How strong did it feel?")
                .font(.system(size: 13, weight: .bold))
                .foregroundStyle(.white.opacity(0.8))
            
            HStack(spacing: 8) {
                ForEach(IntensityLevel.allCases) { level in
                    Button {
                        withAnimation(.spring(response: 0.3, dampingFraction: 0.8)) {
                            feltIntensity = level.rawValue
                        }
                    } label: {
                        VStack(spacing: 6) {
                            Text("\(level.rawValue)")
                                .font(.system(size: 16, weight: .bold, design: .rounded))
                            Text(level.label)
                                .font(.system(size: 9, weight: .semibold))
                                .lineLimit(1)
                        }
                        .foregroundStyle(feltIntensity == level.rawValue ? .white : .white.opacity(0.5))
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 12)
                        .background(
                            RoundedRectangle(cornerRadius: 12)
                                .fill(feltIntensity == level.rawValue ? level.color.opacity(0.25) : Color.white.opacity(0.04))
                                .overlay(
                                    RoundedRectangle(cornerRadius: 12)
                                        .stroke(feltIntensity == level.rawValue ? level.color.opacity(0.5) : Color.white.opacity(0.08), lineWidth: 1)
                                )
                        )
                    }
                    .buttonStyle(.plain)
                }
            }
            
            // Intensity scale legend
            HStack {
                Text("Weak")
                    .font(.system(size: 10, weight: .medium))
                    .foregroundStyle(.white.opacity(0.4))
                Spacer()
                Text("Severe")
                    .font(.system(size: 10, weight: .medium))
                    .foregroundStyle(.white.opacity(0.4))
            }
        }
        .padding(14)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color.white.opacity(0.03))
                .overlay(
                    RoundedRectangle(cornerRadius: 16)
                        .stroke(Color.white.opacity(0.08), lineWidth: 1)
                )
        )
    }
}

// MARK: - Intensity Levels
private enum IntensityLevel: Int, CaseIterable, Identifiable {
    case weak = 1
    case light = 2
    case moderate = 3
    case strong = 4
    case severe = 5
    
    var id: Int { rawValue }
    
    var label: String {
        switch self {
        case .weak: return "Weak"
        case .light: return "Light"
        case .moderate: return "Moderate"
        case .strong: return "Strong"
        case .severe: return "Severe"
        }
    }
    
    var color: Color {
        switch self {
        case .weak: return .green
        case .light: return .lime
        case .moderate: return .yellow
        case .strong: return .orange
        case .severe: return .red
        }
    }
}

// MARK: - Lime Color Extension
private extension Color {
    static let lime = Color(red: 0.6, green: 0.8, blue: 0.2)
}

// MARK: - CreateForumThreadSheet Helpers
extension CreateForumThreadSheet {
    
    private var categoryPicker: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Category")
                .font(.system(size: 12, weight: .bold))
                .foregroundStyle(.white.opacity(0.7))
            
            Picker("Category", selection: $category) {
                ForEach(ForumCategory.allCases) { cat in
                    Text(cat.label).tag(cat)
                }
            }
            .pickerStyle(.menu)
            .disabled(postType == .felt) // Lock to earthquake for "Did You Feel It?"
        }
        .padding(14)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color.white.opacity(0.04))
                .overlay(
                    RoundedRectangle(cornerRadius: 16)
                        .stroke(Color.white.opacity(0.08), lineWidth: 1)
                )
        )
    }
    
    private var earthquakePicker: some View {
        VStack(alignment: .leading, spacing: 10) {
            earthquakePickerHeader
            earthquakePickerContent
        }
        .padding(14)
        .background(earthquakePickerBackground)
    }
    
    private var earthquakePickerHeader: some View {
        HStack {
            HStack(spacing: 6) {
                Image(systemName: "waveform.path.ecg")
                    .font(.system(size: 12))
                    .foregroundStyle(.orange)
                Text(postType == .felt ? "Link to earthquake" : "Attach an earthquake (optional)")
                    .font(.system(size: 12, weight: .bold))
                    .foregroundStyle(.white.opacity(0.7))
            }
            Spacer()
            if isLoadingEarthquakes {
                ProgressView().tint(.white.opacity(0.8)).scaleEffect(0.9)
            }
        }
    }
    
    @ViewBuilder
    private var earthquakePickerContent: some View {
        if earthquakes.isEmpty && !isLoadingEarthquakes {
            earthquakeEmptyState
        } else if !earthquakes.isEmpty {
            earthquakePickerMenu
            selectedEarthquakeCard
        }
    }
    
    private var earthquakeEmptyState: some View {
        HStack(spacing: 8) {
            Image(systemName: "exclamationmark.triangle")
                .font(.system(size: 12))
                .foregroundStyle(.yellow)
            Text("No recent earthquakes found.")
                .font(.system(size: 12, weight: .medium))
                .foregroundStyle(.white.opacity(0.55))
        }
    }
    
    private var earthquakePickerMenu: some View {
        Picker("Earthquake", selection: $selectedEarthquake) {
            Text("None").tag(Earthquake?.none)
            ForEach(earthquakes) { eq in
                Text("\(eq.formattedMagnitude) • \(eq.place)")
                    .tag(Optional(eq))
            }
        }
        .pickerStyle(.menu)
    }
    
    @ViewBuilder
    private var selectedEarthquakeCard: some View {
        if let eq = selectedEarthquake {
            let magColor = magnitudeColor(eq.magnitude)
            HStack(spacing: 10) {
                Text(eq.formattedMagnitude)
                    .font(.system(size: 14, weight: .black, design: .rounded))
                    .foregroundStyle(magColor)
                
                VStack(alignment: .leading, spacing: 2) {
                    Text(eq.place)
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundStyle(.white.opacity(0.9))
                        .lineLimit(1)
                    Text(eq.relativeTimeString)
                        .font(.system(size: 10, weight: .medium))
                        .foregroundStyle(.white.opacity(0.5))
                }
                
                Spacer()
                
                Button {
                    selectedEarthquake = nil
                } label: {
                    Image(systemName: "xmark.circle.fill")
                        .font(.system(size: 18))
                        .foregroundStyle(.white.opacity(0.4))
                }
                .buttonStyle(.plain)
            }
            .padding(12)
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(magColor.opacity(0.1))
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(magColor.opacity(0.2), lineWidth: 1)
                    )
            )
        }
    }
    
    private var earthquakePickerBackground: some View {
        RoundedRectangle(cornerRadius: 16)
            .fill(Color.white.opacity(0.04))
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .stroke(Color.white.opacity(0.08), lineWidth: 1)
            )
    }
    
    private var authorTrimmed: String {
        author.trimmingCharacters(in: .whitespacesAndNewlines)
    }
    
    private var titleTrimmed: String {
        title.trimmingCharacters(in: .whitespacesAndNewlines)
    }
    
    private var contentTrimmed: String {
        content.trimmingCharacters(in: .whitespacesAndNewlines)
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
    
    private func loadEarthquakesIfNeeded() async {
        guard category == .earthquake else { return }
        guard !isLoadingEarthquakes else { return }
        if !earthquakes.isEmpty { return }
        
        isLoadingEarthquakes = true
        defer { isLoadingEarthquakes = false }
        
        do {
            let fetched = try await APIClient.shared.fetchEarthquakes(feed: "all_day")
            earthquakes = fetched.sorted { $0.timestamp > $1.timestamp }.prefix(50).map { $0 }
        } catch {
            // non-fatal, keep picker empty
        }
    }
    
    private func submit() async {
        let earthquakeData: CreateForumThreadEarthquakeData?
        if let eq = selectedEarthquake {
            earthquakeData = CreateForumThreadEarthquakeData(
                magnitude: eq.magnitude,
                place: eq.place,
                time: eq.time,
                depth: eq.depth
            )
        } else {
            earthquakeData = nil
        }
        
        let request = CreateForumThreadRequest(
            title: titleTrimmed,
            category: category,
            author: authorTrimmed,
            authorLocation: authorLocation.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? nil : authorLocation,
            content: contentTrimmed,
            earthquakeId: selectedEarthquake?.id,
            earthquakeData: earthquakeData,
            tags: nil
        )
        
        if let created = await viewModel.submit(request) {
            onCreated(created)
            dismiss()
        }
    }
}

// MARK: - Amber Color for CreateForumThreadSheet
private extension Color {
    static let amber = Color(red: 0.98, green: 0.74, blue: 0.18)
}

