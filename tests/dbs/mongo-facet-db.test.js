/**
 * Copyright (c) 2017 - present, Botfuel (https://www.botfuel.io).
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const { MongoClient } = require('mongodb');
const MongoFacetDb = require('../../src/dbs/mongo-facet-db');

const TEST_URI = 'mongodb://localhost';
const TEST_DATABASE = 'botfuel-mongo-facet-db-test';
const TEST_COLLECTION = 'data';

/* eslint-disable no-console */

const initializeTestDatabase = async () => {
  console.log('initializeTestDatabase');
  let client;
  try {
    // Use connect method to connect to the Server
    client = await MongoClient.connect(TEST_URI);
    client.db(TEST_DATABASE);
  } catch (err) {
    console.log('Problem when initialize mongodb test database');
    console.log(err.stack);
  }

  if (client) {
    client.close();
  }
};

const dropTestDatabase = async () => {
  console.log('dropTestDatabase');
  let client;
  try {
    // Use connect method to connect to the Server
    client = await MongoClient.connect(TEST_URI);
    const db = client.db(TEST_DATABASE);
    await db.dropDatabase();
  } catch (err) {
    console.log('Problem when drop mongodb test database');
    console.log(err.stack);
  }

  if (client) {
    client.close();
  }
};

describe('Mongo Facet Db', () => {
  beforeAll(async (done) => {
    // create test database
    await initializeTestDatabase();
    done();
  });

  afterAll(async (done) => {
    // drop test databse
    await dropTestDatabase();
    done();
  });

  const db = new MongoFacetDb(TEST_URI, TEST_DATABASE, TEST_COLLECTION);

  beforeEach(async (done) => {
    const collection = await db.getCollection();
    await collection.deleteMany({});
    done();
  });

  describe('getHits', () => {
    test('should return the correct nb of hits', async () => {
      const collection = await db.getCollection();
      await collection.insertMany([
        { f1: 1, f2: 1 },
        { f1: 2, f2: 1 },
        { f1: 3, f2: 2 },
        { f1: 4, f2: 2 },
      ]);

      db.metadata = {
        filter: MongoFacetDb.DEFAULTFILTER({
          f1: MongoFacetDb.EQUAL,
          f2: MongoFacetDb.EQUAL,
        }),
      };
      const hits = await db.getHits({ f2: 2 });
      expect(hits).toEqual([{ f1: 3, f2: 2 }, { f1: 4, f2: 2 }]);
    });
  });

  describe('getValueCountByFacet', () => {
    test('should return correct facet value counts', async () => {
      const collection = await db.getCollection();
      await collection.insertMany([
        { f1: 1, f2: 1, f3: 1 },
        { f1: 2, f2: 1, f3: 1 },
        { f1: 3, f2: 2, f3: 1 },
        { f1: 4, f2: 2, f3: 2 },
      ]);

      db.metadata = {
        filter: MongoFacetDb.DEFAULTFILTER({
          f1: MongoFacetDb.EQUAL,
          f2: MongoFacetDb.EQUAL,
          f3: MongoFacetDb.EQUAL,
        }),
      };
      const counts = await db.getValueCountByFacet(['f1', 'f2'], { f3: 1 });
      expect(counts).toEqual({ f1: 3, f2: 2 });
    });
  });

  describe('getValuesByFacet', () => {
    test('should return correct facet values', async () => {
      const collection = await db.getCollection();
      await collection.insertMany([
        { f1: 1, f2: 1, f3: 1 },
        { f1: 2, f2: 1, f3: 1 },
        { f1: 3, f2: 2, f3: 1 },
        { f1: 4, f2: 2, f3: 2 },
      ]);

      db.metadata = {
        filter: MongoFacetDb.DEFAULTFILTER({
          f1: MongoFacetDb.EQUAL,
          f2: MongoFacetDb.EQUAL,
          f3: MongoFacetDb.EQUAL,
        }),
      };
      const counts = await db.getValuesByFacet(['f1', 'f2'], { f3: 1 });
      expect(counts.f1).toContainEqual({ value: 1, count: 1 });
      expect(counts.f1).toContainEqual({ value: 2, count: 1 });
      expect(counts.f1).toContainEqual({ value: 3, count: 1 });
      expect(counts.f2).toContainEqual({ value: 1, count: 2 });
      expect(counts.f2).toContainEqual({ value: 2, count: 1 });
    });
  });
});
