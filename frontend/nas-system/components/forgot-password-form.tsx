"use client"

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { authService } from '@/services/authService';
import Link from 'next/link';

export function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const { toast } = useToast();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);

    try {
      const response = await authService.forgotPassword(email);
      toast({
        title: 'Check your email',
        description: response.message,
      });
      setEmail('');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          placeholder="Enter your email address"
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
      </div>
      <Button type="submit" className="w-full bg-[#800000] hover:bg-[#600000]" disabled={isLoading}>
        {isLoading ? 'Sending...' : 'Send Password Reset Link'}
      </Button>
      <div className="text-center text-sm">
        Remember your password?{' '}
        <Link href="/" className="text-[#800000] hover:underline">
          Back to Login
        </Link>
      </div>
    </form>
  );
}
