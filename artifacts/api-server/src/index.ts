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
