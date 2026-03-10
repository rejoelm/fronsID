import { useState, useCallback } from "react";
import { useCVRegistration } from "@/hooks/useCVRegistration";
import { isValidSolanaAddress } from "@/hooks/useProgram";
import { getPrimarySolanaWalletAddress } from "@/utils/wallet";

export interface UserProfile {
  username?: string;
  personalInfo: {
    fullName: string;
    title: string;
    profession: string;
    institution: string;
    location: string;
    field: string;
    specialization: string;
    photoUrl?: string;
  };
  contact: {
    email: string;
    phone?: string;
    linkedIn?: string;
    github?: string;
    website?: string;
    orcid?: string;
    googleScholar?: string;
  };
  overview?: string;
  summary: {
    education: number;
    experience: number;
    publications: number;
    awards: number;
  };
  education?: Array<{
    id?: string;
    institution: string;
    degree: string;
    field: string;
    startDate: string;
    endDate: string;
    gpa?: string;
    location?: string;
  }>;
  experience?: Array<{
    id?: string;
    company: string;
    position: string;
    startDate: string;
    endDate: string;
    description?: string;
    location?: string;
    type?: string;
  }>;
  publications?: Array<{
    id?: string;
    title: string;
    authors: string[];
    venue: string;
    date: string;
    doi?: string;
    url?: string;
  }>;
  awards?: Array<{
    id?: string;
    name: string;
    issuer: string;
    date: string;
    description?: string;
  }>;
}

export function useProfileData(walletAddress: string | null | undefined) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const {
    getUserProfileMultiWallet,
    updateUserProfile,
    error: cvError,
  } = useCVRegistration(walletAddress ?? undefined);

  const deduplicateArray = useCallback(
    <T extends Record<string, any>>(
      array: T[] | undefined,
      keyField: keyof T = "id"
    ): T[] => {
      if (!array || !Array.isArray(array)) return [];

      const seenIds = new Set();
      const seenContent = new Set();

      return array.filter((item) => {
        if (item[keyField] !== undefined && item[keyField] !== null) {
          if (seenIds.has(item[keyField])) {
            return false;
          }
          seenIds.add(item[keyField]);
          return true;
        }

        const contentKey = JSON.stringify(item);
        if (seenContent.has(contentKey)) {
          return false;
        }
        seenContent.add(contentKey);
        return true;
      });
    },
    []
  );

  const loadProfile = useCallback(
    async (connected: boolean, solanaWallets: any[]) => {
      if (!connected || !solanaWallets || solanaWallets.length === 0) return;

      try {
        setLoadingProfile(true);
        setError(null);

        // Collect all possible wallet addresses
        const allWalletAddresses: string[] = [];

        // Add primary wallet (Privy embedded wallet preferred)
        const primaryWallet = getPrimarySolanaWalletAddress(solanaWallets);
        if (primaryWallet && isValidSolanaAddress(primaryWallet)) {
          allWalletAddresses.push(primaryWallet);
        }

        // Add all other connected wallets
        solanaWallets.forEach((wallet) => {
          if (
            wallet.address &&
            isValidSolanaAddress(wallet.address) &&
            !allWalletAddresses.includes(wallet.address)
          ) {
            allWalletAddresses.push(wallet.address);
          }
        });

        if (allWalletAddresses.length === 0) {
          setError("No valid wallet addresses found");
          return;
        }

        console.log(
          "📊 Searching for profile across wallets:",
          allWalletAddresses
        );

        const result = await getUserProfileMultiWallet(allWalletAddresses);

        if (result?.success && result.profile) {
          console.log("📊 Profile loaded successfully:", result.profile);

          // Sanitize the profile data
          const sanitizedEducation = deduplicateArray(
            (result.profile as any).education
          ) as UserProfile['education'];
          const sanitizedExperience = deduplicateArray(
            (result.profile as any).experience
          ) as UserProfile['experience'];
          const sanitizedPublications = deduplicateArray(
            (result.profile as any).publications,
            "title"
          ) as UserProfile['publications'];
          const sanitizedAwards = deduplicateArray(
            (result.profile as any).awards,
            "name"
          ) as UserProfile['awards'];

          const transformedProfile: UserProfile = {
            username: (result.profile as any).username || "",
            personalInfo: {
              fullName: result.profile.personalInfo?.fullName || "",
              title: result.profile.personalInfo?.title || "",
              profession: result.profile.personalInfo?.profession || "",
              institution: result.profile.personalInfo?.institution || "",
              location: result.profile.personalInfo?.location || "",
              field: result.profile.personalInfo?.field || "",
              specialization: result.profile.personalInfo?.specialization || "",
              photoUrl:
                result.profile.profilePhoto ||
                result.profile.personalInfo?.photoUrl,
            },
            contact: {
              email: result.profile.contact?.email || "",
              phone: result.profile.contact?.phone || "",
              linkedIn: result.profile.contact?.linkedIn || "",
              github: result.profile.contact?.github || "",
              website: result.profile.contact?.website || "",
              orcid: result.profile.contact?.orcid || "",
              googleScholar: result.profile.contact?.googleScholar || "",
            },
            overview: result.profile.overview || "",
            summary: {
              education: sanitizedEducation?.length || 0,
              experience: sanitizedExperience?.length || 0,
              publications: sanitizedPublications?.length || 0,
              awards: sanitizedAwards?.length || 0,
            },
            education: sanitizedEducation,
            experience: sanitizedExperience,
            publications: sanitizedPublications,
            awards: sanitizedAwards,
          };

          setProfile(transformedProfile);
        } else {
          console.log("📊 No profile found or failed to load");
          setError("Profile not found. Please register your CV first.");
        }
      } catch (err) {
        console.error("📊 Failed to load profile:", err);
        const errorMessage = "Failed to load profile. Please try again.";
        setError(errorMessage);
      } finally {
        setLoadingProfile(false);
        setIsInitialLoad(false);
      }
    },
    [getUserProfileMultiWallet, deduplicateArray]
  );

  const updateProfile = useCallback(
    async (updatePayload: any) => {
      if (!walletAddress) {
        throw new Error("No wallet connected");
      }

      const result = await updateUserProfile(walletAddress, updatePayload);
      return result;
    },
    [walletAddress, updateUserProfile]
  );

  return {
    profile,
    setProfile,
    loadingProfile,
    error,
    isInitialLoad,
    loadProfile,
    updateProfile,
    cvError,
  };
}