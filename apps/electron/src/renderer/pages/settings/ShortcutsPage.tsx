/**
 * ShortcutsPage
 *
 * Displays keyboard shortcuts reference.
 */

import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { PanelHeader } from '@/components/app-shell/PanelHeader'
import { ScrollArea } from '@/components/ui/scroll-area'
import { SettingsSection, SettingsCard, SettingsRow } from '@/components/settings'
import type { DetailsPageMeta } from '@/lib/navigation-registry'

export const meta: DetailsPageMeta = {
  navigator: 'settings',
  slug: 'shortcuts',
}

interface ShortcutItem {
  keys: string[]
  description: string
}

interface ShortcutSection {
  title: string
  shortcuts: ShortcutItem[]
}

const isMac =
  typeof navigator !== 'undefined' &&
  navigator.platform.toUpperCase().indexOf('MAC') >= 0
const cmdKey = isMac ? '⌘' : 'Ctrl'

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[11px] font-medium bg-muted border border-border rounded shadow-sm">
      {children}
    </kbd>
  )
}

export default function ShortcutsPage() {
  const { t } = useTranslation()

  const sections: ShortcutSection[] = [
    {
      title: t('shortcuts.sections.global'),
      shortcuts: [
        { keys: [cmdKey, '1'], description: t('shortcuts.items.focusSidebar') },
        { keys: [cmdKey, '2'], description: t('shortcuts.items.focusSessionList') },
        { keys: [cmdKey, '3'], description: t('shortcuts.items.focusChatInput') },
        { keys: [cmdKey, 'N'], description: t('shortcuts.items.newChat') },
        { keys: [cmdKey, 'B'], description: t('shortcuts.items.toggleSidebar') },
        { keys: [cmdKey, ','], description: t('shortcuts.items.openSettings') },
      ],
    },
    {
      title: t('shortcuts.sections.navigation'),
      shortcuts: [
        { keys: ['Tab'], description: t('shortcuts.items.moveToNextZone') },
        { keys: ['Shift', 'Tab'], description: t('shortcuts.items.cyclePermissionMode') },
        { keys: ['←', '→'], description: t('shortcuts.items.moveBetweenZones') },
        { keys: ['↑', '↓'], description: t('shortcuts.items.navigateItemsInList') },
        { keys: ['Home'], description: t('shortcuts.items.goToFirstItem') },
        { keys: ['End'], description: t('shortcuts.items.goToLastItem') },
        { keys: ['Esc'], description: t('shortcuts.items.closeDialogBlurInput') },
      ],
    },
    {
      title: t('shortcuts.sections.sessionList'),
      shortcuts: [
        { keys: ['Enter'], description: t('shortcuts.items.focusChatInput') },
        { keys: ['Delete'], description: t('shortcuts.items.deleteSession') },
      ],
    },
    {
      title: t('shortcuts.sections.chat'),
      shortcuts: [
        { keys: ['Enter'], description: t('shortcuts.items.sendMessage') },
        { keys: ['Shift', 'Enter'], description: t('shortcuts.items.newLine') },
        { keys: [cmdKey, 'Enter'], description: t('shortcuts.items.sendMessage') },
      ],
    },
  ]

  return (
    <div className="h-full flex flex-col">
      <PanelHeader title={t('shortcuts.title')} />
      <div className="flex-1 min-h-0 mask-fade-y">
        <ScrollArea className="h-full">
          <div className="px-5 py-7 max-w-3xl mx-auto space-y-6">
            {sections.map((section) => (
              <SettingsSection key={section.title} title={section.title}>
                <SettingsCard>
                  {section.shortcuts.map((shortcut, index) => (
                    <SettingsRow key={index} label={shortcut.description}>
                      <div className="flex items-center gap-1">
                        {shortcut.keys.map((key, keyIndex) => (
                          <Kbd key={keyIndex}>{key}</Kbd>
                        ))}
                      </div>
                    </SettingsRow>
                  ))}
                </SettingsCard>
              </SettingsSection>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
