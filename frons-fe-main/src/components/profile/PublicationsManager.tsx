import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  PlusIcon,
  EditIcon,
  TrashIcon,
  FileTextIcon,
  ExternalLinkIcon,
  RefreshCwIcon,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import axios from "axios";
import { usePrivy } from "@privy-io/react-auth";
import { useSolanaWallets } from "@privy-io/react-auth/solana";

export interface Publication {
  id?: string;
  title: string;
  journal: string;
  year: string;
  type: string;
  citations?: number;
  authors?: string | string[];
  doi?: string;
  url?: string;
  venue?: string;
  date?: string;
  user_id?: string;
  created_at?: string;
}

interface CVPublication {
  id: string;
  user_id: string;
  created_at: string;
  authors: string[];
  venue: string;
  date: string;
  doi?: string;
  url?: string;
  title: string;
}

interface PublicationsManagerProps {
  publications: Publication[];
  onPublicationsChange: (publications: Publication[]) => void;
  isEditing: boolean;
  walletAddress?: string;
}

const publicationTypes = [
  "Journal Article",
  "Conference Paper",
  "Book Chapter",
  "Book",
  "Thesis",
  "Report",
  "Preprint",
  "Other",
];

export function PublicationsManager({
  publications,
  onPublicationsChange,
  isEditing,
  walletAddress,
}: PublicationsManagerProps) {
  const { getAccessToken } = usePrivy();
  const [cvPublications, setCvPublications] = useState<CVPublication[]>([]);
  const [loadingCVPublications, setLoadingCVPublications] = useState(false);
  const [cvError, setCvError] = useState<string | null>(null);
  const [editingPublication, setEditingPublication] =
    useState<Publication | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Publication>({
    title: "",
    journal: "",
    year: "",
    type: "",
    citations: 0,
    authors: "",
    doi: "",
    url: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const fetchCVPublications = useCallback(async () => {
    if (!walletAddress) return;

    try {
      setLoadingCVPublications(true);
      setCvError(null);

      const accessToken = await getAccessToken();
      const apiUrl =
        process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5001/api";

      const response = await axios.get(
        `${apiUrl}/cv/publications/${walletAddress}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.data.success && response.data.publications.length > 0) {
        setCvPublications(response.data.publications || []);

        const convertedPublications: Publication[] =
          response.data.publications.map((cvPub: CVPublication) => ({
            id: cvPub.id,
            title: cvPub.title,
            journal: cvPub.venue,
            year: new Date(cvPub.date).getFullYear().toString(),
            type: "Journal Article",
            authors: Array.isArray(cvPub.authors)
              ? cvPub.authors.join(", ")
              : cvPub.authors,
            doi: cvPub.doi,
            url: cvPub.url,
            venue: cvPub.venue,
            date: cvPub.date,
            user_id: cvPub.user_id,
            created_at: cvPub.created_at,
          }));

        const existingTitles = publications.map((p) => p.title.toLowerCase());
        const newCVPublications = convertedPublications.filter(
          (cvPub) => !existingTitles.includes(cvPub.title.toLowerCase())
        );

        if (newCVPublications.length > 0) {
          onPublicationsChange([...publications, ...newCVPublications]);
        }
      } else {
        console.log(
          "No publications found in CV data for wallet:",
          walletAddress
        );
        // Don't set an error, as this is normal behavior when no CV publications exist
      }
    } catch (error) {
      console.error("Failed to fetch CV publications:", error);
      setCvError("Failed to load publications from CV");
    } finally {
      setLoadingCVPublications(false);
    }
  }, [walletAddress, getAccessToken, publications, onPublicationsChange]);

  useEffect(() => {
    if (walletAddress) {
      fetchCVPublications();
    }
  }, [walletAddress, fetchCVPublications]);

  const resetForm = () => {
    setFormData({
      title: "",
      journal: "",
      year: "",
      type: "",
      citations: 0,
      authors: "",
      doi: "",
      url: "",
    });
    setFormErrors({});
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.title.trim()) {
      errors.title = "Title is required";
    }

    if (!formData.journal.trim()) {
      errors.journal = "Journal/Venue is required";
    }

    if (!formData.year.trim()) {
      errors.year = "Year is required";
    } else {
      const yearNum = parseInt(formData.year);
      const currentYear = new Date().getFullYear();
      if (isNaN(yearNum) || yearNum < 1900 || yearNum > currentYear + 2) {
        errors.year = `Year must be between 1900 and ${currentYear + 2}`;
      }
    }

    if (!formData.type) {
      errors.type = "Publication type is required";
    }

    if (formData.citations && formData.citations < 0) {
      errors.citations = "Citations must be a positive number";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddPublication = () => {
    if (!validateForm()) return;

    const newPublication: Publication = {
      id: Date.now().toString(), // Temporary ID for frontend
      ...formData,
    };

    onPublicationsChange([...publications, newPublication]);
    resetForm();
    setIsAddDialogOpen(false);
  };

  const handleEditPublication = () => {
    if (!validateForm() || !editingPublication) return;

    const updatedPublications = publications.map((pub) =>
      pub.id === editingPublication.id
        ? { ...editingPublication, ...formData }
        : pub
    );

    onPublicationsChange(updatedPublications);
    resetForm();
    setEditingPublication(null);
    setIsEditDialogOpen(false);
  };

  const handleDeletePublication = (publicationId: string) => {
    const updatedPublications = publications.filter(
      (pub) => pub.id !== publicationId
    );
    onPublicationsChange(updatedPublications);
  };

  const startEditPublication = (publication: Publication) => {
    setEditingPublication(publication);
    setFormData({ ...publication });
    setIsEditDialogOpen(true);
  };

  const handleInputChange = (
    field: keyof Publication,
    value: string | number
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <Card className="shadow-xl border border-gray-100/80 rounded-2xl bg-white/95 backdrop-blur-sm transition-all duration-300">
      <CardHeader className="border-b border-gray-100/50 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl text-primary font-bold flex items-center">
              <FileTextIcon className="h-6 w-6 mr-3" />
              Publications
            </CardTitle>
            <p className="text-muted-foreground mt-2">
              Manage your academic publications and research outputs
            </p>
          </div>
          {isEditing && (
            <div className="flex gap-2">
              <Button
                onClick={fetchCVPublications}
                disabled={loadingCVPublications}
                variant="outline"
                className="mr-2"
              >
                {loadingCVPublications ? (
                  <>
                    <RefreshCwIcon className="h-4 w-4 mr-2 animate-spin" />
                    Loading CV...
                  </>
                ) : (
                  <>
                    <RefreshCwIcon className="h-4 w-4 mr-2" />
                    Sync from CV
                  </>
                )}
              </Button>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetForm}>
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add Publication
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add New Publication</DialogTitle>
                  </DialogHeader>
                  <PublicationForm
                    formData={formData}
                    formErrors={formErrors}
                    onInputChange={handleInputChange}
                    onSubmit={handleAddPublication}
                    onCancel={() => {
                      resetForm();
                      setIsAddDialogOpen(false);
                    }}
                  />
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-8">
        {cvError && (
          <Alert className="mb-4 border-amber-200 bg-amber-50">
            <AlertDescription className="text-amber-800">
              {cvError}
            </AlertDescription>
          </Alert>
        )}

        {publications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileTextIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-lg mb-2">No publications added yet</p>
            {isEditing && (
              <p className="text-sm">
                Click &quot;Add Publication&quot; to start building your
                publication list
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {publications.map((publication) => (
              <PublicationCard
                key={publication.id}
                publication={publication}
                isEditing={isEditing}
                onEdit={() => startEditPublication(publication)}
                onDelete={() => handleDeletePublication(publication.id!)}
              />
            ))}
          </div>
        )}

        {publications.length > 0 && (
          <div className="mt-8 p-4 bg-primary/5 rounded-lg border border-primary/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-primary">
                  Total Publications: {publications.length}
                </p>
                <p className="text-sm text-muted-foreground">
                  {publications.length >= 3
                    ? "✓ Meets minimum requirement for reviewer eligibility"
                    : `${
                        3 - publications.length
                      } more needed for reviewer eligibility`}
                </p>
              </div>
              {publications.length >= 3 && (
                <div className="text-green-600 text-sm font-medium">
                  Reviewer Eligible
                </div>
              )}
            </div>
          </div>
        )}

        {/* Edit Publication Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Publication</DialogTitle>
            </DialogHeader>
            <PublicationForm
              formData={formData}
              formErrors={formErrors}
              onInputChange={handleInputChange}
              onSubmit={handleEditPublication}
              onCancel={() => {
                resetForm();
                setEditingPublication(null);
                setIsEditDialogOpen(false);
              }}
            />
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

// Publication Card Component
function PublicationCard({
  publication,
  isEditing,
  onEdit,
  onDelete,
}: {
  publication: Publication;
  isEditing: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="p-4 border border-gray-200 rounded-lg bg-gradient-to-r from-primary/5 to-primary/10 hover:from-primary/10 hover:to-primary/15 transition-all duration-300">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="font-semibold text-primary mb-2 leading-tight">
            {publication.title}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
            <div>
              <span className="font-medium">Journal: </span>
              {publication.journal}
            </div>
            <div>
              <span className="font-medium">Year: </span>
              {publication.year}
            </div>
            <div>
              <span className="font-medium">Type: </span>
              {publication.type}
            </div>
            {publication.citations !== undefined &&
              publication.citations > 0 && (
                <div>
                  <span className="font-medium">Citations: </span>
                  {publication.citations}
                </div>
              )}
          </div>
          {publication.authors && (
            <div className="mt-2 text-sm text-muted-foreground">
              <span className="font-medium">Authors: </span>
              {publication.authors}
            </div>
          )}
          {(publication.doi || publication.url) && (
            <div className="mt-2 flex items-center gap-3">
              {publication.doi && (
                <a
                  href={`https://doi.org/${publication.doi}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80 text-sm flex items-center"
                >
                  DOI <ExternalLinkIcon className="h-3 w-3 ml-1" />
                </a>
              )}
              {publication.url && (
                <a
                  href={publication.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80 text-sm flex items-center"
                >
                  Link <ExternalLinkIcon className="h-3 w-3 ml-1" />
                </a>
              )}
            </div>
          )}
        </div>
        {isEditing && (
          <div className="flex items-center gap-2 ml-4">
            <Button size="sm" variant="outline" onClick={onEdit}>
              <EditIcon className="h-3 w-3" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600 hover:text-red-700"
                >
                  <TrashIcon className="h-3 w-3" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Publication</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this publication? This
                    action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={onDelete}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>
    </div>
  );
}

// Publication Form Component
function PublicationForm({
  formData,
  formErrors,
  onInputChange,
  onSubmit,
  onCancel,
}: {
  formData: Publication;
  formErrors: Record<string, string>;
  onInputChange: (field: keyof Publication, value: string | number) => void;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <div>
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => onInputChange("title", e.target.value)}
            placeholder="Enter publication title"
            className={formErrors.title ? "border-red-500" : ""}
          />
          {formErrors.title && (
            <Alert className="mt-2 border-red-200 bg-red-50">
              <AlertDescription className="text-red-800 text-sm">
                {formErrors.title}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="journal">Journal/Venue *</Label>
            <Input
              id="journal"
              value={formData.journal}
              onChange={(e) => onInputChange("journal", e.target.value)}
              placeholder="e.g., Nature, IEEE Conference"
              className={formErrors.journal ? "border-red-500" : ""}
            />
            {formErrors.journal && (
              <Alert className="mt-2 border-red-200 bg-red-50">
                <AlertDescription className="text-red-800 text-sm">
                  {formErrors.journal}
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div>
            <Label htmlFor="year">Year *</Label>
            <Input
              id="year"
              type="number"
              value={formData.year}
              onChange={(e) => onInputChange("year", e.target.value)}
              placeholder="2024"
              min="1900"
              max={new Date().getFullYear() + 2}
              className={formErrors.year ? "border-red-500" : ""}
            />
            {formErrors.year && (
              <Alert className="mt-2 border-red-200 bg-red-50">
                <AlertDescription className="text-red-800 text-sm">
                  {formErrors.year}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="type">Publication Type *</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => onInputChange("type", value)}
            >
              <SelectTrigger
                className={formErrors.type ? "border-red-500" : ""}
              >
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {publicationTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formErrors.type && (
              <Alert className="mt-2 border-red-200 bg-red-50">
                <AlertDescription className="text-red-800 text-sm">
                  {formErrors.type}
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div>
            <Label htmlFor="citations">Citations</Label>
            <Input
              id="citations"
              type="number"
              value={formData.citations || ""}
              onChange={(e) =>
                onInputChange("citations", parseInt(e.target.value) || 0)
              }
              placeholder="0"
              min="0"
              className={formErrors.citations ? "border-red-500" : ""}
            />
            {formErrors.citations && (
              <Alert className="mt-2 border-red-200 bg-red-50">
                <AlertDescription className="text-red-800 text-sm">
                  {formErrors.citations}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="authors">Authors</Label>
          <Input
            id="authors"
            value={formData.authors || ""}
            onChange={(e) => onInputChange("authors", e.target.value)}
            placeholder="e.g., John Doe, Jane Smith, et al."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="doi">DOI</Label>
            <Input
              id="doi"
              value={formData.doi || ""}
              onChange={(e) => onInputChange("doi", e.target.value)}
              placeholder="10.1000/xyz123"
            />
          </div>

          <div>
            <Label htmlFor="url">URL</Label>
            <Input
              id="url"
              type="url"
              value={formData.url || ""}
              onChange={(e) => onInputChange("url", e.target.value)}
              placeholder="https://example.com/paper"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={onSubmit}>Save Publication</Button>
      </div>
    </div>
  );
}
