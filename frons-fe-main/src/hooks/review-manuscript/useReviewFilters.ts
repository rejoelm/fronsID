"use client";
import { useState, useEffect, useMemo } from "react";
import { PendingReviewManuscript } from "@/types/backend";

interface Category {
  name: string;
  count: number;
}

export const useReviewFilters = (manuscripts: PendingReviewManuscript[]) => {
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  // Extract categories from manuscripts
  useEffect(() => {
    if (manuscripts.length > 0) {
      const categoryCount: { [key: string]: number } = {};
      
      manuscripts.forEach((manuscript) => {
        if (manuscript.category && Array.isArray(manuscript.category)) {
          manuscript.category.forEach((cat) => {
            categoryCount[cat] = (categoryCount[cat] || 0) + 1;
          });
        }
      });

      const categoryList: Category[] = [
        { name: "All", count: manuscripts.length },
        ...Object.entries(categoryCount).map(([name, count]) => ({
          name,
          count,
        })),
      ];

      setCategories(categoryList);
    } else {
      setCategories([{ name: "All", count: 0 }]);
    }
  }, [manuscripts]);

  // Filter manuscripts based on current filters
  const filteredManuscripts = useMemo(() => {
    return manuscripts.filter((manuscript) => {
      const matchesStatus =
        selectedStatus === "All" ||
        (manuscript.status &&
          manuscript.status === selectedStatus.toLowerCase().replace(" ", "_"));
      
      const matchesSearch =
        searchQuery === "" ||
        manuscript.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        manuscript.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (manuscript.category &&
          manuscript.category.some((cat) =>
            cat.toLowerCase().includes(searchQuery.toLowerCase())
          ));

      const matchesCategory =
        selectedCategory === "All" ||
        (manuscript.category &&
          manuscript.category.includes(selectedCategory));

      return matchesStatus && matchesSearch && matchesCategory;
    });
  }, [manuscripts, selectedStatus, searchQuery, selectedCategory]);

  const resetFilters = () => {
    setSelectedStatus("All");
    setSearchQuery("");
    setSelectedCategory("All");
  };

  return {
    selectedStatus,
    setSelectedStatus,
    searchQuery,
    setSearchQuery,
    categories,
    selectedCategory,
    setSelectedCategory,
    filteredManuscripts,
    resetFilters,
  };
};