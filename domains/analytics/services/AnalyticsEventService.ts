import { AnalyticsEvent, AnalyticsFunnel, FunnelStep, Cohort, CohortCriteria } from '../models/index.js';

export class AnalyticsEventService {
  private events: AnalyticsEvent[] = [];
  private funnels: Map<string, AnalyticsFunnel> = new Map();
  private cohorts: Map<string, Cohort> = new Map();
  private nextFunnelId = 1;
  private nextCohortId = 1;

  trackEvent(
    organization_id: string,
    event_type: string,
    entity_type: string,
    entity_id: string,
    user_id?: string,
    properties?: Record<string, any>,
    context?: any
  ): AnalyticsEvent {
    if (!event_type || !entity_type || !entity_id) {
      throw new Error('event_type, entity_type, and entity_id are required');
    }

    const id = `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const event: AnalyticsEvent = {
      id,
      organization_id,
      event_type,
      entity_type,
      entity_id,
      user_id,
      properties: properties || {},
      timestamp: new Date(),
      context
    };

    this.events.push(event);
    return event;
  }

  getEventsByType(organization_id: string, event_type: string): AnalyticsEvent[] {
    return this.events.filter(e => 
      e.organization_id === organization_id && e.event_type === event_type
    );
  }

  getEventsByEntity(organization_id: string, entity_type: string, entity_id: string): AnalyticsEvent[] {
    return this.events.filter(e =>
      e.organization_id === organization_id && e.entity_type === entity_type && e.entity_id === entity_id
    );
  }

  getEventsByUser(organization_id: string, user_id: string): AnalyticsEvent[] {
    return this.events.filter(e =>
      e.organization_id === organization_id && e.user_id === user_id
    );
  }

  getEventsByDateRange(
    organization_id: string,
    start_date: Date,
    end_date: Date
  ): AnalyticsEvent[] {
    return this.events.filter(e =>
      e.organization_id === organization_id &&
      e.timestamp >= start_date &&
      e.timestamp <= end_date
    );
  }

  getEventCount(organization_id: string, event_type?: string): number {
    return this.getEventsByType(organization_id, event_type || '').length;
  }

  createFunnel(
    organization_id: string,
    name: string,
    description: string,
    steps: Array<{ name: string; event_type: string }>
  ): AnalyticsFunnel {
    if (!name || steps.length < 2) {
      throw new Error('Funnel name and at least 2 steps are required');
    }

    const id = `funnel_${this.nextFunnelId++}`;
    
    // Calculate conversion rates
    const funnelSteps: FunnelStep[] = steps.map((step, index) => {
      const user_count = new Set(
        this.events
          .filter(e => e.organization_id === organization_id && e.event_type === step.event_type)
          .map(e => e.user_id)
      ).size;

      const next_step_count = index < steps.length - 1
        ? new Set(
            this.events
              .filter(e => e.organization_id === organization_id && e.event_type === steps[index + 1].event_type)
              .map(e => e.user_id)
          ).size
        : user_count;

      const conversion_to_next = user_count > 0 ? (next_step_count / user_count) * 100 : 0;

      return {
        step_number: index + 1,
        name: step.name,
        event_type: step.event_type,
        user_count,
        conversion_to_next
      };
    });

    const first_step = funnelSteps[0]?.user_count || 1;
    const last_step = funnelSteps[funnelSteps.length - 1]?.user_count || 1;
    const overall_conversion = (last_step / first_step) * 100;

    const funnel: AnalyticsFunnel = {
      id,
      organization_id,
      name,
      description,
      steps: funnelSteps,
      conversion_rate: overall_conversion,
      created_at: new Date()
    };

    this.funnels.set(id, funnel);
    return funnel;
  }

  getFunnelById(organization_id: string, funnel_id: string): AnalyticsFunnel | null {
    const funnel = this.funnels.get(funnel_id);
    if (!funnel || funnel.organization_id !== organization_id) {
      return null;
    }
    return funnel;
  }

  getOrganizationFunnels(organization_id: string): AnalyticsFunnel[] {
    return Array.from(this.funnels.values()).filter(f => f.organization_id === organization_id);
  }

  deleteFunnel(organization_id: string, funnel_id: string): boolean {
    const funnel = this.getFunnelById(organization_id, funnel_id);
    if (!funnel) return false;

    return this.funnels.delete(funnel_id);
  }

  createCohort(
    organization_id: string,
    name: string,
    description: string,
    criteria: CohortCriteria
  ): Cohort {
    if (!name || !criteria) {
      throw new Error('Cohort name and criteria are required');
    }

    const id = `cohort_${this.nextCohortId++}`;
    
    // Count members matching criteria
    const members = new Set(
      this.events
        .filter(e => e.organization_id === organization_id)
        .map(e => e.user_id)
    ).size;

    const cohort: Cohort = {
      id,
      organization_id,
      name,
      description,
      criteria,
      member_count: members,
      created_date: new Date(),
      last_updated: new Date()
    };

    this.cohorts.set(id, cohort);
    return cohort;
  }

  getCohortById(organization_id: string, cohort_id: string): Cohort | null {
    const cohort = this.cohorts.get(cohort_id);
    if (!cohort || cohort.organization_id !== organization_id) {
      return null;
    }
    return cohort;
  }

  getOrganizationCohorts(organization_id: string): Cohort[] {
    return Array.from(this.cohorts.values()).filter(c => c.organization_id === organization_id);
  }

  updateCohort(
    organization_id: string,
    cohort_id: string,
    updates: Partial<Cohort>
  ): Cohort | null {
    const cohort = this.getCohortById(organization_id, cohort_id);
    if (!cohort) return null;

    const updated = {
      ...cohort,
      ...updates,
      id: cohort.id,
      organization_id: cohort.organization_id,
      created_date: cohort.created_date,
      last_updated: new Date()
    };

    this.cohorts.set(cohort_id, updated);
    return updated;
  }

  deleteCohort(organization_id: string, cohort_id: string): boolean {
    const cohort = this.getCohortById(organization_id, cohort_id);
    if (!cohort) return false;

    return this.cohorts.delete(cohort_id);
  }

  getEventSummary(organization_id: string): {
    total_events: number;
    unique_users: number;
    unique_event_types: number;
    events_last_24h: number;
  } {
    const org_events = this.events.filter(e => e.organization_id === organization_id);
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    return {
      total_events: org_events.length,
      unique_users: new Set(org_events.map(e => e.user_id).filter(Boolean)).size,
      unique_event_types: new Set(org_events.map(e => e.event_type)).size,
      events_last_24h: org_events.filter(e => e.timestamp >= yesterday).length
    };
  }
}
