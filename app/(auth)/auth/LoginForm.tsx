'use client';

import * as z from 'zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { inMemoryPersistence, sendEmailVerification, setPersistence, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { getFirebaseAuthErrorMessage } from '@/lib/firebase-auth-errors';
import { firebaseAuth } from '@/lib/firebase-client';

const formSchema = z.object({
  email: z.string().trim().email({ message: 'Masukkan alamat email yang valid.' }),
  password: z.string().min(1, { message: 'Kata sandi wajib diisi.' }),
});

const LoginForm = ({ adminOnly = false }: { adminOnly?: boolean }) => {
    const router = useRouter();
    const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const handleSubmit = async (data: z.infer<typeof formSchema>) => {
    setServerError(null);
    let shouldSignOut = false;

    try {
      await setPersistence(firebaseAuth, inMemoryPersistence);
      const credential = await signInWithEmailAndPassword(
        firebaseAuth,
        data.email.trim(),
        data.password,
      );
      shouldSignOut = true;

      if (!credential.user.emailVerified) {
        const verificationSent = await sendEmailVerification(credential.user)
          .then(() => true)
          .catch(() => false);
        setServerError(
          verificationSent
            ? 'Email belum diverifikasi. Tautan verifikasi baru sudah dikirim.'
            : 'Email belum diverifikasi. Periksa email Anda atau coba kirim ulang tautan nanti.',
        );
        return;
      }

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: await credential.user.getIdToken() }),
        cache: 'no-store',
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        setServerError(result?.message ?? 'Email atau kata sandi salah.');
        return;
      }

      await signOut(firebaseAuth).catch(() => undefined);
      shouldSignOut = false;
      router.replace('/summary');
      router.refresh();
    } catch (error) {
      setServerError(getFirebaseAuthErrorMessage(error, 'Login belum dapat diproses. Coba lagi.'));
    } finally {
      if (shouldSignOut) await signOut(firebaseAuth).catch(() => undefined);
    }
  };

  return (
    <>
        <Card>
            <CardHeader>
                <CardTitle>{adminOnly ? 'Login Admin' : 'Login'}</CardTitle>
                <CardDescription>
                    {adminOnly
                      ? 'Masuk dengan akun administrator untuk mengelola dashboard.'
                      : 'Masuk untuk membuka dashboard analisis Merangin.'}
                </CardDescription>
                <CardContent className='space-y-2'>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleSubmit)}
                            className='space-y-6'
                        >
                            <FormField
                                control={form.control}
                                name='email'
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel className='text-sm font-medium'>
                                    Email
                                    </FormLabel>
                                    <FormControl>
                                    <Input
                                        className='bg-slate-100 dark:bg-slate-500 border-0 focus-visible:ring-0 text-black dark:text-white focus-visible:ring-offset-0'
                                        type='email'
                                        autoComplete='email'
                                        placeholder='nama@contoh.id'
                                        {...field}
                                    />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name='password'
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel className='text-sm font-medium'>
                                    Kata sandi
                                    </FormLabel>
                                    <FormControl>
                                    <Input
                                        className='bg-slate-100 dark:bg-slate-500 border-0 focus-visible:ring-0 text-black dark:text-white focus-visible:ring-offset-0'
                                        type='password'
                                        autoComplete='current-password'
                                        placeholder='Masukkan kata sandi'
                                        {...field}
                                    />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            {serverError && <p role='alert' className='text-sm font-medium text-destructive'>{serverError}</p>}
                            <Button type='submit' className='w-full' disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting ? 'Memeriksa akun…' : 'Masuk'}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </CardHeader>
        </Card>      
    </>
  );
};

export default LoginForm;
