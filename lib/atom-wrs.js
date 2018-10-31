'use babel';

import AtomWrsView from './atom-wrs-view';
import { CompositeDisposable } from 'atom';

export default {

    atomWrsView: null,
    modalPanel: null,
    subscriptions: null,

    activate(state) {
        this.atomWrsView = new AtomWrsView(state.atomWrsViewState);
        this.modalPanel = atom.workspace.addModalPanel({
            item: this.atomWrsView.getElement(),
            visible: false
        });

        // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
        this.subscriptions = new CompositeDisposable();

        // Register command that toggles this view
        this.subscriptions.add(atom.commands.add('atom-workspace', {
            'atom-wrs:generate': () => this.generate()
        }));
    },

    deactivate() {
        this.modalPanel.destroy();
        this.subscriptions.dispose();
        this.atomWrsView.destroy();
    },

    serialize() {
        return {
            atomWrsViewState: this.atomWrsView.serialize()
        };
    },

    generate() {
        let rxrColumn = /\/\*\*[a-zA-Z\@0-9\s\n*\\\(\)=,"'_\/$]*\\Column\(name\s*=\s*['"]([a-z_]+)['"][a-zA-Z\@0-9\s\n*\\\(\)=,"'_\/$]*private\s*\$([a-zA-Z0-9]+)/gm;
        let rxrJoinColumn = /\/\*\*[a-zA-Z\@0-9\s\n*\\\(\)=,"'_\/$]*\\JoinColumn\(name\s*=\s*['"]([a-z_]+)['"][a-zA-Z\@0-9\s\n*\\\(\)=,"'_\/$]*private\s*\$([a-zA-Z0-9]+)/gm
        let rxrOneTo = /\/\*\*[a-zA-Z\@0-9\s\n*\\\(\)=,"'_\/$]*\\OneToMany\([a-zA-Z\@0-9\s\n*\\\(\)=,"'_\/$]*private\s*\$([a-zA-Z0-9]+)/gm;
        let editor
        if (editor = atom.workspace.getActiveTextEditor()) {
            var text = editor.getText();
            var allColumn = [];
            var allJoinColumn = [];
            var allOneTo = [];
            var currentRes = null;
            while ((currentRes = rxrColumn.exec(text)) != null) {
                allColumn.push({
                    db: currentRes[1],
                    entity: currentRes[2]
                });
            }
            while ((currentRes = rxrJoinColumn.exec(text)) != null) {
                allJoinColumn.push({
                    db: currentRes[1],
                    entity: currentRes[2]
                });
            }
            while ((currentRes = rxrOneTo.exec(text)) != null) {
                allOneTo.push({
                    entity: currentRes[1]
                });
            }
            console.log(allColumn);
            console.log(allJoinColumn);
            console.log(allOneTo);
            editor.insertText('public function toArray($showAll = true) {');
            editor.insertNewline();
            for (var i = 0; i < allOneTo.length; i++) {
                let oneTo = allOneTo[i];
                editor.insertText('$' + oneTo.entity + ' = [];');
                editor.insertNewline();
                editor.insertText('foreach ($this->' + oneTo.entity + ' as $item) {');
                editor.insertNewline();
                editor.insertText('$' + oneTo.entity + '[] = ($showAll ? $item->toArray(false) : $item->getId());');
                editor.insertNewline();
                editor.insertText('}');
                editor.insertNewline();
            }
            editor.insertText('return [');
            editor.insertNewline();
            for (var i = 0; i < allColumn.length; i++) {
                let item = allColumn[i];
                editor.insertText('\'' + item.db + '\'=>$this->' + item.entity + ',');
                editor.insertNewline();
            }
            for (var i = 0; i < allJoinColumn.length; i++) {
                let item = allJoinColumn[i];
                editor.insertText('\'' + item.db + '\'=>($showAll ? $this->' + item.entity + '->toArray(false) : $this->' + item.entity + '->getId()),');
                editor.insertNewline();
            }
            for (var i = 0; i < allOneTo.length; i++) {
                let item = allOneTo[i];
                editor.insertText('\'' + item.entity + '\'=>$' + item.entity + ',');
                editor.insertNewline();
            }
            editor.insertText('];');
            editor.insertNewline();
            editor.insertText('}');
        }
    }

};
