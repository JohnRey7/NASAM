import { ResetPasswordForm } from '@/components/reset-password-form';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function ChangePasswordPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-[#800000]">Reset Password</CardTitle>
          <CardDescription>Enter your new password to complete the reset process.</CardDescription>
        </CardHeader>
        <CardContent>
          <ResetPasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}
