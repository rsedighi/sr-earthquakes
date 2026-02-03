//
//  DashboardView.swift
//  BayTremor
//
//  Premium live earthquake dashboard with polished UI
//

import SwiftUI
import CoreLocation

struct DashboardView: View {
    @State private var viewModel = DashboardViewModel()
    @State private var selectedEarthquake: Earthquake?
    @AppStorage("selectedCity") private var selectedCity = "San Ramon"
    @State private var showFilters = false
    @State private var animateWaves = false
    
    var body: some View {
        NavigationStack {
            ZStack {
                // Premium animated background
                PremiumBackground(animateWaves: $animateWaves)
                
                ScrollView(showsIndicators: false) {
                    VStack(spacing: 0) {
                        // Hero Section with Live Status
                        HeroSection(
                            viewModel: viewModel,
                            onTapLargest: { if let eq = viewModel.largestEarthquake { selectedEarthquake = eq } }
                        )
                        
                        // Main Content
                        VStack(spacing: 24) {
                            // Quick Stats Glass Cards
                            QuickStatsSection(viewModel: viewModel)
                            
                            // Filter Pills
                            PremiumFilterSection(
                                quickFilter: $viewModel.quickFilter,
                                timeFilter: $viewModel.selectedFilter,
                                feltCount: viewModel.feltCount,
                                strongCount: viewModel.strongCount,
                                onTimeFilterChange: { viewModel.changeFilter(to: $0) }
                            )
                            
                            // Content
                            if viewModel.isLoading && viewModel.earthquakes.isEmpty {
                                PremiumLoadingSection()
                            } else if let error = viewModel.error {
                                PremiumErrorSection(error: error) {
                                    Task { await viewModel.refresh() }
                                }
                            } else if viewModel.filteredEarthquakes.isEmpty {
                                PremiumEmptySection(filter: viewModel.quickFilter)
                            } else {
                                // Earthquake List
                                PremiumEarthquakeList(
                                    earthquakes: viewModel.filteredEarthquakes,
                                    cityCoordinate: viewModel.cityCoordinate,
                                    onSelect: { selectedEarthquake = $0 }
                                )
                            }
                        }
                        .padding(.horizontal, 20)
                        .padding(.bottom, 100)
                    }
                }
            }
            .navigationTitle("Bay Tremor")
            .navigationBarTitleDisplayMode(.large)
            .toolbarBackground(.hidden, for: .navigationBar)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    PremiumCityButton(cityName: selectedCity)
                }
                
                ToolbarItem(placement: .topBarTrailing) {
                    PremiumRefreshButton(isRefreshing: viewModel.isRefreshing) {
                        Task { await viewModel.refresh() }
                    }
                }
            }
            .refreshable {
                await viewModel.refresh()
            }
            .sheet(item: $selectedEarthquake) { earthquake in
                PremiumDetailSheet(earthquake: earthquake)
            }
            .onChange(of: selectedCity) { _, newCity in
                viewModel.setCity(newCity)
            }
        }
        .task {
            viewModel.setCity(selectedCity)
            await viewModel.loadEarthquakes()
            withAnimation(.easeInOut(duration: 2).repeatForever(autoreverses: true)) {
                animateWaves = true
            }
        }
    }
}

// MARK: - Premium Animated Background

struct PremiumBackground: View {
    @Binding var animateWaves: Bool
    
    var body: some View {
        ZStack {
            // Deep gradient base
            LinearGradient(
                colors: [
                    Color(red: 0.05, green: 0.05, blue: 0.12),
                    Color(red: 0.02, green: 0.02, blue: 0.08),
                    Color.black
                ],
                startPoint: .top,
                endPoint: .bottom
            )
            .ignoresSafeArea()
            
            // Animated seismic circles
            GeometryReader { geo in
                ZStack {
                    // Multiple wave rings
                    ForEach(0..<3, id: \.self) { i in
                        Circle()
                            .stroke(
                                RadialGradient(
                                    colors: [
                                        Color.cyan.opacity(0.3),
                                        Color.cyan.opacity(0.1),
                                        Color.clear
                                    ],
                                    center: .center,
                                    startRadius: 0,
                                    endRadius: 200
                                ),
                                lineWidth: 1
                            )
                            .frame(width: animateWaves ? 400 : 100, height: animateWaves ? 400 : 100)
                            .opacity(animateWaves ? 0 : 0.8)
                            .animation(
                                .easeOut(duration: 3)
                                .repeatForever(autoreverses: false)
                                .delay(Double(i) * 1.0),
                                value: animateWaves
                            )
                    }
                }
                .position(x: geo.size.width * 0.8, y: geo.size.height * 0.15)
            }
            
            // Subtle grain texture overlay
            Rectangle()
                .fill(.white.opacity(0.015))
                .ignoresSafeArea()
        }
    }
}

// MARK: - Hero Section

struct HeroSection: View {
    let viewModel: DashboardViewModel
    let onTapLargest: () -> Void
    
