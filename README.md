# Faceted Search module

Dialog and view for **Faceted Search**.
The dialog is dynamically optimized and is generated from the data, usually a database.

* [documentation](https://docs.botfuel.io/dialog/reference/modules/faceted-search/)
* [demo bot](https://docs.botfuel.io/dialog/demos/faceted-search)
* [demo bot source code](https://github.com/Botfuel/botfuel-sample-facetedsearch)

## How to use the module in your bot

#### 1. Add the module as dependency

```bash
# npm
npm install --save botfuel-module-facetedsearch

# yarn
yarn add botfuel-module-facetedsearch
```

#### 2. Specify the module in the bot configuration file

```javascript
// botfuel-config.js
module.exports = {
  adapter: {
    name: 'botfuel',
  },
  logger: 'info',
  brain: {
    name: 'memory',
  },
  modules: ['botfuel-module-facetedsearch'],
};
```

#### 3. Create a database

Create your database (which will be used by the search dialog) by extending the `PlainFacetDb` class provided by the sdk. See [documentation] for more details and [demo bot] for example.

```javascript
const { PlainFacetDb } = require('botfuel-module-facetedsearch');
class ArticleDb extends PlainFacetDb {
  // your code
}
module.exports = new ArticleDb();
```

#### 4. Create a dialog

Your dialog will inherit the `SearchDialog` provided by the module and takes the database defined above as parameter. See [documentation] for more details and [demo bot] for example.

```javascript
const { SearchDialog } = require('botfuel-module-facetedsearch');
const ArticleDb = require('../db/article-db');

class ArticleDialog extends SearchDialog {}

ArticleDialog.params = {
  namespace: 'article',
  db: ArticleDb,
  entities: {
    // ...
  },
};

module.exports = ArticleDialog;
```

#### 4. Create a view

Your view will inherit the `SearchView` provided by the module and should implement the `renderEntities` function:

```javascript
const { SearchView } = require('botfuel-module-facetedsearch');
class ArticleView extends SearchView {
  renderEntities(matchedEntities, missingEntities, extraData) {
   //...
}

module.exports = ArticleView;
```

* The `missingEntities` are computed by the module `SearchDialog` based on user input. **Always ask question for the first missing entity.**
* If you don't override `dialogWillDisplay` function in your dialog then the `extraData` will contains:
  * `facet values` for the first missing entitiy so that you can propose possible choices for your question.
  * `found data` if there is no missing entity left so that you can return the search result to your user.

See [documentation] for more details and [demo bot] for example.

[documentation]: (https://docs.botfuel.io/dialog/reference/modules/faceted-search/)
[demo bot]: (https://docs.botfuel.io/dialog/demos/faceted-search)
[demo bot source code]: (https://github.com/Botfuel/botfuel-sample-facetedsearch)
