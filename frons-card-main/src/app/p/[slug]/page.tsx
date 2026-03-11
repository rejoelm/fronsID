"use client";

import { use, useEffect, useState } from "react";
import ProfileHero from "@/components/profile/profile-hero";
import PublicationList from "@/components/profile/publication-list";
import VerificationBadges from "@/components/profile/verification-badges";
import ShareProfile from "@/components/profile/share-profile";
import ExperienceList, { Experience } from "@/components/profile/experience-list";
import EducationList, { Education } from "@/components/profile/education-list";
import Navbar from "@/components/navbar";
import Footer from "@/components/landing/footer";
import { Loader2, BriefcaseBusiness, FileText, QrCode } from "lucide-react";

// Mock Data for the profile (In production, replace with Supabase fetch using `params.slug`)
const MOCK_PROFILE = {
  slug: "rejo-elm",
  displayName: "Dr. Rejo Elm",
  title: "Principal Investigator of AI Genomics",
  institution: "Stanford University",
  location: "Palo Alto, CA",
  specializations: ["Bioinformatics", "Machine Learning", "CRISPR-Cas9"],
  about: "Bridging the gap between artificial intelligence and computational biology. My research focuses on developing self-attention mechanisms to predict complex protein folding sequences with extremely high accuracy, thereby accelerating the discovery of novel therapeutic targets. Currently leading a cross-functional team of researchers and engineers at Stanford.",
  experience: [
    {
      id: "exp1",
      role: "Principal Investigator",
      institution: "Stanford University",
      location: "Palo Alto, CA",
      startDate: "Aug 2023",
      endDate: "Present",
      description: "Leading a $4.5M NIH-funded lab focusing on generative AI applications in CRISPR-Cas9 off-target predictions."
    },
    {
      id: "exp2",
      role: "Senior Machine Learning Researcher",
      institution: "DeepMind",
      location: "London, UK",
      startDate: "Jan 2019",
      endDate: "Jul 2023",
      description: "Core contributor to the AlphaFold3 architecture team. Developed novel contrastive learning paradigms for amino acid side-chain generation."
    }
  ],
  education: [
    {
      id: "edu1",
      degree: "Ph.D. in Computational Biology",
      institution: "Massachusetts Institute of Technology (MIT)",
      year: "2019",
      details: "Dissertation: 'Deep Generative Models for De Novo Protein Design'. Advised by Dr. Alan Turing."
    },
    {
      id: "edu2",
      degree: "B.S. in Computer Science",
      institution: "University of California, Berkeley",
      year: "2014",
      details: "Graduated Summa Cum Laude. Minor in Molecular and Cell Biology."
    }
  ],
  stats: {
    hIndex: 42,
    reviewsCompleted: 156,
    datasetsPublished: 12,
    verifiedScholar: true,
    researcherId: "8A2B9F4C",
  },
  papers: [
    {
      id: "1",
      doci: "10.fronsciers/2026.0042",
      title: "Self-Attention Mechanisms in Protein Folding Prediction Models",
      status: "published",
      citation_count: 342,
      publication_date: "2026-01-15T10:00:00Z",
    },
    {
      id: "2",
      doci: "10.fronsciers/2025.1088",
      title: "Synthetic Data Generation for Privacy-Preserving Clinical Trials",
      status: "published",
      citation_count: 89,
      publication_date: "2025-08-22T14:30:00Z",
    },
    {
      id: "3",
      doci: "10.fronsciers/2025.0412",
      title: "Evaluating k-anonymity in LLM Context Windows",
      status: "published",
      citation_count: 215,
      publication_date: "2025-04-10T09:15:00Z",
    }
  ]
};

export default function ProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const unwrappedParams = use(params);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<typeof MOCK_PROFILE | null>(null);

  useEffect(() => {
    // Simulate API fetch delay
    const timer = setTimeout(() => {
      setProfile({
        ...MOCK_PROFILE,
        displayName: unwrappedParams.slug.replace("-", " ").replace(/\b\w/g, c => c.toUpperCase()) || MOCK_PROFILE.displayName,
      });
      setLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, [unwrappedParams.slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F8FD] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#2C337A] animate-spin" />
      </div>
    );
  }

  if (!profile) return <div className="min-h-screen flex items-center justify-center">Profile not found</div>;

  return (
    <div className="min-h-screen bg-[#F8F8FD] text-gray-900 font-sans selection:bg-[#FFC6DE] selection:text-[#2C337A] flex flex-col pt-16">
      <Navbar />
      
      {/* Container aligned to the top with a max-width typical for LinkedIn/Resumes */}
      <main className="flex-grow w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Top Header Card */}
        <div className="bg-white rounded-t-xl rounded-b-md shadow-sm border border-gray-200 overflow-hidden mb-6 relative">
          
          {/* Cover Photo Banner */}
          <div className="h-32 md:h-48 bg-gradient-to-r from-[#2C337A] via-[#4A55A2] to-[#7895CB] relative">
             <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-repeat" />
             
             {/* Share Button over the banner (top right) */}
             <div className="absolute top-4 right-4 z-10">
               <ShareProfile slug={profile.slug} name={profile.displayName} />
             </div>
          </div>
          
          <div className="px-6 md:px-10 pb-8 -mt-12 md:-mt-16">
            <ProfileHero 
              displayName={profile.displayName}
              title={profile.title}
              institution={profile.institution}
              location={profile.location}
              specializations={profile.specializations}
              isOwner={true} // Hardcoded to true for demo purposes
              onAvatarUpload={(file) => console.log("Uploading avatar:", file)}
              onResumeUpload={(file) => console.log("Uploading resume:", file)}
            />
          </div>
        </div>

        {/* 2-Column Grid Layout for Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Main Column: About & Experience/Publications */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* About Section */}
            <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#2C337A]" />
                About
              </h3>
              <p className="text-gray-700 leading-relaxed text-[15px]">
                {profile.about}
              </p>
            </div>

            {/* Experience & Education Section */}
            <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-200">
              <ExperienceList experiences={profile.experience} />
              <EducationList education={profile.education} />
            </div>

            {/* Publication List Section */}
            <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-200">
              <div className="mb-6">
                <PublicationList papers={profile.papers} />
              </div>
            </div>

          </div>

          {/* Right Sidebar: Badges & Stats */}
          <div className="space-y-6">
            
            {/* Verification Sidebar Card */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 sticky top-24">
              <VerificationBadges stats={profile.stats} />
            </div>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
