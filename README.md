# botfuel-factedsearch

Module that implements **faceted search dialog** which allows you to ask for missing entites based on database querry. 

In a SDK prompt dialog, the all the missing entities are asked. In a faceted search dialog:
- if the matched entities are sufficient to return the data then no more question will be asked.
- otherwise the next entity to be asked will be computed to narrow down the possible choices effectively. Irrelevant entities will be ignored (like values are not provided or take the same value for all rows).

Detailed documentation [here](https://botfuel-docs-staging-pr-38.herokuapp.com/dialog/reference/dialogs/search-dialog/).


# install
yarn install

# unit-tests
yarn unit-test

# all tests including sample tests
BOTFUEL_APP_TOKEN=<> BOTFUEL_APP_ID=<> BOTFUEL_APP_KEY=<> yarn test

# run sample
cd ./packages/sample-ecommerce
BOTFUEL_APP_TOKEN=<> BOTFUEL_APP_ID=<> BOTFUEL_APP_KEY=<> yarn start botfuel-config.js 
