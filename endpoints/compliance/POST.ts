import type { VercelRequest, VercelResponse } from '@vercel/functions';
import { ComplianceService } from '../../domains/document-management/services/ComplianceService';

const complianceService = new ComplianceService();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const orgId = req.headers['x-organization-id'] as string;
  const { documentId, action, actionType, performedBy, ipAddress, userAgent, changes, metadata } = req.body;

  if (!orgId || !documentId || !action || !actionType || !performedBy || !ipAddress) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const auditLog = complianceService.recordAuditLog(
      orgId,
      documentId,
      action,
      actionType,
      performedBy,
      ipAddress,
      userAgent || 'unknown',
      changes,
      metadata
    );

    return res.status(201).json(auditLog);
  } catch (error) {
    console.error('Error recording audit log:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
