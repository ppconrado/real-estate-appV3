import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ChevronDown, X } from "lucide-react";
import { AMENITIES, type AmenityId } from "@/shared/amenities";

interface AmenityFilterProps {
  selectedAmenities: AmenityId[];
  onChange: (amenities: AmenityId[]) => void;
}

export default function AmenityFilter({
  selectedAmenities,
  onChange,
}: AmenityFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleAmenity = (amenityId: AmenityId) => {
    if (selectedAmenities.includes(amenityId)) {
      onChange(selectedAmenities.filter(a => a !== amenityId));
    } else {
      onChange([...selectedAmenities, amenityId]);
    }
  };

  const clearAll = () => {
    onChange([]);
  };

  return (
    <div className="relative">
      {/* Dropdown Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 border border-border rounded-lg bg-background hover:bg-muted/50 transition-colors flex items-center justify-between"
      >
        <span className="text-sm font-medium">
          {selectedAmenities.length > 0
            ? `${selectedAmenities.length} Amenities Selected`
            : "Filter by Amenities"}
        </span>
        <ChevronDown
          className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-lg shadow-lg z-50 p-4">
          <div className="space-y-4">
            {/* Header with Clear Button */}
            {selectedAmenities.length > 0 && (
              <div className="flex justify-between items-center pb-3 border-b border-border">
                <span className="text-xs font-medium text-muted-foreground">
                  {selectedAmenities.length} Selected
                </span>
                <Button
                  onClick={clearAll}
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                >
                  Clear All
                </Button>
              </div>
            )}

            {/* Amenity Checkboxes */}
            <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto">
              {AMENITIES.map(amenity => (
                <div key={amenity.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`amenity-${amenity.id}`}
                    checked={selectedAmenities.includes(
                      amenity.id as AmenityId
                    )}
                    onCheckedChange={() =>
                      toggleAmenity(amenity.id as AmenityId)
                    }
                  />
                  <Label
                    htmlFor={`amenity-${amenity.id}`}
                    className="text-sm cursor-pointer flex items-center gap-1"
                  >
                    <span>{amenity.icon}</span>
                    <span>{amenity.label}</span>
                  </Label>
                </div>
              ))}
            </div>

            {/* Apply Button */}
            <div className="pt-3 border-t border-border">
              <Button
                onClick={() => setIsOpen(false)}
                className="w-full"
                size="sm"
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Selected Tags */}
      {selectedAmenities.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {selectedAmenities.map(amenityId => {
            const amenity = AMENITIES.find(a => a.id === amenityId);
            return (
              <div
                key={amenityId}
                className="inline-flex items-center gap-1 px-3 py-1 bg-accent/10 border border-accent/30 rounded-full text-xs font-medium text-accent"
              >
                <span>{amenity?.icon}</span>
                <span>{amenity?.label}</span>
                <button
                  onClick={() => toggleAmenity(amenityId)}
                  className="ml-1 hover:opacity-70"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
