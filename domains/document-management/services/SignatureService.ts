import { v4 as uuidv4 } from 'uuid';
import {
  Document,
  DocumentSignature,
  DocumentSignatory,
  SignatureStatus,
  SignatureMethod,
  SignatureWorkflow,
} from '../models';

export class SignatureService {
  private signatureStorage = new Map<string, DocumentSignature>();
  private workflowStorage = new Map<string, SignatureWorkflow>();
  private signatoryStorage = new Map<string, DocumentSignatory>();

  createSignatureWorkflow(
    organizationId: string,
    documentId: string,
    workflowName: string,
    signatories: DocumentSignatory[],
    expiresAt?: Date
  ): SignatureWorkflow {
    if (!signatories || signatories.length === 0) {
      throw new Error('At least one signatory is required');
    }

    const workflowId = uuidv4();
    const workflow: SignatureWorkflow = {
      id: workflowId,
      organizationId,
      documentId,
      workflowName,
      signatories: signatories.map((s, index) => ({
        ...s,
        signingOrder: index + 1,
        status: SignatureStatus.PENDING,
      })),
      status: 'pending',
      startedAt: new Date(),
      expiresAt: expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    };

    this.workflowStorage.set(workflowId, workflow);
    signatories.forEach((s) => this.signatoryStorage.set(s.id, s));

    return workflow;
  }

  getWorkflowById(organizationId: string, workflowId: string): SignatureWorkflow | null {
    const workflow = this.workflowStorage.get(workflowId);
    if (!workflow || workflow.organizationId !== organizationId) {
      return null;
    }
    return workflow;
  }

  getDocumentWorkflows(
    organizationId: string,
    documentId: string,
    limit: number = 20,
    offset: number = 0
  ): SignatureWorkflow[] {
    return Array.from(this.workflowStorage.values())
      .filter(
        (w) =>
          w.organizationId === organizationId && w.documentId === documentId
      )
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
      .slice(offset, offset + limit);
  }

  addSignature(
    organizationId: string,
    workflowId: string,
    signatoryId: string,
    method: SignatureMethod,
    signatureImageUrl: string,
    signatureData: Record<string, any>,
    ipAddress: string,
    userAgent: string,
    certificateThumbprint?: string
  ): DocumentSignature | null {
    const workflow = this.workflowStorage.get(workflowId);
    if (!workflow || workflow.organizationId !== organizationId) {
      return null;
    }

    const signatory = workflow.signatories.find((s) => s.id === signatoryId);
    if (!signatory) {
      return null;
    }

    const signature: DocumentSignature = {
      id: uuidv4(),
      documentId: workflow.documentId,
      signatoryId,
      method,
      timestamp: new Date(),
      signatureImageUrl,
      signatureData,
      ipAddress,
      userAgent,
      certificateThumbprint,
      status: SignatureStatus.SIGNED,
    };

    this.signatureStorage.set(signature.id, signature);

    signatory.status = SignatureStatus.SIGNED;
    signatory.signedAt = new Date();
    signatory.signatureImageUrl = signatureImageUrl;
    signatory.ipAddress = ipAddress;
    signatory.userAgent = userAgent;

    workflow.status = 'in_progress';
    const allSigned = workflow.signatories.every((s) => s.status === SignatureStatus.SIGNED);
    if (allSigned) {
      workflow.status = 'completed';
      workflow.completedAt = new Date();
    }

    this.workflowStorage.set(workflowId, workflow);

    return signature;
  }

