export default function Main({ children }: React.PropsWithChildren) {
  return (
    <main className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-base px-6">
      {children}
    </main>
  );
}
