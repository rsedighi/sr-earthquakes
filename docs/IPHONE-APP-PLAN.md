# Bay Area Earthquake Tracker - iPhone App Development Plan

## Executive Summary

This document outlines the complete plan for building a standalone native iPhone app for the Bay Area Earthquake Tracker. The app will provide real-time earthquake monitoring, personalized alerts, and community features optimized for the mobile experience.

---

## 1. Technology Stack Decision

### Recommended: **SwiftUI + Swift (Native iOS)**

| Option | Pros | Cons | Recommendation |
|--------|------|------|----------------|
| **SwiftUI (Native)** | Best performance, native UX, push notifications, background refresh, App Clips, widgets, Apple Maps | iOS only, steeper learning curve | ✅ **Recommended** |
| React Native | Code sharing with web, faster dev if React-skilled | Larger bundle, less native feel, bridge overhead | ❌ |
| Flutter | Cross-platform, good performance | Different language (Dart), separate codebase | ❌ |

**Why Native Swift/SwiftUI:**
1. **Push Notifications** - Critical for earthquake alerts (requires native APNs integration)
2. **Background App Refresh** - Monitor earthquakes even when app is closed
3. **Widgets** - Home screen widgets showing latest earthquakes
4. **Apple Maps** - Native integration, better than web-based maps on iOS
5. **Performance** - Real-time updates require optimal performance
6. **App Clips** - Quick access without full install (future feature)
7. **Apple Watch** - Future companion app possibility

---

## 2. Feature Parity Matrix

| Web Feature | iPhone App | Priority | Notes |
|-------------|------------|----------|-------|
| Real-time earthquake feed | ✅ | P0 | Core feature |
| Interactive map | ✅ | P0 | Apple MapKit |
| Push notifications | ✅ | P0 | **iOS exclusive advantage** |
| My Neighborhood | ✅ | P0 | GPS-based location |
| Earthquake detail view | ✅ | P0 | Full detail with share sheet |
| Region comparison | ✅ | P1 | Charts with Swift Charts |
| Historical data | ✅ | P1 | 10-year history |
| Explorer/Filters | ✅ | P1 | Native UI controls |
| Community reports | ✅ | P2 | "Did you feel it?" |
| Fault line map | ✅ | P2 | MapKit overlays |
| Home screen widgets | ✅ (NEW) | P1 | **iOS exclusive** |
| Apple Watch app | ✅ (NEW) | P3 | Future expansion |
| Siri shortcuts | ✅ (NEW) | P2 | "Hey Siri, any earthquakes?" |
| Live Activities | ✅ (NEW) | P1 | Dynamic Island during swarms |

---

## 3. App Architecture

### 3.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     iPhone App (SwiftUI)                     │
├─────────────────────────────────────────────────────────────┤
│  Presentation Layer                                          │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐│
│  │   Views     │ │  ViewModels │ │  Navigation/Coordinator ││
│  │  (SwiftUI)  │ │ (Observable)│ │                         ││
│  └─────────────┘ └─────────────┘ └─────────────────────────┘│
├─────────────────────────────────────────────────────────────┤
│  Domain Layer                                                │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐│
│  │   Models    │ │  Use Cases  │ │  Business Logic         ││
│  │             │ │             │ │                         ││
│  └─────────────┘ └─────────────┘ └─────────────────────────┘│
├─────────────────────────────────────────────────────────────┤
│  Data Layer                                                  │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐│
│  │  API Client │ │ Local Cache │ │  Push Notification      ││
│  │  (URLSession)│ │ (SwiftData) │ │  Service (APNs)        ││
│  └─────────────┘ └─────────────┘ └─────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend Services                          │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌──────────────────────────────────┐  │
│  │ Next.js API     │  │ Push Notification Server (NEW)   │  │
│  │ (existing)      │  │ (Node.js + APNs)                 │  │
│  └─────────────────┘  └──────────────────────────────────┘  │
│           │                        │                         │
│           ▼                        ▼                         │
│  ┌─────────────────┐  ┌──────────────────────────────────┐  │
│  │ USGS GeoJSON    │  │ MongoDB (device tokens, prefs)   │  │
│  │ API             │  │                                  │  │
│  └─────────────────┘  └──────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Project Structure

