# Bay Tremor - iOS App

Native iOS app for the Bay Area Earthquake Tracker.

## 📱 Features

- **Real-time Earthquake Feed** - Live updates from USGS every 30 seconds
- **Interactive Map** - Apple MapKit with earthquake markers
- **Push Notifications** - Alerts for earthquakes in your area
- **My Area** - Personalized view based on your location
- **Historical Data** - Browse past earthquakes
- **Home Screen Widgets** - Quick glance at latest activity

## 🛠 Requirements

- macOS 14.0+ (Sonoma)
- Xcode 15.0+
- iOS 17.0+ deployment target
- Apple Developer account (for push notifications)

## 🚀 Getting Started

### 1. Open the Project

```bash
cd iphone
open BayTremor.xcodeproj
```

> Note: You'll need to create the `.xcodeproj` file in Xcode first.

### 2. Create Xcode Project

1. Open Xcode
2. File → New → Project
3. Select "iOS" → "App"
4. Configure:
   - Product Name: **BayTremor**
   - Team: Your Apple Developer Team
   - Organization Identifier: `com.yourcompany`
   - Interface: **SwiftUI**
   - Language: **Swift**
   - Storage: **SwiftData**
5. Save to the `iphone` folder
6. Drag the `BayTremor` folder contents into the project

### 3. Configure Signing

1. Select the BayTremor target
2. Go to "Signing & Capabilities"
3. Select your Team
4. Add capabilities:
   - Push Notifications
   - Background Modes (Background fetch, Remote notifications)

### 4. Update API URL

Edit `Core/Services/APIClient.swift`:

```swift
private let baseURL: String = {
    #if DEBUG
    return "http://localhost:3000" // Your local dev server
    #else
    return "https://your-production-url.com"
    #endif
}()
```

### 5. Run the App

1. Select an iPhone simulator (or device)
2. Press ⌘+R to build and run

## 📂 Project Structure

```
BayTremor/
├── App/
│   ├── BayTremorApp.swift      # App entry point
│   ├── AppDelegate.swift       # Push notification handling
│   └── ContentView.swift       # Root navigation
│
├── Features/
│   ├── Dashboard/              # Live earthquake feed
│   ├── Map/                    # Full-screen map view
│   ├── EarthquakeDetail/       # Single earthquake details
│   ├── MyArea/                 # Location-based view
│   ├── History/                # Historical data
│   └── Settings/               # App settings
│
├── Core/
│   ├── Models/                 # Data models
│   ├── Services/               # API, Location, Notifications
│   └── Persistence/            # SwiftData managers
│
└── Design/
    └── Theme.swift             # Design system
```

## 🎨 Design System

The app uses a dark theme with seismic-inspired colors:

| Color | Hex | Usage |
|-------|-----|-------|
| Background | `#0a0a0a` | App background |
| Card | `#171717` | Card surfaces |
| Green | `#22c55e` | M < 2.0 |
| Yellow | `#eab308` | M 2.0 - 3.0 |
| Orange | `#f97316` | M 3.0 - 4.0 |
| Red | `#ef4444` | M 4.0 - 5.0 |
| Purple | `#a855f7` | M 5.0+ |

## 🔔 Push Notifications

### Backend Setup Required

To enable push notifications, you need to:

1. **Generate APNs Key** in Apple Developer Portal
2. **Create a notification worker** that:
   - Polls USGS every 10 seconds
   - Compares with stored earthquakes
   - Sends notifications via APNs for new significant quakes

See `/docs/IPHONE-APP-PLAN.md` for detailed architecture.

### Test Local Notifications

```swift
// In any view
NotificationService.shared.scheduleTestNotification()
```

## 🧪 Testing

### Unit Tests

```bash
# Run tests in Xcode
⌘+U
```

### UI Tests

```bash
# Run UI tests
⌘+U (with UI Tests scheme)
```

## 📦 Deployment

### TestFlight

1. Archive the app: Product → Archive
2. Distribute to TestFlight
3. Invite beta testers

### App Store

1. Prepare assets:
   - App icon (1024x1024)
   - Screenshots (6.7", 6.5", 5.5")
   - Privacy policy URL
2. Create App Store listing in App Store Connect
3. Submit for review

## 📄 API Endpoints Used

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/earthquakes` | GET | Fetch recent earthquakes |
| `/api/earthquake/:id` | GET | Single earthquake details |
| `/api/earthquakes/historical` | GET | Historical data |
| `/api/devices` | POST | Register device for push |
| `/api/devices/preferences` | PUT | Update notification prefs |

## 🔗 Related

- [Main Web App](../)
- [Development Plan](./IPHONE-APP-PLAN.md)
- [API Documentation](../app/api/)

## 📝 License

Private - All rights reserved
