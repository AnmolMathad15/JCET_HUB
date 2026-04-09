import { createServer } from "http";
import app from "./app";
import { initSocket } from "./socket";
import { logger } from "./lib/logger";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function seedDemoData() {
  try {
    await db.execute(sql`
      INSERT INTO users (id, usn, name, role, branch, semester, email, phone, password_hash, admission_type)
      VALUES
        ('student-001', '2JH23CS001', 'Aryan Joshi',     'student', 'CSE', '5', 'aryan.joshi@jcet.edu',   '9876543210', 'da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3', 'KCET'),
        ('student-002', '2JH23CS002', 'Priya Patel',     'student', 'CSE', '5', 'priya.patel@jcet.edu',   '9876543211', 'da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3', 'Management'),
        ('student-003', '2JH23CS003', 'Rohan Mehta',     'student', 'CSE', '5', 'rohan.mehta@jcet.edu',   '9876543212', 'da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3', 'COMEDK'),
        ('student-004', '2JH23CS004', 'Sneha Reddy',     'student', 'CSE', '5', 'sneha.reddy@jcet.edu',   '9876543213', 'da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3', 'KCET'),
        ('student-005', '2JH23CS005', 'Kiran Kumar',     'student', 'CSE', '5', 'kiran.kumar@jcet.edu',   '9876543214', 'da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3', 'KCET'),
        ('faculty-001', 'FAC001',     'Dr. Priya Sharma','faculty', 'CSE',  NULL,'priya.sharma@jcet.edu', '9876500001', '9fccc110c38c92f49227efb2952ad9b7519e98d4e61152d89fcc124144ed5b57', 'KCET'),
        ('admin-001',   'ADMIN1',     'Admin User',      'admin',    NULL,  NULL,'admin@jcet.edu',         '9000000001', 'f4530f385daae618a928df113893facad67ce6441ad35f441c113ed030e19414', 'KCET')
      ON CONFLICT (id) DO NOTHING
    `);

    await db.execute(sql`
      INSERT INTO departments (id, name, code, hod_name)
      VALUES
        ('dept-cse',  'Computer Science & Engineering',        'CSE',   'Dr. Ravi Kumar'),
        ('dept-ece',  'Electronics & Communication Engineering','ECE',   'Dr. Meena Iyer'),
        ('dept-mech', 'Mechanical Engineering',                'MECH',  'Dr. Suresh Patil'),
        ('dept-civil','Civil Engineering',                     'CIVIL', 'Dr. Anand Kulkarni')
      ON CONFLICT (id) DO NOTHING
    `);

    await db.execute(sql`
      INSERT INTO batches (id, name, department_id, semester, year)
      VALUES
        ('batch-cse-a1', 'A1', 'dept-cse',  '5', '2021'),
        ('batch-cse-a2', 'A2', 'dept-cse',  '5', '2021'),
        ('batch-ece-b1', 'B1', 'dept-ece',  '5', '2021'),
        ('batch-mech-c1','C1', 'dept-mech', '5', '2021')
      ON CONFLICT (id) DO NOTHING
    `);

    await db.execute(sql`
      INSERT INTO subjects (id, name, code, department_id, semester, credits)
      VALUES
        ('sub-ds',   'Data Structures',              'CS501', 'dept-cse', '5', 4),
        ('sub-os',   'Operating Systems',            'CS502', 'dept-cse', '5', 4),
        ('sub-cn',   'Computer Networks',            'CS503', 'dept-cse', '5', 3),
        ('sub-dbms', 'Database Management Systems',  'CS504', 'dept-cse', '5', 4),
        ('sub-se',   'Software Engineering',         'CS505', 'dept-cse', '5', 3)
      ON CONFLICT (id) DO NOTHING
    `);

    await db.execute(sql`
      UPDATE users SET department_id = 'dept-cse', batch_id = 'batch-cse-a1'
      WHERE id IN ('student-001','student-002','student-003')
        AND (department_id IS NULL OR batch_id IS NULL)
    `);
    await db.execute(sql`
      UPDATE users SET department_id = 'dept-cse', batch_id = 'batch-cse-a2'
      WHERE id IN ('student-004','student-005')
        AND (department_id IS NULL OR batch_id IS NULL)
    `);
    await db.execute(sql`
      UPDATE users SET department_id = 'dept-cse'
      WHERE id = 'faculty-001' AND department_id IS NULL
    `);

    // Leaderboard students — multi-branch
    await db.execute(sql`
      INSERT INTO users (id, usn, name, role, branch, semester, email, phone, password_hash, department_id, batch_id, admission_type)
      VALUES
        ('student-006','2JH23EC001','Divya Nair',     'student','ECE', '5','divya.nair@jcet.edu',   '9876543215','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','dept-ece', 'batch-ece-b1','KCET'),
        ('student-007','2JH23EC002','Aarav Singh',    'student','ECE', '5','aarav.singh@jcet.edu',  '9876543216','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','dept-ece', 'batch-ece-b1','COMEDK'),
        ('student-008','2JH23ME001','Rishi Desai',    'student','MECH','5','rishi.desai@jcet.edu',  '9876543217','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','dept-mech','batch-mech-c1','KCET'),
        ('student-009','2JH23ME002','Pooja Kulkarni', 'student','MECH','5','pooja.kulk@jcet.edu',   '9876543218','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','dept-mech','batch-mech-c1','Management'),
        ('student-010','2JH22CS001','Rahul Verma',    'student','CSE', '7','rahul.verma@jcet.edu',  '9876543219','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','dept-cse', 'batch-cse-a1','KCET'),
        ('student-011','2JH22CS002','Neha Shetty',    'student','CSE', '7','neha.shetty@jcet.edu',  '9876543220','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','dept-cse', 'batch-cse-a1','COMEDK'),
        ('student-012','2JH22EC001','Tarun Gupta',    'student','ECE', '7','tarun.gupta@jcet.edu',  '9876543221','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','dept-ece', 'batch-ece-b1','KCET'),
        ('student-013','2JH22ME001','Shruti Bhat',    'student','MECH','7','shruti.bhat@jcet.edu',   '9876543222','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','dept-mech','batch-mech-c1','KCET'),
        ('student-014','2JH22CI001','Abhishek Rao',   'student','CIVIL','7','abhi.rao@jcet.edu',    '9876543223','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','dept-civil','batch-mech-c1','Management'),
        ('student-015','2JH21CS001','Meghna Iyer',    'student','CSE', '7','meghna.iyer@jcet.edu',  '9876543224','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','dept-cse', 'batch-cse-a2','KCET')
      ON CONFLICT (id) DO NOTHING
    `);

    // Badge definitions
    await db.execute(sql`
      INSERT INTO badge_definitions (id, name, description, icon, category, min_events, color)
      VALUES
        ('badge-first-step',  'First Step',      'Attended your first campus event',            '🎯','participation', 1,'blue'),
        ('badge-team-player', 'Team Player',     'Participated in a team event',                '🤝','participation', 2,'green'),
        ('badge-innovator',   'Innovator',       'Contributed an idea or project at a hackathon','💡','achievement',   3,'amber'),
        ('badge-quiz-ace',    'Quiz Ace',        'Won or placed in a quiz competition',         '🧠','achievement',   4,'violet'),
        ('badge-leader',      'Leader',          'Led a team or event at JCET',                 '👑','leadership',    5,'gold'),
        ('badge-speaker',     'Speaker',         'Delivered a talk or presentation',            '🎤','achievement',   5,'red'),
        ('badge-volunteer',   'Volunteer',       'Volunteered for a college event',             '🙋','service',       2,'teal'),
        ('badge-sport-star',  'Sport Star',      'Won in a sports competition',                 '🏅','sports',        1,'orange'),
        ('badge-cultural',    'Cultural Star',   'Performed in a cultural event',               '🎭','cultural',      1,'purple'),
        ('badge-elite',       'Elite Achiever',  'Accumulated 1000+ XP points',                '💎','milestone',    10,'navy')
      ON CONFLICT (id) DO NOTHING
    `);

    // Campus XP points — varied levels across all 15 students
    await db.execute(sql`
      INSERT INTO campus_points (id, student_id, points, reason, category, awarded_at)
      VALUES
        -- Rahul Verma — Elite (1420 XP)
        ('cp-rv-1','student-010',350,'1st Place — HackJCET 2026',         'achievement', '2026-02-10'),
        ('cp-rv-2','student-010',200,'Speaker — TechTalks Vol.3',         'achievement', '2026-01-22'),
        ('cp-rv-3','student-010',150,'Team Lead — Code Sprint',           'leadership',  '2026-01-08'),
        ('cp-rv-4','student-010',120,'Quiz Winner — CS Olympiad',         'achievement', '2025-12-15'),
        ('cp-rv-5','student-010',100,'Volunteer — Tech Fest 2025',        'service',     '2025-11-20'),
        ('cp-rv-6','student-010', 80,'Workshop — Cloud Computing',        'participation','2025-11-05'),
        ('cp-rv-7','student-010', 70,'Cultural Night — Dance Performance','cultural',    '2025-10-18'),
        ('cp-rv-8','student-010', 80,'Sports — Badminton Winner',         'sports',      '2025-09-12'),
        ('cp-rv-9','student-010', 80,'Annual Quiz — Finalist',            'achievement', '2025-08-30'),
        ('cp-rv-10','student-010',190,'Inter-College Hackathon — 2nd Place','achievement','2025-08-05'),

        -- Meghna Iyer — Pro (890 XP)
        ('cp-mi-1','student-015',250,'1st Place — DSA Challenge',         'achievement', '2026-03-01'),
        ('cp-mi-2','student-015',150,'Speaker — Women in Tech Panel',     'achievement', '2026-02-14'),
        ('cp-mi-3','student-015',100,'Volunteer — Open House 2026',       'service',     '2026-01-28'),
        ('cp-mi-4','student-015',120,'Cultural — Singing Competition',    'cultural',    '2025-12-20'),
        ('cp-mi-5','student-015', 80,'Workshop — UI/UX Design',           'participation','2025-11-15'),
        ('cp-mi-6','student-015', 80,'Quiz — General Knowledge Finalist', 'achievement', '2025-10-10'),
        ('cp-mi-7','student-015', 60,'Sports — Kho-Kho Participant',      'sports',      '2025-09-20'),
        ('cp-mi-8','student-015', 50,'Participation — Annual Hackathon',  'participation','2025-08-22'),

        -- Aryan Joshi — Rising (660 XP)
        ('cp-aj-1','student-001',200,'2nd Place — HackJCET 2026',         'achievement', '2026-02-10'),
        ('cp-aj-2','student-001',150,'Workshop — Machine Learning',       'participation','2026-01-15'),
        ('cp-aj-3','student-001',100,'Quiz — CS Olympiad Runner-Up',      'achievement', '2025-12-15'),
        ('cp-aj-4','student-001', 80,'Volunteer — Tech Fest 2025',        'service',     '2025-11-20'),
        ('cp-aj-5','student-001', 80,'Sports — Cricket Team',             'sports',      '2025-10-05'),
        ('cp-aj-6','student-001', 50,'Cultural — Drama Club',             'cultural',    '2025-09-18'),

        -- Neha Shetty — Rising (580 XP)
        ('cp-ns-1','student-011',180,'3rd Place — Code Sprint',           'achievement', '2026-01-08'),
        ('cp-ns-2','student-011',120,'Speaker — TechTalks Vol.2',         'achievement', '2025-12-22'),
        ('cp-ns-3','student-011',100,'Cultural — Classical Dance',        'cultural',    '2025-12-10'),
        ('cp-ns-4','student-011', 80,'Workshop — Cybersecurity',          'participation','2025-11-08'),
        ('cp-ns-5','student-011', 60,'Volunteer — Annual Day',            'service',     '2025-10-25'),
        ('cp-ns-6','student-011', 40,'Sports — Table Tennis',             'sports',      '2025-09-30'),

        -- Divya Nair — Active (370 XP)
        ('cp-dn-1','student-006',150,'1st Place — ECE Project Expo',      'achievement', '2026-03-10'),
        ('cp-dn-2','student-006',100,'Workshop — IoT & Embedded Systems', 'participation','2026-02-05'),
        ('cp-dn-3','student-006', 80,'Sports — Throwball Captain',        'sports',      '2025-12-18'),
        ('cp-dn-4','student-006', 40,'Volunteer — E-Waste Drive',         'service',     '2025-11-30'),

        -- Tarun Gupta — Active (310 XP)
        ('cp-tg-1','student-012',120,'2nd Place — ECE Project Expo',      'achievement', '2026-03-10'),
        ('cp-tg-2','student-012',100,'Workshop — Signal Processing',      'participation','2026-01-18'),
        ('cp-tg-3','student-012', 60,'Cultural — Band Performance',       'cultural',    '2025-12-05'),
        ('cp-tg-4','student-012', 30,'Participation — Sports Day',        'sports',      '2025-10-15'),

        -- Priya Patel — Active (260 XP)
        ('cp-pp-1','student-002',120,'Workshop — Data Science Bootcamp',  'participation','2026-02-20'),
        ('cp-pp-2','student-002', 80,'Volunteer — Blood Donation Camp',   'service',     '2026-01-25'),
        ('cp-pp-3','student-002', 60,'Cultural — Rangoli Competition',    'cultural',    '2025-12-22'),

        -- Aarav Singh — Active (220 XP)
        ('cp-as-1','student-007',100,'Workshop — VLSI Design',            'participation','2026-02-12'),
        ('cp-as-2','student-007', 80,'Sports — Football Team',            'sports',      '2025-12-01'),
        ('cp-as-3','student-007', 40,'Volunteer — Campus Cleanliness',    'service',     '2025-11-10'),

        -- Rishi Desai — Active (185 XP)
        ('cp-rd-1','student-008',100,'1st Place — MECH CAD Design',       'achievement', '2026-03-05'),
        ('cp-rd-2','student-008', 85,'Workshop — 3D Printing',            'participation','2026-01-30'),

        -- Rohan Mehta — Beginner (130 XP)
        ('cp-rm-1','student-003', 80,'Workshop — Python Basics',          'participation','2026-02-08'),
        ('cp-rm-2','student-003', 50,'Cultural — Photography Club',       'cultural',    '2025-12-30'),

        -- Pooja Kulkarni — Beginner (120 XP)
        ('cp-pk-1','student-009', 70,'Workshop — AutoCAD Fundamentals',   'participation','2026-02-15'),
        ('cp-pk-2','student-009', 50,'Volunteer — Plantation Drive',      'service',     '2025-12-08'),

        -- Abhishek Rao — Beginner (100 XP)
        ('cp-ar-1','student-014',100,'Workshop — Structural Analysis',    'participation','2026-03-01'),

        -- Sneha Reddy — Beginner (70 XP)
        ('cp-sr-1','student-004', 70,'Volunteer — NSS Camp',              'service',     '2026-01-12'),

        -- Shruti Bhat — Beginner (60 XP)
        ('cp-sb-1','student-013', 60,'Cultural — Mime Performance',       'cultural',    '2025-12-15'),

        -- Kiran Kumar — Beginner (50 XP)
        ('cp-kk-1','student-005', 50,'Participation — Annual Sports Day', 'sports',      '2025-11-28')
      ON CONFLICT (id) DO NOTHING
    `);

    // Student badges
    await db.execute(sql`
      INSERT INTO student_badges (id, student_id, badge_id, awarded_at)
      VALUES
        ('sb-rv-1','student-010','badge-elite',       '2026-02-11'),
        ('sb-rv-2','student-010','badge-leader',      '2026-01-09'),
        ('sb-rv-3','student-010','badge-innovator',   '2026-02-10'),
        ('sb-rv-4','student-010','badge-speaker',     '2026-01-22'),
        ('sb-rv-5','student-010','badge-quiz-ace',    '2025-12-15'),
        ('sb-rv-6','student-010','badge-volunteer',   '2025-11-20'),
        ('sb-rv-7','student-010','badge-sport-star',  '2025-09-12'),
        ('sb-rv-8','student-010','badge-cultural',    '2025-10-18'),
        ('sb-rv-9','student-010','badge-first-step',  '2025-08-30'),

        ('sb-mi-1','student-015','badge-innovator',   '2026-03-01'),
        ('sb-mi-2','student-015','badge-speaker',     '2026-02-14'),
        ('sb-mi-3','student-015','badge-volunteer',   '2026-01-28'),
        ('sb-mi-4','student-015','badge-cultural',    '2025-12-20'),
        ('sb-mi-5','student-015','badge-quiz-ace',    '2025-10-10'),
        ('sb-mi-6','student-015','badge-first-step',  '2025-08-22'),

        ('sb-aj-1','student-001','badge-innovator',   '2026-02-10'),
        ('sb-aj-2','student-001','badge-quiz-ace',    '2025-12-15'),
        ('sb-aj-3','student-001','badge-volunteer',   '2025-11-20'),
        ('sb-aj-4','student-001','badge-sport-star',  '2025-10-05'),
        ('sb-aj-5','student-001','badge-first-step',  '2025-09-18'),

        ('sb-ns-1','student-011','badge-speaker',     '2025-12-22'),
        ('sb-ns-2','student-011','badge-cultural',    '2025-12-10'),
        ('sb-ns-3','student-011','badge-volunteer',   '2025-10-25'),
        ('sb-ns-4','student-011','badge-first-step',  '2025-09-30'),

        ('sb-dn-1','student-006','badge-innovator',   '2026-03-10'),
        ('sb-dn-2','student-006','badge-sport-star',  '2025-12-18'),
        ('sb-dn-3','student-006','badge-volunteer',   '2025-11-30'),

        ('sb-tg-1','student-012','badge-team-player', '2026-03-10'),
        ('sb-tg-2','student-012','badge-cultural',    '2025-12-05'),

        ('sb-pp-1','student-002','badge-volunteer',   '2026-01-25'),
        ('sb-pp-2','student-002','badge-first-step',  '2025-12-22'),

        ('sb-as-1','student-007','badge-sport-star',  '2025-12-01'),
        ('sb-as-2','student-007','badge-volunteer',   '2025-11-10'),

        ('sb-rd-1','student-008','badge-innovator',   '2026-03-05'),

        ('sb-rm-1','student-003','badge-first-step',  '2026-02-08'),
        ('sb-pk-1','student-009','badge-volunteer',   '2025-12-08'),
        ('sb-ar-1','student-014','badge-first-step',  '2026-03-01'),
        ('sb-sr-1','student-004','badge-volunteer',   '2026-01-12'),
        ('sb-sb-1','student-013','badge-cultural',    '2025-12-15'),
        ('sb-kk-1','student-005','badge-first-step',  '2025-11-28')
      ON CONFLICT (id) DO NOTHING
    `);

    // Events — 10 JCET campus events (always seeded so events-hub never falls back)
    // Uses DO UPDATE to keep payment fields current even if event already exists
    await db.execute(sql`
      INSERT INTO events (id, title, description, date, type, venue, capacity, organizer_name, xp_reward, status, registration_open, tags, domain, registration_fee, requires_payment, is_team_event, max_team_size)
      VALUES
        ('evt-001','HackJCET 2026 — 24-Hour Hackathon','Build, innovate and win at JCET''s annual 24-hour hackathon. Open to all students across all branches.','2026-04-10','hackathon','CS Block Auditorium',100,'CSE Department',200,'upcoming',true,'coding,hackathon,innovation','technical',100,true,true,4),
        ('evt-002','Utsav 2026 — JCET Cultural Fest','Celebrate creativity at JCET''s biggest cultural event — music, dance, drama and art.','2026-04-15','cultural','Open Amphitheater',500,'Student Council',100,'upcoming',true,'cultural,music,dance','cultural',0,false,false,null),
        ('evt-003','AWS Cloud Computing Workshop','Hands-on cloud workshop with AWS architecture, serverless and certification guidance.','2026-04-17','workshop','Computer Lab 3',60,'Training & Placement',150,'upcoming',true,'cloud,aws,workshop','technical',150,true,false,null),
        ('evt-004','JCET Sports Day 2026','Annual inter-department sports championship. Athletics, cricket, football and more.','2026-04-22','sports','Sports Ground',200,'Physical Education Dept',75,'upcoming',true,'sports,athletics','sports',0,false,false,null),
        ('evt-005','AI/ML Industry Expert Talk','Industry experts share insights on Machine Learning and AI career paths.','2026-04-19','academic','Seminar Hall A',150,'AIML Department',60,'upcoming',true,'ai,ml,industry','technical',0,false,false,null),
        ('evt-006','Code Battle — Competitive Programming','Solve algorithmic challenges in a timed competitive programming contest.','2026-04-25','hackathon','CS Block Lab',80,'IEEE Student Branch',120,'upcoming',true,'coding,competitive','technical',0,false,false,null),
        ('evt-007','Web Dev Bootcamp — React & Node.js','Intensive 2-day bootcamp on modern full-stack web development.','2026-05-02','workshop','IT Lab',40,'IEEE Student Branch',180,'upcoming',true,'web,react,node','technical',200,true,false,null),
        ('evt-008','Project Exhibition 2026 — JCET Innovate','Annual project expo showcasing student innovations across all departments.','2026-05-10','academic','Main Block Hall',300,'Dean Academics',100,'upcoming',true,'projects,exhibition','academic',0,false,true,3),
        ('evt-009','Open Mic Night — JCET Unplugged','Express yourself! Poetry, comedy, music and more. Open stage for all students.','2026-03-28','cultural','Amphitheater',200,'Student Council',50,'completed',false,'music,openmic,cultural','cultural',0,false,false,null),
        ('evt-010','Cybersecurity CTF Challenge','Capture The Flag — hands-on cybersecurity challenge for all skill levels.','2026-05-05','hackathon','CS Block Lab',60,'CSE Department',150,'upcoming',true,'security,ctf,hacking','technical',0,false,true,2)
      ON CONFLICT (id) DO UPDATE SET
        requires_payment = EXCLUDED.requires_payment,
        registration_fee = EXCLUDED.registration_fee
    `);

    // Event registrations — seed for demo student-001 (Aryan Joshi / 2JH23CS001)
    // Shows 3 registrations (2 attended) so dashboard stats are non-zero
    await db.execute(sql`
      INSERT INTO event_registrations (id, event_id, student_id, student_name, student_usn, attended, attended_at, qr_token, status, email, phone, branch, semester, year_of_study)
      VALUES
        ('ereg-001-002','evt-002','student-001','Aryan Joshi','2JH23CS001',false,null,'QR-ARYAN-EVT002','registered','aryan.joshi@jcet.edu','9876543210','CSE','5','3rd Year'),
        ('ereg-001-005','evt-005','student-001','Aryan Joshi','2JH23CS001',true,'2026-04-19 14:30:00','QR-ARYAN-EVT005','attended','aryan.joshi@jcet.edu','9876543210','CSE','5','3rd Year'),
        ('ereg-001-009','evt-009','student-001','Aryan Joshi','2JH23CS001',true,'2026-03-28 19:00:00','QR-ARYAN-EVT009','attended','aryan.joshi@jcet.edu','9876543210','CSE','5','3rd Year')
      ON CONFLICT (id) DO NOTHING
    `);

    // Timetable — CSE Sem 5 full weekly schedule
    await db.execute(sql`
      INSERT INTO timetable (id, branch, semester, day, period, start_time, end_time, subject, subject_code, faculty, room)
      VALUES
        ('tt-mon-1','CSE','5','Monday',   1,'09:00','10:00','Data Structures',             'CS501','Dr. Priya Sharma','CSE Lab 1'),
        ('tt-mon-2','CSE','5','Monday',   2,'10:00','11:00','Operating Systems',            'CS502','Dr. Priya Sharma','Room 201'),
        ('tt-mon-3','CSE','5','Monday',   3,'11:00','12:00','Computer Networks',            'CS503','Dr. Priya Sharma','Room 202'),
        ('tt-mon-4','CSE','5','Monday',   4,'14:00','15:00','Database Management Systems',  'CS504','Dr. Priya Sharma','Room 203'),
        ('tt-tue-1','CSE','5','Tuesday',  1,'09:00','10:00','Software Engineering',         'CS505','Dr. Priya Sharma','Room 201'),
        ('tt-tue-2','CSE','5','Tuesday',  2,'10:00','11:00','Data Structures',              'CS501','Dr. Priya Sharma','CSE Lab 1'),
        ('tt-tue-3','CSE','5','Tuesday',  3,'14:00','15:00','Operating Systems',            'CS502','Dr. Priya Sharma','Room 204'),
        ('tt-wed-1','CSE','5','Wednesday',1,'09:00','10:00','Computer Networks',            'CS503','Dr. Priya Sharma','Room 202'),
        ('tt-wed-2','CSE','5','Wednesday',2,'10:00','11:00','Database Management Systems',  'CS504','Dr. Priya Sharma','Room 203'),
        ('tt-wed-3','CSE','5','Wednesday',3,'11:00','12:00','Software Engineering',         'CS505','Dr. Priya Sharma','Room 201'),
        ('tt-thu-1','CSE','5','Thursday', 1,'09:00','10:00','Data Structures',              'CS501','Dr. Priya Sharma','CSE Lab 2'),
        ('tt-thu-2','CSE','5','Thursday', 2,'10:00','11:00','Computer Networks',            'CS503','Dr. Priya Sharma','Room 202'),
        ('tt-thu-3','CSE','5','Thursday', 3,'14:00','15:00','Database Management Systems',  'CS504','Dr. Priya Sharma','Room 203'),
        ('tt-fri-1','CSE','5','Friday',   1,'09:00','10:00','Operating Systems',            'CS502','Dr. Priya Sharma','Room 204'),
        ('tt-fri-2','CSE','5','Friday',   2,'10:00','11:00','Software Engineering',         'CS505','Dr. Priya Sharma','Room 201'),
        ('tt-fri-3','CSE','5','Friday',   3,'11:00','12:00','Data Structures',              'CS501','Dr. Priya Sharma','CSE Lab 1'),
        ('tt-sat-1','CSE','5','Saturday', 1,'09:00','10:00','Computer Networks',            'CS503','Dr. Priya Sharma','Room 202'),
        ('tt-sat-2','CSE','5','Saturday', 2,'10:00','11:00','Database Management Systems',  'CS504','Dr. Priya Sharma','Room 203'),
        ('tt-ece-1','ECE','5','Monday',   1,'09:00','10:00','Signals & Systems',            'EC501','Dr. Meena Iyer','ECE Lab'),
        ('tt-ece-2','ECE','5','Tuesday',  1,'09:00','10:00','Digital Electronics',          'EC502','Dr. Meena Iyer','Room 301')
      ON CONFLICT (id) DO NOTHING
    `);

    // Attendance — student-001 across 5 subjects (status: safe/warning/danger based on %)
    await db.execute(sql`
      INSERT INTO attendance (id, user_id, subject, subject_code, attended, total, percentage, status)
      VALUES
        ('att-001-ds',  'student-001','Data Structures',            'CS501',38,50,76.0,'safe'),
        ('att-001-os',  'student-001','Operating Systems',           'CS502',41,52,78.8,'safe'),
        ('att-001-cn',  'student-001','Computer Networks',           'CS503',33,46,71.7,'warning'),
        ('att-001-dbms','student-001','Database Management Systems', 'CS504',44,55,80.0,'safe'),
        ('att-001-se',  'student-001','Software Engineering',        'CS505',30,42,71.4,'warning'),
        ('att-002-ds',  'student-002','Data Structures',             'CS501',45,50,90.0,'safe')
      ON CONFLICT (id) DO NOTHING
    `);

    // Internal Assessment marks — VTU 2022 scheme (IA1=25, IA2=25, IA3=25, max_marks=100)
    await db.execute(sql`
      INSERT INTO marks (id, user_id, subject, subject_code, ia1, ia2, ia3, final_marks, max_marks, grade)
      VALUES
        ('marks-001-ds',  'student-001','Data Structures',            'CS501',19,21,20,60.0,100,'B'),
        ('marks-001-os',  'student-001','Operating Systems',           'CS502',20,22,21,63.0,100,'B'),
        ('marks-001-cn',  'student-001','Computer Networks',           'CS503',17,19,18,54.0,100,'C'),
        ('marks-001-dbms','student-001','Database Management Systems', 'CS504',22,23,22,67.0,100,'B'),
        ('marks-001-se',  'student-001','Software Engineering',        'CS505',18,20,19,57.0,100,'C'),
        ('marks-002-ds',  'student-002','Data Structures',             'CS501',23,24,23,70.0,100,'A')
      ON CONFLICT (id) DO NOTHING
    `);

    // Assignments — 3 active assignments for batch-cse-a1 from Dr. Priya Sharma
    await db.execute(sql`
      INSERT INTO assignments (id, title, description, subject_id, subject_name, batch_id, batch_name, faculty_id, faculty_name, due_date, max_marks)
      VALUES
        ('asgn-001','Assignment 1 — Sorting Algorithms',         'Implement and compare 5 sorting algorithms (Bubble, Merge, Quick, Heap, Radix) with time and space complexity analysis. Submit a PDF report with code.','sub-ds',  'Data Structures',            'batch-cse-a1','A1','faculty-001','Dr. Priya Sharma','2026-04-15 23:59:00',10),
        ('asgn-002','Assignment 2 — Process Scheduling',         'Simulate FCFS, SJF and Round Robin scheduling algorithms. Draw Gantt charts and calculate average waiting and turnaround time for 5 processes.', 'sub-os',  'Operating Systems',           'batch-cse-a1','A1','faculty-001','Dr. Priya Sharma','2026-04-18 23:59:00',10),
        ('asgn-003','Assignment 3 — ER Diagram & Normalization', 'Design an ER diagram for a College Library Management System. Normalize to 3NF. Convert ER to relational schema and write 5 SQL queries.',        'sub-dbms','Database Management Systems', 'batch-cse-a1','A1','faculty-001','Dr. Priya Sharma','2026-04-20 23:59:00',10)
      ON CONFLICT (id) DO NOTHING
    `);

    // ── 6th Semester: AIML department + 6 new batches ────────────────────────
    await db.execute(sql`
      INSERT INTO departments (id, name, code) VALUES
        ('dept-aiml','Artificial Intelligence & Machine Learning','AIML')
      ON CONFLICT DO NOTHING
    `);
    await db.execute(sql`
      INSERT INTO batches (id, name, department_id, semester, year) VALUES
        ('batch-cse-6-a','CSE-6A','dept-cse','6','2023'),
        ('batch-cse-6-b','CSE-6B','dept-cse','6','2023'),
        ('batch-cse-6-c','CSE-6C','dept-cse','6','2023'),
        ('batch-ece-6-a','ECE-6A','dept-ece','6','2023'),
        ('batch-aiml-6-a','AIML-6A','dept-aiml','6','2023'),
        ('batch-me-6-a','ME-6A','dept-mech','6','2023')
      ON CONFLICT DO NOTHING
    `);

    // ── CSE 6th Sem — Batch A (2JH23CS001–070) ────────────────────────────────
    await db.execute(sql`
      INSERT INTO users (id,usn,name,role,branch,semester,email,password_hash,admission_type,batch_id,department_id) VALUES
        ('s-2JH23CS001','2JH23CS001','Abdul Muqeet F Kazi',       'student','CSE','6','2jh23cs001@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-a','dept-cse'),
        ('s-2JH23CS003','2JH23CS003','Abhishek Mallikarjun Attiman','student','CSE','6','2jh23cs003@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-a','dept-cse'),
        ('s-2JH23CS004','2JH23CS004','Abhishek S Gadaginamath',    'student','CSE','6','2jh23cs004@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-a','dept-cse'),
        ('s-2JH23CS005','2JH23CS005','Aditi B Kalkutgi',           'student','CSE','6','2jh23cs005@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-a','dept-cse'),
        ('s-2JH23CS007','2JH23CS007','Aditya D Agnihotri',         'student','CSE','6','2jh23cs007@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-a','dept-cse'),
        ('s-2JH23CS008','2JH23CS008','Aditya Goud Adharmayat',     'student','CSE','6','2jh23cs008@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-a','dept-cse'),
        ('s-2JH23CS009','2JH23CS009','Ahmed Ashraf Mantur',        'student','CSE','6','2jh23cs009@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-a','dept-cse'),
        ('s-2JH23CS011','2JH23CS011','Ajinkya Gorwade',            'student','CSE','6','2jh23cs011@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-a','dept-cse'),
        ('s-2JH23CS012','2JH23CS012','Akshata Chandrakant Basutkar','student','CSE','6','2jh23cs012@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-a','dept-cse'),
        ('s-2JH23CS013','2JH23CS013','Akshata Dada Mangond',       'student','CSE','6','2jh23cs013@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-a','dept-cse'),
        ('s-2JH23CS015','2JH23CS015','Akshata Sangappa Savalagi',  'student','CSE','6','2jh23cs015@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-a','dept-cse'),
        ('s-2JH23CS016','2JH23CS016','Almas Sultana M Savanur',    'student','CSE','6','2jh23cs016@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-a','dept-cse'),
        ('s-2JH23CS017','2JH23CS017','Amogh V Karveermath',        'student','CSE','6','2jh23cs017@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-a','dept-cse'),
        ('s-2JH23CS018','2JH23CS018','Amulya P Dandur',            'student','CSE','6','2jh23cs018@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-a','dept-cse'),
        ('s-2JH23CS019','2JH23CS019','Anam Babunavar',             'student','CSE','6','2jh23cs019@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-a','dept-cse'),
        ('s-2JH23CS020','2JH23CS020','Anita Pundaleeklamani',      'student','CSE','6','2jh23cs020@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-a','dept-cse'),
        ('s-2JH23CS021','2JH23CS021','Ankita S Kulkarni',          'student','CSE','6','2jh23cs021@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-a','dept-cse'),
        ('s-2JH23CS022','2JH23CS022','Ankita S Narayankar',        'student','CSE','6','2jh23cs022@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-a','dept-cse'),
        ('s-2JH23CS024','2JH23CS024','Annapurna Yogappa Hanji',    'student','CSE','6','2jh23cs024@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-a','dept-cse'),
        ('s-2JH23CS025','2JH23CS025','Anmol Mathad',               'student','CSE','6','2jh23cs025@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-a','dept-cse'),
        ('s-2JH23CS026','2JH23CS026','Ashiyana Banad',             'student','CSE','6','2jh23cs026@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-a','dept-cse'),
        ('s-2JH23CS027','2JH23CS027','Ashmita Vijapur',            'student','CSE','6','2jh23cs027@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-a','dept-cse'),
        ('s-2JH23CS028','2JH23CS028','Ashwini Gasti',              'student','CSE','6','2jh23cs028@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-a','dept-cse'),
        ('s-2JH23CS029','2JH23CS029','B Akshay',                   'student','CSE','6','2jh23cs029@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-a','dept-cse'),
        ('s-2JH23CS030','2JH23CS030','Basavaraj C Shirur',         'student','CSE','6','2jh23cs030@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-a','dept-cse'),
        ('s-2JH23CS031','2JH23CS031','Basavaraj M Soorangimath',   'student','CSE','6','2jh23cs031@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-a','dept-cse'),
        ('s-2JH23CS032','2JH23CS032','Bhagyashree Ashoka Tumbaramatti','student','CSE','6','2jh23cs032@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-a','dept-cse'),
        ('s-2JH23CS033','2JH23CS033','Bhakti Shashikant Lende',    'student','CSE','6','2jh23cs033@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-a','dept-cse'),
        ('s-2JH23CS034','2JH23CS034','Bhoomika C Patil',           'student','CSE','6','2jh23cs034@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-a','dept-cse'),
        ('s-2JH23CS035','2JH23CS035','Chitra Badiger',             'student','CSE','6','2jh23cs035@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-a','dept-cse'),
        ('s-2JH23CS036','2JH23CS036','D Jahnavi Sri',              'student','CSE','6','2jh23cs036@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-a','dept-cse'),
        ('s-2JH23CS037','2JH23CS037','Darshan G Anvekar',          'student','CSE','6','2jh23cs037@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-a','dept-cse'),
        ('s-2JH23CS038','2JH23CS038','Deepavi Rupakshappa Yamoji', 'student','CSE','6','2jh23cs038@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-a','dept-cse'),
        ('s-2JH23CS039','2JH23CS039','Deepak H Reddy',             'student','CSE','6','2jh23cs039@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-a','dept-cse'),
        ('s-2JH23CS040','2JH23CS040','Dhanyashri Dattatreya Parande','student','CSE','6','2jh23cs040@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-a','dept-cse'),
        ('s-2JH23CS041','2JH23CS041','Drakshayini Basavaraj Sadar','student','CSE','6','2jh23cs041@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-a','dept-cse'),
        ('s-2JH23CS042','2JH23CS042','Fouziya A Bangalori',        'student','CSE','6','2jh23cs042@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-a','dept-cse'),
        ('s-2JH23CS043','2JH23CS043','G Ruth',                     'student','CSE','6','2jh23cs043@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-a','dept-cse'),
        ('s-2JH23CS044','2JH23CS044','Gagan Shetty',               'student','CSE','6','2jh23cs044@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-a','dept-cse'),
        ('s-2JH23CS046','2JH23CS046','Gourav Sunil Popale',        'student','CSE','6','2jh23cs046@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-a','dept-cse'),
        ('s-2JH23CS047','2JH23CS047','Hari Arun Megharaj',         'student','CSE','6','2jh23cs047@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-a','dept-cse'),
        ('s-2JH23CS048','2JH23CS048','Harish Patil',               'student','CSE','6','2jh23cs048@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-a','dept-cse'),
        ('s-2JH23CS049','2JH23CS049','Harsha Bhojappa Ganamukhi',  'student','CSE','6','2jh23cs049@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-a','dept-cse'),
        ('s-2JH23CS050','2JH23CS050','Indupriya Velapulla',        'student','CSE','6','2jh23cs050@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-a','dept-cse'),
        ('s-2JH23CS052','2JH23CS052','Jyotibinu',                  'student','CSE','6','2jh23cs052@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-a','dept-cse'),
        ('s-2JH23CS053','2JH23CS053','Jyotini Nganagoud Birador',  'student','CSE','6','2jh23cs053@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-a','dept-cse'),
        ('s-2JH23CS054','2JH23CS054','K Raghavendra Rao',          'student','CSE','6','2jh23cs054@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-a','dept-cse'),
        ('s-2JH23CS055','2JH23CS055','Karan',                      'student','CSE','6','2jh23cs055@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-a','dept-cse'),
        ('s-2JH23CS056','2JH23CS056','Karuna Pratham Shetti',      'student','CSE','6','2jh23cs056@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-a','dept-cse'),
        ('s-2JH23CS057','2JH23CS057','Keerthi M',                  'student','CSE','6','2jh23cs057@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-a','dept-cse'),
        ('s-2JH23CS058','2JH23CS058','Keerthi Channappahatti',     'student','CSE','6','2jh23cs058@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-a','dept-cse'),
        ('s-2JH23CS059','2JH23CS059','Khalandar Moulasab Nadaf',   'student','CSE','6','2jh23cs059@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-a','dept-cse'),
        ('s-2JH23CS060','2JH23CS060','Lavanya Mirji',              'student','CSE','6','2jh23cs060@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-a','dept-cse'),
        ('s-2JH23CS061','2JH23CS061','Madhu G',                    'student','CSE','6','2jh23cs061@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-a','dept-cse'),
        ('s-2JH23CS062','2JH23CS062','Madhuhanumantappa Hunasim Arad','student','CSE','6','2jh23cs062@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-a','dept-cse'),
        ('s-2JH23CS063','2JH23CS063','Maheen S Badeghar',          'student','CSE','6','2jh23cs063@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-a','dept-cse'),
        ('s-2JH23CS064','2JH23CS064','Mahek Moulasab Magi',        'student','CSE','6','2jh23cs064@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-a','dept-cse'),
        ('s-2JH23CS065','2JH23CS065','Mahseen W Gokak',            'student','CSE','6','2jh23cs065@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-a','dept-cse'),
        ('s-2JH23CS066','2JH23CS066','Manasa Ramachandra Sakre',   'student','CSE','6','2jh23cs066@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-a','dept-cse'),
        ('s-2JH23CS067','2JH23CS067','Manjunath S Giraddi',        'student','CSE','6','2jh23cs067@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-a','dept-cse'),
        ('s-2JH23CS068','2JH23CS068','Matamlitika',                'student','CSE','6','2jh23cs068@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-a','dept-cse'),
        ('s-2JH23CS069','2JH23CS069','Mayur M Patil',              'student','CSE','6','2jh23cs069@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-a','dept-cse'),
        ('s-2JH23CS070','2JH23CS070','Mohammad Saad Hussain Lakshmeshwar','student','CSE','6','2jh23cs070@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-a','dept-cse')
      ON CONFLICT DO NOTHING
    `);

    // ── CSE 6th Sem — Batch B (2JH23CS071–140) ───────────────────────────────
    await db.execute(sql`
      INSERT INTO users (id,usn,name,role,branch,semester,email,password_hash,admission_type,batch_id,department_id) VALUES
        ('s-2JH23CS071','2JH23CS071','Mohammed Haris Ansari',      'student','CSE','6','2jh23cs071@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-b','dept-cse'),
        ('s-2JH23CS072','2JH23CS072','Mohammed Mahir Mohammed Hussainshaikh','student','CSE','6','2jh23cs072@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-b','dept-cse'),
        ('s-2JH23CS073','2JH23CS073','Mohammed Nisar F Barchiwale','student','CSE','6','2jh23cs073@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-b','dept-cse'),
        ('s-2JH23CS074','2JH23CS074','Mohammed Tousif Mohammediq Balmalekoppa','student','CSE','6','2jh23cs074@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-b','dept-cse'),
        ('s-2JH23CS076','2JH23CS076','Monish Raghavendra Hutgikar','student','CSE','6','2jh23cs076@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-b','dept-cse'),
        ('s-2JH23CS077','2JH23CS077','Nagaraj',                    'student','CSE','6','2jh23cs077@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-b','dept-cse'),
        ('s-2JH23CS078','2JH23CS078','Nagaveni',                   'student','CSE','6','2jh23cs078@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-b','dept-cse'),
        ('s-2JH23CS079','2JH23CS079','Nakul',                      'student','CSE','6','2jh23cs079@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-b','dept-cse'),
        ('s-2JH23CS080','2JH23CS080','Nandini Gudageri',           'student','CSE','6','2jh23cs080@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-b','dept-cse'),
        ('s-2JH23CS081','2JH23CS081','Nandini Nandalli',           'student','CSE','6','2jh23cs081@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-b','dept-cse'),
        ('s-2JH23CS082','2JH23CS082','Neha S Patil',               'student','CSE','6','2jh23cs082@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-b','dept-cse'),
        ('s-2JH23CS083','2JH23CS083','Nidhi M Joshi',              'student','CSE','6','2jh23cs083@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-b','dept-cse'),
        ('s-2JH23CS084','2JH23CS084','Nihaal L Kallapur',          'student','CSE','6','2jh23cs084@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-b','dept-cse'),
        ('s-2JH23CS085','2JH23CS085','Nikitha Ramappa Hatti',      'student','CSE','6','2jh23cs085@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-b','dept-cse'),
        ('s-2JH23CS086','2JH23CS086','Niralin Thakkar',            'student','CSE','6','2jh23cs086@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-b','dept-cse'),
        ('s-2JH23CS087','2JH23CS087','Niranjan Shidrama Yahiremat','student','CSE','6','2jh23cs087@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-b','dept-cse'),
        ('s-2JH23CS089','2JH23CS089','Nischitha A P',              'student','CSE','6','2jh23cs089@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-b','dept-cse'),
        ('s-2JH23CS090','2JH23CS090','Nityam Kallayyanavar',       'student','CSE','6','2jh23cs090@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-b','dept-cse'),
        ('s-2JH23CS091','2JH23CS091','Omkar Raghavhegde',          'student','CSE','6','2jh23cs091@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-b','dept-cse'),
        ('s-2JH23CS092','2JH23CS092','Parvati Basavaraj Kurtakoti','student','CSE','6','2jh23cs092@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-b','dept-cse'),
        ('s-2JH23CS093','2JH23CS093','Pavan Kumar M K',            'student','CSE','6','2jh23cs093@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-b','dept-cse'),
        ('s-2JH23CS094','2JH23CS094','Phalguni Mallikarjun S',     'student','CSE','6','2jh23cs094@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-b','dept-cse'),
        ('s-2JH23CS095','2JH23CS095','Pooja Basavaraj Sheshagiri', 'student','CSE','6','2jh23cs095@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-b','dept-cse'),
        ('s-2JH23CS113','2JH23CS113','Sadika Shivalli',            'student','CSE','6','2jh23cs113@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-b','dept-cse'),
        ('s-2JH23CS131','2JH23CS131','Shifaan Jums Bijapur',       'student','CSE','6','2jh23cs131@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-b','dept-cse'),
        ('s-2JH23CS132','2JH23CS132','Shreena Kousar Kalakapur',   'student','CSE','6','2jh23cs132@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-b','dept-cse'),
        ('s-2JH23CS134','2JH23CS134','Shree Shakti K Hubballi',    'student','CSE','6','2jh23cs134@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-b','dept-cse'),
        ('s-2JH23CS135','2JH23CS135','Shreya Andli',               'student','CSE','6','2jh23cs135@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-b','dept-cse'),
        ('s-2JH23CS136','2JH23CS136','Shreya Basavaraj Mulagun',   'student','CSE','6','2jh23cs136@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-b','dept-cse'),
        ('s-2JH23CS137','2JH23CS137','Shreyas Hosmani',            'student','CSE','6','2jh23cs137@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-b','dept-cse'),
        ('s-2JH23CS138','2JH23CS138','Shreyas Nagappa Nagammanavar','student','CSE','6','2jh23cs138@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-b','dept-cse'),
        ('s-2JH23CS139','2JH23CS139','Shridhar Ravi Kagenavar',    'student','CSE','6','2jh23cs139@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-b','dept-cse'),
        ('s-2JH23CS140','2JH23CS140','Shrikant',                   'student','CSE','6','2jh23cs140@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-b','dept-cse')
      ON CONFLICT DO NOTHING
    `);

    // ── CSE 6th Sem — Batch C (2JH23CS141–189 + 2JH24CS400–417) ─────────────
    await db.execute(sql`
      INSERT INTO users (id,usn,name,role,branch,semester,email,password_hash,admission_type,batch_id,department_id) VALUES
        ('s-2JH23CS141','2JH23CS141','Shrishail Ajatangond',       'student','CSE','6','2jh23cs141@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-c','dept-cse'),
        ('s-2JH23CS142','2JH23CS142','Shubham Mahadevappa A',      'student','CSE','6','2jh23cs142@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-c','dept-cse'),
        ('s-2JH23CS143','2JH23CS143','Shweta Pille',               'student','CSE','6','2jh23cs143@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-c','dept-cse'),
        ('s-2JH23CS144','2JH23CS144','Sindhu S Ingalagi',          'student','CSE','6','2jh23cs144@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-c','dept-cse'),
        ('s-2JH23CS145','2JH23CS145','Sneha',                      'student','CSE','6','2jh23cs145@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-c','dept-cse'),
        ('s-2JH23CS146','2JH23CS146','Sneha B Annigeri',           'student','CSE','6','2jh23cs146@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-c','dept-cse'),
        ('s-2JH23CS147','2JH23CS147','Sneha Mallappa Hosalli',     'student','CSE','6','2jh23cs147@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-c','dept-cse'),
        ('s-2JH23CS150','2JH23CS150','Sonam Shivanand Gothe',      'student','CSE','6','2jh23cs150@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-c','dept-cse'),
        ('s-2JH23CS151','2JH23CS151','Srushti S Gudi',             'student','CSE','6','2jh23cs151@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-c','dept-cse'),
        ('s-2JH23CS153','2JH23CS153','Sudeep P Shivanagi',         'student','CSE','6','2jh23cs153@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-c','dept-cse'),
        ('s-2JH23CS154','2JH23CS154','Sudeep V Hiregoudar',        'student','CSE','6','2jh23cs154@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-c','dept-cse'),
        ('s-2JH23CS155','2JH23CS155','Suhas A Sakri',              'student','CSE','6','2jh23cs155@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-c','dept-cse'),
        ('s-2JH23CS156','2JH23CS156','Sujal Ashok Vaidya',         'student','CSE','6','2jh23cs156@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-c','dept-cse'),
        ('s-2JH23CS157','2JH23CS157','Sujal R Hiremath',           'student','CSE','6','2jh23cs157@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-c','dept-cse'),
        ('s-2JH23CS158','2JH23CS158','Sumith Girish Hiremath',     'student','CSE','6','2jh23cs158@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-c','dept-cse'),
        ('s-2JH23CS159','2JH23CS159','Supriya',                    'student','CSE','6','2jh23cs159@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-c','dept-cse'),
        ('s-2JH23CS160','2JH23CS160','Supriya Sharanagoud P',      'student','CSE','6','2jh23cs160@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-c','dept-cse'),
        ('s-2JH23CS161','2JH23CS161','Suraj Mohan Byatnal',        'student','CSE','6','2jh23cs161@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-c','dept-cse'),
        ('s-2JH23CS162','2JH23CS162','Swati Babu Rathod',          'student','CSE','6','2jh23cs162@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-c','dept-cse'),
        ('s-2JH23CS163','2JH23CS163','Syed Safwan Quadri',         'student','CSE','6','2jh23cs163@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-c','dept-cse'),
        ('s-2JH23CS164','2JH23CS164','Tejasvi V Dyamanagoudra',    'student','CSE','6','2jh23cs164@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-c','dept-cse'),
        ('s-2JH23CS165','2JH23CS165','Tejaswini D Chavan',         'student','CSE','6','2jh23cs165@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-c','dept-cse'),
        ('s-2JH23CS166','2JH23CS166','Tejaswini Gangadharmore',    'student','CSE','6','2jh23cs166@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-c','dept-cse'),
        ('s-2JH23CS168','2JH23CS168','Tejaswini Veeranna S',       'student','CSE','6','2jh23cs168@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-c','dept-cse'),
        ('s-2JH23CS169','2JH23CS169','Thushar N G',                'student','CSE','6','2jh23cs169@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-c','dept-cse'),
        ('s-2JH23CS170','2JH23CS170','Umar Khan',                  'student','CSE','6','2jh23cs170@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-c','dept-cse'),
        ('s-2JH23CS171','2JH23CS171','Umesh',                      'student','CSE','6','2jh23cs171@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-c','dept-cse'),
        ('s-2JH23CS172','2JH23CS172','Umra Jamadar',               'student','CSE','6','2jh23cs172@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-c','dept-cse'),
        ('s-2JH23CS173','2JH23CS173','Upputuru Prabhucharan',      'student','CSE','6','2jh23cs173@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-c','dept-cse'),
        ('s-2JH23CS174','2JH23CS174','Uzma Savanur',               'student','CSE','6','2jh23cs174@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-c','dept-cse'),
        ('s-2JH23CS175','2JH23CS175','V Sahana',                   'student','CSE','6','2jh23cs175@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-c','dept-cse'),
        ('s-2JH23CS176','2JH23CS176','Vadiraj K Kulkarni',         'student','CSE','6','2jh23cs176@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-c','dept-cse'),
        ('s-2JH23CS177','2JH23CS177','Vaibhav R Hujaratti',        'student','CSE','6','2jh23cs177@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-c','dept-cse'),
        ('s-2JH23CS178','2JH23CS178','Vaibhav S Bhusanur',         'student','CSE','6','2jh23cs178@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-c','dept-cse'),
        ('s-2JH23CS179','2JH23CS179','Vaishnavi A Patil',          'student','CSE','6','2jh23cs179@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-c','dept-cse'),
        ('s-2JH23CS180','2JH23CS180','Vanishree Jadhav',           'student','CSE','6','2jh23cs180@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-c','dept-cse'),
        ('s-2JH23CS181','2JH23CS181','Varsha Raghavendra Bijapur', 'student','CSE','6','2jh23cs181@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-c','dept-cse'),
        ('s-2JH23CS182','2JH23CS182','Varsha T Hosamani',          'student','CSE','6','2jh23cs182@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-c','dept-cse'),
        ('s-2JH23CS183','2JH23CS183','Veda Manohar Chandukar',     'student','CSE','6','2jh23cs183@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-c','dept-cse'),
        ('s-2JH23CS185','2JH23CS185','Vikas Basavaraj Malli',      'student','CSE','6','2jh23cs185@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-c','dept-cse'),
        ('s-2JH23CS186','2JH23CS186','Vikas Chandrashekhara Annigeri','student','CSE','6','2jh23cs186@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-c','dept-cse'),
        ('s-2JH23CS187','2JH23CS187','Vishwanath N Badiger',       'student','CSE','6','2jh23cs187@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-c','dept-cse'),
        ('s-2JH23CS188','2JH23CS188','Vishwanath Panchangoud P',   'student','CSE','6','2jh23cs188@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-c','dept-cse'),
        ('s-2JH23CS189','2JH23CS189','Yogitha Divakar Shetty',     'student','CSE','6','2jh23cs189@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-cse-6-c','dept-cse'),
        ('s-2JH24CS400','2JH24CS400','Abhishek A Vanjeri',         'student','CSE','6','2jh24cs400@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','Management','batch-cse-6-c','dept-cse'),
        ('s-2JH24CS401','2JH24CS401','Adarsh A Shalawadi',         'student','CSE','6','2jh24cs401@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','Management','batch-cse-6-c','dept-cse'),
        ('s-2JH24CS402','2JH24CS402','Aditya G Mamardi',           'student','CSE','6','2jh24cs402@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','Management','batch-cse-6-c','dept-cse'),
        ('s-2JH24CS403','2JH24CS403','Ananya G Kammar',            'student','CSE','6','2jh24cs403@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','Management','batch-cse-6-c','dept-cse'),
        ('s-2JH24CS404','2JH24CS404','Arjun G Kalburgi',           'student','CSE','6','2jh24cs404@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','Management','batch-cse-6-c','dept-cse'),
        ('s-2JH24CS405','2JH24CS405','Ashwini A Morabad',          'student','CSE','6','2jh24cs405@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','Management','batch-cse-6-c','dept-cse'),
        ('s-2JH24CS406','2JH24CS406','Dhanashri Katwe',            'student','CSE','6','2jh24cs406@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','Management','batch-cse-6-c','dept-cse'),
        ('s-2JH24CS407','2JH24CS407','Ishma Patil',                'student','CSE','6','2jh24cs407@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','Management','batch-cse-6-c','dept-cse'),
        ('s-2JH24CS408','2JH24CS408','Khushi D Chavan',            'student','CSE','6','2jh24cs408@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','Management','batch-cse-6-c','dept-cse'),
        ('s-2JH24CS409','2JH24CS409','Nagaveni V Patil',           'student','CSE','6','2jh24cs409@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','Management','batch-cse-6-c','dept-cse'),
        ('s-2JH24CS410','2JH24CS410','Priyanka A Naganur',         'student','CSE','6','2jh24cs410@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','Management','batch-cse-6-c','dept-cse'),
        ('s-2JH24CS411','2JH24CS411','Rakshita Kalburgi',          'student','CSE','6','2jh24cs411@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','Management','batch-cse-6-c','dept-cse'),
        ('s-2JH24CS412','2JH24CS412','Rohit A Katigar',            'student','CSE','6','2jh24cs412@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','Management','batch-cse-6-c','dept-cse'),
        ('s-2JH24CS413','2JH24CS413','Sahana M',                   'student','CSE','6','2jh24cs413@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','Management','batch-cse-6-c','dept-cse'),
        ('s-2JH24CS414','2JH24CS414','Shyamukumar Timmannavar',    'student','CSE','6','2jh24cs414@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','Management','batch-cse-6-c','dept-cse'),
        ('s-2JH24CS415','2JH24CS415','Soniya S Niranjan',          'student','CSE','6','2jh24cs415@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','Management','batch-cse-6-c','dept-cse'),
        ('s-2JH24CS416','2JH24CS416','Swati R Mestri',             'student','CSE','6','2jh24cs416@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','Management','batch-cse-6-c','dept-cse'),
        ('s-2JH24CS417','2JH24CS417','Yasminbanu A Ballari',       'student','CSE','6','2jh24cs417@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','Management','batch-cse-6-c','dept-cse')
      ON CONFLICT DO NOTHING
    `);

    // ── ECE 6th Sem — Batch A (2JH23EC001–063 + 2JH24EC400–403) ─────────────
    await db.execute(sql`
      INSERT INTO users (id,usn,name,role,branch,semester,email,password_hash,admission_type,batch_id,department_id) VALUES
        ('s-2JH23EC001','2JH23EC001','Abhishek Madagundi',          'student','ECE','6','2jh23ec001@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-ece-6-a','dept-ece'),
        ('s-2JH23EC002','2JH23EC002','Adarsh Shankar Madali',       'student','ECE','6','2jh23ec002@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-ece-6-a','dept-ece'),
        ('s-2JH23EC003','2JH23EC003','Aishwarya Chikkanagoudar',    'student','ECE','6','2jh23ec003@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-ece-6-a','dept-ece'),
        ('s-2JH23EC004','2JH23EC004','Akhandappa Akash Sangappa H', 'student','ECE','6','2jh23ec004@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-ece-6-a','dept-ece'),
        ('s-2JH23EC005','2JH23EC005','Anup Vernekar',               'student','ECE','6','2jh23ec005@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-ece-6-a','dept-ece'),
        ('s-2JH23EC006','2JH23EC006','Basavaraj Shivalingappa Bendigeri','student','ECE','6','2jh23ec006@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-ece-6-a','dept-ece'),
        ('s-2JH23EC007','2JH23EC007','Basavaraj Goni',              'student','ECE','6','2jh23ec007@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-ece-6-a','dept-ece'),
        ('s-2JH23EC008','2JH23EC008','Bhakti Jakati',               'student','ECE','6','2jh23ec008@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-ece-6-a','dept-ece'),
        ('s-2JH23EC009','2JH23EC009','Blessina Bhaskar',            'student','ECE','6','2jh23ec009@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-ece-6-a','dept-ece'),
        ('s-2JH23EC010','2JH23EC010','Daneshwari Mruthunjaya H',    'student','ECE','6','2jh23ec010@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-ece-6-a','dept-ece'),
        ('s-2JH23EC011','2JH23EC011','Dhanaraj Mudakappa Bilekalla','student','ECE','6','2jh23ec011@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-ece-6-a','dept-ece'),
        ('s-2JH23EC013','2JH23EC013','K Shriya',                    'student','ECE','6','2jh23ec013@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-ece-6-a','dept-ece'),
        ('s-2JH23EC014','2JH23EC014','Kavya Ganesh Kanchagar',      'student','ECE','6','2jh23ec014@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-ece-6-a','dept-ece'),
        ('s-2JH23EC015','2JH23EC015','Keerti R Kalappanavar',       'student','ECE','6','2jh23ec015@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-ece-6-a','dept-ece'),
        ('s-2JH23EC016','2JH23EC016','Khushi Gokak',                'student','ECE','6','2jh23ec016@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-ece-6-a','dept-ece'),
        ('s-2JH23EC017','2JH23EC017','Likith M',                    'student','ECE','6','2jh23ec017@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-ece-6-a','dept-ece'),
        ('s-2JH23EC018','2JH23EC018','Madia Muqtarahmed Mannangi',  'student','ECE','6','2jh23ec018@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-ece-6-a','dept-ece'),
        ('s-2JH23EC019','2JH23EC019','Manjunath Shrishail Katti',   'student','ECE','6','2jh23ec019@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-ece-6-a','dept-ece'),
        ('s-2JH23EC020','2JH23EC020','Manish P',                    'student','ECE','6','2jh23ec020@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-ece-6-a','dept-ece'),
        ('s-2JH23EC021','2JH23EC021','Meghana S Bangari',           'student','ECE','6','2jh23ec021@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-ece-6-a','dept-ece'),
        ('s-2JH23EC022','2JH23EC022','Nandeesh M S',                'student','ECE','6','2jh23ec022@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-ece-6-a','dept-ece'),
        ('s-2JH23EC025','2JH23EC025','Nasreen Ajamoddin Jamadar',   'student','ECE','6','2jh23ec025@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-ece-6-a','dept-ece'),
        ('s-2JH23EC026','2JH23EC026','Naveen Rajendrakumar Bilagikar','student','ECE','6','2jh23ec026@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-ece-6-a','dept-ece'),
        ('s-2JH23EC027','2JH23EC027','Nikhita S Patil',             'student','ECE','6','2jh23ec027@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-ece-6-a','dept-ece'),
        ('s-2JH23EC028','2JH23EC028','Nitin Basavaraj Bedsur',      'student','ECE','6','2jh23ec028@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-ece-6-a','dept-ece'),
        ('s-2JH23EC029','2JH23EC029','Nitish Suresh Shrigiri',      'student','ECE','6','2jh23ec029@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-ece-6-a','dept-ece'),
        ('s-2JH23EC030','2JH23EC030','Pavitra Yallappa Ullagaddi',  'student','ECE','6','2jh23ec030@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-ece-6-a','dept-ece'),
        ('s-2JH23EC031','2JH23EC031','Poorvi Rao',                  'student','ECE','6','2jh23ec031@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-ece-6-a','dept-ece'),
        ('s-2JH23EC032','2JH23EC032','Prajwal Jaganath Halli',      'student','ECE','6','2jh23ec032@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-ece-6-a','dept-ece'),
        ('s-2JH23EC033','2JH23EC033','Pramath D Revankar',          'student','ECE','6','2jh23ec033@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-ece-6-a','dept-ece'),
        ('s-2JH23EC034','2JH23EC034','Prashanth S Hiremath',        'student','ECE','6','2jh23ec034@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-ece-6-a','dept-ece'),
        ('s-2JH23EC035','2JH23EC035','Prathvi Girish Shetty',       'student','ECE','6','2jh23ec035@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-ece-6-a','dept-ece'),
        ('s-2JH23EC036','2JH23EC036','Priyanka S Hulagur',          'student','ECE','6','2jh23ec036@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-ece-6-a','dept-ece'),
        ('s-2JH23EC037','2JH23EC037','Rahul Ashok Kajagar',         'student','ECE','6','2jh23ec037@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-ece-6-a','dept-ece'),
        ('s-2JH23EC038','2JH23EC038','Riya Hosmani',                'student','ECE','6','2jh23ec038@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-ece-6-a','dept-ece'),
        ('s-2JH23EC039','2JH23EC039','Rukhiyabanu Mainuddin Khatib','student','ECE','6','2jh23ec039@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-ece-6-a','dept-ece'),
        ('s-2JH23EC040','2JH23EC040','Sagar Bagewadi',              'student','ECE','6','2jh23ec040@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-ece-6-a','dept-ece'),
        ('s-2JH23EC041','2JH23EC041','Sahana Prakash Patil',        'student','ECE','6','2jh23ec041@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-ece-6-a','dept-ece'),
        ('s-2JH23EC042','2JH23EC042','Sandhya Nanagouda Hosalli',   'student','ECE','6','2jh23ec042@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-ece-6-a','dept-ece'),
        ('s-2JH23EC043','2JH23EC043','Santosh Benal',               'student','ECE','6','2jh23ec043@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-ece-6-a','dept-ece'),
        ('s-2JH23EC044','2JH23EC044','Sayed Shadaab Ahmed Peerzade','student','ECE','6','2jh23ec044@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-ece-6-a','dept-ece'),
        ('s-2JH23EC045','2JH23EC045','Shambu B Koppad',             'student','ECE','6','2jh23ec045@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-ece-6-a','dept-ece'),
        ('s-2JH23EC046','2JH23EC046','Shrisha Attibele',            'student','ECE','6','2jh23ec046@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-ece-6-a','dept-ece'),
        ('s-2JH23EC047','2JH23EC047','Simran Nadaf',                'student','ECE','6','2jh23ec047@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-ece-6-a','dept-ece'),
        ('s-2JH23EC048','2JH23EC048','Sinchana C Kulkarni',         'student','ECE','6','2jh23ec048@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-ece-6-a','dept-ece'),
        ('s-2JH23EC049','2JH23EC049','Soujanya Kotturshettar',      'student','ECE','6','2jh23ec049@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-ece-6-a','dept-ece'),
        ('s-2JH23EC050','2JH23EC050','Soumya Halappa Vaddatti',     'student','ECE','6','2jh23ec050@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-ece-6-a','dept-ece'),
        ('s-2JH23EC051','2JH23EC051','Spandana Naikodi',            'student','ECE','6','2jh23ec051@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-ece-6-a','dept-ece'),
        ('s-2JH23EC052','2JH23EC052','Srushti Bahubali Halingali',  'student','ECE','6','2jh23ec052@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-ece-6-a','dept-ece'),
        ('s-2JH23EC053','2JH23EC053','Srushti Chidanand Karlatti',  'student','ECE','6','2jh23ec053@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-ece-6-a','dept-ece'),
        ('s-2JH23EC054','2JH23EC054','Srushti Dasannavar',          'student','ECE','6','2jh23ec054@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-ece-6-a','dept-ece'),
        ('s-2JH23EC055','2JH23EC055','Sukanya R Hallur',            'student','ECE','6','2jh23ec055@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-ece-6-a','dept-ece'),
        ('s-2JH23EC056','2JH23EC056','Sumedh M Joshi',              'student','ECE','6','2jh23ec056@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-ece-6-a','dept-ece'),
        ('s-2JH23EC057','2JH23EC057','Swapneel Astekar',            'student','ECE','6','2jh23ec057@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-ece-6-a','dept-ece'),
        ('s-2JH23EC058','2JH23EC058','Swati Patil',                 'student','ECE','6','2jh23ec058@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-ece-6-a','dept-ece'),
        ('s-2JH23EC059','2JH23EC059','Vaikhari Chintamani Joshi',   'student','ECE','6','2jh23ec059@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-ece-6-a','dept-ece'),
        ('s-2JH23EC060','2JH23EC060','Vaishnavi Girish Pujar',      'student','ECE','6','2jh23ec060@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-ece-6-a','dept-ece'),
        ('s-2JH23EC061','2JH23EC061','Varun Uday Raval',            'student','ECE','6','2jh23ec061@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-ece-6-a','dept-ece'),
        ('s-2JH23EC062','2JH23EC062','Vasuda Venkatesh Donsale',    'student','ECE','6','2jh23ec062@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-ece-6-a','dept-ece'),
        ('s-2JH23EC063','2JH23EC063','Vishalakshi Girishgouda B',   'student','ECE','6','2jh23ec063@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-ece-6-a','dept-ece'),
        ('s-2JH24EC400','2JH24EC400','Mallikarjun Gowdar',          'student','ECE','6','2jh24ec400@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','Management','batch-ece-6-a','dept-ece'),
        ('s-2JH24EC401','2JH24EC401','Poornima Noolvi',             'student','ECE','6','2jh24ec401@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','Management','batch-ece-6-a','dept-ece'),
        ('s-2JH24EC402','2JH24EC402','Sahana Raynagoudar',          'student','ECE','6','2jh24ec402@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','Management','batch-ece-6-a','dept-ece'),
        ('s-2JH24EC403','2JH24EC403','Vishalakshi',                 'student','ECE','6','2jh24ec403@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','Management','batch-ece-6-a','dept-ece')
      ON CONFLICT DO NOTHING
    `);

    // ── AIML 6th Sem — Batch A (2JH23AI001–060 + 2JH24AI400–406) ────────────
    await db.execute(sql`
      INSERT INTO users (id,usn,name,role,branch,semester,email,password_hash,admission_type,batch_id,department_id) VALUES
        ('s-2JH23AI001','2JH23AI001','Abdul Jawad Bankapur',        'student','AIML','6','2jh23ai001@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-aiml-6-a','dept-aiml'),
        ('s-2JH23AI002','2JH23AI002','Abhishek A Ganjyal',          'student','AIML','6','2jh23ai002@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-aiml-6-a','dept-aiml'),
        ('s-2JH23AI003','2JH23AI003','Abubakar S Hawaldar',         'student','AIML','6','2jh23ai003@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-aiml-6-a','dept-aiml'),
        ('s-2JH23AI004','2JH23AI004','Aishwarya N Patil',           'student','AIML','6','2jh23ai004@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-aiml-6-a','dept-aiml'),
        ('s-2JH23AI005','2JH23AI005','Amol Balu Khot',              'student','AIML','6','2jh23ai005@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-aiml-6-a','dept-aiml'),
        ('s-2JH23AI006','2JH23AI006','Anjali A Myalad',             'student','AIML','6','2jh23ai006@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-aiml-6-a','dept-aiml'),
        ('s-2JH23AI007','2JH23AI007','Arbaaz Basarkod',             'student','AIML','6','2jh23ai007@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-aiml-6-a','dept-aiml'),
        ('s-2JH23AI008','2JH23AI008','Arfaa Anjum',                 'student','AIML','6','2jh23ai008@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-aiml-6-a','dept-aiml'),
        ('s-2JH23AI010','2JH23AI010','B S Sirisha Singh',           'student','AIML','6','2jh23ai010@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-aiml-6-a','dept-aiml'),
        ('s-2JH23AI011','2JH23AI011','Balaji Panchal',              'student','AIML','6','2jh23ai011@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-aiml-6-a','dept-aiml'),
        ('s-2JH23AI012','2JH23AI012','Bhuvan B Karjagi',            'student','AIML','6','2jh23ai012@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-aiml-6-a','dept-aiml'),
        ('s-2JH23AI013','2JH23AI013','Chandana S M',                'student','AIML','6','2jh23ai013@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-aiml-6-a','dept-aiml'),
        ('s-2JH23AI014','2JH23AI014','G Anusha',                    'student','AIML','6','2jh23ai014@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-aiml-6-a','dept-aiml'),
        ('s-2JH23AI015','2JH23AI015','Gouri U N',                   'student','AIML','6','2jh23ai015@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-aiml-6-a','dept-aiml'),
        ('s-2JH23AI016','2JH23AI016','Gurukiran S Jambagi',         'student','AIML','6','2jh23ai016@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-aiml-6-a','dept-aiml'),
        ('s-2JH23AI017','2JH23AI017','Hareesh Tumbinavar',          'student','AIML','6','2jh23ai017@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-aiml-6-a','dept-aiml'),
        ('s-2JH23AI018','2JH23AI018','Kotha Somasekhar',            'student','AIML','6','2jh23ai018@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-aiml-6-a','dept-aiml'),
        ('s-2JH23AI020','2JH23AI020','Leanne Dcosta',               'student','AIML','6','2jh23ai020@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-aiml-6-a','dept-aiml'),
        ('s-2JH23AI021','2JH23AI021','Mala M Laddi',                'student','AIML','6','2jh23ai021@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-aiml-6-a','dept-aiml'),
        ('s-2JH23AI022','2JH23AI022','Malappa Anand Hanji',         'student','AIML','6','2jh23ai022@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-aiml-6-a','dept-aiml'),
        ('s-2JH23AI023','2JH23AI023','Manojkumar S Masani',         'student','AIML','6','2jh23ai023@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-aiml-6-a','dept-aiml'),
        ('s-2JH23AI024','2JH23AI024','Megha Ravi Madikar',          'student','AIML','6','2jh23ai024@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-aiml-6-a','dept-aiml'),
        ('s-2JH23AI026','2JH23AI026','Mohammad F Shaikh',           'student','AIML','6','2jh23ai026@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-aiml-6-a','dept-aiml'),
        ('s-2JH23AI027','2JH23AI027','Mohammed Kaif N B',           'student','AIML','6','2jh23ai027@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-aiml-6-a','dept-aiml'),
        ('s-2JH23AI028','2JH23AI028','Mohammedgouse Ahmed',         'student','AIML','6','2jh23ai028@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-aiml-6-a','dept-aiml'),
        ('s-2JH23AI029','2JH23AI029','Namrata Wadekar',             'student','AIML','6','2jh23ai029@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-aiml-6-a','dept-aiml'),
        ('s-2JH23AI030','2JH23AI030','Nishat Kanakgeri',            'student','AIML','6','2jh23ai030@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-aiml-6-a','dept-aiml'),
        ('s-2JH23AI031','2JH23AI031','Padmashree C B',              'student','AIML','6','2jh23ai031@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-aiml-6-a','dept-aiml'),
        ('s-2JH23AI032','2JH23AI032','Prajwal Appasab Mirji',       'student','AIML','6','2jh23ai032@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-aiml-6-a','dept-aiml'),
        ('s-2JH23AI033','2JH23AI033','Punit Shankar Soude',         'student','AIML','6','2jh23ai033@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-aiml-6-a','dept-aiml'),
        ('s-2JH23AI034','2JH23AI034','Rafatzia W Hosmani',          'student','AIML','6','2jh23ai034@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-aiml-6-a','dept-aiml'),
        ('s-2JH23AI035','2JH23AI035','Rakshitha Poojari',           'student','AIML','6','2jh23ai035@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-aiml-6-a','dept-aiml'),
        ('s-2JH23AI036','2JH23AI036','Revathi R Mishra',            'student','AIML','6','2jh23ai036@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-aiml-6-a','dept-aiml'),
        ('s-2JH23AI037','2JH23AI037','Sabiha Naz Sayed Ismail',     'student','AIML','6','2jh23ai037@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-aiml-6-a','dept-aiml'),
        ('s-2JH23AI038','2JH23AI038','Saket Kalaskar',              'student','AIML','6','2jh23ai038@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-aiml-6-a','dept-aiml'),
        ('s-2JH23AI039','2JH23AI039','Sakshi S Naik',               'student','AIML','6','2jh23ai039@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-aiml-6-a','dept-aiml'),
        ('s-2JH23AI040','2JH23AI040','Sakshi S Betadur',            'student','AIML','6','2jh23ai040@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-aiml-6-a','dept-aiml'),
        ('s-2JH23AI041','2JH23AI041','Samrudh S Sangalad',          'student','AIML','6','2jh23ai041@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-aiml-6-a','dept-aiml'),
        ('s-2JH23AI042','2JH23AI042','Sheetal Revankar',            'student','AIML','6','2jh23ai042@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-aiml-6-a','dept-aiml'),
        ('s-2JH23AI043','2JH23AI043','Shilpa A Biradar',            'student','AIML','6','2jh23ai043@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-aiml-6-a','dept-aiml'),
        ('s-2JH23AI044','2JH23AI044','Shivanand I Nesaragi',        'student','AIML','6','2jh23ai044@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-aiml-6-a','dept-aiml'),
        ('s-2JH23AI045','2JH23AI045','Shreegouri M Yaragatti',      'student','AIML','6','2jh23ai045@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-aiml-6-a','dept-aiml'),
        ('s-2JH23AI047','2JH23AI047','Shrushti M Saunshi',          'student','AIML','6','2jh23ai047@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-aiml-6-a','dept-aiml'),
        ('s-2JH23AI048','2JH23AI048','Spoorti M Patil',             'student','AIML','6','2jh23ai048@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-aiml-6-a','dept-aiml'),
        ('s-2JH23AI049','2JH23AI049','Srujana S Gaji',              'student','AIML','6','2jh23ai049@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-aiml-6-a','dept-aiml'),
        ('s-2JH23AI050','2JH23AI050','Srushti S Bhadule',           'student','AIML','6','2jh23ai050@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-aiml-6-a','dept-aiml'),
        ('s-2JH23AI051','2JH23AI051','Subhash Patil',               'student','AIML','6','2jh23ai051@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-aiml-6-a','dept-aiml'),
        ('s-2JH23AI052','2JH23AI052','Suhani S',                    'student','AIML','6','2jh23ai052@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-aiml-6-a','dept-aiml'),
        ('s-2JH23AI053','2JH23AI053','Sushruth',                    'student','AIML','6','2jh23ai053@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-aiml-6-a','dept-aiml'),
        ('s-2JH23AI054','2JH23AI054','Tejas S Murgod',              'student','AIML','6','2jh23ai054@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-aiml-6-a','dept-aiml'),
        ('s-2JH23AI055','2JH23AI055','Vidyashree S M',              'student','AIML','6','2jh23ai055@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-aiml-6-a','dept-aiml'),
        ('s-2JH23AI056','2JH23AI056','Vikas Yadav',                 'student','AIML','6','2jh23ai056@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-aiml-6-a','dept-aiml'),
        ('s-2JH23AI057','2JH23AI057','Vilasrao Desai',              'student','AIML','6','2jh23ai057@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-aiml-6-a','dept-aiml'),
        ('s-2JH23AI058','2JH23AI058','Vishwanath S G',              'student','AIML','6','2jh23ai058@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-aiml-6-a','dept-aiml'),
        ('s-2JH23AI059','2JH23AI059','Wafa Mahin A Patwegar',       'student','AIML','6','2jh23ai059@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-aiml-6-a','dept-aiml'),
        ('s-2JH23AI060','2JH23AI060','Yukti Shinde',                'student','AIML','6','2jh23ai060@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-aiml-6-a','dept-aiml'),
        ('s-2JH24AI400','2JH24AI400','Aditya',                      'student','AIML','6','2jh24ai400@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','Management','batch-aiml-6-a','dept-aiml'),
        ('s-2JH24AI401','2JH24AI401','Bibi Mizba N',                'student','AIML','6','2jh24ai401@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','Management','batch-aiml-6-a','dept-aiml'),
        ('s-2JH24AI402','2JH24AI402','Gazala',                      'student','AIML','6','2jh24ai402@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','Management','batch-aiml-6-a','dept-aiml'),
        ('s-2JH24AI403','2JH24AI403','Keerti',                      'student','AIML','6','2jh24ai403@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','Management','batch-aiml-6-a','dept-aiml'),
        ('s-2JH24AI404','2JH24AI404','Mohammed R',                  'student','AIML','6','2jh24ai404@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','Management','batch-aiml-6-a','dept-aiml'),
        ('s-2JH24AI405','2JH24AI405','Roopa',                       'student','AIML','6','2jh24ai405@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','Management','batch-aiml-6-a','dept-aiml'),
        ('s-2JH24AI406','2JH24AI406','Sirajuddin',                  'student','AIML','6','2jh24ai406@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','Management','batch-aiml-6-a','dept-aiml')
      ON CONFLICT DO NOTHING
    `);

    // ── ME 6th Sem — Batch A (2JH23ME + 2JH24ME) ─────────────────────────────
    await db.execute(sql`
      INSERT INTO users (id,usn,name,role,branch,semester,email,password_hash,admission_type,batch_id,department_id) VALUES
        ('s-2JH23ME001','2JH23ME001','Ashish Amrut Jamakhandi',     'student','ME','6','2jh23me001@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-me-6-a','dept-mech'),
        ('s-2JH23ME002','2JH23ME002','Bhagyalaxmi B Karigai',       'student','ME','6','2jh23me002@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','KCET','batch-me-6-a','dept-mech'),
        ('s-2JH24ME401','2JH24ME401','Basavaraj Iranna Kavali',     'student','ME','6','2jh24me401@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','Management','batch-me-6-a','dept-mech'),
        ('s-2JH24ME402','2JH24ME402','Chetan Kumar B B',            'student','ME','6','2jh24me402@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','Management','batch-me-6-a','dept-mech'),
        ('s-2JH24ME403','2JH24ME403','Cyrus Paula Juniju',          'student','ME','6','2jh24me403@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','Management','batch-me-6-a','dept-mech'),
        ('s-2JH24ME404','2JH24ME404','Haseeb Nadaf',                'student','ME','6','2jh24me404@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','Management','batch-me-6-a','dept-mech'),
        ('s-2JH24ME405','2JH24ME405','Kishan Vitthala Sabharade',   'student','ME','6','2jh24me405@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','Management','batch-me-6-a','dept-mech'),
        ('s-2JH24ME406','2JH24ME406','Manikantha S Kuratti',        'student','ME','6','2jh24me406@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','Management','batch-me-6-a','dept-mech'),
        ('s-2JH24ME407','2JH24ME407','Mohammed Anas Khan',          'student','ME','6','2jh24me407@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','Management','batch-me-6-a','dept-mech'),
        ('s-2JH24ME408','2JH24ME408','Naveen Uttam Jadhav',         'student','ME','6','2jh24me408@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','Management','batch-me-6-a','dept-mech'),
        ('s-2JH24ME409','2JH24ME409','Omprakash Sundart',           'student','ME','6','2jh24me409@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','Management','batch-me-6-a','dept-mech'),
        ('s-2JH24ME410','2JH24ME410','Priyanka M M',                'student','ME','6','2jh24me410@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','Management','batch-me-6-a','dept-mech'),
        ('s-2JH24ME411','2JH24ME411','Rohan Ravi Doddamani',        'student','ME','6','2jh24me411@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','Management','batch-me-6-a','dept-mech'),
        ('s-2JH24ME412','2JH24ME412','Sairaj Raju Sonone',          'student','ME','6','2jh24me412@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','Management','batch-me-6-a','dept-mech'),
        ('s-2JH24ME413','2JH24ME413','Salman A Nadaf',              'student','ME','6','2jh24me413@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','Management','batch-me-6-a','dept-mech'),
        ('s-2JH24ME414','2JH24ME414','Sainaj Sai Satabhai',         'student','ME','6','2jh24me414@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','Management','batch-me-6-a','dept-mech'),
        ('s-2JH24ME415','2JH24ME415','Udayagouda S Desai',          'student','ME','6','2jh24me415@jcet.edu','da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3','Management','batch-me-6-a','dept-mech')
      ON CONFLICT DO NOTHING
    `);

    const counts = await db.execute(sql`
      SELECT
        (SELECT COUNT(*) FROM users        WHERE role = 'student') AS students,
        (SELECT COUNT(*) FROM users        WHERE role = 'faculty') AS faculty,
        (SELECT COUNT(*) FROM departments)                         AS departments,
        (SELECT COUNT(*) FROM batches)                             AS batches,
        (SELECT COUNT(*) FROM subjects)                            AS subjects,
        (SELECT COUNT(*) FROM events)                              AS events,
        (SELECT COUNT(*) FROM timetable)                           AS timetable,
        (SELECT COUNT(*) FROM attendance)                          AS attendance,
        (SELECT COUNT(*) FROM marks)                               AS marks,
        (SELECT COUNT(*) FROM assignments)                         AS assignments,
        (SELECT COUNT(*) FROM campus_points)                       AS xp_entries,
        (SELECT COUNT(*) FROM student_badges)                      AS badges_awarded
    `);
    logger.info({ counts: counts.rows[0] }, "Demo data seed completed");
  } catch (err) {
    logger.error({ err }, "Failed to seed demo data");
  }
}

const httpServer = createServer(app);
initSocket(httpServer);

httpServer.listen(port, "0.0.0.0", async () => {
  logger.info({ port, host: "0.0.0.0" }, "Server listening");
  await seedDemoData();
});
