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
const { Logger } = require('botfuel-dialog');
const FacetDb = require('./facet-db');

const logger = Logger('MongoDb');
/**
 * MongoFacetDb for faceted search
 */
class MongoFacetDb extends FacetDb {
  /**
   * @constructor
   * @param {String} uri - connection string
   * @param {String} database - collection name
   * @param {String} collection - collection name
   * @param {Object} metadata - object providing the filter function and the done condition
   * Metadata must have filter and done function:
   * metadata = {
   *  filter: (query) => mongodb query
   *  done: (query) => boolean
   * }
   * - The query is an object {facet: value}
   * - The filter is used for to select rows from data.
   * - The done function will specify if the current query is enough to return data to user
   * i.e stop asking for more information. For example when returned data for that query
   * have size < 3.
   */
  constructor(uri, database, collection, metadata) {
    super();

    logger.debug('constructor');

    this.uri = uri;
    this.database = database;
    this.collection = collection;
    this.metadata = metadata;
  }

  /**
   * Get collection
   * @returns {Object} MongoDb collection
   */
  getCollection = async () => {
    if (!this.client) {
      this.client = await MongoClient.connect(this.uri);
      this.db = this.client.db(this.database);
    }
    return this.db.collection(this.collection);
  };
  /* eslint-disable require-jsdoc */
  // single value (non array) facet with specified value
  static EQUAL(facet, value) {
    return { [facet]: value };
  }

  // array type facet that contains value
  static IN(facet, value) {
    return { [facet]: value };
  }
  /* eslint-enable require-jsdoc */

  /**
   * Default filter which builds the mongodb query for each facet separatedly.
   * @param {Object} facetFilters filters for each factet. Example: MongoFacetDb.EQUAL
   * @returns {Function} the filter function
   */
  static DEFAULTFILTER(facetFilters) {
    return (query) => {
      let mongoQuery = {};
      const facets = Object.keys(query);
      facets.forEach((facet) => {
        mongoQuery = Object.assign(facetFilters[facet](facet, query[facet]), mongoQuery);
      });

      return mongoQuery;
    };
  }

  /**
   * Returns the hits (rows) corresponding to a query.
   * @param {Object} query - an object mapping facet names to values
   * @returns {Object[]} the hits
   */
  async getHits(query = {}) {
    logger.debug('getHits', query);
    const mongoQuery = this.metadata.filter(query);
    const collection = await this.getCollection();
    return collection.find(mongoQuery, { fields: { _id: 0 } }).toArray();
  }

  /**
   * Returns a boolean indicating if the search is done.
   * @param {Object[]} query - the current query
   * @returns {boolean}
   */
  async done(query = {}) {
    logger.debug('done', query);
    if (!this.metadata.done) {
      return false;
    }
    return this.metadata.done(query);
  }

  /** @inheritdoc */
  async getValueCountByFacet(facets, query) {
    logger.debug('getFacetValueCardinal', facets);
    const filter = this.metadata.filter(query);

    let facetQuery = {};
    facets.forEach((facet) => {
      facetQuery = Object.assign(
        {
          [facet]: [
            {
              $group: {
                _id: `$${facet}`,
              },
            },
            {
              $project: {
                _id: 0,
                value: '$_id',
              },
            },
          ],
        },
        facetQuery,
      );
    });

    const collection = await this.getCollection();
    const agg = await collection.aggregate([{ $match: filter }, { $facet: facetQuery }]).toArray();

    const result = {};
    facets.forEach((facet) => {
      result[facet] = agg[0][facet].filter(o => o.value !== '').length;
    });

    return result;
  }

  /** @inheritdoc */
  async getValuesByFacet(facets, query) {
    logger.debug('getFacetValueCounts', facets);
    const filter = this.metadata.filter(query);
    let facetQuery = {};
    facets.forEach((facet) => {
      facetQuery = Object.assign(
        {
          [facet]: [
            {
              $group: {
                _id: `$${facet}`,
                count: { $sum: 1 },
              },
            },
            {
              $sort: { count: -1 },
            },
            {
              $project: {
                _id: 0,
                value: '$_id',
                count: 1,
              },
            },
          ],
        },
        facetQuery,
      );
    });

    const collection = await this.getCollection();
    const agg = await collection.aggregate([{ $match: filter }, { $facet: facetQuery }]).toArray();

    const result = agg.reduce((obj, elem) => Object.assign(elem, obj), {});

    return result;
  }
}

module.exports = MongoFacetDb;
