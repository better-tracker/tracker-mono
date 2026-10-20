import { pool } from "./client.js";
import { createUser } from "./repositories/usersRepo.js";
import { createProject } from "./repositories/projectsRepo.js";
import { createSubtask } from "./repositories/subtaskRepo.js";

async function seed() {
  try {
    // Sample credential placeholder; this is not a generated password hash.
    await createUser({
      user_name: "Lachlan",
      email: "lachlan@example.com",
      passwordHash: "hashed_password_here",
    });

    const project = await createProject({
      name: "Sample Project",
      description: "This is a sample project.",
    });

    const subtasks = [
    "API design",
    "Create stuff",
    "Test stuff",
    "Read more about stuff",
  ];

    for (const description of subtasks) {
      await createSubtask({
        project_id: project.id,
        description,
      });
    }

    console.log("Database seeded successfully!", {project_id: project.id, subtasks: subtasks});
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exitCode = 1;
    } finally {
        await pool.end();
    }
}

seed();
