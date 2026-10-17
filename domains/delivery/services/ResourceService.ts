import {
  ResourceCapacity,
  ResourceAllocation,
  ResourceRole,
} from "../models/index";

export class ResourceService {
  private capacities = new Map<string, ResourceCapacity>();
  private capacityIdCounter = 1;

  // Create Resource Capacity
  createCapacity(
    organizationId: string,
    userId: string,
    weekStarting: Date,
    totalAvailableHours: number
  ): ResourceCapacity {
    const capacity: ResourceCapacity = {
      id: `capacity_${organizationId}_${this.capacityIdCounter++}`,
      organization_id: organizationId,
      user_id: userId,
      week_starting: weekStarting,
      total_available_hours: totalAvailableHours,
      allocated_hours: 0,
      available_hours: totalAvailableHours,
      utilization_percentage: 0,
      allocations: [],
    };

    this.capacities.set(capacity.id, capacity);
    return capacity;
  }

  // Get Resource Capacity
  getCapacity(organizationId: string, capacityId: string): ResourceCapacity {
    const capacity = this.capacities.get(capacityId);
    if (!capacity || capacity.organization_id !== organizationId) {
      throw new Error("Resource capacity not found");
    }
    return capacity;
  }

  // Get User Capacity for Week
  getUserCapacity(organizationId: string, userId: string, weekStarting: Date): ResourceCapacity | null {
    for (const capacity of this.capacities.values()) {
      if (
        capacity.organization_id === organizationId &&
        capacity.user_id === userId &&
        capacity.week_starting.getTime() === weekStarting.getTime()
      ) {
        return capacity;
      }
    }
    return null;
  }

  // Allocate Hours to Project
  allocateHours(
    organizationId: string,
    capacityId: string,
    projectId: string,
    taskId: string | undefined,
    hoursAllocated: number,
    role: ResourceRole
  ): ResourceCapacity {
    const capacity = this.getCapacity(organizationId, capacityId);

    if (hoursAllocated > capacity.available_hours) {
      throw new Error(
        `Cannot allocate ${hoursAllocated} hours. Only ${capacity.available_hours} available.`
      );
    }

    const allocation: ResourceAllocation = {
      project_id: projectId,
      task_id: taskId,
      hours_allocated: hoursAllocated,
      role: role,
    };

    capacity.allocations.push(allocation);
    capacity.allocated_hours += hoursAllocated;
    capacity.available_hours = capacity.total_available_hours - capacity.allocated_hours;
    capacity.utilization_percentage = (capacity.allocated_hours / capacity.total_available_hours) * 100;

    return capacity;
  }

  // Remove Allocation
  removeAllocation(organizationId: string, capacityId: string, projectId: string, taskId?: string): ResourceCapacity {
    const capacity = this.getCapacity(organizationId, capacityId);

    const allocationIndex = capacity.allocations.findIndex(
      (a) => a.project_id === projectId && a.task_id === taskId
    );

    if (allocationIndex === -1) {
      throw new Error("Allocation not found");
    }

    const allocation = capacity.allocations[allocationIndex];
    capacity.allocated_hours -= allocation.hours_allocated;
    capacity.available_hours = capacity.total_available_hours - capacity.allocated_hours;
    capacity.utilization_percentage = (capacity.allocated_hours / capacity.total_available_hours) * 100;

    capacity.allocations.splice(allocationIndex, 1);
    return capacity;
  }

