import { BadgeCheck, MapPin, Building, GraduationCap, Link as LinkIcon, Mail, Camera, Upload, CheckCircle2 } from "lucide-react";
import { useRef, useState } from "react";

interface ProfileHeroProps {
  displayName: string;
  title: string;
  institution: string;
  location: string;
  avatarUrl?: string;
  specializations: string[];
  isOwner?: boolean;
  onAvatarUpload?: (file: File) => void;
  onResumeUpload?: (file: File) => void;
}

export default function ProfileHero({
  displayName,
  title,
  institution,
  location,
  avatarUrl,
  specializations,
  isOwner = false,
  onAvatarUpload,
  onResumeUpload,
}: ProfileHeroProps) {
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);
  
  const [localAvatar, setLocalAvatar] = useState<string | null>(null);
  const [resumeUploaded, setResumeUploaded] = useState(false);

  const displayAvatar = localAvatar || avatarUrl;

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const previewUrl = URL.createObjectURL(file);
      setLocalAvatar(previewUrl);
      onAvatarUpload?.(file);
    }
  };

  const handleResumeSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setResumeUploaded(true);
      onResumeUpload?.(file);
      // Reset after 3 seconds for demo
      setTimeout(() => setResumeUploaded(false), 3000);
    }
  };

  return (
    <div className="relative pb-6">
      {/* Avatar positioned completely on the left, overlapping the banner (which is handled in the parent) */}
      <div className="flex flex-col md:flex-row gap-6 items-start">
        <div className="shrink-0 relative">
          <div 
            className={`w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-white shadow-md bg-[#2C337A] flex items-center justify-center text-white text-4xl md:text-5xl font-bold relative ${isOwner ? 'cursor-pointer group' : ''}`}
            onClick={() => isOwner && avatarInputRef.current?.click()}
          >
            {displayAvatar ? (
              <img src={displayAvatar} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              displayName.substring(0, 2).toUpperCase()
            )}
            
            {/* Owner Hover Overlay */}
            {isOwner && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-8 h-8 text-white" />
              </div>
            )}
          </div>
          
          {/* Hidden File Input for Avatar */}
          <input 
            type="file" 
            ref={avatarInputRef} 
            onChange={handleAvatarSelect} 
            accept="image/png, image/jpeg, image/webp" 
            className="hidden" 
          />
          
          <div className="absolute bottom-2 right-2 md:bottom-3 md:right-3 bg-white rounded-full p-1 shadow">
            <BadgeCheck className="text-[#FB7720] w-6 h-6 md:w-8 md:h-8" />
          </div>
        </div>

        <div className="flex-1 w-full pt-2 md:pt-16 space-y-4">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                {displayName}
              </h1>
              <p className="text-lg text-gray-700 font-medium mt-1">{title}</p>
              
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-3 text-sm text-gray-500">
                {institution && (
                  <div className="flex items-center gap-1.5">
                    <Building className="w-4 h-4 shrink-0" />
                    <span>{institution}</span>
                  </div>
                )}
                {location && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 shrink-0" />
                    <span>{location}</span>
                  </div>
                )}
              </div>
            </div>

            {/* LinkedIn-style Action Buttons */}
            <div className="flex items-center gap-3 shrink-0 flex-wrap">
              {!isOwner ? (
                <button className="bg-[#2C337A] hover:bg-[#1E245A] text-white px-5 py-2 rounded-full font-medium transition-colors flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Contact
                </button>
              ) : (
                <>
                  <button 
                    onClick={() => resumeInputRef.current?.click()}
                    className={`px-5 py-2 rounded-full font-medium transition-colors flex items-center gap-2 border ${
                      resumeUploaded 
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                        : 'bg-[#2C337A] hover:bg-[#1E245A] text-white border-transparent'
                    }`}
                  >
                    {resumeUploaded ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Uploaded
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Update Resume
                      </>
                    )}
                  </button>
                  <input 
                    type="file" 
                    ref={resumeInputRef} 
                    onChange={handleResumeSelect} 
                    accept=".pdf,.doc,.docx" 
                    className="hidden" 
                  />
                </>
              )}
              
              <button className="bg-white border border-[#2C337A] text-[#2C337A] hover:bg-[#E5E0FE]/30 px-5 py-2 rounded-full font-medium transition-colors">
                View Resume
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100">
            <span className="text-sm font-semibold text-gray-700 mr-2 flex items-center gap-2">
              <GraduationCap className="w-4 h-4" /> Expertise:
            </span>
            {specializations.map((spec) => (
              <span
                key={spec}
                className="px-3 py-1 bg-[#F8F8FD] border border-gray-200 text-gray-700 text-xs rounded-full font-medium"
              >
                {spec}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
