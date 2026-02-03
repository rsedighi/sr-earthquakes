//
//  NotificationService.swift
//  BayTremor
//
//  Push notification management
//

import Foundation
import UserNotifications
import UIKit

@MainActor
class NotificationService: ObservableObject {
    static let shared = NotificationService()
    
    @Published var isAuthorized = false
    @Published var authorizationStatus: UNAuthorizationStatus = .notDetermined
    
    private init() {
        Task {
            await checkAuthorizationStatus()
        }
    }
    
    // MARK: - Authorization
    
    /// Request permission to send notifications
    func requestPermission() async -> Bool {
        let center = UNUserNotificationCenter.current()
        
        do {
            // Request critical alerts for major earthquakes (M5.0+)
            let options: UNAuthorizationOptions = [.alert, .sound, .badge, .criticalAlert]
            let granted = try await center.requestAuthorization(options: options)
            
            await MainActor.run {
                self.isAuthorized = granted
            }
            
            if granted {
                registerForRemoteNotifications()
            }
            
            await checkAuthorizationStatus()
            return granted
        } catch {
            print("❌ Notification permission error: \(error)")
            return false
        }
    }
    
    /// Check current authorization status
    func checkAuthorizationStatus() async {
        let center = UNUserNotificationCenter.current()
        let settings = await center.notificationSettings()
        
        await MainActor.run {
            self.authorizationStatus = settings.authorizationStatus
            self.isAuthorized = settings.authorizationStatus == .authorized
        }
    }
    
    /// Register for remote notifications
    private func registerForRemoteNotifications() {
        DispatchQueue.main.async {
            UIApplication.shared.registerForRemoteNotifications()
        }
    }
    
    // MARK: - Local Notifications (for testing/offline)
    
    /// Schedule a local notification for testing
    func scheduleTestNotification() {
        let content = UNMutableNotificationContent()
        content.title = "🔴 M3.5 Earthquake"
        content.body = "2.1 km N of San Ramon, CA"
        content.sound = .default
        content.badge = 1
        
        content.userInfo = [
            "earthquakeId": "test-123",
            "magnitude": 3.5,
            "place": "2.1 km N of San Ramon, CA"
        ]
        
        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 5, repeats: false)
        let request = UNNotificationRequest(
            identifier: UUID().uuidString,
            content: content,
            trigger: trigger
        )
        
        UNUserNotificationCenter.current().add(request) { error in
            if let error = error {
                print("❌ Failed to schedule notification: \(error)")
            } else {
                print("✅ Test notification scheduled")
            }
        }
    }
    
    /// Schedule notification for a new earthquake
    func notifyNewEarthquake(_ earthquake: Earthquake) {
        let content = UNMutableNotificationContent()
        
        // Use magnitude emoji
        let emoji = earthquake.magnitude >= 4.0 ? "🔴" : 
                    earthquake.magnitude >= 3.0 ? "🟠" :
                    earthquake.magnitude >= 2.0 ? "🟡" : "🟢"
        
        content.title = "\(emoji) \(earthquake.formattedMagnitude) Earthquake"
        content.body = earthquake.place
        content.sound = earthquake.magnitude >= 4.0 ? .defaultCritical : .default
        content.badge = 1
        
        content.userInfo = [
            "earthquakeId": earthquake.id,
            "magnitude": earthquake.magnitude,
            "place": earthquake.place
        ]
        
        let request = UNNotificationRequest(
            identifier: earthquake.id,
            content: content,
            trigger: nil // Immediate delivery
        )
        
        UNUserNotificationCenter.current().add(request)
    }
    
    // MARK: - Badge Management
    
    /// Clear notification badge
    func clearBadge() {
        UIApplication.shared.applicationIconBadgeNumber = 0
    }
    
    /// Set badge count
    func setBadge(_ count: Int) {
        UIApplication.shared.applicationIconBadgeNumber = count
    }
    
    // MARK: - Notification Categories
    
    /// Set up notification categories with actions
    func setupNotificationCategories() {
        // "Did you feel it?" action
        let feltAction = UNNotificationAction(
            identifier: "FELT_ACTION",
            title: "Yes, I felt it",
            options: [.foreground]
        )
        
        let notFeltAction = UNNotificationAction(
            identifier: "NOT_FELT_ACTION",
            title: "No, I didn't",
            options: []
        )
        
        let viewAction = UNNotificationAction(
            identifier: "VIEW_ACTION",
            title: "View Details",
            options: [.foreground]
        )
        
        // Earthquake notification category
        let earthquakeCategory = UNNotificationCategory(
            identifier: "EARTHQUAKE",
            actions: [viewAction, feltAction, notFeltAction],
            intentIdentifiers: [],
            options: []
        )
        
        UNUserNotificationCenter.current().setNotificationCategories([earthquakeCategory])
    }
}
