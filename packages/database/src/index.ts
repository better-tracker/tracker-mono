// Server-only PostgreSQL boundary; never import from web or mobile.
export {
    createUser,
    getUserById,
    getUserByEmailForAuth,
} from "./repositories/usersRepo.js";
export {
    createProject,
    getProjectById,
} from "./repositories/projectsRepo.js";
export {
    createSubtask,
    getSubtaskById,
} from "./repositories/subtaskRepo.js";
export { pool } from "./client.js";
export type { 
    User, 
    CreateUser,
    UserWithPassword,
} from "./repositories/usersRepo.js";
export type {
    Project,
    CreateProject,
} from "./repositories/projectsRepo.js";
export type {
    Subtask,
    CreateSubtask,
} from "./repositories/subtaskRepo.js";