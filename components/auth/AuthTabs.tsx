import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LoginForm from '@/app/(auth)/auth/LoginForm';
import RegisterForm from '@/app/(auth)/auth/RegisterForm';

const AuthTabs = ({ allowUserRegistration }: { allowUserRegistration: boolean }) => {
    if (!allowUserRegistration) {
        return <LoginForm adminOnly />;
    }

    return (
        <Tabs defaultValue="login" className="w-full max-w-md">
            <TabsList className='grid w-full grid-cols-2'>
                <TabsTrigger value="login">Masuk</TabsTrigger>
                <TabsTrigger value="register">Daftar</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
                <LoginForm />
            </TabsContent>
            <TabsContent value="register">
                <RegisterForm />
            </TabsContent>
        </Tabs>
    );
};

export default AuthTabs
