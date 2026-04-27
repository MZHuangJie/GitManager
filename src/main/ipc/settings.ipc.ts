import { ipcMain } from 'electron'
import { IPC } from '../../shared/ipc-channels'
import { IpcResponse } from '../../shared/types'
import { settingsStore } from '../services/settings.store'

export function registerSettingsIpc(): void {
  ipcMain.handle(
    IPC.SETTINGS_GET,
    async (_e, key: string): Promise<IpcResponse<any>> => {
      try {
        const value = settingsStore.get(key as any)
        return { success: true, data: value }
      } catch (err: any) {
        return { success: false, error: err.message }
      }
    }
  )

  ipcMain.handle(
    IPC.SETTINGS_SET,
    async (_e, key: string, value: any): Promise<IpcResponse<any>> => {
      try {
        settingsStore.set(key as any, value)
        return { success: true, data: undefined }
      } catch (err: any) {
        return { success: false, error: err.message }
      }
    }
  )

  ipcMain.handle(
    IPC.SETTINGS_GET_ALL,
    async (): Promise<IpcResponse<any>> => {
      try {
        const all = settingsStore.getAll()
        return { success: true, data: all }
      } catch (err: any) {
        return { success: false, error: err.message }
      }
    }
  )
}
