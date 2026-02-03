//
//  MyAreaView.swift
//  BayTremor
//
//  Premium location-based earthquake view
//

import SwiftUI
import CoreLocation

struct MyAreaMainView: View {
    @StateObject private var locationManager = LocationManager()
    @AppStorage("selectedCity") private var selectedCity = "San Ramon"
    @State private var viewModel = MyAreaViewModel()
    @State private var selectedEarthquake: Earthquake?
    
    var body: some View {
        NavigationStack {
            ZStack {
                // Premium gradient background
                MyAreaBackground()
                
                ScrollView(showsIndicators: false) {
                    VStack(spacing: 20) {
                        // Compact Location Header
                        LocationHeaderCard(
                            cityName: selectedCity,
                            nearbyCount: viewModel.nearbyEarthquakes.count,
                            radiusMiles: viewModel.radiusMiles
                        )
                        
                        // Filter Controls
                        FilterControlsSection(
                            radius: $viewModel.radiusMiles,
                            minMagnitude: $viewModel.minMagnitude
                        )
                        
                        // Content
                        if viewModel.isLoading {
                            PremiumMyAreaLoading()
                        } else if viewModel.nearbyEarthquakes.isEmpty {
                            PremiumEmptyNearby(
                                cityName: selectedCity,
                                radius: viewModel.radiusMiles,
                                minMagnitude: viewModel.minMagnitude
                            )
                        } else {
                            // Stats Overview
                            NearbyStatsSection(earthquakes: viewModel.nearbyEarthquakes)
                            
                            // Earthquake List
                            NearbyListSection(
                                earthquakes: viewModel.nearbyEarthquakes,
                                cityCoordinate: viewModel.cityCoordinate,
                                onSelect: { selectedEarthquake = $0 }
                            )
                        }
                    }
                    .padding(.horizontal, 20)
                    .padding(.bottom, 100)
                }
            }
            .navigationTitle("My Area")
            .navigationBarTitleDisplayMode(.large)
            .toolbarBackground(.hidden, for: .navigationBar)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    NavigationLink {
                        CityPickerView(selectedCity: $selectedCity)
                    } label: {
                        ZStack {
                            Circle()
                                .fill(.ultraThinMaterial)
                                .frame(width: 36, height: 36)
                                .overlay(
                                    Circle()
                                        .stroke(Color.white.opacity(0.1), lineWidth: 1)
                                )
                            
                            Image(systemName: "location.circle.fill")
                                .font(.system(size: 16))
                                .foregroundStyle(
                                    LinearGradient(colors: [.blue, .cyan], startPoint: .top, endPoint: .bottom)
                                )
                        }
                    }
                }
            }
            .sheet(item: $selectedEarthquake) { earthquake in
                PremiumNearbyDetailSheet(earthquake: earthquake, cityCoordinate: viewModel.cityCoordinate)
            }
            .onChange(of: selectedCity) { _, newCity in
                viewModel.setCity(newCity)
            }
        }
        .task {
            viewModel.setCity(selectedCity)
            await viewModel.loadEarthquakes()
        }
    }
}

// MARK: - Background

struct MyAreaBackground: View {
    var body: some View {
        ZStack {
            // Base gradient
            LinearGradient(
                colors: [
                    Color(red: 0.02, green: 0.06, blue: 0.15),
                    Color(red: 0.02, green: 0.02, blue: 0.08),
                    Color.black
                ],
                startPoint: .top,
                endPoint: .bottom
            )
            .ignoresSafeArea()
        }
    }
}

// MARK: - Location Header Card

struct LocationHeaderCard: View {
    let cityName: String
    let nearbyCount: Int
    let radiusMiles: Double
    
    @State private var pulseAnimation = false
    
