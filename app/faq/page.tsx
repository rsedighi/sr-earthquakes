import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, HelpCircle, ChevronDown } from 'lucide-react';
import { generateFAQSchema, generateBreadcrumbSchema } from '@/lib/seo';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://baytremor.com';

export const metadata: Metadata = {
  title: 'Frequently Asked Questions About Bay Area Earthquakes | Bay Tremor',
  description: 'Get answers to common questions about earthquakes in the San Francisco Bay Area. Learn about earthquake swarms, fault lines, magnitude scales, and how to stay prepared.',
  keywords: [
    'earthquake FAQ',
    'Bay Area earthquake questions',
    'San Francisco earthquake facts',
    'earthquake swarm meaning',
    'Hayward fault danger',
    'San Andreas fault FAQ',
    'California earthquake preparedness',
    'earthquake magnitude explained',
    'USGS earthquake data',
    'Bay Area seismic risk',
  ],
  openGraph: {
    title: 'Frequently Asked Questions About Bay Area Earthquakes',
    description: 'Get answers to common questions about earthquakes in the San Francisco Bay Area.',
    type: 'website',
    url: `${baseUrl}/faq`,
  },
  alternates: {
    canonical: `${baseUrl}/faq`,
  },
};

const faqs = [
  {
    question: 'How often do earthquakes occur in the San Francisco Bay Area?',
    answer: 'The Bay Area experiences hundreds of small earthquakes every year. Most are too small to feel (below magnitude 2.0), but the region is one of the most seismically active in the United States due to the San Andreas, Hayward, and Calaveras fault systems. On average, the Bay Area experiences about 30-40 earthquakes per week, though most go unnoticed.',
  },
  {
    question: 'What is an earthquake swarm?',
    answer: 'An earthquake swarm is a sequence of many small earthquakes occurring in the same area over a relatively short period of time without a clear mainshock. Unlike typical earthquake sequences where there is a main earthquake followed by aftershocks, swarms have a gradual buildup of activity. Swarms can last from days to months and are common in the Bay Area, particularly in the San Ramon and South Bay regions. They are usually not a precursor to larger earthquakes.',
  },
  {
    question: 'Is the Bay Area due for a major earthquake?',
    answer: 'Scientists estimate there is a 72% probability that the Bay Area will experience a magnitude 6.7 or greater earthquake within the next 30 years. The Hayward Fault is considered particularly hazardous due to its proximity to dense urban areas and its average recurrence interval of about 150 years - it has been over 150 years since its last major event in 1868. However, earthquakes cannot be predicted with specific timing.',
  },
  {
    question: 'What is the difference between magnitude and intensity?',
    answer: 'Magnitude measures the energy released by an earthquake at its source using seismometers. It is a single number that represents the overall size of an earthquake. Intensity measures the effects and shaking felt at a specific location, which varies based on distance from the epicenter, local geology, and building construction. A single earthquake has one magnitude but can have many different intensities depending on location.',
  },
  {
    question: 'Where does Bay Tremor get its earthquake data?',
    answer: 'Bay Tremor uses real-time data from the United States Geological Survey (USGS) earthquake monitoring network. The USGS operates a comprehensive network of seismometers throughout California through the Northern California Seismic Network (NCSN) and provides authoritative earthquake information. Our data is updated continuously and typically reflects earthquakes within minutes of occurrence.',
  },
  {
    question: 'How quickly are earthquakes detected and reported?',
    answer: 'Modern seismic networks can detect earthquakes within seconds of occurrence. Preliminary information is typically available within 2-5 minutes, with refined data (including location and magnitude updates) following within 15-30 minutes as more seismic stations report data. Smaller earthquakes may take longer to be catalogued and may be revised as analysts review the data.',
  },
  {
    question: 'What causes earthquakes in the Bay Area?',
    answer: 'Bay Area earthquakes are caused by the movement of the Pacific Plate past the North American Plate along the San Andreas Fault system. This transform boundary creates stress that builds up over time and is released as earthquakes along various faults in the region. The major faults include the San Andreas, Hayward, Calaveras, Rodgers Creek, and Concord-Green Valley faults.',
  },
  {
    question: 'What does earthquake depth mean?',
    answer: "Earthquake depth is the distance from the Earth's surface to the point where the earthquake rupture starts (the hypocenter or focus). In the Bay Area, most earthquakes occur at depths of 5-15 km. Shallow earthquakes (less than 20km) typically cause more intense surface shaking near the epicenter, while deeper earthquakes may be felt over a wider area but with less intensity. Very shallow earthquakes (under 5km) can cause significant local damage.",
  },
  {
    question: 'What should I do during an earthquake?',
    answer: 'During an earthquake, Drop, Cover, and Hold On. DROP to your hands and knees to prevent being knocked down. COVER your head and neck under a sturdy desk or table. If no shelter is nearby, get next to an interior wall and cover your head. HOLD ON until shaking stops. Do not run outside during shaking, as falling debris poses a danger. If outdoors, move away from buildings, power lines, and trees.',
  },
  {
    question: 'How can I prepare for an earthquake?',
    answer: 'Earthquake preparedness includes: securing heavy furniture and objects, creating an emergency supply kit with water, food, first aid supplies, and flashlights for at least 72 hours, knowing how to turn off gas and electricity, establishing a family communication plan, and identifying safe spots in each room. Consider signing up for earthquake early warning systems like ShakeAlert.',
  },
  {
    question: 'What is the San Ramon earthquake swarm?',
    answer: 'The San Ramon area, located in the Tri-Valley region along the Calaveras Fault, experiences periodic earthquake swarms. These swarms involve clusters of small earthquakes (typically magnitude 1.0-3.5) over periods of days to weeks. The area has experienced notable swarms in 2015, 2019, and continues to have regular seismic activity. While these swarms can be unsettling, they typically do not indicate an imminent larger earthquake.',
  },
  {
    question: 'Can animals predict earthquakes?',
    answer: 'While there are many anecdotal reports of unusual animal behavior before earthquakes, scientific studies have not consistently confirmed that animals can reliably predict earthquakes. Some animals may be sensitive to the initial P-waves that travel faster than the more damaging S-waves, giving them a few seconds of warning. However, this is not the same as predicting an earthquake before it happens.',
  },
];

