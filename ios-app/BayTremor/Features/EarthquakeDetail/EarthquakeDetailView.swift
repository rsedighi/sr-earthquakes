//
//  EarthquakeDetailView.swift
//  BayTremor
//
//  Detailed view for a single earthquake
//

import SwiftUI
import MapKit

struct EarthquakeDetailView: View {
    let earthquake: Earthquake
    @Environment(\.dismiss) private var dismiss
    @StateObject private var locationService = LocationService.shared
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 24) {
                    // Magnitude Header
                    MagnitudeHeader(earthquake: earthquake)
                    
                    // Map
                    EarthquakeMapView(earthquake: earthquake)
                        .frame(height: 200)
                        .clipShape(RoundedRectangle(cornerRadius: 16))
                    
                    // Details
                    DetailSection(earthquake: earthquake, distance: userDistance)
                    
                    // Actions
                    ActionButtons(earthquake: earthquake)
                    
                    // "Did you feel it?" Section
                    FeltItSection()
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
    }
    
    var userDistance: Double? {
        locationService.distance(toEarthquake: earthquake)
    }
}

// MARK: - Magnitude Header

struct MagnitudeHeader: View {
    let earthquake: Earthquake
    
    var body: some View {
        VStack(spacing: 8) {
            // Magnitude circle
            Text(String(format: "%.1f", earthquake.magnitude))
                .font(.system(size: 72, weight: .bold))
                .foregroundStyle(earthquake.magnitudeColor)
            
            Text(earthquake.magnitudeLabel.uppercased())
                .font(.headline)
                .foregroundStyle(.secondary)
                .tracking(2)
        }
        .padding(.vertical)
    }
}

// MARK: - Map View

struct EarthquakeMapView: View {
    let earthquake: Earthquake
    
    var body: some View {
        Map {
            Marker(
                earthquake.formattedMagnitude,
                coordinate: earthquake.coordinate
            )
            .tint(earthquake.magnitudeColor)
        }
        .mapStyle(.standard(elevation: .realistic))
    }
}

// MARK: - Detail Section

struct DetailSection: View {
    let earthquake: Earthquake
    let distance: Double?
    
    var body: some View {
        VStack(spacing: 16) {
            DetailRow(
                icon: "mappin.circle.fill",
                label: "Location",
                value: earthquake.place
            )
            
            DetailRow(
                icon: "clock.fill",
                label: "Time",
                value: formattedTime
            )
            
            DetailRow(
                icon: "arrow.down.circle.fill",
                label: "Depth",
                value: String(format: "%.1f km (%.1f mi)", earthquake.depth, earthquake.depthInMiles)
            )
            
            if let felt = earthquake.felt, felt > 0 {
                DetailRow(
                    icon: "person.2.fill",
                    label: "Felt Reports",
                    value: "\(felt) people"
                )
            }
            
            if let distance = distance {
                DetailRow(
                    icon: "location.fill",
                    label: "Distance from You",
                    value: String(format: "%.1f miles", distance)
                )
            }
            
            DetailRow(
                icon: "mountain.2.fill",
                label: "Region",
                value: RegionService.getRegionName(byId: earthquake.regionId)
            )
        }
        .padding()
        .background(Color.white.opacity(0.05))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }
    
    var formattedTime: String {
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "MMM d, yyyy 'at' h:mm a"
        let timeString = dateFormatter.string(from: earthquake.time)
        return "\(timeString) (\(earthquake.relativeTimeString))"
    }
}

struct DetailRow: View {
    let icon: String
    let label: String
    let value: String
    
    var body: some View {
        HStack(alignment: .top) {
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

// MARK: - Action Buttons

struct ActionButtons: View {
    let earthquake: Earthquake
    
    var body: some View {
        HStack(spacing: 12) {
            // Share
            ShareLink(
                item: shareText,
                subject: Text("Earthquake Alert"),
                message: Text(shareText)
            ) {
                Label("Share", systemImage: "square.and.arrow.up")
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.bordered)
            
            // View on USGS
            if let url = URL(string: earthquake.url) {
                Link(destination: url) {
                    Label("USGS", systemImage: "safari")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.bordered)
            }
        }
    }
    
    var shareText: String {
        "\(earthquake.formattedMagnitude) earthquake detected \(earthquake.place) - \(earthquake.relativeTimeString). #BayTremor #Earthquake"
    }
}

// MARK: - Felt It Section

struct FeltItSection: View {
    @State private var hasReported = false
    
    var body: some View {
        VStack(spacing: 16) {
            Text("Did you feel this earthquake?")
                .font(.headline)
            
            if hasReported {
                HStack {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundStyle(.green)
                    Text("Thanks for your report!")
                }
                .font(.subheadline)
            } else {
                HStack(spacing: 12) {
                    Button {
                        hasReported = true
                        // TODO: Submit to API
                    } label: {
                        Text("Yes, I felt it")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.borderedProminent)
                    
                    Button {
                        hasReported = true
                    } label: {
                        Text("No, I didn't")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.bordered)
                }
            }
        }
        .padding()
        .background(Color.white.opacity(0.05))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }
}

// MARK: - Preview

#Preview {
    EarthquakeDetailView(
        earthquake: Earthquake(
            id: "test",
            magnitude: 3.5,
            place: "2 km N of San Ramon, CA",
            time: Date(),
            timestamp: Date().timeIntervalSince1970 * 1000,
            latitude: 37.7899,
            longitude: -121.978,
            depth: 8.5,
            felt: 47,
            significance: 200,
            url: "https://earthquake.usgs.gov",
            regionId: "san-ramon"
        )
    )
    .preferredColorScheme(.dark)
}
