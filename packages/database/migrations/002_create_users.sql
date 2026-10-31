CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth0_user_id TEXT NOT NULL UNIQUE,
    user_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    profile_pic TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);