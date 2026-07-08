export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-border flex h-14 items-center border-b px-6">
        <span className="text-sm font-semibold">Radar Construtora IA</span>
      </header>
      <div className="flex flex-1">
        <aside className="border-border hidden w-56 border-r p-4 md:block" />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
