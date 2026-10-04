import type {
  DocumentVerificationReport,
  OwnerVerificationRequest,
  OwnerVerificationStatus,
  Property
} from '../models/property.models';

const VERIFICATION_STORAGE_KEY = 'landlens_document_verifications';
const OWNER_REQUESTS_KEY = 'landlens_owner_verifications';

// Preset sample properties for verification demonstration
export const SAMPLE_REFERENCE_PROPERTIES = [
  {
    id: 'prop-ref-001',
    propertyCode: 'LL-TEL-2026-081',
    title: 'Surya Green Valley Agricultural Parcel',
    surveyNumber: '342/A',
    category: 'AGRICULTURAL',
    area: 2.5,
    price: 3500000,
    district: 'Medchal-Malkajgiri',
    village: 'Rampally',
    state: 'Telangana',
    pincode: '501301',
    sroOffice: 'Ghatkesar Sub-Registrar Office',
    registeredOwner: 'K. Venkata Ramanathan',
    ownerEmail: 'k.v.ramanathan.official@gmail.com',
    ownerPhone: '+91 94401 88291',
    sellerContact: {
      name: 'Priya Sharma (Authorized Broker / Representative)',
      phone: '+91 98480 12345',
      email: 'priya.broker@realestatehub.in',
      isFlagged: false
    }
  },
  {
    id: 'prop-ref-002',
    propertyCode: 'LL-KA-2026-114',
    title: 'Nandi Hills Serene Orchard Plot',
    surveyNumber: '118/2B',
    category: 'AGRICULTURAL',
    area: 1.8,
    price: 5200000,
    district: 'Chikkaballapur',
    village: 'Nandi Hobli',
    state: 'Karnataka',
    pincode: '562101',
    sroOffice: 'Chikkaballapur District Sub-Registrar',
    registeredOwner: 'Anand K. Deshmukh',
    ownerEmail: 'anand.deshmukh.land@gmail.com',
    ownerPhone: '+91 98802 77412',
    sellerContact: {
      name: 'Ramesh Reddy (Listing Agent)',
      phone: '+91 99001 55667',
      email: 'ramesh.reddy@karnatakarealty.com',
      isFlagged: false
    }
  },
  {
    id: 'prop-ref-003',
    propertyCode: 'LL-MH-2026-309',
    title: 'Western Hills Prime Residential Zone',
    surveyNumber: '79/1-A',
    category: 'RESIDENTIAL',
    area: 0.75,
    price: 6800000,
    district: 'Pune',
    village: 'Wakad',
    state: 'Maharashtra',
    pincode: '411057',
    sroOffice: 'Haveli Sub-Registrar Office 14',
    registeredOwner: 'Rajendra S. Patil',
    ownerEmail: 'rajendra.patil.pune@gmail.com',
    ownerPhone: '+91 98220 33490',
    sellerContact: {
      name: 'Siddharth Joshi (Claimed Property Agent)',
      phone: '+91 98233 44556',
      email: 'siddharth.fake.seller@quickpropertydeals.biz',
      isFlagged: false
    }
  }
];

export const DEMO_SCENARIOS = {
  GENUINE_MATCH: 'GENUINE_MATCH',
  DISCREPANCY_FLAGGED: 'DISCREPANCY_FLAGGED',
  FAKE_SELLER_KEY_SCENARIO: 'FAKE_SELLER_KEY_SCENARIO'
} as const;

