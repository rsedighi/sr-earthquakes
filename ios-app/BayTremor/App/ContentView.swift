//
//  ContentView.swift
//  BayTremor
//
//  Main navigation container with tab bar
//

import SwiftUI

struct ContentView: View {
    @State private var selectedTab: Tab = .live
    @State private var selectedEarthquakeId: String?
    
    enum Tab: String, CaseIterable {
        case live = "Live"
        case map = "Map"
        case myArea = "My Area"
        case history = "History"
        case settings = "Settings"
        
        var icon: String {
            switch self {
            case .live: return "waveform.path.ecg"
            case .map: return "map"
            case .myArea: return "location.fill"
            case .history: return "chart.bar"
            case .settings: return "gearshape"
            }
        }
    }
    
    var body: some View {
        TabView(selection: $selectedTab) {
            DashboardView(selectedEarthquakeId: $selectedEarthquakeId)
                .tabItem {
                    Label(Tab.live.rawValue, systemImage: Tab.live.icon)
                }
                .tag(Tab.live)
            
            MapTabView()
                .tabItem {
                    Label(Tab.map.rawValue, systemImage: Tab.map.icon)
                }
                .tag(Tab.map)
            
            MyAreaView()
                .tabItem {
                    Label(Tab.myArea.rawValue, systemImage: Tab.myArea.icon)
                }
                .tag(Tab.myArea)
            
            HistoryView()
                .tabItem {
                    Label(Tab.history.rawValue, systemImage: Tab.history.icon)
                }
                .tag(Tab.history)
            
            SettingsView()
                .tabItem {
                    Label(Tab.settings.rawValue, systemImage: Tab.settings.icon)
                }
                .tag(Tab.settings)
        }
        .tint(.white)
        .onReceive(NotificationCenter.default.publisher(for: .earthquakeNotificationTapped)) { notification in
            if let id = notification.userInfo?["id"] as? String {
                selectedEarthquakeId = id
                selectedTab = .live
            }
        }
    }
}

// MARK: - Placeholder Views (to be implemented)
struct MapTabView: View {
    var body: some View {
        NavigationStack {
            Text("Map View")
                .navigationTitle("Bay Area Map")
        }
    }
}

struct MyAreaView: View {
    var body: some View {
        NavigationStack {
            Text("My Area View")
                .navigationTitle("My Area")
        }
    }
}

struct HistoryView: View {
    var body: some View {
        NavigationStack {
            Text("History View")
                .navigationTitle("History")
        }
    }
}

struct SettingsView: View {
    var body: some View {
        NavigationStack {
            Text("Settings View")
                .navigationTitle("Settings")
        }
    }
}

#Preview {
    ContentView()
        .preferredColorScheme(.dark)
}
