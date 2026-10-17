import { Request, Response } from "express";
import { DeliverableService } from "../../domains/delivery/services/DeliverableService";

const deliverableService = new DeliverableService();

export default async (req: Request, res: Response) => {
  const organizationId = req.headers["x-organization-id"] as string;
  const userId = req.headers["x-user-id"] as string;

  if (!organizationId || !userId) {
    return res.status(400).json({ error: "Missing required headers" });
  }

  const { projectId, name, description, type, assignedToId, dueDate, acceptanceCriteria, milestoneId, phaseId } = req.body;

  if (!projectId || !name || !type || !assignedToId || !dueDate) {
    return res.status(400).json({
      error: "Missing required fields: projectId, name, type, assignedToId, dueDate",
    });
  }

  try {
    const deliverable = deliverableService.createDeliverable(
      organizationId,
      projectId,
      {
        name,
        description,
        type,
        assignedToId,
        dueDate: new Date(dueDate),
        acceptanceCriteria,
        milestoneId,
        phaseId,
      },
      userId
    );

    res.status(201).json(deliverable);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};
