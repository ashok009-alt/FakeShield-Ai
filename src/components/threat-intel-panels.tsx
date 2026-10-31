"use client";

import {
  AlertTriangle,
  Clock3,
  ExternalLink,
  Globe2,
  Info,
  Radar,
  ServerCog,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
} from "lucide-react";
import type { UrlThreatIntel } from "@/lib/analysis/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function ageLabel(days?: number): string {
  if (typeof days !== "number") return "date unknown";
  if (days < 1) return "less than a day";
  if (days < 60) return `${Math.round(days)} day${Math.round(days) === 1 ? "" : "s"}`;
  if (days < 730) {
    const months = Math.round(days / 30);
    return `${months} month${months === 1 ? "" : "s"}`;
  }
  const years = Math.floor(days / 365);
  return `${years} year${years === 1 ? "" : "s"}`;
}

/**
 * Optional provider panels for URL scans. Every panel states its own status,
 * so an unconfigured integration reads as "off", never as a clean result.
 */
export function ThreatIntelPanels({ intel }: { intel?: UrlThreatIntel }) {
  if (!intel) return null;
  const { virusTotal, ipGeo, ctLogs, shodan, whois } = intel;
  const youngDomain = typeof whois?.createdDays === "number" && whois.createdDays < 90;
  const youngCert = typeof ctLogs?.firstSeenDays === "number" && ctLogs.firstSeenDays < 30;

  return (
    <div className="space-y-4">
      {youngDomain && youngCert ? (
        <div className="flex items-start gap-3 rounded-2xl border border-red-500/25 bg-red-500/[0.06] px-4 py-3">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-red-300" />
          <p className="text-[12px] leading-5 text-red-200/90">
            New domain and new certificate: the domain was created {ageLabel(whois?.createdDays)} ago
            and its first public certificate appeared {ageLabel(ctLogs?.firstSeenDays)} ago. That
            combination is common in short-lived phishing campaigns.
          </p>
        </div>
      ) : null}

      {virusTotal ? <VirusTotalPanel result={virusTotal} /> : null}
      {ipGeo ? <IpGeoPanel result={ipGeo} /> : null}
      {ctLogs ? <CtPanel result={ctLogs} /> : null}
      {shodan ? <ShodanPanel result={shodan} /> : null}
    </div>
  );
}

function PanelShell({
  title,
  icon,
  provider,
  badge,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  provider: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="surface rounded-2xl p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          {icon}
          {title}
        </h3>
        <div className="flex items-center gap-1.5">
          <Badge variant="outline">{provider}</Badge>
          {badge}
        </div>
      </div>
      {children}
    </section>
  );
}

