"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { Bookmark, Trash2, Save, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

interface SavedSearchesProps {
  onLoadSearch: (filters: any) => void;
  currentFilters: {
    minPrice?: string;
    maxPrice?: string;
    bedrooms?: string;
    bathrooms?: string;
    propertyType?: string;
    amenities?: string[];
  };
}

export default function SavedSearches({
  onLoadSearch,
  currentFilters,
}: SavedSearchesProps) {
  const [open, setOpen] = useState(false);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [searchName, setSearchName] = useState("");
  const utils = trpc.useUtils();
  const { isAuthenticated } = useAuth();
  const loginUrl = getLoginUrl();

  const { data: savedSearches = [], isLoading } =
    trpc.savedSearches.getAll.useQuery(undefined, { enabled: isAuthenticated });
  const savedSearchList = Array.isArray(savedSearches) ? savedSearches : [];

  if (!isAuthenticated) {
    return (
      <Button variant="outline" className="gap-2" asChild>
        <a href={loginUrl}>
          <Bookmark className="w-4 h-4" />
          <span className="hidden sm:inline">Salvar Pesquisas</span>
        </a>
      </Button>
    );
  }

  const createSavedSearch = trpc.savedSearches.create.useMutation({
    onSuccess: () => {
      utils.savedSearches.getAll.invalidate();
      toast.success("Pesquisa salva com sucesso");
      setSearchName("");
      setShowSaveForm(false);
    },
    onError: error => {
      toast.error(error.message || "Falha ao salvar a pesquisa");
    },
  });

  const deleteSavedSearch = trpc.savedSearches.delete.useMutation({
    onSuccess: () => {
      utils.savedSearches.getAll.invalidate();
      toast.success("Pesquisa deletada com sucesso");
    },
    onError: error => {
      toast.error(error.message || "Falha ao deletar a pesquisa");
    },
  });

  const handleSaveSearch = () => {
    if (!searchName.trim()) {
      toast.error("Por favor, insira um nome para a pesquisa");
      return;
    }

    createSavedSearch.mutate({
      name: searchName,
      minPrice: currentFilters.minPrice
        ? Number(currentFilters.minPrice)
        : undefined,
      maxPrice: currentFilters.maxPrice
        ? Number(currentFilters.maxPrice)
        : undefined,
      bedrooms: currentFilters.bedrooms
        ? Number(currentFilters.bedrooms)
        : undefined,
      bathrooms: currentFilters.bathrooms
        ? Number(currentFilters.bathrooms)
        : undefined,
      propertyType: currentFilters.propertyType || undefined,
      amenities: currentFilters.amenities || [],
    });
  };

  const handleLoadSearch = (search: any) => {
    const filters = {
      minPrice: search.minPrice ? String(search.minPrice) : "",
      maxPrice: search.maxPrice ? String(search.maxPrice) : "",
      bedrooms: search.bedrooms ? String(search.bedrooms) : "",
      bathrooms: search.bathrooms ? String(search.bathrooms) : "",
      propertyType: search.propertyType || "",
      amenities: search.amenities || [],
    };
    onLoadSearch(filters);
    setOpen(false);
    toast.success(`Pesquisa carregada: ${search.name}`);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Bookmark className="w-4 h-4" />
          <span className="hidden sm:inline">Saved Searches</span>
          {savedSearchList.length > 0 && (
            <span className="ml-1 text-xs bg-accent text-white px-2 py-0.5 rounded-full">
              {savedSearchList.length}
            </span>
          )}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Saved Searches</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Save Current Search Form */}
          {!showSaveForm ? (
            <Button
              onClick={() => setShowSaveForm(true)}
              className="w-full gap-2 bg-accent hover:bg-accent/90"
            >
              <Save className="w-4 h-4" />
              Save Current Search
            </Button>
          ) : (
            <div className="space-y-3 p-4 bg-card rounded-lg border border-border">
              <div>
                <label className="text-sm font-medium block mb-2">
                  Search Name
                </label>
                <input
                  type="text"
                  placeholder="e.g., Luxury Homes with Pool"
                  value={searchName}
                  onChange={e => setSearchName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleSaveSearch}
                  disabled={createSavedSearch.isPending}
                  className="flex-1 bg-accent hover:bg-accent/90"
                >
                  {createSavedSearch.isPending ? "Salvando..." : "Salvar"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowSaveForm(false);
                    setSearchName("");
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Saved Searches List */}
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando pesquisas salvas...
            </div>
          ) : savedSearchList.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {showSaveForm
                ? "Salve sua primeira pesquisa acima"
                : "Nenhuma pesquisa salva ainda"}
            </div>
          ) : (
            <div className="space-y-2">
              {savedSearchList.map((search: any) => (
                <Card
                  key={search.id}
                  className="p-4 flex items-start justify-between hover:shadow-md transition-shadow"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-2">
                      {search.name}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {search.minPrice && (
                        <span className="text-xs bg-muted px-2 py-1 rounded">
                          Min: ${Number(search.minPrice).toLocaleString()}
                        </span>
                      )}
                      {search.maxPrice && (
                        <span className="text-xs bg-muted px-2 py-1 rounded">
                          Max: ${Number(search.maxPrice).toLocaleString()}
                        </span>
                      )}
                      {search.bedrooms && (
                        <span className="text-xs bg-muted px-2 py-1 rounded">
                          {search.bedrooms}+ Quartos
                        </span>
                      )}
                      {search.bathrooms && (
                        <span className="text-xs bg-muted px-2 py-1 rounded">
                          {search.bathrooms}+ Banheiros
                        </span>
                      )}
                      {search.propertyType && (
                        <span className="text-xs bg-muted px-2 py-1 rounded">
                          {search.propertyType}
                        </span>
                      )}
                      {search.amenities && search.amenities.length > 0 && (
                        <span className="text-xs bg-muted px-2 py-1 rounded">
                          {search.amenities.length} comodidades
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleLoadSearch(search)}
                      className="bg-accent hover:bg-accent/90"
                    >
                      Carregar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        deleteSavedSearch.mutate({ id: search.id })
                      }
                      disabled={deleteSavedSearch.isPending}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
