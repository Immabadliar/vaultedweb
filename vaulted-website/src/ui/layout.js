import { el } from './dom'

export function createShell() {
  return el(
    'div',
    { class: 'min-h-screen' },
    el('div', { 'data-app-content': '', class: 'min-h-screen' }),
    el('div', { 'data-app-bottomnav': '' })
  )
}

function navItem({ active, icon, label, onClick }) {
  return el(
    'button',
    {
      class: `flex flex-col items-center gap-1 cursor-pointer ${
        active ? 'text-[#98079d]' : 'text-[#A3A3A3]'
      }`,
      style: { background: 'transparent', border: 'none' },
      onClick,
      type: 'button',
    },
    el('span', { class: 'material-symbols-outlined text-2xl', text: icon }),
    el('span', { class: 'text-xs', text: label })
  )
}

export function createBottomNav(activeScreen, navigate) {
  const items = [
    { icon: 'home', label: 'Feed', screen: 'feed' },
    { icon: 'notifications', label: 'Alerts', screen: 'alerts' },
    { icon: 'add_circle', label: 'Post', screen: 'create' },
    { icon: 'warning', label: 'Alarm', screen: 'alarm' },
    { icon: 'person', label: 'Profile', screen: 'profile' },
  ]

  return el(
    'div',
    {
      class:
        'fixed bottom-0 left-0 right-0 bg-[#121212] border-t border-[#262626] flex justify-around py-3 z-50',
    },
    items.map((item) =>
      navItem({
        active: activeScreen === item.screen,
        icon: item.icon,
        label: item.label,
        onClick: () => navigate(item.screen),
      })
    )
  )
}

