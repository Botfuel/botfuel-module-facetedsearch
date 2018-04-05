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

const _ = require('lodash');
const { Logger } = require('botfuel-dialog');
const FacetDb = require('./facet-db');

const logger = Logger('PlainFacetDb');
/**
 * An in-memory implementation of FacetDb.
 */
class PlainFacetDb extends FacetDb {
  /**
   * @constructor
   * @param {Object[]} data - data
   * @param {Object} metadata - object providing the filter function and the done condition:
   * {
   *  filter: (query, row) => boolean
   *  done: (query) => boolean
   * }
   * where:
   * - filter is used for to select rows from data
   * - done indicates if the search has returned a set of results which is small enough
   */
  constructor(data, metadata) {
    logger.debug('constructor');
    super();
    this.data = data;
    this.metadata = metadata;
  }

  /* eslint-disable require-jsdoc */
  static EQUAL(value, param) {
    return value === param;
  }
  static IN(value, param) {
    return param && param.includes(value);
  }
  static BETWEEN(value, param) {
    return param && value >= param[0] && value <= param[1];
  }
  /* eslint-enable require-jsdoc */

  /**
   * Checks that all conditions on each facet are met.
   * @param {Object} facetFilters filters for each facet (example: PlainFacetDb.EQUAL)
   * @returns {Function} the filter function
   */
  static DEFAULTFILTER(facetFilters) {
    return (query, row) => {
      let result = true;
      _.forEach(Object.keys(query), (key) => {
        if (!facetFilters[key](query[key], row[key])) {
          result = false;
          return false;
        }
        return true;
      });

      return result;
    };
  }

  /**
   * Returns the hits (rows) corresponding to a query.
   * @param {Object} query - an object mapping facet names to values
   * @returns {Object[]} the hits
   */
  getHits(query = {}) {
    logger.debug('getHits', query);
    if (query === undefined || query === {}) {
      return this.data;
    }
    return this.data.filter(row => this.metadata.filter(query, row));
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
    const hits = this.getHits(query);
    return this.metadata.done(hits);
  }

  /** @inheritdoc */
  async getValueCountByFacet(facets, query) {
    logger.debug('getValueCountByFacet', facets);
    const hits = this.getHits(query);
    const result = facets.reduce((obj, facet) => {
      const values = _.without(_.uniq(hits.map(row => row[facet])), undefined);
      return Object.assign({ [facet]: values.length }, obj);
    }, {});
    logger.debug('getValueCountByFacet', result);
    return result;
  }

  /** @inheritdoc */
  async getValuesByFacet(facets, query) {
    logger.debug('getValuesByFacet', facets);
    const hits = this.getHits(query);
    const result = facets.reduce((map, facet) => {
      const valueHits = _.groupBy(hits, row => row[facet]);
      const valueCounts = Object.keys(valueHits).reduce((arr, value) => {
        arr.push({ value, count: valueHits[value].length });
        return arr;
      }, []);
      return Object.assign({ [facet]: valueCounts }, map);
    }, {});
    logger.debug('getValuesByFacet', result);
    return result;
  }
}

module.exports = PlainFacetDb;
