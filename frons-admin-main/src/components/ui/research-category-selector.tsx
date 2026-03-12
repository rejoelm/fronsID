"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronDownIcon, ChevronRightIcon, XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

// Comprehensive research categories with subcategories
const RESEARCH_CATEGORIES = {
  "Software Engineering": [
    "Web Development",
    "Mobile Development",
    "Blockchain Technology",
    "Artificial Intelligence",
    "Machine Learning",
    "Data Science",
    "Cybersecurity",
    "Cloud Computing",
    "DevOps",
    "Software Architecture",
    "Database Systems",
    "Computer Networks",
    "Operating Systems",
    "Programming Languages",
    "Software Testing",
    "Game Development",
    "Embedded Systems",
    "IoT Development",
    "Quantum Computing",
    "Robotics Software",
  ],
  "Medical and Health": [
    "Neurology",
    "Cardiology",
    "Oncology",
    "Pediatrics",
    "Psychiatry",
    "Dermatology",
    "Orthopedics",
    "Radiology",
    "Emergency Medicine",
    "Internal Medicine",
    "Surgery",
    "Anesthesiology",
    "Pathology",
    "Pharmacology",
    "Immunology",
    "Genetics",
    "Epidemiology",
    "Public Health",
    "Nursing",
    "Medical Technology",
    "Telemedicine",
    "Preventive Medicine",
    "Rehabilitation Medicine",
    "Forensic Medicine",
  ],
  "Civil Engineering": [
    "Structural Engineering",
    "Transportation Engineering",
    "Environmental Engineering",
    "Geotechnical Engineering",
    "Water Resources Engineering",
    "Construction Management",
    "Urban Planning",
    "Architecture",
    "Surveying",
    "Materials Science",
    "Coastal Engineering",
    "Earthquake Engineering",
    "Bridge Engineering",
    "Highway Engineering",
    "Railway Engineering",
    "Airport Engineering",
    "Tunnel Engineering",
    "Foundation Engineering",
  ],
  "Law and Legal Studies": [
    "Constitutional Law",
    "Criminal Law",
    "Civil Law",
    "Corporate Law",
    "International Law",
    "Environmental Law",
    "Intellectual Property Law",
    "Tax Law",
    "Family Law",
    "Labor Law",
    "Immigration Law",
    "Human Rights Law",
    "Administrative Law",
    "Contract Law",
    "Tort Law",
    "Property Law",
    "Banking Law",
    "Securities Law",
    "Antitrust Law",
    "Health Law",
    "Education Law",
    "Media Law",
    "Sports Law",
    "Entertainment Law",
  ],
  "Business and Economics": [
    "Finance",
    "Marketing",
    "Management",
    "Accounting",
    "Economics",
    "Entrepreneurship",
    "Human Resources",
    "Operations Management",
    "Strategic Management",
    "International Business",
    "Supply Chain Management",
    "Business Analytics",
    "Corporate Finance",
    "Investment Banking",
    "Real Estate",
    "Insurance",
    "Banking",
    "Microeconomics",
    "Macroeconomics",
    "Behavioral Economics",
    "Development Economics",
    "Labor Economics",
    "Public Economics",
  ],
  "Physics and Astronomy": [
    "Quantum Physics",
    "Particle Physics",
    "Astrophysics",
    "Condensed Matter Physics",
    "Optics",
    "Acoustics",
    "Nuclear Physics",
    "Plasma Physics",
    "Biophysics",
    "Geophysics",
    "Atmospheric Physics",
    "Fluid Dynamics",
    "Thermodynamics",
    "Electromagnetism",
    "Mechanics",
    "Relativity",
    "Cosmology",
    "Materials Physics",
    "Computational Physics",
    "Experimental Physics",
  ],
  "Chemistry and Materials Science": [
    "Organic Chemistry",
    "Inorganic Chemistry",
    "Physical Chemistry",
    "Biochemistry",
    "Analytical Chemistry",
    "Polymer Chemistry",
    "Materials Chemistry",
    "Environmental Chemistry",
    "Medicinal Chemistry",
    "Computational Chemistry",
    "Electrochemistry",
    "Photochemistry",
    "Catalysis",
    "Surface Chemistry",
    "Nuclear Chemistry",
    "Food Chemistry",
    "Atmospheric Chemistry",
    "Green Chemistry",
    "Supramolecular Chemistry",
    "Nanochemistry",
  ],
  "Biology and Life Sciences": [
    "Molecular Biology",
    "Cell Biology",
    "Genetics",
    "Ecology",
    "Evolutionary Biology",
    "Microbiology",
    "Botany",
    "Zoology",
    "Biochemistry",
    "Biotechnology",
    "Bioinformatics",
    "Neuroscience",
    "Immunology",
    "Developmental Biology",
    "Physiology",
    "Anatomy",
    "Marine Biology",
    "Plant Biology",
    "Animal Biology",
    "Systems Biology",
    "Synthetic Biology",
    "Conservation Biology",
    "Population Biology",
  ],
  "Mathematics and Statistics": [
    "Algebra",
    "Calculus",
    "Geometry",
    "Topology",
    "Number Theory",
    "Analysis",
    "Statistics",
    "Probability",
    "Combinatorics",
    "Graph Theory",
    "Optimization",
    "Differential Equations",
    "Linear Algebra",
    "Abstract Algebra",
    "Real Analysis",
    "Complex Analysis",
    "Functional Analysis",
    "Mathematical Logic",
    "Set Theory",
    "Category Theory",
    "Mathematical Physics",
    "Computational Mathematics",
    "Applied Mathematics",
  ],
  "Psychology and Behavioral Sciences": [
    "Clinical Psychology",
    "Cognitive Psychology",
    "Social Psychology",
    "Developmental Psychology",
    "Behavioral Psychology",
    "Neuropsychology",
    "Industrial Psychology",
    "Educational Psychology",
    "Forensic Psychology",
    "Health Psychology",
    "Sports Psychology",
    "Experimental Psychology",
    "Personality Psychology",
    "Abnormal Psychology",
    "Positive Psychology",
    "Cross-Cultural Psychology",
    "Environmental Psychology",
    "Consumer Psychology",
    "Military Psychology",
    "Rehabilitation Psychology",
  ],
  "Education and Teaching": [
    "Educational Technology",
    "Curriculum Development",
    "Educational Psychology",
    "Special Education",
    "Higher Education",
    "Early Childhood Education",
    "Adult Education",
    "Educational Leadership",
    "Assessment and Evaluation",
    "Instructional Design",
    "Educational Policy",
    "Teacher Education",
    "Learning Sciences",
    "Educational Research",
    "Distance Learning",
    "STEM Education",
    "Language Education",
    "Mathematics Education",
    "Science Education",
    "Arts Education",
    "Physical Education",
    "Vocational Education",
  ],
  "Environmental Science": [
    "Climate Change",
    "Conservation Biology",
    "Environmental Chemistry",
    "Environmental Engineering",
    "Environmental Policy",
    "Sustainability",
    "Renewable Energy",
    "Waste Management",
    "Water Quality",
    "Air Quality",
    "Soil Science",
    "Oceanography",
    "Atmospheric Science",
    "Ecosystem Ecology",
    "Environmental Toxicology",
    "Natural Resource Management",
    "Environmental Economics",
    "Green Technology",
    "Environmental Health",
    "Biodiversity Conservation",
  ],
  Agriculture: [
    "Crop Science",
    "Animal Science",
    "Soil Science",
    "Agricultural Economics",
    "Agricultural Engineering",
    "Horticulture",
    "Agronomy",
    "Plant Breeding",
    "Animal Breeding",
    "Agricultural Biotechnology",
    "Precision Agriculture",
    "Sustainable Agriculture",
    "Food Science",
    "Agricultural Policy",
    "Agricultural Extension",
    "Agricultural Marketing",
    "Agricultural Finance",
    "Agricultural Education",
    "Agricultural Statistics",
    "Agricultural Chemistry",
  ],
  "Architecture and Design": [
    "Architectural Design",
    "Urban Design",
    "Interior Design",
    "Landscape Architecture",
    "Architectural History",
    "Architectural Theory",
    "Building Technology",
    "Sustainable Architecture",
    "Digital Architecture",
    "Parametric Design",
    "Architectural Conservation",
    "Architectural Engineering",
    "Housing Design",
    "Commercial Architecture",
    "Institutional Architecture",
    "Residential Architecture",
    "Industrial Architecture",
    "Architectural Visualization",
    "Architectural Management",
    "Architectural Criticism",
  ],
  "Arts and Humanities": [
    "Art History",
    "Literature",
    "Philosophy",
    "History",
    "Linguistics",
    "Music",
    "Theater",
    "Film Studies",
    "Cultural Studies",
    "Religious Studies",
    "Archaeology",
    "Anthropology",
    "Classics",
    "Comparative Literature",
    "Creative Writing",
    "Digital Humanities",
    "Gender Studies",
    "Postcolonial Studies",
    "Media Studies",
    "Visual Arts",
    "Performing Arts",
    "Museum Studies",
  ],
  "Social Sciences": [
    "Sociology",
    "Political Science",
    "Anthropology",
    "Geography",
    "Demography",
    "Social Work",
    "Communication Studies",
    "International Relations",
    "Public Policy",
    "Urban Studies",
    "Rural Studies",
    "Gender Studies",
    "Race and Ethnicity",
    "Social Psychology",
    "Criminology",
    "Social Theory",
    "Social Research Methods",
    "Social Statistics",
    "Social Movements",
    "Social Inequality",
  ],
  "Engineering and Technology": [
    "Mechanical Engineering",
    "Electrical Engineering",
    "Chemical Engineering",
    "Aerospace Engineering",
    "Biomedical Engineering",
    "Materials Engineering",
    "Industrial Engineering",
    "Nuclear Engineering",
    "Petroleum Engineering",
    "Mining Engineering",
    "Metallurgical Engineering",
    "Agricultural Engineering",
    "Ocean Engineering",
    "Systems Engineering",
    "Robotics Engineering",
    "Automotive Engineering",
    "Energy Engineering",
    "Environmental Engineering",
    "Computer Engineering",
    "Telecommunications Engineering",
  ],
};

