export interface ForwardSample {
  id: string;
  label: string;
  tag: string;
  chainHint: string;
  text: string;
}

/**
 * Illustrative texts written for this demo. They mirror the wording of real
 * WhatsApp chain messages but are not copied from any specific person.
 */
export const forwardSamples: ForwardSample[] = [
  {
    id: "viral-hoax",
    label: "Viral health hoax",
    tag: "Misinformation",
    chainHint: "Share-before-deleted pressure",
    text: `*Forwarded many times*\n\nURGENT: Doctors in Delhi have confirmed that the new virus spreads through banana skins. Do not eat bananas for the next 3 weeks. Must share with all your family groups before it gets deleted. Forward this to 10 people so everyone stays safe. Source: WhatsApp forward.`,
  },
  {
    id: "chain-blessing",
    label: "Chain blessing",
    tag: "Chain letter",
    chainHint: "Break-the-chain threat",
    text: `Good morning 🙏 Bhagwan will bless you today, but only if you do not break the chain. Forward this message to 10 friends before 9 PM and your wish will come true. If you ignore it, something unhappy may happen. Jai Shri Ram.`,
  },
  {
    id: "fake-rbi",
    label: "Fake RBI notice",
    tag: "Banking forward",
    chainHint: "Fake official source + urgency",
    text: `Fwd as received: RBI has announced that all old ₹500 notes will stop working from Monday. Everyone must exchange them at any bank branch immediately and share the OTP with the bank officer to confirm. Forward this to every group before it is deleted. - Source: WhatsApp`,
  },
  {
    id: "missing-child",
    label: "Missing child chain",
    tag: "Emotional chain",
    chainHint: "Emotion + quantity request",
    text: `Please do not ignore. This child was found near Bengaluru bus stand and cannot speak. His parents are searching. Copy this and paste in 5 groups, at least 20 people. Someone may know him. Forward as received. 🙏`,
  },
  {
    id: "whatsapp-gold",
    label: "WhatsApp gold hoax",
    tag: "Old hoax",
    chainHint: "Reward for forwarding",
    text: `WhatsApp is giving a free gold coin to users who keep this message moving. Click the link, verify your number and forward this to 10 contacts to claim. Offer closes tonight. This has been confirmed by WhatsApp customer care. Don't ignore, share before midnight!`,
  },
  {
    id: "real-message",
    label: "Normal message",
    tag: "Control sample",
    chainHint: "No forward markers",
    text: `Hi, are we still meeting at 6 at the metro station? I've booked a table for four. Let me know if you need a lift from the office — otherwise I'll see you there.`,
  },
];
