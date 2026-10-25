/* eslint-disable import/no-extraneous-dependencies, no-empty */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const faker = require('faker');
const config = require('../config/config');
const logger = require('../config/logger');
const technologyTagsData = require('./data/tags.data');
const { University, Faculty, TechnologyTag, User, Project, Notification, Token } = require('../models');

const isClean = process.argv.includes('--clean') || process.argv.includes('-c');

const sampleUniversities = [
  { name: 'Kandahar University', domain: 'kdun.edu.af' },
  { name: 'Kabul University', domain: 'ku.edu.af' },
  { name: 'Herat University', domain: 'hu.edu.af' },
];

const facultiesByUniversity = {
  'kdun.edu.af': [
    {
      name: 'Faculty of Computer Science',
      departments: [{ name: 'Software Engineering' }, { name: 'Information Systems' }, { name: 'Networking & Security' }],
    },
    {
      name: 'Faculty of Engineering',
      departments: [{ name: 'Civil Engineering' }, { name: 'Energy & Electrical Engineering' }],
    },
  ],
  'ku.edu.af': [
    {
      name: 'Faculty of Computer Science',
      departments: [{ name: 'Software Engineering' }, { name: 'Artificial Intelligence' }, { name: 'Database Systems' }],
    },
    {
      name: 'Faculty of Engineering',
      departments: [{ name: 'Mechanical Engineering' }, { name: 'Electrical Engineering' }],
    },
  ],
  'hu.edu.af': [
    {
      name: 'Faculty of Computer Science',
      departments: [{ name: 'Software Engineering' }, { name: 'Information Technology' }],
    },
  ],
};

