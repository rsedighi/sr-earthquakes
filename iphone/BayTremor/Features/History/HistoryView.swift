//
//  HistoryView.swift
//  BayTremor
//
//  Premium historical earthquake data and statistics
//

import SwiftUI
import Charts

struct HistoryMainView: View {
    @State private var viewModel = HistoryViewModel()
    @State private var selectedEarthquake: Earthquake?
    @State private var animateCharts = false
    
    var body: some View {
        NavigationStack {
            ZStack {
                // Premium background
                HistoryBackground()
                
                ScrollView(showsIndicators: false) {
                    VStack(spacing: 28) {
                        if viewModel.isLoading {
                            PremiumHistoryLoading()
                        } else {
                            // Hero Stats Section
                            HeroStatsSection(viewModel: viewModel)
                            
                            // Magnitude Distribution
                            PremiumMagnitudeChart(
                                earthquakes: viewModel.earthquakes,
                                animate: animateCharts
                            )
                            
                            // Timeline Activity
                            PremiumTimelineChart(
                                earthquakes: viewModel.earthquakes,
                                animate: animateCharts
                            )
                            
                            // Depth Analysis
                            DepthDistributionCard(earthquakes: viewModel.earthquakes)
                            
                            // Significant Earthquakes
                            SignificantQuakesSection(
                                earthquakes: viewModel.significantEarthquakes,
                                onSelect: { selectedEarthquake = $0 }
                            )
                        }
                    }
                    .padding(.horizontal, 20)
                    .padding(.bottom, 100)
                }
            }
            .navigationTitle("History")
            .navigationBarTitleDisplayMode(.large)
            .toolbarBackground(.hidden, for: .navigationBar)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    TimeFilterMenu(
                        selectedFilter: viewModel.selectedFilter,
                        onChange: { viewModel.changeFilter(to: $0) }
                    )
                }
            }
            .refreshable {
                await viewModel.loadEarthquakes()
            }
            .sheet(item: $selectedEarthquake) { earthquake in
                PremiumHistoryDetailSheet(earthquake: earthquake)
            }
        }
        .task {
            await viewModel.loadEarthquakes()
            withAnimation(.easeOut(duration: 0.8).delay(0.3)) {
                animateCharts = true
            }
        }
    }
}

// MARK: - Background

struct HistoryBackground: View {
    var body: some View {
        ZStack {
            // Deep gradient
            LinearGradient(
                colors: [
                    Color(red: 0.08, green: 0.03, blue: 0.12),
                    Color(red: 0.04, green: 0.02, blue: 0.08),
                    Color.black
                ],
                startPoint: .top,
                endPoint: .bottom
            )
            .ignoresSafeArea()
            
            // Subtle data visualization pattern
            GeometryReader { geo in
                ForEach(0..<8, id: \.self) { i in
                    Path { path in
                        let y = geo.size.height * CGFloat(i) / 8
                        path.move(to: CGPoint(x: 0, y: y))
                        
                        // Create wave pattern
                        for x in stride(from: 0, to: geo.size.width, by: 10) {
                            let wave = sin(Double(x) / 40 + Double(i)) * 8
                            path.addLine(to: CGPoint(x: x, y: y + wave))
                        }
                    }
                    .stroke(Color.purple.opacity(0.05), lineWidth: 0.5)
                }
            }
            .ignoresSafeArea()
        }
    }
}

// MARK: - Time Filter Menu

struct TimeFilterMenu: View {
    let selectedFilter: TimeFilter
    let onChange: (TimeFilter) -> Void
    
    var body: some View {
        Menu {
            Button {
                onChange(.day)
            } label: {
                Label("Past 24 Hours", systemImage: selectedFilter == .day ? "checkmark" : "")
            }
            
            Button {
                onChange(.week)
            } label: {
                Label("Past 7 Days", systemImage: selectedFilter == .week ? "checkmark" : "")
            }
        } label: {
            HStack(spacing: 6) {
                Text(selectedFilter == .day ? "24H" : "7D")
                    .font(.system(size: 13, weight: .bold))
                Image(systemName: "chevron.down")
                    .font(.system(size: 10, weight: .bold))
            }
            .foregroundStyle(.white.opacity(0.8))
            .padding(.horizontal, 14)
            .padding(.vertical, 8)
            .background(
                Capsule()
                    .fill(.ultraThinMaterial)
                    .overlay(
                        Capsule()
                            .stroke(Color.purple.opacity(0.3), lineWidth: 1)
                    )
            )
        }
    }
}

