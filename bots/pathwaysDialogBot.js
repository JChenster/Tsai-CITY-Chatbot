const { ActivityHandler, ActionTypes } = require('botbuilder');

class PathwaysDialogBot extends ActivityHandler {
    /*
    * @param {ConversationState} conversationState
    * @param {UserState} userState
    * @param {Dialog} dialog
    */
   constructor(conversationState, userState, dialog){
       super();
       
       this.conversationState = conversationState;
       this.userState = userState;
       this.dialog = dialog;
       // Store a record of this conversation
       this.dialogState = this.conversationState.createProperty('DialogState');

       this.onMessage(async (context, next) => {
           await this.dialog.run(context, this.dialogState);
           await next();
       });
   }

   // Store changes to conversation and user state memory
   async run(context){
       await super.run(context);
       await this.conversationState.saveChanges(context, false);
       await this.conversationState.saveChanges(context, false);
   }
}

module.exports.PathwaysDialogBot = PathwaysDialogBot;