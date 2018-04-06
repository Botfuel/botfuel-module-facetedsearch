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

/* eslint no-unused-vars:off */

const _ = require('lodash');
const { Logger, MissingImplementationError } = require('botfuel-dialog');

const logger = Logger('FacetDb');
/**
 * Abstract class for FacetDb.
 */
class FacetDb {
  /**
   * Returns a boolean indicating if the search is done.
   * @param {Object[]} query - the current query for which we want facet information
   * @returns {boolean} - a boolean indicating if the search is done
   */
  async done() {
    throw new MissingImplementationError();
  }

  /**
   * Returns the hits (rows) corresponding to a query.
   * @param {Object} query - an object mapping facet names to values
   * @returns {Object[]} the hits
   */
  async getHits(query = {}) {
    throw new MissingImplementationError();
  }

  /**
   * In the data returned by query, counts the number of different values for each facet.
   * @param {String[]} facets - an array of facets we want to get the value count
   * @param {Object[]} query - the current query for which we want facet information
   * @returns {Object} - an object mapping each facet to the count
   *
   */
  async getValueCountByFacet(facets, query) {
    throw new MissingImplementationError();
  }

  /**
   * In the data returned by query, for each facet, for each value, count the number of rows.
   * @param {String[]} facets - an array of facets for which we want to get the value count
   * @param {Object[]} query - the current query for which we want facet information
   * @returns {Object[]} - an object mapping each facet to an array of {value, count}
   *
   */
  async getValuesByFacet(facets, query) {
    throw new MissingImplementationError();
  }

  /**
   * Returns the deduced facets (when facetCount = 0 or 1).
   * @param {String[]} facets - an array of facets
   * @param {Object[]} query - the current query for which we want facet information
   * @returns {String[]} the answered facets
   */
  async getDeducedFacets(facets, query) {
    logger.debug('getDeducedFacets:', facets);
    const facetCardinals = await this.getValueCountByFacet(facets, query);
    return facets.filter(facet => facetCardinals[facet] <= 1);
  }

  /**
   * Selects the next question applying MinMax strategy (optimizing the worst case).
   * @param {String[]} facets - an array of facets
   * @param {Object[]} query - the current query for which we want facet information
   * @returns {String} the answered facet
   */
  async selectFacetWithMinMaxStrategy(facets, query) {
    logger.debug('selectFacetMinMaxStrategy', facets);
    const values = await this.getValuesByFacet(facets, query);
    const facetCounts = facets.reduce((obj, facet) => {
      obj.push({
        facet,
        count: _.maxBy(values[facet], 'count').count,
      });
      return obj;
    }, []);
    return _.minBy(facetCounts, 'count').facet;
  }
}

module.exports = FacetDb;
