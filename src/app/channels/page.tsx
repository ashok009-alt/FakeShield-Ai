import type { Metadata } from "next";
import {
  FlaskConical,
  LockKeyhole,
  MessageCircle,
  MessageSquare,
  Phone,
  Send,
  ShieldCheck,
} from "lucide-react";
import { analyzeMessage } from "@/lib/analysis/messageAnalyzer";
import { channelConfig, formatChannelReply } from "@/lib/channels/core";
import { ToolPageHeader } from "@/components/tool-page-header";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "SMS, Telegram and WhatsApp scam checks",
  description:
    "Run FakeShield AI where scams actually arrive: forward a suspicious message to a phone number, a Telegram bot or a WhatsApp number.",
};

const SAMPLE = [
  "Dear customer, your SBI account will be blocked today because KYC is pending.",
  "Update now at http://sbi-kyc-verify.in and share the OTP sent to your mobile.",
  "Account will be frozen in 24 hours. - SBI",
].join(" ");

const CHANNELS = [
  {
    key: "sms" as const,
    name: "SMS",
    icon: Phone,
    endpoint: "/api/channels/twilio",
    env: ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_FROM_NUMBER", "TWILIO_WEBHOOK_URL"],
    detail:
      "A Twilio number receives the text, verifies the request signature, runs the analysis and replies as a normal SMS.",
    audience: "Works on any phone, including a grandparent's keypad handset.",
  },
  {
    key: "telegram" as const,
    name: "Telegram",
    icon: Send,
    endpoint: "/api/channels/telegram",
    env: ["TELEGRAM_BOT_TOKEN", "TELEGRAM_WEBHOOK_SECRET"],
    detail:
      "A Telegram bot accepts forwarded messages and replies in the same chat. Webhook updates are checked against a secret header.",
    audience: "Zero friction: forward a message, get a score and a reason.",
  },
  {
    key: "whatsapp" as const,
    name: "WhatsApp",
    icon: MessageCircle,
    endpoint: "/api/channels/whatsapp",
    env: [
      "WHATSAPP_TOKEN",
      "WHATSAPP_PHONE_NUMBER_ID",
      "WHATSAPP_VERIFY_TOKEN",
      "WHATSAPP_APP_SECRET",
    ],
    detail:
      "The WhatsApp Business Cloud API webhook verifies Meta's SHA-256 signature, analyses text and replies through the Graph API.",
    audience: "Where most forwarded Indian scams actually start.",
  },
];

