//
//  MapView.swift
//  BayTremor
//
//  Full-screen map showing earthquake locations
//

import SwiftUI
import MapKit

struct EarthquakeMapView: View {
    @State private var viewModel = MapViewModel()
    @State private var selectedEarthquake: Earthquake?
    @State private var cameraPosition: MapCameraPosition = .region(
        MKCoordinateRegion(
            center: CLLocationCoordinate2D(latitude: 37.75, longitude: -122.0),
            span: MKCoordinateSpan(latitudeDelta: 1.5, longitudeDelta: 1.5)
        )
    )
    
    var body: some View {
        NavigationStack {
            ZStack(alignment: .bottom) {
                // Map
                Map(position: $cameraPosition, selection: $selectedEarthquake) {
                    ForEach(viewModel.earthquakes) { earthquake in
                        Annotation(
                            earthquake.formattedMagnitude,
                            coordinate: earthquake.coordinate,
                            anchor: .center
                        ) {
                            EarthquakeMapMarker(earthquake: earthquake)
                        }
                        .tag(earthquake)
                    }
                }
                .mapStyle(.standard(elevation: .realistic))
                .mapControls {
                    MapUserLocationButton()
                    MapCompass()
                    MapScaleView()
                }
                
                // Bottom info card
                if viewModel.isLoading {
                    LoadingCard()
                } else {
                    InfoCard(
                        count: viewModel.earthquakes.count,
                        filter: viewModel.selectedFilter,
                        onFilterChange: { filter in
                            viewModel.changeFilter(to: filter)
                        }
                    )
                }
            }
            .navigationTitle("Earthquake Map")
            .navigationBarTitleDisplayMode(.inline)
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
            .sheet(item: $selectedEarthquake) { earthquake in
                MapEarthquakeDetailSheet(earthquake: earthquake)
            }
        }
        .task {
            await viewModel.loadEarthquakes()
        }
    }
}

// MARK: - Map Earthquake Detail Sheet

struct MapEarthquakeDetailSheet: View {
    let earthquake: Earthquake
    @Environment(\.dismiss) private var dismiss
    @State private var isShowingDiscussion = false
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 24) {
                    // Magnitude Header
                    VStack(spacing: 8) {
                        Text(String(format: "%.1f", earthquake.magnitude))
                            .font(.system(size: 72, weight: .bold, design: .rounded))
                            .foregroundStyle(earthquake.magnitudeColor)
                        
                        Text(earthquake.magnitudeLabel.uppercased())
                            .font(.subheadline)
                            .fontWeight(.semibold)
                            .foregroundStyle(.secondary)
                            .tracking(2)
                    }
                    .padding(.top)
                    
                    // Details
                    VStack(spacing: 16) {
                        MapDetailRow(icon: "mappin.circle.fill", label: "Location", value: earthquake.place)
                        MapDetailRow(icon: "clock.fill", label: "Time", value: formatTime(earthquake.time))
                        MapDetailRow(icon: "arrow.down.circle.fill", label: "Depth", value: String(format: "%.1f km (%.1f mi)", earthquake.depth, earthquake.depthInMiles))
                        
                        if let felt = earthquake.felt, felt > 0 {
                            MapDetailRow(icon: "person.2.fill", label: "Felt Reports", value: "\(felt) people")
                        }
                    }
                    .padding()
                    .background(Color.white.opacity(0.05))
                    .clipShape(RoundedRectangle(cornerRadius: 16))
                    
                    // Actions
                    HStack(spacing: 12) {
                        ShareLink(
                            item: "\(earthquake.formattedMagnitude) earthquake \(earthquake.place)",
                            subject: Text("Earthquake Alert"),
                            message: Text("Bay Area earthquake detected!")
                        ) {
                            Label("Share", systemImage: "square.and.arrow.up")
                                .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.bordered)
                        
                        if let url = URL(string: earthquake.url), !earthquake.url.isEmpty {
                            Link(destination: url) {
                                Label("USGS", systemImage: "safari")
                                    .frame(maxWidth: .infinity)
                            }
                            .buttonStyle(.bordered)
                        }
                        
                        Button {
                            isShowingDiscussion = true
                        } label: {
                            Label("Discuss", systemImage: "message.fill")
                                .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.bordered)
                    }
                }
                .padding()
            }
            .background(Color.black)
            .navigationTitle("Earthquake Details")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        dismiss()
                    } label: {
                        Image(systemName: "xmark.circle.fill")
                            .foregroundStyle(.secondary)
                    }
                }
            }
        }
        .presentationDetents([.medium, .large])
        .presentationDragIndicator(.visible)
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