```
BayTremor/
├── App/
│   ├── BayTremorApp.swift              # App entry point
│   ├── AppDelegate.swift               # Push notification handling
│   └── ContentView.swift               # Root navigation
│
├── Features/
│   ├── Dashboard/
│   │   ├── DashboardView.swift
│   │   ├── DashboardViewModel.swift
│   │   └── Components/
│   │       ├── EarthquakeCard.swift
│   │       ├── QuickStatsView.swift
│   │       └── ActivityIndicator.swift
│   │
│   ├── Map/
│   │   ├── MapView.swift
│   │   ├── MapViewModel.swift
│   │   ├── EarthquakeAnnotation.swift
│   │   └── FaultLineOverlay.swift
│   │
│   ├── EarthquakeDetail/
│   │   ├── EarthquakeDetailView.swift
│   │   ├── EarthquakeDetailViewModel.swift
│   │   └── ShareSheetView.swift
│   │
│   ├── MyArea/
│   │   ├── MyAreaView.swift
│   │   ├── MyAreaViewModel.swift
│   │   └── LocationSearchView.swift
│   │
│   ├── History/
│   │   ├── HistoryView.swift
│   │   ├── HistoryViewModel.swift
│   │   └── TimelineView.swift
│   │
│   ├── Explorer/
│   │   ├── ExplorerView.swift
│   │   ├── ExplorerViewModel.swift
│   │   └── FilterChipView.swift
│   │
│   ├── Settings/
│   │   ├── SettingsView.swift
│   │   ├── NotificationSettingsView.swift
│   │   └── AboutView.swift
│   │
│   └── Community/
│       ├── CommunityView.swift
│       ├── ReportFeelingView.swift
│       └── CommunityViewModel.swift
│
├── Core/
│   ├── Models/
│   │   ├── Earthquake.swift
│   │   ├── Region.swift
│   │   ├── SwarmEvent.swift
│   │   └── UserPreferences.swift
│   │
│   ├── Services/
│   │   ├── APIClient.swift
│   │   ├── USGSService.swift
│   │   ├── LocationService.swift
│   │   ├── NotificationService.swift
│   │   └── AnalyticsService.swift
│   │
│   ├── Persistence/
│   │   ├── SwiftDataManager.swift
│   │   ├── CacheManager.swift
│   │   └── UserDefaultsManager.swift
│   │
│   └── Utilities/
│       ├── DateFormatters.swift
│       ├── DistanceCalculator.swift
│       ├── MagnitudeHelper.swift
│       └── HapticFeedback.swift
│
├── Design/
│   ├── Theme/
│   │   ├── Colors.swift
│   │   ├── Typography.swift
│   │   └── Spacing.swift
│   │
│   └── Components/
│       ├── MagnitudeBadge.swift
│       ├── LoadingView.swift
│       ├── ErrorView.swift
│       └── EmptyStateView.swift
│
├── Extensions/
│   ├── Date+Extensions.swift
│   ├── Color+Extensions.swift
│   └── View+Extensions.swift
│
├── Widgets/
│   ├── LatestQuakeWidget.swift
│   ├── QuakeCountWidget.swift
│   └── NearbyQuakeWidget.swift
│
├── WatchApp/ (Future)
│   └── ...
│
└── Resources/
    ├── Assets.xcassets
    ├── Localizable.strings
    └── bay-area-faults.json
```

---

## 4. Core Data Models (Swift)

