import { Metadata } from 'next';
import Link from 'next/link';
import { CurrentYear } from '@/components/current-year';

export const metadata: Metadata = {
  title: 'Support',
  description: 'Get help with Bay Tremor - Bay Area earthquake tracking app support.',
};

export default function SupportPage() {
  return (
    <main className="min-h-screen bg-black text-white pb-20 md:pb-0">
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
          
          <h1 className="text-4xl font-bold mb-4">Support</h1>
          <p className="text-neutral-400">Get help with Bay Tremor</p>
        </div>

        {/* Content */}
        <div className="space-y-12">
          {/* Contact Section */}
          <section className="bg-neutral-900/50 rounded-2xl p-8 border border-neutral-800">
            <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
            <p className="text-neutral-300 mb-6">
              Have questions, feedback, or experiencing issues? We&apos;re here to help!
            </p>
            <a 
              href="mailto:support@baytremor.com"
              className="inline-flex items-center gap-3 bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-3 rounded-xl font-medium transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              support@baytremor.com
            </a>
          </section>

          {/* FAQ Section */}
          <section>
            <h2 className="text-2xl font-semibold mb-6">Frequently Asked Questions</h2>
            
            <div className="space-y-6">
              <div className="bg-neutral-900/30 rounded-xl p-6 border border-neutral-800/50">
                <h3 className="text-lg font-medium text-cyan-400 mb-2">
                  Where does the earthquake data come from?
                </h3>
                <p className="text-neutral-300">
                  All earthquake data is sourced from the United States Geological Survey (USGS) Earthquake Hazards Program. This is the same data used by government agencies and researchers.
                </p>
              </div>

              <div className="bg-neutral-900/30 rounded-xl p-6 border border-neutral-800/50">
                <h3 className="text-lg font-medium text-cyan-400 mb-2">
                  How often is the data updated?
                </h3>
                <p className="text-neutral-300">
                  Bay Tremor fetches new data from USGS every 30 seconds, giving you near real-time earthquake information.
                </p>
              </div>

              <div className="bg-neutral-900/30 rounded-xl p-6 border border-neutral-800/50">
                <h3 className="text-lg font-medium text-cyan-400 mb-2">
                  Why don&apos;t I see any earthquakes?
                </h3>
                <p className="text-neutral-300">
                  If no earthquakes are displayed, it likely means there hasn&apos;t been seismic activity in the Bay Area during the selected time period. This is normal! Try selecting &quot;Past 7 Days&quot; to see more historical data.
                </p>
              </div>

              <div className="bg-neutral-900/30 rounded-xl p-6 border border-neutral-800/50">
                <h3 className="text-lg font-medium text-cyan-400 mb-2">
                  What area does Bay Tremor cover?
                </h3>
                <p className="text-neutral-300">
                  Bay Tremor covers the San Francisco Bay Area, including all 9 counties: San Francisco, Alameda, Contra Costa, San Mateo, Santa Clara, Marin, Solano, Napa, and Sonoma. This includes 80+ cities.
                </p>
              </div>

              <div className="bg-neutral-900/30 rounded-xl p-6 border border-neutral-800/50">
                <h3 className="text-lg font-medium text-cyan-400 mb-2">
                  How do I get earthquake alerts? (iOS App)
                </h3>
                <p className="text-neutral-300">
                  In the iOS app, go to Settings and enable Push Notifications. You can customize the minimum magnitude and alert radius. Note: Push notifications require the Bay Tremor iOS app.
                </p>
              </div>

              <div className="bg-neutral-900/30 rounded-xl p-6 border border-neutral-800/50">
                <h3 className="text-lg font-medium text-cyan-400 mb-2">
                  What do the magnitude colors mean?
                </h3>
                <p className="text-neutral-300">
                  Earthquakes are color-coded by magnitude: 
                  <span className="text-green-400"> Green (&lt;2.0)</span>, 
                  <span className="text-yellow-400"> Yellow (2.0-3.0)</span>, 
                  <span className="text-orange-400"> Orange (3.0-4.0)</span>, 
                  <span className="text-red-400"> Red (4.0-5.0)</span>, 
                  <span className="text-purple-400"> Purple (5.0+)</span>.
                </p>
              </div>

              <div className="bg-neutral-900/30 rounded-xl p-6 border border-neutral-800/50">
                <h3 className="text-lg font-medium text-cyan-400 mb-2">
                  Is Bay Tremor free?
                </h3>
                <p className="text-neutral-300">
                  Yes! Bay Tremor is completely free to use on both the web and iOS. We may show occasional ads to support development.
                </p>
              </div>

              <div className="bg-neutral-900/30 rounded-xl p-6 border border-neutral-800/50">
                <h3 className="text-lg font-medium text-cyan-400 mb-2">
                  Can I report that I felt an earthquake?
                </h3>
                <p className="text-neutral-300">
                  Yes! For official felt reports, we recommend using the USGS &quot;Did You Feel It?&quot; system by tapping any earthquake and selecting &quot;View on USGS&quot; to submit your report.
                </p>
              </div>
            </div>
          </section>

          {/* App Info */}
          <section className="bg-neutral-900/50 rounded-2xl p-8 border border-neutral-800">
            <h2 className="text-2xl font-semibold mb-4">About Bay Tremor</h2>
            <div className="space-y-4 text-neutral-300">
              <p>
                <strong className="text-white">Version:</strong> 1.0.0
              </p>
              <p>
                <strong className="text-white">Platforms:</strong> Web (baytremor.com) & iOS
              </p>
              <p>
                <strong className="text-white">Data Source:</strong>{' '}
                <a 
                  href="https://earthquake.usgs.gov" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:text-cyan-300"
                >
                  USGS Earthquake Hazards Program
                </a>
              </p>
            </div>
          </section>

          {/* Links */}
          <section>
            <h2 className="text-2xl font-semibold mb-6">Helpful Links</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Link 
                href="/privacy"
                className="flex items-center gap-3 bg-neutral-900/50 hover:bg-neutral-800/50 rounded-xl p-4 border border-neutral-800 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <div className="font-medium">Privacy Policy</div>
                  <div className="text-sm text-neutral-400">How we handle your data</div>
                </div>
              </Link>

              <Link 
                href="/faq"
                className="flex items-center gap-3 bg-neutral-900/50 hover:bg-neutral-800/50 rounded-xl p-4 border border-neutral-800 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <div className="font-medium">FAQ</div>
                  <div className="text-sm text-neutral-400">Common questions answered</div>
                </div>
              </Link>

              <a 
                href="https://earthquake.usgs.gov"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-neutral-900/50 hover:bg-neutral-800/50 rounded-xl p-4 border border-neutral-800 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                </div>
                <div>
                  <div className="font-medium">USGS Website</div>
                  <div className="text-sm text-neutral-400">Official earthquake data source</div>
                </div>
              </a>

              <Link 
                href="/about"
                className="flex items-center gap-3 bg-neutral-900/50 hover:bg-neutral-800/50 rounded-xl p-4 border border-neutral-800 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <div className="font-medium">About Bay Tremor</div>
                  <div className="text-sm text-neutral-400">Learn more about us</div>
                </div>
              </Link>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-neutral-800">
          <p className="text-neutral-500 text-sm">
            © <CurrentYear /> Bay Tremor. All rights reserved.
          </p>
        </div>
      </div>
    </main>
  );
}
