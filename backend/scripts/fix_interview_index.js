const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' }); // Adjust path to .env if needed

async function fixIndex() {
  try {
    const uri = 'mongodb+srv://jvijar:V6CwM4Si4I5XvAjU@cluster0.lvu2ozv.mongodb.net/nasm_database_test?retryWrites=true&w=majority&appName=Cluster0';
    console.log('Connecting to MongoDB at', uri);
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    const collection = mongoose.connection.collection('interviews');
    
    // List indexes
    const indexes = await collection.indexes();
    console.log('Current indexes:', indexes);

    // Drop the unique index on applicationId if it exists
    // The error message said "applicationId_1"
    const indexName = 'applicationId_1';
    const indexExists = indexes.find(idx => idx.name === indexName);

    if (indexExists) {
        console.log(`Dropping index ${indexName}...`);
        try {
            await collection.dropIndex(indexName);
            console.log('Index dropped successfully.');
        } catch (e) {
            console.error('Failed to drop index:', e.message);
        }
    } else {
        console.log('Index applicationId_1 not found.');
    }

    console.log('Done.');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixIndex();
