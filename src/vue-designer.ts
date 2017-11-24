import VueDesignerView from './vue-designer-view';
import { CompositeDisposable } from 'atom';

export = {

  vueDesignerView: null as any,
  modalPanel: null as any,
  subscriptions: null as any,

  activate(state: any) {
    this.vueDesignerView = new VueDesignerView(state.vueDesignerViewState);
    this.modalPanel = atom.workspace.addModalPanel({
      item: this.vueDesignerView.getElement(),
      visible: false
    });

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'vue-designer:toggle': () => this.toggle()
    }));
  },

  deactivate() {
    this.modalPanel.destroy();
    this.subscriptions.dispose();
    this.vueDesignerView.destroy();
  },

  serialize() {
    return {
      vueDesignerViewState: this.vueDesignerView.serialize()
    };
  },

  toggle() {
    console.log('VueDesigner was toggled!');
    return (
      this.modalPanel.isVisible() ?
      this.modalPanel.hide() :
      this.modalPanel.show()
    );
  }

};
