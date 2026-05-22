import { ref } from 'vue';

export const useRegistrationManagement = () => {
    const registrations = ref<any[]>([]);
    const isLoading = ref(false);

    const fetchRegistrations = async () => {
        isLoading.value = true;
        // Mock data for now since the original implementation is missing
        setTimeout(() => {
            registrations.value = [
                {
                    user_id: '1',
                    email: 'test1@example.com',
                    full_name: 'Somchai Jaidee',
                    company_name: 'Test Co., Ltd.',
                    registration_status: 'PENDING',
                    created_time: new Date().toISOString(),
                },
                {
                    user_id: '2',
                    email: 'test2@example.com',
                    full_name: 'Somsri Rakthai',
                    company_name: 'Example Corp.',
                    registration_status: 'APPROVED',
                    created_time: new Date().toISOString(),
                }
            ];
            isLoading.value = false;
        }, 500);
    };

    return {
        registrations,
        isLoading,
        fetchRegistrations
    };
};
