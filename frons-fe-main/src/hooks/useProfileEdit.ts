import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import type { UserProfile } from "./useProfileData";

export function useProfileEdit() {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleEditStart = useCallback((profile: UserProfile | null) => {
    if (!profile) return;
    setIsEditing(true);
    setEditData(JSON.parse(JSON.stringify(profile))); // Deep copy
  }, []);

  const handleEditCancel = useCallback(() => {
    setIsEditing(false);
    setEditData({});
  }, []);

  const handleInputChange = useCallback(
    (section: string, field: string, value: string) => {
      setEditData((prev: any) => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value,
        },
      }));
    },
    []
  );

  const handleOverviewChange = useCallback((value: string) => {
    setEditData((prev: any) => ({
      ...prev,
      overview: value,
    }));
  }, []);

  const handleSave = useCallback(
    async (
      updateProfile: (payload: any) => Promise<any>,
      reloadProfile: () => Promise<void>
    ) => {
      try {
        setSaving(true);

        const updatePayload = {
          personalInfo: editData.personalInfo,
          contact: editData.contact,
          overview: editData.overview,
        };

        const result = await updateProfile(updatePayload);

        if (result?.success) {
          await reloadProfile(); // Reload profile
          setIsEditing(false);
          setEditData({});
          toast({
            variant: "success",
            title: "Profile Updated",
          });
        } else {
          toast({
            variant: "destructive",
            title: "Update Failed",
            description: "Failed to update your profile. Please try again.",
          });
        }
      } catch (err) {
        console.error("Failed to save profile:", err);
        toast({
          variant: "destructive",
          title: "Error Saving Profile",
          description:
            "An error occurred while saving your profile. Please try again.",
        });
      } finally {
        setSaving(false);
      }
    },
    [editData, toast]
  );

  return {
    isEditing,
    editData,
    saving,
    handleEditStart,
    handleEditCancel,
    handleInputChange,
    handleOverviewChange,
    handleSave,
  };
}
