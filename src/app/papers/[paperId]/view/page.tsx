import { PdfViewerPage } from '@/components/pdf-viewer-page';

export default function PaperViewPage({
  params,
}: {
  params: Promise<{ paperId: string }>;
}) {
  return <PdfViewerPage params={params} />;
}
