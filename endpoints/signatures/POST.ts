import type { VercelRequest, VercelResponse } from '@vercel/functions';
import { SignatureService } from '../../domains/document-management/services/SignatureService';

const signatureService = new SignatureService();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const orgId = req.headers['x-organization-id'] as string;
  const { workflowId, signatoryId, method, signatureImageUrl, signatureData, ipAddress, userAgent, certificateThumbprint } = req.body;

  if (!orgId || !workflowId || !signatoryId || !method || !signatureImageUrl || !ipAddress) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const signature = signatureService.addSignature(
      orgId,
      workflowId,
      signatoryId,
      method,
      signatureImageUrl,
      signatureData || {},
      ipAddress,
      userAgent || 'unknown',
      certificateThumbprint
    );

    if (!signature) {
      return res.status(404).json({ error: 'Workflow or signatory not found' });
    }

    return res.status(201).json(signature);
  } catch (error) {
    console.error('Error recording signature:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
