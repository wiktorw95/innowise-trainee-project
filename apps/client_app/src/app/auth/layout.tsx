export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4 py-8">
      <div className="w-full max-w-[350px] flex flex-col gap-3">{children}</div>
    </div>
  );
}
