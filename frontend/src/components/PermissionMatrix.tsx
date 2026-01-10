import { Fragment, useMemo } from 'react'
import {
  Box, Card, CardHeader, CardContent, Grid, Switch,
  FormControlLabel, Divider, Button
} from '@mui/material'
import type { Permission } from '../apis/role'

export type Section = {
  key: string
  title: string
  items: { key: Permission; label: string }[]
}

export const SECTIONS: Section[] = [
  { key: 'users', title: 'Usuarios', items: [
    { key: 'users:read', label: 'Ver' },
    { key: 'users:write', label: 'Crear/Editar' },
    { key: 'users:delete', label: 'Eliminar' },
  ]},
  { key: 'clients', title: 'Clientes', items: [
    { key: 'clients:read', label: 'Ver' },
    { key: 'clients:write', label: 'Crear/Editar' },
  ]},
  { key: 'quotes', title: 'Cotizaciones', items: [
    { key: 'quotes:read', label: 'Ver' },
    { key: 'quotes:write', label: 'Crear/Editar' },
  ]},
  { key: 'projects', title: 'Proyectos', items: [
    { key: 'projects:read', label: 'Ver' },
    { key: 'projects:write', label: 'Crear/Editar' },
  ]},
  { key: 'ops', title: 'Operaciones & Postventa', items: [
    { key: 'ops:read', label: 'Ver' },
    { key: 'ops:write', label: 'Crear/Editar' },
  ]},
  { key: 'reports', title: 'Reportes & Analítica', items: [
    { key: 'reports:read', label: 'Ver' },
  ]},
  { key: 'marketing', title: 'Marketing', items: [
    { key: 'marketing:read', label: 'Ver' },
  ]},
  { key: 'integrations', title: 'Integraciones', items: [
    { key: 'integrations:read', label: 'Ver' },
  ]},
]

export function allPermissions(): Permission[] {
  return SECTIONS.flatMap(s => s.items.map(i => i.key))
}

export function presetForRole(name: string): Permission[] {
  const N = name.toUpperCase()
  if (N === 'ADMIN') return allPermissions()
  if (N === 'COMERCIAL') {
    return [
      'clients:read','clients:write',
      'quotes:read','quotes:write',
      'reports:read','marketing:read','integrations:read'
    ]
  }
  if (N === 'OPERACIONES') {
    return [
      'projects:read','projects:write',
      'ops:read','ops:write',
      'reports:read','integrations:read'
    ]
  }
  if (N === 'DIRECCION') {
    return [
      'users:read','clients:read','quotes:read',
      'projects:read','ops:read','reports:read',
      'marketing:read','integrations:read'
    ]
  }
  return ['reports:read','integrations:read']
}

type Props = {
  value: Permission[]
  onChange: (next: Permission[]) => void
}

export default function PermissionMatrix({ value, onChange }: Props) {
  const set = useMemo(() => new Set(value), [value])

  const toggle = (perm: Permission) => {
    const next = new Set(set)
    next.has(perm) ? next.delete(perm) : next.add(perm)
    onChange(Array.from(next))
  }
  const setSection = (sec: Section, checked: boolean) => {
    const next = new Set(set)
    sec.items.forEach(i => checked ? next.add(i.key) : next.delete(i.key))
    onChange(Array.from(next))
  }

  return (
    <Card elevation={0} sx={{ border: '1px solid #eef2f7', borderRadius: 3 }}>
      <CardHeader
        title="Permisos"
        action={
          <Box sx={{ display:'flex', gap:1 }}>
            <Button size="small" onClick={()=>onChange(allPermissions())}>Marcar todo</Button>
            <Button size="small" onClick={()=>onChange([])}>Limpiar</Button>
          </Box>
        }
      />
      <Divider />
      <CardContent>
        <Grid container spacing={2}>
          {SECTIONS.map((sec, idx) => {
            const allOn = sec.items.every(i => set.has(i.key))
            return (
              <Fragment key={sec.key}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ p:2, border:'1px dashed #e5e9f0', borderRadius:2 }}>
                    <Box sx={{ display:'flex', alignItems:'center', justifyContent:'space-between', mb:1 }}>
                      <b>{sec.title}</b>
                      <FormControlLabel
                        control={<Switch checked={allOn} onChange={(e,c)=>setSection(sec,c)} />}
                        label="Todos"
                      />
                    </Box>
                    <Divider sx={{ mb:1 }} />
                    <Grid container>
                      {sec.items.map(it => (
                        <Grid item xs={12} sm={6} key={it.key}>
                          <FormControlLabel
                            control={<Switch checked={set.has(it.key)} onChange={()=>toggle(it.key)} />}
                            label={it.label}
                          />
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                </Grid>
                {idx % 2 === 1 && <Grid item xs={12} />}
              </Fragment>
            )
          })}
        </Grid>
      </CardContent>
    </Card>
  )
}
