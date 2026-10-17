export async function up(db: any): Promise<void> {
  // dashboards table
  await db.schema.createTable('dashboards', (table: any) => {
    table.string('id').primary();
    table.uuid('organization_id').notNullable();
    table.string('name').notNullable();
    table.text('description');
    table.enum('type', ['executive', 'sales', 'finance', 'project', 'marketing', 'custom']).notNullable();
    table.jsonb('layout').notNullable();
    table.jsonb('widgets').notNullable().defaultTo('[]');
    table.integer('refresh_interval').defaultTo(60);
    table.string('created_by').notNullable();
    table.string('updated_by').notNullable();
    table.boolean('is_public').defaultTo(false);
    table.timestamp('created_at').defaultTo(db.fn.now());
    table.timestamp('updated_at').defaultTo(db.fn.now());
    table.foreign('organization_id').references('organizations.id').onDelete('CASCADE');
    table.index('organization_id');
    table.index(['organization_id', 'type']);
  });

  // dashboard_widgets table
  await db.schema.createTable('dashboard_widgets', (table: any) => {
    table.string('id').primary();
    table.string('dashboard_id').notNullable();
    table.enum('type', ['chart', 'metric', 'table', 'gauge', 'timeline', 'heatmap', 'custom']).notNullable();
    table.string('title').notNullable();
    table.string('data_source_id').notNullable();
    table.jsonb('config').notNullable();
    table.jsonb('dimensions').notNullable().defaultTo('[]');
    table.jsonb('measures').notNullable().defaultTo('[]');
    table.jsonb('filters').notNullable().defaultTo('[]');
    table.jsonb('drill_downs').notNullable().defaultTo('[]');
    table.integer('refresh_interval').defaultTo(60);
    table.foreign('dashboard_id').references('dashboards.id').onDelete('CASCADE');
    table.index('dashboard_id');
  });

  // reports table
  await db.schema.createTable('reports', (table: any) => {
    table.string('id').primary();
    table.uuid('organization_id').notNullable();
    table.string('name').notNullable();
    table.text('description');
    table.enum('type', ['operational', 'financial', 'sales', 'project', 'marketing', 'custom']).notNullable();
    table.jsonb('sections').notNullable().defaultTo('[]');
    table.jsonb('schedule').notNullable();
    table.jsonb('recipients').notNullable().defaultTo('[]');
    table.string('created_by').notNullable();
    table.string('updated_by').notNullable();
    table.timestamp('created_at').defaultTo(db.fn.now());
    table.timestamp('updated_at').defaultTo(db.fn.now());
    table.foreign('organization_id').references('organizations.id').onDelete('CASCADE');
    table.index('organization_id');
    table.index(['organization_id', 'type']);
  });

  // metrics table
  await db.schema.createTable('metrics', (table: any) => {
    table.string('id').primary();
    table.uuid('organization_id').notNullable();
    table.string('name').notNullable();
    table.text('description');
    table.text('formula').notNullable();
    table.string('data_source_id').notNullable();
    table.jsonb('dimensions').notNullable().defaultTo('[]');
    table.jsonb('measures').notNullable().defaultTo('[]');
    table.enum('aggregation', ['sum', 'avg', 'count', 'min', 'max', 'cumulative']).notNullable();
    table.decimal('target_value', 12, 2);
    table.decimal('warning_threshold', 12, 2);
    table.decimal('critical_threshold', 12, 2);
    table.string('unit');
    table.timestamp('created_at').defaultTo(db.fn.now());
    table.timestamp('updated_at').defaultTo(db.fn.now());
    table.foreign('organization_id').references('organizations.id').onDelete('CASCADE');
    table.index('organization_id');
  });

  // kpis table
  await db.schema.createTable('kpis', (table: any) => {
    table.string('id').primary();
    table.uuid('organization_id').notNullable();
    table.string('metric_id').notNullable();
    table.string('name').notNullable();
    table.text('description');
    table.decimal('current_value', 12, 2).notNullable().defaultTo(0);
    table.decimal('target_value', 12, 2).notNullable();
    table.decimal('previous_value', 12, 2).defaultTo(0);
    table.decimal('change_percentage', 8, 2).defaultTo(0);
    table.enum('status', ['on_track', 'at_risk', 'off_track']).notNullable().defaultTo('on_track');
    table.enum('period', ['daily', 'weekly', 'monthly', 'quarterly', 'yearly']).notNullable();
    table.timestamp('last_updated').defaultTo(db.fn.now());
    table.foreign('organization_id').references('organizations.id').onDelete('CASCADE');
    table.foreign('metric_id').references('metrics.id').onDelete('CASCADE');
    table.index('organization_id');
    table.index('metric_id');
    table.index('status');
  });

  // analytics_events table
  await db.schema.createTable('analytics_events', (table: any) => {
    table.string('id').primary();
    table.uuid('organization_id').notNullable();
    table.string('event_type').notNullable();
    table.string('entity_type').notNullable();
    table.string('entity_id').notNullable();
    table.uuid('user_id');
    table.jsonb('properties').defaultTo('{}');
    table.timestamp('timestamp').notNullable();
    table.jsonb('context');
    table.foreign('organization_id').references('organizations.id').onDelete('CASCADE');
    table.index('organization_id');
    table.index('event_type');
    table.index(['entity_type', 'entity_id']);
    table.index('user_id');
    table.index('timestamp');
  });

  // funnels table
  await db.schema.createTable('funnels', (table: any) => {
    table.string('id').primary();
    table.uuid('organization_id').notNullable();
    table.string('name').notNullable();
    table.text('description');
    table.jsonb('steps').notNullable();
    table.decimal('conversion_rate', 8, 2).notNullable();
    table.timestamp('created_at').defaultTo(db.fn.now());
    table.foreign('organization_id').references('organizations.id').onDelete('CASCADE');
    table.index('organization_id');
  });

  // cohorts table
  await db.schema.createTable('cohorts', (table: any) => {
    table.string('id').primary();
    table.uuid('organization_id').notNullable();
    table.string('name').notNullable();
    table.text('description');
    table.jsonb('criteria').notNullable();
    table.integer('member_count').defaultTo(0);
    table.timestamp('created_date').defaultTo(db.fn.now());
    table.timestamp('last_updated').defaultTo(db.fn.now());
    table.foreign('organization_id').references('organizations.id').onDelete('CASCADE');
    table.index('organization_id');
  });

  // predictive_metrics table
  await db.schema.createTable('predictive_metrics', (table: any) => {
    table.string('id').primary();
    table.uuid('organization_id').notNullable();
    table.string('name').notNullable();
    table.text('description');
    table.enum('model_type', ['linear_regression', 'decision_tree', 'time_series', 'neural_network']).notNullable();
    table.string('training_data_source_id').notNullable();
    table.integer('historical_periods').notNullable();
    table.integer('forecast_periods').notNullable();
    table.decimal('accuracy_score', 8, 2).defaultTo(0);
    table.jsonb('predictions').defaultTo('[]');
    table.jsonb('confidence_interval').notNullable();
    table.timestamp('created_at').defaultTo(db.fn.now());
    table.timestamp('last_trained').defaultTo(db.fn.now());
    table.foreign('organization_id').references('organizations.id').onDelete('CASCADE');
    table.index('organization_id');
    table.index('model_type');
  });

  // data_sources table
  await db.schema.createTable('data_sources', (table: any) => {
    table.string('id').primary();
    table.uuid('organization_id').notNullable();
    table.string('name').notNullable();
    table.enum('type', ['database', 'api', 'spreadsheet', 'crm', 'file']).notNullable();
    table.text('connection_string');
    table.string('endpoint');
    table.string('schema');
    table.jsonb('tables').defaultTo('[]');
    table.integer('refresh_frequency').notNullable();
    table.timestamp('last_refresh');
    table.enum('status', ['active', 'inactive', 'error']).notNullable().defaultTo('active');
    table.text('error_message');
    table.timestamp('created_at').defaultTo(db.fn.now());
    table.timestamp('updated_at').defaultTo(db.fn.now());
    table.foreign('organization_id').references('organizations.id').onDelete('CASCADE');
    table.index('organization_id');
    table.index('status');
  });
}

export async function down(db: any): Promise<void> {
  await db.schema.dropTableIfExists('data_sources');
  await db.schema.dropTableIfExists('predictive_metrics');
  await db.schema.dropTableIfExists('cohorts');
  await db.schema.dropTableIfExists('funnels');
  await db.schema.dropTableIfExists('analytics_events');
  await db.schema.dropTableIfExists('kpis');
  await db.schema.dropTableIfExists('metrics');
  await db.schema.dropTableIfExists('reports');
  await db.schema.dropTableIfExists('dashboard_widgets');
  await db.schema.dropTableIfExists('dashboards');
}
