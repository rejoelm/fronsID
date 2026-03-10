import { useState, useCallback } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { toast } from "sonner";

import {
  CVStatus,
  CVParseResponse,
  UserProfileResponse,
  ProfileUpdateRequest,
  ProfileUpdateResponse,
} from "@/types/backend";
import { useLoading } from "@/context/LoadingContext";
import axios from "axios";

// Utility function to deduplicate arrays based on id or unique content
function deduplicateArray<T extends Record<string, any>>(
  array: T[] | undefined,
  keyField: keyof T = "id"
): T[] {
  if (!array || !Array.isArray(array)) return [];

  // First try to deduplicate by ID if it exists
  const seenIds = new Set();
  const seenContent = new Set();

  return array.filter((item) => {
    // If item has an ID, use that for deduplication
    if (item[keyField] !== undefined && item[keyField] !== null) {
      if (seenIds.has(item[keyField])) {
        return false;
      }
      seenIds.add(item[keyField]);
      return true;
    }

    // Otherwise, use content-based deduplication
    const contentKey = JSON.stringify(item);
    if (seenContent.has(contentKey)) {
      return false;
    }
    seenContent.add(contentKey);
    return true;
  });
}

// Function to sanitize CV data and remove duplicates
function sanitizeCVData(profile: any): any {
  if (!profile) return profile;

  const sanitized = { ...profile };

  // Deduplicate education, experience, publications, and awards
  if (sanitized.education) {
    sanitized.education = deduplicateArray(sanitized.education);
  }

  if (sanitized.experience) {
    sanitized.experience = deduplicateArray(sanitized.experience);
  }

  if (sanitized.publications) {
    sanitized.publications = deduplicateArray(sanitized.publications, "title");
  }

  if (sanitized.awards) {
    sanitized.awards = deduplicateArray(sanitized.awards, "name");
  }

  return sanitized;
}

interface CVData {
  fullName: string;
  institution: string;
  profession: string;
  field: string;
  specialization: string;
  email: string;
  registeredAt: string;
  photoUrl?: string;
  orcid?: string;
  googleScholar?: string;
  username?: string; // Add username field
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

const compressImage = (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        const maxDimension = 800;
        if (width > height && width > maxDimension) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else if (height > maxDimension) {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Canvas to Blob conversion failed"));
              return;
            }

            const compressedFile = new File([blob], file.name, {
              type: "image/jpeg",
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          "image/jpeg",
          0.7
        );
      };
      img.onerror = () => {
        reject(new Error("Image loading error"));
      };
    };
    reader.onerror = () => {
      reject(new Error("File reading error"));
    };
  });
};

