const FacetDb = require('./src/dbs/facet-db');
const PlainFacetDb = require('./src/views/plain-facet-db');
const SearchDialog = require('./src/dialogs/search-dialog');
const SearchView = require('./src/views/search-view');

module.exports = {
  botfuelModuleRoot: 'src',
  FacetDb,
  PlainFacetDb,

};