// MARK: - Hero Stats Section

struct HeroStatsSection: View {
    let viewModel: HistoryViewModel
    
    @State private var appear = false
    
    var body: some View {
        VStack(spacing: 20) {
            // Main stat hero
            HStack(spacing: 0) {
                // Total earthquakes - big number
                VStack(spacing: 4) {
                    Text("\(viewModel.earthquakes.count)")
                        .font(.system(size: 64, weight: .black, design: .rounded))
                        .foregroundStyle(
                            LinearGradient(
                                colors: [.purple, .pink, .orange],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                    
                    Text("earthquakes")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(.white.opacity(0.5))
                        .textCase(.uppercase)
                        .tracking(2)
                }
                .frame(maxWidth: .infinity)
                
                // Divider
                Rectangle()
                    .fill(
                        LinearGradient(
                            colors: [Color.clear, .purple.opacity(0.3), Color.clear],
                            startPoint: .top,
                            endPoint: .bottom
                        )
                    )
                    .frame(width: 1, height: 80)
                
                // Largest magnitude
                VStack(spacing: 4) {
                    HStack(alignment: .firstTextBaseline, spacing: 2) {
                        Text("M")
                            .font(.system(size: 24, weight: .bold))
                            .foregroundStyle(.white.opacity(0.5))
                        Text(String(format: "%.1f", viewModel.largestMagnitude ?? 0))
                            .font(.system(size: 48, weight: .black, design: .rounded))
                            .foregroundStyle(magnitudeColor(for: viewModel.largestMagnitude ?? 0))
                    }
                    
                    Text("largest")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(.white.opacity(0.5))
                        .textCase(.uppercase)
                        .tracking(2)
                }
                .frame(maxWidth: .infinity)
            }
            .padding(.vertical, 24)
            .background(
                RoundedRectangle(cornerRadius: 28)
                    .fill(.ultraThinMaterial)
                    .overlay(
                        RoundedRectangle(cornerRadius: 28)
                            .stroke(
                                LinearGradient(
                                    colors: [.purple.opacity(0.4), .pink.opacity(0.2), Color.clear],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                ),
                                lineWidth: 1
                            )
                    )
                    .shadow(color: .purple.opacity(0.2), radius: 20, y: 10)
            )
            
            // Secondary stats row
            HStack(spacing: 12) {
                MiniStatPill(
                    icon: "arrow.down.circle.fill",
                    label: "Avg Depth",
                    value: String(format: "%.0f km", viewModel.averageDepth),
                    gradient: [.cyan, .blue]
                )
                
                MiniStatPill(
                    icon: "hand.raised.fill",
                    label: "Felt",
                    value: "\(viewModel.earthquakes.filter { ($0.felt ?? 0) > 0 }.count)",
                    gradient: [.orange, .red]
                )
                
                MiniStatPill(
                    icon: "exclamationmark.triangle.fill",
                    label: "M3+",
                    value: "\(viewModel.significantEarthquakes.count)",
                    gradient: [.red, .pink]
                )
            }
        }
        .scaleEffect(appear ? 1 : 0.9)
        .opacity(appear ? 1 : 0)
        .onAppear {
            withAnimation(.spring(response: 0.6, dampingFraction: 0.8)) {
                appear = true
            }
        }
    }
    
    func magnitudeColor(for mag: Double) -> Color {
        switch mag {
        case ..<2.0: return .green
        case 2.0..<3.0: return .yellow
        case 3.0..<4.0: return .orange
        case 4.0..<5.0: return .red
        default: return .purple
        }
    }
}

struct MiniStatPill: View {
    let icon: String
    let label: String
    let value: String
    let gradient: [Color]
    
    var body: some View {
        HStack(spacing: 10) {
            ZStack {
                Circle()
                    .fill(
                        LinearGradient(colors: gradient, startPoint: .topLeading, endPoint: .bottomTrailing)
                    )
                    .frame(width: 32, height: 32)
                
                Image(systemName: icon)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(.white)
            }
            
            VStack(alignment: .leading, spacing: 1) {
                Text(value)
                    .font(.system(size: 15, weight: .bold))
                    .foregroundStyle(.white)
                
                Text(label)
                    .font(.system(size: 9, weight: .medium))
                    .foregroundStyle(.white.opacity(0.5))
            }
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(.ultraThinMaterial)
                .overlay(
                    RoundedRectangle(cornerRadius: 16)
                        .stroke(Color.white.opacity(0.08), lineWidth: 1)
                )
        )
    }
}

// MARK: - Premium Magnitude Chart

struct PremiumMagnitudeChart: View {
    let earthquakes: [Earthquake]
    let animate: Bool
    
    var magnitudeData: [(range: String, count: Int, color: Color)] {
        let ranges: [(String, ClosedRange<Double>, Color)] = [
            ("< 2", 0...1.999, .green),
            ("2-3", 2.0...2.999, .yellow),
            ("3-4", 3.0...3.999, .orange),
            ("4-5", 4.0...4.999, .red),
            ("5+", 5.0...10.0, .purple)
        ]
        
        return ranges.map { (label, range, color) in
            let count = earthquakes.filter { range.contains($0.magnitude) }.count
            return (label, count, color)
        }
    }
    
    var maxCount: Int {
        magnitudeData.map(\.count).max() ?? 1
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            // Header
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Magnitude Distribution")
                        .font(.system(size: 18, weight: .bold))
                        .foregroundStyle(.white)
                    
                    Text("Events by intensity")
                        .font(.system(size: 12))
                        .foregroundStyle(.white.opacity(0.5))
                }
                
                Spacer()
                
                Image(systemName: "chart.bar.fill")
                    .font(.system(size: 20))
                    .foregroundStyle(
                        LinearGradient(colors: [.purple, .pink], startPoint: .top, endPoint: .bottom)
                    )
            }
            
            // Custom bar chart
            HStack(alignment: .bottom, spacing: 12) {
                ForEach(magnitudeData, id: \.range) { item in
                    VStack(spacing: 8) {
                        // Count label
                        Text("\(item.count)")
                            .font(.system(size: 12, weight: .bold))
                            .foregroundStyle(item.color)
                        
                        // Bar
                        ZStack(alignment: .bottom) {
                            // Background track
                            RoundedRectangle(cornerRadius: 8)
                                .fill(Color.white.opacity(0.05))
                                .frame(height: 120)
                            
                            // Filled bar
                            RoundedRectangle(cornerRadius: 8)
                                .fill(
                                    LinearGradient(
                                        colors: [item.color, item.color.opacity(0.6)],
                                        startPoint: .top,
                                        endPoint: .bottom
                                    )
                                )
                                .frame(height: animate ? max(8, 120 * CGFloat(item.count) / CGFloat(max(maxCount, 1))) : 0)
                                .shadow(color: item.color.opacity(0.4), radius: 8)
                        }
                        .frame(height: 120)
                        
                        // Label
                        Text(item.range)
                            .font(.system(size: 11, weight: .semibold))
                            .foregroundStyle(.white.opacity(0.6))
                    }
                    .frame(maxWidth: .infinity)
                }
            }
        }
        .padding(20)
        .background(
            RoundedRectangle(cornerRadius: 24)
                .fill(.ultraThinMaterial)
                .overlay(
                    RoundedRectangle(cornerRadius: 24)
                        .stroke(
                            LinearGradient(
                                colors: [.purple.opacity(0.3), Color.clear],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            ),
                            lineWidth: 1
                        )
                )
        )
    }
}

