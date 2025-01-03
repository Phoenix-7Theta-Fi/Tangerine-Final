import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { signOut } from 'next-auth/react';
import { withPageAuth } from '../../../lib/withAuth';
import Link from 'next/link';

export default function PractitionerDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/');
  };

  if (status === 'loading') {
    return <div className="container mx-auto px-4 py-8 max-w-md">Loading...</div>;
  }

  if (!session) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Session expired
          </h1>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Welcome, {session?.user?.name || 'User'}
        </h1>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          Logout
        </button>
      </div>
      
      <div className="space-y-4">
        <DashboardLink 
          href="/blog" 
          title="View Blog Posts" 
          description="Browse all published blog articles"
        />
        
        <DashboardLink 
          href="/dashboard/practitioner/create" 
          title="Create Blog Post" 
          description="Write and publish new blog articles"
        />
        
        <DashboardLink 
          href="/ai-chat" 
          title="AI Wellness Assistant" 
          description="Interact with AI for wellness insights"
        />
      </div>
    </div>
  );
}

function DashboardLink({ href, title, description }) {
  return (
    <Link 
      href={href} 
      className="block p-4 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-900 dark:text-white"
    >
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      <p className="text-gray-600 dark:text-gray-400">{description}</p>
    </Link>
  );
}

export const getServerSideProps = withPageAuth(null, ['practitioner']);