    @State private var pulseAnimation = false
    
    var body: some View {
        VStack(spacing: 20) {
            // Live Status Pill
            HStack(spacing: 10) {
                // Animated live indicator
                ZStack {
                    Circle()
                        .fill(Color.green)
                        .frame(width: 8, height: 8)
                    
                    Circle()
                        .fill(Color.green.opacity(0.4))
                        .frame(width: 16, height: 16)
                        .scaleEffect(pulseAnimation ? 1.5 : 1.0)
                        .opacity(pulseAnimation ? 0 : 1)
                }
                
                Text(viewModel.isRefreshing ? "SYNCING" : "LIVE")
                    .font(.system(size: 11, weight: .heavy, design: .rounded))
                    .tracking(2)
                    .foregroundStyle(.green)
                
                if let date = viewModel.lastUpdated {
                    Text("•")
                        .foregroundStyle(.white.opacity(0.3))
                    Text(date, style: .relative)
                        .font(.system(size: 11, weight: .medium))
                        .foregroundStyle(.white.opacity(0.5))
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 8)
            .background(
                Capsule()
                    .fill(.ultraThinMaterial)
                    .overlay(
                        Capsule()
                            .stroke(Color.green.opacity(0.3), lineWidth: 1)
                    )
            )
            .onAppear {
                withAnimation(.easeInOut(duration: 1.5).repeatForever(autoreverses: false)) {
                    pulseAnimation = true
                }
            }
            
            // Activity Level Hero Card
            ActivityHeroCard(
                level: viewModel.activityLevel,
                count: viewModel.earthquakeCount,
                trend: viewModel.trend
            )
            
            // Featured Earthquake (if exists)
            if let largest = viewModel.largestEarthquake {
                FeaturedQuakeCard(earthquake: largest, onTap: onTapLargest)
            }
        }
        .padding(.horizontal, 20)
        .padding(.top, 8)
        .padding(.bottom, 24)
    }
}

// MARK: - Activity Hero Card

struct ActivityHeroCard: View {
    let level: ActivityLevel
    let count: Int
    let trend: TrendDirection
    
    @State private var ringAnimation = false
    
    var body: some View {
        HStack(spacing: 20) {
            // Animated activity ring
            ZStack {
                // Outer glow
                Circle()
                    .fill(
                        RadialGradient(
                            colors: [level.color.opacity(0.3), Color.clear],
                            center: .center,
                            startRadius: 20,
                            endRadius: 50
                        )
                    )
                    .frame(width: 100, height: 100)
                    .blur(radius: 8)
                
                // Background track
                Circle()
                    .stroke(Color.white.opacity(0.1), lineWidth: 8)
                    .frame(width: 70, height: 70)
                
                // Animated progress
                Circle()
                    .trim(from: 0, to: ringAnimation ? level.percentage : 0)
                    .stroke(
                        AngularGradient(
                            colors: [level.color.opacity(0.5), level.color, level.color.opacity(0.8)],
                            center: .center
                        ),
                        style: StrokeStyle(lineWidth: 8, lineCap: .round)
                    )
                    .frame(width: 70, height: 70)
                    .rotationEffect(.degrees(-90))
                
                // Center icon
                Image(systemName: level.icon)
                    .font(.system(size: 24, weight: .semibold))
                    .foregroundStyle(level.color)
                    .shadow(color: level.color.opacity(0.5), radius: 8)
            }
            .onAppear {
                withAnimation(.spring(response: 1.2, dampingFraction: 0.8)) {
                    ringAnimation = true
                }
            }
            
            VStack(alignment: .leading, spacing: 8) {
                Text("Seismic Activity")
                    .font(.system(size: 13, weight: .medium))
                    .foregroundStyle(.white.opacity(0.6))
                
                HStack(alignment: .firstTextBaseline, spacing: 8) {
                    Text(level.rawValue)
                        .font(.system(size: 28, weight: .bold, design: .rounded))
                        .foregroundStyle(level.color)
                    
                    // Trend badge
                    HStack(spacing: 3) {
                        Image(systemName: trend.icon)
                            .font(.system(size: 10, weight: .bold))
                        Text(trend == .stable ? "Stable" : (trend == .up ? "Rising" : "Falling"))
                            .font(.system(size: 10, weight: .semibold))
                    }
                    .foregroundStyle(trend.color)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(trend.color.opacity(0.15))
                    .clipShape(Capsule())
                }
                
                Text(level.description(count: count))
                    .font(.system(size: 12))
                    .foregroundStyle(.white.opacity(0.5))
                    .lineLimit(2)
            }
            
            Spacer()
        }
        .padding(20)
        .background(
            RoundedRectangle(cornerRadius: 24)
                .fill(.ultraThinMaterial)
                .overlay(
                    RoundedRectangle(cornerRadius: 24)
                        .stroke(
                            LinearGradient(
                                colors: [level.color.opacity(0.4), level.color.opacity(0.1), Color.clear],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            ),
                            lineWidth: 1
                        )
                )
                .shadow(color: level.color.opacity(0.2), radius: 20, y: 10)
        )
    }
}

// MARK: - Featured Earthquake Card

struct FeaturedQuakeCard: View {
    let earthquake: Earthquake
    let onTap: () -> Void
    
