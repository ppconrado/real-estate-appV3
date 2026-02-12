"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  User,
  Mail,
  Phone,
  MapPin,
  CheckCircle,
  AlertCircle,
  Trash2,
  Edit2,
  Search,
  Filter,
  Download,
} from "lucide-react";

interface ViewingFilters {
  status?: string;
  propertyId?: number;
  startDate?: Date;
  endDate?: Date;
  searchQuery?: string;
}

export default function ViewingsDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [filters, setFilters] = useState<ViewingFilters>({});
  const [selectedViewings, setSelectedViewings] = useState<number[]>([]);
  const [bulkAction, setBulkAction] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  useEffect(() => {
    if (loading) return;
    if (user?.role === "admin") return;
    router.push("/");
  }, [loading, router, user]);

  if (!loading && user?.role !== "admin") {
    return null;
  }

  // Fetch all viewings with filters
  const {
    data: viewings = [],
    isLoading,
    refetch,
  } = trpc.viewings.listAll.useQuery(
    {
      status: statusFilter === "all" ? undefined : (statusFilter as any),
      searchQuery: searchQuery || undefined,
      startDate: dateRange.start ? new Date(dateRange.start) : undefined,
      endDate: dateRange.end ? new Date(dateRange.end) : undefined,
    },
    { enabled: user?.role === "admin" }
  );

  const updateStatusMutation = trpc.viewings.updateStatus.useMutation({
    onSuccess: () => {
      refetch();
      setSelectedViewings([]);
    },
  });

  const bulkUpdateMutation = trpc.viewings.bulkUpdateStatus.useMutation({
    onSuccess: () => {
      refetch();
      setSelectedViewings([]);
      setBulkAction("");
    },
  });

  const deleteViewingMutation = trpc.viewings.delete.useMutation({
    onSuccess: () => {
      refetch();
      setSelectedViewings([]);
    },
  });

  // Statistics
  const stats = useMemo(() => {
    return {
      total: viewings.length,
      scheduled: viewings.filter((v: any) => v.status === "scheduled").length,
      confirmed: viewings.filter((v: any) => v.status === "confirmed").length,
      completed: viewings.filter((v: any) => v.status === "completed").length,
      cancelled: viewings.filter((v: any) => v.status === "cancelled").length,
    };
  }, [viewings]);

  // Handle bulk actions
  const handleBulkAction = () => {
    if (!bulkAction || selectedViewings.length === 0) return;

    bulkUpdateMutation.mutate({
      ids: selectedViewings,
      status: bulkAction as any,
    });
  };

  // Handle individual status update
  const handleStatusUpdate = (viewingId: number, newStatus: string) => {
    updateStatusMutation.mutate({
      id: viewingId,
      status: newStatus as any,
    });
  };

  // Handle delete
  const handleDelete = (viewingId: number) => {
    if (confirm("Are you sure you want to delete this viewing?")) {
      deleteViewingMutation.mutate({ id: viewingId });
    }
  };

  // Toggle viewing selection
  const toggleSelection = (viewingId: number) => {
    setSelectedViewings(prev =>
      prev.includes(viewingId)
        ? prev.filter(id => id !== viewingId)
        : [...prev, viewingId]
    );
  };

  // Toggle all selections
  const toggleAllSelection = () => {
    if (selectedViewings.length === viewings.length) {
      setSelectedViewings([]);
    } else {
      setSelectedViewings(viewings.map(v => v.id));
    }
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "scheduled":
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  // Format date
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Painel de Consultas de Visualização
          </h1>
          <p className="text-slate-600">
            Gerencie e acompanhe todas as consultas de visualização de
            propriedades
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card className="p-4">
            <div className="text-sm font-medium text-slate-600 mb-1">
              Total de Consultas
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {stats.total}
            </div>
          </Card>
          <Card className="p-4 border-yellow-200">
            <div className="text-sm font-medium text-yellow-700 mb-1">
              Agendadas
            </div>
            <div className="text-2xl font-bold text-yellow-900">
              {stats.scheduled}
            </div>
          </Card>
          <Card className="p-4 border-green-200">
            <div className="text-sm font-medium text-green-700 mb-1">
              Confirmadas
            </div>
            <div className="text-2xl font-bold text-green-900">
              {stats.confirmed}
            </div>
          </Card>
          <Card className="p-4 border-blue-200">
            <div className="text-sm font-medium text-blue-700 mb-1">
              Concluídas
            </div>
            <div className="text-2xl font-bold text-blue-900">
              {stats.completed}
            </div>
          </Card>
          <Card className="p-4 border-red-200">
            <div className="text-sm font-medium text-red-700 mb-1">
              Canceladas
            </div>
            <div className="text-2xl font-bold text-red-900">
              {stats.cancelled}
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-slate-600" />
            <h2 className="text-lg font-semibold text-slate-900">Filtros</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Pesquisar por nome, email, telefone..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="scheduled">Agendadas</SelectItem>
                <SelectItem value="confirmed">Confirmadas</SelectItem>
                <SelectItem value="completed">Concluídas</SelectItem>
                <SelectItem value="canceled">Cancelada</SelectItem>
              </SelectContent>
            </Select>

            {/* Start Date */}
            <Input
              type="date"
              value={dateRange.start}
              onChange={e =>
                setDateRange({ ...dateRange, start: e.target.value })
              }
              placeholder="Start Date"
            />

            {/* End Date */}
            <Input
              type="date"
              value={dateRange.end}
              onChange={e =>
                setDateRange({ ...dateRange, end: e.target.value })
              }
              placeholder="End Date"
            />
          </div>
        </Card>

        {/* Bulk Actions */}
        {selectedViewings.length > 0 && (
          <Card className="p-4 mb-6 bg-blue-50 border-blue-200">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-blue-900">
                {selectedViewings.length} Visita(s) selecionada(s)
              </div>
              <div className="flex items-center gap-2">
                <Select value={bulkAction as any} onValueChange={setBulkAction}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Select action..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="confirmed">
                      Marcar como Confirmada
                    </SelectItem>
                    <SelectItem value="completed">
                      Marcar como Concluída
                    </SelectItem>
                    <SelectItem value="cancelled">
                      Marcar como Cancelada
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleBulkAction}
                  disabled={!bulkAction || bulkUpdateMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Aplicar
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Viewings Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-100 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={
                        viewings.length > 0 &&
                        selectedViewings.length === viewings.length
                      }
                      onChange={toggleAllSelection}
                      className="rounded"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                    Visitante
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                    Data & Hora
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                    Duração
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                    Contato
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center">
                      <div className="text-slate-500">
                        Carregando consultas...
                      </div>
                    </td>
                  </tr>
                ) : viewings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center">
                      <div className="text-slate-500">
                        Nenhuma consulta encontrada.
                      </div>
                    </td>
                  </tr>
                ) : (
                  viewings.map((viewing: any) => (
                    <tr
                      key={viewing.id}
                      className="border-b border-slate-200 hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedViewings.includes(viewing.id)}
                          onChange={() => toggleSelection(viewing.id)}
                          className="rounded"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">
                          {viewing.visitorName}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Calendar className="w-4 h-4" />
                          <span className="text-sm">
                            {formatDate(viewing.viewingDate)} at{" "}
                            {viewing.viewingTime}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Clock className="w-4 h-4" />
                          <span className="text-sm">
                            {viewing.duration} min
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Select
                          value={viewing.status}
                          onValueChange={value =>
                            handleStatusUpdate(viewing.id, value)
                          }
                        >
                          <SelectTrigger className="w-32">
                            <Badge className={getStatusColor(viewing.status)}>
                              {viewing.status}
                            </Badge>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="scheduled">Agendada</SelectItem>
                            <SelectItem value="confirmed">
                              Confirmada
                            </SelectItem>
                            <SelectItem value="completed">Concluída</SelectItem>
                            <SelectItem value="cancelled">Cancelada</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Mail className="w-4 h-4" />
                            {viewing.visitorEmail}
                          </div>
                          {viewing.visitorPhone && (
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <Phone className="w-4 h-4" />
                              {viewing.visitorPhone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(viewing.id)}
                            disabled={deleteViewingMutation.isPending}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Export Button */}
        <div className="mt-6 flex justify-end">
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => {
              // Export as CSV
              const csv = [
                [
                  "Visitor",
                  "Email",
                  "Phone",
                  "Date",
                  "Time",
                  "Duration",
                  "Status",
                ],
                ...viewings.map(v => [
                  v.visitorName,
                  v.visitorEmail,
                  v.visitorPhone || "",
                  formatDate(v.viewingDate),
                  v.viewingTime,
                  v.duration.toString(),
                  v.status,
                ]),
              ]
                .map((row: any) =>
                  row.map((cell: any) => `"${cell}"`).join(",")
                )
                .join("\n");

              const blob = new Blob([csv], { type: "text/csv" });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `viewings-${new Date().toISOString().split("T")[0]}.csv`;
              a.click();
            }}
          >
            <Download className="w-4 h-4" />
            Exportar para CSV
          </Button>
        </div>
      </div>
    </div>
  );
}
