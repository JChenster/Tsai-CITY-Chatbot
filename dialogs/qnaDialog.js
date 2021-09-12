const { QnAMakerDialog } = require('botbuilder-ai');
const { MessageFactory } = require('botbuilder');
const {
    ComponentDialog,
    DialogSet,
    DialogTurnStatus,
    TextPrompt,
    WaterfallDialog
} = require('botbuilder-dialogs');

// Dialog Constants
const TEXT_PROMPT = 'TEXT_PROMPT';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';
const QNAMAKER_BASE_DIALOG = 'QNAMAKER_BASE_DIALOG';
const NO_ANSWER_MESSAGE = 'No answer could be found to your question.';

// QnA Maker Optionss
// Minimum score needed for an answer to be considered
const SCORE_THRESHOLD = 0.1;
// The highest number of answers to be considered given they all surpass the score threshold
const TOP = 1;

const CHATBOT_TAG = 'Chatbot: ';

/**
 * Creates QnAMakerDialog instance with provided configuraton values.
 */
const createQnAMakerDialog = (knowledgeBaseId, endpointKey, endpointHostName, defaultAnswer) => {
    let noAnswerActivity;
    if (typeof defaultAnswer === 'string') {
        noAnswerActivity = MessageFactory.text(defaultAnswer);
    }

    const qnaMakerDialog = new QnAMakerDialog(
        knowledgeBaseId,
        endpointKey,
        endpointHostName,
        noAnswerActivity,
        SCORE_THRESHOLD,
        undefined,
        undefined,
        TOP
    );
    qnaMakerDialog.id = QNAMAKER_BASE_DIALOG;

    return qnaMakerDialog;
};

class QNADialog extends ComponentDialog {
    constructor() {
        super('qnaDialog');
        // Initial waterfall dialog.
        this.addDialog(new TextPrompt(TEXT_PROMPT))
            .addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
                this.getQuestionStep.bind(this),
                this.answerQuestionStep.bind(this)
            ]))
            .addDialog(createQnAMakerDialog(
                process.env.QnAKnowledgebaseId,
                process.env.QnAAuthKey,
                process.env.QnAEndpointHostName,
                NO_ANSWER_MESSAGE
            ));
        this.initialDialogId = WATERFALL_DIALOG;
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
        const results = await dialogContext.continueDialog();
        if (results.status === DialogTurnStatus.empty) {
            await dialogContext.beginDialog(this.id);
        }
    }

    // Prompt the user to ask a question
    async getQuestionStep(step) {
        console.log(step.options);
        const luisDetails = step.options;
        const questionPrompt = 'Ask a question:';
        luisDetails.flow.transcriptLog += (CHATBOT_TAG + questionPrompt + '\n\n');
        return await step.prompt(TEXT_PROMPT, { prompt: questionPrompt });
    }

    // Answers question
    async answerQuestionStep(step) {
        // Need a mechanism to be able to log the answers that the chatbot provides
        await step.beginDialog(QNAMAKER_BASE_DIALOG);
        await step.context.sendActivity('Type anything to stop asking questions and submit another LUIS query');
        return await step.endDialog();
    }
}

module.exports.QNADialog = QNADialog;
