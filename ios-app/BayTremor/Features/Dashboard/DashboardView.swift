//
//  DashboardView.swift
//  BayTremor
//
//  Main dashboard showing live earthquake feed
//

import SwiftUI

struct DashboardView: View {
    @StateObject private var viewModel = DashboardViewModel()
    @Binding var selectedEarthquakeId: String?
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    // Header Stats
                    StatsHeaderView(
                        earthquakeCount: viewModel.earthquakes.count,
                        largestMagnitude: viewModel.largestMagnitude,
                        timeFilter: viewModel.timeFilter
                    )
                    
                    // Time Filter Picker
                    TimeFilterPicker(selection: $viewModel.timeFilter)
                    
                    // Earthquake List
                    if viewModel.isLoading {
                        LoadingView()
                    } else if let error = viewModel.error {
                        ErrorView(error: error) {
                            Task { await viewModel.refresh() }
                        }
                    } else if viewModel.earthquakes.isEmpty {
                        EmptyStateView(
                            icon: "waveform.path.ecg",
                            title: "No Earthquakes",
                            message: "No earthquakes detected in the selected time period."
                        )
                    } else {
                        EarthquakeListView(
                            earthquakes: viewModel.earthquakes,
                            onSelect: { earthquake in
                                selectedEarthquakeId = earthquake.id
                            }
                        )
                    }
                }
                .padding()
            }
            .background(Color.black)
            .navigationTitle("Bay Tremor")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        Task { await viewModel.refresh() }
                    } label: {
                        Image(systemName: viewModel.isRefreshing ? "arrow.triangle.2.circlepath" : "arrow.clockwise")
                            .rotationEffect(.degrees(viewModel.isRefreshing ? 360 : 0))
                            .animation(
                                viewModel.isRefreshing ? .linear(duration: 1).repeatForever(autoreverses: false) : .default,
                                value: viewModel.isRefreshing
                            )
                    }
                    .disabled(viewModel.isRefreshing)
                }
            }
            .refreshable {
                await viewModel.refresh()
            }
            .sheet(item: $viewModel.selectedEarthquake) { earthquake in
                EarthquakeDetailView(earthquake: earthquake)
            }
            .onChange(of: selectedEarthquakeId) { _, newId in
                if let id = newId,
                   let earthquake = viewModel.earthquakes.first(where: { $0.id == id }) {
                    viewModel.selectedEarthquake = earthquake
                    selectedEarthquakeId = nil
                }
            }
        }
        .task {
            await viewModel.loadEarthquakes()
        }
    }
}

// MARK: - Stats Header

struct StatsHeaderView: View {
    let earthquakeCount: Int
    let largestMagnitude: Double?
    let timeFilter: TimeFilter
    
    var body: some View {
        HStack(spacing: 16) {
            StatCard(
                value: "\(earthquakeCount)",
                label: "Earthquakes",
                icon: "waveform.path.ecg"
            )
            
            if let magnitude = largestMagnitude {
                StatCard(
                    value: String(format: "M%.1f", magnitude),
                    label: "Largest",
                    icon: "arrow.up.circle"
                )
            }
        }
    }
}

struct StatCard: View {
    let value: String
    let label: String
    let icon: String
    
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Image(systemName: icon)
                    .foregroundStyle(.secondary)
                Spacer()
            }
            
            Text(value)
                .font(.title)
                .fontWeight(.bold)
            
            Text(label)
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.white.opacity(0.05))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }
}

// MARK: - Time Filter Picker

struct TimeFilterPicker: View {
    @Binding var selection: TimeFilter
    
    var body: some View {
        Picker("Time", selection: $selection) {
            ForEach(TimeFilter.allCases, id: \.self) { filter in
                Text(filter.rawValue).tag(filter)
            }
        }
        .pickerStyle(.segmented)
    }
}

// MARK: - Earthquake List

struct EarthquakeListView: View {
    let earthquakes: [Earthquake]
    let onSelect: (Earthquake) -> Void
    
    var body: some View {
        LazyVStack(spacing: 12) {
            ForEach(earthquakes) { earthquake in
                EarthquakeCard(earthquake: earthquake)
                    .onTapGesture {
                        onSelect(earthquake)
                    }
            }
        }
    }
}

// MARK: - Earthquake Card

struct EarthquakeCard: View {
    let earthquake: Earthquake
    
    var body: some View {
        HStack(spacing: 12) {
            // Magnitude badge
            MagnitudeBadge(magnitude: earthquake.magnitude)
            
            // Details
            VStack(alignment: .leading, spacing: 4) {
                Text(earthquake.place)
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .lineLimit(1)
                
                HStack(spacing: 8) {
                    Label(earthquake.relativeTimeString, systemImage: "clock")
                    
                    Label(String(format: "%.1f km", earthquake.depth), systemImage: "arrow.down")
                }
                .font(.caption)
                .foregroundStyle(.secondary)
            }
            
            Spacer()
            
            // Chevron
            Image(systemName: "chevron.right")
                .foregroundStyle(.tertiary)
        }
        .padding()
        .background(Color.white.opacity(0.05))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }
}

// MARK: - Magnitude Badge

struct MagnitudeBadge: View {
    let magnitude: Double
    
    var body: some View {
        Text(String(format: "%.1f", magnitude))
            .font(.title2)
            .fontWeight(.bold)
            .foregroundStyle(.white)
            .frame(width: 50, height: 50)
            .background(magnitudeColor)
            .clipShape(Circle())
    }
    
    var magnitudeColor: Color {
        switch magnitude {
        case ..<2.0: return .green
        case 2.0..<3.0: return .yellow
        case 3.0..<4.0: return .orange
        case 4.0..<5.0: return .red
        default: return .purple
        }
    }
}

// MARK: - Supporting Views

struct LoadingView: View {
    var body: some View {
        VStack(spacing: 16) {
            ProgressView()
                .scaleEffect(1.5)
            Text("Loading earthquakes...")
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 60)
    }
}

struct ErrorView: View {
    let error: Error
    let onRetry: () -> Void
    
    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "exclamationmark.triangle")
                .font(.largeTitle)
                .foregroundStyle(.red)
            
            Text("Failed to load data")
                .font(.headline)
            
            Text(error.localizedDescription)
                .font(.caption)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
            
            Button("Retry", action: onRetry)
                .buttonStyle(.borderedProminent)
        }
        .padding()
    }
}

struct EmptyStateView: View {
    let icon: String
    let title: String
    let message: String
    
    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: icon)
                .font(.largeTitle)
                .foregroundStyle(.secondary)
            
            Text(title)
                .font(.headline)
            
            Text(message)
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding(.vertical, 60)
    }
}

// MARK: - Preview

#Preview {
    DashboardView(selectedEarthquakeId: .constant(nil))
        .preferredColorScheme(.dark)
}
