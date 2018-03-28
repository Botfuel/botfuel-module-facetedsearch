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
const { Logger, PromptDialog } = require('botfuel-dialog');

const logger = Logger('SearchDialog');
/**
 * @extends PromptDialog
 */
class SearchDialog extends PromptDialog {
  constructor(config, brain, parameters) {
    logger.debug('constructor');
    super(config, brain, parameters);
    this.db = parameters.db;
    this.query = {};
    this.nextQuestionFacet = null;
  }

  /**
   * Tranlate matched entities into query to get hits corresponding to matched entities
   * @param {Object} matchedEntities
   */
  buildQueryFromMatchedEntities(matchedEntities) {
    // build query from matched entities
    const query = Object.keys(matchedEntities).reduce((obj, key) => {
      const entity = matchedEntities[key];
      if (entity && entity.values.length > 0 && entity.values[0].value !== undefined) {
        return Object.assign({ [key]: entity.values[0].value }, obj);
      }
      return obj;
    }, {});

    return query;
  }

  /** @inheritDoc */
  computeEntities(
    candidates,
    parameters,
    previouslyMatchedEntities = {},
  ) {
    let { matchedEntities, missingEntities } = super.computeEntities( // eslint-disable-line prefer-const
      candidates,
      parameters,
      previouslyMatchedEntities,
    );

    const query = this.buildQueryFromMatchedEntities(matchedEntities);
    this.query = query;
    const facets = Object.keys(missingEntities);
    const deducedFacets = this.db.getDeducedFacets(facets, query);
    missingEntities = _.omit(missingEntities, deducedFacets);
    logger.debug('computeEntities: result', {
      matchedEntities,
      missingEntities,
    });

    this.nextQuestionFacet = this.computeNextQuestionFacet(
      matchedEntities,
      missingEntities,
      parameters,
    );

    return { matchedEntities, missingEntities };
  }

  /**
   * Compute the facet which should to be asked based on the current query
   * - if there are missing entity with priority > 0 ==> prioritize this
   * - otherwise return facet based on strategy
   */
  computeNextQuestionFacet(matchedEntities, missingEntities, parameters) {
    const missingEntityNames = Object.keys(missingEntities);
    if (missingEntityNames.length === 0) {
      return null;
    }

    const { facet, valueCounts } = this.db.selectFacetMinMaxStrategy(
      missingEntityNames,
      this.query,
    ) || { facet: undefined, count: undefined };

    const highPriorityMissingEntites = missingEntityNames.filter(key => missingEntities[key].priority && missingEntities[key].priority > 0);
    const nextQuestionFacet = highPriorityMissingEntites.length > 0 ? highPriorityMissingEntites[0] : facet;
    logger.debug('computeNextQuestionFacet:', nextQuestionFacet);
    return nextQuestionFacet;
  }

  /**
   * Compute the next question facet (enitity to be asked) if there is any
   * Otherwise return the data corresponding to user input (query)
   * return: {Object} extra data to be passed to SearchView
   */

  async dialogWillDisplay(userMessage, dialogData) {
    logger.debug('dialogWillDisplay');
    const { nextQuestionFacet } = this;
    const userId = userMessage.user;

    if (!nextQuestionFacet) {
      const foundData = this.db.getHits(this.query);
      return { nextQuestionFacet, foundData };
    }

    // return next facet and all the value-counts for that facet
    // search view can show available values as a guide for user
    return {
      nextQuestionFacet,
      valueCounts: this.db.getFacetValueCounts([nextQuestionFacet], this.query)[
        nextQuestionFacet
      ],
    };
  }
}

module.exports = SearchDialog;
