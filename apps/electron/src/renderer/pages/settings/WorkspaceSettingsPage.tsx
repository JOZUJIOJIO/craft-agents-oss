/**
 * WorkspaceSettingsPage
 *
 * Workspace-level settings for the active workspace.
 *
 * Settings:
 * - Identity (Name, Icon)
 * - Model
 * - Permissions (Default mode, Mode cycling)
 * - Advanced (Working directory, Local MCP servers)
 */

import * as React from 'react'
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { PanelHeader } from '@/components/app-shell/PanelHeader'
import { ScrollArea } from '@/components/ui/scroll-area'
import { HeaderMenu } from '@/components/ui/HeaderMenu'
import { useAppShellContext } from '@/context/AppShellContext'
import { cn } from '@/lib/utils'
import { routes } from '@/lib/navigate'
import { Spinner } from '@craft-agent/ui'
import { RenameDialog } from '@/components/ui/rename-dialog'
import type { PermissionMode, ThinkingLevel, WorkspaceSettings } from '../../../shared/types'
import { PERMISSION_MODE_CONFIG } from '@craft-agent/shared/agent/mode-types'
import { DEFAULT_THINKING_LEVEL, THINKING_LEVELS } from '@craft-agent/shared/agent/thinking-levels'
import type { DetailsPageMeta } from '@/lib/navigation-registry'

import {
  SettingsSection,
  SettingsCard,
  SettingsRow,
  SettingsToggle,
  SettingsMenuSelectRow,
} from '@/components/settings'

export const meta: DetailsPageMeta = {
  navigator: 'settings',
  slug: 'workspace',
}

// ============================================
// Main Component
// ============================================

