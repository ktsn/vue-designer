export interface RawSetting {
  sharedStyles?: string[]
}

export interface SettingRepositoryFs {
  readFile(path: string): Promise<string>
}

export class SettingRepository {
  sharedStylePaths!: string[]

  constructor(rawSetting: RawSetting, private fs: SettingRepositoryFs) {
    this.updateSetting(rawSetting)
  }

  updateSetting(rawSetting: RawSetting): void {
    this.sharedStylePaths = rawSetting.sharedStyles || []
  }

  async readSharedStyle(): Promise<string> {
    const styles = await Promise.all(
      this.sharedStylePaths.map(path => this.fs.readFile(path))
    )
    return styles.join('\n')
  }
}
