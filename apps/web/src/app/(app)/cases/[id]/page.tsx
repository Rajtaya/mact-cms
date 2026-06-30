'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Plus, Upload, Download, FileText, Trash2, Receipt,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { can } from '@/lib/permissions';
import { Badge, Button, Card, Input } from '@/components/ui';
import { Field, Modal, Select, Spinner, Tabs, Textarea, Empty } from '@/components/ui-kit';
import { formatDate, formatINR } from '@/lib/utils';

export default function CaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [tab, setTab] = useState('overview');

  const { data: c, isLoading } = useQuery({
    queryKey: ['case', id],
    queryFn: async () => (await api.get(`/cases/${id}`)).data,
  });

  if (isLoading) return <Spinner label="Loading case…" />;
  if (!c) return <Empty message="Case not found." />;

  const editable = can(user?.role, 'cases.edit');

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'parties', label: 'Parties', badge: (c.claimants?.length ?? 0) + (c.victims?.length ?? 0) },
    { key: 'vehicles', label: 'Vehicles', badge: c.vehicles?.length },
    { key: 'respondents', label: 'Respondents & Witnesses' },
    { key: 'hearings', label: 'Hearings', badge: c.hearings?.length },
    { key: 'documents', label: 'Documents', badge: c.documents?.length },
    ...(can(user?.role, 'fees.view') ? [{ key: 'fees', label: 'Fees' }] : []),
    ...(can(user?.role, 'calculator.use') ? [{ key: 'compensation', label: 'Compensation', badge: c.compensations?.length }] : []),
  ];

  return (
    <div className="space-y-5">
      <Link href="/cases" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> All cases
      </Link>

      {/* Header */}
      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">{c.mactCaseNumber ?? c.caseRef}</h1>
            <p className="text-sm text-muted-foreground">
              {c.caseRef} · {c.court?.name ?? 'No court'} {c.courtNumber ? `· Ct ${c.courtNumber}` : ''}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge>{c.status}</Badge>
            <Badge>{c.stage}</Badge>
            <Badge className="bg-primary/15 text-primary">{c.priority}</Badge>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <Meta label="Filing date" value={formatDate(c.filingDate)} />
          <Meta label="Next hearing" value={formatDate(c.nextHearingDate)} />
          <Meta label="Presiding officer" value={c.presidingOfficer ?? '—'} />
          <Meta label="File location" value={c.physicalFileLocation ?? '—'} />
          <Meta label="Lead advocate" value={c.leadAdvocate?.fullName ?? '—'} />
          <Meta label="Claim amount" value={formatINR(c.claimPetition?.claimAmount)} />
          <Meta label="Awarded" value={formatINR(c.claimPetition?.compensationAwarded)} />
          <Meta label="Outcome" value={c.outcome ?? 'PENDING'} />
        </div>
      </Card>

      <Tabs tabs={tabs} value={tab} onChange={setTab} />

      {tab === 'overview' && <OverviewTab c={c} />}
      {tab === 'parties' && <PartiesTab c={c} />}
      {tab === 'vehicles' && <VehiclesTab c={c} />}
      {tab === 'respondents' && <RespondentsTab c={c} />}
      {tab === 'hearings' && <HearingsTab caseId={id} hearings={c.hearings ?? []} editable={editable} />}
      {tab === 'documents' && <DocumentsTab caseId={id} documents={c.documents ?? []} editable={editable} />}
      {tab === 'fees' && <FeesTab caseId={id} />}
      {tab === 'compensation' && <CompensationTab caseId={id} estimates={c.compensations ?? []} />}
    </div>
  );
}

function Meta({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-medium">{title}</h3>
        {action}
      </div>
      {children}
    </Card>
  );
}

function OverviewTab({ c }: { c: any }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Section title="Case summary">
        <p className="text-sm text-muted-foreground">{c.caseSummary || '—'}</p>
      </Section>
      <Section title="Accident details">
        {c.accident ? (
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Meta label="Date" value={formatDate(c.accident.accidentDate)} />
            <Meta label="Time" value={c.accident.accidentTime ?? '—'} />
            <Meta label="Location" value={c.accident.location ?? '—'} />
            <Meta label="FIR No." value={c.accident.firNumber ?? '—'} />
            <Meta label="Police station" value={c.accident.policeStation?.name ?? '—'} />
            <Meta label="District" value={c.accident.district ?? '—'} />
          </div>
        ) : <Empty message="No accident details recorded." />}
      </Section>
      <Section title="Claim petition">
        {c.claimPetition ? (
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Meta label="Petition no." value={c.claimPetition.petitionNumber ?? '—'} />
            <Meta label="Petition date" value={formatDate(c.claimPetition.petitionDate)} />
            <Meta label="Claim amount" value={formatINR(c.claimPetition.claimAmount)} />
            <Meta label="Interest rate" value={c.claimPetition.interestRate ? `${c.claimPetition.interestRate}%` : '—'} />
          </div>
        ) : <Empty message="No claim petition recorded." />}
      </Section>
      <Section title="Internal notes">
        <p className="text-sm text-muted-foreground">{c.internalNotes || '—'}</p>
      </Section>
    </div>
  );
}

