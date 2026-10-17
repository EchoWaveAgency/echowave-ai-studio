import { messageLogService } from '../../domains/communications/services/MessageLogService';

export default async function handler(req: any) {
  if (req.method !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const organizationId = req.headers['x-organization-id'];
    const messageId = req.query?.messageId;
    const event = req.query?.event;
    const startDate = req.query?.startDate;
    const endDate = req.query?.endDate;
    const limit = parseInt(req.query?.limit || '100', 10);
    const offset = parseInt(req.query?.offset || '0', 10);

    if (!organizationId) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    let result;
    if (messageId) {
      const logs = await messageLogService.getMessageLogs(messageId, organizationId);
      result = { items: logs, total: logs.length };
    } else if (event) {
      result = await messageLogService.getMessageLogsByEvent(organizationId, event, limit, offset);
    } else if (startDate && endDate) {
      result = await messageLogService.getMessageLogsInDateRange(
        organizationId,
        startDate,
        endDate,
        limit,
        offset
      );
    } else {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Either messageId, event, or date range is required' }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        data: result.items,
        pagination: { limit, offset, total: result.total },
      }),
    };
  } catch (error: any) {
    console.error('Failed to list message logs:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
}