struct MapDetailRow: View {
    let icon: String
    let label: String
    let value: String
    
    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: icon)
                .foregroundStyle(.secondary)
                .frame(width: 24)
            
            VStack(alignment: .leading, spacing: 2) {
                Text(label)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                
                Text(value)
                    .font(.subheadline)
            }
            
            Spacer()
        }
    }
}

// MARK: - Map Marker

struct EarthquakeMapMarker: View {
    let earthquake: Earthquake
    
    var body: some View {
        ZStack {
            Circle()
                .fill(earthquake.magnitudeColor.opacity(0.3))
                .frame(width: markerSize + 12, height: markerSize + 12)
            
            Circle()
                .fill(earthquake.magnitudeColor)
                .frame(width: markerSize, height: markerSize)
            
            Text(String(format: "%.1f", earthquake.magnitude))
                .font(.system(size: fontSize, weight: .bold, design: .rounded))
                .foregroundStyle(.white)
        }
    }
    
    var markerSize: CGFloat {
        switch earthquake.magnitude {
        case ..<2.0: return 24
        case 2.0..<3.0: return 30
        case 3.0..<4.0: return 36
        case 4.0..<5.0: return 44
        default: return 52
        }
    }
    
    var fontSize: CGFloat {
        switch earthquake.magnitude {
        case ..<2.0: return 10
        case 2.0..<3.0: return 11
        case 3.0..<4.0: return 12
        case 4.0..<5.0: return 14
        default: return 16
        }
    }
}

// MARK: - Info Card

struct InfoCard: View {
    let count: Int
    let filter: TimeFilter
    let onFilterChange: (TimeFilter) -> Void
    
    var body: some View {
        VStack(spacing: 12) {
            // Stats
            HStack {
                VStack(alignment: .leading) {
                    Text("\(count) earthquakes")
                        .font(.headline)
                    Text(filter.rawValue.lowercased())
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                
                Spacer()
                
                // Filter menu
                Menu {
                    ForEach(TimeFilter.allCases, id: \.self) { timeFilter in
                        Button {
                            onFilterChange(timeFilter)
                        } label: {
                            Label(
                                timeFilter.rawValue,
                                systemImage: filter == timeFilter ? "checkmark" : ""
                            )
                        }
                    }
                } label: {
                    Image(systemName: "line.3.horizontal.decrease.circle")
                        .font(.title2)
                }
            }
            
            // Legend
            HStack(spacing: 16) {
                LegendItem(color: .green, label: "< 2.0")
                LegendItem(color: .yellow, label: "2-3")
                LegendItem(color: .orange, label: "3-4")
                LegendItem(color: .red, label: "4-5")
                LegendItem(color: .purple, label: "5+")
            }
            .font(.caption2)
        }
        .padding()
        .background(.ultraThinMaterial)
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .padding()
    }
}

struct LegendItem: View {
    let color: Color
    let label: String
    
    var body: some View {
        HStack(spacing: 4) {
            Circle()
                .fill(color)
                .frame(width: 10, height: 10)
            Text(label)
                .foregroundStyle(.secondary)
        }
    }
}

struct LoadingCard: View {
    var body: some View {
        HStack {
            ProgressView()
            Text("Loading earthquakes...")
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
        .padding()
        .background(.ultraThinMaterial)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding()
    }
}

// MARK: - Preview

#Preview {
    EarthquakeMapView()
        .preferredColorScheme(.dark)
}
