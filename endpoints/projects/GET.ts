import { Request, Response } from "express";
import { ProjectService } from "../../domains/delivery/services/ProjectService";

const projectService = new ProjectService();

export default async (req: Request, res: Response) => {
  const organizationId = req.headers["x-organization-id"] as string;
  const { projectId, status, limit, offset } = req.query;

  if (!organizationId) {
    return res.status(400).json({ error: "Missing x-organization-id header" });
  }

  try {
    if (projectId) {
      const project = projectService.getProjectById(organizationId, projectId as string);
      return res.json(project);
    }

    const projects = projectService.getOrganizationProjects(organizationId, {
      status: status as any,
      limit: limit ? parseInt(limit as string) : 50,
      offset: offset ? parseInt(offset as string) : 0,
    });

    res.json({
      data: projects,
      count: projects.length,
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};
