const { ActivityHandler, MessageFactory } = require('botbuilder');

const operations = {
    quiz: 'quiz',
    question: 'question',
    activeLearning: 'activeLearning',
    luis: 'luis',
    none: 'none'
};
const MENU_OPTIONS =
    '- Type \'LUIS\' to chat with our chatbot usisng LUIS natural language processing\n\n' +
    '- Type \'Active\' to help train chatbot through active learning';

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
            const flow = await this.operationState.get(context, { currentOperation: operations.none });
            console.log('Current operation: ' + flow.currentOperation);

            if (context.activity.text.toLowerCase() === 'exit') {
                flow.currentOperation = operations.none;
                const menuMsg = MessageFactory.text(
                    'Current operation has been exited\n\n' +
                    'This is Tsai CITY\'s Bot to help you navigate our website!\n\n' +
                    MENU_OPTIONS
                );
                await context.sendActivity(menuMsg);
            } else {
                switch (flow.currentOperation) {
                // No operation is set
                case operations.none: {
                    // Set up the necessary operation based on input
                    switch (context.activity.text.toLowerCase()) {
                    case 'active': {
                        flow.currentOperation = operations.activeLearning;
                        await context.sendActivity('What is your question?');
                        break;
                    }
                    case 'luis':
                        flow.currentOperation = operations.luis;
                        await this.luisDialog.run(context, this.dialogState);
                        break;
                    default: {
                        const tryAgainMsg = MessageFactory.text('That was an invalid command. Try again!\n\n' + MENU_OPTIONS);
                        await context.sendActivity(tryAgainMsg);
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
                    await this.luisDialog.run(context, this.dialogState);
                    break;
                }
                }
            }
            await next();
        });
    }

    // Store changes to conversation and user state memory
    async run(context) {
        await super.run(context);
        await this.conversationState.saveChanges(context, false);
        await this.userState.saveChanges(context, false);
    }
}

module.exports.Bot = Bot;