    var body: some View {
        HStack(spacing: 16) {
            // Location icon with pulse effect
            ZStack {
                // Pulse rings
                if nearbyCount > 0 {
                    Circle()
                        .stroke(Color.cyan.opacity(0.3), lineWidth: 1)
                        .frame(width: 56, height: 56)
                        .scaleEffect(pulseAnimation ? 1.3 : 1.0)
                        .opacity(pulseAnimation ? 0 : 0.8)
                }
                
                // Icon background
                Circle()
                    .fill(
                        LinearGradient(colors: [.blue, .cyan], startPoint: .topLeading, endPoint: .bottomTrailing)
                    )
                    .frame(width: 48, height: 48)
                    .shadow(color: .cyan.opacity(0.4), radius: 10)
                
                Image(systemName: "location.fill")
                    .font(.system(size: 20, weight: .semibold))
                    .foregroundStyle(.white)
            }
            .onAppear {
                if nearbyCount > 0 {
                    withAnimation(.easeOut(duration: 1.5).repeatForever(autoreverses: false)) {
                        pulseAnimation = true
                    }
                }
            }
            
            // Location info
            VStack(alignment: .leading, spacing: 4) {
                Text(cityName)
                    .font(.system(size: 20, weight: .bold))
                    .foregroundStyle(.white)
                
                Text("Bay Area, California")
                    .font(.system(size: 12, weight: .medium))
                    .foregroundStyle(.white.opacity(0.5))
            }
            
            Spacer()
            
            // Nearby count with status indicator
            VStack(alignment: .trailing, spacing: 4) {
                HStack(spacing: 6) {
                    Text("\(nearbyCount)")
                        .font(.system(size: 32, weight: .black, design: .rounded))
                        .foregroundStyle(nearbyCount > 0 ? .cyan : .white.opacity(0.4))
                }
                
                Text("within \(Int(radiusMiles))mi")
                    .font(.system(size: 10, weight: .semibold))
                    .foregroundStyle(.white.opacity(0.5))
                    .textCase(.uppercase)
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
                                colors: [.cyan.opacity(0.3), .blue.opacity(0.1), Color.clear],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            ),
                            lineWidth: 1
                        )
                )
        )
    }
}

// MARK: - Filter Controls Section

struct FilterControlsSection: View {
    @Binding var radius: Double
    @Binding var minMagnitude: Double
    
    var body: some View {
        VStack(spacing: 16) {
            // Radius Control
            PremiumSliderControl(
                title: "Search Radius",
                value: $radius,
                range: 5...50,
                step: 5,
                unit: "mi",
                icon: "circle.dashed",
                gradient: [.blue, .cyan]
            )
            
            // Magnitude Control
            PremiumMagnitudeControl(minMagnitude: $minMagnitude)
        }
    }
}

struct PremiumSliderControl: View {
    let title: String
    @Binding var value: Double
    let range: ClosedRange<Double>
    let step: Double
    let unit: String
    let icon: String
    let gradient: [Color]
    
    var body: some View {
        VStack(spacing: 14) {
            HStack {
                HStack(spacing: 8) {
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
                    
                    Text(title)
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(.white.opacity(0.8))
                }
                
                Spacer()
                
                Text("\(Int(value)) \(unit)")
                    .font(.system(size: 16, weight: .bold, design: .rounded))
                    .foregroundStyle(gradient[0])
            }
            
            // Custom slider track
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    // Track background
                    RoundedRectangle(cornerRadius: 6)
                        .fill(Color.white.opacity(0.1))
                        .frame(height: 8)
                    
                    // Fill
                    RoundedRectangle(cornerRadius: 6)
                        .fill(
                            LinearGradient(colors: gradient, startPoint: .leading, endPoint: .trailing)
                        )
                        .frame(width: max(0, geo.size.width * CGFloat((value - range.lowerBound) / (range.upperBound - range.lowerBound))), height: 8)
                        .shadow(color: gradient[0].opacity(0.5), radius: 4)
                    
                    // Thumb
                    Circle()
                        .fill(.white)
                        .frame(width: 24, height: 24)
                        .shadow(color: .black.opacity(0.3), radius: 4, y: 2)
                        .offset(x: max(0, geo.size.width * CGFloat((value - range.lowerBound) / (range.upperBound - range.lowerBound)) - 12))
                }
                .gesture(
                    DragGesture(minimumDistance: 0)
                        .onChanged { gesture in
                            let percent = min(max(0, gesture.location.x / geo.size.width), 1)
                            let newValue = range.lowerBound + (range.upperBound - range.lowerBound) * Double(percent)
                            value = (newValue / step).rounded() * step
                        }
                )
            }
            .frame(height: 24)
        }
        .padding(18)
        .background(
            RoundedRectangle(cornerRadius: 18)
                .fill(.ultraThinMaterial)
                .overlay(
                    RoundedRectangle(cornerRadius: 18)
                        .stroke(Color.white.opacity(0.08), lineWidth: 1)
                )
        )
    }
}

struct PremiumMagnitudeControl: View {
    @Binding var minMagnitude: Double
    
