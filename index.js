const path = require('path');

const dotenv = require('dotenv');
// Import required bot configuration.
const ENV_FILE = path.join(__dirname, '.env');
dotenv.config({ path: ENV_FILE });

const restify = require('restify');

// Import required bot services.
// See https://aka.ms/bot-services to learn more about the different parts of a bot.
const { BotFrameworkAdapter, MemoryStorage, ConversationState, UserState } = require('botbuilder');

// Import custom classes
const { Bot } = require('./bots/bot');
const { ActiveLearningDialog } = require('./dialogs/activeLearningDialog');
const { LuisDialog } = require('./dialogs/luisDialog');
const { UserPathwaysDialog } = require('./dialogs/userPathwaysDialog');
const { QNADialog } = require('./dialogs/qnaDialog');
const { LuisRecognizerHelper } = require('./dialogs/luisRecognizerHelper');

// Store information about
// a user, accessible across all conversation
// a conversation, allowing the bot to track the progress of it
const memoryStorage = new MemoryStorage();
const conversationState = new ConversationState(memoryStorage);
const userState = new UserState(memoryStorage);

// Use custom classes
const userPathwaysDialog = new UserPathwaysDialog(userState);
const qnaDialog = new QNADialog();
const activeLearningDialog = new ActiveLearningDialog();

// Set up LUIS
const luisRecognizerHelper = new LuisRecognizerHelper();
const luisDialog = new LuisDialog(luisRecognizerHelper, userPathwaysDialog, qnaDialog);

const bot = new Bot(conversationState, userState, activeLearningDialog, luisDialog);

// Create adapter.
// See https://aka.ms/about-bot-adapter to learn more about how bots work.
const adapter = new BotFrameworkAdapter({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword
});

// Catch-all for errors.
const onTurnErrorHandler = async (context, error) => {
    // This check writes out errors to console log .vs. app insights.
    // NOTE: In production environment, you should consider logging this to Azure
    //       application insights.
    console.error(`\n [onTurnError] unhandled error: ${ error }`);

    // Send a trace activity, which will be displayed in Bot Framework Emulator
    await context.sendTraceActivity(
        'OnTurnError Trace',
        `${ error }`,
        'https://www.botframework.com/schemas/error',
        'TurnError'
    );

    // Send a message to the user
    await context.sendActivity('The bot encountered an error or bug.');
    await context.sendActivity('To continue to run this bot, please fix the bot source code.');
};

// Set the onTurnError for the singleton BotFrameworkAdapter.
adapter.onTurnError = onTurnErrorHandler;

// Create HTTP server
const server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, () => {
    console.log(`\n${ server.name } listening to ${ server.url }`);
    console.log('\nGet Bot Framework Emulator: https://aka.ms/botframework-emulator');
    console.log('\nTo talk to your bot, open the emulator select "Open Bot"');
});

// Listen for incoming requests.
server.post('/api/messages', (req, res) => {
    adapter.processActivity(req, res, async (context) => {
        // Route the message to the bot's main handler.
        await bot.run(context);
    });
});
