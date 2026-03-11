import { ExternalLink, BookOpen, Quote } from "lucide-react";

export interface Publication {
  id: string;
  doci: string;
  title: string;
  status: string;
  citation_count: number;
  publication_date?: string;
}

interface PublicationListProps {
  papers: Publication[];
}

export default function PublicationList({ papers }: PublicationListProps) {
  if (!papers || papers.length === 0) {
    return (
      <div className="text-center p-8 bg-gray-50 rounded-2xl border border-gray-100">
        <BookOpen className="w-8 h-8 mx-auto text-gray-400 mb-3" />
        <p className="text-gray-500">No publications found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-[#2C337A] mb-4 flex items-center gap-2">
        <BookOpen className="w-5 h-5 text-[#FB7720]" />
        Published Research
      </h3>
      <div className="space-y-4">
        {papers.map((paper) => (
          <div
            key={paper.id}
            className="p-5 rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow group relative"
          >
            <div className="pr-12">
              <h4 className="text-lg font-semibold text-gray-900 group-hover:text-[#2C337A] transition-colors leading-tight mb-2">
                {paper.title}
              </h4>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500">
                <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                  {paper.doci}
                </span>
                
                {paper.publication_date && (
                  <span>
                    {new Date(paper.publication_date).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                    })}
                  </span>
                )}
                
                <div className="flex items-center gap-1 text-[#FB7720] font-medium">
                  <Quote className="w-3.5 h-3.5" />
                  <span>{paper.citation_count} Citations</span>
                </div>
              </div>
            </div>
            
            <a
              href={`https://fronsciers.id/article/${paper.doci}`}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute top-5 right-5 p-2 rounded-full bg-gray-50 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#E5E0FE] hover:text-[#2C337A]"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
