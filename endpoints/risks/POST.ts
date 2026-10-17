import { Request, Response } from "express";
import { RiskService } from "../../domains/delivery/services/RiskService";

const riskService = new RiskService();

export default async (req: Request, res: Response) => {
  const organizationId = req.headers["x-organization-id"] as string;

  if (!organizationId) {
    return res.status(400).json({ error: "Missing x-organization-id header" });
  }

  const { projectId, title, description, category, probability, impact, mitigationPlan, ownerId } = req.body;

  if (!projectId || !title || probability === undefined || !impact || !ownerId) {
    return res.status(400).json({
      error: "Missing required fields: projectId, title, probability, impact, ownerId",
    });
  }

  if (probability < 0 || probability > 1) {
    return res.status(400).json({ error: "Probability must be between 0 and 1" });
  }

  try {
    const risk = riskService.createRisk(
      organizationId,
      projectId,
      {
        title,
        description,
        category,
        probability,
        impact,
        mitigationPlan,
        ownerId,
      }
    );

    res.status(201).json(risk);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};
