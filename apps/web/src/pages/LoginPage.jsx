import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LogIn, MailWarning, RefreshCw, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, isVerificationPending, verificationEmail, resendVerificationEmail, setIsVerificationPending } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      // If login is successful and user is verified, they are redirected
      navigate('/home');
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await resendVerificationEmail(verificationEmail || email);
      toast.success('Verification email sent! Please check your inbox.');
    } catch (err) {
      toast.error(err.message || 'Failed to resend verification email.');
    } finally {
      setResending(false);
    }
  };

  const handleResetVerification = () => {
    setIsVerificationPending(false);
    setError('');
  };

  if (isVerificationPending) {
    return (
      <>
        <Helmet>
          <title>Verification Required - Trading Journal</title>
        </Helmet>
        <div className="min-h-screen flex items-center justify-center px-4 py-12">
          <Card className="w-full max-w-md border-border/50 shadow-lg text-center">
            <CardHeader className="space-y-4 pt-8">
              <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
                <MailWarning className="w-8 h-8 text-destructive" />
              </div>
              <div className="space-y-2">
                <CardTitle className="text-2xl font-bold">Email Not Verified</CardTitle>
                <CardDescription className="text-base">
                  You must verify your email address to log in. We previously sent a link to:
                  <br />
                  <span className="font-medium text-foreground mt-2 inline-block px-3 py-1 bg-muted rounded-md">
                    {verificationEmail || email}
                  </span>
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground pb-8">
              Please check your inbox and click the verification link. If the link has expired or you didn't receive it, you can request a new one.
            </CardContent>
            <CardFooter className="flex flex-col gap-3 pb-8 bg-muted/30 pt-6">
              <Button 
                onClick={handleResend} 
                disabled={resending}
                className="w-full gap-2"
              >
                {resending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                {resending ? 'Sending...' : 'Resend Verification Email'}
              </Button>
              <Button 
                variant="ghost" 
                onClick={handleResetVerification}
                className="w-full gap-2 text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="w-4 h-4" />
                Try a different account
              </Button>
            </CardFooter>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Login - Trading Journal</title>
        <meta name="description" content="Login to your trading journal account" />
      </Helmet>
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Login</CardTitle>
            <CardDescription>Enter your credentials to access your account</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="trader@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-background text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-background text-foreground"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full gap-2" disabled={loading}>
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                    Logging in...
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    Login
                  </>
                )}
              </Button>
              <p className="text-sm text-muted-foreground text-center">
                Don't have an account?{' '}
                <Link to="/signup" className="text-primary hover:underline font-medium">
                  Sign up
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </>
  );
};

export default LoginPage;