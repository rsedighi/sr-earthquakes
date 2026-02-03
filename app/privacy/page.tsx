import { Metadata } from 'next';
import Link from 'next/link';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://baytremor.com';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Bay Tremor Privacy Policy - How we handle data for our website and iOS app.',
  alternates: {
    canonical: `${baseUrl}/privacy`,
  },
  openGraph: {
    title: 'Privacy Policy | Bay Tremor',
    description: 'How Bay Tremor collects, uses, and shares data on the web and iOS app.',
    type: 'website',
    url: `${baseUrl}/privacy`,
  },
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="mb-12">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors mb-8"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Bay Tremor
          </Link>
          
          <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-neutral-400">Last updated: February 2026</p>
          <p className="text-neutral-400 mt-2">
            This Privacy Policy applies to <span className="text-white font-medium">baytremor.com</span> and the{' '}
            <span className="text-white font-medium">Bay Tremor iOS app</span>.
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-invert prose-lg max-w-none">
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-white mb-4">Summary</h2>
            <ul className="list-disc list-inside text-neutral-300 space-y-2 ml-4">
              <li>
                <strong>We don&apos;t sell your personal information.</strong>
              </li>
              <li>
                <strong>No account is required.</strong> Most features work without identifying you.
              </li>
              <li>
                <strong>You control permissions.</strong> You can disable Location and Notifications at any time in iOS or your browser settings.
              </li>
              <li>
                <strong>Community posts are public.</strong> If you choose to post in discussions, your message (and any name/location you provide) may be visible to others.
              </li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-white mb-4">Information We Collect</h2>
            
            <h3 className="text-xl font-medium text-cyan-400 mt-6 mb-3">Location Data</h3>
            <p className="text-neutral-300 mb-4">
              Bay Tremor may collect your device&apos;s location (with your permission) to:
            </p>
            <ul className="list-disc list-inside text-neutral-300 space-y-2 ml-4">
              <li>Show earthquakes near your location</li>
              <li>Calculate distances to seismic events</li>
              <li>Send location-based earthquake alerts (iOS app only)</li>
            </ul>
            <p className="text-neutral-300 mt-4">
              <strong>Website:</strong> location is typically used in your browser and not stored by us.{' '}
              <strong>iOS app:</strong> location may be used on-device for nearby views and distance calculations.{' '}
              If you enable <strong>push notifications</strong> and choose to use radius-based alerts, the app may send latitude/longitude to our servers to evaluate alert radius.
            </p>

            <h3 className="text-xl font-medium text-cyan-400 mt-6 mb-3">Device Identifiers</h3>
            <p className="text-neutral-300">
              If you enable push notifications on our iOS app, we store an APNs device token and notification preferences (like minimum magnitude and radius) to deliver alerts.
              This token is not intended to identify you personally, but it is a device identifier used to deliver notifications.
            </p>

            <h3 className="text-xl font-medium text-cyan-400 mt-6 mb-3">Usage Data</h3>
            <p className="text-neutral-300">
              We may collect anonymous usage statistics to improve the app experience. This data cannot identify you personally.
            </p>

            <h3 className="text-xl font-medium text-cyan-400 mt-6 mb-3">Information You Provide (Community & Support)</h3>
            <p className="text-neutral-300 mb-4">
              When you choose to participate in community discussions or submit feedback, you may provide:
            </p>
            <ul className="list-disc list-inside text-neutral-300 space-y-2 ml-4">
              <li>Name/display name you type (not an account)</li>
              <li>Message content and any optional location text you include</li>
              <li>Optional “I felt it” indicator</li>
            </ul>

            <h3 className="text-xl font-medium text-cyan-400 mt-6 mb-3">Saved Addresses (My Neighborhood)</h3>
            <p className="text-neutral-300 mb-4">
              If you use “My Neighborhood” features on the website, we may store addresses you submit (and derived latitude/longitude) associated with an anonymous visitor identifier.
              We also log basic request metadata (like user agent) and a <strong>hashed</strong> representation of IP address for analytics/abuse prevention.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-white mb-4">How We Use Your Information</h2>
            <ul className="list-disc list-inside text-neutral-300 space-y-2 ml-4">
              <li>Displaying nearby earthquakes</li>
              <li>Calculating distances to seismic events</li>
              <li>Delivering push notifications for significant earthquakes</li>
              <li>Improving app performance and features</li>
              <li>Operating community discussions and moderating abuse/spam</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-white mb-4">Data Sources</h2>
            <p className="text-neutral-300">
              Earthquake data is sourced from the United States Geological Survey (USGS) and is publicly available information. We do not claim ownership of this data.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-white mb-4">Data Sharing</h2>
            <p className="text-neutral-300 mb-4">
              We do not sell your personal information. We share limited data with service providers to run Bay Tremor:
            </p>
            <ul className="list-disc list-inside text-neutral-300 space-y-2 ml-4">
              <li><strong>Analytics</strong> (e.g., Google Analytics) to understand site/app usage</li>
              <li><strong>Advertising</strong> (e.g., Google AdSense) to support the service</li>
              <li><strong>Infrastructure</strong> (hosting, databases) to store and serve content</li>
              <li><strong>Real-time messaging</strong> for community features (when enabled)</li>
              <li><strong>AI services</strong> for optional summaries (when enabled)</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-white mb-4">Data Retention</h2>
            <ul className="list-disc list-inside text-neutral-300 space-y-2 ml-4">
              <li>Device tokens are retained only while you have notifications enabled</li>
              <li>Location data is typically used in real-time only; if you enable radius-based push alerts, coordinates may be stored with your notification preferences</li>
              <li>App preferences are stored locally on your device</li>
              <li>Website preferences (selected city) are stored in your browser&apos;s local storage</li>
              <li>Community posts and saved addresses are retained until deleted or removed (for example, for moderation, maintenance, or upon request)</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-white mb-4">Cookies and Tracking</h2>
            <p className="text-neutral-300 mb-4">
              Our website may use:
            </p>
            <ul className="list-disc list-inside text-neutral-300 space-y-2 ml-4">
              <li><strong>Google Analytics</strong> - To understand how visitors use our site</li>
              <li><strong>Google AdSense</strong> - To display relevant advertisements</li>
              <li><strong>Datadog RUM</strong> - To monitor performance and errors</li>
              <li><strong>Local Storage</strong> - To save your preferences (selected city, etc.)</li>
            </ul>
            <p className="text-neutral-300 mt-4">
              You can disable cookies in your browser settings, though some features may not work properly.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-white mb-4">Third-Party Services</h2>
            <p className="text-neutral-300 mb-4">
              Bay Tremor integrates with third-party services to provide functionality and improve reliability. Depending on your usage and enabled features, we may use:
            </p>
            <ul className="list-disc list-inside text-neutral-300 space-y-2 ml-4">
              <li><strong>USGS</strong> (earthquake data)</li>
              <li><strong>Google Analytics</strong> (analytics)</li>
              <li><strong>Google AdSense</strong> (advertising)</li>
              <li><strong>Datadog</strong> (performance/error monitoring)</li>
              <li><strong>Pusher</strong> (real-time updates for community features when configured)</li>
              <li><strong>OpenAI</strong> (optional AI summaries when configured)</li>
              <li><strong>MongoDB</strong> (data storage for comments, devices, and other features when configured)</li>
              <li><strong>Netlify</strong> (hosting and delivery)</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-white mb-4">Your Rights</h2>
            <p className="text-neutral-300 mb-4">You can:</p>
            <ul className="list-disc list-inside text-neutral-300 space-y-2 ml-4">
              <li>Disable location access in your browser or iOS Settings</li>
              <li>Disable notifications at any time</li>
              <li>Clear your browser&apos;s local storage to remove saved preferences</li>
              <li>Delete the iOS app to remove all local data</li>
              <li>Request access to, correction of, or deletion of data we may have collected</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-white mb-4">Children&apos;s Privacy</h2>
            <p className="text-neutral-300">
              Bay Tremor does not knowingly collect information from children under 13. Our services are intended for general audiences interested in earthquake information.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-white mb-4">Contact Us</h2>
            <p className="text-neutral-300">
              For privacy questions or concerns, please contact us at:{' '}
              <a href="mailto:privacy@baytremor.com" className="text-cyan-400 hover:text-cyan-300">
                privacy@baytremor.com
              </a>
            </p>
            <p className="text-neutral-300 mt-4">
              For support issues, visit{' '}
              <Link href="/support" className="text-cyan-400 hover:text-cyan-300">
                Support
              </Link>
              .
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-white mb-4">Changes to This Policy</h2>
            <p className="text-neutral-300">
              We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page with an updated revision date. Continued use of Bay Tremor after changes constitutes acceptance of the updated policy.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-neutral-800">
          <p className="text-neutral-500 text-sm">
            © {new Date().getFullYear()} Bay Tremor. All rights reserved.
          </p>
        </div>
      </div>
    </main>
  );
}
