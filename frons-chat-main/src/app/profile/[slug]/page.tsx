"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  BookOpen, Award, TrendingUp, Coins, Globe, Building2,
  GraduationCap, ExternalLink, Database, Star
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface ResearcherProfile {
  id: string;
  wallet_address: string;
  name: string;
  email: string;
  institution: string;
  education: string;
  specializations: string[];
  h_index: number;
  total_citations: number;
  total_earnings_usdc: number;
  leaderboard_rank: number;
  orcid: string;
  google_scholar_id: string;
  created_at: string;
}

interface Publication {
  id: string;
  title: string;
  doci: string;
  citation_count: number;
  status: string;
  submission_date: string;
}

export default function ProfilePage() {
  const { slug } = useParams<{ slug: string }>();
  const [profile, setProfile] = useState<ResearcherProfile | null>(null);
  const [publications, setPublications] = useState<Publication[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, [slug]);

  async function loadProfile() {
    // Try wallet address or name-based slug
    const { data: researcher } = await supabase
      .from("researchers")
      .select("*")
      .or(`wallet_address.eq.${slug},name.ilike.%${slug}%`)
      .single();

    if (researcher) {
      setProfile(researcher);

      const { data: pubs } = await supabase
        .from("articles")
        .select("id, title, doci, citation_count, status, submission_date")
        .contains("authors", [{ wallet: researcher.wallet_address }])
        .eq("status", "published")
        .order("citation_count", { ascending: false });

      if (pubs) setPublications(pubs);
    }
    setIsLoading(false);
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F8FD] flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading profile...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#F8F8FD] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Researcher not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F8FD]">
      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Profile Header */}
        <div className="bg-white rounded-2xl border border-gray-100 p-8 mb-8">
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 bg-[#2C337A] rounded-2xl flex items-center justify-center text-white text-2xl font-bold">
              {profile.name?.charAt(0)?.toUpperCase() || "?"}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-[#2C337A]">{profile.name}</h1>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                {profile.institution && (
                  <span className="flex items-center gap-1">
                    <Building2 className="w-4 h-4" /> {profile.institution}
                  </span>
                )}
                {profile.education && (
                  <span className="flex items-center gap-1">
                    <GraduationCap className="w-4 h-4" /> {profile.education}
                  </span>
                )}
              </div>
              {profile.specializations.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {profile.specializations.map((s) => (
                    <span key={s} className="bg-[#E5E0FE] text-[#2C337A] text-xs px-3 py-1 rounded-full">
                      {s}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-4 mt-4">
                {profile.orcid && (
                  <a href={`https://orcid.org/${profile.orcid}`} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-[#2C337A] hover:underline flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5" /> ORCID
                  </a>
                )}
                {profile.google_scholar_id && (
                  <a href={`https://scholar.google.com/citations?user=${profile.google_scholar_id}`} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-[#2C337A] hover:underline flex items-center gap-1">
                    <ExternalLink className="w-3.5 h-3.5" /> Google Scholar
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Publications", value: publications.length, icon: BookOpen, color: "text-[#2C337A]" },
            { label: "Total Citations", value: profile.total_citations, icon: TrendingUp, color: "text-[#FB7720]" },
            { label: "h-Index", value: parseFloat(String(profile.h_index)).toFixed(1), icon: Award, color: "text-purple-600" },
            { label: "Leaderboard", value: profile.leaderboard_rank > 0 ? `#${profile.leaderboard_rank}` : "—", icon: Star, color: "text-yellow-500" },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="bg-white rounded-xl border border-gray-100 p-4 text-center">
                <Icon className={`w-5 h-5 ${stat.color} mx-auto mb-2`} />
                <p className="text-2xl font-bold text-[#2C337A]">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            );
          })}
        </div>

        {/* Publications */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50">
            <h2 className="font-bold text-[#2C337A]">Publications</h2>
          </div>
          {publications.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No publications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {publications.map((pub) => (
                <div key={pub.id} className="px-6 py-4 hover:bg-gray-50">
                  <h3 className="font-medium text-[#2C337A] text-sm">{pub.title}</h3>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                    {pub.doci && <code className="bg-orange-50 text-[#FB7720] px-2 py-0.5 rounded">{pub.doci}</code>}
                    <span>{pub.citation_count} citations</span>
                    <span>{new Date(pub.submission_date).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
