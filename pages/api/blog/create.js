import { connectDB } from '../../../lib/mongodb';
import EmbeddingService from '../../../lib/embeddings';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  let connection = null;
  try {
    connection = await connectDB();
    const db = await connection.getDatabase();
    const blogCollection = db.collection('blogposts');
    const usersCollection = db.collection('users');
    const embeddingsCollection = db.collection('blog_embeddings');

    const newPost = req.body;

    // Validate input
    if (!newPost.title || !newPost.content || !newPost.author) {
      return res.status(400).json({ message: 'Title, content and author are required' });
    }

    // Find the author's ID and verify they are a practitioner
    const author = await usersCollection.findOne({
      name: newPost.author,
      role: 'practitioner'
    });

    if (!author) {
      return res.status(400).json({ 
        message: 'Author must be a registered practitioner' 
      });
    }

    // Add author's ID to the post
    newPost.authorId = author._id;

    // Generate embedding
    const embeddingText = `${newPost.title} ${newPost.content}`;
    const embedding = await EmbeddingService.generateEmbedding(embeddingText);

    // Insert the blog post
    const postResult = await blogCollection.insertOne(newPost);

    // Store the embedding with author metadata
    await embeddingsCollection.insertOne({
      postId: postResult.insertedId,
      text: embeddingText,
      embedding: embedding,
      metadata: {
        title: newPost.title,
        author: newPost.author,
        authorId: newPost.authorId,
        date: newPost.date,
        tags: newPost.tags
      }
    });

    res.status(201).json({
      message: 'Blog post created successfully',
      postId: postResult.insertedId
    });
  } catch (error) {
    console.error('Error creating blog post:', error);
    res.status(500).json({ 
      message: 'Failed to create blog post',
      error: error.message 
    });
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}