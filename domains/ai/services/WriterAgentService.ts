import { WriterAgentConfig } from '../models';

export class WriterAgentService {
  private config: Map<string, WriterAgentConfig> = new Map();

  constructor(private db: any) {}

  async initializeAgent(organizationId: string, config: WriterAgentConfig): Promise<void> {
    if (!['en', 'ar', 'bilingual'].includes(config.languagePreference)) {
      throw new Error('Invalid language preference');
    }

    this.config.set(organizationId, config);
  }

  async generateContent(organizationId: string, input: {
    contentType: 'proposal' | 'email' | 'social' | 'blog' | 'product_description';
    topic: string;
    tone?: string;
    targetAudience?: string;
    language?: 'en' | 'ar';
  }): Promise<{
    contentId: string;
    content: string;
    generatedAt: Date;
    wordCount: number;
  }> {
    if (!input.topic || input.topic.trim().length === 0) {
      throw new Error('Topic is required');
    }

    const templates: Record<string, string> = {
      proposal: `We are delighted to present a comprehensive proposal for ${input.topic}.

Our Approach:
- Strategic planning and analysis
- Implementation roadmap
- Quality assurance
- Post-launch support

Expected Outcomes:
- Improved efficiency
- Enhanced user engagement
- Measurable ROI

Timeline: 8-12 weeks
Investment: To be discussed`,

      email: `Subject: ${input.topic}

Dear Client,

I hope this email finds you well. I wanted to reach out regarding ${input.topic}.

We have a solution that could significantly benefit your organization. Our team has extensive experience in this area and would be happy to discuss further.

Best regards,
ECHOWAVE Team`,

      social: `Check out our latest insights on ${input.topic}! 💡

From strategy to execution, we cover everything you need to succeed. 

Ready to transform your business? Let's talk! 🚀

#Innovation #Business #Growth`,

      blog: `# ${input.topic}

${input.topic} is a crucial aspect of modern business. In this comprehensive guide, we'll explore the key strategies and best practices.

## Key Takeaways
1. Understanding the fundamentals
2. Implementation strategies
3. Measuring success
4. Common pitfalls to avoid

Read the full article on our blog for detailed insights.`,

      product_description: `Introducing our latest offering: ${input.topic}

Key Features:
- Professional design
- Easy to use
- Affordable pricing
- Excellent support

Transform the way you work with our innovative solution. Join hundreds of satisfied customers today!`,
    };

    const content = templates[input.contentType] || templates.proposal;
    const wordCount = content.split(/\s+/).length;

    return {
      contentId: `content-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      content,
      generatedAt: new Date(),
      wordCount,
    };
  }

  async draftEmail(organizationId: string, input: {
    recipient: string;
    purpose: 'followup' | 'proposal' | 'inquiry' | 'thank_you' | 'apology';
    context?: string;
  }): Promise<{
    emailId: string;
    subject: string;
    body: string;
    tone: string;
  }> {
    const purposes: Record<string, { subject: string; body: string }> = {
      followup: {
        subject: `Following Up: Let's Continue Our Conversation`,
        body: `Hi ${input.recipient},

I wanted to follow up on our previous discussion. I believe we have a great opportunity to work together.

Would you be available for a call next week to discuss further?

Best regards,
ECHOWAVE Team`,
      },
      proposal: {
        subject: `Proposal: ${input.context || 'Exciting New Opportunity'}`,
        body: `Hi ${input.recipient},

Please find attached our comprehensive proposal addressing your requirements.

I'm confident this solution will deliver significant value to your organization. Let's schedule a time to discuss the details.

Best regards,
ECHOWAVE Team`,
      },
      inquiry: {
        subject: `Quick Question About ${input.context || 'Our Services'}`,
        body: `Hi ${input.recipient},

I had a quick question regarding ${input.context || 'our services'}. 

Would you have a moment to discuss? I think this could be beneficial for both of us.

Looking forward to hearing from you.

Best regards,
ECHOWAVE Team`,
      },
      thank_you: {
        subject: `Thank You for Your Time`,
        body: `Hi ${input.recipient},

Thank you for taking the time to meet with us. We really appreciated the opportunity to discuss your needs.

We're excited about the potential to work together and will send over a proposal shortly.

Best regards,
ECHOWAVE Team`,
      },
      apology: {
        subject: `Our Apologies`,
        body: `Hi ${input.recipient},

We sincerely apologize for any inconvenience caused. We take your feedback seriously and are committed to making things right.

Let's schedule a time to discuss how we can better serve you.

Best regards,
ECHOWAVE Team`,
      },
    };

    const template = purposes[input.purpose] || purposes.followup;

    return {
      emailId: `email-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      subject: template.subject,
      body: template.body,
      tone: 'professional',
    };
  }

  async checkGrammar(organizationId: string, text: string): Promise<{
    isCorrect: boolean;
    issues: Array<{
      type: string;
      position: number;
      suggestion: string;
    }>;
    correctedText: string;
  }> {
    if (!text || text.trim().length === 0) {
      throw new Error('Text is required');
    }

    return {
      isCorrect: true,
      issues: [],
      correctedText: text,
    };
  }

  async getAgentConfig(organizationId: string): Promise<WriterAgentConfig> {
    const config = this.config.get(organizationId);
    if (!config) {
      throw new Error('Agent not initialized for organization');
    }
    return config;
  }

  async updateAgentConfig(organizationId: string, config: Partial<WriterAgentConfig>): Promise<WriterAgentConfig> {
    const current = this.config.get(organizationId);
    if (!current) {
      throw new Error('Agent not initialized for organization');
    }

    const updated = { ...current, ...config };

    if (updated.languagePreference && !['en', 'ar', 'bilingual'].includes(updated.languagePreference)) {
      throw new Error('Invalid language preference');
    }

    this.config.set(organizationId, updated);
    return updated;
  }
}