    @State private var isHovered = false
    @State private var glowAnimation = false
    
    var body: some View {
        Button(action: onTap) {
            HStack(spacing: 14) {
                // Glowing magnitude orb - contained in fixed frame
                ZStack {
                    // Subtle glow
                    Circle()
                        .fill(earthquake.magnitudeColor.opacity(0.2))
                        .frame(width: 72, height: 72)
                        .blur(radius: 12)
                    
                    // Main orb
                    Circle()
                        .fill(
                            RadialGradient(
                                colors: [
                                    earthquake.magnitudeColor,
                                    earthquake.magnitudeColor.opacity(0.8)
                                ],
                                center: .topLeading,
                                startRadius: 0,
                                endRadius: 36
                            )
                        )
                        .frame(width: 64, height: 64)
                        .overlay(
                            Circle()
                                .stroke(
                                    LinearGradient(
                                        colors: [.white.opacity(0.4), .clear],
                                        startPoint: .topLeading,
                                        endPoint: .bottomTrailing
                                    ),
                                    lineWidth: 2
                                )
                        )
                        .shadow(color: earthquake.magnitudeColor.opacity(0.5), radius: glowAnimation ? 16 : 10)
                    
                    // Magnitude text
                    VStack(spacing: -2) {
                        Text(String(format: "%.1f", earthquake.magnitude))
                            .font(.system(size: 22, weight: .black, design: .rounded))
                            .foregroundStyle(.white)
                        Text("MAG")
                            .font(.system(size: 7, weight: .bold))
                            .foregroundStyle(.white.opacity(0.7))
                            .tracking(1)
                    }
                }
                .frame(width: 72, height: 72)
                .onAppear {
                    withAnimation(.easeInOut(duration: 2).repeatForever(autoreverses: true)) {
                        glowAnimation = true
                    }
                }
                
                // Details - flexible width
                VStack(alignment: .leading, spacing: 8) {
                    // Badge
                    HStack(spacing: 4) {
                        Image(systemName: "star.fill")
                            .font(.system(size: 7))
                        Text("LARGEST TODAY")
                            .font(.system(size: 8, weight: .heavy))
                            .tracking(0.5)
                    }
                    .foregroundStyle(.white)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(
                        Capsule()
                            .fill(earthquake.magnitudeColor.opacity(0.8))
                    )
                    
                    Text(earthquake.place)
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(.white)
                        .lineLimit(2)
                        .multilineTextAlignment(.leading)
                        .fixedSize(horizontal: false, vertical: true)
                    
                    HStack(spacing: 8) {
                        HStack(spacing: 3) {
                            Image(systemName: "clock.fill")
                                .font(.system(size: 8))
                            Text(earthquake.relativeTimeString)
                                .font(.system(size: 9, weight: .medium))
                        }
                        
                        HStack(spacing: 3) {
                            Image(systemName: "arrow.down")
                                .font(.system(size: 8))
                            Text(String(format: "%.0fkm", earthquake.depth))
                                .font(.system(size: 9, weight: .medium))
                        }
                        
                        if let felt = earthquake.felt, felt > 0 {
                            HStack(spacing: 3) {
                                Image(systemName: "hand.raised.fill")
                                    .font(.system(size: 8))
                                Text("\(felt)")
                                    .font(.system(size: 9, weight: .medium))
                            }
                            .foregroundStyle(.orange)
                        }
                    }
                    .foregroundStyle(.white.opacity(0.6))
                }
                
                Spacer(minLength: 8)
                
                // Arrow
                Image(systemName: "chevron.right.circle.fill")
                    .font(.system(size: 22))
                    .foregroundStyle(.white.opacity(0.3))
            }
            .padding(16)
            .background(
                RoundedRectangle(cornerRadius: 24)
                    .fill(.ultraThinMaterial)
                    .overlay(
                        RoundedRectangle(cornerRadius: 24)
                            .stroke(
                                LinearGradient(
                                    colors: [earthquake.magnitudeColor.opacity(0.5), earthquake.magnitudeColor.opacity(0.1), Color.clear],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                ),
                                lineWidth: 1
                            )
                    )
            )
        }
        .buttonStyle(PremiumCardButtonStyle())
    }
}

struct PremiumCardButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.97 : 1.0)
            .opacity(configuration.isPressed ? 0.9 : 1.0)
            .animation(.spring(response: 0.3, dampingFraction: 0.7), value: configuration.isPressed)
    }
}

// MARK: - Quick Stats Section

struct QuickStatsSection: View {
    let viewModel: DashboardViewModel
    
