import { Request, Response } from "express";
import { ProjectService } from "../../domains/delivery/services/ProjectService";

const projectService = new ProjectService();

export default async (req: Request, res: Response) => {
  const organizationId = req.headers["x-organization-id"] as string;
  const userId = req.headers["x-user-id"] as string;

  if (!organizationId || !userId) {
    return res.status(400).json({ error: "Missing required headers" });
  }

  const { name, description, clientId, projectManagerId, contractId, startDate, endDate, budget } = req.body;

  if (!name || !clientId || !projectManagerId || !startDate || !endDate) {
    return res.status(400).json({
      error: "Missing required fields: name, clientId, projectManagerId, startDate, endDate",
    });
  }

  try {
    const project = projectService.createProject(
      organizationId,
      {
        name,
        description,
        clientId,
        projectManagerId,
        contractId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        budget,
      },
      userId
    );

    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};
