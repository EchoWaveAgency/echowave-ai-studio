import type { VercelRequest, VercelResponse } from '@vercel/functions';
import { ComplianceService } from '../../domains/document-management/services/ComplianceService';

const complianceService = new ComplianceService();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const orgId = req.headers['x-organization-id'] as string;
  const documentId = req.query.documentId as string;
  const reportType = req.query.reportType as string;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  const offset = parseInt(req.query.offset as string) || 0;

  if (!orgId) {
    return res.status(400).json({ error: 'Missing required header: x-organization-id' });
  }

  try {
    if (documentId) {
      const auditLogs = complianceService.getDocumentAuditLogs(orgId, documentId, limit, offset);
      const status = complianceService.checkComplianceStatus(orgId, documentId);
      return res.status(200).json({ auditLogs, status });
    }

    if (reportType) {
      const reports = complianceService.getOrganizationReports(orgId, reportType as any, limit, offset);
      return res.status(200).json(reports);
    }

    return res.status(400).json({ error: 'Must provide documentId or reportType' });
  } catch (error) {
    console.error('Error retrieving compliance data:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