// MARK: - Premium Timeline Chart

struct PremiumTimelineChart: View {
    let earthquakes: [Earthquake]
    let animate: Bool
    
    var hourlyData: [(hour: Date, count: Int)] {
        let calendar = Calendar.current
        
        func startOfHour(for date: Date) -> Date {
            let components = calendar.dateComponents([.year, .month, .day, .hour], from: date)
            return calendar.date(from: components) ?? date
        }
        
        let grouped = Dictionary(grouping: earthquakes) { earthquake in
            startOfHour(for: earthquake.time)
        }
        
        let now = Date()
        var data: [(Date, Int)] = []
        
        for i in 0..<24 {
            if let hour = calendar.date(byAdding: .hour, value: -i, to: now) {
                let hourStart = startOfHour(for: hour)
                let count = grouped[hourStart]?.count ?? 0
                data.append((hourStart, count))
            }
        }
        
        return data.reversed()
    }
    
    var maxCount: Int {
        hourlyData.map(\.count).max() ?? 1
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            // Header
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Activity Timeline")
                        .font(.system(size: 18, weight: .bold))
                        .foregroundStyle(.white)
                    
                    Text("Past 24 hours")
                        .font(.system(size: 12))
                        .foregroundStyle(.white.opacity(0.5))
                }
                