    var body: some View {
        HStack(spacing: 12) {
            GlassStatCard(
                value: "\(viewModel.earthquakeCount)",
                label: "Total",
                icon: "waveform.path.ecg",
                gradient: [.cyan, .blue]
            )
            
            GlassStatCard(
                value: viewModel.largestMagnitude.map { String(format: "%.1f", $0) } ?? "-",
                label: "Largest",
                icon: "arrow.up.circle.fill",
                gradient: viewModel.largestMagnitude.map { gradientForMagnitude($0) } ?? [.gray, .gray.opacity(0.7)]
            )
            
            GlassStatCard(
                value: "\(viewModel.feltCount)",
                label: "Felt",
                icon: "hand.raised.fill",
                gradient: [.orange, .red]
            )
        }
    }
    
    func gradientForMagnitude(_ mag: Double) -> [Color] {
        switch mag {
        case ..<2.0: return [.green, .mint]
        case 2.0..<3.0: return [.yellow, .orange]
        case 3.0..<4.0: return [.orange, .red]
        default: return [.red, .purple]
        }
    }
}

struct GlassStatCard: View {
    let value: String
    let label: String
    let icon: String
    let gradient: [Color]
    
    @State private var appear = false
    
    var body: some View {
        VStack(spacing: 10) {
            // Icon with gradient
            ZStack {
                Circle()
                    .fill(
                        LinearGradient(colors: gradient, startPoint: .topLeading, endPoint: .bottomTrailing)
                    )
                    .frame(width: 36, height: 36)
                    .shadow(color: gradient[0].opacity(0.4), radius: 8)
                
                Image(systemName: icon)
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(.white)
            }
            
            Text(value)
                .font(.system(size: 24, weight: .bold, design: .rounded))
                .foregroundStyle(.white)
            
            Text(label)
                .font(.system(size: 11, weight: .medium))
                .foregroundStyle(.white.opacity(0.5))
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 18)
        .background(
            RoundedRectangle(cornerRadius: 20)
                .fill(.ultraThinMaterial)
                .overlay(
                    RoundedRectangle(cornerRadius: 20)
                        .stroke(Color.white.opacity(0.1), lineWidth: 1)
                )
        )
        .scaleEffect(appear ? 1 : 0.8)
        .opacity(appear ? 1 : 0)
        .onAppear {
            withAnimation(.spring(response: 0.6, dampingFraction: 0.7)) {
                appear = true
            }
        }
    }
}

// MARK: - Premium Filter Section

struct PremiumFilterSection: View {
    @Binding var quickFilter: QuickFilter
    @Binding var timeFilter: TimeFilter
    let feltCount: Int
    let strongCount: Int
    let onTimeFilterChange: (TimeFilter) -> Void
    
    var body: some View {
        VStack(spacing: 16) {
            // Quick Filters
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 10) {
                    PremiumFilterPill(
                        title: "All",
                        isActive: quickFilter == .all,
                        color: .cyan
                    ) { quickFilter = .all }
                    
                    PremiumFilterPill(
                        title: "Felt",
                        count: feltCount,
                        icon: "hand.raised.fill",
                        isActive: quickFilter == .felt,
                        color: .orange
                    ) { quickFilter = .felt }
                    
                    PremiumFilterPill(
                        title: "M3+",
                        count: strongCount,
                        icon: "exclamationmark.triangle.fill",
                        isActive: quickFilter == .strong,
                        color: .red
                    ) { quickFilter = .strong }
                    
                    PremiumFilterPill(
                        title: "Nearby",
                        icon: "location.fill",
                        isActive: quickFilter == .nearby,
                        color: .purple
                    ) { quickFilter = .nearby }
                }
            }
            
            // Time Filter Segmented
            HStack(spacing: 0) {
                ForEach(TimeFilter.allCases, id: \.self) { filter in
                    Button {
                        withAnimation(.spring(response: 0.3)) {
                            timeFilter = filter
                            onTimeFilterChange(filter)
                        }
                    } label: {
                        Text(filter.shortLabel)
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundStyle(timeFilter == filter ? .white : .white.opacity(0.5))
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 12)
                            .background(
                                Group {
                                    if timeFilter == filter {
                                        RoundedRectangle(cornerRadius: 10)
                                            .fill(
                                                LinearGradient(
                                                    colors: [.cyan.opacity(0.4), .blue.opacity(0.3)],
                                                    startPoint: .topLeading,
                                                    endPoint: .bottomTrailing
                                                )
                                            )
                                    }
                                }
                            )
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(4)
            .background(
                RoundedRectangle(cornerRadius: 14)
                    .fill(.ultraThinMaterial)
                    .overlay(
                        RoundedRectangle(cornerRadius: 14)
                            .stroke(Color.white.opacity(0.1), lineWidth: 1)
                    )
            )
        }
    }
}