function VirusTotalPanel({ result }: { result: NonNullable<UrlThreatIntel["virusTotal"]> }) {
  const flagged = (result.malicious ?? 0) + (result.suspicious ?? 0);
  if (result.status === "ok") {
    const total = Math.max(1, result.totalEngines ?? 1);
    const parts = [
      { count: result.malicious ?? 0, className: "bg-red-400" },
      { count: result.suspicious ?? 0, className: "bg-amber-400" },
      { count: result.harmless ?? 0, className: "bg-emerald-400" },
      { count: result.undetected ?? 0, className: "bg-stone-600" },
    ];
    return (
      <PanelShell
        title="Antivirus engines"
        icon={<ShieldAlert className="size-4 text-orange-300" />}
        provider="VirusTotal"
        badge={
          flagged > 0 ? (
            <Badge variant="danger">{flagged} flagged</Badge>
          ) : (
            <Badge variant="success">
              <ShieldCheck className="size-3" />
              No flags
            </Badge>
          )
        }
      >
        <p
          className={cn(
            "mt-3 text-[12px] leading-5",
            flagged > 0 ? "text-red-200/90" : "text-stone-400"
          )}
        >
          {result.detail}
        </p>
        <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-white/[0.06]">
          {parts.map((part, index) => (
            <span
              key={index}
              className={part.className}
              style={{ width: `${(part.count / total) * 100}%` }}
            />
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-stone-500">
          <span>
            <span className="mr-1 inline-block size-1.5 rounded-full bg-red-400" />
            {result.malicious ?? 0} malicious
          </span>
          <span>
            <span className="mr-1 inline-block size-1.5 rounded-full bg-amber-400" />
            {result.suspicious ?? 0} suspicious
          </span>
          <span>
            <span className="mr-1 inline-block size-1.5 rounded-full bg-emerald-400" />
            {result.harmless ?? 0} harmless
          </span>
          <span>
            <span className="mr-1 inline-block size-1.5 rounded-full bg-stone-600" />
            {result.undetected ?? 0} no verdict
          </span>
        </div>
        {result.permalink ? (
          <a
            href={result.permalink}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="mt-3 inline-flex items-center gap-1 text-[10.5px] text-orange-300 underline-offset-2 hover:underline"
          >
            Open the public VirusTotal report
            <ExternalLink className="size-3" />
          </a>
        ) : null}
        <p className="mt-2 text-[10px] leading-5 text-stone-600">
          The report opens on virustotal.com in a new tab. FakeShield itself never loads the
          submitted URL.
        </p>
      </PanelShell>
    );
  }

  return (
    <PanelShell
      title="Antivirus engines"
      icon={<ShieldQuestion className="size-4 text-stone-400" />}
      provider="VirusTotal"
      badge={<Badge variant={result.status === "error" ? "warning" : "outline"}>{result.status.replace("_", " ")}</Badge>}
    >
      <p className="mt-3 text-[11.5px] leading-5 text-stone-400">{result.detail}</p>
      {result.status === "not_configured" ? (
        <p className="mt-2 text-[10px] leading-5 text-stone-600">
          Free tier: 4 lookups per minute. Only the URL string is sent to the VirusTotal API.
        </p>
      ) : null}
    </PanelShell>
  );
}

function IpGeoPanel({ result }: { result: NonNullable<UrlThreatIntel["ipGeo"]> }) {
  return (
    <PanelShell
      title="Hosting location"
      icon={<Globe2 className="size-4 text-sky-300" />}
      provider="ipinfo.io"
      badge={
        result.status === "ok" ? (
          <Badge variant="neutral">{result.countryCode ?? "located"}</Badge>
        ) : (
          <Badge variant="outline">{result.status.replace("_", " ")}</Badge>
        )
      }
    >
      {result.status === "ok" ? (
        <>
          <p className="mt-3 text-[13px] font-semibold text-stone-200">
            {[result.city, result.region, result.country].filter(Boolean).join(", ") || "Unknown location"}
          </p>
          <p className="mt-1 text-[11.5px] leading-5 text-stone-400">{result.detail}</p>
          <dl className="mt-3 grid grid-cols-[72px_minmax(0,1fr)] gap-x-3 gap-y-1.5 text-[11px]">
            <dt className="text-stone-500">IP</dt>
            <dd className="mono break-all text-stone-300">{result.ip ?? "—"}</dd>
            <dt className="text-stone-500">Network</dt>
            <dd className="break-all text-stone-300">{result.org ?? "Not listed"}</dd>
            <dt className="text-stone-500">Timezone</dt>
            <dd className="text-stone-300">{result.timezone ?? "—"}</dd>
          </dl>
          <p className="mt-3 flex items-start gap-1.5 text-[10px] leading-5 text-stone-500">
            <Info className="mt-0.5 size-3 shrink-0" />
            ipinfo resolved the hostname. Hosting location is not the same as the scammer&apos;s
            location — most scam sites sit on rented infrastructure or CDNs.
          </p>
        </>
      ) : (
        <p className="mt-3 text-[11.5px] leading-5 text-stone-400">{result.detail}</p>
      )}
    </PanelShell>
  );
}

function CtPanel({ result }: { result: NonNullable<UrlThreatIntel["ctLogs"]> }) {
  const young = typeof result.firstSeenDays === "number" && result.firstSeenDays < 30;
  return (
    <PanelShell
      title="Certificate history"
      icon={<Clock3 className="size-4 text-violet-300" />}
      provider="crt.sh · CT logs"
      badge={
        result.status === "ok" ? (
          <Badge variant={young ? "warning" : "outline"}>
            first seen {ageLabel(result.firstSeenDays)} ago
          </Badge>
        ) : (
          <Badge variant="outline">{result.status}</Badge>
        )
      }
    >
      <p className="mt-3 text-[11.5px] leading-5 text-stone-400">{result.detail}</p>
      {result.status === "ok" && result.firstSeen ? (
        <p className="mono mt-2 text-[10px] text-stone-500">
          {result.firstSeen.slice(0, 10)} · {result.certificateCount?.toLocaleString("en-IN")}{" "}
          active certificate record{result.certificateCount === 1 ? "" : "s"}
        </p>
      ) : null}
      {young ? (
        <p className="mt-2 rounded-lg border border-amber-500/20 bg-amber-500/[0.05] px-3 py-2 text-[10.5px] leading-5 text-amber-200/80">
          Certificates are free and issued in minutes. A very new certificate on a domain you have
          never heard of deserves extra caution.
        </p>
      ) : null}
      <p className="mt-3 flex items-start gap-1.5 text-[10px] leading-5 text-stone-600">
        <Info className="mt-0.5 size-3 shrink-0" />
        Dates come from public Certificate Transparency logs. FakeShield does not connect to the
        site or validate its live certificate.
      </p>
    </PanelShell>
  );
}

function ShodanPanel({ result }: { result: NonNullable<UrlThreatIntel["shodan"]> }) {
  return (
    <PanelShell
      title="Exposed services"
      icon={<ServerCog className="size-4 text-rose-300" />}
      provider="Shodan"
      badge={
        result.status === "ok" ? (
          <Badge variant={result.vulns && result.vulns.length > 0 ? "danger" : "outline"}>
            {(result.ports?.length ?? 0)} ports · {(result.vulns?.length ?? 0)} CVEs
          </Badge>
        ) : (
          <Badge variant="outline">{result.status.replace("_", " ")}</Badge>
        )
      }
    >
      <p className="mt-3 text-[11.5px] leading-5 text-stone-400">{result.detail}</p>
      {result.status === "ok" ? (
        <>
          {result.ports && result.ports.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {result.ports.map((port) => (
                <span
                  key={port}
                  className="mono rounded border border-white/10 bg-black/25 px-2 py-0.5 text-[10px] text-stone-300"
                >
                  :{port}
                </span>
              ))}
            </div>
          ) : null}
          {result.vulns && result.vulns.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {result.vulns.map((vuln) => (
                <span
                  key={vuln}
                  className="mono rounded border border-red-500/20 bg-red-500/[0.06] px-2 py-0.5 text-[10px] text-red-200/80"
                >
                  {vuln}
                </span>
              ))}
            </div>
          ) : null}
        </>
      ) : null}
      <p className="mt-3 flex items-start gap-1.5 text-[10px] leading-5 text-stone-600">
        <Radar className="mt-0.5 size-3 shrink-0" />
        Shodan data describes the hosting IP, not the page. Open ports or CVEs on shared hosting do
        not by themselves make this link a scam.
      </p>
    </PanelShell>
  );
}
