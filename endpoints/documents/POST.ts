import type { VercelRequest, VercelResponse } from '@vercel/functions';
import { DocumentService } from '../../domains/document-management/services/DocumentService';

const documentService = new DocumentService();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const orgId = req.headers['x-organization-id'] as string;
  const { documentName, documentType, fileUrl, fileHash, createdBy, description, templateId, metadata } = req.body;

  if (!orgId || !documentName || !documentType || !fileUrl || !fileHash || !createdBy) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const document = documentService.createDocument(
      orgId,
      documentName,
      documentType,
      fileUrl,
      fileHash,
      createdBy,
      description,
      templateId,
      metadata
    );

    return res.status(201).json(document);
  } catch (error) {
    console.error('Error creating document:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