export default function ChannelsPage() {
  const config = channelConfig();
  const sampleReply = formatChannelReply(analyzeMessage(SAMPLE), "telegram");

  return (
    <div className="page-shell py-10 sm:py-14">
      <ToolPageHeader
        eyebrow="Real-world channels"
        title="Check a scam where it arrives."
        description="Most people will not open a website to paste a message. These webhook integrations let someone forward the text to a phone number or a bot and get the same rule-engine verdict, warning signs and next steps back in the chat."
        icon={MessageSquare}
        badge={
          <Badge variant={Object.values(config).some(Boolean) ? "success" : "warning"}>
            {Object.values(config).some(Boolean) ? "Partly configured" : "Setup required"}
          </Badge>
        }
      >
        <p className="text-[11.5px] leading-5 text-stone-500">
          “Credentials set” below is a local environment check only. This page never contacts Twilio,
          Telegram or Meta, and an untested webhook is not reported as live.
        </p>
      </ToolPageHeader>

      <div className="mt-8 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-4">
          {CHANNELS.map((channel) => {
            const ready = config[channel.key];
            const Icon = channel.icon;
            return (
              <article key={channel.key} className="surface rounded-2xl p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-orange-500/20 bg-orange-500/[0.07]">
                      <Icon className="size-4 text-orange-300" />
                    </span>
                    <div>
                      <h2 className="text-sm font-semibold text-foreground">{channel.name}</h2>
                      <p className="mt-0.5 text-[11px] text-stone-500">{channel.audience}</p>
                    </div>
                  </div>
                  <Badge variant={ready ? "success" : "outline"}>
                    {ready ? "Credentials set" : "Not configured"}
                  </Badge>
                </div>

                <p className="mt-3 text-[12px] leading-6 text-stone-400">{channel.detail}</p>

                <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px]">
                  <span className="rounded-md border border-white/[0.08] bg-black/25 px-2 py-1 font-mono text-stone-400">
                    POST {channel.endpoint}
                  </span>
                  <span className="text-stone-600">signature verified before analysis</span>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {channel.env.map((name) => (
                    <code
                      key={name}
                      className={cn(
                        "rounded border px-1.5 py-0.5 text-[9.5px]",
                        process.env[name]
                          ? "border-emerald-500/20 bg-emerald-500/[0.06] text-emerald-300/90"
                          : "border-white/[0.07] bg-white/[0.02] text-stone-500"
                      )}
                    >
                      {name}
                    </code>
                  ))}
                </div>
              </article>
            );
          })}
        </div>

        <div className="space-y-4">
          <div className="surface rounded-2xl p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">What the bot replies</h2>
              <Badge variant="neutral">Live rule-engine output</Badge>
            </div>
            <p className="mt-1 text-[10.5px] text-stone-500">
              Rendered from this sample with no API keys and no network calls:
            </p>

            <div className="mt-3 rounded-xl border border-white/[0.06] bg-[#0b0805] p-3">
              <p className="rounded-lg rounded-br-sm bg-[#221a13] px-3 py-2 text-[11px] leading-5 text-stone-300">
                {SAMPLE}
              </p>
              <pre className="mt-2 whitespace-pre-wrap rounded-lg rounded-bl-sm bg-orange-500/[0.08] px-3 py-2.5 font-sans text-[10.5px] leading-[1.55] text-stone-200">
                {sampleReply}
              </pre>
            </div>

            <p className="mt-3 text-[10px] leading-4 text-stone-600">
              Replies are plain text: no links, markdown or attachments. A submitted URL is analysed
              as text and never opened or rendered.
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-emerald-200">
              <LockKeyhole className="size-4" /> Privacy by default
            </h2>
            <ul className="mt-2 space-y-2 text-[11px] leading-5 text-emerald-100/70">
              <li>Channel messages are analysed in memory and are not saved to the analysis history.</li>
              <li>Only the reply is sent back; the sender number or chat ID is kept in a 60-second rate-limit key.</li>
              <li>
                When a Gemini key is configured, the message text is sent to Google for the optional
                reasoning pass. Without a key it never leaves this server.
              </li>
              <li>Provider credentials stay in server environment variables and are never sent to the browser.</li>
            </ul>
          </div>
        </div>
      </div>

      <section className="surface mt-5 rounded-2xl p-5 sm:p-6">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <FlaskConical className="size-4 text-orange-300" /> Wiring it up
        </h2>
        <div className="mt-3 grid gap-4 text-[11px] leading-5 text-stone-400 sm:grid-cols-3">
          <div>
            <p className="font-semibold text-stone-200">1. Set the secrets</p>
            <p className="mt-1">
              Copy the variable names above into <code className="text-orange-200">.env</code>. Keep
              them server-side; nothing is exposed through <code>NEXT_PUBLIC_</code>.
            </p>
          </div>
          <div>
            <p className="font-semibold text-stone-200">2. Point the provider at the webhook</p>
            <p className="mt-1">
              Use a public HTTPS URL ending in the endpoint shown. Twilio must sign the exact public
              URL, so set <code className="text-orange-200">TWILIO_WEBHOOK_URL</code> when behind a
              proxy.
            </p>
          </div>
          <div>
            <p className="font-semibold text-stone-200">3. Send a test message</p>
            <p className="mt-1">
              Forward the sample above. The reply should start with a risk level and score, followed
              by the warning signs and the disclaimer.
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-amber-500/15 bg-amber-500/[0.04] px-3 py-2.5 text-[10.5px] leading-5 text-amber-200/80">
          <ShieldCheck className="size-3.5 shrink-0" />
          <span>
            Unconfigured endpoints deliberately return <code>503</code> with{" "}
            <code>{`{ "configured": false }`}</code>. Invalid signatures return <code>403</code> (Twilio)
            or <code>401</code> (Telegram, WhatsApp) before any analysis runs.
          </span>
        </div>
      </section>
    </div>
  );
}