    let options: [(value: Double, label: String, color: Color)] = [
        (0.0, "All", .cyan),
        (1.0, "1.0+", .green),
        (2.0, "2.0+", .yellow),
        (3.0, "3.0+", .orange),
        (4.0, "4.0+", .red)
    ]
    
    var body: some View {
        VStack(spacing: 14) {
            HStack {
                HStack(spacing: 8) {
                    ZStack {
                        Circle()
                            .fill(
                                LinearGradient(colors: [currentColor, currentColor.opacity(0.7)], startPoint: .topLeading, endPoint: .bottomTrailing)
                            )
                            .frame(width: 32, height: 32)
                        
                        Image(systemName: "waveform")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundStyle(.white)
                    }
                    
                    Text("Minimum Magnitude")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(.white.opacity(0.8))
                }
                
                Spacer()
                
                Text(minMagnitude == 0 ? "All" : String(format: "M%.1f+", minMagnitude))
                    .font(.system(size: 16, weight: .bold, design: .rounded))
                    .foregroundStyle(currentColor)
            }
            
            // Pill buttons
            HStack(spacing: 8) {
                ForEach(options, id: \.value) { option in
                    Button {
                        withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                            minMagnitude = option.value
                        }
                    } label: {
                        Text(option.label)
                            .font(.system(size: 12, weight: .bold))
                            .foregroundStyle(minMagnitude == option.value ? .white : option.color)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 12)
                            .background(
                                RoundedRectangle(cornerRadius: 12)
                                    .fill(minMagnitude == option.value ?
                                          AnyShapeStyle(LinearGradient(colors: [option.color, option.color.opacity(0.7)], startPoint: .top, endPoint: .bottom)) :
                                          AnyShapeStyle(option.color.opacity(0.15))
                                    )
                                    .shadow(color: minMagnitude == option.value ? option.color.opacity(0.4) : .clear, radius: 8)
                            )
                    }
                    .buttonStyle(.plain)
                }
            }
        }
        .padding(18)
        .background(
            RoundedRectangle(cornerRadius: 18)
                .fill(.ultraThinMaterial)
                .overlay(
                    RoundedRectangle(cornerRadius: 18)
                        .stroke(Color.white.opacity(0.08), lineWidth: 1)
                )
        )
    }
    
    var currentColor: Color {
        options.first { $0.value == minMagnitude }?.color ?? .cyan
    }
}

// MARK: - Nearby Stats Section

struct NearbyStatsSection: View {
    let earthquakes: [Earthquake]
    
    var largestMag: Double {
        earthquakes.map(\.magnitude).max() ?? 0
    }
    
    var avgMag: Double {
        guard !earthquakes.isEmpty else { return 0 }
        return earthquakes.map(\.magnitude).reduce(0, +) / Double(earthquakes.count)
    }
    
    var body: some View {
        HStack(spacing: 12) {
            NearbyStatCard(
                title: "Largest",
                value: String(format: "%.1f", largestMag),
                icon: "arrow.up.circle.fill",
                gradient: gradientForMagnitude(largestMag)
            )
            
            NearbyStatCard(
                title: "Average",
                value: String(format: "%.1f", avgMag),
                icon: "chart.bar.fill",
                gradient: [.blue, .cyan]
            )
            
            NearbyStatCard(
                title: "Total",
                value: "\(earthquakes.count)",
                icon: "number.circle.fill",
                gradient: [.purple, .pink]
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

struct NearbyStatCard: View {
    let title: String
    let value: String
    let icon: String
    let gradient: [Color]
    
    @State private var appear = false
    
    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: icon)
                .font(.system(size: 20, weight: .semibold))
                .foregroundStyle(
                    LinearGradient(colors: gradient, startPoint: .top, endPoint: .bottom)
                )
            
            Text(value)
                .font(.system(size: 22, weight: .bold, design: .rounded))
                .foregroundStyle(.white)
            
            Text(title)
                .font(.system(size: 10, weight: .semibold))
                .foregroundStyle(.white.opacity(0.5))
                .textCase(.uppercase)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 16)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(.ultraThinMaterial)
                .overlay(
                    RoundedRectangle(cornerRadius: 16)
                        .stroke(
                            LinearGradient(
                                colors: [gradient[0].opacity(0.3), Color.clear],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            ),
                            lineWidth: 1
                        )
                )
        )
        .scaleEffect(appear ? 1 : 0.8)
        .opacity(appear ? 1 : 0)
        .onAppear {
            withAnimation(.spring(response: 0.5, dampingFraction: 0.7)) {
                appear = true
            }
        }
    }
}

