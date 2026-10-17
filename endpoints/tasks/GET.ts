import { Request, Response } from "express";
import { ProjectService } from "../../domains/delivery/services/ProjectService";
import { TaskStatus } from "../../domains/delivery/models/index";

const projectService = new ProjectService();

export default async (req: Request, res: Response) => {
  const organizationId = req.headers["x-organization-id"] as string;
  const { projectId, status, limit, offset } = req.query;

  if (!organizationId) {
    return res.status(400).json({ error: "Missing x-organization-id header" });
  }

  if (!projectId) {
    return res.status(400).json({ error: "Missing projectId query parameter" });
  }

  try {
    const project = projectService.getProjectById(organizationId, projectId as string);
    
    let tasks = project.tasks;
    if (status) {
      tasks = projectService.getProjectTasksByStatus(organizationId, projectId as string, status as TaskStatus);
    }

    const limitVal = limit ? parseInt(limit as string) : 50;
    const offsetVal = offset ? parseInt(offset as string) : 0;

    res.json({
      data: tasks.slice(offsetVal, offsetVal + limitVal),
      count: tasks.length,
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};
