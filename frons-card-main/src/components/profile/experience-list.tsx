import { Building } from "lucide-react";

export interface Experience {
  id: string;
  role: string;
  institution: string;
  location: string;
  startDate: string;
  endDate: string | "Present";
  description: string;
}

interface ExperienceListProps {
  experiences: Experience[];
}

export default function ExperienceList({ experiences }: ExperienceListProps) {
  if (!experiences || experiences.length === 0) return null;

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
        <Building className="w-5 h-5 text-[#2C337A]" />
        Experience
      </h3>
      <div className="space-y-4 pt-2">
        {experiences.map((exp) => (
          <div key={exp.id} className="p-5 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:border-[#E5E0FE] hover:shadow-sm transition-all group">
            <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-2">
              <div>
                <h4 className="text-lg font-bold text-gray-900 leading-tight">{exp.role}</h4>
                <div className="text-sm font-semibold text-[#2C337A] mt-0.5">{exp.institution}</div>
              </div>
              <div className="mt-1 md:mt-0 text-left md:text-right">
                <span className="inline-block text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {exp.startDate} - {exp.endDate}
                </span>
                <div className="text-xs text-gray-500 mt-1">{exp.location}</div>
              </div>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed mt-2">
              {exp.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
