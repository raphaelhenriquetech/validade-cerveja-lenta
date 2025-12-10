import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format, differenceInDays, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface BeerBatch {
  id: string;
  beer_name: string;
  lot: string;
  quantity: number;
  expiration_date: string;
  archived?: boolean;
}

interface CategoryData {
  title: string;
  subtitle: string;
  batches: BeerBatch[];
  color: [number, number, number];
}

const getDaysUntilExpiration = (expirationDate: string): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expDate = parseISO(expirationDate);
  return differenceInDays(expDate, today);
};

const categorizeBatches = (batches: BeerBatch[]): CategoryData[] => {
  // Filter out archived batches
  const activeBatches = batches.filter(batch => !batch.archived);
  
  const expired: BeerBatch[] = [];
  const critical: BeerBatch[] = [];
  const attention: BeerBatch[] = [];
  const alert: BeerBatch[] = [];
  const ok: BeerBatch[] = [];

  activeBatches.forEach(batch => {
    const days = getDaysUntilExpiration(batch.expiration_date);
    if (days < 0) {
      expired.push(batch);
    } else if (days <= 7) {
      critical.push(batch);
    } else if (days <= 15) {
      attention.push(batch);
    } else if (days <= 30) {
      alert.push(batch);
    } else {
      ok.push(batch);
    }
  });

  const categories: CategoryData[] = [];

  if (expired.length > 0) {
    categories.push({
      title: 'VENCIDOS',
      subtitle: `${expired.length} lote${expired.length > 1 ? 's' : ''}`,
      batches: expired.sort((a, b) => getDaysUntilExpiration(a.expiration_date) - getDaysUntilExpiration(b.expiration_date)),
      color: [220, 38, 38] // red
    });
  }

  if (critical.length > 0) {
    categories.push({
      title: 'CRÍTICO - até 7 dias',
      subtitle: `${critical.length} lote${critical.length > 1 ? 's' : ''}`,
      batches: critical.sort((a, b) => getDaysUntilExpiration(a.expiration_date) - getDaysUntilExpiration(b.expiration_date)),
      color: [234, 88, 12] // orange
    });
  }

  if (attention.length > 0) {
    categories.push({
      title: 'ATENÇÃO - 8 a 15 dias',
      subtitle: `${attention.length} lote${attention.length > 1 ? 's' : ''}`,
      batches: attention.sort((a, b) => getDaysUntilExpiration(a.expiration_date) - getDaysUntilExpiration(b.expiration_date)),
      color: [202, 138, 4] // yellow/amber
    });
  }

  if (alert.length > 0) {
    categories.push({
      title: 'ALERTA - 16 a 30 dias',
      subtitle: `${alert.length} lote${alert.length > 1 ? 's' : ''}`,
      batches: alert.sort((a, b) => getDaysUntilExpiration(a.expiration_date) - getDaysUntilExpiration(b.expiration_date)),
      color: [37, 99, 235] // blue
    });
  }

  if (ok.length > 0) {
    categories.push({
      title: 'OK - mais de 30 dias',
      subtitle: `${ok.length} lote${ok.length > 1 ? 's' : ''}`,
      batches: ok.sort((a, b) => getDaysUntilExpiration(a.expiration_date) - getDaysUntilExpiration(b.expiration_date)),
      color: [34, 197, 94] // green
    });
  }

  return categories;
};

