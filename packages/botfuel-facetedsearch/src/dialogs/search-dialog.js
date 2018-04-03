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
 * @extends SearchDialog
 */
class SearchDialog extends PromptDialog {
  /** @inheritDoc */
  constructor(config, brain, parameters) {
    logger.debug('constructor');
    super(config, brain, parameters);
    this.db = parameters.db;
    this.query = {};
  }

  /**
   * Tranlate matched entities into query to get hits corresponding to matched entities
   * @param {Object} matchedEntities matched entites returned from PromptDialog
   * @returns {Object} query
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

  /**
   * Computes matched and missing entities.
   * @param {Array.<Object[]>} candidates - array of raw entities given by the extractor.
   * @param {Object} dialogEntities - map of entities expected by the dialog: {
   * @param {Object} previouslyMatchedEntities - previouslyMatchedEntities
   * @param {String} previousQuestionEntity - previous question entity
   * @returns {Object} object containing missingEntities and matchedEntities
   */
  async computeEntities(
    candidates,
    dialogEntities,
    previouslyMatchedEntities = {},
    previousQuestionEntity = undefined,
  ) {
    const { matchedEntities, missingEntities } = await super.computeEntities(
      candidates,
      dialogEntities,
      previouslyMatchedEntities,
      previousQuestionEntity,
    );

    this.query = this.buildQueryFromMatchedEntities(matchedEntities);
    // check done condition
    if (this.db.done && (await this.db.done(this.query))) {
      return { matchedEntities, missingEntities: new Map() };
    }

    const facets = Array.from(missingEntities.keys());
    const deducedFacets = await this.db.getDeducedFacets(facets, this.query);
    const reducedMissingEntities = new Map(missingEntities);
    _.forEach(deducedFacets, (facet) => {
      reducedMissingEntities.delete(facet);
    });

    if (reducedMissingEntities.size === 0) {
      return { matchedEntities, missingEntities: new Map() };
    }

    const { facet } = await this.db.selectFacetMinMaxStrategy(
      Array.from(reducedMissingEntities.keys()),
      this.query,
    );

    // Missing entities with priority > 0 are put first, then comes the one computed by the strategy
    const newMissingEntities = new Map([...reducedMissingEntities.entries()].sort((a, b) => {
      const entityA = a[1];
      const entityB = b[1];

      if (entityA.priority === entityB.priority && facet) {
        if (facet === a) {
          return 0;
        }

        if (facet === b) {
          return 1;
        }
      }

      return entityB.priority - entityA.priority;
    }));

    return {
      matchedEntities,
      missingEntities: newMissingEntities,
    };
  }

  /**
   * @inheritDoc
   * Example of dialogWillDisplay that computes the final data (if no more question)
   * or the question facet possible values for user to choose.
   */
  async dialogWillDisplay(userMessage, { missingEntities }) {
    logger.debug('dialogWillDisplay');

    if (missingEntities.size === 0) {
      return { data: this.db.getHits(this.query) };
    }
    // return next facet and all the value-counts for that facet
    // search view can show available values as a guide for user
    const facet = missingEntities.keys().next().value;
    const facetValueCounts = (await this.db.getFacetValueCounts([facet], this.query))[facet];
    return { facetValueCounts };
  }
}

module.exports = SearchDialog;
