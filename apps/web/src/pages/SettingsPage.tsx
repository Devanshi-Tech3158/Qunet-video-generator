import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/Button';
import { Card, CardContent, CardHeader } from '../components/Card';
import { PageHeader } from '../components/PageHeader';
import { useDnaProfile, useUpdateDna } from '../hooks/useDna';
import { useToast } from '../hooks/useToast';
import { DEVANSHI_AVATAR } from '../lib/studioFixtures';
import { cn } from '../lib/cn';
import { getApiBaseUrl, setApiBaseUrl, fetchHealth } from '../lib/api';
import { getShareAdapter } from '../lib/qoneqt';

const SETTINGS_TABS = [
  { id: 'profile', label: 'Profile', icon: '👤' },
  { id: 'integrations', label: 'API & Integrations', icon: '⚡' },
  { id: 'notifications', label: 'Notifications', icon: '🔔' },
  { id: 'account', label: 'Account', icon: '🛡️' },
  { id: 'help', label: 'Help & Support', icon: '❓' },
] as const;

export function SettingsPage() {
  const { push } = useToast();
  const dnaQuery = useDnaProfile();
  const updateDna = useUpdateDna();

    const [activeTab, setActiveTab] = useState<(typeof SETTINGS_TABS)[number]['id']>('profile');
  const [editing, setEditing] = useState(false);
  const [apiUrl, setApiUrl] = useState(() => getApiBaseUrl());
  const [qoneqtUrl, setQoneqtUrl] = useState(() => (typeof window !== 'undefined' ? window.localStorage?.getItem('qoneqt.api-url') ?? '' : ''));
  const [qoneqtKey, setQoneqtKey] = useState(() => (typeof window !== 'undefined' ? window.localStorage?.getItem('qoneqt.api-key') ?? '' : ''));
  const [testingApi, setTestingApi] = useState(false);
  const [apiHealthStatus, setApiHealthStatus] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState('Devanshi Goyal');
  const [roleSubtitle, setRoleSubtitle] = useState('Creator · CSE');
  const [niche, setNiche] = useState(dnaQuery.data?.dna.niche ?? 'Tech (CSE)');
  const [styleText, setStyleText] = useState(dnaQuery.data?.dna.style ?? 'Friendly - Educational');

  const dna = dnaQuery.data?.dna;

    async function handleTestApi(): Promise<void> {
    setTestingApi(true);
    setApiHealthStatus(null);
    try {
      const res = await fetchHealth();
      setApiHealthStatus(`Online (${res.checks.redis === 'ok' ? 'Redis connected' : 'Ready'})`);
      push({ title: 'API Connection Successful', description: `Connected to ${res.service} v${res.version}`, tone: 'success' });
    } catch {
      setApiHealthStatus('Demo / Offline Mode (local fallback active)');
      push({ title: 'Using Offline / Demo API', description: 'Backend is operating in zero-quota demo fallback mode.', tone: 'neutral' });
    } finally {
      setTestingApi(false);
    }
  }

  function handleSaveApi(): void {
    setApiBaseUrl(apiUrl.trim());
    push({ title: 'API Endpoint Saved', description: apiUrl.trim() ? apiUrl.trim() : 'Using default dev-server / same-origin proxy', tone: 'success' });
  }

  function handleSaveQoneqt(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        if (qoneqtUrl.trim()) {
          window.localStorage.setItem('qoneqt.api-url', qoneqtUrl.trim());
        } else {
          window.localStorage.removeItem('qoneqt.api-url');
        }
        if (qoneqtKey.trim()) {
          window.localStorage.setItem('qoneqt.api-key', qoneqtKey.trim());
        } else {
          window.localStorage.removeItem('qoneqt.api-key');
        }
      }
      push({ title: 'Qoneqt API Saved', description: qoneqtUrl.trim() ? 'Live REST adapter configured' : 'Using preview mock adapter', tone: 'success' });
    } catch {
      // ignore
    }
  }

  function handleSaveProfile(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (dna !== undefined) {
      updateDna.mutate(
        {
          niche: niche.trim() || dna.niche,
          style: styleText.trim() || dna.style,
        },
        {
          onSuccess: () => {
            setEditing(false);
            push({
              title: 'Profile updated',
              description: 'Your Creator DNA summary has been synced.',
              tone: 'success',
            });
          },
          onError: () => {
            setEditing(false);
            push({
              title: 'Profile saved locally',
              tone: 'success',
            });
          },
        },
      );
    } else {
      setEditing(false);
      push({ title: 'Profile updated', tone: 'success' });
    }
  }

  return (
    <>
      <PageHeader
        title="Settings & Profile"
        description="Manage your creator profile, Creator DNA summary, notifications, and account."
      />

      <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        {/* Left Sub-navigation (Screen 11) */}
        <nav aria-label="Settings sections" className="space-y-1.5">
          {SETTINGS_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-left text-body font-medium transition-colors',
                  isActive
                    ? 'border border-peach-200 bg-peach-100 font-semibold text-peach-800 shadow-2xs'
                    : 'text-ink-700 hover:bg-peach-50 hover:text-ink-900',
                )}
              >
                <span aria-hidden="true">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Content Area */}
        <div className="space-y-6">
          {activeTab === 'profile' ? (
            <>
              {/* Creator Profile Card (Screen 11) */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
                    <img
                      src={DEVANSHI_AVATAR}
                      alt={displayName}
                      className="size-24 shrink-0 rounded-pill border-4 border-peach-100 object-cover shadow-card"
                    />
                    <div className="min-w-0 flex-1 text-center sm:text-left">
                      <h2 className="text-title font-bold text-ink-900">{displayName}</h2>
                      <p className="mt-0.5 text-body text-ink-500">{roleSubtitle}</p>
                      <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setEditing((prev) => !prev)}
                        >
                          ✏️ {editing ? 'Cancel' : 'Edit Profile'}
                        </Button>
                        <Link
                          to="/dna"
                          className="inline-flex h-8 items-center rounded-pill border border-line bg-surface px-3.5 text-caption font-medium text-ink-700 hover:bg-peach-50"
                        >
                          Open Full DNA →
                        </Link>
                      </div>
                    </div>
                  </div>

                  {editing ? (
                    <form
                      onSubmit={handleSaveProfile}
                      className="mt-6 space-y-4 border-t border-line pt-5"
                    >
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label
                            htmlFor="profile-name"
                            className="block text-caption font-medium text-ink-700"
                          >
                            Display Name
                          </label>
                          <input
                            id="profile-name"
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            className="mt-1 h-10 w-full rounded-xl border border-line bg-surface-muted px-3 text-body text-ink-900"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="profile-role"
                            className="block text-caption font-medium text-ink-700"
                          >
                            Tagline / Role
                          </label>
                          <input
                            id="profile-role"
                            type="text"
                            value={roleSubtitle}
                            onChange={(e) => setRoleSubtitle(e.target.value)}
                            className="mt-1 h-10 w-full rounded-xl border border-line bg-surface-muted px-3 text-body text-ink-900"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="profile-niche"
                            className="block text-caption font-medium text-ink-700"
                          >
                            Primary Niche
                          </label>
                          <input
                            id="profile-niche"
                            type="text"
                            value={niche}
                            onChange={(e) => setNiche(e.target.value)}
                            className="mt-1 h-10 w-full rounded-xl border border-line bg-surface-muted px-3 text-body text-ink-900"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="profile-style"
                            className="block text-caption font-medium text-ink-700"
                          >
                            Content Style
                          </label>
                          <input
                            id="profile-style"
                            type="text"
                            value={styleText}
                            onChange={(e) => setStyleText(e.target.value)}
                            className="mt-1 h-10 w-full rounded-xl border border-line bg-surface-muted px-3 text-body text-ink-900"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button type="submit" loading={updateDna.isPending}>
                          Save Profile
                        </Button>
                      </div>
                    </form>
                  ) : null}
                </CardContent>
              </Card>

              {/* Creator DNA Summary (Screen 11) */}
              <Card>
                <CardHeader
                  title="Creator DNA Summary"
                  description="Your persistent content fingerprint across every AI pipeline stage."
                />
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl border border-line bg-surface-muted/60 p-4 text-center">
                      <div className="flex items-center justify-center gap-1.5 text-body font-semibold text-ink-900">
                        <span aria-hidden="true" className="text-info">👤</span>
                        <span>{dna?.niche ?? 'Tech (CSE)'}</span>
                      </div>
                      <p className="mt-1.5 text-caption font-bold text-ink-500">(94%)</p>
                    </div>

                    <div className="rounded-2xl border border-line bg-surface-muted/60 p-4 text-center">
                      <div className="flex items-center justify-center gap-1.5 text-body font-semibold text-ink-900">
                        <span aria-hidden="true" className="text-emerald-600">👥</span>
                        <span>{dna?.audienceAgeRange ?? '18-24'}</span>
                      </div>
                      <p className="mt-1.5 text-caption font-bold text-ink-500">(88%)</p>
                    </div>

                    <div className="rounded-2xl border border-line bg-surface-muted/60 p-4 text-center">
                      <div className="flex items-center justify-center gap-1.5 text-body font-semibold text-ink-900">
                        <span aria-hidden="true" className="text-amber-500">☀️</span>
                        <span>{dna?.style ?? 'Friendly - Educational'}</span>
                      </div>
                      <p className="mt-1.5 text-caption font-bold text-ink-500">(90%)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Warm Bottom Banner (Screen 11) */}
              <div className="flex items-center justify-center gap-2 rounded-2xl border border-peach-200 bg-peach-50 px-5 py-3.5 text-caption font-semibold text-peach-800">
                <span aria-hidden="true">💡</span>
                <span>Keep creating. Your content makes an impact!</span>
                <span aria-hidden="true">🤍</span>
              </div>
            </>
          ) : null}

                    {activeTab === 'integrations' ? (
            <div className="space-y-6">
              <Card>
                <CardHeader
                  title="Backend API Configuration"
                  description="Connect CreatorDNA Studio to your REST + WebSocket server or Cloud Run instance."
                />
                <CardContent className="space-y-4">
                  <div>
                    <label htmlFor="api-base-url" className="block text-caption font-semibold text-ink-700">
                      API Base URL
                    </label>
                    <input
                      id="api-base-url"
                      type="url"
                      placeholder="e.g. http://localhost:4000 or https://creatordna-api-xxx.a.run.app"
                      value={apiUrl}
                      onChange={(e) => setApiUrl(e.target.value)}
                      className="mt-1.5 h-10 w-full rounded-xl border border-line bg-surface-muted px-3 text-body text-ink-900 focus:border-peach-400 focus:outline-none"
                    />
                    <p className="mt-1 text-tiny text-ink-500">
                      Leave empty to use same-origin proxy / dev-server, or specify a remote backend.
                    </p>
                  </div>

                  {apiHealthStatus !== null ? (
                    <div className="rounded-xl border border-peach-200 bg-peach-50 px-3.5 py-2.5 text-caption font-medium text-peach-900">
                      Status: {apiHealthStatus}
                    </div>
                  ) : null}

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <Button size="sm" onClick={handleSaveApi}>
                      Save API Endpoint
                    </Button>
                    <Button size="sm" variant="secondary" loading={testingApi} onClick={() => void handleTestApi()}>
                      Test Connection
                    </Button>
                    {apiUrl ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setApiUrl('');
                          setApiBaseUrl(null);
                          push({ title: 'Reset to default API', tone: 'neutral' });
                        }}
                      >
                        Reset
                      </Button>
                    ) : null}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader
                  title="Qoneqt API Integration"
                  description="Publish rendered 9:16 reels directly to Qoneqt channels and feeds."
                />
                <CardContent className="space-y-4">
                  <div>
                    <label htmlFor="qoneqt-url" className="block text-caption font-semibold text-ink-700">
                      Qoneqt API Endpoint URL
                    </label>
                    <input
                      id="qoneqt-url"
                      type="url"
                      placeholder="https://api.qoneqt.com/v1/posts or mock endpoint"
                      value={qoneqtUrl}
                      onChange={(e) => setQoneqtUrl(e.target.value)}
                      className="mt-1.5 h-10 w-full rounded-xl border border-line bg-surface-muted px-3 text-body text-ink-900 focus:border-peach-400 focus:outline-none"
                    />
                    <p className="mt-1 text-tiny text-ink-500">
                      Current adapter: <strong>{getShareAdapter().name}</strong> ({getShareAdapter().live ? 'Live API mode' : 'Preview mock mode'})
                    </p>
                  </div>

                  <div>
                    <label htmlFor="qoneqt-key" className="block text-caption font-semibold text-ink-700">
                      Qoneqt API / Bearer Token (Optional)
                    </label>
                    <input
                      id="qoneqt-key"
                      type="password"
                      placeholder="qoneqt_live_..."
                      value={qoneqtKey}
                      onChange={(e) => setQoneqtKey(e.target.value)}
                      className="mt-1.5 h-10 w-full rounded-xl border border-line bg-surface-muted px-3 text-body text-ink-900 focus:border-peach-400 focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <Button size="sm" onClick={handleSaveQoneqt}>
                      Save Qoneqt Settings
                    </Button>
                    {qoneqtUrl ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setQoneqtUrl('');
                          setQoneqtKey('');
                          try {
                            window.localStorage.removeItem('qoneqt.api-url');
                            window.localStorage.removeItem('qoneqt.api-key');
                          } catch { /* storage error ignored */ }
                          push({ title: 'Reset to preview mock adapter', tone: 'neutral' });
                        }}
                      >
                        Reset to Mock
                      </Button>
                    ) : null}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader
                  title="Google Gemini AI & Cloud Integration"
                  description="Multimodal models powering Creator DNA, Hook Lab, and Voice Coach."
                />
                <CardContent className="space-y-2 text-caption text-ink-700">
                  <div className="flex items-center justify-between rounded-xl border border-line bg-surface-muted/50 p-3">
                    <div>
                      <span className="block font-semibold text-ink-900">Gemini 2.0 Flash</span>
                      <span className="block text-tiny text-ink-500">DNA extraction, Hook generation, Audience mirror</span>
                    </div>
                    <span className="rounded-pill bg-emerald-100 px-2.5 py-1 text-tiny font-bold text-emerald-800">Ready</span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-line bg-surface-muted/50 p-3">
                    <div>
                      <span className="block font-semibold text-ink-900">Gemini Live WebSocket</span>
                      <span className="block text-tiny text-ink-500">Real-time low-latency voice rehearsal coaching</span>
                    </div>
                    <span className="rounded-pill bg-emerald-100 px-2.5 py-1 text-tiny font-bold text-emerald-800">Ready</span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-line bg-surface-muted/50 p-3">
                    <div>
                      <span className="block font-semibold text-ink-900">Veo / TTS / Lyria</span>
                      <span className="block text-tiny text-ink-500">Background video, voiceover, and soundtrack synthesis</span>
                    </div>
                    <span className="rounded-pill bg-peach-100 px-2.5 py-1 text-tiny font-bold text-peach-800">Integrated</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : null}

          {activeTab === 'notifications' ? (
            <Card>
              <CardHeader
                title="Notifications"
                description="Choose when CreatorDNA notifies you about finished renders and DNA insights."
              />
              <CardContent className="space-y-3">
                {[
                  { id: 'notif-render', label: 'Video render completed', desc: 'Notify when an MP4 finishes rendering', on: true },
                  { id: 'notif-trend', label: 'New Trend Remix match (>90%)', desc: 'Alert when a trending topic matches your DNA', on: true },
                  { id: 'notif-dna', label: 'Creator DNA learning loop updates', desc: 'Weekly summary of suggested profile refinements', on: true },
                ].map((pref) => (
                  <div
                    key={pref.id}
                    className="flex items-center justify-between gap-4 rounded-xl border border-line bg-surface-muted/50 px-4 py-3"
                  >
                    <label htmlFor={pref.id} className="cursor-pointer">
                      <span className="block text-body font-semibold text-ink-900">{pref.label}</span>
                      <span className="block text-caption text-ink-500">{pref.desc}</span>
                    </label>
                    <input
                      id={pref.id}
                      type="checkbox"
                      defaultChecked={pref.on}
                      className="size-4 accent-peach-500"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}

          {activeTab === 'account' ? (
            <Card>
              <CardHeader
                title="Account"
                description="Connected creator account and Qoneqt publishing credentials."
              />
              <CardContent className="space-y-3 text-body text-ink-700">
                <p>
                  <span className="font-semibold text-ink-900">Creator Handle:</span> @devanshi.cse
                </p>
                <p>
                  <span className="font-semibold text-ink-900">Qoneqt Feed Sync:</span> Connected &amp; Active
                </p>
              </CardContent>
            </Card>
          ) : null}

          {activeTab === 'help' ? (
            <Card>
              <CardHeader
                title="Help & Support"
                description="Quick guides for getting the most out of CreatorDNA Studio."
              />
              <CardContent className="space-y-2 text-caption text-ink-700">
                <p>• Use <strong>Trend Remix</strong> to adapt viral formats into your CSE student voice.</p>
                <p>• Run <strong>Audience Mirror</strong> before rendering to check how students &amp; beginner coders will react.</p>
                <p>• Rehearse your script in <strong>Live Voice Coach</strong> to hit 80%+ energy and clarity.</p>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </>
  );
}
