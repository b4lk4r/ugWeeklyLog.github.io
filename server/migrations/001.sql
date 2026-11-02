CREATE TABLE IF NOT EXISTS users (
 id uuid PRIMARY KEY, login text UNIQUE NOT NULL, name text NOT NULL,
 role text NOT NULL CHECK(role IN ('manager','head','admin')), password_hash text NOT NULL,
 active boolean NOT NULL DEFAULT true, can_edit boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE sessions(token_hash text PRIMARY KEY, user_id uuid NOT NULL REFERENCES users(id), expires_at timestamptz NOT NULL);
CREATE TABLE requests(id uuid PRIMARY KEY, version integer NOT NULL DEFAULT 1, state jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), import_id uuid);
CREATE TABLE revisions(id bigserial PRIMARY KEY, request_id uuid NOT NULL REFERENCES requests(id),
 actor_id uuid REFERENCES users(id), recorded_at timestamptz NOT NULL DEFAULT now(),
 state jsonb NOT NULL, previous jsonb, reason text, kind text NOT NULL DEFAULT 'change', source jsonb);
CREATE INDEX revisions_request_time ON revisions(request_id,recorded_at,id);
CREATE INDEX requests_manager ON requests((state->>'managerId'));
CREATE TABLE imports(id uuid PRIMARY KEY, fingerprint text UNIQUE NOT NULL, report jsonb NOT NULL, applied_at timestamptz, rolled_back_at timestamptz);
CREATE TABLE system_audit(id bigserial PRIMARY KEY, actor_id uuid REFERENCES users(id), at timestamptz NOT NULL DEFAULT now(), action text NOT NULL, detail jsonb NOT NULL);
CREATE TABLE backup_runs(id bigserial PRIMARY KEY, at timestamptz DEFAULT now(), file text NOT NULL, verified boolean NOT NULL DEFAULT false);
