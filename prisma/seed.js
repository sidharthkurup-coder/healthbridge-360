const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

async function main() {
  console.log('Seeding HEALTHBRIDGE 360 database for Kantheru, Andhra Pradesh...');

  // 1. Clean previous data
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.statusHistory.deleteMany();
  await prisma.sanitationComplaint.deleteMany();
  await prisma.waterComplaint.deleteMany();
  await prisma.waterQualityReport.deleteMany();
  await prisma.waterSupplyRecord.deleteMany();
  await prisma.waterSupplySchedule.deleteMany();
  await prisma.waterSection.deleteMany();
  await prisma.emergencyRequest.deleteMany();
  await prisma.ambulanceService.deleteMany();
  await prisma.hospitalFacility.deleteMany();
  await prisma.emergencyContact.deleteMany();
  await prisma.stockTransaction.deleteMany();
  await prisma.medicineBatch.deleteMany();
  await prisma.medicine.deleteMany();
  await prisma.healthCampRegistration.deleteMany();
  await prisma.healthCamp.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.doctorSchedule.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.healthCenter.deleteMany();
  await prisma.user.deleteMany();

  const defaultPasswordHash = await hashPassword('Password@123');

  // 2. Create Users with All Roles
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@healthbridge360.in',
      name: 'Smt. K. Bhavani',
      phone: '+91 94401 23456',
      role: 'ADMIN',
      passwordHash: defaultPasswordHash,
      sectionId: 5,
      address: 'Gram Panchayat Office, Kantheru, Guntur Dist.',
    },
  });

  const residentUser = await prisma.user.create({
    data: {
      email: 'resident@healthbridge360.in',
      name: 'Venkata Ramana',
      phone: '+91 98480 54321',
      role: 'RESIDENT',
      passwordHash: defaultPasswordHash,
      sectionId: 2,
      address: 'Door No. 3-45, Ramalayam Street, Section 2, Kantheru',
    },
  });

  const doctorUser = await prisma.user.create({
    data: {
      email: 'doctor.phc@healthbridge360.in',
      name: 'Dr. P. Sandeep Kumar, MBBS, MD',
      phone: '+91 98491 67890',
      role: 'HEALTHCARE_STAFF',
      passwordHash: defaultPasswordHash,
      sectionId: 1,
      address: 'Staff Quarters, Kantheru Primary Health Centre',
    },
  });

  const medicineUser = await prisma.user.create({
    data: {
      email: 'medicine.staff@healthbridge360.in',
      name: 'M. Lakshmi (Senior Pharmacist)',
      phone: '+91 94901 88776',
      role: 'MEDICINE_STAFF',
      passwordHash: defaultPasswordHash,
      sectionId: 1,
      address: 'Pharmacy Wing, Kantheru PHC',
    },
  });

  const emergencyUser = await prisma.user.create({
    data: {
      email: 'emergency.coord@healthbridge360.in',
      name: 'K. Rajesh (108 Emergency Coordinator)',
      phone: '+91 94405 10800',
      role: 'EMERGENCY_COORDINATOR',
      passwordHash: defaultPasswordHash,
      sectionId: 4,
      address: 'Sub-District Disaster Response Unit, Kantheru Bypass',
    },
  });

  const waterOfficerUser = await prisma.user.create({
    data: {
      email: 'water.officer@healthbridge360.in',
      name: 'G. Suresh Babu (AEE, RWSS & Panchayat)',
      phone: '+91 98660 33445',
      role: 'WATER_SANITATION_OFFICER',
      passwordHash: defaultPasswordHash,
      sectionId: 5,
      address: 'Rural Water Supply Office, Tadikonda & Kantheru Circle',
    },
  });

  console.log('Created 6 core users with distinct roles.');

  // 3. Module 1: Healthcare Facilities & Doctors
  const phcKantheru = await prisma.healthCenter.create({
    data: {
      name: 'Kantheru Primary Health Centre (PHC)',
      type: 'PRIMARY_HEALTH_CENTRE',
      location: 'Kantheru Main Road, Opp. Panchayat High School',
      address: 'Kantheru Village, Tadikonda Mandal, Guntur District, Andhra Pradesh 522501',
      phone: '+91 863 2234101',
      emergencyPhone: '+91 863 2234108',
      operatingHours: '08:00 AM - 04:00 PM (Emergency 24x7)',
      services: JSON.stringify([
        'General OPD',
        'Maternal & Child Health (MCH)',
        'Immunization & Vaccination',
        'NCD Screening (Diabetes & Hypertension)',
        'Pharmacy & Free Medicine Dispensation',
        'Basic Clinical Laboratory',
        'Minor Trauma & Wound Dressing',
      ]),
      isActive: true,
    },
  });

  const chcTadikonda = await prisma.healthCenter.create({
    data: {
      name: 'Community Health Centre (CHC) Tadikonda',
      type: 'COMMUNITY_HEALTH_CENTRE',
      location: 'Mandal Headquarters, Tadikonda (4.5 km from Kantheru)',
      address: 'Hospital Road, Tadikonda, Guntur District, Andhra Pradesh 522236',
      phone: '+91 863 2456200',
      emergencyPhone: '+91 863 2456108',
      operatingHours: 'Open 24 Hours (Full Emergency & In-Patient Facility)',
      services: JSON.stringify([
        '24x7 Emergency Room',
        '30-Bed In-Patient Ward',
        'Normal & Assisted Deliveries',
        'Pediatric Care',
        'Ultrasonography & Digital X-Ray',
        'Dedicated Ambulance Stationing',
      ]),
      isActive: true,
    },
  });

  const doctor1 = await prisma.doctor.create({
    data: {
      healthCenterId: phcKantheru.id,
      name: 'Dr. P. Sandeep Kumar',
      specialization: 'General Medicine & Family Health',
      qualification: 'MBBS, MD (Internal Medicine)',
      regNumber: 'APMC/74921',
      experienceYears: 8,
      consultationFee: 0,
      isAvailable: true,
      bio: 'Serving Kantheru community since 2019. Special interest in preventative rural cardiology and seasonal epidemic control.',
    },
  });

  const doctor2 = await prisma.doctor.create({
    data: {
      healthCenterId: phcKantheru.id,
      name: 'Dr. Ananya Reddy',
      specialization: 'Pediatrics & Child Wellness',
      qualification: 'MBBS, DCH',
      regNumber: 'APMC/88214',
      experienceYears: 6,
      consultationFee: 0,
      isAvailable: true,
      bio: 'In charge of child nutrition, universal immunization drives, and adolescent health checks across Kantheru ward schools.',
    },
  });

  const doctor3 = await prisma.doctor.create({
    data: {
      healthCenterId: phcKantheru.id,
      name: 'Dr. Ch. Venkatarathnam',
      specialization: 'Obstetrics & Gynecology (MCH Specialist)',
      qualification: 'MBBS, DGO',
      regNumber: 'APMC/62018',
      experienceYears: 14,
      consultationFee: 0,
      isAvailable: true,
      bio: 'Senior consultant handling high-risk antenatal care, post-natal monitoring, and anaemia reduction programs.',
    },
  });

  // Doctor Schedules (Monday to Saturday)
  for (let day = 1; day <= 6; day++) {
    await prisma.doctorSchedule.create({
      data: {
        doctorId: doctor1.id,
        dayOfWeek: day,
        startTime: '09:00',
        endTime: '13:00',
        maxPatients: 30,
        isAvailable: true,
      },
    });
    await prisma.doctorSchedule.create({
      data: {
        doctorId: doctor2.id,
        dayOfWeek: day,
        startTime: '10:00',
        endTime: '14:00',
        maxPatients: 25,
        isAvailable: true,
      },
    });
  }

  // Sample Appointments
  await prisma.appointment.create({
    data: {
      residentId: residentUser.id,
      doctorId: doctor1.id,
      healthCenterId: phcKantheru.id,
      appointmentDate: '2026-11-14',
      timeSlot: '09:30 - 10:00',
      reason: 'Routine quarterly checkup for hypertension management and prescription renewal.',
      priority: 'NORMAL',
      status: 'APPROVED',
      staffNotes: 'Approved by OPD desk. Please bring previous blood pressure record booklet.',
    },
  });

  await prisma.appointment.create({
    data: {
      residentId: residentUser.id,
      doctorId: doctor2.id,
      healthCenterId: phcKantheru.id,
      appointmentDate: '2026-11-15',
      timeSlot: '11:00 - 11:30',
      reason: 'Pediatric immunization booster for 5-year-old child (DPT & Oral Polio).',
      priority: 'NORMAL',
      status: 'PENDING',
    },
  });

  // Health Camp
  const camp1 = await prisma.healthCamp.create({
    data: {
      title: 'Mega Non-Communicable Diseases (NCD) & Eye Screening Camp',
      description: 'Free comprehensive screening for Diabetes (HbA1c/Random Blood Sugar), Hypertension, Cataract, and Diabetic Retinopathy for all residents aged 30 and above.',
      location: 'Kantheru Zilla Parishad High School Grounds',
      sectionId: 3,
      campDate: '2026-11-22',
      startTime: '08:30',
      endTime: '15:30',
      servicesOffered: JSON.stringify([
        'Blood Glucose & Lipid Profile Testing',
        'Refraction & Vision Testing with Free Spectacle Distribution',
        'Cardiology Consultation & ECG',
        'Free Chronic Disease Medication Kit',
      ]),
      doctorsAttending: 'Dr. P. Sandeep Kumar, Dr. V. Murali (Ophthalmologist, GGH Guntur), Dr. K. Radhika',
      maxCapacity: 250,
      status: 'UPCOMING',
    },
  });

  await prisma.healthCampRegistration.create({
    data: {
      campId: camp1.id,
      residentId: residentUser.id,
      attendeeName: 'Venkata Ramana',
      phone: '+91 98480 54321',
      age: 52,
      gender: 'Male',
    },
  });

  // 4. Module 2: Medicine Inventory
  const med1 = await prisma.medicine.create({
    data: {
      name: 'Paracetamol',
      genericName: 'Paracetamol IP',
      category: 'Analgesic & Antipyretic',
      form: 'Tablet',
      strength: '500 mg',
      unit: 'Strips of 10 Tablets',
      minThreshold: 100,
      isEssential: true,
      storageConditions: 'Store below 30°C in a dry place',
    },
  });

  const med2 = await prisma.medicine.create({
    data: {
      name: 'Amoxicillin & Potassium Clavulanate',
      genericName: 'Amoxicillin + Clavulanic Acid IP',
      category: 'Antibiotic',
      form: 'Tablet',
      strength: '625 mg (500mg + 125mg)',
      unit: 'Strips of 6 Tablets',
      minThreshold: 60,
      isEssential: true,
      storageConditions: 'Store in airtight moisture-proof blister pack',
    },
  });

  const med3 = await prisma.medicine.create({
    data: {
      name: 'Metformin Hydrochloride (Prolonged Release)',
      genericName: 'Metformin HCl IP',
      category: 'Antidiabetic',
      form: 'Tablet',
      strength: '500 mg',
      unit: 'Strips of 15 Tablets',
      minThreshold: 120,
      isEssential: true,
      storageConditions: 'Room temperature below 25°C',
    },
  });

  const med4 = await prisma.medicine.create({
    data: {
      name: 'Amlodipine Besylate',
      genericName: 'Amlodipine IP',
      category: 'Cardiovascular / Antihypertensive',
      form: 'Tablet',
      strength: '5 mg',
      unit: 'Strips of 10 Tablets',
      minThreshold: 80,
      isEssential: true,
      storageConditions: 'Protect from direct sunlight',
    },
  });

  const med5 = await prisma.medicine.create({
    data: {
      name: 'Oral Rehydration Salts (ORS WHO Formula)',
      genericName: 'Oral Rehydration Salts IP (Low Osmolarity)',
      category: 'Electrolyte & Dehydration',
      form: 'Powder Sachet',
      strength: '20.5 g sachet (for 1 Litre water)',
      unit: 'Sachets',
      minThreshold: 150,
      isEssential: true,
      storageConditions: 'Store in dry place away from dampness',
    },
  });

  const med6 = await prisma.medicine.create({
    data: {
      name: 'Azithromycin',
      genericName: 'Azithromycin IP',
      category: 'Antibiotic',
      form: 'Tablet',
      strength: '500 mg',
      unit: 'Strips of 3 Tablets',
      minThreshold: 50,
      isEssential: true,
      storageConditions: 'Store below 25°C',
    },
  });

  // Batches for Medicines
  // Paracetamol: Batch 1 (Active, good stock), Batch 2 (Expiring early 2027)
  const batchPara1 = await prisma.medicineBatch.create({
    data: {
      medicineId: med1.id,
      batchNumber: 'PCM-2025-09A',
      initialQuantity: 500,
      currentQuantity: 380,
      manufacturingDate: '2025-08-15',
      expiryDate: '2027-07-31',
      supplier: 'APMSIDC Central Medical Warehouse, Guntur',
      receivedDate: '2025-09-01',
      isQuarantined: false,
    },
  });

  // Amoxicillin: Batch 1 (Expired batch to verify algorithm quarantine), Batch 2 (Active batch)
  const batchAmoxExpired = await prisma.medicineBatch.create({
    data: {
      medicineId: med2.id,
      batchNumber: 'AMX-2024-EXP',
      initialQuantity: 100,
      currentQuantity: 45,
      manufacturingDate: '2024-03-10',
      expiryDate: '2026-09-30', // EXPIRED! Must not be counted in available stock
      supplier: 'Govt Medical Depot Vijayawada',
      receivedDate: '2024-04-02',
      isQuarantined: false,
    },
  });

  const batchAmoxValid = await prisma.medicineBatch.create({
    data: {
      medicineId: med2.id,
      batchNumber: 'AMX-2026-04B',
      initialQuantity: 150,
      currentQuantity: 95,
      manufacturingDate: '2026-03-01',
      expiryDate: '2028-02-28',
      supplier: 'APMSIDC Central Medical Warehouse, Guntur',
      receivedDate: '2026-03-20',
      isQuarantined: false,
    },
  });

  // Amlodipine: Low-stock state (Total current quantity: 35 < minThreshold of 80)
  const batchAmloLow = await prisma.medicineBatch.create({
    data: {
      medicineId: med4.id,
      batchNumber: 'AML-2025-11X',
      initialQuantity: 200,
      currentQuantity: 35, // Trigger Low Stock Warning
      manufacturingDate: '2025-10-01',
      expiryDate: '2027-09-30',
      supplier: 'APMSIDC Central Medical Warehouse, Guntur',
      receivedDate: '2025-10-25',
      isQuarantined: false,
    },
  });

  // Metformin
  const batchMetformin = await prisma.medicineBatch.create({
    data: {
      medicineId: med3.id,
      batchNumber: 'MET-2026-01K',
      initialQuantity: 300,
      currentQuantity: 210,
      manufacturingDate: '2026-01-10',
      expiryDate: '2028-01-31',
      supplier: 'APMSIDC Central Medical Warehouse, Guntur',
      receivedDate: '2026-01-28',
      isQuarantined: false,
    },
  });

  // ORS
  const batchORS = await prisma.medicineBatch.create({
    data: {
      medicineId: med5.id,
      batchNumber: 'ORS-2026-06D',
      initialQuantity: 500,
      currentQuantity: 420,
      manufacturingDate: '2026-05-15',
      expiryDate: '2028-05-14',
      supplier: 'UNICEF / AP National Health Mission',
      receivedDate: '2026-06-01',
      isQuarantined: false,
    },
  });

  // Stock Movement Transactions
  await prisma.stockTransaction.create({
    data: {
      medicineId: med1.id,
      batchId: batchPara1.id,
      type: 'PURCHASE_RECEIPT',
      quantity: 500,
      previousQuantity: 0,
      newQuantity: 500,
      reason: 'Quarterly state allotment received from APMSIDC Guntur depot.',
      performedByUserId: medicineUser.id,
    },
  });

  await prisma.stockTransaction.create({
    data: {
      medicineId: med1.id,
      batchId: batchPara1.id,
      type: 'DISPENSED',
      quantity: 120,
      previousQuantity: 500,
      newQuantity: 380,
      reason: 'Dispensed against verified PHC OPD doctor prescriptions for weekly viral fever cases.',
      performedByUserId: medicineUser.id,
    },
  });

  await prisma.stockTransaction.create({
    data: {
      medicineId: med4.id,
      batchId: batchAmloLow.id,
      type: 'DISPENSED',
      quantity: 165,
      previousQuantity: 200,
      newQuantity: 35,
      reason: 'Monthly NCD repeat refill distribution to hypertensive village elders.',
      performedByUserId: medicineUser.id,
    },
  });

  // 5. Module 3: Emergency Assistance
  await prisma.emergencyContact.createMany({
    data: [
      {
        name: 'AP State 108 Emergency Ambulance Dispatch',
        serviceType: 'AMBULANCE',
        phone: '108',
        altPhone: '+91 863 2234108',
        operational24x7: true,
        location: 'Central Control Room, Guntur (Dedicated Kantheru Bypass Unit)',
      },
      {
        name: '104 Medical Advice & Health Information Helpline',
        serviceType: 'HEALTH_HELPLINE',
        phone: '104',
        operational24x7: true,
        location: 'Government of Andhra Pradesh Health Desk',
      },
      {
        name: 'Kantheru PHC 24/7 Emergency Casualty Desk',
        serviceType: 'PHC_EMERGENCY',
        phone: '+91 863 2234101',
        altPhone: '+91 98491 67890',
        operational24x7: true,
        location: 'Kantheru PHC Campus, Main Road',
      },
      {
        name: 'Tadikonda Police Station (Law & Order / Trauma Assistance)',
        serviceType: 'POLICE',
        phone: '100',
        altPhone: '+91 863 2456100',
        operational24x7: true,
        location: 'Tadikonda Police Station, Mandal HQ',
      },
      {
        name: 'Andhra Pradesh Fire & Disaster Response Services',
        serviceType: 'FIRE',
        phone: '101',
        altPhone: '+91 863 2220101',
        operational24x7: true,
        location: 'Mangalagiri Fire Station (7 km from Kantheru)',
      },
    ],
  });

  await prisma.hospitalFacility.createMany({
    data: [
      {
        name: 'Kantheru Primary Health Centre',
        type: 'PRIMARY_HEALTH_CENTRE',
        address: 'Main Road, Kantheru',
        phone: '+91 863 2234101',
        emergencyDeskPhone: '+91 863 2234108',
        distanceKm: 0.8,
        icuBedsAvailable: 0,
        totalIcuBeds: 0,
        oxygenAvailable: true,
        bloodBankAvailable: false,
        ambulanceStationed: 1,
      },
      {
        name: 'Community Health Centre Tadikonda',
        type: 'COMMUNITY_HEALTH_CENTRE',
        address: 'Hospital Road, Tadikonda',
        phone: '+91 863 2456200',
        emergencyDeskPhone: '+91 863 2456108',
        distanceKm: 4.5,
        icuBedsAvailable: 4,
        totalIcuBeds: 8,
        oxygenAvailable: true,
        bloodBankAvailable: true,
        ambulanceStationed: 2,
      },
      {
        name: 'Government General Hospital (GGH) Guntur',
        type: 'GOVT_GENERAL_HOSPITAL',
        address: 'Sambasiva Pet, Guntur',
        phone: '+91 863 2223000',
        emergencyDeskPhone: '+91 863 2223108',
        distanceKm: 14.2,
        icuBedsAvailable: 18,
        totalIcuBeds: 45,
        oxygenAvailable: true,
        bloodBankAvailable: true,
        ambulanceStationed: 6,
      },
      {
        name: 'AIIMS Mangalagiri Super Speciality Hospital',
        type: 'GOVT_GENERAL_HOSPITAL',
        address: 'NH-16, Mangalagiri, Guntur District',
        phone: '+91 8645 280000',
        emergencyDeskPhone: '+91 8645 280108',
        distanceKm: 12.0,
        icuBedsAvailable: 26,
        totalIcuBeds: 60,
        oxygenAvailable: true,
        bloodBankAvailable: true,
        ambulanceStationed: 4,
      },
    ],
  });

  const amb1 = await prisma.ambulanceService.create({
    data: {
      vehicleNumber: 'AP 07 TX 1081',
      driverName: 'B. Venkata Rao',
      contactNumber: '+91 94405 11081',
      serviceType: 'ADVANCED_LIFE_SUPPORT',
      baseLocation: 'Kantheru PHC Standby Point',
      status: 'AVAILABLE',
    },
  });

  const amb2 = await prisma.ambulanceService.create({
    data: {
      vehicleNumber: 'AP 07 TX 1082',
      driverName: 'M. Sambasiva',
      contactNumber: '+91 94405 11082',
      serviceType: 'BASIC_LIFE_SUPPORT',
      baseLocation: 'Tadikonda Highway Node',
      status: 'AVAILABLE',
    },
  });

  await prisma.emergencyRequest.create({
    data: {
      residentId: residentUser.id,
      callerName: 'Venkata Ramana',
      callerPhone: '+91 98480 54321',
      patientCondition: 'Elderly neighbor experiencing acute chest heaviness, profuse sweating and shortness of breath.',
      locationDescription: 'Door No. 3-48, Ramalayam Street, Section 2, near ancient water tank',
      latitude: 16.3985,
      longitude: 80.5123,
      locationConsentGiven: true,
      status: 'DISPATCHED',
      assignedAmbulanceId: amb1.id,
      responderNotes: '108 Ambulance AP 07 TX 1081 rolled out with EMT Paramedic. Driver contacted caller at 22:04.',
      responseLog: JSON.stringify([
        { status: 'SUBMITTED', timestamp: '2026-11-12T16:15:00Z', note: 'Emergency request logged via portal.' },
        { status: 'ACKNOWLEDGED', timestamp: '2026-11-12T16:16:30Z', note: 'Coordinator picked up ticket; telephone triage initiated.' },
        { status: 'CONTACTED', timestamp: '2026-11-12T16:18:00Z', note: 'Caller contacted. Advised caller to keep patient sitting upright.' },
        { status: 'DISPATCHED', timestamp: '2026-11-12T16:21:00Z', note: 'Ambulance AP 07 TX 1081 assigned; ETA 6 minutes.' },
      ]),
    },
  });

  // 6. Module 4: Water Management (Dedicated 5 Sections of Kantheru)
  const sectionData = [
    {
      id: 1,
      name: 'Section 1 - North Kantheru (Old Village & Pedda Bazar)',
      description: 'Covers historical village core, commercial market lane, old Shiva Temple streets and Pedda Bazar residences.',
      householdsCount: 420,
      tankCapacityLiters: 150000,
      pipelineLengthKm: 3.8,
      pumpOperatorName: 'V. Sambaiah',
      pumpOperatorPhone: '+91 98481 11221',
    },
    {
      id: 2,
      name: 'Section 2 - South Kantheru (Ramalayam & BC Colony)',
      description: 'Densely populated residential layout covering Ramalayam street, BC Colony and adjacent agricultural fringe lanes.',
      householdsCount: 510,
      tankCapacityLiters: 180000,
      pipelineLengthKm: 4.5,
      pumpOperatorName: 'K. Subba Rao',
      pumpOperatorPhone: '+91 98481 11222',
    },
    {
      id: 3,
      name: 'Section 3 - East Kantheru (SC Colony & ZP School Area)',
      description: 'Eastern quadrant surrounding the Zilla Parishad High School, Anganwadi centre cluster, and SC Colony extension.',
      householdsCount: 380,
      tankCapacityLiters: 120000,
      pipelineLengthKm: 3.2,
      pumpOperatorName: 'P. Nageswara Rao',
      pumpOperatorPhone: '+91 98481 11223',
    },
    {
      id: 4,
      name: 'Section 4 - West Kantheru (Bypass Road & Extension)',
      description: 'New residential development zone along the Tadikonda bypass, tractor garages, and outer warehouse perimeters.',
      householdsCount: 310,
      tankCapacityLiters: 100000,
      pipelineLengthKm: 3.6,
      pumpOperatorName: 'M. China Venkaiah',
      pumpOperatorPhone: '+91 98481 11224',
    },
    {
      id: 5,
      name: 'Section 5 - Central Kantheru (Panchayat Office & Market Junction)',
      description: 'Administrative hub, Gram Panchayat building, Rural Library, Kantheru PHC perimeter, and Bus Shelter street.',
      householdsCount: 290,
      tankCapacityLiters: 110000,
      pipelineLengthKm: 2.9,
      pumpOperatorName: 'Ch. Govind',
      pumpOperatorPhone: '+91 98481 11225',
    },
  ];

  for (const s of sectionData) {
    await prisma.waterSection.create({ data: s });
  }

  // Supply Schedules
  for (let secId = 1; secId <= 5; secId++) {
    for (let day = 0; day <= 6; day++) {
      const startTime = secId % 2 === 1 ? '06:00' : '07:30';
      const endTime = secId % 2 === 1 ? '08:30' : '10:00';
      await prisma.waterSupplySchedule.create({
        data: {
          sectionId: secId,
          dayOfWeek: day,
          scheduledStartTime: startTime,
          scheduledEndTime: endTime,
          durationMinutes: 150,
          targetQuantityKL: secId === 2 ? 95.0 : secId === 1 ? 80.0 : 65.0,
          isActive: true,
        },
      });
    }
  }

  // Historical Water Supply Records
  const sampleSupplyRecords = [
    {
      sectionId: 1,
      supplyDate: '2026-11-10',
      actualStartTime: '06:00',
      actualEndTime: '08:30',
      actualDurationMinutes: 150,
      quantitySuppliedKL: 82.5,
      flowRateLpm: 550.0,
      pressureBar: 2.2,
      interruptionOccurred: false,
      status: 'COMPLETED',
      notes: 'Standard morning distribution. All tail-end taps received normal pressure.',
    },
    {
      sectionId: 1,
      supplyDate: '2026-11-11',
      actualStartTime: '06:10',
      actualEndTime: '08:40',
      actualDurationMinutes: 150,
      quantitySuppliedKL: 81.0,
      flowRateLpm: 540.0,
      pressureBar: 2.1,
      interruptionOccurred: false,
      status: 'COMPLETED',
      notes: 'Pumping smoothly completed.',
    },
    {
      sectionId: 2,
      supplyDate: '2026-11-10',
      actualStartTime: '07:30',
      actualEndTime: '10:00',
      actualDurationMinutes: 150,
      quantitySuppliedKL: 96.0,
      flowRateLpm: 640.0,
      pressureBar: 2.3,
      interruptionOccurred: false,
      status: 'COMPLETED',
      notes: 'High demand satisfied in Ramalayam lane.',
    },
    {
      sectionId: 2,
      supplyDate: '2026-11-11',
      actualStartTime: '07:30',
      actualEndTime: '09:10',
      actualDurationMinutes: 100,
      quantitySuppliedKL: 62.0,
      flowRateLpm: 620.0,
      pressureBar: 1.8,
      interruptionOccurred: true,
      interruptionReason: 'Feeder motor thermal trip caused by 3-phase line fluctuation',
      status: 'PARTIAL',
      notes: 'Pumping halted 50 mins prematurely due to voltage spike. BC colony tail-end faced reduced volume.',
    },
    {
      sectionId: 3,
      supplyDate: '2026-11-10',
      actualStartTime: '06:00',
      actualEndTime: '08:15',
      actualDurationMinutes: 135,
      quantitySuppliedKL: 64.0,
      flowRateLpm: 480.0,
      pressureBar: 1.9,
      interruptionOccurred: false,
      status: 'COMPLETED',
      notes: 'School overhead cistern and public taps fully filled.',
    },
    {
      sectionId: 4,
      supplyDate: '2026-11-10',
      actualStartTime: '07:30',
      actualEndTime: '09:45',
      actualDurationMinutes: 135,
      quantitySuppliedKL: 68.0,
      flowRateLpm: null, // Test missing flow sensor
      pressureBar: 1.7,
      interruptionOccurred: false,
      status: 'COMPLETED',
      notes: 'Flow meter under recalibration; pressure within acceptable operational limits.',
    },
    {
      sectionId: 5,
      supplyDate: '2026-11-11',
      actualStartTime: '06:00',
      actualEndTime: '08:20',
      actualDurationMinutes: 140,
      quantitySuppliedKL: 72.0,
      flowRateLpm: 510.0,
      pressureBar: 2.0,
      interruptionOccurred: false,
      status: 'COMPLETED',
      notes: 'Panchayat complex and PHC supply maintained at normal head.',
    },
  ];

  for (const sr of sampleSupplyRecords) {
    await prisma.waterSupplyRecord.create({
      data: {
        ...sr,
        recordedByUserId: waterOfficerUser.id,
      },
    });
  }

  // Water Quality Reports
  await prisma.waterQualityReport.create({
    data: {
      sectionId: 1,
      testDate: '2026-11-05',
      sampleLocation: 'Pedda Bazar Public Tap Point #4, Section 1',
      testedBy: 'Sri P. Rama Krishna, Senior Chemist',
      labName: 'District Water Testing & Quality Control Laboratory, Guntur (RWSS)',
      labReportFileUrl: '/docs/lab-reports/kantheru_sec1_nov2026.pdf',
      verificationStatus: 'VERIFIED',
      sodiumMgL: 68.4,
      fluorideMgL: 0.72,
      phValue: 7.35,
      tdsPpm: 295.0,
      microbialColiformColonies: 0,
      notes: 'Water is potable and completely safe for human consumption. Zero bacterial colonies detected.',
      verifiedByUserId: waterOfficerUser.id,
      verifiedAt: new Date('2026-11-06T10:00:00Z'),
    },
  });

  await prisma.waterQualityReport.create({
    data: {
      sectionId: 2,
      testDate: '2026-11-08',
      sampleLocation: 'Ramalayam Street Borewell & Cistern Output, Section 2',
      testedBy: 'AP Water Quality Directorate Testing Van',
      labName: 'Mobile Environmental Testing Unit #03, Guntur',
      labReportFileUrl: '/docs/lab-reports/kantheru_sec2_nov2026.pdf',
      verificationStatus: 'VERIFIED',
      sodiumMgL: 112.0,
      fluorideMgL: 0.88,
      phValue: 7.6,
      tdsPpm: 410.0,
      microbialColiformColonies: 0,
      notes: 'Total Coliform 0 CFU/100ml. Safe for domestic usage. All chemical parameters well within BIS 10500 limits.',
      verifiedByUserId: waterOfficerUser.id,
      verifiedAt: new Date('2026-11-09T14:30:00Z'),
    },
  });

  await prisma.waterQualityReport.create({
    data: {
      sectionId: 4,
      testDate: '2026-11-10',
      sampleLocation: 'Bypass Road Extension Overhead Tank Intake',
      testedBy: 'Private Certified Analytical Laboratory, Mangalagiri',
      labName: 'Quality Analytical Testing Services',
      verificationStatus: 'PENDING_VERIFICATION',
      sodiumMgL: 95.0,
      fluorideMgL: 0.95,
      phValue: 7.8,
      tdsPpm: 460.0,
      microbialColiformColonies: 0,
      notes: 'Submitted by contractor after pipeline replacement. Awaiting counter-verification by Assistant Executive Engineer.',
    },
  });

  // 7. Module 5: Sanitation Complaints
  const c1 = await prisma.sanitationComplaint.create({
    data: {
      residentId: residentUser.id,
      sectionId: 2,
      category: 'SEWAGE_OVERFLOW',
      description: 'Main open drainage culvert opposite Ramalayam community hall is blocked by silt and overflowing raw sewage into the residential walkway.',
      location: 'Opposite Ramalayam Hall, Section 2, Kantheru',
      photoUrl: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600&auto=format&fit=crop',
      affectedHouseholds: 18,
      priorityScore: 78.5,
      calculatedPriority: 'CRITICAL',
      priorityReason: 'Calculated priority score 78.5/100 [CRITICAL]. Determined by: SEWAGE OVERFLOW (+35 pts due to active human fecal biohazard), 18 households affected (+14 pts), near Ramalayam assembly area, persistent chokage.',
      status: 'ASSIGNED',
      assignedToUserId: waterOfficerUser.id,
      assignedDepartment: 'Panchayat Drainage & De-silting Squad',
      submittedAt: new Date('2026-11-11T09:00:00Z'),
      acknowledgedAt: new Date('2026-11-11T09:30:00Z'),
      assignedAt: new Date('2026-11-11T10:15:00Z'),
    },
  });

  await prisma.statusHistory.create({
    data: {
      complaintId: c1.id,
      fromStatus: 'SUBMITTED',
      toStatus: 'UNDER_REVIEW',
      changedByUserId: adminUser.id,
      changedByName: 'Smt. K. Bhavani',
      comment: 'Complaint reviewed and verified by Ward Secretary.',
      timestamp: new Date('2026-11-11T09:30:00Z'),
    },
  });

  await prisma.statusHistory.create({
    data: {
      complaintId: c1.id,
      fromStatus: 'UNDER_REVIEW',
      toStatus: 'ASSIGNED',
      changedByUserId: adminUser.id,
      changedByName: 'Smt. K. Bhavani',
      comment: 'Dispatched to Panchayat Drainage Cleansing Squad with mechanised suction tractor.',
      timestamp: new Date('2026-11-11T10:15:00Z'),
    },
  });

  const c2 = await prisma.sanitationComplaint.create({
    data: {
      residentId: residentUser.id,
      sectionId: 1,
      category: 'BLOCKED_DRAINAGE',
      description: 'Culvert clogged with plastic debris and silt behind Pedda Bazar grocery stores.',
      location: 'Lane 4, Pedda Bazar, Section 1',
      photoUrl: 'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?w=600&auto=format&fit=crop',
      affectedHouseholds: 6,
      priorityScore: 52.0,
      calculatedPriority: 'HIGH',
      priorityReason: 'Calculated priority score 52.0/100 [HIGH]. Determined by: BLOCKED DRAINAGE (+20 pts), 6 households affected (+14 pts), commercial pedestrian lane (+10 pts).',
      status: 'RESOLVED',
      assignedToUserId: waterOfficerUser.id,
      assignedDepartment: 'Panchayat Sanitation Wing',
      resolutionEvidenceUrl: 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?w=600&auto=format&fit=crop',
      resolutionNotes: 'Culvert cleared of all plastic debris and flushed with lime powder disinfectant. Water running freely.',
      submittedAt: new Date('2026-11-09T08:00:00Z'),
      acknowledgedAt: new Date('2026-11-09T09:00:00Z'),
      assignedAt: new Date('2026-11-09T10:30:00Z'),
      resolvedAt: new Date('2026-11-09T15:45:00Z'),
    },
  });

  await prisma.statusHistory.create({
    data: {
      complaintId: c2.id,
      fromStatus: 'ASSIGNED',
      toStatus: 'RESOLVED',
      changedByUserId: waterOfficerUser.id,
      changedByName: 'G. Suresh Babu',
      comment: 'Sanitation field team completed desilting and sanitisation.',
      timestamp: new Date('2026-11-09T15:45:00Z'),
    },
  });

  // Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: residentUser.id,
        title: 'Appointment Confirmed',
        message: 'Your appointment with Dr. P. Sandeep Kumar on Nov 14 at 09:30 AM has been approved.',
        category: 'HEALTHCARE',
        link: '/healthcare',
      },
      {
        userId: residentUser.id,
        title: 'Sanitation Complaint Update',
        message: 'Your complaint regarding drainage in Section 2 has been assigned to the Panchayat Cleansing Squad.',
        category: 'SANITATION',
        link: '/sanitation',
      },
      {
        userId: medicineUser.id,
        title: 'Low Stock Alert: Amlodipine 5mg',
        message: 'Available inventory (35 strips) has fallen below the safety threshold of 80 strips.',
        category: 'MEDICINE',
        link: '/medicines',
      },
    ],
  });

  // Audit Logs
  await prisma.auditLog.createMany({
    data: [
      {
        userId: medicineUser.id,
        action: 'MEDICINE_DISPENSED',
        entityType: 'MedicineBatch',
        entityId: batchAmloLow.id,
        details: JSON.stringify({ medicine: 'Amlodipine 5mg', deducted: 165, remaining: 35 }),
      },
      {
        userId: waterOfficerUser.id,
        action: 'WATER_QUALITY_VERIFIED',
        entityType: 'WaterQualityReport',
        entityId: 'wq1',
        details: JSON.stringify({ section: 1, lab: 'RWSS Guntur', status: 'VERIFIED', potability: 'SAFE' }),
      },
    ],
  });

  console.log('Database seeding successfully finished!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
