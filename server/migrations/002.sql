ALTER TABLE requests ADD COLUMN amount numeric(15,2) GENERATED ALWAYS AS ((state->>'amount')::numeric(15,2)) STORED;
ALTER TABLE revisions ADD COLUMN amount numeric(15,2) GENERATED ALWAYS AS ((state->>'amount')::numeric(15,2)) STORED;
