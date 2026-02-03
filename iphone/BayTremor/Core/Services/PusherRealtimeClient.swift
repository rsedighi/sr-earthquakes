//
//  PusherRealtimeClient.swift
//  BayTremor
//
//  Minimal Pusher Channels WebSocket client (no third-party dependencies)
//  Supports: connect, subscribe, ping/pong, basic reconnect.
//

import Foundation

enum PusherConfig {
    static var key: String? {
        let value = Bundle.main.object(forInfoDictionaryKey: "BAYTREMOR_PUSHER_KEY") as? String
        return value?.trimmingCharacters(in: .whitespacesAndNewlines).nonEmpty
    }
    
    static var cluster: String? {
        let value = Bundle.main.object(forInfoDictionaryKey: "BAYTREMOR_PUSHER_CLUSTER") as? String
        return value?.trimmingCharacters(in: .whitespacesAndNewlines).nonEmpty
    }
}

@MainActor
final class PusherRealtimeClient {
    static let shared = PusherRealtimeClient()
    
    private let session: URLSession
    private var socketTask: URLSessionWebSocketTask?
    private var isSocketOpen = false
    
    // channel -> eventName -> handlers
    private var handlers: [String: [String: [UUID: (Any) -> Void]]] = [:]
    private var subscribedChannels: Set<String> = []
    
    private var reconnectTask: Task<Void, Never>?
    private var reconnectAttempt = 0
    
    private init() {
        let config = URLSessionConfiguration.default
        config.waitsForConnectivity = true
        self.session = URLSession(configuration: config)
    }
    
    func isConfigured() -> Bool {
        PusherConfig.key != nil && PusherConfig.cluster != nil
    }
    
    func subscribe(
        channel: String,
        event: String,
        handler: @escaping (Any) -> Void
    ) -> UUID? {
        guard isConfigured() else { return nil }
        
        let id = UUID()
        var byEvent = handlers[channel, default: [:]]
        var byHandler = byEvent[event, default: [:]]
        byHandler[id] = handler
        byEvent[event] = byHandler
        handlers[channel] = byEvent
        
        Task {
            await ensureConnected()
            await sendSubscribeIfNeeded(channel: channel)
        }
        
        return id
    }
    
    func unsubscribe(channel: String, token: UUID) {
        guard var byEvent = handlers[channel] else { return }
        for (event, var map) in byEvent {
            map[token] = nil
            byEvent[event] = map
        }
        handlers[channel] = byEvent
        cleanupIfUnused(channel: channel)
    }
    
    func unsubscribeAll(channel: String) {
        handlers[channel] = nil
        subscribedChannels.remove(channel)
        cleanupIfNoSubscriptions()
    }
    
    func shutdown() {
        handlers = [:]
        subscribedChannels = []
        cleanupIfNoSubscriptions()
    }
    
    // MARK: - Connection
    
    private func ensureConnected() async {
        if isSocketOpen { return }
        guard let url = makeWebSocketURL() else { return }
        
        reconnectTask?.cancel()
        reconnectTask = nil
        
        let task = session.webSocketTask(with: url)
        socketTask = task
        task.resume()
        
        isSocketOpen = true
        reconnectAttempt = 0
        
        receiveLoop()
    }
    
    private func makeWebSocketURL() -> URL? {
        guard let key = PusherConfig.key, let cluster = PusherConfig.cluster else { return nil }
        let host = "wss://ws-\(cluster).pusher.com/app/\(key)"
        // Pusher Channels protocol v7
        return URL(string: "\(host)?protocol=7&client=baytremor-ios&version=1.0&flash=false")
    }
    
    private func receiveLoop() {
        socketTask?.receive { [weak self] result in
            guard let self else { return }
            
            switch result {
            case .failure:
                Task { @MainActor in
                    self.isSocketOpen = false
                    self.scheduleReconnect()
                }
            case .success(let message):
                Task { @MainActor in
                    self.handle(message: message)
                    self.receiveLoop()
                }
            }
        }
    }
    
    private func handle(message: URLSessionWebSocketTask.Message) {
        let text: String?
        switch message {
        case .string(let s):
            text = s
        case .data(let d):
            text = String(data: d, encoding: .utf8)
        @unknown default:
            text = nil
        }
        
        guard let text, let data = text.data(using: .utf8) else { return }
        
        guard
            let raw = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
            let eventName = raw["event"] as? String
        else {
            return
        }
        
        // Ping/pong
        if eventName == "pusher:ping" {
            Task { await self.sendPong() }
            return
        }
        
        // When connection establishes, re-subscribe to channels (idempotent)
        if eventName == "pusher:connection_established" {
            Task {
                for channel in self.handlers.keys {
                    await self.sendSubscribeIfNeeded(channel: channel)
                }
            }
            return
        }
        
        let channel = raw["channel"] as? String
        let payload: Any? = raw["data"]
        
        guard let channel else { return }
        guard let payload else { return }
        
        // Dispatch matching handlers
        if let byEvent = handlers[channel], let byHandler = byEvent[eventName] {
            for (_, handler) in byHandler {
                handler(payload)
            }
        }
    }
    
    private func sendSubscribeIfNeeded(channel: String) async {
        guard isSocketOpen else { return }
        guard !subscribedChannels.contains(channel) else { return }
        
        subscribedChannels.insert(channel)
        await sendJSON([
            "event": "pusher:subscribe",
            "data": [
                "channel": channel,
            ],
        ])
    }
    
    private func sendPong() async {
        await sendJSON([
            "event": "pusher:pong",
            "data": [:] as [String: Any],
        ])
    }
    
    private func sendJSON(_ object: [String: Any]) async {
        guard let task = socketTask else { return }
        guard JSONSerialization.isValidJSONObject(object) else { return }
        guard let data = try? JSONSerialization.data(withJSONObject: object) else { return }
        guard let text = String(data: data, encoding: .utf8) else { return }
        
        do {
            try await task.send(.string(text))
        } catch {
            isSocketOpen = false
            scheduleReconnect()
        }
    }
    
    // MARK: - Reconnect
    
    private func scheduleReconnect() {
        cleanupSocket()
        
        // If no active subscriptions, don't reconnect
        guard !handlers.isEmpty else { return }
        guard reconnectTask == nil else { return }
        
        reconnectAttempt += 1
        let delaySeconds = min(30.0, pow(2.0, Double(min(reconnectAttempt, 5)))) // 2,4,8,16,32 capped
        
        reconnectTask = Task { [weak self] in
            guard let self else { return }
            try? await Task.sleep(nanoseconds: UInt64(delaySeconds * 1_000_000_000))
            if Task.isCancelled { return }
            await self.ensureConnected()
            // Re-subscribe after reconnect
            for channel in self.handlers.keys {
                await self.sendSubscribeIfNeeded(channel: channel)
            }
            self.reconnectTask = nil
        }
    }
    
    private func cleanupSocket() {
        socketTask?.cancel(with: .goingAway, reason: nil)
        socketTask = nil
        isSocketOpen = false
        subscribedChannels = []
    }
    
    private func cleanupIfUnused(channel: String) {
        guard let byEvent = handlers[channel] else { return }
        let isEmpty = byEvent.values.allSatisfy { $0.isEmpty }
        if isEmpty {
            handlers[channel] = nil
            subscribedChannels.remove(channel)
        }
        cleanupIfNoSubscriptions()
    }
    
    private func cleanupIfNoSubscriptions() {
        if handlers.isEmpty {
            reconnectTask?.cancel()
            reconnectTask = nil
            cleanupSocket()
        }
    }
}

private extension String {
    var nonEmpty: String? {
        isEmpty ? nil : self
    }
}

