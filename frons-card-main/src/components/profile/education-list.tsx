import { GraduationCap } from "lucide-react";

export interface Education {
  id: string;
  degree: string;
  institution: string;
  year: string;
  details: string;
}

interface EducationListProps {
  education: Education[];
}

export default function EducationList({ education }: EducationListProps) {
  if (!education || education.length === 0) return null;

  return (
    <div className="space-y-6 mt-8 pt-8 border-t border-gray-100">
      <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
        <GraduationCap className="w-5 h-5 text-[#2C337A]" />
        Education
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {education.map((edu) => (
          <div key={edu.id} className="p-5 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:border-[#E5E0FE] hover:shadow-sm transition-all group">
            <h4 className="text-lg font-bold text-gray-900 leading-tight mb-1">{edu.degree}</h4>
            <div className="text-sm font-semibold text-[#2C337A] mb-2">{edu.institution}</div>
            <div className="text-xs font-mono text-gray-500 mb-2">{edu.year}</div>
            <p className="text-sm text-gray-600 line-clamp-3 group-hover:line-clamp-none transition-all">
              {edu.details}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
