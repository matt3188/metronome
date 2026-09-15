import { ref } from 'vue'

export interface DashboardDragPoint {
  x: number
  y: number
}

const tempoAtPoint = (tempo: number, point: DashboardDragPoint) => {
  const topElement = document.elementFromPoint?.(point.x, point.y)
  const elements = document.elementsFromPoint?.(point.x, point.y)
    ?? (topElement ? [topElement] : [])

  const hitTarget = elements
    .map(element => element.closest<HTMLElement>('[data-dashboard-tempo]'))
    .find(element => element && Number(element.dataset.tempo) !== tempo)
  if (hitTarget) return hitTarget

  // Some mobile browsers return only the pointer-captured (dragged) element from
  // elementsFromPoint. Checking the other cards' geometry keeps reordering
  // working while the dragged tile is rendered above them.
  return [...document.querySelectorAll<HTMLElement>('[data-dashboard-tempo]')]
    .filter(element => Number(element.dataset.tempo) !== tempo)
    .find(element => {
      const bounds = element.getBoundingClientRect()
      return point.x >= bounds.left && point.x <= bounds.right
        && point.y >= bounds.top && point.y <= bounds.bottom
    })
}

export const useDashboardDrag = (
  moveDashboardTo: (tempo: number, targetTempo: number) => void,
) => {
  const draggingTempo = ref<number>()

  const dragTempo = (tempo: number, point: DashboardDragPoint) => {
    draggingTempo.value = tempo
    const target = tempoAtPoint(tempo, point)
    if (!target) return

    moveDashboardTo(tempo, Number(target.dataset.tempo))
  }

  const stopDragging = () => {
    draggingTempo.value = undefined
  }

  return { draggingTempo, dragTempo, stopDragging }
}
