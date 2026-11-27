import { constants } from "node:fs";
import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import type { PoolClient } from "pg";
import pool from "../db.js";
import { UPLOAD_DIR } from "../utils/upload.js";
import { withTransaction } from "../utils/sql.js";

const DEMO_PASSWORD = process.env.SEED_DEMO_PASSWORD;
if (!DEMO_PASSWORD || DEMO_PASSWORD.length < 8) {
  throw new Error(
    "SEED_DEMO_PASSWORD is not set or shorter than 8 characters. Check server/.env",
  );
}

const BANNER_DIR = fileURLToPath(
  new URL("../../demo/banners/", import.meta.url),
);

const categories = ["Frontend", "Backend", "Design", "Data"];
const levels = ["Beginner", "Intermediate", "Advanced"];

const people = [
  {
    name: "Aziza Karimova",
    phone: "+998000000201",
    role: "mentor",
    job: "Senior frontend developer",
  },
  {
    name: "Bekzod Tursunov",
    phone: "+998000000202",
    role: "mentor",
    job: "Backend engineer",
  },
  { name: "Kamola Ergasheva", phone: "+998000000301", role: "assistant" },
  { name: "Dilnoza Rahimova", phone: "+998000000401", role: "student" },
  { name: "Jasur Aliyev", phone: "+998000000402", role: "student" },
  { name: "Madina Yusupova", phone: "+998000000403", role: "student" },
  { name: "Otabek Nazarov", phone: "+998000000404", role: "student" },
  { name: "Sardor Ismoilov", phone: "+998000000405", role: "student" },
  { name: "Nilufar Saidova", phone: "+998000000406", role: "student" },
];

const courses = [
  {
    title: "Frontend with React and TypeScript",
    category: "Frontend",
    level: "Intermediate",
    price: "1800000",
    banner: "b1.png",
    mentors: ["Aziza Karimova"],
    students: [
      "Dilnoza Rahimova",
      "Jasur Aliyev",
      "Madina Yusupova",
      "Otabek Nazarov",
    ],
    sections: [
      [
        "Getting started",
        ["Tooling and project setup", "JSX and components", "Props and state"],
      ],
      [
        "Data and routing",
        [
          "Fetching data with TanStack Query",
          "Routing with React Router",
          "Forms with react-hook-form",
        ],
      ],
    ],
  },
  {
    title: "Node.js and PostgreSQL backend",
    category: "Backend",
    level: "Intermediate",
    price: "2000000",
    banner: "b4.png",
    mentors: ["Bekzod Tursunov"],
    students: ["Dilnoza Rahimova", "Sardor Ismoilov"],
    sections: [
      ["API basics", ["Express routing", "SQL with pg", "Auth with JWT"]],
    ],
  },
  {
    title: "UI/UX design in Figma",
    category: "Design",
    level: "Beginner",
    price: "1200000",
    banner: "b3.png",
    mentors: [],
    students: ["Madina Yusupova"],
    sections: [],
  },
  {
    title: "HTML, CSS and JavaScript basics",
    category: "Frontend",
    level: "Beginner",
    price: "900000",
    banner: "b2.png",
    mentors: ["Aziza Karimova"],
    students: ["Dilnoza Rahimova", "Nilufar Saidova", "Jasur Aliyev"],
    sections: [
      [
        "The web platform",
        [
          "How the browser renders a page",
          "Semantic HTML",
          "CSS layout with flexbox",
        ],
      ],
    ],
  },
  {
    title: "Python for data analysis",
    category: "Data",
    level: "Beginner",
    price: "1500000",
    banner: "b6.png",
    mentors: [],
    students: [],
    sections: [],
  },
  {
    title: "System design for engineers",
    category: "Backend",
    level: "Advanced",
    price: "2500000",
    banner: "b5.png",
    mentors: [],
    students: [],
    sections: [],
  },
] as const;

const progress: Record<string, number> = {
  "Dilnoza Rahimova|Frontend with React and TypeScript": 4,
  "Dilnoza Rahimova|HTML, CSS and JavaScript basics": 1,
  "Jasur Aliyev|Frontend with React and TypeScript": 2,
};

async function idOf(client: PoolClient, sql: string, params: unknown[]) {
  const { rows } = await client.query<{ id: number }>(sql, params);
  const id = rows[0]?.id;
  if (id === undefined) throw new Error(`No id returned: ${sql}`);
  return id;
}

