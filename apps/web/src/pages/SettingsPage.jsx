import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useTheme } from '@/contexts/ThemeContext.jsx';
import pb from '@/lib/pocketbaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Save, Percent, User, Lock, AlertTriangle, Trash2 } from 'lucide-react';
import ThemeSwitch from '@/components/journal/ThemeSwitch';
import { PageHeading } from '@/components/journal/JournalUI';
import SettingsSection from '@/components/SettingsSection.jsx';
import DeleteAccountModal from '@/components/DeleteAccountModal.jsx';

const SettingsPage = () => {
  const navigate = useNavigate();
  const { currentUser, userSettings, refreshUserSettings } = useAuth();
  const { theme } = useTheme();
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
      toast.success('Profil erfolgreich aktualisiert.');
    } catch (err) {
      toast.error(err.message || 'Profil konnte nicht aktualisiert werden.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error('Die neuen Passwörter stimmen nicht überein.');
      return;
    }
    
    setSavingPassword(true);
    try {
      await pb.collection('users').update(currentUser.id, {
        oldPassword,
        password: newPassword,
        passwordConfirm: confirmPassword
      }, { $autoCancel: false });
      
      toast.success('Passwort erfolgreich aktualisiert.');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      const errorMsg = err.response?.data?.oldPassword?.message || err.message || 'Passwort konnte nicht aktualisiert werden.';
      toast.error(`Passwort-Update fehlgeschlagen: ${errorMsg}`);
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
        toast.error('Bitte gib einen gültigen Prozentwert zwischen 0 und 100 ein.');
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
      toast.success('Globale Gebühr erfolgreich aktualisiert.');
    } catch (err) {
      console.error('Failed to update commission:', err);
      toast.error('Gebühren-Einstellungen konnten nicht aktualisiert werden.');
    } finally {
      setSavingCommission(false);
    }
  };

  const handleDeleteSuccess = () => {
    setIsDeleteModalOpen(false);
    toast.success('Konto erfolgreich gelöscht.');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="journal-page space-y-8">
        <Skeleton className="h-10 w-1/3 mb-8" />
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-64 w-full rounded-md" />
        ))}
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Einstellungen · The Trading Desk</title>
        <meta name="description" content="Verwalte deine Trading-Journal-Einstellungen" />
      </Helmet>
      
      <div className="journal-page">
        <PageHeading eyebrow="Dein Arbeitsplatz" title="Einstellungen">Profil, Sicherheit und persönliche Vorgaben.</PageHeading>

        <div>
          {/* Appearance Section */}
          <SettingsSection 
            title="Darstellung"
            description="Passe an, wie die Anwendung auf deinem Gerät aussieht."
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <span className="text-sm">{theme === 'dark' ? 'Dunkles Design' : 'Helles Design'}</span>
              <ThemeSwitch/>
            </div>
          </SettingsSection>

          {/* Profile Section */}
          <SettingsSection 
            title="Profilinformationen"
            description="Aktualisiere deine persönlichen Daten. E-Mail-Adressen können aktuell nicht direkt geändert werden."
          >
            <form onSubmit={handleProfileUpdate} className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-muted-foreground font-semibold uppercase text-xs tracking-wider">E-Mail-Adresse</Label>
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
                  <Label htmlFor="name" className="font-semibold uppercase text-xs tracking-wider">Anzeigename</Label>
                  <Input 
                    id="name" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    placeholder="z. B. Max Mustermann"
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
                Profil speichern
              </Button>
            </form>
          </SettingsSection>

          {/* Security Section */}
          <SettingsSection 
            title="Sicherheit"
            description="Aktualisiere dein Passwort, um dein Konto zu schützen."
          >
            <form onSubmit={handlePasswordUpdate} className="space-y-5 max-w-md">
              <div className="space-y-2">
                <Label htmlFor="oldPassword">Aktuelles Passwort</Label>
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
                <Label htmlFor="newPassword">Neues Passwort · mindestens 12 Zeichen</Label>
                <Input 
                  id="newPassword" 
                  type="password" 
                  value={newPassword} 
                  onChange={e => setNewPassword(e.target.value)} 
                  required 
                  minLength={12}
                  maxLength={128}
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Neues Passwort bestätigen</Label>
                <Input 
                  id="confirmPassword" 
                  type="password" 
                  value={confirmPassword} 
                  onChange={e => setConfirmPassword(e.target.value)} 
                  required 
                  minLength={12}
                  maxLength={128}
                  className="bg-background"
                />
              </div>
              <Button type="submit" variant="secondary" disabled={savingPassword} className="gap-2 w-full sm:w-auto">
                {savingPassword ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Lock className="w-4 h-4" />
                )}
                Passwort aktualisieren
              </Button>
            </form>
          </SettingsSection>

          {/* Trading Preferences */}
          <SettingsSection 
            title="Trading-Einstellungen"
            description="Konfiguriere Standardwerte für neue Journal-Einträge."
          >
            <form onSubmit={handleUpdateCommission} className="space-y-4">
              <div className="space-y-2 max-w-sm">
                <Label htmlFor="commissionPercentage" className="font-semibold uppercase text-xs tracking-wider">Globale Gebühr (%)</Label>
                <p className="text-xs text-muted-foreground mb-2">Standardgebühr für neue Trades. Kann pro Trade überschrieben werden.</p>
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
                    placeholder="z. B. 0.1"
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
                Einstellungen speichern
              </Button>
            </form>
          </SettingsSection>

          {/* Danger Zone Section */}
          <Card className="settings-danger border-destructive/30">
            <CardHeader className="border-b border-destructive/10 pb-6">
              <CardTitle className="text-xl tracking-tight text-destructive flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Gefahrenbereich
              </CardTitle>
              <CardDescription className="text-base mt-2 text-destructive/80">
                Lösche dein Konto und alle zugehörigen Daten dauerhaft.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <p className="text-sm text-foreground/80 max-w-lg leading-relaxed">
                  Wenn du dein Konto löschst, kann diese Aktion nicht rückgängig gemacht werden. Bitte sei sicher, bevor du fortfährst.
                </p>
                <Button 
                  variant="destructive" 
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="w-full sm:w-auto h-11 shadow-sm whitespace-nowrap"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Konto löschen
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
