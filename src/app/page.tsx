import { RichieWorkspace } from '@/components/richie-workspace';
import { papers, collections } from '@/lib/data';

export default function Home() {
  return (
    <main>
      <RichieWorkspace papers={papers} collections={collections} />
    </main>
  );
}
