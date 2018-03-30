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

const SearchDialog = require('../../src/dialogs/search-dialog');
const PlainFacetDb = require('../../src/dbs/plain-facet-db');
const { MemoryBrain } = require('botfuel-dialog');
const path = require('path');

const TEST_CONFIG = {
  adapter: {
    name: 'test',
  },
  componentRoots: [path.resolve(__dirname, '../../src')],
};

const BRAIN_CONFIG = {
  brain: {
    conversationDuration: 86400000, // one day in ms
  },
};

describe('SearchDialog', () => {
  describe('computeEntities', () => {
    const brain = new MemoryBrain(BRAIN_CONFIG);
    const db = new PlainFacetDb(
      [{ f1: 1, f2: 1 }, { f1: 2, f2: 1 }, { f1: 3, f2: 2 }, { f1: 4, f2: 2 }],
      {
        filter: PlainFacetDb.DEFAULTFILTER({
          f1: PlainFacetDb.EQUAL,
          f2: PlainFacetDb.EQUAL,
        }),
      },
    );
    const search = new SearchDialog(TEST_CONFIG, brain, {
      namespace: 'testdialog',
      entities: {},
      db,
    });

    test('return no question entity when no need to ask more', async () => {
      const candidates = [
        {
          dim: 'number',
          values: [{ value: 1, type: 'integer' }],
        },
      ];

      const dialogEntities = {
        f1: {
          dim: 'number',
        },
        f2: {
          dim: 'number',
        },
      };

      const { missingEntities } = await search.computeEntities(
        candidates,
        dialogEntities,
        {},
        'f1',
      );

      expect(missingEntities.size).toEqual(0);
    });

    test('questionEntities should ask priotized entity first', async () => {
      const candidates = [];

      const dialogEntities = {
        f1: {
          dim: 'number',
        },
        f2: {
          dim: 'number',
          priority: 1,
        },
      };

      const { missingEntities } = await search.computeEntities(candidates, dialogEntities, {});

      expect(missingEntities.size).toEqual(2);
      expect(Array.from(missingEntities.keys())).toEqual(['f2', 'f1']);
    });
  });
});
