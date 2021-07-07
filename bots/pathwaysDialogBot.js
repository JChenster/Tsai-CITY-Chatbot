const { ActivityHandler, MessageFactory } = require('botbuilder');

class PathwaysDialogBot extends ActivityHandler {
    /*
    * @param {ConversationState} conversationState
    * @param {UserState} userState
    * @param {Dialog} dialog
    */
    constructor(conversationState, userState, dialog) {
        super();

        this.conversationState = conversationState;
        this.userState = userState;
        this.dialog = dialog;
        // Store a record of this conversation
        this.dialogState = this.conversationState.createProperty('DialogState');

        this.onMembersAdded(async (context, next) => {
            const membersAdded = context.activity.membersAdded;
            for (let member = 0; member < membersAdded.length; member++) {
                // Make sure member is not the bot itself
                if (membersAdded[member].id !== context.activity.recipient.id) {
                    const welcomeMsg = MessageFactory.text(
                        'This is Tsai CITY\'s Bot to help you navigate our website! ' +
                        'Type anything to proceed'
                    );
                    await context.sendActivity(welcomeMsg);
                }
            }
            await next();
        });

        this.onMessage(async (context, next) => {
            await this.dialog.run(context, this.dialogState);
            await next();
        });
    }

    // Store changes to conversation and user state memory
    async run(context) {
        await super.run(context);
        await this.conversationState.saveChanges(context, false);
        await this.conversationState.saveChanges(context, false);
    }
}

module.exports.PathwaysDialogBot = PathwaysDialogBot;
