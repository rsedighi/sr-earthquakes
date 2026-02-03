# Bay Tremor - App Store Submission Guide

This guide will walk you through everything needed to submit Bay Tremor to the Apple App Store.

---

## ✅ Pre-Submission Checklist

### Code & Configuration (COMPLETED)
- [x] iOS deployment target set to 18.0
- [x] Bundle identifier: `com.baytremor.app`
- [x] Marketing version: 1.0.0
- [x] Build number: 1
- [x] Info.plist with privacy descriptions
- [x] PrivacyInfo.xcprivacy manifest
- [x] App category: Weather
- [x] All required privacy usage descriptions

### Assets (ACTION REQUIRED)
- [ ] **App Icon** - Create 1024x1024 PNG (see instructions below)
- [ ] **Screenshots** - 5 screenshots for each device size
- [ ] **App Preview Video** (optional but recommended)

### App Store Connect (ACTION REQUIRED)
- [ ] Create app record in App Store Connect
- [ ] Privacy Policy URL
- [ ] Support URL  
- [ ] Marketing URL (optional)
- [ ] App Store description
- [ ] Keywords
- [ ] What's New text

---

## 📱 App Icon Requirements

You need to create **3 versions** of your 1024x1024 app icon:

1. **AppIcon-1024.png** - Light mode icon
2. **AppIcon-1024-dark.png** - Dark mode icon  
3. **AppIcon-1024-tinted.png** - Tinted icon (monochrome)

### Icon Design Guidelines
- Size: 1024x1024 pixels
- Format: PNG
- Color Space: sRGB
- No transparency (use solid background)
- No rounded corners (iOS adds them automatically)

### Suggested Design
Based on the app's About screen, the icon should feature:
- A seismograph waveform symbol (`waveform.path.ecg.rectangle`)
- Blue-to-cyan gradient background
- Clean, modern look matching the premium UI

### Where to Place Icons
```
iphone/BayTremor/Assets.xcassets/AppIcon.appiconset/
├── AppIcon-1024.png
├── AppIcon-1024-dark.png
├── AppIcon-1024-tinted.png
└── Contents.json
```

---

## 📸 Screenshot Requirements

### Required Device Sizes
| Device | Resolution | Required? |
|--------|------------|-----------|
| iPhone 6.7" (15 Pro Max) | 1290 × 2796 | Yes |
| iPhone 6.5" (14 Plus) | 1284 × 2778 | Yes |
| iPhone 5.5" (8 Plus) | 1242 × 2208 | Optional |
| iPad Pro 12.9" | 2048 × 2732 | If supporting iPad |

### Recommended Screenshots (5 per device)
1. **Dashboard** - Show live earthquake feed with activity level
2. **Map View** - Earthquake locations on Apple Maps
3. **My Area** - Location-based nearby earthquakes
4. **History** - Charts and statistics
5. **Detail View** - Individual earthquake details

### Screenshot Tips
- Use clean, real data (avoid placeholder/mock data)
- Capture during time with earthquake activity
- Show the premium dark UI
- Include device frames (optional but professional)

---

## 📝 App Store Metadata

### App Name
```
Bay Tremor
```

### Subtitle (30 characters max)
```
Bay Area Earthquake Tracker
```

### Description (4000 characters max)
```
Track earthquakes in real-time across the San Francisco Bay Area with Bay Tremor – your essential seismic monitoring companion.

🔴 LIVE EARTHQUAKE TRACKING
Stay informed with real-time updates from the USGS (United States Geological Survey). Our data refreshes every 30 seconds to bring you the latest seismic activity across all 9 Bay Area counties.

📍 MY AREA
Set your city and get personalized earthquake information. See which quakes are closest to you, with distance calculations and customizable radius filters.

🗺️ INTERACTIVE MAP
Visualize earthquake locations on a beautiful Apple Maps integration. Color-coded magnitude markers make it easy to spot significant events at a glance.

📊 HISTORICAL DATA & CHARTS
Explore earthquake history with stunning visualizations:
• Magnitude distribution charts
• 24-hour activity timeline
• Depth analysis
• Significant event tracking

⚙️ CUSTOMIZABLE ALERTS
Configure notification thresholds to get alerts only for earthquakes that matter to you:
• Set minimum magnitude (M1.0 to M5.0)
• Define alert radius (5-100 miles)
• Enable felt earthquake notifications

🎨 PREMIUM DESIGN
Experience a beautifully crafted dark interface with:
• Animated seismic visualizations
• Haptic feedback for interactions
• Smooth transitions and premium materials
• Accessibility support

COVERAGE AREA
Bay Tremor covers the entire San Francisco Bay Area including:
San Francisco, Oakland, San Jose, Berkeley, Fremont, Hayward, San Ramon, Dublin, Pleasanton, Livermore, Walnut Creek, Concord, Palo Alto, Mountain View, Sunnyvale, Santa Clara, and 80+ more cities.

DATA SOURCE
All earthquake data is sourced from the USGS Earthquake Hazards Program, the nation's authoritative source for earthquake information.

Download Bay Tremor today and never be caught off guard by Bay Area earthquakes again!
```

### Keywords (100 characters max)
```
earthquake,bay area,seismic,tremor,quake,USGS,san francisco,oakland,tracker,alert,map,california
```