  // Get Organization Resource Utilization
  getOrganizationUtilization(organizationId: string): {
    totalAvailableHours: number;
    totalAllocatedHours: number;
    averageUtilization: number;
    byUser: Array<{
      userId: string;
      utilization: number;
      allocatedHours: number;
      availableHours: number;
    }>;
  } {
    const capacities = Array.from(this.capacities.values()).filter(
      (c) => c.organization_id === organizationId
    );

    const totalAvailable = capacities.reduce((sum, c) => sum + c.total_available_hours, 0);
    const totalAllocated = capacities.reduce((sum, c) => sum + c.allocated_hours, 0);
    const avgUtilization = totalAvailable > 0 ? (totalAllocated / totalAvailable) * 100 : 0;

    const byUser: Array<{
      userId: string;
      utilization: number;
      allocatedHours: number;
      availableHours: number;
    }> = [];

    const userMap = new Map<string, ResourceCapacity[]>();
    capacities.forEach((c) => {
      if (!userMap.has(c.user_id)) {
        userMap.set(c.user_id, []);
      }
      userMap.get(c.user_id)!.push(c);
    });

    userMap.forEach((userCapacities, userId) => {
      const userAvailable = userCapacities.reduce((sum, c) => sum + c.total_available_hours, 0);
      const userAllocated = userCapacities.reduce((sum, c) => sum + c.allocated_hours, 0);
      const userUtilization = userAvailable > 0 ? (userAllocated / userAvailable) * 100 : 0;

      byUser.push({
        userId,
        utilization: userUtilization,
        allocatedHours: userAllocated,
        availableHours: userAvailable - userAllocated,
      });
    });

    return {
      totalAvailableHours: totalAvailable,
      totalAllocatedHours: totalAllocated,
      averageUtilization: avgUtilization,
      byUser,
    };
  }

  // Get Available Resources for Period
  getAvailableResources(organizationId: string, startDate: Date, endDate: Date, minimumAvailable: number = 0): Array<{
    userId: string;
    availableHours: number;
    utilizationPercentage: number;
  }> {
    const capacities = Array.from(this.capacities.values()).filter(
      (c) =>
        c.organization_id === organizationId &&
        c.week_starting >= startDate &&
        c.week_starting <= endDate &&
        c.available_hours >= minimumAvailable
    );

    const resourceMap = new Map<
      string,
      { totalAvailable: number; totalUtilization: number; count: number }
    >();

    capacities.forEach((c) => {
      if (!resourceMap.has(c.user_id)) {
        resourceMap.set(c.user_id, { totalAvailable: 0, totalUtilization: 0, count: 0 });
      }
      const existing = resourceMap.get(c.user_id)!;
      existing.totalAvailable += c.available_hours;
      existing.totalUtilization += c.utilization_percentage;
      existing.count += 1;
    });

    const result: Array<{
      userId: string;
      availableHours: number;
      utilizationPercentage: number;
    }> = [];

    resourceMap.forEach((data, userId) => {
      result.push({
        userId,
        availableHours: data.totalAvailable,
        utilizationPercentage: data.totalUtilization / data.count,
      });
    });

    return result;
  }

  // Get Team Capacity Summary
  getTeamCapacitySummary(organizationId: string, userIds: string[], weekStarting: Date): {
    teamAvailableHours: number;
    teamAllocatedHours: number;
    teamUtilization: number;
    members: Array<{
      userId: string;
      availableHours: number;
      allocatedHours: number;
      utilization: number;
    }>;
  } {
    const capacities = Array.from(this.capacities.values()).filter(
      (c) =>
        c.organization_id === organizationId &&
        userIds.includes(c.user_id) &&
        c.week_starting.getTime() === weekStarting.getTime()
    );

    const teamAvailable = capacities.reduce((sum, c) => sum + c.total_available_hours, 0);
    const teamAllocated = capacities.reduce((sum, c) => sum + c.allocated_hours, 0);
    const teamUtilization = teamAvailable > 0 ? (teamAllocated / teamAvailable) * 100 : 0;

    const members = capacities.map((c) => ({
      userId: c.user_id,
      availableHours: c.available_hours,
      allocatedHours: c.allocated_hours,
      utilization: c.utilization_percentage,
    }));

    return {
      teamAvailableHours: teamAvailable,
      teamAllocatedHours: teamAllocated,
      teamUtilization,
      members,
    };
  }
}
