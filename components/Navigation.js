import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';

export default function Navigation() {
  const { data: session } = useSession();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/');
  };

  // Common navigation items
  const commonLinks = [
    { href: '/blog', label: 'Blog', roles: ['user', 'practitioner'] },
    { href: '/ai-chat', label: 'AI Assistant', roles: ['user', 'practitioner'] },
    // New link for practitioners page
    { href: '/practitioners', label: 'Practitioners', roles: ['user'] }
  ];

  // Role-specific navigation items
  const practitionerLinks = [
    { href: '/dashboard/practitioner/create', label: 'Create Post', roles: ['practitioner'] },
    { href: '/dashboard/practitioner/profile', label: 'Profile', roles: ['practitioner'] }
  ];

  const userLinks = [
    { href: '/dashboard/user/profile', label: 'Profile', roles: ['user'] }
  ];

  // Filter links based on user role
  const navLinks = commonLinks.concat(
    session?.user?.role === 'practitioner' ? practitionerLinks : userLinks
  );

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-md fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href={
            session?.user?.role === 'practitioner' 
              ? '/dashboard/practitioner'
              : '/dashboard/user'
          } className="flex-shrink-0">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              Tangerine
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 px-3 py-2 rounded-md"
                >
                  {link.label}
                </Link>
              ))}

              {session && (
                <button
                  onClick={handleLogout}
                  className="text-red-500 hover:bg-red-50 px-3 py-2 rounded-md"
                >
                  Logout
                </button>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              type="button"
              className="bg-gray-100 dark:bg-gray-800 inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 block px-3 py-2 rounded-md"
                >
                  {link.label}
                </Link>
              ))}

              {session && (
                <button
                  onClick={handleLogout}
                  className="text-red-500 hover:bg-red-50 block w-full text-left px-3 py-2 rounded-md"
                >
                  Logout
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}