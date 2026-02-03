//
//  Theme.swift
//  BayTremor
//
//  Design system for the app
//

import SwiftUI

// MARK: - Colors

extension Color {
    // Background colors
    static let appBackground = Color(hex: "#0a0a0a")
    static let cardBackground = Color(hex: "#171717")
    static let elevatedBackground = Color(hex: "#262626")
    
    // Border colors
    static let cardBorder = Color.white.opacity(0.1)
    static let activeBorder = Color.white.opacity(0.2)
    
    // Accent colors
    static let accentBlue = Color(hex: "#3b82f6")
    static let accentGreen = Color(hex: "#22c55e")
    static let accentYellow = Color(hex: "#eab308")
    static let accentOrange = Color(hex: "#f97316")
    static let accentRed = Color(hex: "#ef4444")
    static let accentPurple = Color(hex: "#a855f7")
    
    // Text colors
    static let textPrimary = Color.white
    static let textSecondary = Color.white.opacity(0.7)
    static let textTertiary = Color.white.opacity(0.5)
}

// MARK: - Typography

extension Font {
    // Display fonts
    static let displayLarge = Font.system(size: 72, weight: .bold, design: .rounded)
    static let displayMedium = Font.system(size: 48, weight: .bold, design: .rounded)
    static let displaySmall = Font.system(size: 36, weight: .bold, design: .rounded)
    
    // Title fonts
    static let titleLarge = Font.system(size: 28, weight: .bold)
    static let titleMedium = Font.system(size: 22, weight: .semibold)
    static let titleSmall = Font.system(size: 18, weight: .semibold)
    
    // Body fonts
    static let bodyLarge = Font.system(size: 17, weight: .regular)
    static let bodyMedium = Font.system(size: 15, weight: .regular)
    static let bodySmall = Font.system(size: 13, weight: .regular)
    
    // Label fonts
    static let labelLarge = Font.system(size: 14, weight: .medium)
    static let labelMedium = Font.system(size: 12, weight: .medium)
    static let labelSmall = Font.system(size: 11, weight: .medium)
    
    // Mono fonts (for numbers)
    static let monoLarge = Font.system(size: 24, weight: .bold, design: .monospaced)
    static let monoMedium = Font.system(size: 17, weight: .medium, design: .monospaced)
    static let monoSmall = Font.system(size: 13, weight: .medium, design: .monospaced)
}

// MARK: - Spacing

enum Spacing {
    static let xxs: CGFloat = 2
    static let xs: CGFloat = 4
    static let sm: CGFloat = 8
    static let md: CGFloat = 12
    static let lg: CGFloat = 16
    static let xl: CGFloat = 20
    static let xxl: CGFloat = 24
    static let xxxl: CGFloat = 32
}

// MARK: - Corner Radius

enum CornerRadius {
    static let small: CGFloat = 8
    static let medium: CGFloat = 12
    static let large: CGFloat = 16
    static let xl: CGFloat = 20
    static let full: CGFloat = 999
}

// MARK: - Shadows

extension View {
    func cardShadow() -> some View {
        shadow(color: .black.opacity(0.3), radius: 10, x: 0, y: 4)
    }
    
    func subtleShadow() -> some View {
        shadow(color: .black.opacity(0.2), radius: 4, x: 0, y: 2)
    }
}

// MARK: - View Modifiers

struct CardStyle: ViewModifier {
    func body(content: Content) -> some View {
        content
            .padding(Spacing.lg)
            .background(Color.cardBackground)
            .clipShape(RoundedRectangle(cornerRadius: CornerRadius.medium))
            .overlay(
                RoundedRectangle(cornerRadius: CornerRadius.medium)
                    .stroke(Color.cardBorder, lineWidth: 1)
            )
    }
}

struct PrimaryButtonStyle: ViewModifier {
    func body(content: Content) -> some View {
        content
            .font(.labelLarge)
            .foregroundStyle(.white)
            .padding(.horizontal, Spacing.lg)
            .padding(.vertical, Spacing.md)
            .background(Color.accentBlue)
            .clipShape(RoundedRectangle(cornerRadius: CornerRadius.small))
    }
}

struct SecondaryButtonStyle: ViewModifier {
    func body(content: Content) -> some View {
        content
            .font(.labelLarge)
            .foregroundStyle(.white)
            .padding(.horizontal, Spacing.lg)
            .padding(.vertical, Spacing.md)
            .background(Color.white.opacity(0.1))
            .clipShape(RoundedRectangle(cornerRadius: CornerRadius.small))
            .overlay(
                RoundedRectangle(cornerRadius: CornerRadius.small)
                    .stroke(Color.cardBorder, lineWidth: 1)
            )
    }
}

extension View {
    func cardStyle() -> some View {
        modifier(CardStyle())
    }
    
    func primaryButtonStyle() -> some View {
        modifier(PrimaryButtonStyle())
    }
    
    func secondaryButtonStyle() -> some View {
        modifier(SecondaryButtonStyle())
    }
}

// MARK: - Animations

extension Animation {
    static let smoothSpring = Animation.spring(response: 0.4, dampingFraction: 0.8)
    static let quickSpring = Animation.spring(response: 0.25, dampingFraction: 0.7)
    static let gentleSpring = Animation.spring(response: 0.6, dampingFraction: 0.9)
}

// MARK: - Magnitude Styling

enum MagnitudeStyle {
    static func color(for magnitude: Double) -> Color {
        switch magnitude {
        case ..<2.0: return .accentGreen
        case 2.0..<3.0: return .accentYellow
        case 3.0..<4.0: return .accentOrange
        case 4.0..<5.0: return .accentRed
        default: return .accentPurple
        }
    }
    
    static func label(for magnitude: Double) -> String {
        switch magnitude {
        case ..<2.0: return "Micro"
        case 2.0..<3.0: return "Minor"
        case 3.0..<4.0: return "Light"
        case 4.0..<5.0: return "Moderate"
        case 5.0..<6.0: return "Strong"
        default: return "Major"
        }
    }
    
    static func icon(for magnitude: Double) -> String {
        switch magnitude {
        case ..<2.0: return "waveform.path.ecg"
        case 2.0..<3.0: return "waveform"
        case 3.0..<4.0: return "waveform.badge.exclamationmark"
        case 4.0..<5.0: return "exclamationmark.triangle"
        default: return "exclamationmark.triangle.fill"
        }
    }
}