export const verificationService = {
  // Get all locally stored verification reports
  getSavedReports: (): DocumentVerificationReport[] => {
    try {
      const raw = localStorage.getItem(VERIFICATION_STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error('Failed to load saved verifications', e);
    }
    return [];
  },

  // Save or update report
  saveReport: (report: DocumentVerificationReport): void => {
    try {
      const existing = verificationService.getSavedReports();
      const updated = [report, ...existing.filter(r => r.id !== report.id)];
      localStorage.setItem(VERIFICATION_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save verification', e);
    }
  },

  getReportById: (id: string): DocumentVerificationReport | undefined => {
    const reports = verificationService.getSavedReports();
    return reports.find(r => r.id === id);
  },

  // Generate a detailed Verification Report by cross-comparing Documents, Buyer Details, and Reference Records
  generateVerificationReport: async (params: {
    propertyRef: typeof SAMPLE_REFERENCE_PROPERTIES[0];
    uploadedDocNames: string[];
    uploadedDocTypes: string[];
    extractedDetails: {
      ownerName: string;
      surveyNo: string;
      area: number;
      location: string;
      deedNumber: string;
      registrationDate: string;
      priorOwners: string[];
      rawExcerpt?: string;
    };
    buyerEnteredDetails?: {
      claimedOwnerName: string;
      claimedSurveyNo: string;
      claimedArea: number;
      claimedPrice: number;
    };
    scenarioPreset?: keyof typeof DEMO_SCENARIOS;
  }): Promise<DocumentVerificationReport> => {
    const { propertyRef, uploadedDocNames, uploadedDocTypes, extractedDetails, buyerEnteredDetails, scenarioPreset } = params;

    const matches: DocumentVerificationReport['matches'] = [];
    const discrepancies: DocumentVerificationReport['discrepancies'] = [];
    const missingInformation: DocumentVerificationReport['missingInformation'] = [];
    const riskIndicators: DocumentVerificationReport['riskIndicators'] = [];

    // 1. Survey Number Cross-Check
    const surveyMatch = extractedDetails.surveyNo.trim().toLowerCase() === propertyRef.surveyNumber.trim().toLowerCase();
    matches.push({
      field: 'Survey Number',
      documentValue: extractedDetails.surveyNo,
      recordValue: propertyRef.surveyNumber,
      isMatch: surveyMatch,
      remarks: surveyMatch
        ? 'Survey Number exactly matches official Revenue Survey Records.'
        : `Discrepancy detected: Document mentions ${extractedDetails.surveyNo} while official record specifies ${propertyRef.surveyNumber}.`
    });
    if (!surveyMatch) {
      discrepancies.push({
        field: 'Survey Number',
        severity: 'CRITICAL',
        title: 'Survey Number Mismatch',
        explanation: `The uploaded deed mentions Survey No. "${extractedDetails.surveyNo}", which deviates from the revenue record's "${propertyRef.surveyNumber}". This may indicate an incorrect parcel or boundary tampering.`,
        documentValue: extractedDetails.surveyNo,
        recordValue: propertyRef.surveyNumber
      });
    }

    // 2. Owner Name Cross-Check
    const docOwnerNormalized = extractedDetails.ownerName.toLowerCase().replace(/[^a-z]/g, '');
    const recOwnerNormalized = propertyRef.registeredOwner.toLowerCase().replace(/[^a-z]/g, '');
    const ownerMatch = docOwnerNormalized.includes(recOwnerNormalized) || recOwnerNormalized.includes(docOwnerNormalized);
    matches.push({
      field: 'Registered Pattadar / Owner Name',
      documentValue: extractedDetails.ownerName,
      recordValue: propertyRef.registeredOwner,
      isMatch: ownerMatch,
      remarks: ownerMatch
        ? 'Owner identity matches State Revenue Record of Rights (ROR).'
        : `Deed lists "${extractedDetails.ownerName}", whereas state ledger registers "${propertyRef.registeredOwner}".`
    });
    if (!ownerMatch) {
      discrepancies.push({
        field: 'Owner Name',
        severity: 'CRITICAL',
        title: 'Title Holder Name Discrepancy',
        explanation: `The document lists "${extractedDetails.ownerName}" as owner, but government registry records list "${propertyRef.registeredOwner}". Possible unrecorded transfer or unauthorized deed.`,
        documentValue: extractedDetails.ownerName,
        recordValue: propertyRef.registeredOwner
      });
    }

    // 3. Extent / Area Cross-Check
    const areaDiff = Math.abs(extractedDetails.area - propertyRef.area);
    const areaMatch = areaDiff <= 0.05; // allow minimal fractional rounding
    matches.push({
      field: 'Land Extent / Area (Acres)',
      documentValue: `${extractedDetails.area} Acres`,
      recordValue: `${propertyRef.area} Acres`,
      isMatch: areaMatch,
      remarks: areaMatch
        ? 'Land extent is consistent between document and registry.'
        : `Area discrepancy: Document states ${extractedDetails.area} acres vs ${propertyRef.area} acres in revenue ledger.`
    });
    if (!areaMatch) {
      discrepancies.push({
        field: 'Area Extent',
        severity: areaDiff > 0.5 ? 'HIGH' : 'MEDIUM',
        title: 'Discrepancy in Land Extent',
        explanation: `The uploaded deed claims ${extractedDetails.area} acres, but official revenue records only record ${propertyRef.area} acres. Risk of inflated area claim or adjacent boundary encroachment.`,
        documentValue: `${extractedDetails.area} Acres`,
        recordValue: `${propertyRef.area} Acres`
      });
    }

    // 4. SRO Jurisdiction & Location Check
    const locationMatch = extractedDetails.location.toLowerCase().includes(propertyRef.village.toLowerCase()) ||
                          extractedDetails.location.toLowerCase().includes(propertyRef.district.toLowerCase());
    matches.push({
      field: 'Jurisdiction & SRO Office',
      documentValue: extractedDetails.location,
      recordValue: `${propertyRef.village}, ${propertyRef.district}, SRO: ${propertyRef.sroOffice}`,
      isMatch: locationMatch,
      remarks: locationMatch
        ? 'SRO jurisdiction matches village revenue boundaries.'
        : 'SRO Office on deed does not match the designated revenue circle.'
    });

    // 5. Missing Information Evaluation
    const hasSaleDeed = uploadedDocTypes.some(t => t.includes('SALE_DEED') || t.includes('DEED'));
    const hasPatta = uploadedDocTypes.some(t => t.includes('PATTA') || t.includes('ROR') || t.includes('PASSBOOK'));
    const hasEc = uploadedDocTypes.some(t => t.includes('EC') || t.includes('ENCUMBRANCE'));

    if (!hasEc) {
      missingInformation.push({
        item: 'Encumbrance Certificate (EC) for past 13–30 years',
        importance: 'CRITICAL',
        reason: 'Required to confirm that no bank mortgage, court attachment, or prior registered sale lien exists on this survey number.'
      });
    }
    if (!hasPatta) {
      missingInformation.push({
        item: 'Pattadar Passbook / ROR 1B Extract',
        importance: 'CRITICAL',
        reason: 'Essential revenue document proving agricultural/mutation title in the current state land ledger.'
      });
    }
    if (extractedDetails.priorOwners.length === 0) {
      missingInformation.push({
        item: 'Prior Link Documents / Chain of Title Deeds (13-Year History)',
        importance: 'RECOMMENDED',
        reason: 'Chain of link deeds establishes an unbroken history of ownership from the original grant to the current seller.'
      });
    }

    // 6. Risk Indicators Evaluation
    if (discrepancies.length > 0) {
      riskIndicators.push({
        level: 'HIGH_RISK',
        indicator: 'Data Mismatch Detected Across Reference Records',
        explanation: 'There are direct variances in core parameters (Survey No, Area, or Name) between uploaded documents and official revenue records.'
      });
    } else {
      riskIndicators.push({
        level: 'SAFE',
        indicator: 'Document Data Consistency Verified',
        explanation: 'All extracted document details are mathematically and textually consistent with official registry records.'
      });
    }

    if (scenarioPreset === 'FAKE_SELLER_KEY_SCENARIO') {
      riskIndicators.push({
        level: 'WARNING',
        indicator: 'CRITICAL REQUIREMENT: Potential Replicated/Forged Document Risk',
        explanation: 'The document matches reference records, but forged documents often copy authentic public details. MUST confirm with genuine owner via Stage 2 Original Owner Verification.'
      });
    }

    // Overall status
    const overallDocumentStatus = discrepancies.length > 0
      ? 'DISCREPANCIES_FOUND'
      : (missingInformation.some(m => m.importance === 'CRITICAL') ? 'INCOMPLETE_DOCS' : 'CONSISTENT');

    // AI Summary generation
    let aiSummary = '';
    if (discrepancies.length > 0) {
      aiSummary = `⚠️ **Document Analysis Warning:** The LandLens Multi-Source Verification engine discovered ${discrepancies.length} discrepancy(ies) between the uploaded documents and government reference records. Specifically, ${discrepancies.map(d => `${d.title} (${d.documentValue} vs ${d.recordValue})`).join('; ')}. Buyer is advised not to make advance payments until discrepancies are cleared.`;
    } else if (scenarioPreset === 'FAKE_SELLER_KEY_SCENARIO') {
      aiSummary = `✅ **Document Consistency Confirmed:** Uploaded documents match all public revenue records for Survey No. ${propertyRef.surveyNumber} in ${propertyRef.village}. **IMPORTANT SECURITY NOTICE:** Even when documents match public records, unauthorized or fake sellers can forge authentic document numbers. You MUST proceed to **Stage 2: Original Owner Verification** to confirm the genuine owner authorized this transaction.`;
    } else {
      aiSummary = `✅ **Document Verification Completed:** All extracted parameters (Survey No: ${propertyRef.surveyNumber}, Extent: ${propertyRef.area} Acres, Owner: ${propertyRef.registeredOwner}) are 100% consistent with the State Land Registry. Proceed to Stage 2 for Original Owner Authorization.`;
    }

    const report: DocumentVerificationReport = {
      id: `rep-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
      propertyDetails: {
        propertyId: propertyRef.id,
        title: propertyRef.title,
        surveyNumber: propertyRef.surveyNumber,
        district: propertyRef.district,
        village: propertyRef.village,
        state: propertyRef.state,
        area: propertyRef.area,
        price: propertyRef.price,
        registeredOwner: propertyRef.registeredOwner,
        sroOffice: propertyRef.sroOffice
      },
      uploadedDocumentDetails: {
        fileNames: uploadedDocNames,
        documentTypes: uploadedDocTypes,
        extractedOwnerName: extractedDetails.ownerName,
        extractedSurveyNo: extractedDetails.surveyNo,
        extractedArea: extractedDetails.area,
        extractedLocation: extractedDetails.location,
        extractedDeedNumber: extractedDetails.deedNumber,
        extractedRegistrationDate: extractedDetails.registrationDate,
        extractedPriorOwners: extractedDetails.priorOwners,
        rawExcerpt: extractedDetails.rawExcerpt
      },
      buyerEnteredDetails: buyerEnteredDetails,
      matches,
      discrepancies,
      missingInformation,
      riskIndicators,
      overallDocumentStatus,
      aiSummary
    };

    verificationService.saveReport(report);
    return report;
  },

  // STAGE 2: Request Original Owner Verification
  requestOwnerVerification: (reportId: string, buyerName: string = 'Current Buyer'): OwnerVerificationRequest => {
    const report = verificationService.getReportById(reportId);
    const refProp = SAMPLE_REFERENCE_PROPERTIES.find(p => p.surveyNumber === report?.propertyDetails.surveyNumber) || SAMPLE_REFERENCE_PROPERTIES[0];

    const ownerRequest: OwnerVerificationRequest = {
      id: `own-req-${Date.now()}`,
      verificationReportId: reportId,
      propertyId: report?.propertyDetails.propertyId,
      buyerName: buyerName,
      sellerContact: {
        name: refProp.sellerContact.name,
        phone: refProp.sellerContact.phone,
        email: refProp.sellerContact.email,
        isFlagged: false
      },
      registeredOwner: {
        name: report?.propertyDetails.registeredOwner || refProp.registeredOwner,
        email: refProp.ownerEmail,
        phone: refProp.ownerPhone,
        address: `${report?.propertyDetails.village || refProp.village}, ${report?.propertyDetails.district || refProp.district}, ${report?.propertyDetails.state || refProp.state}`
      },
      requestTimestamp: new Date().toISOString(),
      status: 'REQUESTED_PENDING'
    };

    if (report) {
      report.ownerVerification = ownerRequest;
      verificationService.saveReport(report);
    }

    // Save to owner requests list
    try {
      const raw = localStorage.getItem(OWNER_REQUESTS_KEY);
      const existing: OwnerVerificationRequest[] = raw ? JSON.parse(raw) : [];
      const updated = [ownerRequest, ...existing.filter(r => r.id !== ownerRequest.id)];
      localStorage.setItem(OWNER_REQUESTS_KEY, JSON.stringify(updated));
    } catch (e) {}

    return ownerRequest;
  },

  // Owner responds: APPROVE or REJECT
  processOwnerResponse: (
    requestId: string,
    decision: 'APPROVE' | 'REJECT',
    ownerRemarks?: string
  ): { report: DocumentVerificationReport | undefined; request: OwnerVerificationRequest } => {
    let targetReport: DocumentVerificationReport | undefined;
    const reports = verificationService.getSavedReports();

    for (const r of reports) {
      if (r.ownerVerification && r.ownerVerification.id === requestId) {
        targetReport = r;
        break;
      }
    }

    const newStatus: OwnerVerificationStatus = decision === 'APPROVE' ? 'APPROVED' : 'REJECTED';
    const isSellerBlocked = decision === 'REJECT';

    if (targetReport && targetReport.ownerVerification) {
      targetReport.ownerVerification.status = newStatus;
      targetReport.ownerVerification.ownerRemarks = ownerRemarks || (decision === 'APPROVE'
        ? 'I confirm that I am the registered title holder and have authorized this transaction.'
        : 'ALERT: I am the registered owner and I DID NOT authorize this seller or transaction! This is fraudulent.');
      targetReport.ownerVerification.responseTimestamp = new Date().toISOString();
      targetReport.ownerVerification.sellerBlocked = isSellerBlocked;
      if (isSellerBlocked) {
        targetReport.ownerVerification.sellerContact.isFlagged = true;
      }
      verificationService.saveReport(targetReport);
    }

    return {
      report: targetReport,
      request: targetReport?.ownerVerification as OwnerVerificationRequest
    };
  }
};
