const { ActivityHandler, MessageFactory } = require('botbuilder');
const nodemailer = require('nodemailer');

const operations = {
    quiz: 'quiz',
    question: 'question',
    activeLearning: 'activeLearning',
    luis: 'luis',
    none: 'none'
};
const MENU_OPTIONS =
    '- Type \'LUIS\' to chat with our chatbot using LUIS natural language processing\n\n' +
    '- Type \'Active\' to help train chatbot through active learning';

const CHATBOT_TAG = 'Chatbot: ';
const USER_TAG = 'You: ';

// Dummy email user and password credentials to test emailing functionality
const DUMMY_EMAIL_USER = 'dalton.mosciski68@ethereal.email';
const DUMMY_EMAIL_PASS = 'zCrv1gGH9XA21W4ayq';

class Bot extends ActivityHandler {
    /*
    * @param {ConversationState} conversationState
    * @param {UserState} userState
    * @param {Dialog} dialog
    */
    constructor(conversationState, userState, activeLearningDialog, luisDialog) {
        super();

        this.conversationState = conversationState;
        this.userState = userState;
        // Add different dialogs
        this.activeLearningDialog = activeLearningDialog;
        this.luisDialog = luisDialog;
        // Store a record of this conversation
        this.dialogState = this.conversationState.createProperty('DialogState');
        // Operation state stores information on what function the bot is carrying out
        // Different from user to user
        this.operationState = this.userState.createProperty('OperationState');
        // Transcript state stores the transcript of the chatbot conversation to then email
        this.transcriptState = this.userState.createProperty('TranscriptState');
        // Set up the necessary objects to be able send emails of conversation history
        this.nodemailerTransporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
                user: DUMMY_EMAIL_USER,
                pass: DUMMY_EMAIL_PASS
            }
        });

        // Send a welcome message
        this.onMembersAdded(async (context, next) => {
            const membersAdded = context.activity.membersAdded;
            for (let member = 0; member < membersAdded.length; member++) {
                // Make sure member is not the bot itself
                if (membersAdded[member].id !== context.activity.recipient.id) {
                    const welcomeMsg = MessageFactory.text('This is Tsai CITY\'s Bot to help you navigate our website!\n\n' + MENU_OPTIONS);
                    await context.sendActivity(welcomeMsg);
                }
            }
            await next();
        });

        this.onMessage(async (context, next) => {
            // currentOperation attribute stores the current operation that the chatbot is running
            // this is a UserState is uniquely stored for each user
            const flow = await this.operationState.get(context, {
                currentOperation: operations.none,
                transcriptLog: ''
            });

            if (context.activity.text) {
                flow.transcriptLog += (USER_TAG + context.activity.text + '\n\n');
            }
            console.log('Current operation: ' + flow.currentOperation);

            if (context.activity.text.toLowerCase() === 'exit') {
                flow.currentOperation = operations.none;
                const menuMsg = 'Current operation has been exited\n\n' +
                    'This is Tsai CITY\'s Bot to help you navigate our website!\n\n' +
                    MENU_OPTIONS;
                await context.sendActivity(MessageFactory.text(menuMsg));

                flow.transcriptLog += (CHATBOT_TAG + menuMsg + '\n\n');

                // For testing
                console.log(flow);
                console.log('Transcript Log:\n' + flow.transcriptLog);

                await this.sendEmailTranscript(flow.transcriptLog);
            } else {
                switch (flow.currentOperation) {
                // No operation is set
                case operations.none: {
                    // Set up the necessary operation based on input
                    // Reads in the user's input and enters the appropriate chatbot mode
                    // Either active learning or general purpose LUIS
                    switch (context.activity.text.toLowerCase()) {
                    case 'active': {
                        flow.currentOperation = operations.activeLearning;
                        const askQuestionPrompt = 'Ask a question to train the chatbot on:';
                        await context.sendActivity(askQuestionPrompt);
                        flow.transcriptLog += (CHATBOT_TAG + askQuestionPrompt + '\n\n');
                        break;
                    }
                    case 'luis':
                        flow.currentOperation = operations.luis;
                        await this.luisDialog.run(context, this.dialogState, flow);
                        break;
                    // If command was invalid, prompt user to try again
                    default: {
                        const tryAgainMsg = MessageFactory.text('That was an invalid command. Try again!\n\n' + MENU_OPTIONS);
                        await context.sendActivity(tryAgainMsg);
                        flow.transcriptLog += (CHATBOT_TAG + tryAgainMsg + '\n\n');
                    }
                    }
                    break;
                }
                // Continue running the operation if there is one in progress
                case operations.activeLearning: {
                    await this.activeLearningDialog.run(context, this.dialogState);
                    break;
                }
                case operations.luis: {
                    await this.luisDialog.run(context, this.dialogState, flow);
                    break;
                }
                }
            }
            await next();
        });
    }

    /* Sends a transcript of the current conversation via email
        Email recipient in its current form is hard-coded in, function can easily be rewritten to take in
        recipient as a parameters
    */
    async sendEmailTranscript(transcriptLog) {
        let transcriptLogHTML = transcriptLog.split(CHATBOT_TAG).join(`<b>${ CHATBOT_TAG }</b>`);
        transcriptLogHTML = transcriptLogHTML.split(USER_TAG).join(`<b>${ USER_TAG }</b>`);
        transcriptLogHTML = transcriptLogHTML.split('\n\n').join('<br/>');
        const info = await this.nodemailerTransporter.sendMail({
            from: DUMMY_EMAIL_USER,
            to: DUMMY_EMAIL_USER,
            subject: 'Tsai CITY Chatbot Conversation Transcript',
            text: transcriptLog,
            html: transcriptLogHTML
        });
        console.log('Message sent: %s', info.messageId);
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }

    // Store changes to conversation and user state memory
    async run(context) {
        await super.run(context);
        await this.conversationState.saveChanges(context, false);
        await this.userState.saveChanges(context, false);
    }
}

module.exports.Bot = Bot;