                Spacer()
                
                Image(systemName: "waveform.path.ecg")
                    .font(.system(size: 20))
                    .foregroundStyle(
                        LinearGradient(colors: [.cyan, .blue], startPoint: .top, endPoint: .bottom)
                    )
            }
            
            // Custom area chart
            GeometryReader { geo in
                ZStack(alignment: .bottom) {
                    // Grid lines
                    VStack(spacing: 0) {
                        ForEach(0..<4, id: \.self) { _ in
                            Spacer()
                            Rectangle()
                                .fill(Color.white.opacity(0.05))
                                .frame(height: 1)
                        }
                    }
                    
                    // Area fill
                    Path { path in
                        guard !hourlyData.isEmpty else { return }
                        let width = geo.size.width
                        let height = geo.size.height
                        let stepX = width / CGFloat(hourlyData.count - 1)
                        
                        path.move(to: CGPoint(x: 0, y: height))
                        
                        for (index, item) in hourlyData.enumerated() {
                            let x = CGFloat(index) * stepX
                            let y = height - (animate ? (height * CGFloat(item.count) / CGFloat(max(maxCount, 1))) : 0)
                            
                            if index == 0 {
                                path.addLine(to: CGPoint(x: x, y: y))
                            } else {
                                let prevX = CGFloat(index - 1) * stepX
                                let controlX = (prevX + x) / 2
                                path.addCurve(
                                    to: CGPoint(x: x, y: y),
                                    control1: CGPoint(x: controlX, y: path.currentPoint?.y ?? y),
                                    control2: CGPoint(x: controlX, y: y)
                                )
                            }
                        }
                        
                        path.addLine(to: CGPoint(x: width, y: height))
                        path.closeSubpath()
                    }
                    .fill(
                        LinearGradient(
                            colors: [.cyan.opacity(0.4), .cyan.opacity(0.1), .clear],
                            startPoint: .top,
                            endPoint: .bottom
                        )
                    )
                    
                    // Line
                    Path { path in
                        guard !hourlyData.isEmpty else { return }
                        let width = geo.size.width
                        let height = geo.size.height
                        let stepX = width / CGFloat(hourlyData.count - 1)
                        
                        for (index, item) in hourlyData.enumerated() {
                            let x = CGFloat(index) * stepX
                            let y = height - (animate ? (height * CGFloat(item.count) / CGFloat(max(maxCount, 1))) : 0)
                            
                            if index == 0 {
                                path.move(to: CGPoint(x: x, y: y))
                            } else {
                                let prevX = CGFloat(index - 1) * stepX
                                let controlX = (prevX + x) / 2
                                path.addCurve(
                                    to: CGPoint(x: x, y: y),
                                    control1: CGPoint(x: controlX, y: path.currentPoint?.y ?? y),
                                    control2: CGPoint(x: controlX, y: y)
                                )
                            }
                        }
                    }
                    .stroke(
                        LinearGradient(colors: [.cyan, .blue], startPoint: .leading, endPoint: .trailing),
                        style: StrokeStyle(lineWidth: 3, lineCap: .round, lineJoin: .round)
                    )
                    .shadow(color: .cyan.opacity(0.5), radius: 8)
                    
                    // Data points
                    ForEach(Array(hourlyData.enumerated()), id: \.offset) { index, item in
                        if item.count > 0 {
                            let width = geo.size.width
                            let height = geo.size.height
                            let stepX = width / CGFloat(hourlyData.count - 1)
                            let x = CGFloat(index) * stepX
                            let y = height - (animate ? (height * CGFloat(item.count) / CGFloat(max(maxCount, 1))) : 0)
                            
                            Circle()
                                .fill(.white)
                                .frame(width: 8, height: 8)
                                .shadow(color: .cyan.opacity(0.8), radius: 4)
                                .position(x: x, y: y)
                        }
                    }
                }
            }
            .frame(height: 140)
            
            // Time labels
            HStack {
                Text("24h ago")
                    .font(.system(size: 10, weight: .medium))
                    .foregroundStyle(.white.opacity(0.4))
                
                Spacer()
                
                Text("12h ago")
                    .font(.system(size: 10, weight: .medium))
                    .foregroundStyle(.white.opacity(0.4))
                
                Spacer()
                
                Text("Now")
                    .font(.system(size: 10, weight: .medium))
                    .foregroundStyle(.white.opacity(0.4))
            }
        }
        .padding(20)
        .background(
            RoundedRectangle(cornerRadius: 24)
                .fill(.ultraThinMaterial)
                .overlay(
                    RoundedRectangle(cornerRadius: 24)
                        .stroke(
                            LinearGradient(
                                colors: [.cyan.opacity(0.3), Color.clear],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            ),
                            lineWidth: 1
                        )
                )
        )
    }
}

