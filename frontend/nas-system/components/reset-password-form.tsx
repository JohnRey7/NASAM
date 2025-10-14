"use client"

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { authService } from '@/services/authService';

export function ResetPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const resetEmail = searchParams.get('email');
    const resetCode = searchParams.get('code');
    
    if (resetEmail && resetCode) {
      setEmail(resetEmail);
      setCode(resetCode);
    } else {
      toast({
        title: 'Error',
        description: 'No password reset information found. Please request a new link.',
        variant: 'destructive',
      });
      router.push('/forgot-password');
    }
  }, [searchParams, router, toast]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password !== confirmPassword) {
      toast({
        title: 'Passwords do not match',
        description: 'Please ensure both passwords are the same.',
        variant: 'destructive',
      });
      return;
    }
    if (!email || !code) {
      toast({
        title: 'Error',
        description: 'Missing reset information.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.resetPassword(email, code, password);
      toast({
        title: 'Success',
        description: response.message,
      });
      router.push('/'); // Redirect to login page on success
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reset password. The link may be invalid or expired.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="password">New Password</Label>
        <Input
          id="password"
          name="password"
          required
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your new password"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm-password">Confirm New Password</Label>
        <Input
          id="confirm-password"
          name="confirm-password"
          required
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm your new password"
        />
      </div>
      <Button type="submit" className="w-full bg-[#800000] hover:bg-[#600000]" disabled={isLoading || !email || !code}>
        {isLoading ? 'Resetting...' : 'Reset Password'}
      </Button>
    </form>
  );
}
