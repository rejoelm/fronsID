import { useState, useCallback, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";

interface FormData {
  title: string;
  author: string;
  category: string;
  abstract: string;
  keywords: string;
}

interface UseSubmissionFormProps {
  initialData?: Partial<FormData>;
}

export function useSubmissionForm({
  initialData,
}: UseSubmissionFormProps = {}) {
  const [formData, setFormData] = useState<FormData>({
    title: "",
    author: "",
    category: "",
    abstract: "",
    keywords: "",
    ...initialData,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const getArrayFromCommaString = useCallback((str: string) => {
    return str
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }, []);

  const getCommaStringFromArray = useCallback((arr: string[]) => {
    return arr.join(", ");
  }, []);

  const authors = useMemo(
    () => getArrayFromCommaString(formData.author),
    [formData.author, getArrayFromCommaString]
  );

  const keywords = useMemo(
    () => getArrayFromCommaString(formData.keywords),
    [formData.keywords, getArrayFromCommaString]
  );

  const handleInputChange = useCallback((field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setError(null);
  }, []);

  const handleRemoveItem = useCallback(
    (field: string, itemToRemove: string) => {
      const items = getArrayFromCommaString(
        formData[field as keyof FormData] as string
      );
      const updatedItems = items.filter((item) => item !== itemToRemove);
      handleInputChange(field, getCommaStringFromArray(updatedItems));
    },
    [
      formData,
      getArrayFromCommaString,
      getCommaStringFromArray,
      handleInputChange,
    ]
  );

  const handleCategoriesChange = useCallback((categories: string[]) => {
    setFormData((prev) => ({
      ...prev,
      category: categories.join(", "),
    }));
    setError(null);
  }, []);

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        if (file.type !== "application/pdf") {
          toast({
            variant: "destructive",
            title: "Invalid File Type",
            description: "Please select a PDF file.",
          });
          return;
        }

        if (file.size > 10 * 1024 * 1024) {
          toast({
            variant: "destructive",
            title: "File Too Large",
            description: "File size must be less than 10MB.",
          });
          return;
        }

        setSelectedFile(file);
        setError(null);
      }
    },
    [toast]
  );

  const handleRemoveFile = useCallback(() => {
    setSelectedFile(null);
  }, []);

  const validateForm = useCallback((): string | null => {
    if (!formData.title.trim()) return "Title is required";
    if (!formData.author.trim()) return "Author is required";
    if (!formData.category.trim()) return "Category is required";
    if (!formData.abstract.trim()) return "Abstract is required";
    if (!formData.keywords.trim()) return "Keywords are required";
    if (!selectedFile) return "Manuscript file is required";
    return null;
  }, [formData, selectedFile]);

  const resetForm = useCallback(() => {
    setFormData({
      title: "",
      author: "",
      category: "",
      abstract: "",
      keywords: "",
    });
    setSelectedFile(null);
    setError(null);
  }, []);

  return {
    formData,
    selectedFile,
    authors,
    keywords,
    error,

    handleInputChange,
    handleRemoveItem,
    handleCategoriesChange,
    handleFileChange,
    handleRemoveFile,

    validateForm,

    resetForm,
    getArrayFromCommaString,
    setError,
  };
}
