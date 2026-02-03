//
//  SettingsView.swift
//  BayTremor
//
//  Premium app settings and preferences
//

import SwiftUI

struct SettingsMainView: View {
    @AppStorage("notificationsEnabled") private var notificationsEnabled = true
    @AppStorage("minimumMagnitude") private var minimumMagnitude = 3.0
    @AppStorage("alertRadius") private var alertRadius = 25.0
    @AppStorage("hapticFeedback") private var hapticFeedback = true
    @AppStorage("selectedCity") private var selectedCity = "San Ramon"
    
    var body: some View {
        NavigationStack {
            ZStack {
                // Premium background
                SettingsBackground()
                
                ScrollView(showsIndicators: false) {
                    VStack(spacing: 24) {
                        // Location Section
                        SettingsSection(title: "Location", icon: "location.fill", iconGradient: [.blue, .cyan]) {
                            LocationSettingCard(cityName: selectedCity)
                        }
                        
                        // Notifications Section
                        SettingsSection(title: "Notifications", icon: "bell.fill", iconGradient: [.orange, .red]) {
                            VStack(spacing: 16) {
                                PremiumNotificationToggle(isEnabled: $notificationsEnabled)
                                
                                if notificationsEnabled {
                                    Divider()
                                        .background(Color.white.opacity(0.1))
                                    
                                    // Minimum Magnitude
                                    SettingsSliderRow(
                                        title: "Alert Threshold",
                                        subtitle: "Minimum magnitude to trigger alerts",
                                        value: $minimumMagnitude,
                                        range: 1.0...5.0,
                                        step: 0.5,
                                        valueLabel: String(format: "M%.1f+", minimumMagnitude),
                                        gradient: [.orange, .red]
                                    )
                                    
                                    Divider()
                                        .background(Color.white.opacity(0.1))
                                    
                                    // Alert Radius
                                    SettingsSliderRow(
                                        title: "Alert Radius",
                                        subtitle: "Distance from your city",
                                        value: $alertRadius,
                                        range: 5...100,
                                        step: 5,
                                        valueLabel: "\(Int(alertRadius)) miles",
                                        gradient: [.blue, .cyan]
                                    )
                                }
                            }
                        }
                        
                        // Experience Section
                        SettingsSection(title: "Experience", icon: "sparkles", iconGradient: [.purple, .pink]) {
                            PremiumHapticToggle(isEnabled: $hapticFeedback)
                        }
                        
                        // About Section
                        SettingsSection(title: "About", icon: "info.circle.fill", iconGradient: [.gray, .white.opacity(0.6)]) {
                            VStack(spacing: 0) {
                                SettingsLinkRow(
                                    icon: "globe",
                                    title: "USGS Earthquake Data",
                                    subtitle: "Data source",
                                    color: .blue
                                ) {
                                    if let url = URL(string: "https://earthquake.usgs.gov") {
                                        UIApplication.shared.open(url)
                                    }
                                }
                                
                                Divider()
                                    .background(Color.white.opacity(0.1))
                                
                                SettingsLinkRow(
                                    icon: "lock.shield.fill",
                                    title: "Privacy Policy",
                                    subtitle: "How we handle your data",
                                    color: .green
                                ) {
                                    if let url = URL(string: "https://baytremor.com/privacy") {
                                        UIApplication.shared.open(url)
                                    }
                                }
                                
                                Divider()
                                    .background(Color.white.opacity(0.1))
                                
                                NavigationLink {
                                    PremiumAboutView()
                                } label: {
                                    SettingsRowContent(
                                        icon: "heart.fill",
                                        title: "About Bay Tremor",
                                        subtitle: "Version 1.0.0",
                                        color: .pink,
                                        showChevron: true
                                    )
                                }
                            }
                        }
                    }
                    .padding(.horizontal, 20)
                    .padding(.bottom, 100)
                }
            }
            .navigationTitle("Settings")
            .navigationBarTitleDisplayMode(.large)
            .toolbarBackground(.hidden, for: .navigationBar)
        }
    }
}