// MARK: - Depth Distribution Card

struct DepthDistributionCard: View {
    let earthquakes: [Earthquake]
    
    var depthGroups: [(label: String, count: Int, color: Color)] {
        let groups: [(String, ClosedRange<Double>, Color)] = [
            ("Shallow (0-10km)", 0...10, .cyan),
            ("Medium (10-30km)", 10...30, .blue),
            ("Deep (30km+)", 30...200, .purple)
        ]
        
        return groups.map { (label, range, color) in
            let count = earthquakes.filter { range.contains($0.depth) }.count
            return (label, count, color)
        }
    }
    
    var totalCount: Int {
        earthquakes.count
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            // Header
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Depth Analysis")
                        .font(.system(size: 18, weight: .bold))
                        .foregroundStyle(.white)
                    
                    Text("Distribution by depth")
                        .font(.system(size: 12))
                        .foregroundStyle(.white.opacity(0.5))
                }
                
                Spacer()
                
                Image(systemName: "arrow.down.circle.fill")
                    .font(.system(size: 20))
                    .foregroundStyle(
                        LinearGradient(colors: [.cyan, .purple], startPoint: .top, endPoint: .bottom)
                    )
            }
            
            // Depth bars
            VStack(spacing: 14) {
                ForEach(depthGroups, id: \.label) { group in
                    HStack(spacing: 12) {
                        // Label
                        Text(group.label)
                            .font(.system(size: 12, weight: .medium))
                            .foregroundStyle(.white.opacity(0.7))
                            .frame(width: 120, alignment: .leading)
                        
                        // Progress bar
                        GeometryReader { geo in
                            ZStack(alignment: .leading) {
                                RoundedRectangle(cornerRadius: 4)
                                    .fill(Color.white.opacity(0.1))
                                
                                RoundedRectangle(cornerRadius: 4)
                                    .fill(
                                        LinearGradient(
                                            colors: [group.color, group.color.opacity(0.6)],
                                            startPoint: .leading,
                                            endPoint: .trailing
                                        )
                                    )
                                    .frame(width: geo.size.width * CGFloat(group.count) / CGFloat(max(totalCount, 1)))
                                    .shadow(color: group.color.opacity(0.4), radius: 4)
                            }
                        }
                        .frame(height: 8)
                        
                        // Count
                        Text("\(group.count)")
                            .font(.system(size: 13, weight: .bold, design: .rounded))
                            .foregroundStyle(group.color)
                            .frame(width: 36, alignment: .trailing)
                    }
                }
            }
        }
        .padding(20)
        .background(
            RoundedRectangle(cornerRadius: 24)
                .fill(.ultraThinMaterial)
                .overlay(
                    RoundedRectangle(cornerRadius: 24)
                        .stroke(Color.white.opacity(0.08), lineWidth: 1)
                )
        )
    }
}

