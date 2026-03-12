"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPinIcon, TruckIcon } from "lucide-react";

export interface ShippingAddress {
  recipientName: string;
  address: string;
  region: string;
  postalCode: string;
  phone: string;
  country: string;
}

interface ShippingAddressFormProps {
  onSubmit: (address: ShippingAddress) => void;
  isLoading?: boolean;
}

// Indonesian provinces for the dropdown
const INDONESIAN_PROVINCES = [
  "Aceh",
  "Sumatera Utara",
  "Sumatera Barat",
  "Riau",
  "Kepulauan Riau",
  "Jambi",
  "Sumatera Selatan",
  "Bangka Belitung",
  "Bengkulu",
  "Lampung",
  "DKI Jakarta",
  "Jawa Barat",
  "Banten",
  "Jawa Tengah",
  "DI Yogyakarta",
  "Jawa Timur",
  "Bali",
  "Nusa Tenggara Barat",
  "Nusa Tenggara Timur",
  "Kalimantan Barat",
  "Kalimantan Tengah",
  "Kalimantan Selatan",
  "Kalimantan Timur",
  "Kalimantan Utara",
  "Sulawesi Utara",
  "Gorontalo",
  "Sulawesi Tengah",
  "Sulawesi Barat",
  "Sulawesi Selatan",
  "Sulawesi Tenggara",
  "Maluku",
  "Maluku Utara",
  "Papua",
  "Papua Barat",
  "Papua Tengah",
  "Papua Pegunungan",
  "Papua Selatan",
  "Papua Barat Daya",
];

export function ShippingAddressForm({
  onSubmit,
  isLoading = false,
}: ShippingAddressFormProps) {
  const [formData, setFormData] = useState<ShippingAddress>({
    recipientName: "",
    address: "",
    region: "",
    postalCode: "",
    phone: "",
    country: "Indonesia",
  });

  const [errors, setErrors] = useState<Partial<ShippingAddress>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<ShippingAddress> = {};

    if (!formData.recipientName.trim()) {
      newErrors.recipientName = "Recipient name is required";
    }

    if (!formData.address.trim()) {
      newErrors.address = "Address is required";
    }

    if (!formData.region) {
      newErrors.region = "Province is required";
    }

    if (!formData.postalCode.trim()) {
      newErrors.postalCode = "Postal code is required";
    } else if (!/^\d{5}$/.test(formData.postalCode)) {
      newErrors.postalCode = "Postal code must be 5 digits";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (
      !/^(\+62|62|0)[0-9]{9,13}$/.test(formData.phone.replace(/\s|-/g, ""))
    ) {
      newErrors.phone = "Invalid Indonesian phone number format";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleInputChange = (field: keyof ShippingAddress, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPinIcon className="h-5 w-5" />
          Shipping Address (Indonesia Only)
        </CardTitle>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <TruckIcon className="h-4 w-4" />
          <span>Physical Academic Card will be shipped to your address</span>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="recipientName">
                Recipient Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="recipientName"
                placeholder="Full name of recipient"
                value={formData.recipientName}
                onChange={(e) =>
                  handleInputChange("recipientName", e.target.value)
                }
                className={errors.recipientName ? "border-red-500" : ""}
              />
              {errors.recipientName && (
                <p className="text-sm text-red-500">{errors.recipientName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">
                Phone Number <span className="text-red-500">*</span>
              </Label>
              <Input
                id="phone"
                placeholder="08123456789 or +628123456789"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                className={errors.phone ? "border-red-500" : ""}
              />
              {errors.phone && (
                <p className="text-sm text-red-500">{errors.phone}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">
              Complete Address <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="address"
              placeholder="Street address, building, floor, apartment number, etc."
              value={formData.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
              className={errors.address ? "border-red-500" : ""}
              rows={3}
            />
            {errors.address && (
              <p className="text-sm text-red-500">{errors.address}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="region">
                Province <span className="text-red-500">*</span>
              </Label>
              <Select
                options={INDONESIAN_PROVINCES.map((province) => ({
                  value: province,
                  label: province,
                }))}
                value={formData.region}
                onValueChange={(value) => handleInputChange("region", value)}
                placeholder="Select Province"
                className={errors.region ? "border-red-500" : ""}
              />
              {errors.region && (
                <p className="text-sm text-red-500">{errors.region}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="postalCode">
                Postal Code <span className="text-red-500">*</span>
              </Label>
              <Input
                id="postalCode"
                placeholder="12345"
                value={formData.postalCode}
                onChange={(e) =>
                  handleInputChange("postalCode", e.target.value)
                }
                className={errors.postalCode ? "border-red-500" : ""}
                maxLength={5}
              />
              {errors.postalCode && (
                <p className="text-sm text-red-500">{errors.postalCode}</p>
              )}
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2">
              Shipping Information
            </h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Cards are shipped to Indonesia addresses only</li>
              <li>• Estimated delivery: 7-14 business days</li>
              <li>• Shipping providers: JNE, POS Indonesia, Tiki</li>
              <li>• You will receive tracking information once shipped</li>
            </ul>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
            size="lg"
          >
            {isLoading ? "Processing Payment..." : "Continue to Payment"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
