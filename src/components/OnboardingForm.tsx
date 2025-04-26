
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const formSchema = z.object({
  branch: z.string().min(1, "Branch is required"),
  academic_year: z.coerce.number().min(1).max(4),
  semester: z.coerce.number().min(1).max(2)
});

type OnboardingFormData = z.infer<typeof formSchema>;

const OnboardingForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<OnboardingFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      branch: '',
      academic_year: 1,
      semester: 1
    }
  });

  const onSubmit = async (data: OnboardingFormData) => {
    if (!user) {
      toast.error("You must be logged in to complete onboarding");
      navigate('/auth');
      return;
    }
    
    setIsSubmitting(true);
    console.log("Submitting form with data:", data);
    console.log("Current user ID:", user.id);
    
    try {
      // Check if the user profile already exists
      const { data: existingProfile, error: fetchError } = await supabase
        .from('students')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "not found" error
        throw fetchError;
      }
      
      let result;
      
      if (existingProfile) {
        // Update existing profile
        console.log("Updating existing profile for user:", user.id);
        result = await supabase
          .from('students')
          .update({
            branch: data.branch,
            academic_year: data.academic_year,
            semester: data.semester,
          })
          .eq('id', user.id);
      } else {
        // Insert new profile
        console.log("Creating new profile for user:", user.id);
        result = await supabase
          .from('students')
          .insert({
            id: user.id,
            email: user.email,
            branch: data.branch,
            academic_year: data.academic_year,
            semester: data.semester,
          });
      }
      
      if (result.error) throw result.error;

      toast.success('Profile updated successfully');
      setTimeout(() => {
        navigate('/home');
      }, 1000);
    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast.error('Failed to update profile: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 neo-blur p-8 rounded-xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gradient-primary mb-2">Welcome!</h2>
          <p className="text-gray-400">Let's set up your academic profile</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="branch"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Branch</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your branch" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="CSE">Computer Science</SelectItem>
                      <SelectItem value="ECE">Electronics</SelectItem>
                      <SelectItem value="ME">Mechanical</SelectItem>
                      <SelectItem value="CE">Civil</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="academic_year"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Academic Year</FormLabel>
                  <Select 
                    onValueChange={(value) => field.onChange(parseInt(value))} 
                    defaultValue={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your year" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {[1, 2, 3, 4].map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          Year {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="semester"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Semester</FormLabel>
                  <Select 
                    onValueChange={(value) => field.onChange(parseInt(value))} 
                    defaultValue={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select semester" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {[1, 2].map((sem) => (
                        <SelectItem key={sem} value={sem.toString()}>
                          Semester {sem}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Processing...
                </div>
              ) : (
                "Complete Setup"
              )}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default OnboardingForm;
