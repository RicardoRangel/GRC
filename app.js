/*-----------------------------------------------------------------------------
This template demonstrates how to use an IntentDialog with a LuisRecognizer to add 
natural language support to a bot. 
For a complete walkthrough of creating this type of bot see the article at
https://aka.ms/abs-node-luis
-----------------------------------------------------------------------------*/
var builder = require("botbuilder");
var restify = require('restify');
var botbuilder_azure = require("botbuilder-azure");
var path = require('path');
var env = require('dotenv').config()
var cognitiveservices = require('botbuilder-cognitiveservices');

//var useEmulator = (process.env.NODE_ENV == 'development');
var useEmulator = process.env.NODE_ENV;

if ((useEmulator = 'development')) {
    var server = restify.createServer();
    server.listen(process.env.port || process.env.PORT || 3978, function () {
       console.log('%s listening to %s', server.name, server.url); 
    }); 
} else {
    module.exports = { default: connector.listen() }
}

var connector = useEmulator ? new builder.ChatConnector() : new botbuilder_azure.BotServiceConnector({
    appId: process.env['MicrosoftAppId'],
    appPassword: process.env['MicrosoftAppPassword'],
    //stateEndpoint: process.env['BotStateEndpoint'],
    //openIdMetadata: process.env['BotOpenIdMetadata']
});

var bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen());

bot.localePath(path.join(__dirname, './locale'));

// Make sure you add code to validate these fields
var luisAppId = process.env.LuisAppId;
var luisAPIKey = process.env.LuisAPIKey;
var luisAPIHostName = process.env.LuisAPIHostName || 'westus.api.cognitive.microsoft.com';
const LuisModelUrl = 'https://' + luisAPIHostName + '/luis/v1/application?id=' + luisAppId + '&subscription-key=' + luisAPIKey;

// QNA reconizer
var qnarecognizer = new cognitiveservices.QnAMakerRecognizer({
	knowledgeBaseId: '11e86d60-428b-459e-bc05-58c1aea88cbf', 
	subscriptionKey: 'd6c19d1f8a6d4f08a4747dbecdab9dd7',
    top: 4});

// Main dialog with LUIS
var recognizer = new builder.LuisRecognizer(process.env.ModelUrl);

// Intents of LUIS and QNA
var intents = new builder.IntentDialog({ recognizers: [recognizer, qnarecognizer] });
//var intents = new builder.IntentDialog({ recognizers: [recognizer] })
//var intents = new builder.IntentDialog();

bot.dialog('/', intents);

intents.onDefault([
    function (session) {
        session.beginDialog('/welcome');
    }
]);

bot.dialog('/welcome', [
    function (session) {
        session.send("Olá, bem vindo a base de conhecimento do GRC.");
        session.endDialog();
    }
]);

/*
.matches('<yourIntent>')... See details at http://docs.botframework.com/builder/node/guides/understanding-natural-language/
*/
intents.matches('qna', [
    function (session, args, next) {
        var answerEntity = builder.EntityRecognizer.findEntity(args.entities, 'answer');
        session.send(answerEntity.entity);
    }
]);

intents.onDefault((session) => {
    session.send('Infelizmente não achei na base de conhecimento a informação \'%s\'.', session.message.text);
    session.send('Voce poderia ser mais específico com relação ao erro ou consulta desejada?');
});
