import type { VercelRequest, VercelResponse } from '@vercel/functions';
import { DocumentService } from '../../domains/document-management/services/DocumentService';

const documentService = new DocumentService();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const orgId = req.headers['x-organization-id'] as string;
  const documentId = req.query.documentId as string;
  const documentType = req.query.documentType as string;
  const status = req.query.status as string;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  const offset = parseInt(req.query.offset as string) || 0;

  if (!orgId) {
    return res.status(400).json({ error: 'Missing required header: x-organization-id' });
  }

  try {
    if (documentId) {
      const document = documentService.getDocumentById(orgId, documentId);
      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }
      return res.status(200).json(document);
    }

    const documents = documentService.getOrganizationDocuments(
      orgId,
      documentType as any,
      status as any,
      limit,
      offset
    );

    return res.status(200).json(documents);
  } catch (error) {
    console.error('Error retrieving documents:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
