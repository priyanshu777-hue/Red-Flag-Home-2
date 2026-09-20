/**
 * Red Flag Homes Network — Reusable Occupancy & Seasonal Demand Chart Component
 * Provides interactive seasonal occupancy trends, ADR insights, and market analytics
 * for partner cities and development hubs.
 */

(function (global) {
  'use strict';

  // Comprehensive market datasets for development hubs
  const MARKET_DATA = {
    'Goa': {
      city: 'Goa',
      region: 'West Coast, India',
      country: 'IN',
      type: 'Coastal Outposts',
      annualAvg: 73,
      peakWindow: 'Nov – Feb',
      peakAdr: '₹28,000 – ₹45,000',
      lowMonth: 'Jun (48%)',
      multiplier: '2.4x ADR Surge',
      investorIndex: 'A+ (High Yield)',
      description: 'Global beach luxury and winter sun corridor with surging year-end festival premiums and burgeoning monsoon wellness tourism.',
      months: [
        { name: 'Jan', full: 'January', rate: 92, adr: '₹32,000', tier: 'Peak', driver: 'Winter sun, international travelers & New Year spillover' },
        { name: 'Feb', full: 'February', rate: 88, adr: '₹28,500', tier: 'Peak', driver: 'Goa Carnival, pleasant climate & luxury retreats' },
        { name: 'Mar', full: 'March', rate: 74, adr: '₹22,000', tier: 'Shoulder', driver: 'Spring transition & creative co-living' },
        { name: 'Apr', full: 'April', rate: 65, adr: '₹18,500', tier: 'Shoulder', driver: 'Easter holidays & domestic family getaways' },
        { name: 'May', full: 'May', rate: 56, adr: '₹16,000', tier: 'Value', driver: 'Summer shoulder & discounted private villa buyouts' },
        { name: 'Jun', full: 'June', rate: 48, adr: '₹14,000', tier: 'Value', driver: 'Southwest monsoon onset & green wellness travelers' },
        { name: 'Jul', full: 'July', rate: 52, adr: '₹15,000', tier: 'Value', driver: 'Lush monsoon escapes & writers/artist residencies' },
        { name: 'Aug', full: 'August', rate: 58, adr: '₹16,500', tier: 'Value', driver: 'Independence Day & Janmashtami long weekends' },
        { name: 'Sep', full: 'September', rate: 68, adr: '₹19,000', tier: 'Shoulder', driver: 'Post-monsoon clearing & music season preparations' },
        { name: 'Oct', full: 'October', rate: 78, adr: '₹24,000', tier: 'High', driver: 'Charter arrivals & Diwali holiday influx' },
        { name: 'Nov', full: 'November', rate: 90, adr: '₹30,000', tier: 'Peak', driver: 'IFFI, bridal parties & European winter departures' },
        { name: 'Dec', full: 'December', rate: 98, adr: '₹46,000', tier: 'Peak', driver: 'Festive week, Sunburn & NYE super-peak premiums' }
      ]
    },
    'Rishikesh': {
      city: 'Rishikesh',
      region: 'Uttarakhand, India',
      country: 'IN',
      type: 'Ganges Foothills',
      annualAvg: 74,
      peakWindow: 'Mar – May & Oct – Nov',
      peakAdr: '₹18,000 – ₹32,000',
      lowMonth: 'Jul (45%)',
      multiplier: '2.1x ADR Surge',
      investorIndex: 'A (Steady Wellness)',
      description: 'Spiritual wellness capital and Himalayan adventure gateway with dual spring/autumn high seasons and year-round executive retreats.',
      months: [
        { name: 'Jan', full: 'January', rate: 62, adr: '₹14,500', tier: 'Value', driver: 'Chilly Himalayan winter & silent meditation camps' },
        { name: 'Feb', full: 'February', rate: 72, adr: '₹17,000', tier: 'Shoulder', driver: 'Spring warmup & spiritual seekers influx' },
        { name: 'Mar', full: 'March', rate: 90, adr: '₹26,000', tier: 'Peak', driver: 'International Yoga Festival & holy Holi gatherings' },
        { name: 'Apr', full: 'April', rate: 94, adr: '₹28,500', tier: 'Peak', driver: 'White-water rafting high season & clear skies' },
        { name: 'May', full: 'May', rate: 88, adr: '₹25,000', tier: 'High', driver: 'Summer escapes from plains & Himalayan trekking base' },
        { name: 'Jun', full: 'June', rate: 70, adr: '₹18,000', tier: 'Shoulder', driver: 'Pre-monsoon river adventure wind-down' },
        { name: 'Jul', full: 'July', rate: 45, adr: '₹12,000', tier: 'Value', driver: 'Ganges monsoon overflow & pilgrimage restrictions' },
        { name: 'Aug', full: 'August', rate: 48, adr: '₹13,000', tier: 'Value', driver: 'Lush greenery & indoor Ayurvedic detox retreats' },
        { name: 'Sep', full: 'September', rate: 72, adr: '₹18,500', tier: 'Shoulder', driver: 'Post-monsoon river re-opening & autumn arrivals' },
        { name: 'Oct', full: 'October', rate: 92, adr: '₹27,000', tier: 'Peak', driver: 'Optimal weather, Navratri & adventure expeditions' },
        { name: 'Nov', full: 'November', rate: 88, adr: '₹24,500', tier: 'High', driver: 'Diwali escapes & crisp mountain stargazing' },
        { name: 'Dec', full: 'December', rate: 76, adr: '₹21,000', tier: 'Shoulder', driver: 'Winter solstice mindfulness & fireside luxury' }
      ]
    },
    'Alibaug': {
      city: 'Alibaug',
      region: 'Maharashtra, India',
      country: 'IN',
      type: 'Coastal Corridor',
      annualAvg: 82,
      peakWindow: 'Oct – Jan & Weekends',
      peakAdr: '₹35,000 – ₹60,000',
      lowMonth: 'Jun (70%)',
      multiplier: '1.9x ADR Surge',
      investorIndex: 'A+ (High Velocity)',
      description: 'Ultra-exclusive private villa haven 20 mins by speed boat from Mumbai, commanding consistent 90%+ weekend occupancies year-round.',
      months: [
        { name: 'Jan', full: 'January', rate: 84, adr: '₹38,000', tier: 'High', driver: 'Speedboat commuters & pleasant coastal weekends' },
        { name: 'Feb', full: 'February', rate: 82, adr: '₹36,000', tier: 'High', driver: 'Corporate leadership offsites & private gatherings' },
        { name: 'Mar', full: 'March', rate: 78, adr: '₹32,000', tier: 'Shoulder', driver: 'Long weekends & bespoke intimate celebrations' },
        { name: 'Apr', full: 'April', rate: 80, adr: '₹34,000', tier: 'High', driver: 'Summer pool villa getaways & Mumbai family stays' },
        { name: 'May', full: 'May', rate: 84, adr: '₹36,000', tier: 'High', driver: 'School vacation sanctuary & sunset harbor retreats' },
        { name: 'Jun', full: 'June', rate: 70, adr: '₹28,000', tier: 'Shoulder', driver: 'Ferry pause / road access transition' },
        { name: 'Jul', full: 'July', rate: 76, adr: '₹32,000', tier: 'Shoulder', driver: 'Lush monsoon greenery villa parties & road trips' },
        { name: 'Aug', full: 'August', rate: 82, adr: '₹35,000', tier: 'High', driver: 'Monsoon long-weekend surges & private chef dining' },
        { name: 'Sep', full: 'September', rate: 78, adr: '₹33,000', tier: 'Shoulder', driver: 'Ferry service resumption & Ganesh festival stays' },
        { name: 'Oct', full: 'October', rate: 88, adr: '₹40,000', tier: 'High', driver: 'Autumn coastal breeze & Diwali family buyouts' },
        { name: 'Nov', full: 'November', rate: 92, adr: '₹44,000', tier: 'Peak', driver: 'Bespoke destination weddings & yacht club events' },
        { name: 'Dec', full: 'December', rate: 96, adr: '₹55,000', tier: 'Peak', driver: 'High-society Christmas & New Year celebrations' }
      ]
    },
    'Udaipur': {
      city: 'Udaipur',
      region: 'Rajasthan, India',
      country: 'IN',
      type: 'Mewar Estates',
      annualAvg: 76,
      peakWindow: 'Oct – Mar',
      peakAdr: '₹38,000 – ₹70,000',
      lowMonth: 'May (42%)',
      multiplier: '2.6x ADR Surge',
      investorIndex: 'A+ (Elite Luxury)',
      description: 'The City of Lakes reigns as India’s highest-ADR royal heritage wedding and luxury leisure market during the golden winter corridor.',
      months: [
        { name: 'Jan', full: 'January', rate: 92, adr: '₹48,000', tier: 'Peak', driver: 'High-society winter weddings & royal polo season' },
        { name: 'Feb', full: 'February', rate: 88, adr: '₹42,000', tier: 'Peak', driver: 'Valentine lakeside luxury & global heritage travelers' },
        { name: 'Mar', full: 'March', rate: 76, adr: '₹30,000', tier: 'Shoulder', driver: 'Royal Mewar Holika Dahan festival' },
        { name: 'Apr', full: 'April', rate: 54, adr: '₹20,000', tier: 'Shoulder', driver: 'Spring shoulder & indoor heritage tourism' },
        { name: 'May', full: 'May', rate: 42, adr: '₹16,000', tier: 'Value', driver: 'Peak summer arid conditions' },
        { name: 'Jun', full: 'June', rate: 50, adr: '₹18,000', tier: 'Value', driver: 'Pre-monsoon lake cloudscapes' },
        { name: 'Jul', full: 'July', rate: 68, adr: '₹26,000', tier: 'Shoulder', driver: 'Monsoon fills Lake Pichola; dramatic palace views' },
        { name: 'Aug', full: 'August', rate: 74, adr: '₹28,000', tier: 'Shoulder', driver: 'Green Aravali hills & royal retreat stays' },
        { name: 'Sep', full: 'September', rate: 80, adr: '₹32,000', tier: 'High', driver: 'Pre-wedding site visits & luxury autumn travel' },
        { name: 'Oct', full: 'October', rate: 90, adr: '₹44,000', tier: 'Peak', driver: 'Diwali palace illuminations & wedding kick-off' },
        { name: 'Nov', full: 'November', rate: 96, adr: '₹55,000', tier: 'Peak', driver: 'Super-peak royal weddings & international arrivals' },
        { name: 'Dec', full: 'December', rate: 98, adr: '₹68,000', tier: 'Peak', driver: 'Christmas palace stays & lavish New Year galas' }
      ]
    },
    'Kasauli': {
      city: 'Kasauli',
      region: 'Himachal Pradesh, India',
      country: 'IN',
      type: 'Himachal Ridge',
      annualAvg: 80,
      peakWindow: 'Apr – Jun & Dec – Jan',
      peakAdr: '₹22,000 – ₹38,000',
      lowMonth: 'Aug (58%)',
      multiplier: '1.8x ADR Surge',
      investorIndex: 'A (High Resilience)',
      description: 'Charming colonial pine ridge outpost 1 hour from Chandigarh and 4 hours from Delhi, offering tranquil high-altitude escapes.',
      months: [
        { name: 'Jan', full: 'January', rate: 80, adr: '₹26,000', tier: 'High', driver: 'Winter snowfall, cedar fireplaces & crisp mountain air' },
        { name: 'Feb', full: 'February', rate: 68, adr: '₹20,000', tier: 'Shoulder', driver: 'Late winter tranquility & writer escapes' },
        { name: 'Mar', full: 'March', rate: 75, adr: '₹22,000', tier: 'Shoulder', driver: 'Pine blossom spring & warm sunshine' },
        { name: 'Apr', full: 'April', rate: 92, adr: '₹32,000', tier: 'Peak', driver: 'Delhi heatwave escape & long weekends' },
        { name: 'May', full: 'May', rate: 96, adr: '₹36,000', tier: 'Peak', driver: 'Summer vacation peak & colonial trails' },
        { name: 'Jun', full: 'June', rate: 94, adr: '₹34,000', tier: 'Peak', driver: 'Pre-monsoon cool mountain sanctuary' },
        { name: 'Jul', full: 'July', rate: 62, adr: '₹18,000', tier: 'Value', driver: 'Monsoon mist & mountain drive caution' },
        { name: 'Aug', full: 'August', rate: 58, adr: '₹17,000', tier: 'Value', driver: 'Lush green valleys & cloud photography' },
        { name: 'Sep', full: 'September', rate: 74, adr: '₹22,000', tier: 'Shoulder', driver: 'Clear blue skies & autumn onset' },
        { name: 'Oct', full: 'October', rate: 86, adr: '₹28,000', tier: 'High', driver: 'Kasauli Lit Fest & Diwali holiday stays' },
        { name: 'Nov', full: 'November', rate: 82, adr: '₹26,000', tier: 'High', driver: 'Stargazing, crisp evenings & private bonfires' },
        { name: 'Dec', full: 'December', rate: 88, adr: '₹32,000', tier: 'Peak', driver: 'Christmas chill & New Year mountain celebrations' }
      ]
    },
    'Coorg': {
      city: 'Coorg',
      region: 'Karnataka, India',
      country: 'IN',
      type: 'Highland Reserve',
      annualAvg: 80,
      peakWindow: 'Oct – May',
      peakAdr: '₹20,000 – ₹36,000',
      lowMonth: 'Jul (62%)',
      multiplier: '1.7x ADR Surge',
      investorIndex: 'A (Steady Yield)',
      description: 'Known as the Scotland of India, this coffee plantation highland serves Bengaluru’s elite tech executives and luxury road-trippers.',
      months: [
        { name: 'Jan', full: 'January', rate: 86, adr: '₹27,000', tier: 'High', driver: 'Coffee bean harvesting & pleasant misty mornings' },
        { name: 'Feb', full: 'February', rate: 82, adr: '₹25,000', tier: 'High', driver: 'Coffee white blossom season & romantic retreats' },
        { name: 'Mar', full: 'March', rate: 76, adr: '₹22,000', tier: 'Shoulder', driver: 'Spring plantation walking trails' },
        { name: 'Apr', full: 'April', rate: 88, adr: '₹28,000', tier: 'High', driver: 'Bengaluru summer school break escapes' },
        { name: 'May', full: 'May', rate: 90, adr: '₹30,000', tier: 'Peak', driver: 'Peak summer hill retreat demand' },
        { name: 'Jun', full: 'June', rate: 65, adr: '₹19,000', tier: 'Shoulder', driver: 'Early monsoon rains & river streams filling' },
        { name: 'Jul', full: 'July', rate: 62, adr: '₹18,000', tier: 'Value', driver: 'Heavy monsoon downpours & cozy estate indoor stays' },
        { name: 'Aug', full: 'August', rate: 68, adr: '₹20,000', tier: 'Value', driver: 'Waterfalls in full glory & long weekend trips' },
        { name: 'Sep', full: 'September', rate: 75, adr: '₹22,000', tier: 'Shoulder', driver: 'Kailpodh harvest festival celebrations' },
        { name: 'Oct', full: 'October', rate: 84, adr: '₹26,000', tier: 'High', driver: 'Kaveri Sankramana festival & lush greenery' },
        { name: 'Nov', full: 'November', rate: 90, adr: '₹29,000', tier: 'Peak', driver: 'Diwali holidays & post-monsoon coffee tours' },
        { name: 'Dec', full: 'December', rate: 94, adr: '₹34,000', tier: 'Peak', driver: 'Year-end plantation galas & cozy mountain luxury' }
      ]
    },
    'Lonavala': {
      city: 'Lonavala',
      region: 'Western Ghats, Maharashtra',
      country: 'IN',
      type: 'Western Ghats',
      annualAvg: 86,
      peakWindow: 'Jun – Sep & Weekends',
      peakAdr: '₹25,000 – ₹48,000',
      lowMonth: 'Mar (72%)',
      multiplier: '1.9x ADR Surge',
      investorIndex: 'A+ (Monsoon Champion)',
      description: 'The primary drive-to mountain corridor for Mumbai and Pune with an explosive monsoon peak from gushing waterfalls and lush mist.',
      months: [
        { name: 'Jan', full: 'January', rate: 85, adr: '₹30,000', tier: 'High', driver: 'Winter cool climate & weekend villa parties' },
        { name: 'Feb', full: 'February', rate: 78, adr: '₹26,000', tier: 'Shoulder', driver: 'Corporate weekend escapes & road trips' },
        { name: 'Mar', full: 'March', rate: 72, adr: '₹24,000', tier: 'Shoulder', driver: 'Dry spring transition & value retreats' },
        { name: 'Apr', full: 'April', rate: 80, adr: '₹28,000', tier: 'High', driver: 'Pre-summer family pool villa stays' },
        { name: 'May', full: 'May', rate: 86, adr: '₹32,000', tier: 'High', driver: 'Summer holidays & expressway rush' },
        { name: 'Jun', full: 'June', rate: 92, adr: '₹38,000', tier: 'Peak', driver: 'Monsoon clouds arrive; massive weekend demand' },
        { name: 'Jul', full: 'July', rate: 96, adr: '₹42,000', tier: 'Peak', driver: 'Waterfall season peak & misty cliffside stays' },
        { name: 'Aug', full: 'August', rate: 94, adr: '₹40,000', tier: 'Peak', driver: 'Green valley drives & continuous weekend sellouts' },
        { name: 'Sep', full: 'September', rate: 88, adr: '₹34,000', tier: 'High', driver: 'Late monsoon magic & Ganesh festival breaks' },
        { name: 'Oct', full: 'October', rate: 82, adr: '₹30,000', tier: 'High', driver: 'Diwali stays & sunset view villa bookings' },
        { name: 'Nov', full: 'November', rate: 88, adr: '₹32,000', tier: 'High', driver: 'Wedding parties & corporate offsites' },
        { name: 'Dec', full: 'December', rate: 95, adr: '₹44,000', tier: 'Peak', driver: 'Festive week & New Year mountain fireworks' }
      ]
    },
    'Jaipur': {
      city: 'Jaipur',
      region: 'Rajasthan, India',
      country: 'IN',
      type: 'Rajputana Corridor',
      annualAvg: 75,
      peakWindow: 'Oct – Mar',
      peakAdr: '₹26,000 – ₹48,000',
      lowMonth: 'May (44%)',
      multiplier: '2.4x ADR Surge',
      investorIndex: 'A (High Cultural Demand)',
      description: 'The Pink City offers a magnetic blend of royal architecture, the world-renowned Jaipur Literature Festival, and opulent destination weddings.',
      months: [
        { name: 'Jan', full: 'January', rate: 95, adr: '₹42,000', tier: 'Peak', driver: 'Jaipur Literature Festival & royal winter luxury' },
        { name: 'Feb', full: 'February', rate: 90, adr: '₹36,000', tier: 'Peak', driver: 'Polo season, vintage car rally & high weddings' },
        { name: 'Mar', full: 'March', rate: 80, adr: '₹28,000', tier: 'High', driver: 'Elephant festival & heritage Holi celebrations' },
        { name: 'Apr', full: 'April', rate: 54, adr: '₹18,000', tier: 'Shoulder', driver: 'Spring shoulder & palace dinner packages' },
        { name: 'May', full: 'May', rate: 44, adr: '₹15,000', tier: 'Value', driver: 'Arid summer heatwave' },
        { name: 'Jun', full: 'June', rate: 48, adr: '₹16,000', tier: 'Value', driver: 'Pre-monsoon value conferences' },
        { name: 'Jul', full: 'July', rate: 62, adr: '₹20,000', tier: 'Value', driver: 'Teej festival & monsoon peacocks at Amber' },
        { name: 'Aug', full: 'August', rate: 68, adr: '₹22,000', tier: 'Shoulder', driver: 'Raksha Bandhan & lush Nahargarh drives' },
        { name: 'Sep', full: 'September', rate: 76, adr: '₹25,000', tier: 'Shoulder', driver: 'Autumn kickoff & incoming charter tours' },
        { name: 'Oct', full: 'October', rate: 90, adr: '₹34,000', tier: 'Peak', driver: 'Navratri, Dussehra & Diwali palace bazaars' },
        { name: 'Nov', full: 'November', rate: 94, adr: '₹38,000', tier: 'Peak', driver: 'Grand wedding season & international influx' },
        { name: 'Dec', full: 'December', rate: 96, adr: '₹45,000', tier: 'Peak', driver: 'Year-end festivities & majestic rooftop soirées' }
      ]
    },
    'Bengaluru': {
      city: 'Bengaluru',
      region: 'Karnataka, India',
      country: 'IN',
      type: 'South Development HQ',
      annualAvg: 80,
      peakWindow: 'Sep – Dec & Tech Corridors',
      peakAdr: '₹18,000 – ₹28,000',
      lowMonth: 'Apr (75%)',
      multiplier: '1.4x ADR Surge',
      investorIndex: 'A+ (High Stability)',
      description: 'Silicon Valley of the East with stable corporate traveler volume supplemented by upscale weekend vineyard and wellness outposts.',
      months: [
        { name: 'Jan', full: 'January', rate: 80, adr: '₹22,000', tier: 'High', driver: 'Global tech kickoffs & venture summits' },
        { name: 'Feb', full: 'February', rate: 82, adr: '₹23,000', tier: 'High', driver: 'Aero India & enterprise conferences' },
        { name: 'Mar', full: 'March', rate: 78, adr: '₹21,000', tier: 'Shoulder', driver: 'Fiscal year-end corporate offsites' },
        { name: 'Apr', full: 'April', rate: 75, adr: '₹20,000', tier: 'Shoulder', driver: 'Pleasant spring staycations & golf weekends' },
        { name: 'May', full: 'May', rate: 74, adr: '₹19,500', tier: 'Shoulder', driver: 'Pre-monsoon garden city blossoms' },
        { name: 'Jun', full: 'June', rate: 78, adr: '₹21,000', tier: 'Shoulder', driver: 'Cool breezy monsoon & corporate travelers' },
        { name: 'Jul', full: 'July', rate: 76, adr: '₹20,500', tier: 'Shoulder', driver: 'Steady tech delegations & startup incubators' },
        { name: 'Aug', full: 'August', rate: 79, adr: '₹22,000', tier: 'High', driver: 'Long weekends & Nandi Hills luxury stays' },
        { name: 'Sep', full: 'September', rate: 82, adr: '₹23,500', tier: 'High', driver: 'Autumn business summits & tech conclaves' },
        { name: 'Oct', full: 'October', rate: 84, adr: '₹24,000', tier: 'High', driver: 'Bengaluru Tech Summit & festive events' },
        { name: 'Nov', full: 'November', rate: 85, adr: '₹25,000', tier: 'High', driver: 'Venture capital summits & product launches' },
        { name: 'Dec', full: 'December', rate: 88, adr: '₹27,000', tier: 'High', driver: 'Year-end celebrations & holiday stays' }
      ]
    },
    'Mumbai': {
      city: 'Mumbai',
      region: 'Maharashtra, India',
      country: 'IN',
      type: 'West Coast Operations',
      annualAvg: 84,
      peakWindow: 'Oct – Mar',
      peakAdr: '₹28,000 – ₹45,000',
      lowMonth: 'Jun (78%)',
      multiplier: '1.5x ADR Surge',
      investorIndex: 'A+ (Supreme Liquidity)',
      description: 'Financial and media powerhouse yielding bulletproof occupancy year-round, enhanced by luxury urban sanctuaries and harbor villas.',
      months: [
        { name: 'Jan', full: 'January', rate: 86, adr: '₹34,000', tier: 'High', driver: 'Mumbai Marathon & international investor forums' },
        { name: 'Feb', full: 'February', rate: 85, adr: '₹33,000', tier: 'High', driver: 'Kala Ghoda Arts Festival & banking conferences' },
        { name: 'Mar', full: 'March', rate: 84, adr: '₹32,000', tier: 'High', driver: 'Corporate financial closing & media galas' },
        { name: 'Apr', full: 'April', rate: 80, adr: '₹30,000', tier: 'High', driver: 'IPL cricket tournament & entertainment stays' },
        { name: 'May', full: 'May', rate: 82, adr: '₹31,000', tier: 'High', driver: 'Summer staycations & coastal dining escapes' },
        { name: 'Jun', full: 'June', rate: 78, adr: '₹28,000', tier: 'Shoulder', driver: 'Marine Drive monsoon waves & business travel' },
        { name: 'Jul', full: 'July', rate: 80, adr: '₹29,000', tier: 'High', driver: 'Continuous corporate hotel & suite buyouts' },
        { name: 'Aug', full: 'August', rate: 82, adr: '₹30,500', tier: 'High', driver: 'Dahi Handi celebrations & corporate delegations' },
        { name: 'Sep', full: 'September', rate: 84, adr: '₹32,000', tier: 'High', driver: 'Ganesh Chaturthi festive surge' },
        { name: 'Oct', full: 'October', rate: 88, adr: '₹36,000', tier: 'High', driver: 'Jio MAMI film festival & Diwali shopping' },
        { name: 'Nov', full: 'November', rate: 90, adr: '₹38,000', tier: 'Peak', driver: 'High wedding season & global corporate summits' },
        { name: 'Dec', full: 'December', rate: 92, adr: '₹42,000', tier: 'Peak', driver: 'Year-end parties, harbor galas & holiday luxury' }
      ]
    },
    'Delhi NCR': {
      city: 'Delhi NCR',
      region: 'National Capital Region, India',
      country: 'IN',
      type: 'Capital Development Office',
      annualAvg: 78,
      peakWindow: 'Oct – Mar',
      peakAdr: '₹24,000 – ₹42,000',
      lowMonth: 'Jun (60%)',
      multiplier: '1.7x ADR Surge',
      investorIndex: 'A (High Volume)',
      description: 'Capital diplomatic and commercial nerve-center featuring surging winter high-ADR conference corridors and elite farm estate retreats.',
      months: [
        { name: 'Jan', full: 'January', rate: 86, adr: '₹32,000', tier: 'High', driver: 'Republic Day diplomatic & defense delegations' },
        { name: 'Feb', full: 'February', rate: 88, adr: '₹34,000', tier: 'High', driver: 'India Art Fair & Mughal garden bloom season' },
        { name: 'Mar', full: 'March', rate: 82, adr: '₹30,000', tier: 'High', driver: 'Spring corporate meetings & outdoor heritage tours' },
        { name: 'Apr', full: 'April', rate: 72, adr: '₹24,000', tier: 'Shoulder', driver: 'Pre-summer transition & policy think tanks' },
        { name: 'May', full: 'May', rate: 64, adr: '₹20,000', tier: 'Value', driver: 'High northern plains summer temperatures' },
        { name: 'Jun', full: 'June', rate: 60, adr: '₹19,000', tier: 'Value', driver: 'Low tourist season; domestic corporate only' },
        { name: 'Jul', full: 'July', rate: 66, adr: '₹21,000', tier: 'Value', driver: 'Monsoon relief & farm villa weekend breaks' },
        { name: 'Aug', full: 'August', rate: 70, adr: '₹23,000', tier: 'Shoulder', driver: 'Independence Day & government conferences' },
        { name: 'Sep', full: 'September', rate: 78, adr: '₹26,000', tier: 'Shoulder', driver: 'Diplomatic season kickoff & trade expos' },
        { name: 'Oct', full: 'October', rate: 88, adr: '₹33,000', tier: 'High', driver: 'Diwali festive season & pleasant autumn air' },
        { name: 'Nov', full: 'November', rate: 92, adr: '₹36,000', tier: 'Peak', driver: 'Grand wedding corridor & international trade fair' },
        { name: 'Dec', full: 'December', rate: 94, adr: '₹38,000', tier: 'Peak', driver: 'Crisp winter bonfires, embassy balls & holiday galas' }
      ]
    },
    'London': {
      city: 'London',
      region: 'United Kingdom',
      country: 'GB',
      type: 'European Strategic Outposts',
      annualAvg: 82,
      peakWindow: 'May – Sep & Dec',
      peakAdr: '£450 – £850',
      lowMonth: 'Jan (68%)',
      multiplier: '1.8x ADR Surge',
      investorIndex: 'AAA (Global Prime)',
      description: 'World financial and cultural capital commanding strong international leisure and private banking business demand.',
      months: [
        { name: 'Jan', full: 'January', rate: 68, adr: '£420', tier: 'Value', driver: 'Post-holiday sales & theatre season' },
        { name: 'Feb', full: 'February', rate: 72, adr: '£460', tier: 'Shoulder', driver: 'London Fashion Week & Valentine luxury' },
        { name: 'Mar', full: 'March', rate: 76, adr: '£500', tier: 'Shoulder', driver: 'Spring museum exhibitions & corporate summits' },
        { name: 'Apr', full: 'April', rate: 80, adr: '£540', tier: 'High', driver: 'London Marathon & Easter holiday travel' },
        { name: 'May', full: 'May', rate: 88, adr: '£650', tier: 'Peak', driver: 'Chelsea Flower Show & royal park season' },
        { name: 'Jun', full: 'June', rate: 94, adr: '£780', tier: 'Peak', driver: 'Wimbledon, Royal Ascot & summer luxury influx' },
        { name: 'Jul', full: 'July', rate: 95, adr: '£820', tier: 'Peak', driver: 'Peak European summer & West End galas' },
        { name: 'Aug', full: 'August', rate: 90, adr: '£720', tier: 'Peak', driver: 'Global holiday travelers & Notting Hill Carnival' },
        { name: 'Sep', full: 'September', rate: 86, adr: '£640', tier: 'High', driver: 'Frieze Art Fair preparations & corporate banking' },
        { name: 'Oct', full: 'October', rate: 84, adr: '£590', tier: 'High', driver: 'Frieze London & BFI London Film Festival' },
        { name: 'Nov', full: 'November', rate: 80, adr: '£520', tier: 'High', driver: 'Winter lights switch-on & black-tie dinners' },
        { name: 'Dec', full: 'December', rate: 88, adr: '£680', tier: 'Peak', driver: 'Mayfair Christmas shopping & NYE fireworks' }
      ]
    },
    'Dubai': {
      city: 'Dubai',
      region: 'United Arab Emirates',
      country: 'AE',
      type: 'Middle East Hub',
      annualAvg: 81,
      peakWindow: 'Nov – Apr',
      peakAdr: 'AED 1,800 – AED 4,500',
      lowMonth: 'Jul (54%)',
      multiplier: '2.5x ADR Surge',
      investorIndex: 'A+ (High Net Worth)',
      description: 'Ultra-luxury global crossroads with dominant winter sun occupancy, shopping festivals, and sovereign investor summits.',
      months: [
        { name: 'Jan', full: 'January', rate: 96, adr: 'AED 3,800', tier: 'Peak', driver: 'Dubai Shopping Festival & pleasant desert winter' },
        { name: 'Feb', full: 'February', rate: 92, adr: 'AED 3,400', tier: 'Peak', driver: 'Dubai Duty Free Tennis & food festivals' },
        { name: 'Mar', full: 'March', rate: 88, adr: 'AED 3,000', tier: 'High', driver: 'Art Dubai & Dubai World Cup horse racing' },
        { name: 'Apr', full: 'April', rate: 82, adr: 'AED 2,500', tier: 'High', driver: 'Spring breaks & yachting charters' },
        { name: 'May', full: 'May', rate: 70, adr: 'AED 1,900', tier: 'Shoulder', driver: 'Pre-summer indoor luxury dining' },
        { name: 'Jun', full: 'June', rate: 60, adr: 'AED 1,500', tier: 'Value', driver: 'Summer heat onset; indoor destination promotions' },
        { name: 'Jul', full: 'July', rate: 54, adr: 'AED 1,400', tier: 'Value', driver: 'Dubai Summer Surprises & indoor entertainment' },
        { name: 'Aug', full: 'August', rate: 58, adr: 'AED 1,500', tier: 'Value', driver: 'Value luxury family staycations' },
        { name: 'Sep', full: 'September', rate: 72, adr: 'AED 2,100', tier: 'Shoulder', driver: 'Cooler evening breeze & business travel return' },
        { name: 'Oct', full: 'October', rate: 86, adr: 'AED 2,800', tier: 'High', driver: 'GITEX Global tech exhibition & beach clubs reopening' },
        { name: 'Nov', full: 'November', rate: 94, adr: 'AED 3,600', tier: 'Peak', driver: 'Abu Dhabi GP spillover & DP World Tour Golf' },
        { name: 'Dec', full: 'December', rate: 98, adr: 'AED 4,600', tier: 'Peak', driver: 'Burj Khalifa NYE, National Day & festive peak' }
      ]
    },
    'New York': {
      city: 'New York',
      region: 'United States',
      country: 'US',
      type: 'North American Strategic Hub',
      annualAvg: 85,
      peakWindow: 'Sep – Dec & May – Jun',
      peakAdr: '$650 – $1,250',
      lowMonth: 'Jan (66%)',
      multiplier: '1.9x ADR Surge',
      investorIndex: 'AAA (Premier Tier)',
      description: 'Unrivaled cultural and financial metropolis commanding unmatched ADR peaks during autumn foliage and holiday seasons.',
      months: [
        { name: 'Jan', full: 'January', rate: 66, adr: '$520', tier: 'Value', driver: 'Post-holiday winter chill & Broadway Week 2-for-1' },
        { name: 'Feb', full: 'February', rate: 72, adr: '$580', tier: 'Shoulder', driver: 'NYFW Fashion Week & Valentine romantic stays' },
        { name: 'Mar', full: 'March', rate: 78, adr: '$620', tier: 'Shoulder', driver: 'Spring art fairs & corporate banking conferences' },
        { name: 'Apr', full: 'April', rate: 84, adr: '$700', tier: 'High', driver: 'Central Park cherry blossoms & Tribeca Film Festival' },
        { name: 'May', full: 'May', rate: 89, adr: '$780', tier: 'Peak', driver: 'Met Gala, Frieze NY & perfect outdoor weather' },
        { name: 'Jun', full: 'June', rate: 90, adr: '$820', tier: 'Peak', driver: 'Pride month, Governors Ball & summer rooftop season' },
        { name: 'Jul', full: 'July', rate: 84, adr: '$720', tier: 'High', driver: 'Independence Day fireworks & international tourism' },
        { name: 'Aug', full: 'August', rate: 82, adr: '$700', tier: 'High', driver: 'US Open Tennis kickoff & summer concerts' },
        { name: 'Sep', full: 'September', rate: 93, adr: '$940', tier: 'Peak', driver: 'UN General Assembly, NYFW & autumn arrival' },
        { name: 'Oct', full: 'October', rate: 95, adr: '$980', tier: 'Peak', driver: 'Peak autumn foliage, Comic Con & corporate summits' },
        { name: 'Nov', full: 'November', rate: 91, adr: '$880', tier: 'Peak', driver: 'NYC Marathon & Macy’s Thanksgiving Day Parade' },
        { name: 'Dec', full: 'December', rate: 96, adr: '$1,150', tier: 'Peak', driver: 'Rockefeller Center tree, holiday windows & Times Square NYE' }
      ]
    }
  };

  /**
   * Helper to normalize city names
   */
  function normalizeCity(name) {
    if (!name) return 'Goa';
    const clean = name.trim();
    if (MARKET_DATA[clean]) return clean;
    const lower = clean.toLowerCase();
    for (const key of Object.keys(MARKET_DATA)) {
      if (key.toLowerCase() === lower || lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) {
        return key;
      }
    }
    return 'Goa';
  }

  /**
   * SVG Smooth Bézier path generator
   */
  function buildSmoothSpline(points) {
    if (!points || points.length === 0) return '';
    if (points.length === 1) return `M ${points[0].x},${points[0].y}`;

    let path = `M ${points[0].x},${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i === 0 ? 0 : i - 1];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2 < points.length ? i + 2 : points.length - 1];

      // Catmull-Rom to Cubic Bézier conversion
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      path += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
    }
    return path;
  }

  /**
   * Color classification based on occupancy tier
   */
  function getTierMeta(tier) {
    switch (tier) {
      case 'Peak':
        return { label: 'Peak Season', bg: 'rgba(229, 35, 27, 0.18)', border: '#E5231B', text: '#FF4D45' };
      case 'High':
        return { label: 'High Demand', bg: 'rgba(235, 120, 30, 0.16)', border: '#EB781E', text: '#FFA766' };
      case 'Shoulder':
        return { label: 'Shoulder Season', bg: 'rgba(255, 255, 255, 0.08)', border: 'rgba(255, 255, 255, 0.3)', text: 'rgba(255, 255, 255, 0.85)' };
      default:
        return { label: 'Value Season', bg: 'rgba(255, 255, 255, 0.04)', border: 'rgba(255, 255, 255, 0.15)', text: 'rgba(255, 255, 255, 0.55)' };
    }
  }

  /**
   * Main OccupancyChart Component Class
   */
  class OccupancyChart {
    constructor(container, options = {}) {
      this.container = typeof container === 'string' ? document.querySelector(container) : container;
      if (!this.container) {
        throw new Error('OccupancyChart: Valid container element required');
      }

      this.currentCity = normalizeCity(options.city || 'Goa');
      this.activeFilter = options.filter || 'all'; // 'all' | 'peak' | 'shoulder' | 'value'
      this.variant = options.variant || 'card'; // 'card' | 'modal' | 'compact'
      this.showCitySwitcher = options.showCitySwitcher !== false;
      this.onInquire = options.onInquire || null;
      this.hoveredMonthIdx = null;

      this.initDOM();
      this.render();
    }

    initDOM() {
      this.container.innerHTML = '';
      this.container.classList.add('rf-occupancy-component');
    }

    setCity(cityName) {
      const normalized = normalizeCity(cityName);
      if (normalized === this.currentCity) return;
      this.currentCity = normalized;
      this.hoveredMonthIdx = null;
      this.render();
    }

    setFilter(filterName) {
      this.activeFilter = filterName;
      this.render();
    }

    render() {
      const data = MARKET_DATA[this.currentCity] || MARKET_DATA.Goa;
      const allCities = Object.keys(MARKET_DATA);
      const isIN = data.country === 'IN';
      const currencySymbol = isIN ? '₹' : (data.country === 'GB' ? '£' : (data.country === 'AE' ? 'AED ' : '$'));

      // Filtered months view
      const visibleMonths = data.months.map((m, idx) => {
        let isDimmed = false;
        if (this.activeFilter === 'peak' && m.tier !== 'Peak') isDimmed = true;
        if (this.activeFilter === 'high' && m.tier !== 'High' && m.tier !== 'Peak') isDimmed = true;
        if (this.activeFilter === 'shoulder' && m.tier !== 'Shoulder') isDimmed = true;
        if (this.activeFilter === 'value' && m.tier !== 'Value') isDimmed = true;
        return { ...m, originalIndex: idx, isDimmed };
      });

      // SVG Dimensions
      const svgW = 760;
      const svgH = 220;
      const padL = 40;
      const padR = 25;
      const padT = 25;
      const padB = 40;
      const chartW = svgW - padL - padR;
      const chartH = svgH - padT - padB;

      // Coordinate generator
      const points = data.months.map((m, i) => {
        const x = padL + (i / (data.months.length - 1)) * chartW;
        // Occupancy scale 0% to 100%
        const y = padT + chartH - (m.rate / 100) * chartH;
        return { x, y, rate: m.rate, month: m.name, tier: m.tier };
      });

      const splinePath = buildSmoothSpline(points);
      const firstX = points[0].x;
      const lastX = points[points.length - 1].x;
      const bottomY = padT + chartH;
      const areaPath = `${splinePath} L ${lastX},${bottomY} L ${firstX},${bottomY} Z`;

      // Active month data for highlight card
      const highlighted = this.hoveredMonthIdx !== null ? data.months[this.hoveredMonthIdx] : data.months.reduce((max, cur) => cur.rate > max.rate ? cur : max, data.months[0]);
      const tierMeta = getTierMeta(highlighted.tier);

      // Construct Component HTML
      this.container.innerHTML = `
        <div class="rf-occ-wrapper" data-city="${data.city}">
          <!-- Header Bar -->
          <div class="rf-occ-header">
            <div class="rf-occ-title-block">
              <div class="rf-occ-tagline">
                <span class="rf-occ-live-pulse" aria-hidden="true"></span>
                <span class="rf-occ-tag-txt">${data.type} · Seasonal Demand Analytics</span>
              </div>
              <h3 class="rf-occ-heading">${data.city} Seasonal Demand &amp; Occupancy</h3>
              <p class="rf-occ-subtext">${data.description}</p>
            </div>

            <!-- Optional City Switcher Tabs -->
            ${this.showCitySwitcher ? `
              <div class="rf-occ-city-pills" role="tablist" aria-label="Select City Hub">
                ${allCities.map(c => `
                  <button type="button" role="tab" class="rf-occ-city-btn ${c === this.currentCity ? 'is-active' : ''}" data-target-city="${c}" aria-selected="${c === this.currentCity ? 'true' : 'false'}">
                    ${c}
                  </button>
                `).join('')}
              </div>
            ` : ''}
          </div>

          <!-- KPI Summary Strip -->
          <div class="rf-occ-kpi-grid">
            <div class="rf-occ-kpi-card">
              <div class="rf-occ-kpi-label">Annual Avg Occupancy</div>
              <div class="rf-occ-kpi-val">${data.annualAvg}%</div>
              <div class="rf-occ-kpi-sub">Across 12-month trailing cycle</div>
            </div>
            <div class="rf-occ-kpi-card">
              <div class="rf-occ-kpi-label">Peak Yield Window</div>
              <div class="rf-occ-kpi-val" style="color: #FF4D45;">${data.peakWindow}</div>
              <div class="rf-occ-kpi-sub">Highest ADR &amp; 90%+ Sellouts</div>
            </div>
            <div class="rf-occ-kpi-card">
              <div class="rf-occ-kpi-label">Peak Season ADR</div>
              <div class="rf-occ-kpi-val">${data.peakAdr}</div>
              <div class="rf-occ-kpi-sub">${data.multiplier}</div>
            </div>
            <div class="rf-occ-kpi-card">
              <div class="rf-occ-kpi-label">Off-Peak Baseline</div>
              <div class="rf-occ-kpi-val" style="color: rgba(255,255,255,0.7);">${data.lowMonth}</div>
              <div class="rf-occ-kpi-sub">${data.investorIndex}</div>
            </div>
          </div>

          <!-- Filter Toolbar -->
          <div class="rf-occ-toolbar">
            <div class="rf-occ-filters" role="group" aria-label="Filter Seasonality">
              <button type="button" class="rf-occ-flt-btn ${this.activeFilter === 'all' ? 'active' : ''}" data-filter="all">All 12 Months</button>
              <button type="button" class="rf-occ-flt-btn ${this.activeFilter === 'peak' ? 'active' : ''}" data-filter="peak">Peak (88%+)</button>
              <button type="button" class="rf-occ-flt-btn ${this.activeFilter === 'high' ? 'active' : ''}" data-filter="high">High Demand (80%+)</button>
              <button type="button" class="rf-occ-flt-btn ${this.activeFilter === 'shoulder' ? 'active' : ''}" data-filter="shoulder">Shoulder</button>
              <button type="button" class="rf-occ-flt-btn ${this.activeFilter === 'value' ? 'active' : ''}" data-filter="value">Value Season</button>
            </div>
            <div class="rf-occ-legend">
              <span class="rf-occ-leg-item"><span class="rf-occ-leg-dot" style="background:#E5231B;"></span>Peak</span>
              <span class="rf-occ-leg-item"><span class="rf-occ-leg-dot" style="background:#EB781E;"></span>High</span>
              <span class="rf-occ-leg-item"><span class="rf-occ-leg-dot" style="background:rgba(255,255,255,0.45);"></span>Shoulder</span>
            </div>
          </div>

          <!-- Chart Visual Stage -->
          <div class="rf-occ-chart-stage">
            <svg class="rf-occ-svg" viewBox="0 0 ${svgW} ${svgH}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${data.city} Occupancy Chart">
              <defs>
                <linearGradient id="occGradient-${data.city}" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stop-color="#E5231B" stop-opacity="0.45"/>
                  <stop offset="65%" stop-color="#E5231B" stop-opacity="0.08"/>
                  <stop offset="100%" stop-color="#E5231B" stop-opacity="0"/>
                </linearGradient>
                <filter id="occGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over"/>
                </filter>
              </defs>

              <!-- Horizontal Grid Guidelines & Y-Axis Labels -->
              ${[100, 75, 50, 25].map(pct => {
                const y = padT + chartH - (pct / 100) * chartH;
                return `
                  <line x1="${padL}" y1="${y}" x2="${padL + chartW}" y2="${y}" stroke="rgba(255,255,255,0.08)" stroke-dasharray="3 3"/>
                  <text x="${padL - 8}" y="${y + 4}" fill="rgba(255,255,255,0.35)" font-size="9" text-anchor="end" font-family="monospace">${pct}%</text>
                `;
              }).join('')}

              <!-- Area Fill Under Spline -->
              <path d="${areaPath}" fill="url(#occGradient-${data.city})"/>

              <!-- Main Spline Curve -->
              <path d="${splinePath}" fill="none" stroke="#E5231B" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" filter="url(#occGlow)"/>

              <!-- Monthly Vertical Hit Areas & Dots -->
              ${points.map((pt, i) => {
                const isHovered = this.hoveredMonthIdx === i;
                const mInfo = visibleMonths[i];
                const opacity = mInfo.isDimmed ? '0.2' : '1';
                const dotColor = pt.rate >= 88 ? '#FF4D45' : (pt.rate >= 78 ? '#FFA766' : '#FFFFFF');

                return `
                  <g class="rf-occ-point-group" data-month-idx="${i}" style="opacity: ${opacity}; cursor: pointer;">
                    <!-- Vertical subtle column line -->
                    <line x1="${pt.x}" y1="${padT}" x2="${pt.x}" y2="${padT + chartH}" stroke="${isHovered ? 'rgba(229,35,27,0.5)' : 'rgba(255,255,255,0.05)'}" stroke-width="${isHovered ? '1.5' : '1'}"/>

                    <!-- X-Axis Month Label -->
                    <text x="${pt.x}" y="${padT + chartH + 18}" fill="${isHovered ? '#FFFFFF' : 'rgba(255,255,255,0.55)'}" font-size="10" font-weight="${isHovered ? '600' : '400'}" text-anchor="middle" font-family="'Inter', sans-serif">${pt.month}</text>

                    <!-- Point Dot -->
                    <circle cx="${pt.x}" cy="${pt.y}" r="${isHovered ? '6' : '3.5'}" fill="${dotColor}" stroke="#0A0B09" stroke-width="2" style="transition: r 0.2s ease, fill 0.2s ease;"/>
                    ${isHovered ? `<circle cx="${pt.x}" cy="${pt.y}" r="11" fill="none" stroke="#E5231B" stroke-width="1.5" stroke-dasharray="2 2" opacity="0.8"/>` : ''}

                    <!-- Full height invisible hit rect for responsive hovering -->
                    <rect x="${pt.x - chartW / 24}" y="${padT}" width="${chartW / 12}" height="${chartH + 25}" fill="transparent"/>
                  </g>
                `;
              }).join('')}
            </svg>
          </div>

          <!-- Interactive Focus Month Details -->
          <div class="rf-occ-month-card" style="border-left-color: ${tierMeta.border};">
            <div class="rf-occ-m-header">
              <div class="rf-occ-m-col">
                <span class="rf-occ-m-name">${highlighted.full}</span>
                <span class="rf-occ-m-badge" style="background: ${tierMeta.bg}; border-color: ${tierMeta.border}; color: ${tierMeta.text};">
                  ${tierMeta.label}
                </span>
              </div>
              <div class="rf-occ-m-stats">
                <div class="rf-occ-m-stat-item">
                  <span class="rf-occ-m-stat-lbl">Occupancy</span>
                  <span class="rf-occ-m-stat-val" style="color: ${tierMeta.text};">${highlighted.rate}%</span>
                </div>
                <div class="rf-occ-m-stat-item">
                  <span class="rf-occ-m-stat-lbl">Estimated ADR</span>
                  <span class="rf-occ-m-stat-val">${highlighted.adr}</span>
                </div>
              </div>
            </div>
            <div class="rf-occ-m-driver">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              <span><strong>Market Catalyst:</strong> ${highlighted.driver}</span>
            </div>
          </div>

          <!-- Action Footer -->
          <div class="rf-occ-footer">
            <div class="rf-occ-footer-note">
              * Modeled on historical luxury outpost bookings, seasonal demand indexes, and local festival calendars.
            </div>
            <div class="rf-occ-footer-actions">
              <button type="button" class="rf-occ-btn rf-occ-btn-sec" data-action="explore-city" data-city="${data.city}">
                Explore ${data.city} Hub
              </button>
              <button type="button" class="rf-occ-btn rf-occ-btn-prim" data-action="inquire-city" data-city="${data.city}">
                Partner / Inquire for ${data.city} →
              </button>
            </div>
          </div>
        </div>
      `;

      this.bindEvents();
    }

    bindEvents() {
      // City Switcher Buttons
      const cityButtons = this.container.querySelectorAll('.rf-occ-city-btn');
      cityButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const target = btn.getAttribute('data-target-city');
          if (target) this.setCity(target);
        });
      });

      // Filter Buttons
      const fltButtons = this.container.querySelectorAll('.rf-occ-flt-btn');
      fltButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const flt = btn.getAttribute('data-filter');
          if (flt) this.setFilter(flt);
        });
      });

      // Chart Point Hover
      const pointGroups = this.container.querySelectorAll('.rf-occ-point-group');
      pointGroups.forEach(grp => {
        const idx = parseInt(grp.getAttribute('data-month-idx'), 10);

        grp.addEventListener('mouseenter', () => {
          if (this.hoveredMonthIdx !== idx) {
            this.hoveredMonthIdx = idx;
            this.render();
          }
        });

        grp.addEventListener('click', () => {
          this.hoveredMonthIdx = idx;
          this.render();
        });
      });

      // Reset hover when leaving SVG
      const svg = this.container.querySelector('.rf-occ-svg');
      if (svg) {
        svg.addEventListener('mouseleave', () => {
          if (this.hoveredMonthIdx !== null) {
            this.hoveredMonthIdx = null;
            this.render();
          }
        });
      }

      // Action buttons
      const exploreBtn = this.container.querySelector('[data-action="explore-city"]');
      if (exploreBtn) {
        exploreBtn.addEventListener('click', () => {
          const city = exploreBtn.getAttribute('data-city');
          const bookLoc = document.getElementById('book-location');
          if (bookLoc && city) {
            bookLoc.value = city;
          }
          const bookSec = document.getElementById('book');
          if (bookSec) {
            bookSec.scrollIntoView({ behavior: 'smooth' });
          }
          // If in modal, close modal
          const modal = this.container.closest('.rf-occ-modal-overlay');
          if (modal && typeof OccupancyChart.closeModal === 'function') {
            OccupancyChart.closeModal();
          }
        });
      }

      const inquireBtn = this.container.querySelector('[data-action="inquire-city"]');
      if (inquireBtn) {
        inquireBtn.addEventListener('click', () => {
          const city = inquireBtn.getAttribute('data-city');
          if (typeof this.onInquire === 'function') {
            this.onInquire(city);
            return;
          }
          // Default action: pre-fill contact or franchise message
          const msgArea = document.getElementById('contact-message');
          const subjArea = document.getElementById('contact-subject');
          if (subjArea) subjArea.value = `Partner / Hub Inquiries: ${city}`;
          if (msgArea) msgArea.value = `Hi Red Flag Team, I am interested in development opportunities and seasonal occupancy dynamics for the ${city} Hub.`;

          const contactSec = document.getElementById('contact') || document.getElementById('franchise');
          if (contactSec) {
            contactSec.scrollIntoView({ behavior: 'smooth' });
          }

          const modal = this.container.closest('.rf-occ-modal-overlay');
          if (modal && typeof OccupancyChart.closeModal === 'function') {
            OccupancyChart.closeModal();
          }
        });
      }
    }

    destroy() {
      this.container.innerHTML = '';
    }
  }

  // Static API Methods
  OccupancyChart.MARKET_DATA = MARKET_DATA;

  OccupancyChart.getData = function (cityName) {
    const key = normalizeCity(cityName);
    return MARKET_DATA[key] || MARKET_DATA.Goa;
  };

  OccupancyChart.render = function (container, options = {}) {
    return new OccupancyChart(container, options);
  };

  /**
   * Modal dialog controller
   */
  let activeModal = null;

  OccupancyChart.openModal = function (cityName = 'Goa', options = {}) {
    OccupancyChart.closeModal();

    const overlay = document.createElement('div');
    overlay.className = 'rf-occ-modal-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', `${cityName} Seasonal Occupancy Analytics`);

    overlay.innerHTML = `
      <div class="rf-occ-modal-window">
        <button type="button" class="rf-occ-modal-close" aria-label="Close Seasonal Analytics Window">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        <div class="rf-occ-modal-body" id="rf-occ-modal-mount"></div>
      </div>
    `;

    document.body.appendChild(overlay);
    activeModal = overlay;
    document.body.style.overflow = 'hidden';

    const mount = overlay.querySelector('#rf-occ-modal-mount');
    const chartInstance = new OccupancyChart(mount, {
      city: cityName,
      variant: 'modal',
      showCitySwitcher: true,
      ...options
    });

    const closeBtn = overlay.querySelector('.rf-occ-modal-close');
    closeBtn.addEventListener('click', () => OccupancyChart.closeModal());

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        OccupancyChart.closeModal();
      }
    });

    const keyHandler = (e) => {
      if (e.key === 'Escape') {
        OccupancyChart.closeModal();
      }
    };
    document.addEventListener('keydown', keyHandler);
    overlay._keyHandler = keyHandler;

    requestAnimationFrame(() => {
      overlay.classList.add('is-active');
      closeBtn.focus();
    });

    return chartInstance;
  };

  OccupancyChart.closeModal = function () {
    if (!activeModal) return;
    activeModal.classList.remove('is-active');
    document.body.style.overflow = '';
    if (activeModal._keyHandler) {
      document.removeEventListener('keydown', activeModal._keyHandler);
    }
    setTimeout(() => {
      if (activeModal && activeModal.parentNode) {
        activeModal.parentNode.removeChild(activeModal);
      }
      activeModal = null;
    }, 280);
  };

  /**
   * Auto-scanner: Binds to elements with [data-occupancy-chart] or binds to city hub items
   */
  OccupancyChart.initAutoInject = function () {
    // 1. Elements explicitly asking for an embedded chart
    document.querySelectorAll('[data-occupancy-chart]').forEach(el => {
      const city = el.getAttribute('data-occupancy-chart') || 'Goa';
      new OccupancyChart(el, { city });
    });

    // 2. Add demand trends trigger to partner cities strip if strip exists
    const stripLead = document.querySelector('.hubs-strip-lead');
    if (stripLead && !document.getElementById('hubs-demand-trigger')) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.id = 'hubs-demand-trigger';
      btn.className = 'hubs-demand-trigger';
      btn.setAttribute('title', 'View Seasonal Demand & Occupancy Intelligence');
      btn.innerHTML = `
        <span class="hubs-demand-txt">Seasonal Trends</span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
      `;
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        // Determine active city or default to first
        let currentCity = 'Goa';
        try {
          const currentMarket = localStorage.getItem('rf_market') || 'IN';
          if (currentMarket === 'GB') currentCity = 'London';
          else if (currentMarket === 'AE') currentCity = 'Dubai';
          else if (currentMarket === 'US') currentCity = 'New York';
        } catch (err) {}
        OccupancyChart.openModal(currentCity);
      });
      stripLead.appendChild(btn);
    }

    // 3. Bind click on any .hub-item to offer seasonal demand trends if shifted or double-clicked, or via an added visual badge
    document.querySelectorAll('.hub-item').forEach(item => {
      if (item._occBound) return;
      item._occBound = true;

      // Add a subtle trend icon or allow right-click / Alt-click / or direct toggle
      item.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        const city = item.getAttribute('data-city');
        if (city) OccupancyChart.openModal(city);
      });
    });
  };

  // Expose to window
  global.OccupancyChart = OccupancyChart;

  // Auto-init on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => OccupancyChart.initAutoInject());
  } else {
    OccupancyChart.initAutoInject();
  }

})(typeof window !== 'undefined' ? window : this);
