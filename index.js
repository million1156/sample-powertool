
// Print name of current powertool.
console.log(`Welcome from ${powertool.name}.`);

// Store the editor globally.
let editor;

powertool.registerHooks({
    tab: {
        onContext: (tab, context) => {
            // Add a new context action that clears the tab.
            context.add('Clear tab', () => {
                editor?.setContents(tab, '');
            });
        }
    },

    editor: {
        onCreate: passedEditor => {
            // Store the editor in the variable.
            editor = passedEditor;
        }
    }
});