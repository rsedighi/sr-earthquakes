/**
 * Seed script to populate the forum with realistic-looking activity
 * Run with: npx ts-node scripts/seed-forum.ts
 */

import { MongoClient, ObjectId } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || '';

interface EarthquakeFeature {
  id: string;
  properties: {
    mag: number;
    place: string;
    time: number;
    felt: number | null;
  };
}

// Realistic Bay Area locations
const LOCATIONS = [
  'San Ramon', 'Dublin', 'Pleasanton', 'Danville', 'Livermore',
  'San Francisco', 'Oakland', 'Berkeley', 'Fremont', 'San Jose',
  'Walnut Creek', 'Concord', 'Hayward', 'Palo Alto', 'Mountain View',
  'Redwood City', 'San Mateo', 'Daly City', 'South San Francisco',
  'Alameda', 'Richmond', 'El Cerrito', 'Orinda', 'Lafayette',
  'Moraga', 'Castro Valley', 'San Leandro', 'Union City', 'Newark',
  'Milpitas', 'Santa Clara', 'Sunnyvale', 'Cupertino', 'Los Gatos',
];

// Realistic usernames
const USERNAMES = [
  'BayAreaResident', 'QuakeWatcher', 'EastBayMom', 'SFNative', 'TechWorker',
  'RetiredTeacher', 'LocalDad', 'NightOwl', 'EarlyBird', 'DogWalker',
  'HomeOwner2020', 'ApartmentDweller', 'CommutingPro', 'WFHLife', 'Foodie925',
  'HikingEnthusiast', 'YogaMom', 'CoffeeAddict', 'BookLover', 'GardenGuru',
  'BikeCommuter', 'RunnerLife', 'PetParent', 'NewToArea', 'BayNative',
  'Concerned_Citizen', 'PrepperMike', 'SeismologyFan', 'GeoNerd', 'SafetyFirst',
  'QuakeSurvivor', 'OldTimer', 'TechBro', 'StartupLife', 'FamilyFirst',
];

// Earthquake experience comments
const EARTHQUAKE_COMMENTS = {
  felt_weak: [
    "Barely felt it here, thought it was a truck passing by at first.",
    "Very slight shake, my coffee cup moved a tiny bit.",
    "I wasn't sure if I felt something or imagined it. Came here to check!",
    "Super subtle rolling motion. My dog noticed it before I did.",
    "Had to check if it was real - so gentle I almost missed it.",
    "Just a tiny wobble here. Nothing fell off the shelves.",
  ],
  felt_moderate: [
    "Definitely felt that one! House shook for a few seconds.",
    "That was a good jolt! Pictures on the wall swung a bit.",
    "Woke me up from a nap! Clear side-to-side motion.",
    "My kids ran out of their rooms asking what happened!",
    "Felt it strongly on the 3rd floor. Building swayed noticeably.",
    "That one got my attention! Lasted about 5-6 seconds I'd say.",
    "Felt like someone bumped into my desk repeatedly.",
    "Clear shaking here. Dog started barking like crazy.",
  ],
  felt_strong: [
    "WOW that was strong! Everything on my desk moved.",
    "Biggest one I've felt in years! Heart is still racing.",
    "That was scary! Dove under my desk immediately.",
    "Stuff fell off my shelves. Everyone in my building ran outside.",
    "THAT was significant. My whole apartment building was swaying.",
    "Strongest I've felt since I moved here in 2018. Adrenaline pumping!",
  ],
  didnt_feel: [
    "Didn't feel anything here. Maybe I was driving?",
    "Nothing felt here. Was in a meeting and no one noticed.",
    "Slept right through it apparently!",
    "Didn't notice but I was on BART at the time.",
  ],
  question: [
    "Did anyone else feel that?",
    "Was that an earthquake or just me?",
    "Anyone know the magnitude yet?",
    "How long did it last for you?",
    "Is this related to the swarm activity?",
  ],
  swarm_related: [
    "Another one in the swarm! This is the 5th one I've felt this week.",
    "The swarm continues... getting used to these now.",
    "Part of the ongoing cluster. Interesting to track these patterns.",
    "Swarm activity picking up again. Stay prepared everyone!",
    "These small ones keep coming. Better than one big one I guess?",
  ],
};