export function useCVRegistration(walletAddress?: string) {
  const [cvStatus, setCvStatus] = useState<CVStatus | null>(null);
  const [cvData, setCvData] = useState<CVData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { isLoading, setIsLoading } = useLoading();
  const { authenticated, getAccessToken } = usePrivy();
  const apiUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5001/api";

  const checkCVRegistration = useCallback(
    async (walletAddress: string): Promise<boolean> => {
      try {
        setError(null);

        const result = await axios.get(
          `${apiUrl}/manuscripts/check-cv-status/${walletAddress}`
        );
        setCvStatus(result.data as CVStatus);

        if (result.data.success && result.data.hasCV && result.data.userInfo) {
          setCvData({
            fullName: result.data.userInfo.fullName,
            institution: result.data.userInfo.institution,
            profession: result.data.userInfo.profession,
            field: result.data.userInfo.profession,
            specialization: result.data.userInfo.profession,
            email: result.data.userInfo.email,
            registeredAt: result.data.userInfo.createdAt,
            photoUrl: result.data.userInfo.profilePhoto,
            orcid: result.data.userInfo.orcid,
            googleScholar: result.data.userInfo.googleScholar,
            education: result.data.userInfo.education,
            experience: result.data.userInfo.experience,
            publications: result.data.userInfo.publications,
            awards: result.data.userInfo.awards,
          });
          return result.data.canSubmitManuscripts;
        } else {
          setError(result.data.message);
          return false;
        }
      } catch (err) {
        console.error("Failed to check CV registration:", err);

        if (axios.isAxiosError(err)) {
          if (err.response?.status === 404) {
            // Don't show toast for 404 on CV check - this is expected for new users
            setError("No CV found");
          } else {
            toast.error("Check Failed", {
              description: "Failed to check CV status. Please try again.",
              duration: 3000,
            });
            setError("Network error while checking CV status");
          }
        } else {
          toast.error("Network Error", {
            description: "Failed to connect to server.",
            duration: 3000,
          });
          setError("Network error while checking CV status");
        }
        return false;
      } finally {
      }
    },
    [apiUrl]
  );

  const checkCVRegistrationPrivy = useCallback(
    async (walletAddress?: string): Promise<boolean> => {
      try {
        setError(null);

        if (!walletAddress || walletAddress.trim() === "") {
          setError("Wallet address required for CV verification");
          return false;
        }

        // For now, just use the working endpoint regardless of Privy auth
        // TODO: Implement proper Privy authentication once the backend supports it correctly

        const result = await axios.get(
          `${apiUrl}/manuscripts/check-cv-status/${walletAddress}`
        );

        setCvStatus(result.data as CVStatus);

        if (result.data.success && result.data.hasCV && result.data.userInfo) {
          setCvData({
            fullName: result.data.userInfo.fullName,
            institution: result.data.userInfo.institution,
            profession: result.data.userInfo.profession,
            field: result.data.userInfo.profession,
            specialization: result.data.userInfo.profession,
            email: result.data.userInfo.email || "",
            registeredAt: result.data.userInfo.registeredAt,
          });
          return result.data.canSubmitManuscripts;
        } else if (result.data.hasCV !== undefined) {
          // Handle case where endpoint returns CV status without full success structure
          return result.data.hasCV && result.data.canSubmitManuscripts;
        } else {
          setError(result.data.message || "CV status check failed");
          return false;
        }
      } catch (err) {
        console.error("Failed to check CV registration:", err);
        setError("Network error while checking CV status");
        return false;
      }
    },
    [apiUrl]
  );

  const uploadCV = useCallback(
    async (
      cv: File,
      walletAddress: string
    ): Promise<CVParseResponse | null> => {
      try {
        setError(null);

        let headers: any = { "Content-Type": "multipart/form-data" };
        if (authenticated) {
          try {
            const accessToken = await getAccessToken();
            if (accessToken) {
              headers.Authorization = `Bearer ${accessToken}`;
            }
          } catch (tokenError) {}
        }

        const formData = new FormData();
        formData.append("cv", cv);
        formData.append("walletAddress", walletAddress);

        const result = await axios.post(`${apiUrl}/cv/parse-cv`, formData, {
          headers,
        });

        if (result.data.success) {
          const newCvData = {
            fullName: result.data.selfIdentity?.fullName || "",
            institution: result.data.selfIdentity?.institution || "",
            profession: result.data.selfIdentity?.profession || "",
            field: result.data.selfIdentity?.field || "",
            specialization: result.data.selfIdentity?.specialization || "",
            email: result.data.contact?.email || "",
            registeredAt: new Date().toISOString(),
          };
          setCvData(newCvData);

          setTimeout(() => {
            checkCVRegistration(walletAddress);
          }, 500);
        }

        return result.data as CVParseResponse;
      } catch (err) {
        console.error("Failed to upload CV:", err);
        setError(err instanceof Error ? err.message : "Failed to upload CV");
        return null;
      } finally {
      }
    },
    [checkCVRegistration, authenticated, getAccessToken, apiUrl]
  );

  const parseCV = useCallback(
    async (
      file: File
    ): Promise<{
      success: boolean;
      data?: any;
      message?: string;
      savedToDatabase?: boolean;
    }> => {
      if (!file) {
        return { success: false, message: "No file selected" };
      }

      if (!walletAddress) {
        return { success: false, message: "Wallet address is required" };
      }

      try {
        setError(null);
        setIsLoading(true);
        setUploadProgress(0);

        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => {
            if (prev >= 90) return prev;
            return prev + 10;
          });
        }, 200);

        const formData = new FormData();
        formData.append("cv", file);
        formData.append("walletAddress", walletAddress);

        const result = await axios.post(`${apiUrl}/parse-cv/upload`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent) => {
            const progress = progressEvent.total
              ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
              : 0;
            setUploadProgress(Math.min(90, progress));
          },
        });

        clearInterval(progressInterval);
        setUploadProgress(100);

        if (result.data.success && result.data.data) {
          const cvData = result.data.data; // Backend returns data in result.data.data

          const parsedData = {
            fullName: cvData.selfIdentity?.fullName || "",
            title: cvData.selfIdentity?.title || "",
            profession: cvData.selfIdentity?.profession || "",
            institution: cvData.selfIdentity?.institution || "",
            location: cvData.selfIdentity?.location || "",
            field: cvData.selfIdentity?.field || "",
            specialization: cvData.selfIdentity?.specialization || "",
            email: cvData.contact?.email || "",
            phone: cvData.contact?.phone || "",
            linkedIn: cvData.contact?.linkedIn || "",
            github: cvData.contact?.github || "",
            website: cvData.contact?.website || "",
            overview: cvData.overview || "",
            orcid: cvData.contact?.orcid || "",
            googleScholar: cvData.contact?.googleScholar || "",
            education: cvData.education || [],
            experience: cvData.experience || [],
            publications: cvData.publications || [],
            awards: cvData.awards || [],
          };

          setCvData({
            fullName: parsedData.fullName,
            institution: parsedData.institution,
            profession: parsedData.profession,
            field: parsedData.field,
            specialization: parsedData.specialization,
            email: parsedData.email,
            registeredAt: new Date().toISOString(),
            orcid: parsedData.orcid,
            googleScholar: parsedData.googleScholar,
            education: parsedData.education,
            experience: parsedData.experience,
            publications: parsedData.publications,
            awards: parsedData.awards,
          });

          // If the CV was saved to the database, check the registration status
          if (result.data.savedToDatabase) {
            setTimeout(() => {
              checkCVRegistration(walletAddress);
            }, 500);

            toast.success("CV Saved Successfully", {
              description: "Your CV has been parsed and saved to your profile.",
            });
          } else {
            toast.success("CV Parsed Successfully", {
              description: "Please review and edit the extracted information.",
            });
          }

          return {
            success: true,
            data: parsedData,
            message: result.data.message || "CV parsed successfully",
            savedToDatabase: result.data.savedToDatabase,
          };
        } else {
          console.error("❌ CV parsing failed - invalid response structure:", {
            hasSuccess: !!result.data.success,
            hasData: !!result.data.data,
            actualData: result.data,
          });
          throw new Error(
            result.data.message ||
              "Failed to parse CV - invalid response structure"
          );
        }
      } catch (err) {
        console.error("Failed to parse CV:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Failed to parse CV";
        setError(errorMessage);
        toast.error("Parse Failed", {
          description: "Failed to parse CV. Please try again.",
        });
        return {
          success: false,
          message: errorMessage,
        };
      } finally {
        setIsLoading(false);
        setUploadProgress(0);
      }
    },
    [apiUrl, walletAddress, checkCVRegistration, setIsLoading]
  );

  const getUserProfile = useCallback(
    async (walletAddress: string): Promise<UserProfileResponse | null> => {
      try {
        setError(null);
        setIsLoading(true);

        let headers = {};
        if (authenticated) {
          try {
            const accessToken = await getAccessToken();
            if (accessToken) {
              headers = { Authorization: `Bearer ${accessToken}` };
            }
          } catch (tokenError) {}
        }

        const result = await axios.get(
          `${apiUrl}/parse-cv/user/profile/${walletAddress}`,
          { headers }
        );

        if (result.data.success) {
          // Sanitize profile data to remove duplicates
          const sanitizedProfile = sanitizeCVData(result.data.profile);

          // Set the complete profile data including arrays
          setCvData({
            fullName: sanitizedProfile.personalInfo.fullName,
            institution: sanitizedProfile.personalInfo.institution,
            profession: sanitizedProfile.personalInfo.profession,
            field: sanitizedProfile.personalInfo.field,
            specialization: sanitizedProfile.personalInfo.specialization,
            email: sanitizedProfile.contact.email,
            registeredAt: sanitizedProfile.createdAt,
            photoUrl:
              sanitizedProfile.profilePhoto ||
              sanitizedProfile.personalInfo.photoUrl,
            orcid: sanitizedProfile.contact.orcid,
            googleScholar: sanitizedProfile.contact.googleScholar,
            username: sanitizedProfile.username, // Include username from backend
            // Include all the sanitized array data
            education: sanitizedProfile.education || [],
            experience: sanitizedProfile.experience || [],
            publications: sanitizedProfile.publications || [],
            awards: sanitizedProfile.awards || [],
          });

          // Show success toast
          toast.success("Profile Loaded", {
            description: `Welcome back, ${result.data.profile.personalInfo.fullName}!`,
            duration: 3000,
          });
        }

        return result.data as UserProfileResponse;
      } catch (err) {
        // Handle specific error cases with appropriate toast messages
        if (axios.isAxiosError(err)) {
          if (err.response?.status === 404) {
            // 404 is expected for users without CVs - don't log as error
            const responseData = err.response.data;
            if (
              responseData?.message ===
              "No CV data found for this wallet address"
            ) {
            } else {
              setError("Profile not found");
            }
          } else if (err.response?.status === 401) {
            toast.error("Authentication Required", {
              description: "Please log in to access your profile.",
              duration: 4000,
            });
            setError("Authentication required");
          } else if (err.response?.status && err.response?.status >= 500) {
            console.error("Server error getting user profile:", err);
            toast.error("Server Error", {
              description: "Server error occurred. Please try again later.",
              duration: 4000,
              className: "text-red-600 bg-white border border-red-500",
            });
            setError("Server error occurred");
          } else {
            console.error("Failed to get user profile:", err);
            toast.error("Failed to Load Profile", {
              description: `Error: ${
                err.response?.data?.message || err.message
              }`,
              duration: 4000,
            });
            setError(err.response?.data?.message || err.message);
          }
        } else {
          console.error("Network error getting user profile:", err);
          toast.error("Network Error", {
            description:
              "Failed to connect to server. Please check your internet connection.",
            duration: 4000,
          });
          setError("Network error - please check your connection");
        }

        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [authenticated, getAccessToken, apiUrl, setIsLoading]
  );

  const getUserProfileMultiWallet = useCallback(
    async (walletAddresses: string[]): Promise<UserProfileResponse | null> => {
      try {
        setError(null);
        setIsLoading(true);

        let headers = {};
        if (authenticated) {
          try {
            const accessToken = await getAccessToken();
            if (accessToken) {
              headers = { Authorization: `Bearer ${accessToken}` };
            }
          } catch (tokenError) {}
        }

        // Try each wallet address until we find CV data
        for (const walletAddress of walletAddresses) {
          if (!walletAddress) continue;

          try {
            const result = await axios.get(
              `${apiUrl}/parse-cv/user/profile/${walletAddress}`,
              { headers }
            );

            if (result.data.success && result.data.profile) {
              // Sanitize profile data to remove duplicates
              const sanitizedProfile = sanitizeCVData(result.data.profile);

              // Set the complete profile data including arrays
              setCvData({
                fullName: sanitizedProfile.personalInfo.fullName,
                institution: sanitizedProfile.personalInfo.institution,
                profession: sanitizedProfile.personalInfo.profession,
                field: sanitizedProfile.personalInfo.field,
                specialization: sanitizedProfile.personalInfo.specialization,
                email: sanitizedProfile.contact.email,
                registeredAt: sanitizedProfile.createdAt,
                photoUrl:
                  sanitizedProfile.profilePhoto ||
                  sanitizedProfile.personalInfo.photoUrl,
                orcid: sanitizedProfile.contact.orcid,
                googleScholar: sanitizedProfile.contact.googleScholar,
                username: sanitizedProfile.username, // Include username from backend
                education: sanitizedProfile.education || [],
                experience: sanitizedProfile.experience || [],
                publications: sanitizedProfile.publications || [],
                awards: sanitizedProfile.awards || [],
              });

              // Show success toast with wallet info
              toast.success("Profile Loaded", {
                description: `Welcome back, ${
                  result.data.profile.personalInfo.fullName
                }! (CV found on ${walletAddress.substring(0, 8)}...)`,
                duration: 3000,
              });

              return result.data as UserProfileResponse;
            }
          } catch (err) {
            if (axios.isAxiosError(err) && err.response?.status === 404) {
              // Continue to next wallet
              continue;
            } else {
              // For non-404 errors, log but continue trying other wallets
              continue;
            }
          }
        }

        // If we get here, no wallet had CV data
        setError(
          "Profile not found across any connected wallets. Please upload your CV first."
        );

        return null;
      } catch (err) {
        console.error("Error in multi-wallet profile lookup:", err);
        setError("Failed to search for profile across wallets");
        toast.error("Search Failed", {
          description:
            "Failed to search for profile across wallets. Please try again.",
          duration: 4000,
          className: "text-red-600 bg-white border border-red-500",
        });
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [authenticated, getAccessToken, apiUrl, setIsLoading]
  );

  const updateUserProfile = useCallback(
    async (
      walletAddress: string,
      updateData: ProfileUpdateRequest
    ): Promise<ProfileUpdateResponse | null> => {
      try {
        setError(null);

        // Get Privy access token for authentication
        let headers = {};
        if (authenticated) {
          try {
            const accessToken = await getAccessToken();
            if (accessToken) {
              headers = { Authorization: `Bearer ${accessToken}` };
            }
          } catch (tokenError) {}
        }

        const result = await axios.put(
          `${apiUrl}/parse-cv/user/profile/${walletAddress}`,
          updateData,
          { headers }
        );

        if (result.data.success) {
          if (result.data.profile) {
            setCvData({
              fullName: result.data.profile.personalInfo.fullName,
              institution: result.data.profile.personalInfo.institution,
              profession: result.data.profile.personalInfo.profession,
              field: result.data.profile.personalInfo.field,
              specialization: result.data.profile.personalInfo.specialization,
              email: result.data.profile.contact.email,
              registeredAt: result.data.profile.createdAt,
              photoUrl:
                result.data.profile.profilePhoto ||
                result.data.profile.personalInfo.photoUrl,
            });
          }

          toast.success("Profile Updated", {
            description: "Your profile has been successfully updated!",
            duration: 3000,
          });
        }

        return result.data as ProfileUpdateResponse;
      } catch (err) {
        console.error("Failed to update user profile:", err);

        // Handle specific error cases with appropriate toast messages
        if (axios.isAxiosError(err)) {
          if (err.response?.status === 404) {
            toast.error("Profile Not Found", {
              description:
                "Profile not found. Please create your profile first by uploading a CV.",
              duration: 4000,
            });
            setError("Profile not found");
          } else if (err.response?.status === 401) {
            toast.error("Authentication Required", {
              description: "Please log in to update your profile.",
              duration: 4000,
              className: "text-red-600 bg-white border border-red-500",
            });
            setError("Authentication required");
          } else if (err.response?.status === 400) {
            toast.error("Invalid Data", {
              description:
                err.response?.data?.message || "Please check your input data.",
              duration: 4000,
              className: "text-red-600 bg-white border border-red-500",
            });
            setError(err.response?.data?.message || "Invalid data");
          } else {
            toast.error("Update Failed", {
              description:
                err.response?.data?.message ||
                "Failed to update profile. Please try again.",
              duration: 4000,
              className: "text-red-600 bg-white border border-red-500",
            });
            setError(err.response?.data?.message || "Update failed");
          }
        } else {
          toast.error("Network Error", {
            description: "Failed to connect to server. Please try again.",
            duration: 4000,
            className: "text-red-600 bg-white border border-red-500",
          });
          setError("Network error");
        }

        return null;
      } finally {
      }
    },
    [authenticated, getAccessToken, apiUrl]
  );

  const uploadProfilePhoto = useCallback(
    async (
      photo: File,
      walletAddress: string
    ): Promise<{
      success: boolean;
      profilePhoto?: string;
      message: string;
    }> => {
      try {
        setError(null);
        setIsLoading(true);

        // Compress the image before uploading
        const compressedPhoto = await compressImage(photo);

        // Get Privy access token for authentication
        let headers: any = { "Content-Type": "multipart/form-data" };
        if (authenticated) {
          try {
            const accessToken = await getAccessToken();
            if (accessToken) {
              headers.Authorization = `Bearer ${accessToken}`;
            }
          } catch (tokenError) {}
        }

        const formData = new FormData();
        formData.append("profilePhoto", compressedPhoto);

        const response = await axios.post(
          `${apiUrl}/parse-cv/user/profile-photo/${walletAddress}`,
          formData,
          { headers }
        );

        if (response.data.success) {
          // Show success toast
          toast.success("Photo Updated", {
            description: "Your profile photo has been updated successfully!",
            duration: 3000,
          });

          return {
            success: true,
            profilePhoto: response.data.profilePhoto,
            message: "Profile photo updated successfully",
          };
        } else {
          toast.error("Upload Failed", {
            description:
              response.data.message || "Failed to upload profile photo",
            duration: 4000,
            className: "text-red-600 bg-white border border-red-500",
          });
          setError(response.data.message || "Failed to upload profile photo");
          return {
            success: false,
            message: response.data.message || "Failed to upload profile photo",
          };
        }
      } catch (err) {
        console.error("Failed to upload profile photo:", err);

        // Handle specific error cases with appropriate toast messages
        if (axios.isAxiosError(err)) {
          if (err.response?.status === 404) {
            toast.error("Profile Not Found", {
              description:
                "Profile not found. Please create your profile first.",
              duration: 4000,
              className: "text-red-600 bg-white border border-red-500",
            });
            setError("Profile not found");
          } else if (err.response?.status === 413) {
            toast.error("File Too Large", {
              description: "Profile photo must be less than 5MB.",
              duration: 4000,
              className: "text-red-600 bg-white border border-red-500",
            });
            setError("File too large");
          } else if (err.response?.status === 400) {
            toast.error("Invalid File", {
              description:
                err.response?.data?.message ||
                "Please select a valid image file.",
              duration: 4000,
              className: "text-red-600 bg-white border border-red-500",
            });
            setError(err.response?.data?.message || "Invalid file");
          } else {
            toast.error("Upload Failed", {
              description:
                err.response?.data?.message ||
                "Failed to upload photo. Please try again.",
              duration: 4000,
              className: "text-red-600 bg-white border border-red-500",
            });
            setError(err.response?.data?.message || "Upload failed");
          }
        } else {
          toast.error("Network Error", {
            description:
              "Failed to upload photo. Please check your connection.",
            duration: 4000,
            className: "text-red-600 bg-white border border-red-500",
          });
          setError("Network error");
        }

        const errorMessage =
          err instanceof Error ? err.message : "Failed to upload profile photo";
        return {
          success: false,
          message: errorMessage,
        };
      } finally {
        setIsLoading(false);
      }
    },
    [authenticated, getAccessToken, apiUrl, setIsLoading]
  );

  const getUserSpecialization = useCallback(
    async (walletAddress: string): Promise<any> => {
      try {
        setError(null);

        // Get Privy access token for authentication
        let headers = {};
        if (authenticated) {
          try {
            const accessToken = await getAccessToken();
            if (accessToken) {
              headers = { Authorization: `Bearer ${accessToken}` };
            }
          } catch (tokenError) {}
        }

        const result = await axios.get(
          `${apiUrl}/parse-cv/user/specialization/${walletAddress}`,
          { headers }
        );
        return result;
      } catch (err) {
        console.error("Failed to get user specialization:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to get user specialization"
        );
        return null;
      } finally {
      }
    },
    [authenticated, getAccessToken, apiUrl]
  );

  const createManualProfile = useCallback(
    async (
      profileData: {
        fullName: string;
        institution: string;
        profession: string;
        field: string;
        specialization: string;
        email: string;
        orcid?: string;
        googleScholar?: string;
      },
      walletAddress: string
    ): Promise<{ success: boolean; message: string }> => {
      try {
        setError(null);
        setIsLoading(true);

        const result = await axios.post(`${apiUrl}/parse-cv/manual-profile`, {
          ...profileData,
          walletAddress,
        });

        if (result.data.success) {
          setCvData({
            ...profileData,
            registeredAt: new Date().toISOString(),
          });

          setTimeout(() => {
            checkCVRegistration(walletAddress);
          }, 500);

          return {
            success: true,
            message: "Profile created successfully!",
          };
        } else {
          setError(result.data.message || "Failed to create profile");
          return {
            success: false,
            message: result.data.message || "Failed to create profile",
          };
        }
      } catch (err) {
        console.error("Failed to create manual profile:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Failed to create profile";
        setError(errorMessage);
        return {
          success: false,
          message: errorMessage,
        };
      } finally {
        setIsLoading(false);
      }
    },
    [apiUrl, setIsLoading, checkCVRegistration]
  );

  return {
    cvStatus,
    cvData,
    isLoading,
    error,
    uploadProgress,
    checkCVRegistration, // Legacy wallet-based method
    checkCVRegistrationPrivy, // New Privy token-based method
    uploadCV,
    parseCV, // Add the new function to the returned object
    getUserProfile,
    getUserProfileMultiWallet, // Multi-wallet profile lookup
    updateUserProfile,
    getUserSpecialization,
    uploadProfilePhoto,
    createManualProfile,
  };
}
