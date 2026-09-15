import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import CustomCog from './CustomCog.vue'

describe('CustomCog', () => {
  it('renders as a decorative icon', () => {
    const cog = mount(CustomCog).get('svg')

    expect(cog.attributes('viewBox')).toBe('0 0 24 24')
    expect(cog.attributes('aria-hidden')).toBe('true')
  })
})