// MARK: - Significant Earthquakes Section

struct SignificantQuakesSection: View {
    let earthquakes: [Earthquake]
    let onSelect: (Earthquake) -> Void
    
    var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            // Header
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Notable Events")
                        .font(.system(size: 18, weight: .bold))
                        .foregroundStyle(.white)
                    
                    Text("Magnitude 2.5+")
                        .font(.system(size: 12))
                        .foregroundStyle(.white.opacity(0.5))
                }
                
                Spacer()
                
                if !earthquakes.isEmpty {
                    Text("\(earthquakes.count)")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundStyle(.white)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .background(
                            Capsule()
                                .fill(
                                    LinearGradient(colors: [.red, .orange], startPoint: .leading, endPoint: .trailing)
                                )
                        )
                }
            }
            
            if earthquakes.isEmpty {
                // Empty state
                HStack {
                    Spacer()
                    VStack(spacing: 12) {
                        ZStack {
                            Circle()
                                .fill(
                                    RadialGradient(
                                        colors: [.green.opacity(0.2), Color.clear],
                                        center: .center,
                                        startRadius: 0,
                                        endRadius: 40
                                    )
                                )
                                .frame(width: 80, height: 80)
                            
                            Image(systemName: "checkmark.circle.fill")
                                .font(.system(size: 36))
                                .foregroundStyle(
                                    LinearGradient(colors: [.green, .mint], startPoint: .top, endPoint: .bottom)
                                )
                        }
                        
                        Text("No significant earthquakes")
                            .font(.system(size: 14, weight: .medium))
                            .foregroundStyle(.white.opacity(0.6))
                    }
                    .padding(.vertical, 24)
                    Spacer()
                }
            } else {
                // Earthquake list
                VStack(spacing: 10) {
                    ForEach(Array(earthquakes.prefix(5).enumerated()), id: \.element.id) { index, earthquake in
                        SignificantQuakeRow(earthquake: earthquake, index: index)
                            .onTapGesture {
                                onSelect(earthquake)
                            }
                    }
                }
            }
        }
        .padding(20)
        .background(
            RoundedRectangle(cornerRadius: 24)
                .fill(.ultraThinMaterial)
                .overlay(
                    RoundedRectangle(cornerRadius: 24)
                        .stroke(
                            LinearGradient(
                                colors: earthquakes.isEmpty ? [.green.opacity(0.2), Color.clear] : [.red.opacity(0.3), Color.clear],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            ),
                            lineWidth: 1
                        )
                )
        )
    }
}

struct SignificantQuakeRow: View {
    let earthquake: Earthquake
    let index: Int
    
    @State private var appear = false
    
    var body: some View {
        HStack(spacing: 14) {
            // Rank badge
            ZStack {
                Circle()
                    .fill(earthquake.magnitudeColor.opacity(0.2))
                    .frame(width: 48, height: 48)
                
                Text(String(format: "%.1f", earthquake.magnitude))
                    .font(.system(size: 16, weight: .black, design: .rounded))
                    .foregroundStyle(earthquake.magnitudeColor)
            }
            
            // Details
            VStack(alignment: .leading, spacing: 4) {
                Text(earthquake.place)
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(.white)
                    .lineLimit(1)
                
                HStack(spacing: 8) {
                    Label(earthquake.relativeTimeString, systemImage: "clock")
                    Label(String(format: "%.0fkm", earthquake.depth), systemImage: "arrow.down")
                }
                .font(.system(size: 10, weight: .medium))
                .foregroundStyle(.white.opacity(0.5))
            }
            
            Spacer()
            
            Image(systemName: "chevron.right")
                .font(.system(size: 11, weight: .semibold))
                .foregroundStyle(.white.opacity(0.3))
        }
        .padding(12)
        .background(
            RoundedRectangle(cornerRadius: 14)
                .fill(Color.white.opacity(0.03))
        )
        .offset(x: appear ? 0 : 30)
        .opacity(appear ? 1 : 0)
        .onAppear {
            withAnimation(.spring(response: 0.5, dampingFraction: 0.8).delay(Double(index) * 0.08)) {
                appear = true
            }
        }
    }
}

