import { useState } from 'react';
import { Search, CheckCircle, XCircle, Loader2, MapPin, Clock, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

interface CoverageResult {
  success: boolean;
  covered?: boolean;
  cep?: string;
  prazo?: number | null;
  valor?: number | null;
  message?: string;
  error?: string;
}

export const CepChecker = () => {
  const [cep, setCep] = useState('');
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<CoverageResult | null>(null);

  const formatCep = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 5) return digits;
    return `${digits.slice(0, 5)}-${digits.slice(5, 8)}`;
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCep(e.target.value);
    setCep(formatted);
    setResult(null);
  };

  const checkCoverage = async () => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) {
      setResult({
        success: false,
        error: 'CEP deve conter 8 dígitos',
      });
      return;
    }

    setChecking(true);
    setResult(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/j3-check-coverage?cep=${cleanCep}`,
        {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
        }
      );

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Erro ao verificar cobertura:', error);
      setResult({
        success: false,
        error: 'Erro ao consultar cobertura. Tente novamente.',
      });
    } finally {
      setChecking(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      checkCoverage();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Label htmlFor="cep-check">CEP de destino</Label>
          <div className="flex gap-2 mt-1.5">
            <Input
              id="cep-check"
              placeholder="00000-000"
              value={cep}
              onChange={handleCepChange}
              onKeyDown={handleKeyDown}
              maxLength={9}
              className="text-lg"
            />
            <Button onClick={checkCoverage} disabled={checking || cep.replace(/\D/g, '').length !== 8}>
              {checking ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              <span className="ml-2 hidden sm:inline">Consultar</span>
            </Button>
          </div>
        </div>
      </div>

      {result && (
        <Card className={`border-2 ${
          result.success && result.covered 
            ? 'border-green-500 bg-green-50 dark:bg-green-950/30' 
            : result.success && result.covered === false
            ? 'border-red-500 bg-red-50 dark:bg-red-950/30'
            : 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/30'
        }`}>
          <CardContent className="pt-6">
            {result.success && result.covered !== undefined ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  {result.covered ? (
                    <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                  ) : (
                    <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                  )}
                  <div>
                    <p className={`text-lg font-semibold ${
                      result.covered 
                        ? 'text-green-800 dark:text-green-200' 
                        : 'text-red-800 dark:text-red-200'
                    }`}>
                      {result.covered ? 'Entrega Disponível' : 'CEP Não Atendido'}
                    </p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      CEP: {result.cep}
                    </p>
                  </div>
                </div>

                {result.covered && (
                  <div className="flex flex-wrap gap-3 pt-2">
                    {result.prazo && (
                      <Badge variant="secondary" className="text-sm py-1.5 px-3">
                        <Clock className="h-3.5 w-3.5 mr-1.5" />
                        {result.prazo} dias úteis
                      </Badge>
                    )}
                    {result.valor && (
                      <Badge variant="secondary" className="text-sm py-1.5 px-3">
                        <DollarSign className="h-3.5 w-3.5 mr-1.5" />
                        R$ {result.valor.toFixed(2).replace('.', ',')}
                      </Badge>
                    )}
                  </div>
                )}

                {!result.covered && (
                  <p className="text-sm text-red-700 dark:text-red-300">
                    Este CEP está fora da área de cobertura da J3/Tracken. 
                    Não é possível realizar entregas nesta região.
                  </p>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <XCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                <p className="text-yellow-800 dark:text-yellow-200">
                  {result.error || 'Erro ao consultar cobertura'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="text-sm text-muted-foreground">
        <p>
          Consulte se um CEP está dentro da área de entrega da J3/Tracken antes de criar um pedido.
        </p>
      </div>
    </div>
  );
};
