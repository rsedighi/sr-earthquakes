# Real-World User Scenarios: Earthquake Explorer

## Scenario 1: The New Homeowner

### Background
**Name**: Jessica Chen  
**Location**: Bought a house in Fremont, CA  
**Technical Level**: Non-technical (uses Instagram, Gmail, online shopping)  
**Goal**: Understand earthquake risk before her kids start at the nearby school

### User Journey

#### Visit 1: Discovery (5 minutes)
1. **Lands on My Neighborhood page**
   - Sees: "Find earthquakes people felt near your address"
   - Thinks: "Perfect! Let me check my new address"

2. **Enters home address**
   ```
   Types: "123 Oak St, Fremont, CA"
   → Auto-completes to full address
   → Map zooms to her location
   ✓ "Your address is saved for your next visit"
   ```

3. **Sees immediate results**
   ```
   Default view: Felt earthquakes, 15 miles, Last week
   Found 3 earthquakes
   
   Stats shown:
   📊 Total: 3
   👥 Felt: 2  
   ⚠️ Largest: M2.8
   📍 Closest: 8.2 miles
   ```

4. **Gets curious about history**
   - Clicks facet: "Last year" instead of "Last week"
   - Results update: **89 earthquakes found**
   - Thinks: "Wow, that's more than I expected"

5. **Wants to focus on concerning ones**
   - Clicks Quick Filter: "🔥 Felt by Many" (50+ people)
   - Results filter to: **5 earthquakes**
   - Feels relieved: "Only 5 significant ones in a year"

6. **Saves for future reference**
   - Clicks "💾 Save"
   - Names it: "Annual Check - My House"
   - Gets confirmation: ✓ Saved

#### Visit 2: Quick Check (30 seconds)
**Two weeks later, after feeling a shake at night**

1. Returns to site (address auto-loaded)
2. Changes time to "Last 24 hours"
3. Sees: **M2.1, 6 miles away, 15 people felt it**
4. Reads: "2:15 AM, shallow depth (4km)"
5. Thinks: "That explains it! Not a big deal."

---

## Scenario 2: The Anxious Parent

### Background
**Name**: Michael Rodriguez  
**Location**: San Francisco, CA  
**Technical Level**: Non-technical  
**Goal**: Monitor earthquakes near his daughter's elementary school  
**Trigger**: Recent news about "The Big One"

### User Journey

#### Initial Setup (7 minutes)
1. **Enters school address**
   ```
   "Lincoln Elementary, San Francisco"
   → Selects from dropdown
   → Map shows school location
   ```

2. **Wants to know about strong earthquakes**
   - Not sure what "strong" means in earthquake terms
   - Sees Quick Filter: "⚡ Strong & Close"
   - Hovers, sees tooltip: "M3.0+ within 10 miles"
   - Clicks it

3. **Results show**
   ```
   Found 8 earthquakes in the last year
   Largest: M3.4, 7.2 miles away
   Most recent: M3.1, 12 days ago
   ```

4. **Reads the summary**
   > "Within 10 miles of San Francisco, there have been 8 earthquakes 
   > with magnitude 3.0 or greater in the last year. Most were felt by 
   > fewer than 20 people and caused no damage."

5. **Feels somewhat reassured but wants alerts**
   - Saves query as: "School Area - Significant Events"
   - Bookmarks page
   - Plans to check weekly

#### Weekly Check (1 minute)
**Every Monday morning for the next 3 months**

1. Opens bookmark
2. School address auto-loads
3. Clicks saved query: "School Area - Significant Events"
4. Usually sees: "0 new earthquakes since last check"
5. Occasionally sees small ones, reads details
6. Gradually becomes less anxious as he understands patterns

---

## Scenario 3: The Data Curious Resident

### Background
**Name**: Priya Sharma  
**Location**: Berkeley, CA  
**Technical Level**: Comfortable with technology (uses Excel, Spotify algorithms)  
**Goal**: Understand earthquake patterns in her area  
**Motivation**: Genuine curiosity after reading about the Hayward Fault

### User Journey

#### Exploration Session (25 minutes)

1. **Starts with basics**
   - Enters address
   - Default view shows recent activity
   - Thinks: "I want to see more data"

2. **Changes time range to "All time" (10 years)**
   ```
   Now seeing: 1,247 earthquakes
   ```
   - Overwhelmed by the number
   - Decides to filter

