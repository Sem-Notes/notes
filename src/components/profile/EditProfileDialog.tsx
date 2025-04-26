
import React, { useState } from 'react';
import { useAuth } from '@/auth/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save } from 'lucide-react';

type ProfileData = {
  full_name: string;
  academic_year: number;
  semester: number;
  branch: string;
};

interface EditProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: ProfileData;
}

export function EditProfileDialog({ isOpen, onClose, initialData }: EditProfileDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>(initialData);

  const handleChange = (field: keyof ProfileData, value: string | number) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!user?.id) return;
    
    try {
      setIsSaving(true);
      
      const { error } = await supabase
        .from('students')
        .update({
          full_name: profileData.full_name,
          academic_year: profileData.academic_year,
          semester: profileData.semester,
          branch: profileData.branch
        })
        .eq('id', user.id);

      if (error) throw error;
      
      // Invalidate relevant queries
      await queryClient.invalidateQueries({ queryKey: ['userProfile', user.id] });
      toast.success('Profile updated successfully');
      onClose();
    } catch (error: any) {
      toast.error('Failed to update profile: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] bg-black/90 border border-white/10">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Update your profile information below
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              id="full_name"
              value={profileData.full_name || ''}
              onChange={(e) => handleChange('full_name', e.target.value)}
              className="bg-black/20 border-white/10"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="branch">Branch</Label>
            <Select
              value={profileData.branch || ''}
              onValueChange={(value) => handleChange('branch', value)}
            >
              <SelectTrigger className="bg-black/20 border-white/10">
                <SelectValue placeholder="Select branch" />
              </SelectTrigger>
              <SelectContent>
                {['CSE', 'ECE', 'ME', 'CE', 'EE'].map((branch) => (
                  <SelectItem key={branch} value={branch}>
                    {branch}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="academic_year">Academic Year</Label>
            <Select
              value={profileData.academic_year?.toString()}
              onValueChange={(value) => handleChange('academic_year', parseInt(value))}
            >
              <SelectTrigger className="bg-black/20 border-white/10">
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4].map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    Year {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="semester">Semester</Label>
            <Select
              value={profileData.semester?.toString()}
              onValueChange={(value) => handleChange('semester', parseInt(value))}
            >
              <SelectTrigger className="bg-black/20 border-white/10">
                <SelectValue placeholder="Select semester" />
              </SelectTrigger>
              <SelectContent>
                {[1, 2].map((sem) => (
                  <SelectItem key={sem} value={sem.toString()}>
                    Semester {sem}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