// MARK: - Nearby List Section

struct NearbyListSection: View {
    let earthquakes: [Earthquake]
    let cityCoordinate: CLLocationCoordinate2D?
    let onSelect: (Earthquake) -> Void
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("Nearby Earthquakes")
                    .font(.system(size: 18, weight: .bold))
                    .foregroundStyle(.white)
                
                Spacer()
                
                Text("\(earthquakes.count) found")
                    .font(.system(size: 12, weight: .medium))
                    .foregroundStyle(.white.opacity(0.5))
            }
            
            LazyVStack(spacing: 12) {
                ForEach(Array(earthquakes.enumerated()), id: \.element.id) { index, earthquake in
                    NearbyQuakeRow(
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
        let cityLocation = CLLocation(latitude: coord.latitude, longitude: coord.longitude)
        return earthquake.distance(from: cityLocation)
    }
}

struct NearbyQuakeRow: View {
    let earthquake: Earthquake
    let distance: Double?
    let index: Int
    
    @State private var appear = false
    
    var body: some View {
        HStack(spacing: 14) {
            // Magnitude badge with glow
            ZStack {
                // Glow
                RoundedRectangle(cornerRadius: 14)
                    .fill(earthquake.magnitudeColor.opacity(0.3))
                    .frame(width: 60, height: 60)
                    .blur(radius: 8)
                
                // Badge
                VStack(spacing: 2) {
                    Text(String(format: "%.1f", earthquake.magnitude))
                        .font(.system(size: 20, weight: .black, design: .rounded))
                        .foregroundStyle(.white)
                    
                    if let dist = distance {
                        Text(String(format: "%.0fmi", dist))
                            .font(.system(size: 9, weight: .bold))
                            .foregroundStyle(.white.opacity(0.7))
                    }
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
                
                HStack(spacing: 10) {
                    HStack(spacing: 3) {
                        Image(systemName: "clock")
                            .font(.system(size: 9))
                        Text(earthquake.relativeTimeString)
                    }
                    
                    HStack(spacing: 3) {
                        Image(systemName: "arrow.down")
                            .font(.system(size: 9))
                        Text(String(format: "%.0fkm", earthquake.depth))
                    }
                }
                .font(.system(size: 11, weight: .medium))
                .foregroundStyle(.white.opacity(0.5))
                
                // Felt badge
                if let felt = earthquake.felt, felt > 0 {
                    HStack(spacing: 4) {
                        Image(systemName: "hand.raised.fill")
                            .font(.system(size: 9))
                        Text("\(felt) felt reports")
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

// MARK: - Premium Loading

struct PremiumMyAreaLoading: View {
    @State private var shimmer = false
    
    var body: some View {
        VStack(spacing: 16) {
            ForEach(0..<4, id: \.self) { _ in
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

// MARK: - Premium Empty State

struct PremiumEmptyNearby: View {
    let cityName: String
    let radius: Double
    let minMagnitude: Double
    
    @State private var pulseAnimation = false
    
    var body: some View {
        VStack(spacing: 24) {
            ZStack {
                // Glowing shield
                Circle()
                    .fill(
                        RadialGradient(
                            colors: [.green.opacity(0.3), Color.clear],
                            center: .center,
                            startRadius: 0,
                            endRadius: 80
                        )
                    )
                    .frame(width: 160, height: 160)
                    .scaleEffect(pulseAnimation ? 1.1 : 1.0)
                    .animation(.easeInOut(duration: 2).repeatForever(autoreverses: true), value: pulseAnimation)
                
                Image(systemName: "checkmark.shield.fill")
                    .font(.system(size: 60, weight: .medium))
                    .foregroundStyle(
                        LinearGradient(colors: [.green, .mint], startPoint: .top, endPoint: .bottom)
                    )
                    .shadow(color: .green.opacity(0.5), radius: 20)
            }
            
            VStack(spacing: 12) {
                Text("All Clear")
                    .font(.system(size: 24, weight: .bold))
                    .foregroundStyle(.white)
                
                Text("No earthquakes \(minMagnitude > 0 ? "M\(String(format: "%.1f", minMagnitude))+ " : "")within \(Int(radius)) miles of \(cityName)")
                    .font(.system(size: 14))
                    .foregroundStyle(.white.opacity(0.6))
                    .multilineTextAlignment(.center)
                
                if minMagnitude > 0 {
                    Text("Try lowering the minimum magnitude")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundStyle(.cyan.opacity(0.8))
                        .padding(.top, 4)
                }
            }
        }
        .padding(40)
        .onAppear { pulseAnimation = true }
    }
}

// MARK: - Premium Detail Sheet

struct PremiumNearbyDetailSheet: View {
    let earthquake: Earthquake
    let cityCoordinate: CLLocationCoordinate2D?
    @Environment(\.dismiss) private var dismiss
    @State private var appear = false
    
    var distance: Double? {
        guard let coord = cityCoordinate else { return nil }
        let location = CLLocation(latitude: coord.latitude, longitude: coord.longitude)
        return earthquake.distance(from: location)
    }
    
    var body: some View {
        NavigationStack {
            ZStack {
                // Background
                LinearGradient(
                    colors: [
                        Color(red: 0.02, green: 0.06, blue: 0.15),
                        Color.black
                    ],
                    startPoint: .top,
                    endPoint: .bottom
                )
                .ignoresSafeArea()
                
                ScrollView(showsIndicators: false) {
                    VStack(spacing: 28) {
                        // Magnitude & Distance Hero
                        HStack(spacing: 24) {
                            // Magnitude
                            VStack(spacing: 4) {
                                ZStack {
                                    Circle()
                                        .fill(earthquake.magnitudeColor.opacity(0.2))
                                        .frame(width: 100, height: 100)
                                        .blur(radius: 10)
                                    
                                    Text(String(format: "%.1f", earthquake.magnitude))
                                        .font(.system(size: 52, weight: .black, design: .rounded))
                                        .foregroundStyle(earthquake.magnitudeColor)
                                }
                                
                                Text(earthquake.magnitudeLabel)
                                    .font(.system(size: 12, weight: .bold))
                                    .foregroundStyle(earthquake.magnitudeColor)
                                    .textCase(.uppercase)
                            }
                            
                            // Divider
                            Rectangle()
                                .fill(Color.white.opacity(0.1))
                                .frame(width: 1, height: 80)
                            
                            // Distance
                            if let dist = distance {
                                VStack(spacing: 4) {
                                    ZStack {
                                        Circle()
                                            .fill(.cyan.opacity(0.2))
                                            .frame(width: 100, height: 100)
                                            .blur(radius: 10)
                                        
                                        VStack(spacing: 0) {
                                            Text(String(format: "%.0f", dist))
                                                .font(.system(size: 42, weight: .black, design: .rounded))
                                                .foregroundStyle(.cyan)
                                            Text("mi")
                                                .font(.system(size: 14, weight: .bold))
                                                .foregroundStyle(.cyan.opacity(0.7))
                                        }
                                    }
                                    
                                    Text("Distance")
                                        .font(.system(size: 12, weight: .bold))
                                        .foregroundStyle(.cyan)
                                        .textCase(.uppercase)
                                }
                            }
                        }
                        .scaleEffect(appear ? 1 : 0.5)
                        .opacity(appear ? 1 : 0)
                        
                        // Details Card
                        VStack(spacing: 0) {
                            NearbyDetailRow(icon: "mappin.circle.fill", label: "Location", value: earthquake.place, color: .blue)
                            Divider().background(Color.white.opacity(0.1))
                            NearbyDetailRow(icon: "clock.fill", label: "Time", value: formatTime(earthquake.time), color: .cyan)
                            Divider().background(Color.white.opacity(0.1))
                            NearbyDetailRow(icon: "arrow.down.circle.fill", label: "Depth", value: String(format: "%.1f km", earthquake.depth), color: .purple)
                            
                            if let felt = earthquake.felt, felt > 0 {
                                Divider().background(Color.white.opacity(0.1))
                                NearbyDetailRow(icon: "person.2.fill", label: "Felt Reports", value: "\(felt) people", color: .orange)
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
                                message: Text("Earthquake detected near me!")
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
                        }
                        .opacity(appear ? 1 : 0)
                    }
                    .padding(24)
                }
            }
            .navigationTitle("Nearby Quake")
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

struct NearbyDetailRow: View {
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
    MyAreaMainView()
        .preferredColorScheme(.dark)
}
