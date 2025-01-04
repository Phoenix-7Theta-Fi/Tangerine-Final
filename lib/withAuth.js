import { getToken } from 'next-auth/jwt';

export function withAuth(handler, allowedRoles = []) {
  return async (req, res) => {
    try {
      const token = await getToken({ req });
      console.log('Auth Token:', token ? 'Present' : 'Missing', 'Roles:', allowedRoles);

      if (!token) {
        return res.status(401).json({ 
          success: false,
          message: 'Unauthorized: No authentication token found' 
        });
      }

      // Assign token data to req.user for use in handler
      req.user = {
        id: token.id || token.sub,
        email: token.email,
        role: token.role,
        name: token.name
      };

      // Ensure allowedRoles is an array and token.role exists
      if (!Array.isArray(allowedRoles) || !token.role) {
        console.log('Role validation failed:', { allowedRoles, tokenRole: token.role });
        return res.status(403).json({ 
          success: false,
          message: 'Forbidden: Invalid role configuration' 
        });
      }

      // Check if user role is allowed (skip check if no roles specified)
      if (allowedRoles.length > 0 && !allowedRoles.includes(token.role)) {
        console.log('Role access denied:', { userRole: token.role, allowedRoles });
        return res.status(403).json({ 
          success: false,
          message: 'Forbidden: Insufficient permissions' 
        });
      }

      return handler(req, res);
    } catch (error) {
      console.error('Authentication Error:', error);
      return res.status(500).json({ 
        success: false,
        message: 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };
}

export function withPageAuth(getServerSidePropsFunc, allowedRoles = []) {
  return async (context) => {
    try {
      const token = await getToken(context);

      if (!token) {
        return {
          redirect: {
            destination: '/',
            permanent: false,
          },
        };
      }

      // Ensure allowedRoles is an array and token.role exists
      if (!Array.isArray(allowedRoles) || !token.role) {
        return {
          redirect: {
            destination: '/unauthorized',
            permanent: false,
          },
        };
      }

      // Check if user role is allowed
      if (allowedRoles.length > 0 && !allowedRoles.includes(token.role)) {
        return {
          redirect: {
            destination: '/unauthorized',
            permanent: false,
          },
        };
      }

      if (getServerSidePropsFunc) {
        return await getServerSidePropsFunc(context);
      }

      return { props: {} };
    } catch (error) {
      console.error('Page Authentication Error:', error);
      return {
        redirect: {
          destination: '/error',
          permanent: false,
        },
      };
    }
  };
}