// MARK: - Premium Loading

struct PremiumHistoryLoading: View {
    @State private var shimmer = false
    @State private var pulse = false
    
    var body: some View {
        VStack(spacing: 24) {
            // Animated chart placeholder
            ZStack {
                // Background
                RoundedRectangle(cornerRadius: 24)
                    .fill(.ultraThinMaterial)
                    .frame(height: 200)
                
                // Animated bars
                HStack(alignment: .bottom, spacing: 16) {
                    ForEach(0..<5, id: \.self) { i in
                        RoundedRectangle(cornerRadius: 6)
                            .fill(
                                LinearGradient(
                                    colors: [.purple.opacity(pulse ? 0.4 : 0.2), .purple.opacity(pulse ? 0.2 : 0.1)],
                                    startPoint: .top,
                                    endPoint: .bottom
                                )
                            )
                            .frame(height: CGFloat([60, 100, 80, 120, 40][i]))
                    }
                }
                .padding(40)
            }
            
            VStack(spacing: 16) {
                ProgressView()
                    .progressViewStyle(CircularProgressViewStyle(tint: .purple))
                    .scaleEffect(1.2)
                
                Text("Loading history...")
                    .font(.system(size: 14, weight: .medium))
                    .foregroundStyle(.white.opacity(0.6))
            }
        }
        .padding(.vertical, 40)
        .onAppear {
            withAnimation(.easeInOut(duration: 1).repeatForever(autoreverses: true)) {
                pulse = true
            }
        }
    }
}

// MARK: - Premium Detail Sheet

struct PremiumHistoryDetailSheet: View {
    let earthquake: Earthquake
    @Environment(\.dismiss) private var dismiss
    @State private var appear = false
    
    var body: some View {
        NavigationStack {
            ZStack {
                // Background
                LinearGradient(
                    colors: [
                        Color(red: 0.08, green: 0.03, blue: 0.12),
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
                            HistorySheetDetailRow(icon: "mappin.circle.fill", label: "Location", value: earthquake.place, color: .blue)
                            Divider().background(Color.white.opacity(0.1))
                            HistorySheetDetailRow(icon: "clock.fill", label: "Time", value: formatTime(earthquake.time), color: .purple)
                            Divider().background(Color.white.opacity(0.1))
                            HistorySheetDetailRow(icon: "arrow.down.circle.fill", label: "Depth", value: String(format: "%.1f km", earthquake.depth), color: .cyan)
                            
                            if let felt = earthquake.felt, felt > 0 {
                                Divider().background(Color.white.opacity(0.1))
                                HistorySheetDetailRow(icon: "person.2.fill", label: "Felt Reports", value: "\(felt) people", color: .orange)
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
                                item: "\(earthquake.formattedMagnitude) earthquake \(earthquake.place)",
                                subject: Text("Earthquake Alert"),
                                message: Text("Historical earthquake data")
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
                                                LinearGradient(colors: [.purple, .pink], startPoint: .leading, endPoint: .trailing)
                                            )
                                    )
                                    .shadow(color: .purple.opacity(0.3), radius: 8)
                                }
                            }
                        }
                        .opacity(appear ? 1 : 0)
                    }
                    .padding(24)
                }
            }
            .navigationTitle("Event Details")
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
    }
    
    func formatTime(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "MMM d, yyyy 'at' h:mm a"
        return formatter.string(from: date)
    }
}

struct HistorySheetDetailRow: View {
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

// MARK: - Preview

#Preview {
    HistoryMainView()
        .preferredColorScheme(.dark)
}
