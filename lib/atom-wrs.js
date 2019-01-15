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
            'atom-wrs:generate': () => this.generate(),
            'atom-wrs:replaceform': () => this.replaceForm()
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

    replaceForm() {
        let editor;
        if (editor = atom.workspace.getActiveTextEditor()) {
            var text = editor.getSelectedText();
            var tmpElem = document.createElement('div');
            tmpElem.innerHTML = text.trim();
            tmpElem = tmpElem.firstChild;
            tmpElem.classList.add("form-group");
            var formGroup = tmpElem.getElementsByClassName('form-group');
            var row;
            console.log(formGroup);
            if (formGroup.length > 0) {
                row = formGroup[0];
                row.classList.remove("form-group");
            }
            else {
                row = document.createElement('div');
                row.innerHTML = tmpElem.innerHTML;
            }
            row.classList.add("row");
            var label;
            var newElem = document.createElement('div');
            newElem.classList.add('col-sm-9');
            var allChildrens = row.childNodes;
            for (var i = 0; i < allChildrens.length; i++) {
                if (allChildrens[i].tagName == "LABEL") {
                    allChildrens[i].classList.add("col-form-label");
                    allChildrens[i].classList.add("col-sm-2");
                    label = allChildrens[i];
                }
                else if (allChildrens[i].tagName != undefined) {
                    newElem.innerHTML += allChildrens[i].outerHTML;
                }
            }
            row.innerHTML = label.outerHTML + newElem.outerHTML;
            tmpElem.innerHTML = row.outerHTML;
            var retText = tmpElem.outerHTML.replace(/\>/g, ">\n").replace(/([^\n])\<\//g, function(mat, p1) {
                return p1 + "\n<\/";
            });
            editor.delete();
            editor.insertText(retText);
        }
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
