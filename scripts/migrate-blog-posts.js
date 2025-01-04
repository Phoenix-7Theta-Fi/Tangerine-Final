require('dotenv').config({ path: '.env.local' });
const { connectDB } = require('../lib/mongodb');
const { ObjectId } = require('mongodb');

async function migrateBlogPosts() {
  const connection = await connectDB();
  
  try {
    const db = await connection.getDatabase();
    const blogCollection = db.collection('blogposts');
    const usersCollection = db.collection('users');

    // Find all posts without authorId
    const postsToMigrate = await blogCollection.find({ 
      authorId: { $exists: false } 
    }).toArray();

    console.log(`Migrating ${postsToMigrate.length} blog posts...`);

    for (const post of postsToMigrate) {
      // Find the user with matching name
      const author = await usersCollection.findOne({ 
        name: post.author,
        role: 'practitioner' 
      });

      if (author) {
        await blogCollection.updateOne(
          { _id: post._id },
          { $set: { authorId: author._id } }
        );
        console.log(`Updated post ${post._id} with authorId ${author._id}`);
      } else {
        // Mark posts without matching practitioners
        await blogCollection.updateOne(
          { _id: post._id },
          { $set: { noPractitioner: true } }
        );
        console.log(`Marked post ${post._id} as having no practitioner`);
      }
    }
  } catch (error) {
    console.error('Migration Error:', error);
  } finally {
    await connection.close();
  }
}

migrateBlogPosts();