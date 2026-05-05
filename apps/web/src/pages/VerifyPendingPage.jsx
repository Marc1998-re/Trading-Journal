import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, RefreshCw, LogOut, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const VerifyPendingPage = () => {
  const { currentUser, verificationEmail, resendVerificationEmail, logout, verifyAndAutoLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [isResending, setIsResending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState('');

  const query = new URLSearchParams(location.search);
  const token = query.get('token');

  // Read email from route state (from SignupPage redirect), or fallback to context
  const stateEmail = location.state?.email;
  const targetEmail = stateEmail || currentUser?.email || verificationEmail;

  const handleResend = async () => {
    if (!targetEmail) {
      toast.error('No email address found to resend to.');
      return;
    }
    
    setIsResending(true);
    try {
      await resendVerificationEmail(targetEmail);
      toast.success('Verification email sent! Please check your inbox.');
    } catch (error) {
      toast.error(error.message || 'Failed to resend verification email.');
    } finally {
      setIsResending(false);
    }
  };

  const handleVerify = async () => {
    if (!token) return;
    
    setIsVerifying(true);
    setVerifyError('');
    
    try {
      await verifyAndAutoLogin(token);
      toast.success('Email verified successfully!');
      navigate('/dashboard');
    } catch (error) {
      if (error.message === 'Verification successful but login failed. Please log in manually.') {
        toast.error(error.message);
        navigate('/login');
      } else {
        setVerifyError(error.message || 'Verification failed. The link may be invalid or expired.');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // If no user, no pending email, no state email, AND no token in URL, they shouldn't be here
  if (!targetEmail && !token) {
    navigate('/login');
    return null;
  }

  // If a token is present in the URL, show the verification confirmation UI
  if (token) {
    return (
      <>
        <Helmet>
          <title>Complete Verification - Trading Journal</title>
        </Helmet>
        <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
          <Card className="w-full max-w-md border-border/50 shadow-lg text-center">
            <CardHeader className="space-y-4 pt-8">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-primary" />
              </div>
              <div className="space-y-2">
                <CardTitle className="text-2xl font-bold">Complete Verification</CardTitle>
                <CardDescription className="text-base">
                  Click the button below to verify your email address and access your account.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pb-8">
              {verifyError && (
                <Alert variant="destructive" className="mb-6 text-left">
                  <AlertDescription>{verifyError}</AlertDescription>
                </Alert>
              )}
              <Button 
                onClick={handleVerify} 
                disabled={isVerifying}
                className="w-full gap-2 text-base h-12"
              >
                {isVerifying ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Verifying...
                  </>
                ) : verifyError ? (
                  <>
                    <RefreshCw className="w-5 h-5" />
                    Retry Verification
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Verify Email
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  // Default UI: Waiting for user to check their email
  return (
    <>
      <Helmet>
        <title>Verify Email - Trading Journal</title>
      </Helmet>
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md border-border/50 shadow-lg text-center">
          <CardHeader className="space-y-4 pt-8">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Mail className="w-8 h-8 text-primary" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-2xl font-bold">Check your email</CardTitle>
              <CardDescription className="text-base">
                Your email is being verified. We've sent a verification link to:
                <br />
                {targetEmail && (
                  <span className="font-medium text-foreground mt-2 inline-block px-3 py-1 bg-muted rounded-md">
                    {targetEmail}
                  </span>
                )}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground pb-8">
            Click the link in the email to verify your account. If you don't see it, check your spam folder.
          </CardContent>
          <CardFooter className="flex flex-col gap-3 pb-8 bg-muted/30 pt-6">
            <Button 
              onClick={handleResend} 
              disabled={isResending || !targetEmail}
              className="w-full gap-2"
            >
              {isResending ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              {isResending ? 'Sending...' : 'Send email'}
            </Button>
            <Button 
              variant="ghost" 
              onClick={handleLogout}
              className="w-full gap-2 text-muted-foreground hover:text-foreground"
            >
              <LogOut className="w-4 h-4" />
              Return to login
            </Button>
          </CardFooter>
        </Card>
      </div>
    </>
  );
};

export default VerifyPendingPage;