const projectDefinitions = [
  {
    title: 'ProjectsHub: Academic Monograph & Software Management Portal',
    type: 'universal',
    status: 'approved',
    versionNumber: 2,
    isLocked: true,
    abstract:
      'A unified digital repository and workflow management system designed for Afghan universities to track student monographs, code deliverables, supervisor reviews, and public showcase catalogs.',
    keywords: ['academic repository', 'workflow automation', 'monograph management', 'multi-tenancy'],
    githubRepoUrl: 'https://github.com/projectshub/projectshub-platform',
    liveDemoUrl: 'https://demo.projectshub.com',
    reviewFeedback: 'Outstanding implementation and clear monograph structure. Approved for institutional deployment.',
    reviewAction: 'approve',
  },
  {
    title: 'Smart Attendance & Exam Proctoring via Facial Recognition',
    type: 'science',
    status: 'approved',
    versionNumber: 1,
    isLocked: true,
    abstract:
      'An automated computer vision platform utilizing edge cameras to monitor examination halls, detect unauthorized devices, and register student attendance without physical signatures.',
    keywords: ['computer vision', 'facial recognition', 'proctoring', 'edge computing'],
    githubRepoUrl: 'https://github.com/projectshub/smart-proctor',
    liveDemoUrl: 'https://proctor.projectshub.com',
    reviewFeedback: 'Excellent accuracy benchmarks on local test datasets. Approved.',
    reviewAction: 'approve',
  },
  {
    title: 'Solar Microgrid Monitoring & Energy Optimization Platform',
    type: 'science',
    status: 'revision_requested',
    versionNumber: 1,
    isLocked: false,
    abstract:
      'IoT sensors deployed on university campus solar installations streaming real-time wattage, battery degradation metrics, and temperature alerts to a central dashboard.',
    keywords: ['solar energy', 'iot', 'energy optimization', 'embedded systems'],
    githubRepoUrl: 'https://github.com/projectshub/solar-iot-monitor',
    liveDemoUrl: null,
    reviewFeedback: 'Please provide complete hardware schematics in Chapter 3 and deploy a live dashboard simulation.',
    reviewAction: 'request_revision',
  },
  {
    title: 'Decentralized Electronic Health Records on Private Blockchain',
    type: 'universal',
    status: 'submitted',
    versionNumber: 1,
    isLocked: false,
    abstract:
      'A privacy-preserving patient health information management system leveraging Hyperledger Fabric to prevent tamper incidents across regional clinics.',
    keywords: ['blockchain', 'health informatics', 'cryptography', 'hyperledger'],
    githubRepoUrl: 'https://github.com/projectshub/decentralized-ehr',
    liveDemoUrl: 'https://ehr-preview.projectshub.com',
    reviewFeedback: null,
    reviewAction: null,
  },
  {
    title: 'Automated Soil Moisture & Drone-Based Irrigation System',
    type: 'science',
    status: 'draft',
    versionNumber: 1,
    isLocked: false,
    abstract:
      'A precision agriculture solution combining low-cost LoRaWAN soil moisture probes and drone multispectral imaging to optimize irrigation schedules.',
    keywords: ['precision agriculture', 'lorawan', 'drone imagery', 'irrigation'],
    githubRepoUrl: 'https://github.com/projectshub/smart-irrigation',
    liveDemoUrl: null,
    reviewFeedback: null,
    reviewAction: null,
  },
  {
    title: 'University Library Digital Repository & AI Recommendation Engine',
    type: 'universal',
    status: 'approved',
    versionNumber: 2,
    isLocked: true,
    abstract:
      'Semantic vector search engine indexing over 20,000 academic research papers, providing contextual recommendations for undergraduate senior thesis literature reviews.',
    keywords: ['vector search', 'information retrieval', 'recommendation system', 'nlp'],
    githubRepoUrl: 'https://github.com/projectshub/library-recommender',
    liveDemoUrl: 'https://library.projectshub.com',
    reviewFeedback: 'Thorough literature review and robust search latency measurements.',
    reviewAction: 'approve',
  },
  {
    title: 'Real-Time Traffic Congestion Detection using Edge Surveillance',
    type: 'science',
    status: 'rejected',
    versionNumber: 1,
    isLocked: false,
    abstract:
      'Analyzing city intersection CCTV camera feeds to estimate vehicle density and dynamically adjust traffic signal intervals.',
    keywords: ['smart city', 'yolo', 'traffic management', 'computer vision'],
    githubRepoUrl: 'https://github.com/projectshub/traffic-vision',
    liveDemoUrl: null,
    reviewFeedback: 'The project fails to address night-time low-light camera conditions and dataset bias. Rejected.',
    reviewAction: 'reject',
  },
  {
    title: 'Mobile-First Telemedicine Consultation App for Remote Regions',
    type: 'universal',
    status: 'approved',
    versionNumber: 1,
    isLocked: true,
    abstract:
      'An offline-first Flutter application allowing rural community health workers to queue patient symptoms, photos, and voice notes for specialist doctors in urban hospitals.',
    keywords: ['telemedicine', 'flutter', 'offline-first', 'mobile health'],
    githubRepoUrl: 'https://github.com/projectshub/telemedicine-mobile',
    liveDemoUrl: 'https://telemed.projectshub.com',
    reviewFeedback: 'Outstanding usability and offline sync mechanism. Approved.',
    reviewAction: 'approve',
  },
  {
    title: 'Dari & Pashto OCR and Historical Document Digitization Pipeline',
    type: 'science',
    status: 'submitted',
    versionNumber: 1,
    isLocked: false,
    abstract:
      'Deep learning bidirectional LSTM-CTC model fine-tuned on Nastaliq and Naskh typography for automated transcription of historical manuscripts.',
    keywords: ['ocr', 'nlp', 'nastaliq', 'deep learning'],
    githubRepoUrl: 'https://github.com/projectshub/afghan-ocr-pipeline',
    liveDemoUrl: 'https://ocr.projectshub.com',
    reviewFeedback: null,
    reviewAction: null,
  },
  {
    title: 'Civil Infrastructure Crack Detection via UAV Aerial Imagery',
    type: 'science',
    status: 'revision_requested',
    versionNumber: 1,
    isLocked: false,
    abstract:
      'Automated semantic segmentation of concrete bridges and highway pavements to detect micro-cracks before structural failures occur.',
    keywords: ['structural health', 'uav', 'crack detection', 'segmentation'],
    githubRepoUrl: 'https://github.com/projectshub/uav-crack-seg',
    liveDemoUrl: null,
    reviewFeedback: 'Include concrete depth measurement analysis in Chapter 4.',
    reviewAction: 'request_revision',
  },
  {
    title: 'Smart Campus IoT Energy Consumption Management System',
    type: 'universal',
    status: 'approved',
    versionNumber: 1,
    isLocked: true,
    abstract:
      'Zigbee and ESP32 energy metering nodes installed across university buildings sending sub-minute metrics to optimize HVAC and lighting schedules.',
    keywords: ['smart campus', 'iot', 'zigbee', 'energy management'],
    githubRepoUrl: 'https://github.com/projectshub/campus-energy-iot',
    liveDemoUrl: 'https://energy.projectshub.com',
    reviewFeedback: 'Demonstrated measurable 18% energy savings across test classrooms. Approved.',
    reviewAction: 'approve',
  },
  {
    title: 'Automated Plagiarism Detection Engine for Research Theses',
    type: 'universal',
    status: 'draft',
    versionNumber: 1,
    isLocked: false,
    abstract:
      'A distributed n-gram and cross-language embedding comparison engine detecting uncredited citations across English, Dari, and Pashto university theses.',
    keywords: ['plagiarism detection', 'text similarity', 'cross-lingual', 'nlp'],
    githubRepoUrl: 'https://github.com/projectshub/thesis-plagiarism-engine',
    liveDemoUrl: null,
    reviewFeedback: null,
    reviewAction: null,
  },
];

