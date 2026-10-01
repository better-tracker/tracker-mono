/*
Creates users table
Soz made new file for this otherwise headaches

team decisions:
- user ids use automaticallyt generated uuids
- usernames are required and must be unique
- emails are required and must be uniuque
- password stores a password hash, never plaintext password(to be completed later)
- profile pics are optional and stored as text (url/path)
- user timestamps not required (add later otherwise)
*/

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_name TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    profile_pic TEXT
);