### What's New (Version 1.0.0)
```
Welcome to Bay Tremor! 

This is the initial release of Bay Tremor - your real-time Bay Area earthquake tracker.

Features:
• Live earthquake feed with 30-second updates
• Interactive Apple Maps with magnitude markers
• My Area - location-based earthquake tracking
• Historical charts and statistics
• Customizable notification settings
• Premium dark UI with animations
```

### Promotional Text (170 characters)
```
Track Bay Area earthquakes in real-time! Live USGS data, interactive maps, and customizable alerts for San Francisco, Oakland, San Jose & 80+ cities.
```

---

## 🔒 Privacy Policy

You need a Privacy Policy URL. Create a page at `baytremor.com/privacy` with this content:

```markdown
# Bay Tremor Privacy Policy

Last updated: February 2026

## Information We Collect

### Location Data
Bay Tremor may collect your device's location (with your permission) to:
- Show earthquakes near your location
- Calculate distances to seismic events
- Send location-based earthquake alerts

Location data is processed on-device and is not transmitted to our servers unless you explicitly enable push notifications.

### Device Identifiers
If you enable push notifications, we store a device token to deliver alerts. This token is not linked to your personal identity.

### Usage Data
We may collect anonymous usage statistics to improve the app experience. This data cannot identify you personally.

## How We Use Your Information

- Displaying nearby earthquakes
- Calculating distances to seismic events
- Delivering push notifications for significant earthquakes
- Improving app performance and features

## Data Sources

Earthquake data is sourced from the United States Geological Survey (USGS) and is publicly available information.

## Data Sharing

We do not sell, trade, or share your personal information with third parties. Anonymous, aggregated statistics may be used for analytics.

## Data Retention

- Device tokens are retained only while you have notifications enabled
- Location data is not stored; it is used in real-time only
- App preferences are stored locally on your device

## Your Rights

You can:
- Disable location access in iOS Settings
- Disable notifications at any time
- Delete the app to remove all local data

## Contact

For privacy questions, contact: privacy@baytremor.com

## Changes

We may update this policy. Continued use of the app constitutes acceptance of any changes.
```

---

## 🔗 Required URLs

| URL | Purpose | Example |
|-----|---------|---------|
| Privacy Policy | Required | `https://baytremor.com/privacy` |
| Support URL | Required | `https://baytremor.com/support` |
| Marketing URL | Optional | `https://baytremor.com` |

---

## 🏷️ App Store Categories

**Primary:** Weather  
**Secondary:** News (optional)

---

## 👥 Age Rating

Based on the app's content:
- **No objectionable content**
- **Rating: 4+** (suitable for all ages)

The questionnaire answers:
- Cartoon/Fantasy Violence: None
- Realistic Violence: None
- Profanity/Crude Humor: None
- Mature/Suggestive Themes: None
- Gambling: None
- Horror/Fear Themes: None
- Medical/Treatment Information: None
- Alcohol/Tobacco/Drug Use: None
- Sexual Content/Nudity: None
- Unrestricted Web Access: No

---

## 📋 App Review Information

### Demo Account
Not required (app doesn't require login)

### Notes for Reviewers
```
Bay Tremor is an earthquake tracking app for the San Francisco Bay Area. 

Key points for review:
1. The app fetches real-time earthquake data from USGS (United States Geological Survey)
2. Location permission is optional - users can manually select their city
3. Push notifications are optional and configurable
4. No account or login required
5. All data is from public government sources

The app may show "No earthquakes" if there hasn't been recent seismic activity in the Bay Area. This is normal behavior - you can test the History tab which shows past 24 hours to 7 days of data.

Thank you for reviewing Bay Tremor!
```

---

## 🚀 Submission Steps

### 1. Prepare in Xcode
```bash
# Open the project
open iphone/BayTremor.xcodeproj

# In Xcode:
# 1. Select "Any iOS Device" as target
# 2. Product > Archive
# 3. Window > Organizer > Distribute App
# 4. Select "App Store Connect" > Upload
```

### 2. In App Store Connect
1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Create new app (if not already done)
3. Fill in all metadata (see above)
4. Upload screenshots
5. Set pricing (Free)
6. Complete App Privacy questionnaire
7. Submit for review

### 3. Wait for Review
- Initial reviews typically take 24-48 hours
- You'll receive email notification
- Address any issues if rejected

---

## 🐛 Common Rejection Reasons & Solutions

| Issue | Solution |
|-------|----------|
| Missing privacy policy | Add URL to App Store Connect |
| Placeholder screenshots | Use real device screenshots |
| Crash on launch | Test thoroughly on physical device |
| Missing app icon | Add 1024x1024 PNG to Assets |
| Incomplete metadata | Fill all required fields |
| Location permission without feature | Ensure location is used for clear purpose |

---

## 📊 Post-Launch Checklist

- [ ] Monitor App Store Connect for crash reports
- [ ] Respond to user reviews
- [ ] Track analytics and user retention
- [ ] Plan version 1.1 features
- [ ] Consider App Store Optimization (ASO)

---

## 🎉 Congratulations!

Once approved, your app will be live on the App Store. Consider:
- Announcing on social media
- Submitting to app review sites
- Adding App Store badges to baytremor.com

Good luck with your submission! 🚀