export default function FAQPage() {
  const faqSchema = generateFAQSchema();
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: baseUrl },
    { name: 'FAQ', url: `${baseUrl}/faq` },
  ]);
  
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([faqSchema, breadcrumbSchema]),
        }}
      />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Breadcrumb Navigation */}
        <nav className="mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center gap-2 text-sm text-neutral-400">
            <li>
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
            </li>
            <li>/</li>
            <li className="text-white">FAQ</li>
          </ol>
        </nav>
        
        {/* Back Navigation */}
        <Link 
          href="/"
          className="inline-flex items-center gap-2 text-neutral-400 hover:text-white transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Back to Dashboard
        </Link>
        
        {/* Header */}
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <HelpCircle className="w-8 h-8 text-blue-400" />
            <h1 className="text-4xl font-bold">Frequently Asked Questions</h1>
          </div>
          <p className="text-xl text-neutral-400 max-w-3xl">
            Get answers to common questions about earthquakes in the San Francisco Bay Area, 
            how to stay prepared, and how Bay Tremor tracks seismic activity.
          </p>
        </header>
        
        {/* FAQ List */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <details 
              key={index}
              className="group bg-neutral-900 rounded-xl border border-white/10 overflow-hidden"
            >
              <summary className="flex items-center justify-between gap-4 p-6 cursor-pointer hover:bg-white/5 transition-colors list-none">
                <h2 className="text-lg font-semibold pr-4">{faq.question}</h2>
                <ChevronDown className="w-5 h-5 text-neutral-500 group-open:rotate-180 transition-transform flex-shrink-0" />
              </summary>
              <div className="px-6 pb-6 text-neutral-300 leading-relaxed">
                {faq.answer}
              </div>
            </details>
          ))}
        </div>
        
        {/* Additional Resources */}
        <section className="mt-12 bg-neutral-900 rounded-xl p-6 border border-white/10">
          <h2 className="text-2xl font-bold mb-4">Additional Resources</h2>
          <ul className="space-y-3 text-neutral-300">
            <li>
              <a 
                href="https://earthquake.usgs.gov"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                USGS Earthquake Hazards Program
              </a>
              {' '}- Official earthquake data and research
            </li>
            <li>
              <a 
                href="https://www.earthquakeauthority.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                California Earthquake Authority
              </a>
              {' '}- Earthquake insurance information
            </li>
            <li>
              <a 
                href="https://www.ready.gov/earthquakes"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                Ready.gov Earthquake Preparedness
              </a>
              {' '}- Federal emergency preparedness resources
            </li>
            <li>
              <a 
                href="https://www.shakeout.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                The Great ShakeOut
              </a>
              {' '}- Annual earthquake drill information
            </li>
          </ul>
        </section>
        
        {/* CTA */}
        <div className="mt-12 text-center">
          <p className="text-neutral-400 mb-4">
            Have more questions? Start exploring earthquake data on our dashboard.
          </p>
          <Link 
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black rounded-xl font-semibold hover:bg-neutral-200 transition-colors"
          >
            View Live Earthquake Data
          </Link>
        </div>
      </div>
    </div>
  );
}

