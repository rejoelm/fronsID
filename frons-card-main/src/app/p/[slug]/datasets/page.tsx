"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/navbar";
import Footer from "@/components/landing/footer";
import {
  Loader2,
  ArrowLeft,
  Database,
  Download,
  Eye,
  Calendar,
  HardDrive,
  Shield,
  ExternalLink,
  Tag,
} from "lucide-react";

interface Dataset {
  id: string;
  title: string;
  description: string;
  format: string;
  size_mb: number;
  download_count: number;
  view_count: number;
  published_at: string;
  license: string;
  tags: string[];
  privacy_method: string;
  linked_paper_doci?: string;
  blob_id?: string;
}

const MOCK_DATASETS: Dataset[] = [
  {
    id: "ds-1",
    title: "Synthetic Clinical Trial Dataset - Cardiovascular Phase III",
    description:
      "Differentially private synthetic dataset generated from 12,000 cardiovascular clinical trial participants. Preserves statistical distributions for age, BMI, blood pressure, and treatment outcomes while providing epsilon=1.0 differential privacy guarantees.",
    format: "Parquet",
    size_mb: 245,
    download_count: 1847,
    view_count: 5623,
    published_at: "2026-02-10T09:00:00Z",
    license: "CC BY 4.0",
    tags: ["clinical trials", "cardiovascular", "synthetic data"],
    privacy_method: "Differential Privacy (epsilon=1.0)",
    linked_paper_doci: "10.fronsciers/2025.1088",
  },
  {
    id: "ds-2",
    title: "Protein Folding Benchmark - CASP15 Extended",
    description:
      "Extended benchmark dataset for protein folding prediction models. Contains 3D coordinate labels for 2,500 novel protein structures not present in public PDB entries, curated for self-attention model evaluation.",
    format: "HDF5",
    size_mb: 1200,
    download_count: 923,
    view_count: 3201,
    published_at: "2026-01-20T14:00:00Z",
    license: "CC BY-SA 4.0",
    tags: ["protein folding", "benchmark", "3D structures"],
    privacy_method: "N/A (public domain proteins)",
    linked_paper_doci: "10.fronsciers/2026.0042",
  },
  {
    id: "ds-3",
    title: "LLM Context Window Privacy Evaluation Corpus",
    description:
      "A curated evaluation corpus of 50,000 text snippets annotated with PII sensitivity levels for benchmarking k-anonymity preservation in LLM context windows. Includes adversarial prompts and extraction attempts.",
    format: "JSONL",
    size_mb: 89,
    download_count: 2456,
    view_count: 8912,
    published_at: "2025-05-01T08:00:00Z",
    license: "Apache 2.0",
    tags: ["LLM", "privacy", "k-anonymity", "evaluation"],
    privacy_method: "k-Anonymity (k=5)",
    linked_paper_doci: "10.fronsciers/2025.0412",
  },
  {
    id: "ds-4",
    title: "Drug-Target Interaction Graph - DrugBank Extended",
    description:
      "Multi-relational graph dataset for drug-target interaction prediction. Contains 15,000 drug nodes, 4,500 target protein nodes, and 120,000 labeled interaction edges with binding affinity scores.",
    format: "CSV + GraphML",
    size_mb: 340,
    download_count: 678,
    view_count: 2100,
    published_at: "2024-12-05T16:30:00Z",
    license: "CC BY 4.0",
    tags: ["drug discovery", "graph neural networks", "molecular"],
    privacy_method: "N/A",
  },
];

function formatSize(mb: number): string {
  if (mb >= 1000) return `${(mb / 1000).toFixed(1)} GB`;
  return `${mb} MB`;
}