3. **Uses Visual Query Builder**
   ```
   Clicks "Build Custom Search"
   
   First query:
   - Magnitude > 3.0
   - Applies
   - Results: 45 earthquakes over 10 years
   - Notes: ~4-5 per year, manageable
   ```

4. **Explores depth patterns**
   ```
   New query:
   - Magnitude > 2.0
   - Depth < 5km (shallow)
   - Results: 234 earthquakes
   
   Then compares:
   - Magnitude > 2.0  
   - Depth > 15km (deep)
   - Results: 67 earthquakes
   
   Conclusion: "Shallow earthquakes are way more common!"
   ```

5. **Investigates "felt" reports**
   ```
   Query:
   - Magnitude between 2.0 and 3.0
   - Felt > 10 people
   - Within 10 miles
   - Results: 23 earthquakes
   
   Observation: "Even small earthquakes can be widely felt 
   when they're shallow and close"
   ```

6. **Saves interesting queries**
   - "Strong Events (M3.0+)"
   - "Shallow Activity Near Me"
   - "Felt by Many People"

7. **Shares findings**
   - Clicks share button on "Shallow Activity Near Me"
   - Gets link: `baytremor.com/my-area?q=depth_lt_5_dist_10`
   - Posts to neighborhood Facebook group
   - Comments: "This is cool! I had no idea we could explore the data like this"

---

## Scenario 4: The Real Estate Agent

### Background
**Name**: David Kim  
**Location**: Works across Bay Area  
**Technical Level**: Tech-savvy  
**Goal**: Answer clients' earthquake questions with data  
**Use Case**: Clients always ask about earthquake risk

### User Journey

#### Building a Reference System (30 minutes)

1. **Sets up multiple saved searches for different areas**
   ```
   Oakland Area - Strong Events:
   - Magnitude >= 3.5
   - Within 15 miles of Oakland City Hall
   - Last 5 years
   
   Peninsula - Recent Activity:
   - Magnitude >= 2.5
   - Within 20 miles of Palo Alto
   - Last 6 months
   
   SF - Felt Earthquakes:
   - Felt by people (> 0)
   - Magnitude >= 2.0
   - Within 10 miles of SF
   - Last 2 years
   ```

2. **Creates area comparisons**
   ```
   For a client looking at Oakland vs San Mateo:
   
   Oakland (10-year history):
   - 156 earthquakes > M2.0
   - 23 felt by 50+ people
   - Largest: M4.2
   
   San Mateo (10-year history):
   - 89 earthquakes > M2.0
   - 12 felt by 50+ people
   - Largest: M3.8
   ```

3. **Uses in client meetings**
   - Opens laptop, shows live data
   - Walks through the queries
   - Client: "This is so much more helpful than just saying 'earthquakes happen everywhere'"
   - David: "You can check this yourself anytime, here's the link"

4. **Becomes a power user**
   - Has 15+ saved queries
   - Checks weekly for each active client's area
   - Shares specific query links in follow-up emails
   - Clients appreciate the data-driven approach

---

## Scenario 5: The Worried Grandmother

### Background
**Name**: Margaret Wong  
**Location**: Daly City, CA  
**Age**: 68  
**Technical Level**: Basic (uses iPad for email, FaceTime)  
**Goal**: Check on earthquake activity near her home  
**Trigger**: Daughter showed her the site

### User Journey

#### First Time with Daughter's Help (10 minutes)

1. **Daughter sets it up**
   - Enters grandma's address
   - Explains: "It's like searching on Amazon, but for earthquakes"
   - Shows Quick Filters
   - Margaret nods: "Oh, like when I filter shoes by size!"

2. **Daughter creates a simple saved search**
   ```
   "My Area - Anything I Should Know"
   - Magnitude >= 3.0
   - Within 10 miles
   - Felt by people
   - Last week
   ```
   - Saves it with an obvious name
   - Bookmarks the page on iPad

3. **Shows her the one-click process**
   ```
   1. Open bookmark
   2. Click "My Area - Anything I Should Know"
   3. See results (usually 0)
   4. If any results: Click to read details
   ```

#### Independent Use (2 minutes, weekly)

1. **Margaret's routine every Sunday**
   - Opens bookmark
   - Sees her address already there (saved)
   - Clicks her saved search
   - Reads result: "0 earthquakes found matching your filters"
   - Feels reassured
   - Closes tab

2. **When there IS a result**
   ```
   Found 1 earthquake:
   M3.2 • San Bruno
   5.2 miles away • 45 people felt it
   December 20, 2024 at 2:15 PM
   ```
   - Reads the summary
   - Thinks: "I didn't feel it, must have been napping"
   - Feels informed, not scared
   - Calls daughter to discuss

