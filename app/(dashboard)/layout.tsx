import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  const isAdmin = session.user.role === 'admin';

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar isAdmin={isAdmin} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header user={session.user} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
