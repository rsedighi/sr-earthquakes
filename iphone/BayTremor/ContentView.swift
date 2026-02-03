//
//  ContentView.swift
//  BayTremor
//
//  Main navigation container with tab bar
//

import SwiftUI
import UserNotifications

struct ContentView: View {
    @AppStorage("hasCompletedOnboarding") private var hasCompletedOnboarding = false
    @State private var selectedTab: Tab = .live
    
    enum Tab: String, CaseIterable {
        case live = "Live"
        case map = "Map"
        case community = "Community"
        case myArea = "My Area"
        case history = "History"
        case settings = "Settings"
        
        var icon: String {
            switch self {
            case .live: return "waveform.path.ecg"
            case .map: return "map"
            case .community: return "message.fill"
            case .myArea: return "location.fill"
            case .history: return "chart.bar"
            case .settings: return "gearshape"
            }
        }
    }
    
    var body: some View {
        if !hasCompletedOnboarding {
            OnboardingView()
        } else {
            TabView(selection: $selectedTab) {
                DashboardView()
                    .tabItem {
                        Label(Tab.live.rawValue, systemImage: Tab.live.icon)
                    }
                    .tag(Tab.live)
                
                EarthquakeMapView()
                    .tabItem {
                        Label(Tab.map.rawValue, systemImage: Tab.map.icon)
                    }
                    .tag(Tab.map)
                
                CommunityMainView()
                    .tabItem {
                        Label(Tab.community.rawValue, systemImage: Tab.community.icon)
                    }
                    .tag(Tab.community)
                
                MyAreaMainView()
                    .tabItem {
                        Label(Tab.myArea.rawValue, systemImage: Tab.myArea.icon)
                    }
                    .tag(Tab.myArea)
                
                HistoryMainView()
                    .tabItem {
                        Label(Tab.history.rawValue, systemImage: Tab.history.icon)
                    }
                    .tag(Tab.history)
                
                SettingsMainView()
                    .tabItem {
                        Label(Tab.settings.rawValue, systemImage: Tab.settings.icon)
                    }
                    .tag(Tab.settings)
            }
            .tint(.white)
        }
    }
}

#Preview {
    ContentView()
        .preferredColorScheme(.dark)
}
