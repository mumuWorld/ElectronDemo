import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      ping: () => Promise<string>
      vocabulary: {
        getAll: () => Promise<any[]>
        getById: (id: number) => Promise<any>
        create: (data: any) => Promise<any>
        update: (id: number, data: any) => Promise<any>
        delete: (id: number) => Promise<void>
      }
      word: {
        getByVocabulary: (vocabularyId: number) => Promise<any[]>
        getById: (id: number) => Promise<any>
        create: (data: any) => Promise<any>
        update: (id: number, data: any) => Promise<any>
        delete: (id: number) => Promise<void>
        search: (vocabularyId: number, keyword: string) => Promise<any[]>
      }
    }
  }
}
