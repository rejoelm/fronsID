"use client";

export const dynamic = "force-dynamic";

import type React from "react";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  UploadIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  FileTextIcon,
  GraduationCapIcon,
  AwardIcon,
  BookOpenIcon,
  BriefcaseIcon,
  ShieldCheckIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  Loader2Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";
import { useSolanaWallets } from "@privy-io/react-auth/solana";
import { WalletConnection } from "@/components/wallet-connection";
import { useRouter } from "next/navigation";
import { useLoading } from "@/context/LoadingContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Sidebar } from "@/components/ui/sidebar";
import { OverviewSidebar } from "@/components/overview-sidebar";
import { useCVRegistration } from "@/hooks/useCVRegistration";
import { getPrimarySolanaWalletAddress } from "@/utils/wallet";
import HeaderImage from "@/components/header-image";

interface EditableData {
  fullName: string;
  title: string;
  profession: string;
  institution: string;
  location: string;
  field: string;
  specialization: string;
  email: string;
  phone: string;
  linkedIn: string;
  github: string;
  website: string;
  overview: string;
  orcid?: string;
  googleScholar?: string;
  education?: Array<{
    institution?: string;
    degree?: string;
    field?: string;
    startDate?: string;
    endDate?: string;
    gpa?: string;
    location?: string;
  }>;
  experience?: Array<{
    company?: string;
    position?: string;
    startDate?: string;
    endDate?: string;
    description?: string;
    location?: string;
    type?: string;
  }>;
  publications?: Array<{
    title?: string;
    authors?: string[];
    venue?: string;
    date?: string;
    doi?: string;
    url?: string;
  }>;
  awards?: Array<{
    name?: string;
    issuer?: string;
    date?: string;
    description?: string;
  }>;
}

const UnconnectedView = () => (
  <div className="container max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6 justify-center">
    <div className="text-center space-y-8">
      <div className="flex justify-center">
        <WalletConnection />
      </div>
    </div>
  </div>
);

