import type { VercelRequest, VercelResponse } from '@vercel/functions';
import { SharingService } from '../../domains/document-management/services/SharingService';

const sharingService = new SharingService();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const documentId = req.query.documentId as string;
  const token = req.query.token as string;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  const offset = parseInt(req.query.offset as string) || 0;

  try {
    if (token) {
      const link = sharingService.getSharingLinkByToken(token);
      if (!link) {
        return res.status(404).json({ error: 'Sharing link not found or expired' });
      }
      return res.status(200).json(link);
    }

    if (documentId) {
      const links = sharingService.getSharingLinksForDocument(documentId, limit, offset);
      const stats = sharingService.getAccessStatistics(documentId);
      return res.status(200).json({ links, stats });
    }

    return res.status(400).json({ error: 'Must provide documentId or token' });
  } catch (error) {
    console.error('Error retrieving sharing links:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
