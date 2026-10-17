import type { VercelRequest, VercelResponse } from '@vercel/functions';
import { SignatureService } from '../../domains/document-management/services/SignatureService';

const signatureService = new SignatureService();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const orgId = req.headers['x-organization-id'] as string;
  const workflowId = req.query.workflowId as string;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  const offset = parseInt(req.query.offset as string) || 0;

  if (!orgId || !workflowId) {
    return res.status(400).json({ error: 'Missing required fields: workflowId' });
  }

  try {
    const workflow = signatureService.getWorkflowById(orgId, workflowId);
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    const signatures = signatureService.getSignaturesByWorkflow(orgId, workflowId, limit, offset);
    const status = signatureService.getSignatureStatus(orgId, workflowId);

    return res.status(200).json({ signatures, status });
  } catch (error) {
    console.error('Error retrieving signatures:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
