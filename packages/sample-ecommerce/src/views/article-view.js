const _ = require('lodash');
const { BotTextMessage, BotImageMessage, Logger, QuickrepliesMessage } = require('botfuel-dialog');
const { SearchView } = require('botfuel-facetedsearch');

const logger = Logger('ArticleView');

const questions = {
  type: 'What do you want to buy?',
  brand: 'Which brand do you like?',
  color: 'What color do you like?',
  size: 'What is your size?',
  form: 'Which form do you like?',
  sleave: 'What about sleave?',
};

const getBotResponse = ({ nextQuestionFacet, valueCounts }) => {
  var facetValues = [];
  if (nextQuestionFacet === 'size') {
    // size value is array
    const array = valueCounts.map(o => o.value.substring(1, o.value.length - 1).split(','));
    facetValues = _.union(...array);
  } else {
    facetValues = valueCounts.map(o => o.value);
  }

  return [
    new BotTextMessage(questions[nextQuestionFacet]),
    new QuickrepliesMessage(facetValues),
  ];
};

const articleHtml = (data) => {
  var html = '<div>';
  html += `<div><img src="${data.image}" style="max-width:100%"/></div>`;
  html += `<div><strong>${data.brand}</strong> <strong style="float:right">${
    data.price
  } €</strong></div>`;
  html += `<div>${data.size.substring(1, data.size.length - 1)}</div>`;
  if (data.cut) {
    html += `<div>${data.cut}</div>`;
  }

  if (data.material) {
    html += `<div>${data.material}</div>`;
  }
  html += '</div>';
  return html;
};

class ArticleView extends SearchView {
  renderEntities(matchedEntities, missingEntities, extraData) {
    logger.debug('renderEntities', {
      matchedEntities,
      missingEntities,
      extraData,
    });

    if (Object.keys(missingEntities).length !== 0) {
      return getBotResponse(extraData);
    }

    const messages = [];
    if (extraData.foundData && extraData.foundData.length > 0) {
      messages.push(
        new BotTextMessage(`Thank you. We have ${extraData.foundData.length} product${extraData.foundData.length > 1 ? 's' : ''}:`));
      _.forEach(extraData.foundData, (data) => {
        messages.push(new BotTextMessage(articleHtml(data)));
      });
    } else {
      messages.push(new BotTextMessage('Sorry we don\'t find any result!'));
    }
    return messages;
  }
}

module.exports = ArticleView;
