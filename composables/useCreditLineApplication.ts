import { ref, computed } from 'vue';

export const useCreditLineApplication = () => {
    const application = ref({
        applicationId: 'APP-' + Math.floor(Math.random() * 10000),
        status: 'draft',
        companyName: 'Test Company Co., Ltd.',
        taxId: '0105555555555',
        businessType: '',
        requestedCreditLimit: null,
        creditPeriod: null,
        billingSchedule: '',
        paymentDueDate: '',
        paymentType: null,
        billingLocation: '',
        billingRemark: '',
        documents: [
            { docId: 'c1', docGroup: 'company', docName: 'Company Affidavit', required: true, files: [], uploadStatus: 'pending' },
            { docId: 'f1', docGroup: 'financial', docName: 'Financial Statement', required: true, files: [], uploadStatus: 'pending' },
            { docId: 'd1', docGroup: 'director', docName: 'ID Card', required: true, files: [], uploadStatus: 'pending' }
        ]
    });

    const uploadProgress = computed(() => {
        return { uploaded: 0, total: 3, percentage: 0 };
    });

    const isFormValid = computed(() => true);

    const handleFileUpload = (docId: string, files: FileList | null) => {
        if (!files || files.length === 0) return;
        const doc = application.value.documents.find(d => d.docId === docId);
        if (doc) {
            doc.files = Array.from(files);
            doc.uploadStatus = 'uploaded';
        }
    };

    const saveDraft = async () => {
        return { success: true, timestamp: new Date().toLocaleTimeString() };
    };

    const submitApplication = async () => {
        return { success: true, message: 'Success' };
    };

    return {
        application,
        uploadProgress,
        isFormValid,
        saveDraft,
        submitApplication,
        handleFileUpload
    };
};
