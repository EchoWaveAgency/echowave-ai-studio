import { Request, Response } from "express";
import { DeliverableService } from "../../domains/delivery/services/DeliverableService";

const deliverableService = new DeliverableService();

export default async (req: Request, res: Response) => {
  const organizationId = req.headers["x-organization-id"] as string;
  const { projectId, deliverableId, status, approvalStatus, limit, offset } = req.query;

  if (!organizationId) {
    return res.status(400).json({ error: "Missing x-organization-id header" });
  }

  if (!projectId) {
    return res.status(400).json({ error: "Missing projectId query parameter" });
  }

  try {
    if (deliverableId) {
      const deliverable = deliverableService.getDeliverableById(organizationId, deliverableId as string);
      return res.json(deliverable);
    }

    const deliverables = deliverableService.getProjectDeliverables(
      organizationId,
      projectId as string,
      {
        status: status as any,
        approvalStatus: approvalStatus as any,
        limit: limit ? parseInt(limit as string) : 50,
        offset: offset ? parseInt(offset as string) : 0,
      }
    );

    res.json({
      data: deliverables,
      count: deliverables.length,
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};
