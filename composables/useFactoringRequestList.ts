import { ref, computed } from 'vue';

export const useFactoringRequestList = () => {
    const userRole = ref('admin');
    const isFilterVisible = ref(false);
    
    const filters = ref({
        search: '',
        status: 'all',
        minAmount: null,
        maxAmount: null,
        dateFrom: '',
        dateTo: ''
    });

    const requests = ref([
        {
            id: 'REQ-2023-001',
            type: 'LINE',
            companyName: 'Test Co., Ltd.',
            poNumber: '-',
            buyerName: 'General Purpose',
            requestedAmount: 5000000,
            creditPeriod: 60,
            status: 'approved',
            submittedDate: new Date().toISOString()
        },
        {
            id: 'REQ-2023-002',
            type: 'PO',
            companyName: 'Example Corp.',
            poNumber: 'PO-998877',
            buyerName: 'Big Buyer Co.',
            requestedAmount: 1500000,
            creditPeriod: 30,
            status: 'under_review',
            submittedDate: new Date().toISOString()
        }
    ]);

    const filteredRequests = computed(() => {
        return requests.value;
    });

    const toggleFilter = () => {
        isFilterVisible.value = !isFilterVisible.value;
    };

    const clearFilters = () => {
        filters.value = {
            search: '',
            status: 'all',
            minAmount: null,
            maxAmount: null,
            dateFrom: '',
            dateTo: ''
        };
    };

    const deleteRequest = (id: string) => {
        const index = requests.value.findIndex(r => r.id === id);
        if (index !== -1 && requests.value[index].status === 'draft') {
            requests.value.splice(index, 1);
            return true;
        }
        return false;
    };

    return {
        userRole,
        filters,
        isFilterVisible,
        toggleFilter,
        clearFilters,
        filteredRequests,
        deleteRequest
    };
};
