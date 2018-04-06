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

const CONFIG = {
  adapter: {
    name: 'test',
  },
  componentRoots: [path.resolve(__dirname, '../../src')],
  brain: {
    conversationDuration: 86400000, // one day in ms
  },
};

describe('SearchDialog', () => {
  describe('computeEntities', () => {
    const brain = new MemoryBrain(CONFIG);
    const db = new PlainFacetDb(
      [{ f1: 1, f2: 1 }, { f1: 2, f2: 1 }, { f1: 3, f2: 2 }, { f1: 4, f2: 2 }],
      {
        filter: PlainFacetDb.DEFAULTFILTER({
          f1: PlainFacetDb.EQUAL,
          f2: PlainFacetDb.EQUAL,
        }),
      },
    );
    const search = new SearchDialog(CONFIG, brain, {
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

  describe('computeEntites with done condition', () => {
    const brain = new MemoryBrain(CONFIG);

    test('return no missing entities when done', async () => {
      const db = new PlainFacetDb(
        [{ f1: 1, f2: 1 }, { f1: 1, f2: 2 }, { f1: 1, f2: 3 }, { f1: 2, f2: 2 }],
        {
          filter: PlainFacetDb.DEFAULTFILTER({
            f1: PlainFacetDb.EQUAL,
            f2: PlainFacetDb.EQUAL,
          }),
          done: hits => hits.length <= 3,
        },
      );
      const search = new SearchDialog(CONFIG, brain, {
        namespace: 'testdialog',
        entities: {},
        db,
      });

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

      // suppose asking 'f1' question
      const { missingEntities } = await search.computeEntities(
        candidates,
        dialogEntities,
        {},
        'f1',
      );

      expect(missingEntities.size).toEqual(0);
    });

    test('continue to ask for entities when not done', async () => {
      const db = new PlainFacetDb(
        [{ f1: 1, f2: 1 }, { f1: 1, f2: 2 }, { f1: 2, f2: 1 }, { f1: 2, f2: 2 }],
        {
          filter: PlainFacetDb.DEFAULTFILTER({
            f1: PlainFacetDb.EQUAL,
            f2: PlainFacetDb.EQUAL,
          }),
          done: hits => hits.length <= 1,
        },
      );
      const search = new SearchDialog(CONFIG, brain, {
        namespace: 'testdialog',
        entities: {},
        db,
      });

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

      // suppose asking 'f1' question
      const { missingEntities } = await search.computeEntities(
        candidates,
        dialogEntities,
        {},
        'f1',
      );

      expect(missingEntities.size).toEqual(1);
      expect(Array.from(missingEntities.keys())).toEqual(['f2']);
    });
  });

  describe('dialogWillDisplay', () => {
    const brain = new MemoryBrain(CONFIG);

    const db = new PlainFacetDb(
      [{ f1: 1, f2: 1 }, { f1: 1, f2: 2 }, { f1: 1, f2: 3 }, { f1: 2, f2: 2 }],
      {
        filter: PlainFacetDb.DEFAULTFILTER({
          f1: PlainFacetDb.EQUAL,
          f2: PlainFacetDb.EQUAL,
        }),
        done: hits => hits.length <= 1,
      },
    );
    const search = new SearchDialog(CONFIG, brain, {
      namespace: 'testdialog',
      entities: {},
      db,
    });

    const dialogEntities = {
      f1: {
        dim: 'number',
      },
      f2: {
        dim: 'number',
      },
    };

    test('return extraData with facetValueCounts when missingEntities is not empty', async () => {
      const candidates = [];
      const { missingEntities } = await search.computeEntities(candidates, dialogEntities, {});

      const extraData = await search.dialogWillDisplay({}, { missingEntities });

      expect(missingEntities.size).toEqual(2);
      expect(extraData).toHaveProperty('facetValueCounts');
      expect(extraData.facetValueCounts).toEqual([
        { value: '1', count: 3 },
        { value: '2', count: 1 },
      ]);
    });

    test('return extraData with data when done', async () => {
      const candidates = [
        {
          dim: 'number',
          values: [{ value: 2, type: 'integer' }],
        },
      ];
      const { missingEntities } = await search.computeEntities(candidates, dialogEntities, {});

      const extraData = await search.dialogWillDisplay({}, { missingEntities });

      expect(missingEntities.size).toEqual(0);
      expect(extraData).toHaveProperty('data');
      expect(extraData.data).toEqual([{ f1: 2, f2: 2 }]);
    });
  });
});
