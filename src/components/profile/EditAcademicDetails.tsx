
import { useState } from "react";
import { useAuth } from "@/auth/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { CardSkeleton } from "@/components/ui/card-skeleton";

export function EditAcademicDetails() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  
  const { data: profile, isLoading } = useQuery({
    queryKey: ['userProfile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', user?.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  const handleUpdate = async (field: string, value: string | number) => {
    try {
      const { error } = await supabase
        .from('students')
        .update({ [field]: value })
        .eq('id', user?.id);

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      toast.success('Academic details updated successfully');
    } catch (error: any) {
      toast.error('Failed to update details: ' + error.message);
    }
  };

  if (isLoading) {
    return <CardSkeleton />;
  }

  return (
    <Card className="border border-white/10 bg-black/40 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>Academic Details</CardTitle>
        <CardDescription>Update your academic information</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Academic Year</label>
          <Select
            value={profile?.academic_year?.toString()}
            onValueChange={(value) => handleUpdate('academic_year', parseInt(value))}
          >
            <SelectTrigger>
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
          <label className="text-sm font-medium">Semester</label>
          <Select
            value={profile?.semester?.toString()}
            onValueChange={(value) => handleUpdate('semester', parseInt(value))}
          >
            <SelectTrigger>
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

        <div className="space-y-2">
          <label className="text-sm font-medium">Branch</label>
          <Select
            value={profile?.branch || ''}
            onValueChange={(value) => handleUpdate('branch', value)}
          >
            <SelectTrigger>
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
      </CardContent>
    </Card>
  );
}
