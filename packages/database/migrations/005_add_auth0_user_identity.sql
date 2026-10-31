-- Preserve legacy users without guessing which Auth0 identity owns them.
-- New Auth0 users always supply auth0_user_id through the repository.
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS auth0_user_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS users_auth0_user_id_key
    ON users (auth0_user_id);

-- Older databases required a password. Auth0 manages passwords for new users;
-- retain legacy values while allowing Auth0 users to omit this column.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'users'
          AND column_name = 'password'
    ) THEN
        ALTER TABLE users ALTER COLUMN password DROP NOT NULL;
    END IF;
END
$$;
