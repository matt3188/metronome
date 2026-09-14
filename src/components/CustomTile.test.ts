import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import CustomTile from './CustomTile.vue'

describe('CustomTile', () => {
  it('drags immediately in management mode and reports the pointer position', async () => {
    const wrapper = mount(CustomTile, {
      props: { editing: true, dragging: false, canMoveEarlier: true, canMoveLater: false },
      global: { stubs: { RouterLink: { template: '<a><slot /></a>' } } },
    })
    const tile = wrapper.get('.custom-card')

    await tile.trigger('pointerdown', { pointerId: 1, clientX: 10, clientY: 15 })
    await tile.trigger('pointermove', { pointerId: 1, clientX: 40, clientY: 55 })

    expect(wrapper.classes()).toContain('dragging')
    expect(wrapper.attributes('style')).toContain('--drag-x: 30px')
    expect(wrapper.emitted('dragmove')).toEqual([[{ x: 40, y: 55 }]])

    await tile.trigger('pointerup', { pointerId: 1 })
    expect(wrapper.emitted('dragend')).toHaveLength(1)
  })
})
