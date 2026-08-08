import {
  Cross,
  ClipboardList,
  BedDouble,
  Baby,
  FlaskConical,
  Pill,
  ScanLine,
  Scissors,
  Stethoscope,
  Heart,
  Activity,
  Microscope,
  type LucideIcon
} from 'lucide-react'

const iconMap: Record<string, LucideIcon> = {
  ambulance: Cross,
  clipboard: ClipboardList,
  bed: BedDouble,
  baby: Baby,
  flask: FlaskConical,
  pill: Pill,
  scan: ScanLine,
  scissors: Scissors,
  stethoscope: Stethoscope,
  heart: Heart,
  activity: Activity,
  microscope: Microscope
}

export const SERVICE_ICON_OPTIONS: { value: string; label: string; Icon: LucideIcon }[] = [
  { value: 'ambulance', label: 'Ambulance / Emergency', Icon: Cross },
  { value: 'clipboard', label: 'Clipboard / Outpatient', Icon: ClipboardList },
  { value: 'bed', label: 'Bed / Inpatient', Icon: BedDouble },
  { value: 'baby', label: 'Baby / Maternity', Icon: Baby },
  { value: 'flask', label: 'Flask / Laboratory', Icon: FlaskConical },
  { value: 'pill', label: 'Pill / Pharmacy', Icon: Pill },
  { value: 'scan', label: 'Scan / Radiology', Icon: ScanLine },
  { value: 'scissors', label: 'Scissors / Surgery', Icon: Scissors },
  { value: 'stethoscope', label: 'Stethoscope / General', Icon: Stethoscope },
  { value: 'heart', label: 'Heart / Cardiology', Icon: Heart },
  { value: 'activity', label: 'Activity / Vitals', Icon: Activity },
  { value: 'microscope', label: 'Microscope / Pathology', Icon: Microscope }
]

/**
 * Renders a service icon. Known keys (set in code, e.g. the fallback service
 * list) render a crisp lucide icon. Anything else - including legacy content
 * saved before the admin icon field was a dropdown - is rendered as-is, so
 * this never breaks content that already exists in the database.
 */
export function ServiceIcon({ icon }: { icon: string }) {
  const Comp = iconMap[icon.toLowerCase()]
  if (Comp) return <Comp size={28} strokeWidth={1.75} />
  return <span className="service-icon-fallback">{icon}</span>
}
