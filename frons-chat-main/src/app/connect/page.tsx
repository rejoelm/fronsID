"use client";

import { Code, Terminal, Zap, BookOpen, Shield, Copy, CheckCircle } from "lucide-react";
import { useState } from "react";

export default function ConnectPage() {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  function copyToClipboard(text: string, section: string) {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  }

  const CopyButton = ({ text, section }: { text: string; section: string }) => (
    <button
      onClick={() => copyToClipboard(text, section)}
      className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition"
    >
      {copiedSection === section ? (
        <CheckCircle className="w-4 h-4 text-green-400" />
      ) : (
        <Copy className="w-4 h-4 text-gray-400" />
      )}
    </button>
  );

  return (
    <div className="min-h-screen bg-[#F8F8FD]">
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-[#E5E0FE] text-[#2C337A] px-4 py-2 rounded-full text-sm font-semibold mb-4">
            <Zap className="w-4 h-4" />
            MCP Protocol
          </div>
          <h1 className="text-4xl font-bold text-[#2C337A] tracking-tight mb-3">
            Connect AI to Fronsciers
          </h1>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Use the Model Context Protocol (MCP) to give any AI assistant access to
            the Fronsciers research library. Every citation triggers a $0.01 payment
            to the paper&apos;s author.
          </p>
        </div>

        {/* Tools Overview */}
        <div className="grid md:grid-cols-2 gap-4 mb-12">
          {[
            { name: "search_articles", cost: "Free", desc: "Search the library by keyword, field, or DOCI" },
            { name: "get_article_abstract", cost: "Free", desc: "Get abstract for a specific article" },
            { name: "cite_and_access", cost: "$0.01", desc: "Full text access — triggers citation payment" },
            { name: "get_researcher_profile", cost: "Free", desc: "Look up researcher by name or wallet" },
            { name: "get_trending_research", cost: "Free", desc: "Trending papers by field and period" },
            { name: "get_citation_stats", cost: "Free", desc: "Citation statistics for an article" },
          ].map((tool) => (
            <div key={tool.name} className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-2">
                <code className="text-sm font-semibold text-[#2C337A]">{tool.name}</code>
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                  tool.cost === "Free"
                    ? "bg-green-50 text-green-700"
                    : "bg-[#FB7720]/10 text-[#FB7720]"
                }`}>
                  {tool.cost}
                </span>
              </div>
              <p className="text-sm text-gray-500">{tool.desc}</p>
            </div>
          ))}
        </div>

        {/* Claude Desktop Config */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-[#2C337A] mb-4 flex items-center gap-2">
            <Terminal className="w-5 h-5" />
            Claude Desktop Configuration
          </h2>
          <div className="bg-[#1e2456] rounded-xl p-6 text-sm font-mono text-green-300 relative overflow-x-auto">
            <CopyButton text={`{
  "mcpServers": {
    "fronsciers": {
      "command": "npx",
      "args": ["-y", "@fronsciers/mcp-server"],
      "env": {
        "FRONS_API_KEY": "your-api-key"
      }
    }
  }
}`} section="claude-config" />
            <pre>{`{
  "mcpServers": {
    "fronsciers": {
      "command": "npx",
      "args": ["-y", "@fronsciers/mcp-server"],
      "env": {
        "FRONS_API_KEY": "your-api-key"
      }
    }
  }
}`}</pre>
          </div>
        </div>

        {/* Python Usage */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-[#2C337A] mb-4 flex items-center gap-2">
            <Code className="w-5 h-5" />
            Python / REST API
          </h2>
          <div className="bg-[#1e2456] rounded-xl p-6 text-sm font-mono text-green-300 relative overflow-x-auto">
            <CopyButton text={`import httpx

API_URL = "https://mcp.fronsciers.id"
API_KEY = "your-api-key"

# Search articles (free)
results = httpx.get(f"{API_URL}/api/search",
    params={"q": "malaria treatment", "limit": 5},
    headers={"Authorization": f"Bearer {API_KEY}"}
).json()

# Cite and access full text ($0.01 per citation)
article = httpx.post(f"{API_URL}/api/cite",
    json={"doci": "10.fronsciers/2026.0042", "context": "research"},
    headers={"Authorization": f"Bearer {API_KEY}",
             "X-402-Payment": "usdc-token"}
).json()`} section="python" />
            <pre>{`import httpx

API_URL = "https://mcp.fronsciers.id"
API_KEY = "your-api-key"

# Search articles (free)
results = httpx.get(f"{API_URL}/api/search",
    params={"q": "malaria treatment", "limit": 5},
    headers={"Authorization": f"Bearer {API_KEY}"}
).json()

# Cite and access full text ($0.01 per citation)
article = httpx.post(f"{API_URL}/api/cite",
    json={"doci": "10.fronsciers/2026.0042", "context": "research"},
    headers={"Authorization": f"Bearer {API_KEY}",
             "X-402-Payment": "usdc-token"}
).json()`}</pre>
          </div>
        </div>

        {/* Revenue Model */}
        <div className="bg-white rounded-xl border border-gray-100 p-8">
          <h2 className="text-xl font-bold text-[#2C337A] mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Revenue Model
          </h2>
          <div className="grid md:grid-cols-4 gap-4 text-center">
            <div className="p-4 bg-[#E5E0FE] rounded-xl">
              <p className="text-2xl font-bold text-[#2C337A]">40%</p>
              <p className="text-xs text-gray-600 mt-1">Platform</p>
            </div>
            <div className="p-4 bg-green-50 rounded-xl">
              <p className="text-2xl font-bold text-green-700">20%</p>
              <p className="text-xs text-gray-600 mt-1">Author (direct)</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-xl">
              <p className="text-2xl font-bold text-purple-700">20%</p>
              <p className="text-xs text-gray-600 mt-1">Sharing Pool</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-xl">
              <p className="text-2xl font-bold text-blue-700">20%</p>
              <p className="text-xs text-gray-600 mt-1">Reserve</p>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-4 text-center">
            Each $0.01 citation fee is split automatically on Solana. Authors earn passive income from AI usage.
          </p>
        </div>
      </div>
    </div>
  );
}
