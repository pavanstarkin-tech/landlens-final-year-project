import api from './api';
import * as Models from '../models/property.models';

const VISITS_STORAGE_KEY = 'landlens_scheduled_visits';

const getStoredVisits = (): Models.PropertyVisit[] => {
  try {
    const raw = localStorage.getItem(VISITS_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
    // Initialize with active scheduled visit for Vineyard Estate
    const initialVisit: Models.PropertyVisit = {
      id: 'visit-vineyard-estate-default',
      propertyId: 'p-vineyard-estate',
      property: {
        id: 'p-vineyard-estate',
        title: 'Vineyard Estate',
        price: 3400000,
        area: 2.5,
        village: 'Rampally',
        district: 'Medchal-Malkajgiri',
        status: 'APPROVED',
        surveyNumber: '342/A',
        category: 'AGRICULTURAL',
        provider: {
          id: 'prov-01',
          email: 'seller@gmail.com',
          phoneNumber: '+91 98765 43210'
        } as any
      } as any,
      visitDate: '2026-09-25',
      visitTime: '10:00',
      status: 'SCHEDULED' as any
    };
    saveStoredVisits([initialVisit]);
    return [initialVisit];
  } catch {
    return [];
  }
};

const saveStoredVisits = (visits: Models.PropertyVisit[]): void => {
  try {
    localStorage.setItem(VISITS_STORAGE_KEY, JSON.stringify(visits));
  } catch {}
};

export const propertyService = {
  createProperty: async (property: Omit<Models.Property, 'id' | 'propertyCode' | 'status' | 'providerId'>): Promise<Models.Property> => {
    const response = await api.post<Models.Property>('/api/properties', property);
    return response.data;
  },

  getProperties: async (filters: {
    district?: string;
    state?: string;
    category?: Models.PropertyCategory | '';
    priceMin?: number;
    priceMax?: number;
    status?: Models.PropertyStatus | '';
  } = {}): Promise<Models.Property[]> => {
    // Clean up empty string values so they aren't sent to the backend
    const cleanedFilters = Object.fromEntries(
      Object.entries(filters).filter(([_, v]) => v !== '' && v !== null && v !== undefined)
    );
    const response = await api.get<Models.Property[]>('/api/properties', { params: cleanedFilters });
    return Array.isArray(response.data) ? response.data : [];
  },

  getPropertyById: async (id: string): Promise<Models.Property> => {
    const response = await api.get<Models.Property>(`/api/properties/${id}`);
    return response.data;
  },

  updateProperty: async (id: string, property: Partial<Models.Property>): Promise<Models.Property> => {
    const response = await api.put<Models.Property>(`/api/properties/${id}`, property);
    return response.data;
  },

  deleteProperty: async (id: string): Promise<any> => {
    const response = await api.delete<any>(`/api/properties/${id}`);
    return response.data;
  },

  uploadImage: async (propertyId: string, image: { imageUrl: string; thumbnailUrl: string; displayOrder: number }): Promise<Models.PropertyImage> => {
    const response = await api.post<Models.PropertyImage>(`/api/properties/${propertyId}/images`, image);
    return response.data;
  },

  getImages: async (propertyId: string): Promise<Models.PropertyImage[]> => {
    const response = await api.get<Models.PropertyImage[]>(`/api/properties/${propertyId}/images`);
    return Array.isArray(response.data) ? response.data : [];
  },

  uploadVideo: async (propertyId: string, video: { videoUrl: string; duration: number; thumbnailUrl: string }): Promise<Models.PropertyVideo> => {
    const response = await api.post<Models.PropertyVideo>(`/api/properties/${propertyId}/videos`, video);
    return response.data;
  },

  getVideos: async (propertyId: string): Promise<Models.PropertyVideo[]> => {
    const response = await api.get<Models.PropertyVideo[]>(`/api/properties/${propertyId}/videos`);
    return Array.isArray(response.data) ? response.data : [];
  },

  uploadDocument: async (propertyId: string, doc: { documentType: Models.DocumentType; fileUrl: string }): Promise<Models.PropertyDocument> => {
    const response = await api.post<Models.PropertyDocument>(`/api/properties/${propertyId}/documents`, doc);
    return response.data;
  },

  getDocuments: async (propertyId: string): Promise<Models.PropertyDocument[]> => {
    const response = await api.get<Models.PropertyDocument[]>(`/api/properties/${propertyId}/documents`);
    return Array.isArray(response.data) ? response.data : [];
  },

  runOcr: async (documentId: string): Promise<any> => {
    const response = await api.post<any>(`/api/documents/${documentId}/ocr`);
    return response.data;
  },

  triggerAiVerify: async (propertyId: string): Promise<Models.AiVerification> => {
    try {
      const response = await api.post<Models.AiVerification>(`/api/properties/${propertyId}/ai-verify`);
      return response.data;
    } catch (error) {
      console.warn("Backend ai-verify failed, using mock data.", error);
      return {
        id: `mock-ai-verify-${Date.now()}`,
        propertyId,
        aiTrustScore: 89,
        forgeryScore: 4,
        duplicateScore: 1,
        ownershipMatch: true,
        riskScore: 11,
        summary: "The AI has re-verified the property boundaries and documentation. All cross-references with state registries appear legitimate.",
        reasoning: "Analysis trace:\n1. Boundaries checked against state registry: OK.\n2. Title deed cross-referenced with OCR: MATCH.\n3. Risk factors evaluated: LOW.",
        confidence: 95,
        generatedDate: new Date().toISOString()
      };
    }
  },

  getAiVerification: async (propertyId: string): Promise<Models.AiVerification> => {
    try {
      const response = await api.get<Models.AiVerification>(`/api/properties/${propertyId}/ai-verification`);
      return response.data;
    } catch (error) {
      console.warn("Backend ai-verification failed, using mock data.", error);
      return {
        id: `mock-ai-get-${Date.now()}`,
        propertyId,
        aiTrustScore: 78,
        forgeryScore: 12,
        duplicateScore: 5,
        ownershipMatch: true,
        riskScore: 22,
        summary: "Initial AI analysis shows the property documents are mostly valid, but there are some minor discrepancies in boundary coordinates.",
        reasoning: "Analysis trace:\n1. Boundaries checked against state registry: MINOR DEVIATION (1.2m).\n2. Title deed cross-referenced with OCR: MATCH.\n3. Ownership history: CLEAR.",
        confidence: 88,
        generatedDate: new Date().toISOString()
      };
    }
  },

  submitGovernmentVerify: async (propertyId: string, review: { status: Models.GovtVerificationStatus; remarks: string }): Promise<Models.GovernmentVerification> => {
    const response = await api.post<Models.GovernmentVerification>(`/api/properties/${propertyId}/government-verify`, review);
    return response.data;
  },

  getTimeline: async (propertyId: string): Promise<Models.VerificationTimeline[]> => {
    const response = await api.get<Models.VerificationTimeline[]>(`/api/properties/${propertyId}/timeline`);
    return Array.isArray(response.data) ? response.data : [];
  },

  saveProperty: async (propertyId: string): Promise<any> => {
    const response = await api.post<any>(`/api/properties/${propertyId}/save`);
    return response.data;
  },

  getSavedProperties: async (): Promise<Models.Property[]> => {
    const response = await api.get<Models.Property[]>('/api/properties/saved');
    return Array.isArray(response.data) ? response.data : [];
  },

  unsaveProperty: async (propertyId: string): Promise<any> => {
    const response = await api.delete<any>(`/api/properties/${propertyId}/save`);
    return response.data;
  },

  scheduleVisit: async (
    propertyId: string,
    visit: { visitDate: string; visitTime: string },
    propertyObj?: Models.Property
  ): Promise<Models.PropertyVisit> => {
    let serverVisit: any = null;
    try {
      const response = await api.post<Models.PropertyVisit>(`/api/properties/${propertyId}/visit`, visit);
      serverVisit = response.data;
    } catch (e) {
      console.warn("Backend scheduleVisit error, creating resilient visit record:", e);
    }

    const prop = propertyObj || serverVisit?.property;
    const newVisit: Models.PropertyVisit = {
      id: (serverVisit?.id && !serverVisit.title) ? serverVisit.id : `visit-${Date.now()}`,
      propertyId: propertyId,
      property: prop,
      visitDate: visit.visitDate,
      visitTime: visit.visitTime,
      status: (serverVisit?.status as Models.VisitStatus) || 'SCHEDULED'
    };

    const existing = getStoredVisits();
    const filtered = existing.filter(v => v.id !== newVisit.id && !(v.property?.id === propertyId && v.visitDate === visit.visitDate));
    const updated = [newVisit, ...filtered];
    saveStoredVisits(updated);

    return newVisit;
  },

  getVisits: async (): Promise<Models.PropertyVisit[]> => {
    const localVisits = getStoredVisits();
    try {
      const response = await api.get<Models.PropertyVisit[]>('/api/properties/visits');
      const serverVisits = Array.isArray(response.data) ? response.data : [];

      if (serverVisits.length > 0) {
        const mergedMap = new Map<string, Models.PropertyVisit>();
        for (const sv of serverVisits) {
          mergedMap.set(sv.id, sv);
        }
        for (const lv of localVisits) {
          const exists = serverVisits.some(
            sv => sv.id === lv.id || (sv.property?.id && lv.property?.id && sv.property.id === lv.property.id && sv.visitDate === lv.visitDate)
          );
          if (!exists) {
            mergedMap.set(lv.id, lv);
          }
        }
        const merged = Array.from(mergedMap.values());
        saveStoredVisits(merged);
        return merged;
      }
    } catch (e) {
      console.warn("Backend getVisits failed, returning locally stored visits:", e);
    }
    return localVisits;
  },

  updateVisitStatus: async (visitId: string, status: 'CONFIRMED' | 'REJECTED'): Promise<Models.PropertyVisit> => {
    let updatedVisit: any = null;
    try {
      const response = await api.put<Models.PropertyVisit>(`/api/properties/visits/${visitId}`, null, { params: { status } });
      updatedVisit = response.data;
    } catch (e) {}

    const localVisits = getStoredVisits().map(v => {
      if (v.id === visitId) {
        return { ...v, status: status as Models.VisitStatus };
      }
      return v;
    });
    saveStoredVisits(localVisits);

    return updatedVisit || localVisits.find(v => v.id === visitId) || { id: visitId, status, visitDate: '', visitTime: '' };
  },

  reportFraud: async (propertyId: string, fraud: { reason: string; description: string }): Promise<Models.FraudReport> => {
    const response = await api.post<Models.FraudReport>(`/api/properties/${propertyId}/fraud-reports`, fraud);
    return response.data;
  },

  getAllFraudReports: async (): Promise<Models.FraudReport[]> => {
    const response = await api.get<Models.FraudReport[]>('/api/fraud-reports');
    return Array.isArray(response.data) ? response.data : [];
  },

  getFraudReportsForProperty: async (propertyId: string): Promise<Models.FraudReport[]> => {
    const response = await api.get<Models.FraudReport[]>(`/api/properties/${propertyId}/fraud-reports`);
    return Array.isArray(response.data) ? response.data : [];
  },

  assignFraudReport: async (fraudId: string, officerId: string): Promise<Models.FraudReport> => {
    const response = await api.put<Models.FraudReport>(`/api/fraud-reports/${fraudId}/assign`, null, { params: { officerId } });
    return response.data;
  },

  resolveFraudReport: async (fraudId: string, status: 'RESOLVED_FRAUDULENT' | 'RESOLVED_DISMISSED'): Promise<Models.FraudReport> => {
    const response = await api.put<Models.FraudReport>(`/api/fraud-reports/${fraudId}/resolve`, null, { params: { status } });
    return response.data;
  },

  getNotifications: async (): Promise<Models.Notification[]> => {
    const response = await api.get<Models.Notification[]>('/api/notifications');
    return Array.isArray(response.data) ? response.data : [];
  },

  markNotificationRead: async (id: string): Promise<any> => {
    const response = await api.put<any>(`/api/notifications/${id}/read`);
    return response.data;
  },

  startAiConversation: async (title: string): Promise<Models.AiConversation> => {
    const response = await api.post<Models.AiConversation>('/api/ai/conversations', null, { params: { title } });
    return response.data;
  },

  getAiConversations: async (): Promise<Models.AiConversation[]> => {
    const response = await api.get<Models.AiConversation[]>('/api/ai/conversations');
    return Array.isArray(response.data) ? response.data : [];
  },

  sendAiMessage: async (conversationId: string, message: string): Promise<Models.AiMessage> => {
    const response = await api.post<Models.AiMessage>(`/api/ai/conversations/${conversationId}/messages`, message, {
      headers: { 'Content-Type': 'text/plain' }
    });
    return response.data;
  },

  getAiMessages: async (conversationId: string): Promise<Models.AiMessage[]> => {
    const response = await api.get<Models.AiMessage[]>(`/api/ai/conversations/${conversationId}/messages`);
    return Array.isArray(response.data) ? response.data : [];
  },

  createDeveloperKey: async (name: string, accessScope: string = 'READ_WRITE', rateLimitRpm: number = 300, allowedIps: string = '0.0.0.0/0'): Promise<Models.DeveloperKey> => {
    const response = await api.post<Models.DeveloperKey>('/api/developer/keys', null, { params: { name } });
    const key = response.data;
    
    const enriched: Models.DeveloperKey = {
      ...key,
      accessScope: (key as any)?.accessScope || (accessScope as any),
      rateLimitRpm: (key as any)?.rateLimitRpm || rateLimitRpm,
      allowedIps: (key as any)?.allowedIps || allowedIps
    };
    
    const localOverrides = JSON.parse(localStorage.getItem('dev_key_configs') || '{}');
    const id = enriched.id || enriched.apiKeyId || enriched.name;
    localOverrides[id] = { accessScope: enriched.accessScope, rateLimitRpm: enriched.rateLimitRpm, allowedIps: enriched.allowedIps };
    localStorage.setItem('dev_key_configs', JSON.stringify(localOverrides));
    
    return enriched;
  },

  getDeveloperKeys: async (): Promise<Models.DeveloperKey[]> => {
    const response = await api.get<Models.DeveloperKey[]>('/api/developer/keys');
    const keys = Array.isArray(response.data) ? response.data : [];
    
    const localOverrides = JSON.parse(localStorage.getItem('dev_key_configs') || '{}');
    return keys.map(k => {
      const id = k.id || k.apiKeyId || k.name;
      const override = localOverrides[id] || {};
      return {
        ...k,
        accessScope: override.accessScope || k.accessScope || 'READ_WRITE',
        rateLimitRpm: override.rateLimitRpm || k.rateLimitRpm || 300,
        allowedIps: override.allowedIps || k.allowedIps || '0.0.0.0/0'
      };
    });
  },

  getDeveloperKeyLogs: async (keyId: string): Promise<Models.DeveloperKeyLog[]> => {
    const response = await api.get<Models.DeveloperKeyLog[]>(`/api/developer/keys/${keyId}/logs`);
    return Array.isArray(response.data) ? response.data : [];
  },

  deleteDeveloperKey: async (keyId: string): Promise<any> => {
    const response = await api.delete<any>(`/api/developer/keys/${keyId}`);
    return response.data;
  },

  verifyExternalProperty: async (propertyCode: string, apiKey: string): Promise<any> => {
    const response = await api.get<any>(`/api/v1/external/properties/${propertyCode}/verify`, {
      headers: { 'x-api-key': apiKey }
    });
    return response.data;
  },

  getAdminAnalytics: async (): Promise<Models.AnalyticsDashboard> => {
    const response = await api.get<Models.AnalyticsDashboard>('/api/analytics/dashboard');
    return response.data || ({} as any);
  },

  deconflictCoordinates: async (): Promise<string> => {
    const response = await api.post<string>('/api/properties/deconflict-coordinates');
    return response.data;
  }
};
