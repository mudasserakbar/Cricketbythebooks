import type { Organization } from './types'

export const FALLBACK_ORGS: Organization[] = [
  { id: '1', name: 'Cricket Canada', slug: 'cricket-canada', level: 'national', province: null, contact_email: null, is_active: true, created_at: '' },
  { id: '2', name: 'Cricket Ontario', slug: 'cricket-ontario', level: 'provincial', province: 'Ontario', contact_email: null, is_active: true, created_at: '' },
  { id: '3', name: 'Cricket BC', slug: 'cricket-bc', level: 'provincial', province: 'British Columbia', contact_email: null, is_active: true, created_at: '' },
  { id: '4', name: 'Cricket Alberta', slug: 'cricket-alberta', level: 'provincial', province: 'Alberta', contact_email: null, is_active: true, created_at: '' },
  { id: '5', name: 'Cricket Quebec', slug: 'cricket-quebec', level: 'provincial', province: 'Quebec', contact_email: null, is_active: true, created_at: '' },
  { id: '6', name: 'Cricket Manitoba', slug: 'cricket-manitoba', level: 'provincial', province: 'Manitoba', contact_email: null, is_active: true, created_at: '' },
  { id: '7', name: 'Cricket Saskatchewan', slug: 'cricket-saskatchewan', level: 'provincial', province: 'Saskatchewan', contact_email: null, is_active: true, created_at: '' },
  { id: '8', name: 'Cricket Nova Scotia', slug: 'cricket-nova-scotia', level: 'provincial', province: 'Nova Scotia', contact_email: null, is_active: true, created_at: '' },
  { id: '9', name: 'Cricket New Brunswick', slug: 'cricket-new-brunswick', level: 'provincial', province: 'New Brunswick', contact_email: null, is_active: true, created_at: '' },
  { id: '10', name: 'Cricket PEI', slug: 'cricket-pei', level: 'provincial', province: 'Prince Edward Island', contact_email: null, is_active: true, created_at: '' },
  { id: '11', name: 'Cricket Newfoundland', slug: 'cricket-newfoundland', level: 'provincial', province: 'Newfoundland and Labrador', contact_email: null, is_active: true, created_at: '' },
]

export const FALLBACK_ORGS_BY_SLUG: Record<string, Organization> = Object.fromEntries(
  FALLBACK_ORGS.map((o) => [o.slug, o])
)
