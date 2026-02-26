import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type SettingsSectionProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
};

export function SettingsSection({ title, description, children, className }: SettingsSectionProps) {
  return (
    <Card className={cn('border-border bg-card', className)}>
      <CardHeader className="rounded-t-lg p-4 mb-8 bg-muted/50 border-b border-border">
        <CardTitle className="text-lg">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
