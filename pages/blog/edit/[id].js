import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { useSession } from 'next-auth/react';
import { withPageAuth } from '../../../lib/withAuth';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });
import 'react-quill/dist/quill.snow.css';

export default function EditBlogPost() {
  const { data: session } = useSession();
  const router = useRouter();
  const { id } = router.query;

  const [post, setPost] = useState({
    title: '',
    excerpt: '',
    content: '',
    tags: '',
    author: session?.user?.name || '',
    date: new Date().toISOString()
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchPost() {
      if (!id) return;

      try {
        const response = await fetch(`/api/blog/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch post');
        }
        const data = await response.json();
        setPost({
          ...data,
          tags: data.tags ? data.tags.join(', ') : ''
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPost();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const updatedPost = {
        ...post,
        tags: post.tags.split(',').map(tag => tag.trim())
      };

      const response = await fetch(`/api/blog/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedPost),
      });

      if (response.ok) {
        router.push(`/blog/${id}`);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to update blog post');
      }
    } catch (error) {
      setError('An error occurred while updating the post');
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
          <div className="h-12 bg-gray-200 rounded w-32"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 bg-white dark:bg-gray-900 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
        Edit Blog Post
      </h1>
      
      {error && (
        <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-2 text-gray-700 dark:text-gray-300">Title</label>
          <input 
            type="text" 
            value={post.title}
            onChange={(e) => setPost({...post, title: e.target.value})}
            className="w-full p-2 border rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
            required 
          />
        </div>

        <div>
          <label className="block mb-2 text-gray-700 dark:text-gray-300">Excerpt</label>
          <textarea 
            value={post.excerpt}
            onChange={(e) => setPost({...post, excerpt: e.target.value})}
            className="w-full p-2 border rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
            required 
          />
        </div>

        <div>
          <label className="block mb-2 text-gray-700 dark:text-gray-300">Content</label>
          <ReactQuill 
            value={post.content}
            onChange={(value) => setPost({...post, content: value})}
            modules={{
              toolbar: [
                [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                ['link', 'image'],
                ['clean']
              ]
            }}
            className="h-64 mb-12 bg-white dark:bg-gray-800"
            theme="snow"
          />
        </div>

        <div>
          <label className="block mb-2 text-gray-700 dark:text-gray-300">Tags (comma-separated)</label>
          <input 
            type="text" 
            value={post.tags}
            onChange={(e) => setPost({...post, tags: e.target.value})}
            className="w-full p-2 border rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
            placeholder="ayurveda, health, wellness"
          />
        </div>

        <button 
          type="submit" 
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Update Post
        </button>
      </form>
    </div>
  );
}

export const getServerSideProps = withPageAuth(null, ['practitioner']);