import { Metadata } from 'next';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Shield, 
  AlertTriangle, 
  Home, 
  Users, 
  Phone, 
  Package, 
  Droplets, 
  Zap, 
  CheckCircle2,
  MapPin,
  Clock,
  FileText,
  ChevronDown
} from 'lucide-react';
import { generateBreadcrumbSchema } from '@/lib/seo';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://baytremor.com';

export const metadata: Metadata = {
  title: 'Bay Area Earthquake Preparedness Guide | Safety Checklist & Tips',
  description: 'Complete Bay Area earthquake preparedness guide. Emergency kit checklist, safety tips, family communication plan, and local resources for San Francisco, Oakland, San Jose & surrounding cities.',
  keywords: [
    'earthquake preparedness california',
    'earthquake emergency kit',
    'earthquake safety',
    'earthquake preparedness checklist',
    'bay area earthquake safety',
    'earthquake kit list',
    'how to prepare for earthquake california',
    'earthquake supplies list',
    'earthquake preparedness guide',
    'emergency preparedness bay area',
    'earthquake safety tips california',
    'what to do before an earthquake',
  ],
  openGraph: {
    title: 'Bay Area Earthquake Preparedness Guide | Complete Safety Checklist',
    description: 'Everything Bay Area residents need to prepare for earthquakes. Emergency kits, safety plans, and local resources.',
    type: 'article',
    url: `${baseUrl}/earthquake-preparedness`,
    images: [{
      url: `${baseUrl}/og-image.png`,
      width: 1200,
      height: 630,
      alt: 'Bay Area Earthquake Preparedness Guide',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bay Area Earthquake Preparedness Guide',
    description: 'Complete guide to earthquake safety for Bay Area residents.',
  },
  alternates: {
    canonical: `${baseUrl}/earthquake-preparedness`,
  },
};

// Emergency Kit Items
const emergencyKitItems = {
  essential: [
    { item: 'Water', detail: '1 gallon per person per day for at least 3 days', icon: Droplets },
    { item: 'Non-perishable food', detail: '3-day supply per person (canned goods, energy bars)', icon: Package },
    { item: 'First aid kit', detail: 'Bandages, antiseptic, medications, pain relievers', icon: Shield },
    { item: 'Flashlight', detail: 'With extra batteries (avoid candles due to gas leak risk)', icon: Zap },
    { item: 'Battery-powered radio', detail: 'NOAA Weather Radio for emergency broadcasts', icon: Phone },
    { item: 'Extra batteries', detail: 'For flashlights, radio, and other devices', icon: Package },
    { item: 'Whistle', detail: 'To signal for help if trapped', icon: AlertTriangle },
    { item: 'Dust masks', detail: 'N95 masks to filter contaminated air', icon: Shield },
    { item: 'Wrench or pliers', detail: 'To turn off utilities if needed', icon: Home },
    { item: 'Manual can opener', detail: 'For canned food supplies', icon: Package },
    { item: 'Local maps', detail: 'Physical maps of Bay Area in case GPS fails', icon: MapPin },
    { item: 'Cell phone with chargers', detail: 'Solar or hand-crank charger recommended', icon: Phone },
  ],
  important: [
    { item: 'Important documents', detail: 'Copies of IDs, insurance, bank records in waterproof container' },
    { item: 'Cash', detail: 'ATMs and card readers may not work; have small bills' },
    { item: 'Prescription medications', detail: '7-day supply of any daily medications' },
    { item: 'Glasses/contacts', detail: 'Spare eyewear and contact solution' },
    { item: 'Sleeping bag or blanket', detail: 'Warm sleeping gear for each person' },
    { item: 'Change of clothes', detail: 'Including sturdy shoes for walking through debris' },
    { item: 'Sanitation supplies', detail: 'Toilet paper, garbage bags, hand sanitizer' },
    { item: 'Pet supplies', detail: 'Food, water, medications, carrier for pets' },
    { item: 'Books, games, puzzles', detail: 'Activities for children during sheltering' },
    { item: 'Fire extinguisher', detail: 'ABC type for home fires' },
  ],
};

// FAQ Data
const faqs = [
  {
    question: 'How much water should I store for earthquake preparedness?',
    answer: 'The general recommendation is one gallon of water per person per day for at least three days. For a family of four, that means 12 gallons minimum. However, the Bay Area\'s unique risks (broken water mains, potential contamination) mean many experts recommend storing a two-week supply if possible.',
  },
  {
    question: 'Should I get earthquake insurance in the Bay Area?',
    answer: 'Given that the Bay Area has a 72% probability of experiencing a major earthquake (M6.7+) in the next 30 years, earthquake insurance is worth serious consideration. Standard homeowner\'s and renter\'s insurance does NOT cover earthquake damage. The California Earthquake Authority (CEA) offers policies through participating insurers. Premiums depend on your home\'s age, construction type, and proximity to fault lines.',
  },
  {
    question: 'What should I do to prepare my home for an earthquake?',
    answer: 'Secure heavy furniture and appliances to walls. Strap your water heater. Install latches on cabinets. Move heavy items to lower shelves. Know how to shut off gas, water, and electricity. Consider retrofitting if your home was built before 1980. Have your home inspected for soft-story conditions (common in Bay Area apartments).',
  },
  {
    question: 'How do I create a family earthquake plan?',
    answer: 'Identify safe spots in each room (under sturdy tables, against interior walls). Choose two meeting places: one near your home and one outside your neighborhood. Designate an out-of-area contact person. Practice "Drop, Cover, and Hold On" drills. Ensure all family members know how to turn off utilities. Keep emergency contacts in everyone\'s phone and on paper.',
  },
  {
    question: 'What is the ShakeAlert early warning system?',
    answer: 'ShakeAlert is the earthquake early warning system for the West Coast. It can provide seconds to tens of seconds of warning before shaking arrives. Download the MyShake app (free, from UC Berkeley) to receive alerts. These precious seconds allow you to drop, cover, and hold on before strong shaking begins.',
  },
  {
    question: 'What are liquefaction zones and should I be concerned?',
    answer: 'Liquefaction occurs when water-saturated soil loses strength during shaking, causing buildings to sink or tilt. Parts of the Bay Area built on filled land (Marina District, parts of Oakland, Foster City) are particularly at risk. Check the USGS liquefaction hazard maps to see if your area is affected. If you\'re in a liquefaction zone, earthquake insurance becomes even more important.',
  },
];

// Generate HowTo Schema
function generateHowToSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'How to Prepare for an Earthquake in the Bay Area',
    description: 'Step-by-step guide to earthquake preparedness for San Francisco Bay Area residents.',
    totalTime: 'P7D',
    estimatedCost: {
      '@type': 'MonetaryAmount',
      currency: 'USD',
      value: '150-300',
    },
    supply: emergencyKitItems.essential.map(item => ({
      '@type': 'HowToSupply',
      name: item.item,
    })),
    step: [
      {
        '@type': 'HowToStep',
        name: 'Build an Emergency Kit',
        text: 'Assemble a kit with water, food, first aid supplies, flashlight, and other essentials for at least 72 hours.',
        url: `${baseUrl}/earthquake-preparedness#emergency-kit`,
      },
      {
        '@type': 'HowToStep',
        name: 'Create a Family Plan',
        text: 'Establish meeting points, emergency contacts, and ensure everyone knows what to do during an earthquake.',
        url: `${baseUrl}/earthquake-preparedness#family-plan`,
      },
      {
        '@type': 'HowToStep',
        name: 'Secure Your Home',
        text: 'Anchor heavy furniture, strap water heaters, and install cabinet latches to prevent injuries.',
        url: `${baseUrl}/earthquake-preparedness#home-safety`,
      },
      {
        '@type': 'HowToStep',
        name: 'Know How to Shut Off Utilities',
        text: 'Learn how to turn off gas, electricity, and water. Keep a wrench near your gas meter.',
        url: `${baseUrl}/earthquake-preparedness#utilities`,
      },
      {
        '@type': 'HowToStep',
        name: 'Download Early Warning Apps',
        text: 'Install MyShake or other ShakeAlert-enabled apps to receive seconds of warning before shaking.',
        url: `${baseUrl}/earthquake-preparedness#early-warning`,
      },
    ],
  };
}