function PartiesTab({ c }: { c: any }) {
  return (
    <div className="space-y-4">
      <Section title={`Claimants (${c.claimants?.length ?? 0})`}>
        {c.claimants?.length ? (
          <div className="space-y-2">
            {c.claimants.map((cl: any) => (
              <div key={cl.id} className="rounded-md border border-border p-3 text-sm">
                <p className="font-medium">{cl.name} {cl.guardianName ? <span className="text-muted-foreground">· {cl.guardianName}</span> : null}</p>
                <div className="mt-1 grid grid-cols-2 gap-2 text-muted-foreground sm:grid-cols-4">
                  <span>📱 {cl.mobile ?? '—'}</span>
                  <span>Aadhaar: {cl.aadhaar ?? '—'}</span>
                  <span>Occupation: {cl.occupation ?? '—'}</span>
                  <span>Income: {formatINR(cl.monthlyIncome)}</span>
                </div>
              </div>
            ))}
          </div>
        ) : <Empty message="No claimants." />}
      </Section>
      <Section title={`Deceased / Injured (${c.victims?.length ?? 0})`}>
        {c.victims?.length ? (
          <div className="space-y-2">
            {c.victims.map((v: any) => (
              <div key={v.id} className="rounded-md border border-border p-3 text-sm">
                <p className="font-medium">{v.name} <Badge className="ml-2">{v.type}</Badge></p>
                <div className="mt-1 grid grid-cols-2 gap-2 text-muted-foreground sm:grid-cols-4">
                  <span>Age: {v.age ?? '—'}</span>
                  <span>Income: {formatINR(v.monthlyIncome)}</span>
                  <span>Disability: {v.disabilityPct ? `${v.disabilityPct}%` : '—'}</span>
                  <span>{v.dateOfDeath ? `Died ${formatDate(v.dateOfDeath)}` : v.natureOfInjury ?? ''}</span>
                </div>
              </div>
            ))}
          </div>
        ) : <Empty message="No victim records." />}
      </Section>
    </div>
  );
}

function VehiclesTab({ c }: { c: any }) {
  return (
    <div className="space-y-4">
      {c.vehicles?.length ? c.vehicles.map((v: any) => (
        <Section key={v.id} title={`${v.registrationNo ?? 'Vehicle'} · ${v.vehicleType ?? ''}`} action={<Badge>{v.role}</Badge>}>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-sm">
              <p className="mb-1 font-medium">Vehicle</p>
              <Meta label="Make / Model" value={`${v.make ?? '—'} ${v.model ?? ''}`} />
              <Meta label="Chassis" value={v.chassisNumber ?? '—'} />
              <Meta label="Engine" value={v.engineNumber ?? '—'} />
            </div>
            <div className="text-sm">
              <p className="mb-1 font-medium">Driver</p>
              {v.driver ? <>
                <Meta label="Name" value={v.driver.name} />
                <Meta label="Licence" value={v.driver.licenceNumber ?? '—'} />
                <Meta label="Category" value={v.driver.licenceCategory ?? '—'} />
              </> : <span className="text-muted-foreground">—</span>}
            </div>
            <div className="text-sm">
              <p className="mb-1 font-medium">Owner / Insurance</p>
              <Meta label="Owner" value={v.owner?.name ?? '—'} />
              <Meta label="Insurer" value={v.insurance?.insuranceCompany?.name ?? v.insurance?.companyNameText ?? '—'} />
              <Meta label="Policy" value={v.insurance?.policyNumber ?? '—'} />
              <Meta label="Expiry" value={formatDate(v.insurance?.policyExpiryDate)} />
            </div>
          </div>
        </Section>
      )) : <Empty message="No vehicles recorded." />}
    </div>
  );
}