// MARK: - Background

struct SettingsBackground: View {
    var body: some View {
        LinearGradient(
            colors: [
                Color(red: 0.06, green: 0.04, blue: 0.10),
                Color(red: 0.02, green: 0.02, blue: 0.06),
                Color.black
            ],
            startPoint: .top,
            endPoint: .bottom
        )
        .ignoresSafeArea()
    }
}

// MARK: - Settings Section

struct SettingsSection<Content: View>: View {
    let title: String
    let icon: String
    let iconGradient: [Color]
    @ViewBuilder let content: Content
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Section header
            HStack(spacing: 10) {
                ZStack {
                    Circle()
                        .fill(
                            LinearGradient(colors: iconGradient, startPoint: .topLeading, endPoint: .bottomTrailing)
                        )
                        .frame(width: 28, height: 28)
                    
                    Image(systemName: icon)
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(.white)
                }
                
                Text(title)
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(.white.opacity(0.7))
                    .textCase(.uppercase)
                    .tracking(1)
            }
            .padding(.leading, 4)
            
            // Section content
            content
                .padding(16)
                .background(
                    RoundedRectangle(cornerRadius: 20)
                        .fill(.ultraThinMaterial)
                        .overlay(
                            RoundedRectangle(cornerRadius: 20)
                                .stroke(
                                    LinearGradient(
                                        colors: [iconGradient[0].opacity(0.3), Color.clear],
                                        startPoint: .topLeading,
                                        endPoint: .bottomTrailing
                                    ),
                                    lineWidth: 1
                                )
                        )
                )
        }
    }
}

// MARK: - Location Setting Card

struct LocationSettingCard: View {
    let cityName: String
    
    var body: some View {
        NavigationLink {
            CityPickerView(selectedCity: .constant(cityName))
        } label: {
            HStack(spacing: 14) {
                ZStack {
                    Circle()
                        .fill(
                            LinearGradient(colors: [.blue, .cyan], startPoint: .topLeading, endPoint: .bottomTrailing)
                        )
                        .frame(width: 44, height: 44)
                        .shadow(color: .cyan.opacity(0.4), radius: 8)
                    
                    Image(systemName: "location.fill")
                        .font(.system(size: 18, weight: .semibold))
                        .foregroundStyle(.white)
                }
                
                VStack(alignment: .leading, spacing: 4) {
                    Text("My City")
                        .font(.system(size: 11, weight: .medium))
                        .foregroundStyle(.white.opacity(0.5))
                    
                    Text(cityName)
                        .font(.system(size: 16, weight: .bold))
                        .foregroundStyle(.white)
                }
                
                Spacer()
                
                Text("Change")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(.cyan)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(
                        Capsule()
                            .fill(Color.cyan.opacity(0.15))
                    )
            }
        }
    }
}

// MARK: - Premium Notification Toggle

struct PremiumNotificationToggle: View {
    @Binding var isEnabled: Bool
    
