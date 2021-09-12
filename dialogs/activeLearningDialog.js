const { QnAMaker } = require('botbuilder-ai');
const {
    ChoiceFactory,
    ChoicePrompt,
    ComponentDialog,
    DialogSet,
    DialogTurnStatus,
    WaterfallDialog
} = require('botbuilder-dialogs');

// Dialog Constants
const CHOICE_PROMPT = 'CHOICE_PROMPT';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';
const NONE_APPLY = 'None Apply';

// QnA Maker Options
// Minimum score needed for an answer to be considered
const SCORE_THRESHOLD = 0.1;
// The highest number of answers to be considered given they all surpass the score threshold
const TOP = 3;

class ActiveLearningDialog extends ComponentDialog {
    constructor(qnaMaker) {
        super('activeLearningDialog');

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
            this.answerQuestionStep.bind(this),
            this.processBestAnswerStep.bind(this)
        ]));
        this.addDialog(new ChoicePrompt(CHOICE_PROMPT));
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
        this.qnaResults = await this.qnaMaker.getAnswers(this.turnContext, this.qnaMakerOptions);
        this.currentQuestion = this.turnContext.activity.text;

        // Log pieces of information about QnA query to the console
        console.log('Current Question: ' + this.currentQuestion);
        console.log(this.qnaResults);
        const numResults = this.qnaResults.length;
        console.log(numResults + ' answers were returned');

        // If an answer was received from QnA Maker, send the answer back to the user.
        if (numResults === 1) {
            return await step.context.sendActivity(this.qnaResults[0].answer);
        } else if (numResults > 1) {
            for (let i = 0; i < numResults; i++) {
                await step.context.sendActivity(`${ i + 1 } (Score: ${ Math.round(this.qnaResults[i].score * 100) / 100 }): ${ this.qnaResults[i].answer }`);
            }
            await step.context.sendActivity('Choose the best answer to your question:');
            const answerChoices = [...Array(numResults).keys()].map(n => (n + 1).toString());
            answerChoices.push(NONE_APPLY);
            return await step.prompt(CHOICE_PROMPT, { choices: ChoiceFactory.toChoices(answerChoices) });
        // If no answers were returned from QnA Maker, reply with help.
        } else {
            await step.context.sendActivity('No answer could be found to your question.');
            return await step.context.sendActivity('Ask another question! (Or type \'Exit\' to stop asking)');
        }
    }

    async processBestAnswerStep(step) {
        const bestAnswer = step.result.value;
        console.log(`Best answer: ${ bestAnswer }`);
        if (bestAnswer !== 'undefined') {
            await step.context.sendActivity(
                `You chose ${ bestAnswer } as the best answer, thank you for your input!\n\n` +
                'The QnA algorithm will be trained accordingly with your help.'
            );
            if (bestAnswer !== NONE_APPLY) {
                const feedbackRecords = {
                    FeedbackRecords: [
                        {
                            UserQuestion: this.currentQuestion,
                            QnaId: this.qnaResults[bestAnswer - 1].id
                        }
                    ]
                };
                console.log(feedbackRecords);
                await this.qnaMaker.callTrain(feedbackRecords);
            }
        } else {
            await step.context.sendActivity('You didn\'t choose a best answer');
        }
        return await step.context.sendActivity('Ask another question! (Or type "Exit" to exit active training)');
    }
}

module.exports.ActiveLearningDialog = ActiveLearningDialog;
