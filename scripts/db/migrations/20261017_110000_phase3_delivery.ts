import { db } from '../../../platform/database/db';

export async function up() {
  // Create projects table
  await db.query(`
    CREATE TABLE projects (
      id uuid PRIMARY KEY,
      organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      client_id uuid NOT NULL,
      contract_id uuid,
      name varchar(255) NOT NULL,
      description text,
      start_date date NOT NULL,
      target_end_date date NOT NULL,
      actual_end_date date,
      budget numeric(15,2),
      status varchar(20) DEFAULT 'planning',
      created_by uuid NOT NULL REFERENCES users(id),
      created_at timestamp DEFAULT NOW(),
      updated_at timestamp DEFAULT NOW()
    );
    CREATE INDEX idx_projects_organization_id ON projects(organization_id);
    CREATE INDEX idx_projects_client_id ON projects(client_id);
    CREATE INDEX idx_projects_status ON projects(organization_id, status);
  `);

  // Create project_phases table
  await db.query(`
    CREATE TABLE project_phases (
      id uuid PRIMARY KEY,
      project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      name varchar(100) NOT NULL,
      sequence_order integer NOT NULL,
      start_date date NOT NULL,
      target_end_date date NOT NULL,
      actual_end_date date,
      status varchar(20) DEFAULT 'pending',
      created_at timestamp DEFAULT NOW(),
      updated_at timestamp DEFAULT NOW()
    );
    CREATE INDEX idx_project_phases_project_id ON project_phases(project_id);
    CREATE INDEX idx_project_phases_sequence ON project_phases(project_id, sequence_order);
  `);

  // Create tasks table
  await db.query(`
    CREATE TABLE tasks (
      id uuid PRIMARY KEY,
      organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      phase_id uuid REFERENCES project_phases(id) ON DELETE SET NULL,
      title varchar(255) NOT NULL,
      description text,
      assigned_to uuid REFERENCES users(id) ON DELETE SET NULL,
      priority varchar(20) NOT NULL DEFAULT 'medium',
      status varchar(20) NOT NULL DEFAULT 'todo',
      due_date date,
      estimated_hours numeric(6,2),
      created_by uuid NOT NULL REFERENCES users(id),
      created_at timestamp DEFAULT NOW(),
      updated_at timestamp DEFAULT NOW()
    );
    CREATE INDEX idx_tasks_organization_id ON tasks(organization_id);
    CREATE INDEX idx_tasks_project_id ON tasks(project_id);
    CREATE INDEX idx_tasks_phase_id ON tasks(phase_id);
    CREATE INDEX idx_tasks_status ON tasks(project_id, status);
    CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
  `);

  // Create task_dependencies table
  await db.query(`
    CREATE TABLE task_dependencies (
      id uuid PRIMARY KEY,
      task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      depends_on_task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      blocking boolean DEFAULT false,
      created_at timestamp DEFAULT NOW()
    );
    CREATE INDEX idx_task_dependencies_task_id ON task_dependencies(task_id);
    CREATE INDEX idx_task_dependencies_depends_on ON task_dependencies(depends_on_task_id);
  `);

  // Create deliverables table
  await db.query(`
    CREATE TABLE deliverables (
      id uuid PRIMARY KEY,
      project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      name varchar(255) NOT NULL,
      description text,
      expected_date date NOT NULL,
      actual_date date,
      status varchar(20) DEFAULT 'pending',
      file_urls text[] DEFAULT '{}',
      approval_notes text,
      approved_by uuid REFERENCES users(id) ON DELETE SET NULL,
      created_at timestamp DEFAULT NOW(),
      updated_at timestamp DEFAULT NOW()
    );
    CREATE INDEX idx_deliverables_project_id ON deliverables(project_id);
    CREATE INDEX idx_deliverables_status ON deliverables(project_id, status);
  `);

  // Create file_versions table
  await db.query(`
    CREATE TABLE file_versions (
      id uuid PRIMARY KEY,
      organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      deliverable_id uuid REFERENCES deliverables(id) ON DELETE SET NULL,
      project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
      filename varchar(255) NOT NULL,
      file_url text NOT NULL,
      file_size bigint NOT NULL,
      file_hash varchar(64) NOT NULL,
      version_number integer NOT NULL,
      uploaded_by uuid NOT NULL REFERENCES users(id),
      uploaded_at timestamp DEFAULT NOW()
    );
    CREATE INDEX idx_file_versions_organization_id ON file_versions(organization_id);
    CREATE INDEX idx_file_versions_deliverable_id ON file_versions(deliverable_id);
    CREATE INDEX idx_file_versions_project_id ON file_versions(project_id);
    CREATE INDEX idx_file_versions_hash ON file_versions(file_hash);
  `);
}

export async function down() {
  await db.query('DROP TABLE IF EXISTS file_versions CASCADE');
  await db.query('DROP TABLE IF EXISTS deliverables CASCADE');
  await db.query('DROP TABLE IF EXISTS task_dependencies CASCADE');
  await db.query('DROP TABLE IF EXISTS tasks CASCADE');
  await db.query('DROP TABLE IF EXISTS project_phases CASCADE');
  await db.query('DROP TABLE IF EXISTS projects CASCADE');
}
