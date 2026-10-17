import { Pool } from "pg";

export async function up(pool: Pool): Promise<void> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Projects table
    await client.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id VARCHAR(255) PRIMARY KEY,
        organization_id VARCHAR(255) NOT NULL,
        contract_id VARCHAR(255),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(50) NOT NULL DEFAULT 'planning',
        start_date TIMESTAMP NOT NULL,
        end_date TIMESTAMP NOT NULL,
        budget DECIMAL(15,2),
        budget_used DECIMAL(15,2) DEFAULT 0,
        client_id VARCHAR(255) NOT NULL,
        project_manager_id VARCHAR(255) NOT NULL,
        timeline_variance INTEGER DEFAULT 0,
        budget_variance DECIMAL(5,2) DEFAULT 0,
        completion_percentage INTEGER DEFAULT 0,
        created_by VARCHAR(255) NOT NULL,
        updated_by VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
        CONSTRAINT status_check CHECK (status IN ('planning', 'kickoff', 'in_progress', 'on_hold', 'in_review', 'completed', 'cancelled'))
      );
      CREATE INDEX idx_projects_org_id ON projects(organization_id);
      CREATE INDEX idx_projects_status ON projects(organization_id, status);
      CREATE INDEX idx_projects_pm ON projects(project_manager_id);
    `);

    // Project Phases table
    await client.query(`
      CREATE TABLE IF NOT EXISTS project_phases (
        id VARCHAR(255) PRIMARY KEY,
        project_id VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        description TEXT,
        start_date TIMESTAMP NOT NULL,
        end_date TIMESTAMP NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'planning',
        sequence INTEGER NOT NULL,
        duration_days INTEGER,
        completion_percentage INTEGER DEFAULT 0,
        dependencies JSONB DEFAULT '[]',
        deliverables JSONB DEFAULT '[]',
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      );
      CREATE INDEX idx_phases_project ON project_phases(project_id);
      CREATE INDEX idx_phases_type ON project_phases(type);
    `);

    // Milestones table
    await client.query(`
      CREATE TABLE IF NOT EXISTS milestones (
        id VARCHAR(255) PRIMARY KEY,
        project_id VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        target_date TIMESTAMP NOT NULL,
        completion_date TIMESTAMP,
        status VARCHAR(50) NOT NULL DEFAULT 'not_started',
        phase_id VARCHAR(255),
        assigned_to_id VARCHAR(255),
        deliverables JSONB DEFAULT '[]',
        criteria JSONB DEFAULT '[]',
        variance_days INTEGER DEFAULT 0,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY (phase_id) REFERENCES project_phases(id)
      );
      CREATE INDEX idx_milestones_project ON milestones(project_id);
      CREATE INDEX idx_milestones_status ON milestones(status);
    `);

    // Tasks table
    await client.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id VARCHAR(255) PRIMARY KEY,
        project_id VARCHAR(255) NOT NULL,
        milestone_id VARCHAR(255),
        parent_task_id VARCHAR(255),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(50) NOT NULL DEFAULT 'todo',
        priority VARCHAR(50) NOT NULL DEFAULT 'medium',
        assigned_to_id VARCHAR(255) NOT NULL,
        estimated_hours DECIMAL(10,2) NOT NULL,
        actual_hours DECIMAL(10,2),
        start_date TIMESTAMP NOT NULL,
        due_date TIMESTAMP NOT NULL,
        completion_date TIMESTAMP,
        dependencies JSONB DEFAULT '[]',
        acceptance_criteria JSONB DEFAULT '[]',
        blocked_by VARCHAR(255),
        block_reason TEXT,
        completion_percentage INTEGER DEFAULT 0,
        tags JSONB DEFAULT '[]',
        created_by VARCHAR(255) NOT NULL,
        updated_by VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY (milestone_id) REFERENCES milestones(id),
        FOREIGN KEY (parent_task_id) REFERENCES tasks(id) ON DELETE CASCADE
      );
      CREATE INDEX idx_tasks_project ON tasks(project_id);
      CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to_id);
      CREATE INDEX idx_tasks_status ON tasks(status);
      CREATE INDEX idx_tasks_due_date ON tasks(due_date);
    `);

    // Team Members table
    await client.query(`
      CREATE TABLE IF NOT EXISTS project_team_members (
        id VARCHAR(255) PRIMARY KEY,
        project_id VARCHAR(255) NOT NULL,
        user_id VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        capacity_percentage INTEGER NOT NULL,
        allocated_hours DECIMAL(10,2),
        actual_hours DECIMAL(10,2),
        start_date TIMESTAMP NOT NULL,
        end_date TIMESTAMP,
        skills JSONB DEFAULT '[]',
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      );
      CREATE INDEX idx_team_members_project ON project_team_members(project_id);
      CREATE INDEX idx_team_members_user ON project_team_members(user_id);
    `);

    // Deliverables table
    await client.query(`
      CREATE TABLE IF NOT EXISTS deliverables (
        id VARCHAR(255) PRIMARY KEY,
        project_id VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        type VARCHAR(100) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'todo',
        milestone_id VARCHAR(255),
        phase_id VARCHAR(255),
        assigned_to_id VARCHAR(255) NOT NULL,
        due_date TIMESTAMP NOT NULL,
        completion_date TIMESTAMP,
        file_references JSONB DEFAULT '[]',
        approval_status VARCHAR(50) NOT NULL DEFAULT 'pending',
        reviewer_id VARCHAR(255),
        reviewed_date TIMESTAMP,
        version INTEGER DEFAULT 1,
        previous_versions JSONB DEFAULT '[]',
        acceptance_criteria JSONB DEFAULT '[]',
        completion_percentage INTEGER DEFAULT 0,
        created_by VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY (milestone_id) REFERENCES milestones(id),
        FOREIGN KEY (phase_id) REFERENCES project_phases(id)
      );
      CREATE INDEX idx_deliverables_project ON deliverables(project_id);
      CREATE INDEX idx_deliverables_status ON deliverables(status);
      CREATE INDEX idx_deliverables_approval ON deliverables(approval_status);
    `);

    // Resource Capacity table
    await client.query(`
      CREATE TABLE IF NOT EXISTS resource_capacity (
        id VARCHAR(255) PRIMARY KEY,
        organization_id VARCHAR(255) NOT NULL,
        user_id VARCHAR(255) NOT NULL,
        week_starting TIMESTAMP NOT NULL,
        total_available_hours DECIMAL(10,2) NOT NULL,
        allocated_hours DECIMAL(10,2) DEFAULT 0,
        available_hours DECIMAL(10,2),
        utilization_percentage DECIMAL(5,2) DEFAULT 0,
        allocations JSONB DEFAULT '[]',
        FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
        UNIQUE(organization_id, user_id, week_starting)
      );
      CREATE INDEX idx_capacity_org ON resource_capacity(organization_id);
      CREATE INDEX idx_capacity_user ON resource_capacity(user_id);
      CREATE INDEX idx_capacity_week ON resource_capacity(week_starting);
    `);

    // Risks table
    await client.query(`
      CREATE TABLE IF NOT EXISTS project_risks (
        id VARCHAR(255) PRIMARY KEY,
        project_id VARCHAR(255) NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(100),
        probability DECIMAL(3,2) NOT NULL,
        impact VARCHAR(50) NOT NULL,
        overall_level VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'identified',
        mitigation_plan TEXT,
        owner_id VARCHAR(255) NOT NULL,
        identified_date TIMESTAMP NOT NULL,
        target_resolution_date TIMESTAMP,
        resolved_date TIMESTAMP,
        tags JSONB DEFAULT '[]',
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      );
      CREATE INDEX idx_risks_project ON project_risks(project_id);
      CREATE INDEX idx_risks_level ON project_risks(overall_level);
      CREATE INDEX idx_risks_status ON project_risks(status);
    `);

    // Issues table
    await client.query(`
      CREATE TABLE IF NOT EXISTS project_issues (
        id VARCHAR(255) PRIMARY KEY,
        project_id VARCHAR(255) NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(100),
        severity VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'todo',
        reported_by_id VARCHAR(255) NOT NULL,
        assigned_to_id VARCHAR(255),
        created_date TIMESTAMP NOT NULL,
        resolved_date TIMESTAMP,
        resolution TEXT,
        related_tasks JSONB DEFAULT '[]',
        related_risks JSONB DEFAULT '[]',
        tags JSONB DEFAULT '[]',
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      );
      CREATE INDEX idx_issues_project ON project_issues(project_id);
      CREATE INDEX idx_issues_status ON project_issues(status);
      CREATE INDEX idx_issues_severity ON project_issues(severity);
    `);

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function down(pool: Pool): Promise<void> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query("DROP TABLE IF EXISTS project_issues CASCADE");
    await client.query("DROP TABLE IF EXISTS project_risks CASCADE");
    await client.query("DROP TABLE IF EXISTS resource_capacity CASCADE");
    await client.query("DROP TABLE IF EXISTS deliverables CASCADE");
    await client.query("DROP TABLE IF EXISTS project_team_members CASCADE");
    await client.query("DROP TABLE IF EXISTS tasks CASCADE");
    await client.query("DROP TABLE IF EXISTS milestones CASCADE");
    await client.query("DROP TABLE IF EXISTS project_phases CASCADE");
    await client.query("DROP TABLE IF EXISTS projects CASCADE");

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
