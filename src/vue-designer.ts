import { createView, View } from './view/main';
import { CompositeDisposable } from 'atom';

let vueDesignerView: View
let modalPanel = null as any
let subscriptions = null as any

export function activate(state: any) {
  vueDesignerView = createView();
  modalPanel = atom.workspace.addModalPanel({
    item: vueDesignerView.getElement(),
    visible: false
  });

  // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
  subscriptions = new CompositeDisposable();

  // Register command that toggles this view
  subscriptions.add(atom.commands.add('atom-workspace', {
    'vue-designer:toggle': () => toggle()
  }));
}

export function deactivate() {
  modalPanel.destroy();
  subscriptions.dispose();
  vueDesignerView.destroy();
}

export function serialize() {
  return {
    vueDesignerViewState: vueDesignerView.serialize()
  };
}

function toggle() {
  console.log('VueDesigner was toggled!');
  return (
    modalPanel.isVisible() ?
    modalPanel.hide() :
    modalPanel.show()
  );
}
