CREATE TABLE organizations (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE users (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  email VARCHAR(320) NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT users_email_per_organization_unique
    UNIQUE (organization_id, email),
  CONSTRAINT users_id_organization_unique
    UNIQUE (id, organization_id)
);

CREATE TABLE tasks (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  created_by UUID NOT NULL,
  type VARCHAR(100) NOT NULL,
  status VARCHAR(32) NOT NULL,
  input JSONB,
  result JSONB,
  error_code VARCHAR(100),
  attempt_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  CONSTRAINT tasks_created_by_same_organization
    FOREIGN KEY (created_by, organization_id)
    REFERENCES users (id, organization_id),
  CONSTRAINT tasks_attempt_count_non_negative CHECK (attempt_count >= 0),
  CONSTRAINT tasks_status_valid CHECK (
    status IN ('PENDING', 'QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELLED')
  )
);

CREATE INDEX tasks_organization_created_at_idx
  ON tasks (organization_id, created_at DESC);

CREATE INDEX tasks_status_created_at_idx
  ON tasks (status, created_at);

CREATE INDEX users_organization_email_idx
  ON users (organization_id, email);