struct PremiumFilterPill: View {
    let title: String
    var count: Int? = nil
    var icon: String? = nil
    let isActive: Bool
    let color: Color
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            HStack(spacing: 6) {
                if let icon {
                    Image(systemName: icon)
                        .font(.system(size: 11, weight: .semibold))
                }
                
                Text(title)
                    .font(.system(size: 13, weight: .semibold))
                
                if let count, count > 0 {
                    Text("\(count)")
                        .font(.system(size: 11, weight: .bold))
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(
                            Capsule()
                                .fill(isActive ? .white.opacity(0.2) : color.opacity(0.3))
                        )
                }
            }
            .foregroundStyle(isActive ? .white : .white.opacity(0.7))
            .padding(.horizontal, 16)
            .padding(.vertical, 10)
            .background(
                Capsule()
                    .fill(isActive ?
                          AnyShapeStyle(LinearGradient(colors: [color, color.opacity(0.7)], startPoint: .topLeading, endPoint: .bottomTrailing)) :
                          AnyShapeStyle(Color.white.opacity(0.08))
                    )
                    .shadow(color: isActive ? color.opacity(0.4) : .clear, radius: 8)
            )
            .overlay(
                Capsule()
                    .stroke(isActive ? Color.clear : Color.white.opacity(0.1), lineWidth: 1)
            )
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Premium Earthquake List

struct PremiumEarthquakeList: View {
    let earthquakes: [Earthquake]
    let cityCoordinate: CLLocationCoordinate2D?
    let onSelect: (Earthquake) -> Void
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("Recent Activity")
                    .font(.system(size: 18, weight: .bold))
                    .foregroundStyle(.white)
                
                Spacer()
                
                Text("\(earthquakes.count) events")
                    .font(.system(size: 12, weight: .medium))
                    .foregroundStyle(.white.opacity(0.5))
            }
            
            LazyVStack(spacing: 12) {
                ForEach(Array(earthquakes.enumerated()), id: \.element.id) { index, earthquake in
                    PremiumQuakeRow(
                        earthquake: earthquake,
                        distance: calculateDistance(to: earthquake),
                        index: index
                    )
                    .onTapGesture {
                        onSelect(earthquake)
                    }
                }
            }
        }
    }
    
    func calculateDistance(to earthquake: Earthquake) -> Double? {
        guard let coord = cityCoordinate else { return nil }
        let location = CLLocation(latitude: coord.latitude, longitude: coord.longitude)
        return earthquake.distance(from: location)
    }
}

struct PremiumQuakeRow: View {
    let earthquake: Earthquake
    let distance: Double?
    let index: Int
    
    @State private var appear = false
    
    var body: some View {
        HStack(spacing: 14) {
            // Magnitude badge with glow
            ZStack {
                // Glow effect
                RoundedRectangle(cornerRadius: 14)
                    .fill(earthquake.magnitudeColor.opacity(0.3))
                    .frame(width: 60, height: 60)
                    .blur(radius: 8)
                
                // Badge
                VStack(spacing: 2) {
                    Text(String(format: "%.1f", earthquake.magnitude))
                        .font(.system(size: 20, weight: .black, design: .rounded))
                        .foregroundStyle(.white)
                    
                    Text(earthquake.magnitudeLabel.prefix(3).uppercased())
                        .font(.system(size: 7, weight: .bold))
                        .foregroundStyle(.white.opacity(0.8))
                        .tracking(0.5)
                }
                .frame(width: 54, height: 54)
                .background(
                    RoundedRectangle(cornerRadius: 14)
                        .fill(
                            LinearGradient(
                                colors: [earthquake.magnitudeColor, earthquake.magnitudeColor.opacity(0.8)],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                )
                .overlay(
                    RoundedRectangle(cornerRadius: 14)
                        .stroke(
                            LinearGradient(
                                colors: [.white.opacity(0.3), .clear],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            ),
                            lineWidth: 1
                        )
                )
            }
            
            // Details
            VStack(alignment: .leading, spacing: 6) {
                Text(earthquake.place)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(.white)
                    .lineLimit(2)
                
                HStack(spacing: 12) {
                    Label(earthquake.relativeTimeString, systemImage: "clock")
                    Label(String(format: "%.0fkm", earthquake.depth), systemImage: "arrow.down")
                    if let dist = distance {
                        Label(String(format: "%.0fmi", dist), systemImage: "location")
                    }
                }
                .font(.system(size: 11, weight: .medium))
                .foregroundStyle(.white.opacity(0.5))
                
                // Felt indicator
                if let felt = earthquake.felt, felt > 0 {
                    HStack(spacing: 4) {
                        Image(systemName: "hand.raised.fill")
                            .font(.system(size: 9))
                        Text("\(felt) felt this")
                            .font(.system(size: 10, weight: .semibold))
                    }
                    .foregroundStyle(.orange)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(Color.orange.opacity(0.15))
                    .clipShape(Capsule())
                }
            }
            
            Spacer()
            
            Image(systemName: "chevron.right")
                .font(.system(size: 12, weight: .semibold))
                .foregroundStyle(.white.opacity(0.3))
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 20)
                .fill(.ultraThinMaterial)
                .overlay(
                    RoundedRectangle(cornerRadius: 20)
                        .stroke(Color.white.opacity(0.08), lineWidth: 1)
                )
        )
        .offset(x: appear ? 0 : 50)
        .opacity(appear ? 1 : 0)
        .onAppear {
            withAnimation(.spring(response: 0.5, dampingFraction: 0.8).delay(Double(index) * 0.05)) {
                appear = true
            }
        }
    }
}

// MARK: - Premium Loading Section

struct PremiumLoadingSection: View {
    @State private var shimmer = false
    