    var body: some View {
        Button {
            withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                isEnabled.toggle()
            }
            let generator = UIImpactFeedbackGenerator(style: .medium)
            generator.impactOccurred()
        } label: {
            HStack(spacing: 14) {
                // Icon with animated background
                ZStack {
                    Circle()
                        .fill(isEnabled ?
                              AnyShapeStyle(LinearGradient(colors: [.green, .mint], startPoint: .topLeading, endPoint: .bottomTrailing)) :
                              AnyShapeStyle(Color.gray.opacity(0.2))
                        )
                        .frame(width: 44, height: 44)
                        .shadow(color: isEnabled ? .green.opacity(0.4) : .clear, radius: 8)
                    
                    Image(systemName: isEnabled ? "bell.badge.fill" : "bell.slash.fill")
                        .font(.system(size: 18, weight: .semibold))
                        .foregroundStyle(.white)
                        .symbolEffect(.bounce, value: isEnabled)
                }
                
                // Text content
                VStack(alignment: .leading, spacing: 4) {
                    Text("Push Notifications")
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundStyle(.white)
                    
                    Text(isEnabled ? "You'll receive earthquake alerts" : "Notifications are disabled")
                        .font(.system(size: 12))
                        .foregroundStyle(.white.opacity(0.5))
                }
                
                Spacer()
                
                // Premium toggle
                PremiumToggle(isOn: isEnabled, activeColor: .green)
            }
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Premium Haptic Toggle

struct PremiumHapticToggle: View {
    @Binding var isEnabled: Bool
    
    var body: some View {
        Button {
            withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                isEnabled.toggle()
            }
            if isEnabled {
                let generator = UIImpactFeedbackGenerator(style: .medium)
                generator.impactOccurred()
            }
        } label: {
            HStack(spacing: 14) {
                // Icon
                ZStack {
                    Circle()
                        .fill(isEnabled ?
                              AnyShapeStyle(LinearGradient(colors: [.purple, .pink], startPoint: .topLeading, endPoint: .bottomTrailing)) :
                              AnyShapeStyle(Color.gray.opacity(0.2))
                        )
                        .frame(width: 44, height: 44)
                        .shadow(color: isEnabled ? .purple.opacity(0.4) : .clear, radius: 8)
                    
                    Image(systemName: "hand.tap.fill")
                        .font(.system(size: 18, weight: .semibold))
                        .foregroundStyle(.white)
                        .symbolEffect(.bounce, value: isEnabled)
                }
                
                // Text
                VStack(alignment: .leading, spacing: 4) {
                    Text("Haptic Feedback")
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundStyle(.white)
                    
                    Text(isEnabled ? "Feel vibrations on interactions" : "Haptics are disabled")
                        .font(.system(size: 12))
                        .foregroundStyle(.white.opacity(0.5))
                }
                
                Spacer()
                
                // Premium toggle
                PremiumToggle(isOn: isEnabled, activeColor: .purple)
            }
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Premium Toggle

struct PremiumToggle: View {
    let isOn: Bool
    let activeColor: Color
    
    var body: some View {
        ZStack {
            // Track
            Capsule()
                .fill(isOn ?
                      AnyShapeStyle(LinearGradient(colors: [activeColor, activeColor.opacity(0.8)], startPoint: .leading, endPoint: .trailing)) :
                      AnyShapeStyle(Color.white.opacity(0.15))
                )
                .frame(width: 52, height: 32)
                .shadow(color: isOn ? activeColor.opacity(0.4) : .clear, radius: 6)
            
            // Thumb
            Circle()
                .fill(.white)
                .frame(width: 26, height: 26)
                .shadow(color: .black.opacity(0.2), radius: 2, y: 1)
                .offset(x: isOn ? 10 : -10)
        }
    }
}

// MARK: - Settings Slider Row

struct SettingsSliderRow: View {
    let title: String
    let subtitle: String
    @Binding var value: Double
    let range: ClosedRange<Double>
    let step: Double
    let valueLabel: String
    let gradient: [Color]
    
    var body: some View {
        VStack(spacing: 14) {
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(.white)
                    
                    Text(subtitle)
                        .font(.system(size: 11))
                        .foregroundStyle(.white.opacity(0.5))
                }
                
                Spacer()
                
                Text(valueLabel)
                    .font(.system(size: 14, weight: .bold, design: .rounded))
                    .foregroundStyle(gradient[0])
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(
                        Capsule()
                            .fill(gradient[0].opacity(0.15))
                    )
            }
            
            // Custom slider
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    // Track
                    Capsule()
                        .fill(Color.white.opacity(0.1))
                        .frame(height: 6)
                    
                    // Fill
                    Capsule()
                        .fill(
                            LinearGradient(colors: gradient, startPoint: .leading, endPoint: .trailing)
                        )
                        .frame(width: max(0, geo.size.width * CGFloat((value - range.lowerBound) / (range.upperBound - range.lowerBound))), height: 6)
                        .shadow(color: gradient[0].opacity(0.5), radius: 4)
                    
                    // Thumb
                    Circle()
                        .fill(.white)
                        .frame(width: 22, height: 22)
                        .shadow(color: .black.opacity(0.2), radius: 3, y: 1)
                        .offset(x: max(0, geo.size.width * CGFloat((value - range.lowerBound) / (range.upperBound - range.lowerBound)) - 11))
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
            .frame(height: 22)
        }
    }
}

// MARK: - Settings Link Row

struct SettingsLinkRow: View {
    let icon: String
    let title: String
    let subtitle: String
    let color: Color
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            SettingsRowContent(
                icon: icon,
                title: title,
                subtitle: subtitle,
                color: color,
                showChevron: false,
                showExternalLink: true
            )
        }
    }
}

