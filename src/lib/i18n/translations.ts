export type Lang = 'en' | 'te';

export const translations = {
  en: {
    // Top ticker & Navbar
    'topbar.portal': 'Kantheru Community Portal',
    'topbar.location': 'Andhra Pradesh, India',
    'topbar.event': 'Socialthon 2026 • Round 3',
    'topbar.emergencyLabel': '24x7 Emergency Dispatch:',
    'topbar.dial108': 'DIAL 108',
    'topbar.helpline104': 'Medical Helpline: 104',
    'brand.sub': 'Kantheru Gram Panchayat',

    // Nav links
    'nav.healthcare': 'Healthcare',
    'nav.medicines': 'Medicines',
    'nav.emergency': 'Emergency',
    'nav.water': 'Water',
    'nav.sanitation': 'Sanitation',
    'nav.airQuality': 'Air Quality',
    'nav.intelligence': 'Intelligence',
    'nav.dashboard': 'My Dashboard',
    'nav.admin': 'Admin Console',
    'nav.signIn': 'Sign In',
    'nav.demoRoles': 'Test Roles',
    'nav.signOut': 'Sign Out',
    'nav.notifications': 'Alerts & Notifications',
    'nav.markAllRead': 'Mark all read',
    'nav.noNotifs': 'No notifications yet.',

    // Homepage Hero
    'hero.badge': 'Socialthon 2026 • Round 3',
    'hero.district': 'Kantheru, Guntur District, AP',
    'hero.teamLabel': 'Team:',
    'hero.title1': 'Integrated Community',
    'hero.titleHighlight': 'Healthcare & Civic',
    'hero.title2': 'Command Platform',
    'hero.desc':
      'HEALTHBRIDGE 360 unifies Kantheru Gram Panchayat’s primary clinical care, FEFO rational medicine inventory, 108 emergency coordination, 5-section water distribution, and deterministic civic sanitation into one real-time operational system.',
    'hero.ctaPortal': 'Launch Operations Portal',
    'hero.ctaEmergency': 'Emergency Response & 108',
    'hero.ctaRoles': 'Switch Role (6 Personas)',
    'hero.trust1': '6 Live Service Modules',
    'hero.trust2': 'BIS 10500 Lab Standards',
    'hero.trust3': 'FEFO Atomic Stock',

    // Hero Telemetry Card
    'telemetry.title': 'Kantheru Live Telemetry',
    'telemetry.doctors': 'Doctors On Roster',
    'telemetry.active': 'Active',
    'telemetry.doctorsSub': 'Kantheru PHC & Tadikonda CHC',
    'telemetry.fleet': '108 Fleet Ready',
    'telemetry.units': 'Units',
    'telemetry.fleetSub': 'ALS & BLS GPS Tracked',
    'telemetry.water': 'Water Distribution',
    'telemetry.zones': 'Zones',
    'telemetry.waterSub': '1,910 Connected Households',
    'telemetry.stock': 'Valid Stock Units',
    'telemetry.lowStockNote': 'item below threshold',
    'telemetry.secretary': 'Panchayat Secretary: Smt. K. Bhavani',
    'telemetry.analytics': 'Command Analytics',

    // Direct Emergency Banner
    'emBanner.title': 'Direct Emergency Calling & Triage Protocol',
    'emBanner.badge': 'LIVE 24x7 DISPATCH',
    'emBanner.desc':
      'A website request never replaces direct emergency voice dispatch. For cardiac, trauma, snakebite, or maternal emergencies, dial immediately:',
    'emBanner.dial108': 'DIAL 108 AMBULANCE',
    'emBanner.phc': 'PHC Casualty: +91 863 2234101',
    'emBanner.helpline104': '104 Medical Helpline',

    // Six Modules Section
    'modules.eyebrow': 'Unified Platform Architecture',
    'modules.heading': 'Six Interconnected Community Modules',
    'modules.subheading':
      'Built as one cohesive civic-health system. Every appointment, batch deduction, water lab test, and sanitation escalation updates the community intelligence graph in real time.',
    'modules.openWorkspace': 'Open Role Workspace',

    'mod1.badge': 'MODULE 01',
    'mod1.title': 'Healthcare Access & OPD',
    'mod1.desc':
      'Doctor profiles, live OPD schedules, resident appointment booking, clinical approval workflow, and health camp registrations.',
    'mod1.m1': 'Medical Facilities:',
    'mod1.m2': 'Rostered Doctors:',
    'mod1.m3': 'Upcoming Health Camps:',
    'mod1.btn': 'Open Healthcare Access',

    'mod2.badge': 'MODULE 02',
    'mod2.title': 'Medicine Management',
    'mod2.desc':
      'Multi-batch inventory, atomic FEFO dispensing algorithm, automatic expiry quarantine, and configurable low-stock threshold alerts.',
    'mod2.m1': 'Essential Formulary:',
    'mod2.m2': 'Available Unexpired Stock:',
    'mod2.m3': 'Low-Stock Alerts:',
    'mod2.btn': 'Inspect Medicine Inventory',

    'mod3.badge': 'MODULE 03',
    'mod3.title': 'Emergency Assistance',
    'mod3.desc':
      'Direct 108/104 hotlines, hospital ICU & oxygen capacity directory, consent-based GPS sharing, and 5-stage coordinator triage.',
    'mod3.m1': '108 Ambulance Fleet:',
    'mod3.m2': 'Regional Trauma Hubs:',
    'mod3.m3': 'Dispatch Tracking:',
    'mod3.btn': 'Open Emergency Command',

    'mod4.badge': 'MODULE 04',
    'mod4.title': '5-Section Water Management',
    'mod4.desc':
      'Section-wise pumping logs, flow & pressure telemetry, interruption reporting, and 5-parameter BIS 10500 laboratory verification.',
    'mod4.m1': 'Village Distribution:',
    'mod4.m2': 'Latest Supply Log:',
    'mod4.m3': 'Lab Parameters:',
    'mod4.btn': 'Explore 5-Section Water Hub',

    'mod5.badge': 'MODULE 05',
    'mod5.title': 'Sanitation & Priority Engine',
    'mod5.desc':
      'Geo-tagged civic hazard reporting, explainable 0–100 priority scoring, authority assignment, proof of resolution, and ticket reopening.',
    'mod5.m1': 'Scoring Algorithm:',
    'mod5.m2': 'Contamination Risk:',
    'mod5.m3': 'Reopen Escalation:',
    'mod5.btn': 'Open Sanitation Portal',

    'mod6.badge': 'MODULE 06',
    'mod6.title': 'Community Intelligence',
    'mod6.desc':
      'Executive decision-support dashboard aggregating live SQL records across all five operational modules with turnaround SLA analytics.',
    'mod6.m1': 'Data Integrity:',
    'mod6.m2': 'Zone Benchmarking:',
    'mod6.m3': 'Turnaround SLA:',
    'mod6.btn': 'Open Intelligence Command',

    // Water overview on home
    'homeWater.title': 'Kantheru 5-Section Water Distribution Telemetry',
    'homeWater.desc':
      'Live pumping schedules, household coverage, and overhead reservoir capacity across all 5 Panchayat zones',
    'homeWater.btn': 'Full 5-Section Comparison',
    'homeWater.section': 'Section',
    'homeWater.volumeIndex': 'Volume Index',
    'homeWater.window': 'Window:',
    'homeWater.households': 'Households:',
    'homeWater.reservoir': 'Reservoir:',

    // Camps & Guarantee
    'camps.title': 'Upcoming Free Community Health Camps',
    'camps.btn': 'Register Online',
    'camps.empty': 'No health camps scheduled this week.',

    'integrity.badge': 'Algorithmic Integrity Guarantee',
    'integrity.title': 'Zero Synthetic Guesses. 100% Explainable Logic.',
    'integrity.p1Title': 'FEFO Medicine Engine:',
    'integrity.p1Desc': 'Available stock never becomes negative; expired batches are excluded and quarantined automatically.',
    'integrity.p2Title': 'Strict BIS 10500 Water Safety:',
    'integrity.p2Desc': 'Never infers Sodium or Fluoride from TDS. Incomplete lab tests are flagged as Pending Verification.',
    'integrity.p3Title': 'Deterministic Sanitation Priority:',
    'integrity.p3Desc': 'Transparent 0–100 score combining category risk, location sensitivity, and age boost.',
    'integrity.testRoles': 'Test All 6 Roles',

    // Footer
    'footer.desc':
      'Integrated Community Healthcare and Essential Public Services platform engineered for Kantheru Gram Panchayat, Guntur District, Andhra Pradesh.',
    'footer.modulesTitle': 'Service Modules',
    'footer.dirTitle': 'Official Directory',
    'footer.address': 'Gram Panchayat Office, Kantheru, Tadikonda Mandal, Guntur Dist, AP - 522501',
    'footer.phc': 'PHC Reception: +91 863 2234101',
    'footer.ambulance': 'Central Ambulance: 108 (Toll Free)',
    'footer.safetyTitle': 'Safety & Verification Protocol',
    'footer.safetyDesc':
      'HealthBridge 360 strictly adheres to non-inferential water quality standards and transactional medicine tracking. Web requests do not replace direct emergency phone dispatches in life-threatening scenarios.',
    'footer.copyright': '© 2026 HEALTHBRIDGE 360. Developed for Kantheru Community Platform. All rights reserved.',

    // Module Page Headers
    'page.healthcare.title': 'Healthcare Access',
    'page.healthcare.sub': 'Kantheru Primary Health Centre & Tadikonda CHC • Doctors, OPD Appointments & Health Camps',
    'page.medicines.title': 'Medicine Inventory',
    'page.medicines.sub': 'Kantheru PHC Dispensary • Batch Tracking, FEFO Algorithm, Safety Thresholds & Transaction Ledger',
    'page.emergency.title': 'Emergency Assistance',
    'page.emergency.sub': 'Kantheru Rapid Response • Direct 108 Calling, Hospital ICU Beds, Ambulance Fleet & Dispatch Triage',
    'page.water.title': 'Water Management (5 Sections)',
    'page.water.sub': 'Kantheru Panchayat Water Works • Daily Supply Logs, Sensor Telemetry & Non-Inferential BIS 10500 Lab Testing',
    'page.sanitation.title': 'Sanitation Management',
    'page.sanitation.sub': 'Civic Hygiene & Drainage • Deterministic Priority Algorithm, Department Dispatch, Status Stepper & Reopen Verification',
    'page.intelligence.title': 'Community Intelligence',
    'page.intelligence.sub': 'Unified Operational Dashboard • Aggregates Live Relational Telemetry from all 5 Kantheru Public Service Domains',
    'page.airQuality.title': 'Clean Air & CPCB AQI Hub',
    'page.airQuality.sub': 'Kantheru 5-Section Air Quality Telemetry • Non-Inferential CPCB NAQI Engine, Smoke/Dust Alerts & Water-Sprinkler Dispatch',
    'page.dashboard.title': 'Personal Service Workspace',
  },
  te: {
    // Top ticker & Navbar
    'topbar.portal': 'కంతేరు కమ్యూనిటీ పోర్టల్',
    'topbar.location': 'ఆంధ్రప్రదేశ్, భారతదేశం',
    'topbar.event': 'సోషల్‌థాన్ 2026 • రౌండ్ 3',
    'topbar.emergencyLabel': '24x7 అత్యవసర సేవలు:',
    'topbar.dial108': '108 కు కాల్ చేయండి',
    'topbar.helpline104': 'వైద్య సహాయవాణి: 104',
    'brand.sub': 'కంతేరు గ్రామ పంచాయతీ',

    // Nav links
    'nav.healthcare': 'ఆరోగ్య సేవలు',
    'nav.medicines': 'మందుల నిల్వ',
    'nav.emergency': 'అత్యవసర 108',
    'nav.water': 'మంచినీరు',
    'nav.sanitation': 'పారిశుధ్యం',
    'nav.airQuality': 'గాలి నాణ్యత',
    'nav.intelligence': 'సమాచార కేంద్రం',
    'nav.dashboard': 'నా డ్యాష్‌బోర్డ్',
    'nav.admin': 'అడ్మిన్ కన్సోల్',
    'nav.signIn': 'లాగిన్',
    'nav.demoRoles': 'పాత్రల పరీక్ష',
    'nav.signOut': 'లాగ్ అవుట్',
    'nav.notifications': 'హెచ్చరికలు & నోటిఫికేషన్లు',
    'nav.markAllRead': 'అన్నీ చదివినట్లు గుర్తించు',
    'nav.noNotifs': 'ప్రస్తుతం నోటిఫికేషన్లు లేవు.',

    // Homepage Hero
    'hero.badge': 'సోషల్‌థాన్ 2026 • రౌండ్ 3',
    'hero.district': 'కంతేరు, గుంటూరు జిల్లా, ఆంధ్రప్రదేశ్',
    'hero.teamLabel': 'బృందం:',
    'hero.title1': 'సమీకృత గ్రామ',
    'hero.titleHighlight': 'ఆరోగ్య & ప్రజా సేవల',
    'hero.title2': 'డిజిటల్ వేదిక',
    'hero.desc':
      'HEALTHBRIDGE 360 కంతేరు గ్రామ పంచాయతీలోని ప్రాథమిక వైద్య సేవలు, FEFO మందుల నిల్వ, 108 అత్యవసర సహాయం, 5-విభాగాల త్రాగునీటి సరఫరా మరియు పారిశుధ్య నిర్వహణను ఒకే వేదికపై అందిస్తుంది.',
    'hero.ctaPortal': 'కార్యకలాపాల పోర్టల్ తెరవండి',
    'hero.ctaEmergency': 'అత్యవసర సహాయం & 108',
    'hero.ctaRoles': 'పాత్ర మార్చండి (6 విభాగాలు)',
    'hero.trust1': '6 లైవ్ సేవా విభాగాలు',
    'hero.trust2': 'BIS 10500 ల్యాబ్ ప్రమాణాలు',
    'hero.trust3': 'FEFO కచ్చితమైన నిల్వ',

    // Hero Telemetry Card
    'telemetry.title': 'కంతేరు లైవ్ టెలిమెట్రీ',
    'telemetry.doctors': 'అందుబాటులో వైద్యులు',
    'telemetry.active': 'యాక్టివ్',
    'telemetry.doctorsSub': 'కంతేరు PHC & తాడికొండ CHC',
    'telemetry.fleet': '108 అంబులెన్సులు సిద్ధం',
    'telemetry.units': 'వాహనాలు',
    'telemetry.fleetSub': 'ALS & BLS GPS ట్రాకింగ్',
    'telemetry.water': 'త్రాగునీటి సరఫరా',
    'telemetry.zones': 'విభాగాలు',
    'telemetry.waterSub': '1,910 అనుసంధానిత గృహాలు',
    'telemetry.stock': 'చెల్లుబాటు మందుల నిల్వ',
    'telemetry.lowStockNote': 'పరిమితి కంటే తక్కువగా ఉంది',
    'telemetry.secretary': 'పంచాయతీ కార్యదర్శి: శ్రీమతి కె. భవాని',
    'telemetry.analytics': 'కమాండ్ విశ్లేషణలు',

    // Direct Emergency Banner
    'emBanner.title': 'నేరుగా అత్యవసర కాల్ & ట్రియేజ్ విధానం',
    'emBanner.badge': 'లైవ్ 24x7 సేవ',
    'emBanner.desc':
      'వెబ్‌సైట్ అభ్యర్థన ఎప్పుడూ నేరుగా ఫోన్ కాల్‌కు ప్రత్యామ్నాయం కాదు. గుండెపోటు, ప్రమాదాలు, పాముకాటు లేదా ప్రసవ అత్యవసర పరిస్థితుల్లో వెంటనే కాల్ చేయండి:',
    'emBanner.dial108': '108 అంబులెన్స్ కాల్',
    'emBanner.phc': 'PHC అత్యవసర విభాగం: +91 863 2234101',
    'emBanner.helpline104': '104 వైద్య సహాయవాణి',

    // Six Modules Section
    'modules.eyebrow': 'సమీకృత ప్లాట్‌ఫారమ్ నిర్మాణం',
    'modules.heading': 'ఆరు అనుసంధానిత ప్రజా సేవా విభాగాలు',
    'modules.subheading':
      'ఒకే సమగ్ర వ్యవస్థగా రూపొందించబడింది. ప్రతి వైద్య అపాయింట్‌మెంట్, మందుల పంపిణీ, నీటి పరీక్ష మరియు పారిశుధ్య ఫిర్యాదు రియల్-టైమ్‌లో కమ్యూనిటీ ఇంటెలిజెన్స్‌ను అప్‌డేట్ చేస్తుంది.',
    'modules.openWorkspace': 'నా వర్క్‌స్పేస్ తెరవండి',

    'mod1.badge': 'విభాగం 01',
    'mod1.title': 'ఆరోగ్య సేవలు & OPD',
    'mod1.desc':
      'వైద్యుల వివరాలు, లైవ్ OPD సమయాలు, రోగుల అపాయింట్‌మెంట్ బుకింగ్, సిబ్బంది ఆమోదం మరియు ఉచిత ఆరోగ్య శిబిరాల నమోదు.',
    'mod1.m1': 'వైద్య కేంద్రాలు:',
    'mod1.m2': 'రోస్టర్ వైద్యులు:',
    'mod1.m3': 'రాబోయే ఆరోగ్య శిబిరాలు:',
    'mod1.btn': 'ఆరోగ్య సేవలు చూడండి',

    'mod2.badge': 'విభాగం 02',
    'mod2.title': 'మందుల నిల్వ నిర్వహణ',
    'mod2.desc':
      'బ్యాచ్ వారీగా నిల్వలు, FEFO పంపిణీ విధానం, కాలం చెల్లిన మందుల వేర్పాటు (Quarantine) మరియు తక్కువ నిల్వ హెచ్చరికలు.',
    'mod2.m1': 'ముఖ్యమైన మందులు:',
    'mod2.m2': 'చెల్లుబాటు నిల్వ:',
    'mod2.m3': 'తక్కువ నిల్వ హెచ్చరికలు:',
    'mod2.btn': 'మందుల నిల్వ పరిశీలించండి',

    'mod3.badge': 'విభాగం 03',
    'mod3.title': 'అత్యవసర సహాయం & 108',
    'mod3.desc':
      'నేరుగా 108/104 కాల్స్, ఆసుపత్రి ICU & ఆక్సిజన్ పడకల వివరాలు, సమ్మతి ఆధారిత GPS లొకేషన్ మరియు 5-దశల డిస్పాచ్ ట్రాకింగ్.',
    'mod3.m1': '108 అంబులెన్స్ దళం:',
    'mod3.m2': 'ప్రాంతీయ ఆసుపత్రులు:',
    'mod3.m3': 'డిస్పాచ్ ట్రాకింగ్:',
    'mod3.btn': 'అత్యవసర కేంద్రం తెరవండి',

    'mod4.badge': 'విభాగం 04',
    'mod4.title': '5-విభాగాల నీటి నిర్వహణ',
    'mod4.desc':
      'విభాగాల వారీగా పంపింగ్ రికార్డులు, నీటి ప్రవాహం & పీడనం, సరఫరా అంతరాయ ఫిర్యాదులు మరియు 5-పారామీటర్ BIS 10500 ల్యాబ్ పరీక్షలు.',
    'mod4.m1': 'గ్రామ సరఫరా విభజన:',
    'mod4.m2': 'తాజా సరఫరా నమోదు:',
    'mod4.m3': 'ల్యాబ్ పారామీటర్లు:',
    'mod4.btn': '5-విభాగాల నీటి వివరాలు చూడండి',

    'mod5.badge': 'విభాగం 05',
    'mod5.title': 'పారిశుధ్యం & ప్రాధాన్యత ఇంజిన్',
    'mod5.desc':
      'ఫోటోతో సమస్యల నివేదిక, పారదర్శక 0–100 ప్రాధాన్యత స్కోరింగ్, అధికారుల కేటాయింపు, పరిష్కార ఆధారాలు మరియు తిరిగి తెరవడం.',
    'mod5.m1': 'స్కోరింగ్ విధానం:',
    'mod5.m2': 'నీటి కాలుష్య ప్రమాదం:',
    'mod5.m3': 'పునఃపరిశీలన అదనపు స్కోరు:',
    'mod5.btn': 'పారిశుధ్య పోర్టల్ తెరవండి',

    'mod6.badge': 'విభాగం 06',
    'mod6.title': 'కమ్యూనిటీ ఇంటెలిజెన్స్',
    'mod6.desc':
      'అన్ని 5 విభాగాల లైవ్ డేటాబేస్ గణాంకాలను ఒకే చోట చూపే విశ్లేషణ డ్యాష్‌బోర్డ్ మరియు పరిష్కార సమయ నివేదికలు.',
    'mod6.m1': 'డేటా కచ్చితత్వం:',
    'mod6.m2': 'విభాగాల పోలిక:',
    'mod6.m3': 'సగటు పరిష్కార సమయం:',
    'mod6.btn': 'ఇంటెలిజెన్స్ డ్యాష్‌బోర్డ్ చూడండి',

    // Water overview on home
    'homeWater.title': 'కంతేరు 5-విభాగాల త్రాగునీటి టెలిమెట్రీ',
    'homeWater.desc':
      'అన్ని 5 పంచాయతీ విభాగాల్లోని పంపింగ్ సమయాలు, గృహ కవరేజ్ మరియు ఓవర్‌హెడ్ ట్యాంక్ సామర్థ్యం',
    'homeWater.btn': 'పూర్తి 5-విభాగాల పోలిక',
    'homeWater.section': 'విభాగం',
    'homeWater.volumeIndex': 'పరిమాణ సూచిక',
    'homeWater.window': 'సమయం:',
    'homeWater.households': 'గృహాలు:',
    'homeWater.reservoir': 'ట్యాంక్ సామర్థ్యం:',

    // Camps & Guarantee
    'camps.title': 'రాబోయే ఉచిత గ్రామ ఆరోగ్య శిబిరాలు',
    'camps.btn': 'ఆన్‌లైన్ నమోదు',
    'camps.empty': 'ఈ వారం ఆరోగ్య శిబిరాలు లేవు.',

    'integrity.badge': 'అల్గారిథమిక్ కచ్చితత్వ హామీ',
    'integrity.title': 'ఊహించిన సంఖ్యలు లేవు. 100% పారదర్శక గణనలు.',
    'integrity.p1Title': 'FEFO మందుల ఇంజిన్:',
    'integrity.p1Desc': 'అందుబాటులో ఉన్న నిల్వ ఎప్పుడూ మైనస్ లోకి వెళ్ళదు; కాలం చెల్లిన బ్యాచ్‌లు ఆటోమేటిక్‌గా వేరు చేయబడతాయి.',
    'integrity.p2Title': 'కఠినమైన BIS 10500 నీటి భద్రత:',
    'integrity.p2Desc': 'TDS ఆధారంగా సోడియం లేదా ఫ్లోరైడ్‌ను ఎప్పుడూ ఊహించదు. అసంపూర్ణ పరీక్షలు పెండింగ్‌గా గుర్తించబడతాయి.',
    'integrity.p3Title': 'పారదర్శక పారిశుధ్య ప్రాధాన్యత:',
    'integrity.p3Desc': 'సమస్య తీవ్రత, సున్నిత ప్రాంతాల సామీప్యం మరియు పెండింగ్ సమయం ఆధారంగా 0–100 స్కోర్.',
    'integrity.testRoles': 'అన్ని 6 పాత్రలు పరీక్షించండి',

    // Footer
    'footer.desc':
      'కంతేరు గ్రామ పంచాయతీ, గుంటూరు జిల్లా, ఆంధ్రప్రదేశ్ ప్రజల కోసం రూపొందించిన సమీకృత ఆరోగ్య మరియు ప్రజా సేవల డిజిటల్ వేదిక.',
    'footer.modulesTitle': 'సేవా విభాగాలు',
    'footer.dirTitle': 'అధికారిక చిరునామా & ఫోన్లు',
    'footer.address': 'గ్రామ పంచాయతీ కార్యాలయం, కంతేరు, తాడికొండ మండలం, గుంటూరు జిల్లా, AP - 522501',
    'footer.phc': 'PHC రిసెప్షన్: +91 863 2234101',
    'footer.ambulance': 'సెంట్రల్ అంబులెన్స్: 108 (టోల్ ఫ్రీ)',
    'footer.safetyTitle': 'భద్రత & ధృవీకరణ నియమాలు',
    'footer.safetyDesc':
      'HEALTHBRIDGE 360 ఖచ్చితమైన నీటి నాణ్యత ప్రమాణాలు మరియు లావాదేవీల మందుల ట్రాకింగ్‌ను పాటిస్తుంది. ప్రాణాపాయ పరిస్థితుల్లో వెబ్ అభ్యర్థనలు ఫోన్ కాల్స్‌కు ప్రత్యామ్నాయం కాదు.',
    'footer.copyright': '© 2026 HEALTHBRIDGE 360. కంతేరు కమ్యూనిటీ ప్లాట్‌ఫారమ్. సర్వ హక్కులు ప్రత్యేకించబడినవి.',

    // Module Page Headers
    'page.healthcare.title': 'ఆరోగ్య సేవలు (Healthcare Access)',
    'page.healthcare.sub': 'కంతేరు ప్రాథమిక ఆరోగ్య కేంద్రం & తాడికొండ CHC • వైద్యులు, OPD అపాయింట్‌మెంట్లు & శిబిరాలు',
    'page.medicines.title': 'మందుల నిల్వ (Medicine Inventory)',
    'page.medicines.sub': 'కంతేరు PHC డిస్పెన్సరీ • బ్యాచ్ ట్రాకింగ్, FEFO విధానం, కనీస నిల్వ హెచ్చరికలు & రికార్డులు',
    'page.emergency.title': 'అత్యవసర సహాయం (Emergency 108)',
    'page.emergency.sub': 'కంతేరు తక్షణ స్పందన • నేరుగా 108 కాల్స్, ఆసుపత్రి ICU పడకలు, అంబులెన్స్ దళం & ట్రియేజ్',
    'page.water.title': 'నీటి నిర్వహణ — 5 విభాగాలు',
    'page.water.sub': 'కంతేరు పంచాయతీ నీటి సరఫరా • రోజువారీ పంపింగ్ లాగ్స్, సెన్సార్ వివరాలు & BIS 10500 ల్యాబ్ పరీక్షలు',
    'page.sanitation.title': 'పారిశుధ్య నిర్వహణ (Sanitation)',
    'page.sanitation.sub': 'గ్రామ పరిశుభ్రత & డ్రైనేజీ • ప్రాధాన్యత అల్గారిథమ్, బృంద కేటాయింపు, స్థితి ట్రాకింగ్ & రీఓపెన్',
    'page.intelligence.title': 'కమ్యూనిటీ ఇంటెలిజెన్స్',
    'page.intelligence.sub': 'సమీకృత కార్యకలాపాల డ్యాష్‌బోర్డ్ • అన్ని 5 ప్రజా సేవా విభాగాల లైవ్ గణాంకాలు',
    'page.airQuality.title': 'స్వచ్ఛమైన గాలి & CPCB AQI కేంద్రం',
    'page.airQuality.sub': 'కంతేరు 5-విభాగాల గాలి నాణ్యత • కచ్చితమైన CPCB NAQI లెక్కలు, పొగ/దుమ్ము ఫిర్యాదులు & వాటర్ స్ప్రింక్లర్ డిస్పాచ్',
    'page.dashboard.title': 'వ్యక్తిగత సేవా వర్క్‌స్పేస్',
  },
} as const;

export type TranslationKey = keyof typeof translations.en;
