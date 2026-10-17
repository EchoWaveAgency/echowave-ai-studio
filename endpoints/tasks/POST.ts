import { Request, Response } from "express";
import { ProjectService } from "../../domains/delivery/services/ProjectService";

const projectService = new ProjectService();

export default async (req: Request, res: Response) => {
  const organizationId = req.headers["x-organization-id"] as string;
  const userId = req.headers["x-user-id"] as string;

  if (!organizationId || !userId) {
    return res.status(400).json({ error: "Missing required headers" });
  }

  const { projectId, title, description, assignedToId, estimatedHours, startDate, dueDate, priority, milestoneId, parentTaskId } = req.body;

  if (!projectId || !title || !assignedToId || !estimatedHours || !startDate || !dueDate) {
    return res.status(400).json({
      error: "Missing required fields: projectId, title, assignedToId, estimatedHours, startDate, dueDate",
    });
  }

  try {
    const task = projectService.addTask(
      organizationId,
      projectId,
      {
        title,
        description,
        assignedToId,
        estimatedHours,
        startDate: new Date(startDate),
        dueDate: new Date(dueDate),
        priority,
        milestoneId,
        parentTaskId,
      },
      userId
    );

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};
