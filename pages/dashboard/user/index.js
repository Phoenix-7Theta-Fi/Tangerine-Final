import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/router';
import { withPageAuth } from '../../../lib/withAuth';
import Link from 'next/link';

export default function UserDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut({ 
        redirect: false,
        callbackUrl: '/' 
      });
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
      // Optional: Add error handling toast or notification
    }
  };

  // Loading state
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Redirect if no session
  if (status === 'unauthenticated') {
    router.replace('/');
    return null;
  }

  // Ensure session exists before rendering
  if (!session) {
    return null;
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
          title="Blog" 
          description="Read wellness and Ayurvedic articles"
        />
        
        <DashboardLink 
          href="/ai-chat" 
          title="AI Wellness Assistant" 
          description="Get personalized wellness advice"
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

export const getServerSideProps = withPageAuth(null, ['user']);