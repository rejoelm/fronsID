import { useState, useCallback } from "react";

interface Author {
  name: string;
  email?: string;
  institution?: string;
}

interface ManuscriptData {
  title: string;
  abstract: string;
  authors: Author[];
  keywords: string[];
  categories: string[];
  ipfsHash?: string;
}

export function useManuscriptForm() {
  const [manuscriptData, setManuscriptData] = useState<ManuscriptData>({
    title: "",
    abstract: "",
    authors: [],
    keywords: [],
    categories: [],
    ipfsHash: "",
  });

  const [authorsInput, setAuthorsInput] = useState("");
  const [keywordsInput, setKeywordsInput] = useState("");

  const handleInputChange = useCallback((field: string, value: string) => {
    setManuscriptData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const parseAuthors = useCallback((input: string): Author[] => {
    if (!input.trim()) return [];

    return input
      .split(",")
      .map((author) => author.trim())
      .filter((author) => author.length > 0)
      .map((author) => ({ name: author }));
  }, []);

  const parseKeywords = useCallback((input: string): string[] => {
    if (!input.trim()) return [];

    return input
      .split(",")
      .map((keyword) => keyword.trim())
      .filter((keyword) => keyword.length > 0);
  }, []);

  const handleAuthorsBlur = useCallback(() => {
    const authors = parseAuthors(authorsInput);
    setManuscriptData((prev) => ({
      ...prev,
      authors,
    }));
  }, [authorsInput, parseAuthors]);

  const handleKeywordsBlur = useCallback(() => {
    const keywords = parseKeywords(keywordsInput);
    setManuscriptData((prev) => ({
      ...prev,
      keywords,
    }));
  }, [keywordsInput, parseKeywords]);

  const handleCategoriesChange = useCallback((categories: string[]) => {
    setManuscriptData((prev) => ({
      ...prev,
      categories,
    }));
  }, []);

  const setIpfsHash = useCallback((ipfsHash: string) => {
    setManuscriptData((prev) => ({
      ...prev,
      ipfsHash,
    }));
  }, []);

  const resetForm = useCallback(() => {
    setManuscriptData({
      title: "",
      abstract: "",
      authors: [],
      keywords: [],
      categories: [],
      ipfsHash: "",
    });
    setAuthorsInput("");
    setKeywordsInput("");
  }, []);

  const validateForm = useCallback(
    (
      connected: boolean,
      publicKey: any,
      cvVerified: boolean,
      file: File | null
    ): string | null => {
      if (!connected || !publicKey) {
        return "Please connect your wallet";
      }

      if (!cvVerified) {
        return "Please register your CV before submitting a manuscript";
      }

      if (!manuscriptData.title.trim()) {
        return "Please enter a manuscript title";
      }

      if (!manuscriptData.abstract.trim()) {
        return "Please enter an abstract";
      }

      if (manuscriptData.abstract.length < 50) {
        return "Abstract must be at least 50 characters long";
      }

      if (manuscriptData.authors.length === 0) {
        return "Please enter at least one author";
      }

      if (manuscriptData.keywords.length === 0) {
        return "Please enter at least one keyword";
      }

      if (manuscriptData.categories.length === 0) {
        return "Please select at least one research category";
      }

      if (!file) {
        return "Please upload a manuscript file";
      }

      if (!manuscriptData.ipfsHash) {
        return "Please upload your manuscript to IPFS first";
      }

      return null;
    },
    [manuscriptData]
  );

  const isFormValid = useCallback(() => {
    return (
      manuscriptData.title.trim() !== "" &&
      manuscriptData.abstract.trim() !== "" &&
      manuscriptData.abstract.length >= 50 &&
      manuscriptData.authors.length > 0 &&
      manuscriptData.keywords.length > 0 &&
      manuscriptData.categories.length > 0 &&
      manuscriptData.ipfsHash !== ""
    );
  }, [manuscriptData]);

  return {
    manuscriptData,
    authorsInput,
    keywordsInput,
    isFormValid: isFormValid(),
    setAuthorsInput,
    setKeywordsInput,
    handleInputChange,
    handleAuthorsBlur,
    handleKeywordsBlur,
    handleCategoriesChange,
    setIpfsHash,
    resetForm,
    validateForm,
  };
}