function RespondentsTab({ c }: { c: any }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Section title={`Respondents (${c.respondents?.length ?? 0})`}>
        {c.respondents?.length ? c.respondents.map((r: any) => (
          <div key={r.id} className="mb-2 rounded-md border border-border p-3 text-sm">
            <p className="font-medium">{r.name} <Badge className="ml-2">{r.type}</Badge></p>
            {r.address && <p className="text-muted-foreground">{r.address}</p>}
          </div>
        )) : <Empty message="No respondents." />}
      </Section>
      <Section title={`Witnesses (${c.witnesses?.length ?? 0})`}>
        {c.witnesses?.length ? c.witnesses.map((w: any) => (
          <div key={w.id} className="mb-2 rounded-md border border-border p-3 text-sm">
            <p className="font-medium">{w.name} <Badge className="ml-2">{w.type}</Badge></p>
            {w.statement && <p className="text-muted-foreground line-clamp-2">{w.statement}</p>}
          </div>
        )) : <Empty message="No witnesses." />}
      </Section>
    </div>
  );
}

function HearingsTab({ caseId, hearings, editable }: { caseId: string; hearings: any[]; editable: boolean }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({ status: 'SCHEDULED' });

  const add = useMutation({
    mutationFn: async () => (await api.post(`/cases/${caseId}/hearings`, {
      hearingDate: form.hearingDate,
      status: form.status,
      proceedings: form.proceedings || undefined,
      judgeRemarks: form.judgeRemarks || undefined,
      advocateNotes: form.advocateNotes || undefined,
      nextHearingDate: form.nextHearingDate || undefined,
    })).data,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['case', caseId] }); setOpen(false); setForm({ status: 'SCHEDULED' }); },
  });

  return (
    <Section title="Hearing timeline" action={editable && <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Add hearing</Button>}>
      {hearings.length ? (
        <ol className="relative ml-3 border-l border-border">
          {hearings.map((h) => (
            <li key={h.id} className="mb-5 ml-5">
              <span className="absolute -left-[7px] mt-1.5 h-3 w-3 rounded-full bg-primary" />
              <div className="flex items-center gap-2">
                <p className="font-medium">{formatDate(h.hearingDate)}</p>
                <Badge>{h.status}</Badge>
              </div>
              {h.proceedings && <p className="mt-1 text-sm">{h.proceedings}</p>}
              {h.judgeRemarks && <p className="mt-1 text-sm text-muted-foreground">Judge: {h.judgeRemarks}</p>}
              {h.advocateNotes && <p className="mt-1 text-sm text-muted-foreground">Notes: {h.advocateNotes}</p>}
              {h.nextHearingDate && <p className="mt-1 text-xs text-muted-foreground">Next: {formatDate(h.nextHearingDate)}</p>}
            </li>
          ))}
        </ol>
      ) : <Empty message="No hearings recorded yet." />}

      <Modal open={open} onClose={() => setOpen(false)} title="Add hearing">
        <div className="space-y-3">
          <Field label="Hearing date *"><Input type="date" value={form.hearingDate ?? ''} onChange={(e) => setForm({ ...form, hearingDate: e.target.value })} /></Field>
          <Field label="Status">
            <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {['SCHEDULED', 'HELD', 'ADJOURNED', 'PART_HEARD', 'CANCELLED'].map((s) => <option key={s}>{s}</option>)}
            </Select>
          </Field>
          <Field label="Proceedings"><Textarea value={form.proceedings ?? ''} onChange={(e) => setForm({ ...form, proceedings: e.target.value })} /></Field>
          <Field label="Judge remarks"><Input value={form.judgeRemarks ?? ''} onChange={(e) => setForm({ ...form, judgeRemarks: e.target.value })} /></Field>
          <Field label="Advocate notes"><Input value={form.advocateNotes ?? ''} onChange={(e) => setForm({ ...form, advocateNotes: e.target.value })} /></Field>
          <Field label="Next hearing date"><Input type="date" value={form.nextHearingDate ?? ''} onChange={(e) => setForm({ ...form, nextHearingDate: e.target.value })} /></Field>
          <Button className="w-full" disabled={!form.hearingDate || add.isPending} onClick={() => add.mutate()}>
            {add.isPending ? 'Saving…' : 'Save hearing'}
          </Button>
        </div>
      </Modal>
    </Section>
  );
}

const DOC_CATEGORIES = ['FIR', 'INSURANCE', 'MEDICAL', 'COURT_ORDERS', 'PHOTOGRAPHS', 'VIDEOS', 'AADHAAR', 'RC', 'DRIVING_LICENCE', 'AWARD_COPY', 'POLICE_RECORD', 'OTHER'];

