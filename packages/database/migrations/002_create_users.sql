/*
The API service hashes passwords with salted scrypt before storing them here.
The password column itself does not enforce the hash format.
*/

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_name TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    profile_pic TEXT
);