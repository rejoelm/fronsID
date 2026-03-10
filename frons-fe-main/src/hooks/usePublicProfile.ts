import { useState, useEffect } from "react";

export interface PublicUserProfile {
  id: number;
  username: string;
  fullName: string;
  title: string;
  profession: string;
  institution: string;
  location: string;
  field: string;
  specialization: string;
  overview: string;
  profilePhoto: string;
  headerImage: string;
  publicContact: {
    website: string;
    linkedIn: string;
    github: string;
    orcid: string;
    googleScholar: string;
  };
  education: Array<{
    id: number;
    institution: string;
    degree: string;
    field: string;
    start_date: string;
    end_date: string;
    location: string;
  }>;
  experience: Array<{
    id: number;
    company: string;
    position: string;
    start_date: string;
    end_date: string;
    description: string;
    location: string;
  }>;
  awards: Array<{
    id: number;
    name: string;
    issuer: string;
    date: string;
    description: string;
  }>;
  publications: Array<{
    id: number;
    title: string;
    authors: string[];
    venue: string;
    date: string;
    doi: string;
    url: string;
  }>;
  createdAt: string;
}

export function usePublicProfile(username: string) {
  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      if (!username) return;

      try {
        setLoading(true);
        setError(null);

        const apiUrl =
          process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5001/api";


        const response = await fetch(`${apiUrl}/user/profile/${username}`);

        if (!response.ok) {
          if (response.status === 404) {
            setError("User not found");
          } else {
            setError("Failed to load profile");
          }
          return;
        }

        const data = await response.json();

        if (data.success) {
          setProfile(data.data);
        } else {
          setError("Failed to load profile");
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err);
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [username]);

  return {
    profile,
    loading,
    error,
  };
}