interface ResearchCategorySelectorProps {
  selectedCategories: string[];
  onCategoriesChange: (categories: string[]) => void;
}

export function ResearchCategorySelector({
  selectedCategories,
  onCategoriesChange,
}: ResearchCategorySelectorProps) {
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const toggleSubcategory = (subcategory: string) => {
    const newCategories = selectedCategories.includes(subcategory)
      ? selectedCategories.filter((c) => c !== subcategory)
      : [...selectedCategories, subcategory];
    onCategoriesChange(newCategories);
  };

  const removeCategory = (category: string) => {
    onCategoriesChange(selectedCategories.filter((c) => c !== category));
  };

  const isCategoryExpanded = (category: string) =>
    expandedCategories.includes(category);

  return (
    <div className="space-y-4">
      {/* Selected Categories Display */}
      {selectedCategories.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">
            Selected Categories ({selectedCategories.length})
          </Label>
          <div className="flex flex-wrap gap-2">
            {selectedCategories.map((category) => (
              <Badge
                key={category}
                variant="secondary"
                className="flex items-center gap-1 px-3 py-1"
              >
                {category}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    removeCategory(category);
                  }}
                  className="ml-1 hover:text-red-600 transition-colors"
                >
                  <XIcon className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Category Selection */}
      <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-4 bg-white">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(RESEARCH_CATEGORIES).map(
            ([category, subcategories]) => (
              <Card key={category} className="border border-gray-200">
                <CardContent className="p-4">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleCategory(category);
                    }}
                    className="flex items-center justify-between w-full text-left font-medium text-gray-900 hover:text-blue-600 transition-colors"
                  >
                    <span className="text-sm">{category}</span>
                    {isCategoryExpanded(category) ? (
                      <ChevronDownIcon className="h-4 w-4" />
                    ) : (
                      <ChevronRightIcon className="h-4 w-4" />
                    )}
                  </button>

                  {isCategoryExpanded(category) && (
                    <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
                      {subcategories.map((subcategory) => (
                        <button
                          type="button"
                          key={subcategory}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleSubcategory(subcategory);
                          }}
                          className={cn(
                            "block w-full text-left text-xs px-2 py-1 rounded transition-colors",
                            selectedCategories.includes(subcategory)
                              ? "bg-blue-100 text-blue-800 border border-blue-200"
                              : "text-gray-600 hover:bg-gray-50"
                          )}
                        >
                          {subcategory}
                        </button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          )}
        </div>
      </div>
    </div>
  );
}