    var body: some View {
        VStack(spacing: 16) {
            ForEach(0..<4, id: \.self) { i in
                HStack(spacing: 14) {
                    RoundedRectangle(cornerRadius: 14)
                        .fill(
                            LinearGradient(
                                colors: shimmer ? [.white.opacity(0.1), .white.opacity(0.2), .white.opacity(0.1)] : [.white.opacity(0.05)],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .frame(width: 54, height: 54)
                    
                    VStack(alignment: .leading, spacing: 8) {
                        RoundedRectangle(cornerRadius: 4)
                            .fill(Color.white.opacity(0.1))
                            .frame(width: 180, height: 12)
                        
                        RoundedRectangle(cornerRadius: 4)
                            .fill(Color.white.opacity(0.05))
                            .frame(width: 120, height: 10)
                    }
                    
                    Spacer()
                }
                .padding(16)
                .background(
                    RoundedRectangle(cornerRadius: 20)
                        .fill(.ultraThinMaterial)
                )
            }
        }
        .onAppear {
            withAnimation(.linear(duration: 1.5).repeatForever(autoreverses: false)) {
                shimmer = true
            }
        }
    }
}

// MARK: - Premium Error Section

struct PremiumErrorSection: View {
    let error: Error
    let onRetry: () -> Void
    
    var body: some View {
        VStack(spacing: 24) {
            ZStack {
                Circle()
                    .fill(
                        RadialGradient(
                            colors: [.orange.opacity(0.3), Color.clear],
                            center: .center,
                            startRadius: 0,
                            endRadius: 60
                        )
                    )
                    .frame(width: 120, height: 120)
                
                Image(systemName: "wifi.exclamationmark")
                    .font(.system(size: 44, weight: .medium))
                    .foregroundStyle(
                        LinearGradient(colors: [.orange, .red], startPoint: .top, endPoint: .bottom)
                    )
            }
            
            VStack(spacing: 8) {
                Text("Connection Lost")
                    .font(.system(size: 20, weight: .bold))
                    .foregroundStyle(.white)
                
                Text(error.localizedDescription)
                    .font(.system(size: 13))
                    .foregroundStyle(.white.opacity(0.5))
                    .multilineTextAlignment(.center)
            }
            
            Button(action: onRetry) {
                HStack(spacing: 8) {
                    Image(systemName: "arrow.clockwise")
                        .font(.system(size: 14, weight: .semibold))
                    Text("Try Again")
                        .font(.system(size: 15, weight: .semibold))
                }
                .foregroundStyle(.white)
                .padding(.horizontal, 32)
                .padding(.vertical, 14)
                .background(
                    Capsule()
                        .fill(
                            LinearGradient(colors: [.blue, .cyan], startPoint: .leading, endPoint: .trailing)
                        )
                )
                .shadow(color: .blue.opacity(0.4), radius: 12)
            }
        }
        .padding(40)
    }
}

// MARK: - Premium Empty Section

struct PremiumEmptySection: View {
    let filter: QuickFilter
    
    @State private var bounceAnimation = false
    
    var body: some View {
        VStack(spacing: 24) {
            ZStack {
                Circle()
                    .fill(
                        RadialGradient(
                            colors: [.green.opacity(0.3), Color.clear],
                            center: .center,
                            startRadius: 0,
                            endRadius: 60
                        )
                    )
                    .frame(width: 120, height: 120)
                
                Image(systemName: filter == .all ? "checkmark.seal.fill" : "magnifyingglass")
                    .font(.system(size: 48, weight: .medium))
                    .foregroundStyle(
                        LinearGradient(colors: filter == .all ? [.green, .mint] : [.gray, .white.opacity(0.5)], startPoint: .top, endPoint: .bottom)
                    )
                    .offset(y: bounceAnimation ? -4 : 4)
                    .animation(.easeInOut(duration: 1.5).repeatForever(autoreverses: true), value: bounceAnimation)
            }
            
            VStack(spacing: 8) {
                Text(filter == .all ? "All Clear" : "No Matches")
                    .font(.system(size: 20, weight: .bold))
                    .foregroundStyle(.white)
                
                Text(filter.emptyMessage)
                    .font(.system(size: 13))
                    .foregroundStyle(.white.opacity(0.5))
                    .multilineTextAlignment(.center)
            }
        }
        .padding(40)
        .onAppear { bounceAnimation = true }
    }
}

// MARK: - Premium City Button

struct PremiumCityButton: View {
    let cityName: String
    
    var body: some View {
        NavigationLink {
            CityPickerView(selectedCity: .constant(cityName))
        } label: {
            HStack(spacing: 6) {
                Image(systemName: "location.fill")
                    .font(.system(size: 10))
                Text(cityName)
                    .font(.system(size: 13, weight: .medium))
            }
            .foregroundStyle(.white.opacity(0.7))
            .padding(.horizontal, 12)
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
    }
}

// MARK: - Premium Refresh Button

struct PremiumRefreshButton: View {
    let isRefreshing: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            ZStack {
                Circle()
                    .fill(.ultraThinMaterial)
                    .frame(width: 36, height: 36)
                    .overlay(
                        Circle()
                            .stroke(Color.white.opacity(0.1), lineWidth: 1)
                    )
                
                Image(systemName: "arrow.clockwise")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(.white.opacity(0.7))
                    .rotationEffect(.degrees(isRefreshing ? 360 : 0))
                    .animation(isRefreshing ? .linear(duration: 1).repeatForever(autoreverses: false) : .default, value: isRefreshing)
            }
        }
        .disabled(isRefreshing)
    }
}

// MARK: - Premium Detail Sheet

struct PremiumDetailSheet: View {
    let earthquake: Earthquake
    @Environment(\.dismiss) private var dismiss
    @State private var appear = false
    @State private var isShowingDiscussion = false
    
