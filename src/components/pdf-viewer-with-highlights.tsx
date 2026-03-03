'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { Worker, Viewer } from '@react-pdf-viewer/core';
import type { Plugin, ViewerState } from '@react-pdf-viewer/core';
import { highlightPlugin } from '@react-pdf-viewer/highlight';
import type {
  RenderHighlightTargetProps,
  RenderHighlightsProps,
  HighlightArea,
} from '@react-pdf-viewer/highlight';
import { zoomPlugin } from '@react-pdf-viewer/zoom';
import { pageNavigationPlugin } from '@react-pdf-viewer/page-navigation';
import { searchPlugin } from '@react-pdf-viewer/search';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/highlight/lib/styles/index.css';
import '@react-pdf-viewer/zoom/lib/styles/index.css';
import '@react-pdf-viewer/page-navigation/lib/styles/index.css';
import '@react-pdf-viewer/search/lib/styles/index.css';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  Highlighter,
  ChevronDown,
} from 'lucide-react';

const PDF_WORKER_URL = `https://unpkg.com/pdfjs-dist@3.11.174/legacy/build/pdf.worker.min.js`;

export const HIGHLIGHT_COLORS = [
  { name: 'Yellow', value: 'rgba(255, 235, 0, 0.45)' },
  { name: 'Green', value: 'rgba(0, 255, 0, 0.35)' },
  { name: 'Pink', value: 'rgba(255, 105, 180, 0.4)' },
  { name: 'Blue', value: 'rgba(100, 149, 237, 0.45)' },
  { name: 'Orange', value: 'rgba(255, 165, 0, 0.45)' },
] as const;

export type HighlightColorValue = (typeof HIGHLIGHT_COLORS)[number]['value'];

export interface SavedHighlight {
  id: string;
  paper_id: string;
  highlighted_text: string;
  explanation?: string | null;
  position: {
    areas?: HighlightArea[];
    color?: string;
  } | null;
  created_at?: string;
}

export type JumpToHighlightArea = (area: HighlightArea) => void;

interface PdfViewerWithHighlightsProps {
  fileUrl: string;
  paperId: string;
  highlights: SavedHighlight[];
  onHighlightAdded?: (highlight: SavedHighlight) => void;
  onAddHighlight: (payload: {
    highlighted_text: string;
    position: { areas: HighlightArea[]; color: string };
  }) => Promise<SavedHighlight>;
  onRemoveHighlight: (highlightId: string) => Promise<void>;
  onPluginReady?: (api: { jumpToHighlightArea: JumpToHighlightArea }) => void;
  savingHighlight?: boolean;
}

/** Deep-copy highlight areas so we don't hold a reference to plugin internals */
function copyAreas(areas: HighlightArea[]): HighlightArea[] {
  return areas.map((a) => ({ ...a }));
}

/** Plugin to capture viewer state (page, scale) and numPages for toolbar */
function createViewerStatePlugin(
  setViewerState: (s: ViewerState | null) => void,
  setNumPages: (n: number) => void
): Plugin {
  return {
    onDocumentLoad: (props: { doc: { numPages: number } }) => {
      setNumPages(props.doc.numPages);
    },
    onViewerStateChange: (state: ViewerState) => {
      setViewerState(state);
      return state;
    },
  };
}