function slug(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const { rows: existing } = await pool.query(
  "SELECT 1 FROM users WHERE phone = ANY($1::text[]) LIMIT 1",
  [people.map((p) => p.phone)],
);
if (existing.length > 0) {
  console.log("Demo data is already there, nothing to do");
  await pool.end();
  process.exit(0);
}

const { rows: roleRows } = await pool.query<{ id: number; title: string }>(
  "SELECT id, title FROM roles",
);
const roleId = new Map(roleRows.map((r) => [r.title, r.id]));
if (!roleId.has("mentor") || !roleId.has("student")) {
  throw new Error("Roles are missing. Run npm run db:seed first");
}

await mkdir(path.join(UPLOAD_DIR, "demo"), { recursive: true });
for (const course of courses) {
  await copyFile(
    path.join(BANNER_DIR, course.banner),
    path.join(UPLOAD_DIR, "demo", course.banner),
    constants.COPYFILE_EXCL,
  ).catch((err: NodeJS.ErrnoException) => {
    if (err.code !== "EEXIST") throw err;
  });
}

const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

await withTransaction(async (client) => {
  const categoryId = new Map<string, number>();
  for (const title of categories) {
    categoryId.set(
      title,
      await idOf(
        client,
        `INSERT INTO categories (title, slug) VALUES ($1, $2)
          ON CONFLICT (slug) DO UPDATE SET title = categories.title
          RETURNING id`,
        [title, slug(title)],
      ),
    );
  }

  const levelId = new Map<string, number>();
  for (const title of levels) {
    levelId.set(
      title,
      await idOf(
        client,
        `INSERT INTO levels (title, slug) VALUES ($1, $2)
          ON CONFLICT (slug) DO UPDATE SET title = levels.title
          RETURNING id`,
        [title, slug(title)],
      ),
    );
  }

  const userId = new Map<string, number>();
  for (const person of people) {
    userId.set(
      person.name,
      await idOf(
        client,
        `INSERT INTO users (role_id, full_name, phone, password_hash, job)
          VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [
          roleId.get(person.role),
          person.name,
          person.phone,
          passwordHash,
          "job" in person ? person.job : null,
        ],
      ),
    );
  }

  for (const course of courses) {
    const courseId = await idOf(
      client,
      `INSERT INTO courses (title, description, price, banner, category_id, level_id)
        VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [
        course.title,
        `${course.title}: a hands-on course with real projects, code reviews and a final exam.`,
        course.price,
        `/uploads/demo/${course.banner}`,
        categoryId.get(course.category),
        levelId.get(course.level),
      ],
    );

    for (const mentor of course.mentors) {
      await client.query(
        "INSERT INTO course_mentors (course_id, user_id) VALUES ($1, $2)",
        [courseId, userId.get(mentor)],
      );
    }
    for (const student of course.students) {
      await client.query(
        "INSERT INTO user_courses (course_id, user_id) VALUES ($1, $2)",
        [courseId, userId.get(student)],
      );
    }

    const lessonIds: number[] = [];
    for (const [
      sectionIndex,
      [sectionTitle, lessons],
    ] of course.sections.entries()) {
      const sectionId = await idOf(
        client,
        "INSERT INTO sections (course_id, title, position) VALUES ($1, $2, $3) RETURNING id",
        [courseId, sectionTitle, sectionIndex],
      );
      for (const [lessonIndex, lessonTitle] of lessons.entries()) {
        lessonIds.push(
          await idOf(
            client,
            `INSERT INTO lessons (section_id, title, description, position)
              VALUES ($1, $2, $3, $4) RETURNING id`,
            [
              sectionId,
              lessonTitle,
              `${lessonTitle}: notes, examples and a short task.`,
              lessonIndex,
            ],
          ),
        );
      }
    }

    for (const student of course.students) {
      const done = progress[`${student}|${course.title}`] ?? 0;
      for (const lessonId of lessonIds.slice(0, done)) {
        await client.query(
          "INSERT INTO lesson_progress (user_id, lesson_id) VALUES ($1, $2)",
          [userId.get(student), lessonId],
        );
      }
    }
  }
});

console.log(
  `Demo data created: ${courses.length} courses, ${people.length} users (password from SEED_DEMO_PASSWORD)`,
);
for (const person of people.filter(
  (p, i, all) => all.findIndex((q) => q.role === p.role) === i,
)) {
  console.log(`  ${person.role}: ${person.phone}`);
}
await pool.end();
