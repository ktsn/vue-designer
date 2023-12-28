import { VueFileRepository } from '../repositories/vue-file-repository'
import { SettingRepository } from '../repositories/setting-repository'
import { EditorRepository } from '../repositories/editor-repository'
import { VueFilePayload, vueFileToPayload } from '../parser/vue-file'
import { AssetResolver } from '../asset-resolver'

interface InitialData {
  vueFiles: Record<string, VueFilePayload>
  sharedStyle: string
  activeUri: string | undefined
}

export const resolver = (
  vueFiles: VueFileRepository,
  setting: SettingRepository,
  editor: EditorRepository,
  assetResolver: AssetResolver,
) => ({
  async init(): Promise<InitialData> {
    return {
      vueFiles: vueFiles.map((file) => vueFileToPayload(file, assetResolver)),
      sharedStyle: await setting.readSharedStyle(),
      activeUri: editor.activeDocumentUrl,
    }
  },
})

export type ResolverType = ReturnType<typeof resolver>
