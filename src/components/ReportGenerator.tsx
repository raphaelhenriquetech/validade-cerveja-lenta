import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileDown, Loader2 } from 'lucide-react';
import { generateExpirationReportPDF } from '@/utils/pdfGenerator';
import { useToast } from '@/hooks/use-toast';

interface BeerBatch {
  id: string;
  beer_name: string;
  lot: string;
  quantity: number;
  expiration_date: string;
}

interface ReportGeneratorProps {
  batches: BeerBatch[];
}

export const ReportGenerator = ({ batches }: ReportGeneratorProps) => {
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  const handleGeneratePDF = async () => {
    setGenerating(true);
    
    try {
      // Small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 300));
      
      generateExpirationReportPDF(batches);
      
      toast({
        title: 'PDF gerado com sucesso',
        description: 'O relatório foi baixado para o seu dispositivo',
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: 'Erro ao gerar PDF',
        description: 'Tente novamente em alguns instantes',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Button
      variant="secondary"
      size="icon"
      onClick={handleGeneratePDF}
      disabled={generating}
      className="bg-primary-foreground/10 hover:bg-primary-foreground/20 border-primary-foreground/20 backdrop-blur-sm transition-all hover:scale-105"
      title="Gerar relatório PDF"
    >
      {generating ? (
        <Loader2 className="h-5 w-5 animate-spin text-primary-foreground" />
      ) : (
        <FileDown className="h-5 w-5 text-primary-foreground" />
      )}
    </Button>
  );
};
