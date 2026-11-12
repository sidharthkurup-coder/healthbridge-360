import Link from 'next/link';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 mb-4">
        <AlertCircle className="w-10 h-10 text-amber-600 mx-auto" />
      </div>
      <h1 className="text-3xl font-bold text-navy-950">Page Not Found</h1>
      <p className="text-sm text-slate-600 mt-2 max-w-md">
        The requested resource or page does not exist on the Kantheru community platform.
      </p>
      <div className="mt-6">
        <Link href="/">
          <Button variant="primary" icon={<ArrowLeft className="w-4 h-4" />}>
            Return to Homepage
          </Button>
        </Link>
      </div>
    </div>
  );
}