```swift
// Earthquake.swift
import Foundation
import SwiftData

@Model
class Earthquake: Identifiable {
    @Attribute(.unique) var id: String
    var magnitude: Double
    var place: String
    var time: Date
    var timestamp: TimeInterval
    var latitude: Double
    var longitude: Double
    var depth: Double
    var felt: Int?
    var significance: Int
    var url: String
    var regionId: String
    
    var coordinate: CLLocationCoordinate2D {
        CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
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
    
    var magnitudeLabel: String {
        switch magnitude {
        case ..<2.0: return "Micro"
        case 2.0..<3.0: return "Minor"
        case 3.0..<4.0: return "Light"
        case 4.0..<5.0: return "Moderate"
        case 5.0..<6.0: return "Strong"
        default: return "Major"
        }
    }
}

// Region.swift
struct Region: Identifiable, Codable {
    let id: String
    let name: String
    let description: String
    let bounds: Bounds
    let color: String
    let faultLine: String
    let areaCode: String
    let county: String
    
    struct Bounds: Codable {
        let minLat: Double
        let maxLat: Double
        let minLon: Double
        let maxLon: Double
    }
}

// UserPreferences.swift
@Model
class UserPreferences {
    var selectedCityName: String?
    var selectedCityLat: Double?
    var selectedCityLon: Double?
    var notificationsEnabled: Bool = true
    var minimumMagnitudeAlert: Double = 3.0
    var alertRadiusMiles: Double = 25.0
    var showFeltEarthquakesOnly: Bool = false
    var hapticFeedbackEnabled: Bool = true
}
```

---

## 5. API Integration

### 5.1 Existing API Endpoints (Reuse from Web)

```swift
enum APIEndpoint {
    case earthquakes(feed: FeedType)
    case earthquakeDetail(id: String)
    case historicalData(startDate: Date, endDate: Date)
    case communityReports
    
    enum FeedType: String {
        case hour = "all_hour"
        case day = "all_day"
        case week = "all_week"
    }
    
    var path: String {
        switch self {
        case .earthquakes(let feed):
            return "/api/earthquakes?feed=\(feed.rawValue)"
        case .earthquakeDetail(let id):
            return "/api/earthquake/\(id)"
        case .historicalData:
            return "/api/earthquakes/historical"
        case .communityReports:
            return "/api/community"
        }
    }
}
```

### 5.2 New Backend Requirements for iOS

```typescript
// NEW: app/api/devices/route.ts - Device registration for push notifications
export async function POST(request: NextRequest) {
  const { deviceToken, userId, preferences } = await request.json();
  
  // Store in MongoDB
  await db.collection('devices').updateOne(
    { deviceToken },
    { 
      $set: { 
        userId,
        preferences,
        platform: 'ios',
        updatedAt: new Date()
      }
    },
    { upsert: true }
  );
  
  return NextResponse.json({ success: true });
}

// NEW: Push notification worker (separate service)
// Monitors USGS feed and sends APNs notifications
```

---

## 6. Push Notification System

### 6.1 Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   USGS Feed     │────▶│  Monitor Worker │────▶│  APNs Provider  │
│   (10s polling) │     │  (Node.js)      │     │  (Apple)        │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │                        │
                               ▼                        ▼
                        ┌─────────────────┐     ┌─────────────────┐
                        │    MongoDB      │     │   iPhone App    │
                        │ (device tokens) │     │   (receives)    │
                        └─────────────────┘     └─────────────────┘
```

### 6.2 Notification Types

| Type | Trigger | Content | Priority |
|------|---------|---------|----------|
| **Significant Earthquake** | M3.5+ within user radius | "M4.2 earthquake 8mi from San Ramon" | High (immediate) |
| **Felt Report** | 50+ felt reports | "Many people felt earthquake near Oakland" | Medium |
| **Swarm Alert** | 5+ quakes in 1 hour | "Earthquake swarm detected near San Ramon" | Medium |
| **Daily Summary** | 6 PM local time | "Today: 12 earthquakes, largest M2.8" | Low |
| **Breaking** | M5.0+ anywhere in Bay Area | Critical alert | Critical |

### 6.3 Implementation

```swift
// NotificationService.swift
import UserNotifications

class NotificationService {
    static let shared = NotificationService()
    
    func requestPermission() async -> Bool {
        let center = UNUserNotificationCenter.current()
        do {
            let granted = try await center.requestAuthorization(
                options: [.alert, .sound, .badge, .criticalAlert]
            )
            return granted
        } catch {
            return false
        }
    }
    
    func registerForRemoteNotifications() {
        DispatchQueue.main.async {
            UIApplication.shared.registerForRemoteNotifications()
        }
    }
}

