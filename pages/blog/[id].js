import { connectDB } from '../../lib/mongodb';
import { ObjectId } from 'mongodb';
import Link from 'next/link';

export default function BlogPostPage({ post, author }) {
  // If no post is found, show a not found message
  if (!post) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-4xl font-bold mb-4 text-red-600">Post Not Found</h1>
        <p className="text-gray-600">The blog post you are looking for does not exist.</p>
        <Link href="/blog" className="text-blue-500 hover:text-blue-700 mt-4 inline-block">
          Back to Blog
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <article className="prose dark:prose-invert lg:prose-xl">
        {/* Post Header */}
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
          
          <div className="flex items-center text-gray-600 dark:text-gray-400 mb-4">
            {post.noPractitioner ? (
              <span className="mr-4">By {post.author} (Practitioner not assigned)</span>
            ) : author ? (
              <Link 
                href={`/practitioners/${author._id}`}
                className="flex items-center group mr-4 hover:text-blue-600 transition-colors"
              >
                <span className="mr-2">By {post.author}</span>
                <svg 
                  className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors"
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                >
                  <path 
                    fillRule="evenodd" 
                    d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" 
                    clipRule="evenodd" 
                  />
                </svg>
              </Link>
            ) : (
              <span>By {post.author}</span>
            )}
            <span>
              Published on {new Date(post.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
          </div>

          {/* Tags */}
          <div className="flex space-x-2 mb-4">
            {post.tags && post.tags.map((tag) => (
              <span 
                key={tag} 
                className="inline-block bg-gray-200 dark:bg-gray-700 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 dark:text-gray-300"
              >
                #{tag}
              </span>
            ))}
          </div>
        </header>

        {/* Post Excerpt */}
        {post.excerpt && (
          <div className="italic text-xl text-gray-700 dark:text-gray-300 mb-6">
            {post.excerpt}
          </div>
        )}

        {/* Post Content */}
        <div 
          className="blog-content"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </article>

      {/* Navigation */}
      <div className="mt-8 border-t pt-4">
        <Link 
          href="/blog" 
          className="text-blue-500 hover:text-blue-700 inline-flex items-center"
        >
          ← Back to Blog
        </Link>
      </div>
    </div>
  );
}

export async function getStaticPaths() {
  let connection = null;
  try {
    connection = await connectDB();
    const db = await connection.getDatabase();
    const blogCollection = db.collection('blogposts');

    // Fetch only the _id of all posts
    const posts = await blogCollection.find({}, { projection: { _id: 1 } }).toArray();

    // Generate paths for each post
    const paths = posts.map((post) => ({
      params: { id: post._id.toString() },
    }));

    return { 
      paths, 
      fallback: 'blocking'
    };
  } catch (error) {
    console.error("Static Paths Error:", error);
    return { 
      paths: [], 
      fallback: false 
    };
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

export async function getStaticProps({ params }) {
  let connection = null;
  try {
    connection = await connectDB();
    const db = await connection.getDatabase();
    const blogCollection = db.collection('blogposts');
    const usersCollection = db.collection('users');

    // Find the post by its ID
    const post = await blogCollection.findOne({ 
      _id: new ObjectId(params.id) 
    });

    // If no post is found, return notFound
    if (!post) {
      return {
        notFound: true,
      };
    }

    // Find the author if authorId exists and post has a practitioner
    let author = null;
    if (post.authorId && !post.noPractitioner) {
      author = await usersCollection.findOne(
        { _id: new ObjectId(post.authorId) },
        { 
          projection: { 
            name: 1, 
            professionalProfile: {
              specialization: 1,
              professionalTitle: 1
            } 
          } 
        }
      );
    }

    return {
      props: {
        post: JSON.parse(JSON.stringify(post)),
        author: author ? JSON.parse(JSON.stringify(author)) : null
      },
      revalidate: 60
    };
  } catch (error) {
    console.error("Blog Post Fetch Error:", error);
    return {
      notFound: true,
    };
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}