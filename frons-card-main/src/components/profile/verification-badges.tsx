import { ShieldCheck, Award, Zap, Database } from "lucide-react";

interface VerificationBadgesProps {
  stats: {
    hIndex: number;
    reviewsCompleted: number;
    datasetsPublished: number;
    verifiedScholar?: boolean;
    researcherId?: string;
  };
}

export default function VerificationBadges({ stats }: VerificationBadgesProps) {
  return (
    <div className="space-y-4">
      {stats.verifiedScholar && (
        <div className="flex flex-col gap-3 p-4 bg-gradient-to-r from-[#E5E0FE]/40 to-white border border-[#E5E0FE] rounded-xl shadow-sm">
          <div className="flex items-center gap-4">
            <ShieldCheck className="w-10 h-10 text-[#2C337A] shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-[#2C337A] leading-tight">Verified Scholar</h4>
              <p className="text-xs text-gray-500 mt-0.5">Cryptographic On-chain Identity</p>
            </div>
          </div>
          {stats.researcherId && (
            <div className="pt-3 border-t border-[#E5E0FE]/50">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 px-1">Researcher ID</div>
              <div className="bg-white border border-[#E5E0FE] rounded-lg px-3 py-2 flex items-center justify-between group cursor-copy">
                <span className="font-mono text-xs font-semibold text-[#2C337A]">FRONS/R-{stats.researcherId}</span>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-1 px-1">Impact Metrics</h3>
        
        <div className="flex items-center justify-between p-3.5 bg-white border border-gray-100 rounded-xl shadow-sm hover:border-[#E5E0FE] transition-colors">
          <div className="flex items-center gap-3">
            <Award className="w-5 h-5 text-[#FB7720]" />
            <span className="text-sm text-gray-700 font-medium">h-index</span>
          </div>
          <span className="text-lg font-bold text-gray-900">{stats.hIndex}</span>
        </div>

        <div className="flex items-center justify-between p-3.5 bg-white border border-gray-100 rounded-xl shadow-sm hover:border-[#E5E0FE] transition-colors">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-yellow-500" />
            <span className="text-sm text-gray-700 font-medium">Reviews Completed</span>
          </div>
          <span className="text-lg font-bold text-gray-900">{stats.reviewsCompleted}</span>
        </div>

        <div className="flex items-center justify-between p-3.5 bg-white border border-gray-100 rounded-xl shadow-sm hover:border-[#E5E0FE] transition-colors">
          <div className="flex items-center gap-3">
            <Database className="w-5 h-5 text-emerald-500" />
            <span className="text-sm text-gray-700 font-medium">Datasets Published</span>
          </div>
          <span className="text-lg font-bold text-gray-900">{stats.datasetsPublished}</span>
        </div>
      </div>
    </div>
  );
}
