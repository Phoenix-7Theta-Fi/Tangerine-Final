import { connectDB } from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';
import EmbeddingService from '../../../lib/embeddings';

export default async function handler(req, res) {
  let connection = null;
  try {
    connection = await connectDB();
    const db = await connection.getDatabase();
    const blogCollection = db.collection('blogposts');
    const embeddingsCollection = db.collection('blog_embeddings');

    const { id } = req.query;

    switch(req.method) {
      case 'GET': {
        const post = await blogCollection.findOne({ _id: new ObjectId(id) });
        if (!post) {
          return res.status(404).json({ message: 'Post not found' });
        }
        return res.status(200).json(post);
      }

      case 'PUT': {
        const updatedPost = req.body;

        // Validate input
        if (!updatedPost.title || !updatedPost.content) {
          return res.status(400).json({ message: 'Title and content are required' });
        }

        // Remove immutable fields
        const { _id, createdAt, ...updateData } = updatedPost;

        // Generate new embedding
        const embeddingText = `${updateData.title} ${updateData.content}`;
        const embedding = await EmbeddingService.generateEmbedding(embeddingText);

        // Update blog post
        const result = await blogCollection.updateOne(
          { _id: new ObjectId(id) },
          { 
            $set: {
              ...updateData,
              updatedAt: new Date()
            }
          }
        );

        if (result.matchedCount === 0) {
          return res.status(404).json({ message: 'Post not found' });
        }

        // Update embedding
        await embeddingsCollection.updateOne(
          { postId: new ObjectId(id) },
          { $set: { embedding } },
          { upsert: true }
        );

        return res.status(200).json({ 
          message: 'Post updated successfully',
          updatedPost: {
            ...updateData,
            _id: id,
            updatedAt: new Date()
          }
        });
      }

      default:
        return res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Blog API Error:', error);
    return res.status(500).json({ 
      message: 'Internal server error', 
      error: error.message 
    });
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}