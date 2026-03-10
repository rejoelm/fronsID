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
      <div className="space-y-4"></div>
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
  const [showUsernameStep, setShowUsernameStep] = useState(false);
  const [username, setUsername] = useState("");
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(
    null
  );
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [settingUsername, setSettingUsername] = useState(false);
  const [profileJustCreated, setProfileJustCreated] = useState(false);
  const [currentStep, setCurrentStep] = useState(1); // 1: CV Review, 2: Username Setup, 3: Complete
  const [checkingUsernameStatus, setCheckingUsernameStatus] = useState(true);
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
    const checkUsernameStatus = async () => {
      if (!connected || !validSolanaPublicKey) {
        setCheckingUsernameStatus(false);
        return;
      }

      try {
        const authToken = await getAccessToken();
        const apiBaseUrl =
          process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5001/api";

        const response = await fetch(`${apiBaseUrl}/auth/username/status`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });

        const result = await response.json();

        if (result.success && result.data.hasUsername) {
          // User already has username, redirect to resubmit CV page
          toast({
            title: "Profile Found",
            description:
              "You already have a profile. Redirecting to resubmit CV...",
          });

          setTimeout(() => {
            router.push("/resubmit-cv");
          }, 1000);
          return;
        }

        // Check if user has CV but no username (continue with regular flow)
        const profileResult = await getUserProfile(validSolanaPublicKey);
        if (profileResult?.success && !profileJustCreated) {
          setShowProfile(true);
        }
      } catch (err) {
        console.error("Failed to check username status:", err);
        // Continue with regular flow if check fails
      } finally {
        setCheckingUsernameStatus(false);
      }
    };

    if (connected && validSolanaPublicKey) {
      checkUsernameStatus();
    } else {
      setCheckingUsernameStatus(false);
    }
  }, [
    connected,
    validSolanaPublicKey,
    getUserProfile,
    getAccessToken,
    router,
    toast,
    profileJustCreated,
  ]);

  useEffect(() => {
    if (cvStatus?.hasCV) {
      toast({
        title: "CV Verified",
        description:
          "Your CV has been verified successfully. You can now submit manuscripts.",
        variant: "success",
      });
    } else if (cvStatus && !cvStatus.hasCV) {
      toast({
        title: "⚠️ CV Required",
        description:
          "Please upload your CV or fill in your profile details to submit manuscripts.",
      });
    }
  }, [cvStatus, toast]);

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
        setCurrentStep(1); // Move to CV review step
      }
    } finally {
      setUploading(false);
    }
  };

  const handleConfirmRegistration = async () => {
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
        orcid: "",
        googleScholar: "",
      };

      const result = await createManualProfile(finalData, validSolanaPublicKey);

      if (result.success) {
        toast({
          title: "Profile Created Successfully",
          description: "Now let's set up your username!",
        });
        setProfileJustCreated(true);
        setCurrentStep(2); // Move to username step
        setShowPreview(false);
      } else {
        toast({
          title: "Registration Failed",
          description:
            result.message || "Failed to register profile. Please try again.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Failed to register profile:", err);
      toast({
        title: "Registration Failed",
        description: "Failed to register profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setConfirmingRegistration(false);
    }
  };

  const handleBackToUpload = () => {
    setShowPreview(false);
    setCurrentStep(0); // Reset to initial step
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

  const handleLoadProfile = async () => {
    if (!validSolanaPublicKey) return;

    try {
      const result = await getUserProfile(validSolanaPublicKey);
      if (result?.success) {
        setShowProfile(true);
      }
    } catch (err) {
      console.error("Failed to load profile:", err);
    }
  };

  const handleManualFormChange = (field: string, value: string) => {
    setEditableData((prev) => ({
      ...prev,
      [field]: value,
    }));
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
          title: "Profile Created",
          description: "Now let's set up your username!",
        });
        setProfileJustCreated(true);
        setCurrentStep(2); // Move to username step
      } else {
        toast({
          title: "Profile Creation Failed",
          description:
            result.message || "Failed to create profile. Please try again.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Failed to create manual profile:", err);
      toast({
        title: "Profile Creation Failed",
        description: "Failed to create profile. Please try again.",
        variant: "destructive",
      });
    } finally {
    }
  };

  const checkUsernameAvailability = async (usernameToCheck: string) => {
    if (usernameToCheck.length < 3) {
      setUsernameAvailable(null);
      return;
    }

    setCheckingUsername(true);
    try {
      const apiBaseUrl =
        process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5001/api";
      const response = await fetch(
        `${apiBaseUrl}/auth/username/check/${usernameToCheck}`
      );
      const result = await response.json();
      setUsernameAvailable(result.data?.available || false);
    } catch (error) {
      console.error("Error checking username:", error);
      setUsernameAvailable(null);
    } finally {
      setCheckingUsername(false);
    }
  };

  const handleUsernameChange = (value: string) => {
    setUsername(value);
    setUsernameAvailable(null);

    // Debounce the API call
    const timeoutId = setTimeout(() => {
      checkUsernameAvailability(value);
    }, 500);

    return () => clearTimeout(timeoutId);
  };

  const handleSetUsername = async () => {
    if (!username || !usernameAvailable) return;

    setSettingUsername(true);
    try {
      const apiBaseUrl =
        process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5001/api";
      const authToken = await getAccessToken();

      const response = await fetch(`${apiBaseUrl}/auth/username/set`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ username }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Registration Complete!",
          description:
            "Your username has been set successfully. Redirecting to your profile...",
          className: "bg-white text-green-600 border-green-500 shadow-lg",
        });

        // Redirect to your-profile page after a short delay
        setTimeout(() => {
          router.push("/your-profile");
        }, 1500);
      } else {
        toast({
          title: "Failed to Set Username",
          description: result.message || "Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error setting username:", error);
      toast({
        title: "Error",
        description: "Failed to set username. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSettingUsername(false);
    }
  };

  return (
    <>
      <div className="container max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-semibold text-primary">
              Create Your Academic Profile
            </h1>
            <p className="text-md text-muted-foreground max-w-3xl mx-auto">
              Create your academic profile to verify your credentials and enable
              manuscript submission. You can either upload your CV or fill in
              your details manually
            </p>
          </div>

          <Card className="shadow-2xl border-0 rounded-3xl bg-white overflow-hidden">
            <CardContent className="p-8">
              {checkingUsernameStatus ? (
                <div className="space-y-6 p-8 text-center">
                  <div className="w-8 h-8 bg-primary/10 rounded-full mx-auto flex items-center justify-center">
                    <Loader2Icon className="h-5 w-5 text-primary animate-spin" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-lg font-medium text-gray-900">
                      Checking your profile...
                    </h4>
                    <p className="text-sm text-gray-600">
                      Please wait while we verify your account status
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Step Progress Indicator */}
                  {(currentStep === 1 || currentStep === 2) && (
                    <div className="mb-8">
                      <div className="flex items-center justify-center space-x-4 mb-6">
                        <div className="flex items-center">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                              currentStep >= 1
                                ? "bg-primary text-white"
                                : "bg-gray-200 text-gray-600"
                            }`}
                          >
                            1
                          </div>
                          <span
                            className={`ml-2 text-sm font-medium ${
                              currentStep >= 1
                                ? "text-primary"
                                : "text-gray-500"
                            }`}
                          >
                            Review CV
                          </span>
                        </div>
                        <div
                          className={`flex-1 h-1 rounded ${
                            currentStep >= 2 ? "bg-primary" : "bg-gray-200"
                          } max-w-24`}
                        ></div>
                        <div className="flex items-center">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                              currentStep >= 2
                                ? "bg-primary text-white"
                                : "bg-gray-200 text-gray-600"
                            }`}
                          >
                            2
                          </div>
                          <span
                            className={`ml-2 text-sm font-medium ${
                              currentStep >= 2
                                ? "text-primary"
                                : "text-gray-500"
                            }`}
                          >
                            Add Username
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {currentStep === 2 ? (
                    <div className="space-y-8">
                      <div className="text-center space-y-4">
                        <div>
                          <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                            Choose Your Username
                          </h3>
                          <p className="text-base text-gray-600 max-w-lg mx-auto">
                            Your username will be used for your public profile
                            URL and to identify you on the platform.
                          </p>
                        </div>
                      </div>

                      <div className="max-w-md mx-auto space-y-4">
                        <div className="space-y-2">
                          <Label
                            htmlFor="username"
                            className="text-sm font-medium text-gray-700"
                          >
                            Username
                          </Label>
                          <div className="relative">
                            <Input
                              id="username"
                              type="text"
                              placeholder="Enter your username"
                              value={username}
                              onChange={(e) =>
                                handleUsernameChange(e.target.value)
                              }
                              className="rounded-xl border-gray-300 focus:border-primary focus:ring-primary/20 h-12 text-base"
                              disabled={settingUsername}
                            />
                            {checkingUsername && (
                              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                <Loader2Icon className="h-4 w-4 text-gray-400 animate-spin" />
                              </div>
                            )}
                          </div>
                        </div>

                        {username.length > 0 && username.length < 3 && (
                          <p className="text-sm text-amber-600 flex items-center space-x-1">
                            <span>⚠️</span>
                            <span>
                              Username must be at least 3 characters long
                            </span>
                          </p>
                        )}

                        {usernameAvailable === true && (
                          <p className="text-sm text-green-600 flex items-center space-x-1">
                            Username is available
                          </p>
                        )}

                        {usernameAvailable === false && (
                          <p className="text-sm text-red-600 flex items-center space-x-1">
                            Username is already taken
                          </p>
                        )}

                        <div className="text-sm text-gray-500">
                          <p className="mb-1">
                            Your profile will be available at:
                          </p>
                          <p className="font-mono bg-gray-50 px-3 py-2 rounded-lg">
                            fronsciers.com/{username || "your-username"}
                          </p>
                        </div>

                        <Button
                          onClick={handleSetUsername}
                          disabled={
                            !username || !usernameAvailable || settingUsername
                          }
                          className="w-full h-12 rounded-xl font-medium text-base"
                        >
                          {settingUsername ? (
                            <>
                              <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                              Setting Username...
                            </>
                          ) : (
                            "Complete Registration"
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : currentStep === 3 && showProfile ? (
                    <div className="text-center space-y-8 py-12">
                      <div className="space-y-3">
                        <h3 className="text-2xl font-semibold text-gray-900">
                          Profile Successfully Created!
                        </h3>
                        <p className="text-base text-gray-600 max-w-2xl mx-auto">
                          Your academic profile has been created and verified.
                          You can now view your profile, submit manuscripts, or
                          explore the platform.
                        </p>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
                        <Button
                          onClick={() => router.push("/your-profile")}
                          className="flex-1 h-12 rounded-xl font-medium text-base"
                        >
                          View My Profile
                          <ArrowRightIcon className="h-4 w-4 ml-2" />
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => router.push("/author-dashboard")}
                          className="flex-1 h-12 rounded-xl font-medium border-gray-300 hover:bg-gray-50"
                        >
                          Go to Dashboard
                        </Button>
                      </div>
                    </div>
                  ) : currentStep === 1 && showPreview ? (
                    <div className="space-y-8">
                      <Tabs defaultValue="overview" className="w-full">
                        <TabsList className="grid w-full grid-cols-6 bg-gray-50 p-1 rounded-xl h-12 gap-1">
                          <TabsTrigger
                            value="overview"
                            className="text-xs font-medium data-[state=active]:bg-white data-[state=active]:border-b-primary data-[state=active]:text-primary rounded-none"
                          >
                            Overview
                          </TabsTrigger>
                          <TabsTrigger
                            value="docis"
                            className="rounded-none text-xs font-medium data-[state=active]:bg-white data-[state=active]:border-b-primary data-[state=active]:text-primary"
                          >
                            DOCIs
                          </TabsTrigger>
                          <TabsTrigger
                            value="publications"
                            className="rounded-none text-xs font-medium data-[state=active]:bg-white data-[state=active]:border-b-primary data-[state=active]:text-primary"
                          >
                            Publications
                          </TabsTrigger>
                          <TabsTrigger
                            value="experience"
                            className="rounded-none text-xs font-medium data-[state=active]:bg-white data-[state=active]:border-b-primary data-[state=active]:text-primary"
                          >
                            Experience
                          </TabsTrigger>
                          <TabsTrigger
                            value="education"
                            className="rounded-none text-xs font-medium data-[state=active]:bg-white data-[state=active]:border-b-primary data-[state=active]:text-primary"
                          >
                            Education
                          </TabsTrigger>
                          <TabsTrigger
                            value="awards"
                            className="rounded-none text-xs font-medium data-[state=active]:bg-white data-[state=active]:border-b-primary data-[state=active]:text-primary"
                          >
                            Awards
                          </TabsTrigger>
                        </TabsList>

                        <TabsContent
                          value="overview"
                          className="space-y-8 mt-8"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                              <Label
                                htmlFor="step1-fullName"
                                className="text-sm font-medium text-gray-700"
                              >
                                Full Name *
                              </Label>
                              <Input
                                id="step1-fullName"
                                value={editableData.fullName}
                                onChange={(e) =>
                                  setEditableData((prev) => ({
                                    ...prev,
                                    fullName: e.target.value,
                                  }))
                                }
                                placeholder="Enter your full name"
                                className="rounded-xl border-gray-300 focus:border-primary focus:ring-primary/20 h-11"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label
                                htmlFor="step1-email"
                                className="text-sm font-medium text-primary"
                              >
                                Email *
                              </Label>
                              <Input
                                id="step1-email"
                                value={editableData.email}
                                onChange={(e) =>
                                  setEditableData((prev) => ({
                                    ...prev,
                                    email: e.target.value,
                                  }))
                                }
                                placeholder="Enter your email"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label
                                htmlFor="step1-institution"
                                className="text-sm font-medium text-primary"
                              >
                                Institution *
                              </Label>
                              <Input
                                id="step1-institution"
                                value={editableData.institution}
                                onChange={(e) =>
                                  setEditableData((prev) => ({
                                    ...prev,
                                    institution: e.target.value,
                                  }))
                                }
                                placeholder="Enter your institution"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label
                                htmlFor="step1-profession"
                                className="text-sm font-medium text-primary"
                              >
                                Profession *
                              </Label>
                              <Input
                                id="step1-profession"
                                value={editableData.profession}
                                onChange={(e) =>
                                  setEditableData((prev) => ({
                                    ...prev,
                                    profession: e.target.value,
                                  }))
                                }
                                placeholder="Enter your profession"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label
                                htmlFor="step1-field"
                                className="text-sm font-medium text-primary"
                              >
                                Field of Study *
                              </Label>
                              <Input
                                id="step1-field"
                                value={editableData.field}
                                onChange={(e) =>
                                  setEditableData((prev) => ({
                                    ...prev,
                                    field: e.target.value,
                                  }))
                                }
                                placeholder="Enter your field of study"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label
                                htmlFor="step1-specialization"
                                className="text-sm font-medium text-primary"
                              >
                                Specialization *
                              </Label>
                              <Input
                                id="step1-specialization"
                                value={editableData.specialization}
                                onChange={(e) =>
                                  setEditableData((prev) => ({
                                    ...prev,
                                    specialization: e.target.value,
                                  }))
                                }
                                placeholder="Enter your specialization"
                              />
                            </div>
                          </div>
                        </TabsContent>

                        <TabsContent value="docis" className="space-y-6 mt-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <Label
                                htmlFor="step1-orcid"
                                className="text-sm font-medium text-primary"
                              >
                                ORCID ID
                              </Label>
                              <Input
                                id="step1-orcid"
                                value={editableData.orcid || ""}
                                onChange={(e) =>
                                  setEditableData((prev) => ({
                                    ...prev,
                                    orcid: e.target.value,
                                  }))
                                }
                                placeholder="https://orcid.org/0000-0000-0000-0000"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label
                                htmlFor="step1-googleScholar"
                                className="text-sm font-medium text-primary"
                              >
                                Google Scholar Profile
                              </Label>
                              <Input
                                id="step1-googleScholar"
                                value={editableData.googleScholar || ""}
                                onChange={(e) =>
                                  setEditableData((prev) => ({
                                    ...prev,
                                    googleScholar: e.target.value,
                                  }))
                                }
                                placeholder="https://scholar.google.com/citations?user=..."
                              />
                            </div>

                            <div className="space-y-2">
                              <Label
                                htmlFor="step1-linkedIn"
                                className="text-sm font-medium text-primary"
                              >
                                LinkedIn Profile
                              </Label>
                              <Input
                                id="step1-linkedIn"
                                value={editableData.linkedIn}
                                onChange={(e) =>
                                  setEditableData((prev) => ({
                                    ...prev,
                                    linkedIn: e.target.value,
                                  }))
                                }
                                placeholder="https://linkedin.com/in/..."
                              />
                            </div>

                            <div className="space-y-2">
                              <Label
                                htmlFor="step1-github"
                                className="text-sm font-medium text-primary"
                              >
                                GitHub Profile
                              </Label>
                              <Input
                                id="step1-github"
                                value={editableData.github}
                                onChange={(e) =>
                                  setEditableData((prev) => ({
                                    ...prev,
                                    github: e.target.value,
                                  }))
                                }
                                placeholder="https://github.com/..."
                              />
                            </div>
                          </div>
                        </TabsContent>

                        <TabsContent
                          value="publications"
                          className="space-y-6 mt-6"
                        >
                          {editableData.publications &&
                          editableData.publications.length > 0 ? (
                            <div className="space-y-4">
                              <div className="space-y-3">
                                {editableData.publications.map((pub, index) => (
                                  <div
                                    key={index}
                                    className="p-6 bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                                  >
                                    <div className="space-y-3">
                                      <h4 className="font-semibold text-gray-900 text-lg leading-tight">
                                        {pub.title}
                                      </h4>
                                      <div className="text-sm text-gray-600 space-y-1">
                                        {pub.authors &&
                                          pub.authors.length > 0 && (
                                            <div>
                                              <span className="font-medium">
                                                Authors:
                                              </span>{" "}
                                              {Array.isArray(pub.authors)
                                                ? pub.authors.join(", ")
                                                : pub.authors}
                                            </div>
                                          )}
                                        {pub.venue && (
                                          <div>
                                            <span className="font-medium">
                                              Published in:
                                            </span>{" "}
                                            {pub.venue}
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-4 text-sm text-gray-500">
                                        {pub.date && <span>{pub.date}</span>}
                                        {pub.doi && <span>DOI: {pub.doi}</span>}
                                      </div>
                                      {pub.url && (
                                        <div className="pt-2">
                                          <a
                                            href={pub.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-primary hover:text-primary/80 font-medium text-sm"
                                          >
                                            View Publication →
                                          </a>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-12 bg-gray-50 rounded-2xl">
                              <BookOpenIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                              <h4 className="text-lg font-medium text-gray-600 mb-2">
                                No Publications Found
                              </h4>
                              <p className="text-gray-500">
                                No publications were found in your CV
                              </p>
                            </div>
                          )}
                        </TabsContent>

                        <TabsContent
                          value="experience"
                          className="space-y-6 mt-6"
                        >
                          {editableData.experience &&
                          editableData.experience.length > 0 ? (
                            <div className="space-y-4">
                              <div className="space-y-3">
                                {editableData.experience.map((exp, index) => (
                                  <div
                                    key={index}
                                    className="p-6 bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                                  >
                                    <div className="space-y-3">
                                      <h4 className="font-semibold text-gray-900 text-lg">
                                        {exp.position}
                                      </h4>
                                      <div className="text-base text-gray-600">
                                        <span className="font-medium">
                                          {exp.company}
                                        </span>
                                        {exp.location && (
                                          <span className="text-gray-500">
                                            {" "}
                                            • {exp.location}
                                          </span>
                                        )}
                                        {exp.type && (
                                          <span className="text-gray-500">
                                            {" "}
                                            • {exp.type}
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-sm text-gray-500 font-medium">
                                        {exp.startDate && exp.endDate
                                          ? `${exp.startDate} - ${exp.endDate}`
                                          : exp.startDate
                                          ? `Started ${exp.startDate}`
                                          : exp.endDate
                                          ? `Ended ${exp.endDate}`
                                          : ""}
                                      </div>
                                      {exp.description && (
                                        <div className="text-sm text-gray-700 leading-relaxed">
                                          {exp.description}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-8">
                              <BriefcaseIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                              <p className="text-gray-500">
                                No experience found in your CV
                              </p>
                            </div>
                          )}
                        </TabsContent>

                        <TabsContent
                          value="education"
                          className="space-y-6 mt-6"
                        >
                          {editableData.education &&
                          editableData.education.length > 0 ? (
                            <div className="space-y-4">
                              <div className="space-y-3">
                                {editableData.education.map((edu, index) => (
                                  <div
                                    key={index}
                                    className="p-4 bg-gray-50 rounded-lg border"
                                  >
                                    <div className="space-y-2">
                                      <div className="font-medium text-gray-900">
                                        {edu.degree}{" "}
                                        {edu.field && `in ${edu.field}`}
                                      </div>
                                      <div className="text-sm text-gray-600">
                                        {edu.institution}{" "}
                                        {edu.location && `• ${edu.location}`}
                                      </div>
                                      <div className="text-sm text-gray-500">
                                        {edu.startDate && edu.endDate
                                          ? `${edu.startDate} - ${edu.endDate}`
                                          : edu.startDate
                                          ? `Started ${edu.startDate}`
                                          : edu.endDate
                                          ? `Ended ${edu.endDate}`
                                          : ""}
                                        {edu.gpa && ` • GPA: ${edu.gpa}`}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-8">
                              <GraduationCapIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                              <p className="text-gray-500">
                                No education found in your CV
                              </p>
                            </div>
                          )}
                        </TabsContent>

                        <TabsContent value="awards" className="space-y-6 mt-6">
                          {editableData.awards &&
                          editableData.awards.length > 0 ? (
                            <div className="space-y-4">
                              <div className="space-y-3">
                                {editableData.awards.map((award, index) => (
                                  <div
                                    key={index}
                                    className="p-4 bg-gray-50 rounded-lg border"
                                  >
                                    <div className="space-y-2">
                                      <div className="font-medium text-gray-900">
                                        {award.name}
                                      </div>
                                      <div className="text-sm text-gray-600">
                                        {award.issuer &&
                                          `Issued by: ${award.issuer}`}
                                      </div>
                                      <div className="text-sm text-gray-500">
                                        {award.date && `Date: ${award.date}`}
                                      </div>
                                      {award.description && (
                                        <div className="text-sm text-gray-700 mt-2">
                                          {award.description}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-8">
                              <AwardIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                              <p className="text-gray-500">
                                No awards found in your CV
                              </p>
                            </div>
                          )}
                        </TabsContent>
                      </Tabs>

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
                          onClick={() => setCurrentStep(2)}
                          disabled={
                            !editableData.fullName ||
                            !editableData.email ||
                            !editableData.institution ||
                            !editableData.profession ||
                            !editableData.field ||
                            !editableData.specialization
                          }
                          className="flex-1 h-12 rounded-xl font-medium text-base"
                        >
                          Continue to Username Setup
                          <ArrowRightIcon className="h-4 w-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    (currentStep === 0 ||
                      (!showPreview && currentStep === 1)) && (
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
                              Upload CV
                            </TabsTrigger>
                            <TabsTrigger
                              value="manual"
                              className="rounded-none font-medium text-sm data-[state=active]:border-b-primary "
                            >
                              Manual Entry
                            </TabsTrigger>
                          </TabsList>

                          <TabsContent
                            value="upload"
                            className="space-y-8 mt-8"
                          >
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
                                          : "Upload your CV"}
                                      </h3>
                                      <p className="text-base text-muted-foreground">
                                        Drag and drop your file here, or click
                                        to browse
                                      </p>
                                      <p className="text-sm text-gray-500">
                                        Supported formats: PDF, JPG, PNG (Max
                                        10MB)
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
                                          {(
                                            selectedFile.size /
                                            1024 /
                                            1024
                                          ).toFixed(2)}{" "}
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
                                        Processing your CV...
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
                                <div className="flex items-center justify-between ">
                                  <div className="flex items-center space-x-4">
                                    <div>
                                      <Badge
                                        variant="outline"
                                        className="text-green-600"
                                      >
                                        <CheckCircleIcon className="h-4 w-4 mr-2" />
                                        CV Parsed Successfully
                                      </Badge>
                                    </div>
                                  </div>
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

                                <Tabs
                                  defaultValue="overview"
                                  className="w-full"
                                >
                                  <TabsList className="grid w-full grid-cols-6 bg-gray-50 p-1 rounded-xl h-12 gap-1">
                                    <TabsTrigger
                                      value="overview"
                                      className="rounded-none text-xs font-medium data-[state=active]:bg-white data-[state=active]:border-b-primary data-[state=active]:text-primary"
                                    >
                                      Overview
                                    </TabsTrigger>
                                    <TabsTrigger
                                      value="docis"
                                      className="rounded-none text-xs font-medium data-[state=active]:bg-white data-[state=active]:border-b-primary data-[state=active]:text-primary"
                                    >
                                      DOCIs
                                    </TabsTrigger>
                                    <TabsTrigger
                                      value="publications"
                                      className="rounded-none text-xs font-medium data-[state=active]:bg-white data-[state=active]:border-b-primary data-[state=active]:text-primary"
                                    >
                                      Publications
                                    </TabsTrigger>
                                    <TabsTrigger
                                      value="experience"
                                      className="rounded-none text-xs font-medium data-[state=active]:bg-white data-[state=active]:border-b-primary data-[state=active]:text-primary"
                                    >
                                      Experience
                                    </TabsTrigger>
                                    <TabsTrigger
                                      value="education"
                                      className="rounded-none text-xs font-medium data-[state=active]:bg-white data-[state=active]:border-b-primary data-[state=active]:text-primary"
                                    >
                                      Education
                                    </TabsTrigger>
                                    <TabsTrigger
                                      value="awards"
                                      className="rounded-none text-xs font-medium data-[state=active]:bg-white data-[state=active]:border-b-primary data-[state=active]:text-primary"
                                    >
                                      Awards
                                    </TabsTrigger>
                                  </TabsList>

                                  <TabsContent
                                    value="overview"
                                    className="space-y-8 mt-8"
                                  >
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                      <div className="space-y-3">
                                        <Label
                                          htmlFor="preview-fullName"
                                          className="text-sm font-medium text-gray-700"
                                        >
                                          Full Name *
                                        </Label>
                                        <Input
                                          id="preview-fullName"
                                          value={editableData.fullName}
                                          onChange={(e) =>
                                            setEditableData((prev) => ({
                                              ...prev,
                                              fullName: e.target.value,
                                            }))
                                          }
                                          placeholder="Enter your full name"
                                          className="rounded-xl border-gray-300 focus:border-primary focus:ring-primary/20 h-11"
                                        />
                                      </div>

                                      <div className="space-y-2">
                                        <Label
                                          htmlFor="preview-email"
                                          className="text-sm font-medium text-primary"
                                        >
                                          Email *
                                        </Label>
                                        <Input
                                          id="preview-email"
                                          value={editableData.email}
                                          onChange={(e) =>
                                            setEditableData((prev) => ({
                                              ...prev,
                                              email: e.target.value,
                                            }))
                                          }
                                          placeholder="Enter your email"
                                        />
                                      </div>

                                      <div className="space-y-2">
                                        <Label
                                          htmlFor="preview-institution"
                                          className="text-sm font-medium text-primary"
                                        >
                                          Institution *
                                        </Label>
                                        <Input
                                          id="preview-institution"
                                          value={editableData.institution}
                                          onChange={(e) =>
                                            setEditableData((prev) => ({
                                              ...prev,
                                              institution: e.target.value,
                                            }))
                                          }
                                          placeholder="Enter your institution"
                                        />
                                      </div>

                                      <div className="space-y-2">
                                        <Label
                                          htmlFor="preview-profession"
                                          className="text-sm font-medium text-primary"
                                        >
                                          Profession *
                                        </Label>
                                        <Input
                                          id="preview-profession"
                                          value={editableData.profession}
                                          onChange={(e) =>
                                            setEditableData((prev) => ({
                                              ...prev,
                                              profession: e.target.value,
                                            }))
                                          }
                                          placeholder="Enter your profession"
                                        />
                                      </div>

                                      <div className="space-y-2">
                                        <Label
                                          htmlFor="preview-field"
                                          className="text-sm font-medium text-primary"
                                        >
                                          Field of Study *
                                        </Label>
                                        <Input
                                          id="preview-field"
                                          value={editableData.field}
                                          onChange={(e) =>
                                            setEditableData((prev) => ({
                                              ...prev,
                                              field: e.target.value,
                                            }))
                                          }
                                          placeholder="Enter your field of study"
                                        />
                                      </div>

                                      <div className="space-y-2">
                                        <Label
                                          htmlFor="preview-specialization"
                                          className="text-sm font-medium text-primary"
                                        >
                                          Specialization *
                                        </Label>
                                        <Input
                                          id="preview-specialization"
                                          value={editableData.specialization}
                                          onChange={(e) =>
                                            setEditableData((prev) => ({
                                              ...prev,
                                              specialization: e.target.value,
                                            }))
                                          }
                                          placeholder="Enter your specialization"
                                        />
                                      </div>

                                      <div className="space-y-2">
                                        <Label
                                          htmlFor="preview-title"
                                          className="text-sm font-medium text-primary"
                                        >
                                          Title
                                        </Label>
                                        <Input
                                          id="preview-title"
                                          value={editableData.title}
                                          onChange={(e) =>
                                            setEditableData((prev) => ({
                                              ...prev,
                                              title: e.target.value,
                                            }))
                                          }
                                          placeholder="Dr., Prof., etc."
                                        />
                                      </div>

                                      <div className="space-y-2">
                                        <Label
                                          htmlFor="preview-location"
                                          className="text-sm font-medium text-primary"
                                        >
                                          Location
                                        </Label>
                                        <Input
                                          id="preview-location"
                                          value={editableData.location}
                                          onChange={(e) =>
                                            setEditableData((prev) => ({
                                              ...prev,
                                              location: e.target.value,
                                            }))
                                          }
                                          placeholder="Enter your location"
                                        />
                                      </div>

                                      <div className="space-y-2">
                                        <Label
                                          htmlFor="preview-phone"
                                          className="text-sm font-medium text-primary"
                                        >
                                          Phone
                                        </Label>
                                        <Input
                                          id="preview-phone"
                                          value={editableData.phone}
                                          onChange={(e) =>
                                            setEditableData((prev) => ({
                                              ...prev,
                                              phone: e.target.value,
                                            }))
                                          }
                                          placeholder="Enter your phone number"
                                        />
                                      </div>

                                      <div className="space-y-2">
                                        <Label
                                          htmlFor="preview-website"
                                          className="text-sm font-medium text-primary"
                                        >
                                          Website
                                        </Label>
                                        <Input
                                          id="preview-website"
                                          value={editableData.website}
                                          onChange={(e) =>
                                            setEditableData((prev) => ({
                                              ...prev,
                                              website: e.target.value,
                                            }))
                                          }
                                          placeholder="Enter your website URL"
                                        />
                                      </div>
                                    </div>

                                    <div className="space-y-3">
                                      <Label
                                        htmlFor="preview-overview"
                                        className="text-sm font-medium text-gray-700"
                                      >
                                        Overview
                                      </Label>
                                      <Textarea
                                        id="preview-overview"
                                        value={editableData.overview}
                                        onChange={(e) =>
                                          setEditableData((prev) => ({
                                            ...prev,
                                            overview: e.target.value,
                                          }))
                                        }
                                        placeholder="Enter a brief overview or summary"
                                        rows={4}
                                        className="rounded-xl border-gray-300 focus:border-primary focus:ring-primary/20"
                                      />
                                    </div>
                                  </TabsContent>

                                  <TabsContent
                                    value="docis"
                                    className="space-y-6 mt-6"
                                  >
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                      <div className="space-y-2">
                                        <Label
                                          htmlFor="preview-orcid"
                                          className="text-sm font-medium text-primary"
                                        >
                                          ORCID ID
                                        </Label>
                                        <Input
                                          id="preview-orcid"
                                          value={editableData.orcid || ""}
                                          onChange={(e) =>
                                            setEditableData((prev) => ({
                                              ...prev,
                                              orcid: e.target.value,
                                            }))
                                          }
                                          placeholder="https://orcid.org/0000-0000-0000-0000"
                                        />
                                      </div>

                                      <div className="space-y-2">
                                        <Label
                                          htmlFor="preview-googleScholar"
                                          className="text-sm font-medium text-primary"
                                        >
                                          Google Scholar Profile
                                        </Label>
                                        <Input
                                          id="preview-googleScholar"
                                          value={
                                            editableData.googleScholar || ""
                                          }
                                          onChange={(e) =>
                                            setEditableData((prev) => ({
                                              ...prev,
                                              googleScholar: e.target.value,
                                            }))
                                          }
                                          placeholder="https://scholar.google.com/citations?user=..."
                                        />
                                      </div>

                                      <div className="space-y-2">
                                        <Label
                                          htmlFor="preview-linkedIn"
                                          className="text-sm font-medium text-primary"
                                        >
                                          LinkedIn Profile
                                        </Label>
                                        <Input
                                          id="preview-linkedIn"
                                          value={editableData.linkedIn}
                                          onChange={(e) =>
                                            setEditableData((prev) => ({
                                              ...prev,
                                              linkedIn: e.target.value,
                                            }))
                                          }
                                          placeholder="https://linkedin.com/in/..."
                                        />
                                      </div>

                                      <div className="space-y-2">
                                        <Label
                                          htmlFor="preview-github"
                                          className="text-sm font-medium text-primary"
                                        >
                                          GitHub Profile
                                        </Label>
                                        <Input
                                          id="preview-github"
                                          value={editableData.github}
                                          onChange={(e) =>
                                            setEditableData((prev) => ({
                                              ...prev,
                                              github: e.target.value,
                                            }))
                                          }
                                          placeholder="https://github.com/..."
                                        />
                                      </div>
                                    </div>
                                  </TabsContent>

                                  <TabsContent
                                    value="publications"
                                    className="space-y-6 mt-6"
                                  >
                                    {editableData.publications &&
                                    editableData.publications.length > 0 ? (
                                      <div className="space-y-4">
                                        <div className="flex items-center space-x-2">
                                          <BookOpenIcon className="h-5 w-5 text-primary" />
                                          <Label className="text-lg font-semibold text-primary">
                                            Publications (
                                            {editableData.publications.length})
                                          </Label>
                                        </div>
                                        <div className="space-y-3">
                                          {editableData.publications.map(
                                            (pub, index) => (
                                              <div
                                                key={index}
                                                className="p-6 bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                                              >
                                                <div className="space-y-3">
                                                  <h4 className="font-semibold text-gray-900 text-lg leading-tight">
                                                    {pub.title}
                                                  </h4>
                                                  <div className="text-sm text-gray-600 space-y-1">
                                                    {pub.authors &&
                                                      pub.authors.length >
                                                        0 && (
                                                        <div>
                                                          <span className="font-medium">
                                                            Authors:
                                                          </span>{" "}
                                                          {Array.isArray(
                                                            pub.authors
                                                          )
                                                            ? pub.authors.join(
                                                                ", "
                                                              )
                                                            : pub.authors}
                                                        </div>
                                                      )}
                                                    {pub.venue && (
                                                      <div>
                                                        <span className="font-medium">
                                                          Published in:
                                                        </span>{" "}
                                                        {pub.venue}
                                                      </div>
                                                    )}
                                                  </div>
                                                  <div className="flex items-center gap-4 text-sm text-gray-500">
                                                    {pub.date && (
                                                      <span>{pub.date}</span>
                                                    )}
                                                    {pub.doi && (
                                                      <span>
                                                        DOI: {pub.doi}
                                                      </span>
                                                    )}
                                                  </div>
                                                  {pub.url && (
                                                    <div className="pt-2">
                                                      <a
                                                        href={pub.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-primary hover:text-primary/80 font-medium text-sm"
                                                      >
                                                        View Publication →
                                                      </a>
                                                    </div>
                                                  )}
                                                </div>
                                              </div>
                                            )
                                          )}
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="text-center py-12 bg-gray-50 rounded-2xl">
                                        <BookOpenIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                        <h4 className="text-lg font-medium text-gray-600 mb-2">
                                          No Publications Found
                                        </h4>
                                        <p className="text-gray-500">
                                          No publications were found in your CV
                                        </p>
                                      </div>
                                    )}
                                  </TabsContent>

                                  <TabsContent
                                    value="experience"
                                    className="space-y-6 mt-6"
                                  >
                                    {editableData.experience &&
                                    editableData.experience.length > 0 ? (
                                      <div className="space-y-4">
                                        <div className="flex items-center space-x-2">
                                          <BriefcaseIcon className="h-5 w-5 text-primary" />
                                          <Label className="text-lg font-semibold text-primary">
                                            Experience (
                                            {editableData.experience.length})
                                          </Label>
                                        </div>
                                        <div className="space-y-3">
                                          {editableData.experience.map(
                                            (exp, index) => (
                                              <div
                                                key={index}
                                                className="p-6 bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                                              >
                                                <div className="space-y-3">
                                                  <h4 className="font-semibold text-gray-900 text-lg">
                                                    {exp.position}
                                                  </h4>
                                                  <div className="text-base text-gray-600">
                                                    <span className="font-medium">
                                                      {exp.company}
                                                    </span>
                                                    {exp.location && (
                                                      <span className="text-gray-500">
                                                        {" "}
                                                        • {exp.location}
                                                      </span>
                                                    )}
                                                    {exp.type && (
                                                      <span className="text-gray-500">
                                                        {" "}
                                                        • {exp.type}
                                                      </span>
                                                    )}
                                                  </div>
                                                  <div className="text-sm text-gray-500 font-medium">
                                                    {exp.startDate &&
                                                    exp.endDate
                                                      ? `${exp.startDate} - ${exp.endDate}`
                                                      : exp.startDate
                                                      ? `Started ${exp.startDate}`
                                                      : exp.endDate
                                                      ? `Ended ${exp.endDate}`
                                                      : ""}
                                                  </div>
                                                  {exp.description && (
                                                    <div className="text-sm text-gray-700 leading-relaxed">
                                                      {exp.description}
                                                    </div>
                                                  )}
                                                </div>
                                              </div>
                                            )
                                          )}
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="text-center py-8">
                                        <BriefcaseIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-500">
                                          No experience found in your CV
                                        </p>
                                      </div>
                                    )}
                                  </TabsContent>

                                  <TabsContent
                                    value="education"
                                    className="space-y-6 mt-6"
                                  >
                                    {editableData.education &&
                                    editableData.education.length > 0 ? (
                                      <div className="space-y-4">
                                        <div className="flex items-center space-x-2">
                                          <GraduationCapIcon className="h-5 w-5 text-primary" />
                                          <Label className="text-lg font-semibold text-primary">
                                            Education (
                                            {editableData.education.length})
                                          </Label>
                                        </div>
                                        <div className="space-y-3">
                                          {editableData.education.map(
                                            (edu, index) => (
                                              <div
                                                key={index}
                                                className="p-4 bg-gray-50 rounded-lg border"
                                              >
                                                <div className="space-y-2">
                                                  <div className="font-medium text-gray-900">
                                                    {edu.degree}{" "}
                                                    {edu.field &&
                                                      `in ${edu.field}`}
                                                  </div>
                                                  <div className="text-sm text-gray-600">
                                                    {edu.institution}{" "}
                                                    {edu.location &&
                                                      `• ${edu.location}`}
                                                  </div>
                                                  <div className="text-sm text-gray-500">
                                                    {edu.startDate &&
                                                    edu.endDate
                                                      ? `${edu.startDate} - ${edu.endDate}`
                                                      : edu.startDate
                                                      ? `Started ${edu.startDate}`
                                                      : edu.endDate
                                                      ? `Ended ${edu.endDate}`
                                                      : ""}
                                                    {edu.gpa &&
                                                      ` • GPA: ${edu.gpa}`}
                                                  </div>
                                                </div>
                                              </div>
                                            )
                                          )}
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="text-center py-8">
                                        <GraduationCapIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-500">
                                          No education found in your CV
                                        </p>
                                      </div>
                                    )}
                                  </TabsContent>

                                  <TabsContent
                                    value="awards"
                                    className="space-y-6 mt-6"
                                  >
                                    {editableData.awards &&
                                    editableData.awards.length > 0 ? (
                                      <div className="space-y-4">
                                        <div className="flex items-center space-x-2">
                                          <AwardIcon className="h-5 w-5 text-primary" />
                                          <Label className="text-lg font-semibold text-primary">
                                            Awards & Honors (
                                            {editableData.awards.length})
                                          </Label>
                                        </div>
                                        <div className="space-y-3">
                                          {editableData.awards.map(
                                            (award, index) => (
                                              <div
                                                key={index}
                                                className="p-4 bg-gray-50 rounded-lg border"
                                              >
                                                <div className="space-y-2">
                                                  <div className="font-medium text-gray-900">
                                                    {award.name}
                                                  </div>
                                                  <div className="text-sm text-gray-600">
                                                    {award.issuer &&
                                                      `Issued by: ${award.issuer}`}
                                                  </div>
                                                  <div className="text-sm text-gray-500">
                                                    {award.date &&
                                                      `Date: ${award.date}`}
                                                  </div>
                                                  {award.description && (
                                                    <div className="text-sm text-gray-700 mt-2">
                                                      {award.description}
                                                    </div>
                                                  )}
                                                </div>
                                              </div>
                                            )
                                          )}
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="text-center py-8">
                                        <AwardIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-500">
                                          No awards found in your CV
                                        </p>
                                      </div>
                                    )}
                                  </TabsContent>
                                </Tabs>

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
                                    onClick={handleConfirmRegistration}
                                    disabled={
                                      confirmingRegistration ||
                                      !editableData.fullName ||
                                      !editableData.email ||
                                      !editableData.institution ||
                                      !editableData.profession ||
                                      !editableData.field ||
                                      !editableData.specialization
                                    }
                                    className="flex-1 h-12 rounded-xl font-medium text-base"
                                  >
                                    {confirmingRegistration
                                      ? "Registering..."
                                      : "Confirm Registration"}
                                    <ArrowRightIcon className="h-4 w-4 ml-2" />
                                  </Button>
                                </div>
                              </div>
                            )}
                          </TabsContent>

                          <TabsContent
                            value="manual"
                            className="space-y-8 mt-8"
                          >
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
                                  htmlFor="orcid"
                                  className="text-sm font-medium text-primary"
                                >
                                  ORCID ID
                                </Label>
                                <Input
                                  id="orcid"
                                  type="url"
                                  placeholder="https://orcid.org/0000-0000-0000-0000"
                                  value={editableData.orcid}
                                  onChange={(e) =>
                                    setEditableData((prev) => ({
                                      ...prev,
                                      orcid: e.target.value,
                                    }))
                                  }
                                  disabled={uploading}
                                />
                              </div>

                              <div className="space-y-2">
                                <Label
                                  htmlFor="googleScholar"
                                  className="text-sm font-medium text-primary"
                                >
                                  Google Scholar Profile
                                </Label>
                                <Input
                                  id="googleScholar"
                                  type="url"
                                  placeholder="https://scholar.google.com/citations?user=..."
                                  value={editableData.googleScholar}
                                  onChange={(e) =>
                                    setEditableData((prev) => ({
                                      ...prev,
                                      googleScholar: e.target.value,
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
                              {uploading
                                ? "Creating Profile..."
                                : "Create Profile"}
                            </Button>
                          </TabsContent>
                        </Tabs>
                      </div>
                    )
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default function RegisterCV() {
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
