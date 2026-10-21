/*
Tasks belong to projects.
Task subtasks belong to tasks.

The existing subtasks table is preserved because it stores
project-level subtasks.

Deleting a project deletes its tasks and their subtasks.
Deleting a task deletes its subtasks.
*/

CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    project_id UUID NOT NULL
        REFERENCES projects(id) ON DELETE CASCADE,

    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    assignee TEXT NOT NULL DEFAULT '',

    priority TEXT NOT NULL DEFAULT 'Medium'
        CHECK (priority IN ('Low', 'Medium', 'High')),

    status TEXT NOT NULL DEFAULT 'To do'
        CHECK (status IN ('To do', 'In progress', 'Complete')),

    due_date TEXT NOT NULL DEFAULT '',
    due_time TEXT NOT NULL DEFAULT '',
    completed_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tasks_project_id
    ON tasks(project_id);


CREATE TABLE task_subtasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    task_id UUID NOT NULL
        REFERENCES tasks(id) ON DELETE CASCADE,

    title TEXT NOT NULL,
    notes TEXT NOT NULL DEFAULT '',
    assignee TEXT NOT NULL DEFAULT '',

    priority TEXT NOT NULL DEFAULT 'Medium'
        CHECK (priority IN ('Low', 'Medium', 'High')),

    completed BOOLEAN NOT NULL DEFAULT FALSE,

    due_date TEXT NOT NULL DEFAULT '',
    due_time TEXT NOT NULL DEFAULT '',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_task_subtasks_task_id
    ON task_subtasks(task_id);