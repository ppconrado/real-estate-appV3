"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Upload,
  Download,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react";
import Header from "@/components/Header";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function BulkImport() {
  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<"csv" | "excel">("csv");
  const [previewData, setPreviewData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [importResults, setImportResults] = useState<any>(null);

  const parseFileMutation = trpc.import.parseFile.useMutation();
  const importPropertiesMutation = trpc.import.importProperties.useMutation();
  const downloadTemplateQuery = trpc.import.downloadTemplate.useQuery();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileType(selectedFile.name.endsWith(".xlsx") ? "excel" : "csv");
      setPreviewData(null);
      setImportResults(null);
    }
  };

  const handleParseFile = async () => {
    if (!file) {
      toast.error("Please select a file");
      return;
    }

    setIsLoading(true);
    try {
      const fileContent = await file.text();
      const result = await parseFileMutation.mutateAsync({
        fileContent,
        fileType,
      });

      setPreviewData(result);
      if (result.invalidRows > 0) {
        toast.warning(`${result.invalidRows} rows have validation errors`);
      } else {
        toast.success("File parsed successfully!");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to parse file"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    if (!previewData?.validData || previewData.validData.length === 0) {
      toast.error("No valid properties to import");
      return;
    }

    setIsLoading(true);
    try {
      const result = await importPropertiesMutation.mutateAsync({
        properties: previewData.validData,
      });

      setImportResults(result);
      toast.success(`Successfully imported ${result.successCount} properties!`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Import failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      if (!downloadTemplateQuery.data) {
        toast.error("Template not loaded");
        return;
      }
      const result = downloadTemplateQuery.data;
      const element = document.createElement("a");
      element.setAttribute(
        "href",
        `data:text/csv;charset=utf-8,${encodeURIComponent(result.content)}`
      );
      element.setAttribute("download", result.filename);
      element.style.display = "none";
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      toast.success("Template downloaded!");
    } catch (error) {
      toast.error("Failed to download template");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <section className="flex-1 py-12">
        <div className="container max-w-4xl">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Bulk Import Properties</h1>
            <p className="text-muted-foreground">
              Import multiple properties at once using CSV or Excel files. You
              can also include image URLs for each property.
            </p>
          </div>

          <div className="grid gap-8">
            {/* Upload Section */}
            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-6">Step 1: Upload File</h2>

              <div className="space-y-4">
                {/* Download Template Button */}
                <div className="flex justify-between items-center p-4 bg-accent/5 rounded-lg border border-accent/20">
                  <div>
                    <p className="font-medium">Need a template?</p>
                    <p className="text-sm text-muted-foreground">
                      Download our CSV template to get started
                    </p>
                  </div>
                  <Button
                    onClick={handleDownloadTemplate}
                    variant="outline"
                    className="gap-2"
                    disabled={downloadTemplateQuery.isLoading}
                  >
                    <Download className="w-4 h-4" />
                    Download Template
                  </Button>
                </div>

                {/* File Input */}
                <div
                  className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-accent transition-colors cursor-pointer"
                  onClick={() => document.getElementById("file-input")?.click()}
                >
                  <input
                    id="file-input"
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="font-medium mb-2">
                    {file ? file.name : "Click to upload or drag and drop"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    CSV or Excel files (XLSX, XLS)
                  </p>
                </div>

                {file && (
                  <div className="flex gap-4">
                    <Button
                      onClick={handleParseFile}
                      disabled={isLoading || parseFileMutation.isPending}
                      className="gap-2"
                    >
                      {isLoading || parseFileMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Parsing...
                        </>
                      ) : (
                        "Parse & Preview"
                      )}
                    </Button>
                    <Button
                      onClick={() => {
                        setFile(null);
                        setPreviewData(null);
                      }}
                      variant="outline"
                    >
                      Clear
                    </Button>
                  </div>
                )}
              </div>
            </Card>

            {/* Preview Section */}
            {previewData && (
              <Card className="p-8">
                <h2 className="text-2xl font-bold mb-6">
                  Step 2: Review Preview
                </h2>

                <div className="space-y-4">
                  {/* Summary */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-card rounded-lg border border-border">
                      <p className="text-sm text-muted-foreground mb-1">
                        Total Rows
                      </p>
                      <p className="text-2xl font-bold">
                        {previewData.totalRows}
                      </p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-sm text-green-700 mb-1">Valid</p>
                      <p className="text-2xl font-bold text-green-700">
                        {previewData.validRows}
                      </p>
                    </div>
                    <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                      <p className="text-sm text-red-700 mb-1">Invalid</p>
                      <p className="text-2xl font-bold text-red-700">
                        {previewData.invalidRows}
                      </p>
                    </div>
                  </div>

                  {/* Errors */}
                  {previewData.errors && previewData.errors.length > 0 && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <p className="font-medium mb-2">Validation Errors:</p>
                        <div className="space-y-1 text-sm max-h-48 overflow-y-auto">
                          {previewData.errors
                            .slice(0, 10)
                            .map((error: any, i: number) => (
                              <div key={i} className="text-xs">
                                <strong>Row {error.rowNumber}:</strong>{" "}
                                {error.errors.join(", ")}
                              </div>
                            ))}
                          {previewData.errors.length > 10 && (
                            <p className="text-xs text-muted-foreground">
                              ... and {previewData.errors.length - 10} more
                              errors
                            </p>
                          )}
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Valid Data Preview */}
                  {previewData.validData &&
                    previewData.validData.length > 0 && (
                      <div>
                        <p className="font-medium mb-3">
                          Valid Properties Preview:
                        </p>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm border-collapse">
                            <thead>
                              <tr className="border-b border-border bg-muted/50">
                                <th className="text-left p-2">Title</th>
                                <th className="text-left p-2">Price</th>
                                <th className="text-left p-2">Type</th>
                                <th className="text-left p-2">Beds</th>
                                <th className="text-left p-2">Baths</th>
                                <th className="text-left p-2">City</th>
                              </tr>
                            </thead>
                            <tbody>
                              {previewData.validData
                                .slice(0, 5)
                                .map((property: any, i: number) => (
                                  <tr
                                    key={i}
                                    className="border-b border-border hover:bg-muted/50"
                                  >
                                    <td className="p-2 truncate">
                                      {property.title}
                                    </td>
                                    <td className="p-2">
                                      ${property.price.toLocaleString()}
                                    </td>
                                    <td className="p-2 capitalize">
                                      {property.propertyType}
                                    </td>
                                    <td className="p-2">{property.bedrooms}</td>
                                    <td className="p-2">
                                      {property.bathrooms}
                                    </td>
                                    <td className="p-2">{property.city}</td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                          {previewData.validData.length > 5 && (
                            <p className="text-xs text-muted-foreground mt-2">
                              ... and {previewData.validData.length - 5} more
                              properties
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                  {/* Import Button */}
                  {previewData.validRows > 0 && (
                    <Button
                      onClick={handleImport}
                      disabled={isLoading || importPropertiesMutation.isPending}
                      className="w-full gap-2 bg-accent hover:bg-accent/90 h-12"
                    >
                      {isLoading || importPropertiesMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Importing...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Import {previewData.validRows} Properties
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </Card>
            )}

            {/* Results Section */}
            {importResults && (
              <Card className="p-8">
                <h2 className="text-2xl font-bold mb-6">Import Results</h2>

                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-card rounded-lg border border-border">
                      <p className="text-sm text-muted-foreground mb-1">
                        Total Imported
                      </p>
                      <p className="text-2xl font-bold">
                        {importResults.totalImported}
                      </p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-sm text-green-700 mb-1">Success</p>
                      <p className="text-2xl font-bold text-green-700">
                        {importResults.successCount}
                      </p>
                    </div>
                    <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                      <p className="text-sm text-red-700 mb-1">Failed</p>
                      <p className="text-2xl font-bold text-red-700">
                        {importResults.failureCount}
                      </p>
                    </div>
                  </div>

                  {/* Results Details */}
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {importResults.results.map((result: any, i: number) => (
                      <div
                        key={i}
                        className={`p-3 rounded-lg border ${
                          result.success
                            ? "bg-green-50 border-green-200"
                            : "bg-red-50 border-red-200"
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {result.success ? (
                            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p
                              className={`font-medium ${result.success ? "text-green-900" : "text-red-900"}`}
                            >
                              {result.property}
                            </p>
                            <p
                              className={`text-sm ${result.success ? "text-green-700" : "text-red-700"}`}
                            >
                              {result.message || result.error}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Reset Button */}
                  <Button
                    onClick={() => {
                      setFile(null);
                      setPreviewData(null);
                      setImportResults(null);
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    Import Another File
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 py-8 mt-auto">
        <div className="container text-center text-sm text-muted-foreground">
          <p>&copy; 2026 RealEstate. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
