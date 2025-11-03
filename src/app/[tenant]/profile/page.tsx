'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import { 
  User, 
  Lock, 
  ShieldCheck, 
  Settings, 
  Trash2,
  Moon,
  Sun,
  Monitor,
  Loader2
} from 'lucide-react';

import { useTranslation } from '@/hooks/useTranslation';
import { getUserProfileAction, updateProfileAction, updatePreferencesAction } from '@/actions/profile-actions';
import { ChangePasswordDialog } from '@/components/profile/ChangePasswordDialog';
import { Enable2FADialog } from '@/components/profile/Enable2FADialog';
import { Disable2FADialog } from '@/components/profile/Disable2FADialog';
import { DeleteAccountDialog } from '@/components/profile/DeleteAccountDialog';
import { AvatarUpload } from '@/components/profile/AvatarUpload';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface UserProfileData {
  name: string;
  email: string;
  emailVerified: boolean;
  accountCreated: string;
  lastLogin: string;
  preferences: {
    language: 'pt-BR' | 'en-US';
    theme: 'light' | 'dark' | 'system';
  };
  themePreference: 'light' | 'dark' | 'system';
  mfaEnabled: boolean;
  avatarUrl: string | null;
  organizationCount: number;
  isOwnerOfAnyOrg: boolean;
}

export default function ProfilePage() {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [name, setName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const result = await getUserProfileAction();
      if (result?.data?.success && result.data.data) {
        setProfileData(result.data.data);
        setName(result.data.data.name);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Failed to load profile data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveName = async () => {
    if (!name.trim() || name === profileData?.name) {
      setIsEditingName(false);
      setName(profileData?.name || '');
      return;
    }

    setIsSaving(true);
    try {
      const result = await updateProfileAction({ name });
      if (result?.data?.success) {
        toast.success('Profile updated successfully');
        setIsEditingName(false);
        await loadProfile();
      }
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleThemeChange = async (newTheme: 'light' | 'dark' | 'system') => {
    // Update theme immediately for better UX
    setTheme(newTheme);
    
    // Update profile data state to reflect change
    if (profileData) {
      setProfileData({
        ...profileData,
        themePreference: newTheme,
        preferences: {
          ...profileData.preferences,
          theme: newTheme,
        },
      });
    }
    
    try {
      await updatePreferencesAction({
        language: profileData?.preferences.language || 'pt-BR',
        theme: newTheme,
      });
      toast.success('Theme preference updated');
    } catch (error) {
      console.error('Error updating theme:', error);
      // Revert on error
      setTheme(profileData?.themePreference || 'system');
      toast.error('Failed to update theme preference');
    }
  };

  const handleLanguageChange = async (newLanguage: 'pt-BR' | 'en-US') => {
    try {
      const result = await updatePreferencesAction({
        language: newLanguage,
        theme: profileData?.preferences.theme || 'system',
      });
      
      if (result?.data?.success) {
        setProfileData((prev) => 
          prev ? { ...prev, preferences: { ...prev.preferences, language: newLanguage } } : null
        );
        toast.success(t('preferences.language.updated'));
        // Force reload to update all translations
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else {
        throw new Error('Failed to update language preference');
      }
    } catch (error) {
      console.error('Error updating language:', error);
      toast.error('Failed to update language preference');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!profileData) {
    return <div>Failed to load profile data</div>;
  }

  const initials = profileData.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Preferences
          </TabsTrigger>
          <TabsTrigger value="account" className="flex items-center gap-2">
            <Trash2 className="h-4 w-4" />
            Account
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your personal information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <AvatarUpload
                userId={session?.user?.id || ''}
                currentAvatarUrl={profileData.avatarUrl}
                userEmail={profileData.email}
                userName={profileData.name}
              />
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">{profileData.name}</h3>
                <p className="text-muted-foreground">{profileData.email}</p>
              </div>

              <div className="space-y-4 border-t pt-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <div className="flex gap-2">
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={!isEditingName}
                    />
                    {isEditingName ? (
                      <>
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setIsEditingName(false);
                            setName(profileData.name);
                          }}
                          disabled={isSaving}
                        >
                          Cancel
                        </Button>
                        <Button onClick={handleSaveName} disabled={isSaving}>
                          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Save
                        </Button>
                      </>
                    ) : (
                      <Button onClick={() => setIsEditingName(true)}>
                        Edit
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="email"
                      value={profileData.email}
                      disabled
                    />
                    {profileData.emailVerified && (
                      <Badge variant="secondary">Verified</Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Password</CardTitle>
              <CardDescription>
                Change your password regularly to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChangePasswordDialog>
                <Button variant="outline">
                  Change Password
                </Button>
              </ChangePasswordDialog>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Two-Factor Authentication</CardTitle>
              <CardDescription>
                Add an extra layer of security to your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5" />
                  <span>Status</span>
                </div>
                {profileData.mfaEnabled ? (
                  <Badge variant="default" className="bg-green-500">
                    Enabled
                  </Badge>
                ) : (
                  <Badge variant="outline">Disabled</Badge>
                )}
              </div>

              {profileData.mfaEnabled ? (
                <Disable2FADialog>
                  <Button variant="outline" className="w-full">
                    Disable 2FA
                  </Button>
                </Disable2FADialog>
              ) : (
                <Enable2FADialog>
                  <Button variant="outline" className="w-full">
                    Enable 2FA
                  </Button>
                </Enable2FADialog>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Choose how the app is displayed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup value={profileData?.themePreference || theme || 'system'} onValueChange={handleThemeChange}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="light" id="light" />
                  <Label htmlFor="light" className="flex items-center gap-2 cursor-pointer">
                    <Sun className="h-4 w-4" />
                    Light
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="dark" id="dark" />
                  <Label htmlFor="dark" className="flex items-center gap-2 cursor-pointer">
                    <Moon className="h-4 w-4" />
                    Dark
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="system" id="system" />
                  <Label htmlFor="system" className="flex items-center gap-2 cursor-pointer">
                    <Monitor className="h-4 w-4" />
                    System
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Language</CardTitle>
              <CardDescription>
                Choose your preferred language
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select 
                value={profileData.preferences.language} 
                onValueChange={handleLanguageChange}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pt-BR">🇧🇷 Português (Brasil)</SelectItem>
                  <SelectItem value="en-US">🇺🇸 English (US)</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account Tab */}
        <TabsContent value="account" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>
                Your account details and statistics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Account created</span>
                <span>{new Date(profileData.accountCreated).toLocaleDateString()}</span>
              </div>
              {profileData.lastLogin && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last login</span>
                  <span>{new Date(profileData.lastLogin).toLocaleDateString()}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Organizations</span>
                <span>{profileData.organizationCount}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-destructive bg-destructive/5">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>
                This action cannot be undone. This will permanently delete your account and all data.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DeleteAccountDialog isOwnerOfAnyOrg={profileData?.isOwnerOfAnyOrg || false}>
                <Button variant="destructive" className="w-full" disabled={profileData?.isOwnerOfAnyOrg}>
                  Delete My Account
                </Button>
              </DeleteAccountDialog>
              {profileData?.isOwnerOfAnyOrg && (
                <p className="text-sm text-muted-foreground mt-2">
                  You cannot delete your account while you are an owner of an organization. 
                  Please transfer ownership to another member first.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
