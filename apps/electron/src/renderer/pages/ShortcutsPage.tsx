/**
 * ShortcutsPage
 *
 * Displays keyboard shortcuts reference.
 */

import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { PanelHeader } from '@/components/app-shell/PanelHeader'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { HeaderMenu } from '@/components/ui/HeaderMenu'
import { routes } from '@/lib/navigate'

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

function Kbd({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <kbd className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[11px] font-medium bg-muted border border-border rounded shadow-sm ${className || ''}`}>
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
        { keys: [cmdKey, '/'], description: t('shortcuts.items.showKeyboardShortcuts') },
      ],
    },
    {
      title: t('shortcuts.sections.navigation'),
      shortcuts: [
        { keys: ['Tab'], description: t('shortcuts.items.moveToNextZone') },
        { keys: ['Shift', 'Tab'], description: t('shortcuts.items.moveToPreviousZone') },
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
        { keys: ['R'], description: t('shortcuts.items.renameSession') },
        { keys: ['Right-click'], description: t('shortcuts.items.openContextMenu') },
      ],
    },
    {
      title: t('shortcuts.sections.agentTree'),
      shortcuts: [
        { keys: ['←'], description: t('shortcuts.items.collapseFolder') },
        { keys: ['→'], description: t('shortcuts.items.expandFolder') },
      ],
    },
    {
      title: t('shortcuts.sections.chat'),
      shortcuts: [
        { keys: ['Enter'], description: t('shortcuts.items.sendMessage') },
        { keys: ['Shift', 'Enter'], description: t('shortcuts.items.newLine') },
        { keys: [cmdKey, 'Enter'], description: t('shortcuts.items.sendMessage') },
        { keys: ['Esc'], description: t('shortcuts.items.stopAgent') },
      ],
    },
  ]

  return (
    <div className="h-full flex flex-col">
      <PanelHeader title={t('shortcuts.title')} actions={<HeaderMenu route={routes.view.settings('shortcuts')} />} />
      <Separator />
      <ScrollArea className="flex-1">
        <div className="px-5 py-4">
          <div className="space-y-6">
            {sections.map((section) => (
              <div key={section.title}>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 pb-1.5 border-b border-border/50">
                  {section.title}
                </h3>
                <div className="space-y-0.5">
                  {section.shortcuts.map((shortcut, index) => (
                    <div
                      key={index}
                      className="group flex items-center justify-between py-1.5"
                    >
                      <span className="text-sm">{shortcut.description}</span>
                      <div className="flex-1 mx-3 h-px bg-[repeating-linear-gradient(90deg,currentColor_0_2px,transparent_2px_8px)] opacity-0 group-hover:opacity-15" />
                      <div className="flex items-center gap-1">
                        {shortcut.keys.map((key, keyIndex) => (
                          <Kbd key={keyIndex} className="group-hover:bg-foreground/10 group-hover:border-foreground/20">{key}</Kbd>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
