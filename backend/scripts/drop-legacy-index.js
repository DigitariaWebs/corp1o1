require('dotenv').config();
const { MongoClient } = require('mongodb');

(async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/sokol';
  const dbNameMatch = uri.match(/\/([^\/?]+)(\?|$)/);
  const dbName = (dbNameMatch && dbNameMatch[1]) || 'sokol';
  const client = new MongoClient(uri, { useUnifiedTopology: true });
  try {
    await client.connect();
    const db = client.db(dbName);
    const coll = db.collection('assessments');
    const indexes = await coll.indexes();
    console.log('Existing indexes:', indexes.map(i => i.name));
    for (const idx of indexes) {
      if (idx.key && idx.key['questions.questionId'] === 1) {
        try {
          await coll.dropIndex(idx.name);
          console.log('Dropped index', idx.name);
        } catch (e) {
          console.error('Drop failed', idx.name, e.message);
        }
      }
    }
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await client.close();
  }
})();
