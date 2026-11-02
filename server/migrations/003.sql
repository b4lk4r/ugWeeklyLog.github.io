CREATE INDEX requests_request_number ON requests((state->>'requestNumber'));
COMMENT ON INDEX requests_request_number IS 'Номер заявки (C) отдельно от номера тендера (D) и номера заявки ЮГ (E)';
