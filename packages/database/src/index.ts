// Server-only PostgreSQL boundary; never import from web or mobile.
export {
    createUserRepository,
    createUser,
    getUsers,
    getUserById,
    getUserByEmailForAuth,
    updateUser,
    deleteUser,
} from "./repositories/usersRepo.js";
export {
    createProject,
    getProjectById,
    listProjects,
    updateProject,
    deleteProject,
} from "./repositories/projectsRepo.js";
export {
    createSubtask,
    getSubtaskById,
    listSubtasksByProject,
    updateSubtask,
    deleteSubtask,
} from "./repositories/subtaskRepo.js";
export { pool, createPool } from "./client.js";
export type { 
    UserRepository,
    User, 
    CreateUser,
    UpdateUser,
    UserWithPassword,
} from "./repositories/usersRepo.js";
export type {
    Project,
    CreateProject,
    UpdateProject,
} from "./repositories/projectsRepo.js";
export type {
    Subtask,
    CreateSubtask,
    UpdateSubtask,
} from "./repositories/subtaskRepo.js";
export type { DatabaseConnection } from "./client.js";