export const generateExpirationReportPDF = (batches: BeerBatch[]): void => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPosition = 20;

  // Header
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('CERVEJA LENTA', pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 10;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text('Relatório de Controle de Validades', pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 8;
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  const now = format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  doc.text(`Gerado em: ${now}`, pageWidth / 2, yPosition, { align: 'center' });
  
  // Divider line
  yPosition += 8;
  doc.setDrawColor(200, 200, 200);
  doc.line(14, yPosition, pageWidth - 14, yPosition);
  
  // Categorize batches
  const categories = categorizeBatches(batches);
  
  // Summary section
  yPosition += 10;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('RESUMO', 14, yPosition);
  
  yPosition += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const summaryItems = [
    { label: 'Vencidos', count: categories.find(c => c.title === 'VENCIDOS')?.batches.length || 0, color: [220, 38, 38] },
    { label: 'Críticos (até 7 dias)', count: categories.find(c => c.title.includes('CRÍTICO'))?.batches.length || 0, color: [234, 88, 12] },
    { label: 'Atenção (8-15 dias)', count: categories.find(c => c.title.includes('ATENÇÃO'))?.batches.length || 0, color: [202, 138, 4] },
    { label: 'Alerta (16-30 dias)', count: categories.find(c => c.title.includes('ALERTA'))?.batches.length || 0, color: [37, 99, 235] },
    { label: 'OK (mais de 30 dias)', count: categories.find(c => c.title.includes('OK'))?.batches.length || 0, color: [34, 197, 94] },
  ];
  
  summaryItems.forEach(item => {
    doc.setFillColor(item.color[0], item.color[1], item.color[2]);
    doc.circle(18, yPosition - 1.5, 2, 'F');
    doc.setTextColor(0, 0, 0);
    doc.text(`${item.count} lote${item.count !== 1 ? 's' : ''} - ${item.label}`, 24, yPosition);
    yPosition += 6;
  });
  
  // Total geral (only active batches)
  const activeBatchCount = batches.filter(b => !b.archived).length;
  yPosition += 2;
  doc.setFont('helvetica', 'bold');
  doc.text(`Total: ${activeBatchCount} lote${activeBatchCount !== 1 ? 's' : ''} cadastrado${activeBatchCount !== 1 ? 's' : ''}`, 24, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.setFont('helvetica', 'normal');
  
  // Check if we have any data to show
  if (categories.length === 0) {
    yPosition += 10;
    doc.setFontSize(12);
    doc.setTextColor(34, 197, 94);
    doc.text('Nenhum lote cadastrado no sistema!', pageWidth / 2, yPosition, { align: 'center' });
  } else {
    // Tables for each category
    categories.forEach(category => {
      yPosition += 10;
      
      // Check if we need a new page
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      
      // Category header
      doc.setFillColor(category.color[0], category.color[1], category.color[2]);
      doc.rect(14, yPosition - 5, pageWidth - 28, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`${category.title} (${category.subtitle})`, 18, yPosition);
      
      yPosition += 8;
      
      // Table data
      const tableData = category.batches.map(batch => {
        const days = getDaysUntilExpiration(batch.expiration_date);
        const daysText = days < 0 ? `${Math.abs(days)} dias atrás` : `${days} dias`;
        return [
          batch.beer_name,
          batch.lot,
          batch.quantity.toString(),
          format(parseISO(batch.expiration_date), 'dd/MM/yyyy'),
          daysText
        ];
      });
      
      autoTable(doc, {
        startY: yPosition,
        head: [['Cerveja', 'Lote', 'Qtd', 'Validade', 'Dias']],
        body: tableData,
        theme: 'striped',
        headStyles: {
          fillColor: [80, 80, 80],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9
        },
        bodyStyles: {
          fontSize: 9
        },
        columnStyles: {
          0: { cellWidth: 50 },
          1: { cellWidth: 40 },
          2: { cellWidth: 20, halign: 'center' },
          3: { cellWidth: 30, halign: 'center' },
          4: { cellWidth: 35, halign: 'center' }
        },
        margin: { left: 14, right: 14 }
      });
      
      // Get the final Y position after the table
      yPosition = (doc as any).lastAutoTable.finalY + 5;
    });
  }
  
  // Footer on last page
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Página ${i} de ${pageCount} | Cerveja Lenta - Controle de Validades`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }
  
  // Save the PDF
  const fileName = `relatorio-validades-cerveja-lenta-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
  doc.save(fileName);
};
