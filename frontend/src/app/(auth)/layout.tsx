import { Radar } from "lucide-react";
import Link from "next/link";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="bg-muted/30 flex min-h-screen flex-col items-center justify-center gap-8 p-6">
      <Link href="/" className="flex items-center gap-2">
        <div className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-md">
          <Radar className="size-4" />
        </div>
        <span className="text-lg font-semibold">Radar Construtora IA</span>
      </Link>
      {children}
    </div>
  );
}
