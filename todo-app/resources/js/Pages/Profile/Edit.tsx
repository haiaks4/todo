import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import type { PageProps } from '@/types';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';
import UpdateRemindForm from './Partials/UpdateRemindForm';

export default function Edit({
    mustVerifyEmail,
    status,
    remindEnabled,
}: PageProps<{
    mustVerifyEmail: boolean;
    status?: string;
    remindEnabled: boolean;
}>) {
    return (
        <AuthenticatedLayout header="マイページ">
            <Head title="マイページ" />

            <div className="py-8">
                <div className="mx-auto max-w-3xl space-y-6 px-4 sm:px-6 lg:px-8">
                    <UpdateProfileInformationForm
                        mustVerifyEmail={mustVerifyEmail}
                        status={status}
                    />
                    <UpdatePasswordForm />
                    <UpdateRemindForm remindEnabled={remindEnabled} />
                    <DeleteUserForm />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