struct SettingsRowContent: View {
    let icon: String
    let title: String
    let subtitle: String
    let color: Color
    var showChevron: Bool = false
    var showExternalLink: Bool = false
    
    var body: some View {
        HStack(spacing: 14) {
            ZStack {
                Circle()
                    .fill(color.opacity(0.2))
                    .frame(width: 36, height: 36)
                
                Image(systemName: icon)
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundStyle(color)
            }
            
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(.white)
                
                Text(subtitle)
                    .font(.system(size: 11))
                    .foregroundStyle(.white.opacity(0.5))
            }
            
            Spacer()
            
            if showChevron {
                Image(systemName: "chevron.right")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(.white.opacity(0.3))
            }
            
            if showExternalLink {
                Image(systemName: "arrow.up.right")
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundStyle(.white.opacity(0.3))
            }
        }
        .padding(.vertical, 8)
    }
}

// MARK: - City Picker

struct CityPickerView: View {
    @Binding var selectedCity: String
    @Environment(\.dismiss) private var dismiss
    
    let cities = [
        "San Francisco", "Oakland", "Berkeley", "San Jose", "Palo Alto",
        "Mountain View", "Sunnyvale", "Santa Clara", "Fremont", "Hayward",
        "San Ramon", "Dublin", "Pleasanton", "Livermore", "Walnut Creek",
        "Concord", "Richmond", "San Mateo", "Redwood City", "Daly City",
        "San Rafael", "Vallejo", "Santa Rosa", "Napa"
    ].sorted()
    
    @State private var searchText = ""
    
    var filteredCities: [String] {
        if searchText.isEmpty {
            return cities
        }
        return cities.filter { $0.localizedCaseInsensitiveContains(searchText) }
    }
    
    var body: some View {
        ZStack {
            SettingsBackground()
            
            ScrollView {
                LazyVStack(spacing: 8) {
                    ForEach(filteredCities, id: \.self) { city in
                        CityRow(
                            city: city,
                            isSelected: city == selectedCity
                        ) {
                            selectedCity = city
                            dismiss()
                        }
                    }
                }
                .padding(.horizontal, 20)
                .padding(.bottom, 100)
            }
        }
        .searchable(text: $searchText, prompt: "Search cities")
        .navigationTitle("Select City")
        .navigationBarTitleDisplayMode(.inline)
    }
}

struct CityRow: View {
    let city: String
    let isSelected: Bool
    let onTap: () -> Void
    
