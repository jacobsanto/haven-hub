import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Upload, Download, FileText, CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ValidationResult {
  row: number;
  property_slug: string;
  property_name: string | null;
  season_name: string;
  start_date: string;
  end_date: string;
  nightly_rate: number | null;
  price_multiplier: number | null;
  valid: boolean;
  errors: string[];
}

interface ImportResult {
  row: number;
  property_slug: string;
  season_name: string;
  success: boolean;
  error?: string;
}

const CSV_TEMPLATE = `property_slug,season_name,start_date,end_date,nightly_rate,price_multiplier
villa-example,High Season,2026-07-01,2026-08-31,450,
villa-example,Low Season,2026-11-01,2026-12-20,,0.75
santorini-retreat,Peak Season,2026-06-15,2026-09-15,600,`;

export default function AdminSeasonalRatesImport() {
  const { toast } = useToast();
  const [csvContent, setCsvContent] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [validationResults, setValidationResults] = useState<ValidationResult[] | null>(null);
  const [importResults, setImportResults] = useState<ImportResult[] | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFile = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      toast({
        title: 'Invalid File',
        description: 'Please upload a CSV file.',
        variant: 'destructive',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setCsvContent(text);
      setValidationResults(null);
      setImportResults(null);
    };
    reader.readAsText(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'seasonal-rates-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const validateCSV = async () => {
    if (!csvContent.trim()) {
      toast({
        title: 'No Data',
        description: 'Please upload a CSV file first.',
        variant: 'destructive',
      });
      return;
    }

    setIsValidating(true);
    setImportResults(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/seasonal-rates-import`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ action: 'validate', csvContent }),
        }
      );

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Validation failed');
      }

      setValidationResults(result.results);
      
      toast({
        title: 'Validation Complete',
        description: `${result.validRows} valid, ${result.invalidRows} invalid out of ${result.totalRows} rows.`,
        variant: result.invalidRows > 0 ? 'destructive' : 'default',
      });
    } catch (error) {
      toast({
        title: 'Validation Failed',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsValidating(false);
    }
  };

  const importRates = async () => {
    if (!csvContent.trim()) return;

    setIsImporting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/seasonal-rates-import`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ action: 'import', csvContent }),
        }
      );

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Import failed');
      }

      setImportResults(result.results);
      setValidationResults(null);
      
      toast({
        title: result.failedCount === 0 ? 'Import Successful' : 'Import Completed with Errors',
        description: `${result.successCount} imported, ${result.failedCount} failed.`,
        variant: result.failedCount > 0 ? 'destructive' : 'default',
      });

      if (result.failedCount === 0) {
        setCsvContent('');
      }
    } catch (error) {
      toast({
        title: 'Import Failed',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
    }
  };

  const validCount = validationResults?.filter(r => r.valid).length || 0;
  const invalidCount = validationResults?.filter(r => !r.valid).length || 0;

  return (
    <AdminGuard>
    <AdminLayout>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold tracking-tight">Import Seasonal Rates</h1>
          <p className="text-muted-foreground">
            Bulk import seasonal rates from CSV files
          </p>
        </motion.div>

        {/* Instructions Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">CSV Format</CardTitle>
            <CardDescription>
              Your CSV must include these columns: property_slug, season_name, start_date, end_date, and either nightly_rate OR price_multiplier
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={downloadTemplate}>
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </Button>
            </div>
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-2">Column descriptions:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li><strong>property_slug</strong> - The URL slug of the property (e.g., "villa-amersa")</li>
                <li><strong>season_name</strong> - Name for this season (e.g., "High Season")</li>
                <li><strong>start_date</strong> - Season start date in YYYY-MM-DD format</li>
                <li><strong>end_date</strong> - Season end date in YYYY-MM-DD format</li>
                <li><strong>nightly_rate</strong> - Fixed nightly rate for this season (leave empty if using multiplier)</li>
                <li><strong>price_multiplier</strong> - Multiplier applied to base price (e.g., 0.75 for 25% off, leave empty if using fixed rate)</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Upload Card */}
        <Card>
          <CardHeader>
            <CardTitle>Upload CSV</CardTitle>
            <CardDescription>
              Drag and drop your CSV file or click to browse
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-muted-foreground/50'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                accept=".csv"
                onChange={handleFileInput}
                className="hidden"
                id="csv-upload"
              />
              <label htmlFor="csv-upload" className="cursor-pointer">
                <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {csvContent ? (
                    <span className="text-foreground font-medium flex items-center justify-center gap-2">
                      <FileText className="h-4 w-4" />
                      CSV file loaded ({csvContent.split('\n').length - 1} rows)
                    </span>
                  ) : (
                    'Drop your CSV file here or click to browse'
                  )}
                </p>
              </label>
            </div>

            {csvContent && (
              <div className="mt-4 flex gap-3">
                <Button onClick={validateCSV} disabled={isValidating}>
                  {isValidating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Validate CSV
                </Button>
                <Button
                  onClick={importRates}
                  disabled={isImporting || (validationResults !== null && invalidCount > 0)}
                  variant={validationResults && invalidCount === 0 ? 'default' : 'secondary'}
                >
                  {isImporting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Import {validCount > 0 ? `${validCount} Rates` : 'Rates'}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setCsvContent('');
                    setValidationResults(null);
                    setImportResults(null);
                  }}
                >
                  Clear
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Validation Results */}
        {validationResults && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Validation Results
                <Badge variant={invalidCount > 0 ? 'destructive' : 'default'}>
                  {validCount} valid / {invalidCount} invalid
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {invalidCount > 0 && (
                <Alert variant="destructive" className="mb-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Validation Errors</AlertTitle>
                  <AlertDescription>
                    Fix the errors below before importing. Invalid rows will be skipped.
                  </AlertDescription>
                </Alert>
              )}
              <div className="max-h-[400px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[60px]">Row</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Property</TableHead>
                      <TableHead>Season</TableHead>
                      <TableHead>Dates</TableHead>
                      <TableHead>Rate</TableHead>
                      <TableHead>Issues</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {validationResults.map((result) => (
                      <TableRow key={result.row} className={!result.valid ? 'bg-destructive/5' : ''}>
                        <TableCell className="font-mono text-xs">{result.row}</TableCell>
                        <TableCell>
                          {result.valid ? (
                            <CheckCircle className="h-4 w-4 text-primary" />
                          ) : (
                            <XCircle className="h-4 w-4 text-destructive" />
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{result.property_name || result.property_slug}</div>
                          <div className="text-xs text-muted-foreground">{result.property_slug}</div>
                        </TableCell>
                        <TableCell>{result.season_name}</TableCell>
                        <TableCell className="text-sm">
                          {result.start_date} → {result.end_date}
                        </TableCell>
                        <TableCell>
                          {result.nightly_rate ? (
                            <span>€{result.nightly_rate}/night</span>
                          ) : result.price_multiplier ? (
                            <span>{result.price_multiplier}× base</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {result.errors.length > 0 && (
                            <ul className="text-xs text-destructive list-disc list-inside">
                              {result.errors.map((err, i) => (
                                <li key={i}>{err}</li>
                              ))}
                            </ul>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Import Results */}
        {importResults && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Import Results
                <Badge variant={importResults.some(r => !r.success) ? 'destructive' : 'default'}>
                  {importResults.filter(r => r.success).length} success / {importResults.filter(r => !r.success).length} failed
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-[400px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[60px]">Row</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Property</TableHead>
                      <TableHead>Season</TableHead>
                      <TableHead>Error</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {importResults.map((result) => (
                      <TableRow key={result.row} className={!result.success ? 'bg-destructive/5' : ''}>
                        <TableCell className="font-mono text-xs">{result.row}</TableCell>
                        <TableCell>
                          {result.success ? (
                            <CheckCircle className="h-4 w-4 text-primary" />
                          ) : (
                            <XCircle className="h-4 w-4 text-destructive" />
                          )}
                        </TableCell>
                        <TableCell>{result.property_slug}</TableCell>
                        <TableCell>{result.season_name}</TableCell>
                        <TableCell className="text-sm text-destructive">
                          {result.error || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
    </AdminGuard>
  );
}
