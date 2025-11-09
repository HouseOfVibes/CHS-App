export interface City {
  id: string
  name: string
  created_at: string
}

export interface Subdivision {
  id: string
  name: string
  city_id: string
  created_at: string
}

export interface Home {
  id: string
  city_id: string | null
  subdivision_id: string | null
  street_name: string
  address: string
  result: VisitResult | null
  contact_name: string | null
  phone_number: string | null
  follow_up_date: string | null
  notes: string | null
  canvasser_id: string | null
  date_visited: string
  source: 'manual' | 'corelogic'
  corelogic_id: string | null
  latitude: number | null
  longitude: number | null
  location_pinned_at: string | null
  created_at: string
  updated_at: string
}

export type VisitResult =
  | 'Not Home'
  | 'Scheduled Demo'
  | 'DND (Do Not Disturb)'
  | 'Already Has System'
  | 'Not Interested'
  | 'Interested - Call Back'
  | 'Sold/Closed'

export interface AdminNote {
  id: string
  note: string
  user_id: string
  created_at: string
  updated_at: string
}