// General discussion topics
const GENERAL_THREADS = [
  {
    title: "Best earthquake preparedness kits for families?",
    category: "preparedness",
    content: "With all the recent activity, I want to make sure my family is prepared. What emergency kits do you all recommend? Looking for something comprehensive but not too expensive. We have 2 kids (ages 5 and 8) and a dog.",
    replies: [
      { content: "We got the Ready America kit from Amazon. It has supplies for 4 people for 72 hours. Added extra water and dog food separately.", location: "Pleasanton" },
      { content: "Don't forget medications! We keep a 2-week supply of all prescriptions in our go-bag.", location: "San Ramon" },
      { content: "I'd recommend building your own kit. The pre-made ones often have cheap quality items. Start with water (1 gallon per person per day), first aid, flashlights, and go from there.", location: "Oakland" },
      { content: "We did a combo - bought a basic kit then added personal items. Don't forget important documents (copies of IDs, insurance papers) in a waterproof bag!", location: "Dublin" },
      { content: "Just went through our kit after the swarm started. Half the food was expired! Set a calendar reminder to check it every 6 months.", location: "Livermore" },
    ]
  },
  {
    title: "Understanding the Calaveras Fault - Resources?",
    category: "science",
    content: "I'm trying to learn more about the fault system under San Ramon/Dublin area. Can anyone recommend good resources or explain why we're seeing so much activity lately? I'm fascinated by the geology here.",
    replies: [
      { content: "USGS has great resources! The Calaveras Fault is actually one of the most active in the Bay Area. It runs from Hollister up through the East Bay.", location: "Berkeley" },
      { content: "Check out the earthquake.usgs.gov site. They have detailed maps showing all the fault lines. The recent swarm is pretty typical for Calaveras - it has these episodes regularly.", location: "Hayward" },
      { content: "I'm a geology grad student at Cal. The Calaveras is what we call a 'creeping' fault - it moves slowly and constantly rather than in big sudden jolts. That's why we get lots of small quakes.", location: "Berkeley" },
      { content: "The Hayward Fault is the one that really worries seismologists. It's 'locked' and building up stress. The Calaveras activity doesn't really affect it though - they're separate systems.", location: "Oakland" },
    ]
  },
  {
    title: "Anyone else's pets acting weird before quakes?",
    category: "general",
    content: "My dog has been super restless the past week and seems to know when a quake is coming. About 30 seconds before the last one, she started whining and hid under the bed. Anyone else notice this with their pets?",
    replies: [
      { content: "Yes! My cat always runs and hides about a minute before I feel anything. It's actually how I know to brace myself now 😂", location: "San Jose" },
      { content: "There's actually scientific debate about this. Some researchers think animals can feel the P-waves (faster, weaker waves) before the S-waves (the shaking we feel) arrive.", location: "Stanford" },
      { content: "My dogs didn't seem to notice at all. They slept through the last 3 quakes. Maybe it depends on the animal?", location: "Fremont" },
      { content: "Our bird goes crazy! Starts squawking and flapping around. Now I pay attention when he does that.", location: "Walnut Creek" },
      { content: "I've read that animals might hear or feel infrasound that we can't detect. Pretty amazing if true!", location: "Palo Alto" },
    ]
  },
  {
    title: "How do you explain earthquakes to young kids?",
    category: "neighborhood",
    content: "My 4-year-old has been asking a lot of questions after feeling some of the recent quakes. How do you all talk to your little ones about earthquakes without scaring them? Looking for age-appropriate ways to explain it.",
    replies: [
      { content: "We told our daughter that the Earth is like a big puzzle, and sometimes the pieces wiggle a little bit. She thought that was cool rather than scary!", location: "Dublin" },
      { content: "There are some great kids' books about earthquakes. 'Earthquake!' by Mia Posada is good for that age. Makes it educational rather than frightening.", location: "San Ramon" },
      { content: "We made it into a game - practiced 'drop, cover, hold on' like a fun drill. Now my son thinks he's a superhero earthquake responder 😊", location: "Pleasanton" },
      { content: "Our school had an earthquake drill and the teacher explained it really well. Maybe check what resources your kid's preschool has?", location: "Danville" },
    ]
  },
  {
    title: "Renters: Is your building up to code?",
    category: "preparedness",
    content: "I'm renting an older apartment building in Oakland (built in 1960s). After all this earthquake activity, I'm wondering if my building is safe. How do I find out if it's been retrofitted? Anyone know what to look for?",
    replies: [
      { content: "Oakland has a soft-story retrofit ordinance. You can check the city's website for a list of buildings that have completed retrofitting. If yours is on the 'not yet compliant' list, that's concerning.", location: "Oakland" },
      { content: "Look for the building permit history - you can usually find this online through the city. Retrofit work would show up there.", location: "Berkeley" },
      { content: "Ask your landlord directly! They're required to disclose certain information. If they're evasive, that's a red flag.", location: "San Francisco" },
      { content: "Soft-story buildings (the ones with parking on the ground floor and apartments above) are the biggest concern. If that's your building type, definitely investigate.", location: "Hayward" },
      { content: "I had the same concern. Ended up moving to a newer building. Peace of mind is worth it to me.", location: "Emeryville" },
    ]
  },
  {
    title: "Emergency communication plan - what's yours?",
    category: "preparedness", 
    content: "If the big one hits and cell towers go down, how are you planning to reach your family? We're scattered across the Bay Area during work/school hours. Looking for ideas on emergency communication plans.",
    replies: [
      { content: "We have an out-of-state contact that everyone knows to call/text. Sometimes long-distance calls work when local ones don't. My sister in Texas is our check-in point.", location: "San Jose" },
      { content: "Texts often work when calls don't - they use less bandwidth. We have a family group chat and everyone knows to send their status there first.", location: "Fremont" },
      { content: "We designated physical meetup points - one near each kid's school and one at home. If we can't communicate, we know where to find each other.", location: "Walnut Creek" },
      { content: "Got a pair of two-way radios. Good range for our area. Also useful for camping!", location: "Concord" },
      { content: "The Red Cross has a 'Safe and Well' website where you can register/search for loved ones after a disaster. Bookmark it!", location: "San Ramon" },
    ]
  },
];

