
/* 
* This is an example powertool demonstrating some of the APIs available. This is NOT a fully working example -
* running this plugin as is will probably error.
*/

/* Print name of current powertool. */
console.log(`Welcome from ${powertool.name}.`);

/* Store the editor globally. */
let editor;
powertool.registerHooks({
    tab: {
        onContext: (tab, context) => {
            /* Add a new context action that clears the tab. */
            context.add('Clear tab', () => {
                editor?.setContents(tab, '');
            });
        }
    },

    editor: {
        onCreate: passedEditor => {
            /* Store the editor for later use. */
            editor = passedEditor;
            
            /* Create a toolbar. */
            powertool.createToolbar(editor, 'my-toolbar', [
                { id:'smile', icon: 'fluent:emoji-16-filled', text: 'Smile!', callback: () => {
                    hollywood.notification('success', 'I am happy!', 'Woohoo!')
                } },
            
                { id:'sad', icon: 'fluent:emoji-sad-16-filled', text: 'Sad!', callback: () => {
                    hollywood.notification('error', 'I am sad!', 'Boohoo!')
                } }
            ]);
        }
    }
});

/* Listen to node connection/disconnection events. */
powertool.node.onMount(id => {
    console.log(`Node ${id} has connected!`);
});
powertool.node.onUnmount(id => {
    console.log(`Node ${id} has disconnected!`);
});

/* List all nodes currently available at this point in time. */
console.log(powertool.node.list());

/* 
* Listen to incoming Lua packets sent through syn.ipc_send.
* To enable the "reply" callback, you MUST specify the "reply"
* token in your ipc packet, and to receive replies from Lua,
* your script MUST set the "_reply" function in getgenv().
* See powertool.lua.send for more information. The reply
* function does not need nodeId to work as intended.
*/
powertool.lua.listen((nodeId, receipt, reply) => {
    // Return received player name.
    console.log(`Reply token: ${receipt.reply}`);
    return reply(`YOU SUCK, ${receipt.localPlayer.toUpperCase()}!`);
});

/* 
* Send a packet to all nodes. Lua receives all packets with the
* "_reply" callback set in the returned table of getgenv().
* The reply callback accepts three arguments: the id of the
* invoking powertool as a string, the incoming/reply token,
* and the variable containing the data received.
*/
for (const nodeId of powertool.node.list()) {
    powertool.lua.send(nodeId, 'incoming-token', 'Sent data goes here!');
}
