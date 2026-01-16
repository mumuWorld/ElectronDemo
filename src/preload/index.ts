import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  ping: () => ipcRenderer.invoke('ping'),

  vocabulary: {
    getAll: () => ipcRenderer.invoke('vocabulary:getAll'),
    getById: (id: number) => ipcRenderer.invoke('vocabulary:getById', id),
    create: (data: any) => ipcRenderer.invoke('vocabulary:create', data),
    update: (id: number, data: any) => ipcRenderer.invoke('vocabulary:update', id, data),
    delete: (id: number) => ipcRenderer.invoke('vocabulary:delete', id)
  },

  word: {
    getByVocabulary: (vocabularyId: number) =>
      ipcRenderer.invoke('word:getByVocabulary', vocabularyId),
    getById: (id: number) => ipcRenderer.invoke('word:getById', id),
    create: (data: any) => ipcRenderer.invoke('word:create', data),
    update: (id: number, data: any) => ipcRenderer.invoke('word:update', id, data),
    delete: (id: number) => ipcRenderer.invoke('word:delete', id),
    search: (vocabularyId: number, keyword: string) =>
      ipcRenderer.invoke('word:search', vocabularyId, keyword)
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
