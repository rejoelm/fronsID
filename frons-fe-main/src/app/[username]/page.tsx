"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Header } from "@/components/header";
import { ChevronDown, ChevronUp, ArrowLeft, ExternalLink } from "lucide-react";
import { usePublicProfile } from "@/hooks/usePublicProfile";
import { useCollapsibleSections } from "@/hooks/useCollapsibleSections";
import {
  getInitials,
  formatDate,
  formatAuthors,
  formatOrcidUrl,
  formatDoiUrl,
} from "@/utils/profileUtils";
import { Skeleton } from "@/components/ui/skeleton";
import { ShareToContactButton } from "@/components/profile/ShareToContactButton";

export default function PublicProfilePage() {
  const params = useParams();
  const username = params.username as string;

  const { profile, loading, error } = usePublicProfile(username);
  const { openSections, toggleSection } = useCollapsibleSections();

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container max-w-4xl mx-auto px-4 sm:px-6 py-16">
          <Skeleton className="w-full h-48 sm:h-64 md:h-80 mb-8 rounded-2xl" />

          <Card className="mb-8 shadow-lg border border-gray-100/80 rounded-2xl bg-white/95 backdrop-blur-sm">
            <CardContent className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row items-start gap-6">
                <Skeleton className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-full mx-auto sm:mx-0" />
                <div className="flex-1 min-w-0 text-center sm:text-left space-y-4">
                  <div className="space-y-2">
                    <Skeleton className="h-8 w-64 mx-auto sm:mx-0" />
                    <Skeleton className="h-6 w-32 mx-auto sm:mx-0" />
                    <Skeleton className="h-6 w-48 mx-auto sm:mx-0" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-40 mx-auto sm:mx-0" />
                    <Skeleton className="h-4 w-36 mx-auto sm:mx-0" />
                    <Skeleton className="h-4 w-44 mx-auto sm:mx-0" />
                  </div>
                  <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-6 w-24" />
                  </div>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t space-y-3">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            {[...Array(4)].map((_, i) => (
              <Card
                key={i}
                className="shadow-lg border border-gray-100/80 rounded-2xl bg-white/95 backdrop-blur-sm"
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-5 w-5" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="container max-w-4xl mx-auto px-4 sm:px-6 py-16">
          <div className="flex items-center justify-center min-h-[60vh]">
            <Card className="max-w-md mx-auto ">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-gray-300" />
                </div>
                <h2 className="text-xl font-semibold mb-3 text-gray-900">
                  {error === "User not found"
                    ? "User Not Found"
                    : "Profile Unavailable"}
                </h2>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  {error === "User not found"
                    ? `No user found with username "@${username}"`
                    : "This profile is temporarily unavailable"}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="container max-w-4xl mx-auto px-4 sm:px-6 py-16">
        {profile.headerImage && (
          <div className="relative w-full h-48 sm:h-64 md:h-80 mb-8 rounded-2xl overflow-hidden shadow-lg">
            <Image
              src={profile.headerImage || "/placeholder.svg"}
              alt={`${profile.fullName || profile.username}'s header`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          </div>
        )}

        <Card className="mb-8 shadow-lg border border-gray-100/80 rounded-2xl bg-white/95 backdrop-blur-sm">
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start gap-6">
              <Avatar className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 mx-auto sm:mx-0">
                <AvatarImage
                  src={profile.profilePhoto || "/placeholder.svg"}
                  alt={profile.fullName}
                />
                <AvatarFallback className="text-lg sm:text-xl font-semibold">
                  {getInitials(profile.fullName || profile.username)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0 text-center sm:text-left">
                <div className="mb-4">
                  <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-2">
                    {profile.fullName || `@${profile.username}`}
                  </h1>
                  <p className="text-base sm:text-lg text-muted-foreground mb-2">
                    @{profile.username}
                  </p>
                  {profile.title && (
                    <p className="text-base sm:text-lg text-primary font-medium mb-2">
                      {profile.title}
                    </p>
                  )}
                </div>

                <div className="space-y-2 text-sm text-muted-foreground mb-4">
                  {profile.institution && <div>{profile.institution}</div>}
                  {profile.location && <div>{profile.location}</div>}
                  {profile.field && <div>{profile.field}</div>}
                </div>

                <div className="flex flex-wrap justify-center sm:justify-start gap-2 mb-4">
                  {profile.profession && (
                    <Badge variant="default">{profile.profession}</Badge>
                  )}
                  {profile.specialization && (
                    <Badge variant="outline">{profile.specialization}</Badge>
                  )}
                </div>

                <div className="flex flex-wrap justify-center sm:justify-start gap-4">
                  {profile.publicContact.website && (
                    <a
                      href={profile.publicContact.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1 text-sm"
                    >
                      Website
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {profile.publicContact.linkedIn && (
                    <a
                      href={profile.publicContact.linkedIn}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1 text-sm"
                    >
                      LinkedIn
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {profile.publicContact.github && (
                    <a
                      href={profile.publicContact.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1 text-sm"
                    >
                      GitHub
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {profile.publicContact.orcid && (
                    <a
                      href={formatOrcidUrl(profile.publicContact.orcid)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1 text-sm"
                    >
                      ORCID
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {profile.publicContact.googleScholar && (
                    <a
                      href={profile.publicContact.googleScholar}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1 text-sm"
                    >
                      Scholar
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                {/* Share to Contact Button */}
                <div className="mt-4 flex justify-center sm:justify-start">
                  <ShareToContactButton
                    profile={profile}
                    className="w-full sm:w-auto"
                  />
                </div>
              </div>
            </div>

            {/* Overview */}
            {profile.overview && (
              <div className="mt-6 pt-6 border-t">
                <h3 className="text-lg font-semibold mb-3">About</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {profile.overview}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* Education */}
          {profile.education && profile.education.length > 0 && (
            <Collapsible
              open={openSections.education}
              onOpenChange={() => toggleSection("education")}
              className="w-full"
            >
              <Card className="shadow-lg border border-gray-100/80 rounded-2xl bg-white/95 backdrop-blur-sm overflow-hidden">
                <CollapsibleTrigger asChild>
                  <button className="w-full">
                    <CardHeader className="cursor-pointer hover:bg-gray-50/50 transition-all duration-200 rounded-t-2xl">
                      <CardTitle className="flex items-center justify-between">
                        <span className="text-lg font-semibold">
                          Education ({profile.education.length})
                        </span>
                        <div className="transition-transform duration-200">
                          {openSections.education ? (
                            <ChevronUp className="w-5 h-5 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                      </CardTitle>
                    </CardHeader>
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up overflow-hidden">
                  <CardContent className="pt-0 pb-6">
                    <div className="space-y-4">
                      {profile.education.map((edu, index) => (
                        <div
                          key={edu.id || index}
                          className="border-l-2 border-primary/20 pl-4 py-2"
                        >
                          <h4 className="font-semibold">{edu.degree}</h4>
                          <p className="text-primary">{edu.institution}</p>
                          {edu.field && (
                            <p className="text-sm text-muted-foreground">
                              {edu.field}
                            </p>
                          )}
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-1 text-xs text-muted-foreground">
                            <span>
                              {formatDate(edu.start_date)} -{" "}
                              {edu.end_date
                                ? formatDate(edu.end_date)
                                : "Present"}
                            </span>
                            {edu.location && <span>{edu.location}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          )}

          {/* Experience */}
          {profile.experience && profile.experience.length > 0 && (
            <Collapsible
              open={openSections.experience}
              onOpenChange={() => toggleSection("experience")}
              className="w-full"
            >
              <Card className="shadow-lg border border-gray-100/80 rounded-2xl bg-white/95 backdrop-blur-sm overflow-hidden">
                <CollapsibleTrigger asChild>
                  <button className="w-full">
                    <CardHeader className="cursor-pointer hover:bg-gray-50/50 transition-all duration-200 rounded-t-2xl">
                      <CardTitle className="flex items-center justify-between">
                        <span className="text-lg font-semibold">
                          Experience ({profile.experience.length})
                        </span>
                        <div className="transition-transform duration-200">
                          {openSections.experience ? (
                            <ChevronUp className="w-5 h-5 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                      </CardTitle>
                    </CardHeader>
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up overflow-hidden">
                  <CardContent className="pt-0 pb-6">
                    <div className="space-y-4">
                      {profile.experience.map((exp, index) => (
                        <div
                          key={exp.id || index}
                          className="border-l-2 border-primary/20 pl-4 py-2"
                        >
                          <h4 className="font-semibold">{exp.position}</h4>
                          <p className="text-primary">{exp.company}</p>
                          {exp.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {exp.description}
                            </p>
                          )}
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-1 text-xs text-muted-foreground">
                            <span>
                              {formatDate(exp.start_date)} -{" "}
                              {exp.end_date
                                ? formatDate(exp.end_date)
                                : "Present"}
                            </span>
                            {exp.location && <span>{exp.location}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          )}

          {/* Publications */}
          {profile.publications && profile.publications.length > 0 && (
            <Collapsible
              open={openSections.publications}
              onOpenChange={() => toggleSection("publications")}
              className="w-full"
            >
              <Card className="shadow-lg border border-gray-100/80 rounded-2xl bg-white/95 backdrop-blur-sm overflow-hidden">
                <CollapsibleTrigger asChild>
                  <button className="w-full">
                    <CardHeader className="cursor-pointer hover:bg-gray-50/50 transition-all duration-200 rounded-t-2xl">
                      <CardTitle className="flex items-center justify-between">
                        <span className="text-lg font-semibold">
                          Publications ({profile.publications.length})
                        </span>
                        <div className="transition-transform duration-200">
                          {openSections.publications ? (
                            <ChevronUp className="w-5 h-5 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                      </CardTitle>
                    </CardHeader>
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up overflow-hidden">
                  <CardContent className="pt-0 pb-6">
                    <div className="space-y-6">
                      {profile.publications.map((pub, index) => (
                        <div
                          key={pub.id || index}
                          className="pb-4 border-b border-gray-100 last:border-b-0"
                        >
                          <h4 className="font-semibold text-gray-900 mb-2 leading-relaxed">
                            {pub.title}
                          </h4>
                          <p className="text-sm text-muted-foreground mb-2">
                            {formatAuthors(pub.authors)}
                          </p>
                          {pub.venue && (
                            <p className="text-sm text-primary mb-2">
                              {pub.venue}
                            </p>
                          )}
                          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                            {pub.date && <span>{formatDate(pub.date)}</span>}
                            {pub.doi && (
                              <a
                                href={formatDoiUrl(pub.doi)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline flex items-center gap-1"
                              >
                                DOI: {pub.doi}
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                            {pub.url && (
                              <a
                                href={pub.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline flex items-center gap-1"
                              >
                                View Paper
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          )}

          {/* Awards */}
          {profile.awards && profile.awards.length > 0 && (
            <Collapsible
              open={openSections.awards}
              onOpenChange={() => toggleSection("awards")}
              className="w-full"
            >
              <Card className="shadow-lg border border-gray-100/80 rounded-2xl bg-white/95 backdrop-blur-sm overflow-hidden">
                <CollapsibleTrigger asChild>
                  <button className="w-full">
                    <CardHeader className="cursor-pointer hover:bg-gray-50/50 transition-all duration-200 rounded-t-2xl">
                      <CardTitle className="flex items-center justify-between">
                        <span className="text-lg font-semibold">
                          Awards & Recognition ({profile.awards.length})
                        </span>
                        <div className="transition-transform duration-200">
                          {openSections.awards ? (
                            <ChevronUp className="w-5 h-5 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                      </CardTitle>
                    </CardHeader>
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up overflow-hidden">
                  <CardContent className="pt-0 pb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {profile.awards.map((award, index) => (
                        <div
                          key={award.id || index}
                          className="p-4 bg-gray-50/50 rounded-lg"
                        >
                          <h4 className="font-semibold">{award.name}</h4>
                          <p className="text-primary text-sm">{award.issuer}</p>
                          {award.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {award.description}
                            </p>
                          )}
                          {award.date && (
                            <p className="text-xs text-muted-foreground mt-2">
                              {formatDate(award.date)}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          )}
        </div>
      </div>
    </div>
  );
}
