const { PlainFacetDb } = require('botfuel-dialog');

const data = require('./data');

const colorMap = {
  FF0000: 'Red',
  FFFFFF: 'White',
};

const ColorFilter = (value, param) =>
  param && colorMap[value].toLowerCase() === param.toLowerCase();

class ArticleDb extends PlainFacetDb {
  constructor() {
    super(data, {
      type: PlainFacetDb.EQUAL,
      brand: PlainFacetDb.EQUAL,
      color: ColorFilter,
      size: PlainFacetDb.IN,
      sleave: PlainFacetDb.EQUAL,
      form: PlainFacetDb.EQUAL,
    });
  }
}

module.exports = ArticleDb;