export default function WorkspaceSettingsPage() {
  const { t } = useTranslation()
  // Get model, onModelChange, and active workspace from context
  const appShellContext = useAppShellContext()
  const onModelChange = appShellContext.onModelChange
  const activeWorkspaceId = appShellContext.activeWorkspaceId
  const onRefreshWorkspaces = appShellContext.onRefreshWorkspaces

  // Workspace settings state
  const [wsName, setWsName] = useState('')
  const [wsNameEditing, setWsNameEditing] = useState('')
  const [renameDialogOpen, setRenameDialogOpen] = useState(false)
  const [wsIconUrl, setWsIconUrl] = useState<string | null>(null)
  const [isUploadingIcon, setIsUploadingIcon] = useState(false)
  const [wsModel, setWsModel] = useState('claude-sonnet-4-5-20250929')
  const [wsThinkingLevel, setWsThinkingLevel] = useState<ThinkingLevel>(DEFAULT_THINKING_LEVEL)
  const [permissionMode, setPermissionMode] = useState<PermissionMode>('ask')
  const [workingDirectory, setWorkingDirectory] = useState('')
  const [localMcpEnabled, setLocalMcpEnabled] = useState(true)
  const [isLoadingWorkspace, setIsLoadingWorkspace] = useState(true)

  // Mode cycling state
  const [enabledModes, setEnabledModes] = useState<PermissionMode[]>(['safe', 'ask', 'allow-all'])
  const [modeCyclingError, setModeCyclingError] = useState<string | null>(null)

  // Load workspace settings when active workspace changes
  useEffect(() => {
    const loadWorkspaceSettings = async () => {
      if (!window.electronAPI || !activeWorkspaceId) {
        setIsLoadingWorkspace(false)
        return
      }

      setIsLoadingWorkspace(true)
      try {
        const settings = await window.electronAPI.getWorkspaceSettings(activeWorkspaceId)
        if (settings) {
          setWsName(settings.name || '')
          setWsNameEditing(settings.name || '')
          setWsModel(settings.model || 'claude-sonnet-4-5-20250929')
          setWsThinkingLevel(settings.thinkingLevel || DEFAULT_THINKING_LEVEL)
          setPermissionMode(settings.permissionMode || 'ask')
          setWorkingDirectory(settings.workingDirectory || '')
          setLocalMcpEnabled(settings.localMcpEnabled ?? true)
          // Load cyclable permission modes from workspace settings
          if (settings.cyclablePermissionModes && settings.cyclablePermissionModes.length >= 2) {
            setEnabledModes(settings.cyclablePermissionModes)
          }
        }

        // Try to load workspace icon (check common extensions)
        const ICON_EXTENSIONS = ['png', 'jpg', 'jpeg', 'svg', 'webp', 'gif']
        let iconFound = false
        for (const ext of ICON_EXTENSIONS) {
          try {
            const iconData = await window.electronAPI.readWorkspaceImage(activeWorkspaceId, `./icon.${ext}`)
            // For SVG, wrap in data URL
            if (ext === 'svg' && !iconData.startsWith('data:')) {
              setWsIconUrl(`data:image/svg+xml;base64,${btoa(iconData)}`)
            } else {
              setWsIconUrl(iconData)
            }
            iconFound = true
            break
          } catch {
            // Icon not found with this extension, try next
          }
        }
        if (!iconFound) {
          setWsIconUrl(null)
        }
      } catch (error) {
        console.error('Failed to load workspace settings:', error)
      } finally {
        setIsLoadingWorkspace(false)
      }
    }

    loadWorkspaceSettings()
  }, [activeWorkspaceId])

  // Save workspace setting
  const updateWorkspaceSetting = useCallback(
    async <K extends keyof WorkspaceSettings>(key: K, value: WorkspaceSettings[K]) => {
      if (!window.electronAPI || !activeWorkspaceId) return

      try {
        await window.electronAPI.updateWorkspaceSetting(activeWorkspaceId, key, value)
      } catch (error) {
        console.error(`Failed to save ${key}:`, error)
      }
    },
    [activeWorkspaceId]
  )

  // Workspace icon upload handler
  const handleIconUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !activeWorkspaceId || !window.electronAPI) return

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp', 'image/gif']
    if (!validTypes.includes(file.type)) {
      console.error('Invalid file type:', file.type)
      return
    }

    setIsUploadingIcon(true)
    try {
      // Read file as base64
      const buffer = await file.arrayBuffer()
      const base64 = btoa(
        new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      )

      // Determine extension from mime type
      const extMap: Record<string, string> = {
        'image/png': 'png',
        'image/jpeg': 'jpg',
        'image/svg+xml': 'svg',
        'image/webp': 'webp',
        'image/gif': 'gif',
      }
      const ext = extMap[file.type] || 'png'

      // Upload to workspace
      await window.electronAPI.writeWorkspaceImage(activeWorkspaceId, `./icon.${ext}`, base64, file.type)

      // Reload the icon locally for settings display
      const iconData = await window.electronAPI.readWorkspaceImage(activeWorkspaceId, `./icon.${ext}`)
      if (ext === 'svg' && !iconData.startsWith('data:')) {
        setWsIconUrl(`data:image/svg+xml;base64,${btoa(iconData)}`)
      } else {
        setWsIconUrl(iconData)
      }

      // Refresh workspaces to update sidebar icon
      onRefreshWorkspaces?.()
    } catch (error) {
      console.error('Failed to upload icon:', error)
    } finally {
      setIsUploadingIcon(false)
      // Reset the input so the same file can be selected again
      e.target.value = ''
    }
  }, [activeWorkspaceId, onRefreshWorkspaces])

  // Workspace settings handlers
  const handleModelChange = useCallback(
    async (newModel: string) => {
      setWsModel(newModel)
      await updateWorkspaceSetting('model', newModel)
      // Also update the global model context so it takes effect immediately
      onModelChange?.(newModel)
    },
    [updateWorkspaceSetting, onModelChange]
  )

  const handleThinkingLevelChange = useCallback(
    async (newLevel: ThinkingLevel) => {
      setWsThinkingLevel(newLevel)
      await updateWorkspaceSetting('thinkingLevel', newLevel)
    },
    [updateWorkspaceSetting]
  )

  const handlePermissionModeChange = useCallback(
    async (newMode: PermissionMode) => {
      setPermissionMode(newMode)
      await updateWorkspaceSetting('permissionMode', newMode)
    },
    [updateWorkspaceSetting]
  )

  const handleChangeWorkingDirectory = useCallback(async () => {
    if (!window.electronAPI) return

    try {
      const selectedPath = await window.electronAPI.openFolderDialog()
      if (selectedPath) {
        setWorkingDirectory(selectedPath)
        await updateWorkspaceSetting('workingDirectory', selectedPath)
      }
    } catch (error) {
      console.error('Failed to change working directory:', error)
    }
  }, [updateWorkspaceSetting])

  const handleClearWorkingDirectory = useCallback(async () => {
    if (!window.electronAPI) return

    try {
      setWorkingDirectory('')
      await updateWorkspaceSetting('workingDirectory', undefined)
    } catch (error) {
      console.error('Failed to clear working directory:', error)
    }
  }, [updateWorkspaceSetting])

  const handleLocalMcpEnabledChange = useCallback(
    async (enabled: boolean) => {
      setLocalMcpEnabled(enabled)
      await updateWorkspaceSetting('localMcpEnabled', enabled)
    },
    [updateWorkspaceSetting]
  )

  const handleModeToggle = useCallback(
    async (mode: PermissionMode, checked: boolean) => {
      if (!window.electronAPI) return

      // Calculate what the new modes would be
      const newModes = checked
        ? [...enabledModes, mode]
        : enabledModes.filter((m) => m !== mode)

      // Validate: at least 2 modes required
      if (newModes.length < 2) {
        setModeCyclingError(t('workspaceSettings.modeCycling.errors.minTwo'))
        // Auto-dismiss after 2 seconds
        setTimeout(() => {
          setModeCyclingError(null)
        }, 2000)
        return
      }

      // Update state and persist
      setEnabledModes(newModes)
      setModeCyclingError(null)
      try {
        await updateWorkspaceSetting('cyclablePermissionModes', newModes)
      } catch (error) {
        console.error('Failed to save mode cycling settings:', error)
      }
    },
    [enabledModes, updateWorkspaceSetting]
  )

  const getPermissionModeDescription = useCallback((mode: PermissionMode) => {
    if (mode === 'safe') return t('workspaceSettings.permissions.defaultMode.options.safe')
    if (mode === 'ask') return t('workspaceSettings.permissions.defaultMode.options.ask')
    return t('workspaceSettings.permissions.defaultMode.options.allowAll')
  }, [t])

  const getPermissionModeLabel = useCallback((mode: PermissionMode) => {
    if (mode === 'safe') return t('permissionModes.safe.label')
    if (mode === 'ask') return t('permissionModes.ask.label')
    return t('permissionModes.allowAll.label')
  }, [t])

  const getThinkingLevelOption = useCallback((id: ThinkingLevel) => ({
    label: t(`thinkingLevels.${id}.name`),
    description: t(`thinkingLevels.${id}.description`),
  }), [t])

  // Show empty state if no workspace is active
  if (!activeWorkspaceId) {
    return (
      <div className="h-full flex flex-col">
        <PanelHeader title={t('workspaceSettings.title')} actions={<HeaderMenu route={routes.view.settings('workspace')} />} />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">{t('workspaceSettings.noWorkspaceSelected')}</p>
        </div>
      </div>
    )
  }

  // Show loading state
  if (isLoadingWorkspace) {
    return (
      <div className="h-full flex flex-col">
        <PanelHeader title={t('workspaceSettings.title')} actions={<HeaderMenu route={routes.view.settings('workspace')} />} />
        <div className="flex-1 flex items-center justify-center">
          <Spinner className="text-muted-foreground" />
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <PanelHeader title={t('workspaceSettings.title')} actions={<HeaderMenu route={routes.view.settings('workspace')} />} />
      <div className="flex-1 min-h-0 mask-fade-y">
        <ScrollArea className="h-full">
          <div className="px-5 py-7 max-w-3xl mx-auto">
          <div className="space-y-6">
            {/* Workspace Info */}
            <SettingsSection title={t('workspaceSettings.sections.workspaceInfo')}>
              <SettingsCard>
                <SettingsRow
                  label={t('workspaceSettings.workspaceInfo.name.label')}
                  description={wsName || t('workspaceSettings.workspaceInfo.name.untitled')}
                  action={
                    <button
                      type="button"
                      onClick={() => {
                        setWsNameEditing(wsName)
                        setRenameDialogOpen(true)
                      }}
                      className="inline-flex items-center h-8 px-3 text-sm rounded-lg bg-background shadow-minimal hover:bg-foreground/[0.02] transition-colors"
                    >
                      {t('workspaceSettings.workspaceInfo.name.edit')}
                    </button>
                  }
                />
                <SettingsRow
                  label={t('workspaceSettings.workspaceInfo.icon.label')}
                  action={
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/svg+xml,image/webp,image/gif"
                        onChange={handleIconUpload}
                        className="sr-only"
                        disabled={isUploadingIcon}
                      />
                      <span className="inline-flex items-center h-8 px-3 text-sm rounded-lg bg-background shadow-minimal hover:bg-foreground/[0.02] transition-colors">
                        {isUploadingIcon ? t('workspaceSettings.workspaceInfo.icon.uploading') : t('workspaceSettings.workspaceInfo.icon.change')}
                      </span>
                    </label>
                  }
                >
                  <div
                    className={cn(
                      'w-6 h-6 rounded-full overflow-hidden bg-foreground/5 flex items-center justify-center',
                      'ring-1 ring-border/50'
                    )}
                  >
                    {isUploadingIcon ? (
                      <Spinner className="text-muted-foreground text-[8px]" />
                    ) : wsIconUrl ? (
                      <img src={wsIconUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs font-medium text-muted-foreground">
                        {wsName?.charAt(0)?.toUpperCase() || 'W'}
                      </span>
                    )}
                  </div>
                </SettingsRow>
              </SettingsCard>

              <RenameDialog
                open={renameDialogOpen}
                onOpenChange={setRenameDialogOpen}
                title={t('workspaceSettings.workspaceInfo.renameDialog.title')}
                value={wsNameEditing}
                onValueChange={setWsNameEditing}
                onSubmit={() => {
                  const newName = wsNameEditing.trim()
                  if (newName && newName !== wsName) {
                    setWsName(newName)
                    updateWorkspaceSetting('name', newName)
                    onRefreshWorkspaces?.()
                  }
                  setRenameDialogOpen(false)
                }}
                placeholder={t('workspaceSettings.workspaceInfo.renameDialog.placeholder')}
              />
            </SettingsSection>

            {/* Model */}
            <SettingsSection title={t('workspaceSettings.sections.model')}>
              <SettingsCard>
                <SettingsMenuSelectRow
                  label={t('workspaceSettings.model.defaultModel.label')}
                  description={t('workspaceSettings.model.defaultModel.description')}
                  value={wsModel}
                  onValueChange={handleModelChange}
                  options={[
                    { value: 'claude-opus-4-5-20251101', label: 'Opus 4.5', description: t('workspaceSettings.model.defaultModel.options.opus45') },
                    { value: 'claude-sonnet-4-5-20250929', label: 'Sonnet 4.5', description: t('workspaceSettings.model.defaultModel.options.sonnet45') },
                    { value: 'claude-haiku-4-5-20251001', label: 'Haiku 4.5', description: t('workspaceSettings.model.defaultModel.options.haiku45') },
                  ]}
                />
                <SettingsMenuSelectRow
                  label={t('workspaceSettings.model.thinkingLevel.label')}
                  description={t('workspaceSettings.model.thinkingLevel.description')}
                  value={wsThinkingLevel}
                  onValueChange={(v) => handleThinkingLevelChange(v as ThinkingLevel)}
                  options={THINKING_LEVELS.map(({ id }) => {
                    const option = getThinkingLevelOption(id)
                    return { value: id, label: option.label, description: option.description }
                  })}
                />
              </SettingsCard>
            </SettingsSection>

            {/* Permissions */}
            <SettingsSection title={t('workspaceSettings.sections.permissions')}>
              <SettingsCard>
                <SettingsMenuSelectRow
                  label={t('workspaceSettings.permissions.defaultMode.label')}
                  description={t('workspaceSettings.permissions.defaultMode.description')}
                  value={permissionMode}
                  onValueChange={(v) => handlePermissionModeChange(v as PermissionMode)}
                  options={[
                    { value: 'safe', label: getPermissionModeLabel('safe'), description: getPermissionModeDescription('safe') },
                    { value: 'ask', label: getPermissionModeLabel('ask'), description: getPermissionModeDescription('ask') },
                    { value: 'allow-all', label: getPermissionModeLabel('allow-all'), description: getPermissionModeDescription('allow-all') },
                  ]}
                />
              </SettingsCard>
            </SettingsSection>

            {/* Mode Cycling */}
            <SettingsSection
              title={t('workspaceSettings.sections.modeCycling')}
              description={t('workspaceSettings.modeCycling.description')}
            >
              <SettingsCard>
                {(['safe', 'ask', 'allow-all'] as const).map((m) => {
                  const isEnabled = enabledModes.includes(m)
                  return (
                    <SettingsToggle
                      key={m}
                      label={getPermissionModeLabel(m)}
                      description={getPermissionModeDescription(m)}
                      checked={isEnabled}
                      onCheckedChange={(checked) => handleModeToggle(m, checked)}
                    />
                  )
                })}
              </SettingsCard>
              <AnimatePresence>
                {modeCyclingError && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                    className="text-xs text-destructive mt-1 overflow-hidden"
                  >
                    {modeCyclingError}
                  </motion.p>
                )}
              </AnimatePresence>
            </SettingsSection>

            {/* Advanced */}
            <SettingsSection title={t('workspaceSettings.sections.advanced')}>
              <SettingsCard>
                <SettingsRow
                  label={t('workspaceSettings.advanced.workingDirectory.label')}
                  description={workingDirectory || t('workspaceSettings.advanced.workingDirectory.notSet')}
                  action={
                    <div className="flex items-center gap-2">
                      {workingDirectory && (
                        <button
                          type="button"
                          onClick={handleClearWorkingDirectory}
                          className="inline-flex items-center h-8 px-3 text-sm rounded-lg bg-background shadow-minimal hover:bg-foreground/[0.02] transition-colors text-foreground/60 hover:text-foreground"
                        >
                          {t('workspaceSettings.advanced.workingDirectory.clear')}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleChangeWorkingDirectory}
                        className="inline-flex items-center h-8 px-3 text-sm rounded-lg bg-background shadow-minimal hover:bg-foreground/[0.02] transition-colors"
                      >
                        {t('workspaceSettings.advanced.workingDirectory.change')}
                      </button>
                    </div>
                  }
                />
                <SettingsToggle
                  label={t('workspaceSettings.advanced.localMcpServers.label')}
                  description={t('workspaceSettings.advanced.localMcpServers.description')}
                  checked={localMcpEnabled}
                  onCheckedChange={handleLocalMcpEnabledChange}
                />
              </SettingsCard>
            </SettingsSection>

          </div>
        </div>
        </ScrollArea>
      </div>
    </div>
  )
}
