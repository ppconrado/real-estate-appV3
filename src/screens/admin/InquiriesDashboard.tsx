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
import { Mail, Phone, Search, Trash2 } from "lucide-react";

export default function InquiriesDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (loading) return;
    if (user?.role === "admin") return;
    router.push("/");
  }, [loading, router, user]);

  if (!loading && user?.role !== "admin") {
    return null;
  }

  const {
    data: inquiries = [],
    isLoading,
    refetch,
  } = trpc.inquiries.list.useQuery(
    {
      status: statusFilter === "all" ? undefined : (statusFilter as any),
      search: searchQuery || undefined,
    },
    { enabled: user?.role === "admin" }
  );

  const updateStatusMutation = trpc.inquiries.updateStatus.useMutation({
    onSuccess: () => refetch(),
  });

  const deleteMutation = trpc.inquiries.delete.useMutation({
    onSuccess: () => refetch(),
  });

  const stats = useMemo(() => {
    return {
      total: inquiries.length,
      new: inquiries.filter((i: any) => i.status === "new").length,
      contacted: inquiries.filter((i: any) => i.status === "contacted").length,
      closed: inquiries.filter((i: any) => i.status === "closed").length,
    };
  }, [inquiries]);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "contacted":
        return "bg-blue-100 text-blue-800";
      case "closed":
        return "bg-green-100 text-green-800";
      case "new":
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Painel de Consultas de Propriedades
          </h1>
          <p className="text-slate-600">
            Acompanhe e gerencie as consultas de propriedades recebidas
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4">
            <div className="text-sm font-medium text-slate-600 mb-1">Total</div>
            <div className="text-2xl font-bold text-slate-900">
              {stats.total}
            </div>
          </Card>
          <Card className="p-4 border-yellow-200">
            <div className="text-sm font-medium text-yellow-700 mb-1">
              Novas
            </div>
            <div className="text-2xl font-bold text-yellow-900">
              {stats.new}
            </div>
          </Card>
          <Card className="p-4 border-blue-200">
            <div className="text-sm font-medium text-blue-700 mb-1">
              Contatadas
            </div>
            <div className="text-2xl font-bold text-blue-900">
              {stats.contacted}
            </div>
          </Card>
          <Card className="p-4 border-green-200">
            <div className="text-sm font-medium text-green-700 mb-1">
              Fechadas
            </div>
            <div className="text-2xl font-bold text-green-900">
              {stats.closed}
            </div>
          </Card>
        </div>

        <Card className="p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by name, email, phone..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="new">Novas</SelectItem>
                <SelectItem value="contacted">Contatadas</SelectItem>
                <SelectItem value="closed">Fechadas</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
              }}
            >
              Resetar Filtros
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          {isLoading ? (
            <div className="text-center py-12 text-slate-500">
              Carregando consultas...
            </div>
          ) : inquiries.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              Nenhuma consulta encontrada.
            </div>
          ) : (
            <div className="space-y-4">
              {inquiries.map((inquiry: any) => (
                <div
                  key={inquiry.id}
                  className="p-4 border border-slate-200 rounded-lg bg-white"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold text-slate-900">
                        {inquiry.propertyTitle}
                      </h3>
                      <div className="text-sm text-slate-600">
                        <div className="font-medium text-slate-800">
                          {inquiry.name}
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          {inquiry.email}
                        </div>
                        {inquiry.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            {inquiry.phone}
                          </div>
                        )}
                      </div>
                      {inquiry.message && (
                        <p className="text-sm text-slate-700">
                          {inquiry.message}
                        </p>
                      )}
                      <p className="text-xs text-slate-500">
                        Enviado {formatDate(inquiry.createdAt)}
                      </p>
                    </div>

                    <div className="flex flex-col gap-3">
                      <Badge className={statusBadge(inquiry.status)}>
                        {inquiry.status}
                      </Badge>
                      <Select
                        value={inquiry.status}
                        onValueChange={value =>
                          updateStatusMutation.mutate({
                            id: inquiry.id,
                            status: value as any,
                          })
                        }
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">Novas</SelectItem>
                          <SelectItem value="contacted">Contatadas</SelectItem>
                          <SelectItem value="closed">Fechadas</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        className="text-destructive"
                        onClick={() => {
                          if (confirm("Delete this inquiry?")) {
                            deleteMutation.mutate({ id: inquiry.id });
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Deletar
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