function DocumentsTab({ caseId, documents, editable }: { caseId: string; documents: any[]; editable: boolean }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [meta, setMeta] = useState<any>({ category: 'OTHER', title: '', tags: '' });
  const [filter, setFilter] = useState('');

  const upload = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      fd.append('file', file as File);
      fd.append('category', meta.category);
      if (meta.title) fd.append('title', meta.title);
      if (meta.tags) meta.tags.split(',').map((t: string) => t.trim()).filter(Boolean).forEach((t: string) => fd.append('tags[]', t));
      return (await api.post(`/cases/${caseId}/documents`, fd)).data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['case', caseId] }); setOpen(false); setFile(null); setMeta({ category: 'OTHER', title: '', tags: '' }); },
  });

  const del = useMutation({
    mutationFn: async (id: string) => (await api.delete(`/documents/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['case', caseId] }),
  });

  async function download(doc: any) {
    const res = await api.get(`/documents/${doc.id}/download`, { responseType: 'blob' });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement('a');
    a.href = url; a.download = doc.fileName; a.click();
    URL.revokeObjectURL(url);
  }

  const shown = documents.filter((d) =>
    !filter || d.title?.toLowerCase().includes(filter.toLowerCase()) ||
    d.fileName?.toLowerCase().includes(filter.toLowerCase()) ||
    d.category === filter.toUpperCase() ||
    (d.tags ?? []).some((t: string) => t.toLowerCase().includes(filter.toLowerCase())));

  return (
    <Section title="Documents" action={editable && <Button size="sm" onClick={() => setOpen(true)}><Upload className="h-4 w-4" /> Upload</Button>}>
      <Input placeholder="Search by title, file, tag or category…" value={filter} onChange={(e) => setFilter(e.target.value)} className="mb-3 max-w-sm" />
      {shown.length ? (
        <div className="divide-y divide-border">
          {shown.map((d) => (
            <div key={d.id} className="flex items-center justify-between py-2.5">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{d.title}</p>
                  <p className="text-xs text-muted-foreground">
                    <Badge className="mr-1">{d.category}</Badge>{d.fileName} · {(d.sizeBytes / 1024).toFixed(0)} KB
                    {d.tags?.length ? ` · ${d.tags.join(', ')}` : ''}
                  </p>
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => download(d)}><Download className="h-4 w-4" /></Button>
                {editable && <Button variant="ghost" size="sm" onClick={() => del.mutate(d.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
              </div>
            </div>
          ))}
        </div>
      ) : <Empty message="No documents." />}

      <Modal open={open} onClose={() => setOpen(false)} title="Upload document">
        <div className="space-y-3">
          <Field label="File *"><Input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></Field>
          <Field label="Title"><Input value={meta.title} onChange={(e) => setMeta({ ...meta, title: e.target.value })} placeholder="Defaults to file name" /></Field>
          <Field label="Folder / Category">
            <Select value={meta.category} onChange={(e) => setMeta({ ...meta, category: e.target.value })}>
              {DOC_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </Select>
          </Field>
          <Field label="Tags (comma-separated)"><Input value={meta.tags} onChange={(e) => setMeta({ ...meta, tags: e.target.value })} /></Field>
          {upload.isError && <p className="text-sm text-destructive">Upload failed — check file type/size (max 25MB).</p>}
          <Button className="w-full" disabled={!file || upload.isPending} onClick={() => upload.mutate()}>
            {upload.isPending ? 'Uploading…' : 'Upload'}
          </Button>
        </div>
      </Modal>
    </Section>
  );
}

function FeesTab({ caseId }: { caseId: string }) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [payOpen, setPayOpen] = useState(false);
  const [pay, setPay] = useState<any>({ paymentMode: 'CASH' });

  const { data: fee, isLoading } = useQuery({
    queryKey: ['fee', caseId],
    queryFn: async () => (await api.get(`/cases/${caseId}/fee`)).data,
  });

  const addPay = useMutation({
    mutationFn: async () => (await api.post(`/cases/${caseId}/fee/payments`, {
      amount: Number(pay.amount), paymentMode: pay.paymentMode,
      reference: pay.reference || undefined, notes: pay.notes || undefined,
    })).data,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['fee', caseId] }); setPayOpen(false); setPay({ paymentMode: 'CASH' }); },
  });

  async function receipt(id: string) {
    const r = (await api.get(`/fee/payments/${id}/receipt`)).data;
    const w = window.open('', '_blank');
    if (w) {
      w.document.write(`<pre style="font-family:monospace;padding:24px">
MACT CASE MANAGEMENT — FEE RECEIPT
====================================
Receipt No : ${r.receiptNumber}
Date       : ${new Date(r.date).toLocaleDateString('en-IN')}
Case       : ${r.mactCaseNumber ?? r.caseRef}
Claimant   : ${r.claimantName ?? '-'}
Amount     : Rs. ${r.amount}
Mode       : ${r.mode}
Reference  : ${r.reference ?? '-'}
Advocate   : ${r.advocate ?? '-'}
Received by: ${r.recordedBy ?? '-'}
====================================</pre><script>print()</script>`);
    }
  }

  if (isLoading) return <Spinner />;
  const canPay = can(user?.role, 'fees.receipt');

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="p-5 lg:col-span-1">
        <h3 className="mb-3 font-medium">Fee arrangement</h3>
        {fee?.feeType ? (
          <div className="space-y-2 text-sm">
            <Meta label="Type" value={fee.feeType} />
            {fee.fixedAmount && <Meta label="Fixed" value={formatINR(fee.fixedAmount)} />}
            {fee.percentage && <Meta label="Percentage" value={`${fee.percentage}%`} />}
            <Meta label="Agreed" value={formatINR(fee.agreedAmount)} />
            <div className="mt-3 rounded-md bg-secondary p-3">
              <Meta label="Received" value={formatINR(fee.totalReceived)} />
              <Meta label="Pending" value={formatINR(fee.pendingAmount)} />
            </div>
          </div>
        ) : <Empty message="No fee arrangement set." />}
        {canPay && <Button className="mt-4 w-full" size="sm" onClick={() => setPayOpen(true)}><Plus className="h-4 w-4" /> Record payment</Button>}
      </Card>

      <Card className="p-5 lg:col-span-2">
        <h3 className="mb-3 font-medium">Payments</h3>
        {fee?.payments?.length ? (
          <div className="divide-y divide-border">
            {fee.payments.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between py-2.5 text-sm">
                <div>
                  <p className="font-medium">{formatINR(p.amount)} <Badge className="ml-2">{p.paymentMode}</Badge></p>
                  <p className="text-xs text-muted-foreground">{p.receiptNumber} · {formatDate(p.paymentDate)}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => receipt(p.id)}><Receipt className="h-4 w-4" /> Receipt</Button>
              </div>
            ))}
          </div>
        ) : <Empty message="No payments recorded." />}
      </Card>

      <Modal open={payOpen} onClose={() => setPayOpen(false)} title="Record payment">
        <div className="space-y-3">
          <Field label="Amount (₹) *"><Input type="number" value={pay.amount ?? ''} onChange={(e) => setPay({ ...pay, amount: e.target.value })} /></Field>
          <Field label="Mode">
            <Select value={pay.paymentMode} onChange={(e) => setPay({ ...pay, paymentMode: e.target.value })}>
              {['CASH', 'CHEQUE', 'UPI', 'BANK_TRANSFER', 'CARD', 'DD', 'OTHER'].map((m) => <option key={m}>{m}</option>)}
            </Select>
          </Field>
          <Field label="Reference (cheque/UPI/txn)"><Input value={pay.reference ?? ''} onChange={(e) => setPay({ ...pay, reference: e.target.value })} /></Field>
          <Field label="Notes"><Input value={pay.notes ?? ''} onChange={(e) => setPay({ ...pay, notes: e.target.value })} /></Field>
          <Button className="w-full" disabled={!pay.amount || addPay.isPending} onClick={() => addPay.mutate()}>
            {addPay.isPending ? 'Saving…' : 'Save payment'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function CompensationTab({ caseId, estimates }: { caseId: string; estimates: any[] }) {
  return (
    <Section title="Saved compensation estimates" action={<Link href="/calculator"><Button size="sm"><Plus className="h-4 w-4" /> Open calculator</Button></Link>}>
      {estimates.length ? (
        <div className="space-y-2">
          {estimates.map((e: any) => (
            <div key={e.id} className="flex items-center justify-between rounded-md border border-border p-3 text-sm">
              <div>
                <p className="font-medium">{e.label ?? 'Estimate'}</p>
                <p className="text-xs text-muted-foreground">Multiplier {e.multiplier ?? '—'} · {formatDate(e.createdAt)}</p>
              </div>
              <p className="text-lg font-semibold text-primary">{formatINR(e.totalCompensation)}</p>
            </div>
          ))}
        </div>
      ) : <Empty message="No saved estimates. Use the calculator to model and save one." />}
    </Section>
  );
}