// AppDelegate.swift
func application(
    _ application: UIApplication,
    didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data
) {
    let token = deviceToken.map { String(format: "%02.2hhx", $0) }.joined()
    Task {
        await APIClient.shared.registerDevice(token: token)
    }
}
```

---

## 7. Widget Implementation

### 7.1 Widget Types

#### Latest Earthquake Widget (Small)
```
┌─────────────────────┐
│  🔴 M3.2           │
│  Near San Ramon     │
│  2 min ago          │
└─────────────────────┘
```

#### Quake Count Widget (Medium)
```
┌───────────────────────────────────┐
│  BAY AREA TODAY                   │
│  ████████░░░░░░░░░░░ 12 quakes    │
│  Largest: M3.8 near Oakland       │
│  Your area: 2 within 10mi         │
└───────────────────────────────────┘
```

#### Map Widget (Large)
```
┌───────────────────────────────────────────┐
│                                           │
│        [Mini Map with dots]               │
│                                           │
│  ─────────────────────────────────────    │
│  🔴 M3.2 San Ramon    🟡 M2.1 Hayward    │
│  🟢 M1.8 Fremont      🟢 M1.5 Oakland    │
└───────────────────────────────────────────┘
```

### 7.2 Implementation

```swift
// LatestQuakeWidget.swift
import WidgetKit
import SwiftUI

struct LatestQuakeWidget: Widget {
    let kind = "LatestQuakeWidget"
    
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: QuakeProvider()) { entry in
            LatestQuakeWidgetView(entry: entry)
        }
        .configurationDisplayName("Latest Earthquake")
        .description("Shows the most recent earthquake in the Bay Area")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

struct QuakeProvider: TimelineProvider {
    func getTimeline(in context: Context, completion: @escaping (Timeline<QuakeEntry>) -> Void) {
        Task {
            let earthquakes = try? await USGSService.shared.fetchLatest()
            let entry = QuakeEntry(date: Date(), earthquake: earthquakes?.first)
            
            // Refresh every 5 minutes
            let nextUpdate = Calendar.current.date(byAdding: .minute, value: 5, to: Date())!
            let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
            completion(timeline)
        }
    }
}
```

---

## 8. UI/UX Design System

### 8.1 Design Principles

1. **Dark Mode First** - Matches web app aesthetic
2. **Seismic Color System** - Consistent magnitude colors
3. **Haptic Feedback** - Tactile response for interactions
4. **Accessibility** - VoiceOver, Dynamic Type support
5. **One-Handed Use** - Bottom-heavy navigation

### 8.2 Color Palette

```swift
// Colors.swift
extension Color {
    static let background = Color(hex: "#0a0a0a")
    static let cardBackground = Color(hex: "#171717")
    static let border = Color.white.opacity(0.1)
    
    // Magnitude colors
    static let magnitudeMicro = Color.green
    static let magnitudeMinor = Color.yellow
    static let magnitudeLight = Color.orange
    static let magnitudeModerate = Color.red
    static let magnitudeStrong = Color.purple
    
