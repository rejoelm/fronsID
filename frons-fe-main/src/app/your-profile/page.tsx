"use client";

import type React from "react";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import {
  UserIcon,
  MailIcon,
  EditIcon,
  SaveIcon,
  XIcon,
  BookOpenIcon,
  GraduationCapIcon,
  BriefcaseIcon,
  AwardIcon,
  FileTextIcon,
  RefreshCcwIcon,
  MapPinIcon,
  PhoneIcon,
  LinkedinIcon,
  GithubIcon,
  GlobeIcon,
  ExternalLinkIcon,
} from "lucide-react";
import { Sidebar } from "@/components/ui/sidebar";
import { OverviewSidebar } from "@/components/overview-sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { WalletConnection } from "@/components/wallet-connection";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useReviewerEligibility } from "@/hooks/useReviewerEligibility";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AcademicCardSection } from "@/components/profile/academic-card/AcademicCardSection";

import { useWalletConnection } from "@/hooks/useWalletConnection";
import { useProfileData } from "@/hooks/useProfileData";
import { useProfileEdit } from "@/hooks/useProfileEdit";

const UnconnectedView = () => (
  <div className="container max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6 justify-center text-center">
    <WalletConnection />
  </div>
);

export default function YourProfile() {
  const router = useRouter();
  const { toast } = useToast();

  const { connected, solanaWallets, walletAddress } = useWalletConnection();
  const {
    profile,
    loadingProfile,
    error,
    isInitialLoad,
    loadProfile,
    updateProfile,
    cvError,
  } = useProfileData(walletAddress);
  const {
    isEditing,
    editData,
    saving,
    handleEditStart,
    handleEditCancel,
    handleInputChange,
    handleOverviewChange,
    handleSave,
  } = useProfileEdit();

  const { eligibilityResult } = useReviewerEligibility();

  useEffect(() => {
    const reloadProfile = async () => {
      await loadProfile(connected, solanaWallets || []);
    };

    reloadProfile();
  }, [connected, solanaWallets, loadProfile, error, isInitialLoad, toast]);

  const handleResubmitCV = async () => {
    router.push("/register-cv");
  };

  const reloadProfileForSave = async () => {
    await loadProfile(connected, solanaWallets || []);
  };

  if (!connected) {
    return (
      <div className="min-h-screen bg-white flex w-full">
        <div className="hidden lg:block">
          <Sidebar>
            <OverviewSidebar connected={connected} />
          </Sidebar>
        </div>
        <div className="flex-1 w-full">
          <main className="flex-1">
            <UnconnectedView />
          </main>
        </div>
      </div>
    );
  }

  if (loadingProfile) {
    return (
      <div className="min-h-screen bg-white flex w-full">
        <div className="hidden lg:block">
          <Sidebar>
            <OverviewSidebar connected={connected} />
          </Sidebar>
        </div>
        <div className="flex-1 w-full">
          <main className="flex-1">
            <div className="container max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                <div className="lg:col-span-1">
                  <Card className="shadow-lg border border-gray-100/80 rounded-2xl bg-white/95 backdrop-blur-sm">
                    <CardContent className="p-6">
                      <div className="flex flex-col items-center space-y-4">
                        <Skeleton className="w-32 h-32 rounded-full" />

                        <div className="text-center space-y-2">
                          <Skeleton className="h-6 w-32" />
                          <Skeleton className="h-4 w-28" />
                          <Skeleton className="h-4 w-36" />
                        </div>

                        <Skeleton className="h-9 w-24" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="lg:col-span-2 space-y-6">
                  <Card className="shadow-lg border border-gray-100/80 rounded-2xl bg-white/95 backdrop-blur-sm">
                    <CardHeader>
                      <Skeleton className="h-6 w-40" />
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[...Array(6)].map((_, i) => (
                          <div key={i} className="space-y-2">
                            <Skeleton className="h-3 w-20" />
                            <Skeleton className="h-4 w-full" />
                          </div>
                        ))}
                      </div>

                      <div className="border-t pt-4 mt-4">
                        <Skeleton className="h-4 w-32 mb-3" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {[...Array(2)].map((_, i) => (
                            <div key={i} className="space-y-1">
                              <Skeleton className="h-3 w-16" />
                              <Skeleton className="h-4 w-full" />
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="shadow-lg border border-gray-100/80 rounded-2xl bg-white/95 backdrop-blur-sm">
                    <CardHeader>
                      <Skeleton className="h-6 w-32" />
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[...Array(4)].map((_, i) => (
                          <div
                            key={i}
                            className="text-center p-4 bg-primary/5 rounded-lg"
                          >
                            <div className="flex items-center justify-center mb-2">
                              <Skeleton className="w-5 h-5" />
                            </div>
                            <Skeleton className="h-8 w-8 mx-auto mb-1" />
                            <Skeleton className="h-4 w-16 mx-auto" />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <Card className="shadow-lg border border-gray-100/80 rounded-2xl bg-white/95 backdrop-blur-sm">
                <div className="w-full h-auto grid grid-cols-6 bg-gray-50/50 p-0 rounded-lg">
                  {[
                    "Overview",
                    "Education",
                    "Experience",
                    "Publications",
                    "Awards",
                    "Academic Card",
                  ].map((tab, i) => (
                    <div
                      key={i}
                      className={`py-3 px-4 text-center ${
                        i === 0 ? "bg-white border-b-2 border-b-primary" : ""
                      }`}
                    >
                      <Skeleton className="h-4 w-16 mx-auto" />
                    </div>
                  ))}
                </div>

                <div className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-6 w-48" />
                      <Skeleton className="h-4 w-32" />
                    </div>

                    <div className="space-y-6">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="space-y-3">
                          <Skeleton className="h-5 w-40" />
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Skeleton className="h-4 w-24" />
                              <Skeleton className="h-9 w-full" />
                            </div>
                            <div className="space-y-2">
                              <Skeleton className="h-4 w-20" />
                              <Skeleton className="h-9 w-full" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-end space-x-3 pt-6 border-t">
                      <Skeleton className="h-9 w-20" />
                      <Skeleton className="h-9 w-16" />
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-white flex w-full">
        <div className="hidden lg:block">
          <Sidebar>
            <OverviewSidebar connected={connected} />
          </Sidebar>
        </div>
        <div className="flex-1 w-full flex items-center justify-center">
          <main className="w-full">
            <div className="container max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
              <div className="text-center">
                <div className="flex flex-col items-center justify-center">
                  <h2 className="text-2xl font-semibold text-primary mb-2">
                    Profile Not Found
                  </h2>
                  <p className="text-gray-600">
                    You have not registered your CV yet. Get started by
                    uploading your CV to create your academic profile.
                  </p>
                </div>
                <Button
                  onClick={() => router.push("/register-cv")}
                  className="mt-6"
                >
                  Register Your CV
                </Button>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex w-full">
      <div className="hidden lg:block">
        <Sidebar>
          <OverviewSidebar connected={connected} />
        </Sidebar>
      </div>
      <div className="flex-1 w-full">
        <main className="flex-1">
          <div className="container max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              <div className="lg:col-span-1">
                <Card className="shadow-lg border border-gray-100/80 rounded-2xl bg-white/95 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="w-32 h-32 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center">
                        {profile.personalInfo.photoUrl ? (
                          <Image
                            src={profile.personalInfo.photoUrl}
                            alt={profile.personalInfo.fullName}
                            className="w-full h-full object-cover"
                            width={128}
                            height={128}
                          />
                        ) : (
                          <UserIcon className="w-16 h-16 text-primary/40" />
                        )}
                      </div>

                      <div className="text-center space-y-2">
                        {isEditing ? (
                          <div className="space-y-3">
                            <div>
                              <Input
                                value={editData.personalInfo?.fullName || ""}
                                onChange={(e) =>
                                  handleInputChange(
                                    "personalInfo",
                                    "fullName",
                                    e.target.value
                                  )
                                }
                                placeholder="Full Name"
                                className="text-center text-xl font-semibold"
                              />
                            </div>
                            <div>
                              <Input
                                value={editData.personalInfo?.title || ""}
                                onChange={(e) =>
                                  handleInputChange(
                                    "personalInfo",
                                    "title",
                                    e.target.value
                                  )
                                }
                                placeholder="Title"
                                className="text-center"
                              />
                            </div>
                            <div>
                              <Input
                                value={editData.personalInfo?.institution || ""}
                                onChange={(e) =>
                                  handleInputChange(
                                    "personalInfo",
                                    "institution",
                                    e.target.value
                                  )
                                }
                                placeholder="Institution"
                                className="text-center text-sm"
                              />
                            </div>
                            <div>
                              <Input
                                value={editData.personalInfo?.location || ""}
                                onChange={(e) =>
                                  handleInputChange(
                                    "personalInfo",
                                    "location",
                                    e.target.value
                                  )
                                }
                                placeholder="Location"
                                className="text-center text-sm"
                              />
                            </div>
                          </div>
                        ) : (
                          <>
                            <h1 className="text-2xl font-semibold text-primary">
                              {profile.personalInfo.fullName}
                            </h1>
                            {profile.username && (
                              <p className="text-sm text-primary/70 font-medium">
                                @{profile.username}
                              </p>
                            )}
                            <p className="text-lg text-muted-foreground">
                              {profile.personalInfo.title ||
                                profile.personalInfo.profession}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {profile.personalInfo.institution}
                            </p>
                            {profile.personalInfo.location && (
                              <div className="flex items-center justify-center space-x-1 text-sm text-muted-foreground">
                                <MapPinIcon className="w-4 h-4" />
                                <span>{profile.personalInfo.location}</span>
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      <div className="flex space-x-2 w-full">
                        {!isEditing ? (
                          <Button
                            onClick={() => handleEditStart(profile)}
                            className="flex-1"
                            variant="outline"
                          >
                            <EditIcon className="w-4 h-4 mr-2" />
                            Edit Profile
                          </Button>
                        ) : (
                          <>
                            <Button
                              onClick={() =>
                                handleSave(updateProfile, reloadProfileForSave)
                              }
                              disabled={saving}
                              className="flex-1"
                            >
                              {saving ? (
                                <>
                                  <Skeleton className="h-4 w-4" />
                                  <span className="ml-2">Saving...</span>
                                </>
                              ) : (
                                <>
                                  <SaveIcon className="w-4 h-4 mr-2" />
                                  Save
                                </>
                              )}
                            </Button>
                            <Button
                              onClick={handleEditCancel}
                              variant="outline"
                              disabled={saving}
                            >
                              <XIcon className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                      {!isEditing && (
                        <div className="flex space-x-2 w-full">
                          <Button onClick={handleResubmitCV} className="flex-1">
                            <RefreshCcwIcon className="w-4 h-4 mr-2" />
                            Resubmit CV
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-2 space-y-6">
                <Card className="shadow-lg border border-gray-100/80 rounded-2xl bg-white/95 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-primary">
                      Academic Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">
                          Field
                        </Label>
                        {isEditing ? (
                          <Input
                            value={editData.personalInfo?.field || ""}
                            onChange={(e) =>
                              handleInputChange(
                                "personalInfo",
                                "field",
                                e.target.value
                              )
                            }
                          />
                        ) : (
                          <p className="font-medium">
                            {profile.personalInfo.field}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">
                          Specialization
                        </Label>
                        {isEditing ? (
                          <Input
                            value={editData.personalInfo?.specialization || ""}
                            onChange={(e) =>
                              handleInputChange(
                                "personalInfo",
                                "specialization",
                                e.target.value
                              )
                            }
                          />
                        ) : (
                          <p className="font-medium">
                            {profile.personalInfo.specialization}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-lg border border-gray-100/80 rounded-2xl bg-white/95 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-primary">
                      Contact Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <MailIcon className="w-4 h-4 text-muted-foreground" />
                          {isEditing ? (
                            <Input
                              type="email"
                              value={editData.contact?.email || ""}
                              onChange={(e) =>
                                handleInputChange(
                                  "contact",
                                  "email",
                                  e.target.value
                                )
                              }
                              placeholder="Email address"
                              className="flex-1"
                            />
                          ) : (
                            <span className="font-medium">
                              {profile.contact.email}
                            </span>
                          )}
                        </div>

                        {(profile.contact.phone || isEditing) && (
                          <div className="flex items-center space-x-3">
                            <PhoneIcon className="w-4 h-4 text-muted-foreground" />
                            {isEditing ? (
                              <Input
                                value={editData.contact?.phone || ""}
                                onChange={(e) =>
                                  handleInputChange(
                                    "contact",
                                    "phone",
                                    e.target.value
                                  )
                                }
                                placeholder="Phone number"
                                className="flex-1"
                              />
                            ) : (
                              <span className="font-medium">
                                {profile.contact.phone}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="space-y-3">
                        {(profile.contact.linkedIn || isEditing) && (
                          <div className="flex items-center space-x-3">
                            <LinkedinIcon className="w-4 h-4 text-muted-foreground" />
                            {isEditing ? (
                              <Input
                                value={editData.contact?.linkedIn || ""}
                                onChange={(e) =>
                                  handleInputChange(
                                    "contact",
                                    "linkedIn",
                                    e.target.value
                                  )
                                }
                                placeholder="LinkedIn profile"
                                className="flex-1"
                              />
                            ) : (
                              <a
                                href={profile.contact.linkedIn}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-medium text-blue-600 hover:underline flex items-center space-x-1"
                              >
                                <span>LinkedIn</span>
                                <ExternalLinkIcon className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        )}

                        {(profile.contact.github || isEditing) && (
                          <div className="flex items-center space-x-3">
                            <GithubIcon className="w-4 h-4 text-muted-foreground" />
                            {isEditing ? (
                              <Input
                                value={editData.contact?.github || ""}
                                onChange={(e) =>
                                  handleInputChange(
                                    "contact",
                                    "github",
                                    e.target.value
                                  )
                                }
                                placeholder="GitHub profile"
                                className="flex-1"
                              />
                            ) : (
                              <a
                                href={profile.contact.github}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-medium text-blue-600 hover:underline flex items-center space-x-1"
                              >
                                <span>GitHub</span>
                                <ExternalLinkIcon className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        )}

                        {(profile.contact.website || isEditing) && (
                          <div className="flex items-center space-x-3">
                            <GlobeIcon className="w-4 h-4 text-muted-foreground" />
                            {isEditing ? (
                              <Input
                                value={editData.contact?.website || ""}
                                onChange={(e) =>
                                  handleInputChange(
                                    "contact",
                                    "website",
                                    e.target.value
                                  )
                                }
                                placeholder="Website URL"
                                className="flex-1"
                              />
                            ) : (
                              <a
                                href={profile.contact.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-medium text-blue-600 hover:underline flex items-center space-x-1"
                              >
                                <span>Website</span>
                                <ExternalLinkIcon className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {(profile.contact.orcid ||
                      profile.contact.googleScholar ||
                      isEditing) && (
                      <div className="border-t pt-4 mt-4">
                        <Label className="text-sm font-medium text-muted-foreground mb-3 block">
                          Academic Profiles
                        </Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {(profile.contact.orcid || isEditing) && (
                            <div>
                              <Label className="text-xs text-muted-foreground">
                                ORCID
                              </Label>
                              {isEditing ? (
                                <Input
                                  value={editData.contact?.orcid || ""}
                                  onChange={(e) =>
                                    handleInputChange(
                                      "contact",
                                      "orcid",
                                      e.target.value
                                    )
                                  }
                                  placeholder="ORCID ID"
                                  className="mt-1"
                                />
                              ) : (
                                <p className="font-medium text-sm">
                                  {profile.contact.orcid}
                                </p>
                              )}
                            </div>
                          )}

                          {(profile.contact.googleScholar || isEditing) && (
                            <div>
                              <Label className="text-xs text-muted-foreground">
                                Google Scholar
                              </Label>
                              {isEditing ? (
                                <Input
                                  value={editData.contact?.googleScholar || ""}
                                  onChange={(e) =>
                                    handleInputChange(
                                      "contact",
                                      "googleScholar",
                                      e.target.value
                                    )
                                  }
                                  placeholder="Google Scholar URL"
                                  className="mt-1"
                                />
                              ) : (
                                <p className="font-medium text-sm">
                                  {profile.contact.googleScholar}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="shadow-lg border border-gray-100/80 rounded-2xl bg-white/95 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-primary">
                      Academic Impact
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-primary/5 rounded-lg">
                        <div className="flex items-center justify-center">
                          <GraduationCapIcon className="w-5 h-5 text-primary/70 mb-2" />
                        </div>
                        <p className="text-2xl font-bold text-primary">
                          {profile.summary.education}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Education
                        </p>
                      </div>
                      <div className="text-center p-4 bg-primary/5 rounded-lg">
                        <div className="flex items-center justify-center">
                          <BriefcaseIcon className="w-5 h-5 text-primary/70 mb-2" />
                        </div>
                        <p className="text-2xl font-bold text-primary">
                          {profile.summary.experience}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Experience
                        </p>
                      </div>
                      <div className="text-center p-4 bg-primary/5 rounded-lg">
                        <div className="flex items-center justify-center">
                          <BookOpenIcon className="w-5 h-5 text-primary/70 mb-2" />
                        </div>
                        <p className="text-2xl font-bold text-primary">
                          {profile.summary.publications}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Publications
                        </p>
                      </div>
                      <div className="text-center p-4 bg-primary/5 rounded-lg">
                        <div className="flex items-center justify-center">
                          <AwardIcon className="w-5 h-5 text-primary/70 mb-2" />
                        </div>
                        <p className="text-2xl font-bold text-primary">
                          {profile.summary.awards}
                        </p>
                        <p className="text-sm text-muted-foreground">Awards</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <Card className="shadow-lg border border-gray-100/80 rounded-2xl bg-white/95 backdrop-blur-sm">
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="w-full h-auto grid grid-cols-6 bg-gray-50/50 p-0 rounded-lg">
                  <TabsTrigger
                    value="overview"
                    className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-b-primary data-[state=active]:bg-white py-3"
                  >
                    Overview
                  </TabsTrigger>
                  <TabsTrigger
                    value="education"
                    className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-b-primary data-[state=active]:bg-white py-3"
                  >
                    Education
                  </TabsTrigger>
                  <TabsTrigger
                    value="experience"
                    className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-b-primary data-[state=active]:bg-white py-3"
                  >
                    Experience
                  </TabsTrigger>
                  <TabsTrigger
                    value="publications"
                    className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-b-primary data-[state=active]:bg-white py-3"
                  >
                    Publications
                  </TabsTrigger>
                  <TabsTrigger
                    value="awards"
                    className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-b-primary data-[state=active]:bg-white py-3"
                  >
                    Awards
                  </TabsTrigger>
                  <TabsTrigger
                    value="academic-card"
                    className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-b-primary data-[state=active]:bg-white py-3"
                  >
                    Academic Card
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-semibold ">
                        Professional Overview
                      </h3>
                      {isEditing && (
                        <span className="text-sm text-muted-foreground">
                          Edit your professional summary below
                        </span>
                      )}
                    </div>

                    {isEditing ? (
                      <Textarea
                        value={editData.overview || ""}
                        onChange={(e) => handleOverviewChange(e.target.value)}
                        placeholder="Write a brief overview of your professional background, research interests, and expertise..."
                        className="min-h-32"
                        rows={6}
                      />
                    ) : (
                      <div className="prose max-w-none">
                        {profile.overview ? (
                          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                            {profile.overview}
                          </p>
                        ) : (
                          <div className="text-center py-12">
                            <FileTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500 mb-2">
                              No overview information available
                            </p>
                            <p className="text-sm text-gray-400">
                              Click &ldquo;Edit Profile&rdquo; to add your
                              professional overview
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="education" className="p-6">
                  {profile.education && profile.education.length > 0 ? (
                    <div className="space-y-4">
                      {profile.education.map((edu, index) => (
                        <div
                          key={index}
                          className="p-4 bg-gray-50 rounded-lg border"
                        >
                          <div className="space-y-2">
                            <div className="font-medium text-gray-900">
                              {edu.degree} {edu.field && `in ${edu.field}`}
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
                  ) : (
                    <div className="text-center py-12">
                      <GraduationCapIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 mb-2">
                        No education records found
                      </p>
                      <p className="text-sm text-gray-400">
                        Upload a detailed CV to populate this section
                      </p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="experience" className="p-6">
                  {profile.experience && profile.experience.length > 0 ? (
                    <div className="space-y-4">
                      {profile.experience.map((exp, index) => (
                        <div
                          key={index}
                          className="p-4 bg-gray-50 rounded-lg border"
                        >
                          <div className="space-y-2">
                            <div className="font-medium text-gray-900">
                              {exp.position}
                            </div>
                            <div className="text-sm text-gray-600">
                              {exp.company}{" "}
                              {exp.location && `• ${exp.location}`}
                              {exp.type && ` • ${exp.type}`}
                            </div>
                            <div className="text-sm text-gray-500">
                              {exp.startDate && exp.endDate
                                ? `${exp.startDate} - ${exp.endDate}`
                                : exp.startDate
                                ? `Started ${exp.startDate}`
                                : exp.endDate
                                ? `Ended ${exp.endDate}`
                                : ""}
                            </div>
                            {exp.description && (
                              <div className="text-sm text-gray-700 mt-2">
                                {exp.description}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <BriefcaseIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 mb-2">
                        No work experience records found
                      </p>
                      <p className="text-sm text-gray-400">
                        Upload a detailed CV to populate this section
                      </p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="publications" className="p-6">
                  {profile.publications && profile.publications.length > 0 ? (
                    <div className="space-y-4">
                      {profile.publications.map((pub, index) => (
                        <div
                          key={index}
                          className="p-4 bg-gray-50 rounded-lg border"
                        >
                          <div className="space-y-2">
                            <div className="font-medium text-gray-900">
                              {pub.title}
                            </div>
                            <div className="text-sm text-gray-600">
                              {pub.authors && pub.authors.length > 0 && (
                                <div>
                                  Authors:{" "}
                                  {Array.isArray(pub.authors)
                                    ? pub.authors.join(", ")
                                    : pub.authors}
                                </div>
                              )}
                              {pub.venue && (
                                <div>Published in: {pub.venue}</div>
                              )}
                            </div>
                            <div className="text-sm text-gray-500">
                              {pub.date && `Date: ${pub.date}`}
                              {pub.doi && ` • DOI: ${pub.doi}`}
                            </div>
                            {pub.url && (
                              <div className="text-sm">
                                <a
                                  href={pub.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline flex items-center space-x-1"
                                >
                                  <span>View Publication</span>
                                  <ExternalLinkIcon className="w-3 h-3" />
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <BookOpenIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 mb-2">
                        No publications found
                      </p>
                      <p className="text-sm text-gray-400">
                        Upload a detailed CV to populate this section
                      </p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="awards" className="p-6">
                  {profile.awards && profile.awards.length > 0 ? (
                    <div className="space-y-4">
                      {profile.awards.map((award, index) => (
                        <div
                          key={index}
                          className="p-4 bg-gray-50 rounded-lg border"
                        >
                          <div className="space-y-2">
                            <div className="font-medium text-gray-900">
                              {award.name}
                            </div>
                            <div className="text-sm text-gray-600">
                              {award.issuer && `Issued by: ${award.issuer}`}
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
                  ) : (
                    <div className="text-center py-12">
                      <AwardIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 mb-2">No awards found</p>
                      <p className="text-sm text-gray-400">
                        Upload a detailed CV to populate this section
                      </p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="academic-card" className="p-6">
                  <AcademicCardSection
                    userProfile={{
                      cv_data: {
                        selfIdentity: {
                          fullName: profile.personalInfo.fullName,
                          title: profile.personalInfo.title,
                          profession: profile.personalInfo.profession,
                          institution: profile.personalInfo.institution,
                          location: profile.personalInfo.location,
                          field: profile.personalInfo.field,
                          specialization: profile.personalInfo.specialization,
                        },
                        contact: {
                          email: profile.contact.email,
                          phone: profile.contact.phone || "",
                          linkedIn: profile.contact.linkedIn || "",
                          github: profile.contact.github || "",
                          website: profile.contact.website || "",
                          orcid: profile.contact.orcid || "",
                          googleScholar: profile.contact.googleScholar || "",
                        },
                      },
                      wallet_address: walletAddress,
                    }}
                    walletAddress={walletAddress}
                  />
                </TabsContent>
              </Tabs>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