    var body: some View {
        NavigationStack {
            ZStack {
                // Background
                LinearGradient(
                    colors: [
                        Color(red: 0.05, green: 0.05, blue: 0.12),
                        Color.black
                    ],
                    startPoint: .top,
                    endPoint: .bottom
                )
                .ignoresSafeArea()
                
                ScrollView(showsIndicators: false) {
                    VStack(spacing: 32) {
                        // Magnitude Hero
                        ZStack {
                            // Glow rings
                            ForEach(0..<4, id: \.self) { i in
                                Circle()
                                    .fill(earthquake.magnitudeColor.opacity(0.1 - Double(i) * 0.02))
                                    .frame(width: CGFloat(160 + i * 40), height: CGFloat(160 + i * 40))
                                    .blur(radius: CGFloat(i * 4))
                            }
                            
                            VStack(spacing: 4) {
                                Text(String(format: "%.1f", earthquake.magnitude))
                                    .font(.system(size: 80, weight: .black, design: .rounded))
                                    .foregroundStyle(earthquake.magnitudeColor)
                                
                                Text(earthquake.magnitudeLabel.uppercased())
                                    .font(.system(size: 14, weight: .heavy))
                                    .tracking(3)
                                    .foregroundStyle(.white.opacity(0.6))
                            }
                        }
                        .scaleEffect(appear ? 1 : 0.5)
                        .opacity(appear ? 1 : 0)
                        
                        // Details Card
                        VStack(spacing: 0) {
                            PremiumDetailRow(icon: "mappin.circle.fill", label: "Location", value: earthquake.place, color: .blue)
                            Divider().background(Color.white.opacity(0.1))
                            PremiumDetailRow(icon: "clock.fill", label: "Time", value: formatTime(earthquake.time), color: .cyan)
                            Divider().background(Color.white.opacity(0.1))
                            PremiumDetailRow(icon: "arrow.down.circle.fill", label: "Depth", value: String(format: "%.1f km (%.1f mi)", earthquake.depth, earthquake.depthInMiles), color: .purple)
                            
                            if let felt = earthquake.felt, felt > 0 {
                                Divider().background(Color.white.opacity(0.1))
                                PremiumDetailRow(icon: "person.2.fill", label: "Felt Reports", value: "\(felt) people", color: .orange)
                            }
                        }
                        .background(
                            RoundedRectangle(cornerRadius: 20)
                                .fill(.ultraThinMaterial)
                                .overlay(
                                    RoundedRectangle(cornerRadius: 20)
                                        .stroke(Color.white.opacity(0.1), lineWidth: 1)
                                )
                        )
                        .opacity(appear ? 1 : 0)
                        .offset(y: appear ? 0 : 20)
                        
                        // Actions
                        HStack(spacing: 12) {
                            ShareLink(
                                item: "\(earthquake.formattedMagnitude) earthquake \(earthquake.place) - \(earthquake.relativeTimeString)",
                                subject: Text("Earthquake Alert"),
                                message: Text("Bay Area earthquake detected!")
                            ) {
                                HStack(spacing: 8) {
                                    Image(systemName: "square.and.arrow.up")
                                    Text("Share")
                                }
                                .font(.system(size: 14, weight: .semibold))
                                .foregroundStyle(.white)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 14)
                                .background(
                                    RoundedRectangle(cornerRadius: 14)
                                        .fill(.ultraThinMaterial)
                                        .overlay(
                                            RoundedRectangle(cornerRadius: 14)
                                                .stroke(Color.white.opacity(0.1), lineWidth: 1)
                                        )
                                )
                            }
                            
                            if let url = URL(string: earthquake.url), !earthquake.url.isEmpty {
                                Link(destination: url) {
                                    HStack(spacing: 8) {
                                        Image(systemName: "safari")
                                        Text("USGS")
                                    }
                                    .font(.system(size: 14, weight: .semibold))
                                    .foregroundStyle(.white)
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 14)
                                    .background(
                                        RoundedRectangle(cornerRadius: 14)
                                            .fill(
                                                LinearGradient(colors: [.blue, .cyan], startPoint: .leading, endPoint: .trailing)
                                            )
                                    )
                                    .shadow(color: .blue.opacity(0.3), radius: 8)
                                }
                            }
                            
                            Button {
                                isShowingDiscussion = true
                            } label: {
                                HStack(spacing: 8) {
                                    Image(systemName: "message.fill")
                                    Text("Discuss")
                                }
                                .font(.system(size: 14, weight: .semibold))
                                .foregroundStyle(.white)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 14)
                                .background(
                                    RoundedRectangle(cornerRadius: 14)
                                        .fill(.ultraThinMaterial)
                                        .overlay(
                                            RoundedRectangle(cornerRadius: 14)
                                                .stroke(Color.white.opacity(0.1), lineWidth: 1)
                                        )
                                )
                            }
                        }
                        .opacity(appear ? 1 : 0)
                    }
                    .padding(24)
                }
            }
            .navigationTitle("Details")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        dismiss()
                    } label: {
                        Image(systemName: "xmark.circle.fill")
                            .font(.title2)
                            .foregroundStyle(.white.opacity(0.5))
                    }
                }
            }
        }
        .presentationDetents([.medium, .large])
        .presentationDragIndicator(.visible)
        .presentationBackground(.clear)
        .onAppear {
            withAnimation(.spring(response: 0.6, dampingFraction: 0.8)) {
                appear = true
            }
        }
        .sheet(isPresented: $isShowingDiscussion) {
            CommunityDiscussionSheet(earthquake: earthquake)
        }
    }
    
    func formatTime(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "MMM d, yyyy 'at' h:mm a"
        return formatter.string(from: date)
    }
}

