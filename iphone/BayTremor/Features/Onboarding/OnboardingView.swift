//
//  OnboardingView.swift
//  BayTremor
//
//  Welcome screen for first-time users
//

import SwiftUI

struct OnboardingView: View {
    @AppStorage("hasCompletedOnboarding") private var hasCompletedOnboarding = false
    @AppStorage("selectedCity") private var selectedCity = ""
    @State private var currentPage = 0
    
    var body: some View {
        ZStack {
            // Background
            Color.black.ignoresSafeArea()
            
            VStack {
                // Page content
                TabView(selection: $currentPage) {
                    WelcomePage()
                        .tag(0)
                    
                    FeaturesPage()
                        .tag(1)
                    
                    CitySelectionPage(selectedCity: $selectedCity)
                        .tag(2)
                    
                    NotificationPage(onComplete: completeOnboarding)
                        .tag(3)
                }
                .tabViewStyle(.page(indexDisplayMode: .never))
                
                // Page indicators
                HStack(spacing: 8) {
                    ForEach(0..<4, id: \.self) { index in
                        Circle()
                            .fill(index == currentPage ? Color.white : Color.white.opacity(0.3))
                            .frame(width: 8, height: 8)
                    }
                }
                .padding(.bottom, 20)
                
                // Navigation buttons
                HStack {
                    if currentPage > 0 {
                        Button("Back") {
                            withAnimation {
                                currentPage -= 1
                            }
                        }
                        .foregroundStyle(.secondary)
                    }
                    
                    Spacer()
                    
                    if currentPage < 3 {
                        Button {
                            withAnimation {
                                currentPage += 1
                            }
                        } label: {
                            HStack {
                                Text("Next")
                                Image(systemName: "arrow.right")
                            }
                            .fontWeight(.semibold)
                        }
                    }
                }
                .padding(.horizontal, 24)
                .padding(.bottom, 40)
            }
        }
    }
    
    func completeOnboarding() {
        if selectedCity.isEmpty {
            selectedCity = "San Ramon" // Default
        }
        hasCompletedOnboarding = true
    }
}

// MARK: - Welcome Page

struct WelcomePage: View {
    var body: some View {
        VStack(spacing: 24) {
            Spacer()
            
            // App icon representation
            ZStack {
                Circle()
                    .fill(
                        LinearGradient(
                            colors: [.blue, .purple],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .frame(width: 120, height: 120)
                
                Image(systemName: "waveform.path.ecg")
                    .font(.system(size: 50))
                    .foregroundStyle(.white)
            }
            
            VStack(spacing: 8) {
                Text("Bay Tremor")
                    .font(.largeTitle)
                    .fontWeight(.bold)
                
                Text("Bay Area Earthquake Tracker")
                    .font(.title3)
                    .foregroundStyle(.secondary)
            }
            
            Text("Stay informed about seismic activity\nin the San Francisco Bay Area")
                .multilineTextAlignment(.center)
                .foregroundStyle(.secondary)
                .padding(.horizontal, 40)
            
            Spacer()
            Spacer()
        }
    }
}

// MARK: - Features Page

struct FeaturesPage: View {
    var body: some View {
        VStack(spacing: 32) {
            Spacer()
            
            Text("Key Features")
                .font(.title)
                .fontWeight(.bold)
            
            VStack(alignment: .leading, spacing: 24) {
                FeatureRow(
                    icon: "waveform.path.ecg",
                    color: .blue,
                    title: "Real-Time Data",
                    description: "Live earthquake updates every 30 seconds from USGS"
                )
                
                FeatureRow(
                    icon: "map.fill",
                    color: .green,
                    title: "Interactive Map",
                    description: "See earthquakes plotted on a map with magnitude colors"
                )
                
                FeatureRow(
                    icon: "location.fill",
                    color: .orange,
                    title: "My Area",
                    description: "Track earthquakes near your city"
                )
                
                FeatureRow(
                    icon: "bell.fill",
                    color: .red,
                    title: "Alerts",
                    description: "Get notified about significant earthquakes"
                )
            }
            .padding(.horizontal, 24)
            
            Spacer()
            Spacer()
        }
    }
}

struct FeatureRow: View {
    let icon: String
    let color: Color
    let title: String
    let description: String
    
    var body: some View {
        HStack(spacing: 16) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundStyle(color)
                .frame(width: 44, height: 44)
                .background(color.opacity(0.15))
                .clipShape(Circle())
            
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .fontWeight(.semibold)
                
                Text(description)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
    }
}

// MARK: - City Selection Page

struct CitySelectionPage: View {
    @Binding var selectedCity: String
    
    let popularCities = [
        "San Francisco", "Oakland", "San Jose", "Berkeley",
        "Fremont", "San Ramon", "Palo Alto", "Walnut Creek"
    ]
    
    var body: some View {
        VStack(spacing: 24) {
            Spacer()
            
            Image(systemName: "location.circle.fill")
                .font(.system(size: 60))
                .foregroundStyle(.blue)
            
            VStack(spacing: 8) {
                Text("Select Your City")
                    .font(.title)
                    .fontWeight(.bold)
                
                Text("We'll show you nearby earthquakes")
                    .foregroundStyle(.secondary)
            }
            
            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                ForEach(popularCities, id: \.self) { city in
                    Button {
                        selectedCity = city
                    } label: {
                        Text(city)
                            .font(.subheadline)
                            .fontWeight(.medium)
                            .foregroundStyle(selectedCity == city ? .white : .primary)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 12)
                            .background(selectedCity == city ? Color.blue : Color.white.opacity(0.1))
                            .clipShape(RoundedRectangle(cornerRadius: 10))
                    }
                }
            }
            .padding(.horizontal, 24)
            
            Spacer()
            Spacer()
        }
    }
}

// MARK: - Notification Page

struct NotificationPage: View {
    let onComplete: () -> Void
    @State private var isRequesting = false
    
    var body: some View {
        VStack(spacing: 24) {
            Spacer()
            
            Image(systemName: "bell.badge.fill")
                .font(.system(size: 60))
                .foregroundStyle(.orange)
            
            VStack(spacing: 8) {
                Text("Stay Alert")
                    .font(.title)
                    .fontWeight(.bold)
                
                Text("Get notified when significant\nearthquakes occur near you")
                    .multilineTextAlignment(.center)
                    .foregroundStyle(.secondary)
            }
            
            VStack(spacing: 12) {
                Button {
                    requestNotifications()
                } label: {
                    HStack {
                        Image(systemName: "bell.fill")
                        Text("Enable Notifications")
                    }
                    .fontWeight(.semibold)
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.blue)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                }
                
                Button {
                    onComplete()
                } label: {
                    Text("Maybe Later")
                        .foregroundStyle(.secondary)
                }
            }
            .padding(.horizontal, 40)
            
            Spacer()
            Spacer()
        }
    }
    
    func requestNotifications() {
        isRequesting = true
        
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { granted, _ in
            DispatchQueue.main.async {
                isRequesting = false
                onComplete()
            }
        }
    }
}

// MARK: - Preview

#Preview {
    OnboardingView()
}