export default function DatasetsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const unwrappedParams = use(params);
  const [loading, setLoading] = useState(true);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDatasets(MOCK_DATASETS);
      setDisplayName(
        unwrappedParams.slug
          .replace(/-/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase())
      );
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, [unwrappedParams.slug]);

  const totalDownloads = datasets.reduce(
    (sum, d) => sum + d.download_count,
    0
  );
  const totalSize = datasets.reduce((sum, d) => sum + d.size_mb, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F8FD] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#2C337A] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F8FD] text-gray-900 font-sans selection:bg-[#FFC6DE] selection:text-[#2C337A] flex flex-col pt-16">
      <Navbar />

      <main className="flex-grow w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back navigation */}
        <Link
          href={`/p/${unwrappedParams.slug}`}
          className="inline-flex items-center gap-2 text-[#2C337A] hover:text-[#FB7720] transition-colors mb-6 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to {displayName}&apos;s Profile
        </Link>

        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#2C337A] flex items-center gap-3">
                <Database className="w-7 h-7" />
                Published Datasets
              </h1>
              <p className="text-gray-500 mt-1">
                Synthetic and curated datasets by {displayName}
              </p>
            </div>

            <div className="flex gap-3">
              <div className="bg-[#E5E0FE] rounded-lg px-4 py-2 text-center">
                <p className="text-2xl font-bold text-[#2C337A]">
                  {datasets.length}
                </p>
                <p className="text-xs text-[#2C337A]/70">Datasets</p>
              </div>
              <div className="bg-[#FFC6DE] rounded-lg px-4 py-2 text-center">
                <p className="text-2xl font-bold text-[#2C337A]">
                  {totalDownloads.toLocaleString()}
                </p>
                <p className="text-xs text-[#2C337A]/70">Downloads</p>
              </div>
              <div className="bg-[#F8F8FD] border border-gray-200 rounded-lg px-4 py-2 text-center">
                <p className="text-2xl font-bold text-[#2C337A]">
                  {formatSize(totalSize)}
                </p>
                <p className="text-xs text-gray-500">Total Size</p>
              </div>
            </div>
          </div>
        </div>

        {/* Datasets grid */}
        <div className="space-y-4">
          {datasets.map((dataset) => (
            <div
              key={dataset.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-[#E5E0FE] transition-all"
            >
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1 min-w-0">
                  {/* Title */}
                  <h3 className="text-lg font-semibold text-gray-900 leading-snug">
                    {dataset.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                    {dataset.description}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {dataset.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-[#E5E0FE]/50 text-[#2C337A]"
                      >
                        <Tag className="w-2.5 h-2.5" />
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Meta info */}
                  <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(dataset.published_at).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        }
                      )}
                    </span>
                    <span className="flex items-center gap-1">
                      <HardDrive className="w-3.5 h-3.5" />
                      {formatSize(dataset.size_mb)} ({dataset.format})
                    </span>
                    <span className="flex items-center gap-1">
                      <Download className="w-3.5 h-3.5" />
                      {dataset.download_count.toLocaleString()} downloads
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" />
                      {dataset.view_count.toLocaleString()} views
                    </span>
                  </div>

                  {/* Privacy & license row */}
                  <div className="flex flex-wrap items-center gap-3 mt-3">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                      <Shield className="w-3 h-3" />
                      {dataset.privacy_method}
                    </span>
                    <span className="text-xs text-gray-400">
                      License: {dataset.license}
                    </span>
                    {dataset.linked_paper_doci && (
                      <span className="inline-flex items-center gap-1 text-xs text-[#FB7720]">
                        <ExternalLink className="w-3 h-3" />
                        Linked: {dataset.linked_paper_doci}
                      </span>
                    )}
                  </div>
                </div>

                {/* Action button */}
                <div className="flex lg:flex-col items-center lg:items-end justify-end gap-2 shrink-0">
                  <button className="px-4 py-2 rounded-lg bg-[#2C337A] text-white text-sm font-medium hover:bg-[#2C337A]/90 transition-colors flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                  <button className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    Preview
                  </button>
                </div>
              </div>
            </div>
          ))}

          {datasets.length === 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <Database className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-lg">No datasets published yet</p>
              <p className="text-gray-400 text-sm mt-1">
                Check back later for new datasets
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
