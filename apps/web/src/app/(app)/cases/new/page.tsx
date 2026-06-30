'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { Button, Card, Input } from '@/components/ui';
import { Field, Select, Textarea } from '@/components/ui-kit';

const blankClaimant = () => ({ name: '', guardianName: '', mobile: '', aadhaar: '', occupation: '', monthlyIncome: '' });
const blankVehicle = () => ({
  registrationNo: '', vehicleType: '', make: '', role: 'OFFENDING',
  driverName: '', licenceNumber: '', ownerName: '', insuranceCompanyId: '', policyNumber: '',
});

function useSettings(entity: string) {
  return useQuery({
    queryKey: ['settings', entity, 'all'],
    queryFn: async () => (await api.get(`/settings/${entity}`, { params: { pageSize: 100 } })).data.data as any[],
  });
}

export default function NewCasePage() {
  const router = useRouter();
  const courts = useSettings('courts');
  const insurers = useSettings('insurance-companies');
  const stations = useSettings('police-stations');

  const [basic, setBasic] = useState<any>({ priority: 'NORMAL', status: 'ACTIVE' });
  const [petition, setPetition] = useState<any>({});
  const [accident, setAccident] = useState<any>({});
  const [victim, setVictim] = useState<any>({ type: 'DECEASED' });
  const [claimants, setClaimants] = useState<any[]>([blankClaimant()]);
  const [vehicles, setVehicles] = useState<any[]>([blankVehicle()]);
  const [err, setErr] = useState('');

  const create = useMutation({
    mutationFn: async () => {
      const payload: any = {
        ...clean(basic),
        claimPetition: emptyToUndef(clean({
          petitionNumber: petition.petitionNumber,
          petitionDate: petition.petitionDate,
          claimAmount: numOrU(petition.claimAmount),
          interestRate: numOrU(petition.interestRate),
        })),
        accident: emptyToUndef(clean({
          accidentDate: accident.accidentDate, accidentTime: accident.accidentTime,
          location: accident.location, district: accident.district, state: accident.state,
          firNumber: accident.firNumber, policeStationId: accident.policeStationId || undefined,
          description: accident.description,
        })),
        victims: victim.name ? [clean({
          type: victim.type, name: victim.name, age: numOrU(victim.age),
          occupation: victim.occupation, monthlyIncome: numOrU(victim.monthlyIncome),
          disabilityPct: numOrU(victim.disabilityPct), dateOfDeath: victim.dateOfDeath,
        })] : undefined,
        claimants: claimants.filter((c) => c.name.trim()).map((c) => clean({
          name: c.name, guardianName: c.guardianName, mobile: c.mobile, aadhaar: c.aadhaar,
          occupation: c.occupation, monthlyIncome: numOrU(c.monthlyIncome),
        })),
        vehicles: vehicles.filter((v) => v.registrationNo.trim() || v.driverName.trim()).map((v) => clean({
          registrationNo: v.registrationNo, vehicleType: v.vehicleType, make: v.make, role: v.role,
          driver: v.driverName ? clean({ name: v.driverName, licenceNumber: v.licenceNumber }) : undefined,
          owner: v.ownerName ? clean({ name: v.ownerName }) : undefined,
          insurance: (v.insuranceCompanyId || v.policyNumber) ? clean({
            insuranceCompanyId: v.insuranceCompanyId || undefined, policyNumber: v.policyNumber,
          }) : undefined,
        })),
      };
      return (await api.post('/cases', payload)).data;
    },
    onSuccess: (c) => router.push(`/cases/${c.id}`),
    onError: (e: any) => setErr(JSON.stringify(e?.response?.data?.message ?? 'Failed to create case')),
  });

  return (
    <div className="space-y-5">
      <Link href="/cases" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> All cases
      </Link>
      <h1 className="text-2xl font-semibold">New Case</h1>

      {/* Basic info */}
      <Card className="p-5">
        <h3 className="mb-3 font-medium">Basic information</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="MACT case number"><Input value={basic.mactCaseNumber ?? ''} onChange={(e) => setBasic({ ...basic, mactCaseNumber: e.target.value })} /></Field>
          <Field label="Court">
            <Select value={basic.courtId ?? ''} onChange={(e) => setBasic({ ...basic, courtId: e.target.value })}>
              <option value="">— select —</option>
              {courts.data?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </Field>
          <Field label="Court number"><Input value={basic.courtNumber ?? ''} onChange={(e) => setBasic({ ...basic, courtNumber: e.target.value })} /></Field>
          <Field label="Presiding officer"><Input value={basic.presidingOfficer ?? ''} onChange={(e) => setBasic({ ...basic, presidingOfficer: e.target.value })} /></Field>
          <Field label="Filing date"><Input type="date" value={basic.filingDate ?? ''} onChange={(e) => setBasic({ ...basic, filingDate: e.target.value })} /></Field>
          <Field label="Next hearing date"><Input type="date" value={basic.nextHearingDate ?? ''} onChange={(e) => setBasic({ ...basic, nextHearingDate: e.target.value })} /></Field>
          <Field label="Priority">
            <Select value={basic.priority} onChange={(e) => setBasic({ ...basic, priority: e.target.value })}>
              {['LOW', 'NORMAL', 'HIGH', 'URGENT'].map((p) => <option key={p}>{p}</option>)}
            </Select>
          </Field>
          <Field label="Status">
            <Select value={basic.status} onChange={(e) => setBasic({ ...basic, status: e.target.value })}>
              {['DRAFT', 'ACTIVE'].map((s) => <option key={s}>{s}</option>)}
            </Select>
          </Field>
          <Field label="File location (shelf/cabinet)"><Input value={basic.physicalFileLocation ?? ''} onChange={(e) => setBasic({ ...basic, physicalFileLocation: e.target.value })} /></Field>
        </div>
        <Field label="Case summary" className="mt-3"><Textarea value={basic.caseSummary ?? ''} onChange={(e) => setBasic({ ...basic, caseSummary: e.target.value })} /></Field>
      </Card>

      {/* Claim petition */}
      <Card className="p-5">
        <h3 className="mb-3 font-medium">Claim petition</h3>
        <div className="grid gap-3 sm:grid-cols-4">
          <Field label="Petition number"><Input value={petition.petitionNumber ?? ''} onChange={(e) => setPetition({ ...petition, petitionNumber: e.target.value })} /></Field>
          <Field label="Petition date"><Input type="date" value={petition.petitionDate ?? ''} onChange={(e) => setPetition({ ...petition, petitionDate: e.target.value })} /></Field>
          <Field label="Claim amount (₹)"><Input type="number" value={petition.claimAmount ?? ''} onChange={(e) => setPetition({ ...petition, claimAmount: e.target.value })} /></Field>
          <Field label="Interest rate (%)"><Input type="number" value={petition.interestRate ?? ''} onChange={(e) => setPetition({ ...petition, interestRate: e.target.value })} /></Field>
        </div>
      </Card>

      {/* Claimants */}
      <Card className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-medium">Claimants</h3>
          <Button size="sm" variant="outline" onClick={() => setClaimants([...claimants, blankClaimant()])}><Plus className="h-4 w-4" /> Add</Button>
        </div>
        <div className="space-y-3">
          {claimants.map((c, i) => (
            <div key={i} className="grid gap-2 rounded-md border border-border p-3 sm:grid-cols-6">
              <Input placeholder="Name *" value={c.name} onChange={(e) => upd(setClaimants, claimants, i, 'name', e.target.value)} />
              <Input placeholder="Father/Husband" value={c.guardianName} onChange={(e) => upd(setClaimants, claimants, i, 'guardianName', e.target.value)} />
              <Input placeholder="Mobile" value={c.mobile} onChange={(e) => upd(setClaimants, claimants, i, 'mobile', e.target.value)} />
              <Input placeholder="Aadhaar" value={c.aadhaar} onChange={(e) => upd(setClaimants, claimants, i, 'aadhaar', e.target.value)} />
              <Input placeholder="Occupation" value={c.occupation} onChange={(e) => upd(setClaimants, claimants, i, 'occupation', e.target.value)} />
              <div className="flex gap-1">
                <Input placeholder="Income" type="number" value={c.monthlyIncome} onChange={(e) => upd(setClaimants, claimants, i, 'monthlyIncome', e.target.value)} />
                {claimants.length > 1 && <Button variant="ghost" size="sm" onClick={() => setClaimants(claimants.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Victim + Accident */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-3 font-medium">Deceased / Injured</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Type">
              <Select value={victim.type} onChange={(e) => setVictim({ ...victim, type: e.target.value })}>
                {['DECEASED', 'INJURED'].map((t) => <option key={t}>{t}</option>)}
              </Select>
            </Field>
            <Field label="Name"><Input value={victim.name ?? ''} onChange={(e) => setVictim({ ...victim, name: e.target.value })} /></Field>
            <Field label="Age"><Input type="number" value={victim.age ?? ''} onChange={(e) => setVictim({ ...victim, age: e.target.value })} /></Field>
            <Field label="Monthly income (₹)"><Input type="number" value={victim.monthlyIncome ?? ''} onChange={(e) => setVictim({ ...victim, monthlyIncome: e.target.value })} /></Field>
            <Field label="Disability %"><Input type="number" value={victim.disabilityPct ?? ''} onChange={(e) => setVictim({ ...victim, disabilityPct: e.target.value })} /></Field>
            <Field label="Date of death"><Input type="date" value={victim.dateOfDeath ?? ''} onChange={(e) => setVictim({ ...victim, dateOfDeath: e.target.value })} /></Field>
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="mb-3 font-medium">Accident</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Date"><Input type="date" value={accident.accidentDate ?? ''} onChange={(e) => setAccident({ ...accident, accidentDate: e.target.value })} /></Field>
            <Field label="FIR number"><Input value={accident.firNumber ?? ''} onChange={(e) => setAccident({ ...accident, firNumber: e.target.value })} /></Field>
            <Field label="Location" className="sm:col-span-2"><Input value={accident.location ?? ''} onChange={(e) => setAccident({ ...accident, location: e.target.value })} /></Field>
            <Field label="District"><Input value={accident.district ?? ''} onChange={(e) => setAccident({ ...accident, district: e.target.value })} /></Field>
            <Field label="Police station">
              <Select value={accident.policeStationId ?? ''} onChange={(e) => setAccident({ ...accident, policeStationId: e.target.value })}>
                <option value="">— select —</option>
                {stations.data?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </Select>
            </Field>
          </div>
        </Card>
      </div>

      {/* Vehicles */}
      <Card className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-medium">Vehicles (offending / involved)</h3>
          <Button size="sm" variant="outline" onClick={() => setVehicles([...vehicles, blankVehicle()])}><Plus className="h-4 w-4" /> Add</Button>
        </div>
        <div className="space-y-3">
          {vehicles.map((v, i) => (
            <div key={i} className="rounded-md border border-border p-3">
              <div className="mb-2 grid gap-2 sm:grid-cols-4">
                <Input placeholder="Reg. number" value={v.registrationNo} onChange={(e) => upd(setVehicles, vehicles, i, 'registrationNo', e.target.value)} />
                <Input placeholder="Type (truck/car…)" value={v.vehicleType} onChange={(e) => upd(setVehicles, vehicles, i, 'vehicleType', e.target.value)} />
                <Input placeholder="Make" value={v.make} onChange={(e) => upd(setVehicles, vehicles, i, 'make', e.target.value)} />
                <Select value={v.role} onChange={(e) => upd(setVehicles, vehicles, i, 'role', e.target.value)}>
                  {['OFFENDING', 'VICTIM_VEHICLE', 'OTHER'].map((r) => <option key={r}>{r}</option>)}
                </Select>
              </div>
              <div className="grid gap-2 sm:grid-cols-5">
                <Input placeholder="Driver name" value={v.driverName} onChange={(e) => upd(setVehicles, vehicles, i, 'driverName', e.target.value)} />
                <Input placeholder="Licence no." value={v.licenceNumber} onChange={(e) => upd(setVehicles, vehicles, i, 'licenceNumber', e.target.value)} />
                <Input placeholder="Owner name" value={v.ownerName} onChange={(e) => upd(setVehicles, vehicles, i, 'ownerName', e.target.value)} />
                <Select value={v.insuranceCompanyId} onChange={(e) => upd(setVehicles, vehicles, i, 'insuranceCompanyId', e.target.value)}>
                  <option value="">Insurer…</option>
                  {insurers.data?.map((ins) => <option key={ins.id} value={ins.id}>{ins.shortName ?? ins.name}</option>)}
                </Select>
                <div className="flex gap-1">
                  <Input placeholder="Policy no." value={v.policyNumber} onChange={(e) => upd(setVehicles, vehicles, i, 'policyNumber', e.target.value)} />
                  {vehicles.length > 1 && <Button variant="ghost" size="sm" onClick={() => setVehicles(vehicles.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {err && <p className="text-sm text-destructive">{err}</p>}
      <div className="flex justify-end gap-2">
        <Link href="/cases"><Button variant="outline">Cancel</Button></Link>
        <Button disabled={!claimants[0]?.name || create.isPending} onClick={() => { setErr(''); create.mutate(); }}>
          {create.isPending ? 'Creating…' : 'Create case'}
        </Button>
      </div>
    </div>
  );
}

// helpers
function upd(setter: any, arr: any[], i: number, key: string, value: any) {
  setter(arr.map((item, j) => (j === i ? { ...item, [key]: value } : item)));
}
function clean(obj: any) {
  const out: any = {};
  for (const [k, v] of Object.entries(obj)) if (v !== '' && v !== undefined && v !== null) out[k] = v;
  return out;
}
function emptyToUndef(obj: any) { return Object.keys(obj).length ? obj : undefined; }
function numOrU(v: any) { return v === '' || v == null ? undefined : Number(v); }
