/**
 * @fileoverview Mock file upload utilities for Storybook
 * Simulates file uploads and PDF processing without hitting real AWS services
 */

/**
 * Mock file upload - simulates S3 upload and DataStore creation
 */
export async function uploadFile(file, identityId, unitId = null, onProgress = null) {
    console.log('[MOCK] Uploading file:', file.name);
    
    // Simulate upload progress
    if (onProgress) {
        const steps = 5;
        for (let i = 0; i <= steps; i++) {
            await new Promise(resolve => setTimeout(resolve, 300));
            onProgress((i / steps) * file.size, file.size);
        }
    }
    
    // Simulate file path
    let folder = 'files';
    if (file.type.startsWith('image/')) {
        folder = 'images';
    } else if (file.type.startsWith('audio/')) {
        folder = 'audio';
    }
    
    const mockFileModel = {
        id: `mock-file-${Date.now()}`,
        path: `${folder}/${file.name}`,
        identityId,
        name: file.name,
        size: file.size,
        mimeType: file.type,
        level: 'PROTECTED',
    };
    
    console.log('[MOCK] File uploaded:', mockFileModel);
    
    // If PDF, create mock document
    let mockDocumentModel = null;
    if (file.type === 'application/pdf') {
        const docId = `mock-doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        mockDocumentModel = {
            id: docId,
            filename: file.name,
            s3Key: mockFileModel.path,
            status: 'uploaded',
            identityId,
            unitID: unitId,
        };
        console.log('[MOCK] Document created:', mockDocumentModel);
    }
    
    return { fileModel: mockFileModel, documentModel: mockDocumentModel };
}

/**
 * Mock PDF analysis
 */
export async function analyzePDF(documentId) {
    console.log('[MOCK] Analyzing PDF:', { documentId });
    
    if (!documentId) {
        const error = new Error('Document ID is required for analysis');
        console.error('[MOCK] Analysis error:', error);
        throw error;
    }
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const result = {
        success: true,
        documentID: documentId,
        responseId: `mock-response-${Date.now()}`,
        pageCount: Math.floor(Math.random() * 50) + 1,
        message: 'Analysis started successfully (mocked)',
    };
    
    console.log('[MOCK] Analysis result:', result);
    return result;
}

/**
 * Mock upload and analyze PDF
 */
export async function uploadAndAnalyzePDF(file, identityId, unitId, autoAnalyze = true, onProgress = null) {
    console.log('[MOCK] Upload and analyze PDF:', file.name, {
        fileType: file.type,
        identityId,
        unitId,
        autoAnalyze
    });
    
    if (file.type !== 'application/pdf') {
        throw new Error('File must be a PDF');
    }
    
    // Upload the file
    const { fileModel, documentModel } = await uploadFile(file, identityId, unitId, onProgress);
    
    console.log('[MOCK] Upload result:', { fileModel, documentModel });
    
    // Auto-analyze if requested
    let analysisResult = null;
    if (autoAnalyze && documentModel && documentModel.id) {
        try {
            console.log('[MOCK] Starting analysis for document:', documentModel.id);
            analysisResult = await analyzePDF(documentModel.id);
        } catch (error) {
            console.error('[MOCK] Auto-analysis failed:', error);
        }
    } else {
        console.log('[MOCK] Skipping analysis:', {
            autoAnalyze,
            hasDocumentModel: !!documentModel,
            documentModelId: documentModel?.id
        });
    }
    
    return { fileModel, documentModel, analysisResult };
}
