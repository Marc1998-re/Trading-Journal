import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useTheme } from '@/contexts/ThemeContext.jsx';
import pb from '@/lib/pocketbaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Save, Settings as SettingsIcon, Percent, Wallet, User, Lock, Moon, Sun, AlertTriangle, Trash2 } from 'lucide-react';
import SettingsSection from '@/components/SettingsSection.jsx';
import DeleteAccountModal from '@/components/DeleteAccountModal.jsx';

const SettingsPage = () => {
  const navigate = useNavigate();
  const { currentUser, userSettings, refreshUserSettings } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  // Profile State
  const [name, setName] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Account State (Password)
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  // Preferences State
  const [commissionInput, setCommissionInput] = useState('0');
  const [savingCommission, setSavingCommission] = useState(false);

  useEffect(() => {
    // Populate form with current user data
    if (currentUser) {
      setName(currentUser.name || '');
    }
    
    // Populate settings
    if (userSettings) {
      setCommissionInput(
        userSettings.commissionPercentage !== null && userSettings.commissionPercentage !== undefined 
          ? userSettings.commissionPercentage.toString() 
          : '0'
      );
    }
    
    // If userSettings is missing, it might still be fetching, 
    // but AuthContext should provide it quickly.
    setLoading(false);
  }, [currentUser, userSettings]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await pb.collection('users').update(currentUser.id, { name }, { $autoCancel: false });
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    
    setSavingPassword(true);
    try {
      await pb.collection('users').update(currentUser.id, {
        oldPassword,
        password: newPassword,
        passwordConfirm: confirmPassword
      }, { $autoCancel: false });
      
      toast.success('Password updated successfully');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      const errorMsg = err.response?.data?.oldPassword?.message || err.message || 'Failed to update password';
      toast.error(`Password update failed: ${errorMsg}`);
    } finally {
      setSavingPassword(false);
    }
  };

  const handleUpdateCommission = async (e) => {
    e.preventDefault();
    
    let newCommission = 0;
    if (commissionInput.trim() !== '') {
      newCommission = Number(commissionInput);
      if (isNaN(newCommission) || newCommission < 0 || newCommission > 100) {
        toast.error('Please enter a valid percentage between 0 and 100.');
        return;
      }
    }

    setSavingCommission(true);
    try {
      const data = {
        userId: currentUser.id,
        commissionPercentage: newCommission,
      };

      if (userSettings?.id) {
        await pb.collection('userSettings').update(userSettings.id, data, { $autoCancel: false });
      } else {
        data.startingBalance = 10000;
        await pb.collection('userSettings').create(data, { $autoCancel: false });
      }

      await refreshUserSettings();
      setCommissionInput(newCommission.toString());
      toast.success('Global commission updated successfully');
    } catch (err) {
      console.error('Failed to update commission:', err);
      toast.error('Failed to update commission preferences');
    } finally {
      setSavingCommission(false);
    }
  };

  const handleDeleteSuccess = () => {
    setIsDeleteModalOpen(false);
    toast.success('Account deleted successfully');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-3xl space-y-8">
        <Skeleton className="h-10 w-1/3 mb-8" />
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-64 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Settings - Trading Journal</title>
        <meta name="description" content="Manage your trading journal settings" />
      </Helmet>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-4xl space-y-10">
        <div>
          <h1 className="text-4xl font-extrabold mb-3 flex items-center gap-3 tracking-tight">
            <SettingsIcon className="w-8 h-8 text-primary" />
            Settings
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Manage your personal profile, security credentials, and app preferences.
          </p>
        </div>

        <div className="grid gap-8">
          {/* Appearance Section */}
          <SettingsSection 
            title="Appearance" 
            description="Customize how the application looks on your device."
          >
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/50">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-background rounded-lg shadow-sm border border-border">
                  {theme === 'dark' ? <Moon className="w-5 h-5 text-primary" /> : <Sun className="w-5 h-5 text-primary" />}
                </div>
                <div>
                  <Label className="text-base font-semibold cursor-pointer" htmlFor="theme-toggle">Dark Mode</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {theme === 'dark' ? 'Dark theme is currently active.' : 'Light theme is currently active.'}
                  </p>
                </div>
              </div>
              <Switch 
                id="theme-toggle"
                checked={theme === 'dark'} 
                onCheckedChange={toggleTheme} 
                className="scale-110 data-[state=checked]:bg-primary"
              />
            </div>
          </SettingsSection>

          {/* Profile Section */}
          <SettingsSection 
            title="Profile Information" 
            description="Update your personal details. Note that email addresses cannot be changed directly."
          >
            <form onSubmit={handleProfileUpdate} className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-muted-foreground font-semibold uppercase text-xs tracking-wider">Email Address</Label>
                  <div className="relative">
                    <Input 
                      id="email" 
                      value={currentUser?.email || ''} 
                      disabled 
                      className="bg-muted/50 text-muted-foreground border-border/50 cursor-not-allowed pl-10" 
                    />
                    <User className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name" className="font-semibold uppercase text-xs tracking-wider">Display Name</Label>
                  <Input 
                    id="name" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    placeholder="E.g. Maya Chen"
                    className="bg-background"
                  />
                </div>
              </div>
              <Button type="submit" disabled={savingProfile} className="gap-2 transition-all">
                {savingProfile ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save Profile
              </Button>
            </form>
          </SettingsSection>

          {/* Security Section */}
          <SettingsSection 
            title="Security" 
            description="Update your password to keep your account secure."
          >
            <form onSubmit={handlePasswordUpdate} className="space-y-5 max-w-md">
              <div className="space-y-2">
                <Label htmlFor="oldPassword">Current Password</Label>
                <div className="relative">
                  <Input 
                    id="oldPassword" 
                    type="password" 
                    value={oldPassword} 
                    onChange={e => setOldPassword(e.target.value)} 
                    required 
                    className="pl-10 bg-background"
                  />
                  <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input 
                  id="newPassword" 
                  type="password" 
                  value={newPassword} 
                  onChange={e => setNewPassword(e.target.value)} 
                  required 
                  minLength={8}
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input 
                  id="confirmPassword" 
                  type="password" 
                  value={confirmPassword} 
                  onChange={e => setConfirmPassword(e.target.value)} 
                  required 
                  minLength={8}
                  className="bg-background"
                />
              </div>
              <Button type="submit" variant="secondary" disabled={savingPassword} className="gap-2 w-full sm:w-auto">
                {savingPassword ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Lock className="w-4 h-4" />
                )}
                Update Password
              </Button>
            </form>
          </SettingsSection>

          {/* Trading Preferences */}
          <SettingsSection 
            title="Trading Preferences" 
            description="Configure default values for your trading journal entries."
          >
            <div className="mb-6 p-4 bg-primary/5 rounded-xl border border-primary/10 flex items-start gap-3">
              <Wallet className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <p className="text-sm text-foreground/80 leading-relaxed">
                <span className="font-medium text-foreground">Tip:</span> Starting Balance is now editable directly from your Dashboard for real-time metric updates. You don't need to change it here.
              </p>
            </div>

            <form onSubmit={handleUpdateCommission} className="space-y-4">
              <div className="space-y-2 max-w-sm">
                <Label htmlFor="commissionPercentage" className="font-semibold uppercase text-xs tracking-wider">Global Commission Rate (%)</Label>
                <p className="text-xs text-muted-foreground mb-2">Default commission applied to new trades. Can be overridden per trade.</p>
                <div className="relative">
                  <Input
                    id="commissionPercentage"
                    type="number"
                    min="0"
                    max="100"
                    step="0.001"
                    value={commissionInput}
                    onChange={(e) => setCommissionInput(e.target.value)}
                    className="bg-background text-lg pl-10 h-12"
                    placeholder="e.g. 0.1"
                  />
                  <Percent className="w-5 h-5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>
              <Button type="submit" disabled={savingCommission} className="gap-2 h-11">
                {savingCommission ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save Preferences
              </Button>
            </form>
          </SettingsSection>

          {/* Danger Zone Section */}
          <Card className="border-destructive/30 bg-destructive/5 rounded-2xl overflow-hidden mt-8 transition-all">
            <CardHeader className="border-b border-destructive/10 pb-6">
              <CardTitle className="text-xl tracking-tight text-destructive flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Danger Zone
              </CardTitle>
              <CardDescription className="text-base mt-2 text-destructive/80">
                Permanently delete your account and all associated data.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <p className="text-sm text-foreground/80 max-w-lg leading-relaxed">
                  Once you delete your account, there is no going back. Please be certain before proceeding with this action.
                </p>
                <Button 
                  variant="destructive" 
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="w-full sm:w-auto h-11 shadow-sm whitespace-nowrap"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <DeleteAccountModal 
        isOpen={isDeleteModalOpen} 
        onClose={() => setIsDeleteModalOpen(false)}
        onSuccess={handleDeleteSuccess}
      />
    </>
  );
};

export default SettingsPage;