// Helper to get random item from array
function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Helper to get random date within range
function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Helper to get intensity description
function getIntensity(mag: number): 'weak' | 'moderate' | 'strong' {
  if (mag < 2.5) return 'weak';
  if (mag < 4.0) return 'moderate';
  return 'strong';
}

async function seedForum() {
  if (!MONGODB_URI) {
    console.error('MONGODB_URI environment variable is required');
    process.exit(1);
  }

  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('earthquake-tracker');
    const threadsCollection = db.collection('forum_threads');
    const postsCollection = db.collection('forum_posts');
    
    // Clear existing forum data
    console.log('Clearing existing forum data...');
    await threadsCollection.deleteMany({});
    await postsCollection.deleteMany({});
    
    // Fetch recent earthquakes from USGS
    console.log('Fetching earthquake data from USGS...');
    const response = await fetch(
      'https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&minmagnitude=1.5&minlatitude=36.5&maxlatitude=38.5&minlongitude=-123&maxlongitude=-121&limit=100&orderby=time'
    );
    const data = await response.json();
    const earthquakes: EarthquakeFeature[] = data.features;
    
    console.log(`Found ${earthquakes.length} earthquakes`);
    
    // Track created threads
    let threadCount = 0;
    let postCount = 0;
    
    // Create threads for significant earthquakes (mag > 2.0)
    const significantQuakes = earthquakes.filter(eq => eq.properties.mag >= 2.0).slice(0, 20);
    
    for (const quake of significantQuakes) {
      const mag = quake.properties.mag;
      const place = quake.properties.place;
      const quakeTime = new Date(quake.properties.time);
      const intensity = getIntensity(mag);
      
      // Create thread with time slightly after the earthquake
      const threadTime = new Date(quakeTime.getTime() + Math.random() * 30 * 60 * 1000); // 0-30 min after
      
      const threadId = new ObjectId();
      const isSwarmArea = place.toLowerCase().includes('san ramon') || 
                          place.toLowerCase().includes('dublin') || 
                          place.toLowerCase().includes('pleasanton');
      
      // Generate thread title variations
      const titleVariations = [
        `M${mag.toFixed(1)} ${place} - Did you feel it?`,
        `Just felt an earthquake! M${mag.toFixed(1)} near ${place.split(',')[0]}`,
        `Earthquake just now - ${place}`,
        `M${mag.toFixed(1)} quake - ${place.split(',')[0]} area`,
      ];
      
      const thread = {
        _id: threadId,
        title: randomItem(titleVariations),
        slug: `m${mag.toFixed(1).replace('.', '')}-${place.split(',')[0].toLowerCase().replace(/\s+/g, '-')}-${threadId.toString().slice(-8)}`,
        category: 'earthquake' as const,
        author: randomItem(USERNAMES),
        authorLocation: randomItem(LOCATIONS),
        content: randomItem(EARTHQUAKE_COMMENTS.question) + '\n\n' + 
                 randomItem(intensity === 'weak' ? EARTHQUAKE_COMMENTS.felt_weak : 
                           intensity === 'moderate' ? EARTHQUAKE_COMMENTS.felt_moderate : 
                           EARTHQUAKE_COMMENTS.felt_strong),
        earthquakeId: quake.id,
        earthquakeData: {
          magnitude: mag,
          place: place,
          time: quakeTime.toISOString(),
        },
        isPinned: false,
        isLocked: false,
        viewCount: Math.floor(Math.random() * 500) + 50,
        postCount: 1,
        lastPostAt: threadTime,
        lastPostAuthor: null as string | null,
        createdAt: threadTime,
        updatedAt: threadTime,
        tags: isSwarmArea ? ['swarm', 'calaveras-fault'] : ['recent'],
      };
      
      // Create the original post
      const originalPost = {
        _id: new ObjectId(),
        threadId: threadId.toString(),
        author: thread.author,
        authorLocation: thread.authorLocation,
        content: thread.content,
        feltIt: true,
        intensity: intensity === 'weak' ? 2 : intensity === 'moderate' ? 3 : 4,
        likes: Math.floor(Math.random() * 20),
        createdAt: threadTime,
        isOriginalPost: true,
      };
      
      await postsCollection.insertOne(originalPost);
      postCount++;
      
      // Add random number of replies
      const numReplies = Math.floor(Math.random() * 8) + 2; // 2-9 replies
      let lastPostTime = threadTime;
      let lastAuthor = thread.author;
      
      for (let i = 0; i < numReplies; i++) {
        // Spread replies over a few hours
        const replyTime = new Date(lastPostTime.getTime() + Math.random() * 2 * 60 * 60 * 1000);
        if (replyTime > new Date()) break; // Don't create future posts
        
        const feltIt = Math.random() > 0.3;
        const author = randomItem(USERNAMES.filter(u => u !== lastAuthor));
        
        let commentPool: string[];
        if (!feltIt) {
          commentPool = EARTHQUAKE_COMMENTS.didnt_feel;
        } else if (isSwarmArea && Math.random() > 0.6) {
          commentPool = EARTHQUAKE_COMMENTS.swarm_related;
        } else {
          commentPool = intensity === 'weak' ? EARTHQUAKE_COMMENTS.felt_weak :
                       intensity === 'moderate' ? EARTHQUAKE_COMMENTS.felt_moderate :
                       EARTHQUAKE_COMMENTS.felt_strong;
        }
        
        const reply = {
          _id: new ObjectId(),
          threadId: threadId.toString(),
          author,
          authorLocation: randomItem(LOCATIONS),
          content: randomItem(commentPool),
          feltIt,
          intensity: feltIt ? (Math.floor(Math.random() * 3) + (intensity === 'weak' ? 1 : intensity === 'moderate' ? 2 : 3)) : undefined,
          likes: Math.floor(Math.random() * 10),
          createdAt: replyTime,
          isOriginalPost: false,
        };
        
        await postsCollection.insertOne(reply);
        postCount++;
        lastPostTime = replyTime;
        lastAuthor = author;
      }
      
      // Update thread with final post count and last activity
      thread.postCount = numReplies + 1;
      thread.lastPostAt = lastPostTime;
      thread.lastPostAuthor = lastAuthor;
      thread.updatedAt = lastPostTime;
      
      await threadsCollection.insertOne(thread);
      threadCount++;
      
      console.log(`Created thread: ${thread.title} (${numReplies + 1} posts)`);
    }
    
    // Create general discussion threads
    console.log('\nCreating general discussion threads...');
    
    const now = new Date();
    const fourWeeksAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
    
    for (const topic of GENERAL_THREADS) {
      const threadTime = randomDate(fourWeeksAgo, new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000));
      const threadId = new ObjectId();
      const author = randomItem(USERNAMES);
      
      const thread = {
        _id: threadId,
        title: topic.title,
        slug: `${topic.title.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-').slice(0, 60)}-${threadId.toString().slice(-8)}`,
        category: topic.category as 'general' | 'preparedness' | 'science' | 'neighborhood',
        author,
        authorLocation: randomItem(LOCATIONS),
        content: topic.content,
        isPinned: false,
        isLocked: false,
        viewCount: Math.floor(Math.random() * 800) + 100,
        postCount: 1,
        lastPostAt: threadTime,
        lastPostAuthor: null as string | null,
        createdAt: threadTime,
        updatedAt: threadTime,
        tags: null,
      };
      
      // Original post
      const originalPost = {
        _id: new ObjectId(),
        threadId: threadId.toString(),
        author: thread.author,
        authorLocation: thread.authorLocation,
        content: thread.content,
        likes: Math.floor(Math.random() * 30) + 5,
        createdAt: threadTime,
        isOriginalPost: true,
      };
      
      await postsCollection.insertOne(originalPost);
      postCount++;
      
      // Add replies spread over time
      let lastPostTime = threadTime;
      let lastAuthor = author;
      
      for (const replyData of topic.replies) {
        // Spread replies over days/weeks
        const replyTime = new Date(lastPostTime.getTime() + Math.random() * 3 * 24 * 60 * 60 * 1000);
        if (replyTime > now) break;
        
        const replyAuthor = randomItem(USERNAMES.filter(u => u !== lastAuthor));
        
        const reply = {
          _id: new ObjectId(),
          threadId: threadId.toString(),
          author: replyAuthor,
          authorLocation: replyData.location,
          content: replyData.content,
          likes: Math.floor(Math.random() * 15),
          createdAt: replyTime,
          isOriginalPost: false,
        };
        
        await postsCollection.insertOne(reply);
        postCount++;
        lastPostTime = replyTime;
        lastAuthor = replyAuthor;
      }
      
      // Update thread
      thread.postCount = topic.replies.length + 1;
      thread.lastPostAt = lastPostTime;
      thread.lastPostAuthor = lastAuthor;
      thread.updatedAt = lastPostTime;
      
      await threadsCollection.insertOne(thread);
      threadCount++;
      
      console.log(`Created thread: ${topic.title} (${topic.replies.length + 1} posts)`);
    }
    
    // Add a few neighborhood-specific threads
    const neighborhoodThreads = [
      {
        title: "San Ramon residents - how are you all doing with the swarm?",
        content: "Been a wild couple of weeks with all these quakes centered right under us. How's everyone holding up? Any damage reports or just the usual shaking? My kids are getting jumpy every time the house creaks now.",
        location: "San Ramon",
      },
      {
        title: "Dublin: Anyone know about the construction and ground stability?",
        content: "With all the new development happening in Dublin and the ongoing earthquake swarm, I'm curious if anyone knows how the new buildings are being designed for seismic safety. Seems like important info given our location on the fault.",
        location: "Dublin",
      },
      {
        title: "East Bay earthquake preparedness meetup?",
        content: "Would anyone be interested in an informal meetup to discuss earthquake preparedness? We could share tips, maybe do a neighborhood walk to identify safe spots and hazards. I'm in the Danville/San Ramon area but happy to meet anywhere accessible.",
        location: "Danville",
      },
    ];
    
    for (const nt of neighborhoodThreads) {
      const threadTime = randomDate(new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000), new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000));
      const threadId = new ObjectId();
      const author = randomItem(USERNAMES);
      
      const thread = {
        _id: threadId,
        title: nt.title,
        slug: `${nt.title.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-').slice(0, 60)}-${threadId.toString().slice(-8)}`,
        category: 'neighborhood' as const,
        author,
        authorLocation: nt.location,
        content: nt.content,
        isPinned: false,
        isLocked: false,
        viewCount: Math.floor(Math.random() * 400) + 80,
        postCount: 1,
        lastPostAt: threadTime,
        lastPostAuthor: null as string | null,
        createdAt: threadTime,
        updatedAt: threadTime,
        tags: null,
      };
      
      const originalPost = {
        _id: new ObjectId(),
        threadId: threadId.toString(),
        author: thread.author,
        authorLocation: nt.location,
        content: nt.content,
        likes: Math.floor(Math.random() * 20) + 3,
        createdAt: threadTime,
        isOriginalPost: true,
      };
      
      await postsCollection.insertOne(originalPost);
      postCount++;
      
      // Add a few supportive replies
      const replies = [
        "Thanks for starting this thread! It's nice to know neighbors are looking out for each other.",
        "We're hanging in there. The constant small quakes are unnerving but no damage here thankfully.",
        "Great idea! Would definitely join a meetup. Safety in community!",
        "Been here 15 years and never felt this much activity. Staying positive though!",
      ];
      
      let lastPostTime = threadTime;
      let lastAuthor = author;
      
      for (let i = 0; i < Math.min(3, replies.length); i++) {
        const replyTime = new Date(lastPostTime.getTime() + Math.random() * 24 * 60 * 60 * 1000);
        if (replyTime > now) break;
        
        const replyAuthor = randomItem(USERNAMES.filter(u => u !== lastAuthor));
        
        const reply = {
          _id: new ObjectId(),
          threadId: threadId.toString(),
          author: replyAuthor,
          authorLocation: randomItem([nt.location, ...LOCATIONS.slice(0, 10)]),
          content: replies[i],
          likes: Math.floor(Math.random() * 8),
          createdAt: replyTime,
          isOriginalPost: false,
        };
        
        await postsCollection.insertOne(reply);
        postCount++;
        lastPostTime = replyTime;
        lastAuthor = replyAuthor;
      }
      
      thread.postCount = Math.min(3, replies.length) + 1;
      thread.lastPostAt = lastPostTime;
      thread.lastPostAuthor = lastAuthor;
      thread.updatedAt = lastPostTime;
      
      await threadsCollection.insertOne(thread);
      threadCount++;
      
      console.log(`Created neighborhood thread: ${nt.title}`);
    }
    
    console.log(`\n✅ Seeding complete!`);
    console.log(`   Created ${threadCount} threads`);
    console.log(`   Created ${postCount} posts`);
    
  } catch (error) {
    console.error('Error seeding forum:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

seedForum();

