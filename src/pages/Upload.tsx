import React, { useState, useRef, useEffect } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/auth/AuthContext";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useQuery } from "@tanstack/react-query";
import { supabase, SubjectType } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload as UploadIcon, FileUp, Info, CheckCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Progress } from "@/components/ui/progress";

const uploadFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  subject_id: z.string().min(1, "Please select a subject"),
  academic_year: z.coerce.number().min(1).max(4),
  semester: z.coerce.number().min(1).max(2),
  unit_number: z.coerce.number().min(1).max(10).optional(),
});

type UploadFormData = z.infer<typeof uploadFormSchema>;

type StudentProfile = {
  academic_year: number | null;
  semester: number | null;
  branch: string | null;
};

const Upload = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentStep, setCurrentStep] = useState(1);

  const form = useForm<UploadFormData>({
    resolver: zodResolver(uploadFormSchema),
    defaultValues: {
      title: "",
      description: "",
      subject_id: "",
      academic_year: 1,
      semester: 1,
      unit_number: 1
    }
  });

  const { data: userProfile, isLoading: isProfileLoading } = useQuery({
    queryKey: ['userProfile', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        return null;
      }
      
      const { data, error } = await supabase
        .from('students')
        .select('academic_year, semester, branch')
        .eq('id', user?.id)
        .single();
      
      if (error) {
        throw error;
      }
      
      return data as StudentProfile;
    },
    enabled: !!user?.id,
    retry: 3,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true
  });

  useEffect(() => {
    try {
      if (userProfile) {
        form.setValue('academic_year', userProfile.academic_year || 1);
        form.setValue('semester', userProfile.semester || 1);
      }
    } catch (error) {
    }
  }, [userProfile, form]);

  // Get values for dependencies to avoid deep instantiation
  const academicYear = form.watch('academic_year');
  const semester = form.watch('semester');
  const branchName = userProfile?.branch;

  // Create our own subjects state
  const [subjects, setSubjects] = useState<{
    id: string;
    name: string;
    branch: string;
    academic_year: number;
    semester: number;
    is_common: boolean | null;
  }[]>([]);
  const [isSubjectsLoading, setIsSubjectsLoading] = useState(false);

  const loadSubjects = async () => {
    try {
      if (!branchName || !academicYear || !semester) {
        return;
      }
      
      setIsSubjectsLoading(true);
      
      const { data, error } = await supabase
        .from('subjects')
        .select('id, name, branch, academic_year, semester, is_common')
        .eq('academic_year', academicYear)
        .eq('semester', semester)
        .or(`branch.eq.${branchName},is_common.eq.true`);
      
      if (error) {
        toast.error("Failed to load subjects. Please try refreshing the page.");
        return;
      }
      
      setSubjects(data || []);
    } catch (err) {
      toast.error("An error occurred while loading subjects");
    } finally {
      setIsSubjectsLoading(false);
    }
  };

  // Load subjects when profile or selected year/semester changes
  useEffect(() => {
    loadSubjects();
  }, [branchName, academicYear, semester]);

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
  };

  const handleClickUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const selectedFile = files[0];
      if (selectedFile.type !== 'application/pdf') {
        toast.error('Please upload a PDF file');
        return;
      }
      
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (selectedFile.size > maxSize) {
        toast.error('File size should be less than 10MB');
        return;
      }
      
      handleFileSelect(selectedFile);
      toast.success('File selected successfully');
    }
  };

  const navigateToNextStep = () => {
    try {
      if (currentStep === 1) {
        const { title, description, subject_id } = form.getValues();
        if (!title || !description || !subject_id) {
          toast.error("Please fill all required fields before proceeding");
          return;
        }
      } else if (currentStep === 2 && !file) {
        toast.error("Please upload a PDF file before proceeding");
        return;
      }
      setCurrentStep(prev => Math.min(prev + 1, 3));
    } catch (error) {
      toast.error("There was a problem proceeding to the next step");
    }
  };

  const navigateToPrevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const onSubmit = async (data: UploadFormData) => {
    try {
      if (!file) {
        toast.error("Please upload a PDF file");
        return;
      }

      if (!user?.id) {
        toast.error("You must be logged in to upload notes");
        return;
      }
      
      setUploading(true);
      
      // Create a folder structure by subject ID for better organization
      const folderPath = `subject_${data.subject_id}`;
      const cleanFileName = file.name.replace(/\s+/g, '_'); // Replace spaces with underscores
      const fileName = `${folderPath}/${user.id}_${Date.now()}_${cleanFileName}`;
      
      try {
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('notes')
          .upload(fileName, file);
        
        if (uploadError) {
          toast.error(`File upload failed: ${uploadError.message}`);
          return;
        }
        
        const { data: publicUrlData } = supabase.storage
          .from('notes')
          .getPublicUrl(fileName);
        
        if (!publicUrlData || !publicUrlData.publicUrl) {
          throw new Error("Failed to get public URL for uploaded file");
        }
        
        const fileUrl = publicUrlData.publicUrl;
        
        const { error: insertError } = await supabase
          .from('notes')
          .insert({
            title: data.title,
            description: data.description,
            subject_id: data.subject_id,
            student_id: user.id,
            file_url: fileUrl,
            unit_number: data.unit_number || 1,
            is_approved: false,
            views: 0,
            downloads: 0
          });
        
        if (insertError) {
          toast.error(`Database error: ${insertError.message}`);
          return;
        }
        
        toast.success("Notes uploaded successfully! It will be available after admin approval.");
        
        // Add a slight delay before navigation to ensure the toast is shown
        setTimeout(() => {
          navigate('/profile');
        }, 1500);
        
      } catch (error: any) {
        toast.error(`Upload failed: ${error.message || "Unknown error occurred"}`);
      }
    } catch (error: any) {
      toast.error(`An unexpected error occurred. Please try again.`);
    } finally {
      setUploading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="space-y-6 mb-8">
      <div className="flex items-center justify-between relative">
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex flex-col items-center z-10">
            <div 
              className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                currentStep === step 
                  ? "bg-primary border-primary text-white" 
                  : currentStep > step 
                  ? "bg-primary border-primary text-white" 
                  : "bg-white/5 border-white/10 text-muted-foreground"
              }`}
            >
              {step}
            </div>
            <div className={`text-sm mt-2 font-medium transition-colors duration-300 ${
              currentStep === step || currentStep > step
                ? "text-primary" 
                : "text-muted-foreground"
            }`}>
              {step === 1 ? "Details" : step === 2 ? "Upload" : "Review"}
            </div>
          </div>
        ))}
        
        <div className="absolute top-6 left-0 w-full h-[2px] bg-white/10">
          <div 
            className="h-full bg-primary transition-all duration-300" 
            style={{ 
              width: `${((currentStep - 1) / 2) * 100}%`
            }} 
          />
        </div>
      </div>
    </div>
  );

  const renderStepContent = () => {
    switch(currentStep) {
      case 1:
        return (
          <Form {...form}>
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter a title for your notes" {...field} />
                      </FormControl>
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
                            <SelectValue placeholder="Select year" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1">Year 1</SelectItem>
                          <SelectItem value="2">Year 2</SelectItem>
                          <SelectItem value="3">Year 3</SelectItem>
                          <SelectItem value="4">Year 4</SelectItem>
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
                      <FormLabel>Semester</FormLabel>
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
                          <SelectItem value="1">Semester 1</SelectItem>
                          <SelectItem value="2">Semester 2</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="subject_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select subject" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {subjects && subjects.length > 0 ? (
                            subjects.map((subject) => (
                              <SelectItem key={subject.id} value={subject.id}>
                                {subject.name} ({subject.is_common ? 'Common' : subject.branch})
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="none" disabled>
                              No subjects available
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="unit_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit Number</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1" 
                          max="10"
                          placeholder="Enter unit number" 
                          {...field}
                          onChange={(e) => {
                            const value = e.target.value ? parseInt(e.target.value) : 1;
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Provide a brief description of your notes" 
                        className="min-h-[100px]" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end">
                <Button 
                  type="button"
                  onClick={navigateToNextStep}
                  className="w-full sm:w-auto bg-primary"
                >
                  Continue to Upload
                </Button>
              </div>
            </div>
          </Form>
        );
      case 2:
        return (
          <div className="space-y-6">
            <Form {...form}>
              <div className="space-y-4">
                <FormLabel htmlFor="pdf-upload">Upload PDF</FormLabel>
                <div 
                  className={`border-2 border-dashed rounded-lg p-8 text-center hover:bg-primary/5 transition-colors cursor-pointer ${
                    file ? 'border-primary bg-primary/5' : 'border-white/20'
                  }`}
                  onClick={handleClickUpload}
                >
                  <input
                    id="pdf-upload"
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    aria-label="Upload PDF file"
                  />
                  
                  <div className="flex flex-col items-center justify-center space-y-3">
                    {file ? (
                      <>
                        <div className="rounded-full bg-primary/20 p-4">
                          <CheckCircle className="h-10 w-10 text-primary" />
                        </div>
                        <p className="text-primary font-medium">{file.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(file.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="rounded-full bg-primary/10 p-4">
                          <UploadIcon className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">Click to upload or drag and drop</p>
                          <p className="text-sm text-muted-foreground mt-1">PDF (Max 10MB)</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="flex items-start gap-2 text-sm text-muted-foreground bg-white/5 p-4 rounded-lg">
                  <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <p>
                    Make sure your uploaded document is a PDF file and doesn't exceed 10MB in size.
                    The file will be reviewed by our team before being published.
                  </p>
                </div>
              </div>
              
              <div className="flex justify-between gap-4 mt-6">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={navigateToPrevStep}
                  className="w-full sm:w-auto"
                >
                  Back
                </Button>
                <Button 
                  type="button"
                  onClick={navigateToNextStep}
                  disabled={!file}
                  className="w-full sm:w-auto bg-primary"
                >
                  Continue to Review
                </Button>
              </div>
            </Form>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <Form {...form}>
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-6">
                <div className="text-center mb-6">
                  <div className="mx-auto w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4">
                    <FileUp className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-medium mb-2">Ready to Submit</h3>
                  <p className="text-muted-foreground">
                    Your notes will be submitted for approval. Once approved by admins, 
                    they will be published and available to other students.
                  </p>
                </div>
                
                <div className="bg-black/20 rounded-lg p-4 space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <Info className="h-5 w-5" />
                    What happens next?
                  </h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary/70" />
                      Your submission will be reviewed by our admin team
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary/70" />
                      You can track the status in your profile under "My Uploads"
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary/70" />
                      You'll receive a notification once your notes are approved
                    </li>
                  </ul>
                </div>
              </div>
              
              <div className="flex justify-between gap-4 mt-6">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={navigateToPrevStep}
                  className="w-full sm:w-auto"
                >
                  Back
                </Button>
                <Button 
                  type="button"
                  onClick={() => {
                    try {
                      if (!file) {
                        toast.error("Please upload a PDF file");
                        return;
                      }
                      
                      const formData = form.getValues();
                      if (!formData.title || !formData.description || !formData.subject_id) {
                        toast.error("Please fill all required fields");
                        return;
                      }
                      
                      onSubmit(formData);
                    } catch (error) {
                      toast.error("There was a problem submitting your notes");
                    }
                  }}
                  disabled={uploading}
                  className="w-full sm:w-auto bg-primary"
                >
                  {uploading ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <UploadIcon className="mr-2 h-4 w-4" />
                      Submit Notes
                    </>
                  )}
                </Button>
              </div>
            </Form>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 pt-24">
        <Card className="max-w-3xl mx-auto border border-white/10 bg-black/40 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Upload Notes</CardTitle>
            <CardDescription>Share your class notes with other students</CardDescription>
          </CardHeader>
          <CardContent>
            {renderStepIndicator()}
            {renderStepContent()}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Upload;
