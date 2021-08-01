const { QnAMaker } = require('botbuilder-ai');
const {
    ComponentDialog,
    DialogSet,
    DialogTurnStatus,
    WaterfallDialog
} = require('botbuilder-dialogs');

// Dialog Constants
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';

// QnA Maker Options
// Minimum score needed for an answer to be considered
const SCORE_THRESHOLD = 0.1;
// The highest number of answers to be considered given they all surpass the score threshold
const TOP = 1;

class QNADialog extends ComponentDialog {
    constructor(qnaMaker) {
        super('qnaDialog');

        try {
            this.qnaMaker = new QnAMaker({
                knowledgeBaseId: process.env.QnAKnowledgebaseId,
                endpointKey: process.env.QnAAuthKey,
                host: process.env.QnAEndpointHostName
            });
        } catch (err) {
            console.warn(`QnAMaker Exception: ${ err } Check your QnAMaker configuration in .env`);
        }

        this.qnaMakerOptions = {
            scoreThreshold: SCORE_THRESHOLD,
            top: TOP
        };

        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.answerQuestionStep.bind(this)
        ]));
    }

    /**
     * The run method handles the incoming activity (in the form of a TurnContext) and passes it through the dialog system.
     * If no dialog is active, it will start the default dialog.
     * @param {*} turnContext
     * @param {*} accessor
     */
    async run(turnContext, accessor) {
        const dialogSet = new DialogSet(accessor);
        dialogSet.add(this);

        const dialogContext = await dialogSet.createContext(turnContext);
        this.turnContext = turnContext;
        const results = await dialogContext.continueDialog();
        if (results.status === DialogTurnStatus.empty) {
            await dialogContext.beginDialog(this.id);
        }
    }

    // Answers question
    async answerQuestionStep(step) {
        const qnaResults = await this.qnaMaker.getAnswers(this.turnContext, this.qnaMakerOptions);
        this.currentQuestion = this.turnContext.activity.text;

        // Log pieces of information about QnA query to the console
        console.log('Current Question: ' + this.currentQuestion);
        console.log(qnaResults);

        // If an answer was received from QnA Maker, send the answer back to the user.
        if (qnaResults[0]) {
            await step.context.sendActivity(qnaResults[0].answer);
        // If no answers were returned from QnA Maker, reply with help.
        } else {
            await step.context.sendActivity('No answer could be found to your question.');
        }
        return await step.context.sendActivity('Ask another question! (Or type \'Exit\' to stop asking)');
    }
}

module.exports.QNADialog = QNADialog;
