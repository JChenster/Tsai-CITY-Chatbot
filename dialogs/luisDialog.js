const {
    ComponentDialog,
    DialogSet,
    DialogTurnStatus,
    TextPrompt,
    WaterfallDialog
} = require('botbuilder-dialogs');
const { MessageFactory, InputHints } = require('botbuilder');
const { LuisRecognizer } = require('botbuilder-ai');

const WATERFALL_DIALOG = 'MAIN_WATERFALL_DIALOG';
const CHATBOT_TAG = 'Chatbot: ';

class LuisDialog extends ComponentDialog {
    constructor(luisRecognizer, userPathwaysDialog, qnaDialog) {
        super('LuisDialog');

        if (!luisRecognizer) throw new Error('[MainDialog]: Missing parameter \'luisRecognizer\' is required');
        this.luisRecognizer = luisRecognizer;

        this.addDialog(new TextPrompt('TextPrompt'))
            .addDialog(userPathwaysDialog)
            .addDialog(qnaDialog)
            .addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
                this.introStep.bind(this),
                this.actStep.bind(this)//,
                // this.finalStep.bind(this)
            ]));
        this.initialDialogId = WATERFALL_DIALOG;
    }

    /**
     * The run method handles the incoming activity (in the form of a TurnContext) and passes it through the dialog system.
     * If no dialog is active, it will start the default dialog.
     * @param {*} turnContext
     * @param {*} accessor
     */
    // We pass in flow as a parameter because we want to be able to update our transcript of what the chatbot says
    async run(turnContext, accessor, flow) {
        const dialogSet = new DialogSet(accessor);
        dialogSet.add(this);

        const dialogContext = await dialogSet.createContext(turnContext);
        // Save the turn context for access by QnA Dialog
        this.turnContext = turnContext;
        this.flow = flow;

        const results = await dialogContext.continueDialog();
        if (results.status === DialogTurnStatus.empty) {
            await dialogContext.beginDialog(this.id);
        }
    }

    /**
     * First step in the waterfall dialog. Prompts the user for a command.
     */
    async introStep(stepContext) {
        if (!this.luisRecognizer.isConfigured) {
            const messageText = 'NOTE: LUIS is not configured. To enable all capabilities, add `LuisAppId`, `LuisAPIKey` and `LuisAPIHostName` to the .env file.';
            this.flow.transcriptLog += (CHATBOT_TAG + messageText + '\n\n');
            await stepContext.context.sendActivity(messageText, null, InputHints.IgnoringInput);
            return await stepContext.next();
        }

        const messageText = stepContext.options.restartMsg ? stepContext.options.restartMsg : 'What can I help you with today?\nSay something like "I want to take the user pathways quiz" (Or "Exit" to return to the main menu)';
        this.flow.transcriptLog += (CHATBOT_TAG + messageText + '\n\n');
        console.log(this.transriptFlow);
        const promptMessage = MessageFactory.text(messageText, messageText, InputHints.ExpectingInput);
        return await stepContext.prompt('TextPrompt', { prompt: promptMessage });
    }

    /**
     * Second step in the waterfall.  This will use LUIS to attempt to extract the origin, destination and travel dates.
     */
    async actStep(stepContext) {
        // Call LUIS. (Note the TurnContext has the response to the prompt)
        const luisResult = await this.luisRecognizer.executeLuisQuery(stepContext.context);
        console.log(LuisRecognizer.sortedIntents(luisResult));
        const topIntent = LuisRecognizer.topIntent(luisResult);
        console.log(`Processed ${ topIntent } intent`);
        switch (topIntent) {
        case 'PathwaysQuiz': {
            return await stepContext.beginDialog('userPathwaysDialog', { flow: this.flow });
        }
        case 'Question': {
            return await stepContext.beginDialog('qnaDialog', { flow: this.flow });
        }
        default: {
            // Catch all for unhandled intents
            const didntUnderstandMessageText = `Sorry, I didn't get that. Please try asking in a different way (intent was ${ topIntent })`;
            this.flow.transcriptLog += (CHATBOT_TAG + didntUnderstandMessageText + '\n\n');
            await stepContext.context.sendActivity(didntUnderstandMessageText, didntUnderstandMessageText, InputHints.IgnoringInput);
        }
        }
        return await stepContext.replaceDialog(this.initialDialogId, { restartMsg: 'What else can I do for you?' });
    }
}

module.exports.LuisDialog = LuisDialog;