    // Accent
    static let accent = Color.blue
}
```

### 8.3 Tab Bar Structure

```
┌─────────────────────────────────────────────────────────────┐
│                        App Content                          │
├─────────────────────────────────────────────────────────────┤
│  🏠 Live  │  🗺️ Map  │  📍 My Area  │  📊 History │  ⚙️ More │
└─────────────────────────────────────────────────────────────┘
```

---

## 9. Development Timeline

### Phase 1: Foundation (Weeks 1-3)
- [ ] Set up Xcode project with SwiftUI
- [ ] Implement data models (Earthquake, Region, etc.)
- [ ] Create API client and USGS service
- [ ] Build basic earthquake list view
- [ ] Implement local caching with SwiftData

### Phase 2: Core Features (Weeks 4-6)
- [ ] Dashboard view with live feed
- [ ] MapKit integration with annotations
- [ ] Earthquake detail view
- [ ] Pull-to-refresh functionality
- [ ] Basic filtering (time, magnitude)

### Phase 3: Location & Personalization (Weeks 7-8)
- [ ] My Area view with GPS location
- [ ] City selection picker
- [ ] Distance calculations
- [ ] Location-based filtering

### Phase 4: Push Notifications (Weeks 9-10)
- [ ] APNs integration
- [ ] Backend notification worker
- [ ] Device token registration
- [ ] Notification preferences UI
- [ ] Background app refresh

### Phase 5: Advanced Features (Weeks 11-12)
- [ ] Earthquake Explorer with filters
- [ ] Historical data view
- [ ] Region comparison charts
- [ ] Fault line overlays on map

### Phase 6: Widgets & Polish (Weeks 13-14)
- [ ] Home screen widgets (3 sizes)
- [ ] Haptic feedback
- [ ] Animations and transitions
- [ ] Accessibility audit
- [ ] Performance optimization

### Phase 7: Testing & Launch (Weeks 15-16)
- [ ] Unit tests
- [ ] UI tests
- [ ] TestFlight beta
- [ ] App Store assets preparation
- [ ] App Store submission

---

## 10. App Store Requirements

### 10.1 App Store Listing

| Field | Content |
|-------|---------|
| **App Name** | Bay Tremor - Earthquake Tracker |
| **Subtitle** | Real-time Bay Area Quake Alerts |
| **Category** | Weather (primary), News (secondary) |
| **Price** | Free (with optional premium) |
| **Age Rating** | 4+ |

### 10.2 Required Assets

- [ ] App icon (1024x1024)
- [ ] Screenshots (6.7", 6.5", 5.5")
- [ ] App preview video (optional)
- [ ] Privacy policy URL
- [ ] Support URL

### 10.3 Privacy & Permissions

| Permission | Usage Description |
|------------|-------------------|
| Location (When In Use) | "To show earthquakes near you and calculate distances" |
| Notifications | "To alert you about significant earthquakes in your area" |
| Background App Refresh | "To keep earthquake data current" |

### 10.4 Privacy Nutrition Label

- **Data Collected**: Location (optional), Device ID (for notifications)
- **Data Linked to User**: None
- **Tracking**: None

---

## 11. Monetization Strategy (Optional)

### Free Tier
- Real-time earthquake feed
- Basic notifications (M4.0+)
- 7-day history
- 1 saved location

### Premium Tier ($2.99/month or $19.99/year)
- Custom notification thresholds
- Multiple saved locations (up to 5)
- 10-year historical data
- Advanced filters
- No ads
- Exclusive widgets

---

## 12. Technical Considerations

### 12.1 Offline Support
```swift
// Strategy: Cache last 100 earthquakes locally
// Show cached data immediately, then refresh
// Indicate stale data with timestamp
```

### 12.2 Background Refresh
```swift
// Enable background fetch
// Refresh every 15 minutes minimum
// Update widgets on data change
```

### 12.3 Performance Targets
| Metric | Target |
|--------|--------|
| App launch (cold) | < 2 seconds |
| API response | < 500ms |
| Map render | < 1 second |
| Memory usage | < 100MB |
| Battery impact | Minimal |

### 12.4 Analytics (via Datadog or Firebase)
- Screen views
- Feature usage
- Notification engagement
- Crash reporting
- Performance monitoring

---

## 13. Testing Strategy

### Unit Tests
- API response parsing
- Distance calculations
- Magnitude color mapping
- Date formatting

### UI Tests
- Navigation flows
- Pull-to-refresh
- Earthquake selection
- Settings changes

### Integration Tests
- API connectivity
- Push notification delivery
- Widget updates
- Location services

---

## 14. Future Roadmap

### Version 1.1
- Apple Watch companion app
- Siri Shortcuts ("Any earthquakes today?")
- Live Activities for swarms

### Version 1.2
- CarPlay support
- Community reports ("I felt it")
- Social sharing improvements

### Version 2.0
- Multiple regions (LA, Pacific Northwest)
- Earthquake prediction discussions
- Expert insights

---

## 15. Development Environment Setup

### Requirements
- macOS 14+ (Sonoma)
- Xcode 15+
- iOS 17+ target
- Apple Developer account ($99/year)

### Initial Setup
```bash
# Clone template
git clone [ios-app-repo]

