import { createServer } from "http";
import app from "./app";
import { initSocket } from "./socket";
import { logger } from "./lib/logger";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
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

async function seedDemoUsers() {
  try {
    const result = await db.execute(sql`SELECT COUNT(*)::int AS count FROM users`);
    const count = (result.rows[0] as any).count as number;
    if (count > 0) {
      logger.info({ count }, "Demo users already exist, skipping seed");
      return;
    }

    await db.execute(sql`
      INSERT INTO users (id, usn, name, role, branch, semester, email, phone, password_hash, admission_type)
      VALUES
        ('student-001', '2JH23CS001', 'Aryan Joshi',   'student', 'CSE', '5', 'aryan.joshi@jcet.edu',  '9876543210', 'da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3', 'KCET'),
        ('student-002', '2JH23CS002', 'Priya Patel',   'student', 'CSE', '5', 'priya.patel@jcet.edu',   '9876543211', 'da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3', 'Management'),
        ('student-003', '2JH23CS003', 'Rohan Mehta',   'student', 'CSE', '5', 'rohan.mehta@jcet.edu',   '9876543212', 'da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3', 'COMEDK'),
        ('student-004', '2JH23CS004', 'Sneha Reddy',   'student', 'CSE', '5', 'sneha.reddy@jcet.edu',   '9876543213', 'da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3', 'KCET'),
        ('student-005', '2JH23CS005', 'Kiran Kumar',   'student', 'CSE', '5', 'kiran.kumar@jcet.edu',   '9876543214', 'da952c342e2ca2af44bacecdf28987ba2485ec9da67e45e2e3e4bbee312ba2e3', 'KCET'),
        ('faculty-001', 'FAC001',     'Dr. Priya Sharma','faculty','CSE', NULL,'priya.sharma@jcet.edu', '9876500001', '9fccc110c38c92f49227efb2952ad9b7519e98d4e61152d89fcc124144ed5b57', 'KCET'),
        ('admin-001',   'ADMIN1',     'Admin User',    'admin',   NULL,  NULL,'admin@jcet.edu',         '9000000001', 'f4530f385daae618a928df113893facad67ce6441ad35f441c113ed030e19414', 'KCET')
      ON CONFLICT (id) DO NOTHING
    `);

    await db.execute(sql`
      INSERT INTO departments (id, name, code, hod_name)
      VALUES
        ('dept-cse', 'Computer Science & Engineering', 'CSE', 'Dr. Ravi Kumar'),
        ('dept-ece', 'Electronics & Communication Engineering', 'ECE', 'Dr. Meena Iyer'),
        ('dept-mech', 'Mechanical Engineering', 'MECH', 'Dr. Suresh Patil'),
        ('dept-civil', 'Civil Engineering', 'CIVIL', 'Dr. Anand Kulkarni')
      ON CONFLICT (id) DO NOTHING
    `);

    await db.execute(sql`
      INSERT INTO batches (id, name, department_id, semester, year)
      VALUES
        ('batch-cse-a1', 'A1', 'dept-cse', '5', '2021'),
        ('batch-cse-a2', 'A2', 'dept-cse', '5', '2021'),
        ('batch-ece-b1', 'B1', 'dept-ece', '5', '2021'),
        ('batch-mech-c1','C1', 'dept-mech','5', '2021')
      ON CONFLICT (id) DO NOTHING
    `);

    await db.execute(sql`
      INSERT INTO subjects (id, name, code, department_id, semester, credits)
      VALUES
        ('sub-ds',   'Data Structures', 'CS501', 'dept-cse', '5', 4),
        ('sub-os',   'Operating Systems', 'CS502', 'dept-cse', '5', 4),
        ('sub-cn',   'Computer Networks', 'CS503', 'dept-cse', '5', 3),
        ('sub-dbms', 'Database Management Systems', 'CS504', 'dept-cse', '5', 4),
        ('sub-se',   'Software Engineering', 'CS505', 'dept-cse', '5', 3)
      ON CONFLICT (id) DO NOTHING
    `);

    await db.execute(sql`
      UPDATE users SET department_id = 'dept-cse', batch_id = 'batch-cse-a1'
      WHERE id IN ('student-001','student-002','student-003')
    `);
    await db.execute(sql`
      UPDATE users SET department_id = 'dept-cse', batch_id = 'batch-cse-a2'
      WHERE id IN ('student-004','student-005')
    `);
    await db.execute(sql`
      UPDATE users SET department_id = 'dept-cse' WHERE id = 'faculty-001'
    `);

    logger.info("Demo data seeded successfully");
  } catch (err) {
    logger.error({ err }, "Failed to seed demo users");
  }
}

const httpServer = createServer(app);
initSocket(httpServer);

httpServer.listen(port, async () => {
  logger.info({ port }, "Server listening");
  await seedDemoUsers();
});