const ConnectedView = () => {
  const { authenticated: connected, getAccessToken } = usePrivy();
  const { wallets: solanaWallets } = useSolanaWallets();
  const walletAddress = getPrimarySolanaWalletAddress(solanaWallets) ?? "";
  const validSolanaPublicKey = walletAddress || "";
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [activeTab, setActiveTab] = useState("upload");
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);
  const [editableData, setEditableData] = useState<EditableData>({
    fullName: "",
    title: "",
    profession: "",
    institution: "",
    location: "",
    field: "",
    specialization: "",
    email: "",
    phone: "",
    linkedIn: "",
    github: "",
    website: "",
    overview: "",
    orcid: "",
    googleScholar: "",
    education: [],
    experience: [],
    publications: [],
    awards: [],
  });
  const [confirmingRegistration, setConfirmingRegistration] = useState(false);
  const { isLoading } = useLoading();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);

  const {
    cvStatus,
    cvData,
    parseCV,
    uploadProgress,
    getUserProfile,
    createManualProfile,
    error: cvError,
  } = useCVRegistration(validSolanaPublicKey);

  useEffect(() => {
    if (cvError) {
      setError(cvError);
    }
  }, [cvError]);

  // Show toast notifications for errors
  useEffect(() => {
    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error,
      });
    }
  }, [error, toast]);

  useEffect(() => {
    const checkProfile = async () => {
      if (!validSolanaPublicKey) return;

      try {
        const result = await getUserProfile(validSolanaPublicKey);
        if (result?.success) {
          setShowProfile(true);
        }
      } catch (err) {
        console.error("Failed to get user profile:", err);
        toast({
          title: "Error",
          description: "Failed to load user profile",
          variant: "destructive",
        });
      }
    };

    if (connected && validSolanaPublicKey) {
      checkProfile();
    }
  }, [connected, validSolanaPublicKey, getUserProfile, toast]);

  useEffect(() => {
    if (cvStatus?.hasCV) {
      toast({
        title: "CV Updated",
        description: "Your CV has been updated successfully.",
        variant: "success",
      });

      // Redirect to profile after successful update
      setTimeout(() => {
        router.push("/your-profile");
      }, 1500);
    }
  }, [cvStatus, toast, router]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const validTypes = [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/jpg",
      ];
      if (!validTypes.includes(file.type)) {
        toast({
          variant: "destructive",
          title: "Invalid File Type",
          description: "Please select a PDF or image file (JPG, PNG).",
        });
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "File Too Large",
          description: "File size must be less than 10MB.",
        });
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleParseCV = async () => {
    if (!selectedFile) {
      setError("Please select a file");
      return;
    }

    if (!validSolanaPublicKey) {
      setError("Please connect your wallet");
      return;
    }

    setUploading(true);
    try {
      const result = await parseCV(selectedFile);

      if (result.success && result.data) {
        // Ensure all arrays are properly included in editableData
        const completeData = {
          fullName: result.data.fullName || "",
          title: result.data.title || "",
          profession: result.data.profession || "",
          institution: result.data.institution || "",
          location: result.data.location || "",
          field: result.data.field || "",
          specialization: result.data.specialization || "",
          email: result.data.email || "",
          phone: result.data.phone || "",
          linkedIn: result.data.linkedIn || "",
          github: result.data.github || "",
          website: result.data.website || "",
          overview: result.data.overview || "",
          orcid: result.data.orcid || "",
          googleScholar: result.data.googleScholar || "",
          education: result.data.education || [],
          experience: result.data.experience || [],
          publications: result.data.publications || [],
          awards: result.data.awards || [],
        };

        setEditableData(completeData);
        setShowPreview(true);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleConfirmUpdate = async () => {
    if (!validSolanaPublicKey) return;

    try {
      setConfirmingRegistration(true);

      const finalData = {
        fullName: editableData.fullName,
        institution: editableData.institution,
        profession: editableData.profession,
        field: editableData.field,
        specialization: editableData.specialization,
        email: editableData.email,
        orcid: editableData.orcid || "",
        googleScholar: editableData.googleScholar || "",
      };

      const result = await createManualProfile(finalData, validSolanaPublicKey);

      if (result.success) {
        toast({
          title: "Profile Updated Successfully",
          description: "Redirecting to your profile...",
        });

        setTimeout(() => {
          router.push("/your-profile");
        }, 1500);
      } else {
        toast({
          title: "Update Failed",
          description:
            result.message || "Failed to update profile. Please try again.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Failed to update profile:", err);
      toast({
        title: "Update Failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setConfirmingRegistration(false);
    }
  };

  const handleBackToUpload = () => {
    setShowPreview(false);
    setEditableData({
      fullName: "",
      title: "",
      profession: "",
      institution: "",
      location: "",
      field: "",
      specialization: "",
      email: "",
      phone: "",
      linkedIn: "",
      github: "",
      website: "",
      overview: "",
      orcid: "",
      googleScholar: "",
      education: [],
      experience: [],
      publications: [],
      awards: [],
    });
    setSelectedFile(null);
  };

  const handleManualSubmit = async () => {
    if (!validSolanaPublicKey) return;

    const requiredFields = [
      "fullName",
      "institution",
      "profession",
      "field",
      "specialization",
      "email",
    ] as const;
    const missingFields = requiredFields.filter((field) => {
      const value = editableData[field];
      return typeof value !== "string" || !value.trim();
    });

    if (missingFields.length > 0) {
      toast({
        title: "Missing Required Fields",
        description: `Please fill in: ${missingFields.join(", ")}`,
        variant: "destructive",
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editableData.email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await createManualProfile(
        editableData,
        validSolanaPublicKey
      );

      if (result.success) {
        toast({
          title: "Profile Updated",
          description:
            "Your profile has been updated successfully! Redirecting...",
        });

        setTimeout(() => {
          router.push("/your-profile");
        }, 1500);
      } else {
        toast({
          title: "Profile Update Failed",
          description:
            result.message || "Failed to update profile. Please try again.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Failed to update manual profile:", err);
      toast({
        title: "Profile Update Failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <div className="container max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-semibold text-primary">
              Resubmit Your CV
            </h1>
            <p className="text-md text-muted-foreground max-w-3xl mx-auto">
              Update your academic profile by resubmitting your CV or updating
              your details manually
            </p>
          </div>

          <Card className="shadow-2xl border-0 rounded-3xl bg-white overflow-hidden">
            <CardContent className="p-8">
              <div className="space-y-8">
                <Tabs
                  value={activeTab}
                  onValueChange={setActiveTab}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-2 bg-gray-50 p-1 rounded-xl h-12">
                    <TabsTrigger
                      value="upload"
                      className="rounded-none font-medium text-sm data-[state=active]:border-b-primary "
                    >
                      Upload New CV
                    </TabsTrigger>
                    <TabsTrigger
                      value="manual"
                      className="rounded-none font-medium text-sm data-[state=active]:border-b-primary "
                    >
                      Manual Update
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="upload" className="space-y-8 mt-8">
                    {!showPreview ? (
                      <>
                        <div className="border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center hover:border-primary/40 hover:bg-primary/5 transition-all duration-300 bg-gradient-to-br from-gray-50/50 to-transparent">
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={handleFileChange}
                            className="hidden"
                            id="cv-upload"
                            disabled={uploading}
                          />
                          <label
                            htmlFor="cv-upload"
                            className="cursor-pointer flex flex-col items-center space-y-6"
                          >
                            <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center">
                              <UploadIcon className="h-10 w-10 text-primary" />
                            </div>
                            <div className="space-y-3">
                              <h3 className="text-xl font-semibold text-gray-900">
                                {selectedFile
                                  ? selectedFile.name
                                  : "Upload your updated CV"}
                              </h3>
                              <p className="text-base text-muted-foreground">
                                Drag and drop your file here, or click to browse
                              </p>
                              <p className="text-sm text-gray-500">
                                Supported formats: PDF, JPG, PNG (Max 10MB)
                              </p>
                            </div>
                          </label>
                        </div>

                        {selectedFile && (
                          <div className="flex items-center justify-between p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200/50">
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                                <FileTextIcon className="h-6 w-6 text-green-600" />
                              </div>
                              <div>
                                <h4 className="text-lg font-medium text-gray-900">
                                  {selectedFile.name}
                                </h4>
                                <p className="text-sm text-gray-600">
                                  {(selectedFile.size / 1024 / 1024).toFixed(2)}{" "}
                                  MB
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedFile(null)}
                              disabled={uploading}
                              className="hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors border-gray-300"
                            >
                              Remove
                            </Button>
                          </div>
                        )}

                        {uploading && (
                          <div className="space-y-6 p-8 bg-blue-50/50 rounded-2xl border border-blue-100">
                            <div className="text-center space-y-2">
                              <div className="w-8 h-8 bg-blue-100 rounded-full mx-auto flex items-center justify-center">
                                <Loader2Icon className="h-5 w-5 text-blue-600 animate-spin" />
                              </div>
                              <h4 className="text-lg font-medium text-gray-900">
                                Processing your updated CV...
                              </h4>
                              <p className="text-sm text-gray-600">
                                This may take a few moments
                              </p>
                            </div>
                            <div className="space-y-3">
                              <Skeleton className="h-4 w-full" />
                              <Skeleton className="h-4 w-4/5" />
                              <Skeleton className="h-4 w-3/4" />
                            </div>
                          </div>
                        )}

                        <Button
                          onClick={handleParseCV}
                          disabled={!selectedFile || uploading}
                          className="w-full text-base font-medium py-4 h-12 rounded-xl"
                        >
                          {uploading ? "Processing..." : "Parse CV"}
                        </Button>
                      </>
                    ) : (
                      <div className="space-y-8">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-green-600">
                            <CheckCircleIcon className="h-4 w-4 mr-2" />
                            CV Parsed Successfully
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleBackToUpload}
                            className="flex items-center space-x-2 border-gray-300 hover:bg-gray-50"
                          >
                            <ArrowLeftIcon className="h-4 w-4" />
                            <span>Back</span>
                          </Button>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
                          <Button
                            variant="outline"
                            onClick={handleBackToUpload}
                            className="flex-1 h-12 rounded-xl font-medium border-gray-300 hover:bg-gray-50"
                          >
                            <ArrowLeftIcon className="h-4 w-4 mr-2" />
                            Back to Upload
                          </Button>
                          <Button
                            onClick={handleConfirmUpdate}
                            disabled={confirmingRegistration}
                            className="flex-1 h-12 rounded-xl font-medium text-base"
                          >
                            {confirmingRegistration
                              ? "Updating..."
                              : "Confirm Update"}
                            <ArrowRightIcon className="h-4 w-4 ml-2" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="manual" className="space-y-8 mt-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label
                          htmlFor="fullName"
                          className="text-sm font-medium text-gray-700"
                        >
                          Full Name *
                        </Label>
                        <Input
                          id="fullName"
                          type="text"
                          placeholder="Enter your full name"
                          value={editableData.fullName}
                          onChange={(e) =>
                            setEditableData((prev) => ({
                              ...prev,
                              fullName: e.target.value,
                            }))
                          }
                          disabled={uploading}
                          className="rounded-xl border-gray-300 focus:border-primary focus:ring-primary/20 h-11"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="email"
                          className="text-sm font-medium text-primary"
                        >
                          Email Address *
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="Enter your email"
                          value={editableData.email}
                          onChange={(e) =>
                            setEditableData((prev) => ({
                              ...prev,
                              email: e.target.value,
                            }))
                          }
                          disabled={uploading}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="institution"
                          className="text-sm font-medium text-primary"
                        >
                          Institution *
                        </Label>
                        <Input
                          id="institution"
                          type="text"
                          placeholder="Enter your institution"
                          value={editableData.institution}
                          onChange={(e) =>
                            setEditableData((prev) => ({
                              ...prev,
                              institution: e.target.value,
                            }))
                          }
                          disabled={uploading}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="profession"
                          className="text-sm font-medium text-primary"
                        >
                          Profession *
                        </Label>
                        <Input
                          id="profession"
                          type="text"
                          placeholder="e.g., Professor, Researcher, PhD Student"
                          value={editableData.profession}
                          onChange={(e) =>
                            setEditableData((prev) => ({
                              ...prev,
                              profession: e.target.value,
                            }))
                          }
                          disabled={uploading}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="field"
                          className="text-sm font-medium text-primary"
                        >
                          Field of Study *
                        </Label>
                        <Input
                          id="field"
                          type="text"
                          placeholder="e.g., Computer Science, Biology, Physics"
                          value={editableData.field}
                          onChange={(e) =>
                            setEditableData((prev) => ({
                              ...prev,
                              field: e.target.value,
                            }))
                          }
                          disabled={uploading}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="specialization"
                          className="text-sm font-medium text-primary"
                        >
                          Specialization *
                        </Label>
                        <Input
                          id="specialization"
                          type="text"
                          placeholder="e.g., Machine Learning, Molecular Biology"
                          value={editableData.specialization}
                          onChange={(e) =>
                            setEditableData((prev) => ({
                              ...prev,
                              specialization: e.target.value,
                            }))
                          }
                          disabled={uploading}
                        />
                      </div>
                    </div>

                    <Button
                      onClick={handleManualSubmit}
                      disabled={uploading}
                      className="w-full text-base font-medium py-4 h-12 rounded-xl"
                    >
                      {uploading ? "Updating Profile..." : "Update Profile"}
                    </Button>
                  </TabsContent>
                </Tabs>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default function ResubmitCV() {
  const { authenticated: connected } = usePrivy();

  return (
    <div className="min-h-screen bg-white flex w-full">
      <div className="hidden lg:block">
        <Sidebar>
          <OverviewSidebar connected={connected} />
        </Sidebar>
      </div>
      <div className="flex-1 w-full">
        <main className="flex-1">
          {!connected ? <UnconnectedView /> : <ConnectedView />}
        </main>
      </div>
    </div>
  );
}
