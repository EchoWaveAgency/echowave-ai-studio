import { Request, Response } from "express";
import { RiskService } from "../../domains/delivery/services/RiskService";

const riskService = new RiskService();

export default async (req: Request, res: Response) => {
  const organizationId = req.headers["x-organization-id"] as string;
  const { projectId, riskId, status, level, limit, offset } = req.query;

  if (!organizationId) {
    return res.status(400).json({ error: "Missing x-organization-id header" });
  }

  if (!projectId) {
    return res.status(400).json({ error: "Missing projectId query parameter" });
  }

  try {
    if (riskId) {
      const risk = riskService.getRiskById(organizationId, riskId as string);
      return res.json(risk);
    }

    const risks = riskService.getProjectRisks(
      organizationId,
      projectId as string,
      {
        status: status as any,
        level: level as any,
        limit: limit ? parseInt(limit as string) : 50,
        offset: offset ? parseInt(offset as string) : 0,
      }
    );

    res.json({
      data: risks,
      count: risks.length,
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};
