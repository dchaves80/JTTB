#!/usr/bin/env node
/**
 * mongocli - Simple MongoDB CLI client for JTTB
 * Usage: mongocli <uri> <query>
 * Example: mongocli "mongodb://user:pass@host:27017/db" "db.users.find({}).limit(10).toArray()"
 */

const { MongoClient } = require('mongodb');

const args = process.argv.slice(2);

if (args.length < 2) {
  console.error('Usage: mongocli <uri> <query>');
  console.error('Example: mongocli "mongodb://localhost:27017/test" "db.users.find({}).toArray()"');
  process.exit(1);
}

const uri = args[0];
const query = args[1];

async function executeQuery(uri, queryStr) {
  const client = new MongoClient(uri);

  try {
    await client.connect();

    // Extract database from URI or use default
    const url = new URL(uri);
    const dbName = url.pathname.slice(1) || 'test';
    const db = client.db(dbName);

    // Parse the query to extract collection and build operation
    // Format: db.collection.operation(args).chain().chain()
    const collectionMatch = queryStr.match(/^db\.(\w+)\./);
    if (!collectionMatch) {
      throw new Error('Query must start with db.<collection>.');
    }

    const collectionName = collectionMatch[1];
    const collection = db.collection(collectionName);

    // Get the rest after db.collection.
    const rest = queryStr.slice(collectionMatch[0].length);

    let result;

    if (rest.startsWith('find(')) {
      const parsed = parseFindQuery(rest);
      let cursor = collection.find(parsed.filter);
      if (parsed.sort) cursor = cursor.sort(parsed.sort);
      if (parsed.limit) cursor = cursor.limit(parsed.limit);
      if (parsed.skip) cursor = cursor.skip(parsed.skip);
      result = await cursor.toArray();

    } else if (rest.startsWith('findOne(')) {
      const argsMatch = rest.match(/^findOne\(([\s\S]*?)\)/);
      const filter = argsMatch ? safeEval(argsMatch[1] || '{}') : {};
      result = await collection.findOne(filter);

    } else if (rest.startsWith('countDocuments(')) {
      const argsMatch = rest.match(/^countDocuments\(([\s\S]*?)\)/);
      const filter = argsMatch ? safeEval(argsMatch[1] || '{}') : {};
      result = await collection.countDocuments(filter);

    } else if (rest.startsWith('aggregate(')) {
      const argsMatch = rest.match(/^aggregate\(([\s\S]*?)\)\.toArray\(\)/);
      const pipeline = argsMatch ? safeEval(argsMatch[1] || '[]') : [];
      result = await collection.aggregate(pipeline).toArray();

    } else if (rest.startsWith('insertOne(')) {
      const argsMatch = rest.match(/^insertOne\(([\s\S]*?)\)/);
      const doc = argsMatch ? safeEval(argsMatch[1] || '{}') : {};
      result = await collection.insertOne(doc);

    } else if (rest.startsWith('updateOne(')) {
      const argsMatch = rest.match(/^updateOne\(([\s\S]*?),\s*([\s\S]*?)\)/);
      if (!argsMatch) throw new Error('updateOne requires filter and update arguments');
      const filter = safeEval(argsMatch[1]);
      const update = safeEval(argsMatch[2]);
      result = await collection.updateOne(filter, update);

    } else if (rest.startsWith('deleteOne(')) {
      const argsMatch = rest.match(/^deleteOne\(([\s\S]*?)\)/);
      const filter = argsMatch ? safeEval(argsMatch[1] || '{}') : {};
      result = await collection.deleteOne(filter);

    } else {
      throw new Error(`Unsupported operation: ${rest.split('(')[0]}`);
    }

    console.log(JSON.stringify(result, null, 2));

  } finally {
    await client.close();
  }
}

function parseFindQuery(rest) {
  const result = { filter: {} };

  // Extract find filter
  const findMatch = rest.match(/^find\(([\s\S]*?)\)/);
  if (findMatch && findMatch[1].trim()) {
    result.filter = safeEval(findMatch[1]);
  }

  // Extract sort
  const sortMatch = rest.match(/\.sort\(([\s\S]*?)\)/);
  if (sortMatch) {
    result.sort = safeEval(sortMatch[1]);
  }

  // Extract limit
  const limitMatch = rest.match(/\.limit\((\d+)\)/);
  if (limitMatch) {
    result.limit = parseInt(limitMatch[1], 10);
  }

  // Extract skip
  const skipMatch = rest.match(/\.skip\((\d+)\)/);
  if (skipMatch) {
    result.skip = parseInt(skipMatch[1], 10);
  }

  return result;
}

function safeEval(str) {
  if (!str || !str.trim()) return {};
  try {
    return new Function(`return (${str})`)();
  } catch (e) {
    throw new Error(`Failed to parse: ${str} - ${e.message}`);
  }
}

executeQuery(uri, query).catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
