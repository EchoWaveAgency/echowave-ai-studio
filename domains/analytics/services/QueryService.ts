import { getConnection } from '../../../platform/database/connection';
import { ValidationError, NotFoundError } from '../../../platform/errors/errors';
import { QueryResult } from '../models/index';

export const queryService = {
  async executeQuery(organizationId: string, userId: string, query: string, timeout: number = 30000): Promise<QueryResult> {
    if (!query?.trim()) {
      throw new ValidationError('Query is required');
    }

    // Validate query doesn't contain dangerous operations
    const upperQuery = query.toUpperCase();
    const forbiddenPatterns = ['DROP', 'DELETE', 'TRUNCATE', 'ALTER', 'CREATE', 'GRANT', 'REVOKE'];
    for (const pattern of forbiddenPatterns) {
      if (upperQuery.includes(pattern)) {
        throw new ValidationError(`Query cannot contain ${pattern} operations`);
      }
    }

    const connection = await getConnection();
    const startTime = Date.now();

    try {
      const result = await connection.query(query, [], { timeout });
      const executionTime = Date.now() - startTime;

      const queryResult: QueryResult = {
        id: generateId(),
        organizationId,
        query,
        result: result.rows,
        rowCount: result.rows.length,
        executionTimeMs: executionTime,
        executedAt: new Date().toISOString(),
        createdBy: userId,
      };

      // Log the query execution
      await this.logQueryExecution(organizationId, userId, query, result.rows.length, executionTime);

      return queryResult;
    } catch (error: any) {
      throw new ValidationError(`Query execution failed: ${error.message}`);
    }
  },

  async logQueryExecution(organizationId: string, userId: string, query: string, rowCount: number, executionTimeMs: number): Promise<void> {
    const connection = await getConnection();
    await connection.query(
      `INSERT INTO query_logs (organization_id, executed_by, query_text, row_count, execution_time_ms, executed_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [organizationId, userId, query, rowCount, executionTimeMs]
    );
  },

  async getQueryLog(organizationId: string, limit: number = 100, offset: number = 0): Promise<{ items: any[]; total: number }> {
    const connection = await getConnection();
    const countResult = await connection.query(
      'SELECT COUNT(*) FROM query_logs WHERE organization_id = $1',
      [organizationId]
    );

    const result = await connection.query(
      'SELECT * FROM query_logs WHERE organization_id = $1 ORDER BY executed_at DESC LIMIT $2 OFFSET $3',
      [organizationId, limit, offset]
    );

    return { items: result.rows, total: parseInt(countResult.rows[0].count, 10) };
  },

  async getSlowQueries(organizationId: string, minTimeMs: number = 1000, limit: number = 50): Promise<any[]> {
    const connection = await getConnection();
    const result = await connection.query(
      'SELECT * FROM query_logs WHERE organization_id = $1 AND execution_time_ms > $2 ORDER BY execution_time_ms DESC LIMIT $3',
      [organizationId, minTimeMs, limit]
    );

    return result.rows;
  },

  async getQueryStats(organizationId: string, startDate?: string, endDate?: string): Promise<Record<string, any>> {
    const connection = await getConnection();
    let query = 'SELECT COUNT(*) as total_queries, AVG(execution_time_ms) as avg_time, MAX(execution_time_ms) as max_time, SUM(row_count) as total_rows FROM query_logs WHERE organization_id = $1';
    const params: any[] = [organizationId];

    if (startDate) {
      query += ' AND executed_at >= $' + (params.length + 1);
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND executed_at <= $' + (params.length + 1);
      params.push(endDate);
    }

    const result = await connection.query(query, params);
    return result.rows[0];
  },

  async deleteOldLogs(organizationId: string, daysOld: number = 30): Promise<number> {
    const connection = await getConnection();
    const result = await connection.query(
      `DELETE FROM query_logs WHERE organization_id = $1 AND executed_at < NOW() - INTERVAL '${daysOld} days'`,
      [organizationId]
    );

    return result.rowCount;
  },

  async validateQuery(query: string): Promise<boolean> {
    if (!query?.trim()) {
      return false;
    }

    const upperQuery = query.toUpperCase();
    const forbiddenPatterns = ['DROP', 'DELETE', 'TRUNCATE', 'ALTER', 'CREATE', 'GRANT', 'REVOKE'];
    for (const pattern of forbiddenPatterns) {
      if (upperQuery.includes(pattern)) {
        return false;
      }
    }

    return true;
  },
};

function generateId(): string {
  return `qr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
