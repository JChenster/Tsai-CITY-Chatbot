const { QnAMakerDialog } = require('botbuilder-ai');
const {
    ComponentDialog,
    DialogSet,
    DialogTurnStatus,
    WaterfallDialog
} = require('botbuilder-dialogs');

const WATERFALL_DIALOG = 'WATERFALL_DIALOG';
const QNAMAKER_BASE_DIALOG = 'QNAMAKER_BASE_DIALOG';

/**
* Creates QnAMakerDialog instance with provided configuraton values.
*/
const createQnAMakerDialog = (knowledgeBaseId, endpointKey, endpointHostName) => {
    const qnaMakerDialog = new QnAMakerDialog(knowledgeBaseId, endpointKey, endpointHostName);
    qnaMakerDialog.id = QNAMAKER_BASE_DIALOG;
    return qnaMakerDialog;
};

class QNADialog extends ComponentDialog {
    constructor(qnaMaker) {
        super('qnaDialog');

        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.startInitialDialog.bind(this)
        ]));

        // Set up link to QnA knowledge base
        this.addDialog(createQnAMakerDialog(
            process.env.QnAKnowledgebaseId,
            process.env.QnAAuthKey,
            process.env.QnAEndpointHostName
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

    // This is the first step of the WaterfallDialog.
    // It kicks off the dialog with the QnA Maker with provided options.
    async startInitialDialog(step) {
        return await step.beginDialog(QNAMAKER_BASE_DIALOG);
    }
}

module.exports.QNADialog = QNADialog;
