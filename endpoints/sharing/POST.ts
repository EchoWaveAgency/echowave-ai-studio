import type { VercelRequest, VercelResponse } from '@vercel/functions';
import { SharingService } from '../../domains/document-management/services/SharingService';

const sharingService = new SharingService();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { documentId, createdBy, accessLevel, expiresAt, passwordProtected, passwordHash, sharedWith, maxDownloads } = req.body;

  if (!documentId || !createdBy || !accessLevel || !expiresAt) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const link = sharingService.createSharingLink(
      documentId,
      createdBy,
      accessLevel,
      new Date(expiresAt),
      passwordProtected || false,
      passwordHash,
      sharedWith,
      maxDownloads
    );

    return res.status(201).json(link);
  } catch (error) {
    console.error('Error creating sharing link:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
