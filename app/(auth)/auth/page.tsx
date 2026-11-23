import AuthTabs from '@/components/auth/AuthTabs'
import { getCurrentUser } from '@/lib/auth';
import { isAuthenticatedMode } from '@/lib/access-mode';
import { redirect } from 'next/navigation';

const AuthPage = async () => {
    if (await getCurrentUser()) redirect('/summary');

    return <AuthTabs allowUserRegistration={isAuthenticatedMode()} />;
};

export default AuthPage;