const seedDatabase = async () => {
  try {
    logger.info('Connecting to MongoDB...');
    await mongoose.connect(config.mongoose.url, config.mongoose.options);
    logger.info('Connected to MongoDB successfully.');

    if (isClean) {
      logger.info('Cleaning existing collections...');
      await Promise.all([
        University.deleteMany({}),
        Faculty.deleteMany({}),
        TechnologyTag.deleteMany({}),
        User.deleteMany({}),
        Project.deleteMany({}),
        Notification.deleteMany({}),
        Token.deleteMany({}),
      ]);
      logger.info('Existing collections cleaned.');
    } else {
      const existingCount = await University.countDocuments();
      if (existingCount > 0) {
        logger.warn('Database already contains seeded records. To re-seed fresh data, run: npm run seed:clean');
        await mongoose.disconnect();
        process.exit(0);
      }
    }

    // ==========================================
    // 1. Seed Universities
    // ==========================================
    logger.info('Seeding Universities...');
    const insertedUniversities = await University.insertMany(sampleUniversities);
    const universityMap = {};
    insertedUniversities.forEach((u) => {
      universityMap[u.domain] = u;
    });

    // ==========================================
    // 2. Seed Faculties & Embedded Departments
    // ==========================================
    logger.info('Seeding Faculties & Departments...');
    const facultyDocs = [];
    Object.entries(facultiesByUniversity).forEach(([domain, faculties]) => {
      const university = universityMap[domain];
      faculties.forEach((f) => {
        facultyDocs.push({
          universityId: university._id,
          name: f.name,
          departments: f.departments.map((d) => ({
            _id: mongoose.Types.ObjectId(),
            name: d.name,
          })),
        });
      });
    });

    const insertedFaculties = await Faculty.insertMany(facultyDocs);

    // ==========================================
    // 3. Seed Technology Tags
    // ==========================================
    logger.info('Seeding Technology Tags...');
    const insertedTags = await TechnologyTag.insertMany(technologyTagsData);
    const tagIds = insertedTags.map((t) => t._id);

    // ==========================================
    // 4. Seed Users (Super Admin, Deans, Teachers, Students)
    // ==========================================
    logger.info('Seeding Users...');
    const defaultPassword = 'Password123!';
    const defaultPasswordHash = await bcrypt.hash(defaultPassword, 8);

    const userDocs = [];

    // 4a. Super Admin
    userDocs.push({
      fullName: 'Super Administrator',
      email: 'admin@projectshub.com',
      passwordHash: defaultPasswordHash,
      role: 'super_admin',
      mustChangePassword: false,
    });

    // 4b. Faculty Deans
    insertedFaculties.forEach((faculty) => {
      const university = insertedUniversities.find((u) => u._id.equals(faculty.universityId));
      const facultyPrefix = faculty.name.includes('Computer') ? 'cs' : 'eng';
      const uniPrefix = university.domain.split('.')[0];
      userDocs.push({
        universityId: university._id,
        facultyId: faculty._id,
        fullName: `Dr. ${faker.name.firstName()} ${faker.name.lastName()} (Dean)`,
        email: `dean.${facultyPrefix}.${uniPrefix}@${university.domain}`,
        passwordHash: defaultPasswordHash,
        role: 'faculty_dean',
        mustChangePassword: false,
      });
    });

    // 4c. Teachers and Students per Department
    const departmentContexts = [];
    insertedFaculties.forEach((faculty) => {
      const university = insertedUniversities.find((u) => u._id.equals(faculty.universityId));
      faculty.departments.forEach((dept) => {
        departmentContexts.push({
          university,
          faculty,
          department: dept,
        });
      });
    });

    let studentCounter = 100;
    const teachersByDept = {};
    const studentsByDept = {};

    departmentContexts.forEach((ctx) => {
      const deptKey = ctx.department._id.toString();
      teachersByDept[deptKey] = [];
      studentsByDept[deptKey] = [];

      // Create 2 Teachers per department
      for (let t = 1; t <= 2; t += 1) {
        const teacherDoc = {
          _id: mongoose.Types.ObjectId(),
          universityId: ctx.university._id,
          facultyId: ctx.faculty._id,
          departmentId: ctx.department._id,
          fullName: `Prof. ${faker.name.firstName()} ${faker.name.lastName()}`,
          email: `${faker.internet.userName().toLowerCase()}_t${t}@${ctx.university.domain}`,
          passwordHash: defaultPasswordHash,
          role: 'teacher',
          mustChangePassword: false,
        };
        userDocs.push(teacherDoc);
        teachersByDept[deptKey].push(teacherDoc);
      }

      // Create 4-6 Students per department
      const numStudents = 5;
      for (let s = 1; s <= numStudents; s += 1) {
        studentCounter += 1;
        const deptCode = ctx.department.name
          .split(' ')
          .map((w) => w[0])
          .join('')
          .toUpperCase();
        const studentId = `2022-${deptCode}-${studentCounter}`;

        const studentDoc = {
          _id: mongoose.Types.ObjectId(),
          universityId: ctx.university._id,
          facultyId: ctx.faculty._id,
          departmentId: ctx.department._id,
          studentId,
          fullName: `${faker.name.firstName()} ${faker.name.lastName()}`,
          email: `student_${studentCounter}@${ctx.university.domain}`,
          passwordHash: defaultPasswordHash,
          role: 'student',
          mustChangePassword: true,
        };
        userDocs.push(studentDoc);
        studentsByDept[deptKey].push(studentDoc);
      }
    });

    const insertedUsers = await User.insertMany(userDocs);

    // ==========================================
    // 5. Seed Projects
    // ==========================================
    logger.info('Seeding Projects...');
    const projectDocs = [];
    const notificationDocs = [];

    projectDefinitions.forEach((def, index) => {
      const ctx = departmentContexts[index % departmentContexts.length];
      const deptKey = ctx.department._id.toString();
      const deptStudents = studentsByDept[deptKey] || [];
      const deptTeachers = teachersByDept[deptKey] || [];

      const leaderStudent = deptStudents[0] || insertedUsers.find((u) => u.role === 'student');
      const memberStudents = deptStudents.slice(1, 3);
      const assignedTeacher = deptTeachers[0] || insertedUsers.find((u) => u.role === 'teacher');

      // Random 2 to 4 tech tags
      const randomTagCount = 2 + (index % 3);
      const selectedTagIds = [];
      for (let i = 0; i < randomTagCount; i += 1) {
        const tag = tagIds[(index * 3 + i) % tagIds.length];
        if (!selectedTagIds.includes(tag)) {
          selectedTagIds.push(tag);
        }
      }

      const reviews = [];
      if (def.reviewAction) {
        reviews.push({
          reviewerId: assignedTeacher._id,
          action: def.reviewAction,
          feedbackText: def.reviewFeedback,
          versionAtReview: def.versionNumber,
          createdAt: new Date(Date.now() - 86400000 * (index + 1)),
        });
      }

      const projectId = mongoose.Types.ObjectId();

      projectDocs.push({
        _id: projectId,
        universityId: ctx.university._id,
        facultyId: ctx.faculty._id,
        departmentId: ctx.department._id,
        graduationYear: 2024 - (index % 3),
        type: def.type,
        title: def.title,
        status: def.status,
        versionNumber: def.versionNumber,
        isLocked: def.isLocked,
        leader: {
          userId: leaderStudent._id,
          studentId: leaderStudent.studentId,
          fullName: leaderStudent.fullName,
        },
        members: memberStudents.map((m) => ({
          userId: m._id,
          studentId: m.studentId,
          fullName: m.fullName,
        })),
        monograph: {
          pdfFileUrl: `https://storage.projectshub.com/monographs/${projectId}.pdf`,
          abstract: def.abstract,
          keywords: def.keywords,
          defenseDate: new Date(Date.now() + 86400000 * (30 - index * 2)),
          citationCount: def.status === 'approved' ? 5 + index * 3 : 0,
        },
        software: {
          githubRepoUrl: def.githubRepoUrl,
          liveDemoUrl: def.liveDemoUrl,
          screenshots: [
            `https://storage.projectshub.com/screenshots/${projectId}_1.png`,
            `https://storage.projectshub.com/screenshots/${projectId}_2.png`,
          ],
          techTagIds: selectedTagIds,
        },
        assignedTeacherId: assignedTeacher._id,
        reviews,
      });

      // ==========================================
      // 6. Seed Notifications based on project reviews
      // ==========================================
      if (def.status === 'approved') {
        notificationDocs.push({
          userId: leaderStudent._id,
          projectId,
          type: 'ACCEPTED',
          title: 'Project Submission Approved',
          message: `Congratulations! Your project "${def.title}" has been reviewed and officially approved.`,
          isRead: index % 2 === 0,
          createdAt: new Date(Date.now() - 3600000 * 4),
        });
      } else if (def.status === 'rejected') {
        notificationDocs.push({
          userId: leaderStudent._id,
          projectId,
          type: 'REJECTED',
          title: 'Project Submission Update',
          message: `Your project submission "${def.title}" was not approved. Reviewer feedback: "${def.reviewFeedback}"`,
          isRead: false,
          createdAt: new Date(Date.now() - 3600000 * 2),
        });
      } else if (def.status === 'revision_requested') {
        notificationDocs.push({
          userId: leaderStudent._id,
          projectId,
          type: 'REJECTED',
          title: 'Revisions Requested for Project',
          message: `Revisions were requested for "${def.title}". Reviewer feedback: "${def.reviewFeedback}"`,
          isRead: false,
          createdAt: new Date(Date.now() - 3600000 * 6),
        });
      }
    });

    const insertedProjects = await Project.insertMany(projectDocs);
    const insertedNotifications = await Notification.insertMany(notificationDocs);

    // ==========================================
    // Seed Summary Report
    // ==========================================
    logger.info('==================================================');
    logger.info('🎉 ProjectsHub Database Seeding Completed!');
    logger.info('==================================================');
    logger.info(`Universities:     ${insertedUniversities.length}`);
    logger.info(`Faculties:        ${insertedFaculties.length}`);
    logger.info(`Departments:      ${departmentContexts.length}`);
    logger.info(`Technology Tags:  ${insertedTags.length}`);
    logger.info(`Users:            ${insertedUsers.length}`);
    logger.info(`  - Super Admins: 1`);
    logger.info(`  - Faculty Deans: ${insertedFaculties.length}`);
    logger.info(`  - Teachers:     ${Object.values(teachersByDept).flat().length}`);
    logger.info(`  - Students:     ${Object.values(studentsByDept).flat().length}`);
    logger.info(`Projects:         ${insertedProjects.length}`);
    logger.info(`Notifications:    ${insertedNotifications.length}`);
    logger.info('--------------------------------------------------');
    logger.info('Default credentials for all seeded user accounts:');
    logger.info(`Password:         ${defaultPassword}`);
    logger.info('Sample Logins:');
    logger.info(`  Super Admin:    admin@projectshub.com`);
    logger.info(`  Faculty Dean:   ${userDocs.find((u) => u.role === 'faculty_dean').email}`);
    logger.info(`  Teacher:        ${userDocs.find((u) => u.role === 'teacher').email}`);
    logger.info(`  Student:        ${userDocs.find((u) => u.role === 'student').email}`);
    logger.info('==================================================');

    await mongoose.disconnect();
    logger.info('Database connection closed gracefully.');
    process.exit(0);
  } catch (error) {
    logger.error('Error seeding database:', error);
    try {
      await mongoose.disconnect();
    } catch (_) {}
    process.exit(1);
  }
};

seedDatabase();