// Generate FAQ Schema
function generatePreparednesseFAQSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

export default function EarthquakePreparednessPage() {
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: baseUrl },
    { name: 'Earthquake Preparedness', url: `${baseUrl}/earthquake-preparedness` },
  ]);
  
  const howToSchema = generateHowToSchema();
  const faqSchema = generatePreparednesseFAQSchema();
  
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([breadcrumbSchema, howToSchema, faqSchema]),
        }}
      />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center gap-2 text-sm text-neutral-400">
            <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
            <li>/</li>
            <li className="text-white">Earthquake Preparedness</li>
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
            <Shield className="w-10 h-10 text-emerald-400" />
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-sm font-medium rounded-full">
              Essential Guide
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            Bay Area Earthquake Preparedness Guide
          </h1>
          <p className="text-xl text-neutral-400 leading-relaxed max-w-3xl">
            Living in the San Francisco Bay Area means living with earthquake risk. Scientists estimate a{' '}
            <strong className="text-white">72% probability</strong> of a major earthquake (M6.7+) striking 
            the region in the next 30 years. Being prepared can save lives and reduce recovery time.
          </p>
        </header>
        
        {/* Table of Contents */}
        <nav className="bg-neutral-900 rounded-xl p-6 border border-white/10 mb-12">
          <h2 className="text-lg font-semibold mb-4">In This Guide</h2>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-neutral-300">
            <li>
              <a href="#emergency-kit" className="flex items-center gap-2 hover:text-emerald-400 transition-colors">
                <Package className="w-4 h-4" />
                Emergency Kit Checklist
              </a>
            </li>
            <li>
              <a href="#family-plan" className="flex items-center gap-2 hover:text-emerald-400 transition-colors">
                <Users className="w-4 h-4" />
                Family Communication Plan
              </a>
            </li>
            <li>
              <a href="#home-safety" className="flex items-center gap-2 hover:text-emerald-400 transition-colors">
                <Home className="w-4 h-4" />
                Home Safety Checklist
              </a>
            </li>
            <li>
              <a href="#during-earthquake" className="flex items-center gap-2 hover:text-emerald-400 transition-colors">
                <AlertTriangle className="w-4 h-4" />
                What to Do During an Earthquake
              </a>
            </li>
            <li>
              <a href="#after-earthquake" className="flex items-center gap-2 hover:text-emerald-400 transition-colors">
                <Clock className="w-4 h-4" />
                After an Earthquake
              </a>
            </li>
            <li>
              <a href="#bay-area-risks" className="flex items-center gap-2 hover:text-emerald-400 transition-colors">
                <MapPin className="w-4 h-4" />
                Bay Area-Specific Risks
              </a>
            </li>
          </ul>
        </nav>
        
        {/* Emergency Kit Section */}
        <section id="emergency-kit" className="mb-16 scroll-mt-8">
          <div className="flex items-center gap-3 mb-6">
            <Package className="w-8 h-8 text-blue-400" />
            <h2 className="text-3xl font-bold">Emergency Kit Checklist</h2>
          </div>
          
          <p className="text-neutral-300 mb-6 text-lg">
            Every Bay Area household should have an earthquake emergency kit ready. Store supplies in 
            an easily accessible location. Check and refresh your kit every 6 months.
          </p>
          
          <div className="bg-neutral-900 rounded-xl border border-white/10 overflow-hidden mb-6">
            <div className="bg-blue-500/10 border-b border-blue-500/30 px-6 py-4">
              <h3 className="text-xl font-semibold text-blue-400">Essential Items (Must Have)</h3>
            </div>
            <ul className="divide-y divide-white/5">
              {emergencyKitItems.essential.map((item, index) => (
                <li key={index} className="flex items-start gap-4 p-4">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium">{item.item}</span>
                    <p className="text-sm text-neutral-500 mt-1">{item.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="bg-neutral-900 rounded-xl border border-white/10 overflow-hidden">
            <div className="bg-amber-500/10 border-b border-amber-500/30 px-6 py-4">
              <h3 className="text-xl font-semibold text-amber-400">Important Additional Items</h3>
            </div>
            <ul className="divide-y divide-white/5">
              {emergencyKitItems.important.map((item, index) => (
                <li key={index} className="flex items-start gap-4 p-4">
                  <CheckCircle2 className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium">{item.item}</span>
                    <p className="text-sm text-neutral-500 mt-1">{item.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
            <p className="text-emerald-300 text-sm">
              <strong>Pro Tip:</strong> Keep a smaller "grab bag" version of your kit by your bed or 
              front door. If you need to evacuate quickly, you'll have essential supplies immediately available.
            </p>
          </div>
        </section>
        
        {/* Family Plan Section */}
        <section id="family-plan" className="mb-16 scroll-mt-8">
          <div className="flex items-center gap-3 mb-6">
            <Users className="w-8 h-8 text-purple-400" />
            <h2 className="text-3xl font-bold">Family Communication Plan</h2>
          </div>
          
          <p className="text-neutral-300 mb-6 text-lg">
            During a major earthquake, cell networks may be overloaded. Having a plan ensures your 
            family can reconnect even if you're separated.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-neutral-900 rounded-xl p-6 border border-white/10">
              <h3 className="font-semibold text-lg mb-3 text-purple-400">Meeting Places</h3>
              <ul className="space-y-2 text-neutral-300">
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 font-bold">1.</span>
                  <span>Near home: Front yard, neighbor's house</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 font-bold">2.</span>
                  <span>Outside neighborhood: School, library, park</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 font-bold">3.</span>
                  <span>Out of area: Relative's home in another city</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-neutral-900 rounded-xl p-6 border border-white/10">
              <h3 className="font-semibold text-lg mb-3 text-purple-400">Emergency Contacts</h3>
              <ul className="space-y-2 text-neutral-300">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 mt-1 flex-shrink-0" />
                  <span>Out-of-area contact (long distance often works when local doesn't)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 mt-1 flex-shrink-0" />
                  <span>Save "ICE" (In Case of Emergency) contacts in phones</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 mt-1 flex-shrink-0" />
                  <span>Keep physical copies of important numbers</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="bg-neutral-900 rounded-xl p-6 border border-white/10">
            <h3 className="font-semibold text-lg mb-4">Communication Tips During an Emergency</h3>
            <ul className="space-y-3 text-neutral-300">
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 bg-purple-500/20 text-purple-400 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">1</span>
                <span><strong>Text instead of call.</strong> Text messages often get through when voice calls can't.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 bg-purple-500/20 text-purple-400 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">2</span>
                <span><strong>Use social media.</strong> Facebook Safety Check, Twitter, etc. can help locate family.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 bg-purple-500/20 text-purple-400 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">3</span>
                <span><strong>Call your out-of-area contact.</strong> They can relay messages between family members.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 bg-purple-500/20 text-purple-400 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">4</span>
                <span><strong>Conserve phone battery.</strong> Keep your phone charged; use power-saving mode.</span>
              </li>
            </ul>
          </div>
        </section>
        
        {/* Home Safety Section */}
        <section id="home-safety" className="mb-16 scroll-mt-8">
          <div className="flex items-center gap-3 mb-6">
            <Home className="w-8 h-8 text-cyan-400" />
            <h2 className="text-3xl font-bold">Home Safety Checklist</h2>
          </div>
          
          <p className="text-neutral-300 mb-6 text-lg">
            Most earthquake injuries happen from falling objects, not structural collapse. Securing your 
            home significantly reduces injury risk.
          </p>
          
          <div className="space-y-4">
            {[
              { 
                title: 'Secure Heavy Furniture', 
                items: ['Anchor bookshelves, cabinets, and dressers to wall studs', 'Use furniture straps or L-brackets', 'Move heavy items to lower shelves']
              },
              { 
                title: 'Strap Water Heater', 
                items: ['Required by California law since 1995', 'Use two straps - one upper, one lower', 'Prevents fires from broken gas lines']
              },
              { 
                title: 'Install Cabinet Latches', 
                items: ['Prevents contents from spilling during shaking', 'Especially important for cabinets with glass items', 'Use childproof latches or earthquake latches']
              },
              { 
                title: 'Check Gas Connections', 
                items: ['Know where your gas shutoff valve is', 'Keep a wrench nearby', 'Only shut off if you smell gas - you may need a professional to turn it back on']
              },
              { 
                title: 'Identify Safe Spots', 
                items: ['Under sturdy desks or tables', 'Against interior walls', 'Away from windows, mirrors, and heavy objects']
              },
            ].map((section, index) => (
              <div key={index} className="bg-neutral-900 rounded-xl p-6 border border-white/10">
                <h3 className="font-semibold text-lg mb-3 text-cyan-400">{section.title}</h3>
                <ul className="space-y-2">
                  {section.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-neutral-300">
                      <CheckCircle2 className="w-4 h-4 text-cyan-400 mt-1 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
        
        {/* During Earthquake Section */}
        <section id="during-earthquake" className="mb-16 scroll-mt-8">
          <div className="flex items-center gap-3 mb-6">
            <AlertTriangle className="w-8 h-8 text-amber-400" />
            <h2 className="text-3xl font-bold">What to Do During an Earthquake</h2>
          </div>
          
          <div className="bg-gradient-to-br from-amber-500/20 to-red-500/20 border border-amber-500/30 rounded-xl p-8 mb-6">
            <h3 className="text-2xl font-bold text-amber-400 mb-6 text-center">DROP • COVER • HOLD ON</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-3xl font-bold text-amber-400">1</span>
                </div>
                <h4 className="font-semibold text-lg mb-2">DROP</h4>
                <p className="text-neutral-300 text-sm">Get down on your hands and knees before the earthquake knocks you down.</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-3xl font-bold text-amber-400">2</span>
                </div>
                <h4 className="font-semibold text-lg mb-2">COVER</h4>
                <p className="text-neutral-300 text-sm">Cover your head and neck with your arms. Get under a sturdy desk or table if possible.</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-3xl font-bold text-amber-400">3</span>
                </div>
                <h4 className="font-semibold text-lg mb-2">HOLD ON</h4>
                <p className="text-neutral-300 text-sm">Stay in position and hold on to your shelter until shaking stops.</p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-neutral-900 rounded-xl p-6 border border-white/10">
              <h3 className="font-semibold text-lg mb-3 text-green-400">✓ DO</h3>
              <ul className="space-y-2 text-neutral-300">
                <li>• Stay inside until shaking stops</li>
                <li>• Get under a sturdy desk or table</li>
                <li>• If in bed, stay there and cover your head with a pillow</li>
                <li>• If outdoors, stay there and move away from buildings</li>
                <li>• If driving, pull over safely and stay in car</li>
              </ul>
            </div>
            
            <div className="bg-neutral-900 rounded-xl p-6 border border-white/10">
              <h3 className="font-semibold text-lg mb-3 text-red-400">✗ DON'T</h3>
              <ul className="space-y-2 text-neutral-300">
                <li>• Don't run outside during shaking</li>
                <li>• Don't stand in a doorway (outdated advice)</li>
                <li>• Don't use elevators</li>
                <li>• Don't light matches or candles (gas leak risk)</li>
                <li>• Don't use your phone unless emergency</li>
              </ul>
            </div>
          </div>
        </section>
        
        {/* After Earthquake Section */}
        <section id="after-earthquake" className="mb-16 scroll-mt-8">
          <div className="flex items-center gap-3 mb-6">
            <Clock className="w-8 h-8 text-indigo-400" />
            <h2 className="text-3xl font-bold">After an Earthquake</h2>
          </div>
          
          <div className="space-y-4">
            <div className="bg-neutral-900 rounded-xl p-6 border border-white/10">
              <h3 className="font-semibold text-lg mb-3 text-indigo-400">Immediately After</h3>
              <ul className="space-y-2 text-neutral-300">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400 mt-1 flex-shrink-0" />
                  <span><strong>Check for injuries.</strong> Help others if you can do so safely.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400 mt-1 flex-shrink-0" />
                  <span><strong>Check for gas leaks.</strong> If you smell gas, leave immediately and call 911 from outside.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400 mt-1 flex-shrink-0" />
                  <span><strong>Check your home for damage.</strong> Look for cracks, broken utilities, fire hazards.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400 mt-1 flex-shrink-0" />
                  <span><strong>Expect aftershocks.</strong> Aftershocks can occur minutes, days, or even weeks later.</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-neutral-900 rounded-xl p-6 border border-white/10">
              <h3 className="font-semibold text-lg mb-3 text-indigo-400">In the Following Hours/Days</h3>
              <ul className="space-y-2 text-neutral-300">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400 mt-1 flex-shrink-0" />
                  <span><strong>Contact your out-of-area contact.</strong> Let them know you're okay.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400 mt-1 flex-shrink-0" />
                  <span><strong>Document damage.</strong> Take photos for insurance claims.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400 mt-1 flex-shrink-0" />
                  <span><strong>Monitor news.</strong> Use battery-powered radio for emergency information.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400 mt-1 flex-shrink-0" />
                  <span><strong>Don't return home</strong> if it appears damaged until inspected by officials.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>
        
        {/* Bay Area Specific Risks */}
        <section id="bay-area-risks" className="mb-16 scroll-mt-8">
          <div className="flex items-center gap-3 mb-6">
            <MapPin className="w-8 h-8 text-red-400" />
            <h2 className="text-3xl font-bold">Bay Area-Specific Risks</h2>
          </div>
          
          <p className="text-neutral-300 mb-6 text-lg">
            The Bay Area faces unique earthquake risks due to multiple active fault lines and varied 
            geology. Understanding your local risks helps you prepare appropriately.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Link href="/hayward-fault" className="bg-neutral-900 rounded-xl p-6 border border-white/10 hover:bg-white/5 transition-colors group">
              <h3 className="font-semibold text-lg mb-2 text-red-400 group-hover:text-red-300">Hayward Fault</h3>
              <p className="text-neutral-400 text-sm mb-3">
                Called "the most dangerous fault in America." Runs through Oakland, Berkeley, Fremont. 
                Overdue for a major earthquake.
              </p>
              <span className="text-xs text-neutral-500">Affected cities: Oakland, Berkeley, Hayward, Fremont →</span>
            </Link>
            
            <Link href="/san-andreas-fault" className="bg-neutral-900 rounded-xl p-6 border border-white/10 hover:bg-white/5 transition-colors group">
              <h3 className="font-semibold text-lg mb-2 text-red-400 group-hover:text-red-300">San Andreas Fault</h3>
              <p className="text-neutral-400 text-sm mb-3">
                California's most famous fault. Caused the 1906 San Francisco earthquake. 
                Runs along the Peninsula and through San Francisco.
              </p>
              <span className="text-xs text-neutral-500">Affected cities: San Francisco, Daly City, Pacifica →</span>
            </Link>
            
            <Link href="/region/san-ramon" className="bg-neutral-900 rounded-xl p-6 border border-white/10 hover:bg-white/5 transition-colors group">
              <h3 className="font-semibold text-lg mb-2 text-amber-400 group-hover:text-amber-300">Calaveras Fault</h3>
              <p className="text-neutral-400 text-sm mb-3">
                Causes frequent earthquake swarms in the Tri-Valley area. 
                Runs through San Ramon, Dublin, and the East Bay hills.
              </p>
              <span className="text-xs text-neutral-500">Affected cities: San Ramon, Dublin, Pleasanton →</span>
            </Link>
            
            <Link href="/region/sonoma-north" className="bg-neutral-900 rounded-xl p-6 border border-white/10 hover:bg-white/5 transition-colors group">
              <h3 className="font-semibold text-lg mb-2 text-amber-400 group-hover:text-amber-300">Rodgers Creek Fault</h3>
              <p className="text-neutral-400 text-sm mb-3">
                Northern extension of the Hayward Fault. Runs through Sonoma County 
                wine country and Santa Rosa.
              </p>
              <span className="text-xs text-neutral-500">Affected cities: Santa Rosa, Petaluma, Healdsburg →</span>
            </Link>
          </div>
          
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-6">
            <h3 className="font-semibold text-lg mb-3 text-amber-400">Liquefaction Risk</h3>
            <p className="text-neutral-300 mb-3">
              Parts of the Bay Area built on filled land or soft soil are at risk of liquefaction, 
              where the ground behaves like liquid during strong shaking. High-risk areas include:
            </p>
            <ul className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-neutral-300">
              <li className="flex items-center gap-1">
                <span className="w-2 h-2 bg-amber-400 rounded-full"></span>
                Marina District (SF)
              </li>
              <li className="flex items-center gap-1">
                <span className="w-2 h-2 bg-amber-400 rounded-full"></span>
                SOMA (SF)
              </li>
              <li className="flex items-center gap-1">
                <span className="w-2 h-2 bg-amber-400 rounded-full"></span>
                Foster City
              </li>
              <li className="flex items-center gap-1">
                <span className="w-2 h-2 bg-amber-400 rounded-full"></span>
                Parts of Oakland
              </li>
              <li className="flex items-center gap-1">
                <span className="w-2 h-2 bg-amber-400 rounded-full"></span>
                Alameda Island
              </li>
              <li className="flex items-center gap-1">
                <span className="w-2 h-2 bg-amber-400 rounded-full"></span>
                Treasure Island
              </li>
              <li className="flex items-center gap-1">
                <span className="w-2 h-2 bg-amber-400 rounded-full"></span>
                East Palo Alto
              </li>
              <li className="flex items-center gap-1">
                <span className="w-2 h-2 bg-amber-400 rounded-full"></span>
                Parts of San Jose
              </li>
            </ul>
          </div>
        </section>
        
        {/* Early Warning Section */}
        <section id="early-warning" className="mb-16 scroll-mt-8">
          <div className="flex items-center gap-3 mb-6">
            <Zap className="w-8 h-8 text-yellow-400" />
            <h2 className="text-3xl font-bold">Earthquake Early Warning</h2>
          </div>
          
          <div className="bg-neutral-900 rounded-xl p-6 border border-white/10 mb-6">
            <h3 className="font-semibold text-lg mb-3">ShakeAlert & MyShake</h3>
            <p className="text-neutral-300 mb-4">
              California's earthquake early warning system can give you seconds to tens of seconds of warning 
              before shaking arrives at your location. Download these free apps:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <a 
                href="https://apps.apple.com/us/app/myshake/id1467058529"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
              >
                <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                  <Zap className="w-6 h-6 text-yellow-400" />
                </div>
                <div>
                  <span className="font-semibold">MyShake</span>
                  <p className="text-sm text-neutral-500">From UC Berkeley - iOS & Android</p>
                </div>
              </a>
              <div className="flex items-center gap-4 p-4 bg-white/5 rounded-lg">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <Phone className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <span className="font-semibold">Android Earthquake Alerts</span>
                  <p className="text-sm text-neutral-500">Built into Android phones</p>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* FAQ Section */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <FileText className="w-8 h-8 text-blue-400" />
            <h2 className="text-3xl font-bold">Frequently Asked Questions</h2>
          </div>
          
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <details 
                key={index}
                className="group bg-neutral-900 rounded-xl border border-white/10 overflow-hidden"
              >
                <summary className="flex items-center justify-between gap-4 p-6 cursor-pointer hover:bg-white/5 transition-colors list-none">
                  <h3 className="text-lg font-semibold pr-4">{faq.question}</h3>
                  <ChevronDown className="w-5 h-5 text-neutral-500 group-open:rotate-180 transition-transform flex-shrink-0" />
                </summary>
                <div className="px-6 pb-6 text-neutral-300 leading-relaxed">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </section>
        
        {/* Resources Section */}
        <section className="bg-neutral-900 rounded-xl p-6 border border-white/10 mb-12">
          <h2 className="text-2xl font-bold mb-4">Additional Resources</h2>
          <ul className="space-y-3 text-neutral-300">
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
                href="https://www.ready.gov/earthquakes"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                Ready.gov Earthquakes
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
              {' '}- Annual earthquake drill (every October)
            </li>
          </ul>
        </section>
        
        {/* CTA */}
        <div className="text-center">
          <p className="text-neutral-400 mb-4">
            Stay informed about earthquake activity in your area.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link 
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black rounded-xl font-semibold hover:bg-neutral-200 transition-colors"
            >
              View Live Earthquake Data
            </Link>
            <Link 
              href="/faq"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition-colors"
            >
              More Questions?
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
