"use client";

import React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  BookOpenIcon,
  UserIcon,
  CalendarIcon,
  ExternalLinkIcon,
  ArrowLeftIcon,
  SparklesIcon,
  QuoteIcon,
  ShieldCheckIcon,
  LinkIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Header } from "@/components/header";

// This page will fetch real data from Supabase when credentials are connected
// For now it shows a static template that demonstrates the article reader UI

export default function ArticleReaderPage() {
  const params = useParams();
  const doci = params.doci as string;

  // Placeholder article data — will be replaced by Supabase query
  const article = {
    doci: doci ? decodeURIComponent(doci) : "10.fronsciers/2026.0001",
    title:
      "Machine Learning Approaches for Early Detection of Neurodegenerative Diseases: A Systematic Review",
    abstract:
      "This systematic review evaluates the current landscape of machine learning techniques applied to the early detection of neurodegenerative diseases including Alzheimer's, Parkinson's, and ALS. We analyzed 147 studies published between 2020-2025, examining model architectures, dataset characteristics, and clinical validation approaches. Our findings indicate that transformer-based models combined with multimodal neuroimaging data achieve the highest sensitivity (94.2%) for pre-symptomatic detection, while ensemble methods show superior specificity (91.7%) in clinical populations. We identify key challenges including dataset bias, lack of longitudinal validation, and limited interpretability that must be addressed before clinical deployment.",
    authors: [
      {
        name: "Dr. Sarah Chen",
        wallet: "Abc1...xyz9",
        affiliation: "MIT",
      },
      {
        name: "Prof. James Okafor",
        wallet: "Def2...uvw8",
        affiliation: "University of Lagos",
      },
    ],
    keywords: [
      "machine learning",
      "neurodegenerative diseases",
      "early detection",
      "deep learning",
      "neuroimaging",
    ],
    field: "Neuroscience",
    status: "published",
    submissionDate: "2026-01-15",
    publicationDate: "2026-02-20",
    citationCount: 42,
    accessCount: 1283,
    impactScore: 8.7,
    reviewers: 3,
    nftMint: "FroNs...ABC123",
  };

  return (
    <div className="min-h-screen bg-off-white">
      <Header />
      <main className="pt-24 pb-16">
        {/* Back navigation */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 mb-6">
          <Link
            href="/search"
            className="inline-flex items-center gap-1.5 text-sm text-navy/40 hover:text-navy transition-colors"
          >
            <ArrowLeftIcon className="w-3.5 h-3.5" />
            Back to Search
          </Link>
        </div>

        {/* Article Header */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          {/* DOCI Badge */}
          <div className="flex items-center gap-2 mb-4">
            <Badge className="bg-orange-accent/10 text-orange-accent border-0 text-xs font-mono px-3 py-1">
              <SparklesIcon className="w-3 h-3 mr-1.5" />
              {article.doci}
            </Badge>
            <Badge
              variant="outline"
              className="text-xs text-success border-success/20 bg-success/5"
            >
              <ShieldCheckIcon className="w-3 h-3 mr-1" />
              Peer Reviewed
            </Badge>
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-bold text-navy tracking-tight leading-snug">
            {article.title}
          </h1>

          {/* Authors */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {article.authors.map((author, i) => (
              <div
                key={i}
                className="flex items-center gap-2 text-sm text-navy/60"
              >
                <div className="w-7 h-7 rounded-full bg-lavender flex items-center justify-center">
                  <UserIcon className="w-3.5 h-3.5 text-navy" />
                </div>
                <div>
                  <span className="font-medium text-navy">{author.name}</span>
                  <span className="text-navy/30 mx-1">·</span>
                  <span className="text-navy/40 text-xs">
                    {author.affiliation}
                  </span>
                </div>
                {i < article.authors.length - 1 && (
                  <span className="text-navy/20 mx-1">,</span>
                )}
              </div>
            ))}
          </div>

          {/* Metadata row */}
          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-navy/40">
            <span className="flex items-center gap-1">
              <CalendarIcon className="w-3 h-3" />
              Published{" "}
              {new Date(article.publicationDate).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
            <span className="flex items-center gap-1">
              <BookOpenIcon className="w-3 h-3" />
              {article.citationCount} citations
            </span>
            <span className="flex items-center gap-1">
              <ExternalLinkIcon className="w-3 h-3" />
              {article.accessCount.toLocaleString()} views
            </span>
          </div>
        </div>

        {/* Content Grid */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Abstract */}
            <Card className="border-navy/5 shadow-sm">
              <CardContent className="p-6">
                <h2 className="text-sm font-semibold text-navy uppercase tracking-wider mb-3">
                  Abstract
                </h2>
                <p className="text-sm text-navy/60 leading-relaxed">
                  {article.abstract}
                </p>
              </CardContent>
            </Card>

            {/* Keywords */}
            <Card className="border-navy/5 shadow-sm">
              <CardContent className="p-6">
                <h2 className="text-sm font-semibold text-navy uppercase tracking-wider mb-3">
                  Keywords
                </h2>
                <div className="flex flex-wrap gap-2">
                  {article.keywords.map((kw) => (
                    <Badge
                      key={kw}
                      variant="secondary"
                      className="bg-lavender text-navy text-xs border-0"
                    >
                      {kw}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Full Text Link */}
            <Card className="border-navy/5 shadow-sm bg-gradient-to-r from-navy to-navy-600">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    Read Full Paper
                  </h3>
                  <p className="text-xs text-white/50 mt-1">
                    Access the complete peer-reviewed manuscript
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="bg-white text-navy hover:bg-lavender-light"
                >
                  <ExternalLinkIcon className="w-3.5 h-3.5 mr-1.5" />
                  Open PDF
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Impact Card */}
            <Card className="border-navy/5 shadow-sm">
              <CardContent className="p-5">
                <h3 className="text-xs font-semibold text-navy/40 uppercase tracking-wider mb-3">
                  Impact Metrics
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-navy/50">Citations</span>
                    <span className="text-sm font-bold text-navy">
                      {article.citationCount}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-navy/50">Views</span>
                    <span className="text-sm font-bold text-navy">
                      {article.accessCount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-navy/50">Impact Score</span>
                    <span className="text-sm font-bold text-orange-accent">
                      {article.impactScore}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-navy/50">Reviewers</span>
                    <span className="text-sm font-bold text-success">
                      {article.reviewers} verified
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* On-Chain Proof */}
            <Card className="border-navy/5 shadow-sm">
              <CardContent className="p-5">
                <h3 className="text-xs font-semibold text-navy/40 uppercase tracking-wider mb-3">
                  On-Chain Proof
                </h3>
                <div className="space-y-3">
                  <div>
                    <div className="text-xs text-navy/40 mb-1">DOCI NFT</div>
                    <div className="text-xs font-mono text-navy bg-lavender-light px-3 py-2 rounded-lg break-all">
                      {article.nftMint}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-navy/40 mb-1">Field</div>
                    <Badge
                      variant="secondary"
                      className="bg-lavender text-navy text-xs border-0"
                    >
                      {article.field}
                    </Badge>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full mt-4 text-xs"
                  size="sm"
                >
                  <LinkIcon className="w-3 h-3 mr-1.5" />
                  View on Solana Explorer
                </Button>
              </CardContent>
            </Card>

            {/* Cite */}
            <Card className="border-orange-accent/20 shadow-sm bg-orange-accent/5">
              <CardContent className="p-5">
                <h3 className="text-xs font-semibold text-orange-accent uppercase tracking-wider mb-2">
                  Cite This Paper
                </h3>
                <p className="text-xs text-navy/40 leading-relaxed">
                  {article.authors.map((a) => a.name).join(", ")}.
                  &quot;{article.title}.&quot; Fronsciers, {article.doci},{" "}
                  {new Date(article.publicationDate).getFullYear()}.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-3 text-xs border-orange-accent/20 text-orange-accent hover:bg-orange-accent/10"
                >
                  <QuoteIcon className="w-3 h-3 mr-1.5" />
                  Copy Citation
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
