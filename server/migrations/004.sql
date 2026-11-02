CREATE TABLE excel_observations (
 id uuid PRIMARY KEY, import_id uuid NOT NULL REFERENCES imports(id),
 request_id uuid REFERENCES requests(id), manager_id uuid NOT NULL REFERENCES users(id),
 sheet text NOT NULL, row_number integer NOT NULL, week_start date NOT NULL,
 state jsonb NOT NULL, warnings jsonb NOT NULL DEFAULT '[]', errors jsonb NOT NULL DEFAULT '[]',
 raw jsonb NOT NULL, imported_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(import_id,sheet,row_number));
CREATE INDEX excel_observation_week ON excel_observations(week_start,manager_id);
CREATE TABLE excel_report_cells(import_id uuid REFERENCES imports(id), sheet text NOT NULL, address text NOT NULL, value jsonb, PRIMARY KEY(import_id,sheet,address));
