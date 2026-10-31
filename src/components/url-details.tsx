import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  EyeOff,
  Info,
  Lock,
  ShieldAlert,
  ShieldCheck,
  Split,
  Unlock,
} from "lucide-react";
import type { AnalysisResult, DomainIntel } from "@/lib/analysis/types";
import { RISK_META, urlVerdict } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { ThreatIntelPanels } from "@/components/threat-intel-panels";
import { cn } from "@/lib/utils";

export function UrlDetailsPanel({ result }: { result: AnalysisResult }) {
  if (!result.url) return null;

  const verdict = urlVerdict(result.riskScore);
  const meta = RISK_META[result.riskLevel];
  const safeBrowsing = result.safeBrowsing;
  const domainIntel = result.domainIntel;
  const redirectTargets = result.url.redirectTargets ?? [];
  const VerdictIcon =
    result.riskScore >= 50 ? ShieldAlert : result.riskScore >= 25 ? AlertTriangle : ShieldCheck;

  const rows: { label: string; value: string; mono?: boolean }[] = [
    { label: "Normalised URL", value: result.url.normalized, mono: true },
    { label: "Protocol", value: result.url.protocol ?? "not specified" },
    { label: "Host", value: result.url.host, mono: true },
    { label: "Domain", value: result.url.registrableDomain, mono: true },
    { label: "Subdomain", value: result.url.subdomain || "—" },
    { label: "TLD", value: result.url.tld ? `.${result.url.tld}` : "—" },
    { label: "Path", value: result.url.path || "/", mono: true },
    { label: "Query", value: result.url.query ? `?${result.url.query}` : "—", mono: true },
    { label: "Length", value: `${result.url.length} characters` },
  ];

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "surface rounded-2xl border p-5 sm:p-6",
          meta.border,
          result.riskScore >= 50 ? "bg-red-500/[0.04]" : ""
        )}
      >
        <div className="flex items-start gap-3">
          <div className={cn("grid size-10 shrink-0 place-items-center rounded-xl", meta.bg)}>
            <VerdictIcon className={cn("size-5", meta.text)} />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">{verdict.title}</h2>
            <p className="mt-1 text-[13px] leading-6 text-muted-foreground">{verdict.detail}</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5">
          <Badge variant="neutral">
            {result.url.protocol === "https:" ? "HTTPS" : result.url.protocol === "http:" ? "HTTP" : "No scheme"}
          </Badge>
          {result.url.isIp ? <Badge variant="danger">IP address host</Badge> : null}
          {result.url.isPunycode ? <Badge variant="danger">Punycode</Badge> : null}
          {result.url.redirectParams.length > 0 ? (
            <Badge variant="warning">Redirect parameter</Badge>
          ) : null}
          <Badge variant="outline">{Math.round(result.confidence * 100)}% confidence</Badge>
        </div>
      </div>

      <div className="surface rounded-2xl p-5 sm:p-6">
        <h3 className="text-sm font-semibold text-foreground">Domain breakdown</h3>
        <dl className="mt-4 grid grid-cols-[112px_minmax(0,1fr)] gap-x-3 gap-y-2.5 text-[12px]">
          {rows.map((row) => (
            <div key={row.label} className="contents">
              <dt className="text-stone-500">{row.label}</dt>
              <dd
                className={cn(
                  "break-all text-stone-300",
                  row.mono ? "mono text-[11px] leading-5" : ""
                )}
              >
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 border-t border-border/60 pt-3 text-[10px] leading-5 text-stone-500">
          This is the URL as written. FakeShield parses it on the server and queries the public
          WHOIS/RDAP registry for the domain name only — it never contacts the host or loads its page.
        </p>
      </div>

      <DomainRegistryPanel intel={domainIntel} />

      <ThreatIntelPanels intel={result.threatIntel} />

      {redirectTargets.length > 0 ? (
        <div className="surface rounded-2xl p-5 sm:p-6">
          <div className="flex items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Split className="size-4 text-amber-300" />
              Declared redirect targets
            </h3>
            <Badge variant="warning">Not followed</Badge>
          </div>
          <p className="mt-1.5 text-[11px] leading-5 text-stone-500">
            These URLs are sitting inside the query string. FakeShield shows them as text and never
            requests them.
          </p>
          <ul className="mt-3 space-y-1.5">
            {redirectTargets.map((target) => (
              <li
                key={target}
                className="mono break-all rounded-lg border border-border bg-black/25 px-3 py-2 text-[11px] leading-5 text-amber-200/80"
              >
                {target}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <PreviewWithheldPanel protocol={result.url.protocol} host={result.url.host} />

      <div className="surface rounded-2xl p-5 sm:p-6">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-foreground">Threat feed</h3>
          <ThreatBadge status={safeBrowsing?.status} />
        </div>

        {safeBrowsing?.status === "matched" ? (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-500/25 bg-red-500/[0.07] px-3 py-2.5">
            <ShieldAlert className="mt-0.5 size-4 shrink-0 text-red-300" />
            <div className="text-[12px] leading-5 text-red-200">
              <p className="font-medium">Google Safe Browsing returned a match.</p>
              <p className="mt-0.5 text-red-200/80">
                Threat types: {safeBrowsing.threats.join(", ") || "unspecified"}.
              </p>
            </div>
          </div>
        ) : safeBrowsing?.status === "clean" ? (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.06] px-3 py-2.5">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-300" />
            <p className="text-[12px] leading-5 text-emerald-200/90">
              No match in Google Safe Browsing&apos;s lists. That feed does not cover every scam
              site.
            </p>
          </div>
        ) : safeBrowsing?.status === "error" ? (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/[0.06] px-3 py-2.5">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-300" />
            <p className="text-[12px] leading-5 text-amber-200/90">
              {safeBrowsing.detail ?? "The threat feed could not be reached."} The result below is
              heuristic only.
            </p>
          </div>
        ) : (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-border bg-white/[0.02] px-3 py-2.5">
            <Info className="mt-0.5 size-4 shrink-0 text-stone-400" />
            <p className="text-[12px] leading-5 text-stone-400">
              Heuristic analysis only. Set <span className="mono text-stone-300">GOOGLE_SAFE_BROWSING_API_KEY</span>{" "}
              to check submitted URLs against Google&apos;s threat lists.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function DomainRegistryPanel({ intel }: { intel?: DomainIntel }) {
  const age = intel?.ageDays;
  const young = typeof age === "number" && age < 90;
  const tone =
    intel?.status === "ok"
      ? young
        ? { border: "border-amber-500/25", bg: "bg-amber-500/[0.05]", text: "text-amber-300" }
        : { border: "border-emerald-500/20", bg: "bg-emerald-500/[0.04]", text: "text-emerald-300" }
      : { border: "border-border", bg: "bg-white/[0.02]", text: "text-stone-400" };

  return (
    <div className="surface rounded-2xl p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <CalendarClock className="size-4 text-orange-300" />
          WHOIS / domain registry
        </h3>
        <Badge variant="outline">RDAP · public registry</Badge>
      </div>

      {intel?.status === "ok" ? (
        <>
          <div className={cn("mt-3 flex items-start gap-3 rounded-xl border px-3.5 py-3", tone.border, tone.bg)}>
            <div>
              <p className={cn("text-[13px] font-semibold", tone.text)}>
                {typeof age === "number" ? `${formatAge(age)} old` : "Registration found"}
              </p>
              <p className="mt-0.5 text-[11px] leading-5 text-stone-400">
                {young
                  ? "Domains registered in the last 90 days are common in short-lived phishing campaigns."
                  : "An older registration is not proof of trust — scammers also compromise established sites."}
              </p>
            </div>
          </div>
          <dl className="mt-3 grid grid-cols-[96px_minmax(0,1fr)] gap-x-3 gap-y-2 text-[11.5px]">
            <dt className="text-stone-500">Registered</dt>
            <dd className="text-stone-300">{formatDate(intel.registeredAt)}</dd>
            <dt className="text-stone-500">Expires</dt>
            <dd className="text-stone-300">{formatDate(intel.expiresAt)}</dd>
            <dt className="text-stone-500">Registrar</dt>
            <dd className="break-words text-stone-300">{intel.registrar || "Not listed"}</dd>
            <dt className="text-stone-500">Updated</dt>
            <dd className="text-stone-300">{formatDate(intel.updatedAt)}</dd>
          </dl>
        </>
      ) : intel?.status === "not_found" ? (
        <p className="mt-3 rounded-lg border border-amber-500/20 bg-amber-500/[0.05] px-3 py-2 text-[11.5px] leading-5 text-amber-200/80">
          No public registration record was returned for this domain. That can happen with very new
          domains, some country-code registries, or non-registrable hosts.
        </p>
      ) : intel?.status === "unavailable" ? (
        <p className="mt-3 rounded-lg border border-border bg-white/[0.02] px-3 py-2 text-[11.5px] leading-5 text-stone-400">
          The public registry did not respond in time. Domain age is unknown for this check; the URL
          structure signals are unaffected.
        </p>
      ) : (
        <p className="mt-3 rounded-lg border border-border bg-white/[0.02] px-3 py-2 text-[11.5px] leading-5 text-stone-400">
          {intel?.status === "not_applicable"
            ? "Registry age checks apply to domain names, not raw IP addresses."
            : "No registry lookup was run for this URL."}
        </p>
      )}

      <p className="mt-3 flex items-start gap-1.5 border-t border-border/60 pt-3 text-[10px] leading-5 text-stone-500">
        <Info className="mt-0.5 size-3 shrink-0" />
        Queried the public RDAP registry (the modern WHOIS) for the domain name only. FakeShield
        never connects to
        <span className="mono mx-1 break-all text-stone-400">the submitted host</span>
        and does not validate its live certificate. Certificate dates, when present, come from
        public Certificate Transparency logs.
      </p>
    </div>
  );
}

function PreviewWithheldPanel({
  protocol,
  host,
}: {
  protocol: "http:" | "https:" | null;
  host: string;
}) {
  const https = protocol === "https:";
  return (
    <div className="surface rounded-2xl p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <EyeOff className="size-4 text-stone-400" />
          Page preview
        </h3>
        <Badge variant="outline">Withheld by design</Badge>
      </div>

      <div className="mt-3 rounded-xl border border-dashed border-border bg-black/20 px-4 py-6 text-center">
        <div className="mx-auto grid size-10 place-items-center rounded-full border border-border bg-white/[0.02]">
          <EyeOff className="size-4 text-stone-500" />
        </div>
        <p className="mt-2.5 text-[12px] font-medium text-stone-300">
          No screenshot, iframe or live page is loaded.
        </p>
        <p className="mx-auto mt-1 max-w-sm text-[10.5px] leading-5 text-stone-500">
          Rendering an unverified page is a security risk in itself — trackers, exploits and scam
          content would run in your browser. The URL is analysed as text instead.
        </p>
        <p className="mono mt-3 break-all text-[10px] text-stone-600">{host}</p>
      </div>

      <div className="mt-3 flex items-center gap-2.5 rounded-lg border border-border bg-white/[0.02] px-3 py-2.5">
        {https ? (
          <>
            <Lock className="size-3.5 shrink-0 text-emerald-300" />
            <p className="text-[11px] leading-5 text-stone-400">
              The URL <span className="text-stone-200">declares HTTPS</span>. The certificate is not
              verified here — HTTPS encrypts the connection, it does not make the site honest.
            </p>
          </>
        ) : (
          <>
            <Unlock className="size-3.5 shrink-0 text-amber-300" />
            <p className="text-[11px] leading-5 text-stone-400">
              The URL uses <span className="text-stone-200">plain HTTP or no scheme</span>. Anything
              typed on the page would travel unencrypted.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function formatAge(days: number): string {
  if (days < 1) return "Less than a day";
  if (days < 60) return `${Math.round(days)} day${Math.round(days) === 1 ? "" : "s"}`;
  if (days < 730) {
    const months = Math.round(days / 30);
    return `${months} month${months === 1 ? "" : "s"}`;
  }
  const years = Math.floor(days / 365);
  const months = Math.round((days % 365) / 30);
  return `${years} year${years === 1 ? "" : "s"}${months > 0 ? ` ${months} month${months === 1 ? "" : "s"}` : ""}`;
}

function formatDate(value?: string): string {
  if (!value) return "Not listed";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not listed";
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function ThreatBadge({ status }: { status?: string }) {
  if (status === "matched") {
    return (
      <Badge variant="danger">
        <ShieldAlert className="size-3" />
        Flagged
      </Badge>
    );
  }
  if (status === "clean") {
    return (
      <Badge variant="success">
        <ShieldCheck className="size-3" />
        Checked
      </Badge>
    );
  }
  if (status === "error") {
    return (
      <Badge variant="warning">
        <AlertTriangle className="size-3" />
        Unreachable
      </Badge>
    );
  }
  return <Badge variant="outline">Not configured</Badge>;
}