    var body: some View {
        Button(action: onTap) {
            HStack(spacing: 14) {
                ZStack {
                    Circle()
                        .fill(isSelected ?
                              AnyShapeStyle(LinearGradient(colors: [.blue, .cyan], startPoint: .topLeading, endPoint: .bottomTrailing)) :
                              AnyShapeStyle(Color.white.opacity(0.1))
                        )
                        .frame(width: 36, height: 36)
                    
                    Image(systemName: isSelected ? "checkmark" : "building.2")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(isSelected ? .white : .white.opacity(0.5))
                }
                
                Text(city)
                    .font(.system(size: 15, weight: isSelected ? .bold : .medium))
                    .foregroundStyle(.white)
                
                Spacer()
                
                if isSelected {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.system(size: 20))
                        .foregroundStyle(.cyan)
                }
            }
            .padding(14)
            .background(
                Group {
                    if isSelected {
                        RoundedRectangle(cornerRadius: 14)
                            .fill(Color.cyan.opacity(0.1))
                    } else {
                        RoundedRectangle(cornerRadius: 14)
                            .fill(.ultraThinMaterial)
                    }
                }
            )
            .overlay(
                RoundedRectangle(cornerRadius: 14)
                    .stroke(isSelected ? Color.cyan.opacity(0.3) : Color.white.opacity(0.08), lineWidth: 1)
            )
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Premium About View

struct PremiumAboutView: View {
    @State private var appear = false
    
    var body: some View {
        ZStack {
            SettingsBackground()
            
            ScrollView(showsIndicators: false) {
                VStack(spacing: 32) {
                    // App Icon Hero
                    ZStack {
                        // Glow
                        Circle()
                            .fill(
                                RadialGradient(
                                    colors: [.cyan.opacity(0.3), Color.clear],
                                    center: .center,
                                    startRadius: 0,
                                    endRadius: 80
                                )
                            )
                            .frame(width: 160, height: 160)
                        
                        // Icon
                        ZStack {
                            RoundedRectangle(cornerRadius: 28)
                                .fill(
                                    LinearGradient(
                                        colors: [.blue, .cyan],
                                        startPoint: .topLeading,
                                        endPoint: .bottomTrailing
                                    )
                                )
                                .frame(width: 100, height: 100)
                                .shadow(color: .cyan.opacity(0.5), radius: 20)
                            
                            Image(systemName: "waveform.path.ecg.rectangle")
                                .font(.system(size: 44, weight: .medium))
                                .foregroundStyle(.white)
                        }
                    }
                    .scaleEffect(appear ? 1 : 0.8)
                    .opacity(appear ? 1 : 0)
                    
                    // App Name
                    VStack(spacing: 8) {
                        Text("Bay Tremor")
                            .font(.system(size: 32, weight: .bold))
                            .foregroundStyle(.white)
                        
                        Text("Bay Area Earthquake Tracker")
                            .font(.system(size: 14, weight: .medium))
                            .foregroundStyle(.white.opacity(0.6))
                    }
                    .opacity(appear ? 1 : 0)
                    
                    // Description
                    Text("Real-time earthquake information for the San Francisco Bay Area. Data sourced from the United States Geological Survey (USGS) and updated every 30 seconds.")
                        .font(.system(size: 14))
                        .foregroundStyle(.white.opacity(0.6))
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 32)
                        .opacity(appear ? 1 : 0)
                    
                    // Info Cards
                    VStack(spacing: 12) {
                        AboutInfoRow(icon: "globe", title: "Data Source", value: "USGS Earthquake Hazards Program", color: .blue)
                        AboutInfoRow(icon: "map", title: "Coverage Area", value: "SF Bay Area (9 Counties)", color: .cyan)
                        AboutInfoRow(icon: "clock.arrow.circlepath", title: "Update Frequency", value: "Every 30 seconds", color: .purple)
                    }
                    .padding(.horizontal, 20)
                    .opacity(appear ? 1 : 0)
                    .offset(y: appear ? 0 : 20)
                    
                    Spacer(minLength: 60)
                    
                    // Footer
                    Text("Made with ❤️ for the Bay Area")
                        .font(.system(size: 13, weight: .medium))
                        .foregroundStyle(.white.opacity(0.4))
                        .opacity(appear ? 1 : 0)
                }
                .padding(.top, 40)
                .padding(.bottom, 100)
            }
        }
        .navigationTitle("About")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear {
            withAnimation(.spring(response: 0.7, dampingFraction: 0.8)) {
                appear = true
            }
        }
    }
}

struct AboutInfoRow: View {
    let icon: String
    let title: String
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
                Text(title)
                    .font(.system(size: 11, weight: .medium))
                    .foregroundStyle(.white.opacity(0.5))
                
                Text(value)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(.white)
            }
            
            Spacer()
        }
        .padding(14)
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

// MARK: - Preview

#Preview {
    SettingsMainView()
        .preferredColorScheme(.dark)
}
