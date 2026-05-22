<template>
    <div>
        <div class="flex items-center justify-between flex-wrap gap-4 mb-5">
            <div class="flex items-center gap-3">
                <NuxtLink to="/registration_list" class="btn btn-outline-secondary p-2 rounded-full">
                    <icon-arrow-left class="w-5 h-5" />
                </NuxtLink>
                <h2 class="text-2xl font-bold">Registration Detail</h2>
            </div>
            <div class="flex items-center gap-2" v-if="registration?.status === 'PENDING'">
                <button @click="handleAction('REJECTED')" class="btn btn-outline-danger">Reject</button>
                <button @click="handleAction('APPROVED')" class="btn btn-primary">Approve</button>
            </div>
        </div>

        <div v-if="registration" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Left Column: Main Info -->
            <div class="lg:col-span-2 space-y-6">
                <div class="panel shadow-sm">
                    <div class="flex items-center justify-between mb-5">
                        <h5 class="font-semibold text-lg">Company Information</h5>
                        <span :class="['badge capitalize', getStatusColor(registration.status)]">
                            {{ registration.status }}
                        </span>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="space-y-1">
                            <p class="text-white-dark text-xs uppercase font-bold">Company Name</p>
                            <p class="font-semibold">{{ registration.full_name }}</p>
                        </div>
                        <div class="space-y-1">
                            <p class="text-white-dark text-xs uppercase font-bold">Tax ID</p>
                            <p class="font-semibold">{{ registration.tax_id || '-' }}</p>
                        </div>
                        <div class="space-y-1">
                            <p class="text-white-dark text-xs uppercase font-bold">Business Type</p>
                            <p class="font-semibold">{{ registration.business_type || 'N/A' }}</p>
                        </div>
                        <div class="space-y-1">
                            <p class="text-white-dark text-xs uppercase font-bold">Requested Amount</p>
                            <p class="font-bold text-primary">฿ {{ formatAmount(registration.requested_amount) }}</p>
                        </div>
                    </div>
                </div>

                <div class="panel shadow-sm">
                    <h5 class="font-semibold text-lg mb-5">Contact Details</h5>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="space-y-1">
                            <p class="text-white-dark text-xs uppercase font-bold">Contact Person</p>
                            <p class="font-semibold">{{ registration.contact_name || registration.full_name }}</p>
                        </div>
                        <div class="space-y-1">
                            <p class="text-white-dark text-xs uppercase font-bold">Email Address</p>
                            <p class="font-semibold">{{ registration.email }}</p>
                        </div>
                        <div class="space-y-1">
                            <p class="text-white-dark text-xs uppercase font-bold">Phone Number</p>
                            <p class="font-semibold">{{ registration.phone || '-' }}</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Right Column: Timeline/Metadata -->
            <div class="space-y-6">
                <div class="panel shadow-sm">
                    <h5 class="font-semibold text-lg mb-5">Registration Timeline</h5>
                    <div class="space-y-4">
                        <div class="flex items-start gap-3">
                            <div class="w-2 h-2 rounded-full bg-success mt-1.5"></div>
                            <div>
                                <p class="text-sm font-bold text-success">Submitted</p>
                                <p class="text-xs text-white-dark">{{ formatDate(registration.created_at) }}</p>
                            </div>
                        </div>
                        <div v-if="registration.status !== 'PENDING'" class="flex items-start gap-3">
                            <div :class="['w-2 h-2 rounded-full mt-1.5', registration.status === 'APPROVED' ? 'bg-primary' : 'bg-danger']"></div>
                            <div>
                                <p :class="['text-sm font-bold', registration.status === 'APPROVED' ? 'text-primary' : 'text-danger']">
                                    {{ registration.status }}
                                </p>
                                <p class="text-xs text-white-dark">Processed by Admin</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="panel shadow-sm bg-primary/5 border-primary/20">
                    <h6 class="font-bold text-primary mb-2">Note for Admin</h6>
                    <p class="text-sm text-gray-600 dark:text-gray-400">
                        Please verify the Tax ID and Business registration documents before approving this account.
                    </p>
                </div>
            </div>
        </div>
        <div v-else class="panel text-center py-20">
            <icon-loader class="animate-spin w-10 h-10 mx-auto text-primary mb-4" />
            <p class="text-white-dark">Loading registration data...</p>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { ref, onMounted } from 'vue';
    import { useRoute } from 'vue-router';
    import { useRegistrationManagement } from '@/composables/useRegistrationManagement';
    import Swal from 'sweetalert2';

    const route = useRoute();
    const { registrations } = useRegistrationManagement();
    const registration = ref<any>(null);

    onMounted(() => {
        const id = route.params.id;
        // Search in mock data
        registration.value = registrations.value.find((r: any) => r.user_id.toString() === id.toString());
        
        if (!registration.value) {
            // Mock data for new registrations if not found in list
            registration.value = {
                user_id: id,
                full_name: 'บริษัท ตัวอย่าง จำกัด',
                email: 'sample@company.com',
                status: 'PENDING',
                created_at: new Date().toISOString(),
                tax_id: '1234567890123',
                business_type: 'Manufacturing',
                requested_amount: 2500000,
                phone: '0812345678',
                contact_name: 'คุณสมชาย ใจดี'
            };
        }
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'APPROVED': return 'badge-outline-success';
            case 'REJECTED': return 'badge-outline-danger';
            case 'PENDING': return 'badge-outline-warning';
            default: return 'badge-outline-primary';
        }
    };

    const formatAmount = (val: number) => {
        return new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2 }).format(val);
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleString('th-TH');
    };

    const handleAction = async (newStatus: string) => {
        const result = await Swal.fire({
            title: `Are you sure?`,
            text: `You are about to ${newStatus.toLowerCase()} this registration.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: newStatus === 'APPROVED' ? '#4361ee' : '#e7515a',
            confirmButtonText: `Yes, ${newStatus} it!`
        });

        if (result.isConfirmed) {
            registration.value.status = newStatus;
            Swal.fire({
                title: 'Success!',
                text: `Registration has been ${newStatus.toLowerCase()}.`,
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
            });
        }
    };
</script>