---

## Scenario 6: The Science Teacher

### Background
**Name**: Alex Thompson  
**Location**: Oakland, CA  
**Role**: 7th grade science teacher  
**Goal**: Create an earthquake unit with real local data  
**Technical Level**: Tech-savvy

### User Journey

#### Lesson Planning (45 minutes)

1. **Exploring for teaching material**
   ```
   Goal: Show students how to ask questions about data
   ```

2. **Creates demonstration queries**
   ```
   Demo 1: "Are bigger earthquakes rare?"
   - Shows facets: 1,234 under M2.0 vs 5 over M5.0
   - Clear visual of magnitude distribution
   
   Demo 2: "What makes people feel earthquakes?"
   - Compares M2.5 at 2km depth (128 felt it)
   - vs M2.5 at 25km depth (3 felt it)
   - Teaches: Depth matters!
   
   Demo 3: "How active is our area?"
   - Within 10 miles of school
   - Last month: 12 earthquakes
   - Last year: 145 earthquakes
   - Discusses: What's normal?
   ```

3. **Student Activity Design**
   ```
   Assignment: "Be an Earthquake Detective"
   
   Students must:
   1. Enter their home address
   2. Use Quick Filters to explore
   3. Build one custom query
   4. Share their findings
   5. Answer: "What surprised you?"
   ```

4. **In Class (40-minute lesson)**
   - Projects the site on screen
   - Students follow along on Chromebooks
   - Live demo of Visual Query Builder
   - Students: "This is cool! It's like a game!"
   - Teachers from other classes ask about the resource

5. **Student Presentations**
   ```
   Student 1: "I found 234 earthquakes within 5 miles of my 
   house in 10 years! But only 5 were over M3.0, so most are tiny."
   
   Student 2: "Shallow earthquakes are more common than deep ones 
   in our area. I used the depth filter to figure this out."
   
   Student 3: "My grandma lives in Fremont. I checked her area and 
   it has fewer earthquakes than Oakland. I sent her the link!"
   ```

---

## Common Patterns Across Users

### What Works Well

1. **Progressive Disclosure**
   - Beginners use Quick Filters (1-click)
   - Intermediate users use Facets (checkboxes)
   - Advanced users use Query Builder or type queries

2. **Saved Searches**
   - Everyone saves at least one query
   - Becomes their "default view"
   - Reduces anxiety (checking becomes routine)

3. **Visual Feedback**
   - Counts next to facets guide exploration
   - "0 results" is clear and not scary
   - Map updates reinforce filter changes

4. **Natural Language**
   - "felt by people" > "felt > 0"
   - "within 10 miles" > "distance <= 10"
   - Reduces cognitive load

### Common User Flows

#### Quick Check (Most Common)
```
1. Land on page (address auto-loads)
2. Maybe adjust time range
3. Scan results
4. Done
Time: 30 seconds
```

#### First Time Exploration
```
1. Enter address
2. Try 2-3 Quick Filters
3. Play with facets
4. Save one query
5. Bookmark page
Time: 5-10 minutes
```

#### Deep Analysis
```
1. Load saved address
2. Build custom queries
3. Compare different filters
4. Take notes or screenshots
5. Share findings
Time: 20-30 minutes
```

### Drop-off Points (Where Users Get Stuck)

1. **Too Many Results**
   - Solution: Default to "felt earthquakes only"
   - Shows more relevant data first

2. **Empty Results**
   - Solution: Suggest less restrictive filters
   - "Try increasing your radius to 25 miles"

3. **Not Understanding Magnitude Scale**
   - Solution: Labels like "Minor", "Light", "Moderate"
   - Tooltip: "M3.0 = felt like a truck driving by"

4. **Overwhelming Facets**
   - Solution: Start with only 3 facets expanded
   - Let users expand others if interested

---

## Success Indicators

### User Engagement Metrics
- 75% of users try at least one filter
- 45% save at least one query
- 60% return within one week
- 30% share their results

### Understanding Metrics
- Users correctly interpret magnitude scale
- Users understand "felt reports" meaning
- Users can explain what filters do

### Emotional Metrics
- Reduced anxiety about earthquakes
- Increased feeling of control/preparedness
- Trust in the data and platform

---

These scenarios show how the Earthquake Explorer serves everyone from tech novices to data enthusiasts, making earthquake data accessible and actionable for real-world needs.