# Open in Xcode
open BayTremor.xcodeproj

# Install dependencies (if using SPM)
# Xcode handles automatically

# Run on simulator
# ⌘ + R
```

### Recommended Swift Packages
- **Alamofire** - Networking (or use native URLSession)
- **Kingfisher** - Image caching (if needed)
- **SwiftLint** - Code style enforcement
- **Datadog SDK** - Analytics (optional)

---

## 16. Backend Modifications Required

### 16.1 New Endpoints

```typescript
// POST /api/devices - Register device for push notifications
// GET /api/devices/:id/preferences - Get notification preferences
// PUT /api/devices/:id/preferences - Update preferences
// DELETE /api/devices/:id - Unregister device
```

### 16.2 Push Notification Worker

Create a new service (can be deployed separately):

```
push-worker/
├── index.ts              # Main entry
├── services/
│   ├── usgs-monitor.ts   # Polls USGS every 10s
│   ├── notification.ts   # Sends to APNs
│   └── device-store.ts   # MongoDB queries
├── utils/
│   └── apns-client.ts    # APNs connection
└── package.json
```

---

## 17. Summary & Next Steps

### Immediate Actions
1. **Create Apple Developer Account** if not already done
2. **Create Xcode project** with the proposed structure
3. **Set up API client** to connect to existing backend
4. **Build earthquake list view** as first feature

### Key Decisions Needed
- [ ] Monetization approach (free vs freemium)
- [ ] Analytics provider (Datadog vs Firebase)
- [ ] Push notification service (own server vs Firebase Cloud Messaging)
- [ ] Design system (custom vs Apple HIG strict)

### Success Metrics
| Metric | Target (Month 3) |
|--------|------------------|
| Downloads | 10,000 |
| DAU | 2,000 |
| Push opt-in rate | 70% |
| App Store rating | 4.5+ |
| Crash-free sessions | 99.5% |

---

## Appendix A: Screen Mockups (Text)

### Dashboard (Live Tab)
```
┌─────────────────────────────────────────────────────────────┐
│ ◀ Bay Tremor                              ⚙️               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📍 SAN RAMON, CA                            🔔 Alerts ON   │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                     [MAP VIEW]                        │  │
│  │        🔴    🟡         🟢                            │  │
│  │                  🟢                                   │  │
│  │      🟡                      🔴                       │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  RECENT EARTHQUAKES                          See All ▶     │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ 🔴 M3.2   Near San Ramon           2 min ago        ▶ │  │
│  ├───────────────────────────────────────────────────────┤  │
│  │ 🟡 M2.4   7 km E of Danville       18 min ago       ▶ │  │
│  ├───────────────────────────────────────────────────────┤  │
│  │ 🟢 M1.8   3 km SE of Dublin        1 hour ago       ▶ │  │
│  ├───────────────────────────────────────────────────────┤  │
│  │ 🟢 M1.5   Near Pleasanton          2 hours ago      ▶ │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  🏠 Live  │  🗺️ Map  │  📍 My Area  │  📊 History │  ••• │
└─────────────────────────────────────────────────────────────┘
```

### Earthquake Detail
```
┌─────────────────────────────────────────────────────────────┐
│ ◀ Back                                    Share  📤        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                        M 3.2                                │
│                    MODERATE                                 │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                     [MAP VIEW]                        │  │
│  │                        📍                             │  │
│  │                                                       │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  📍  2.3 km N of San Ramon, CA                             │
│  🕐  Today at 2:34 PM (3 minutes ago)                      │
│  📏  Depth: 8.2 km (5.1 mi)                                │
│  👥  Felt by: 127 people                                   │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  DISTANCE FROM YOU                                          │
│  📍 4.2 miles from San Ramon                               │
│                                                             │
│  FAULT LINE                                                 │
│  ⚠️  Calaveras Fault                                       │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │           Did you feel this earthquake?                │  │
│  │                                                        │  │
│  │    [ Yes, I felt it ]    [ No, I didn't ]             │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  🔗 View on USGS Website                             ▶ │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

*Document Version: 1.0*  
*Created: February 2026*  
*Last Updated: February 2026*