export function PdfViewerWithHighlights({
  fileUrl,
  paperId,
  highlights,
  onHighlightAdded,
  onAddHighlight,
  onRemoveHighlight,
  onPluginReady,
  savingHighlight = false,
}: PdfViewerWithHighlightsProps) {
  const [selectedColor, setSelectedColor] = useState<HighlightColorValue>(HIGHLIGHT_COLORS[0].value);
  const [viewerState, setViewerState] = useState<ViewerState | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [pageInputValue, setPageInputValue] = useState('');

  const statePlugin = useMemo(
    () => createViewerStatePlugin(setViewerState, setNumPages),
    []
  );
  // These plugins use hooks internally — must be called at top level, not inside useMemo
  const zoomPluginInstance = zoomPlugin();
  const pageNavigationPluginInstance = pageNavigationPlugin();
  const searchPluginInstance = searchPlugin();

  const currentPage = viewerState?.pageIndex ?? 0;
  const scale = viewerState?.scale ?? 1;
  const scalePercent = Math.round(scale * 100);

  useEffect(() => {
    setPageInputValue(String(currentPage + 1));
  }, [currentPage]);

  const handlePageInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const n = parseInt(pageInputValue, 10);
    if (!isNaN(n) && n >= 1 && n <= numPages) {
      pageNavigationPluginInstance.jumpToPage(n - 1);
    } else {
      setPageInputValue(String(currentPage + 1));
    }
  };

  const ZOOM_DURATION_MS = 220;
  const smoothZoomTo = useCallback(
    (targetScale: number) => {
      const startScale = scale;
      const startTime = { current: 0 };
      const step = (now: number) => {
        if (startTime.current === 0) startTime.current = now;
        const elapsed = now - startTime.current;
        const t = Math.min(elapsed / ZOOM_DURATION_MS, 1);
        const eased = 1 - (1 - t) * (1 - t);
        const current = startScale + (targetScale - startScale) * eased;
        zoomPluginInstance.zoomTo(current);
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    },
    [scale]
  );
  const zoomIn = () => smoothZoomTo(Math.min(3, scale + 0.15));
  const zoomOut = () => smoothZoomTo(Math.max(0.5, scale - 0.15));

  const renderHighlightTarget = useCallback(
    (props: RenderHighlightTargetProps) => {
      const handleHighlight = () => {
        const text = (props.selectedText || '').trim();
        const areas = props.highlightAreas;
        if (!text || !areas?.length) return;
        const areasCopy = copyAreas(areas);
        const color = selectedColor;
        const cancelFn = props.cancel;
        setTimeout(() => {
          try {
            window.getSelection()?.removeAllRanges();
          } catch {
            // ignore
          }
          try {
            cancelFn();
          } catch {
            // ignore
          }
          onAddHighlight({
            highlighted_text: text,
            position: { areas: areasCopy, color },
          })
            .then((newHighlight) => {
              onHighlightAdded?.(newHighlight);
            })
            .catch(() => {});
        }, 0);
      };

      return (
        <div
          className="flex items-center gap-2 rounded-md border border-border bg-background px-2 py-1.5 shadow-lg"
          style={{
            left: `${props.selectionRegion.left}%`,
            position: 'absolute',
            top: `${props.selectionRegion.top + props.selectionRegion.height}%`,
            transform: 'translate(0, 6px)',
            zIndex: 50,
          }}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1.5 px-2">
                <span
                  className="h-4 w-4 rounded border border-border"
                  style={{ background: selectedColor }}
                />
                <ChevronDown className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {HIGHLIGHT_COLORS.map((c) => (
                <DropdownMenuItem
                  key={c.name}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedColor(c.value);
                  }}
                >
                  <span
                    className="mr-2 h-4 w-4 rounded border border-border"
                    style={{ background: c.value }}
                  />
                  {c.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            size="sm"
            disabled={savingHighlight}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleHighlight();
            }}
          >
            {savingHighlight ? '…' : 'Highlight'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              props.cancel();
            }}
          >
            Cancel
          </Button>
        </div>
      );
    },
    [selectedColor, onAddHighlight, onHighlightAdded, savingHighlight]
  );

  const renderHighlights = useCallback(
    (props: RenderHighlightsProps) => (
      <>
        {highlights
          .filter((h) => h.position?.areas && h.position.areas.length > 0)
          .map((h) =>
            (h.position!.areas!).filter((area) => area.pageIndex === props.pageIndex).map((area, idx) => (
              <div
                key={`${h.id}-${idx}`}
                role="button"
                tabIndex={0}
                title="Click to remove highlight"
                style={{
                  ...props.getCssProperties(area, props.rotation),
                  background: (h.position as { color?: string })?.color ?? HIGHLIGHT_COLORS[0].value,
                  cursor: 'pointer',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveHighlight(h.id);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onRemoveHighlight(h.id);
                  }
                }}
              />
            ))
          )}
      </>
    ),
    [highlights, onRemoveHighlight]
  );

  const highlightPluginInstance = highlightPlugin({
    renderHighlightTarget,
    renderHighlights,
  });

  useEffect(() => {
    if (!onPluginReady || !highlightPluginInstance.jumpToHighlightArea) return;
    onPluginReady({
      jumpToHighlightArea: highlightPluginInstance.jumpToHighlightArea.bind(highlightPluginInstance),
    });
  }, [highlightPluginInstance, onPluginReady]);

  const allPlugins = [
    statePlugin,
    zoomPluginInstance,
    pageNavigationPluginInstance,
    searchPluginInstance,
    highlightPluginInstance,
  ];

  return (
    <Worker workerUrl={PDF_WORKER_URL}>
      <div className="flex h-full flex-col">
        {/* Toolbar */}
        <div className="flex shrink-0 flex-wrap items-center gap-1 border-b bg-muted/50 px-2 py-1.5">
          {/* Zoom */}
          <div className="flex items-center gap-0.5 rounded border border-border/60 bg-background/80">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={zoomOut}
              title="Zoom out"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="min-w-[3rem] px-1.5 text-center text-xs tabular-nums" title="Zoom level">
              {scalePercent}%
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={zoomIn}
              title="Zoom in"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>

          <div className="h-5 w-px bg-border" />

          {/* Page navigation */}
          <div className="flex items-center gap-0.5 rounded border border-border/60 bg-background/80">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => pageNavigationPluginInstance.jumpToPage(0)}
              disabled={numPages === 0}
              title="First page"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => pageNavigationPluginInstance.jumpToPreviousPage()}
              disabled={numPages === 0}
              title="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <form onSubmit={handlePageInputSubmit} className="flex items-center gap-0.5">
              <Input
                type="text"
                inputMode="numeric"
                className="h-8 w-10 rounded-none border-0 text-center text-xs tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                value={pageInputValue}
                onChange={(e) => setPageInputValue(e.target.value)}
                onBlur={() => setPageInputValue(String(currentPage + 1))}
              />
              <span className="px-1 text-xs text-muted-foreground">/ {numPages || '–'}</span>
            </form>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => pageNavigationPluginInstance.jumpToNextPage()}
              disabled={numPages === 0}
              title="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => pageNavigationPluginInstance.jumpToPage(Math.max(0, numPages - 1))}
              disabled={numPages === 0}
              title="Last page"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="h-5 w-px bg-border" />

          {/* Search */}
          <div className="[&_.rpv-search__popover-button]:!h-8 [&_.rpv-search__popover-button]:!rounded [&_.rpv-search__popover-button]:!border [&_.rpv-search__popover-button]:!border-border [&_.rpv-search__popover-button]:!bg-background">
            <searchPluginInstance.ShowSearchPopoverButton />
          </div>

          <div className="h-5 w-px bg-border" />

          {/* Highlight colour dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1.5 px-2">
                <Highlighter className="h-4 w-4" />
                <span
                  className="h-4 w-4 rounded border border-border"
                  style={{ background: selectedColor }}
                />
                <ChevronDown className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                Highlight colour
              </div>
              {HIGHLIGHT_COLORS.map((c) => (
                <DropdownMenuItem
                  key={c.name}
                  onClick={() => setSelectedColor(c.value)}
                >
                  <span
                    className="mr-2 h-4 w-4 rounded border border-border"
                    style={{ background: c.value }}
                  />
                  {c.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <span className="ml-1 hidden text-xs text-muted-foreground sm:inline">
            Select text, then click Highlight in the popup.
          </span>
        </div>

        <div className="min-h-0 flex-1 overflow-auto" style={{ height: '100%' }}>
          <Viewer fileUrl={fileUrl} plugins={allPlugins} />
        </div>
      </div>
    </Worker>
  );
}
