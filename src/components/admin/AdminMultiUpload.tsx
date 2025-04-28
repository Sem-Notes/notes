import React, { useState, useEffect } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, FileUp, CheckCircle, Clock, X, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/auth/AuthContext";

// Define schema for multi-upload form
const multiUploadSchema = z.object({
  subject_id: z.string().min(1, "Please select a subject"),
  units: z.array(
    z.object({
      title: z.string().min(3, "Title must be at least 3 characters").optional(),
      description: z.string().min(10, "Description must be at least 10 characters").optional(),
      unit_number: z.number().min(1).max(5)
    })
  ).optional()
});

type MultiUploadFormData = z.infer<typeof multiUploadSchema>;

// File with metadata interface
interface UnitFile {
  file: File | null;
  title: string;
  description: string;
  unit_number: number;
  status: 'idle' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
}

const AdminMultiUpload = () => {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);
  
  // State to track files and their metadata
  const [unitFiles, setUnitFiles] = useState<UnitFile[]>([
    { file: null, title: '', description: '', unit_number: 1, status: 'idle', progress: 0 },
    { file: null, title: '', description: '', unit_number: 2, status: 'idle', progress: 0 },
    { file: null, title: '', description: '', unit_number: 3, status: 'idle', progress: 0 },
    { file: null, title: '', description: '', unit_number: 4, status: 'idle', progress: 0 },
    { file: null, title: '', description: '', unit_number: 5, status: 'idle', progress: 0 }
  ]);

  // Initialize form
  const form = useForm<MultiUploadFormData>({
    resolver: zodResolver(multiUploadSchema),
    defaultValues: {
      subject_id: "",
      units: [
        { title: "", description: "", unit_number: 1 },
        { title: "", description: "", unit_number: 2 },
        { title: "", description: "", unit_number: 3 },
        { title: "", description: "", unit_number: 4 },
        { title: "", description: "", unit_number: 5 },
      ]
    }
  });

  // Fetch all subjects for admin
  const { data: subjects, isLoading: isSubjectsLoading } = useQuery({
    queryKey: ['all-subjects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subjects')
        .select('id, name, branch, academic_year, semester, is_common')
        .order('name');
      
      if (error) {
        console.error("Error fetching subjects:", error);
        toast.error("Failed to load subjects");
        throw error;
      }
      
      return data || [];
    }
  });

  // Handle file selection for a specific unit
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, unitIndex: number) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    const selectedFile = files[0];
    // console.log(`File selected for Unit ${unitIndex + 1}:`, selectedFile.name);
    
    // Validate file type
    if (selectedFile.type !== 'application/pdf') {
      toast.error(`Unit ${unitIndex + 1}: Please upload a PDF file`);
      return;
    }
    
    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      toast.error(`Unit ${unitIndex + 1}: File size should be less than 10MB`);
      return;
    }
    
    // Extract title from filename more intelligently
    // Remove file extension and replace underscores/hyphens with spaces
    let extractedTitle = selectedFile.name
      .replace(/\.pdf$/i, '')
      .replace(/[-_]/g, ' ')
      .trim();
    
    // Capitalize first letter of each word for better presentation
    extractedTitle = extractedTitle
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    // Generate a proper description
    const defaultDescription = `Unit ${unitIndex + 1} notes for this subject. This document covers the core concepts and topics relevant to this unit.`;
    
    // Update the file in our state
    setUnitFiles(prev => {
      const newFiles = [...prev];
      newFiles[unitIndex] = {
        ...newFiles[unitIndex],
        file: selectedFile,
        title: extractedTitle || `Unit ${unitIndex + 1} Notes`,
        description: defaultDescription,
        status: 'idle',
        progress: 0
      };
      return newFiles;
    });
    
    // Also update form values for this unit
    form.setValue(`units.${unitIndex}.title`, extractedTitle || `Unit ${unitIndex + 1} Notes`);
    form.setValue(`units.${unitIndex}.description`, defaultDescription);
    
    // Provide feedback
    toast.success(`Unit ${unitIndex + 1}: File selected successfully`);
  };

  // Handle title/description changes
  const handleMetadataChange = (unitIndex: number, field: 'title' | 'description', value: string) => {
    setUnitFiles(prev => {
      const newFiles = [...prev];
      newFiles[unitIndex] = {
        ...newFiles[unitIndex],
        [field]: value
      };
      return newFiles;
    });
  };

  // Remove a file
  const removeFile = (unitIndex: number) => {
    setUnitFiles(prev => {
      const newFiles = [...prev];
      newFiles[unitIndex] = {
        ...newFiles[unitIndex],
        file: null,
        status: 'idle',
        progress: 0,
        error: undefined
      };
      return newFiles;
    });
    
    // Clear form values for this unit
    form.setValue(`units.${unitIndex}.title`, '');
    form.setValue(`units.${unitIndex}.description`, '');
  };

  // Upload a single file
  const uploadSingleFile = async (unitFile: UnitFile, subjectId: string, index: number): Promise<boolean> => {
    if (!unitFile.file || !user?.id) {
      console.error("Missing file or user ID");
      return false;
    }
    
    console.log(`Starting upload for Unit ${unitFile.unit_number}`, {
      fileName: unitFile.file.name,
      fileSize: unitFile.file.size,
      title: unitFile.title
    });
    
    try {
      // Update status to uploading
      setUnitFiles(prev => {
        const newFiles = [...prev];
        newFiles[index] = { ...newFiles[index], status: 'uploading', progress: 10 };
        return newFiles;
      });
      
      // Create folder structure and filename
      const folderPath = `subject_${subjectId}`;
      const cleanFileName = unitFile.file.name.replace(/\s+/g, '_');
      const fileName = `${folderPath}/admin_${user.id}_unit${unitFile.unit_number}_${Date.now()}_${cleanFileName}`;
      
      // console.log(`Uploading to storage path: ${fileName}`);
      
      // Upload file to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('notes')
        .upload(fileName, unitFile.file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (uploadError) {
        console.error("Storage upload error:", uploadError);
        throw uploadError;
      }
      
      // console.log("File uploaded to storage successfully");
      
      // Update progress
      setUnitFiles(prev => {
        const newFiles = [...prev];
        newFiles[index] = { ...newFiles[index], progress: 50 };
        return newFiles;
      });
      
      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('notes')
        .getPublicUrl(fileName);
      
      if (!publicUrlData || !publicUrlData.publicUrl) {
        console.error("Failed to get public URL");
        throw new Error("Failed to get public URL");
      }
      
      const fileUrl = publicUrlData.publicUrl;
      // console.log("Public URL generated:", fileUrl);
      
      // Update progress
      setUnitFiles(prev => {
        const newFiles = [...prev];
        newFiles[index] = { ...newFiles[index], progress: 75 };
        return newFiles;
      });
      
      const noteData = {
        title: unitFile.title || `Unit ${unitFile.unit_number} Notes`,
        description: unitFile.description || `Notes for Unit ${unitFile.unit_number}`,
        subject_id: subjectId,
        student_id: user.id,
        file_url: fileUrl,
        unit_number: unitFile.unit_number,
        is_approved: true, // Auto-approve admin uploads
        views: 0,
        downloads: 0
      };
      
      // console.log("Inserting note record:", noteData);
      
      // Insert note into database
      const { error: insertError } = await supabase
        .from('notes')
        .insert(noteData);
      
      if (insertError) {
        console.error("Database insert error:", insertError);
        throw insertError;
      }
      
      // console.log("Note record created successfully");
      
      // Update status to success
      setUnitFiles(prev => {
        const newFiles = [...prev];
        newFiles[index] = { ...newFiles[index], status: 'success', progress: 100 };
        return newFiles;
      });
      
      return true;
    } catch (error: any) {
      console.error(`Error uploading Unit ${unitFile.unit_number}:`, error);
      
      // Create a more user-friendly error message
      let errorMessage = "Upload failed";
      if (error.message) {
        if (error.message.includes("storage/object-too-large")) {
          errorMessage = "File is too large";
        } else if (error.message.includes("duplicate")) {
          errorMessage = "A file with this name already exists";
        } else if (error.message.includes("permission")) {
          errorMessage = "No permission to upload";
        } else {
          errorMessage = error.message;
        }
      }
      
      // Update status to error
      setUnitFiles(prev => {
        const newFiles = [...prev];
        newFiles[index] = { 
          ...newFiles[index], 
          status: 'error', 
          progress: 0,
          error: errorMessage
        };
        return newFiles;
      });
      
      return false;
    }
  };

  // Reset the form after successful upload
  const resetForm = () => {
    // Reset unit files
    setUnitFiles([
      { file: null, title: '', description: '', unit_number: 1, status: 'idle', progress: 0 },
      { file: null, title: '', description: '', unit_number: 2, status: 'idle', progress: 0 },
      { file: null, title: '', description: '', unit_number: 3, status: 'idle', progress: 0 },
      { file: null, title: '', description: '', unit_number: 4, status: 'idle', progress: 0 },
      { file: null, title: '', description: '', unit_number: 5, status: 'idle', progress: 0 }
    ]);
    
    // Reset form values
    form.reset({
      subject_id: "",
      units: [
        { title: "", description: "", unit_number: 1 },
        { title: "", description: "", unit_number: 2 },
        { title: "", description: "", unit_number: 3 },
        { title: "", description: "", unit_number: 4 },
        { title: "", description: "", unit_number: 5 },
      ]
    });
    
    // Reset progress
    setOverallProgress(0);
  };

  // Handle form submission
  const onSubmit = async (data: MultiUploadFormData) => {
    // console.log("Form submitted with data:", data);
    
    // Check if subject is selected
    if (!data.subject_id) {
      toast.error("Please select a subject first");
      return;
    }
    
    // Verify at least one file is selected
    const hasFiles = unitFiles.some(unit => unit.file !== null);
    if (!hasFiles) {
      toast.error("Please upload at least one PDF file");
      return;
    }
    
    // Start upload process
    setIsUploading(true);
    setOverallProgress(0);
    
    try {
      let successCount = 0;
      let totalToUpload = unitFiles.filter(unit => unit.file !== null).length;
      
      // console.log(`Starting upload of ${totalToUpload} files for subject ID: ${data.subject_id}`);
      
      // Upload files in sequence
      for (let i = 0; i < unitFiles.length; i++) {
        if (unitFiles[i].file) {
          // console.log(`Processing Unit ${i+1} file: ${unitFiles[i].file.name}`);
          const success = await uploadSingleFile(unitFiles[i], data.subject_id, i);
          if (success) {
            successCount++;
            // console.log(`Unit ${i+1} uploaded successfully`);
          } else {
            // console.error(`Unit ${i+1} upload failed`);
          }
          
          // Update overall progress
          setOverallProgress(Math.round((successCount / totalToUpload) * 100));
        }
      }
      
      // console.log(`Upload complete. ${successCount} of ${totalToUpload} files uploaded successfully.`);
      
      // Show success message
      if (successCount > 0) {
        toast.success(`Successfully uploaded ${successCount} of ${totalToUpload} unit files`);
        
        // Reset form after successful upload
        setTimeout(() => {
          resetForm();
        }, 2000);
      } else {
        toast.error("No files were uploaded successfully");
      }
    } catch (error: any) {
      console.error("Error in multi-upload process:", error);
      toast.error(`Upload failed: ${error.message || "Unknown error"}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="border border-white/10 bg-black/40 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Multi-Unit PDF Upload</span>
        </CardTitle>
        <CardDescription>
          Upload PDF files for multiple units of a subject at once
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Subject Selection */}
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
                      {isSubjectsLoading ? (
                        <SelectItem value="loading" disabled>Loading subjects...</SelectItem>
                      ) : subjects && subjects.length > 0 ? (
                        subjects.map((subject) => (
                          <SelectItem key={subject.id} value={subject.id}>
                            {subject.name} - Year {subject.academic_year}, Sem {subject.semester} ({subject.is_common ? 'Common' : subject.branch})
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>No subjects available</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Upload Summary Card */}
            {unitFiles.some(unit => unit.file !== null) && (
              <Card className="border border-primary/20 bg-primary/5 p-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    <h4 className="font-medium text-sm">Upload Summary</h4>
                    <p className="text-xs text-muted-foreground">
                      {unitFiles.filter(unit => unit.file !== null).length} file(s) selected
                    </p>
                  </div>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={resetForm}
                    disabled={isUploading}
                  >
                    <X className="h-3 w-3 mr-1" /> Clear All
                  </Button>
                </div>
              </Card>
            )}
            
            {/* Unit Files Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Unit Files</h3>
              
              {/* File Upload Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {unitFiles.map((unitFile, index) => (
                  <Card key={index} className={`border ${unitFile.status === 'success' ? 'border-green-500/50' : unitFile.status === 'error' ? 'border-red-500/50' : 'border-white/10'}`}>
                    <CardHeader className="p-4">
                      <CardTitle className="text-base flex justify-between items-center">
                        <span>Unit {index + 1}</span>
                        {unitFile.file && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => removeFile(index)}
                            disabled={isUploading}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </CardTitle>
                    </CardHeader>
                    
                    <CardContent className="p-4 pt-0">
                      {unitFile.status === 'success' ? (
                        <div className="flex items-center text-green-500 gap-2">
                          <CheckCircle className="h-5 w-5" />
                          <span>Successfully uploaded</span>
                        </div>
                      ) : unitFile.status === 'error' ? (
                        <div className="flex items-center text-red-500 gap-2">
                          <AlertCircle className="h-5 w-5" />
                          <span>{unitFile.error || "Upload failed"}</span>
                        </div>
                      ) : unitFile.file ? (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 text-sm">
                            <FileUp className="h-4 w-4" />
                            <span className="truncate">{unitFile.file.name}</span>
                            <span className="text-muted-foreground ml-auto whitespace-nowrap">
                              {(unitFile.file.size / 1024 / 1024).toFixed(2)} MB
                            </span>
                          </div>
                          
                          {unitFile.status === 'uploading' && (
                            <Progress value={unitFile.progress} className="h-1" />
                          )}
                          
                          <div className="space-y-3">
                            <div className="space-y-2">
                              <FormLabel htmlFor={`title-${index}`} className="text-xs">Title</FormLabel>
                              <Input
                                id={`title-${index}`}
                                value={unitFile.title}
                                onChange={(e) => handleMetadataChange(index, 'title', e.target.value)}
                                placeholder={`Unit ${index + 1} Notes`}
                                disabled={isUploading}
                                className="text-sm"
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <FormLabel htmlFor={`description-${index}`} className="text-xs">Description</FormLabel>
                              <Textarea
                                id={`description-${index}`}
                                value={unitFile.description}
                                onChange={(e) => handleMetadataChange(index, 'description', e.target.value)}
                                placeholder={`Notes for Unit ${index + 1}`}
                                disabled={isUploading}
                                className="text-sm min-h-[80px]"
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-6">
                          <input
                            type="file"
                            id={`file-upload-${index}`}
                            onChange={(e) => handleFileChange(e, index)}
                            className="hidden"
                            accept=".pdf"
                            disabled={isUploading}
                          />
                          <label
                            htmlFor={`file-upload-${index}`}
                            className="cursor-pointer flex flex-col items-center gap-2"
                          >
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                              <Upload className="h-5 w-5 text-primary" />
                            </div>
                            <span className="text-sm font-medium">Click to upload Unit {index + 1} PDF</span>
                            <span className="text-xs text-muted-foreground">PDF up to 10MB</span>
                          </label>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
            
            {/* Overall Progress */}
            {isUploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Overall Progress</span>
                  <span>{overallProgress}%</span>
                </div>
                <Progress value={overallProgress} className="h-2" />
              </div>
            )}
            
            {/* Submit Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                type="submit" 
                className="flex-1" 
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <Clock className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Unit PDFs
                  </>
                )}
              </Button>
              
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1 sm:flex-none" 
                onClick={resetForm}
                disabled={isUploading}
              >
                Reset Form
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default AdminMultiUpload; 