  getSignaturesByWorkflow(
    organizationId: string,
    workflowId: string,
    limit: number = 50,
    offset: number = 0
  ): DocumentSignature[] {
    const workflow = this.workflowStorage.get(workflowId);
    if (!workflow || workflow.organizationId !== organizationId) {
      return [];
    }

    return Array.from(this.signatureStorage.values())
      .filter((sig) => sig.documentId === workflow.documentId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(offset, offset + limit);
  }

  getSignaturesBySignatory(
    organizationId: string,
    signatoryId: string,
    limit: number = 50,
    offset: number = 0
  ): DocumentSignature[] {
    return Array.from(this.signatureStorage.values())
      .filter((sig) => sig.signatoryId === signatoryId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(offset, offset + limit);
  }

  rejectSignature(
    organizationId: string,
    workflowId: string,
    signatoryId: string,
    rejectionReason: string
  ): DocumentSignatory | null {
    const workflow = this.workflowStorage.get(workflowId);
    if (!workflow || workflow.organizationId !== organizationId) {
      return null;
    }

    const signatory = workflow.signatories.find((s) => s.id === signatoryId);
    if (!signatory) {
      return null;
    }

    signatory.status = SignatureStatus.REJECTED;
    signatory.rejectionReason = rejectionReason;

    workflow.status = 'failed';

    this.workflowStorage.set(workflowId, workflow);

    return signatory;
  }

  validateSignature(
    organizationId: string,
    signatureId: string,
    certificateChain?: string[]
  ): boolean {
    const signature = this.signatureStorage.get(signatureId);
    if (!signature) {
      return false;
    }

    const isValid =
      signature.status === SignatureStatus.SIGNED &&
      signature.timestamp &&
      signature.signatureImageUrl &&
      signature.ipAddress;

    if (isValid && signature.method === 'digital_signature' && certificateChain) {
      signature.validatedAt = new Date();
      this.signatureStorage.set(signatureId, signature);
    }

    return isValid;
  }

  getSignatureStatus(
    organizationId: string,
    workflowId: string
  ): { signedCount: number; pendingCount: number; rejectedCount: number; completionPercentage: number } {
    const workflow = this.workflowStorage.get(workflowId);
    if (!workflow || workflow.organizationId !== organizationId) {
      return { signedCount: 0, pendingCount: 0, rejectedCount: 0, completionPercentage: 0 };
    }

    const signedCount = workflow.signatories.filter(
      (s) => s.status === SignatureStatus.SIGNED
    ).length;
    const pendingCount = workflow.signatories.filter(
      (s) => s.status === SignatureStatus.PENDING
    ).length;
    const rejectedCount = workflow.signatories.filter(
      (s) => s.status === SignatureStatus.REJECTED
    ).length;
    const totalSignatories = workflow.signatories.length;
    const completionPercentage =
      totalSignatories > 0 ? Math.round((signedCount / totalSignatories) * 100) : 0;

    return { signedCount, pendingCount, rejectedCount, completionPercentage };
  }

  escalateWorkflow(
    organizationId: string,
    workflowId: string,
    escalationReason: string
  ): SignatureWorkflow | null {
    const workflow = this.workflowStorage.get(workflowId);
    if (!workflow || workflow.organizationId !== organizationId) {
      return null;
    }

    workflow.escalatedAt = new Date();
    workflow.escalationReason = escalationReason;

    this.workflowStorage.set(workflowId, workflow);

    return workflow;
  }

  resendSignatureRequest(
    organizationId: string,
    workflowId: string,
    signatoryId: string
  ): DocumentSignatory | null {
    const workflow = this.workflowStorage.get(workflowId);
    if (!workflow || workflow.organizationId !== organizationId) {
      return null;
    }

    const signatory = workflow.signatories.find((s) => s.id === signatoryId);
    if (!signatory || signatory.status !== SignatureStatus.PENDING) {
      return null;
    }

    return signatory;
  }

  expireWorkflow(organizationId: string, workflowId: string): SignatureWorkflow | null {
    const workflow = this.workflowStorage.get(workflowId);
    if (!workflow || workflow.organizationId !== organizationId) {
      return null;
    }

    if (new Date() > workflow.expiresAt!) {
      workflow.status = 'failed';
      workflow.signatories.forEach((s) => {
        if (s.status === SignatureStatus.PENDING) {
          s.status = SignatureStatus.EXPIRED;
        }
      });

      this.workflowStorage.set(workflowId, workflow);

      return workflow;
    }

    return null;
  }

  getSignatureChain(
    organizationId: string,
    workflowId: string
  ): Array<{ signatory: DocumentSignatory; signature: DocumentSignature | null }> {
    const workflow = this.workflowStorage.get(workflowId);
    if (!workflow || workflow.organizationId !== organizationId) {
      return [];
    }

    return workflow.signatories
      .sort((a, b) => a.signingOrder - b.signingOrder)
      .map((signatory) => {
        const signature = Array.from(this.signatureStorage.values()).find(
          (sig) => sig.signatoryId === signatory.id && sig.documentId === workflow.documentId
        );

        return { signatory, signature: signature || null };
      });
  }

  downloadSignedDocument(
    organizationId: string,
    workflowId: string,
    format: 'pdf' | 'zip' = 'pdf'
  ): { fileUrl: string; filename: string } | null {
    const workflow = this.workflowStorage.get(workflowId);
    if (!workflow || workflow.organizationId !== organizationId) {
      return null;
    }

    if (workflow.status !== 'completed') {
      return null;
    }

    const filename =
      format === 'pdf'
        ? `signed-document-${workflow.documentId}.pdf`
        : `signed-document-${workflow.documentId}.zip`;

    return {
      fileUrl: `https://documents.example.com/${filename}`,
      filename,
    };
  }

  cancelWorkflow(organizationId: string, workflowId: string): SignatureWorkflow | null {
    const workflow = this.workflowStorage.get(workflowId);
    if (!workflow || workflow.organizationId !== organizationId) {
      return null;
    }

    if (
      workflow.status === 'completed' ||
      workflow.status === 'failed'
    ) {
      return null;
    }

    workflow.status = 'failed';
    this.workflowStorage.set(workflowId, workflow);

    return workflow;
  }
}