struct PremiumDetailRow: View {
    let icon: String
    let label: String
    let value: String
    let color: Color
    
    var body: some View {
        HStack(spacing: 14) {
            ZStack {
                Circle()
                    .fill(color.opacity(0.2))
                    .frame(width: 40, height: 40)
                
                Image(systemName: icon)
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(color)
            }
            
            VStack(alignment: .leading, spacing: 2) {
                Text(label)
                    .font(.system(size: 11, weight: .medium))
                    .foregroundStyle(.white.opacity(0.5))
                
                Text(value)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(.white)
            }
            
            Spacer()
        }
        .padding(16)
    }
}

// MARK: - Supporting Types

enum ActivityLevel: String {
    case quiet = "Quiet"
    case normal = "Normal"
    case elevated = "Elevated"
    case high = "High"
    
    var color: Color {
        switch self {
        case .quiet: return .green
        case .normal: return .cyan
        case .elevated: return .orange
        case .high: return .red
        }
    }
    
    var icon: String {
        switch self {
        case .quiet: return "leaf.fill"
        case .normal: return "waveform.path.ecg"
        case .elevated: return "exclamationmark.triangle.fill"
        case .high: return "bolt.fill"
        }
    }
    
    var percentage: CGFloat {
        switch self {
        case .quiet: return 0.15
        case .normal: return 0.4
        case .elevated: return 0.7
        case .high: return 1.0
        }
    }
    
    func description(count: Int) -> String {
        switch self {
        case .quiet: return "Minimal seismic activity detected"
        case .normal: return "\(count) events — typical activity levels"
        case .elevated: return "Above average — \(count) events detected"
        case .high: return "Significant activity — \(count) events"
        }
    }
}

enum TrendDirection {
    case up, down, stable
    
    var icon: String {
        switch self {
        case .up: return "arrow.up.right"
        case .down: return "arrow.down.right"
        case .stable: return "arrow.right"
        }
    }
    
    var color: Color {
        switch self {
        case .up: return .orange
        case .down: return .green
        case .stable: return .white.opacity(0.5)
        }
    }
}

enum QuickFilter: String, CaseIterable {
    case all = "All"
    case felt = "Felt"
    case strong = "Strong"
    case nearby = "Nearby"
    
    var emptyMessage: String {
        switch self {
        case .all: return "No earthquakes detected in the selected time period"
        case .felt: return "No earthquakes with felt reports"
        case .strong: return "No earthquakes M3.0 or greater"
        case .nearby: return "No earthquakes within 25 miles"
        }
    }
}

extension TimeFilter {
    var shortLabel: String {
        switch self {
        case .hour: return "1H"
        case .day: return "24H"
        case .week: return "7D"
        }
    }
}

// MARK: - Preview

#Preview {
    DashboardView()
        .preferredColorScheme(.dark)
}
