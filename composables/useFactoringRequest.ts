import { ref, computed } from 'vue';

export const useFactoringRequest = () => {
    const form = ref({
        requestId: 'FACT-' + Math.floor(Math.random() * 10000),
        status: 'draft',
        selectedPoIds: [],
        requestedAmount: 0,
        creditPeriod: null,
        paymentType: null,
        remark: '',
        documents: [
            { docId: 'doc1', docName: 'Invoice Copy', required: true, files: [], uploadStatus: 'pending' },
            { docId: 'doc2', docName: 'Delivery Note', required: true, files: [], uploadStatus: 'pending' }
        ]
    });

    const pendingPOs = ref([
        { id: '1', poNumber: 'PO-1001', poDate: '2023-10-01', buyer: 'Buyer A', amount: 500000, term: 30, status: 'Active' },
        { id: '2', poNumber: 'PO-1002', poDate: '2023-10-05', buyer: 'Buyer B', amount: 200000, term: 60, status: 'Active' }
    ]);

    const totalSelectedAmount = computed(() => {
        return form.value.selectedPoIds.reduce((total, id) => {
            const po = pendingPOs.value.find(p => p.id === id);
            return total + (po ? po.amount : 0);
        }, 0);
    });

    const selectedBuyerNames = computed(() => 'Multiple Buyers');
    const selectedPoRefs = computed(() => form.value.selectedPoIds.join(', '));
    const isFormValid = computed(() => true);

    const handleFileUpload = (docId: string, files: FileList | null) => {
        if (!files || files.length === 0) return;
        const doc = form.value.documents.find(d => d.docId === docId);
        if (doc) {
            doc.files = Array.from(files);
            doc.uploadStatus = 'uploaded';
        }
    };

    const saveDraft = async () => {
        return { success: true, timestamp: new Date().toLocaleTimeString() };
    };

    const submitRequest = async () => {
        return { success: true, message: 'Success' };
    };

    return {
        form,
        pendingPOs,
        totalSelectedAmount,
        selectedBuyerNames,
        selectedPoRefs,
        isFormValid,
        handleFileUpload,
        saveDraft,
        submitRequest
    };
};
